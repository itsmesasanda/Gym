import express from "express";
import {
  deleteMealLog,
  getAllMealLogs,
  getMealLogSummary,
} from "../controllers/mealLogController.js";
import adminAuthMiddleware from "../middleware/adminAuthMiddleware.js";

const router = express.Router();

router.get("/", adminAuthMiddleware, getAllMealLogs);
router.get("/summary", adminAuthMiddleware, getMealLogSummary);
router.delete("/:id", adminAuthMiddleware, deleteMealLog);

export default router;
