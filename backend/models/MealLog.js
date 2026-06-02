import mongoose from "mongoose";

const MealLogSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    trim: true,
  },
  foodName: {
    type: String,
    required: true,
    trim: true,
  },
  calories: {
    type: Number,
    required: true,
    min: 0,
  },
  protein: {
    type: Number,
    default: 0,
    min: 0,
  },
  carbs: {
    type: Number,
    default: 0,
    min: 0,
  },
  fats: {
    type: Number,
    default: 0,
    min: 0,
  },
  mealGroupId: {
    type: String,
    default: null,
  },
  mealName: {
    type: String,
    default: null,
    trim: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

MealLogSchema.index({ userId: 1, timestamp: -1 });

const MealLog = mongoose.model("MealLog", MealLogSchema);

export default MealLog;
