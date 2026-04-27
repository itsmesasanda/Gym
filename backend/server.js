import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import userRoutes from "./routes/userRoutes.js";
import adminAuthRoutes from "./routes/adminAuthRoutes.js";
import userManagementRoutes from "./routes/userManagementRoutes.js";
import workoutManagementRoutes from "./routes/workoutManagementRoutes.js";
import videoManagementRoutes from "./routes/videoManagementRoutes.js";
import mealManagementRoutes from "./routes/mealManagementRoutes.js";
import mealLogRoutes from "./routes/mealLogRoutes.js";
import adminMealLogRoutes from "./routes/adminMealLogRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import workoutPlanRoutes from "./routes/workoutPlanRoutes.js";
import progressTrackingRoutes from "./routes/progressTrackingRoutes.js";
import mealPlanRoutes from "./routes/mealPlanRoutes.js";
import { createVideo, deleteVideo, getVideos, updateVideo } from "./controllers/videoController.js";
import { getAllWorkouts, createWorkout, updateWorkout, deleteWorkout } from "./controllers/workoutController.js";
import adminAuthMiddleware from "./middleware/adminAuthMiddleware.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// ── User (mobile app) routes ─────────────────────────────
app.use("/api/users", userRoutes);
app.use("/api/logs",  mealLogRoutes);


// ── User workout routes (no auth) ────────────────────────
app.get("/api/workouts",      getAllWorkouts);
app.post("/api/workouts",     createWorkout);
app.put("/api/workouts/:id",  updateWorkout);
app.delete("/api/workouts/:id", deleteWorkout);
app.use("/api/workout-plans", workoutPlanRoutes);
app.use("/api/meal-plans", mealPlanRoutes);

// ── Progress tracking routes ──────────────────────────────
app.use("/api/progress", progressTrackingRoutes);
// ── Public video library route (read-only for mobile app) ─
app.get("/api/videos", getVideos);
app.post("/api/videos", adminAuthMiddleware, createVideo);
app.put("/api/videos/:id", adminAuthMiddleware, updateVideo);
app.delete("/api/videos/:id", adminAuthMiddleware, deleteVideo);

// ── Admin routes ─────────────────────────────────────────
app.use("/api/admin/auth",      adminAuthRoutes);
app.use("/api/admin/users",     userManagementRoutes);
app.use("/api/admin/workouts",  workoutManagementRoutes);
app.use("/api/admin/videos",    videoManagementRoutes);
app.use("/api/admin/meals",     mealManagementRoutes);
app.use("/api/admin/meal-logs", adminMealLogRoutes);
app.use("/api/admin/reports",   reportRoutes);

app.get("/", (req, res) => {
  res.send("Server working");
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected");
    const port = process.env.PORT || 5050;
    app.listen(port, () => console.log(`Server running on port ${port}`));
  })
  .catch(err => console.log(err));
