import User from "../../models/User.js";
import WorkoutPlan from "../../models/WorkoutPlan.js";
import Video from "../../models/Video.js";
import Announcement from "../../models/Announcement.js";
import Attendance from "../../models/Attendance.js";
import { gymScope } from "../../middleware/adminAuth.js";

// GET /api/admin/dashboard/stats  (adminProtect)
// All counts are scoped to the caller's gym (super_admin sees the whole platform).
export const getStats = async (req, res) => {
  try {
    const scope = gymScope(req);

    const [total, active, pending, locked, paid, overdue] = await Promise.all([
      User.countDocuments(scope),
      User.countDocuments({ ...scope, status: "active" }),
      User.countDocuments({ ...scope, status: "pending" }),
      User.countDocuments({ ...scope, status: "locked" }),
      User.countDocuments({ ...scope, paymentStatus: "paid" }),
      User.countDocuments({ ...scope, paymentStatus: "overdue" }),
    ]);

    // WorkoutPlan is keyed by userEmail, so scope it through this gym's members.
    let plansGenerated;
    if (req.admin.role === "super_admin") {
      plansGenerated = await WorkoutPlan.countDocuments();
    } else {
      const emails = await User.find(scope).distinct("email");
      plansGenerated = await WorkoutPlan.countDocuments({ userEmail: { $in: emails } });
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    const [videos, announcements, checkinsToday] = await Promise.all([
      Video.countDocuments(scope),
      Announcement.countDocuments(scope),
      Attendance.countDocuments({ date: todayStr, ...scope }),
    ]);

    res.json({
      members: { total, active, pending, locked },
      payments: { paid, overdue },
      content: { videos, announcements },
      plansGenerated,
      checkinsToday,
    });
  } catch (err) {
    console.error("[admin/dashboard]", err);
    res.status(500).json({ message: "Failed to load stats" });
  }
};
