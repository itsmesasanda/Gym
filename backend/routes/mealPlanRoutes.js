import express from "express";
import {
  recommendAndSave,
  getUserMealPlans,
  deleteMealPlan,
} from "../controllers/mealRecommendationController.js";

const router = express.Router();

router.post("/recommend", recommendAndSave);
router.get("/",           getUserMealPlans);
router.delete("/:id",     deleteMealPlan);

export default router;
