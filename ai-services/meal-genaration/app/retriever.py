import logging
import os

from pinecone import Pinecone, ServerlessSpec

logger = logging.getLogger(__name__)

PINECONE_API_KEY   = os.getenv("PINECONE_API_KEY", "")
PINECONE_INDEX     = os.getenv("PINECONE_INDEX_NAME", "food-rag-index")
PINECONE_REGION    = os.getenv("PINECONE_ENVIRONMENT", "us-east-1")
TOP_K              = int(os.getenv("TOP_K_RESULTS", "15"))
CALORIE_TOLERANCE  = float(os.getenv("CALORIE_TOLERANCE", "0.20"))

_pc = None
_index = None


def _get_index():
    global _pc, _index
    if _index is None:
        _pc    = Pinecone(api_key=PINECONE_API_KEY)
        _index = _pc.Index(PINECONE_INDEX)
        logger.info(f"Pinecone index '{PINECONE_INDEX}' connected.")
    return _index


def upsert_vectors(vectors, batch_size=100):
    index = _get_index()
    total = 0
    for i in range(0, len(vectors), batch_size):
        batch = vectors[i : i + batch_size]
        index.upsert(vectors=batch)
        total += len(batch)
        logger.info(f"Upserted {total}/{len(vectors)} vectors")
    return total


def query_similar(vector, top_k=TOP_K, filter_dict=None):
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
    vector,
    calories,
    protein=None,
    cuisine=None,
    meal_type=None,
    diet=None,
):
    cal_min = int(calories * (1 - CALORIE_TOLERANCE))
    cal_max = int(calories * (1 + CALORIE_TOLERANCE))

    filter_dict = {"calories": {"$gte": cal_min, "$lte": cal_max}}

    if protein and protein > 0:
        filter_dict["protein"] = {"$gte": int(protein * 0.70)}

    if cuisine:
        filter_dict["cuisine"] = {"$eq": cuisine}

    if meal_type:
        filter_dict["meal_type"] = {"$eq": meal_type}

    if diet and diet != "any":
        filter_dict["diet"] = {"$eq": diet}

    filter_desc = f"calories:[{cal_min}-{cal_max}]"
    if protein: filter_desc += f", protein>={int(protein * 0.70)}g"
    if cuisine: filter_desc += f", cuisine={cuisine}"
    if meal_type: filter_desc += f", meal_type={meal_type}"
    if diet and diet != "any": filter_desc += f", diet={diet}"
    logger.info(f"Pinecone filter -> {filter_desc}")

    matches = query_similar(vector, filter_dict=filter_dict)

    # Fallback 1: drop meal_type and diet, keep cuisine + nutrition
    if len(matches) < 5 and (meal_type or (diet and diet != "any")):
        logger.warning(
            f"Full filter returned {len(matches)} results. "
            "Dropping meal_type and diet filters."
        )
        fallback = {"calories": {"$gte": cal_min, "$lte": cal_max}}
        if protein and protein > 0:
            fallback["protein"] = {"$gte": int(protein * 0.70)}
        if cuisine:
            fallback["cuisine"] = {"$eq": cuisine}
        matches = query_similar(vector, filter_dict=fallback)

    # Fallback 2: cuisine only
    if len(matches) < 5 and cuisine:
        logger.warning(
            f"Nutrition + cuisine returned {len(matches)} results. "
            "Keeping cuisine only."
        )
        matches = query_similar(vector, filter_dict={"cuisine": {"$eq": cuisine}})

    # Fallback 3: no filters
    if len(matches) < 5:
        logger.warning(
            f"Cuisine filter returned {len(matches)} results. "
            "Falling back to unfiltered."
        )
        matches = query_similar(vector)

    logger.info(f"Retrieved {len(matches)} candidate recipes from Pinecone.")
    return matches


def ensure_index():
    pc = Pinecone(api_key=PINECONE_API_KEY)
    existing = [idx["name"] for idx in pc.list_indexes().get("indexes", [])]

    if PINECONE_INDEX not in existing:
        logger.info(f"Creating Pinecone index '{PINECONE_INDEX}' (384-dim, cosine)...")
        pc.create_index(
            name=PINECONE_INDEX,
            dimension=384,
            metric="cosine",
            spec=ServerlessSpec(cloud="aws", region=PINECONE_REGION),
        )
        import time
        time.sleep(60)
        logger.info("Index created and ready.")
    else:
        logger.info(f"Index '{PINECONE_INDEX}' already exists.")


async def check_pinecone_health():
    try:
        index = _get_index()
        stats = index.describe_index_stats()
        total = stats.get("total_vector_count", 0)
        logger.info(f"Pinecone ready. Total vectors indexed: {total:,}")
        return {"ok": True, "total_vectors": total}
    except Exception as exc:
        logger.error(f"Pinecone health check failed: {exc}")
        return {"ok": False, "total_vectors": 0}
