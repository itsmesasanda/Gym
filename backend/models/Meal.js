import mongoose from "mongoose";

const MealSchema = new mongoose.Schema({
  name: { type: String, required: true },
  calories: { type: Number },
  date: { type: String },
}, { timestamps: true });

const Meal = mongoose.model("Meal", MealSchema);

export default Meal;
