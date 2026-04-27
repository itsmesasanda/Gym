const analyticsService = require('../services/analyticsService');

// GET /api/reports/summary
exports.getSummary = async (req, res) => {
  try {
    const summary = await analyticsService.getSummary();
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/reports/users-over-time
exports.getUsersOverTime = async (req, res) => {
  try {
    const data = await analyticsService.getUsersOverTime();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/reports/meals-calories
exports.getMealsCalories = async (req, res) => {
  try {
    const data = await analyticsService.getMealsCalories();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
