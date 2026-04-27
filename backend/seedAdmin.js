import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
dotenv.config();
import Admin from "./models/Admin.js";

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/gymapp");
    console.log("Connected to DB...");

    const email = "admin@example.com";
    const password = "admin123";

    const existing = await Admin.findOne({ email });
    if (existing) {
      console.log("Admin user already exists.");
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);
      const newAdmin = new Admin({
        email,
        password: hashedPassword,
        role: "admin"
      });
      await newAdmin.save();
      console.log("Admin user created successfully!");
      console.log("Email:", email);
      console.log("Password:", password);
    }
    process.exit(0);
  } catch (err) {
    console.error("Error seeding admin:", err);
    process.exit(1);
  }
};

seed();
