"""
step4_validate.py
─────────────────
Runs a full quality check on final_dataset.csv and prints a report.
No files are modified — read-only audit.

Run: python step4_validate.py
"""

import csv
import re
from pathlib import Path
from collections import Counter

INPUT_CSV = "final_dataset.csv"

SL_KEYWORDS = [
    "sri lankan", "sri lanka", "ceylon", "kottu", "hoppers", "hopper",
    "string hopper", "pol sambol", "kiribath", "pittu", "lamprais",
    "wambatu", "polos", "isso", "kukul", "ambulthiyal", "kiri bath",
    "wattalappam", "watalappan", "kavum", "kokis", "aluwa", "dodol",
    "seeni sambol", "lunu miris", "gotukola", "kanji", "rasam", "parippu",
    "dhal curry", "dal curry", "jaffna", "colombo curry", "coconut roti",
    "thosai", "idiyappam", "appam", "vadai", "rice and curry", "milk rice",
    "pani pol", "bibikkan", "lavariya", "aggala", "thala guli", "mung kavum",
    "indi appa", "pol roti", "gothambu", "kurakkan", "jackfruit curry sri",
    "sothi", "adikoozh", "ulundu", "murukku", "isso wade", "kithul",
    "wood apple", "faluda", "kalu dodol", "love cake", "puhul dosi",
    "konda kavum", "undu walalu", "adhirasam", "avial", "kootu",
    "godamba", "urumas", "karawala", "karawila", "murunga",
]

REQUIRED_COLUMNS = [
    "doc_id", "title", "calories", "protein", "fat",
    "sodium", "carbohydrates", "fibre", "rating", "text_chunk"
]

EXPECTED_POPULAR_DESSERTS = [
    "chocolate cake", "cheesecake", "brownie", "tiramisu",
    "pavlova", "apple pie", "carrot cake", "banana bread",
    "gulab jamun", "kheer", "wattalappam",
]


def is_sri_lankan(title, text_chunk):
    combined = (title + " " + text_chunk).lower()
    return any(kw in combined for kw in SL_KEYWORDS)


def check(condition, label, fix=""):
    status = "PASS" if condition else "FAIL"
    line = f"  [{status}] {label}"
    if not condition and fix:
        line += f"\n         → {fix}"
    print(line)
    return condition


