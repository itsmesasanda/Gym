import { BASE_URL } from "../config";
import { FOOD_DATABASE } from "./foodDatabase";
import { fetchWithTimeout, parseJsonSafe } from "./http";

const USER_ID_FALLBACK = "demo-user-001";

const request = async (path, options = {}) => {
  const response = await fetchWithTimeout(`${BASE_URL}/api/logs${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await parseJsonSafe(response);
  if (!response.ok) {
    throw new Error(data?.message || data?.error || "Calorie request failed");
  }

  return data;
};

export const getCalorieUserId = (email) => email || USER_ID_FALLBACK;

export const createMealLog = (userId, mealData) => request("/", {
  method: "POST",
  body: JSON.stringify({ userId: userId || USER_ID_FALLBACK, ...mealData }),
});

export const getTodayLogs = (userId) => request(`/${encodeURIComponent(userId || USER_ID_FALLBACK)}`);

export const getWeeklyLogs = (userId) => request(`/${encodeURIComponent(userId || USER_ID_FALLBACK)}/weekly`);

export const getMonthlyLogs = (userId) => request(`/${encodeURIComponent(userId || USER_ID_FALLBACK)}/monthly`);

export const updateMealLog = (id, mealData) => request(`/${id}`, {
  method: "PUT",
  body: JSON.stringify(mealData),
});

export const deleteMealLog = (id) => request(`/${id}`, { method: "DELETE" });

// Re-export so existing imports still work
export { FOOD_DATABASE };

export const searchFoods = (query) => {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return FOOD_DATABASE.slice(0, 8);
  }

  return FOOD_DATABASE
    .filter((food) => food.foodName.toLowerCase().includes(normalized))
    .slice(0, 10);
};
