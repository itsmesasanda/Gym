import os
from fastembed import TextEmbedding

_model = None

def get_model():
    global _model
    if _model is None:
        print("[embedder] Loading model...")
        _model = TextEmbedding("BAAI/bge-small-en-v1.5")
        print("[embedder] Model loaded")
    return _model

def embed_query(text: str) -> list[float]:
    model = get_model()
    embeddings = list(model.embed([text]))
    return embeddings[0].tolist()

def profile_to_query_text(profile: dict) -> str:
    age = int(profile.get("age", 25))
    parts = [
        profile["goal"].replace("_", " "),
        profile.get("fitness_level", profile.get("level", "beginner")),
        profile.get("gender", "any"),
        f"age {age}",
    ]
    if age < 20:   parts.append("teen")
    elif age < 30: parts.append("20s")
    elif age < 40: parts.append("30s")
    elif age < 50: parts.append("40s")
    else:          parts.append("50_plus")
    return " ".join(parts)