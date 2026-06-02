import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  recommendAndSave,
  getUserMealPlans,
  deleteMealPlan,
} from "../controllers/mealRecommendationController.js";

const router = express.Router();

router.use(protect); // all meal-plan routes require a valid user token

router.post("/recommend", recommendAndSave);
router.get("/",           getUserMealPlans);
router.delete("/:id",     deleteMealPlan);

export default router;
