import Announcement from "../../models/Announcement.js";

// Platform-wide announcements are the ones with gymId = null (visible to every
// gym's members). The super admin owns these; gym admins own their own gym's.
const buildPayload = (b) => ({
  title:    (b.title || "").trim(),
  body:     (b.body || "").trim(),
  date:     (b.date || new Date().toISOString().slice(0, 10)).trim(),
  pinned:   Boolean(b.pinned),
  priority: ["normal", "high"].includes(b.priority) ? b.priority : "normal",
  gymId:    null,
});

export const listAnnouncements = async (_req, res) => {
  try {
    const items = await Announcement.find({ gymId: null }).sort({ pinned: -1, createdAt: -1 });
    res.json(items);
  } catch (err) {
    console.error("[super/listAnnouncements]", err);
    res.status(500).json({ message: "Failed to load announcements" });
  }
};

export const createAnnouncement = async (req, res) => {
  try {
    const item = await Announcement.create(buildPayload(req.body));
    res.status(201).json(item);
  } catch (err) {
    if (err.name === "ValidationError") return res.status(400).json({ message: err.message });
    console.error("[super/createAnnouncement]", err);
    res.status(500).json({ message: "Failed to create announcement" });
  }
};

export const updateAnnouncement = async (req, res) => {
  try {
    const item = await Announcement.findOneAndUpdate(
      { _id: req.params.id, gymId: null },
      buildPayload(req.body),
      { new: true, runValidators: true }
    );
    if (!item) return res.status(404).json({ message: "Announcement not found" });
    res.json(item);
  } catch (err) {
    if (err.name === "ValidationError") return res.status(400).json({ message: err.message });
    console.error("[super/updateAnnouncement]", err);
    res.status(500).json({ message: "Update failed" });
  }
};

export const deleteAnnouncement = async (req, res) => {
  try {
    const item = await Announcement.findOneAndDelete({ _id: req.params.id, gymId: null });
    if (!item) return res.status(404).json({ message: "Announcement not found" });
    res.json({ message: "Announcement deleted" });
  } catch (err) {
    console.error("[super/deleteAnnouncement]", err);
    res.status(500).json({ message: "Delete failed" });
  }
};
