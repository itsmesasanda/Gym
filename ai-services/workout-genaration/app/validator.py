# app/validator.py

MUSCLE_MAP = {
    "bench press":        "chest",
    "incline press":      "chest",
    "incline dumbbell":   "chest",
    "push up":            "chest",
    "chest fly":          "chest",
    "cable fly":          "chest",
    "cable crossover":    "chest",
    "dips":               "chest",
    "skull crusher":      "chest",

    "pull up":            "back",
    "pull-up":            "back",
    "pullup":             "back",
    "bent over row":      "back",
    "barbell row":        "back",
    "lat pulldown":       "back",
    "seated row":         "back",
    "cable row":          "back",
    "deadlift":           "back",
    "face pull":          "back",

    "squat":              "legs",
    "lunge":              "legs",
    "leg press":          "legs",
    "leg curl":           "legs",
    "leg extension":      "legs",
    "calf raise":         "legs",
    "romanian deadlift":  "legs",
    "bodyweight squat":   "legs",
    "smith squat":        "legs",
    "step up":            "legs",

    "shoulder press":     "shoulders",
    "overhead press":     "shoulders",
    "lateral raise":      "shoulders",
    "front raise":        "shoulders",
    "arnold press":       "shoulders",
    "upright row":        "shoulders",
    "rear delt":          "shoulders",

    "bicep curl":         "arms",
    "bicep curls":        "arms",
    "hammer curl":        "arms",
    "preacher curl":      "arms",
    "concentration curl": "arms",
    "tricep":             "arms",
    "skull crusher":      "arms",
    "overhead extension": "arms",

    "plank":              "core",
    "crunch":             "core",
    "russian twist":      "core",
    "leg raise":          "core",
    "sit up":             "core",
    "cable crunch":       "core",
    "mountain climber":   "core",
    "bicycle":            "core",

    "running":            "cardio",
    "cycling":            "cardio",
    "burpee":             "cardio",
    "jump rope":          "cardio",
    "walking":            "cardio",
    "jumping jack":       "cardio",
    "swimming":           "cardio",
    "rowing":             "cardio",
    "hiit":               "cardio",
}

BEGINNER_RISKY = [
    "deadlift",
    "snatch",
    "clean and jerk",
    "barbell squat",
    "olympic",
]

COMPOUND_LIFTS = [
    "squat", "deadlift", "bench press",
    "overhead press", "bent over row", "pull up"
]

# Exercises to avoid per injury
INJURY_AVOID = {
    "legs":      ["squat", "leg press", "lunge", "deadlift",
                  "leg extension", "smith squat", "step up", "jump"],
    "back":      ["deadlift", "bent over row", "good morning",
                  "hyperextension", "barbell row"],
    "shoulders": ["overhead press", "shoulder press", "upright row",
                  "behind neck", "arnold press", "front raise"],
    "chest":     ["bench press", "chest fly", "dips", "push up",
                  "cable crossover", "cable fly"],
    "arms":      ["bicep curl", "tricep", "chin up",
                  "skull crusher", "preacher curl"],
}

# Safe alternatives per injury
INJURY_ALTERNATIVES = {
    "legs":      ["leg curl", "calf raise", "swimming", "seated leg curl",
                  "hip thrust", "glute bridge"],
    "back":      ["lat pulldown", "seated row", "face pull",
                  "cable row", "machine row"],
    "shoulders": ["lateral raise", "face pull", "band pull apart",
                  "cable lateral", "rear delt fly"],
    "chest":     ["machine press", "resistance band", "cable fly",
                  "pec deck"],
    "arms":      ["hammer curl", "reverse curl", "cable pushdown",
                  "rope pushdown"],
}


def get_muscle_group(exercise_name: str) -> str:
    name = exercise_name.lower().strip()
    for keyword, group in MUSCLE_MAP.items():
        if keyword in name:
            return group
    return "unknown"


