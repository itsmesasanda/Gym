import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Runs on 5174 (the gym admin panel uses 5173). /api is proxied to the Express
// backend on 5050 in dev; set VITE_API_URL for production.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    proxy: {
      "/api": {
        target: "http://localhost:5050",
        changeOrigin: true,
      },
    },
  },
});
