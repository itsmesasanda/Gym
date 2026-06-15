/**
 * Bootstraps a single super admin (the platform owner) so you can sign in to
 * the super-admin panel and create real gyms there. No demo gyms, members, or
 * content are created.
 *
 *   npm run seed
 *
 * Credentials come from env (recommended) or fall back to the defaults below.
 * Change the password after first login.
 *   SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD, SUPER_ADMIN_NAME
 */
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

import Admin from "./models/Admin.js";

dotenv.config();

const EMAIL    = (process.env.SUPER_ADMIN_EMAIL || "super@gym.app").toLowerCase().trim();
const PASSWORD = process.env.SUPER_ADMIN_PASSWORD || "Admin@12345";
const NAME     = process.env.SUPER_ADMIN_NAME || "Platform Owner";

const run = async () => {
  const uri = process.env.MONGO_URI || process.env.MONGO_URL || process.env.MONGODB_URL;
  if (!uri) {
    console.error("FATAL: No MongoDB URI found. Set MONGO_URI.");
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log("Connected to MongoDB");

  const password = await bcrypt.hash(PASSWORD, 12);
  await Admin.findOneAndUpdate(
    { email: EMAIL },
    { name: NAME, email: EMAIL, password, role: "super_admin", gymId: null },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  console.log("\n✅ Super admin ready.\n");
  console.log(`  Email     →  ${EMAIL}`);
  console.log(`  Password  →  ${process.env.SUPER_ADMIN_PASSWORD ? "(from SUPER_ADMIN_PASSWORD env)" : PASSWORD + "   ← change this after login"}`);
  console.log("\n  Sign in to the super-admin panel, then create your gyms there.\n");

  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