def validate_plan(plan: dict, profile: dict) -> dict:
    errors   = []
    warnings = []
    score    = 100

    days    = plan.get("days", [])
    goal    = profile.get("goal", "")
    level   = profile.get("fitness_level") or profile.get("level", "beginner")
    injury  = profile.get("injury", "none")

    rest_days   = [d for d in days if not d.get("exercises")]
    active_days = [d for d in days if d.get("exercises")]

    # ── Layer 1: Structure ────────────────────────────────────────────────────

    if len(days) != 7:
        errors.append(f"Plan has {len(days)} days — must have exactly 7")
        score -= 30

    if len(rest_days) < 1:
        warnings.append("No rest days — muscles need recovery time")
        score -= 10

    if len(rest_days) > 4:
        errors.append(f"Too many rest days ({len(rest_days)}) — not enough volume")
        score -= 20

    for i in range(len(days) - 1):
        if not days[i].get("exercises") and not days[i+1].get("exercises"):
            warnings.append(
                f"Day {days[i]['day_number']} and Day {days[i+1]['day_number']} "
                f"are consecutive rest days"
            )
            score -= 5

    for day in active_days:
        ex_count = len(day.get("exercises", []))
        if ex_count < 2:
            warnings.append(f"Day {day['day_number']} has only {ex_count} exercise(s)")
            score -= 5
        if ex_count > 8:
            warnings.append(f"Day {day['day_number']} has {ex_count} exercises — too many")
            score -= 5

    for day in active_days:
        names = [e["name"].lower() for e in day.get("exercises", [])]
        if len(names) != len(set(names)):
            errors.append(f"Day {day['day_number']} has duplicate exercises")
            score -= 15

    # ── Layer 2: Muscle group coverage ───────────────────────────────────────

    weekly_groups = set()
    for day in active_days:
        for ex in day.get("exercises", []):
            group = get_muscle_group(ex["name"])
            weekly_groups.add(group)

    if "legs" not in weekly_groups and goal != "endurance" and injury != "legs":
        errors.append("Legs are never trained — add at least one leg day")
        score -= 20

    if "core" not in weekly_groups:
        warnings.append("No core exercises in the plan")
        score -= 5

    chest_count = sum(
        1 for day in active_days
        for ex in day.get("exercises", [])
        if get_muscle_group(ex["name"]) == "chest"
    )
    back_count = sum(
        1 for day in active_days
        for ex in day.get("exercises", [])
        if get_muscle_group(ex["name"]) == "back"
    )
    if chest_count > 0 and back_count == 0:
        errors.append("Push/pull imbalance — chest trained but no back exercises")
        score -= 15

    # ── Layer 3: Goal alignment ───────────────────────────────────────────────

    all_exercises = [
        e["name"].lower()
        for day in active_days
        for e in day.get("exercises", [])
    ]

    if goal == "endurance":
        has_cardio = any(
            get_muscle_group(name) == "cardio"
            for name in all_exercises
        )
        if not has_cardio:
            errors.append("Endurance goal but no cardio exercises")
            score -= 25

    if goal == "muscle_gain":
        has_compound = any(
            compound in name
            for name in all_exercises
            for compound in COMPOUND_LIFTS
        )
        if not has_compound:
            warnings.append("No compound lifts for muscle gain goal")
            score -= 10

    # ── Layer 4: Safety ───────────────────────────────────────────────────────

    if level == "beginner":
        for name in all_exercises:
            for risky in BEGINNER_RISKY:
                if risky in name:
                    warnings.append(
                        f"'{name}' may be too advanced for a beginner"
                    )
                    score -= 5
                    break

    total_sets      = sum(
        e.get("sets", 0)
        for day in active_days
        for e in day.get("exercises", [])
    )
    total_exercises = sum(len(day.get("exercises", [])) for day in active_days)
    if total_exercises > 0:
        avg_sets = total_sets / total_exercises
        if level == "beginner" and avg_sets > 4:
            warnings.append(
                f"Average {avg_sets:.1f} sets is high for a beginner — aim for 2-3"
            )
            score -= 5

    # ── Layer 5: Injury compliance ────────────────────────────────────────────

    if injury and injury != "none":
        avoid_list   = INJURY_AVOID.get(injury, [])
        alternatives = INJURY_ALTERNATIVES.get(injury, [])

        # Check for exercises that should be avoided
        violations = []
        for day in active_days:
            for ex in day.get("exercises", []):
                name = ex["name"].lower()
                for avoid in avoid_list:
                    if avoid in name:
                        violations.append(ex["name"])

        if violations:
            errors.append(
                f"Injury violation — unsafe exercises for {injury} injury: "
                + ", ".join(set(violations))
            )
            score -= 25

        # Check that safe alternatives are present
        has_alternatives = any(
            alt in ex["name"].lower()
            for day in active_days
            for ex in day.get("exercises", [])
            for alt in alternatives
        )

        if not has_alternatives:
            warnings.append(
                f"No safe alternatives for {injury} injury — "
                f"consider: {', '.join(alternatives[:3])}"
            )
            score -= 10

        # Check injured muscle is still being worked (not completely skipped)
        injury_muscle_map = {
            "legs":      "legs",
            "back":      "back",
            "shoulders": "shoulders",
            "chest":     "chest",
            "arms":      "arms",
        }
        target_group = injury_muscle_map.get(injury)
        if target_group:
            muscle_trained = any(
                get_muscle_group(ex["name"]) == target_group
                for day in active_days
                for ex in day.get("exercises", [])
            )
            if not muscle_trained:
                warnings.append(
                    f"The {injury} area is completely skipped — "
                    f"include safe alternatives to maintain muscle"
                )
                score -= 10

    # ── Final ─────────────────────────────────────────────────────────────────
    score = max(0, score)

    return {
        "valid":    len(errors) == 0,
        "errors":   errors,
        "warnings": warnings,
        "score":    score
    }