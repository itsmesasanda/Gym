import * as analyticsService from "../services/analyticsService.js";

export const getSummary = async (req, res) => {
  try {
    const summary = await analyticsService.getSummary();
    res.json(summary);
  } catch (err) {
    console.error("[getSummary] error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getUsersOverTime = async (req, res) => {
  try {
    const data = await analyticsService.getUsersOverTime();
    res.json(data);
  } catch (err) {
    console.error("[getUsersOverTime] error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMealsCalories = async (req, res) => {
  try {
    const data = await analyticsService.getMealsCalories();
    res.json(data);
  } catch (err) {
    console.error("[getMealsCalories] error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
