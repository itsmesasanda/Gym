import jwt from "jsonwebtoken";

if (!process.env.ADMIN_JWT_SECRET) {
  throw new Error("FATAL: ADMIN_JWT_SECRET environment variable is not set");
}

const adminAuthMiddleware = (req, res, next) => {
  const auth = req.headers.authorization;

  if (!auth?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided." });
  }

  try {
    const token = auth.split(" ")[1];
    const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET);
    req.admin = decoded;
    return next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token." });
  }
};

export default adminAuthMiddleware;
