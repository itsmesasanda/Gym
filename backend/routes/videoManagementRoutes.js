import express from "express";
import { getAllVideos, createVideo, updateVideo, deleteVideo } from "../controllers/videoController.js";
import adminAuthMiddleware from "../middleware/adminAuthMiddleware.js";

const router = express.Router();

router.get("/", adminAuthMiddleware, getAllVideos);
router.post("/", adminAuthMiddleware, createVideo);
router.put("/:id", adminAuthMiddleware, updateVideo);
router.delete("/:id", adminAuthMiddleware, deleteVideo);

export default router;
