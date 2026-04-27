"""
step2_add_columns.py
────────────────────
Adds carbohydrates and fibre columns to filtered_dataset.csv.
  - carbs  = (calories - protein*4 - fat*9) / 4  (rounded to 1 decimal)
  - fibre  = estimated from title keywords (realistic heuristic)
  - Also updates text_chunk to include both new values

Run: python step2_add_columns.py
"""

import csv
import re
from pathlib import Path

INPUT_CSV  = "filtered_dataset.csv"
OUTPUT_CSV = "with_columns_dataset.csv"


# ── Fibre estimator ────────────────────────────────────────────────────────────
# Maps ingredient/dish keywords to typical fibre values (grams per serving)
FIBRE_RULES = [
    # High fibre (>7g)
    (["lentil", "dhal", "dal", "parippu", "chickpea", "black bean",
      "kidney bean", "cowpea", "mung bean", "split pea", "black-eyed",
      "bran", "chia", "flaxseed", "artichoke", "avocado toast",
      "jackfruit", "polos", "high fiber", "high fibre"], 9.0),
    # Moderate-high fibre (5–7g)
    (["broccoli", "brussels", "spinach", "kale", "quinoa", "oat",
      "whole wheat", "wholegrain", "brown rice", "barley", "rye",
      "pea", "edamame", "corn", "pumpkin", "sweet potato", "yam",
      "beetroot", "carrot curry", "cabbage", "bean curry",
      "vegetable curry", "vegetable soup", "gotukola", "murunga",
      "drumstick", "kurakkan", "gothambu"], 6.0),
    # Moderate fibre (3–5g)
    (["rice", "pasta", "bread", "potato", "banana", "apple", "orange",
      "mango", "pear", "strawberry", "blueberry", "fig", "prune",
      "cashew", "almond", "walnut", "peanut", "coconut", "pol sambol",
      "seeni sambol", "sambol", "curry", "stew", "soup", "salad",
      "roti", "pittu", "hoppers", "hopper", "kottu", "idiyappam",
      "string hopper", "appam", "thosai", "vadai", "sambar",
      "rasam", "kootu", "avial", "pongal"], 4.0),
    # Low fibre (1–3g)
    (["chicken", "beef", "pork", "mutton", "fish", "prawn", "crab",
      "squid", "egg", "tofu", "cheese", "milk", "cream", "butter",
      "yogurt", "curd", "paneer", "meat", "seafood", "tuna", "salmon",
      "shrimp", "lamb", "turkey", "duck"], 1.5),
    # Very low fibre (<1g)
    (["sauce", "condiment", "dressing", "mayonnaise", "juice",
      "drink", "tea", "coffee", "water", "oil", "vinegar",
      "sugar", "syrup", "honey", "jam", "jelly", "candy",
      "chocolate", "cookie", "cake", "dessert", "ice cream",
      "gelato", "pudding", "custard", "mousse", "tart", "pie crust",
      "waffle", "pancake", "crepe", "donut", "muffin",
      "wattalappam", "watalappam", "kavum", "kokis", "aluwa",
      "dodol", "milk toffee", "love cake", "pani pol",
      "bibikkan", "aggala", "thala guli", "faluda",
      "king coconut", "coconut water"], 0.5),
]

DEFAULT_FIBRE = 2.5  # fallback


def estimate_fibre(title: str, text_chunk: str) -> float:
    combined = (title + " " + text_chunk).lower()
    for keywords, fibre_val in FIBRE_RULES:
        if any(kw in combined for kw in keywords):
            return fibre_val
    return DEFAULT_FIBRE


def calc_carbs(calories: float, protein: float, fat: float) -> float:
    carbs = (calories - (protein * 4) - (fat * 9)) / 4
    return max(round(carbs, 1), 0.0)


def get_carb_band(carbs: float) -> str:
    if carbs < 20:
        return "low-carb (< 20 g)"
    elif carbs <= 50:
        return "moderate-carb (20–50 g)"
    else:
        return "high-carb (> 50 g)"


def get_fibre_band(fibre: float) -> str:
    if fibre < 3:
        return "low-fibre (< 3 g)"
    elif fibre <= 7:
        return "moderate-fibre (3–7 g)"
    else:
        return "high-fibre (> 7 g)"


def update_text_chunk(text_chunk: str, carbs: float, fibre: float) -> str:
    """
    Updates the Nutrition per serving line to include carbs and fibre.
    Updates the Nutrition profile line to include carb and fibre bands.
    """
    # Update nutrition line
    text_chunk = re.sub(
        r"(Nutrition per serving:.*?sodium\.)",
        lambda m: m.group(0).rstrip(".")
                  + f" | {carbs} g carbs | {fibre} g fibre.",
        text_chunk,
        flags=re.IGNORECASE | re.DOTALL,
    )

    # Update nutrition profile line — append carb and fibre bands
    carb_band  = get_carb_band(carbs)
    fibre_band = get_fibre_band(fibre)
    text_chunk = re.sub(
        r"(Nutrition profile:[^\n]+)",
        lambda m: m.group(0).rstrip(".")
                  + f", {carb_band}, {fibre_band}.",
        text_chunk,
        flags=re.IGNORECASE,
    )

    return text_chunk


def main():
    input_path  = Path(INPUT_CSV)
    output_path = Path(OUTPUT_CSV)

    if not input_path.exists():
        print(f"ERROR: {INPUT_CSV} not found. Run step1_filter.py first.")
        return

    rows = []
    print(f"Reading {INPUT_CSV}...")
    with open(input_path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        original_fields = reader.fieldnames or []
        for row in reader:
            rows.append(row)

    # New column order: insert carbohydrates and fibre after sodium, before rating
    new_fields = []
    for field in original_fields:
        new_fields.append(field)
        if field == "sodium":
            new_fields.append("carbohydrates")
            new_fields.append("fibre")

    print(f"Adding carbohydrates and fibre to {len(rows):,} rows...")
    updated = []
    for row in rows:
        try:
            cal   = float(row.get("calories") or 0)
            prot  = float(row.get("protein") or 0)
            fat   = float(row.get("fat") or 0)
        except ValueError:
            cal, prot, fat = 0.0, 0.0, 0.0

        carbs = calc_carbs(cal, prot, fat)
        fibre = estimate_fibre(row.get("title", ""), row.get("text_chunk", ""))

        row["carbohydrates"] = carbs
        row["fibre"]         = fibre
        row["text_chunk"]    = update_text_chunk(
            row.get("text_chunk", ""), carbs, fibre
        )
        updated.append(row)

    print(f"Writing {OUTPUT_CSV}...")
    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=new_fields)
        writer.writeheader()
        writer.writerows(updated)

    print(f"Done. {OUTPUT_CSV} saved with {len(updated):,} rows.")
    print(f"New columns added: carbohydrates, fibre")
    print(f"\nNEXT STEP: Get Sri Lankan recipes from ChatGPT, save as sl_recipes.csv,")
    print(f"           then run step3_merge.py")


if __name__ == "__main__":
    main()
