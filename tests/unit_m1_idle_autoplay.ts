/**
 * tests/unit_m1_idle_autoplay.ts
 *
 * Dedicated unit test suite verifying the genuine implementation of IdleAutoPlayManager
 * and Hash Route normalization/parsing for Milestone 1.
 */

import { IdleAutoPlayManager, MONITORED_INPUT_EVENTS } from '../src/landing/services/idleAutoPlayManager';
import { getViewPath, getViewFromPath } from '../src/routes';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

interface TestStats {
  passed: number;
  failed: number;
  errors: string[];
}

const stats: TestStats = { passed: 0, failed: 0, errors: [] };

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    stats.passed++;
    console.log(`  ✓ PASS: ${testName}`);
  } else {
    stats.failed++;
    const msg = `  ✗ FAIL: ${testName}${detail ? ` - ${detail}` : ''}`;
    stats.errors.push(msg);
    console.error(msg);
  }
}

async function runTests() {
  console.log('\n======================================================');
  console.log('  MILESTONE 1 UNIT TEST SUITE: Genuine Logic Verification');
  console.log('======================================================\n');

  // Test 1: Monitored input events
  const expectedEvents = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'touchmove', 'scroll', 'pointerdown', 'wheel'];
  const hasAllEvents = expectedEvents.every(e => (MONITORED_INPUT_EVENTS as readonly string[]).includes(e));
  assert(hasAllEvents, 'IdleAutoPlayManager monitors all 8 required user input events');

  // Test 2: Singleton instantiation & defaults
  const manager = IdleAutoPlayManager.getInstance();
  assert(manager !== null && manager !== undefined, 'IdleAutoPlayManager singleton instance exists');
  const state = manager.getState();
  assert(state.timeoutMs === 15000, 'Default idle timeout is strictly 15,000ms');
  assert(state.targetUrl === 'https://dayyoung-macbookpro.tail3717a4.ts.net/#play', 'Default target URL is Tailscale #play');

  // Test 3: Trigger transition directly
  let triggeredDetail: any = null;
  let navigatedUrl: string | null = null;
  manager.configure({
    onTrigger: (detail) => { triggeredDetail = detail; },
    onNavigate: (url) => { navigatedUrl = url; },
  });

  manager.triggerNow();
  assert(triggeredDetail !== null, 'triggerNow() invokes onTrigger callback');
  assert(navigatedUrl === 'https://dayyoung-macbookpro.tail3717a4.ts.net/#play', 'triggerNow() navigates to target URL');
  assert(localStorage.getItem('hero_kadan_rpg_auto_mode') === 'true', 'Auto-mode flag persisted to localStorage');
  assert(localStorage.getItem('hero_kadan_rpg_auto_mode_season1') === 'true', 'Season 1 auto-mode flag persisted');
  assert(localStorage.getItem('hero_auto_battle') === 'true', 'hero_auto_battle flag persisted');

  // Test 4: Static Landing index.ts Contracts
  const indexTsContent = fs.readFileSync(path.resolve(__dirname, '../src/landing/index.ts'), 'utf8');
  assert(indexTsContent.includes('export function parseRoute'), 'src/landing/index.ts exports parseRoute');
  assert(indexTsContent.includes('export function navigateTo'), 'src/landing/index.ts exports navigateTo');
  assert(indexTsContent.includes('export function renderSectionContent'), 'src/landing/index.ts exports renderSectionContent');
  assert(indexTsContent.includes('isProgrammaticRouting'), 'src/landing/index.ts implements isProgrammaticRouting mutex lock');
  assert(indexTsContent.includes('initIdleAutoPlay'), 'src/landing/index.ts boots initIdleAutoPlay');
  assert(indexTsContent.includes('snshero_hash_route_changed'), 'src/landing/index.ts dispatches snshero_hash_route_changed');

  // Test 5: Verify 0 instances of href="/home" in src/landing
  const landingFiles = ['Header.tsx', 'Sidebar.tsx', 'Footer.tsx', 'Modals.tsx']
    .map(f => fs.readFileSync(path.resolve(__dirname, `../src/landing/components/${f}`), 'utf8'));
  const hasLegacyHref = landingFiles.some(c => c.includes('href="/home"'));
  assert(!hasLegacyHref, '0 instances of href="/home" found in landing components');

  // Test 6: Routes.ts getViewPath & getViewFromPath
  assert(getViewPath('home') === '#home', 'getViewPath(home) returns #home');
  assert(getViewPath('mydeck') === '#deck', 'getViewPath(mydeck) returns #deck');
  assert(getViewPath('play') === '#play', 'getViewPath(play) returns #play');
  assert(getViewPath('card') === '#card', 'getViewPath(card) returns #card');
  assert(getViewPath('shop') === '#shop', 'getViewPath(shop) returns #shop');

  assert(getViewFromPath('/random', '', '#home') === 'home', 'getViewFromPath parses #home hash');
  assert(getViewFromPath('/random', '', '#deck') === 'mydeck', 'getViewFromPath parses #deck hash');
  assert(getViewFromPath('/random', '', '#play') === 'play', 'getViewFromPath parses #play hash');
  assert(getViewFromPath('/random', '', '#card') === 'card', 'getViewFromPath parses #card hash');
  assert(getViewFromPath('/random', '', '#shop') === 'shop', 'getViewFromPath parses #shop hash');

  console.log('\n------------------------------------------------------');
  console.log(`TOTAL: ${stats.passed + stats.failed} | PASSED: ${stats.passed} | FAILED: ${stats.failed}`);
  console.log('------------------------------------------------------\n');

  if (stats.failed > 0) {
    process.exit(1);
  }
}

runTests();
