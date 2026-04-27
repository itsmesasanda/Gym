import MealRecommendation from "../models/MealRecommendation.js";
import User from "../models/User.js";
import { getMealRecommendations } from "../services/mealRagService.js";

const normalizeGoal = (goal) => {
  if (!goal) return null;
  const g = String(goal).toLowerCase().trim().replace(/\s+/g, "_");
  if (g.includes("muscle") || g.includes("gain"))   return "muscle_gain";
  if (g.includes("loss")   || g.includes("weight")) return "weight_loss";
  if (g.includes("protein"))                        return "high_protein";
  if (g.includes("carb"))                           return "low_carb";
  return "maintenance";
};

/**
 * POST /api/meal-plans/recommend
 * Body: { email, calories?, protein?, carbs?, context? }
 */
export const recommendAndSave = async (req, res) => {
  console.log("MEAL RECOMMEND ROUTE HIT");
  console.log(req.body);

  try {
    const { email, calories, protein, carbs, context } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Use provided values or fall back to user profile
    const targetCalories = calories || user.calories || 2000;
    const targetProtein  = protein  || null;
    const targetCarbs    = carbs    || null;
    const goal           = normalizeGoal(user.goal);

    console.log("[mealRecommend] targets:", {
      calories: targetCalories,
      protein: targetProtein,
      carbs: targetCarbs,
      goal,
      context,
    });

    // Call Python meal RAG service
    const result = await getMealRecommendations({
      calories: targetCalories,
      protein:  targetProtein,
      carbs:    targetCarbs,
      context:  context || "",
      goal,
    });

    // Save to Mongo
    const saved = await MealRecommendation.create({
      userEmail: email,
      calories:  targetCalories,
      protein:   targetProtein,
      carbs:     targetCarbs,
      goal,
      context:   context || "",
      meals:     result.meals,
    });

    return res.status(201).json(saved);
  } catch (err) {
    console.error("MEAL RECOMMEND ERROR:", err.message);
    return res.status(500).json({ message: err.message });
  }
};

/**
 * GET /api/meal-plans?email=...
 */
export const getUserMealPlans = async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ message: "Email required" });

    const plans = await MealRecommendation.find({ userEmail: email })
      .sort({ createdAt: -1 })
      .limit(50);

    return res.json(plans);
  } catch (err) {
    console.error("GET MEAL PLANS ERROR:", err.message);
    return res.status(500).json({ message: err.message });
  }
};

/**
 * DELETE /api/meal-plans/:id
 */
export const deleteMealPlan = async (req, res) => {
  try {
    const result = await MealRecommendation.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ message: "Not found" });
    return res.json({ message: "Meal plan deleted" });
  } catch (err) {
    console.error("DELETE MEAL PLAN ERROR:", err.message);
    return res.status(500).json({ message: err.message });
  }
};
