import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
// import electron from 'vite-plugin-electron/simple';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // electron({
    //   main: {
    //     entry: 'electron/main.ts',
    //   },
    // }),
  ],

  server: {
    port: 3000,
    host: '0.0.0.0',
    hmr: false, // Disabilitando HMR para estabilidade no ambiente Cloud Run
  },

  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react/jsx-runtime',
      '@supabase/supabase-js',
      'jszip',
      'lucide-react',
      'motion',
    ],
  },

  resolve: {
    dedupe: ['react', 'react-dom', 'react/jsx-runtime'],
  },

  build: {
    target: 'esnext',
    commonjsOptions: {
      include: [/node_modules/],
    },
  },
});