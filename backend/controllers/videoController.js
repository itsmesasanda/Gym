import Video from "../models/Video.js";

// ── Helpers ──────────────────────────────────────────────────────────────────

const extractYouTubeVideoId = (url) => {
  const trimmed = (url || "").trim();
  if (!trimmed) return null;
  const match = trimmed.match(
    /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
  );
  return match?.[1] ?? null;
};

const normalizeThumbnail = (thumbnail, youtubeUrl) => {
  const t = (thumbnail || "").trim();
  if (t) {
    const tid = extractYouTubeVideoId(t);
    if (tid) return `https://img.youtube.com/vi/${tid}/hqdefault.jpg`;
    if (/^https?:\/\//i.test(t)) return t;
  }
  const yid = extractYouTubeVideoId(youtubeUrl || "");
  if (yid) return `https://img.youtube.com/vi/${yid}/hqdefault.jpg`;
  return "";
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
    const { title, description, category, thumbnail, youtubeUrl } = req.body;

    if (!title || !description || !thumbnail || !youtubeUrl) {
      return res.status(400).json({
        error: "title, description, thumbnail and youtubeUrl are required",
      });
    }

    const video = await Video.create({
      title,
      description,
      category: category || "General",
      thumbnail: normalizeThumbnail(thumbnail, youtubeUrl),
      youtubeUrl,
    });
    res.status(201).json({ message: "Video created successfully", video });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── Admin — PUT /api/admin/videos/:id ────────────────────────────────────────
export const updateVideo = async (req, res) => {
  try {
    const { title, description, category, thumbnail, youtubeUrl } = req.body;

    if (!title || !description || !thumbnail || !youtubeUrl) {
      return res.status(400).json({
        error: "title, description, thumbnail and youtubeUrl are required",
      });
    }

    const video = await Video.findByIdAndUpdate(
      req.params.id,
      {
        title,
        description,
        category: category || "General",
        thumbnail: normalizeThumbnail(thumbnail, youtubeUrl),
        youtubeUrl,
      },
      { new: true, runValidators: true }
    );

    if (!video) return res.status(404).json({ error: "Video not found" });
    res.status(200).json({ message: "Video updated successfully", video });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── Admin — DELETE /api/admin/videos/:id ─────────────────────────────────────
export const deleteVideo = async (req, res) => {
  try {
    const video = await Video.findByIdAndDelete(req.params.id);
    if (!video) return res.status(404).json({ error: "Video not found" });
    res.status(200).json({ message: "Video deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
