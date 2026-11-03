# Milestone 1 Iteration 2: Architecture Survey & Post-Build SEO Pipeline Specification

- **Author**: `teamwork_explorer` (Explorer M1 Iteration 2 Agent 3)
- **Date**: 2026-11-02T04:15:00Z
- **Target Subsystem**: `scripts/post-build.js`, `scripts/generate-news-seo.ts`, `scripts/generate-video-seo.ts`, `public/`, `dist/`, and E2E Verification Suite
- **Reference Issue**: Milestone 1 Gate Failure (Challenger `challenger_m1_2` Adversarial Rejection)

---

## 1. Executive Summary

Milestone 1 established a **Dual-Entry Multi-Page Application (MPA)** architecture:
1. `index.html` (`src/landing/index.ts`): Standalone, ultra-lightweight static landing web service loading zero heavy dependencies (no React 19, Three.js, TensorFlow, or Motion), mounting into `<div id="landing-root"></div>` via `/assets/main-*.js`.
2. `home.html` (`src/main.tsx`): Full interactive game Single-Page Application (SPA) loading React 19, card battle logic, and all views, mounting into `<div id="root"></div>` via `/assets/home-*.js`.

While `dist/index.html` was successfully isolated, **565 out of 566 HTML files in `dist/` were corrupted into static landing templates** by downstream post-build SEO generators (`scripts/generate-news-seo.ts` and `scripts/generate-video-seo.ts`). Consequently, deep links to `/movie`, `/cinema`, `/animation`, `/reddit`, `/r/news`, and all 80 movie/cinema episode pages (`/movie/ep-1..40`, `/cinema/ep-1..40`) rendered the static landing page instead of the game SPA.

This survey report details the precise mechanism of contamination, provides an end-to-end data-flow specification, and establishes a robust 5-layer template propagation protocol that guarantees:
- `dist/index.html` remains 100% pure static landing.
- 100% of SPA subroutes use `dist/home.html` as their base template.
- `public/` directory tracking is cleansed and immunized against future drift.
- E2E tests empirically enforce DOM and bundle isolation across all routes.

---

## 2. Problem Statement & Failure Analysis

### 2.1 Adversarial Findings by `challenger_m1_2`
In iteration 1, challenger test harness `tests/adversarial_m1_build_pipeline.ts` executed 64 assertions and reported 2 critical failures:
```text
[ADV-M1-SPA-reddit] Route dist/reddit/index.html has SPA root & home.js: root:false, homeJs:false
[ADV-M1-SPA-movie]  Route dist/movie/index.html has SPA root & home.js: root:false, homeJs:false
```

### 2.2 Forensic Inspection of `dist/` and `public/`
A filesystem audit revealed that **566 HTML files** in `dist/` contained `landing-root` and `/assets/main-*.js`:
- `dist/index.html` (1 file, legitimate static landing)
- `dist/reddit/index.html` & `dist/r/news/index.html` (2 files, corrupted)
- `dist/r/news/comments/*` & `dist/reddit/comments/*` (480 files, corrupted)
- `dist/movie/index.html`, `dist/cinema/index.html`, `dist/animation/index.html` (3 files, corrupted)
- `dist/movie/ep-1..40/index.html` (40 files, corrupted)
- `dist/cinema/ep-1..40/index.html` (40 files, corrupted)

Furthermore, **85 files in `public/`** were simultaneously overwritten with the static landing template:
- `public/movie/index.html` + 40 episode files (`public/movie/ep-1..40/index.html`)
- `public/cinema/index.html` + 40 episode files (`public/cinema/ep-1..40/index.html`)
- `public/animation/index.html`
- `public/reddit/index.html`
- `public/r/news/index.html`

### 2.3 The Three Failure Mechanisms

#### Mechanism A: Hardcoded Template Path in Downstream Generators
In `scripts/generate-news-seo.ts` (lines 625–628):
```typescript
const distIndexPath = path.join(distDir, 'index.html');
const rootIndexPath = path.join(rootDir, 'index.html');
const baseTemplatePath = fs.existsSync(distIndexPath) ? distIndexPath : rootIndexPath;
const baseHtml = fs.readFileSync(baseTemplatePath, 'utf8');
```
In `scripts/generate-video-seo.ts` (lines 700–705):
```typescript
const distIndexPath = path.join(distDir, 'index.html');
const rootIndexPath = path.join(rootDir, 'index.html');
const baseHtml = fs.existsSync(distIndexPath)
  ? fs.readFileSync(distIndexPath, 'utf8')
  : fs.readFileSync(rootIndexPath, 'utf8');
```
Both scripts explicitly read `dist/index.html`. In the legacy architecture prior to Milestone 1, `index.html` was the game SPA. But in Milestone 1, `index.html` was transformed into the static landing page, while the game SPA moved to `home.html`. Both downstream scripts were never updated to reflect this migration.

