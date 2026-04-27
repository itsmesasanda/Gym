import Member from "../models/Member.js";

export const getAllUsers = async (req, res) => {
  try {
    const users = await Member.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

export const createUser = async (req, res) => {
  try {
    const user = new Member(req.body);
    await user.save();
    res.status(201).json(user);
  } catch (err) { res.status(400).json({ error: err.message }); }
};

export const updateUser = async (req, res) => {
  try {
    const user = await Member.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(user);
  } catch (err) { res.status(400).json({ error: err.message }); }
};

export const deleteUser = async (req, res) => {
  try {
    await Member.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted" });
  } catch (err) { res.status(400).json({ error: err.message }); }
};
