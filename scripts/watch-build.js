import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';

const rootDir = process.cwd();
const srcDir = path.join(rootDir, 'src');

let isBuilding = false;
let pendingBuild = false;
let debounceTimer = null;
let lastBuildFinishedAt = Date.now();

console.log('👀 [watch-build] Watching src/ directory for changes...');
console.log('⚡ Any file save will automatically trigger production build into dist/');

function runBuild() {
  if (isBuilding) {
    return;
  }

  isBuilding = true;
  pendingBuild = false;
  const startTime = Date.now();
  console.log(`\n🔨 [watch-build] File change detected! Starting build...`);

  exec('npm run build', (error, stdout, stderr) => {
    isBuilding = false;
    lastBuildFinishedAt = Date.now();
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    if (error) {
      console.error(`❌ [watch-build] Build failed (${duration}s):`, stderr || error.message);
    } else {
      console.log(`✅ [watch-build] Build completed in ${duration}s! Latest dist/ is now live on preview server.`);
    }

    if (pendingBuild) {
      pendingBuild = false;
      console.log('🔄 [watch-build] Pending changes detected during build. Rebuilding...');
      setTimeout(runBuild, 1500);
    }
  });
}

function onChange(eventType, filename) {
  if (!filename) return;
  if (isBuilding || Date.now() - lastBuildFinishedAt < 3000) return;
  // Ignore temp files or auto-generated seed files
  if (
    filename.includes('.git') ||
    filename.includes('node_modules') ||
    filename.includes('dist') ||
    filename.includes('googleNewsSeedData')
  ) {
    return;
  }

  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    runBuild();
  }, 1500);
}

try {
  fs.watch(srcDir, { recursive: true }, onChange);
} catch (err) {
  console.error('Failed to start fs.watch:', err);
}
