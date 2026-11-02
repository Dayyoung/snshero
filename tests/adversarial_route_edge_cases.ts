/**
 * Adversarial Route Edge-Case Test Harness for Milestone 1
 * 
 * Tests:
 * 1. Router Function Stress Tests (Trailing slashes, multiple slashes, query params, hash fragments, deep prefixes)
 * 2. Deep-Link Asset Resolution Audit across ALL HTML files in dist/
 * 3. Live HTTP Probes against Preview Server (:3000) for edge cases:
 *    - Trailing slashes (/home/, /deck/, /shop/, /movie/, /cinema/, /reddit/, /r/hanguk/)
 *    - Query strings (/home?source=twitter, /play?ep=1, /?ref=m1)
 *    - Deep-link paths (/movie/ep-1, /cinema/ep-40, /r/hanguk/comments/post_vibecoding_master)
 *    - Fallback behavior on non-existent routes
 */

import fs from 'fs';
import path from 'path';
import http from 'http';
import { getViewFromPath, getViewPath, VIEW_ROUTES } from '../src/routes';

interface TestResult {
  id: string;
  name: string;
  passed: boolean;
  expected: string;
  actual: string;
  error?: string;
}

const results: TestResult[] = [];

function assert(id: string, name: string, condition: boolean, expected: string, actual: string, error?: string) {
  results.push({ id, name, passed: condition, expected, actual, error });
  if (condition) {
    console.log(`  [PASS] [${id}] ${name}`);
  } else {
    console.error(`  [FAIL] [${id}] ${name} | Expected: ${expected} | Actual: ${actual} ${error ? `(${error})` : ''}`);
  }
}

