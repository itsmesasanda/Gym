import axios from "axios";

// Empty baseURL → requests are relative ("/api/...") and go through the Vite
// dev proxy. In production, set VITE_API_URL to the deployed backend origin.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "",
});

// Attach the admin token to every request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("admin_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401, drop the token and bounce to login.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("admin_token");
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);

export default api;
