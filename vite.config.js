import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite'; // नवीन प्लगइन ॲड केला
import path from 'path';

export default defineConfig({
  // Tailwind v4 साठी tailwindcss() प्लगइन इथे टाकला आहे
  plugins: [react(), tailwindcss()],
  
  base: '/', 
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        entryFileNames: `assets/[name].[hash].js`,
        chunkFileNames: `assets/[name].[hash].js`,
        assetFileNames: `assets/[name].[hash].[ext]`
      }
    }
  },
  server: {
    port: 5173,
    strictPort: true,
    host: true 
  }
});
