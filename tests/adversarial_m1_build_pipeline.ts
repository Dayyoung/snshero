/**
 * Adversarial Stress-Test Harness for Milestone 1:
 * Static Architecture & MPA Decoupling
 *
 * Authored by: teamwork_challenger (empirical-challenger)
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { getViewFromPath, getViewPath, VIEW_ROUTES } from '../src/routes';

const ROOT_DIR = process.cwd();
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const POST_BUILD_SCRIPT = path.join(ROOT_DIR, 'scripts', 'post-build.js');

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
  results.push({
    id,
    name,
    passed: condition,
    expected,
    actual,
    details,
  });
}

console.log('======================================================================');
console.log('  ADVERSARIAL STRESS TEST: Milestone 1 Build Pipeline & Post-Build    ');
console.log('======================================================================\n');

// ---------------------------------------------------------------------------
// Suite 1: dist/index.html Static Landing Isolation & Overwrite Prevention
// ---------------------------------------------------------------------------
console.log('>>> Suite 1: dist/index.html Static Landing Isolation & Overwrite Check');

const distIndexPath = path.join(DIST_DIR, 'index.html');
const distIndexExists = fs.existsSync(distIndexPath);
assert('ADV-M1-01', 'dist/index.html exists after build', distIndexExists, 'true', String(distIndexExists));

if (distIndexExists) {
  const distIndexContent = fs.readFileSync(distIndexPath, 'utf8');

  // Must have landing-root
  const hasLandingRoot = distIndexContent.includes('id="landing-root"');
  assert('ADV-M1-02', 'dist/index.html mounts to #landing-root', hasLandingRoot, 'contains id="landing-root"', hasLandingRoot ? 'contains' : 'missing');

  // Must NOT have SPA #root
  const hasSpaRoot = distIndexContent.includes('id="root"');
  assert('ADV-M1-03', 'dist/index.html does NOT contain SPA #root', !hasSpaRoot, 'no id="root"', hasSpaRoot ? 'has id="root" (OVERWRITTEN!)' : 'clean');

  // Must NOT reference vendor-react or heavy SPA bundles
  const hasVendorReact = distIndexContent.includes('vendor-react');
  const hasVendorTf = distIndexContent.includes('vendor-tensorflow');
  const hasVendorFb = distIndexContent.includes('vendor-firebase');
  const hasVendorMotion = distIndexContent.includes('vendor-motion');
  const hasHomeScript = distIndexContent.includes('/assets/home-');

  assert('ADV-M1-04', 'dist/index.html has zero vendor-react dependency', !hasVendorReact, 'false', String(hasVendorReact));
  assert('ADV-M1-05', 'dist/index.html has zero vendor-tensorflow dependency', !hasVendorTf, 'false', String(hasVendorTf));
  assert('ADV-M1-06', 'dist/index.html has zero vendor-firebase dependency', !hasVendorFb, 'false', String(hasVendorFb));
  assert('ADV-M1-07', 'dist/index.html has zero vendor-motion dependency', !hasVendorMotion, 'false', String(hasVendorMotion));
  assert('ADV-M1-08', 'dist/index.html does not load SPA home script', !hasHomeScript, 'false', String(hasHomeScript));

  // Check script sizes in dist/index.html
  const scriptMatches = [...distIndexContent.matchAll(/src=["'](\/assets\/[^"']+\.js)["']/g)];
  const loadedScripts = scriptMatches.map(m => m[1]);
  let totalJsBytes = 0;
  const scriptDetails: string[] = [];

  for (const scriptPath of loadedScripts) {
    const cleanPath = path.join(DIST_DIR, scriptPath.replace(/^\//, ''));
    if (fs.existsSync(cleanPath)) {
      const size = fs.statSync(cleanPath).size;
      totalJsBytes += size;
      scriptDetails.push(`${scriptPath} (${size} bytes)`);
    } else {
      scriptDetails.push(`${scriptPath} (MISSING FILE!)`);
    }
  }

  // Total initial JS for static landing must be <= 50 KB (actual expectation < 5 KB)
  assert(
    'ADV-M1-09',
    'dist/index.html total JS bundle <= 50 KB',
    totalJsBytes <= 51200,
    '<= 51200 bytes',
    `${totalJsBytes} bytes`,
    scriptDetails
  );
}

// ---------------------------------------------------------------------------
// Suite 2: dist/home.html and dist/home/index.html SPA Integrity
// ---------------------------------------------------------------------------
console.log('\n>>> Suite 2: dist/home.html and dist/home/index.html SPA Integrity');

const distHomeHtmlPath = path.join(DIST_DIR, 'home.html');
const distHomeIndexHtmlPath = path.join(DIST_DIR, 'home', 'index.html');

const homeHtmlExists = fs.existsSync(distHomeHtmlPath);
const homeIndexExists = fs.existsSync(distHomeIndexHtmlPath);

assert('ADV-M1-10', 'dist/home.html exists', homeHtmlExists, 'true', String(homeHtmlExists));
assert('ADV-M1-11', 'dist/home/index.html exists', homeIndexExists, 'true', String(homeIndexExists));

if (homeHtmlExists) {
  const homeContent = fs.readFileSync(distHomeHtmlPath, 'utf8');
  const hasRoot = homeContent.includes('id="root"');
  const hasHomeJs = /assets\/home-[A-Za-z0-9_-]+\.js/.test(homeContent);
  const hasVendorReact = homeContent.includes('vendor-react');

  assert('ADV-M1-12', 'dist/home.html contains SPA #root', hasRoot, 'true', String(hasRoot));
  assert('ADV-M1-13', 'dist/home.html loads home entry script', hasHomeJs, 'true', String(hasHomeJs));
  assert('ADV-M1-14', 'dist/home.html loads vendor-react', hasVendorReact, 'true', String(hasVendorReact));
}

if (homeIndexExists) {
  const homeIndexContent = fs.readFileSync(distHomeIndexHtmlPath, 'utf8');
  const hasRoot = homeIndexContent.includes('id="root"');
  const hasHomeJs = /assets\/home-[A-Za-z0-9_-]+\.js/.test(homeIndexContent);
  const hasVendorReact = homeIndexContent.includes('vendor-react');
  const isRedirect = homeIndexContent.includes('#home');

  assert('ADV-M1-15', 'dist/home/index.html contains SPA #root or hash redirect', hasRoot || isRedirect, 'true', String(hasRoot || isRedirect));
  assert('ADV-M1-16', 'dist/home/index.html loads home entry script or hash redirect', hasHomeJs || isRedirect, 'true', String(hasHomeJs || isRedirect));
  assert('ADV-M1-17', 'dist/home/index.html loads vendor-react or hash redirect', hasVendorReact || isRedirect, 'true', String(hasVendorReact || isRedirect));

  // Check absolute paths in dist/home/index.html: nested route must NOT use relative 'assets/' or './assets/'
  const hasRelativeAssetPaths = /(?:src|href)=["'](?:\.\/)?assets\//.test(homeIndexContent);
  assert(
    'ADV-M1-18',
    'dist/home/index.html uses absolute /assets/ paths (no relative asset breaking)',
    !hasRelativeAssetPaths,
    'no relative ./assets/ or assets/',
    hasRelativeAssetPaths ? 'found relative asset paths' : 'all paths absolute'
  );
}

// ---------------------------------------------------------------------------
// Suite 3: All 59 SPA Routes & dist/404.html Generation Check
// ---------------------------------------------------------------------------
console.log('\n>>> Suite 3: All SPA Routes & 404.html Fallback Check');

const sampleRoutes = [
  'deck',
  'play',
  'shop',
  'battle',
  'bench',
  'reddit',
  'novel',
  'webtoon',
  'movie',
  'r/hanguk',
  'r/hanguk/comments/post_vibecoding_master',
  'wiki/card',
];

for (const r of sampleRoutes) {
  const routeIndexPath = path.join(DIST_DIR, r, 'index.html');
  const exists = fs.existsSync(routeIndexPath);
  assert(`ADV-M1-ROUTE-${r}`, `Route dist/${r}/index.html exists`, exists, 'true', String(exists));

  if (exists) {
    const content = fs.readFileSync(routeIndexPath, 'utf8');
    const hasSpaRoot = content.includes('id="root"');
    const hasHomeJs = /assets\/home-[A-Za-z0-9_-]+\.js/.test(content);
    const isRedirect = content.includes('window.location.replace') || content.includes('http-equiv="refresh"');
    const hasRelativePaths = /(?:src|href)=["'](?:\.\/)?assets\//.test(content);

    assert(`ADV-M1-SPA-${r}`, `Route dist/${r}/index.html has SPA root & home.js or redirect`, (hasSpaRoot && hasHomeJs) || isRedirect, 'has #root & home.js or redirect', `root:${hasSpaRoot}, homeJs:${hasHomeJs}, redirect:${isRedirect}`);
    assert(`ADV-M1-PATH-${r}`, `Route dist/${r}/index.html uses absolute asset paths`, !hasRelativePaths, 'absolute paths only', hasRelativePaths ? 'relative found' : 'clean');
  }
}

// Check 404.html fallback
const notFoundPath = path.join(DIST_DIR, '404.html');
const notFoundExists = fs.existsSync(notFoundPath);
assert('ADV-M1-19', 'dist/404.html exists', notFoundExists, 'true', String(notFoundExists));

if (notFoundExists) {
  const notFoundContent = fs.readFileSync(notFoundPath, 'utf8');
  const hasRoot = notFoundContent.includes('id="root"');
  const hasHomeJs = /assets\/home-[A-Za-z0-9_-]+\.js/.test(notFoundContent);
  assert('ADV-M1-20', 'dist/404.html is SPA fallback (contains #root and home-*.js)', hasRoot && hasHomeJs, 'true', `root:${hasRoot}, homeJs:${hasHomeJs}`);
}

// ---------------------------------------------------------------------------
// Suite 4: Post-Build Script Idempotency Stress Test
// ---------------------------------------------------------------------------
console.log('\n>>> Suite 4: Post-Build Script Idempotency Stress Test');

try {
  const indexBefore = fs.readFileSync(distIndexPath, 'utf8');
  const homeIndexBefore = fs.readFileSync(distHomeIndexHtmlPath, 'utf8');

  // Re-run post-build.js directly
  console.log('Running scripts/post-build.js second time (idempotency test)...');
  execSync('node scripts/post-build.js', { stdio: 'pipe' });

  const indexAfter = fs.readFileSync(distIndexPath, 'utf8');
  const homeIndexAfter = fs.readFileSync(distHomeIndexHtmlPath, 'utf8');

  assert(
    'ADV-M1-21',
    'post-build.js idempotency: dist/index.html unchanged after second execution',
    indexBefore === indexAfter,
    'identical content',
    indexBefore === indexAfter ? 'identical' : 'MUTATED'
  );

  assert(
    'ADV-M1-22',
    'post-build.js idempotency: dist/home/index.html unchanged after second execution',
    homeIndexBefore === homeIndexAfter,
    'identical content',
    homeIndexBefore === homeIndexAfter ? 'identical' : 'MUTATED'
  );
} catch (e: any) {
  assert('ADV-M1-21', 'post-build.js idempotency run', false, 'success without error', e?.message || String(e));
}

// ---------------------------------------------------------------------------
// Suite 5: Route Logic Stress Test (src/routes.ts)
// ---------------------------------------------------------------------------
console.log('\n>>> Suite 5: Route Logic Stress Test (src/routes.ts)');

assert('ADV-M1-23', "getViewFromPath('/home') returns 'home'", getViewFromPath('/home') === 'home', 'home', getViewFromPath('/home'));
assert('ADV-M1-24', "getViewFromPath('/home/') returns 'home'", getViewFromPath('/home/') === 'home', 'home', getViewFromPath('/home/'));
assert('ADV-M1-25', "getViewFromPath('/HOME') returns 'home'", getViewFromPath('/HOME') === 'home', 'home', getViewFromPath('/HOME'));
assert('ADV-M1-26', "getViewPath('home') returns '#home' or '/home'", getViewPath('home') === '#home' || getViewPath('home') === '/home', '#home or /home', getViewPath('home'));

// Fallback test: what does unknown path return?
assert('ADV-M1-27', "getViewFromPath('/unknown-route-123') falls back to 'home'", getViewFromPath('/unknown-route-123') === 'home', 'home', getViewFromPath('/unknown-route-123'));

// Check what getViewFromPath('/') returns:
// Since '/' is decoupled to the static landing page, in the SPA router it should fall back to 'home' or stay distinct.
const rootSpaView = getViewFromPath('/');
assert('ADV-M1-28', "getViewFromPath('/') returns 'home' fallback in SPA router", rootSpaView === 'home', 'home', rootSpaView);

// ---------------------------------------------------------------------------
// Print Summary
// ---------------------------------------------------------------------------
console.log('\n======================================================================');
console.log('  ADVERSARIAL STRESS TEST SUMMARY                                     ');
console.log('======================================================================');

let passedCount = 0;
let failedCount = 0;

for (const r of results) {
  const status = r.passed ? '\x1b[92m✓ PASS\x1b[0m' : '\x1b[91m✗ FAIL\x1b[0m';
  console.log(`[${r.id}] ${r.name.padEnd(65)} ${status}`);
  if (!r.passed) {
    console.log(`    \x1b[93mExpected: ${r.expected}\x1b[0m`);
    console.log(`    \x1b[91mActual  : ${r.actual}\x1b[0m`);
    if (r.details) {
      for (const d of r.details) console.log(`      ${d}`);
    }
  }
  if (r.passed) passedCount++;
  else failedCount++;
}

console.log('----------------------------------------------------------------------');
console.log(`Total Assertions : ${results.length}`);
console.log(`Passed           : \x1b[92m${passedCount}\x1b[0m`);
console.log(`Failed           : ${failedCount > 0 ? `\x1b[91m${failedCount}\x1b[0m` : '\x1b[92m0\x1b[0m'}`);
console.log('======================================================================\n');

if (failedCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
