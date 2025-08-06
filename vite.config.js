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
      // Enable code splitting and performance optimizations
      rollupOptions: {
        output: {
          // Manual chunks for better caching
          manualChunks: {
            // React ecosystem
            "react-vendor": ["react", "react-dom", "react-router-dom"],

            // UI libraries
            "ui-vendor": ["@headlessui/react", "@heroicons/react"],

            // Data fetching and state management
            "state-vendor": ["zustand", "swr"],

            // Analytics and ML visualization
            "chart-vendor": ["chart.js", "react-chartjs-2"],

            // Utilities
            "utils-vendor": ["date-fns", "lodash"],
          },
          // Optimize chunk file names
          chunkFileNames: (chunkInfo) => {
            const facadeModuleId = chunkInfo.facadeModuleId
              ? chunkInfo.facadeModuleId
                  .split("/")
                  .pop()
                  .replace(/\.\w+$/, "")
              : "unknown";
            return `js/[name]-[hash].js`;
          },
          entryFileNames: "js/[name]-[hash].js",
          assetFileNames: "assets/[name]-[hash].[ext]",
        },
      },
      // Performance optimizations
      target: "esnext",
      minify: "terser",
      terserOptions: {
        compress: {
          drop_console: false, // Keep console for debugging in production
          drop_debugger: true,
        },
      },
      // Enable tree shaking
      treeshake: true,
      // Increase chunk size limit for better optimization
      chunkSizeWarningLimit: 1000,
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
        "/api": {
          target: "http://localhost:8000",
          changeOrigin: true,
          secure: false,
        },
        "/health": {
          target: "http://localhost:8000",
          changeOrigin: true,
          secure: false,
        },
      },
    },
    define: processEnv,
  };
});
