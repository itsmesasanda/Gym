import BodyMeasurement from "../models/BodyMeasurement.js";
import Goal from "../models/Goal.js";

// ── Measurements ──────────────────────────────────────────────────────────────

export const getMeasurements = async (req, res) => {
  try {
    const measurements = await BodyMeasurement.find().sort({ date: -1 });
    res.json(measurements);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

export const createMeasurement = async (req, res) => {
  try {
    const measurement = new BodyMeasurement(req.body);
    await measurement.save();
    res.status(201).json(measurement);
  } catch (err) { res.status(400).json({ error: err.message }); }
};

export const updateMeasurement = async (req, res) => {
  try {
    const measurement = await BodyMeasurement.findByIdAndUpdate(
      req.params.id, req.body, { new: true, runValidators: true }
    );
    if (!measurement) return res.status(404).json({ error: "Measurement not found" });
    res.json(measurement);
  } catch (err) { res.status(400).json({ error: err.message }); }
};

export const deleteMeasurement = async (req, res) => {
  try {
    const measurement = await BodyMeasurement.findByIdAndDelete(req.params.id);
    if (!measurement) return res.status(404).json({ error: "Measurement not found" });
    res.json({ success: true });
  } catch (err) { res.status(400).json({ error: err.message }); }
};

// ── Goals ─────────────────────────────────────────────────────────────────────

export const getGoals = async (req, res) => {
  try {
    const goals = await Goal.find().sort({ createdAt: -1 });
    res.json(goals);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

export const createGoal = async (req, res) => {
  try {
    const goal = new Goal(req.body);
    await goal.save();
    res.status(201).json(goal);
  } catch (err) { res.status(400).json({ error: err.message }); }
};

export const updateGoal = async (req, res) => {
  try {
    const goal = await Goal.findByIdAndUpdate(
      req.params.id, req.body, { new: true, runValidators: true }
    );
    if (!goal) return res.status(404).json({ error: "Goal not found" });
    res.json(goal);
  } catch (err) { res.status(400).json({ error: err.message }); }
};

export const deleteGoal = async (req, res) => {
  try {
    const goal = await Goal.findByIdAndDelete(req.params.id);
    if (!goal) return res.status(404).json({ error: "Goal not found" });
    res.json({ success: true });
  } catch (err) { res.status(400).json({ error: err.message }); }
};
