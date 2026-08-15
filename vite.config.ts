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

            if (req.url?.startsWith('/api/addtask') || req.url?.startsWith('/api/addTask') || req.url?.startsWith('/addtask') || req.url?.startsWith('/addTask')) {
              const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost:3000'}`);
              const type = urlObj.searchParams.get('type') || urlObj.searchParams.get('dept') || '개발';
              const value = urlObj.searchParams.get('value') || urlObj.searchParams.get('task') || urlObj.searchParams.get('title') || '';
              const action = urlObj.searchParams.get('action') || urlObj.searchParams.get('status') || '작업대기';
              const detail = urlObj.searchParams.get('detail') || urlObj.searchParams.get('desc') || '';

              if (!value) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({
                  success: false,
                  error: 'Missing required parameter: value (task name)',
                  usage: '/api/addTask?type=개발&value=작업내용&action=작업대기&detail=상세내용'
                }));
                return;
              }

              // Google Form submission via server-side fetch
              const formEndpoint = "https://docs.google.com/forms/d/e/1FAIpQLScrvcAqDF7vHHQndycr90ii-ujTi3Plw23eNrSyiJpOLrHbjg/formResponse";
              const formData = new URLSearchParams();
              formData.append('entry.1712635414', type);
              formData.append('entry.1651694192', value);
              formData.append('entry.1282964596', action);
              if (detail) {
                formData.append('entry.1982035501', detail);
              }

              fetch(formEndpoint, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formData.toString()
              })
              .then(formRes => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
                res.end(JSON.stringify({
                  success: true,
                  message: 'Task submitted successfully to Google Form',
                  submitted: {
                    type,
                    value,
                    action,
                    detail
                  },
                  formStatus: formRes.status,
                  timestamp: Date.now()
                }, null, 2));
              })
              .catch(err => {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({
                  success: false,
                  error: err instanceof Error ? err.message : String(err),
                  submitted: { type, value, action, detail }
                }));
              });
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
