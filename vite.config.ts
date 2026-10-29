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
        name: 'clean-dist-assets',
        buildStart() {
          const assetsDir = path.resolve(process.cwd(), 'dist', 'assets');
          if (fs.existsSync(assetsDir)) {
            try {
              const files = fs.readdirSync(assetsDir);
              for (const file of files) {
                fs.rmSync(path.join(assetsDir, file), { recursive: true, force: true });
              }
            } catch (err) {
              console.warn('[clean-dist-assets] Warning while cleaning assets:', err);
            }
          }
        },
      },
      (() => {
        const middleware = (req: any, res: any, next: any) => {
          if (!req.url) return next();

            try {
              const rawUrl = req.url.split('?')[0];
              const decodedUrl = decodeURIComponent(rawUrl);

              // 0. Fast HTTP Cache-Control for immutable production assets
              if (decodedUrl.startsWith('/assets/')) {
                res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
              }

              // Real-time Reddit RSS Feed proxy (fetches live posts from reddit.com with smart in-memory caching)
              if (decodedUrl === '/api/reddit/feed') {
                const urlObj = new URL(req.url || '', 'http://localhost');
                const sub = urlObj.searchParams.get('sub') || 'popular';
                const cacheKey = `sub_${sub}`;
                const now = Date.now();

                // 1. 메모리 캐시 확인 (5분 유효)
                const cached = (global as any).__redditCache?.[cacheKey];
                if (cached && now - cached.time < 300000) {
                  res.statusCode = 200;
                  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
                  res.setHeader('Access-Control-Allow-Origin', '*');
                  res.setHeader('X-Cache', 'HIT');
                  res.end(cached.data);
                  return;
                }

                const redditRssUrl = `https://www.reddit.com/r/${encodeURIComponent(sub)}/.rss`;

                fetch(redditRssUrl, {
                  headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'application/rss+xml, application/xml, text/xml, */*',
                  },
                })
                  .then(async (resp) => {
                    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
                    const xml = await resp.text();

                    // 캐시 저장
                    if (!(global as any).__redditCache) (global as any).__redditCache = {};
                    (global as any).__redditCache[cacheKey] = { time: now, data: xml };

                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
                    res.setHeader('Access-Control-Allow-Origin', '*');
                    res.setHeader('Cache-Control', 'public, max-age=180');
                    res.setHeader('X-Cache', 'MISS');
                    res.end(xml);
                  })
                  .catch((err) => {
                    // 에러 시 직전 캐시가 있으면 캐시 반환
                    if (cached && cached.data) {
                      res.statusCode = 200;
                      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
                      res.setHeader('Access-Control-Allow-Origin', '*');
                      res.setHeader('X-Cache', 'STALE');
                      res.end(cached.data);
                      return;
                    }

                    res.statusCode = 502;
                    res.setHeader('Content-Type', 'application/json; charset=utf-8');
                    res.setHeader('Access-Control-Allow-Origin', '*');
                    res.end(JSON.stringify({ error: err?.message || 'Failed to fetch Reddit RSS' }));
                  });
                return;
              }

              // Real-time Reddit Comments RSS proxy (fetches real original comments from reddit.com)
              if (decodedUrl === '/api/reddit/comments') {
                const urlObj = new URL(req.url || '', 'http://localhost');
                const sub = urlObj.searchParams.get('sub') || 'popular';
                const id = urlObj.searchParams.get('id') || '';
                const cacheKey = `comments_${sub}_${id}`;
                const now = Date.now();

                const cached = (global as any).__redditCache?.[cacheKey];
                if (cached && now - cached.time < 300000) {
                  res.statusCode = 200;
                  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
                  res.setHeader('Access-Control-Allow-Origin', '*');
                  res.setHeader('X-Cache', 'HIT');
                  res.end(cached.data);
                  return;
                }

                const redditCommentsRssUrl = `https://www.reddit.com/r/${encodeURIComponent(sub)}/comments/${encodeURIComponent(id)}/.rss`;

                fetch(redditCommentsRssUrl, {
                  headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'application/rss+xml, application/xml, text/xml, */*',
                  },
                })
                  .then(async (resp) => {
                    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
                    const xml = await resp.text();

                    if (!(global as any).__redditCache) (global as any).__redditCache = {};
                    (global as any).__redditCache[cacheKey] = { time: now, data: xml };

                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
                    res.setHeader('Access-Control-Allow-Origin', '*');
                    res.setHeader('Cache-Control', 'public, max-age=180');
                    res.setHeader('X-Cache', 'MISS');
                    res.end(xml);
                  })
                  .catch((err) => {
                    if (cached && cached.data) {
                      res.statusCode = 200;
                      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
                      res.setHeader('Access-Control-Allow-Origin', '*');
                      res.setHeader('X-Cache', 'STALE');
                      res.end(cached.data);
                      return;
                    }

                    res.statusCode = 502;
                    res.setHeader('Content-Type', 'application/json; charset=utf-8');
                    res.setHeader('Access-Control-Allow-Origin', '*');
                    res.end(JSON.stringify({ error: err?.message || 'Failed to fetch Reddit comments' }));
                  });
                return;
              }

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

              // Google News Spreadsheet proxy (bypasses browser CORS restrictions)
              if (decodedUrl === '/api/reddit/google-news-sheet') {
                const pubCsvUrl = `https://docs.google.com/spreadsheets/d/e/2PACX-1vQkHP5pQDdSMrx3f0GyUz_rK5yqmMj5J12apkSom3JvF-NVk2yD55tFAk_Ka7qKM54dPr1ru3LP15Zu/pub?output=csv&_t=${Date.now()}`;
                fetch(pubCsvUrl, { redirect: 'follow' })
                  .then(async (resp) => {
                    if (!resp.ok) {
                      throw new Error(`HTTP ${resp.status}`);
                    }
                    const text = await resp.text();
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
                    res.setHeader('Access-Control-Allow-Origin', '*');
                    res.setHeader('Cache-Control', 'no-cache');
                    res.end(text);
                  })
                  .catch((err) => {
                    const localBackup = path.resolve(process.cwd(), 'public', 'data', 'google-news.csv');
                    if (fs.existsSync(localBackup)) {
                      const csv = fs.readFileSync(localBackup, 'utf-8');
                      res.statusCode = 200;
                      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
                      res.setHeader('Access-Control-Allow-Origin', '*');
                      res.end(csv);
                      return;
                    }
                    res.statusCode = 502;
                    res.setHeader('Content-Type', 'application/json; charset=utf-8');
                    res.setHeader('Access-Control-Allow-Origin', '*');
                    res.end(JSON.stringify({ error: err?.message || 'Failed to fetch news spreadsheet' }));
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

              // Crypto Payment API endpoints (OKX / Web3 Crypto Payments)
              if (decodedUrl === '/api/crypto/coins') {
                const coinsList = [
                  { ccy: 'USDT', name: 'Tether USD', chains: ['USDT-TRC20', 'USDT-ERC20', 'USDT-Polygon', 'USDT-Arbitrum One', 'USDT-Solana'], icon: '💵' },
                  { ccy: 'TRX', name: 'TRON', chains: ['TRX-TRC20'], icon: '🔴' },
                  { ccy: 'BTC', name: 'Bitcoin', chains: ['BTC-Bitcoin', 'BTC-Lightning'], icon: '₿' },
                  { ccy: 'ETH', name: 'Ethereum', chains: ['ETH-ERC20', 'ETH-Arbitrum One', 'ETH-Optimism', 'ETH-Base'], icon: 'Ξ' },
                  { ccy: 'SOL', name: 'Solana', chains: ['SOL-Solana'], icon: '◎' },
                  { ccy: 'USDC', name: 'USD Coin', chains: ['USDC-ERC20', 'USDC-Solana', 'USDC-Polygon'], icon: '💲' },
                  { ccy: 'DOGE', name: 'Dogecoin', chains: ['DOGE-Dogecoin'], icon: 'Ð' },
                  { ccy: 'XRP', name: 'Ripple', chains: ['XRP-ERC20', 'XRP-Ripple'], icon: '✕' }
                ];
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json; charset=utf-8');
                res.setHeader('Access-Control-Allow-Origin', '*');
                res.end(JSON.stringify(coinsList));
                return;
              }

              if (decodedUrl === '/api/crypto/deposit-address') {
                const urlObj = new URL(req.url || '', 'http://localhost');
                const ccy = (urlObj.searchParams.get('ccy') || 'USDT').toUpperCase();
                const chain = urlObj.searchParams.get('chain') || `${ccy}-TRC20`;

                // 사용자 지정 입금 주소 (EVM/ERC20, TRC20, BTC, DOGE, SOL)
                let addr = '0x59448a8bb4d0944568b7344519f59e2960b8d8c6';
                if (chain.includes('TRC20') || ccy === 'TRX') {
                  addr = 'TCYytM1g3xjPo9KR7Sky4ibpZgB9MxL7PH';
                } else if (chain.includes('BTC') || chain.includes('Bitcoin')) {
                  addr = 'bc1qa0x4y2nrwgd0mcpuke33g08umjs8t3fmv2qpn2';
                } else if (chain.includes('DOGE')) {
                  addr = 'DCgwCiMd66t18YXAKRJtoUNpbt9sn5mR6m';
                } else if (chain.includes('Solana') || chain.includes('SOL')) {
                  addr = '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU';
                } else {
                  // USDT-ERC20, ETH, XRP-ERC20, 기타 EVM
                  addr = '0x59448a8bb4d0944568b7344519f59e2960b8d8c6';
                }

                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json; charset=utf-8');
                res.setHeader('Access-Control-Allow-Origin', '*');
                res.end(JSON.stringify({
                  code: '0',
                  msg: '',
                  data: [{ addr, ccy, chain }]
                }));
                return;
              }

              if (decodedUrl === '/api/crypto/rate') {
                const urlObj = new URL(req.url || '', 'http://localhost');
                const ccy = (urlObj.searchParams.get('ccy') || 'USDT').toUpperCase();
                // 1 USD 당 각 코인 개수 (rate: crypto amount for 1 USD)
                const rates: Record<string, number> = {
                  USDT: 1.0,
                  USDC: 1.0,
                  TRX: 6.25,
                  BTC: 0.000015,
                  ETH: 0.00029,
                  SOL: 0.0068,
                  DOGE: 6.25,
                  XRP: 1.65
                };
                const rate = rates[ccy] || 1.0;
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json; charset=utf-8');
                res.setHeader('Access-Control-Allow-Origin', '*');
                res.end(JSON.stringify({ ccy, rate }));
                return;
              }

              if (decodedUrl === '/api/crypto/check-deposit') {
                const urlObj = new URL(req.url || '', 'http://localhost');
                const since = parseInt(urlObj.searchParams.get('since') || '0', 10);
                const amount = urlObj.searchParams.get('amount') || '0';
                const ccy = urlObj.searchParams.get('ccy') || 'USDT';
                const elapsed = Date.now() - since;

                // 25초 이상 경과했거나 수동 확인 시 성공 반환
                const status = (elapsed > 25000 || urlObj.searchParams.get('force') === 'true') ? 'success' : 'pending';
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json; charset=utf-8');
                res.setHeader('Access-Control-Allow-Origin', '*');
                res.end(JSON.stringify({
                  status,
                  amount,
                  ccy,
                  txHash: `0x${Math.random().toString(16).substring(2, 10)}${Date.now()}`
                }));
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

              // Support /gwent and /gwent/* direct static serving for The Witcher 3 Gwent Classic game
              if (/^\/gwent(\/|$)/i.test(decodedUrl) || /^\/gwent(\/|$)/i.test(rawUrl)) {
                // If requested without trailing slash (/gwent), redirect to /gwent/ for correct relative asset paths
                if (decodedUrl.toLowerCase() === '/gwent') {
                  const search = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
                  res.statusCode = 301;
                  res.setHeader('Location', `/gwent/${search}`);
                  res.end();
                  return;
                }

                let gwentRel = decodedUrl.replace(/^\/gwent\/?/i, '');
                let targetPath = path.join(publicDir, 'gwent', gwentRel);

                if (!gwentRel || (fs.existsSync(targetPath) && fs.statSync(targetPath).isDirectory())) {
                  targetPath = path.join(targetPath, 'index.html');
                } else if (!fs.existsSync(targetPath) && fs.existsSync(targetPath + '.html')) {
                  targetPath = targetPath + '.html';
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

              // Comprehensive Wildcard Serving for /public/* and any file/folder inside /public
              let relativePath = '';
              if (/^\/public(\/|$)/i.test(decodedUrl)) {
                relativePath = decodedUrl.replace(/^\/public(\/)?/i, '');
              } else if (
                !decodedUrl.startsWith('/api/') &&
                !decodedUrl.startsWith('/@') &&
                !decodedUrl.startsWith('/src/') &&
                !decodedUrl.startsWith('/node_modules/') &&
                !decodedUrl.startsWith('/assets/') &&
                decodedUrl !== '/' &&
                decodedUrl !== '/index.html'
              ) {
                // If path directly matches a file or folder in public/
                const candidate = decodedUrl.replace(/^\//, '');
                const directTest = path.join(publicDir, candidate);
                if (directTest !== publicDir && fs.existsSync(directTest)) {
                  relativePath = candidate;
                }
              }

              if (relativePath) {
                let targetPath = path.join(publicDir, relativePath);

                // Security check to prevent directory traversal
                if (targetPath.startsWith(publicDir)) {
                  // If target is a directory, redirect with trailing slash if needed, then serve index.html
                  if (fs.existsSync(targetPath) && fs.statSync(targetPath).isDirectory()) {
                    if (!decodedUrl.endsWith('/')) {
                      const search = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
                      res.statusCode = 301;
                      res.setHeader('Location', `${decodedUrl}/${search}`);
                      res.end();
                      return;
                    }
                    targetPath = path.join(targetPath, 'index.html');
                  } else if (!fs.existsSync(targetPath) && fs.existsSync(targetPath + '.html')) {
                    targetPath = targetPath + '.html';
                  }

                  if (fs.existsSync(targetPath)) {
                    const stat = fs.statSync(targetPath);
                    if (stat.isFile()) {
                      const ext = path.extname(targetPath).toLowerCase();
                      const contentType = MIME_TYPES[ext] || 'application/octet-stream';

                      const etag = `W/"${stat.size.toString(16)}-${Math.floor(stat.mtimeMs).toString(16)}"`;
                      res.setHeader('ETag', etag);
                      res.setHeader('Last-Modified', stat.mtime.toUTCString());
                      if (ext === '.html' || ext === '.json' || relativePath === 'version.json') {
                        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
                        res.setHeader('Pragma', 'no-cache');
                        res.setHeader('Expires', '0');
                      } else {
                        res.setHeader('Cache-Control', 'no-cache');
                        if (req.headers['if-none-match'] === etag) {
                          res.statusCode = 304;
                          res.end();
                          return;
                        }
                      }
                      res.statusCode = 200;
                      res.setHeader('Content-Type', contentType);
                      res.setHeader('Content-Length', stat.size);
                      res.setHeader('Access-Control-Allow-Origin', '*');
                      fs.createReadStream(targetPath).pipe(res);
                      return;
                    }
                  }
                }
              }
            } catch (err) {
              console.error('[public-wildcard-static-plugin error]', err);
            }

            next();
          };
          return {
            name: 'public-wildcard-static-plugin',
            configureServer(server: any) { server.middlewares.use(middleware); },
            configurePreviewServer(server: any) { server.middlewares.use(middleware); },
          };
        })(),
        (() => {
          const middleware = (req: any, res: any, next: any) => {
            if (req.url === '/api/health' || req.url === '/health') {
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
              res.end(JSON.stringify({ status: 'ok', timestamp: Date.now() }));
              return;
            }

            const cleanReqPath = (req.url || '').split('?')[0];
            if (cleanReqPath === '/api/version' || cleanReqPath === '/version' || cleanReqPath === '/version.json') {
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
              res.setHeader('Pragma', 'no-cache');
              res.setHeader('Expires', '0');
              try {
                const distVersionPath = path.resolve(process.cwd(), 'dist', 'version.json');
                const publicVersionPath = path.resolve(process.cwd(), 'public', 'version.json');
                if (fs.existsSync(distVersionPath)) {
                  res.end(fs.readFileSync(distVersionPath, 'utf8'));
                  return;
                }
                if (fs.existsSync(publicVersionPath)) {
                  res.end(fs.readFileSync(publicVersionPath, 'utf8'));
                  return;
                }
              } catch {}
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
          };
          return {
            name: 'api-endpoints-plugin',
            configureServer(server: any) { server.middlewares.use(middleware); },
            configurePreviewServer(server: any) { server.middlewares.use(middleware); },
          };
        })(),
    ],
    base: process.env.VITE_BASE_PATH || './',
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      emptyOutDir: false,
      rollupOptions: {
        output: {
          entryFileNames: `assets/[name]-[hash].js`,
          chunkFileNames: `assets/[name]-[hash].js`,
          assetFileNames: `assets/[name]-[hash][extname]`,
          manualChunks(id) {
            if (id.includes('webtoonEpisodeManifest')) return 'data-webtoon';
            if (id.includes('src/lib/i18n')) return 'data-i18n';
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
      hmr: process.env.DISABLE_HMR !== 'true' ? true : false,
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
    preview: {
      host: '0.0.0.0',
      port: 3000,
      allowedHosts: true,
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
