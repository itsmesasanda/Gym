import bcrypt from "bcryptjs";
import Gym from "../../models/Gym.js";
import Admin from "../../models/Admin.js";
import User from "../../models/User.js";

// Unambiguous alphabet (no 0/O/1/I) for human-readable gym codes.
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const genCode = (n = 6) =>
  Array.from({ length: n }, () => CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]).join("");

const uniqueCode = async () => {
  for (let i = 0; i < 12; i++) {
    const c = genCode();
    if (!(await Gym.findOne({ code: c }))) return c;
  }
  throw new Error("Could not generate a unique gym code");
};

const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
const normalizeCode = (s) => (s || "").toUpperCase().replace(/\s+/g, "");
const isValidCode = (s) => /^[A-Z0-9]{4,12}$/.test(s);
const MIN_ADMIN_PASSWORD = 8;

// GET /api/super/gyms  — every gym with member & admin counts.
export const listGyms = async (_req, res) => {
  try {
    const gyms = await Gym.find().sort({ createdAt: -1 }).lean();

    const [memberCounts, adminCounts] = await Promise.all([
      User.aggregate([{ $match: { gymId: { $ne: null } } }, { $group: { _id: "$gymId", n: { $sum: 1 } } }]),
      Admin.aggregate([{ $match: { gymId: { $ne: null } } }, { $group: { _id: "$gymId", n: { $sum: 1 } } }]),
    ]);
    const mMap = Object.fromEntries(memberCounts.map((c) => [String(c._id), c.n]));
    const aMap = Object.fromEntries(adminCounts.map((c) => [String(c._id), c.n]));

    res.json(
      gyms.map((g) => ({
        ...g,
        memberCount: mMap[String(g._id)] || 0,
        adminCount: aMap[String(g._id)] || 0,
      }))
    );
  } catch (err) {
    console.error("[super/listGyms]", err);
    res.status(500).json({ message: "Failed to load gyms" });
  }
};

// POST /api/super/gyms  — create a gym (auto gym code) and optionally its first
// gym_admin. If an admin email is given, a temp password is generated and
// returned ONCE so the super admin can hand it over.
export const createGym = async (req, res) => {
  try {
    const b = req.body || {};
    const name = (b.name || "").trim();
    if (!name) return res.status(400).json({ message: "Gym name is required" });

    const adminName = (b.adminName || "").trim();
    const adminEmail = (b.adminEmail || "").toLowerCase().trim();
    const adminPassword = b.adminPassword || "";

    // Validate the gym admin (if one is being onboarded) before creating anything.
    if (adminEmail) {
      if (!isEmail(adminEmail)) return res.status(400).json({ message: "Enter a valid admin email" });
      if (adminPassword.length < MIN_ADMIN_PASSWORD) {
        return res.status(400).json({ message: `Admin password must be at least ${MIN_ADMIN_PASSWORD} characters` });
      }
      if (await Admin.findOne({ email: adminEmail })) {
        return res.status(409).json({ message: "An admin with that email already exists" });
      }
    }

    // Use the gym code the super admin typed, else auto-generate a unique one.
    let code;
    if (String(b.code || "").trim() !== "") {
      code = normalizeCode(b.code);
      if (!isValidCode(code)) {
        return res.status(400).json({ message: "Gym code must be 4–12 letters or numbers" });
      }
      if (await Gym.findOne({ code })) {
        return res.status(409).json({ message: "That gym code is already taken" });
      }
    } else {
      code = await uniqueCode();
    }

    const gym = await Gym.create({
      name,
      code,
      address: (b.address || "").trim(),
      contactEmail: (b.contactEmail || "").toLowerCase().trim(),
      contactPhone: (b.contactPhone || "").trim(),
      branding: { primaryColor: b.primaryColor || "#C8FF00", logoUrl: (b.logoUrl || "").trim() },
      status: "active",
    });

    let adminCreds = null;
    if (adminEmail) {
      await Admin.create({
        name: adminName || "Gym Admin",
        email: adminEmail,
        password: await bcrypt.hash(adminPassword, 12),
        role: "gym_admin",
        gymId: gym._id,
      });
      adminCreds = { email: adminEmail };
    }

    res.status(201).json({ gym, adminCreds });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: "Gym code or admin email already in use" });
    console.error("[super/createGym]", err);
    res.status(500).json({ message: "Failed to create gym" });
  }
};

// PUT /api/super/gyms/:id  — edit basic info & branding.
export const updateGym = async (req, res) => {
  try {
    const b = req.body || {};
    const update = {};
    if (b.name !== undefined) update.name = b.name.trim();
    if (b.address !== undefined) update.address = b.address.trim();
    if (b.contactEmail !== undefined) update.contactEmail = b.contactEmail.toLowerCase().trim();
    if (b.contactPhone !== undefined) update.contactPhone = b.contactPhone.trim();
    if (b.primaryColor !== undefined) update["branding.primaryColor"] = b.primaryColor;
    if (b.logoUrl !== undefined) update["branding.logoUrl"] = b.logoUrl.trim();

    const gym = await Gym.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!gym) return res.status(404).json({ message: "Gym not found" });
    res.json(gym);
  } catch (err) {
    console.error("[super/updateGym]", err);
    res.status(500).json({ message: "Update failed" });
  }
};

// PATCH /api/super/gyms/:id/status  — enable / disable a gym.
export const setGymStatus = async (req, res) => {
  try {
    const { status } = req.body || {};
    if (!["active", "disabled"].includes(status)) {
      return res.status(400).json({ message: "status must be 'active' or 'disabled'" });
    }
    const gym = await Gym.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!gym) return res.status(404).json({ message: "Gym not found" });
    res.json(gym);
  } catch (err) {
    console.error("[super/setGymStatus]", err);
    res.status(500).json({ message: "Update failed" });
  }
};
