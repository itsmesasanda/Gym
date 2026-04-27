const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
  exerciseName: { type: String, required: true },
  targetKg: { type: Number, default: 0 },
  targetReps: { type: Number, default: 0 },
  targetSets: { type: Number, default: 0 },
  currentKg: { type: Number, default: 0 },
  currentReps: { type: Number, default: 0 },
  currentSets: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Goal', goalSchema);
