import mongoose from "mongoose";

const ExerciseSchema = new mongoose.Schema({
  name:      { type: String, required: true },
  sets:      { type: Number, required: true },
  reps:      { type: String, required: true },
  rest_secs: { type: Number, default: null },
  notes:     { type: String, default: null },
}, { _id: false });

const WorkoutDaySchema = new mongoose.Schema({
  day_number: { type: Number, required: true },
  focus:      { type: String, required: true },
  exercises:  { type: [ExerciseSchema], default: [] },
}, { _id: false });

const ValidationSchema = new mongoose.Schema({
  score:    { type: Number, default: null },
  valid:    { type: Boolean, default: null },
  warnings: { type: [String], default: [] },
  errors:   { type: [String], default: [] },
}, { _id: false });

const WorkoutPlanSchema = new mongoose.Schema({
  userEmail:          { type: String, required: true, index: true },
  title:              { type: String, required: true },
  goal:               { type: String, required: true },
  days:               { type: [WorkoutDaySchema], required: true },
  validation:         { type: ValidationSchema, default: () => ({}) },
  injury:             { type: String, default: "none" },     // category sent to RAG
  injuryDescription:  { type: String, default: "" },          // user's original words
}, {
  timestamps: true,
});

const WorkoutPlan = mongoose.model("WorkoutPlan", WorkoutPlanSchema);

export default WorkoutPlan;
