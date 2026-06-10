import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";

dotenv.config();

import userRoutes               from "./routes/userRoutes.js";
import adminAuthRoutes          from "./routes/adminAuthRoutes.js";
import userManagementRoutes     from "./routes/userManagementRoutes.js";
import workoutManagementRoutes  from "./routes/workoutManagementRoutes.js";
import videoManagementRoutes    from "./routes/videoManagementRoutes.js";
import mealManagementRoutes     from "./routes/mealManagementRoutes.js";
import mealLogRoutes            from "./routes/mealLogRoutes.js";
import adminMealLogRoutes       from "./routes/adminMealLogRoutes.js";
import reportRoutes             from "./routes/reportRoutes.js";
import workoutPlanRoutes        from "./routes/workoutPlanRoutes.js";
import progressTrackingRoutes   from "./routes/progressTrackingRoutes.js";
import mealPlanRoutes           from "./routes/mealPlanRoutes.js";
import eventManagementRoutes    from "./routes/eventManagementRoutes.js";
import announcementManagementRoutes from "./routes/announcementManagementRoutes.js";
import userContentRoutes        from "./routes/userContentRoutes.js";
import coachRoutes              from "./routes/coachRoutes.js";
import { createVideo, deleteVideo, getVideos, updateVideo } from "./controllers/videoController.js";
import { getAllWorkouts, createWorkout, updateWorkout, deleteWorkout } from "./controllers/workoutController.js";
import adminAuthMiddleware      from "./middleware/adminAuthMiddleware.js";
import { protect }              from "./middleware/authMiddleware.js";

const app = express();

// ── Security headers ─────────────────────────────────────────────
app.use(helmet());

// ── CORS ─────────────────────────────────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map(o => o.trim())
  .filter(Boolean);

// Always allow localhost for dev; production origins come from env
const devOrigins = ["http://localhost:3000", "http://localhost:8081", "http://localhost:19006"];
const corsOrigins = [...new Set([...devOrigins, ...allowedOrigins])];

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return cb(null, true);
    if (corsOrigins.includes(origin)) return cb(null, true);
    cb(new Error("CORS: origin not allowed"));
  },
  methods:          ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders:   ["Content-Type", "Authorization"],
  credentials:      true,
}));

// ── Body size limit ───────────────────────────────────────────────
app.use(express.json({ limit: "50kb" }));

// ── Rate limiters ─────────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs:        15 * 60 * 1000, // 15 minutes
  max:             20,              // 20 attempts per window
  standardHeaders: true,
  legacyHeaders:   false,
  message:         { message: "Too many attempts, please try again in 15 minutes" },
});

const apiLimiter = rateLimit({
  windowMs:        60 * 1000, // 1 minute
  max:             120,        // 120 req/min per IP
  standardHeaders: true,
  legacyHeaders:   false,
  message:         { message: "Too many requests" },
});

// Apply general API rate limit to all routes
app.use("/api/", apiLimiter);

// Stricter limit on auth endpoints
app.use("/api/users/login",           authLimiter);
app.use("/api/users/register",        authLimiter);
app.use("/api/users/forgot-password", authLimiter);
app.use("/api/users/reset-password",  authLimiter);
app.use("/api/admin/auth/login",      authLimiter);

// ── User (mobile app) routes ──────────────────────────────────────
app.use("/api/users", userRoutes);
app.use("/api/logs",  mealLogRoutes);
app.use("/api/user",  userContentRoutes);
app.use("/api/coach", coachRoutes);

// ── Workout routes (auth required) ───────────────────────────────
app.get("/api/workouts",        protect, getAllWorkouts);
app.post("/api/workouts",       protect, createWorkout);
app.put("/api/workouts/:id",    protect, updateWorkout);
app.delete("/api/workouts/:id", protect, deleteWorkout);

app.use("/api/workout-plans", workoutPlanRoutes);
app.use("/api/meal-plans",    mealPlanRoutes);

// ── Progress tracking ─────────────────────────────────────────────
app.use("/api/progress", progressTrackingRoutes);

// ── Video library ─────────────────────────────────────────────────
app.get("/api/videos",        getVideos);
app.post("/api/videos",       adminAuthMiddleware, createVideo);
app.put("/api/videos/:id",    adminAuthMiddleware, updateVideo);
app.delete("/api/videos/:id", adminAuthMiddleware, deleteVideo);

// ── Admin routes ──────────────────────────────────────────────────
app.use("/api/admin/auth",           adminAuthRoutes);
app.use("/api/admin/users",          userManagementRoutes);
app.use("/api/admin/workouts",       workoutManagementRoutes);
app.use("/api/admin/videos",         videoManagementRoutes);
app.use("/api/admin/meals",          mealManagementRoutes);
app.use("/api/admin/events",         eventManagementRoutes);
app.use("/api/admin/announcements",  announcementManagementRoutes);
app.use("/api/admin/meal-logs",      adminMealLogRoutes);
app.use("/api/admin/reports",        reportRoutes);

app.get("/", (_req, res) => res.json({ status: "ok" }));

// ── Global error handler ──────────────────────────────────────────
app.use((err, _req, res, _next) => {
  if (err.message?.startsWith("CORS")) {
    return res.status(403).json({ message: "CORS: origin not allowed" });
  }
  console.error(err);
  res.status(500).json({ message: "Internal server error" });
});

const mongoUri = process.env.MONGO_URI || process.env.MONGO_URL || process.env.MONGODB_URL;
if (!mongoUri) {
  console.error("FATAL: No MongoDB URI found. Set MONGO_URI, MONGO_URL, or MONGODB_URL.");
  process.exit(1);
}

mongoose.connect(mongoUri)
  .then(() => {
    console.log("MongoDB Connected");
    const port = process.env.PORT || 5050;
    app.listen(port, () => console.log(`Server running on port ${port}`));
  })
  .catch(err => {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  });
