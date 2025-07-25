console.log("Vite config loaded");
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api/stream-background": {
        target: "http://localhost:4001",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
