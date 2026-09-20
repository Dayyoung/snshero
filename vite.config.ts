import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

const MIME_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.bmp': 'image/bmp',
  '.avif': 'image/avif',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.csv': 'text/csv; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.eot': 'application/vnd.ms-fontobject',
  '.wasm': 'application/wasm',
};

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  const publicDir = path.resolve(process.cwd(), 'public');

  return {
    publicDir: 'public',
    plugins: [
      react(), 
      tailwindcss(),
      {
        name: 'public-wildcard-static-plugin',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            if (!req.url) return next();

            try {
              const rawUrl = req.url.split('?')[0];
              const decodedUrl = decodeURIComponent(rawUrl);

              // Google Spreadsheet Community Posts proxy (bypasses browser CORS restrictions)
              if (decodedUrl === '/api/community/sheet-posts') {
                const sheetId = '1o8rwdG_O_-efkKHgf9oMpFaOUnAAVxMQVfDldFavbjg';
                const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&_t=${Date.now()}`;
                fetch(csvUrl)
                  .then(async (resp) => {
                    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
                    const csv = await resp.text();
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
                    res.setHeader('Access-Control-Allow-Origin', '*');
                    res.setHeader('Cache-Control', 'no-cache');
                    res.end(csv);
                  })
                  .catch((err) => {
                    res.statusCode = 502;
                    res.setHeader('Content-Type', 'application/json; charset=utf-8');
                    res.setHeader('Access-Control-Allow-Origin', '*');
                    res.end(JSON.stringify({ error: err?.message || 'Failed to fetch spreadsheet' }));
                  });
                return;
              }

              // Google Form submission proxy
              if (decodedUrl === '/api/community/submit-form' && req.method === 'POST') {
                let body = '';
                req.on('data', chunk => { body += chunk; });
                req.on('end', async () => {
                  try {
                    const formUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSer0AqPbpduTxfSJNg3X8Pa1C8h2L5_Skmbt0NDdVZt6bS1GA/formResponse';
                    const formResp = await fetch(formUrl, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                      },
                      body: body,
                    });
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json; charset=utf-8');
                    res.setHeader('Access-Control-Allow-Origin', '*');
                    res.end(JSON.stringify({ ok: true, status: formResp.status }));
                  } catch (err: any) {
                    res.statusCode = 500;
                    res.setHeader('Content-Type', 'application/json; charset=utf-8');
                    res.setHeader('Access-Control-Allow-Origin', '*');
                    res.end(JSON.stringify({ ok: false, error: err?.message }));
                  }
                });
                return;
              }

              // Community Image Upload endpoint (stores image in public/uploads/community for shared access)
              if (decodedUrl === '/api/community/upload-image' && req.method === 'POST') {
                let body = '';
                req.on('data', chunk => { body += chunk; });
                req.on('end', () => {
                  try {
                    let imageData = '';
                    try {
                      const parsed = JSON.parse(body);
                      imageData = parsed.image || '';
                    } catch {
                      imageData = body;
                    }

                    if (!imageData || imageData.length < 20) {
                      res.statusCode = 400;
                      res.setHeader('Content-Type', 'application/json; charset=utf-8');
                      res.end(JSON.stringify({ ok: false, error: 'Empty image data' }));
                      return;
                    }

                    const cleanBase64 = imageData.replace(/^data:image\/[a-zA-Z0-9.+]+;base64,/, '');
                    const buf = Buffer.from(cleanBase64, 'base64');
                    const uploadDir = path.resolve(process.cwd(), 'public', 'uploads', 'community');
                    if (!fs.existsSync(uploadDir)) {
                      fs.mkdirSync(uploadDir, { recursive: true });
                    }
                    const filename = `img_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.jpg`;
                    const filePath = path.join(uploadDir, filename);
                    fs.writeFileSync(filePath, buf);

                    const publicUrl = `/uploads/community/${filename}`;
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json; charset=utf-8');
                    res.setHeader('Access-Control-Allow-Origin', '*');
                    res.end(JSON.stringify({ ok: true, id: filename, url: publicUrl }));
                  } catch (uploadErr: any) {
                    res.statusCode = 500;
                    res.setHeader('Content-Type', 'application/json; charset=utf-8');
                    res.setHeader('Access-Control-Allow-Origin', '*');
                    res.end(JSON.stringify({ ok: false, error: uploadErr?.message }));
                  }
                });
                return;
              }

              // Community Image Serving endpoint
              if (decodedUrl.startsWith('/api/community/images/')) {
                const filename = path.basename(decodedUrl);
                const filePath = path.resolve(process.cwd(), 'public', 'uploads', 'community', filename);
                if (fs.existsSync(filePath)) {
                  const stat = fs.statSync(filePath);
                  res.statusCode = 200;
                  res.setHeader('Content-Type', 'image/jpeg');
                  res.setHeader('Content-Length', stat.size);
                  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
                  res.setHeader('Access-Control-Allow-Origin', '*');
                  fs.createReadStream(filePath).pipe(res);
                  return;
                } else {
                  res.statusCode = 404;
                  res.end('Image not found');
                  return;
                }
              }

              // Shopify mock endpoints to prevent 404 console errors
              if (
                decodedUrl.includes('sf_private_access_tokens') ||
                decodedUrl.includes('cart.js') ||
                decodedUrl.includes('cart/add.js') ||
                decodedUrl.includes('recommendations/products.json') ||
                decodedUrl.includes('predictive-search') ||
                decodedUrl.includes('.well-known/shopify')
              ) {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json; charset=utf-8');
                res.setHeader('Access-Control-Allow-Origin', '*');
                res.end(JSON.stringify({ status: 'ok', items: [], products: [] }));
                return;
              }

              // Support /ai, /ai/, and /ai.html direct serving for MLX AI Chat
              if (/^\/ai(\/|\.html|\?|$)/i.test(decodedUrl) || /^\/ai(\/|\.html|\?|$)/i.test(rawUrl)) {
                let targetPath = path.join(publicDir, 'ai.html');
                if (!fs.existsSync(targetPath)) {
                  targetPath = path.join(publicDir, 'mlx-chat.html');
                }
                if (fs.existsSync(targetPath)) {
                  const stat = fs.statSync(targetPath);
                  res.statusCode = 200;
                  res.setHeader('Content-Type', 'text/html; charset=utf-8');
                  res.setHeader('Content-Length', stat.size);
                  res.setHeader('Cache-Control', 'no-cache');
                  res.setHeader('Access-Control-Allow-Origin', '*');
                  fs.createReadStream(targetPath).pipe(res);
                  return;
                }
              }

              // Support /mall and /mall/* direct static serving
              if (/^\/mall(\/|$)/i.test(decodedUrl) || /^\/mall(\/|$)/i.test(rawUrl)) {
                let mallRelPath = decodedUrl.replace(/^\/mall(\/)?/i, '');
                let targetPath = path.join(publicDir, 'mall', mallRelPath);

                if (!mallRelPath || (fs.existsSync(targetPath) && fs.statSync(targetPath).isDirectory())) {
                  targetPath = path.join(targetPath, 'index.html');
                } else if (!fs.existsSync(targetPath)) {
                  if (fs.existsSync(targetPath + '.html')) {
                    targetPath = targetPath + '.html';
                  } else {
                    // Try with rawUrl un-decoded path if different
                    const rawRel = rawUrl.replace(/^\/mall(\/)?/i, '');
                    const rawTarget = path.join(publicDir, 'mall', rawRel);
                    if (fs.existsSync(rawTarget)) {
                      targetPath = rawTarget;
                    } else if (fs.existsSync(rawTarget + '.html')) {
                      targetPath = rawTarget + '.html';
                    }
                  }
                }

                if (fs.existsSync(targetPath)) {
                  const stat = fs.statSync(targetPath);
                  if (stat.isFile()) {
                    const ext = path.extname(targetPath).toLowerCase();
                    const contentType = MIME_TYPES[ext] || 'text/html; charset=utf-8';

                    res.statusCode = 200;
                    res.setHeader('Content-Type', contentType);
                    res.setHeader('Content-Length', stat.size);
                    res.setHeader('Cache-Control', 'no-cache');
                    res.setHeader('Access-Control-Allow-Origin', '*');
                    fs.createReadStream(targetPath).pipe(res);
                    return;
                  }
                }
              }

              // Support case-insensitive wildcard paths for /public/*, /Public/*, /PUBLIC/*
              let relativePath = '';
              if (/^\/public(\/|$)/i.test(decodedUrl)) {
                relativePath = decodedUrl.replace(/^\/public(\/)?/i, '');
              }

              if (relativePath) {
                const targetPath = path.join(publicDir, relativePath);

                // Security check to prevent directory traversal
                if (!targetPath.startsWith(publicDir)) {
                  res.statusCode = 403;
                  res.end('Forbidden');
                  return;
                }

                if (fs.existsSync(targetPath)) {
                  const stat = fs.statSync(targetPath);
                  if (stat.isFile()) {
                    const ext = path.extname(targetPath).toLowerCase();
                    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

                    res.statusCode = 200;
                    res.setHeader('Content-Type', contentType);
                    res.setHeader('Content-Length', stat.size);
                    res.setHeader('Cache-Control', 'public, max-age=3600');
                    res.setHeader('Access-Control-Allow-Origin', '*');
                    fs.createReadStream(targetPath).pipe(res);
                    return;
                  }
                }
              }
            } catch (err) {
              console.error('[public-wildcard-static-plugin error]', err);
            }

            next();
          });
        }
      },
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
            if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('/scheduler/') || id.includes('/use-sync-external-store/')) return 'vendor-react';
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
      dedupe: ['react', 'react-dom', 'react/jsx-runtime', 'react/jsx-dev-runtime'],
    },
    optimizeDeps: {
      entries: ['src/**/*.{ts,tsx}'],
      include: [
        'react',
        'react-dom',
        'react-dom/client',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
        '@dnd-kit/core',
        '@dnd-kit/sortable',
        '@dnd-kit/utilities',
        '@paypal/react-paypal-js',
        '@tensorflow/tfjs',
        'axios',
        'clsx',
        'firebase/app',
        'firebase/auth',
        'firebase/database',
        'framer-motion',
        'html-to-image',
        'jsqr',
        'leaflet',
        'lucide-react',
        'lz-string',
        'motion/react',
        'qrcode.react',
        'tailwind-merge',
        'three',
      ],
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      host: '0.0.0.0',
      port: 3000,
      hmr: process.env.DISABLE_HMR !== 'true' ? { port: 24680 } : false,
      allowedHosts: true,
      fs: {
        allow: ['.', 'public'],
      },
      proxy: {
        '/api-mlx': {
          target: 'http://127.0.0.1:11234',
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/api-mlx/, ''),
        }
      }
    },
  };
});
