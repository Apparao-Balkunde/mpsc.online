import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  
  root: ".", // मुख्य फोल्डरमधून बिल्ड सुरू होईल

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"), // पाथ सुटसुटीत ठेवण्यासाठी
      // रिअॅक्टच्या आवृत्तीत विसंगती येऊ नये म्हणून खालील अलायस:
      react: path.resolve("./node_modules/react"),
      "react-dom": path.resolve("./node_modules/react-dom"),
    },
    // ड्युप्लिकेट रिअॅक्ट लोड होण्यापासून रोखण्यासाठी:
    dedupe: ["react", "react-dom"],
  },

  optimizeDeps: {
    force: true, // प्रत्येक वेळी कॅशे रिलोड करेल
    include: ["react", "react-dom"],
  },

  build: {
    outDir: "dist",
    emptyOutDir: true,
    commonjsOptions: {
      include: [/node_modules/], // CommonJS लायब्ररीजसाठी महत्त्वाचे
    },
    rollupOptions: {
      output: {
        // मॅन्युअल चंक्स काढून टाकल्यामुळे 'Secret Internals' चा धोका कमी होतो
        manualChunks: undefined, 
      }
    }
  },
});
