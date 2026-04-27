const User    = require('../models/User');
const Video   = require('../models/Video');

// Try to import WorkoutPlan and MealRecommendation from the gymapp DB
// These may not exist if admin runs on a separate DB
let WorkoutPlan = null;
let MealRecommendation = null;
try {
  const mongoose = require('mongoose');
  // Check if these models exist (they would if pointing at gymapp DB)
  WorkoutPlan = mongoose.models.WorkoutPlan || null;
  MealRecommendation = mongoose.models.MealRecommendation || null;
} catch (e) {
  // Models don't exist — that's fine, we'll return 0
}

/**
 * Returns high-level counts for the dashboard cards.
 */
exports.getSummary = async () => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [totalUsers, totalVideos, paidUsers] = await Promise.all([
    User.countDocuments(),
    Video.countDocuments(),
    User.countDocuments({ paid: true }),
  ]);

  const unpaidUsers = totalUsers - paidUsers;

  // Users who logged in / were created this month
  let activeThisMonth = 0;
  try {
    activeThisMonth = await User.countDocuments({
      $or: [
        { updatedAt: { $gte: startOfMonth } },
        { createdAt: { $gte: startOfMonth } },
      ],
    });
  } catch (e) {
    activeThisMonth = 0;
  }

  // Count AI-generated plans (workout + meal)
  let totalAIPlans = 0;
  try {
    if (WorkoutPlan) {
      totalAIPlans += await WorkoutPlan.countDocuments();
    }
    if (MealRecommendation) {
      totalAIPlans += await MealRecommendation.countDocuments();
    }
  } catch (e) {
    totalAIPlans = 0;
  }

  return {
    totalUsers,
    paidUsers,
    unpaidUsers,
    totalVideos,
    activeThisMonth,
    totalAIPlans,
  };
};

/**
 * Returns the count of users registered per month (last 6 months).
 */
exports.getUsersOverTime = async () => {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const data = await User.aggregate([
    { $match: { createdAt: { $gte: sixMonthsAgo } } },
    {
      $group: {
        _id: {
          year:  { $year:  '$createdAt' },
          month: { $month: '$createdAt' },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  return data.map((d) => ({
    label: `${d._id.year}-${String(d._id.month).padStart(2, '0')}`,
    count: d.count,
  }));
};

/**
 * Returns total calories per day for all meal logs.
 */
exports.getMealsCalories = async () => {
  try {
    const MealLog = require('mongoose').models.MealLog;
    if (!MealLog) return [];
    
    const data = await MealLog.aggregate([
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } }, totalCalories: { $sum: '$calories' } } },
      { $sort: { _id: 1 } },
      { $limit: 30 },
    ]);

    return data.map((d) => ({ date: d._id, totalCalories: d.totalCalories }));
  } catch (e) {
    return [];
  }
};
