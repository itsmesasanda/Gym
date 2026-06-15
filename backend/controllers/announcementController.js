import Announcement from "../models/Announcement.js";

// ── Member read — GET /api/user/announcements ────────────────────────────────
// Admin announcement management (create/update/delete) is rebuilt in Phase 2
// with gym-scoped, role-checked handlers.
export const getAllAnnouncements = async (_req, res) => {
  try {
    const announcements = await Announcement.find().sort({ pinned: -1, createdAt: -1 });
    res.json(announcements);
  } catch (err) {
    console.error("[getAllAnnouncements] error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
