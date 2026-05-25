const jwt = require('jsonwebtoken');
const User = require('../models/User');

if (!process.env.JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is not set');
}

const escapeRegExp = (str = '') => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// POST /api/user-auth/login
exports.loginUser = async (req, res) => {
  try {
    const { email, phone } = req.body;

    if (!email || !phone) {
      return res.status(400).json({ error: 'Email and phone are required.' });
    }

    const cleanEmail = String(email).trim();
    const cleanPhone = String(phone).replace(/\D/g, '');

    if (cleanPhone.length !== 10) {
      return res.status(400).json({ error: 'Phone must be 10 digits.' });
    }

    const user = await User.findOne({
      email: { $regex: new RegExp(`^${escapeRegExp(cleanEmail)}$`, 'i') }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const userPhone = String(user.phone || '').replace(/\D/g, '');
    if (userPhone !== cleanPhone) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: 'user' },
      process.env.JWT_SECRET,
      { expiresIn: '12h' }
    );

    return res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        plan: user.plan,
        paid: user.paid,
        joinDate: user.joinDate,
      },
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// GET /api/user-auth/me
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('name email phone plan paid joinDate createdAt');
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    return res.json(user);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
