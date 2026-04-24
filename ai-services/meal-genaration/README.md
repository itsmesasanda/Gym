# FitFood RAG Service — FastAPI

Production-ready food recommendation RAG API.  
Matches your existing **Workout RAG Service** structure exactly.

```
food-rag-fastapi/
├── main.py                  ← FastAPI app + CORS + lifespan
├── ingest.py                ← One-time CSV → Pinecone ingestion
├── requirements.txt
├── .env.example
└── app/
    ├── __init__.py
    ├── schemas.py            ← Pydantic request/response + validation
    ├── validator.py          ← Business-rule validation helpers
    ├── embedder.py           ← Ollama nomic-embed-text embeddings
    ├── retriever.py          ← Pinecone vector search
    ├── generator.py          ← llama3.1:8b prompt + JSON parsing
    └── router.py             ← POST /recommend  GET /health
```

## Endpoints

| Method | Path         | Description                       |
|--------|--------------|-----------------------------------|
| POST   | `/recommend` | Get 5 AI-matched meal suggestions |
| GET    | `/health`    | Pinecone + Ollama status          |
| GET    | `/docs`      | Swagger UI                        |
| GET    | `/redoc`     | ReDoc                             |

## Quick Start

### 1. Ollama models
```bash
ollama pull nomic-embed-text
ollama pull llama3.1:8b
ollama serve
```

### 2. Environment
```bash
cp .env.example .env
# Fill in PINECONE_API_KEY
```

### 3. Install
```bash
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### 4. Ingest (one-time, ~45 min)
```bash
# Place rag_ready_dataset.csv in the project root, then:
python ingest.py

# Resume interrupted ingestion:
python ingest.py

# Re-embed everything from scratch:
python ingest.py --reset

# Custom CSV path:
python ingest.py --csv /path/to/data.csv
```

### 5. Run
```bash
uvicorn main:app --reload --port 8000
```

Open **http://localhost:8000/docs** for Swagger UI.

## Example Request

```bash
curl -X POST http://localhost:8000/recommend \
  -H "Content-Type: application/json" \
  -d '{
    "calories": 500,
    "protein": 35,
    "fat": 15,
    "context": "post-workout, no dairy",
    "goal": "muscle_gain"
  }'
```

## Validation Rules

| Rule | Behaviour |
|------|-----------|
| `calories` required, 50–5000 | 400 error |
| `protein * 4 > calories` | 400 error (physically impossible) |
| `fat * 9 > calories` | 400 error |
| `protein + fat kcal > calories` | 400 error (no room for carbs) |
| Protein unusually high (>2.5g/100kcal) | Warning logged, request continues |
| Empty string fields | Treated as null automatically |
| Context > 300 chars | 422 Pydantic error |
