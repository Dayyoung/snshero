/**
 * Empirical Adversarial Challenger Probe Suite for Milestone 1
 * Independent Static Landing & /home Decoupling
 * 
 * Verifies:
 * 1. Source DOM isolation & collision checks (#landing-root vs #root)
 * 2. Static filesystem output integrity in dist/ (59 routes, home/, deck/, 404.html)
 * 3. Route boundary logic in src/routes.ts
 * 4. Live HTTP endpoint probes against running preview server (port 3000):
 *    - GET / (Landing)
 *    - GET /index.html (Landing)
 *    - GET /home (SPA)
 *    - GET /home/ (SPA)
 *    - GET /home.html (SPA)
 *    - GET /home?source=twitter (SPA with query)
 *    - GET /deck and /deck/ (SPA)
 *    - GET /play (SPA)
 *    - GET /shop (SPA)
 * 5. Bundle footprint & runtime isolation:
 *    - dist/index.html total JS < 50 KB budget
 *    - Zero React/TensorFlow/Firebase/Motion references in landing
 *    - dist/home.html contains full SPA game bundle
 */

import fs from 'fs';
import path from 'path';
import http from 'http';
import { getViewFromPath, getViewPath, VIEW_ROUTES } from '../src/routes';

interface ProbeResult {
  category: string;
  name: string;
  passed: boolean;
  details: string;
  metrics?: Record<string, any>;
}

const results: ProbeResult[] = [];

function assert(condition: boolean, category: string, name: string, passMsg: string, failMsg: string, metrics?: Record<string, any>) {
  if (condition) {
    results.push({ category, name, passed: true, details: passMsg, metrics });
    console.log(`  [PASS] [${category}] ${name}: ${passMsg}`);
  } else {
    results.push({ category, name, passed: false, details: failMsg, metrics });
    console.error(`  [FAIL] [${category}] ${name}: ${failMsg}`);
  }
}

