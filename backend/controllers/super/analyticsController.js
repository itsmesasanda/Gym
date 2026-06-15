import Gym from "../../models/Gym.js";
import User from "../../models/User.js";
import Admin from "../../models/Admin.js";
import WorkoutPlan from "../../models/WorkoutPlan.js";
import Video from "../../models/Video.js";
import Announcement from "../../models/Announcement.js";

// GET /api/super/analytics  — platform-wide rollup across all gyms.
export const getPlatformStats = async (_req, res) => {
  try {
    const [
      totalGyms,
      activeGyms,
      totalMembers,
      activeMembers,
      pendingMembers,
      gymAdmins,
      plansGenerated,
      videos,
      announcements,
    ] = await Promise.all([
      Gym.countDocuments(),
      Gym.countDocuments({ status: "active" }),
      User.countDocuments(),
      User.countDocuments({ status: "active" }),
      User.countDocuments({ status: "pending" }),
      Admin.countDocuments({ role: "gym_admin" }),
      WorkoutPlan.countDocuments(),
      Video.countDocuments(),
      Announcement.countDocuments(),
    ]);

    res.json({
      gyms: { total: totalGyms, active: activeGyms, disabled: totalGyms - activeGyms },
      members: { total: totalMembers, active: activeMembers, pending: pendingMembers },
      gymAdmins,
      plansGenerated,
      content: { videos, announcements },
    });
  } catch (err) {
    console.error("[super/analytics]", err);
    res.status(500).json({ message: "Failed to load analytics" });
  }
};
