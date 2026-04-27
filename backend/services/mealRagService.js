import axios from "axios";

const MEAL_RAG_URL = process.env.MEAL_RAG_SERVICE_URL || "http://127.0.0.1:8001";
const RAG_TIMEOUT = 30000;

export const getMealRecommendations = async ({ calories, protein, carbs, context, goal }) => {
  try {
    const body = { calories };
    if (protein) body.protein = protein;
    if (carbs)   body.carbs = carbs;
    if (context) body.context = context;
    if (goal)    body.goal = goal;

    const response = await axios.post(
      `${MEAL_RAG_URL}/recommend`,
      body,
      { timeout: RAG_TIMEOUT }
    );

    if (!response.data?.success) {
      throw new Error("Meal RAG service returned success=false");
    }
    return response.data;
  } catch (err) {
    if (err.code === "ECONNREFUSED") {
      throw new Error(
        "Meal RAG service is not running. Start it with: uvicorn main:app --port 8001"
      );
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
