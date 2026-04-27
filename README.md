# GymApp — Merged Project

This project combines the **User Mobile App** (React Native / Expo) and the **Admin Panel** (React Web) into a single unified repository with one shared backend.

---

## Project Structure

```
GymApp/
├── backend/                  ← Single Node.js + Express server (port 5050)
│   ├── controllers/
│   │   ├── userController.js          (mobile app users)
│   │   ├── adminAuthController.js     (admin login/register)
│   │   ├── memberController.js        (admin gym member management)
│   │   ├── mealController.js
│   │   ├── videoController.js
│   │   ├── workoutController.js
│   │   └── reportController.js
│   ├── middleware/
│   │   ├── authMiddleware.js          (mobile app JWT guard)
│   │   ├── adminAuthMiddleware.js     (admin JWT guard)
│   │   └── roleCheckMiddleware.js
│   ├── models/
│   │   ├── User.js                    (mobile app auth users)
│   │   ├── Admin.js                   (admin accounts)
│   │   ├── Member.js                  (gym members managed via admin panel)
│   │   ├── Meal.js
│   │   ├── Video.js
│   │   └── Workout.js
│   ├── routes/
│   │   ├── userRoutes.js              → /api/users/*
│   │   ├── adminAuthRoutes.js         → /api/admin/auth/*
│   │   ├── userManagementRoutes.js    → /api/admin/users/*
│   │   ├── workoutManagementRoutes.js → /api/admin/workouts/*
│   │   ├── videoManagementRoutes.js   → /api/admin/videos/*
│   │   ├── mealManagementRoutes.js    → /api/admin/meals/*
│   │   └── reportRoutes.js            → /api/admin/reports/*
│   ├── services/
│   │   └── analyticsService.js
│   ├── .env
│   ├── package.json
│   ├── seedAdmin.js
│   └── server.js
│
├── frontend/                 ← React Native / Expo mobile app
│   ├── assets/
│   ├── context/
│   ├── navigation/
│   ├── screens/
│   ├── utils/
│   ├── App.js
│   ├── config.js
│   ├── index.js
│   └── package.json
│
└── admin/                    ← React Web admin panel (CRA)
    ├── public/
    └── src/
        ├── components/
        ├── context/
        ├── pages/
        ├── services/
        └── utils/
```

---

## API Routes

### Mobile App (React Native)
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/users/register` | Register new user |
| POST | `/api/users/login` | Login user |
| GET | `/api/users/profile?email=` | Get user profile |
| PUT | `/api/users/profile` | Update user profile |

### Admin Panel (React Web)
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/admin/auth/register` | Register admin |
| POST | `/api/admin/auth/login` | Admin login |
| GET | `/api/admin/auth/me` | Get current admin |
| GET/POST/PUT/DELETE | `/api/admin/users/*` | Manage gym members |
| GET/POST/PUT/DELETE | `/api/admin/workouts/*` | Manage workouts |
| GET/POST/PUT/DELETE | `/api/admin/videos/*` | Manage videos |
| GET/POST/PUT/DELETE | `/api/admin/meals/*` | Manage meals |
| GET | `/api/admin/reports/summary` | Analytics summary |
| GET | `/api/admin/reports/users-over-time` | User growth data |
| GET | `/api/admin/reports/meals-calories` | Calorie data |

---

## Setup & Running

### 1. Backend

```bash
cd backend
npm install
# Start the server
npm run dev
```

**First time only — seed the admin account:**
```bash
node seedAdmin.js
# Creates: admin@example.com / admin123
```

The backend runs on **http://localhost:5050**

### 2. Mobile App (React Native)

```bash
cd frontend
npm install
npx expo start
```

### 3. Admin Panel (React Web)

```bash
cd admin
npm install
npm start
```

The admin panel runs on **http://localhost:3000**  
Log in with: `admin@example.com` / `admin123`

---

## Key Changes Made During Merge

1. **Single backend** — Admin's separate `server-admin` (port 5000) was merged into the main backend (port 5050). All admin routes are prefixed with `/api/admin/`.

2. **ESM conversion** — Admin backend was CommonJS (`require`). Converted all files to ESM (`import`/`export`) to match the main backend's `"type": "module"` setting.

3. **Model naming** — Admin's `User` model (gym members with `plan`, `paid`, `phone`) was renamed to `Member` to avoid collision with the mobile app's `User` model (auth accounts). The MongoDB collection name `members` is preserved.

4. **Separate JWT secrets** — `JWT_SECRET` for mobile users, `ADMIN_JWT_SECRET` for admin accounts — both in a single `.env`.

5. **Admin API URL** — Updated from `localhost:5000/api` to `localhost:5050/api/admin` in all admin frontend service files.

6. **No logic changes** — All original code logic, outputs, and UI are exactly preserved.
