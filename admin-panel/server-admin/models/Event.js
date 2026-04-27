const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  description: { type: String },
  date:        { type: String },
  time:        { type: String },
  location:    { type: String },
  type:        { type: String, default: 'General' },
}, { timestamps: true });

module.exports = mongoose.model('Event', EventSchema);
