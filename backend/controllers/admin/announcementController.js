import Announcement from "../../models/Announcement.js";
import { gymScope } from "../../middleware/adminAuth.js";

const buildPayload = (body, gymId) => ({
  title:    (body.title || "").trim(),
  body:     (body.body || "").trim(),
  date:     (body.date || new Date().toISOString().slice(0, 10)).trim(),
  pinned:   Boolean(body.pinned),
  priority: ["normal", "high"].includes(body.priority) ? body.priority : "normal",
  ...(gymId ? { gymId } : {}),
});

// GET /api/admin/announcements
export const listAnnouncements = async (req, res) => {
  try {
    const items = await Announcement.find(gymScope(req)).sort({ pinned: -1, createdAt: -1 });
    res.json(items);
  } catch (err) {
    console.error("[admin/listAnnouncements]", err);
    res.status(500).json({ message: "Failed to load announcements" });
  }
};

// POST /api/admin/announcements
export const createAnnouncement = async (req, res) => {
  try {
    const item = await Announcement.create(buildPayload(req.body, req.admin.gymId));
    res.status(201).json(item);
  } catch (err) {
    if (err.name === "ValidationError") return res.status(400).json({ message: err.message });
    console.error("[admin/createAnnouncement]", err);
    res.status(500).json({ message: "Failed to create announcement" });
  }
};

// PUT /api/admin/announcements/:id
export const updateAnnouncement = async (req, res) => {
  try {
    const item = await Announcement.findOneAndUpdate(
      { _id: req.params.id, ...gymScope(req) },
      buildPayload(req.body, req.admin.gymId),
      { new: true, runValidators: true }
    );
    if (!item) return res.status(404).json({ message: "Announcement not found" });
    res.json(item);
  } catch (err) {
    if (err.name === "ValidationError") return res.status(400).json({ message: err.message });
    console.error("[admin/updateAnnouncement]", err);
    res.status(500).json({ message: "Update failed" });
  }
};

// DELETE /api/admin/announcements/:id
export const deleteAnnouncement = async (req, res) => {
  try {
    const item = await Announcement.findOneAndDelete({ _id: req.params.id, ...gymScope(req) });
    if (!item) return res.status(404).json({ message: "Announcement not found" });
    res.json({ message: "Announcement deleted" });
  } catch (err) {
    console.error("[admin/deleteAnnouncement]", err);
    res.status(500).json({ message: "Delete failed" });
  }
};
