import User from "../models/User.js";
import Gym from "../models/Gym.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { sendPasswordResetEmail } from "../utils/email.js";

if (!process.env.JWT_SECRET) {
  throw new Error("FATAL: JWT_SECRET environment variable is not set");
}

const RESET_CODE_TTL_MS = 15 * 60 * 1000; // 15 minutes

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

const PASSWORD_MIN = 8;
const validatePassword = (pw) => {
  if (!pw || pw.length < PASSWORD_MIN) return `Password must be at least ${PASSWORD_MIN} characters`;
  if (!/\d/.test(pw))                  return "Password must contain at least one number";
  return null;
};

const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

const normalizeGymCode = (s) => (s || "").toUpperCase().replace(/\s+/g, "").trim();

const gymPublic = (gym) =>
  gym ? { id: gym._id, name: gym.name, code: gym.code, branding: gym.branding } : null;

// Resolve a gym code to an active gym, or return a user-facing error message.
const resolveGym = async (code) => {
  const normalized = normalizeGymCode(code);
  if (!normalized) return { error: "Gym code is required" };
  const gym = await Gym.findOne({ code: normalized });
  if (!gym) return { error: "Invalid gym code" };
  if (gym.status === "disabled") return { error: "This gym is currently unavailable" };
  return { gym };
};

export const registerUser = async (req, res) => {
  try {
    const { name, email, password, gymCode } = req.body;

    const trimmedName     = (name || "").trim();
    const normalizedEmail = (email || "").toLowerCase().trim();

    // Field-by-field validation with specific, user-facing messages.
    if (!trimmedName)              return res.status(400).json({ message: "Please enter your name" });
    if (trimmedName.length < 2)    return res.status(400).json({ message: "Name must be at least 2 characters" });
    if (!normalizedEmail)          return res.status(400).json({ message: "Email is required" });
    if (!isEmail(normalizedEmail)) return res.status(400).json({ message: "Enter a valid email address" });
    if (!password)                 return res.status(400).json({ message: "Password is required" });

    const pwErr = validatePassword(password);
    if (pwErr) return res.status(400).json({ message: pwErr });

    // Validate the gym code before touching the user record, so the response is
    // identical whether or not the email already exists (a gym code's validity
    // isn't secret, but account existence must stay hidden).
    const { gym, error: gymError } = await resolveGym(gymCode);
    if (gymError) return res.status(400).json({ message: gymError });

    const exists = await User.findOne({ email: normalizedEmail });
    if (exists) {
      // Unclaimed admin-created (record-only) account — no password means the
      // member has never used the app. Claim it: set the chosen password. Keep
      // the gym the admin already assigned; only fall back to the entered code
      // if the record somehow has no gym yet. Front-desk bio is preserved;
      // onboarding then updates the fitness fields on this same linked record.
      if (!exists.password) {
        exists.name     = trimmedName || exists.name;
        exists.password = await bcrypt.hash(password, 12);
        if (!exists.gymId) exists.gymId = gym._id;
        await exists.save();
        const linkedGym = exists.gymId ? await Gym.findById(exists.gymId) : gym;
        return res.status(201).json({
          _id:   exists._id,
          name:  exists.name,
          email: exists.email,
          token: generateToken(exists._id),
          gym:   gymPublic(linkedGym),
        });
      }
      // Real, already-claimed account — same 201 shape as a new signup so an
      // attacker can't distinguish existing vs new accounts (no enumeration).
      return res.status(201).json({ message: "Account created. Please log in." });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name:     trimmedName,
      email:    normalizedEmail,
      password: hashedPassword,
      gymId:    gym._id,
      source:   "app",
    });

    res.status(201).json({
      _id:   user._id,
      name:  user.name,
      email: user.email,
      token: generateToken(user._id),
      gym:   gymPublic(gym),
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
      // Auto-detect the member's gym from their account — no gym code needed.
      const gym = user.gymId ? await Gym.findById(user.gymId) : null;
      return res.json({
        _id:   user._id,
        name:  user.name,
        email: user.email,
        token: generateToken(user._id),
        gym:   gymPublic(gym),
      });
    }

    // Same message for wrong email vs wrong password — prevents enumeration
    return res.status(401).json({ message: "Invalid email or password" });
  } catch (error) {
    console.error("loginUser error:", error);
    res.status(500).json({ message: "Login failed" });
  }
};

/**
 * POST /api/users/forgot-password
 * Body: { email }
 * Always responds the same way regardless of whether the email exists, to avoid
 * leaking which addresses are registered. If it exists, emails a 6-digit code.
 */
export const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const normalized = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalized });

    if (user) {
      const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
      user.resetCodeHash    = await bcrypt.hash(code, 10);
      user.resetCodeExpires = new Date(Date.now() + RESET_CODE_TTL_MS);
      await user.save();
      await sendPasswordResetEmail(normalized, code); // never throws
    }

    // Generic response either way.
    return res.json({ message: "If that email is registered, a reset code has been sent." });
  } catch (error) {
    console.error("requestPasswordReset error:", error.message);
    return res.status(500).json({ message: "Could not process request" });
  }
};

/**
 * POST /api/users/reset-password
 * Body: { email, code, password }
 * Verifies the emailed code (hashed, time-limited) and sets a new password.
 */
export const resetPassword = async (req, res) => {
  try {
    const { email, code, password } = req.body;
    if (!email || !code || !password) {
      return res.status(400).json({ message: "Email, code, and new password are required" });
    }

    const pwErr = validatePassword(password);
    if (pwErr) return res.status(400).json({ message: pwErr });

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    // Same message for every failure mode — don't reveal which part was wrong.
    const invalid = () => res.status(400).json({ message: "Invalid or expired reset code" });
    if (!user || !user.resetCodeHash || !user.resetCodeExpires) return invalid();
    if (user.resetCodeExpires < new Date()) return invalid();

    const ok = await bcrypt.compare(String(code), user.resetCodeHash);
    if (!ok) return invalid();

    user.password         = await bcrypt.hash(password, 12);
    user.resetCodeHash    = undefined;
    user.resetCodeExpires = undefined;
    await user.save();

    return res.json({ message: "Password reset. You can now log in." });
  } catch (error) {
    console.error("resetPassword error:", error.message);
    return res.status(500).json({ message: "Could not reset password" });
  }
};

export const calcTargets = ({ weight, height, activityLevel, goal }) => {
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

// GET /api/users/checkin-token — the logged-in member's QR check-in token,
// generated on first request. The app renders this as a QR for the gym to scan.
export const getCheckinToken = async (req, res) => {
  try {
    const user = req.user?.save ? req.user : await User.findById(req.user?._id || req.user?.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (!user.checkinToken) {
      user.checkinToken = crypto.randomBytes(24).toString("hex");
      await user.save();
    }
    res.json({ token: user.checkinToken, payload: `GYMCHK:${user.checkinToken}` });
  } catch (error) {
    console.error("getCheckinToken error:", error);
    res.status(500).json({ message: "Could not load check-in token" });
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