#### Mechanism B: Dual Writing to `public/` and `dist/`
In `scripts/generate-video-seo.ts` (lines 674–685):
```typescript
function writeHtmlToPublicAndDist(relDir: string, html: string) {
  const targets = [path.join(publicDir, relDir)];
  if (fs.existsSync(distDir)) {
    targets.push(path.join(distDir, relDir));
  }
  for (const dir of targets) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), html, 'utf8');
  }
}
```
And in `scripts/generate-news-seo.ts` (lines 677–692):
```typescript
const feedDirs = [
  path.join(publicDir, 'reddit'),
  path.join(publicDir, 'r', 'news'),
];
```
Because both scripts wrote corrupted landing-page HTML into `public/`, those files were committed to git and remained resident in the filesystem.

#### Mechanism C: Stale File Collision in `scripts/post-build.js`
In `scripts/post-build.js` (lines 204–208):
```javascript
const publicStaticIndex = path.join(publicDir, route, 'index.html');
if (fs.existsSync(publicStaticIndex)) {
  // Do not overwrite real static games/pages that already exist in public/
  continue;
}
```
During `npm run build`:
1. `vite build` copies `public/` to `dist/`. If `public/movie/index.html` contains the landing template, it is copied into `dist/movie/index.html`.
2. `scripts/post-build.js` runs. When processing `route = 'movie'`, it checks `path.join(publicDir, 'movie', 'index.html')`. Because it exists, `post-build.js` skips overwriting it with `dist/home.html`.
3. Even if `post-build.js` had written `dist/home.html`, Step 6 and Step 7 run `generate-news-seo.ts` and `generate-video-seo.ts`, which would overwrite `dist/` and `public/` with the landing template again.

---

## 3. End-to-End Post-Build Architecture Specification

### 3.1 Data Flow Diagram
```
                     +----------------------------+
                     |        npm run build       |
                     +----------------------------+
                                   |
                                   v
+----------------------------------------------------------------------+
| 1. Vite Build (vite.config.ts)                                       |
|    - Input: main: index.html  --> dist/index.html (Static Landing)  |
|    - Input: home: home.html   --> dist/home.html  (Game SPA Engine) |
|    - Output: dist/assets/main-*.js, dist/assets/home-*.js            |
|    - Copies public/ to dist/                                         |
+----------------------------------------------------------------------+
                                   |
                                   v
+----------------------------------------------------------------------+
| 2. Post-Build Orchestrator (scripts/post-build.js)                   |
|    - Selects spaTemplatePath = dist/home.html                        |
|    - Protects dist/index.html (NEVER overwritten)                    |
|    - Generates dist/version.json, public/version.json                |
|    - Generates 59 SPA fallback routes in dist/ from dist/home.html   |
|      (deck, play, shop, bench, novel, webtoon, movie, reddit, etc.)  |
|      * Only skips true static non-SPA sites (route === 'mall')       |
|    - Generates dist/404.html from dist/home.html                     |
+----------------------------------------------------------------------+
           |                                              |
           | Invokes with:                                | Invokes with:
           | --template dist/home.html                    | --template dist/home.html
           | SPA_TEMPLATE_PATH=dist/home.html             | SPA_TEMPLATE_PATH=dist/home.html
           v                                              v
+-----------------------------------+  +-----------------------------------+
| 3. Google News SEO                |  | 4. Google Video SEO               |
|    (scripts/generate-news-seo.ts) |  |    (scripts/generate-video-seo.ts)|
|    - Resolves SPA base template   |  |    - Resolves SPA base template   |
|      --> dist/home.html           |  |      --> dist/home.html           |
|    - Injects SEO into #root       |  |    - Injects SEO into #root       |
|    - Generates in dist/ & public/:|  |    - Generates in dist/ & public/:|
|      /reddit, /r/news, comments/* |  |      /movie, /animation, /cinema, |
|    - Maintains #root & home-*.js  |  |      /movie/ep-*, /cinema/ep-*    |
|    - ZERO landing-root references |  |    - Maintains #root & home-*.js  |
+-----------------------------------+  +-----------------------------------+
```

