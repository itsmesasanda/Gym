import WorkoutPlan from "../models/WorkoutPlan.js";
import User from "../models/User.js";
import {
  generateWorkoutPlan as ragGenerate,
  validateWorkoutPlan as ragValidate,
} from "../services/workoutRagService.js";

/**
 * Map User model goal strings → values the Python service accepts.
 */
const normalizeGoal = (goal) => {
  if (!goal) return "health_maintenance";
  const g = String(goal).toLowerCase().trim().replace(/\s+/g, "_");
  if (g.includes("muscle") || g.includes("gain"))   return "muscle_gain";
  if (g.includes("loss")   || g.includes("weight")) return "weight_loss";
  if (g.includes("endur"))                          return "endurance";
  return "health_maintenance";
};

/**
 * Map free-text injury description → one of the categories
 * the Python service / Pinecone filter understands.
 *
 * Returns "none" if the user said they're fine or left it blank.
 */
const mapInjuryToCategory = (text) => {
  if (!text || typeof text !== "string") return "none";
  const t = text.toLowerCase().trim();
  if (t === "" || t === "no" || t === "none" || t === "n/a" ||
      t.includes("no injury") || t.includes("nothing") ||
      t.includes("fine") || t.includes("healthy")) {
    return "none";
  }

  // Order matters — check most specific keywords first
  if (/(knee|ankle|hamstring|calf|thigh|hip|quad|leg|foot|shin)/.test(t))     return "legs";
  if (/(back|spine|lumbar|sciatica|disc|lower\s*back)/.test(t))                return "back";
  if (/(shoulder|rotator|delt|trapezius|trap|neck)/.test(t))                   return "shoulders";
  if (/(chest|pec|sternum|rib)/.test(t))                                       return "chest";
  if (/(arm|elbow|wrist|forearm|bicep|tricep|tennis\s*elbow|golfer)/.test(t))  return "arms";

  return "none"; // unrecognized → safer to assume no constraint
};

/**
 * POST /api/workout-plans/generate
 * Body: { email, injuryDescription? }
 *   - email: required
 *   - injuryDescription: optional free text (e.g. "lower back pain")
 *
 * Pulls fitnessLevel from user.activityLevel, goal from user.goal.
 * Maps injury text to a category for the RAG service.
 */
export const generateAndSavePlan = async (req, res) => {
  console.log("GENERATE PLAN ROUTE HIT");
  console.log(req.body);

  try {
    const { email, injuryDescription } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email required" });
    }

    // 1. Load user profile
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.height || !user.weight) {
      return res.status(400).json({
        message:
          "Please complete your profile (height, weight, goal) before generating a plan.",
      });
    }

    // 2. Map injury text → category, build profile for the RAG service
    const injuryCategory = mapInjuryToCategory(injuryDescription);

    const profile = {
      age:          user.age          ?? 25,
      height:       user.height,
      weight:       user.weight,
      goal:         normalizeGoal(user.goal),
      fitnessLevel: user.activityLevel || "beginner",
      gender:       "any",
      injury:       injuryCategory,
    };

    console.log("[generateAndSavePlan] mapped profile:", profile);

    // 3. Generate via Python service (~10s)
    const plan = await ragGenerate(profile);

    // 4. Validate (non-blocking)
    const validation = await ragValidate(plan, profile);

    // 5. Save to Mongo
    const saved = await WorkoutPlan.create({
      userEmail:          email,
      title:              plan.title,
      goal:               plan.goal,
      days:               plan.days,
      validation,
      injury:             injuryCategory,
      injuryDescription:  injuryDescription || "",
    });

    return res.status(201).json(saved);
  } catch (err) {
    console.error("GENERATE PLAN ERROR:", err.message);
    return res.status(500).json({ message: err.message });
  }
};

/**
 * GET /api/workout-plans?email=...
 */
export const getUserPlans = async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ message: "Email required" });

    const plans = await WorkoutPlan.find({ userEmail: email })
      .sort({ createdAt: -1 })
      .limit(50);

    return res.json(plans);
  } catch (err) {
    console.error("GET PLANS ERROR:", err.message);
    return res.status(500).json({ message: err.message });
  }
};

/**
 * GET /api/workout-plans/:id
 */
export const getPlanById = async (req, res) => {
  try {
    const plan = await WorkoutPlan.findById(req.params.id);
    if (!plan) return res.status(404).json({ message: "Not found" });
    return res.json(plan);
  } catch (err) {
    console.error("GET PLAN ERROR:", err.message);
    return res.status(500).json({ message: err.message });
  }
};

/**
 * DELETE /api/workout-plans/:id
 */
export const deletePlan = async (req, res) => {
  try {
    const result = await WorkoutPlan.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ message: "Not found" });
    return res.json({ message: "Plan deleted" });
  } catch (err) {
    console.error("DELETE PLAN ERROR:", err.message);
    return res.status(500).json({ message: err.message });
  }
};
