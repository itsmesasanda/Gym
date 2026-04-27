const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  userId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName:    { type: String, required: true },
  userEmail:   { type: String, required: true },
  amount:      { type: Number, required: true },
  plan:        { type: String, required: true }, // Basic, Standard, Premium
  paymentDate: { type: Date, default: Date.now },
  dueDate:     { type: Date },
  status:      { type: String, enum: ['Pending', 'Paid', 'Failed', 'Overdue'], default: 'Pending' },
  transactionId: { type: String },
  paymentMethod: { type: String }, // Credit Card, Debit Card, UPI, etc.
  notes:       { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Payment', PaymentSchema);