---

## 4. Technical Specifications & Required Code Changes

### Specification 1: Robust 5-Layer SPA Base Template Resolution
Both `scripts/generate-news-seo.ts` and `scripts/generate-video-seo.ts` must implement an identical, deterministic resolution helper:

```typescript
function resolveSpaBaseTemplate(): string {
  // 1. Explicit CLI argument: --template <path>
  const templateArgIdx = process.argv.indexOf('--template');
  if (templateArgIdx !== -1 && process.argv[templateArgIdx + 1]) {
    const customPath = path.resolve(rootDir, process.argv[templateArgIdx + 1]);
    if (fs.existsSync(customPath)) return customPath;
  }

  // 2. Explicit Environment Variable: SPA_TEMPLATE_PATH
  if (process.env.SPA_TEMPLATE_PATH) {
    const envPath = path.resolve(rootDir, process.env.SPA_TEMPLATE_PATH);
    if (fs.existsSync(envPath)) return envPath;
  }

  // 3. Compiled SPA Template (dist/home.html) - Production default
  const distHomeHtml = path.join(distDir, 'home.html');
  if (fs.existsSync(distHomeHtml)) return distHomeHtml;

  // 4. Source SPA Entry (home.html) - Pre-build dev fallback
  const rootHomeHtml = path.join(rootDir, 'home.html');
  if (fs.existsSync(rootHomeHtml)) return rootHomeHtml;

  // 5. Ultimate Fallback (Guard against missing home.html)
  return path.join(distDir, 'index.html');
}
```

#### Application in `scripts/generate-news-seo.ts`
Replace lines 624–629:
```typescript
// BEFORE:
const distIndexPath = path.join(distDir, 'index.html');
const rootIndexPath = path.join(rootDir, 'index.html');
const baseTemplatePath = fs.existsSync(distIndexPath) ? distIndexPath : rootIndexPath;
const baseHtml = fs.readFileSync(baseTemplatePath, 'utf8');

// AFTER:
const baseTemplatePath = resolveSpaBaseTemplate();
console.log(`[generate-news-seo] Using SPA base template: ${baseTemplatePath}`);
const baseHtml = fs.readFileSync(baseTemplatePath, 'utf8');
```

#### Application in `scripts/generate-video-seo.ts`
Replace lines 699–705:
```typescript
// BEFORE:
const distIndexPath = path.join(distDir, 'index.html');
const rootIndexPath = path.join(rootDir, 'index.html');
const baseHtml = fs.existsSync(distIndexPath)
  ? fs.readFileSync(distIndexPath, 'utf8')
  : fs.readFileSync(rootIndexPath, 'utf8');

// AFTER:
const baseTemplatePath = resolveSpaBaseTemplate();
console.log(`[generate-video-seo] Using SPA base template: ${baseTemplatePath}`);
const baseHtml = fs.readFileSync(baseTemplatePath, 'utf8');
```

---

### Specification 2: Child Process Invocation in `scripts/post-build.js`
In `scripts/post-build.js`, pass `spaTemplatePath` explicitly via both CLI flag and environment variable:

```javascript
// Replace lines 252–267 in scripts/post-build.js:

// 6. Run Google News SEO & AdSense Static Prerenderer
try {
  console.log('[post-build] Running Google News SEO & AdSense static generator...');
  execSync(`npx tsx scripts/generate-news-seo.ts --template "${spaTemplatePath}"`, {
    stdio: 'inherit',
    env: { ...process.env, SPA_TEMPLATE_PATH: spaTemplatePath }
  });
} catch (e) {
  console.warn('[post-build] Warning: Google News SEO generator encountered an issue:', e.message);
}

// 7. Run Google Video SEO/GEO/AEO Static Prerenderer (Animation 40 + Movie 40)
try {
  console.log('[post-build] Running Google Video SEO/GEO/AEO static generator...');
  execSync(`npx tsx scripts/generate-video-seo.ts --template "${spaTemplatePath}"`, {
    stdio: 'inherit',
    env: { ...process.env, SPA_TEMPLATE_PATH: spaTemplatePath }
  });
} catch (e) {
  console.warn('[post-build] Warning: Google Video SEO generator encountered an issue:', e.message);
}
```

