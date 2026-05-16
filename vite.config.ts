import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
// import electron from 'vite-plugin-electron/simple';

const isPwaBuild = process.env.VITE_BUILD_TARGET === 'pwa';

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
    ...(isPwaBuild && {
      rollupOptions: {
        output: {
          entryFileNames: 'assets/pwa-engine.js',
          chunkFileNames: 'assets/pwa-engine-chunk.js',
          assetFileNames: 'assets/pwa-engine.[ext]'
        }
      }
    })
  },
});