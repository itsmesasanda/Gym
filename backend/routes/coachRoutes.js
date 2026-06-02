import express from "express";
import { chat, saveWorkout } from "../controllers/coachController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/chat",         protect, chat);
router.post("/save-workout", protect, saveWorkout);

export default router;
