import Video from "../models/Video.js";

// ── Public — GET /api/videos ─────────────────────────────────────────────────
// Admin video management (create/update/delete) is rebuilt in Phase 2 with
// gym-scoped, role-checked handlers — do not re-add un-scoped admin CRUD here.
export const getVideos = async (req, res) => {
  try {
    const videos = await Video.find().sort({ createdAt: -1 });
    res.status(200).json({ count: videos.length, videos });
  } catch (err) {
    console.error("[getVideos] error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
