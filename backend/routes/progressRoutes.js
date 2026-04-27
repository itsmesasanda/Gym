import express from "express";
import {
  getMeasurements, createMeasurement, updateMeasurement, deleteMeasurement,
  getGoals, createGoal, updateGoal, deleteGoal,
} from "../controllers/progressController.js";

const router = express.Router();

// Measurements
router.get("/measurements",        getMeasurements);
router.post("/measurements",       createMeasurement);
router.put("/measurements/:id",    updateMeasurement);
router.delete("/measurements/:id", deleteMeasurement);

// Goals
router.get("/goals",        getGoals);
router.post("/goals",       createGoal);
router.put("/goals/:id",    updateGoal);
router.delete("/goals/:id", deleteGoal);

export default router;
