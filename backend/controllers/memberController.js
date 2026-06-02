import Member from "../models/Member.js";

const pickFields = ({ name, email, phone, plan, paid, notes, joinDate }) => ({
  ...(name      !== undefined && { name }),
  ...(email     !== undefined && { email }),
  ...(phone     !== undefined && { phone }),
  ...(plan      !== undefined && { plan }),
  ...(paid      !== undefined && { paid }),
  ...(notes     !== undefined && { notes }),
  ...(joinDate  !== undefined && { joinDate }),
});

export const getAllUsers = async (req, res) => {
  try {
    const users = await Member.find().sort({ createdAt: -1 });
    res.json(users);
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const createUser = async (req, res) => {
  try {
    const user = new Member(pickFields(req.body));
    await user.save();
    res.status(201).json(user);
  } catch (err) {
    if (err?.name === "ValidationError") {
      return res.status(400).json({ error: "Invalid member data" });
    }
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateUser = async (req, res) => {
  try {
    const user = await Member.findByIdAndUpdate(
      req.params.id,
      pickFields(req.body),
      { new: true, runValidators: true }
    );
    if (!user) return res.status(404).json({ error: "Member not found" });
    res.json(user);
  } catch (err) {
    if (err?.name === "ValidationError" || err?.name === "CastError") {
      return res.status(400).json({ error: "Invalid member data" });
    }
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteUser = async (req, res) => {
  try {
    await Member.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted" });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
};
