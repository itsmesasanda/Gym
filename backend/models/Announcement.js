import mongoose from "mongoose";

const announcementSchema = new mongoose.Schema(
  {
    // Owning gym (null = platform-wide / legacy). Admin writes scope by gymId.
    gymId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Gym",
      default: null,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    body: {
      type: String,
      trim: true,
      default: "",
    },
    date: {
      type: String,
      required: true,
      trim: true,
    },
    pinned: {
      type: Boolean,
      default: false,
    },
    priority: {
      type: String,
      required: true,
      trim: true,
      default: "normal",
      enum: ["normal", "high"],
    },
  },
  { timestamps: true }
);

const Announcement = mongoose.model("Announcement", announcementSchema);

export default Announcement;
