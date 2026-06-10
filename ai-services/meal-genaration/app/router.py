import logging
import os
import re
import time
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import ValidationError

from app.embedder import generate_embedding, build_query_text
from app.generator import build_rag_prompt, call_llm, parse_llm_response, enrich_meals
from app.retriever import query_with_nutritional_filter, check_pinecone_health
from app.schemas import (
    RecommendRequest,
    RecommendResponse,
    MealResult,
    PipelineMetadata,
    HealthResponse,
    ErrorResponse,
    ErrorDetail,
)
from app.validator import validate_macro_inputs

logger = logging.getLogger(__name__)
router = APIRouter()


# ── Optional API-key guard ─────────────────────────────────────────────────────
# This service is publicly reachable on Railway. When RAG_API_KEY is set, every
# /recommend call must present a matching X-API-Key header. It is opt-in so the
# service keeps working until the key is provisioned on both ends (backend + here).
RAG_API_KEY = os.getenv("RAG_API_KEY")


async def require_api_key(
    x_api_key: Optional[str] = Header(default=None, alias="X-API-Key"),
):
    if RAG_API_KEY and x_api_key != RAG_API_KEY:
        logger.warning("[auth] Rejected /recommend call with invalid or missing API key.")
        raise HTTPException(
            status_code=401,
            detail={"success": False, "errors": [{"message": "Invalid or missing API key"}]},
        )


CUISINE_KEYWORDS = {
    "sri_lankan": ["sri lankan", "srilankan", "sinhala", "sinhalese", "tamil food", "ceylon"],
    "indian":     ["indian", "north indian", "south indian", "punjabi", "gujarati", "bengali", "kerala"],
    "fast_food":  ["fast food", "mcdonald", "kfc", "burger king", "taco bell", "wendy", "pizza hut"],
    "international": ["western", "american", "european", "international", "italian", "mexican"],
}

MEAL_TYPE_KEYWORDS = {
    "breakfast": ["breakfast", "morning", "brunch"],
    "main":      ["lunch", "dinner", "main course", "main meal"],
    "snack":     ["snack", "light bite", "appetizer"],
    "dessert":   ["dessert", "sweet", "pudding"],
    "soup":      ["soup", "stew"],
    "beverage":  ["drink", "beverage", "juice", "smoothie"],
}

DIET_KEYWORDS = {
    "vegetarian": ["vegetarian", "veg only", "no meat"],
    "vegan":      ["vegan", "plant based", "plant-based"],
    "pescatarian": ["pescatarian", "fish only"],
}


def parse_context(context):
    if not context:
        return {}

    ctx = context.lower().strip()
    result = {}

    for cuisine_val, keywords in CUISINE_KEYWORDS.items():
        if any(kw in ctx for kw in keywords):
            result["cuisine"] = cuisine_val
            break

    for mt_val, keywords in MEAL_TYPE_KEYWORDS.items():
        if any(kw in ctx for kw in keywords):
            result["meal_type"] = mt_val
            break

    for diet_val, keywords in DIET_KEYWORDS.items():
        if any(kw in ctx for kw in keywords):
            result["diet"] = diet_val
            break

    if result:
        logger.info(f"Context parsed -> {result}")

    return result


