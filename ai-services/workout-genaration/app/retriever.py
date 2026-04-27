import json, os
from pinecone import Pinecone
from app.embedder import embed_query, profile_to_query_text
from dotenv import load_dotenv

load_dotenv()

pc    = Pinecone(api_key=os.environ["PINECONE_API_KEY"])
index = pc.Index(os.environ.get("PINECONE_INDEX", "workouts"))

def retrieve_examples(profile: dict) -> list[dict]:
    query_text = profile_to_query_text(profile)
    query_vec  = embed_query(query_text)

    print(f"[retriever] Query: '{query_text}'")

    # Get level safely — handles both "fitness_level" and "level" keys
    level = profile.get("fitness_level") or profile.get("level", "beginner")
    goal  = profile.get("goal", "general")
    injury = profile.get("injury", "none")

    results = index.query(
        vector=query_vec,
        top_k=5,
        filter={
            "$and": [
                {"goal": {"$eq": goal}},
                {"level": {"$eq": level}},
                {"injury": {"$eq": injury}}
            ]
        },
        include_metadata=True
    )

    examples = []
    for match in results.matches:
        if match.score < 0.60:
            continue
        raw = match.metadata.get("response_json_str")
        if raw:
            try:
                examples.append(json.loads(raw))
            except:
                pass

    # Fallback — if filter returns nothing, search without filter
    if not examples:
        print("[retriever] No filtered matches, falling back to unfiltered")
        fallback = index.query(
            vector=query_vec,
            top_k=3,
            include_metadata=True
        )
        for match in fallback.matches:
            raw = match.metadata.get("response_json_str")
            if raw:
                try:
                    examples.append(json.loads(raw))
                except:
                    pass

    print(f"[retriever] Retrieved {len(examples)} examples")
    return examples[:3]