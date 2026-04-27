from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from app.embedder import check_embed_health
from app.retriever import check_pinecone_health
from app.router import router

from dotenv import load_dotenv
load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown lifecycle."""
    logger.info("═══════════════════════════════════════")
    logger.info("  FitFood RAG Service — Starting up")
    logger.info("═══════════════════════════════════════")
    await check_embed_health()
    await check_pinecone_health()
    yield
    logger.info("FitFood RAG Service — Shutting down")


app = FastAPI(
    title="FitFood RAG Service",
    description=(
        "Production-ready food recommendation RAG system.\n\n"
        "Enter calorie and macro targets → get 5 AI-matched meals "
        "from 447 recipes using Pinecone vector search and Groq llama-3.3-70b."
    ),
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)
