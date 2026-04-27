const Payment = require('../models/Payment');
const User = require('../models/User');

exports.getAllPayments = async (req, res) => {
  try {
    const query = {};
    const { userId, userEmail, status } = req.query;

    if (userId) query.userId = userId;
    if (userEmail) query.userEmail = userEmail;
    if (status) query.status = status;

    const payments = await Payment.find(query).sort({ paymentDate: -1 });
    res.json(payments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getPaymentsByUserId = async (req, res) => {
  try {
    const payments = await Payment.find({ userId: req.params.userId }).sort({ paymentDate: -1 });
    res.json(payments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createPayment = async (req, res) => {
  try {
    const { userId, userName, userEmail, amount, plan, dueDate, status, paymentMethod, notes } = req.body;

    // Validate required fields
    if (!userId || !userName || !userEmail || !amount || !plan) {
      return res.status(400).json({ 
        error: 'Missing required fields: userId, userName, userEmail, amount, plan' 
      });
    }

    const payment = new Payment({
      userId,
      userName,
      userEmail,
      amount,
      plan,
      dueDate: dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      status: status || 'Pending',
      paymentMethod,
      notes,
    });

    await payment.save();
    res.status(201).json(payment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.updatePayment = async (req, res) => {
  try {
    const payment = await Payment.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true }
    );
    res.json(payment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.updatePaymentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    // Validate status
    const validStatuses = ['Pending', 'Paid', 'Failed', 'Overdue'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
      });
    }

    const payment = await Payment.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    res.json(payment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deletePayment = async (req, res) => {
  try {
    await Payment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Payment deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getPaymentStats = async (req, res) => {
  try {
    const totalPayments = await Payment.countDocuments();
    const paidPayments = await Payment.countDocuments({ status: 'Paid' });
    const pendingPayments = await Payment.countDocuments({ status: 'Pending' });
    const overduePayments = await Payment.countDocuments({ status: 'Overdue' });
    const totalAmount = await Payment.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    res.json({
      total: totalPayments,
      paid: paidPayments,
      pending: pendingPayments,
      overdue: overduePayments,
      totalAmount: totalAmount[0]?.total || 0
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
