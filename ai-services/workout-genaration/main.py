import os
from typing import Optional
from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from app.schemas import UserProfile
from app.generator import generate_workout_plan
from app.validator import validate_plan
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

app = FastAPI(title="Workout RAG Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

client = Groq(api_key=os.environ["GROQ_API_KEY"])

# Optional shared secret. When RAG_API_KEY is set, every protected endpoint requires
# a matching X-API-Key header. Opt-in so the service keeps working until the key is
# provisioned on both ends (this service + the backend that calls it).
RAG_API_KEY = os.getenv("RAG_API_KEY")


async def require_api_key(x_api_key: Optional[str] = Header(default=None, alias="X-API-Key")):
    if RAG_API_KEY and x_api_key != RAG_API_KEY:
        raise HTTPException(status_code=401, detail="Invalid or missing API key")

class ChatRequest(BaseModel):
    message: str

class ValidateRequest(BaseModel):
    plan: dict
    profile: dict

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/generate", dependencies=[Depends(require_api_key)])
def generate(profile: UserProfile):
    try:
        plan = generate_workout_plan(profile.dict())
        return {"success": True, "data": plan}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        print(f"[/generate] Error: {e}")
        raise HTTPException(status_code=500, detail="Generation failed")

@app.post("/validate", dependencies=[Depends(require_api_key)])
def validate(request: ValidateRequest):
    try:
        result = validate_plan(request.plan, request.profile)
        return {
            "success": True,
            "valid":    result["valid"],
            "score":    result["score"],
            "errors":   result["errors"],
            "warnings": result["warnings"]
        }
    except Exception as e:
        print(f"[/validate] Error: {e}")
        raise HTTPException(status_code=500, detail="Validation failed")

@app.post("/chat", dependencies=[Depends(require_api_key)])
def chat(request: ChatRequest):
    try:
        injury_keywords = ["injury", "injured", "pain", "hurt", "knee", "back",
                          "shoulder", "wrist", "ankle", "elbow", "neck"]
        has_injury = any(word in request.message.lower() for word in injury_keywords)

        system_prompt = """You are a certified personal trainer.
Your response must follow this exact format and nothing else:

Day 1 - [Focus]:
- Exercise: sets x reps

Day 2 - [Focus]:
- Exercise: sets x reps

Continue for all 7 days. Write "Rest Day" for rest days. No intro, no tips, no extra text."""

        if has_injury:
            system_prompt += """

At the end, add a short section called "Injury Note:" with:
- 2-3 exercises to AVOID
- 1-2 safer alternatives
Keep it under 4 lines total."""

        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user",   "content": request.message}
            ],
            temperature=0.7,
            max_tokens=800,
        )

        result = {"response": response.choices[0].message.content}

        if has_injury:
            result["injury_detected"] = True
            result["injury_note"] = "Plan modified for injury"

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))