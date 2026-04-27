import Member from "../models/Member.js";
import Meal from "../models/Meal.js";
import Workout from "../models/Workout.js";
import Video from "../models/Video.js";

/**
 * Returns high-level counts for the dashboard cards.
 */
export const getSummary = async () => {
  const [totalUsers, totalMeals, totalWorkouts, totalVideos, paidUsers] =
    await Promise.all([
      Member.countDocuments(),
      Meal.countDocuments(),
      Workout.countDocuments(),
      Video.countDocuments(),
      Member.countDocuments({ paid: true }),
    ]);

  return { totalUsers, totalMeals, totalWorkouts, totalVideos, paidUsers };
};

/**
 * Returns the count of users registered per month (last 6 months).
 */
export const getUsersOverTime = async () => {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const data = await Member.aggregate([
    { $match: { createdAt: { $gte: sixMonthsAgo } } },
    {
      $group: {
        _id: {
          year:  { $year:  "$createdAt" },
          month: { $month: "$createdAt" },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
  ]);

  return data.map((d) => ({
    label: `${d._id.year}-${String(d._id.month).padStart(2, "0")}`,
    count: d.count,
  }));
};

/**
 * Returns total calories per day for all meals.
 */
export const getMealsCalories = async () => {
  const data = await Meal.aggregate([
    { $group: { _id: "$date", totalCalories: { $sum: "$calories" } } },
    { $sort: { _id: 1 } },
  ]);

  return data.map((d) => ({ date: d._id, totalCalories: d.totalCalories }));
};
