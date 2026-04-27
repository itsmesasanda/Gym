import express from "express";
import mongoose from "mongoose";

const router = express.Router();

// ── Goal Schema ───────────────────────────────────────────────────────────
const GoalSchema = new mongoose.Schema({
  name: String,
  target: String,
  current: { weight: Number, reps: Number, sets: Number },
  progress: Number,
  email: { type: String, default: null },
});
GoalSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
  }
});
const Goal = mongoose.models.Goal || mongoose.model('Goal', GoalSchema);

// ── Body Measurement Schema ──────────────────────────────────────────────
const BodyMeasurementSchema = new mongoose.Schema({
  date: String,
  weight: Number,
  bodyFat: Number,
  waist: Number,
  height: Number,
  bmi: Number,
  email: { type: String, default: null },
});
BodyMeasurementSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
  }
});
const BodyMeasurement = mongoose.models.BodyMeasurement || mongoose.model('BodyMeasurement', BodyMeasurementSchema);

// ── Goals Endpoints ──────────────────────────────────────────────────────

router.get('/goals', async (req, res) => {
  try {
    const filter = req.query.email ? { email: req.query.email } : {};
    const goals = await Goal.find(filter);
    res.json(goals);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/goals', async (req, res) => {
  try {
    const goal = new Goal(req.body);
    await goal.save();
    res.json(goal);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/goals/:id', async (req, res) => {
  try {
    const goal = await Goal.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!goal) return res.status(404).json({ message: 'Goal not found' });
    res.json(goal);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/goals/:id', async (req, res) => {
  try {
    await Goal.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Measurements Endpoints ───────────────────────────────────────────────

router.get('/measurements', async (req, res) => {
  try {
    const filter = req.query.email ? { email: req.query.email } : {};
    const measurements = await BodyMeasurement.find(filter).sort({ date: -1 });
    res.json(measurements);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/measurements', async (req, res) => {
  try {
    const measurement = new BodyMeasurement(req.body);
    await measurement.save();
    res.json(measurement);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/measurements/:id', async (req, res) => {
  try {
    const measurement = await BodyMeasurement.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!measurement) return res.status(404).json({ message: 'Measurement not found' });
    res.json(measurement);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/measurements/:id', async (req, res) => {
  try {
    await BodyMeasurement.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
