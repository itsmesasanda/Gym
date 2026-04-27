import express from "express";
import {
  createMealLog,
  deleteMealLog,
  getMonthlyLogs,
  getTodayLogs,
  getWeeklyLogs,
  updateMealLog,
} from "../controllers/mealLogController.js";

const router = express.Router();

router.post("/", createMealLog);
router.get("/:userId/weekly", getWeeklyLogs);
router.get("/:userId/monthly", getMonthlyLogs);
router.get("/:userId", getTodayLogs);
router.put("/:id", updateMealLog);
router.delete("/:id", deleteMealLog);

export default router;
