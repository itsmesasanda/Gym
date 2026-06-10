"""
generator.py
────────────
Handles LLM generation via Groq (llama-3.3-70b-versatile).
"""

import json
import logging
import os
import re
import time
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
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        logger.error("[generate] GROQ_API_KEY is not set — cannot call Groq.")
        raise RuntimeError("GROQ_API_KEY not found")

    try:
        # Lazy client init keeps a missing key from crashing module import.
        client = Groq(api_key=api_key)

        t0 = time.time()
        response = client.chat.completions.create(
            model=GENERATION_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=1500
        )
        content = response.choices[0].message.content
        logger.info(
            f"[generate] Groq ({GENERATION_MODEL}) responded in "
            f"{int((time.time() - t0) * 1000)}ms ({len(content or '')} chars)."
        )

        if not content:
            raise ValueError("Empty response from Groq")

        return content

    except Exception as exc:
        logger.error(f"[generate] Groq call failed: {exc}")
        raise RuntimeError(f"Groq LLM failed: {exc}") from exc


# ── Parser ────────────────────────────────────────────────────────────────────

def parse_llm_response(raw: str) -> list[dict]:

    cleaned = re.sub(r"```(?:json)?\s*", "", raw).strip()

    match = re.search(r"\[[\s\S]*\]", cleaned)
    if not match:
        logger.error(f"[parse] No JSON array in LLM output:\n{raw[:300]}")
        raise ValueError("Invalid JSON output")

    try:
        meals = json.loads(match.group())
    except json.JSONDecodeError as exc:
        # The model occasionally truncates the final object — recover what we can.
        logger.warning(f"[parse] Strict JSON parse failed ({exc}); attempting partial recovery.")
        meals = _recover_partial_json(match.group())

    if not meals:
        logger.error(f"[parse] Parsed 0 meals from LLM output:\n{raw[:300]}")
        raise ValueError("No meals parsed from LLM output")

    logger.info(f"[parse] Parsed {len(meals)} meal(s) from LLM output.")
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

def _safe_float(value, default: float = 0.0) -> float:
    """
    Coerce an LLM field into a float. The model may return a number, a numeric
    string with a trailing unit ("30g", "450 kcal"), or None — all of which we
    normalise rather than letting them blow up Pydantic validation downstream.
    """
    if value is None:
        return default
    if isinstance(value, (int, float)):
        return float(value)
    cleaned = re.sub(r"[^0-9.\-]", "", str(value))
    if cleaned in ("", "-", ".", "-."):
        return default
    try:
        return float(cleaned)
    except (ValueError, TypeError):
        return default


def _safe_int(value, default: int = 0) -> int:
    return int(round(_safe_float(value, default)))


def enrich_meals(meals: list[dict], target_calories: float) -> list[dict]:
    """
    Normalise raw LLM meal dicts into the exact shape MealResult expects.

    Every required field is backfilled and type-coerced here. Previously the LLM
    omitting a single field (sodium / rating / why_recommended) raised an uncaught
    Pydantic ValidationError in the route, surfacing to the app as an opaque 500
    with zero meals. Backfilling makes the pipeline resilient to flaky generations.
    """
    enriched = []

    for i, meal in enumerate(meals):
        if not isinstance(meal, dict):
            logger.warning(f"[enrich] Skipping non-dict meal at index {i}: {meal!r}")
            continue

        meal_cal = _safe_float(meal.get("calories"))

        # Derive a calorie-match % if the model didn't give a usable one.
        derived_pct = int(
            (1 - abs(meal_cal - target_calories) / target_calories) * 100
        ) if target_calories else 0
        derived_pct = max(0, min(100, derived_pct))  # clamp to 0–100

        enriched.append({
            "rank":              _safe_int(meal.get("rank"), i + 1),
            "title":             str(meal.get("title") or "Untitled meal"),
            "calories":          meal_cal,
            "protein":           _safe_float(meal.get("protein")),
            "fat":               _safe_float(meal.get("fat")),
            "carbs":             _safe_float(meal.get("carbs")),
            "sodium":            _safe_float(meal.get("sodium")),
            "serving_size_g":    _safe_float(meal.get("serving_size_g")),
            "rating":            _safe_float(meal.get("rating")),
            "calorie_match_pct": _safe_int(meal.get("calorie_match_pct"), derived_pct),
            "why_recommended":   str(meal.get("why_recommended") or "Matches your targets."),
        })

    logger.info(f"[enrich] Normalised {len(enriched)} meal(s) for response.")
    return enriched
