"""
generator.py
────────────
Handles LLM generation via Groq (llama-3.3-70b-versatile).
"""

import json
import logging
import os
import re
from typing import Optional

from groq import Groq

logger = logging.getLogger(__name__)

# ── Config ────────────────────────────────────────────────────────────────────

GENERATION_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
FINAL_MEALS = int(os.getenv("FINAL_MEALS", "5"))

# ── Prompt builder ────────────────────────────────────────────────────────────

def build_rag_prompt(
    calories: float,
    protein: Optional[float],
    fat: Optional[float],
    carbs: Optional[float],
    context: Optional[str],
    goal: Optional[str],
    retrieved_recipes: list[dict],
) -> str:

    recipe_lines = "\n\n".join(
        f"[{i + 1}] {r['title']}\n"
        f"     Calories: {r['calories']} kcal | Protein: {r['protein']}g | "
        f"Fat: {r['fat']}g | Sodium: {r['sodium']}mg | Rating: {r['rating']}/5"
        for i, r in enumerate(retrieved_recipes)
    )

    user_targets = f"- Calories: {calories} kcal\n"
    if protein:
        user_targets += f"- Protein: {protein}g\n"
    if fat:
        user_targets += f"- Fat: {fat}g\n"
    if carbs:
        user_targets += f"- Carbs: {carbs}g\n"
    if goal:
        user_targets += f"- Fitness goal: {goal}\n"
    if context:
        user_targets += f"- Additional context: {context}\n"

    return f"""You are a fitness nutrition expert.

USER TARGETS:
{user_targets}

AVAILABLE RECIPES:
{recipe_lines}

TASK:
Select exactly {FINAL_MEALS} meals.

IMPORTANT:
- Respond ONLY with JSON array
- NO explanation
- NO markdown
- For each meal, estimate a realistic serving size in grams that would provide approximately the listed calories
- Include carbs (carbohydrates in grams) for each meal

FORMAT:
[
  {{
    "rank": 1,
    "title": "Meal Name",
    "calories": 000,
    "protein": 00,
    "fat": 00,
    "carbs": 00,
    "sodium": 000,
    "serving_size_g": 000,
    "rating": 0.0,
    "calorie_match_pct": 95,
    "why_recommended": "Reason"
  }}
]
"""

# ── LLM call (FIXED) ──────────────────────────────────────────────────────────

async def call_llm(prompt: str) -> str:
    try:
        api_key = os.getenv("GROQ_API_KEY")

        if not api_key:
            raise RuntimeError("GROQ_API_KEY not found")

        # ✅ Create client HERE (lazy init)
        client = Groq(api_key=api_key)

        response = client.chat.completions.create(
            model=GENERATION_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=1500
        )

        content = response.choices[0].message.content

        if not content:
            raise ValueError("Empty response from Groq")

        return content

    except Exception as exc:
        raise RuntimeError(f"Groq LLM failed: {exc}") from exc


# ── Parser ────────────────────────────────────────────────────────────────────

def parse_llm_response(raw: str) -> list[dict]:

    cleaned = re.sub(r"```(?:json)?\s*", "", raw).strip()

    match = re.search(r"\[[\s\S]*\]", cleaned)
    if not match:
        logger.error(f"No JSON array in output:\n{raw[:300]}")
        raise ValueError("Invalid JSON output")

    try:
        meals = json.loads(match.group())
    except:
        meals = _recover_partial_json(match.group())

    return meals[:FINAL_MEALS]


def _recover_partial_json(s: str) -> list[dict]:
    recovered = []
    depth = 0
    current = ""
    in_array = False

    for ch in s:
        if ch == "[" and not in_array:
            in_array = True
            continue
        if not in_array:
            continue

        current += ch
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                try:
                    recovered.append(json.loads(current.strip().rstrip(",")))
                    current = ""
                except:
                    current = ""

    return recovered


# ── Enrichment ────────────────────────────────────────────────────────────────

def enrich_meals(meals: list[dict], target_calories: float) -> list[dict]:
    enriched = []

    for meal in meals:
        meal_cal = meal.get("calories", 0)

        pct = int(
            (1 - abs(meal_cal - target_calories) / target_calories) * 100
        ) if target_calories else 0

        enriched.append({
            **meal,
            "calorie_match_pct": meal.get("calorie_match_pct", pct),
            "serving_size_g": meal.get("serving_size_g", 0),
            "carbs": meal.get("carbs", 0),
        })

    return enriched
