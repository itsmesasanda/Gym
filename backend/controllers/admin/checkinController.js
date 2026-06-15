import crypto from "crypto";
import User from "../../models/User.js";
import Attendance from "../../models/Attendance.js";
import { gymScope } from "../../middleware/adminAuth.js";

const SAFE_FIELDS = "-password -resetCodeHash -resetCodeExpires";
const QR_PREFIX = "GYMCHK:";
const today = () => new Date().toISOString().slice(0, 10);
const newToken = () => crypto.randomBytes(24).toString("hex");
const memberPublic = (m) => ({ _id: m._id, name: m.name, email: m.email });

// Ensure a member has a check-in token; persist it if newly generated.
const ensureToken = async (member) => {
  if (!member.checkinToken) {
    member.checkinToken = newToken();
    await member.save();
  }
  return member.checkinToken;
};

// Records today's check-in. Uses an atomic upsert on {userId, date} so a repeat
// scan the same day is a no-op ("already") — robust even before the unique
// index finishes building. The unique index is the backstop for concurrent scans.
const recordCheckin = async (member, method, checkedInBy, res) => {
  try {
    const date = today();
    const result = await Attendance.updateOne(
      { userId: member._id, date },
      { $setOnInsert: { gymId: member.gymId ?? null, method, checkedInBy, timestamp: new Date() } },
      { upsert: true }
    );
    const isNew = result.upsertedCount > 0;
    return res.status(isNew ? 201 : 200).json({
      status: isNew ? "checked_in" : "already",
      member: memberPublic(member),
      ...(isNew ? {} : { message: "Already checked in today" }),
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.json({ status: "already", member: memberPublic(member), message: "Already checked in today" });
    }
    console.error("[admin/recordCheckin]", err);
    return res.status(500).json({ message: "Check-in failed" });
  }
};

// POST /api/admin/checkin  { token }  — the gym scanner posts the scanned QR.
export const checkInByToken = async (req, res) => {
  try {
    const raw = (req.body.token || "").trim();
    const token = raw.startsWith(QR_PREFIX) ? raw.slice(QR_PREFIX.length) : raw;
    if (!token) return res.status(400).json({ message: "No QR token provided" });

    const member = await User.findOne({ checkinToken: token, ...gymScope(req) }).select(SAFE_FIELDS);
    if (!member) return res.status(404).json({ message: "QR not recognised for this gym" });

    return recordCheckin(member, "qr", null, res);
  } catch (err) {
    console.error("[admin/checkInByToken]", err);
    res.status(500).json({ message: "Check-in failed" });
  }
};

// POST /api/admin/checkin/manual  { userId }  — staff fallback when QR fails.
export const manualCheckIn = async (req, res) => {
  try {
    const member = await User.findOne({ _id: req.body.userId, ...gymScope(req) }).select(SAFE_FIELDS);
    if (!member) return res.status(404).json({ message: "Member not found" });
    return recordCheckin(member, "manual", req.admin._id, res);
  } catch (err) {
    console.error("[admin/manualCheckIn]", err);
    res.status(500).json({ message: "Check-in failed" });
  }
};

// GET /api/admin/attendance?date=YYYY-MM-DD  — check-ins for a day (default today).
export const listAttendance = async (req, res) => {
  try {
    const date = req.query.date || today();
    const records = await Attendance.find({ date, ...gymScope(req) })
      .sort({ timestamp: -1 })
      .populate("userId", "name email")
      .lean();
    res.json({
      date,
      count: records.length,
      records: records.map((r) => ({
        _id: r._id,
        timestamp: r.timestamp,
        method: r.method,
        member: r.userId,
      })),
    });
  } catch (err) {
    console.error("[admin/listAttendance]", err);
    res.status(500).json({ message: "Failed to load attendance" });
  }
};

// GET /api/admin/members/:id/qr  — the member's QR payload, for the admin to
// show / download / share (e.g. WhatsApp) to members without the app.
export const getMemberQr = async (req, res) => {
  try {
    const member = await User.findOne({ _id: req.params.id, ...gymScope(req) });
    if (!member) return res.status(404).json({ message: "Member not found" });
    const token = await ensureToken(member);
    res.json({ token, payload: `${QR_PREFIX}${token}`, member: memberPublic(member) });
  } catch (err) {
    console.error("[admin/getMemberQr]", err);
    res.status(500).json({ message: "Failed to load member QR" });
  }
};
