import express from "express";

import { login, me } from "../../controllers/admin/authController.js";
import { getStats } from "../../controllers/admin/dashboardController.js";
import {
  listMembers,
  getMember,
  createMember,
  approveMember,
  rejectMember,
  lockMember,
  unlockMember,
} from "../../controllers/admin/memberController.js";
import {
  listVideos,
  createVideo,
  updateVideo,
  deleteVideo,
} from "../../controllers/admin/videoController.js";
import {
  listAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from "../../controllers/admin/announcementController.js";
import {
  listTrainers,
  createTrainer,
  updateTrainer,
  getTrainerMembers,
  deleteTrainer,
} from "../../controllers/admin/trainerController.js";
import {
  checkInByToken,
  manualCheckIn,
  listAttendance,
  getMemberQr,
} from "../../controllers/admin/checkinController.js";
import { adminProtect } from "../../middleware/adminAuth.js";

const router = express.Router();

// ── Auth ──────────────────────────────────────────────────────────────────
router.post("/auth/login", login);
router.get("/auth/me", adminProtect, me);

// Everything below requires a valid admin token.
router.use(adminProtect);

// ── Dashboard ──────────────────────────────────────────────────────────────
router.get("/dashboard/stats", getStats);

// ── Members ─────────────────────────────────────────────────────────────────
router.get("/members", listMembers);
router.post("/members", createMember);
router.get("/members/:id/qr", getMemberQr);
router.get("/members/:id", getMember);
router.patch("/members/:id/approve", approveMember);
router.patch("/members/:id/reject", rejectMember);
router.patch("/members/:id/lock", lockMember);
router.patch("/members/:id/unlock", unlockMember);

// ── Videos ──────────────────────────────────────────────────────────────────
router.get("/videos", listVideos);
router.post("/videos", createVideo);
router.put("/videos/:id", updateVideo);
router.delete("/videos/:id", deleteVideo);

// ── Announcements ────────────────────────────────────────────────────────────
router.get("/announcements", listAnnouncements);
router.post("/announcements", createAnnouncement);
router.put("/announcements/:id", updateAnnouncement);
router.delete("/announcements/:id", deleteAnnouncement);

// ── Check-in / attendance ────────────────────────────────────────────────────
router.post("/checkin", checkInByToken);
router.post("/checkin/manual", manualCheckIn);
router.get("/attendance", listAttendance);

// ── Trainers ─────────────────────────────────────────────────────────────────
router.get("/trainers", listTrainers);
router.post("/trainers", createTrainer);
router.put("/trainers/:id", updateTrainer);
router.get("/trainers/:id/members", getTrainerMembers);
router.delete("/trainers/:id", deleteTrainer);

export default router;
