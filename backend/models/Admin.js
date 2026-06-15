import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// Admin accounts are entirely separate from mobile-app Users and authenticate
// with their own secret (ADMIN_JWT_SECRET).
//   - super_admin: platform owner (us). gymId is null → sees every gym.
//   - gym_admin:   a gym owner/manager. Bound to exactly one gym via gymId.
const adminSchema = new mongoose.Schema(
  {
    name:  { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["super_admin", "gym_admin"],
      default: "gym_admin",
      index: true,
    },
    gymId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Gym",
      default: null,
      index: true,
    },
  },
  { timestamps: true }
);

adminSchema.methods.matchPassword = async function (entered) {
  return bcrypt.compare(entered, this.password);
};

const Admin = mongoose.model("Admin", adminSchema);

export default Admin;
