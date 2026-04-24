from pydantic import BaseModel, validator
from typing import Optional

class UserProfile(BaseModel):
    age:           int
    height:        float
    weight:        float
    goal:          str
    gender:        str = "any"
    injury: str = "none"

class Exercise(BaseModel):
    name:      str
    sets:      int
    reps:      str
    rest_secs: Optional[int] = None   # optional, won't break if missing
    notes:     Optional[str] = None

class WorkoutDay(BaseModel):
    day_number: int
    focus:      str
    exercises:  list[Exercise]

class WorkoutPlan(BaseModel):
    title: str
    goal:  str
    days:  list[WorkoutDay]

    @validator("days")
    def must_have_seven_days(cls, v):
        if len(v) != 7:
            raise ValueError(f"Expected 7 days, got {len(v)}")
        return v