import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // tsconfig मधील पाथ मॅच करण्यासाठी
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false, // प्रोडक्शनमध्ये कोड सुरक्षित ठेवण्यासाठी
    rollupOptions: {
      output: {
        // मोठ्या लायब्ररीजचे चंक्स पाडणे (उदा. lucide, supabase)
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
    host: true // नेटवर्कवर एक्सेस करण्यासाठी
  }
});
