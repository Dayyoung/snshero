import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(), 
      tailwindcss(),
      {
        name: 'api-endpoints-plugin',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            if (req.url === '/api/health' || req.url === '/health') {
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
              res.end(JSON.stringify({ status: 'ok', timestamp: Date.now() }));
              return;
            }

            if (req.url?.startsWith('/api/version') || req.url === '/version') {
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
              res.setHeader('Pragma', 'no-cache');
              res.setHeader('Expires', '0');
              const versionData = {
                version: '2.1.0',
                buildTime: new Date().toISOString(),
                buildTimestamp: Date.now(),
                service: 'snshero-revolution',
                minRequiredVersion: '2.0.0'
              };
              res.end(JSON.stringify(versionData));
              return;
            }

            next();
          });
        }
      }
    ],
    base: process.env.VITE_BASE_PATH || './',
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      emptyOutDir: true,
      rollupOptions: {
        output: {
          entryFileNames: `assets/[name]-[hash]-v${Date.now()}.js`,
          chunkFileNames: `assets/[name]-[hash]-v${Date.now()}.js`,
          assetFileNames: `assets/[name]-[hash]-v${Date.now()}[extname]`,
          manualChunks(id) {
            if (!id.includes('node_modules')) return undefined;
            if (id.includes('/@tensorflow/') || id.includes('/seedrandom/')) return 'vendor-tensorflow';
            if (id.includes('/firebase/') || id.includes('/@firebase/')) return 'vendor-firebase';
            if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('/scheduler/')) return 'vendor-react';
            if (id.includes('/motion/') || id.includes('/motion-dom/') || id.includes('/motion-utils/') || id.includes('/framer-motion/')) return 'vendor-motion';
            if (id.includes('/lucide-react/')) return 'vendor-icons';
            if (id.includes('/@paypal/') || id.includes('/paypal')) return 'vendor-payments';
            if (id.includes('/axios/')) return 'vendor-network';
            if (id.includes('/jsqr/') || id.includes('/qrcode.react/')) return 'vendor-scanners';
            return 'vendor-misc';
          },
        },
      },
    },
    define: {
      '__BUILD_TIME__': JSON.stringify(Date.now().toString()),
    },
    resolve: {
      alias: {
        '@': path.resolve(process.cwd(), '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      host: '0.0.0.0',
      port: 3000,
      hmr: process.env.DISABLE_HMR !== 'true' ? { port: 24680 } : false,
      allowedHosts: true,
    },
  };
});
