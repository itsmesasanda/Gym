import mongoose from "mongoose";

const MemberSchema = new mongoose.Schema({
  name:     { type: String, required: true },
  email:    { type: String, required: true },
  phone:    { type: String },
  plan:     { type: String, default: "Basic" },
  paid:     { type: Boolean, default: false },
  notes:    { type: String },
  joinDate: { type: String },
}, { timestamps: true, collection: "members" });

const Member = mongoose.model("Member", MemberSchema);

export default Member;
