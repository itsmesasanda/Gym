import express from "express";
import { getAllWorkouts, createWorkout, updateWorkout, deleteWorkout } from "../controllers/workoutController.js";
import adminAuthMiddleware from "../middleware/adminAuthMiddleware.js";

const router = express.Router();

router.get("/", adminAuthMiddleware, getAllWorkouts);
router.post("/", adminAuthMiddleware, createWorkout);
router.put("/:id", adminAuthMiddleware, updateWorkout);
router.delete("/:id", adminAuthMiddleware, deleteWorkout);

export default router;
