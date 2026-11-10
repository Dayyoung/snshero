import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';

const rootDir = process.cwd();
const srcDir = path.join(rootDir, 'src');

const WATCHED_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.css',
  '.json',
  '.html',
]);

let isBuilding = false;
let pendingBuild = false;
let debounceTimer = null;
let currentBuildStartedAt = 0;
let lastBuildFinishedAt = Date.now();

console.log('👀 [watch-build] Watching src/ directory for changes...');
console.log('⚡ Any file save will automatically trigger zero-downtime production build into dist/');

function runBuild() {
  if (isBuilding) {
    return;
  }

  isBuilding = true;
  pendingBuild = false;
  currentBuildStartedAt = Date.now();
  console.log(`\n🔨 [watch-build] File change detected! Starting zero-downtime build...`);

  exec('npm run build', (error, _stdout, stderr) => {
    isBuilding = false;
    lastBuildFinishedAt = Date.now();
    const duration = ((lastBuildFinishedAt - currentBuildStartedAt) / 1000).toFixed(1);

    if (error) {
      console.error(`❌ [watch-build] Build failed (${duration}s):`, stderr || error.message);
    } else {
      console.log(`✅ [watch-build] Build completed in ${duration}s! Latest dist/ is now live on preview server.`);
    }

    if (pendingBuild) {
      pendingBuild = false;
      console.log('🔄 [watch-build] Pending changes detected during build. Rebuilding after cooldown...');
      setTimeout(runBuild, 3000);
    }
  });
}

function onChange(_eventType, filename) {
  if (!filename) return;
  const normalized = String(filename).replace(/\\/g, '/');

  // Ignore temp files, OS metadata, or auto-generated seed files
  if (
    normalized.includes('.git') ||
    normalized.includes('node_modules') ||
    normalized.includes('dist') ||
    normalized.includes('.DS_Store') ||
    normalized.endsWith('.swp') ||
    normalized.endsWith('.tmp') ||
    normalized.endsWith('~') ||
    normalized.includes('googleNewsSeedData')
  ) {
    return;
  }

  const ext = path.extname(normalized).toLowerCase();
  if (ext && !WATCHED_EXTENSIONS.has(ext)) {
    return;
  }

  // Verify actual file mtime so delayed macOS FSEvents or build-time touches never loop
  const fullPath = path.join(srcDir, normalized);
  let fileMtimeMs = Date.now();
  try {
    if (fs.existsSync(fullPath)) {
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) return;
      fileMtimeMs = stat.mtimeMs;
    }
  } catch {
    // File may have been deleted/renamed; proceed with current timestamp
  }

  if (isBuilding) {
    if (fileMtimeMs > currentBuildStartedAt + 1000) {
      pendingBuild = true;
    }
    return;
  }

  if (
    Date.now() - lastBuildFinishedAt < 3000 ||
    fileMtimeMs <= lastBuildFinishedAt + 500
  ) {
    return;
  }

  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    runBuild();
  }, 2500);
}

try {
  fs.watch(srcDir, { recursive: true }, onChange);
} catch (err) {
  console.error('Failed to start fs.watch:', err);
}
