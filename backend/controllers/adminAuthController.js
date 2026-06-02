import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";

// POST /api/admin/auth/register  (requires existing admin token — see adminAuthRoutes.js)
export const registerAdmin = async (req, res) => {
  try {
    const { email, password, role } = req.body;
    const existing = await Admin.findOne({ email });
    if (existing) return res.status(409).json({ error: "Admin already exists." });

    const hashed = await bcrypt.hash(password, 12);
    const admin  = new Admin({ email, password: hashed, role: role || "admin" });
    await admin.save();

    res.status(201).json({ message: "Admin registered successfully." });
  } catch (err) {
    console.error("[registerAdmin] error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// POST /api/admin/auth/login
export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email });

    // Constant-time comparison even when admin doesn't exist — prevents email enumeration
    const match = admin ? await bcrypt.compare(password, admin.password) : false;
    if (!admin || !match) return res.status(401).json({ error: "Invalid credentials." });

    const token = jwt.sign(
      { id: admin._id, email: admin.email, role: admin.role },
      process.env.ADMIN_JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.json({
      token,
      admin: { id: admin._id, email: admin.email, role: admin.role },
    });
  } catch (err) {
    console.error("[loginAdmin] error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// GET /api/admin/auth/me  (protected)
export const getMe = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id).select("-password");
    if (!admin) return res.status(404).json({ error: "Admin not found." });
    res.json(admin);
  } catch (err) {
    console.error("[getMe] error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
