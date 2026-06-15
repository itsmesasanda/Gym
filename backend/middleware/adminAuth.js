import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";

// Crash at startup if the admin secret is missing — no silent fallback.
if (!process.env.ADMIN_JWT_SECRET) {
  throw new Error("FATAL: ADMIN_JWT_SECRET environment variable is not set");
}

// Verifies the admin JWT and attaches the Admin doc as req.admin.
export const adminProtect = async (req, res, next) => {
  const auth = req.headers.authorization;

  if (!auth?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Not authorized" });
  }

  try {
    const token = auth.split(" ")[1];
    const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET);
    const admin = await Admin.findById(decoded.id).select("-password");
    if (!admin) return res.status(401).json({ message: "Not authorized" });
    req.admin = admin;
    return next();
  } catch {
    return res.status(401).json({ message: "Not authorized" });
  }
};

// Restricts a route to specific admin roles, e.g. requireRole("super_admin").
export const requireRole = (...roles) => (req, res, next) => {
  if (!req.admin || !roles.includes(req.admin.role)) {
    return res.status(403).json({ message: "Forbidden" });
  }
  return next();
};

// The Mongo filter that scopes a query to the caller's gym.
//   super_admin → {} (sees every gym)
//   gym_admin   → { gymId } (only their own gym)
// Spread this into every admin query/mutation filter so a gym_admin can never
// read or modify another gym's data.
export const gymScope = (req) =>
  req.admin.role === "super_admin" ? {} : { gymId: req.admin.gymId };
