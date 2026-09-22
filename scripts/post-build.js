import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();
const distDir = path.join(rootDir, 'dist');
const publicDir = path.join(rootDir, 'public');

console.log('[post-build] Running post-build enhancements...');

if (!fs.existsSync(distDir)) {
  console.log('[post-build] dist directory does not exist, creating...');
  fs.mkdirSync(distDir, { recursive: true });
}

// 1. Find entry script in dist/assets
let entryScript = '';
const assetsDir = path.join(distDir, 'assets');
if (fs.existsSync(assetsDir)) {
  const files = fs.readdirSync(assetsDir);
  const indexJs = files.find(f => f.startsWith('index-') && f.endsWith('.js'));
  if (indexJs) {
    entryScript = `/assets/${indexJs}`;
    console.log(`[post-build] Detected entry script: ${entryScript}`);
  }
}

// 2. Generate version.json
const versionData = {
  version: '2.1.0',
  buildTime: new Date().toISOString(),
  buildTimestamp: Date.now(),
  service: 'snshero-revolution',
  minRequiredVersion: '2.0.0',
  entryScript: entryScript || '/assets/index.js',
};

fs.writeFileSync(path.join(distDir, 'version.json'), JSON.stringify(versionData, null, 2), 'utf8');
if (fs.existsSync(publicDir)) {
  fs.writeFileSync(path.join(publicDir, 'version.json'), JSON.stringify(versionData, null, 2), 'utf8');
}
console.log('[post-build] Generated version.json');

// 3. Copy metadata.json
const metaSource = path.join(rootDir, 'metadata.json');
if (fs.existsSync(metaSource)) {
  fs.copyFileSync(metaSource, path.join(distDir, 'metadata.json'));
  if (fs.existsSync(publicDir)) {
    fs.copyFileSync(metaSource, path.join(publicDir, 'metadata.json'));
  }
  console.log('[post-build] Synced metadata.json to dist/ and public/');
}

// 4. Generate SPA route directories with index.html for clean URL routing
const routes = [
  'home', 'play', 'deck', 'shop', 'battle', 'market',
  'ranking', 'guild', 'novel', 'event', 'companion',
  'stock', 'community', 'admin', 'status', 'profile',
  'setting', 'share', 'boost', 'creator', 'web3', 'mall'
];

const indexPath = path.join(distDir, 'index.html');
if (fs.existsSync(indexPath)) {
  for (const route of routes) {
    const routeDir = path.join(distDir, route);
    if (!fs.existsSync(routeDir)) {
      fs.mkdirSync(routeDir, { recursive: true });
    }
    fs.copyFileSync(indexPath, path.join(routeDir, 'index.html'));
  }
  console.log(`[post-build] Generated ${routes.length} static SPA route fallback pages`);
}

// 5. Ensure 404.html fallback
const notFoundPath = path.join(distDir, '404.html');
if (fs.existsSync(indexPath) && !fs.existsSync(notFoundPath)) {
  fs.copyFileSync(indexPath, notFoundPath);
  console.log('[post-build] Generated 404.html from index.html');
}

console.log('[post-build] Post-build completed successfully.');
