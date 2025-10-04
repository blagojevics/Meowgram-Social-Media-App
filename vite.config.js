import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/",
  server: {
    port: 5173,
    strictPort: true,
    host: "0.0.0.0", // Allow external connections
    https: false, // Keep as HTTP for local testing
  },
});