---

### Specification 3: Narrowing Public Static Skip Guard in `scripts/post-build.js`
In `scripts/post-build.js` lines 204–208, narrow the skip condition so that only true external static non-SPA directories (specifically `mall`) are protected, while SPA routes (`movie`, `cinema`, `animation`, `reddit`, etc.) always receive fresh SPA routing:

```javascript
// Replace lines 204–208 in scripts/post-build.js:

// BEFORE:
const publicStaticIndex = path.join(publicDir, route, 'index.html');
if (fs.existsSync(publicStaticIndex)) {
  // Do not overwrite real static games/pages that already exist in public/
  continue;
}

// AFTER:
const publicStaticIndex = path.join(publicDir, route, 'index.html');
// Only skip dedicated non-SPA static sites (e.g., mirrored Shopify mall in public/mall)
const isDedicatedStaticSite = route === 'mall' || route.startsWith('mall/');
if (isDedicatedStaticSite && fs.existsSync(publicStaticIndex)) {
  continue;
}
```

---

### Specification 4: Cleansing and Regenerating `public/` Artifacts
Because `public/` files are tracked in git and copied to `dist/` by Vite on every build, the 85 corrupted files in `public/` must be regenerated immediately using the new SPA template:
1. Running `npx tsx scripts/generate-video-seo.ts` will regenerate:
   - `public/movie/index.html`
   - `public/movie/ep-1..40/index.html` (40 files)
   - `public/cinema/index.html`
   - `public/cinema/ep-1..40/index.html` (40 files)
   - `public/animation/index.html`
2. Running `npx tsx scripts/generate-news-seo.ts` will regenerate:
   - `public/reddit/index.html`
   - `public/r/news/index.html`

**Post-regeneration verification**:
```bash
grep -rl "landing-root" public/ | wc -l
# Expected output: 0
```

---

### Specification 5: Strengthening E2E Test `T1.MPA.4`
Update `tests/e2e/tier1_feature_coverage.ts` (lines 76–86) from passive string matching of `post-build.js` to active filesystem verification:

```typescript
// Replace lines 76–86 in tests/e2e/tier1_feature_coverage.ts:
    await runTestAssertion('T1.MPA.4', 1, 'MPA Architecture', 'M1', 'Post-Build Route Preservation Script', async () => {
      const script = readProjectFile('scripts/post-build.js');
      if (!script) return { pass: false, message: 'scripts/post-build.js not found' };
      
      const distIndex = readProjectFile('dist/index.html') || '';
      const distHome = readProjectFile('dist/home.html') || '';
      const distDeck = readProjectFile('dist/deck/index.html') || '';
      const distMovie = readProjectFile('dist/movie/index.html') || '';
      const distReddit = readProjectFile('dist/reddit/index.html') || '';
      const dist404 = readProjectFile('dist/404.html') || '';

      // 1. dist/index.html must be static landing
      if (!distIndex.includes('id="landing-root"') || distIndex.includes('vendor-react')) {
        return { pass: false, message: 'dist/index.html is not a clean static landing page' };
      }

      // 2. dist/home.html must be game SPA
      if (!distHome.includes('id="root"') || !/assets\/home-[A-Za-z0-9_-]+\.js/.test(distHome)) {
        return { pass: false, message: 'dist/home.html does not load SPA game bundle' };
      }

      // 3. Subroutes must load SPA game bundle and NOT static landing
      const spaRoutes = [
        { name: 'dist/deck', content: distDeck },
        { name: 'dist/movie', content: distMovie },
        { name: 'dist/reddit', content: distReddit },
        { name: 'dist/404.html', content: dist404 },
      ];

      for (const sr of spaRoutes) {
        if (!sr.content) {
          return { pass: false, message: `${sr.name} does not exist` };
        }
        if (sr.content.includes('landing-root') || /assets\/main-[A-Za-z0-9_-]+\.js/.test(sr.content)) {
          return { pass: false, message: `${sr.name} is corrupted with static landing template` };
        }
        if (!sr.content.includes('id="root"') || !/assets\/home-[A-Za-z0-9_-]+\.js/.test(sr.content)) {
          return { pass: false, message: `${sr.name} is missing SPA #root or home-*.js entry` };
        }
      }

      return { pass: true, message: 'dist/index.html preserved as landing; all SPA subroutes cleanly generated from dist/home.html' };
    })
