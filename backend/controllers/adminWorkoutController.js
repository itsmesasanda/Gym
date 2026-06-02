import Workout from "../models/Workout.js";
import { buildWorkoutPayload, validateWorkoutPayload } from "../utils/workoutValidation.js";

// Admin sees ALL workouts across all users, not scoped to one email.

export const adminGetAllWorkouts = async (req, res) => {
  try {
    const workouts = await Workout.find().sort({ createdAt: -1 }).limit(500);
    res.json(workouts);
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const adminCreateWorkout = async (req, res) => {
  try {
    const payload = buildWorkoutPayload(req.body);
    const validationError = validateWorkoutPayload(payload);
    if (validationError) return res.status(400).json({ error: validationError });

    const workout = new Workout({ ...payload, userEmail: req.admin.email });
    await workout.save();
    res.status(201).json(workout);
  } catch (err) {
    if (err?.name === "ValidationError" || err?.name === "CastError") {
      return res.status(400).json({ error: "Invalid workout data" });
    }
    res.status(500).json({ error: "Internal server error" });
  }
};

export const adminUpdateWorkout = async (req, res) => {
  try {
    const payload = buildWorkoutPayload(req.body);
    const validationError = validateWorkoutPayload(payload);
    if (validationError) return res.status(400).json({ error: validationError });

    const updated = await Workout.findByIdAndUpdate(
      req.params.id,
      payload,
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ error: "Workout not found" });
    res.json(updated);
  } catch (err) {
    if (err?.name === "ValidationError" || err?.name === "CastError") {
      return res.status(400).json({ error: "Invalid workout data" });
    }
    res.status(500).json({ error: "Internal server error" });
  }
};

export const adminDeleteWorkout = async (req, res) => {
  try {
    const workout = await Workout.findByIdAndDelete(req.params.id);
    if (!workout) return res.status(404).json({ error: "Workout not found" });
    res.json({ message: "Workout deleted" });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
};
