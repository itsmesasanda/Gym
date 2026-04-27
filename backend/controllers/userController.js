import User from "../models/User.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || "user_secret_key", {
    expiresIn: "7d",
  });
};

export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
    });

  } catch (error) {
    console.error("registerUser error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && await user.matchPassword(password)) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: "Invalid credentials" });
    }

  } catch (error) {
    console.error("loginUser error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    const {
      name,
      goal,
      targetWeight,
      height,
      weight,
      activityLevel,
      calories,
      protein,
      password,
    } = req.body;

    const user = req.user?.save ? req.user : await User.findById(req.user?._id || req.user?.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (name !== undefined) user.name = name;
    if (goal !== undefined) user.goal = goal;
    if (targetWeight !== undefined) user.targetWeight = targetWeight;
    if (height !== undefined) user.height = height;
    if (weight !== undefined) user.weight = weight;
    if (activityLevel !== undefined) user.activityLevel = activityLevel;
    if (calories !== undefined) user.calories = calories;
    if (protein !== undefined) user.protein = protein;
    if (password) user.password = await bcrypt.hash(password, 10);

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      goal: updatedUser.goal,
      targetWeight: updatedUser.targetWeight,
      height: updatedUser.height,
      weight: updatedUser.weight,
      activityLevel: updatedUser.activityLevel,
      calories: updatedUser.calories,
      protein: updatedUser.protein,
    });

  } catch (error) {
    console.error("updateUserProfile error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getUserProfile = async (req, res) => {
  try {
    const user = req.user?.save ? req.user : await User.findById(req.user?._id || req.user?.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const safeUser = user.toObject ? user.toObject() : user;
    delete safeUser.password;
    res.json(safeUser);
  } catch (error) {
    console.error("getUserProfile error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const user = req.user?.deleteOne
      ? req.user
      : await User.findByIdAndDelete(req.user?._id || req.user?.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.deleteOne) {
      await user.deleteOne();
    }

    res.json({ message: "User deleted successfully" });

  } catch (error) {
    console.error("deleteUser error:", error);
    res.status(500).json({ message: error.message });
  }
};
