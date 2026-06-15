import express from "express";

import { adminProtect, requireRole } from "../../middleware/adminAuth.js";
import { listGyms, createGym, updateGym, setGymStatus } from "../../controllers/super/gymController.js";
import { getPlatformStats } from "../../controllers/super/analyticsController.js";
import { listAllMembers } from "../../controllers/super/memberController.js";
import {
  listAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from "../../controllers/super/announcementController.js";

const router = express.Router();

// Every super route requires a valid admin token AND the super_admin role.
router.use(adminProtect, requireRole("super_admin"));

// ── Platform analytics ──────────────────────────────────────────────────────
router.get("/analytics", getPlatformStats);

// ── Gym management ──────────────────────────────────────────────────────────
router.get("/gyms", listGyms);
router.post("/gyms", createGym);
router.put("/gyms/:id", updateGym);
router.patch("/gyms/:id/status", setGymStatus);

// ── Members (across all gyms) ───────────────────────────────────────────────
// Status actions (lock/unlock/approve/reject) reuse /api/admin/members/:id/*,
// which already operate platform-wide for a super_admin (gymScope → {}).
router.get("/members", listAllMembers);

// ── Platform-wide announcements (gymId = null) ──────────────────────────────
router.get("/announcements", listAnnouncements);
router.post("/announcements", createAnnouncement);
router.put("/announcements/:id", updateAnnouncement);
router.delete("/announcements/:id", deleteAnnouncement);

export default router;
