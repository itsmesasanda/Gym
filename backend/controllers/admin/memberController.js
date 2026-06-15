import User from "../../models/User.js";
import { gymScope } from "../../middleware/adminAuth.js";
import { calcTargets } from "../userController.js";

// Never expose credentials / reset material.
const SAFE_FIELDS = "-password -resetCodeHash -resetCodeExpires";

const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
const num = (v) => (v === "" || v === null || v === undefined ? undefined : Number(v));

// POST /api/admin/members  — create a member directly (front-desk signup).
// Record-only: no password is set; the member claims app access later by
// registering in-app with this same email.
export const createMember = async (req, res) => {
  try {
    const b = req.body || {};
    const name = (b.name || "").trim();
    const email = (b.email || "").toLowerCase().trim();

    if (!name || !email) {
      return res.status(400).json({ message: "Name and email are required" });
    }
    if (!isEmail(email)) {
      return res.status(400).json({ message: "Enter a valid email address" });
    }

    // gym_admin → their own gym; super_admin must specify which gym.
    const gymId = req.admin.gymId || b.gymId || null;
    if (!gymId) {
      return res.status(400).json({ message: "A gym must be selected for this member" });
    }

    // Email is globally unique — surface a clear conflict to the admin (unlike
    // the member-facing flow, an admin is trusted to know an email is taken).
    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(409).json({ message: "A member with this email already exists" });
    }

    const height = num(b.height);
    const weight = num(b.weight);
    const goal = b.goal || undefined;
    const activityLevel = b.activityLevel || undefined;
    const targets = height && weight ? calcTargets({ weight, height, activityLevel, goal }) : null;

    const member = await User.create({
      name,
      email,
      gymId,
      source: "admin",
      status: ["pending", "active", "locked", "rejected"].includes(b.status) ? b.status : "active",

      // contact & personal
      phone: (b.phone || "").trim(),
      gender: ["male", "female", "other"].includes(b.gender) ? b.gender : "",
      dateOfBirth: b.dateOfBirth ? new Date(b.dateOfBirth) : null,
      emergencyContactName: (b.emergencyContactName || "").trim(),
      emergencyContactPhone: (b.emergencyContactPhone || "").trim(),

      // fitness profile
      height,
      weight,
      goal,
      activityLevel,
      ...(targets ? { calories: targets.calories, protein: targets.protein } : {}),

      // membership & billing
      membershipPlan: (b.membershipPlan || "").trim(),
      paymentStatus: ["paid", "overdue", "none"].includes(b.paymentStatus) ? b.paymentStatus : "none",
      joinDate: b.joinDate ? new Date(b.joinDate) : Date.now(),
      nextPaymentDate: b.nextPaymentDate ? new Date(b.nextPaymentDate) : null,
    });

    const safe = member.toObject();
    delete safe.password;
    delete safe.resetCodeHash;
    delete safe.resetCodeExpires;
    res.status(201).json(safe);
  } catch (err) {
    if (err.name === "ValidationError") return res.status(400).json({ message: err.message });
    if (err.code === 11000) return res.status(409).json({ message: "A member with this email already exists" });
    console.error("[admin/createMember]", err);
    res.status(500).json({ message: "Failed to create member" });
  }
};

// GET /api/admin/members?status=&search=
export const listMembers = async (req, res) => {
  try {
    const { status, search } = req.query;
    const filter = { ...gymScope(req) };

    if (status && status !== "all") filter.status = status;
    if (search?.trim()) {
      const rx = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [{ name: rx }, { email: rx }];
    }

    const members = await User.find(filter).select(SAFE_FIELDS).sort({ createdAt: -1 });
    res.json(members);
  } catch (err) {
    console.error("[admin/listMembers]", err);
    res.status(500).json({ message: "Failed to load members" });
  }
};

// GET /api/admin/members/:id
export const getMember = async (req, res) => {
  try {
    const member = await User.findOne({ _id: req.params.id, ...gymScope(req) }).select(SAFE_FIELDS);
    if (!member) return res.status(404).json({ message: "Member not found" });
    res.json(member);
  } catch (err) {
    console.error("[admin/getMember]", err);
    res.status(500).json({ message: "Failed to load member" });
  }
};

// Shared status mutator. The gymScope in the filter guarantees a gym_admin can
// only ever change members belonging to their own gym.
const setStatus = (status) => async (req, res) => {
  try {
    const member = await User.findOneAndUpdate(
      { _id: req.params.id, ...gymScope(req) },
      { status },
      { new: true }
    ).select(SAFE_FIELDS);
    if (!member) return res.status(404).json({ message: "Member not found" });
    res.json(member);
  } catch (err) {
    console.error("[admin/setStatus]", err);
    res.status(500).json({ message: "Update failed" });
  }
};

export const approveMember = setStatus("active");   // PATCH /:id/approve
export const rejectMember  = setStatus("rejected"); // PATCH /:id/reject
export const lockMember    = setStatus("locked");   // PATCH /:id/lock
export const unlockMember  = setStatus("active");   // PATCH /:id/unlock
