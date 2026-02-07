import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  // हे महत्त्वाचे: बेस पाथ सेट केल्यामुळे फाईल्स शोधणे सोपे जाते
  base: './', 
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false, 
    rollupOptions: {
      // एन्ट्री पॉईंट स्पष्टपणे डिफाइन करा
      input: {
        main: path.resolve(__dirname, 'index.html'),
      },
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', '@supabase/supabase-js'],
          ui: ['lucide-react']
        }
      }
    }
  },
  server: {
    port: 5173,
    strictPort: true,
    host: true 
  }
});
