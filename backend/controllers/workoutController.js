import Workout from "../models/Workout.js";
import { buildWorkoutPayload, validateWorkoutPayload } from "../utils/workoutValidation.js";

export const getAllWorkouts = async (req, res) => {
  try {
    const workouts = await Workout.find({ userEmail: req.user.email }).sort({ createdAt: -1 });
    res.json(workouts);
  } catch {
    res.status(500).json({ error: "Could not retrieve workouts" });
  }
};

export const createWorkout = async (req, res) => {
  try {
    const payload = buildWorkoutPayload(req.body);
    const validationError = validateWorkoutPayload(payload);
    if (validationError) return res.status(400).json({ error: validationError });

    const workout = new Workout({ ...payload, userEmail: req.user.email });
    await workout.save();
    res.status(201).json(workout);
  } catch (err) {
    if (err?.name === "ValidationError" || err?.name === "CastError") {
      return res.status(400).json({ error: "Invalid workout data" });
    }
    res.status(500).json({ error: "Could not save workout" });
  }
};

export const updateWorkout = async (req, res) => {
  try {
    const workout = await Workout.findById(req.params.id);
    if (!workout) return res.status(404).json({ error: "Workout not found" });
    if (workout.userEmail !== req.user.email) return res.status(403).json({ error: "Forbidden" });

    const payload = buildWorkoutPayload(req.body);
    const validationError = validateWorkoutPayload(payload);
    if (validationError) return res.status(400).json({ error: validationError });

    const updated = await Workout.findByIdAndUpdate(
      req.params.id,
      { ...payload, userEmail: req.user.email },
      { new: true, runValidators: true }
    );
    res.json(updated);
  } catch (err) {
    if (err?.name === "ValidationError" || err?.name === "CastError") {
      return res.status(400).json({ error: "Invalid workout data" });
    }
    res.status(500).json({ error: "Could not update workout" });
  }
};

export const deleteWorkout = async (req, res) => {
  try {
    const workout = await Workout.findById(req.params.id);
    if (!workout) return res.status(404).json({ error: "Workout not found" });
    if (workout.userEmail !== req.user.email) return res.status(403).json({ error: "Forbidden" });

    await workout.deleteOne();
    res.json({ message: "Workout deleted" });
  } catch {
    res.status(500).json({ error: "Could not delete workout" });
  }
};
