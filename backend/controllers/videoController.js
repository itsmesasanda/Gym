import Video from "../models/Video.js";
import { isValidThumbnailUrl, isValidYouTubeUrl, normalizeThumbnail } from "../utils/videoValidation.js";

// -- Helpers ------------------------------------------------------------------

const buildVideoPayload = ({ title, description, category, thumbnail, youtubeUrl }) => ({
  title: (title || "").trim(),
  description: (description || "").trim(),
  category: (category || "General").trim() || "General",
  thumbnail: normalizeThumbnail(thumbnail, youtubeUrl),
  youtubeUrl: (youtubeUrl || "").trim(),
});

const validateVideoInput = ({ title, description, youtubeUrl, thumbnail }) => {
  if (!title?.trim() || !description?.trim() || !youtubeUrl?.trim()) {
    return "title, description and youtubeUrl are required";
  }

  if (!isValidYouTubeUrl(youtubeUrl)) {
    return "youtubeUrl must be a valid YouTube video URL";
  }

  if (!isValidThumbnailUrl(thumbnail)) {
    return "thumbnail must be a YouTube URL or a direct image URL";
  }

  return null;
};

const sendWriteError = (res, err) => {
  if (err?.name === "ValidationError" || err?.name === "CastError") {
    return res.status(400).json({ error: err.message });
  }

  return res.status(500).json({ error: err.message });
};

// ── Public — GET /api/videos ─────────────────────────────────────────────────
export const getVideos = async (req, res) => {
  try {
    const videos = await Video.find().sort({ createdAt: -1 });
    res.status(200).json({ count: videos.length, videos });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── Admin — GET /api/admin/videos ────────────────────────────────────────────
export const getAllVideos = async (req, res) => {
  try {
    const videos = await Video.find().sort({ createdAt: -1 });
    res.status(200).json({ count: videos.length, videos });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── Admin — POST /api/admin/videos ───────────────────────────────────────────
export const createVideo = async (req, res) => {
  try {
    const validationError = validateVideoInput(req.body);
    if (validationError) return res.status(400).json({ error: validationError });

    const video = await Video.create(buildVideoPayload(req.body));
    res.status(201).json({ message: "Video created successfully", video });
  } catch (err) {
    sendWriteError(res, err);
  }
};

// ── Admin — PUT /api/admin/videos/:id ────────────────────────────────────────
export const updateVideo = async (req, res) => {
  try {
    const validationError = validateVideoInput(req.body);
    if (validationError) return res.status(400).json({ error: validationError });

    const video = await Video.findByIdAndUpdate(
      req.params.id,
      buildVideoPayload(req.body),
      { new: true, runValidators: true }
    );

    if (!video) return res.status(404).json({ error: "Video not found" });
    res.status(200).json({ message: "Video updated successfully", video });
  } catch (err) {
    sendWriteError(res, err);
  }
};

// ── Admin — DELETE /api/admin/videos/:id ─────────────────────────────────────
export const deleteVideo = async (req, res) => {
  try {
    const video = await Video.findByIdAndDelete(req.params.id);
    if (!video) return res.status(404).json({ error: "Video not found" });
    res.status(200).json({ message: "Video deleted successfully" });
  } catch (err) {
    sendWriteError(res, err);
  }
};
