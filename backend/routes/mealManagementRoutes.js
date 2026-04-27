import express from "express";
import { getAllMeals, createMeal, updateMeal, deleteMeal } from "../controllers/mealController.js";
import adminAuthMiddleware from "../middleware/adminAuthMiddleware.js";

const router = express.Router();

router.get("/", adminAuthMiddleware, getAllMeals);
router.post("/", adminAuthMiddleware, createMeal);
router.put("/:id", adminAuthMiddleware, updateMeal);
router.delete("/:id", adminAuthMiddleware, deleteMeal);

export default router;
