"""
ingest.py
─────────
One-time ingestion script.
Reads rag_ready_dataset.csv, embeds each recipe with fastembed
(BAAI/bge-small-en-v1.5, 384-dim), and upserts all vectors + metadata
into Pinecone.

Run:
    python ingest.py
    python ingest.py --csv path/to/custom.csv
    python ingest.py --reset

Progress is checkpointed to .ingest_checkpoint.json so the script
can be safely interrupted and resumed.
"""

import argparse
import asyncio
import csv
import json
import logging
import os
import re
import sys
import time
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv

load_dotenv()

sys.path.insert(0, str(Path(__file__).parent))

from app.embedder import generate_embedding
from app.retriever import ensure_index, upsert_vectors
from app.validator import validate_csv_row

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger("ingest")

DEFAULT_CSV        = Path(__file__).parent / "rag_ready_dataset.csv"
CHECKPOINT_FILE    = Path(__file__).parent / ".ingest_checkpoint.json"
UPSERT_BATCH_SIZE  = 100
EMBED_CONCURRENCY  = 3


def extract_cuisine(text_chunk: str) -> str:
    m = re.search(r'Cuisine / style:\s*([^.]+)\.', text_chunk)
    if m:
        val = m.group(1).strip().lower()
        if 'sri lank' in val: return 'sri_lankan'
        if 'indian' in val: return 'indian'
        if 'fast food' in val: return 'fast_food'
        if 'international' in val: return 'international'
        return 'general'
    return 'general'

def extract_meal_type(text_chunk: str) -> str:
    m = re.search(r'Meal type:\s*([^.]+)\.', text_chunk)
    if m:
        val = m.group(1).strip().lower()
        if 'breakfast' in val: return 'breakfast'
        if 'dessert' in val: return 'dessert'
        if 'snack' in val: return 'snack'
        if 'side' in val: return 'side'
        if 'drink' in val or 'beverage' in val: return 'beverage'
        if 'soup' in val: return 'soup'
        return 'main'
    return 'main'

def extract_diet(text_chunk: str) -> str:
    m = re.search(r'Diet suitability:\s*([^.]+)\.', text_chunk)
    if m:
        val = m.group(1).strip().lower()
        if 'none' in val: return 'any'
        if 'vegan' in val: return 'vegan'
        if 'vegetarian' in val: return 'vegetarian'
        if 'pescatarian' in val: return 'pescatarian'
        return 'any'
    return 'any'


def load_checkpoint() -> dict:
    if CHECKPOINT_FILE.exists():
        try:
            data = json.loads(CHECKPOINT_FILE.read_text())
            logger.info(f"Resuming from checkpoint: {data['processed']} records done.")
            return data
        except Exception:
            pass
    return {"processed": 0, "failed": [], "skipped": 0}


def save_checkpoint(processed, failed, skipped):
    CHECKPOINT_FILE.write_text(
        json.dumps(
            {"processed": processed, "failed": failed, "skipped": skipped,
             "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S")},
            indent=2,
        )
    )


def read_csv(path):
    records = []
    with open(path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            records.append(row)
    logger.info(f"Loaded {len(records):,} rows from {path.name}")
    return records


async def embed_record(record, semaphore):
    result = validate_csv_row(record)
    if not result.valid:
        logger.warning(f"Skipping {record.get('doc_id')}: {result.errors}")
        return None

    text_chunk = str(record.get("text_chunk", ""))

    async with semaphore:
        try:
            embedding = await generate_embedding(text_chunk)
            return {
                "id": record["doc_id"],
                "values": embedding,
                "metadata": {
                    "title":      str(record.get("title", "")).strip(),
                    "calories":   float(record.get("calories", 0) or 0),
                    "protein":    float(record.get("protein", 0) or 0),
                    "fat":        float(record.get("fat", 0) or 0),
                    "sodium":     float(record.get("sodium", 0) or 0),
                    "rating":     float(record.get("rating", 0) or 0),
                    "cuisine":    extract_cuisine(text_chunk),
                    "meal_type":  extract_meal_type(text_chunk),
                    "diet":       extract_diet(text_chunk),
                    "text_chunk": text_chunk[:500],
                },
            }
        except Exception as exc:
            logger.error(f"Embed failed for {record.get('doc_id')}: {exc}")
            return None


async def main(csv_path, reset):
    logger.info("═══════════════════════════════════════════")
    logger.info("  FitFood RAG — Ingestion Script")
    logger.info("  Using fastembed (BAAI/bge-small-en-v1.5)")
    logger.info("  Metadata: calories, protein, fat, sodium,")
    logger.info("            cuisine, meal_type, diet, rating")
    logger.info("═══════════════════════════════════════════")

    ensure_index()

    records = read_csv(csv_path)

    checkpoint = {"processed": 0, "failed": [], "skipped": 0} if reset else load_checkpoint()
    to_process = records[checkpoint["processed"]:]
    logger.info(f"Records to process: {len(to_process):,}")

    if not to_process:
        logger.info("Nothing to do — all records already ingested.")
        return

    semaphore = asyncio.Semaphore(EMBED_CONCURRENCY)
    vector_buffer = []
    processed = checkpoint["processed"]
    failed = list(checkpoint["failed"])
    skipped = checkpoint["skipped"]
    start = time.time()

    for batch_start in range(0, len(to_process), UPSERT_BATCH_SIZE):
        batch = to_process[batch_start : batch_start + UPSERT_BATCH_SIZE]

        tasks   = [embed_record(r, semaphore) for r in batch]
        results = await asyncio.gather(*tasks)

        for record, vector in zip(batch, results):
            if vector:
                vector_buffer.append(vector)
            else:
                doc_id = record.get("doc_id", "unknown")
                if not validate_csv_row(record).valid:
                    skipped += 1
                else:
                    failed.append(doc_id)

        if len(vector_buffer) >= UPSERT_BATCH_SIZE:
            upsert_vectors(vector_buffer[:UPSERT_BATCH_SIZE])
            vector_buffer = vector_buffer[UPSERT_BATCH_SIZE:]

        processed += len(batch)
        save_checkpoint(processed, failed, skipped)

        pct     = processed / len(records) * 100
        elapsed = (time.time() - start) / 60
        logger.info(
            f"Progress: {pct:.1f}% ({processed:,}/{len(records):,}) | "
            f"{elapsed:.1f} min | failed={len(failed)} skipped={skipped}"
        )

    if vector_buffer:
        logger.info(f"Upserting final {len(vector_buffer)} vectors...")
        upsert_vectors(vector_buffer)

    duration = (time.time() - start) / 60
    logger.info("═══════════════════════════════════════════")
    logger.info("  Ingestion complete!")
    logger.info(f"   Processed : {processed:,}")
    logger.info(f"   Skipped   : {skipped}")
    logger.info(f"   Failed    : {len(failed)}")
    logger.info(f"   Duration  : {duration:.2f} min")
    logger.info("═══════════════════════════════════════════")

    if failed:
        fail_path = Path("failed_embeddings.json")
        fail_path.write_text(json.dumps(failed, indent=2))
        logger.warning(f"Failed IDs saved to {fail_path}")

    if not failed and CHECKPOINT_FILE.exists():
        CHECKPOINT_FILE.unlink()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Ingest food dataset into Pinecone.")
    parser.add_argument("--csv",   type=Path, default=DEFAULT_CSV, help="Path to CSV file")
    parser.add_argument("--reset", action="store_true",            help="Re-embed everything")
    args = parser.parse_args()

    if not args.csv.exists():
        logger.error(f"CSV not found: {args.csv}")
        sys.exit(1)

    asyncio.run(main(args.csv, args.reset))
