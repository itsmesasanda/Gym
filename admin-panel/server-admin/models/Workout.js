const mongoose = require('mongoose');

const WorkoutSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  date:        { type: String },
  time:        { type: String },
  location:    { type: String },
  description: { type: String },
}, { timestamps: true, collection: 'events' }); // Uses the original collection

module.exports = mongoose.model('Workout', WorkoutSchema);
