import Workout from "../models/Workout.js";
import { buildWorkoutPayload, validateWorkoutPayload } from "../utils/workoutValidation.js";

const sendWriteError = (res, err) => {
  if (err?.name === "ValidationError" || err?.name === "CastError") {
    return res.status(400).json({ error: err.message });
  }

  return res.status(500).json({ error: err.message });
};

export const getAllWorkouts = async (req, res) => {
  try {
    const workouts = await Workout.find().sort({ createdAt: -1 });
    res.json(workouts);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

export const createWorkout = async (req, res) => {
  try {
    const payload = buildWorkoutPayload(req.body);
    const validationError = validateWorkoutPayload(payload);
    if (validationError) return res.status(400).json({ error: validationError });

    const workout = new Workout(payload);
    await workout.save();
    res.status(201).json(workout);
  } catch (err) { sendWriteError(res, err); }
};

export const updateWorkout = async (req, res) => {
  try {
    const payload = buildWorkoutPayload(req.body);
    const validationError = validateWorkoutPayload(payload);
    if (validationError) return res.status(400).json({ error: validationError });

    const workout = await Workout.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true });
    if (!workout) return res.status(404).json({ error: "Workout not found" });
    res.json(workout);
  } catch (err) { sendWriteError(res, err); }
};

export const deleteWorkout = async (req, res) => {
  try {
    const workout = await Workout.findByIdAndDelete(req.params.id);
    if (!workout) return res.status(404).json({ error: "Workout not found" });
    res.json({ message: "Workout deleted" });
  } catch (err) { sendWriteError(res, err); }
};
