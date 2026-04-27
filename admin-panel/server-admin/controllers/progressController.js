const Goal = require('../models/Goal');
const Measurement = require('../models/Measurement');

// ─── GOALS ───────────────────────────────────────────────

exports.getGoals = async (req, res) => {
  try {
    const goals = await Goal.find().sort({ createdAt: -1 });
    res.json(goals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createGoal = async (req, res) => {
  try {
    const goal = new Goal(req.body);
    await goal.save();
    res.status(201).json(goal);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updateGoal = async (req, res) => {
  try {
    const goal = await Goal.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!goal) return res.status(404).json({ message: 'Goal not found' });
    res.json(goal);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deleteGoal = async (req, res) => {
  try {
    const goal = await Goal.findByIdAndDelete(req.params.id);
    if (!goal) return res.status(404).json({ message: 'Goal not found' });
    res.json({ message: 'Goal deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─── MEASUREMENTS ────────────────────────────────────────

exports.getMeasurements = async (req, res) => {
  try {
    const measurements = await Measurement.find().sort({ date: -1 });
    res.json(measurements);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createMeasurement = async (req, res) => {
  try {
    const measurement = new Measurement(req.body);
    await measurement.save();
    res.status(201).json(measurement);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updateMeasurement = async (req, res) => {
  try {
    const measurement = await Measurement.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!measurement) return res.status(404).json({ message: 'Measurement not found' });
    res.json(measurement);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deleteMeasurement = async (req, res) => {
  try {
    const measurement = await Measurement.findByIdAndDelete(req.params.id);
    if (!measurement) return res.status(404).json({ message: 'Measurement not found' });
    res.json({ message: 'Measurement deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
