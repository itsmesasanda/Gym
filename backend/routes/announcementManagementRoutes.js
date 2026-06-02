import express from "express";
import {
  createAnnouncement,
  deleteAnnouncement,
  getAllAnnouncements,
  updateAnnouncement,
} from "../controllers/announcementController.js";
import adminAuthMiddleware from "../middleware/adminAuthMiddleware.js";

const router = express.Router();

router.get("/", adminAuthMiddleware, getAllAnnouncements);
router.post("/", adminAuthMiddleware, createAnnouncement);
router.put("/:id", adminAuthMiddleware, updateAnnouncement);
router.delete("/:id", adminAuthMiddleware, deleteAnnouncement);

export default router;