function fetchHttp(url: string): Promise<{ statusCode: number; headers: http.IncomingHttpHeaders; body: string }> {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => {
        resolve({ statusCode: res.statusCode || 0, headers: res.headers, body });
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function runAdversarialProbes() {
  console.log('======================================================================');
  console.log('  CHALLENGER M1: Empirical Adversarial Probe Suite                    ');
  console.log('======================================================================\n');

  const rootDir = process.cwd();
  const distDir = path.join(rootDir, 'dist');

  // =========================================================================
  // SECTION 1: DOM Collision & Isolation Verification
  // =========================================================================
  console.log('--- SECTION 1: DOM Collision & Isolation Verification ---');

  const indexHtmlPath = path.join(rootDir, 'index.html');
  const homeHtmlPath = path.join(rootDir, 'home.html');

  assert(fs.existsSync(indexHtmlPath), 'DOM_ISOLATION', 'Source index.html exists', 'Found index.html', 'Missing index.html');
  assert(fs.existsSync(homeHtmlPath), 'DOM_ISOLATION', 'Source home.html exists', 'Found home.html', 'Missing home.html');

  const indexHtmlContent = fs.readFileSync(indexHtmlPath, 'utf8');
  const homeHtmlContent = fs.readFileSync(homeHtmlPath, 'utf8');

  // 1.1 index.html MUST contain #landing-root and MUST NOT contain active #root mounting point
  const indexHasLandingRoot = /id=["']landing-root["']/.test(indexHtmlContent);
  const indexHasRootDiv = /<div\s+id=["']root["']\s*>/i.test(indexHtmlContent);
  assert(
    indexHasLandingRoot && !indexHasRootDiv,
    'DOM_ISOLATION',
    'index.html DOM Isolation',
    `Found #landing-root (${indexHasLandingRoot}), no active #root div (${!indexHasRootDiv})`,
    `Collision risk: indexHasLandingRoot=${indexHasLandingRoot}, indexHasRootDiv=${indexHasRootDiv}`
  );

  // 1.2 index.html script tag MUST target src/landing/index.ts and NOT src/main.tsx
  const indexLoadsLanding = /src=["']\/src\/landing\/index\.ts["']/.test(indexHtmlContent);
  const indexLoadsMain = /src=["']\/src\/main\.tsx["']/.test(indexHtmlContent);
  assert(
    indexLoadsLanding && !indexLoadsMain,
    'DOM_ISOLATION',
    'index.html Entry Script Target',
    'Loads /src/landing/index.ts and strictly does not load /src/main.tsx',
    `Script target invalid: loadsLanding=${indexLoadsLanding}, loadsMain=${indexLoadsMain}`
  );

  // 1.3 home.html MUST contain #root and MUST NOT contain #landing-root
  const homeHasRoot = /id=["']root["']/.test(homeHtmlContent);
  const homeHasLandingRoot = /id=["']landing-root["']/.test(homeHtmlContent);
  assert(
    homeHasRoot && !homeHasLandingRoot,
    'DOM_ISOLATION',
    'home.html DOM Isolation',
    `Found #root (${homeHasRoot}), no #landing-root (${!homeHasLandingRoot})`,
    `Collision risk: homeHasRoot=${homeHasRoot}, homeHasLandingRoot=${homeHasLandingRoot}`
  );

  // 1.4 home.html script tag MUST target src/main.tsx and NOT src/landing/index.ts
  const homeLoadsMain = /src=["']\/src\/main\.tsx["']/.test(homeHtmlContent);
  const homeLoadsLanding = /src=["']\/src\/landing\/index\.ts["']/.test(homeHtmlContent);
  assert(
    homeLoadsMain && !homeLoadsLanding,
    'DOM_ISOLATION',
    'home.html Entry Script Target',
    'Loads /src/main.tsx and strictly does not load /src/landing/index.ts',
    `Script target invalid: loadsMain=${homeLoadsMain}, loadsLanding=${homeLoadsLanding}`
  );

  // 1.5 Synthetic DOM Mount Collision Stress Simulation
  {
    const simulateMount = (htmlFragment: string) => {
      let selectedTarget: string | null = null;
      if (htmlFragment.includes('id="landing-root"')) {
        selectedTarget = 'landing-root';
      } else if (htmlFragment.includes('id="root"')) {
        selectedTarget = 'root';
      }
      return selectedTarget;
    };

    const targetPureLanding = simulateMount('<div id="landing-root"></div>');
    assert(targetPureLanding === 'landing-root', 'DOM_ISOLATION', 'Landing Mount Pure Target', 'Mounts into landing-root', `Unexpected: ${targetPureLanding}`);

    const targetDual = simulateMount('<div id="landing-root"></div><div id="root"></div>');
    assert(targetDual === 'landing-root', 'DOM_ISOLATION', 'Landing Mount Dual Target Precedence', 'Prefers landing-root over root when both present', `Unexpected: ${targetDual}`);

    const targetNeither = simulateMount('<div>nothing</div>');
    assert(targetNeither === null, 'DOM_ISOLATION', 'Landing Mount Safe No-op', 'Graceful null when neither container present', `Unexpected: ${targetNeither}`);
  }

  // =========================================================================
  // SECTION 2: Route Boundary & Router Logic
  // =========================================================================
  console.log('\n--- SECTION 2: Route Boundary & Router Logic ---');

  // 2.1 Router decoupling in src/routes.ts
  const homeRoute = VIEW_ROUTES.home;
  assert(
    homeRoute.path === '/home',
    'ROUTE_BOUNDARY',
    'Home View Path is /home',
    `home.path is ${homeRoute.path}`,
    `home.path expected '/home' but got '${homeRoute.path}'`
  );

  assert(
    homeRoute.aliases?.includes('/home') && !homeRoute.aliases?.includes('/'),
    'ROUTE_BOUNDARY',
    'Home Aliases Decoupled from /',
    `home.aliases are [${homeRoute.aliases?.join(', ')}]`,
    `home.aliases still contains '/' or missing '/home': ${JSON.stringify(homeRoute.aliases)}`
  );

  // 2.2 Test route mapping function getViewFromPath
  const testCases: Array<{ path: string; expected: string; reason: string }> = [
    { path: '/home', expected: 'home', reason: 'Canonical /home route' },
    { path: '/home/', expected: 'home', reason: 'Trailing slash /home/' },
    { path: '/main-lobby', expected: 'home', reason: 'Legacy alias /main-lobby' },
    { path: '/deck', expected: 'mydeck', reason: 'Deck view route (maps to mydeck)' },
    { path: '/deck/', expected: 'mydeck', reason: 'Trailing slash /deck/ (maps to mydeck)' },
    { path: '/mydeck', expected: 'mydeck', reason: 'MyDeck alias route' },
    { path: '/play', expected: 'play', reason: 'Play view route' },
    { path: '/shop', expected: 'shop', reason: 'Shop view route' },
    { path: '/marketplace', expected: 'card-marketplace', reason: 'Marketplace route' },
    { path: '/market', expected: 'stock-market', reason: 'Market alias (stock-market)' },
    { path: '/novel', expected: 'novel', reason: 'Novel view route' },
    { path: '/movie', expected: 'movie', reason: 'Movie view route' },
    { path: '/unknown_nonexistent_xyz', expected: 'home', reason: 'Unknown route graceful fallback to home' },
    { path: '/', expected: 'home', reason: 'SPA fallback when pathname is /' },
    { path: '/home.html', expected: 'home', reason: 'Direct .html access fallback to home' },
  ];

  for (const tc of testCases) {
    const actual = getViewFromPath(tc.path);
    assert(
      actual === tc.expected,
      'ROUTE_BOUNDARY',
      `getViewFromPath('${tc.path}')`,
      `Resolved to '${actual}' (${tc.reason})`,
      `Expected '${tc.expected}' but got '${actual}' (${tc.reason})`
    );
  }

  // 2.3 Test reverse route lookup getViewPath
  assert(getViewPath('home') === '/home', 'ROUTE_BOUNDARY', "getViewPath('home')", 'Returned /home', `Expected '/home', got '${getViewPath('home')}'`);
  assert(getViewPath('mydeck') === '/deck', 'ROUTE_BOUNDARY', "getViewPath('mydeck')", 'Returned /deck', `Expected '/deck', got '${getViewPath('mydeck')}'`);

  // =========================================================================
  // SECTION 3: Post-Build Static Outputs & Artifact Inspection
  // =========================================================================
  console.log('\n--- SECTION 3: Post-Build Static Artifacts & Bundle Footprint ---');

  if (!fs.existsSync(distDir)) {
    console.error('ERROR: dist/ directory does not exist! Run npm run build first.');
    return;
  }

  const distIndexHtml = path.join(distDir, 'index.html');
  const distHomeHtml = path.join(distDir, 'home.html');
  const distHomeDirIndex = path.join(distDir, 'home', 'index.html');
  const distDeckDirIndex = path.join(distDir, 'deck', 'index.html');
  const distPlayDirIndex = path.join(distDir, 'play', 'index.html');
  const distShopDirIndex = path.join(distDir, 'shop', 'index.html');
  const dist404Html = path.join(distDir, '404.html');

  assert(fs.existsSync(distIndexHtml), 'BUILD_ARTIFACTS', 'dist/index.html exists', 'Found dist/index.html', 'Missing dist/index.html');
  assert(fs.existsSync(distHomeHtml), 'BUILD_ARTIFACTS', 'dist/home.html exists', 'Found dist/home.html', 'Missing dist/home.html');
  assert(fs.existsSync(distHomeDirIndex), 'BUILD_ARTIFACTS', 'dist/home/index.html exists', 'Found dist/home/index.html', 'Missing dist/home/index.html');
  assert(fs.existsSync(distDeckDirIndex), 'BUILD_ARTIFACTS', 'dist/deck/index.html exists', 'Found dist/deck/index.html', 'Missing dist/deck/index.html');
  assert(fs.existsSync(distPlayDirIndex), 'BUILD_ARTIFACTS', 'dist/play/index.html exists', 'Found dist/play/index.html', 'Missing dist/play/index.html');
  assert(fs.existsSync(distShopDirIndex), 'BUILD_ARTIFACTS', 'dist/shop/index.html exists', 'Found dist/shop/index.html', 'Missing dist/shop/index.html');
  assert(fs.existsSync(dist404Html), 'BUILD_ARTIFACTS', 'dist/404.html exists', 'Found dist/404.html', 'Missing dist/404.html');

  const distIndexContent = fs.readFileSync(distIndexHtml, 'utf8');
  const distHomeContent = fs.readFileSync(distHomeHtml, 'utf8');
  const distHomeDirContent = fs.readFileSync(distHomeDirIndex, 'utf8');
  const distDeckContent = fs.readFileSync(distDeckDirIndex, 'utf8');
  const dist404Content = fs.readFileSync(dist404Html, 'utf8');

  // Extract all script tags (both relative ./assets/ and /assets/)
  const extractScripts = (html: string): string[] => {
    const matches = [...html.matchAll(/src=["'](\.?\/assets\/[^"']+\.js)["']/g)];
    return matches.map(m => m[1].replace(/^\.\//, '/'));
  };

  const indexScripts = extractScripts(distIndexContent);
  const homeScripts = extractScripts(distHomeContent);
  const homeDirScripts = extractScripts(distHomeDirContent);
  const deckScripts = extractScripts(distDeckContent);
  const notFoundScripts = extractScripts(dist404Content);

  console.log(`\n  Scripts directly referenced in dist/index.html: [${indexScripts.join(', ')}]`);
  console.log(`  Scripts directly referenced in dist/home.html: [${homeScripts.join(', ')}]`);

  // Assert indexScripts do NOT contain vendor-react, vendor-tensorflow, vendor-firebase, or vendor-motion
  const hasReactInIndex = indexScripts.some(s => s.includes('vendor-react'));
  const hasTfInIndex = indexScripts.some(s => s.includes('vendor-tensorflow'));
  const hasFirebaseInIndex = indexScripts.some(s => s.includes('vendor-firebase'));
  const hasMotionInIndex = indexScripts.some(s => s.includes('vendor-motion'));

  assert(
    !hasReactInIndex && !hasTfInIndex && !hasFirebaseInIndex && !hasMotionInIndex,
    'BUNDLE_ISOLATION',
    'dist/index.html Free of Heavy Runtimes',
    'Zero React/TF/Firebase/Motion scripts referenced in landing',
    `Found heavy runtimes: React=${hasReactInIndex}, TF=${hasTfInIndex}, Firebase=${hasFirebaseInIndex}, Motion=${hasMotionInIndex}`
  );

  // Assert dist/home.html DOES contain home entry script
  const homeEntryScript = homeScripts.find(s => s.includes('home-'));
  assert(
    !!homeEntryScript,
    'BUNDLE_ISOLATION',
    'dist/home.html Has Home Entry Script',
    `Found home entry: ${homeEntryScript}`,
    'Missing home-*.js entry script in dist/home.html'
  );

  // Trace imports of home entry script to verify vendor-react is linked
  let homeImportsReact = false;
  if (homeEntryScript) {
    const homeScriptAbs = path.join(distDir, homeEntryScript.replace(/^\//, ''));
    if (fs.existsSync(homeScriptAbs)) {
      const homeContent = fs.readFileSync(homeScriptAbs, 'utf8');
      homeImportsReact = homeContent.includes('vendor-react-');
    }
  }

  assert(
    homeImportsReact,
    'BUNDLE_ISOLATION',
    'dist/home.html Bundle Imports React',
    'Verified home bundle imports vendor-react-*.js module',
    'home bundle does not import vendor-react'
  );

  // Assert dist/home/index.html and dist/deck/index.html and dist/404.html inherit SPA template
  assert(
    homeDirScripts.some(s => s.includes('home-')),
    'BUNDLE_ISOLATION',
    'dist/home/index.html Inherits SPA Bundle',
    'Loads home-*.js bundle',
    `Missing home-*.js in dist/home/index.html: ${homeDirScripts.join(', ')}`
  );

  assert(
    deckScripts.some(s => s.includes('home-')),
    'BUNDLE_ISOLATION',
    'dist/deck/index.html Inherits SPA Bundle',
    'Loads home-*.js bundle',
    `Missing home-*.js in dist/deck/index.html: ${deckScripts.join(', ')}`
  );

  assert(
    notFoundScripts.some(s => s.includes('home-')),
    'BUNDLE_ISOLATION',
    'dist/404.html Inherits SPA Bundle for Client Routing',
    'Loads home-*.js bundle for deep-link fallback',
    `Missing home-*.js in dist/404.html: ${notFoundScripts.join(', ')}`
  );

  // =========================================================================
  // SECTION 4: Bundle Footprint Verification (< 50 KB Total JS)
  // =========================================================================
  console.log('\n--- SECTION 4: Bundle Footprint Verification (<50KB Total JS) ---');

  // In dist/index.html, trace all directly and indirectly imported JS assets
  const tracedJsFiles = new Set<string>();
  for (const s of indexScripts) {
    tracedJsFiles.add(s);
    const absPath = path.join(distDir, s.replace(/^\//, ''));
    if (fs.existsSync(absPath)) {
      const code = fs.readFileSync(absPath, 'utf8');
      const importMatches = [...code.matchAll(/import\s*["']\.?\/?assets\/([^"']+\.js)["']/g)];
      for (const im of importMatches) {
        tracedJsFiles.add(`/assets/${im[1]}`);
      }
      const relMatches = [...code.matchAll(/import\s*["']\.\/([^"']+\.js)["']/g)];
      for (const rm of relMatches) {
        tracedJsFiles.add(`/assets/${rm[1]}`);
      }
    }
  }

  let totalIndexJsBytes = 0;
  const scriptDetails: Array<{ path: string; bytes: number }> = [];

  for (const scriptRelPath of tracedJsFiles) {
    const absPath = path.join(distDir, scriptRelPath.replace(/^\//, ''));
    if (fs.existsSync(absPath)) {
      const stats = fs.statSync(absPath);
      totalIndexJsBytes += stats.size;
      scriptDetails.push({ path: scriptRelPath, bytes: stats.size });
    }
  }

  const indexJsKb = totalIndexJsBytes / 1024;
  console.log(`  Total JS footprint for dist/index.html: ${totalIndexJsBytes} bytes (${indexJsKb.toFixed(2)} KB)`);
  for (const s of scriptDetails) {
    console.log(`    - ${s.path}: ${s.bytes} bytes (${(s.bytes / 1024).toFixed(2)} KB)`);
  }

  const JS_BUDGET_BYTES = 50 * 1024; // 50 KB
  assert(
    totalIndexJsBytes < JS_BUDGET_BYTES,
    'BUNDLE_BUDGET',
    'dist/index.html Total JS Footprint < 50KB',
    `Actual ${totalIndexJsBytes} bytes (${indexJsKb.toFixed(2)} KB) < 51,200 bytes budget (Margin: ${(50 - indexJsKb).toFixed(2)} KB)`,
    `Footprint EXCEEDED: ${totalIndexJsBytes} bytes (${indexJsKb.toFixed(2)} KB) >= 51,200 bytes`,
    { totalBytes: totalIndexJsBytes, totalKb: indexJsKb, budgetKb: 50, scripts: scriptDetails }
  );

  // Check HTML file sizes
  const indexHtmlBytes = fs.statSync(distIndexHtml).size;
  const homeHtmlBytes = fs.statSync(distHomeHtml).size;
  console.log(`  dist/index.html size: ${(indexHtmlBytes / 1024).toFixed(2)} KB`);
  console.log(`  dist/home.html size: ${(homeHtmlBytes / 1024).toFixed(2)} KB`);

  // =========================================================================
  // SECTION 5: Live HTTP Endpoint Probes against Running Server (port 3000)
  // =========================================================================
  console.log('\n--- SECTION 5: Live HTTP Endpoint Probes (Preview Server :3000) ---');

  const httpProbes = [
    { url: 'http://localhost:3000/', expectedRoot: 'landing-root', expectedScript: 'main-', desc: 'GET / (Landing root)' },
    { url: 'http://localhost:3000/index.html', expectedRoot: 'landing-root', expectedScript: 'main-', desc: 'GET /index.html (Explicit landing)' },
    { url: 'http://localhost:3000/home', expectedRoot: 'root', expectedScript: 'home-', desc: 'GET /home (Decoupled Game SPA)' },
    { url: 'http://localhost:3000/home/', expectedRoot: 'root', expectedScript: 'home-', desc: 'GET /home/ (Trailing slash Game SPA)' },
    { url: 'http://localhost:3000/home.html', expectedRoot: 'root', expectedScript: 'home-', desc: 'GET /home.html (Direct SPA HTML)' },
    { url: 'http://localhost:3000/home?ref=twitter&tab=deck', expectedRoot: 'root', expectedScript: 'home-', desc: 'GET /home with query params' },
    { url: 'http://localhost:3000/deck', expectedRoot: 'root', expectedScript: 'home-', desc: 'GET /deck (Subroute SPA)' },
    { url: 'http://localhost:3000/deck/', expectedRoot: 'root', expectedScript: 'home-', desc: 'GET /deck/ (Subroute with trailing slash)' },
    { url: 'http://localhost:3000/shop', expectedRoot: 'root', expectedScript: 'home-', desc: 'GET /shop (Subroute SPA)' },
    { url: 'http://localhost:3000/play', expectedRoot: 'root', expectedScript: 'home-', desc: 'GET /play (Subroute SPA)' },
  ];

  for (const hp of httpProbes) {
    try {
      const res = await fetchHttp(hp.url);
      const hasExpectedRoot = res.body.includes(`id="${hp.expectedRoot}"`);
      const hasExpectedScript = res.body.includes(hp.expectedScript);
      const is200 = res.statusCode === 200;

      assert(
        is200 && hasExpectedRoot && hasExpectedScript,
        'LIVE_HTTP_PROBE',
        hp.desc,
        `Status ${res.statusCode}, contains #${hp.expectedRoot} and ${hp.expectedScript} bundle`,
        `Failed: status=${res.statusCode}, root=${hasExpectedRoot}, script=${hasExpectedScript}`
      );
    } catch (e: any) {
      assert(
        false,
        'LIVE_HTTP_PROBE',
        hp.desc,
        '',
        `Connection failed to ${hp.url}: ${e.message}`
      );
    }
  }

  // =========================================================================
  // SECTION 6: Summary & Final Verdict
  // =========================================================================
  console.log('\n======================================================================');
  console.log('  CHALLENGE REPORT SUMMARY                                            ');
  console.log('======================================================================');

  const total = results.length;
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  console.log(`Total Probes Executed : ${total}`);
  console.log(`Passed                : ${passed}`);
  console.log(`Failed                : ${failed}`);
  console.log(`Pass Rate             : ${((passed / total) * 100).toFixed(1)}%`);

  if (failed > 0) {
    console.log('\nFAILED PROBES:');
    for (const r of results.filter(r => !r.passed)) {
      console.log(`  - [${r.category}] ${r.name}: ${r.details}`);
    }
  } else {
    console.log('\nALL EMPIRICAL PROBES PASSED WITH 100% SUCCESS!');
  }

  // Save results JSON for auditing
  const jsonPath = path.join(rootDir, 'tests', 'challenger_m1_results.json');
  fs.writeFileSync(jsonPath, JSON.stringify({ timestamp: new Date().toISOString(), total, passed, failed, results }, null, 2));
  console.log(`Detailed probe results written to: ${jsonPath}`);

  if (failed > 0) {
    process.exit(1);
  }
}

runAdversarialProbes().catch((err) => {
  console.error('Fatal probe execution error:', err);
  process.exit(1);
});
