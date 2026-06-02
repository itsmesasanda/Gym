import express from "express";
import { registerAdmin, loginAdmin, getMe } from "../controllers/adminAuthController.js";
import adminAuthMiddleware from "../middleware/adminAuthMiddleware.js";

const router = express.Router();

// Only an authenticated admin may create additional admin accounts
router.post("/register", adminAuthMiddleware, registerAdmin);
router.post("/login", loginAdmin);
router.get("/me", adminAuthMiddleware, getMe);

export default router;
