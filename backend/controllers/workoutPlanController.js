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

const buildFallbackPlan = (profile) => {
  const injury = profile.injury || "none";
  const avoidLegs = injury === "legs";
  const avoidBack = injury === "back";
  const avoidShoulders = injury === "shoulders";
  const avoidChest = injury === "chest";
  const avoidArms = injury === "arms";

  const day = (day_number, focus, exercises) => ({ day_number, focus, exercises });
  const ex = (name, sets = 3, reps = "10-12", notes = null) => ({ name, sets, reps, notes });

  return {
    title: "7-Day Workout Plan",
    goal: profile.goal.replace(/_/g, " "),
    days: [
      day(1, avoidChest ? "Core and Cardio" : "Chest and Triceps", avoidChest
        ? [ex("Plank", 3, "30-45 sec"), ex("Dead Bug", 3), ex("Incline Walk", 1, "20 min")]
        : [ex("Push Ups"), ex("Dumbbell Press"), ex("Cable Fly"), ex("Tricep Pushdown")]),
      day(2, avoidBack ? "Legs and Core" : "Back and Biceps", avoidBack
        ? [ex("Leg Extension"), ex("Seated Leg Curl"), ex("Calf Raises"), ex("Side Plank", 3, "30 sec")]
        : [ex("Lat Pulldown"), ex("Seated Row"), ex("Face Pull"), ex("Dumbbell Curl")]),
      day(3, avoidLegs ? "Upper Body Mobility" : "Legs", avoidLegs
        ? [ex("Band Pull Aparts"), ex("Wall Push Ups"), ex("Seated Shoulder External Rotation", 3, "12-15")]
        : [ex("Goblet Squat"), ex("Leg Press"), ex("Romanian Deadlift"), ex("Calf Raises")]),
      day(4, "Rest", []),
      day(5, avoidShoulders ? "Lower Body and Core" : "Shoulders and Core", avoidShoulders
        ? [ex("Leg Press"), ex("Glute Bridge"), ex("Cable Crunch"), ex("Bird Dog")]
        : [ex("Dumbbell Shoulder Press"), ex("Lateral Raise"), ex("Rear Delt Fly"), ex("Cable Crunch")]),
      day(6, avoidArms ? "Full Body Light" : "Arms and Conditioning", avoidArms
        ? [ex("Bodyweight Squat"), ex("Incline Walk", 1, "20 min"), ex("Plank", 3, "30 sec")]
        : [ex("Barbell Curl"), ex("Hammer Curl"), ex("Skull Crusher"), ex("Battle Ropes", 4, "30 sec")]),
      day(7, "Rest", []),
    ],
  };
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
  try {
    const { injuryDescription } = req.body;
    const email = req.user.email;

    if (injuryDescription && String(injuryDescription).length > 500) {
      return res.status(400).json({ message: "injuryDescription must be 500 characters or fewer" });
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

    // 3. Generate via Python service. Fall back rather than returning a dead 500.
    let plan;
    let validation;
    try {
      plan = await ragGenerate(profile);
      validation = await ragValidate(plan, profile);
    } catch (ragError) {
      console.error("[generateAndSavePlan] RAG failed, using fallback:", ragError.message);
      plan = buildFallbackPlan(profile);
      validation = {
        valid: null,
        score: null,
        errors: [],
        warnings: [`AI generator unavailable: ${ragError.message}`],
      };
    }

    // 4. Save to Mongo
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
    console.error("[generateAndSavePlan] error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * GET /api/workout-plans?email=...
 */
export const getUserPlans = async (req, res) => {
  try {
    const email = req.user.email;
    const plans = await WorkoutPlan.find({ userEmail: email })
      .sort({ createdAt: -1 })
      .limit(50);

    return res.json(plans);
  } catch (err) {
    console.error("[getUserPlans] error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * GET /api/workout-plans/:id
 */
export const getPlanById = async (req, res) => {
  try {
    const plan = await WorkoutPlan.findById(req.params.id);
    if (!plan) return res.status(404).json({ message: "Not found" });
    if (plan.userEmail !== req.user.email) return res.status(403).json({ message: "Forbidden" });
    return res.json(plan);
  } catch {
    return res.status(500).json({ message: "Could not retrieve plan" });
  }
};

/**
 * PATCH /api/workout-plans/:id
 * Body: { days } — replace the days array (used to edit individual exercises)
 */
export const patchPlan = async (req, res) => {
  try {
    const { days } = req.body;
    if (!Array.isArray(days)) return res.status(400).json({ message: "days must be an array" });

    const existing = await WorkoutPlan.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: "Not found" });
    if (existing.userEmail !== req.user.email) return res.status(403).json({ message: "Forbidden" });

    existing.days = days;
    const saved = await existing.save();
    return res.json(saved);
  } catch {
    return res.status(500).json({ message: "Could not update plan" });
  }
};

/**
 * DELETE /api/workout-plans/:id
 */
export const deletePlan = async (req, res) => {
  try {
    const plan = await WorkoutPlan.findById(req.params.id);
    if (!plan) return res.status(404).json({ message: "Not found" });
    if (plan.userEmail !== req.user.email) return res.status(403).json({ message: "Forbidden" });

    await plan.deleteOne();
    return res.json({ message: "Plan deleted" });
  } catch {
    return res.status(500).json({ message: "Could not delete plan" });
  }
};
