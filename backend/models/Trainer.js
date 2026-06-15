import mongoose from "mongoose";

// A trainer belongs to exactly one gym. Members are linked back to a trainer via
// User.trainerId (a member has at most one trainer). Trainer logins (the
// member-facing trainer feature) are Phase 3 — this model only supports the gym
// admin managing trainers and their assigned members.
const trainerSchema = new mongoose.Schema(
  {
    gymId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Gym",
      required: true,
      index: true,
    },
    name:  { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
  },
  { timestamps: true }
);

const Trainer = mongoose.model("Trainer", trainerSchema);

export default Trainer;
