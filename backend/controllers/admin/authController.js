import jwt from "jsonwebtoken";
import Admin from "../../models/Admin.js";
import Gym from "../../models/Gym.js";

const signToken = (id) =>
  jwt.sign({ id }, process.env.ADMIN_JWT_SECRET, { expiresIn: "1d" });

const gymPublic = (gym) =>
  gym
    ? { id: gym._id, name: gym.name, code: gym.code, branding: gym.branding, status: gym.status }
    : null;

const adminPublic = (admin) => ({
  id: admin._id,
  name: admin.name,
  email: admin.email,
  role: admin.role,
  gymId: admin.gymId,
});

// POST /api/admin/auth/login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const admin = await Admin.findOne({ email: email.toLowerCase().trim() });
    // Same message for unknown email vs wrong password — no account enumeration.
    if (!admin || !(await admin.matchPassword(password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const gym = admin.gymId ? await Gym.findById(admin.gymId) : null;

    res.json({
      token: signToken(admin._id),
      admin: adminPublic(admin),
      gym: gymPublic(gym),
    });
  } catch (err) {
    console.error("[admin/login]", err);
    res.status(500).json({ message: "Login failed" });
  }
};

// GET /api/admin/auth/me  (adminProtect)
export const me = async (req, res) => {
  try {
    const gym = req.admin.gymId ? await Gym.findById(req.admin.gymId) : null;
    res.json({ admin: adminPublic(req.admin), gym: gymPublic(gym) });
  } catch (err) {
    console.error("[admin/me]", err);
    res.status(500).json({ message: "Failed to load session" });
  }
};
