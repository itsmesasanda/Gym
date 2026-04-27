import express from "express";
import { getAllUsers, createUser, updateUser, deleteUser } from "../controllers/memberController.js";
import adminAuthMiddleware from "../middleware/adminAuthMiddleware.js";

const router = express.Router();

router.get("/", adminAuthMiddleware, getAllUsers);
router.post("/", adminAuthMiddleware, createUser);
router.put("/:id", adminAuthMiddleware, updateUser);
router.delete("/:id", adminAuthMiddleware, deleteUser);

export default router;
