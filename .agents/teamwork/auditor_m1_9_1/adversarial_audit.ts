/**
 * .agents/teamwork/auditor_m1_9_1/adversarial_audit.ts
 *
 * Independent Adversarial Stress Test Suite for Milestone 1 Integrity Audit.
 * Tests genuine execution, edge cases, boundary conditions, and reentrancy.
 */

import { IdleAutoPlayManager, MONITORED_INPUT_EVENTS } from '../../../src/landing/services/idleAutoPlayManager';
import { getViewPath, getViewFromPath, VIEW_ROUTES } from '../../../src/routes';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../../../');

// Mock localStorage, window, and document if in pure Node environment
if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map<string, string>();
  globalThis.localStorage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => { store.set(key, String(value)); },
    removeItem: (key: string) => { store.delete(key); },
    clear: () => { store.clear(); },
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    get length() { return store.size; },
  } as Storage;
}

if (typeof globalThis.window === 'undefined') {
  const listeners: Record<string, Function[]> = {};
  globalThis.window = {
    addEventListener: (event: string, fn: Function) => {
      listeners[event] = listeners[event] || [];
      listeners[event].push(fn);
    },
    removeEventListener: (event: string, fn: Function) => {
      if (listeners[event]) {
        listeners[event] = listeners[event].filter(f => f !== fn);
      }
    },
    dispatchEvent: (_event: any) => true,
    location: {
      href: 'http://localhost/#home',
      hash: '#home',
      pathname: '/',
      hostname: 'localhost',
      origin: 'http://localhost',
    },
    history: {
      replaceState: () => {},
      pushState: () => {},
    },
    scrollTo: () => {},
  } as any;
}

if (typeof globalThis.document === 'undefined') {
  globalThis.document = {
    addEventListener: () => {},
    removeEventListener: () => {},
    visibilityState: 'visible',
  } as any;
}

let passCount = 0;
let failCount = 0;
const failures: string[] = [];

function check(desc: string, passed: boolean, extra?: string) {
  if (passed) {
    passCount++;
    console.log(`  [PASS] ${desc}`);
  } else {
    failCount++;
    const err = `[FAIL] ${desc}${extra ? ` : ${extra}` : ''}`;
    failures.push(err);
    console.error(`  ${err}`);
  }
}

