# Fitness Admin Panel

A full-stack admin panel for managing a fitness app — users, meals, workouts, and videos/announcements.

## Structure

```
admin-panel/
├── client-admin/   # React 18 frontend (CRA)
└── server-admin/   # Node.js + Express + MongoDB backend
```

## Setup

### 1. Backend (server-admin)
```bash
cd server-admin
npm install
# Edit .env if needed (MONGO_URI, PORT, JWT_SECRET)
npm run dev
```
Server runs on **http://localhost:5000**

### 2. Frontend (client-admin)
```bash
cd client-admin
npm install
npm start
```
App runs on **http://localhost:3000**

## First Admin Account
Use the register endpoint once, then log in through the UI:

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register admin |
| POST | /api/auth/login | Login (returns JWT) |
| GET | /api/auth/me | Get current admin |
| GET/POST | /api/users | List / create users |
| PUT/DELETE | /api/users/:id | Update / delete user |
| GET/POST | /api/meals | List / create meals |
| PUT/DELETE | /api/meals/:id | Update / delete meal |
| GET/POST | /api/workouts | List / create workouts |
| PUT/DELETE | /api/workouts/:id | Update / delete workout |
| GET/POST | /api/videos | List / create videos |
| PUT/DELETE | /api/videos/:id | Update / delete video |
| GET | /api/reports/summary | Dashboard stats |
| GET | /api/reports/users-over-time | Monthly user counts |
| GET | /api/reports/meals-calories | Daily calorie totals |
