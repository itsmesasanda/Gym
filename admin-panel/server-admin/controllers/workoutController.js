const Workout = require('../models/Workout');

exports.getAllWorkouts = async (req, res) => {
  try {
    const workouts = await Workout.find().sort({ createdAt: -1 });
    res.json(workouts);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.createWorkout = async (req, res) => {
  try {
    const workout = new Workout(req.body);
    await workout.save();
    res.status(201).json(workout);
  } catch (err) { res.status(400).json({ error: err.message }); }
};

exports.updateWorkout = async (req, res) => {
  try {
    const workout = await Workout.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(workout);
  } catch (err) { res.status(400).json({ error: err.message }); }
};

exports.deleteWorkout = async (req, res) => {
  try {
    await Workout.findByIdAndDelete(req.params.id);
    res.json({ message: 'Workout deleted' });
  } catch (err) { res.status(400).json({ error: err.message }); }
};
