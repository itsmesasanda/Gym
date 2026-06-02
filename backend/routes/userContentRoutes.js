import express from "express";
import { getAllAnnouncements } from "../controllers/announcementController.js";
import { getAllEvents } from "../controllers/eventController.js";

const router = express.Router();

router.get("/announcements", getAllAnnouncements);
router.get("/events", getAllEvents);

export default router;
