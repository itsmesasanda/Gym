import axios from "axios";

const MEAL_RAG_URL = process.env.MEAL_RAG_SERVICE_URL || "http://127.0.0.1:8001";
const MEAL_RAG_API_KEY = process.env.MEAL_RAG_API_KEY || "";
const RAG_TIMEOUT = 30000;

// Surface the localhost-default footgun in logs: in production this MUST be set to
// the Python service's public URL, or every recommendation call fails with ECONNREFUSED.
if (!process.env.MEAL_RAG_SERVICE_URL) {
  console.warn(
    "[mealRagService] MEAL_RAG_SERVICE_URL is not set — defaulting to " +
    `${MEAL_RAG_URL}. This will fail in production; set it to the meal RAG URL.`
  );
}

export const getMealRecommendations = async ({ calories, protein, carbs, context, goal }) => {
  try {
    const body = { calories };
    if (protein) body.protein = protein;
    if (carbs)   body.carbs = carbs;
    if (context) body.context = context;
    if (goal)    body.goal = goal;

    console.log(`[mealRagService] → POST ${MEAL_RAG_URL}/recommend (calories=${calories}, goal=${goal || "—"})`);

    const response = await axios.post(
      `${MEAL_RAG_URL}/recommend`,
      body,
      {
        timeout: RAG_TIMEOUT,
        // Forward the shared secret when configured (matches the service's RAG_API_KEY).
        headers: MEAL_RAG_API_KEY ? { "X-API-Key": MEAL_RAG_API_KEY } : undefined,
      }
    );

    if (!response.data?.success) {
      throw new Error("Meal RAG service returned success=false");
    }
    console.log(`[mealRagService] ← ${response.data.meals?.length || 0} meals returned.`);
    return response.data;
  } catch (err) {
    console.error(`[mealRagService] request failed: ${err.code || ""} ${err.message}`);
    if (err.code === "ECONNREFUSED" || err.code === "ENOTFOUND" || err.code === "EAI_AGAIN") {
      throw new Error(
        `Meal RAG service unreachable at ${MEAL_RAG_URL}. Check it is online and that MEAL_RAG_SERVICE_URL is correct.`
      );
    }
    if (err.code === "ECONNABORTED" || err.code === "ETIMEDOUT") {
      throw new Error("Meal RAG service timed out. It may be waking from sleep — please try again.");
    }
    if (err.response) {
      const detail = err.response.data?.detail;
      const msg = typeof detail === "object"
        ? detail.errors?.map(e => e.message).join("; ") || JSON.stringify(detail)
        : detail || err.response.statusText;
      throw new Error(`Meal RAG error: ${msg}`);
    }
    throw err;
  }
};
