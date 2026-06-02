import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
dotenv.config();
import Admin from "./models/Admin.js";

// Safety guard — never run seed scripts in production
if (process.env.NODE_ENV === "production") {
  console.error("ERROR: seedAdmin must not run in production. Aborting.");
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
