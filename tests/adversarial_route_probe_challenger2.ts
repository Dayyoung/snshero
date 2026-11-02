/**
 * tests/adversarial_route_probe_challenger2.ts
 *
 * EMPIRICAL ADVERSARIAL ROUTE PRECEDENCE & DEEP-LINK RESOLUTION PROBE
 * Challenger 2 — Milestone 1 Iteration 2 Gate (challenger_m1_it2_2)
 *
 * Scope:
 * 1. Empirically verify route precedence and deep-link resolution:
 *    - /play?ep=1, /play?episode=40, /play?ch=2, /play?chapter=10 -> 'main'
 *    - Static /play with no query parameters -> 'play'
 *    - #play?ep=1, #play?episode=40, #play?ch=2, #play?chapter=10 -> 'main'
 *    - Static #play with no query parameters -> 'play'
 *    - Trailing slashes, combined search/hash, false positive isolation, alias normalization
 * 2. Static filesystem artifact preservation:
 *    - dist/home.html intact React SPA template (>= 10,000 bytes, <div id="root"></div>, no redirect stub)
 *    - dist/404.html intact React SPA fallback (>= 10,000 bytes, <div id="root"></div>, no redirect stub)
 *    - dist/movie/ep-1/index.html intact movie player markup with YouTube iframe, no redirect stub
 *    - dist/home/index.html, dist/deck/index.html, dist/play/index.html, dist/card/index.html, dist/shop/index.html redirect stubs
 * 3. scripts/post-build.js idempotency verification
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execSync } from 'node:child_process';
import { getViewFromPath } from '../src/routes';

interface ProbeAssertion {
  id: string;
  category: string;
  name: string;
  passed: boolean;
  expected: string;
  actual: string;
  error?: string;
}

const assertions: ProbeAssertion[] = [];

function check(
  id: string,
  category: string,
  name: string,
  condition: boolean,
  expected: string,
  actual: string,
  error?: string
) {
  assertions.push({ id, category, name, passed: condition, expected, actual, error });
  const mark = condition ? '✓ PASS' : '✗ FAIL';
  console.log(`[${id}] ${mark}: ${name}`);
  if (!condition) {
    console.error(`      Expected: ${expected} | Actual: ${actual} ${error ? `(${error})` : ''}`);
  }
}

function sha256File(filePath: string): string {
  const data = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(data).digest('hex');
}

async function runProbe() {
  console.log('======================================================================');
  console.log('  CHALLENGER 2: ADVERSARIAL ROUTE PRECEDENCE & DEEP-LINK PROBE        ');
  console.log('  Milestone 1 Iteration 2 Gate Empirical Audit                        ');
  console.log('======================================================================\n');

  // =========================================================================
  // SUITE 1: Route Precedence & Query Parameter Deep-Link Resolution
  // =========================================================================
  console.log('--- SUITE 1: Route Precedence & Query Parameter Deep-Link Resolution ---');

  // 1.1 Mandatory Primary Cases
  check(
    'PREC-01',
    'Primary Query',
    "/play?ep=1 resolves to 'main'",
    getViewFromPath('/play', '?ep=1') === 'main',
    'main',
    getViewFromPath('/play', '?ep=1')
  );

  check(
    'PREC-02',
    'Primary Query',
    "/play?episode=40 resolves to 'main'",
    getViewFromPath('/play', '?episode=40') === 'main',
    'main',
    getViewFromPath('/play', '?episode=40')
  );

  check(
    'PREC-03',
    'Primary Query',
    "/play?ch=2 resolves to 'main'",
    getViewFromPath('/play', '?ch=2') === 'main',
    'main',
    getViewFromPath('/play', '?ch=2')
  );

  check(
    'PREC-04',
    'Primary Query',
    "/play?chapter=10 resolves to 'main'",
    getViewFromPath('/play', '?chapter=10') === 'main',
    'main',
    getViewFromPath('/play', '?chapter=10')
  );

  check(
    'PREC-05',
    'Static Route',
    "Static /play with no query parameters resolves to 'play'",
    getViewFromPath('/play', '') === 'play',
    'play',
    getViewFromPath('/play', '')
  );

  // 1.2 Hash Query Extraction & Resolution
  check(
    'PREC-06',
    'Hash Deep Link',
    "#play?ep=1 query extraction resolves to 'main'",
    getViewFromPath('/', '', '#play?ep=1') === 'main',
    'main',
    getViewFromPath('/', '', '#play?ep=1')
  );

  check(
    'PREC-07',
    'Hash Deep Link',
    "#play?episode=40 query extraction resolves to 'main'",
    getViewFromPath('/', '', '#play?episode=40') === 'main',
    'main',
    getViewFromPath('/', '', '#play?episode=40')
  );

  check(
    'PREC-08',
    'Hash Deep Link',
    "#play?ch=2 query extraction resolves to 'main'",
    getViewFromPath('/', '', '#play?ch=2') === 'main',
    'main',
    getViewFromPath('/', '', '#play?ch=2')
  );

  check(
    'PREC-09',
    'Hash Deep Link',
    "#play?chapter=10 query extraction resolves to 'main'",
    getViewFromPath('/', '', '#play?chapter=10') === 'main',
    'main',
    getViewFromPath('/', '', '#play?chapter=10')
  );

  check(
    'PREC-10',
    'Static Hash',
    "Static #play with no query parameters resolves to 'play'",
    getViewFromPath('/', '', '#play') === 'play',
    'play',
    getViewFromPath('/', '', '#play')
  );

  // 1.3 Trailing Slash Permutations
  check(
    'PREC-11',
    'Trailing Slash',
    "/play/?ep=1 with trailing slash resolves to 'main'",
    getViewFromPath('/play/', '?ep=1') === 'main',
    'main',
    getViewFromPath('/play/', '?ep=1')
  );

  check(
    'PREC-12',
    'Trailing Slash',
    "/play/?episode=40 with trailing slash resolves to 'main'",
    getViewFromPath('/play/', '?episode=40') === 'main',
    'main',
    getViewFromPath('/play/', '?episode=40')
  );

  check(
    'PREC-13',
    'Trailing Slash',
    "Static /play/ with trailing slash resolves to 'play'",
    getViewFromPath('/play/', '') === 'play',
    'play',
    getViewFromPath('/play/', '')
  );

  check(
    'PREC-14',
    'Trailing Slash Hash',
    "#play/?ep=1 with trailing slash resolves to 'main'",
    getViewFromPath('/', '', '#play/?ep=1') === 'main',
    'main',
    getViewFromPath('/', '', '#play/?ep=1')
  );

  check(
    'PREC-15',
    'Trailing Slash Hash',
    "#/play?ep=1 with leading hash slash resolves to 'main'",
    getViewFromPath('/', '', '#/play?ep=1') === 'main',
    'main',
    getViewFromPath('/', '', '#/play?ep=1')
  );

  // 1.4 Combined Search, Hash & Multi-Query Scenarios
  check(
    'PREC-16',
    'Multi-Query',
    "/play?mode=ai&ep=1 resolves to 'main'",
    getViewFromPath('/play', '?mode=ai&ep=1') === 'main',
    'main',
    getViewFromPath('/play', '?mode=ai&ep=1')
  );

  check(
    'PREC-17',
    'Multi-Query',
    "/play?source=twitter&ch=2&lang=ko resolves to 'main'",
    getViewFromPath('/play', '?source=twitter&ch=2&lang=ko') === 'main',
    'main',
    getViewFromPath('/play', '?source=twitter&ch=2&lang=ko')
  );

  check(
    'PREC-18',
    'Multi-Query Non-Ep',
    "/play?mode=ai (no ep/ch param) resolves to 'play'",
    getViewFromPath('/play', '?mode=ai') === 'play',
    'play',
    getViewFromPath('/play', '?mode=ai')
  );

  check(
    'PREC-19',
    'Combined Path & Hash',
    "pathname '/home' with hash '#play?ep=1' resolves to 'main'",
    getViewFromPath('/home', '', '#play?ep=1') === 'main',
    'main',
    getViewFromPath('/home', '', '#play?ep=1')
  );

  check(
    'PREC-20',
    'Hash Precedence',
    "pathname '/play' with search '?ep=1' but hash '#deck' resolves to 'mydeck'",
    getViewFromPath('/play', '?ep=1', '#deck') === 'mydeck',
    'mydeck',
    getViewFromPath('/play', '?ep=1', '#deck')
  );

  // 1.5 Alias Normalization (/main, #main, #battle)
  check(
    'PREC-21',
    'Alias',
    "/main?ep=1 resolves to 'main'",
    getViewFromPath('/main', '?ep=1') === 'main',
    'main',
    getViewFromPath('/main', '?ep=1')
  );

  check(
    'PREC-22',
    'Alias',
    "Static /main (no query) resolves to 'play'",
    getViewFromPath('/main', '') === 'play',
    'play',
    getViewFromPath('/main', '')
  );

  check(
    'PREC-23',
    'Alias Hash',
    "#main?ep=1 resolves to 'main'",
    getViewFromPath('/', '', '#main?ep=1') === 'main',
    'main',
    getViewFromPath('/', '', '#main?ep=1')
  );

  check(
    'PREC-24',
    'Alias Hash',
    "Static #main resolves to 'play'",
    getViewFromPath('/', '', '#main') === 'play',
    'play',
    getViewFromPath('/', '', '#main')
  );

  check(
    'PREC-25',
    'Alias Hash',
    "#battle?ep=1 resolves to 'main'",
    getViewFromPath('/', '', '#battle?ep=1') === 'main',
    'main',
    getViewFromPath('/', '', '#battle?ep=1')
  );

  check(
    'PREC-26',
    'Alias Hash',
    "Static #battle resolves to 'play'",
    getViewFromPath('/', '', '#battle') === 'play',
    'play',
    getViewFromPath('/', '', '#battle')
  );

  // 1.6 False Positive Isolation (Substrings & Other Views)
  check(
    'PREC-27',
    'False Positive Guard',
    "/play?epoch=1 does NOT trigger 'main' -> resolves to 'play'",
    getViewFromPath('/play', '?epoch=1') === 'play',
    'play',
    getViewFromPath('/play', '?epoch=1')
  );

  check(
    'PREC-28',
    'False Positive Guard',
    "/play?channel=2 does NOT trigger 'main' -> resolves to 'play'",
    getViewFromPath('/play', '?channel=2') === 'play',
    'play',
    getViewFromPath('/play', '?channel=2')
  );

  check(
    'PREC-29',
    'False Positive Guard',
    "/play?chapter_id=10 does NOT trigger 'main' -> resolves to 'play'",
    getViewFromPath('/play', '?chapter_id=10') === 'play',
    'play',
    getViewFromPath('/play', '?chapter_id=10')
  );

  check(
    'PREC-30',
    'Scope Isolation',
    "/deck?ep=1 stays 'mydeck'",
    getViewFromPath('/deck', '?ep=1') === 'mydeck',
    'mydeck',
    getViewFromPath('/deck', '?ep=1')
  );

  check(
    'PREC-31',
    'Scope Isolation',
    "/home?ep=1 stays 'home'",
    getViewFromPath('/home', '?ep=1') === 'home',
    'home',
    getViewFromPath('/home', '?ep=1')
  );

  check(
    'PREC-32',
    'Scope Isolation',
    "/shop?ep=1 stays 'shop'",
    getViewFromPath('/shop', '?ep=1') === 'shop',
    'shop',
    getViewFromPath('/shop', '?ep=1')
  );

  // 1.7 Empty & Boundary Episode Values
  check(
    'PREC-33',
    'Empty Value Fallback',
    "/play?ep= (empty value) falls back to 'play'",
    getViewFromPath('/play', '?ep=') === 'play',
    'play',
    getViewFromPath('/play', '?ep=')
  );

  check(
    'PREC-34',
    'Empty Value Fallback',
    "/play?episode= (empty value) falls back to 'play'",
    getViewFromPath('/play', '?episode=') === 'play',
    'play',
    getViewFromPath('/play', '?episode=')
  );

  check(
    'PREC-35',
    'Boundary Value',
    "/play?ep=0 resolves to 'main'",
    getViewFromPath('/play', '?ep=0') === 'main',
    'main',
    getViewFromPath('/play', '?ep=0')
  );

  check(
    'PREC-36',
    'Boundary Value',
    "/play?ep=40 resolves to 'main'",
    getViewFromPath('/play', '?ep=40') === 'main',
    'main',
    getViewFromPath('/play', '?ep=40')
  );

  // 1.8 Deep-Link Routes Non-Regression
  check(
    'PREC-37',
    'Deep Link Route',
    "/movie/ep-1 resolves to 'movie'",
    getViewFromPath('/movie/ep-1') === 'movie',
    'movie',
    getViewFromPath('/movie/ep-1')
  );

  check(
    'PREC-38',
    'Deep Link Route',
    "/cinema/ep-40 resolves to 'cinema'",
    getViewFromPath('/cinema/ep-40') === 'cinema',
    'cinema',
    getViewFromPath('/cinema/ep-40')
  );

  check(
    'PREC-39',
    'Deep Link Route',
    "/novel/s1-ep1 resolves to 'novel'",
    getViewFromPath('/novel/s1-ep1') === 'novel',
    'novel',
    getViewFromPath('/novel/s1-ep1')
  );

  check(
    'PREC-40',
    'Deep Link Route',
    "/r/hanguk/comments/post_vibecoding_master resolves to 'reddit'",
    getViewFromPath('/r/hanguk/comments/post_vibecoding_master') === 'reddit',
    'reddit',
    getViewFromPath('/r/hanguk/comments/post_vibecoding_master')
  );

  // =========================================================================
  // SUITE 2: Static Filesystem Artifacts & Template Integrity Verification
  // =========================================================================
  console.log('\n--- SUITE 2: Static Filesystem Artifacts & Template Integrity ---');

  const rootDir = process.cwd();
  const distDir = path.join(rootDir, 'dist');

  // 2.1 dist/home.html Master SPA Template Integrity
  const homeHtmlPath = path.join(distDir, 'home.html');
  const homeExists = fs.existsSync(homeHtmlPath);
  const homeSize = homeExists ? fs.statSync(homeHtmlPath).size : 0;
  const homeContent = homeExists ? fs.readFileSync(homeHtmlPath, 'utf8') : '';
  const homeHasRoot = homeContent.includes('<div id="root"></div>');
  const homeHasBundle = /assets\/home-[A-Za-z0-9_-]+\.js/.test(homeContent);
  const homeHasNoRedirect = !homeContent.includes('http-equiv="refresh"');

  check(
    'ARTIFACT-01',
    'Master Template',
    'dist/home.html exists and is >= 10,000 bytes',
    homeExists && homeSize >= 10000,
    '>= 10,000 bytes',
    `${homeSize} bytes`
  );

  check(
    'ARTIFACT-02',
    'Master Template',
    'dist/home.html contains <div id="root"></div> and React SPA bundle',
    homeHasRoot && homeHasBundle,
    'has #root and home-*.js',
    `root: ${homeHasRoot}, bundle: ${homeHasBundle}`
  );

  check(
    'ARTIFACT-03',
    'Master Template',
    'dist/home.html does NOT contain http-equiv="refresh" redirect stub',
    homeHasNoRedirect,
    'No meta refresh',
    homeHasNoRedirect ? 'Clean (no refresh)' : 'Contains http-equiv="refresh"'
  );

  // 2.2 dist/404.html SPA Fallback Integrity
  const notFoundPath = path.join(distDir, '404.html');
  const notFoundExists = fs.existsSync(notFoundPath);
  const notFoundSize = notFoundExists ? fs.statSync(notFoundPath).size : 0;
  const notFoundContent = notFoundExists ? fs.readFileSync(notFoundPath, 'utf8') : '';
  const notFoundHasRoot = notFoundContent.includes('<div id="root"></div>');
  const notFoundHasNoRedirect = !notFoundContent.includes('http-equiv="refresh"');

  check(
    'ARTIFACT-04',
    '404 Fallback',
    'dist/404.html exists and is >= 10,000 bytes',
    notFoundExists && notFoundSize >= 10000,
    '>= 10,000 bytes',
    `${notFoundSize} bytes`
  );

  check(
    'ARTIFACT-05',
    '404 Fallback',
    'dist/404.html contains <div id="root"></div> and no redirect stub',
    notFoundHasRoot && notFoundHasNoRedirect,
    'has #root and no redirect',
    `root: ${notFoundHasRoot}, noRedirect: ${notFoundHasNoRedirect}`
  );

  // 2.3 dist/movie/ep-1/index.html Intact Player & No Redirect Stub
  const movieEp1Path = path.join(distDir, 'movie', 'ep-1', 'index.html');
  const movieEp1Exists = fs.existsSync(movieEp1Path);
  const movieEp1Content = movieEp1Exists ? fs.readFileSync(movieEp1Path, 'utf8') : '';
  const movieEp1HasRoot = movieEp1Content.includes('<div id="root">');
  const movieEp1HasIframe = movieEp1Content.includes('<iframe');
  const movieEp1HasNoRedirect = !movieEp1Content.includes('http-equiv="refresh"');

  check(
    'ARTIFACT-06',
    'Movie Pre-render',
    'dist/movie/ep-1/index.html contains #root and YouTube iframe',
    movieEp1Exists && movieEp1HasRoot && movieEp1HasIframe,
    'has #root and <iframe',
    `exists: ${movieEp1Exists}, root: ${movieEp1HasRoot}, iframe: ${movieEp1HasIframe}`
  );

  check(
    'ARTIFACT-07',
    'Movie Pre-render',
    'dist/movie/ep-1/index.html does NOT contain http-equiv="refresh" redirect stub',
    movieEp1HasNoRedirect,
    'No meta refresh',
    movieEp1HasNoRedirect ? 'Clean (no refresh)' : 'Contains http-equiv="refresh"'
  );

  // 2.4 Legacy Route Redirect Stubs Verification
  const legacyRouteChecklist = [
    { dir: 'home', file: 'home/index.html', target: '/#home' },
    { dir: 'deck', file: 'deck/index.html', target: '/#deck' },
    { dir: 'play', file: 'play/index.html', target: '/#play' },
    { dir: 'card', file: 'card/index.html', target: '/#card' },
    { dir: 'shop', file: 'shop/index.html', target: '/#shop' },
  ];

  for (let i = 0; i < legacyRouteChecklist.length; i++) {
    const item = legacyRouteChecklist[i];
    const fullPath = path.join(distDir, item.file);
    const exists = fs.existsSync(fullPath);
    const content = exists ? fs.readFileSync(fullPath, 'utf8') : '';
    const hasRefresh = content.includes(`http-equiv="refresh" content="0; url=${item.target}"`);
    const hasLocationReplace = content.includes(`window.location.replace('/' + '${item.target.replace('/#', '#')}' + search)`);

    check(
      `REDIRECT-0${i + 1}`,
      'Legacy Redirect',
      `dist/${item.file} redirects cleanly to ${item.target}`,
      exists && hasRefresh && hasLocationReplace,
      `redirects to ${item.target}`,
      exists ? (hasRefresh ? `valid redirect to ${item.target}` : 'missing meta refresh') : 'file missing'
    );
  }

  // =========================================================================
  // SUITE 3: Post-Build Script Idempotency Verification
  // =========================================================================
  console.log('\n--- SUITE 3: Post-Build Script Idempotency Verification ---');

  const hashBefore = sha256File(homeHtmlPath);
  try {
    execSync('node scripts/post-build.js', { stdio: 'pipe' });
  } catch (err: any) {
    console.error('Error re-running scripts/post-build.js:', err);
  }
  const hashAfter = sha256File(homeHtmlPath);

  check(
    'IDEMP-01',
    'Idempotency',
    'scripts/post-build.js produces identical SHA-256 for dist/home.html when re-run',
    hashBefore === hashAfter,
    hashBefore,
    hashAfter
  );

  // =========================================================================
  // Probe Summary
  // =========================================================================
  console.log('\n======================================================================');
  console.log('  PROBE RESULTS SUMMARY                                               ');
  console.log('======================================================================');

  const total = assertions.length;
  const passed = assertions.filter(a => a.passed).length;
  const failed = assertions.filter(a => !a.passed).length;

  console.log(`Total Assertions : ${total}`);
  console.log(`Passed           : ${passed}`);
  console.log(`Failed           : ${failed}`);
  console.log(`Pass Rate        : ${((passed / total) * 100).toFixed(1)}%`);

  if (failed > 0) {
    console.log('\nFAILED ASSERTIONS:');
    for (const a of assertions.filter(a => !a.passed)) {
      console.log(`  - [${a.id}] ${a.name}: Expected ${a.expected}, got ${a.actual}`);
    }
    process.exit(1);
  } else {
    console.log('\nALL 53 ADVERSARIAL ROUTE & ARTIFACT ASSERTIONS PASSED WITH 100% SUCCESS!');
    process.exit(0);
  }
}

runProbe().catch(err => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
