"""
router.py
─────────
FastAPI route definitions.
  POST /recommend  — main RAG pipeline
  GET  /health     — system health check (mirrors your workout app pattern)
"""

import logging
import os
import time
from typing import Optional

from fastapi import APIRouter, HTTPException, Request
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


# ── POST /recommend ────────────────────────────────────────────────────────────

@router.post(
    "/recommend",
    response_model=RecommendResponse,
    responses={
        400: {"model": ErrorResponse, "description": "Validation error"},
        500: {"model": ErrorResponse, "description": "Pipeline error"},
        503: {"model": ErrorResponse, "description": "Ollama / Pinecone unavailable"},
    },
    summary="Get 5 meal recommendations",
    description=(
        "Runs the full RAG pipeline:\n\n"
        "1. Validates macro inputs\n"
        "2. Embeds the query with Ollama nomic-embed-text\n"
        "3. Retrieves top candidates from Pinecone (with calorie filter)\n"
        "4. Generates structured recommendations via llama3.1:8b\n"
        "5. Returns 5 ranked meals with macro breakdown"
    ),
    tags=["Recommendations"],
)
async def recommend(body: RecommendRequest) -> RecommendResponse:
    start = time.time()

    # ── Step 0: Business-rule validation (beyond Pydantic) ─────────────────────
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
        logger.info(f"Validation warnings for request: {validation.warnings}")

    # ── Step 1: Embed ──────────────────────────────────────────────────────────
    logger.info(
        f"RAG pipeline | cal={body.calories} prot={body.protein} "
        f"fat={body.fat} goal={body.goal}"
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
    except RuntimeError as exc:
        raise HTTPException(
            status_code=503,
            detail={"success": False, "errors": [{"message": str(exc)}]},
        )

    # ── Step 2: Retrieve ───────────────────────────────────────────────────────
    try:
        matches = query_with_nutritional_filter(
            vector=query_vector,
            calories=body.calories,
            protein=body.protein,
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
                "errors": [
                    {
                        "message": (
                            "No matching recipes found. "
                            "Please run the ingestion script first: python ingest.py"
                        )
                    }
                ],
            },
        )

    # ── Step 3: Format context ─────────────────────────────────────────────────
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

    # ── Step 4: Generate ───────────────────────────────────────────────────────
    try:
        prompt   = build_rag_prompt(
            calories=body.calories,
            protein=body.protein,
            fat=body.fat,
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

    # ── Step 5: Parse + enrich ─────────────────────────────────────────────────
    try:
        meals_raw  = parse_llm_response(raw_response)
        meals_rich = enrich_meals(meals_raw, body.calories)
    except ValueError as exc:
        raise HTTPException(
            status_code=500,
            detail={"success": False, "errors": [{"message": str(exc)}]},
        )

    duration_ms = int((time.time() - start) * 1000)
    logger.info(f"RAG pipeline complete | {len(meals_rich)} meals | {duration_ms}ms")

    return RecommendResponse(
        success=True,
        meals=[MealResult(**m) for m in meals_rich],
        metadata=PipelineMetadata(
            candidates_retrieved=len(matches),
            pipeline_duration_ms=duration_ms,
            query_text=query_text,
            model=os.getenv("OLLAMA_GENERATION_MODEL", "llama3.1:8b"),
        ),
    )


# ── GET /health ────────────────────────────────────────────────────────────────

@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Health check",
    description=(
        "Returns the status of all downstream services:\n\n"
        "- **Pinecone** — vector index connection + total vectors indexed\n"
        "- **Ollama** — base URL and configured models"
    ),
    tags=["System"],
)
async def health() -> HealthResponse:
    stats = await check_pinecone_health()

    return HealthResponse(
        status="ok" if stats["ok"] else "degraded",
        pinecone_vectors=stats["total_vectors"],
        pinecone_index=os.getenv("PINECONE_INDEX_NAME", "food-rag-index"),
        ollama_url=os.getenv("OLLAMA_BASE_URL", "http://localhost:11434"),
        embed_model=os.getenv("OLLAMA_EMBED_MODEL", "nomic-embed-text"),
        generation_model=os.getenv("OLLAMA_GENERATION_MODEL", "llama3.1:8b"),
    )


# ── Pydantic validation error handler ─────────────────────────────────────────
# (Registered on the FastAPI app via exception_handler, shown here for reference)

async def validation_exception_handler(request: Request, exc: ValidationError):
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
