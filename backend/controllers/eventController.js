import Event from "../models/Event.js";

// ── Member read — GET /api/user/events ───────────────────────────────────────
// Admin event management (create/update/delete) is rebuilt in Phase 2 with
// gym-scoped, role-checked handlers.
export const getAllEvents = async (_req, res) => {
  try {
    const events = await Event.find().sort({ createdAt: -1 });
    res.json(events);
  } catch (err) {
    console.error("[getAllEvents] error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
