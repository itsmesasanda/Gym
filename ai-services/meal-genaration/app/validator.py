"""
validator.py
────────────
Standalone validation helpers.
Keeps business-rule validation separate from Pydantic schema definitions
so it can be reused in scripts (e.g. ingest.py) and unit tests.
"""

from dataclasses import dataclass
from typing import Optional
import logging

logger = logging.getLogger(__name__)


@dataclass
class ValidationResult:
    valid: bool
    errors: list[str]
    warnings: list[str]

    def raise_if_invalid(self):
        if not self.valid:
            raise ValueError("; ".join(self.errors))


def validate_macro_inputs(
    calories: float,
    protein: Optional[float] = None,
    fat: Optional[float] = None,
) -> ValidationResult:
    """
    Business-rule validation for macro inputs beyond Pydantic's type checks.

    Rules
    ─────
    1. Calories must be between 50 and 5000.
    2. Protein * 4 must not exceed calories.
    3. Fat * 9 must not exceed calories.
    4. Combined protein + fat calories must not exceed total calories.
    5. Warn if protein > 2.5 g per 100 kcal (unusually high).
    """
    errors: list[str] = []
    warnings: list[str] = []

    # Rule 1 — calorie range (belt-and-suspenders beyond Pydantic)
    if not (50 < calories < 5000):
        errors.append(f"Calories ({calories}) must be between 50 and 5000 kcal.")

    if protein is not None:
        protein_kcal = protein * 4

        # Rule 2
        if protein_kcal > calories:
            errors.append(
                f"Protein ({protein}g = {protein_kcal} kcal) exceeds "
                f"total calories ({calories} kcal)."
            )

        # Rule 5 — warning only
        if calories > 0 and (protein / calories * 100) > 2.5:
            warnings.append(
                f"Protein target ({protein}g per {calories} kcal) is unusually high. "
                "Results may be limited."
            )

    if fat is not None:
        fat_kcal = fat * 9

        # Rule 3
        if fat_kcal > calories:
            errors.append(
                f"Fat ({fat}g = {fat_kcal} kcal) exceeds "
                f"total calories ({calories} kcal)."
            )

    # Rule 4 — combined
    if protein is not None and fat is not None:
        combined_kcal = (protein * 4) + (fat * 9)
        if combined_kcal > calories:
            errors.append(
                f"Combined protein + fat calories ({combined_kcal} kcal) "
                f"exceed total ({calories} kcal). "
                "Leave some room for carbohydrates."
            )

    if errors:
        logger.warning(f"Validation failed: {errors}")
    if warnings:
        logger.info(f"Validation warnings: {warnings}")

    return ValidationResult(valid=len(errors) == 0, errors=errors, warnings=warnings)


def validate_csv_row(row: dict) -> ValidationResult:
    """
    Validate a single row from rag_ready_dataset.csv during ingestion.
    Ensures required fields are present and numeric fields are parseable.
    """
    errors: list[str] = []
    warnings: list[str] = []

    required_fields = ["doc_id", "title", "calories", "protein", "fat", "sodium", "text_chunk"]
    for field in required_fields:
        if field not in row or row[field] is None or str(row[field]).strip() == "":
            errors.append(f"Missing required field: '{field}'")

    numeric_fields = {"calories": (0, 10000), "protein": (0, 500), "fat": (0, 500), "sodium": (0, 50000)}
    for field, (lo, hi) in numeric_fields.items():
        if field in row:
            try:
                val = float(row[field])
                if not (lo <= val <= hi):
                    warnings.append(f"Field '{field}' value {val} is outside expected range [{lo}, {hi}].")
            except (ValueError, TypeError):
                errors.append(f"Field '{field}' is not numeric: {row[field]!r}")

    if "text_chunk" in row and len(str(row.get("text_chunk", ""))) < 10:
        errors.append("text_chunk is too short to be meaningful.")

    return ValidationResult(valid=len(errors) == 0, errors=errors, warnings=warnings)
