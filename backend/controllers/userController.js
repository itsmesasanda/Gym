import User from "../models/User.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

if (!process.env.JWT_SECRET) {
  throw new Error("FATAL: JWT_SECRET environment variable is not set");
}

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

const PASSWORD_MIN = 8;
const validatePassword = (pw) => {
  if (!pw || pw.length < PASSWORD_MIN) return `Password must be at least ${PASSWORD_MIN} characters`;
  if (!/\d/.test(pw))                  return "Password must contain at least one number";
  return null;
};

export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    const pwErr = validatePassword(password);
    if (pwErr) return res.status(400).json({ message: pwErr });

    // Generic response to prevent email enumeration
    const exists = await User.findOne({ email: email.toLowerCase().trim() });
    if (exists) {
      // Same 201 shape — attacker can't distinguish existing vs new account
      return res.status(201).json({ message: "Account created. Please log in." });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name:     name.trim(),
      email:    email.toLowerCase().trim(),
      password: hashedPassword,
    });

    res.status(201).json({
      _id:   user._id,
      name:  user.name,
      email: user.email,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error("registerUser error:", error);
    res.status(500).json({ message: "Registration failed" });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (user && await user.matchPassword(password)) {
      return res.json({
        _id:   user._id,
        name:  user.name,
        email: user.email,
        token: generateToken(user._id),
      });
    }

    // Same message for wrong email vs wrong password — prevents enumeration
    return res.status(401).json({ message: "Invalid email or password" });
  } catch (error) {
    console.error("loginUser error:", error);
    res.status(500).json({ message: "Login failed" });
  }
};

const calcTargets = ({ weight, height, activityLevel, goal }) => {
  if (!weight || !height) return null;
  const BMR        = 10 * weight + 6.25 * height - 5 * 25 + 5;
  const multiplier = activityLevel === "low" ? 1.2 : activityLevel === "high" ? 1.9 : 1.55;
  let calories = Math.round(BMR * multiplier);
  if (goal === "muscle_gain") calories += 300;
  if (goal === "fat_loss")    calories -= 300;
  return { calories, protein: Math.round(weight * 2) };
};

export const updateUserProfile = async (req, res) => {
  try {
    const {
      name, goal, targetWeight, height, weight,
      activityLevel, calories, protein, password,
    } = req.body;

    const user = req.user?.save ? req.user : await User.findById(req.user?._id || req.user?.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (name          !== undefined) user.name         = name.trim();
    if (goal          !== undefined) user.goal         = goal;
    if (targetWeight  !== undefined) user.targetWeight = targetWeight;
    if (height        !== undefined) user.height       = height;
    if (weight        !== undefined) user.weight       = weight;
    if (activityLevel !== undefined) user.activityLevel = activityLevel;

    if (password) {
      const pwErr = validatePassword(password);
      if (pwErr) return res.status(400).json({ message: pwErr });
      user.password = await bcrypt.hash(password, 12);
    }

    const bodyChanged         = [goal, height, weight, activityLevel].some(v => v !== undefined);
    const callerSuppliedTargets = calories !== undefined && protein !== undefined;
    if (callerSuppliedTargets) {
      user.calories = calories;
      user.protein  = protein;
    } else if (bodyChanged) {
      const targets = calcTargets({ weight: user.weight, height: user.height, activityLevel: user.activityLevel, goal: user.goal });
      if (targets) { user.calories = targets.calories; user.protein = targets.protein; }
    }

    const updated = await user.save();
    res.json({
      _id:          updated._id,
      name:         updated.name,
      email:        updated.email,
      goal:         updated.goal,
      targetWeight: updated.targetWeight,
      height:       updated.height,
      weight:       updated.weight,
      activityLevel:updated.activityLevel,
      calories:     updated.calories,
      protein:      updated.protein,
    });
  } catch (error) {
    console.error("updateUserProfile error:", error);
    res.status(500).json({ message: "Profile update failed" });
  }
};

export const getUserProfile = async (req, res) => {
  try {
    const user = req.user?.save ? req.user : await User.findById(req.user?._id || req.user?.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({
      _id:          user._id,
      name:         user.name,
      email:        user.email,
      goal:         user.goal,
      targetWeight: user.targetWeight,
      height:       user.height,
      weight:       user.weight,
      activityLevel:user.activityLevel,
      calories:     user.calories,
      protein:      user.protein,
    });
  } catch (error) {
    console.error("getUserProfile error:", error);
    res.status(500).json({ message: "Could not retrieve profile" });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const user = req.user?.deleteOne
      ? req.user
      : await User.findByIdAndDelete(req.user?._id || req.user?.id);

    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.deleteOne) await user.deleteOne();

    res.json({ message: "Account deleted" });
  } catch (error) {
    console.error("deleteUser error:", error);
    res.status(500).json({ message: "Account deletion failed" });
  }
};