def main():
    path = Path(INPUT_CSV)
    if not path.exists():
        print(f"ERROR: {INPUT_CSV} not found. Run step3_merge.py first.")
        return

    rows = []
    with open(path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        actual_columns = reader.fieldnames or []
        for row in reader:
            rows.append(row)

    total = len(rows)
    passes = 0
    fails  = 0

    print(f"\n{'='*55}")
    print(f"  DATASET QUALITY REPORT — {INPUT_CSV}")
    print(f"{'='*55}")
    print(f"  Total rows : {total:,}")
    print(f"  Columns    : {', '.join(actual_columns)}")
    print()

    # ── Column checks ──────────────────────────────────────────────────────────
    print("── Column structure ──────────────────────────────────────")
    for col in REQUIRED_COLUMNS:
        r = check(col in actual_columns, f"Column '{col}' present",
                  f"Add column '{col}' and re-run step2 / step3")
        passes += r; fails += not r

    # ── Numeric checks ─────────────────────────────────────────────────────────
    print("\n── Numeric integrity ─────────────────────────────────────")
    zero_cal   = sum(1 for r in rows if float(r.get("calories") or 0) == 0)
    null_prot  = sum(1 for r in rows if r.get("protein","").strip() == "")
    null_carbs = sum(1 for r in rows if r.get("carbohydrates","").strip() == "")
    null_fibre = sum(1 for r in rows if r.get("fibre","").strip() == "")
    neg_carbs  = sum(1 for r in rows if float(r.get("carbohydrates") or 0) < 0)

    r = check(zero_cal == 0,   f"No zero-calorie rows (found {zero_cal})")
    passes += r; fails += not r
    r = check(null_prot == 0,  f"No null protein rows (found {null_prot})")
    passes += r; fails += not r
    r = check(null_carbs == 0, f"No null carbohydrate rows (found {null_carbs})")
    passes += r; fails += not r
    r = check(null_fibre == 0, f"No null fibre rows (found {null_fibre})")
    passes += r; fails += not r
    r = check(neg_carbs == 0,  f"No negative carb values (found {neg_carbs})")
    passes += r; fails += not r

    # ── doc_id checks ──────────────────────────────────────────────────────────
    print("\n── doc_id integrity ──────────────────────────────────────")
    doc_ids     = [r.get("doc_id","") for r in rows]
    expected    = [f"doc_{i:05d}" for i in range(total)]
    sequential  = doc_ids == expected
    duplicates  = len(doc_ids) - len(set(doc_ids))

    r = check(sequential,    f"doc_ids sequential (doc_00000 → doc_{total-1:05d})",
              "Re-run step3_merge.py to renumber")
    passes += r; fails += not r
    r = check(duplicates==0, f"No duplicate doc_ids (found {duplicates})",
              "Re-run step3_merge.py")
    passes += r; fails += not r

    # ── Sri Lankan checks ─────────────────────────────────────────────────────
    print("\n── Sri Lankan coverage ───────────────────────────────────")
    sl_rows   = [r for r in rows if is_sri_lankan(r.get("title",""), r.get("text_chunk",""))]
    sl_count  = len(sl_rows)
    sl_pct    = sl_count / total * 100 if total else 0

    r = check(sl_pct >= 50, f"Sri Lankan ≥ 50% of dataset ({sl_count:,} / {total:,} = {sl_pct:.1f}%)",
              "Ask ChatGPT for more SL recipes and re-run step3_merge.py")
    passes += r; fails += not r

    # Check SL rows come first
    first_non_sl = next(
        (i for i, row in enumerate(rows)
         if not is_sri_lankan(row.get("title",""), row.get("text_chunk",""))),
        total
    )
    r = check(first_non_sl >= sl_count,
              f"Sri Lankan rows sorted first (first non-SL row at index {first_non_sl})")
    passes += r; fails += not r

    # ── Popular dessert checks ─────────────────────────────────────────────────
    print("\n── Popular desserts present ──────────────────────────────")
    all_titles_lower = [r.get("title","").lower() for r in rows]
    for dessert in EXPECTED_POPULAR_DESSERTS:
        present = any(dessert in t for t in all_titles_lower)
        r = check(present, f"'{dessert}' present in dataset",
                  f"Manually add a '{dessert}' recipe or check filtering rules")
        passes += r; fails += not r

    # ── text_chunk checks ─────────────────────────────────────────────────────
    print("\n── text_chunk quality ────────────────────────────────────")
    missing_carbs_chunk = sum(
        1 for r in rows if "carbs" not in r.get("text_chunk","").lower()
    )
    missing_fibre_chunk = sum(
        1 for r in rows if "fibre" not in r.get("text_chunk","").lower()
    )
    r = check(missing_carbs_chunk == 0,
              f"All text_chunks include carbs info (missing: {missing_carbs_chunk})",
              "Re-run step2_add_columns.py")
    passes += r; fails += not r
    r = check(missing_fibre_chunk == 0,
              f"All text_chunks include fibre info (missing: {missing_fibre_chunk})",
              "Re-run step2_add_columns.py")
    passes += r; fails += not r

    # ── Summary stats ─────────────────────────────────────────────────────────
    print(f"\n── Dataset summary ───────────────────────────────────────")
    proteins   = [float(r.get("protein") or 0) for r in rows]
    calories   = [float(r.get("calories") or 0) for r in rows]
    carbs_list = [float(r.get("carbohydrates") or 0) for r in rows]

    high_prot = sum(1 for p in proteins if p >= 20)
    low_prot  = sum(1 for p in proteins if p < 10)

    print(f"  Avg calories       : {sum(calories)/len(calories):.0f} kcal")
    print(f"  Avg protein        : {sum(proteins)/len(proteins):.1f} g")
    print(f"  Avg carbs          : {sum(carbs_list)/len(carbs_list):.1f} g")
    print(f"  High protein (≥20g): {high_prot:,} rows ({high_prot/total*100:.1f}%)")
    print(f"  Low protein (<10g) : {low_prot:,} rows ({low_prot/total*100:.1f}%)")
    print(f"  Sri Lankan rows    : {sl_count:,} ({sl_pct:.1f}%)")

    # ── Final verdict ─────────────────────────────────────────────────────────
    print(f"\n{'='*55}")
    total_checks = passes + fails
    print(f"  RESULT: {passes}/{total_checks} checks passed", end="")
    if fails == 0:
        print(" ✓ Dataset is ready for ingestion!")
        print(f"\n  NEXT STEP: Copy final_dataset.csv to your RAG project folder")
        print(f"             and run: python ingest.py")
    else:
        print(f" — {fails} issue(s) need fixing")
        print(f"\n  Fix the FAIL items above and re-run this script.")
    print(f"{'='*55}\n")


if __name__ == "__main__":
    main()
