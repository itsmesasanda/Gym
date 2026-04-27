import mongoose from "mongoose";
import { MUSCLE_GROUPS, normalizeMuscleGroup } from "../utils/workoutValidation.js";

const SetSchema = new mongoose.Schema({
  reps:   { type: Number, required: true, min: 6, max: 15 },
  weight: { type: Number, required: true, min: 0 },
}, { _id: false });

const WorkoutSchema = new mongoose.Schema({
  exerciseName: { type: String, required: true, trim: true, minlength: 2, maxlength: 50 },
  muscleGroup:  {
    type: String,
    required: true,
    enum: MUSCLE_GROUPS,
    set: (value) => normalizeMuscleGroup(value) || value,
  },
  sets: {
    type: [SetSchema],
    required: true,
    validate: {
      validator: (sets) => Array.isArray(sets) && sets.length >= 1 && sets.length <= 4,
      message: "Sets must include 1-4 items",
    },
  },
  duration:     {
    type: Number,
    min: 0,
    default: 0,
    validate: {
      validator: (value) => value === undefined || value === null || value === 0 || value >= 5,
      message: "Duration must be 0 or at least 5 minutes",
    },
  },
  notes:        { type: String, trim: true, maxlength: 500, default: "" },
  date:         { type: String },
  time:         { type: String },
}, { timestamps: true });

const Workout = mongoose.model("Workout", WorkoutSchema);

export default Workout;
