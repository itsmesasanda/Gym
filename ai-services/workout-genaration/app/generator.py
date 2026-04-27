import os, json
from groq import Groq
from app.retriever import retrieve_examples
from dotenv import load_dotenv

load_dotenv()

client = Groq(api_key=os.environ["GROQ_API_KEY"])

SYSTEM_PROMPT = """You are a certified personal trainer.
Always respond with ONLY valid JSON. No markdown, no explanation, no code fences.
Generate exactly 7 days. Rest days have empty exercises array and focus set to "Rest".
If the user has an injury, never include exercises that target that injured body part.

Required JSON schema:
{
  "title": "string",
  "goal": "string",
  "days": [
    {
      "day_number": 1,
      "focus": "string",
      "exercises": [
        {
          "name": "string",
          "sets": 3,
          "reps": "10-12",
          "notes": null
        }
      ]
    }
  ]
}"""

def build_prompt(profile: dict, examples: list[dict]) -> str:
    examples_block = ""
    if examples:
        previews = []
        for i, ex in enumerate(examples[:3]):
            day1 = ex["days"][0] if ex.get("days") else {}
            previews.append(f"Reference {i+1} — Day 1: {json.dumps(day1)}")
        examples_block = "\n\nReference plans from similar profiles:\n" + "\n".join(previews)

    level  = profile.get("fitness_level") or profile.get("level", "beginner")
    goal   = profile.get("goal", "general")
    injury = profile.get("injury", "none")

    # Build injury warning block
    injury_block = ""
    if injury and injury != "none":
        injury_block = f"""
IMPORTANT — User has a {injury} injury:
- Still train the {injury} area but use safe, low-impact alternatives
- Avoid heavy compound movements that strain the {injury}
- Use lighter weights, resistance bands, or isolation movements instead
- For example if shoulder injury: skip Overhead Press but include Lateral Raises, Face Pulls, Band Pull-Aparts
- For example if knee injury: skip Squats and Leg Press but include Leg Curls, Calf Raises, Swimming
- Always include a note on each modified exercise explaining the modification
"""

    return f"""Create a 7-day workout plan for this user:
- Age: {profile.get('age')}
- Gender: {profile.get('gender', 'any')}
- Height: {profile.get('height')}cm, Weight: {profile.get('weight')}kg
- Goal: {goal.replace('_', ' ')}
- Fitness level: {level}
- Injury: {injury}
{injury_block}
{examples_block}

Respond with ONLY the JSON object."""


def generate_workout_plan(profile: dict) -> dict:
    examples = retrieve_examples(profile)
    print(f"[generator] Retrieved {len(examples)} examples")

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user",   "content": build_prompt(profile, examples)}
    ]

    last_error = None
    raw = ""
    for attempt in range(3):
        try:
            response = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=messages,
                temperature=0.7,
                max_tokens=2000,
            )

            raw = response.choices[0].message.content
            plan = json.loads(raw)

            if len(plan.get("days", [])) != 7:
                raise ValueError(f"Expected 7 days, got {len(plan.get('days', []))}")

            print(f"[generator] Plan generated successfully on attempt {attempt + 1}")
            return plan

        except (json.JSONDecodeError, ValueError) as e:
            last_error = str(e)
            print(f"[generator] Attempt {attempt + 1} failed: {last_error}")

            if attempt < 2:
                messages.append({"role": "assistant", "content": raw})
                messages.append({"role": "user", "content": f"Error: {last_error}. Return ONLY valid JSON matching the schema exactly."})

    raise ValueError(f"Failed after 3 attempts. Last error: {last_error}")