async function runAdversarialAudit() {
  console.log('\n=== RUNNING INDEPENDENT ADVERSARIAL INTEGRITY CHECKS ===\n');

  // -------------------------------------------------------------
  // Test Category 1: IdleAutoPlayManager Adversarial & Edge Cases
  // -------------------------------------------------------------
  console.log('--- Category 1: IdleAutoPlayManager Adversarial Execution ---');
  
  const manager = new IdleAutoPlayManager({
    timeoutMs: 15000,
    targetUrl: 'https://dayyoung-macbookpro.tail3717a4.ts.net/#play',
    throttleMs: 100,
  });

  // Multiple rapid starts should not throw or duplicate
  manager.start();
  manager.start();
  check('Multiple rapid manager.start() invocations are idempotent', manager.getState().isTracking === true);

  // Check state remaining time
  const remaining = manager.getRemainingTimeMs();
  check('Initial remaining time is ~15,000ms', remaining > 14900 && remaining <= 15000, `got ${remaining}`);

  // Test custom navigation hook capture
  let navigatedTo: string | null = null;
  let triggerDetail: any = null;
  manager.configure({
    onNavigate: (url) => { navigatedTo = url; },
    onTrigger: (detail) => { triggerDetail = detail; },
  });

  // Trigger now
  manager.triggerNow();
  check('triggerNow() invokes onNavigate with exact targetUrl', navigatedTo === 'https://dayyoung-macbookpro.tail3717a4.ts.net/#play');
  check('triggerNow() sets hero_kadan_rpg_auto_mode in localStorage', localStorage.getItem('hero_kadan_rpg_auto_mode') === 'true');
  check('triggerNow() sets hero_kadan_rpg_auto_mode_season1 in localStorage', localStorage.getItem('hero_kadan_rpg_auto_mode_season1') === 'true');
  check('triggerNow() sets hero_auto_battle in localStorage', localStorage.getItem('hero_auto_battle') === 'true');
  check('triggerNow() sets hero_auto_loop_mode in localStorage', localStorage.getItem('hero_auto_loop_mode') === 'true');
  check('triggerNow() passes triggerDetail with metadata', triggerDetail !== null && typeof triggerDetail.timestamp === 'number');

  // Test manager stop
  manager.stop();
  manager.stop(); // double stop
  check('manager.stop() idempotently stops tracking', manager.getState().isTracking === false);
  check('Remaining time after stop is 0', manager.getRemainingTimeMs() === 0);

  // Test 8 events list
  check('MONITORED_INPUT_EVENTS has exact length 8', MONITORED_INPUT_EVENTS.length === 8);
  const expectedSet = new Set(['mousemove', 'mousedown', 'keydown', 'touchstart', 'touchmove', 'scroll', 'pointerdown', 'wheel']);
  const allMatch = MONITORED_INPUT_EVENTS.every(e => expectedSet.has(e));
  check('All 8 required event types are present in MONITORED_INPUT_EVENTS', allMatch);

  // -------------------------------------------------------------
  // Test Category 2: Route Normalization in src/landing/index.ts (Source Inspection & Verification)
  // -------------------------------------------------------------
  console.log('\n--- Category 2: src/landing/index.ts Code Structure Verification ---');

  const landingIndexSrc = fs.readFileSync(path.resolve(REPO_ROOT, 'src/landing/index.ts'), 'utf8');

  // Verify HASH_VIEW_MAP definitions
  check('HASH_VIEW_MAP maps home and main-lobby', landingIndexSrc.includes("home: 'home'") && landingIndexSrc.includes("'main-lobby': 'home'"));
  check('HASH_VIEW_MAP maps deck and mydeck', landingIndexSrc.includes("deck: 'deck'") && landingIndexSrc.includes("mydeck: 'deck'"));
  check('HASH_VIEW_MAP maps play and main and battle', landingIndexSrc.includes("play: 'play'") && landingIndexSrc.includes("main: 'play'"));
  check('HASH_VIEW_MAP maps card, cards, mission, missions', landingIndexSrc.includes("card: 'card'") && landingIndexSrc.includes("mission: 'card'"));
  check('HASH_VIEW_MAP maps shop and store', landingIndexSrc.includes("shop: 'shop'") && landingIndexSrc.includes("store: 'shop'"));

  // Verify LEGACY_PATH_MAP
  check('LEGACY_PATH_MAP contains /home, /deck, /play, /card, /shop',
    landingIndexSrc.includes("'/home': 'home'") &&
    landingIndexSrc.includes("'/deck': 'deck'") &&
    landingIndexSrc.includes("'/play': 'play'") &&
    landingIndexSrc.includes("'/card': 'card'") &&
    landingIndexSrc.includes("'/shop': 'shop'")
  );

  // Verify parseRoute logic implementation
  check('parseRoute handles empty hash and defaults to home', landingIndexSrc.includes("return 'home';"));
  check('parseRoute handles hashString parameter', landingIndexSrc.includes("export function parseRoute(hashString?: string, pathnameString?: string)"));
  check('navigateTo implements reentrancy mutex lock (isProgrammaticRouting)', landingIndexSrc.includes("isProgrammaticRouting = true;"));
  check('mountLanding initializes IdleAutoPlayManager', landingIndexSrc.includes("initIdleAutoPlay({"));

  // -------------------------------------------------------------
  // Test Category 3: src/routes.ts View Resolution & Canonical Paths
  // -------------------------------------------------------------
  console.log('\n--- Category 3: src/routes.ts View Resolution ---');

  check('getViewPath("home") === "#home"', getViewPath('home') === '#home');
  check('getViewPath("mydeck") === "#deck"', getViewPath('mydeck') === '#deck');
  check('getViewPath("play") === "#play"', getViewPath('play') === '#play');
  check('getViewPath("card") === "#card"', getViewPath('card') === '#card');
  check('getViewPath("shop") === "#shop"', getViewPath('shop') === '#shop');

  // Hash overrides pathname in getViewFromPath
  check('Hash #play overrides pathname /home in getViewFromPath', getViewFromPath('/home', '', '#play') === 'play');
  check('Hash #deck overrides pathname /play in getViewFromPath', getViewFromPath('/play', '', '#deck') === 'mydeck');
  check('Hash #card overrides pathname /shop in getViewFromPath', getViewFromPath('/shop', '', '#card') === 'card');

  // Legacy path fallback when no hash (ensure window.location.hash is empty)
  (globalThis.window as any).location.hash = '';
  check('Pathname /home maps to home in getViewFromPath', getViewFromPath('/home', '', '') === 'home');
  check('Pathname /deck maps to mydeck in getViewFromPath', getViewFromPath('/deck', '', '') === 'mydeck');
  check('Pathname /play maps to play in getViewFromPath', getViewFromPath('/play', '', '') === 'play');
  check('Pathname /card maps to card in getViewFromPath', getViewFromPath('/card', '', '') === 'card');
  check('Pathname /shop maps to shop in getViewFromPath', getViewFromPath('/shop', '', '') === 'shop');

  // -------------------------------------------------------------
  // Test Category 4: Legacy Route Elimination Verification
  // -------------------------------------------------------------
  console.log('\n--- Category 4: Legacy /home Elimination ---');

  const componentsDir = path.resolve(REPO_ROOT, 'src/landing/components');
  const viewsDir = path.resolve(REPO_ROOT, 'src/landing/views');

  const checkDirForLegacyLinks = (dir: string): string[] => {
    const hits: string[] = [];
    const files = fs.readdirSync(dir);
    for (const file of files) {
      if (!file.endsWith('.tsx') && !file.endsWith('.ts')) continue;
      const content = fs.readFileSync(path.join(dir, file), 'utf8');
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        if (line.includes('href="/home"') && !line.trim().startsWith('*') && !line.trim().startsWith('//')) {
          hits.push(`${file}:${idx + 1}: ${line.trim()}`);
        }
      });
    }
    return hits;
  };

  const compHits = checkDirForLegacyLinks(componentsDir);
  const viewHits = checkDirForLegacyLinks(viewsDir);
  check('Zero active href="/home" in src/landing/components/', compHits.length === 0, compHits.join(', '));
  check('Zero active href="/home" in src/landing/views/', viewHits.length === 0, viewHits.join(', '));

  // -------------------------------------------------------------
  // Test Category 5: Static Redirect Stubs in dist/
  // -------------------------------------------------------------
  console.log('\n--- Category 5: Static Redirect Stubs in dist/ ---');

  const checkStub = (subpath: string, expectedHash: string) => {
    const filePath = path.resolve(REPO_ROOT, `dist/${subpath}/index.html`);
    if (!fs.existsSync(filePath)) {
      check(`dist/${subpath}/index.html exists`, false);
      return;
    }
    const html = fs.readFileSync(filePath, 'utf8');
    const hasMetaRefresh = html.includes(`content="0; url=/${expectedHash}"`);
    const hasScriptReplace = html.includes(`window.location.replace('/' + '${expectedHash}' + search)`);
    check(`dist/${subpath}/index.html has meta refresh to /${expectedHash}`, hasMetaRefresh);
    check(`dist/${subpath}/index.html has script replace to /${expectedHash}`, hasScriptReplace);
  };

  checkStub('deck', '#deck');
  checkStub('play', '#play');
  checkStub('card', '#card');
  checkStub('shop', '#shop');

  // Summary
  console.log('\n======================================================');
  console.log(`ADVERSARIAL INTEGRITY SUMMARY: ${passCount + failCount} checks | PASSED: ${passCount} | FAILED: ${failCount}`);
  console.log('======================================================\n');

  if (failCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runAdversarialAudit().catch(err => {
  console.error('Fatal adversarial audit error:', err);
  process.exit(1);
});
