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
 * POST /api/meal-plans/recommend  [protected]
 * Body: { calories?, protein?, carbs?, context? }
 * Email is always taken from the authenticated token — never from req.body.
 */
export const recommendAndSave = async (req, res) => {
  try {
    const email = req.user.email;
    const { calories, protein, carbs, context } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const targetCalories = calories || user.calories || 2000;
    const targetProtein  = protein  || null;
    const targetCarbs    = carbs    || null;
    const goal           = normalizeGoal(user.goal);

    const result = await getMealRecommendations({
      calories: targetCalories,
      protein:  targetProtein,
      carbs:    targetCarbs,
      context:  context || "",
      goal,
    });

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
    console.error("[mealRecommend] error:", err);
    return res.status(500).json({ message: "Recommendation service error" });
  }
};

/**
 * GET /api/meal-plans  [protected]
 * Returns only the authenticated user's meal plans.
 */
export const getUserMealPlans = async (req, res) => {
  try {
    const email = req.user.email;

    const plans = await MealRecommendation.find({ userEmail: email })
      .sort({ createdAt: -1 })
      .limit(50);

    return res.json(plans);
  } catch (err) {
    console.error("[getMealPlans] error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * DELETE /api/meal-plans/:id  [protected]
 * Only the owning user may delete their meal plan.
 */
export const deleteMealPlan = async (req, res) => {
  try {
    const plan = await MealRecommendation.findById(req.params.id);
    if (!plan) return res.status(404).json({ message: "Not found" });

    if (plan.userEmail !== req.user.email) {
      return res.status(403).json({ message: "Forbidden" });
    }

    await plan.deleteOne();
    return res.json({ message: "Meal plan deleted" });
  } catch (err) {
    console.error("[deleteMealPlan] error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
