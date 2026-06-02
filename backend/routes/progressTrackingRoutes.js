import express from "express";
import mongoose from "mongoose";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect); // all progress routes require auth

// ── Goal Schema ───────────────────────────────────────────────────
const GoalSchema = new mongoose.Schema({
  userEmail: { type: String, required: true, index: true },
  name:      String,
  target:    String,
  current:   { weight: Number, reps: Number, sets: Number },
  progress:  Number,
});
GoalSchema.set("toJSON", {
  virtuals: true, versionKey: false,
  transform: (doc, ret) => { ret.id = ret._id.toString(); delete ret._id; },
});
const Goal = mongoose.models.Goal || mongoose.model("Goal", GoalSchema);

// ── Measurement Schema ────────────────────────────────────────────
const BodyMeasurementSchema = new mongoose.Schema({
  userEmail: { type: String, required: true, index: true },
  date:      String,
  weight:    Number,
  bodyFat:   Number,
  waist:     Number,
  height:    Number,
  bmi:       Number,
});
BodyMeasurementSchema.set("toJSON", {
  virtuals: true, versionKey: false,
  transform: (doc, ret) => { ret.id = ret._id.toString(); delete ret._id; },
});
const BodyMeasurement = mongoose.models.BodyMeasurement || mongoose.model("BodyMeasurement", BodyMeasurementSchema);

// ── Goals ─────────────────────────────────────────────────────────
router.get("/goals", async (req, res) => {
  try {
    const goals = await Goal.find({ userEmail: req.user.email });
    res.json(goals);
  } catch { res.status(500).json({ message: "Could not retrieve goals" }); }
});

router.post("/goals", async (req, res) => {
  try {
    const goal = new Goal({ ...req.body, userEmail: req.user.email });
    await goal.save();
    res.json(goal);
  } catch { res.status(500).json({ message: "Could not save goal" }); }
});

router.put("/goals/:id", async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.id);
    if (!goal) return res.status(404).json({ message: "Goal not found" });
    if (goal.userEmail !== req.user.email) return res.status(403).json({ message: "Forbidden" });
    const updated = await Goal.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch { res.status(500).json({ message: "Could not update goal" }); }
});

router.delete("/goals/:id", async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.id);
    if (!goal) return res.status(404).json({ message: "Goal not found" });
    if (goal.userEmail !== req.user.email) return res.status(403).json({ message: "Forbidden" });
    await goal.deleteOne();
    res.json({ success: true });
  } catch { res.status(500).json({ message: "Could not delete goal" }); }
});

// ── Measurements ──────────────────────────────────────────────────
router.get("/measurements", async (req, res) => {
  try {
    const measurements = await BodyMeasurement.find({ userEmail: req.user.email }).sort({ date: -1 });
    res.json(measurements);
  } catch { res.status(500).json({ message: "Could not retrieve measurements" }); }
});

router.post("/measurements", async (req, res) => {
  try {
    const m = new BodyMeasurement({ ...req.body, userEmail: req.user.email });
    await m.save();
    res.json(m);
  } catch { res.status(500).json({ message: "Could not save measurement" }); }
});

router.put("/measurements/:id", async (req, res) => {
  try {
    const m = await BodyMeasurement.findById(req.params.id);
    if (!m) return res.status(404).json({ message: "Measurement not found" });
    if (m.userEmail !== req.user.email) return res.status(403).json({ message: "Forbidden" });
    const updated = await BodyMeasurement.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch { res.status(500).json({ message: "Could not update measurement" }); }
});

router.delete("/measurements/:id", async (req, res) => {
  try {
    const m = await BodyMeasurement.findById(req.params.id);
    if (!m) return res.status(404).json({ message: "Measurement not found" });
    if (m.userEmail !== req.user.email) return res.status(403).json({ message: "Forbidden" });
    await m.deleteOne();
    res.json({ success: true });
  } catch { res.status(500).json({ message: "Could not delete measurement" }); }
});

export default router;
