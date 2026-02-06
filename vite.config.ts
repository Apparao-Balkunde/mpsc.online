import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0', // नेटवर्कवर (Mobile वर) टेस्ट करण्यासाठी
    strictPort: true,
  },
  plugins: [react()],
  define: {
    // आपण AI की काढून टाकली आहे. 
    // Supabase साठी Vite आपोआप 'import.meta.env' वापरते, 
    // त्यामुळे इथे 'define' करण्याची गरज उरली नाही.
  },
  resolve: {
    alias: {
      // '@' आता थेट 'src' फोल्डरला पॉईंट करेल, जेणेकरून इम्पोर्ट सोपे होतील
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 1000, // मोठ्या लायब्ररीजसाठी (Supabase/Lucide)
    rollupOptions: {
      output: {
        // कोडचे तुकडे पाडणे जेणेकरून साईट वेगाने लोड होईल
        manualChunks: {
          'vendor': ['react', 'react-dom', '@supabase/supabase-js'],
          'icons': ['lucide-react']
        }
      }
    }
  }
});
