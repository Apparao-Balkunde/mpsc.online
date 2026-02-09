import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],

  root: ".",   // 👈 root project is current folder

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      react: path.resolve("./node_modules/react"),
      "react-dom": path.resolve("./node_modules/react-dom"),
    },
    dedupe: ["react", "react-dom"],
  },

  optimizeDeps: {
    force: true,
    entries: ["index.html"],   // 👈 VERY IMPORTANT
  },

  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
