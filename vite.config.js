import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// खालील ओळ कमेंट कर (तात्पुरती)
// import tailwindcss from '@tailwindcss/vite'; 
import path from 'path';

export default defineConfig({
  // प्लगइन्समधून tailwindcss() काढून टाक
  plugins: [react()], 
  
  base: '/', 
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    strictPort: true,
    host: true 
  }
});
