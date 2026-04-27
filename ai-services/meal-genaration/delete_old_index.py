"""
delete_old_index.py
───────────────────
Deletes the existing food-rag-index (768-dim) so it can be
recreated with 384-dim during ingestion.

Run ONCE before running ingest.py with --reset.
"""

import os
from dotenv import load_dotenv
from pinecone import Pinecone

load_dotenv()

api_key = os.getenv("PINECONE_API_KEY", "")
index_name = os.getenv("PINECONE_INDEX_NAME", "food-rag-index")

if not api_key:
    print("ERROR: PINECONE_API_KEY not found in .env")
    exit(1)

pc = Pinecone(api_key=api_key)
existing = [idx["name"] for idx in pc.list_indexes().get("indexes", [])]

if index_name in existing:
    print(f"Deleting index '{index_name}'...")
    pc.delete_index(index_name)
    print(f"✅ Index '{index_name}' deleted.")
    print("Now run: python ingest.py --reset")
else:
    print(f"Index '{index_name}' does not exist. Nothing to delete.")
    print("You can run: python ingest.py --reset")
