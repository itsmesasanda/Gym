import * as analyticsService from "../services/analyticsService.js";

// GET /api/admin/reports/summary
export const getSummary = async (req, res) => {
  try {
    const summary = await analyticsService.getSummary();
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/admin/reports/users-over-time
export const getUsersOverTime = async (req, res) => {
  try {
    const data = await analyticsService.getUsersOverTime();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/admin/reports/meals-calories
export const getMealsCalories = async (req, res) => {
  try {
    const data = await analyticsService.getMealsCalories();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
