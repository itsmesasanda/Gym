const Announcement = require('../models/Announcement');
const Event = require('../models/Event');
const Meal = require('../models/Meal');
const Workout = require('../models/Workout');
const Video = require('../models/Video');
const Payment = require('../models/Payment');

exports.getAnnouncements = async (_req, res) => {
  try {
    const data = await Announcement.find().sort({ createdAt: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getEvents = async (_req, res) => {
  try {
    const data = await Event.find().sort({ createdAt: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMeals = async (_req, res) => {
  try {
    const data = await Meal.find().sort({ createdAt: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getWorkouts = async (_req, res) => {
  try {
    const data = await Workout.find().sort({ createdAt: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getVideos = async (_req, res) => {
  try {
    const data = await Video.find().sort({ createdAt: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMyPayments = async (req, res) => {
  try {
    const data = await Payment.find({
      $or: [
        { userId: req.user.id },
        { userEmail: req.user.email },
      ],
    }).sort({ paymentDate: -1 });

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
