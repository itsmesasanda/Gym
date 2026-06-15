import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// In dev, all /api requests are proxied to the Express backend on 5050, so the
// browser talks to a single origin (no CORS). In production, set VITE_API_URL
// to the deployed backend URL and the app calls it directly.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:5050",
        changeOrigin: true,
      },
    },
  },
});
