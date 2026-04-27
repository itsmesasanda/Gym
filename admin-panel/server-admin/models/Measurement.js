const mongoose = require('mongoose');

const measurementSchema = new mongoose.Schema({
  date: { type: String, required: true }, // Store as YYYY-MM-DD
  weight: { type: Number, required: true },
  bodyFat: { type: Number, required: true },
  waist: { type: Number, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Measurement', measurementSchema);
