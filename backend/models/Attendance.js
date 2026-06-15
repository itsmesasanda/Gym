import mongoose from "mongoose";

// One check-in per member per day (enforced by the unique {userId, date} index).
// `date` is a YYYY-MM-DD string so day-bucketing and streak math are trivial.
const attendanceSchema = new mongoose.Schema(
  {
    userId:    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    gymId:     { type: mongoose.Schema.Types.ObjectId, ref: "Gym", default: null, index: true },
    date:      { type: String, required: true, index: true },
    timestamp: { type: Date, default: Date.now },
    method:    { type: String, enum: ["qr", "manual"], default: "qr" },
    checkedInBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
  },
  { timestamps: true }
);

attendanceSchema.index({ userId: 1, date: 1 }, { unique: true });

const Attendance = mongoose.model("Attendance", attendanceSchema);

export default Attendance;
