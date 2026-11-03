/**
 * Comprehensive Empirical Adversarial Oracle for Milestone 1:
 * Static Architecture & MPA Decoupling
 * 
 * Verifies every single HTML file in dist/ (750+ files)
 * Author: teamwork_challenger (empirical-challenger)
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execSync } from 'child_process';
import { getViewFromPath, getViewPath, VIEW_ROUTES } from '../src/routes';

const ROOT_DIR = process.cwd();
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');

interface AssertionResult {
  id: string;
  name: string;
  passed: boolean;
  expected: string;
  actual: string;
  details?: string[];
}

const results: AssertionResult[] = [];

function assert(id: string, name: string, condition: boolean, expected: string, actual: string, details?: string[]) {
  results.push({ id, name, passed: condition, expected, actual, details });
  const status = condition ? '\x1b[92m[PASS]\x1b[0m' : '\x1b[91m[FAIL]\x1b[0m';
  console.log(`  ${status} [${id}] ${name}`);
  if (!condition) {
    console.log(`      Expected: ${expected}`);
    console.log(`      Actual  : ${actual}`);
    if (details) {
      for (const d of details.slice(0, 10)) {
        console.log(`        - ${d}`);
      }
      if (details.length > 10) {
        console.log(`        ... and ${details.length - 10} more`);
      }
    }
  }
}

function walkDir(dir: string, ext = '.html'): string[] {
  let files: string[] = [];
  if (!fs.existsSync(dir)) return files;
  for (const item of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      files = files.concat(walkDir(fullPath, ext));
    } else if (item.endsWith(ext)) {
      files.push(fullPath);
    }
  }
  return files;
}

console.log('======================================================================');
console.log('  EMPIRICAL ADVERSARIAL ORACLE: Milestone 1 Full Verification         ');
console.log('======================================================================\n');

// ---------------------------------------------------------------------------
// Suite 1: Full Dist HTML Inventory Scan
// ---------------------------------------------------------------------------
console.log('>>> Suite 1: Exhaustive Filesystem Inventory Audit (dist/ & public/)');

const allDistHtml = walkDir(DIST_DIR);
const allPublicHtml = walkDir(PUBLIC_DIR);

console.log(`Total HTML files discovered in dist/  : ${allDistHtml.length}`);
console.log(`Total HTML files discovered in public/: ${allPublicHtml.length}`);

// 1.1 Invariant: Exactly 1 landing-root in dist/ (dist/index.html only)
const distLandingRootFiles: string[] = [];
const publicLandingRootFiles: string[] = [];
const distSpaRootFiles: string[] = [];
const distNonSpaHtmlFiles: string[] = [];

for (const filePath of allDistHtml) {
  const content = fs.readFileSync(filePath, 'utf8');
  const hasLandingRoot = content.includes('id="landing-root"');
  const hasSpaRoot = content.includes('id="root"');

  if (hasLandingRoot) distLandingRootFiles.push(path.relative(ROOT_DIR, filePath));
  if (hasSpaRoot) distSpaRootFiles.push(path.relative(ROOT_DIR, filePath));
  if (!hasLandingRoot && !hasSpaRoot) distNonSpaHtmlFiles.push(path.relative(ROOT_DIR, filePath));
}

for (const filePath of allPublicHtml) {
  const content = fs.readFileSync(filePath, 'utf8');
  if (content.includes('id="landing-root"')) {
    publicLandingRootFiles.push(path.relative(ROOT_DIR, filePath));
  }
}

assert(
  'ORACLE-M1-01',
  'Exactly 1 file in dist/ mounts to #landing-root (dist/index.html only)',
  distLandingRootFiles.length === 1 && distLandingRootFiles[0] === 'dist/index.html',
  'dist/index.html only (1 file)',
  `${distLandingRootFiles.length} files: ${distLandingRootFiles.join(', ')}`
);

assert(
  'ORACLE-M1-02',
  'Zero files in public/ contain #landing-root (no pollution of public directory)',
  publicLandingRootFiles.length === 0,
  '0 files',
  `${publicLandingRootFiles.length} files`,
  publicLandingRootFiles
);

// 1.2 Invariant: dist/index.html bundle isolation
const distIndexContent = fs.readFileSync(path.join(DIST_DIR, 'index.html'), 'utf8');
const indexHasSpaRoot = distIndexContent.includes('id="root"');
const indexHasHomeScript = distIndexContent.includes('/assets/home-');
const indexHasVendorReact = distIndexContent.includes('vendor-react');
const indexHasVendorTf = distIndexContent.includes('vendor-tensorflow');
const indexHasVendorFb = distIndexContent.includes('vendor-firebase');
const indexHasVendorMotion = distIndexContent.includes('vendor-motion');

assert(
  'ORACLE-M1-03',
  'dist/index.html has zero SPA root and zero heavy vendor chunks',
  !indexHasSpaRoot && !indexHasHomeScript && !indexHasVendorReact && !indexHasVendorTf && !indexHasVendorFb && !indexHasVendorMotion,
  'pure static landing (no SPA or heavy vendor scripts)',
  `root:${indexHasSpaRoot}, homeScript:${indexHasHomeScript}, react:${indexHasVendorReact}, tf:${indexHasVendorTf}, fb:${indexHasVendorFb}, motion:${indexHasVendorMotion}`
);

// Calculate JS bundle size of dist/index.html
const indexJsMatches = [...distIndexContent.matchAll(/src=["'](\/assets\/[^"']+\.js)["']/g)];
let indexTotalBytes = 0;
const indexJsDetails: string[] = [];
for (const match of indexJsMatches) {
  const scriptPath = path.join(DIST_DIR, match[1].replace(/^\//, ''));
  if (fs.existsSync(scriptPath)) {
    const size = fs.statSync(scriptPath).size;
    indexTotalBytes += size;
    indexJsDetails.push(`${match[1]} (${size} bytes)`);
  }
}

assert(
  'ORACLE-M1-04',
  'dist/index.html initial JS bundle size <= 50 KB budget',
  indexTotalBytes <= 51200,
  '<= 51200 bytes',
  `${indexTotalBytes} bytes (${(indexTotalBytes / 1024).toFixed(2)} KB)`,
  indexJsDetails
);

// ---------------------------------------------------------------------------
// Suite 2: All SPA Files Validation (650+ files)
// ---------------------------------------------------------------------------
console.log('\n>>> Suite 2: Exhaustive Validation of All SPA Files in dist/');

console.log(`Auditing ${distSpaRootFiles.length} SPA HTML files for #root, home-*.js, and absolute paths...`);

const filesMissingHomeJs: string[] = [];
const filesWithRelativePaths: string[] = [];
const filesWithLandingRootCollision: string[] = [];

for (const relPath of distSpaRootFiles) {
  const absPath = path.join(ROOT_DIR, relPath);
  const content = fs.readFileSync(absPath, 'utf8');

  // Check 1: Must load /assets/home-*.js
  const hasHomeJs = /\/assets\/home-[A-Za-z0-9_-]+\.js/.test(content);
  if (!hasHomeJs) filesMissingHomeJs.push(relPath);

  // Check 2: Zero relative asset paths
  const hasRelPath = /(?:src|href)=["'](?:\.\/)?assets\//.test(content);
  if (hasRelPath) filesWithRelativePaths.push(relPath);

  // Check 3: Zero landing-root collision
  if (content.includes('id="landing-root"')) filesWithLandingRootCollision.push(relPath);
}

assert(
  'ORACLE-M1-05',
  `All ${distSpaRootFiles.length} SPA files load /assets/home-*.js`,
  filesMissingHomeJs.length === 0,
  '0 files missing home-*.js',
  `${filesMissingHomeJs.length} files missing home-*.js`,
  filesMissingHomeJs
);

assert(
  'ORACLE-M1-06',
  `All ${distSpaRootFiles.length} SPA files use absolute /assets/ paths (zero relative paths)`,
  filesWithRelativePaths.length === 0,
  '0 files with relative paths',
  `${filesWithRelativePaths.length} files with relative paths`,
  filesWithRelativePaths
);

assert(
  'ORACLE-M1-07',
  `All ${distSpaRootFiles.length} SPA files are free of #landing-root collision`,
  filesWithLandingRootCollision.length === 0,
  '0 collisions',
  `${filesWithLandingRootCollision.length} collisions`,
  filesWithLandingRootCollision
);

// ---------------------------------------------------------------------------
// Suite 3: Specific Critical Route Categories Audit
// ---------------------------------------------------------------------------
console.log('\n>>> Suite 3: Category-Specific Subroute Audits');

const checkRouteCategory = (prefix: string, minExpected: number, suiteId: string, desc: string) => {
  const matches = distSpaRootFiles.filter(f => f.startsWith(prefix));
  const allValid = matches.length >= minExpected && matches.every(f => {
    const c = fs.readFileSync(path.join(ROOT_DIR, f), 'utf8');
    return c.includes('id="root"') && /\/assets\/home-[A-Za-z0-9_-]+\.js/.test(c);
  });
  assert(
    suiteId,
    `${desc} (count: ${matches.length}, min: ${minExpected})`,
    allValid,
    `>= ${minExpected} valid SPA files`,
    `${matches.length} files (valid: ${allValid})`
  );
};

// 41 movie routes (movie/index.html and movie/ep-1..40/index.html)
checkRouteCategory('dist/movie', 41, 'ORACLE-M1-08', 'Movie subroutes (dist/movie/)');
// 41 cinema routes (cinema/index.html and cinema/ep-1..40/index.html)
checkRouteCategory('dist/cinema', 41, 'ORACLE-M1-09', 'Cinema subroutes (dist/cinema/)');
// Reddit subroutes (reddit/)
checkRouteCategory('dist/reddit', 240, 'ORACLE-M1-10', 'Reddit subroutes (dist/reddit/)');
// R/ subroutes (r/news, r/hanguk, etc.)
checkRouteCategory('dist/r', 260, 'ORACLE-M1-11', 'R/ community subroutes (dist/r/)');
// Core SPA routes
const coreRoutes = ['deck', 'play', 'shop', 'battle', 'bench', 'novel', 'webtoon', 'ranking', 'guild', 'companion'];
let coreAllValid = true;
const invalidCore: string[] = [];
for (const cr of coreRoutes) {
  const crPath = path.join(DIST_DIR, cr, 'index.html');
  if (!fs.existsSync(crPath)) {
    coreAllValid = false;
    invalidCore.push(`Missing: dist/${cr}/index.html`);
  } else {
    const c = fs.readFileSync(crPath, 'utf8');
    if (!c.includes('id="root"') || !/\/assets\/home-[A-Za-z0-9_-]+\.js/.test(c)) {
      coreAllValid = false;
      invalidCore.push(`Invalid: dist/${cr}/index.html`);
    }
  }
}
assert(
  'ORACLE-M1-12',
  'All 10 Core game SPA routes exist with valid #root & home-*.js',
  coreAllValid,
  '10 valid routes',
  invalidCore.length === 0 ? 'All 10 valid' : invalidCore.join('; ')
);

// ---------------------------------------------------------------------------
// Suite 4: Non-SPA Static Sites Preservation Check
// ---------------------------------------------------------------------------
console.log('\n>>> Suite 4: Dedicated Static Sites Preservation Check');

const mallIndex = path.join(DIST_DIR, 'mall', 'en', 'index.html');
const gwentIndex = path.join(DIST_DIR, 'gwent', 'index.html');

const mallPreserved = fs.existsSync(mallIndex) && !fs.readFileSync(mallIndex, 'utf8').includes('id="landing-root"');
const gwentPreserved = fs.existsSync(gwentIndex) && !fs.readFileSync(gwentIndex, 'utf8').includes('id="landing-root"');

assert('ORACLE-M1-13', 'Dedicated static Shopify mall is preserved without landing-root overwrite', mallPreserved, 'true', String(mallPreserved));
assert('ORACLE-M1-14', 'Standalone Gwent minigame is preserved without landing-root overwrite', gwentPreserved, 'true', String(gwentPreserved));

// ---------------------------------------------------------------------------
// Suite 5: Post-Build Idempotency Check
// ---------------------------------------------------------------------------
console.log('\n>>> Suite 5: Post-Build Pipeline Idempotency & Hash Stability');

const computeHash = (filepath: string) => {
  return crypto.createHash('sha256').update(fs.readFileSync(filepath)).digest('hex');
};

const hashIndexBefore = computeHash(path.join(DIST_DIR, 'index.html'));
const hashHomeIndexBefore = computeHash(path.join(DIST_DIR, 'home', 'index.html'));
const hashMovieIndexBefore = computeHash(path.join(DIST_DIR, 'movie', 'index.html'));
const hashRedditIndexBefore = computeHash(path.join(DIST_DIR, 'reddit', 'index.html'));

// Re-run post-build
execSync('node scripts/post-build.js', { stdio: 'pipe' });

const hashIndexAfter = computeHash(path.join(DIST_DIR, 'index.html'));
const hashHomeIndexAfter = computeHash(path.join(DIST_DIR, 'home', 'index.html'));
const hashMovieIndexAfter = computeHash(path.join(DIST_DIR, 'movie', 'index.html'));
const hashRedditIndexAfter = computeHash(path.join(DIST_DIR, 'reddit', 'index.html'));

assert('ORACLE-M1-15', 'post-build idempotency: dist/index.html sha256 unchanged', hashIndexBefore === hashIndexAfter, 'stable', hashIndexBefore === hashIndexAfter ? 'stable' : 'MUTATED');
assert('ORACLE-M1-16', 'post-build idempotency: dist/home/index.html sha256 unchanged', hashHomeIndexBefore === hashHomeIndexAfter, 'stable', hashHomeIndexBefore === hashHomeIndexAfter ? 'stable' : 'MUTATED');
assert('ORACLE-M1-17', 'post-build idempotency: dist/movie/index.html sha256 unchanged', hashMovieIndexBefore === hashMovieIndexAfter, 'stable', hashMovieIndexBefore === hashMovieIndexAfter ? 'stable' : 'MUTATED');
assert('ORACLE-M1-18', 'post-build idempotency: dist/reddit/index.html sha256 unchanged', hashRedditIndexBefore === hashRedditIndexAfter, 'stable', hashRedditIndexBefore === hashRedditIndexAfter ? 'stable' : 'MUTATED');

// ---------------------------------------------------------------------------
// Suite 6: Routing Logic Verification (src/routes.ts)
// ---------------------------------------------------------------------------
console.log('\n>>> Suite 6: Router Contract & Decoupled Boundary Verification');

assert('ORACLE-M1-19', "Router contract: VIEW_ROUTES.home.path === '/home'", VIEW_ROUTES.home.path === '/home', '/home', VIEW_ROUTES.home.path);
assert('ORACLE-M1-20', "Router contract: VIEW_ROUTES.home.aliases does NOT include '/'", !VIEW_ROUTES.home.aliases?.includes('/'), 'true', String(!VIEW_ROUTES.home.aliases?.includes('/')));
assert('ORACLE-M1-21', "Router contract: getViewPath('home') === '/home'", getViewPath('home') === '/home', '/home', getViewPath('home'));
assert('ORACLE-M1-22', "Router fallback: getViewFromPath('/') === 'home' in SPA context", getViewFromPath('/') === 'home', 'home', getViewFromPath('/'));

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
console.log('\n======================================================================');
console.log('  ORACLE VERIFICATION SUMMARY                                         ');
console.log('======================================================================');

const passedCount = results.filter(r => r.passed).length;
const failedCount = results.filter(r => !r.passed).length;

console.log(`Total Assertions : ${results.length}`);
console.log(`Passed           : \x1b[92m${passedCount}\x1b[0m`);
console.log(`Failed           : ${failedCount > 0 ? `\x1b[91m${failedCount}\x1b[0m` : '\x1b[92m0\x1b[0m'}`);
console.log(`Pass Rate        : ${((passedCount / results.length) * 100).toFixed(1)}%`);
console.log('======================================================================\n');

if (failedCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
