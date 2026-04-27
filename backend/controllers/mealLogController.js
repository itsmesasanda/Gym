import mongoose from "mongoose";
import MealLog from "../models/MealLog.js";

const DAILY_CALORIE_GOAL = 2200;

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

export const createMealLog = async (req, res) => {
  try {
    const {
      userId = "demo-user-001",
      foodName,
      calories,
      protein = 0,
      carbs = 0,
      fats = 0,
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
    });

    res.status(201).json({
      success: true,
      message: "Meal logged successfully",
      data: mealLog,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server error while creating meal log",
      error: err.message,
    });
  }
};

export const getTodayLogs = async (req, res) => {
  try {
    const { userId } = req.params;
    const { start, end } = getDayRange();

    const meals = await MealLog.find({
      userId,
      timestamp: { $gte: start, $lte: end },
    }).sort({ timestamp: -1 });

    const totals = getTotals(meals);
    const progressPercentage = Math.min(Math.round((totals.calories / DAILY_CALORIE_GOAL) * 100), 100);
    const remainingCalories = Math.max(DAILY_CALORIE_GOAL - totals.calories, 0);

    res.json({
      success: true,
      data: {
        meals,
        totals,
        goal: DAILY_CALORIE_GOAL,
        progressPercentage,
        remainingCalories,
        date: new Date().toISOString().split("T")[0],
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server error while fetching logs",
      error: err.message,
    });
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

    if (!updatedMeal) {
      return res.status(404).json({ success: false, message: "Meal not found" });
    }

    res.json({
      success: true,
      message: "Meal updated successfully",
      data: updatedMeal,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server error while updating meal",
      error: err.message,
    });
  }
};

export const deleteMealLog = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid meal ID format" });
    }

    const deletedMeal = await MealLog.findByIdAndDelete(id);
    if (!deletedMeal) {
      return res.status(404).json({ success: false, message: "Meal not found" });
    }

    res.json({
      success: true,
      message: "Meal deleted successfully",
      data: deletedMeal,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server error while deleting meal",
      error: err.message,
    });
  }
};

export const getWeeklyLogs = async (req, res) => {
  try {
    const { userId } = req.params;
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
    res.status(500).json({
      success: false,
      message: "Server error while fetching weekly data",
      error: err.message,
    });
  }
};

export const getMonthlyLogs = async (req, res) => {
  try {
    const { userId } = req.params;
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
    res.status(500).json({
      success: false,
      message: "Server error while fetching monthly data",
      error: err.message,
    });
  }
};

export const getAllMealLogs = async (req, res) => {
  try {
    const logs = await MealLog.find().sort({ timestamp: -1 }).limit(200);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getMealLogSummary = async (req, res) => {
  try {
    const { start, end } = getDayRange();
    const todaysLogs = await MealLog.find({ timestamp: { $gte: start, $lte: end } });
    const allLogs = await MealLog.find();
    const uniqueUsers = new Set(allLogs.map((log) => log.userId));

    res.json({
      today: {
        totals: getTotals(todaysLogs),
        mealCount: todaysLogs.length,
      },
      allTime: {
        totals: getTotals(allLogs),
        mealCount: allLogs.length,
        users: uniqueUsers.size,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
