"""
retriever.py
────────────
Handles all Pinecone operations:
  - Upsert vectors (used by ingest script)
  - Query with optional nutritional metadata pre-filter
  - Health check on startup
"""

import logging
import os
from typing import Optional

from pinecone import Pinecone, ServerlessSpec

logger = logging.getLogger(__name__)

PINECONE_API_KEY   = os.getenv("PINECONE_API_KEY", "")
PINECONE_INDEX     = os.getenv("PINECONE_INDEX_NAME", "food-rag-index")
PINECONE_REGION    = os.getenv("PINECONE_ENVIRONMENT", "us-east-1")
TOP_K              = int(os.getenv("TOP_K_RESULTS", "15"))
CALORIE_TOLERANCE  = float(os.getenv("CALORIE_TOLERANCE", "0.20"))

# Lazy singleton
_pc: Optional[Pinecone] = None
_index = None


def _get_index():
    global _pc, _index
    if _index is None:
        _pc    = Pinecone(api_key=PINECONE_API_KEY)
        _index = _pc.Index(PINECONE_INDEX)
        logger.info(f"Pinecone index '{PINECONE_INDEX}' connected.")
    return _index


# ── Upsert ─────────────────────────────────────────────────────────────────────

def upsert_vectors(vectors: list[dict], batch_size: int = 100) -> int:
    """
    Upsert a list of { id, values, metadata } dicts into Pinecone.

    Args:
        vectors:    List of vector dicts.
        batch_size: Vectors per upsert call (Pinecone recommends ≤100).

    Returns:
        Total number of vectors upserted.
    """
    index = _get_index()
    total = 0

    for i in range(0, len(vectors), batch_size):
        batch = vectors[i : i + batch_size]
        index.upsert(vectors=batch)
        total += len(batch)
        logger.info(f"Upserted {total}/{len(vectors)} vectors")

    return total


# ── Query ──────────────────────────────────────────────────────────────────────

def query_similar(
    vector: list[float],
    top_k: int = TOP_K,
    filter_dict: Optional[dict] = None,
) -> list[dict]:
    """
    Run an ANN query against Pinecone.

    Args:
        vector:      Query embedding (768-dim).
        top_k:       Number of candidates to return.
        filter_dict: Optional Pinecone metadata filter.

    Returns:
        List of match dicts with id, score, metadata.
    """
    index = _get_index()
    kwargs = {
        "vector": vector,
        "top_k": top_k,
        "include_metadata": True,
    }
    if filter_dict:
        kwargs["filter"] = filter_dict

    response = index.query(**kwargs)
    return response.get("matches", [])


def query_with_nutritional_filter(
    vector: list[float],
    calories: float,
    protein: Optional[float] = None,
) -> list[dict]:
    """
    Query Pinecone with a calorie-range metadata pre-filter.
    Falls back to unfiltered search if fewer than 5 results are returned.

    Args:
        vector:   Query embedding.
        calories: Target calories for the ±CALORIE_TOLERANCE window.
        protein:  Optional minimum protein filter (≥70% of target).

    Returns:
        List of candidate recipe matches.
    """
    cal_min = int(calories * (1 - CALORIE_TOLERANCE))
    cal_max = int(calories * (1 + CALORIE_TOLERANCE))

    filter_dict: dict = {"calories": {"$gte": cal_min, "$lte": cal_max}}

    if protein and protein > 0:
        filter_dict["protein"] = {"$gte": int(protein * 0.70)}

    logger.debug(
        f"Pinecone filter → calories:[{cal_min}–{cal_max}]"
        + (f", protein≥{int(protein * 0.70)}g" if protein else "")
    )

    matches = query_similar(vector, filter_dict=filter_dict)

    if len(matches) < 5:
        logger.warning(
            f"Filtered query returned only {len(matches)} results. "
            "Falling back to unfiltered search."
        )
        matches = query_similar(vector)

    logger.info(f"Retrieved {len(matches)} candidate recipes from Pinecone.")
    return matches


# ── Ensure index exists ────────────────────────────────────────────────────────

def ensure_index() -> None:
    """
    Create the Pinecone index if it does not already exist.
    Called from the ingestion script.
    """
    pc = Pinecone(api_key=PINECONE_API_KEY)
    existing = [idx["name"] for idx in pc.list_indexes().get("indexes", [])]

    if PINECONE_INDEX not in existing:
        logger.info(f"Creating Pinecone index '{PINECONE_INDEX}' (768-dim, cosine)…")
        pc.create_index(
            name=PINECONE_INDEX,
            dimension=768,
            metric="cosine",
            spec=ServerlessSpec(cloud="aws", region=PINECONE_REGION),
        )
        import time
        time.sleep(60)  # wait for index to be ready
        logger.info("Index created and ready.")
    else:
        logger.info(f"Index '{PINECONE_INDEX}' already exists.")


# ── Health check ───────────────────────────────────────────────────────────────

async def check_pinecone_health() -> dict:
    """
    Verify Pinecone connection and return index stats.
    Called on app startup.
    """
    try:
        index = _get_index()
        stats = index.describe_index_stats()
        total = stats.get("total_vector_count", 0)
        logger.info(f"✓ Pinecone ready. Total vectors indexed: {total:,}")
        return {"ok": True, "total_vectors": total}
    except Exception as exc:
        logger.error(f"Pinecone health check failed: {exc}")
        return {"ok": False, "total_vectors": 0}