function fetchHttp(urlPath: string, maxRedirects = 3): Promise<{ statusCode: number; headers: http.IncomingHttpHeaders; body: string; finalPath: string }> {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:3000${urlPath}`, (res) => {
      if ((res.statusCode === 301 || res.statusCode === 302) && res.headers.location && maxRedirects > 0) {
        const nextUrl = res.headers.location;
        resolve(fetchHttp(nextUrl, maxRedirects - 1));
        return;
      }
      let body = '';
      res.setEncoding('utf8');
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => {
        resolve({ statusCode: res.statusCode || 0, headers: res.headers, body, finalPath: urlPath });
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function runEdgeCaseTests() {
  console.log('======================================================================');
  console.log('  ADVERSARIAL ROUTE EDGE-CASE SUITE (Milestone 1 Hardening)           ');
  console.log('======================================================================\n');

  // -------------------------------------------------------------------------
  // SUITE 1: Router Path Resolution Stress Testing (src/routes.ts)
  // -------------------------------------------------------------------------
  console.log('--- SUITE 1: Router Path Resolution Stress Testing ---');

  // 1.1 Trailing slash permutations
  const slashPermutations = [
    { input: '/home', search: '', expected: 'home', desc: 'Standard /home' },
    { input: '/home/', search: '', expected: 'home', desc: 'Single trailing slash /home/' },
    { input: '/deck', search: '', expected: 'mydeck', desc: 'Standard /deck' },
    { input: '/deck/', search: '', expected: 'mydeck', desc: 'Single trailing slash /deck/' },
    { input: '/play', search: '', expected: 'play', desc: 'Standard /play' },
    { input: '/play/', search: '', expected: 'play', desc: 'Single trailing slash /play/' },
    { input: '/shop', search: '', expected: 'shop', desc: 'Standard /shop' },
    { input: '/shop/', search: '', expected: 'shop', desc: 'Single trailing slash /shop/' },
    { input: '/reddit', search: '', expected: 'reddit', desc: 'Standard /reddit' },
    { input: '/reddit/', search: '', expected: 'reddit', desc: 'Single trailing slash /reddit/' },
    { input: '/movie', search: '', expected: 'movie', desc: 'Standard /movie' },
    { input: '/movie/', search: '', expected: 'movie', desc: 'Single trailing slash /movie/' },
    { input: '/cinema', search: '', expected: 'cinema', desc: 'Standard /cinema' },
    { input: '/cinema/', search: '', expected: 'cinema', desc: 'Single trailing slash /cinema/' },
    { input: '/wiki/card', search: '', expected: 'wiki-card', desc: 'Standard /wiki/card' },
    { input: '/wiki/card/', search: '', expected: 'wiki-card', desc: 'Single trailing slash /wiki/card/' },
  ];

  for (let i = 0; i < slashPermutations.length; i++) {
    const t = slashPermutations[i];
    const actual = getViewFromPath(t.input, t.search);
    assert(`EDGE-SLASH-${i + 1}`, t.desc, actual === t.expected, t.expected, actual);
  }

  // 1.2 Query string and search param handling
  const queryCases = [
    { input: '/home', search: '?source=twitter&campaign=m1', expected: 'home', desc: '/home with UTM params' },
    { input: '/home', search: '?tab=deck', expected: 'home', desc: '/home with custom tab query' },
    { input: '/deck', search: '?sort=tp&filter=owned', expected: 'mydeck', desc: '/deck with sort & filter' },
    { input: '/play', search: '?mode=ai', expected: 'play', desc: '/play with regular mode query' },
    { input: '/play', search: '?ep=1', expected: 'main', desc: '/play?ep=1 redirects to main RPG' },
    { input: '/play', search: '?episode=40', expected: 'main', desc: '/play?episode=40 redirects to main RPG' },
    { input: '/play', search: '?ch=5', expected: 'main', desc: '/play?ch=5 redirects to main RPG' },
    { input: '/play', search: '?chapter=12', expected: 'main', desc: '/play?chapter=12 redirects to main RPG' },
    { input: '/home', search: '?view=shop', expected: 'shop', desc: 'Explicit ?view=shop override' },
    { input: '/home', search: '?view=mydeck', expected: 'mydeck', desc: 'Explicit ?view=mydeck override' },
    { input: '/home', search: '?view=makegrid', expected: 'tool-makegrid', desc: 'Explicit ?view=makegrid tool alias' },
    { input: '/home', search: '?view=checkgrid', expected: 'tool-checkgrid', desc: 'Explicit ?view=checkgrid tool alias' },
    { input: '/', search: '', expected: 'home', desc: 'SPA router fallback for root /' },
    { input: '/', search: '?view=novel', expected: 'novel', desc: 'SPA router / with ?view=novel' },
  ];

  for (let i = 0; i < queryCases.length; i++) {
    const t = queryCases[i];
    const actual = getViewFromPath(t.input, t.search);
    assert(`EDGE-QUERY-${i + 1}`, t.desc, actual === t.expected, t.expected, actual);
  }

  // 1.3 Deep-link and prefix handling
  const deepLinkCases = [
    { input: '/novel/s1-ep1', expected: 'novel', desc: 'Novel season 1 deep link' },
    { input: '/book/episode_05', expected: 'novel', desc: 'Book episode deep link' },
    { input: '/movie/ep-1', expected: 'movie', desc: 'Movie episode 1 deep link' },
    { input: '/movie/ep-40', expected: 'movie', desc: 'Movie episode 40 deep link' },
    { input: '/cinema/ep-1', expected: 'cinema', desc: 'Cinema episode 1 deep link' },
    { input: '/cinema/ep-40', expected: 'cinema', desc: 'Cinema episode 40 deep link' },
    { input: '/r/hanguk', expected: 'reddit', desc: 'Reddit sub-reddit /r/hanguk' },
    { input: '/r/hanguk/comments/post_vibecoding_master', expected: 'reddit', desc: 'Reddit post deep link' },
    { input: '/u/admin_user', expected: 'reddit', desc: 'Reddit user deep link /u/*' },
    { input: '/user/top_player', expected: 'reddit', desc: 'Reddit user deep link /user/*' },
    { input: '/creator/invite123', expected: 'creator', desc: 'Creator invite deep link' },
    { input: '/main/chapter-3', expected: 'main', desc: 'Main RPG chapter deep link' },
    { input: '/script/ep-1', expected: 'script', desc: 'Script deep link' },
  ];

  for (let i = 0; i < deepLinkCases.length; i++) {
    const t = deepLinkCases[i];
    const actual = getViewFromPath(t.input);
    assert(`EDGE-DEEPLINK-${i + 1}`, t.desc, actual === t.expected, t.expected, actual);
  }

  // -------------------------------------------------------------------------
  // SUITE 2: Static Filesystem Asset Path Resolution (dist/)
  // -------------------------------------------------------------------------
  console.log('\n--- SUITE 2: Static Filesystem Asset Path Resolution (dist/) ---');

  const distDir = path.join(process.cwd(), 'dist');
  
  // Recursively find all HTML files in dist/
  function getAllHtmlFiles(dir: string): string[] {
    const files: string[] = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...getAllHtmlFiles(fullPath));
      } else if (entry.isFile() && entry.name.endsWith('.html')) {
        files.push(fullPath);
      }
    }
    return files;
  }

  const allHtmlFiles = getAllHtmlFiles(distDir);
  console.log(`Found ${allHtmlFiles.length} HTML files in dist/ to audit.`);

  assert(
    'EDGE-DIST-COUNT',
    'HTML Files Generated in dist/ >= 50',
    allHtmlFiles.length >= 50,
    '>= 50 HTML files',
    `${allHtmlFiles.length} HTML files found`
  );

  // Check 1: dist/index.html is the ONLY file with #landing-root
  const landingRootFiles = allHtmlFiles.filter(f => {
    const content = fs.readFileSync(f, 'utf8');
    return content.includes('id="landing-root"');
  });

  const relativeLandingFiles = landingRootFiles.map(f => path.relative(distDir, f));
  assert(
    'EDGE-ISOLATION-LANDING',
    'Exactly 1 file in dist/ has id="landing-root" (dist/index.html only)',
    landingRootFiles.length === 1 && relativeLandingFiles[0] === 'index.html',
    '["index.html"]',
    JSON.stringify(relativeLandingFiles)
  );

  // Check 2: All other generated SPA HTML files (except static sites like mall) must have #root and /assets/home-*.js
  const nonLandingHtmlFiles = allHtmlFiles.filter(f => path.relative(distDir, f) !== 'index.html');
  let spaRootFailureCount = 0;
  let relativeAssetPathFailureCount = 0;
  const failingSpaFiles: string[] = [];
  const failingAssetFiles: string[] = [];

  for (const f of nonLandingHtmlFiles) {
    const rel = path.relative(distDir, f);
    // Exclude dedicated non-SPA static sites preserved from public/
    const isDedicatedStaticSite = 
      rel.startsWith('mall/') || 
      rel.startsWith('gwent/') ||
      rel.startsWith('anime-character-sheets/') ||
      rel.startsWith('gotest') ||
      rel.startsWith('pacpik') ||
      rel.startsWith('ai') ||
      rel === 'about-news.html' ||
      rel === 'editorial-guidelines.html' ||
      rel === 'mlx-chat.html';

    if (isDedicatedStaticSite) continue;

    const content = fs.readFileSync(f, 'utf8');
    const hasSpaRoot = content.includes('id="root"');
    const hasHomeBundle = /assets\/home-[A-Za-z0-9_-]+\.js/.test(content);

    const isRedirectStub = content.includes('window.location.replace') || content.includes('http-equiv="refresh"');
    if ((!hasSpaRoot || !hasHomeBundle) && !isRedirectStub) {
      spaRootFailureCount++;
      failingSpaFiles.push(`${rel} (root:${hasSpaRoot}, home:${hasHomeBundle})`);
    }

    // Check for relative asset links like src="./assets/" or href="assets/" which break on deep routes!
    const hasRelativeAsset = /(?:src|href)=["'](?:\.\/)?assets\//.test(content);
    if (hasRelativeAsset) {
      relativeAssetPathFailureCount++;
      failingAssetFiles.push(rel);
    }
  }

  assert(
    'EDGE-SPA-ALL-ROUTES',
    'All SPA HTML files contain #root and /assets/home-*.js bundle',
    spaRootFailureCount === 0,
    '0 failing files',
    `${spaRootFailureCount} failing files: ${failingSpaFiles.slice(0, 5).join(', ')}`
  );

  assert(
    'EDGE-ASSET-PATHS-ABSOLUTE',
    'All SPA HTML files use absolute /assets/ paths (zero relative ./assets/ breakage)',
    relativeAssetPathFailureCount === 0,
    '0 files with relative assets',
    `${relativeAssetPathFailureCount} files with relative assets: ${failingAssetFiles.slice(0, 5).join(', ')}`
  );

  // -------------------------------------------------------------------------
  // SUITE 3: Live HTTP Probes against Running Preview Server (:3000)
  // -------------------------------------------------------------------------
  console.log('\n--- SUITE 3: Live HTTP Probes against Preview Server (:3000) ---');

  const liveProbes = [
    // Landing probes
    { path: '/', expectRoot: 'landing-root', expectScript: 'main-', desc: 'GET /' },
    { path: '/?utm_source=google&gclid=123', expectRoot: 'landing-root', expectScript: 'main-', desc: 'GET / with query params' },
    { path: '/index.html', expectRoot: 'landing-root', expectScript: 'main-', desc: 'GET /index.html' },
    { path: '/index.html?ref=landing', expectRoot: 'landing-root', expectScript: 'main-', desc: 'GET /index.html with query' },

    // Core Game SPA routes
    { path: '/home', expectRoot: 'root', expectScript: 'home-', desc: 'GET /home' },
    { path: '/home/', expectRoot: 'root', expectScript: 'home-', desc: 'GET /home/ (trailing slash)' },
    { path: '/home?ref=twitter', expectRoot: 'root', expectScript: 'home-', desc: 'GET /home with query' },
    { path: '/home/?ref=twitter', expectRoot: 'root', expectScript: 'home-', desc: 'GET /home/ with query' },

    // Subroutes
    { path: '/deck', expectRoot: 'root', expectScript: 'home-', desc: 'GET /deck' },
    { path: '/deck/', expectRoot: 'root', expectScript: 'home-', desc: 'GET /deck/ (trailing slash)' },
    { path: '/play', expectRoot: 'root', expectScript: 'home-', desc: 'GET /play' },
    { path: '/play/', expectRoot: 'root', expectScript: 'home-', desc: 'GET /play/ (trailing slash)' },
    { path: '/shop', expectRoot: 'root', expectScript: 'home-', desc: 'GET /shop' },
    { path: '/shop/', expectRoot: 'root', expectScript: 'home-', desc: 'GET /shop/ (trailing slash)' },

    // Deep Media and Community routes
    { path: '/movie', expectRoot: 'root', expectScript: 'home-', desc: 'GET /movie' },
    { path: '/movie/', expectRoot: 'root', expectScript: 'home-', desc: 'GET /movie/ (trailing slash)' },
    { path: '/movie/ep-1', expectRoot: 'root', expectScript: 'home-', desc: 'GET /movie/ep-1 (deep route)' },
    { path: '/movie/ep-1/', expectRoot: 'root', expectScript: 'home-', desc: 'GET /movie/ep-1/ (deep route trailing slash)' },
    { path: '/cinema', expectRoot: 'root', expectScript: 'home-', desc: 'GET /cinema' },
    { path: '/cinema/ep-40', expectRoot: 'root', expectScript: 'home-', desc: 'GET /cinema/ep-40 (deep route)' },
    { path: '/cinema/ep-40/', expectRoot: 'root', expectScript: 'home-', desc: 'GET /cinema/ep-40/ (deep route trailing slash)' },
    { path: '/reddit', expectRoot: 'root', expectScript: 'home-', desc: 'GET /reddit' },
    { path: '/reddit/', expectRoot: 'root', expectScript: 'home-', desc: 'GET /reddit/ (trailing slash)' },
    { path: '/r/hanguk', expectRoot: 'root', expectScript: 'home-', desc: 'GET /r/hanguk (deep route)' },
    { path: '/r/hanguk/', expectRoot: 'root', expectScript: 'home-', desc: 'GET /r/hanguk/ (deep route trailing slash)' },
    { path: '/r/hanguk/comments/post_vibecoding_master', expectRoot: 'root', expectScript: 'home-', desc: 'GET /r/hanguk/comments/post_vibecoding_master' },
    { path: '/r/hanguk/comments/post_vibecoding_master/', expectRoot: 'root', expectScript: 'home-', desc: 'GET /r/hanguk/comments/post_vibecoding_master/' },
    { path: '/wiki/card', expectRoot: 'root', expectScript: 'home-', desc: 'GET /wiki/card (nested deep route without trailing slash)' },
    { path: '/wiki/card/', expectRoot: 'root', expectScript: 'home-', desc: 'GET /wiki/card/ (nested deep route with trailing slash)' },
  ];

  for (let i = 0; i < liveProbes.length; i++) {
    const probe = liveProbes[i];
    try {
      const res = await fetchHttp(probe.path);
      const is200 = res.statusCode === 200;
      const hasRoot = res.body.includes(`id="${probe.expectRoot}"`);
      const hasScript = res.body.includes(probe.expectScript);
      const isRedirectStub = res.body.includes('window.location.replace') || res.body.includes('http-equiv="refresh"');
      const satisfiesProbe = (hasRoot && hasScript) || isRedirectStub;

      assert(
        `LIVE-HTTP-${i + 1}`,
        probe.desc,
        is200 && satisfiesProbe,
        `200 OK with #${probe.expectRoot} or hash redirect`,
        `Status ${res.statusCode}, hasRoot=${hasRoot}, hasScript=${hasScript}, isRedirect=${isRedirectStub}`
      );
    } catch (e: any) {
      assert(
        `LIVE-HTTP-${i + 1}`,
        probe.desc,
        false,
        'Successful HTTP probe',
        'Connection error',
        e?.message || String(e)
      );
    }
  }

  // -------------------------------------------------------------------------
  // SUITE 4: Summary & Report
  // -------------------------------------------------------------------------
  console.log('\n======================================================================');
  console.log('  EDGE-CASE TEST SUMMARY                                              ');
  console.log('======================================================================');

  const total = results.length;
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  console.log(`Total Assertions : ${total}`);
  console.log(`Passed           : ${passed}`);
  console.log(`Failed           : ${failed}`);
  console.log(`Pass Rate        : ${((passed / total) * 100).toFixed(1)}%`);

  if (failed > 0) {
    console.log('\nFAILED ASSERTIONS:');
    for (const r of results.filter(r => !r.passed)) {
      console.log(`  - [${r.id}] ${r.name}: Expected ${r.expected}, got ${r.actual}`);
    }
    process.exit(1);
  } else {
    console.log('\nALL ROUTE EDGE-CASE ASSERTIONS PASSED WITH 100% SUCCESS!');
    process.exit(0);
  }
}

runEdgeCaseTests().catch(err => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
