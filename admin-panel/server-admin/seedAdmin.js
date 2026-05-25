const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
require('dotenv').config();
const Admin = require('./models/Admin');

if (process.env.NODE_ENV === 'production') {
  console.error('ERROR: seedAdmin must not run in production. Aborting.');
  process.exit(1);
}

const seed = async () => {
  const email    = process.env.SEED_ADMIN_EMAIL    || (() => { throw new Error('SEED_ADMIN_EMAIL is required'); })();
  const password = process.env.SEED_ADMIN_PASSWORD || (() => { throw new Error('SEED_ADMIN_PASSWORD is required'); })();

  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/admin-panel');
    console.log('Connected to DB...');

    const existing = await Admin.findOne({ email });
    if (existing) {
      console.log('Admin user already exists.');
    } else {
      const hashedPassword = await bcrypt.hash(password, 12);
      const newAdmin = new Admin({ email, password: hashedPassword, role: 'admin' });
      await newAdmin.save();
      console.log('Admin user created successfully!');
    }
    process.exit(0);
  } catch (err) {
    console.error('Error seeding admin:', err.message);
    process.exit(1);
  }
};

seed();
