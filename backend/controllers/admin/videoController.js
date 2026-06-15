import Video from "../../models/Video.js";
import { normalizeThumbnail } from "../../utils/videoValidation.js";
import { gymScope } from "../../middleware/adminAuth.js";

// Build a clean, gym-stamped payload. gymId is taken from the authenticated
// admin — never from the request body.
const buildPayload = (body, gymId) => ({
  title:       (body.title || "").trim(),
  description: (body.description || "").trim(),
  category:    (body.category || "General").trim() || "General",
  youtubeUrl:  (body.youtubeUrl || "").trim(),
  thumbnail:   normalizeThumbnail((body.thumbnail || "").trim(), body.youtubeUrl),
  ...(gymId ? { gymId } : {}),
});

// GET /api/admin/videos
export const listVideos = async (req, res) => {
  try {
    const videos = await Video.find(gymScope(req)).sort({ createdAt: -1 });
    res.json(videos);
  } catch (err) {
    console.error("[admin/listVideos]", err);
    res.status(500).json({ message: "Failed to load videos" });
  }
};

// POST /api/admin/videos
export const createVideo = async (req, res) => {
  try {
    const video = await Video.create(buildPayload(req.body, req.admin.gymId));
    res.status(201).json(video);
  } catch (err) {
    if (err.name === "ValidationError") return res.status(400).json({ message: err.message });
    console.error("[admin/createVideo]", err);
    res.status(500).json({ message: "Failed to create video" });
  }
};

// PUT /api/admin/videos/:id
export const updateVideo = async (req, res) => {
  try {
    const video = await Video.findOneAndUpdate(
      { _id: req.params.id, ...gymScope(req) },
      buildPayload(req.body, req.admin.gymId),
      { new: true, runValidators: true }
    );
    if (!video) return res.status(404).json({ message: "Video not found" });
    res.json(video);
  } catch (err) {
    if (err.name === "ValidationError") return res.status(400).json({ message: err.message });
    console.error("[admin/updateVideo]", err);
    res.status(500).json({ message: "Update failed" });
  }
};

// DELETE /api/admin/videos/:id
export const deleteVideo = async (req, res) => {
  try {
    const video = await Video.findOneAndDelete({ _id: req.params.id, ...gymScope(req) });
    if (!video) return res.status(404).json({ message: "Video not found" });
    res.json({ message: "Video deleted" });
  } catch (err) {
    console.error("[admin/deleteVideo]", err);
    res.status(500).json({ message: "Delete failed" });
  }
};
