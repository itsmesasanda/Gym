import mongoose from "mongoose";

const SetSchema = new mongoose.Schema({
  reps:   { type: Number, default: 0 },
  weight: { type: Number, default: 0 },
}, { _id: false });

const WorkoutSchema = new mongoose.Schema({
  exerciseName: { type: String, required: true },
  muscleGroup:  { type: String, default: "General" },
  sets:         [SetSchema],
  duration:     { type: Number },
  notes:        { type: String },
  date:         { type: String },
  time:         { type: String },
}, { timestamps: true });

const Workout = mongoose.model("Workout", WorkoutSchema);

export default Workout;