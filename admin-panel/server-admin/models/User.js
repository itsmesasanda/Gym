const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name:     { type: String, required: true },
  email:    { type: String, required: true },
  phone:    { type: String },
  plan:     { type: String, default: 'Basic' },
  paid:     { type: Boolean, default: false },
  notes:    { type: String },
  joinDate: { type: String },
}, { timestamps: true, collection: 'members' }); // Uses the original collection

module.exports = mongoose.model('User', UserSchema);
