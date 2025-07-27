console.log("Vite config loaded");
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  // Load environment variables that start with VITE_
  const env = loadEnv(mode, process.cwd());
  // Map the VITE_* variables to process.env.*
  const processEnv = Object.keys(env)
    .filter((key) => key.startsWith("VITE_"))
    .reduce((acc, key) => {
      const newKey = key.replace(/^VITE_/, "");
      acc[`process.env.${newKey}`] = JSON.stringify(env[key]);
      return acc;
    }, {});

  return {
    plugins: [react(), tailwindcss()],
    root: path.resolve(__dirname, "."),
    build: {
      outDir: "dist",
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./frontend/src"),
      },
    },
    server: {
      port: 8173,
      proxy: {
        "/api/stream-background": {
          target: "http://localhost:4001",
          changeOrigin: true,
          secure: false,
        },
      },
    },
    define: processEnv,
  };
});
