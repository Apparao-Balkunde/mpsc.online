import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    define: {
      // This prevents "process is not defined" error in the browser
      // and injects the API_KEY from the build environment
      'process.env.API_KEY': JSON.stringify(process.env.API_KEY || env.API_KEY || '')
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true
    }
  };
});