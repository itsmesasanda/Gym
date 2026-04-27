const mongoose = require('mongoose');

const MealSchema = new mongoose.Schema({
  name: { type: String, required: true },
  calories: { type: Number },
  date: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Meal', MealSchema);
