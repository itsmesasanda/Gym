import express from "express";
import {
  createMealLog,
  deleteMealLog,
  getMonthlyLogs,
  getTodayLogs,
  getWeeklyLogs,
  updateMealLog,
} from "../controllers/mealLogController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Verify that the :userId param matches the authenticated user
const verifyOwner = (req, res, next) => {
  if (req.params.userId && req.params.userId !== req.user.email) {
    return res.status(403).json({ message: "Forbidden" });
  }
  next();
};

router.post("/",                   protect, createMealLog);
router.get("/:userId/weekly",      protect, verifyOwner, getWeeklyLogs);
router.get("/:userId/monthly",     protect, verifyOwner, getMonthlyLogs);
router.get("/:userId",             protect, verifyOwner, getTodayLogs);
router.put("/:id",                 protect, updateMealLog);
router.delete("/:id",              protect, deleteMealLog);

export default router;
