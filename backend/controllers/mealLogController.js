import mongoose from "mongoose";
import MealLog from "../models/MealLog.js";
import User from "../models/User.js";

const DAILY_CALORIE_GOAL   = 2200;
const DAILY_PROTEIN_GOAL   = 150;

const getUserGoals = async (userId) => {
  try {
    const user = await User.findOne({ email: userId }).select("calories protein");
    return {
      calorieGoal: user?.calories || DAILY_CALORIE_GOAL,
      proteinGoal: user?.protein  || DAILY_PROTEIN_GOAL,
    };
  } catch {
    return { calorieGoal: DAILY_CALORIE_GOAL, proteinGoal: DAILY_PROTEIN_GOAL };
  }
};

const getDayRange = (date = new Date()) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

const validateNutritionValues = (data, requireCalories = false) => {
  const fields = [
    { key: "calories", required: requireCalories },
    { key: "protein", required: false },
    { key: "carbs", required: false },
    { key: "fats", required: false },
  ];

  for (const field of fields) {
    const rawValue = data[field.key];

    if ((rawValue === undefined || rawValue === null || rawValue === "") && field.required) {
      return `${field.key} is required`;
    }

    if (rawValue === undefined || rawValue === null || rawValue === "") {
      continue;
    }

    const numericValue = Number(rawValue);
    if (!Number.isFinite(numericValue)) {
      return `${field.key} must be a valid number`;
    }

    if (numericValue < 0) {
      return `${field.key} cannot be negative`;
    }
  }

  return null;
};

const getTotals = (meals) => meals.reduce((acc, meal) => ({
  calories: acc.calories + meal.calories,
  protein: acc.protein + meal.protein,
  carbs: acc.carbs + meal.carbs,
  fats: acc.fats + meal.fats,
}), { calories: 0, protein: 0, carbs: 0, fats: 0 });

const groupMeals = (meals) => {
  const map = new Map();
  const order = [];
  for (const meal of meals) {
    const plain = meal.toObject ? meal.toObject() : meal;
    plain._id  = plain._id.toString();
    const key  = plain.mealGroupId || plain._id;
    if (!map.has(key)) {
      map.set(key, {
        groupId: key,
        mealName: plain.mealName || plain.foodName,
        foods: [],
        totalCalories: 0,
        totalProtein: 0,
        timestamp: plain.timestamp,
      });
      order.push(key);
    }
    const g = map.get(key);
    g.foods.push(plain);
    g.totalCalories += plain.calories;
    g.totalProtein  += plain.protein;
  }
  return order.map(k => map.get(k));
};