@router.post(
    "/recommend",
    response_model=RecommendResponse,
    responses={
        400: {"model": ErrorResponse},
        500: {"model": ErrorResponse},
        503: {"model": ErrorResponse},
    },
    summary="Get 5 meal recommendations",
    tags=["Recommendations"],
    dependencies=[Depends(require_api_key)],
)
async def recommend(body: RecommendRequest):
    start = time.time()

    validation = validate_macro_inputs(
        calories=body.calories,
        protein=body.protein,
        fat=body.fat,
    )
    if not validation.valid:
        raise HTTPException(
            status_code=400,
            detail={"success": False, "errors": [{"message": e} for e in validation.errors]},
        )

    if validation.warnings:
        logger.info(f"Validation warnings: {validation.warnings}")

    context_filters = parse_context(body.context)

    logger.info(
        f"RAG pipeline | cal={body.calories} prot={body.protein} "
        f"fat={body.fat} carbs={body.carbs} goal={body.goal} "
        f"filters={context_filters}"
    )

    try:
        query_text = build_query_text(
            calories=body.calories,
            protein=body.protein,
            fat=body.fat,
            context=body.context,
            goal=body.goal.value if body.goal else None,
        )
        query_vector = await generate_embedding(query_text)
        logger.info(f"[embed] Query embedded -> {len(query_vector)} dims.")
    except RuntimeError as exc:
        logger.error(f"[embed] Embedding failed: {exc}")
        raise HTTPException(
            status_code=503,
            detail={"success": False, "errors": [{"message": str(exc)}]},
        )

    try:
        matches = query_with_nutritional_filter(
            vector=query_vector,
            calories=body.calories,
            protein=body.protein,
            cuisine=context_filters.get("cuisine"),
            meal_type=context_filters.get("meal_type"),
            diet=context_filters.get("diet"),
        )
    except Exception as exc:
        raise HTTPException(
            status_code=503,
            detail={
                "success": False,
                "errors": [{"message": f"Pinecone retrieval failed: {exc}"}],
            },
        )

    if not matches:
        raise HTTPException(
            status_code=404,
            detail={
                "success": False,
                "errors": [{"message": "No matching recipes found."}],
            },
        )

    retrieved = [
        {
            "title":    m["metadata"].get("title", "Unknown"),
            "calories": m["metadata"].get("calories", 0),
            "protein":  m["metadata"].get("protein", 0),
            "fat":      m["metadata"].get("fat", 0),
            "sodium":   m["metadata"].get("sodium", 0),
            "rating":   m["metadata"].get("rating", 0),
        }
        for m in matches
    ]

    try:
        prompt = build_rag_prompt(
            calories=body.calories,
            protein=body.protein,
            fat=body.fat,
            carbs=body.carbs,
            context=body.context,
            goal=body.goal.value if body.goal else None,
            retrieved_recipes=retrieved,
        )
        raw_response = await call_llm(prompt)
    except RuntimeError as exc:
        raise HTTPException(
            status_code=503,
            detail={"success": False, "errors": [{"message": str(exc)}]},
        )

    try:
        meals_raw  = parse_llm_response(raw_response)
        meals_rich = enrich_meals(meals_raw, body.calories)
    except ValueError as exc:
        logger.error(f"[parse] Failed to parse/enrich LLM output: {exc}")
        raise HTTPException(
            status_code=500,
            detail={"success": False, "errors": [{"message": str(exc)}]},
        )

    # Build the typed response. enrich_meals guarantees all fields, but guard the
    # serialization step so a stray bad value surfaces as a clear log + 500 rather
    # than an unhandled crash with an empty body.
    try:
        meal_results = [MealResult(**m) for m in meals_rich]
    except ValidationError as exc:
        logger.error(f"[respond] MealResult validation failed: {exc} | data={meals_rich}")
        raise HTTPException(
            status_code=500,
            detail={"success": False, "errors": [{"message": "Failed to format meal results."}]},
        )

    duration_ms = int((time.time() - start) * 1000)
    logger.info(f"[respond] RAG pipeline complete | {len(meal_results)} meals | {duration_ms}ms")

    return RecommendResponse(
        success=True,
        meals=meal_results,
        metadata=PipelineMetadata(
            candidates_retrieved=len(matches),
            pipeline_duration_ms=duration_ms,
            query_text=query_text,
            model=os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile"),
        ),
    )


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Health check",
    tags=["System"],
)
async def health():
    stats = await check_pinecone_health()

    return HealthResponse(
        status="ok" if stats["ok"] else "degraded",
        pinecone_vectors=stats["total_vectors"],
        pinecone_index=os.getenv("PINECONE_INDEX_NAME", "food-rag-index"),
        embed_model="BAAI/bge-small-en-v1.5",
        generation_model=os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile"),
    )


async def validation_exception_handler(request, exc):
    return JSONResponse(
        status_code=422,
        content={
            "success": False,
            "errors": [
                {"field": ".".join(str(l) for l in e["loc"]), "message": e["msg"]}
                for e in exc.errors()
            ],
        },
    )
