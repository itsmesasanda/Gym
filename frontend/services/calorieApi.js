import { BASE_URL } from "../config";
import { getUserToken } from "../utils/session";
import { FOOD_DATABASE } from "./foodDatabase";
import { fetchWithTimeout, parseJsonSafe } from "./http";

const requireUserId = (email) => {
  if (!email) throw new Error("User not authenticated");
  return email;
};

const request = async (path, options = {}) => {
  const token = getUserToken();
  const response = await fetchWithTimeout(`${BASE_URL}/api/logs${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
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

export const getCalorieUserId = (email) => requireUserId(email);

export const createMealLog = (userId, mealData) => request("/", {
  method: "POST",
  body: JSON.stringify({ ...mealData }),
});

export const getTodayLogs = (userId) => {
  const localDate = new Date().toISOString().split("T")[0];
  const bust = Date.now();
  return request(`/${encodeURIComponent(requireUserId(userId))}?date=${localDate}&_=${bust}`);
};

export const getWeeklyLogs = (userId) => request(`/${encodeURIComponent(requireUserId(userId))}/weekly`);

export const getMonthlyLogs = (userId) => request(`/${encodeURIComponent(requireUserId(userId))}/monthly`);

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
