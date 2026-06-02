import express from "express";
import {
  adminGetAllWorkouts,
  adminCreateWorkout,
  adminUpdateWorkout,
  adminDeleteWorkout,
} from "../controllers/adminWorkoutController.js";
import adminAuthMiddleware from "../middleware/adminAuthMiddleware.js";

const router = express.Router();

// All routes use adminAuthMiddleware which sets req.admin (not req.user).
// The admin workout controller reads req.admin — never req.user.
router.get("/",        adminAuthMiddleware, adminGetAllWorkouts);
router.post("/",       adminAuthMiddleware, adminCreateWorkout);
router.put("/:id",     adminAuthMiddleware, adminUpdateWorkout);
router.delete("/:id",  adminAuthMiddleware, adminDeleteWorkout);

export default router;
