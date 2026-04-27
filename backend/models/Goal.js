import mongoose from "mongoose";

const GoalSchema = new mongoose.Schema(
  {
    name:    { type: String, required: true, trim: true },
    target:  {
      weight: { type: Number, default: 0 },
      reps:   { type: Number, default: 0 },
      sets:   { type: Number, default: 0 },
    },
    current: {
      weight: { type: Number, default: 0 },
      reps:   { type: Number, default: 0 },
      sets:   { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

GoalSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
  },
});

const Goal = mongoose.model("Goal", GoalSchema);

export default Goal;
