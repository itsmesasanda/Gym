"""
step1_filter.py
───────────────
Filters the existing rag_ready_dataset.csv:
  - Removes low-protein non-Sri Lankan rows
  - Removes useless sauces/condiments
  - Keeps popular desserts + high-protein desserts
  - Keeps ALL Sri Lankan rows no matter what
  - Saves result to: filtered_dataset.csv

Run: python step1_filter.py
"""

import csv
import re
from pathlib import Path

INPUT_CSV  = "rag_ready_dataset (1).csv"
OUTPUT_CSV = "filtered_dataset.csv"

# ── Sri Lankan keyword list ────────────────────────────────────────────────────
SL_KEYWORDS = [
    "sri lankan", "sri lanka", "ceylon", "kottu", "hoppers", "hopper",
    "string hopper", "pol sambol", "kiribath", "pittu", "lamprais",
    "wambatu", "polos", "isso", "kukul", "ambulthiyal", "kiri bath",
    "wattalappam", "watalappan", "kavum", "kokis", "aluwa", "dodol",
    "seeni sambol", "lunu miris", "gotukola", "kanji", "rasam", "parippu",
    "dhal curry", "dal curry", "jaffna", "colombo curry", "coconut roti",
    "thosai", "idiyappam", "appam", "vadai", "mutton curry sri",
    "tempered lentil", "tempered dal", "rice and curry", "milk rice",
    "pani pol", "bibikkan", "lavariya", "aggala", "thala guli", "mung kavum",
    "indi appa", "pol roti", "ela batu", "gothambu", "kurakkan",
    "palmyrah", "jak fruit curry", "jackfruit curry sri", "sothi",
    "adikoozh", "kool jaffna", "ulundu", "murukku", "isso wade",
    "kithul", "wood apple", "faluda", "kalu dodol", "milk toffee sri",
    "love cake", "christmas cake sri", "puhul dosi", "konda kavum",
    "undu walalu", "payasam sri", "halwa sri", "adhirasam", "avial",
    "kootu", "sambar sri", "murungakkai", "godamba", "pol rotti",
    "ven pongal sri", "devilled chicken sri", "urumas", "karawala",
    "karawila", "murunga", "kesel muwa", "alu kesel", "maa dhal",
    "black-eyed pea curry sri", "cowpea curry sri", "green gram curry sri",
    "kukul mas", "isso", "isso curry", "prawn curry sri",
]

# ── Popular desserts always kept ───────────────────────────────────────────────
POPULAR_DESSERTS = [
    "chocolate cake", "chocolate chip cook", "brownie", "cheesecake",
    "ice cream", "tiramisu", "panna cotta", "creme brulee", "crème brûlée",
    "pavlova", "lemon tart", "apple pie", "carrot cake", "banana bread",
    "waffle", "pancake", "churro", "mochi", "cinnamon roll", "red velvet",
    "macaron", "baklava", "gulab jamun", "kheer", "halwa", "jalebi",
    "rasgulla", "payasam", "pongal sweet", "watalappam", "wattalappam",
    "kavum", "kokis", "aluwa", "bibikkan", "dodol sri", "pani pol",
    "love cake", "christmas cake sri", "milk toffee sri", "thala guli",
    "aggala", "mung kavum", "puhul dosi", "kalu dodol", "tres leches",
    "black forest", "mousse", "custard", "pudding", "gelato", "sorbet",
    "profiterole", "eclair", "cannoli", "sfogliatella", "tarte tatin",
    "sticky toffee", "bread pudding", "rice pudding", "chia pudding",
    "fruit tart", "napoleon", "mille feuille", "opera cake",
]


def is_sri_lankan(title: str, text_chunk: str) -> bool:
    combined = (title + " " + text_chunk).lower()
    return any(kw in combined for kw in SL_KEYWORDS)


def is_popular_dessert(title: str) -> bool:
    tl = title.lower()
    return any(kw in tl for kw in POPULAR_DESSERTS)


def get_meal_type(text_chunk: str) -> str:
    m = re.search(r"meal type:\s*([^\n.]+)", text_chunk, re.IGNORECASE)
    return m.group(1).strip().lower() if m else ""


def should_keep(row: dict) -> tuple[bool, str]:
    title      = row.get("title", "")
    text_chunk = row.get("text_chunk", "")
    
    try:
        protein = float(row.get("protein") or 0)
        calories = float(row.get("calories") or 0)
    except ValueError:
        protein, calories = 0.0, 0.0

    meal_type = get_meal_type(text_chunk)
    sl        = is_sri_lankan(title, text_chunk)

    # Rule 1 & 2: always keep Sri Lankan
    if sl:
        return True, "sri_lankan"

    # Rule 3: remove low-protein sauces/condiments
    if ("sauce" in meal_type or "condiment" in meal_type) and protein < 5:
        return False, "sauce_no_protein"

    # Rule 4: dessert logic
    if "dessert" in meal_type:
        if protein >= 10:
            return True, "high_protein_dessert"
        if is_popular_dessert(title):
            return True, "popular_dessert"
        return False, "low_protein_dessert"

    # Rule 5: keep everything else with protein >= 10g
    if protein >= 10:
        return True, "high_protein"

    # Rule 1: remove low-protein non-SL rows
    return False, "low_protein_non_sl"


def main():
    input_path  = Path(INPUT_CSV)
    output_path = Path(OUTPUT_CSV)

    if not input_path.exists():
        print(f"ERROR: {INPUT_CSV} not found. Place it in the same folder as this script.")
        return

    kept = []
    removed_counts = {}
    total = 0

    print(f"Reading {INPUT_CSV}...")
    with open(input_path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        for row in reader:
            total += 1
            keep, reason = should_keep(row)
            if keep:
                kept.append(row)
            else:
                removed_counts[reason] = removed_counts.get(reason, 0) + 1

    print(f"\nFiltering complete:")
    print(f"  Total input rows : {total:,}")
    print(f"  Rows kept        : {len(kept):,}")
    print(f"  Rows removed     : {total - len(kept):,}")
    print(f"\n  Removal reasons:")
    for reason, count in sorted(removed_counts.items(), key=lambda x: -x[1]):
        print(f"    {reason:<30} {count:>5}")

    # Count Sri Lankan rows kept
    sl_count = sum(1 for r in kept if is_sri_lankan(r["title"], r["text_chunk"]))
    print(f"\n  Sri Lankan rows kept : {sl_count:,}")

    print(f"\nWriting {OUTPUT_CSV}...")
    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(kept)

    print(f"Done. {OUTPUT_CSV} saved with {len(kept):,} rows.")
    print(f"\nNEXT STEP: Run step2_add_columns.py")


if __name__ == "__main__":
    main()
