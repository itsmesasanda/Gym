const mongoose = require('mongoose');

const AnnouncementSchema = new mongoose.Schema({
  title:    { type: String, required: true },
  body:     { type: String },
  date:     { type: String },
  pinned:   { type: Boolean, default: false },
  priority: { type: String, default: 'normal' },
}, { timestamps: true });

module.exports = mongoose.model('Announcement', AnnouncementSchema);
