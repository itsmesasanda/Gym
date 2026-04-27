import mongoose from "mongoose";

const MealSchema = new mongoose.Schema({
  rank:              { type: Number, required: true },
  title:             { type: String, required: true },
  calories:          { type: Number, required: true },
  protein:           { type: Number, required: true },
  fat:               { type: Number, required: true },
  carbs:             { type: Number, default: 0 },
  sodium:            { type: Number, default: 0 },
  serving_size_g:    { type: Number, default: 0 },
  rating:            { type: Number, default: 0 },
  calorie_match_pct: { type: Number, default: 0 },
  why_recommended:   { type: String, default: "" },
}, { _id: false });

const MealRecommendationSchema = new mongoose.Schema({
  userEmail:    { type: String, required: true, index: true },
  calories:     { type: Number, required: true },
  protein:      { type: Number, default: null },
  fat:          { type: Number, default: null },
  carbs:        { type: Number, default: null },
  goal:         { type: String, default: null },
  context:      { type: String, default: "" },
  meals:        { type: [MealSchema], required: true },
}, {
  timestamps: true,
});

const MealRecommendation = mongoose.model("MealRecommendation", MealRecommendationSchema);

export default MealRecommendation;
