const express = require('express');
const cors    = require('cors');
require('dotenv').config();

const connectDB = require('./config/db');

const app = express();
app.use(cors());
app.use(express.json());

// ── Routes ──────────────────────────────────────────────
const adminAuthRoutes        = require('./routes/adminAuthRoutes');
const userAuthRoutes         = require('./routes/userAuthRoutes');
const userPortalRoutes       = require('./routes/userPortalRoutes');
const userManagementRoutes   = require('./routes/userManagementRoutes');
const workoutManagementRoutes = require('./routes/workoutManagementRoutes');
const announcementRoutes     = require('./routes/announcementManagementRoutes');
const eventRoutes            = require('./routes/eventManagementRoutes');
const mealManagementRoutes   = require('./routes/mealManagementRoutes');
const videoManagementRoutes  = require('./routes/videoManagementRoutes');
const reportRoutes           = require('./routes/reportRoutes');
const progressRoutes         = require('./routes/progressRoutes');
const paymentRoutes          = require('./routes/paymentRoutes');

app.use('/api/auth',          adminAuthRoutes);
app.use('/api/user-auth',     userAuthRoutes);
app.use('/api/user',          userPortalRoutes);
app.use('/api/users',         userManagementRoutes);
app.use('/api/workouts',      workoutManagementRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/events',        eventRoutes);
app.use('/api/meals',         mealManagementRoutes);
app.use('/api/videos',        videoManagementRoutes);
app.use('/api/reports',       reportRoutes);
app.use('/api/progress',      progressRoutes);
app.use('/api/payments',      paymentRoutes);

// ── Start ────────────────────────────────────────────────
connectDB().then(() => {
  const port = process.env.PORT || 5000;
  app.listen(port, '0.0.0.0', () => {
    console.log('-------------------------------------------');
    console.log(`🚀 Server running on port ${port}`);
    console.log('-------------------------------------------');
  });
});

module.exports = app;

// Trigger nodemon restart
