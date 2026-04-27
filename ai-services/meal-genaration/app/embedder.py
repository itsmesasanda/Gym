"""
embedder.py
───────────
Generates text embeddings via fastembed (BAAI/bge-small-en-v1.5).
384-dim vectors, runs locally — no external service needed.
"""

import logging
from typing import Optional

logger = logging.getLogger(__name__)

# ── Lazy-loaded model ────────────────────────────────────────────────────────

_model = None

def _get_model():
    global _model
    if _model is None:
        logger.info("[embedder] Loading fastembed model...")
        from fastembed import TextEmbedding
        _model = TextEmbedding(model_name="BAAI/bge-small-en-v1.5")
        logger.info("[embedder] Model loaded (384-dim)")
    return _model


async def generate_embedding(text: str, **_kwargs) -> list[float]:
    """
    Generate a 384-dim embedding vector for the given text.

    Args:
        text: Input string to embed.

    Returns:
        List of 384 floats.
    """
    model = _get_model()
    embeddings = list(model.embed([text]))
    vector = embeddings[0].tolist()
    logger.debug(f"Embedding generated (dim={len(vector)})")
    return vector


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


async def check_embed_health() -> bool:
    """
    Verify fastembed model can be loaded.
    Called on app startup; logs warnings but does not crash the server.
    """
    try:
        _get_model()
        logger.info("✓ fastembed model (BAAI/bge-small-en-v1.5) ready.")
        return True
    except Exception as exc:
        logger.error(f"fastembed model failed to load: {exc}")
        return False
