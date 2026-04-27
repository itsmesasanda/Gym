import express from "express";
import { registerAdmin, loginAdmin, getMe } from "../controllers/adminAuthController.js";
import adminAuthMiddleware from "../middleware/adminAuthMiddleware.js";

const router = express.Router();

router.post("/register", registerAdmin);
router.post("/login", loginAdmin);
router.get("/me", adminAuthMiddleware, getMe);

export default router;