```

---

## 5. Architectural Invariant Matrix

| Invariant | Target File(s) | Required State | Prohibited State |
|-----------|----------------|----------------|------------------|
| **INV-1: Static Landing Isolation** | `dist/index.html` | `<div id="landing-root">`, `/assets/main-*.js`, JS size < 50 KB | `id="root"`, `/assets/home-*.js`, `vendor-react`, `vendor-tensorflow`, `vendor-firebase` |
| **INV-2: SPA Home Entry** | `dist/home.html`, `dist/home/index.html` | `<div id="root">`, `/assets/home-*.js`, `vendor-react` | `id="landing-root"`, `/assets/main-*.js` |
| **INV-3: Standard SPA Subroutes** | `dist/deck/index.html`, `dist/play/index.html`, `dist/shop/index.html`, `dist/bench/index.html`, `dist/novel/index.html`, etc. | `<div id="root">`, `/assets/home-*.js`, absolute `/assets/` paths | `id="landing-root"`, `/assets/main-*.js`, relative `./assets/` |
| **INV-4: News Prerendered Routes** | `dist/reddit/index.html`, `dist/r/news/index.html`, `dist/r/news/comments/*/index.html` | `<div id="root">`, `/assets/home-*.js`, News JSON-LD, AdSense | `id="landing-root"`, `/assets/main-*.js` |
| **INV-5: Video Prerendered Routes** | `dist/movie/index.html`, `dist/animation/index.html`, `dist/cinema/index.html`, `dist/movie/ep-*/index.html`, `dist/cinema/ep-*/index.html` | `<div id="root">`, `/assets/home-*.js`, Video JSON-LD, Episode grid | `id="landing-root"`, `/assets/main-*.js` |
| **INV-6: Public Directory Hygiene** | `public/movie/**`, `public/cinema/**`, `public/animation/**`, `public/reddit/**`, `public/r/news/**` | `0` files with `landing-root` | Any occurrence of `landing-root` or `main-*.js` |
| **INV-7: 404 Client-Side Fallback** | `dist/404.html` | `<div id="root">`, `/assets/home-*.js` | `id="landing-root"`, `/assets/main-*.js` |
| **INV-8: Post-Build Idempotency** | `dist/` | Re-running `node scripts/post-build.js` produces identical content | Any drift in hashes, roots, or content |

---

## 6. Verification & Implementation Roadmap for Worker

Worker can implement this architectural specification via 4 sequential steps:

1. **Step 1: Code Edits**
   - Apply `resolveSpaBaseTemplate()` to `scripts/generate-news-seo.ts` (lines 624–629).
   - Apply `resolveSpaBaseTemplate()` to `scripts/generate-video-seo.ts` (lines 699–705).
   - Update `scripts/post-build.js` lines 204–208 (narrow `publicStaticIndex` to `mall`) and lines 252–267 (pass `--template` & `SPA_TEMPLATE_PATH`).
   - Update `tests/e2e/tier1_feature_coverage.ts` (T1.MPA.4).

2. **Step 2: Execution & Asset Regeneration**
   - Execute `npm run build`.
   - Verify `post-build.js` successfully calls both generators and outputs clean artifacts.

3. **Step 3: Verification Script Execution**
   - Run adversarial harness:
     ```bash
     npx tsx tests/adversarial_m1_build_pipeline.ts
     ```
     Expected: **64 of 64 PASS (100.0%)**.
   - Run challenger probe suite:
     ```bash
     npx tsx tests/challenger_m1_adversarial.ts
     ```
   - Run Tier 1 E2E tests:
     ```bash
     npx tsx tests/e2e/run_all.ts --milestone M1
     ```
     Expected: **100% PASS across all assertions**.

4. **Step 4: Hygiene Audit**
   - Check landing root counts:
     ```bash
     # Exactly 1 in dist (dist/index.html only):
     test $(find dist -name "*.html" -exec grep -l "landing-root" {} + | wc -l) -eq 1
     
     # Exactly 0 in public:
     test $(find public -name "*.html" -exec grep -l "landing-root" {} + | wc -l) -eq 0
     ```
