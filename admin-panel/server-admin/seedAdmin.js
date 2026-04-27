const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const Admin = require('./models/Admin');

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/admin-panel');
    console.log('Connected to DB...');

    const email = 'admin@example.com';
    const password = 'admin123';

    const existing = await Admin.findOne({ email });
    if (existing) {
      console.log('Admin user already exists.');
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);
      const newAdmin = new Admin({
        email,
        password: hashedPassword,
        role: 'admin'
      });
      await newAdmin.save();
      console.log('Admin user created successfully!');
      console.log('Email:', email);
      console.log('Password:', password);
    }
    process.exit(0);
  } catch (err) {
    console.error('Error seeding admin:', err);
    process.exit(1);
  }
};

seed();
