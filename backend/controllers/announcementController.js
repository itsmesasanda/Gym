import Announcement from "../models/Announcement.js";
import { validateAnnouncementData } from "../utils/contentValidation.js";

const validationError = (res, errors) =>
  res.status(400).json({ error: "Validation failed", errors });

export const getAllAnnouncements = async (_req, res) => {
  try {
    const announcements = await Announcement.find().sort({ pinned: -1, createdAt: -1 });
    res.json(announcements);
  } catch (err) {
    console.error("[getAllAnnouncements] error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const createAnnouncement = async (req, res) => {
  try {
    const validation = validateAnnouncementData(req.body);
    if (!validation.isValid) return validationError(res, validation.errors);

    const announcement = await Announcement.create(req.body);
    res.status(201).json(announcement);
  } catch (err) {
    console.error("[createAnnouncement] error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateAnnouncement = async (req, res) => {
  try {
    const validation = validateAnnouncementData(req.body);
    if (!validation.isValid) return validationError(res, validation.errors);

    const announcement = await Announcement.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!announcement) return res.status(404).json({ error: "Announcement not found" });
    res.json(announcement);
  } catch (err) {
    console.error("[updateAnnouncement] error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findByIdAndDelete(req.params.id);
    if (!announcement) return res.status(404).json({ error: "Announcement not found" });
    res.json({ message: "Announcement deleted" });
  } catch (err) {
    console.error("[deleteAnnouncement] error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
