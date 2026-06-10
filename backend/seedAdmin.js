import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
dotenv.config();
import Admin from "./models/Admin.js";

// Seeding in production is intentional but gated: you DO need to create the first
// admin on Railway, but only deliberately. Set ALLOW_PROD_SEED=true to permit it.
if (process.env.NODE_ENV === "production" && process.env.ALLOW_PROD_SEED !== "true") {
  console.error(
    "ERROR: refusing to seed in production. Re-run with ALLOW_PROD_SEED=true once you're sure."
  );
  process.exit(1);
}

const seed = async () => {
  const email    = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!email || !password) {
    console.error(
      "ERROR: SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be set as environment variables.\n" +
      "Example: SEED_ADMIN_EMAIL=you@example.com SEED_ADMIN_PASSWORD=... node seedAdmin.js"
    );
    process.exit(1);
  }

  // Enforce a strong admin password — this account manages every user's data.
  if (password.length < 12 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    console.error(
      "ERROR: SEED_ADMIN_PASSWORD must be at least 12 characters and include letters and numbers."
    );
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/gymapp");
    console.log("Connected to DB...");

    const existing = await Admin.findOne({ email });
    if (existing) {
      console.log("Admin user already exists.");
    } else {
      const hashedPassword = await bcrypt.hash(password, 12);
      const newAdmin = new Admin({ email, password: hashedPassword, role: "admin" });
      await newAdmin.save();
      console.log("Admin user created successfully!");
    }
    process.exit(0);
  } catch (err) {
    console.error("Error seeding admin:", err.message);
    process.exit(1);
  }
};

seed();
