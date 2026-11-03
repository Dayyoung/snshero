# Milestone 1 Iteration 2 Remediation: Independent Verification Test Script & Test Design Report

- **Author**: Explorer 3 (`explorer_m1_it2_3`)
- **Target Milestone**: Milestone 1 Remediation (Iteration 2)
- **Status**: COMPLETE
- **Scope**: Comprehensive test design and independent verification script for the two remediation fixes (`scripts/post-build.js` template corruption & `src/routes.ts` query route shadowing).

---

## 1. Executive Summary

During Milestone 1 Iteration 1 review, Reviewer `reviewer_m1_9_1` issued `REQUEST_CHANGES` due to two critical pipeline and routing defects:
1. **Critical Build Pipeline Defect**: In `scripts/post-build.js:250-258`, when processing legacy routes with `route === 'home'`, `flatHtmlPath` overwrites Vite's master SPA bundle `dist/home.html` with a 16-line redirect stub. Consequently, `dist/home.html` (535 bytes), `dist/404.html` (535 bytes), and all downstream SEO-generated pages (`dist/movie/ep-1..40`, `dist/cinema/ep-1..40`, and 120 news articles) lose their React SPA app, `<div id="root"></div>`, and video player markup. Furthermore, post-build idempotency is completely broken.
2. **Major Dead Code Defect in Route Precedence**: In `src/routes.ts:486`, `if (cleanPath === '/play' || cleanPath === '/main') return 'play';` unconditionally shadows the episode query parameter check at lines 497-502, causing `getViewFromPath('/play', '?ep=1')` to resolve to `'play'` instead of `'main'`.

This report provides a **rigorous, multi-tier independent verification test harness** covering all 5 verification targets requested in dispatch:
- **Target 1**: Verification that `dist/home.html` is not overwritten during `npm run build`.
- **Target 2**: Verification that `dist/movie/ep-1/index.html` contains `<div id="root"></div>` and the YouTube video player iframe/markup instead of a redirect stub.
- **Target 3**: Verification that `dist/404.html` contains the full SPA fallback (> 100 lines, > 10KB, with `<div id="root"></div>`) instead of a 16-line stub.
- **Target 4**: Verification that `getViewFromPath('/play', '?ep=1')` resolves to `'main'`.
- **Target 5**: Verification of build idempotency (executing `node scripts/post-build.js` multiple times maintains all files and templates intact).

---

## 2. Verification Targets & Acceptance Thresholds

| # | Target | Failure Signature (Before Fix) | Acceptance Threshold (After Fix) | Verification Mechanism |
|---|--------|--------------------------------|----------------------------------|------------------------|
| **1** | `dist/home.html` SPA Template Preservation | Size: 535 bytes, 16 lines.<br>Contains `<meta http-equiv="refresh" content="0; url=/#home">`.<br>Missing `<div id="root"></div>`. | File size >= 10,000 bytes (typical ~46KB).<br>Contains `<div id="root"></div>`.<br>Contains `/assets/` script chunk tag.<br>Zero redirect meta tag. | File stat size check, AST/regex string assertions, script bundle detection. |
| **2** | `dist/movie/ep-1/index.html` Video Player & SPA Markup | 149 lines with redirect script & body.<br>Missing `<div id="root">`.<br>Missing `<iframe`.<br>Immediate redirect to `/#home`. | Contains `<div id="root">...</div>`.<br>Contains `<iframe` with `https://www.youtube.com/embed/62ziCvTMfB8`.<br>Contains synopsis & VideoObject schema.<br>Zero redirect meta/script. | Regex detection of `#root`, `iframe`, embed URL, absence of `http-equiv="refresh"`. |
| **3** | `dist/404.html` Full SPA Fallback | Size: 535 bytes, 16 lines.<br>Exact copy of redirect stub.<br>Missing `<div id="root"></div>`. | Exact copy of `dist/home.html` (size >= 10,000 bytes, line count > 100).<br>Contains `<div id="root"></div>` and `/assets/` scripts.<br>Zero redirect meta refresh. | Byte comparison / size threshold, line count check, root tag presence. |
| **4** | `getViewFromPath('/play', '?ep=1')` Route Resolution | Returns `'play'` (shadowed by line 486). | Resolves to `'main'`.<br>Comprehensive query variants (`ep=40`, `episode=5`, `ch=2`, `chapter=10`) resolve to `'main'`.<br>Non-episode `/play` resolves to `'play'`. | Unit test assertions executing `getViewFromPath` across test matrix. |
| **5** | `scripts/post-build.js` Multi-Run Idempotency | Run 2 destroys all 60 static routes because `spaTemplatePath` reads the corrupted 535-byte `dist/home.html`. | Running `node scripts/post-build.js` 2+ times consecutively leaves `dist/home.html`, `dist/404.html`, `dist/movie/ep-1/index.html`, and `dist/bench/index.html` 100% intact. | Dual execution stress test comparing file sizes and structural anchors across runs. |

