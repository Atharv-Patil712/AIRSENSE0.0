import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  optimizeDeps: {
    include: [
      'react-router-dom',
      'recharts',
      'leaflet',
      'react-leaflet',
      'date-fns',
      '@supabase/supabase-js',
      // Cinematic experience (lazy-loaded route only)
      'three',
      'gsap',
    ],
  },
  build: {
    rollupOptions: {
      output: {
        // Three.js and GSAP are reachable only from the lazy cinematic route,
        // so they are split into their own chunks and never pulled into the
        // bundle that serves the dashboard.
        manualChunks(id) {
          if (/node_modules[\\/]three[\\/]/.test(id)) return 'three';
          if (/node_modules[\\/]gsap[\\/]/.test(id)) return 'gsap';
          if (/node_modules[\\/](leaflet|react-leaflet)[\\/]/.test(id)) return 'leaflet';
          if (/node_modules[\\/]recharts[\\/]/.test(id)) return 'recharts';
          return undefined;
        },
      },
    },
  },
});
