import { defineConfig } from 'vite';
import { electronCsp } from './src/utils/securityPolicies';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import electron from 'vite-plugin-electron/simple';

const isPwaBuild = process.env.VITE_BUILD_TARGET === 'pwa';

export default defineConfig({
  base: './',
  envPrefix: [],
  define: { 'import.meta.env.VITE_BUILD_TARGET': JSON.stringify(isPwaBuild ? 'pwa' : 'desktop') },
  publicDir: isPwaBuild ? false : 'public',
  plugins: [
    ...(!isPwaBuild ? [{
      name: 'appify-electron-csp',
      transformIndexHtml: { order: 'pre' as const, handler: (_html: string, context: { server?: unknown }) => [{
        tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content: electronCsp(Boolean(context.server)) }, injectTo: 'head-prepend' as const,
      }] },
    }] : []),
    react(),
    tailwindcss(),
    ...(!isPwaBuild ? [electron({
      main: {
        entry: 'electron/main.ts',
      },
      preload: {
        input: 'electron/preload.ts',
        vite: { build: { rollupOptions: { output: { format: 'cjs', entryFileNames: 'preload.cjs' } } } },
      },
    })] : []),
  ],

  server: {
    port: 3000,
    host: '127.0.0.1',
    hmr: false, // Disabilitando HMR para estabilidade no ambiente Cloud Run
  },

  optimizeDeps: {
    // Only scan the editor entry. Generated PWAs and local backup HTML contain
    // their own bundled React and optional imports; they are not dev entries.
    entries: ['index.html'],
    include: [
      'react',
      'react-dom',
      'react/jsx-runtime',
      'react/jsx-dev-runtime',
      'jszip',
      'lucide-react',
      'motion',
      'motion/react',
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