---

## 3. Independent Verification Test Script (`verify_m1_it2_remediation.ts`)

The following self-contained TypeScript test harness can be saved as `tests/verify_m1_it2_remediation.ts` (or run directly via `npx tsx`) to independently verify all 5 targets in a single unified execution.

```typescript
/**
 * Independent Verification Test Harness for Milestone 1 Iteration 2 Remediation
 * Targets:
 *   1. dist/home.html SPA template preservation
 *   2. dist/movie/ep-1/index.html video player & #root presence
 *   3. dist/404.html full SPA fallback presence
 *   4. getViewFromPath route precedence for /play?ep=...
 *   5. scripts/post-build.js idempotency across repeated runs
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { getViewFromPath } from '../src/routes';

const ROOT_DIR = process.cwd();
const DIST_DIR = path.join(ROOT_DIR, 'dist');

interface TestResult {
  id: string;
  name: string;
  passed: boolean;
  expected: string;
  actual: string;
  error?: string;
}

const testResults: TestResult[] = [];

function check(id: string, name: string, condition: boolean, expected: string, actual: string, error?: string) {
  testResults.push({ id, name, passed: condition, expected, actual, error });
}

console.log('======================================================================');
console.log('  MILESTONE 1 ITERATION 2 REMEDIATION INDEPENDENT VERIFICATION        ');
console.log('======================================================================\n');

// ---------------------------------------------------------------------------
// TEST 1: dist/home.html SPA Master Template Integrity
// ---------------------------------------------------------------------------
console.log('>>> [1/5] Verifying dist/home.html SPA Master Template...');
const homeHtmlPath = path.join(DIST_DIR, 'home.html');

if (!fs.existsSync(homeHtmlPath)) {
  check('TEST-1-EXISTS', 'dist/home.html exists', false, 'File exists', 'Missing file');
} else {
  const homeStat = fs.statSync(homeHtmlPath);
  const homeContent = fs.readFileSync(homeHtmlPath, 'utf8');

  check(
    'TEST-1-SIZE',
    'dist/home.html size >= 10,000 bytes (not a 535-byte stub)',
    homeStat.size >= 10000,
    '>= 10,000 bytes',
    `${homeStat.size} bytes`
  );

  const hasSpaRoot = homeContent.includes('<div id="root"></div>');
  check('TEST-1-ROOT', 'dist/home.html contains <div id="root"></div>', hasSpaRoot, 'true', String(hasSpaRoot));

  const hasScriptBundle = /\/assets\/(?:home|main|index)-[A-Za-z0-9_-]+\.js/.test(homeContent);
  check('TEST-1-SCRIPT', 'dist/home.html contains compiled Vite script bundle', hasScriptBundle, 'true', String(hasScriptBundle));

  const hasRedirectMeta = homeContent.includes('http-equiv="refresh"');
  check('TEST-1-NO-REFRESH', 'dist/home.html does NOT contain redirect meta refresh', !hasRedirectMeta, 'false', String(hasRedirectMeta));

  const hasRedirectBody = homeContent.includes('섹션으로 이동 중입니다:');
  check('TEST-1-NO-STUB-BODY', 'dist/home.html does NOT contain redirect stub body message', !hasRedirectBody, 'false', String(hasRedirectBody));
}

// ---------------------------------------------------------------------------
// TEST 2: dist/movie/ep-1/index.html Video Player & #root Markup
// ---------------------------------------------------------------------------
console.log('\n>>> [2/5] Verifying dist/movie/ep-1/index.html Video Player & #root Markup...');
const movieEp1Path = path.join(DIST_DIR, 'movie', 'ep-1', 'index.html');

if (!fs.existsSync(movieEp1Path)) {
  check('TEST-2-EXISTS', 'dist/movie/ep-1/index.html exists', false, 'File exists', 'Missing file');
} else {
  const movieContent = fs.readFileSync(movieEp1Path, 'utf8');

  const hasRootDiv = movieContent.includes('<div id="root">');
  check('TEST-2-ROOT', 'dist/movie/ep-1/index.html contains <div id="root">', hasRootDiv, 'true', String(hasRootDiv));

  const hasIframe = movieContent.includes('<iframe');
  check('TEST-2-IFRAME', 'dist/movie/ep-1/index.html contains video <iframe', hasIframe, 'true', String(hasIframe));

  const hasYouTubeEmbed = movieContent.includes('https://www.youtube.com/embed/62ziCvTMfB8');
  check('TEST-2-YOUTUBE-URL', 'dist/movie/ep-1/index.html contains Episode 1 YouTube embed URL', hasYouTubeEmbed, 'true', String(hasYouTubeEmbed));

  const hasSynopsis = movieContent.includes('에피소드 공식 줄거리') || movieContent.includes('눈보라 아래 두 서약');
  check('TEST-2-SYNOPSIS', 'dist/movie/ep-1/index.html contains episode synopsis text', hasSynopsis, 'true', String(hasSynopsis));

  const hasRedirectMeta = movieContent.includes('http-equiv="refresh"');
  check('TEST-2-NO-REFRESH', 'dist/movie/ep-1/index.html does NOT contain redirect meta refresh', !hasRedirectMeta, 'false', String(hasRedirectMeta));

  const hasRedirectScript = movieContent.includes("window.location.replace('/' + '#home'");
  check('TEST-2-NO-REDIRECT-SCRIPT', 'dist/movie/ep-1/index.html does NOT contain window.location.replace redirect', !hasRedirectScript, 'false', String(hasRedirectScript));
}

// ---------------------------------------------------------------------------
// TEST 3: dist/404.html Full SPA Fallback
// ---------------------------------------------------------------------------
console.log('\n>>> [3/5] Verifying dist/404.html Full SPA Fallback...');
const notFoundPath = path.join(DIST_DIR, '404.html');

if (!fs.existsSync(notFoundPath)) {
  check('TEST-3-EXISTS', 'dist/404.html exists', false, 'File exists', 'Missing file');
} else {
  const notFoundStat = fs.statSync(notFoundPath);
  const notFoundContent = fs.readFileSync(notFoundPath, 'utf8');
  const lineCount = notFoundContent.split('\n').length;

  check(
    'TEST-3-SIZE',
    'dist/404.html size >= 10,000 bytes (not a 535-byte stub)',
    notFoundStat.size >= 10000,
    '>= 10,000 bytes',
    `${notFoundStat.size} bytes`
  );

  check(
    'TEST-3-LINES',
    'dist/404.html line count > 100 lines (not a 16-line stub)',
    lineCount > 100,
    '> 100 lines',
    `${lineCount} lines`
  );

  const hasSpaRoot = notFoundContent.includes('<div id="root"></div>');
  check('TEST-3-ROOT', 'dist/404.html contains <div id="root"></div>', hasSpaRoot, 'true', String(hasSpaRoot));

  const hasScriptBundle = /\/assets\/(?:home|main|index)-[A-Za-z0-9_-]+\.js/.test(notFoundContent);
  check('TEST-3-SCRIPT', 'dist/404.html loads Vite script bundle', hasScriptBundle, 'true', String(hasScriptBundle));

  const hasRedirectMeta = notFoundContent.includes('http-equiv="refresh"');
  check('TEST-3-NO-REFRESH', 'dist/404.html does NOT contain redirect meta refresh', !hasRedirectMeta, 'false', String(hasRedirectMeta));
}

// ---------------------------------------------------------------------------
// TEST 4: getViewFromPath Route Precedence & Query Parameters
// ---------------------------------------------------------------------------
console.log('\n>>> [4/5] Verifying getViewFromPath Route Precedence...');

const routeMatrix = [
  // Primary remediation target
  { path: '/play', search: '?ep=1', hash: '', expected: 'main', desc: '/play?ep=1 deep-link' },
  { path: '/play', search: '?ep=40', hash: '', expected: 'main', desc: '/play?ep=40 deep-link' },
  { path: '/play', search: '?episode=5', hash: '', expected: 'main', desc: '/play?episode=5 deep-link' },
  { path: '/play', search: '?ch=2', hash: '', expected: 'main', desc: '/play?ch=2 deep-link' },
  { path: '/play', search: '?chapter=10', hash: '', expected: 'main', desc: '/play?chapter=10 deep-link' },

  // Non-episode /play must still resolve to 'play'
  { path: '/play', search: '', hash: '', expected: 'play', desc: '/play static clean path' },
  { path: '/play/', search: '', hash: '', expected: 'play', desc: '/play/ trailing slash' },
  { path: '/play', search: '?mode=battle', hash: '', expected: 'play', desc: '/play with non-episode query' },
  { path: '/play', search: '?view=mydeck', hash: '', expected: 'mydeck', desc: '/play with ?view=mydeck explicit override' },

  // Legacy /main paths
  { path: '/main', search: '', hash: '', expected: 'play', desc: '/main static clean path' },
  { path: '/main/ep-1', search: '', hash: '', expected: 'main', desc: '/main/ep-1 subpath' },

  // Hash route priority
  { path: '/play', search: '', hash: '#home', expected: 'home', desc: 'hash #home takes priority' },
  { path: '/', search: '', hash: '#play', expected: 'play', desc: 'hash #play resolves to play' },
];

for (let i = 0; i < routeMatrix.length; i++) {
  const item = routeMatrix[i];
  const actual = getViewFromPath(item.path, item.search, item.hash);
  check(
    `TEST-4-ROUTE-${i + 1}`,
    `getViewFromPath('${item.path}', '${item.search}', '${item.hash}') [${item.desc}]`,
    actual === item.expected,
    item.expected,
    actual
  );
}

// ---------------------------------------------------------------------------
// TEST 5: scripts/post-build.js Idempotency Stress Test
// ---------------------------------------------------------------------------
console.log('\n>>> [5/5] Verifying scripts/post-build.js Idempotency Stress Test...');

try {
  const homeSizeBefore = fs.statSync(homeHtmlPath).size;
  const notFoundSizeBefore = fs.statSync(notFoundPath).size;
  const movieSizeBefore = fs.statSync(movieEp1Path).size;

  // Execute post-build Run 2
  console.log('    Executing post-build.js (Run 2)...');
  execSync('node scripts/post-build.js', { stdio: 'pipe' });

  const homeSizeRun2 = fs.statSync(homeHtmlPath).size;
  const notFoundSizeRun2 = fs.statSync(notFoundPath).size;
  const movieSizeRun2 = fs.statSync(movieEp1Path).size;

  // Execute post-build Run 3
  console.log('    Executing post-build.js (Run 3)...');
  execSync('node scripts/post-build.js', { stdio: 'pipe' });

  const homeSizeRun3 = fs.statSync(homeHtmlPath).size;
  const notFoundSizeRun3 = fs.statSync(notFoundPath).size;
  const movieSizeRun3 = fs.statSync(movieEp1Path).size;

  check(
    'TEST-5-IDEMPOTENCY-HOME-RUN2',
    'dist/home.html size preserved after Run 2',
    homeSizeRun2 >= 10000 && homeSizeRun2 === homeSizeBefore,
    `${homeSizeBefore} bytes`,
    `${homeSizeRun2} bytes`
  );

  check(
    'TEST-5-IDEMPOTENCY-HOME-RUN3',
    'dist/home.html size preserved after Run 3',
    homeSizeRun3 >= 10000 && homeSizeRun3 === homeSizeBefore,
    `${homeSizeBefore} bytes`,
    `${homeSizeRun3} bytes`
  );

  check(
    'TEST-5-IDEMPOTENCY-404',
    'dist/404.html size preserved across runs',
    notFoundSizeRun3 >= 10000 && notFoundSizeRun3 === notFoundSizeBefore,
    `${notFoundSizeBefore} bytes`,
    `${notFoundSizeRun3} bytes`
  );

  check(
    'TEST-5-IDEMPOTENCY-MOVIE',
    'dist/movie/ep-1/index.html size preserved across runs',
    movieSizeRun3 >= 5000 && movieSizeRun3 === movieSizeBefore,
    `${movieSizeBefore} bytes`,
    `${movieSizeRun3} bytes`
  );

  // Check that secondary static routes (e.g. dist/bench/index.html) were not corrupted
  const benchPath = path.join(DIST_DIR, 'bench', 'index.html');
  if (fs.existsSync(benchPath)) {
    const benchContent = fs.readFileSync(benchPath, 'utf8');
    const benchHasRoot = benchContent.includes('<div id="root"></div>');
    const benchHasNoStub = !benchContent.includes('http-equiv="refresh"');
    check(
      'TEST-5-IDEMPOTENCY-BENCH',
      'dist/bench/index.html retains SPA #root and is not corrupted into redirect stub',
      benchHasRoot && benchHasNoStub,
      'true',
      `root:${benchHasRoot}, noStub:${benchHasNoStub}`
    );
  }
} catch (err: any) {
  check('TEST-5-IDEMPOTENCY-EXEC', 'scripts/post-build.js runs without error', false, 'exit 0', err?.message || String(err));
}

// ---------------------------------------------------------------------------
// Final Summary & Exit Code
// ---------------------------------------------------------------------------
console.log('\n======================================================================');
console.log('  VERIFICATION SUMMARY                                                ');
console.log('======================================================================');

let passedCount = 0;
let failedCount = 0;

for (const t of testResults) {
  const statusBadge = t.passed ? '\x1b[92mPASS\x1b[0m' : '\x1b[91mFAIL\x1b[0m';
  console.log(`[${statusBadge}] ${t.id.padEnd(30)} ${t.name}`);
  if (!t.passed) {
    console.log(`       \x1b[93mExpected:\x1b[0m ${t.expected}`);
    console.log(`       \x1b[91mActual  :\x1b[0m ${t.actual}`);
    if (t.error) console.log(`       \x1b[91mError   :\x1b[0m ${t.error}`);
  }
  if (t.passed) passedCount++;
  else failedCount++;
}

console.log('----------------------------------------------------------------------');
console.log(`Total Assertions : ${testResults.length}`);
console.log(`Passed           : \x1b[92m${passedCount}\x1b[0m`);
console.log(`Failed           : ${failedCount > 0 ? `\x1b[91m${failedCount}\x1b[0m` : '\x1b[92m0\x1b[0m'}`);
console.log('======================================================================\n');

if (failedCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
```

---

## 4. Standalone CLI & One-Liner Verification Commands

For fast terminal execution, reviewer checks, or CI automation, the following bash commands can be run individually to test each condition.

### 4.1 CLI Command 1: Verify `dist/home.html` Is Not Overwritten
```bash
# Check 1: File size >= 10,000 bytes
test $(wc -c < dist/home.html) -ge 10000 && echo "PASS: dist/home.html size >= 10KB" || echo "FAIL: dist/home.html is truncated/stub"

# Check 2: Contains SPA #root
grep -q '<div id="root"></div>' dist/home.html && echo "PASS: <div id=\"root\"></div> exists" || echo "FAIL: missing #root"

# Check 3: Does NOT contain redirect meta refresh
! grep -q 'http-equiv="refresh"' dist/home.html && echo "PASS: zero redirect refresh" || echo "FAIL: contains redirect meta tag"

# Check 4: Contains compiled Vite entry script bundle
grep -qE '/assets/(home|main|index)-[A-Za-z0-9_-]+\.js' dist/home.html && echo "PASS: compiled entry script detected" || echo "FAIL: missing entry script"
```

### 4.2 CLI Command 2: Verify `dist/movie/ep-1/index.html` Contains `#root` and Video Player Markup
```bash
# Check 1: Contains <div id="root">
grep -q '<div id="root">' dist/movie/ep-1/index.html && echo "PASS: <div id=\"root\"> exists" || echo "FAIL: missing #root in movie ep-1"

# Check 2: Contains video player iframe with YouTube embed URL
grep -q '<iframe' dist/movie/ep-1/index.html && \
grep -q 'https://www.youtube.com/embed/62ziCvTMfB8' dist/movie/ep-1/index.html && \
echo "PASS: YouTube iframe embed found" || echo "FAIL: missing YouTube iframe"

# Check 3: Does NOT contain redirect meta or redirect script
! grep -q 'http-equiv="refresh"' dist/movie/ep-1/index.html && \
! grep -q '섹션으로 이동 중입니다' dist/movie/ep-1/index.html && \
echo "PASS: zero redirect stub in movie ep-1" || echo "FAIL: contains redirect stub in movie ep-1"
```

### 4.3 CLI Command 3: Verify `dist/404.html` Contains Full SPA Fallback
```bash
# Check 1: File size >= 10,000 bytes
test $(wc -c < dist/404.html) -ge 10000 && echo "PASS: dist/404.html size >= 10KB" || echo "FAIL: dist/404.html size too small"

# Check 2: Line count > 100 lines (redirect stub is 16 lines)
test $(wc -l < dist/404.html) -gt 100 && echo "PASS: dist/404.html > 100 lines" || echo "FAIL: dist/404.html is 16-line stub"

# Check 3: Contains <div id="root"></div>
grep -q '<div id="root"></div>' dist/404.html && echo "PASS: <div id=\"root\"></div> exists in 404.html" || echo "FAIL: missing #root in 404.html"

# Check 4: Does NOT contain redirect meta refresh
! grep -q 'http-equiv="refresh"' dist/404.html && echo "PASS: zero redirect refresh in 404.html" || echo "FAIL: contains redirect refresh in 404.html"
```

### 4.4 CLI Command 4: Verify `getViewFromPath('/play', '?ep=1')` Resolves to `'main'`
```bash
npx tsx -e "
import { getViewFromPath } from './src/routes';
const res = getViewFromPath('/play', '?ep=1');
if (res === 'main') {
  console.log('PASS: getViewFromPath(\"/play\", \"?ep=1\") -> main');
  process.exit(0);
} else {
  console.error('FAIL: Expected \"main\", got: \"' + res + '\"');
  process.exit(1);
}
"
```

### 4.5 CLI Command 5: Verify Idempotency of `scripts/post-build.js`
```bash
# Snapshot hashes before repeated runs
HASH_HOME_1=$(shasum -a 256 dist/home.html | awk '{print $1}')
HASH_404_1=$(shasum -a 256 dist/404.html | awk '{print $1}')

# Run post-build second and third times
node scripts/post-build.js > /dev/null 2>&1
node scripts/post-build.js > /dev/null 2>&1

# Check hashes after repeated runs
HASH_HOME_2=$(shasum -a 256 dist/home.html | awk '{print $1}')
HASH_404_2=$(shasum -a 256 dist/404.html | awk '{print $1}')

if [ "$HASH_HOME_1" = "$HASH_HOME_2" ] && [ "$HASH_404_1" = "$HASH_404_2" ]; then
  echo "PASS: scripts/post-build.js is fully idempotent (SHA-256 match)"
else
  echo "FAIL: files mutated across repeated post-build runs"
  echo "  home.html: $HASH_HOME_1 vs $HASH_HOME_2"
  echo "  404.html : $HASH_404_1 vs $HASH_404_2"
  exit 1
fi
```

---

## 5. Remediation Code Reference (For Implementer / Worker)

To assist the remediation worker (`worker_m1_it2`), the exact code edits required to satisfy all 5 verification targets are:

### Fix 1: Guard `dist/home.html` in `scripts/post-build.js`
In `scripts/post-build.js:250-258`:
```javascript
// BEFORE:
      fs.writeFileSync(path.join(routeDir, 'index.html'), redirectHtml, 'utf8');
      const flatHtmlPath = path.join(distDir, `${route}.html`);
      if (flatHtmlPath !== indexPath && path.relative(distDir, flatHtmlPath) !== 'index.html') {
        const flatHtmlDir = path.dirname(flatHtmlPath);
        if (!fs.existsSync(flatHtmlDir)) {
          fs.mkdirSync(flatHtmlDir, { recursive: true });
        }
        fs.writeFileSync(flatHtmlPath, redirectHtml, 'utf8');
      }
      continue;

// AFTER:
      fs.writeFileSync(path.join(routeDir, 'index.html'), redirectHtml, 'utf8');
      const flatHtmlPath = path.join(distDir, `${route}.html`);
      // Guard: Never overwrite dist/home.html (the master compiled React SPA template) or dist/index.html
      if (route !== 'home' && flatHtmlPath !== indexPath && path.relative(distDir, flatHtmlPath) !== 'index.html') {
        const flatHtmlDir = path.dirname(flatHtmlPath);
        if (!fs.existsSync(flatHtmlDir)) {
          fs.mkdirSync(flatHtmlDir, { recursive: true });
        }
        fs.writeFileSync(flatHtmlPath, redirectHtml, 'utf8');
      }
      continue;
```
*Rationale*: Legacy `/home` requests are directed to `dist/home/index.html` by web servers, while `dist/home.html` remains the uncorrupted master compiled React SPA bundle.

### Fix 2: Re-order Route Precedence in `src/routes.ts`
In `src/routes.ts:484-503`:
```typescript
// BEFORE:
  if (cleanPath === '/home' || cleanPath === '/main-lobby') return 'home';
  if (cleanPath === '/deck' || cleanPath === '/mydeck') return 'mydeck';
  if (cleanPath === '/play' || cleanPath === '/main') return 'play';
  if (cleanPath === '/card' || cleanPath === '/cards' || cleanPath === '/mission' || cleanPath === '/missions') return 'card' as ViewType;
  if (cleanPath === '/shop') return 'shop';

  // 특수 접두사 라우팅
  if (cleanPath.startsWith('/creator/')) return 'creator';
  if (cleanPath.startsWith('/novel/s1-') || cleanPath.startsWith('/book/')) return 'novel';
  if (cleanPath.startsWith('/movie/') || cleanPath.startsWith('/animation/')) return 'movie';
  if (cleanPath.startsWith('/cinema/') || cleanPath.startsWith('/live-cinema/')) return 'cinema';
  if (cleanPath === '/script' || cleanPath.startsWith('/script/')) return 'script';
  if (cleanPath.startsWith('/main/')) return 'main';
  if (
    cleanPath === '/play' &&
    (params.get('ep') || params.get('episode') || params.get('ch') || params.get('chapter'))
  ) {
    return 'main';
  }

// AFTER:
  if (cleanPath === '/home' || cleanPath === '/main-lobby') return 'home';
  if (cleanPath === '/deck' || cleanPath === '/mydeck') return 'mydeck';

  // Episode/chapter deep links for /play must be evaluated before static /play match
  if (
    cleanPath === '/play' &&
    (params.get('ep') || params.get('episode') || params.get('ch') || params.get('chapter'))
  ) {
    return 'main';
  }

  if (cleanPath === '/play' || cleanPath === '/main') return 'play';
  if (cleanPath === '/card' || cleanPath === '/cards' || cleanPath === '/mission' || cleanPath === '/missions') return 'card' as ViewType;
  if (cleanPath === '/shop') return 'shop';
```
*Rationale*: Placing the query parameter check before the static `/play` check ensures deep-links such as `/play?ep=1` resolve to `'main'` while maintaining default resolution to `'play'` for parameterless visits.

---

## 6. Conclusion

With the provided test harness and verification commands:
1. All 5 remediation targets can be verified independently with zero human guesswork.
2. Reviewers and Challengers can run the exact commands to confirm complete resolution of both defects before approving the Milestone 1 gate.
3. The build pipeline and routing engine will remain robust, idempotent, and error-free.
