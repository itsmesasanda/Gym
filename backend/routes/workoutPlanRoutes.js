import express from "express";
import {
  generateAndSavePlan,
  getUserPlans,
  getPlanById,
  patchPlan,
  deletePlan,
} from "../controllers/workoutPlanController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect); // all plan routes require a valid token

router.post("/generate", generateAndSavePlan);
router.get("/",          getUserPlans);
router.get("/:id",       getPlanById);
router.patch("/:id",     patchPlan);
router.delete("/:id",    deletePlan);

export default router;
