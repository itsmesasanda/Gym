import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  recommendAndSave,
  previewRecommendations,
  getUserMealPlans,
  deleteMealPlan,
} from "../controllers/mealRecommendationController.js";

const router = express.Router();

router.use(protect); // all meal-plan routes require a valid user token

router.post("/recommend", recommendAndSave);
router.post("/preview",   previewRecommendations); // RAG picks without persisting
router.get("/",           getUserMealPlans);
router.delete("/:id",     deleteMealPlan);

export default router;