export const createMealLog = async (req, res) => {
  try {
    // userId is always sourced from the authenticated token — never from the request body
    const userId = req.user.email;
    const {
      foodName,
      calories,
      protein = 0,
      carbs = 0,
      fats = 0,
      mealGroupId = null,
      mealName = null,
    } = req.body;

    if (!foodName || !String(foodName).trim()) {
      return res.status(400).json({ success: false, message: "Food name is required" });
    }

    const nutritionError = validateNutritionValues({ calories, protein, carbs, fats }, true);
    if (nutritionError) {
      return res.status(400).json({ success: false, message: nutritionError });
    }

    const mealLog = await MealLog.create({
      userId,
      foodName: String(foodName).trim(),
      calories: Number(calories),
      protein: Number(protein || 0),
      carbs: Number(carbs || 0),
      fats: Number(fats || 0),
      mealGroupId: mealGroupId || null,
      mealName: mealName ? String(mealName).trim() : null,
    });

    res.status(201).json({
      success: true,
      message: "Meal logged successfully",
      data: mealLog,
    });
  } catch (err) {
    console.error("[createMealLog] error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getTodayLogs = async (req, res) => {
  try {
    if (!req.user?.email) return res.status(401).json({ success: false, message: "Unauthorized" });
    const userId = req.user.email;
    // Use client-supplied date if provided (handles timezone offsets)
    const clientDate = req.query.date ? new Date(req.query.date) : new Date();
    const { start, end } = getDayRange(isNaN(clientDate) ? new Date() : clientDate);

    const [meals, { calorieGoal, proteinGoal }] = await Promise.all([
      MealLog.find({ userId, timestamp: { $gte: start, $lte: end } }).sort({ timestamp: -1 }),
      getUserGoals(userId),
    ]);

    const totals = getTotals(meals);
    const progressPercentage = Math.min(Math.round((totals.calories / calorieGoal) * 100), 100);
    const remainingCalories  = Math.max(calorieGoal - totals.calories, 0);

    res.set("Cache-Control", "no-store");
    res.json({
      success: true,
      data: {
        meals,
        groupedMeals: groupMeals(meals),
        totals,
        goal: calorieGoal,
        proteinGoal,
        progressPercentage,
        remainingCalories,
        date: new Date().toISOString().split("T")[0],
      },
    });
  } catch (err) {
    console.error("[getTodayLogs] error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const updateMealLog = async (req, res) => {
  try {
    const { id } = req.params;
    const { foodName, calories, protein, carbs, fats } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid meal ID format" });
    }

    const nutritionError = validateNutritionValues({ calories, protein, carbs, fats });
    if (nutritionError) {
      return res.status(400).json({ success: false, message: nutritionError });
    }

    const existing = await MealLog.findById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: "Meal not found" });
    }
    if (existing.userId !== req.user.email) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const updatedMeal = await MealLog.findByIdAndUpdate(
      id,
      {
        ...(foodName !== undefined && { foodName: String(foodName).trim() }),
        ...(calories !== undefined && { calories: Number(calories) }),
        ...(protein !== undefined && { protein: Number(protein) }),
        ...(carbs !== undefined && { carbs: Number(carbs) }),
        ...(fats !== undefined && { fats: Number(fats) }),
      },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: "Meal updated successfully",
      data: updatedMeal,
    });
  } catch (err) {
    console.error("[updateMealLog] error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const deleteMealLog = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid meal ID format" });
    }

    const meal = await MealLog.findById(id);
    if (!meal) {
      return res.status(404).json({ success: false, message: "Meal not found" });
    }
    if (meal.userId !== req.user.email) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    await meal.deleteOne();

    res.json({ success: true, message: "Meal deleted successfully" });
  } catch (err) {
    console.error("[deleteMealLog] error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getWeeklyLogs = async (req, res) => {
  try {
    if (!req.user?.email) return res.status(401).json({ success: false, message: "Unauthorized" });
    const userId = req.user.email;
    const days = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const { start, end } = getDayRange(date);

      const meals = await MealLog.find({
        userId,
        timestamp: { $gte: start, $lte: end },
      });

      days.push({
        date: date.toISOString().split("T")[0],
        dayLabel: date.toLocaleDateString("en-US", { weekday: "short" }),
        ...getTotals(meals),
        mealCount: meals.length,
      });
    }

    res.json({ success: true, data: { days, goal: DAILY_CALORIE_GOAL } });
  } catch (err) {
    console.error("[getWeeklyLogs] error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getMonthlyLogs = async (req, res) => {
  try {
    if (!req.user?.email) return res.status(401).json({ success: false, message: "Unauthorized" });
    const userId = req.user.email;
    const weeks = [];

    for (let w = 3; w >= 0; w--) {
      const weekData = {
        label: `Week ${4 - w}`,
        calories: 0,
        protein: 0,
        carbs: 0,
        fats: 0,
        days: 0,
      };

      for (let d = 6; d >= 0; d--) {
        const date = new Date();
        date.setDate(date.getDate() - (w * 7 + d));
        const { start, end } = getDayRange(date);

        const meals = await MealLog.find({
          userId,
          timestamp: { $gte: start, $lte: end },
        });

        if (meals.length > 0) {
          weekData.days++;
          const totals = getTotals(meals);
          weekData.calories += totals.calories;
          weekData.protein += totals.protein;
          weekData.carbs += totals.carbs;
          weekData.fats += totals.fats;
        }
      }

      weeks.push({
        ...weekData,
        avgCalories: weekData.days > 0 ? Math.round(weekData.calories / weekData.days) : 0,
      });
    }

    res.json({ success: true, data: { weeks, goal: DAILY_CALORIE_GOAL } });
  } catch (err) {
    console.error("[getMonthlyLogs] error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
