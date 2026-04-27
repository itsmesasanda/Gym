import axios from "axios";

const RAG_URL = process.env.RAG_SERVICE_URL || "http://127.0.0.1:8000";
const RAG_TIMEOUT = 30000; // 30s — generation has up to 3 Groq retries

/**
 * Generate a 7-day workout plan via the Python RAG service.
 * @param {Object} userProfile - profile fields in camelCase
 * @returns {Promise<Object>} - { title, goal, days: [...] }
 */
export const generateWorkoutPlan = async (userProfile) => {
  try {
    const response = await axios.post(
      `${RAG_URL}/generate`,
      {
        age:           userProfile.age,
        height:        userProfile.height,
        weight:        userProfile.weight,
        goal:          userProfile.goal,
        fitness_level: userProfile.fitnessLevel,
        gender:        userProfile.gender || "any",
        injury:        userProfile.injury  || "none",
      },
      { timeout: RAG_TIMEOUT }
    );

    if (!response.data?.success) {
      throw new Error("RAG service returned success=false");
    }
    return response.data.data; // { title, goal, days: [...] }
  } catch (err) {
    if (err.code === "ECONNREFUSED") {
      throw new Error(
        "RAG service is not running. Start it with: uvicorn main:app --port 8000"
      );
    }
    if (err.response) {
      throw new Error(
        `RAG service error: ${err.response.data?.detail || err.response.statusText}`
      );
    }
    throw err;
  }
};

/**
 * Validate a plan and return a quality score.
 * Non-fatal — if validator is down, returns null score.
 */
export const validateWorkoutPlan = async (plan, userProfile) => {
  try {
    const response = await axios.post(
      `${RAG_URL}/validate`,
      {
        plan,
        profile: {
          age:           userProfile.age,
          goal:          userProfile.goal,
          fitness_level: userProfile.fitnessLevel,
          gender:        userProfile.gender || "any",
          injury:        userProfile.injury  || "none",
        },
      },
      { timeout: 10000 }
    );

    return {
      valid:    response.data.valid,
      score:    response.data.score,
      errors:   response.data.errors   || [],
      warnings: response.data.warnings || [],
    };
  } catch (err) {
    console.error("[workoutRagService] Validation failed:", err.message);
    return {
      valid: null,
      score: null,
      errors: [],
      warnings: ["Validator unavailable"],
    };
  }
};
