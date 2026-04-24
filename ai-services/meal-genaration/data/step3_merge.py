"""
step3_merge.py
──────────────
Merges the filtered+enriched dataset with the new Sri Lankan recipes CSV
from ChatGPT (sl_recipes.csv), renumbers all doc_ids sequentially,
sorts Sri Lankan rows first, and saves the final dataset.

Run: python step3_merge.py
"""

import csv
import re
from pathlib import Path

MAIN_CSV   = "with_columns_dataset.csv"
SL_CSV     = "full_fitfood_dataset.csv"        # output from ChatGPT
OUTPUT_CSV = "final_dataset.csv"

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
    "palmyrah", "jackfruit curry sri", "sothi", "adikoozh",
    "ulundu", "murukku", "isso wade", "kithul", "wood apple", "faluda",
    "kalu dodol", "love cake", "christmas cake sri", "puhul dosi",
    "konda kavum", "undu walalu", "adhirasam", "avial", "kootu",
    "godamba", "urumas", "karawala", "karawila", "murunga", "kesel muwa",
    "alu kesel", "maa dhal", "kukul mas", "devilled chicken sri",
    "black pork curry", "sothi jaffna", "ven pongal sri",
]


def is_sri_lankan(title: str, text_chunk: str) -> bool:
    combined = (title + " " + text_chunk).lower()
    return any(kw in combined for kw in SL_KEYWORDS)


def normalize_row(row: dict, expected_fields: list) -> dict:
    """Ensure row has all expected fields, filling missing ones with 0.0 or empty."""
    for field in expected_fields:
        if field not in row:
            row[field] = "0.0" if field in ("carbohydrates", "fibre") else ""
    return row


def main():
    main_path   = Path(MAIN_CSV)
    sl_path     = Path(SL_CSV)
    output_path = Path(OUTPUT_CSV)

    if not main_path.exists():
        print(f"ERROR: {MAIN_CSV} not found. Run step2_add_columns.py first.")
        return
    if not sl_path.exists():
        print(f"ERROR: {SL_CSV} not found.")
        print("       Paste the ChatGPT CSV output into a file called sl_recipes.csv")
        print("       in the same folder as this script, then re-run.")
        return

    # Read main dataset
    print(f"Reading {MAIN_CSV}...")
    with open(main_path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        fields = reader.fieldnames or []
        main_rows = [normalize_row(dict(r), fields) for r in reader]

    # Read SL recipes
    print(f"Reading {SL_CSV}...")
    with open(sl_path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        sl_rows_raw = [dict(r) for r in reader]

    # Normalize SL rows to same field set
    sl_rows = [normalize_row(r, fields) for r in sl_rows_raw]

    # Deduplicate: remove SL rows whose titles already exist in main dataset
    existing_titles = {r.get("title", "").strip().lower() for r in main_rows}
    new_sl = []
    skipped_dupes = 0
    for row in sl_rows:
        title = row.get("title", "").strip().lower()
        if title in existing_titles:
            skipped_dupes += 1
        else:
            new_sl.append(row)
            existing_titles.add(title)

    print(f"  SL recipes in file      : {len(sl_rows_raw):,}")
    print(f"  Duplicates skipped      : {skipped_dupes:,}")
    print(f"  New SL recipes added    : {len(new_sl):,}")

    # Merge
    all_rows = main_rows + new_sl
    print(f"\nTotal rows before sorting : {len(all_rows):,}")

    # Tag each row
    sl_rows_final    = [r for r in all_rows if is_sri_lankan(r.get("title",""), r.get("text_chunk",""))]
    other_rows_final = [r for r in all_rows if not is_sri_lankan(r.get("title",""), r.get("text_chunk",""))]

    # Sort each group alphabetically by title
    sl_rows_final.sort(key=lambda r: r.get("title", "").lower())
    other_rows_final.sort(key=lambda r: r.get("title", "").lower())

    # Sri Lankan majority check
    total = len(all_rows)
    sl_count = len(sl_rows_final)
    sl_pct = sl_count / total * 100 if total else 0
    print(f"\nSri Lankan rows : {sl_count:,} / {total:,} ({sl_pct:.1f}%)")
    if sl_pct < 50:
        print("  WARNING: Sri Lankan recipes are less than 50% of the dataset.")
        print("  Consider asking ChatGPT for more SL recipes and re-running.")
    else:
        print("  Sri Lankan majority achieved.")

    # Reassign doc_ids sequentially, SL first
    sorted_rows = sl_rows_final + other_rows_final
    for i, row in enumerate(sorted_rows):
        row["doc_id"] = f"doc_{i:05d}"

    # Write output
    print(f"\nWriting {OUTPUT_CSV}...")
    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fields, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(sorted_rows)

    print(f"\n{'='*50}")
    print(f"FINAL DATASET SUMMARY")
    print(f"{'='*50}")
    print(f"  Total rows      : {total:,}")
    print(f"  Sri Lankan      : {sl_count:,} ({sl_pct:.1f}%)")
    print(f"  Other           : {len(other_rows_final):,}")
    print(f"  Output file     : {OUTPUT_CSV}")
    print(f"{'='*50}")
    print(f"\nNEXT STEP: Run step4_validate.py to check everything is correct.")


if __name__ == "__main__":
    main()
