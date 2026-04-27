from pydantic import BaseModel, Field, field_validator, model_validator
from typing import Optional
from enum import Enum


# ── Enums ──────────────────────────────────────────────────────────────────────

class GoalType(str, Enum):
    weight_loss   = "weight_loss"
    muscle_gain   = "muscle_gain"
    maintenance   = "maintenance"
    high_protein  = "high_protein"
    low_carb      = "low_carb"


# ── Request ────────────────────────────────────────────────────────────────────

class RecommendRequest(BaseModel):
    """
    Body for POST /recommend.
    Only calories is required; all other fields refine the search.
    """

    calories: float = Field(
        ...,
        gt=50,
        lt=5000,
        description="Target calories per meal (kcal). Must be between 50 and 5000.",
        examples=[500],
    )
    protein: Optional[float] = Field(
        default=None,
        ge=0,
        le=500,
        description="Minimum protein target (grams). Optional.",
        examples=[30],
    )
    fat: Optional[float] = Field(
        default=None,
        ge=0,
        le=300,
        description="Target fat (grams). Optional.",
        examples=[15],
    )
    carbs: Optional[float] = Field(
        default=None,
        ge=0,
        le=800,
        description="Target carbohydrates (grams). Optional.",
        examples=[60],
    )
    context: Optional[str] = Field(
        default=None,
        max_length=300,
        description="Free-text context, e.g. 'post-workout, no dairy, high fibre'.",
        examples=["post-workout, high protein, no dairy"],
    )
    goal: Optional[GoalType] = Field(
        default=None,
        description="Fitness goal to guide meal selection. Optional.",
        examples=["muscle_gain"],
    )

    # ── Field-level validators ─────────────────────────────────────────────────

    @field_validator("calories")
    @classmethod
    def calories_must_be_realistic(cls, v: float) -> float:
        if v != int(v) and abs(v - round(v)) > 0.01:
            # Allow decimals but flag suspiciously precise values
            pass
        return round(v, 1)

    @field_validator("protein", "fat", "carbs", mode="before")
    @classmethod
    def coerce_none_string(cls, v):
        """Treat empty string as None so frontend can send '' safely."""
        if v == "" or v == "null":
            return None
        return v

    @field_validator("context", mode="before")
    @classmethod
    def strip_context(cls, v):
        if isinstance(v, str):
            return v.strip() or None
        return v

    # ── Cross-field validator ──────────────────────────────────────────────────

    @model_validator(mode="after")
    def protein_calories_ratio(self) -> "RecommendRequest":
        """
        Warn (not block) if protein alone would exceed declared calories.
        4 kcal per gram of protein.
        """
        if self.protein and (self.protein * 4 > self.calories):
            raise ValueError(
                f"Protein ({self.protein}g × 4 = {self.protein * 4} kcal) "
                f"exceeds declared calories ({self.calories} kcal). "
                "Please check your values."
            )
        return self

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "calories": 500,
                    "protein": 35,
                    "fat": 15,
                    "carbs": 60,
                    "context": "post-workout, no dairy",
                    "goal": "muscle_gain",
                }
            ]
        }
    }


# ── Response models ────────────────────────────────────────────────────────────

class MealResult(BaseModel):
    rank: int = Field(description="Position in recommendation list (1–5)")
    title: str = Field(description="Recipe name")
    calories: float = Field(description="Calories (kcal)")
    protein: float = Field(description="Protein (g)")
    fat: float = Field(description="Fat (g)")
    carbs: float = Field(default=0, description="Carbohydrates (g)")
    sodium: float = Field(description="Sodium (mg)")
    serving_size_g: float = Field(default=0, description="Estimated serving size in grams")
    rating: float = Field(description="Recipe rating out of 5")
    calorie_match_pct: int = Field(description="How closely calories match the target (%)")
    why_recommended: str = Field(description="One-sentence explanation of fit")


class PipelineMetadata(BaseModel):
    candidates_retrieved: int = Field(description="Number of recipes fetched from Pinecone")
    pipeline_duration_ms: int = Field(description="End-to-end latency in milliseconds")
    query_text: str = Field(description="The text string that was embedded")
    model: str = Field(description="LLM used for generation")


class RecommendResponse(BaseModel):
    success: bool = True
    meals: list[MealResult]
    metadata: PipelineMetadata

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "success": True,
                    "meals": [
                        {
                            "rank": 1,
                            "title": "Lentil, Apple, and Turkey Wrap",
                            "calories": 426,
                            "protein": 30,
                            "fat": 7,
                            "carbs": 52,
                            "sodium": 559,
                            "serving_size_g": 350,
                            "rating": 2.5,
                            "calorie_match_pct": 95,
                            "why_recommended": "High protein wrap that closely matches your 500 kcal target.",
                        }
                    ],
                    "metadata": {
                        "candidates_retrieved": 15,
                        "pipeline_duration_ms": 4200,
                        "query_text": "Meal recommendation for 500 calories with 35g protein",
                        "model": "llama-3.3-70b-versatile",
                    },
                }
            ]
        }
    }


# ── Health response ────────────────────────────────────────────────────────────

class HealthResponse(BaseModel):
    status: str = Field(examples=["ok"])
    pinecone_vectors: int = Field(description="Total vectors indexed in Pinecone")
    pinecone_index: str
    embed_model: str
    generation_model: str


# ── Error response ─────────────────────────────────────────────────────────────

class ErrorDetail(BaseModel):
    field: Optional[str] = None
    message: str


class ErrorResponse(BaseModel):
    success: bool = False
    errors: list[ErrorDetail]
