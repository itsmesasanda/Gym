import mongoose from "mongoose";

// A tenant in the white-label platform. Every member, admin, video and
// announcement is scoped to a Gym via gymId. The `code` is what members
// enter once on first login to bind their account to this gym.
const gymSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    address:      { type: String, default: "", trim: true },
    contactEmail: { type: String, default: "", trim: true, lowercase: true },
    contactPhone: { type: String, default: "", trim: true },
    branding: {
      primaryColor: { type: String, default: "#C8FF00" },
      logoUrl:      { type: String, default: "" },
    },
    status: { type: String, enum: ["active", "disabled"], default: "active" },
  },
  { timestamps: true }
);

const Gym = mongoose.model("Gym", gymSchema);

export default Gym;
