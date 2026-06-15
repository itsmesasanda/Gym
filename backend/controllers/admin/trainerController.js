import Trainer from "../../models/Trainer.js";
import User from "../../models/User.js";
import { gymScope } from "../../middleware/adminAuth.js";

const SAFE_FIELDS = "-password -resetCodeHash -resetCodeExpires";
const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

// Assign the given members to a trainer — but only members that belong to the
// caller's gym (gymScope), so a gym_admin can't pull in another gym's members.
const assignMembers = async (req, trainerId, memberIds) => {
  if (!Array.isArray(memberIds) || memberIds.length === 0) return;
  await User.updateMany(
    { _id: { $in: memberIds }, ...gymScope(req) },
    { trainerId }
  );
};

// GET /api/admin/trainers — trainers in this gym, with assigned-member counts.
export const listTrainers = async (req, res) => {
  try {
    const trainers = await Trainer.find(gymScope(req)).sort({ createdAt: -1 }).lean();

    const memberMatch = { trainerId: { $ne: null } };
    if (req.admin.role !== "super_admin") memberMatch.gymId = req.admin.gymId;
    const counts = await User.aggregate([
      { $match: memberMatch },
      { $group: { _id: "$trainerId", n: { $sum: 1 } } },
    ]);
    const map = Object.fromEntries(counts.map((c) => [String(c._id), c.n]));

    res.json(trainers.map((t) => ({ ...t, memberCount: map[String(t._id)] || 0 })));
  } catch (err) {
    console.error("[admin/listTrainers]", err);
    res.status(500).json({ message: "Failed to load trainers" });
  }
};

// POST /api/admin/trainers — { name, email, memberIds? }
export const createTrainer = async (req, res) => {
  try {
    const name = (req.body.name || "").trim();
    const email = (req.body.email || "").toLowerCase().trim();
    if (!name || !email) return res.status(400).json({ message: "Name and email are required" });
    if (!isEmail(email)) return res.status(400).json({ message: "Enter a valid email address" });

    const gymId = req.admin.gymId || req.body.gymId || null;
    if (!gymId) return res.status(400).json({ message: "A gym must be selected for this trainer" });

    // Email unique within the gym.
    if (await Trainer.findOne({ email, gymId })) {
      return res.status(409).json({ message: "A trainer with that email already exists in this gym" });
    }

    const trainer = await Trainer.create({ name, email, gymId });
    await assignMembers(req, trainer._id, req.body.memberIds);
    res.status(201).json(trainer);
  } catch (err) {
    console.error("[admin/createTrainer]", err);
    res.status(500).json({ message: "Failed to create trainer" });
  }
};

// PUT /api/admin/trainers/:id — update name/email and/or reassign members.
export const updateTrainer = async (req, res) => {
  try {
    const update = {};
    if (req.body.name !== undefined) update.name = (req.body.name || "").trim();
    if (req.body.email !== undefined) {
      const email = (req.body.email || "").toLowerCase().trim();
      if (!isEmail(email)) return res.status(400).json({ message: "Enter a valid email address" });
      update.email = email;
    }

    const trainer = await Trainer.findOneAndUpdate(
      { _id: req.params.id, ...gymScope(req) },
      update,
      { new: true, runValidators: true }
    );
    if (!trainer) return res.status(404).json({ message: "Trainer not found" });

    // Reassign members if a list was provided: clear current, set the new set.
    if (req.body.memberIds !== undefined) {
      await User.updateMany({ trainerId: trainer._id, ...gymScope(req) }, { trainerId: null });
      await assignMembers(req, trainer._id, req.body.memberIds);
    }

    res.json(trainer);
  } catch (err) {
    console.error("[admin/updateTrainer]", err);
    res.status(500).json({ message: "Update failed" });
  }
};

// GET /api/admin/trainers/:id/members — the trainer's assigned members.
export const getTrainerMembers = async (req, res) => {
  try {
    const trainer = await Trainer.findOne({ _id: req.params.id, ...gymScope(req) });
    if (!trainer) return res.status(404).json({ message: "Trainer not found" });

    const members = await User.find({ trainerId: trainer._id, ...gymScope(req) })
      .select(SAFE_FIELDS)
      .sort({ name: 1 });

    res.json({ trainer, members });
  } catch (err) {
    console.error("[admin/getTrainerMembers]", err);
    res.status(500).json({ message: "Failed to load trainer members" });
  }
};

// DELETE /api/admin/trainers/:id — remove the trainer and unassign their members.
export const deleteTrainer = async (req, res) => {
  try {
    const trainer = await Trainer.findOneAndDelete({ _id: req.params.id, ...gymScope(req) });
    if (!trainer) return res.status(404).json({ message: "Trainer not found" });

    await User.updateMany({ trainerId: trainer._id, ...gymScope(req) }, { trainerId: null });
    res.json({ message: "Trainer removed" });
  } catch (err) {
    console.error("[admin/deleteTrainer]", err);
    res.status(500).json({ message: "Delete failed" });
  }
};
