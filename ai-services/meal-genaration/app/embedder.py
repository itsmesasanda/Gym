"""
embedder.py
───────────
Generates text embeddings via Ollama's /api/embeddings endpoint
using nomic-embed-text (fastembed backend, 768-dim vectors).
"""

import asyncio
import logging
import os
from typing import Optional

import httpx

logger = logging.getLogger(__name__)

OLLAMA_BASE_URL  = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
EMBED_MODEL      = os.getenv("OLLAMA_EMBED_MODEL", "nomic-embed-text")
EMBED_TIMEOUT    = 30
EMBED_RETRIES    = 3


async def generate_embedding(text: str, retries: int = EMBED_RETRIES) -> list[float]:
    """
    Generate a 768-dim embedding vector for the given text.

    Args:
        text:    Input string to embed.
        retries: Number of retry attempts on failure.

    Returns:
        List of 768 floats.

    Raises:
        RuntimeError: If embedding fails after all retries.
    """
    for attempt in range(1, retries + 1):
        try:
            async with httpx.AsyncClient(timeout=EMBED_TIMEOUT) as client:
                response = await client.post(
                    f"{OLLAMA_BASE_URL}/api/embeddings",
                    json={"model": EMBED_MODEL, "prompt": text},
                )
                response.raise_for_status()
                data = response.json()

            embedding = data.get("embedding")
            if not embedding:
                raise ValueError("Ollama returned empty embedding.")

            logger.debug(f"Embedding generated (dim={len(embedding)})")
            return embedding

        except Exception as exc:
            logger.warning(f"Embedding attempt {attempt}/{retries} failed: {exc}")
            if attempt < retries:
                await asyncio.sleep(attempt)  # back-off: 1s, 2s
            else:
                raise RuntimeError(
                    f"Failed to generate embedding after {retries} attempts: {exc}"
                ) from exc


def build_query_text(
    calories: float,
    protein: Optional[float],
    fat: Optional[float],
    context: Optional[str],
    goal: Optional[str],
) -> str:
    """
    Build a structured query string from user inputs.
    The string is embedded and used for ANN search in Pinecone.
    Structured phrasing aligns with how recipe text_chunks are written.

    Example output:
        "Meal recommendation for 500 calories with 35g protein and 15g fat.
         Goal: muscle_gain. Context: post-workout, no dairy"
    """
    parts = [f"Meal recommendation for {calories} calories"]

    if protein:
        parts.append(f"with {protein}g protein")
    if fat:
        parts.append(f"and {fat}g fat")

    query = " ".join(parts) + "."

    if goal:
        query += f" Goal: {goal}."
    if context:
        query += f" Context: {context}"

    return query.strip()


async def check_ollama_health() -> bool:
    """
    Verify Ollama is reachable and nomic-embed-text is pulled.
    Called on app startup; logs warnings but does not crash the server.
    """
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            response = await client.get(f"{OLLAMA_BASE_URL}/api/tags")
            response.raise_for_status()
            models = [m["name"] for m in response.json().get("models", [])]

        has_embed = any("nomic-embed-text" in m for m in models)
        has_llm   = any("llama3.1" in m for m in models)

        if not has_embed:
            logger.warning("nomic-embed-text not found. Run: ollama pull nomic-embed-text")
        else:
            logger.info("✓ Ollama embed model (nomic-embed-text) ready.")

        if not has_llm:
            logger.warning("llama3.1:8b not found. Run: ollama pull llama3.1:8b")
        else:
            logger.info("✓ Ollama generation model (llama3.1:8b) ready.")

        return has_embed and has_llm

    except Exception as exc:
        logger.error(f"Ollama not reachable at {OLLAMA_BASE_URL}: {exc}")
        logger.error("Start Ollama with: ollama serve")
        return False
