import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Crash at startup if secret is missing — no silent fallback
if (!process.env.JWT_SECRET) {
  throw new Error("FATAL: JWT_SECRET environment variable is not set");
}

export const protect = async (req, res, next) => {
  const auth = req.headers.authorization;

  if (!auth?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Not authorized" });
  }

  try {
    const token = auth.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");
    if (!req.user) return res.status(401).json({ message: "Not authorized" });
    return next();
  } catch {
    return res.status(401).json({ message: "Not authorized" });
  }
};
