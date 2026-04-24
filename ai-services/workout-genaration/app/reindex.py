import json, os, time
from fastembed import TextEmbedding
from pinecone import Pinecone
from dotenv import load_dotenv

load_dotenv("/Users/sasanda/Desktop/ML python/Rag/.env")

print("PINECONE KEY:", os.environ.get("PINECONE_API_KEY", "NOT FOUND")[:10])

model = TextEmbedding("BAAI/bge-small-en-v1.5")
pc    = Pinecone(api_key=os.environ["PINECONE_API_KEY"])
index = pc.Index("workouts")

# Clear existing vectors if any exist
print("Clearing index...")
try:
    index.delete(delete_all=True)
    time.sleep(3)
except Exception as e:
    print(f"  Nothing to clear, continuing...")

with open("/Users/sasanda/Desktop/ML python/Rag/notebook/data/workouts.json") as f:

    docs = json.load(f)
print(f"Re-indexing {len(docs)} docs...")

for i in range(0, len(docs), 50):
    batch      = docs[i : i + 50]
    texts      = [d["embed_text"] for d in batch]
    embeddings = list(model.embed(texts))

    vectors = []
    for doc, emb in zip(batch, embeddings):
        vectors.append({
            "id":     doc["id"],
            "values": emb.tolist(),
            "metadata": {
                **doc["metadata"],
                "response_json_str": json.dumps(doc["response_json"]),
                "embed_text":        doc["embed_text"],
            }
        })

    index.upsert(vectors=vectors)
    print(f"  Batch {i//50 + 1} done")
    time.sleep(0.3)

stats = index.describe_index_stats()
print(f"Done. Total vectors: {stats['total_vector_count']}")