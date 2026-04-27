const mongoose = require('mongoose');

const VideoSchema = new mongoose.Schema({
  title:        { type: String, required: true },
  description:  { type: String },
  videoLink:    { type: String, required: true },
  uploadedDate: { type: String },
  pinned:       { type: Boolean, default: false },
  priority:     { type: String, default: 'normal' },
}, { timestamps: true }); 

module.exports = mongoose.model('Video', VideoSchema);
