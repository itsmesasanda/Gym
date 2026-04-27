import express from "express";
import { getSummary, getUsersOverTime, getMealsCalories } from "../controllers/reportController.js";
import adminAuthMiddleware from "../middleware/adminAuthMiddleware.js";

const router = express.Router();

router.get("/summary", adminAuthMiddleware, getSummary);
router.get("/users-over-time", adminAuthMiddleware, getUsersOverTime);
router.get("/meals-calories", adminAuthMiddleware, getMealsCalories);

export default router;
