import express from "express";
import {
  createEvent,
  deleteEvent,
  getAllEvents,
  updateEvent,
} from "../controllers/eventController.js";
import adminAuthMiddleware from "../middleware/adminAuthMiddleware.js";

const router = express.Router();

router.get("/", adminAuthMiddleware, getAllEvents);
router.post("/", adminAuthMiddleware, createEvent);
router.put("/:id", adminAuthMiddleware, updateEvent);
router.delete("/:id", adminAuthMiddleware, deleteEvent);

export default router;
