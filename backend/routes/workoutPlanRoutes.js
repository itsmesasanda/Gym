import express from "express";
import {
  generateAndSavePlan,
  getUserPlans,
  getPlanById,
  deletePlan,
} from "../controllers/workoutPlanController.js";

const router = express.Router();

// POST   /api/workout-plans/generate   → generate + save a new plan
// GET    /api/workout-plans?email=...  → list user's plans
// GET    /api/workout-plans/:id        → get one plan
// DELETE /api/workout-plans/:id        → delete a plan

router.post("/generate", generateAndSavePlan);
router.get("/",          getUserPlans);
router.get("/:id",       getPlanById);
router.delete("/:id",    deletePlan);

export default router;
