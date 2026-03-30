import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  
  // रेंडरसाठी बेस पाथ '/' असणे आवश्यक आहे
  base: '/',

  resolve: {
    alias: {
      // सर्व files root मध्ये आहेत (src/ folder नाही)
      "@": path.resolve(__dirname, "."),
    },
  },

  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: false,
    rollupOptions: {
      // इथे मॅन्युअल चंक्स नकोत, ते 'Secret Internals' एररचे मूळ आहेत
      output: {
        entryFileNames: `assets/[name].[hash].js`,
        chunkFileNames: `assets/[name].[hash].js`,
        assetFileNames: `assets/[name].[hash].[ext]`
      }
    }
  }
});
