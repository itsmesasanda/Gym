const Video = require('../models/Video');

// Maps original Announcement logic
exports.getAllVideos = async (req, res) => {
  try {
    const videos = await Video.find().sort({ pinned: -1, createdAt: -1 });
    res.json(videos);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.createVideo = async (req, res) => {
  try {
    const video = new Video(req.body);
    await video.save();
    res.status(201).json(video);
  } catch (err) { res.status(400).json({ error: err.message }); }
};

exports.updateVideo = async (req, res) => {
  try {
    const video = await Video.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(video);
  } catch (err) { res.status(400).json({ error: err.message }); }
};

exports.deleteVideo = async (req, res) => {
  try {
    await Video.findByIdAndDelete(req.params.id);
    res.json({ message: 'Video deleted' });
  } catch (err) { res.status(400).json({ error: err.message }); }
};
