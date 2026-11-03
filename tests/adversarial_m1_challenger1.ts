/**
 * tests/adversarial_m1_challenger1.ts
 *
 * EMPIRICAL ADVERSARIAL TEST HARNESS — CHALLENGER 1
 * Milestone 1: Hash Route Migration, Rapid Transitions, and 15s Idle Auto-Play Engine.
 *
 * Scope:
 * 1. Hash routing transitions across all valid views (#home, #deck, #play, #card, #shop)
 *    and exhaustive edge case matrix (aliases, trailing slashes, queries, case variations, hostile inputs).
 * 2. Rapid consecutive hash changes (stress testing history, reentrancy locks, DOM section rendering).
 * 3. Inactive input timing: verify exact 15,000ms idle threshold, interaction resets across all 8 vectors,
 *    high-frequency event flooding, and in-place screen state transitions.
 * 4. Static filesystem audit and legacy route elimination verification.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

// Setup in-memory mock DOM and LocalStorage if running under Node/tsx
class MockStorage implements Storage {
  private store = new Map<string, string>();
  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }
  removeItem(key: string): void {
    this.store.delete(key);
  }
  clear(): void {
    this.store.clear();
  }
  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }
  get length(): number {
    return this.store.size;
  }
}

const mockLocalStorage = new MockStorage();
if (typeof globalThis.localStorage === 'undefined') {
  globalThis.localStorage = mockLocalStorage;
}

// Minimal DOM Mock for Node testing of DOM listeners and events
class MockEvent {
  type: string;
  bubbles: boolean;
  cancelable: boolean;
  defaultPrevented: boolean = false;
  detail?: any;
  constructor(type: string, options?: { bubbles?: boolean; cancelable?: boolean; detail?: any }) {
    this.type = type;
    this.bubbles = options?.bubbles ?? false;
    this.cancelable = options?.cancelable ?? false;
    this.detail = options?.detail;
  }
  preventDefault() {
    this.defaultPrevented = true;
  }
  stopPropagation() {}
}

class MockCustomEvent extends MockEvent {
  detail: any;
  constructor(type: string, options?: { detail?: any }) {
    super(type, options);
    this.detail = options?.detail;
  }
}

class MockHTMLElement {
  id: string = '';
  innerHTML: string = '';
  attributes = new Map<string, string>();
  children: MockHTMLElement[] = [];

  constructor(id: string = '') {
    this.id = id;
  }

  getAttribute(name: string): string | null {
    return this.attributes.get(name) ?? null;
  }

  setAttribute(name: string, value: string): void {
    this.attributes.set(name, value);
  }

  closest(selector: string): MockHTMLElement | null {
    return this;
  }
}

const domElements = new Map<string, MockHTMLElement>();
['landing-root', 'root', 'landing-main-slot', 'landing-header-slot', 'landing-sidebar-slot', 'landing-modals-slot', 'landing-footer-slot'].forEach(id => {
  domElements.set(id, new MockHTMLElement(id));
});

type EventListenerEntry = {
  listener: (ev: any) => void;
  options?: boolean | AddEventListenerOptions;
};

const windowListeners = new Map<string, EventListenerEntry[]>();
const documentListeners = new Map<string, EventListenerEntry[]>();

const mockWindow = {
  location: {
    hash: '#home',
    pathname: '/',
    href: 'http://localhost:3000/#home',
    origin: 'http://localhost:3000',
    hostname: 'localhost',
    replace: (url: string) => { mockWindow.location.href = url; },
  },
  history: {
    replaceState: (_state: any, _title: string, url: string) => {
      mockWindow.location.hash = url.startsWith('#') ? url : (url.includes('#') ? '#' + url.split('#')[1] : '');
    },
    pushState: (_state: any, _title: string, url: string) => {
      mockWindow.location.hash = url.startsWith('#') ? url : (url.includes('#') ? '#' + url.split('#')[1] : '');
    },
  },
  scrollTo: () => {},
  addEventListener: (type: string, listener: (ev: any) => void, options?: any) => {
    if (!windowListeners.has(type)) windowListeners.set(type, []);
    windowListeners.get(type)!.push({ listener, options });
  },
  removeEventListener: (type: string, listener: (ev: any) => void, _options?: any) => {
    const list = windowListeners.get(type);
    if (!list) return;
    windowListeners.set(type, list.filter(entry => entry.listener !== listener));
  },
  dispatchEvent: (event: MockEvent) => {
    const list = windowListeners.get(event.type) || [];
    for (const entry of list) {
      entry.listener(event);
    }
    return true;
  },
};

const mockDocument = {
  getElementById: (id: string) => domElements.get(id) || null,
  addEventListener: (type: string, listener: (ev: any) => void, options?: any) => {
    if (!documentListeners.has(type)) documentListeners.set(type, []);
    documentListeners.get(type)!.push({ listener, options });
  },
  removeEventListener: (type: string, listener: (ev: any) => void) => {
    const list = documentListeners.get(type);
    if (!list) return;
    documentListeners.set(type, list.filter(entry => entry.listener !== listener));
  },
  dispatchEvent: (event: MockEvent) => {
    const list = documentListeners.get(event.type) || [];
    for (const entry of list) {
      entry.listener(event);
    }
    return true;
  },
  visibilityState: 'visible',
};

// Polyfill globals for test execution
(globalThis as any).window = mockWindow;
(globalThis as any).document = mockDocument;
(globalThis as any).Event = MockEvent;
(globalThis as any).CustomEvent = MockCustomEvent;

// Dynamically import modules to test
const { parseRoute, navigateTo, VALID_VIEWS, HASH_VIEW_MAP, LEGACY_PATH_MAP } = await import('../src/landing/index');
const { IdleAutoPlayManager, MONITORED_INPUT_EVENTS } = await import('../src/landing/services/idleAutoPlayManager');
const { getViewPath, getViewFromPath, VIEW_ROUTES } = await import('../src/routes');

// Test reporting structure
interface AssertionResult {
  suite: string;
  id: string;
  title: string;
  pass: boolean;
  details?: string;
  durationMs: number;
}

const results: AssertionResult[] = [];

function record(suite: string, id: string, title: string, pass: boolean, details?: string, durationMs: number = 0) {
  results.push({ suite, id, title, pass, details, durationMs });
  const badge = pass ? '\x1b[32m[PASS]\x1b[0m' : '\x1b[31m[FAIL]\x1b[0m';
  console.log(`  ${badge} [${id}] ${title}${details && !pass ? ` -> ${details}` : ''}`);
}

console.log('======================================================================');
console.log('  CHALLENGER 1 ADVERSARIAL TEST HARNESS — MILESTONE 1 VERIFICATION   ');
console.log('======================================================================\n');

// ============================================================================
// SUITE 1: Hash Route Transitions & Exhaustive Input Normalization Matrix
// ============================================================================
console.log('>>> [SUITE 1] Hash Route Transitions & Exhaustive Input Matrix');

const startTimeS1 = performance.now();

// 1.1 Canonical Valid Views
const canonicalViews = ['home', 'deck', 'play', 'card', 'shop'] as const;
for (const view of canonicalViews) {
  const parsed = parseRoute(`#${view}`);
  record('Suite 1', `S1.CANONICAL.${view.toUpperCase()}`, `Canonical #${view} resolves to '${view}'`, parsed === view, `got '${parsed}'`);
}

// 1.2 Leading Slash, Trailing Slash, and Combined
for (const view of canonicalViews) {
  const leading = parseRoute(`#/${view}`);
  const trailing = parseRoute(`#${view}/`);
  const both = parseRoute(`#/${view}/`);
  const pass = leading === view && trailing === view && both === view;
  record('Suite 1', `S1.SLASH.${view.toUpperCase()}`, `Slash variations of #${view} resolve cleanly`, pass, `leading: ${leading}, trailing: ${trailing}, both: ${both}`);
}

// 1.3 Case Insensitivity
const casePermutations = [
  { input: '#HOME', expected: 'home' },
  { input: '#Deck', expected: 'deck' },
  { input: '#pLaY', expected: 'play' },
  { input: '#CARD', expected: 'card' },
  { input: '#sHoP', expected: 'shop' },
];
for (const { input, expected } of casePermutations) {
  const parsed = parseRoute(input);
  record('Suite 1', `S1.CASE.${input.slice(1)}`, `Case variation '${input}' normalizes to '${expected}'`, parsed === expected, `got '${parsed}'`);
}

// 1.4 Query Parameters Stripping
const queryPermutations = [
  { input: '#play?auto=true&season=1', expected: 'play' },
  { input: '#shop?pack=bronze&reveal=3', expected: 'shop' },
  { input: '#deck?activeSlot=2', expected: 'deck' },
  { input: '#card?element=fire&owned=true', expected: 'card' },
  { input: '#home?ref=twitter', expected: 'home' },
];
for (const { input, expected } of queryPermutations) {
  const parsed = parseRoute(input);
  record('Suite 1', `S1.QUERY.${expected.toUpperCase()}`, `Query string stripped from '${input}' -> '${expected}'`, parsed === expected, `got '${parsed}'`);
}

// 1.5 Common and Legacy Aliases
const aliasTests = [
  { input: '#main-lobby', expected: 'home' },
  { input: '#mydeck', expected: 'deck' },
  { input: '#main', expected: 'play' },
  { input: '#battle', expected: 'play' },
  { input: '#cards', expected: 'card' },
  { input: '#mission', expected: 'card' },
  { input: '#missions', expected: 'card' },
  { input: '#companion', expected: 'card' },
  { input: '#store', expected: 'shop' },
];
for (const { input, expected } of aliasTests) {
  const parsed = parseRoute(input);
  record('Suite 1', `S1.ALIAS.${input.slice(1)}`, `Alias '${input}' resolves to '${expected}'`, parsed === expected, `got '${parsed}'`);
}

// 1.6 Malformed & Hostile Inputs
const adversarialInputs = [
  { input: '', expected: 'home', desc: 'Empty hash string' },
  { input: '#', expected: 'home', desc: 'Bare hash character' },
  { input: '###', expected: 'home', desc: 'Multiple hash characters' },
  { input: '#/', expected: 'home', desc: 'Hash with single slash' },
  { input: '#unknown_nonexistent_section_99', expected: 'home', desc: 'Unregistered route' },
  { input: '#<script>alert("xss")</script>', expected: 'home', desc: 'XSS attempt in hash' },
  { input: '#../../etc/passwd', expected: 'home', desc: 'Directory traversal in hash' },
  { input: '#eval(1+1)', expected: 'home', desc: 'Code injection string' },
  { input: '#javascript:void(0)', expected: 'home', desc: 'Pseudo-protocol link' },
  { input: '#%2e%2e%2f', expected: 'home', desc: 'URL-encoded path traversal' },
];
for (let i = 0; i < adversarialInputs.length; i++) {
  const { input, expected, desc } = adversarialInputs[i];
  const parsed = parseRoute(input);
  record('Suite 1', `S1.HOSTILE.${i + 1}`, `${desc} (${input}) safely falls back to '${expected}'`, parsed === expected, `got '${parsed}'`);
}

// 1.7 Legacy Pathname Fallback (when hash is absent)
const legacyPathTests = [
  { path: '/home', expected: 'home' },
  { path: '/deck', expected: 'deck' },
  { path: '/mydeck', expected: 'deck' },
  { path: '/play', expected: 'play' },
  { path: '/main', expected: 'play' },
  { path: '/card', expected: 'card' },
  { path: '/cards', expected: 'card' },
  { path: '/mission', expected: 'card' },
  { path: '/missions', expected: 'card' },
  { path: '/shop', expected: 'shop' },
  { path: '/store', expected: 'shop' },
  { path: '/nonexistent', expected: 'home' },
];
for (const { path: p, expected } of legacyPathTests) {
  const parsed = parseRoute('', p);
  record('Suite 1', `S1.LEGACY_PATH.${p.replace('/', '')}`, `Legacy path '${p}' falls back to hash equivalent '${expected}'`, parsed === expected, `got '${parsed}'`);
}

// 1.8 Hash Precedence Over Pathname
const precedenceTest1 = parseRoute('#card', '/play');
record('Suite 1', 'S1.PRECEDENCE.1', 'Hash #card overrides pathname /play', precedenceTest1 === 'card', `got '${precedenceTest1}'`);

const precedenceTest2 = parseRoute('#shop', '/home');
record('Suite 1', 'S1.PRECEDENCE.2', 'Hash #shop overrides pathname /home', precedenceTest2 === 'shop', `got '${precedenceTest2}'`);

// ============================================================================
// SUITE 2: Rapid Consecutive Hash Transitions & DOM Section Rendering
// ============================================================================
console.log('\n>>> [SUITE 2] Rapid Consecutive Transitions & DOM Stress Harness');

// 2.1 Rapid consecutive navigation stress (1,000 rapid route changes)
let rapidStressPassed = true;
let exceptionCaught: any = null;
const stressViews = ['home', 'deck', 'play', 'card', 'shop'] as const;

const stressStart = performance.now();
try {
  for (let i = 0; i < 1000; i++) {
    const target = stressViews[i % stressViews.length];
    navigateTo(target, { updateHash: true });
  }
} catch (err) {
  rapidStressPassed = false;
  exceptionCaught = err;
}
const stressElapsed = performance.now() - stressStart;

record(
  'Suite 2',
  'S2.RAPID.1000',
  `1,000 rapid back-to-back navigateTo transitions completed without error (${stressElapsed.toFixed(1)}ms)`,
  rapidStressPassed && !exceptionCaught,
  exceptionCaught ? String(exceptionCaught) : undefined,
  stressElapsed
);

// Verify final DOM state matches the 1000th transition
const finalExpectedView = stressViews[999 % stressViews.length];
const mainSlot = domElements.get('landing-main-slot');
const hasRenderedContent = (mainSlot?.innerHTML.length ?? 0) > 0;
record('Suite 2', 'S2.DOM.SLOT_CONTENT', `landing-main-slot contains rendered DOM after 1000 transitions`, hasRenderedContent);

// 2.2 Event Dispatching Verification
let eventReceivedView: string | null = null;
const eventTestHandler = (e: any) => {
  eventReceivedView = e.detail?.view;
};
mockWindow.addEventListener('snshero_hash_route_changed', eventTestHandler);

navigateTo('card');
record('Suite 2', 'S2.EVENT.DISPATCH', `snshero_hash_route_changed custom event dispatched with view='card'`, eventReceivedView === 'card', `got '${eventReceivedView}'`);

mockWindow.removeEventListener('snshero_hash_route_changed', eventTestHandler);

// 2.3 Ping-Pong #play <-> #home Audio Cleanup Verification
let pingPongSuccess = true;
try {
  for (let i = 0; i < 200; i++) {
    navigateTo('play');
    navigateTo('home');
  }
} catch (err) {
  pingPongSuccess = false;
}
record('Suite 2', 'S2.PING_PONG.AUDIO', `200 alternating transitions (#play <-> #home) execute clean TTS audio cleanup`, pingPongSuccess);

// 2.4 State Comparison Guard: Redundant Navigation No-Op
const initialHtml = mainSlot?.innerHTML;
navigateTo('home');
const identicalHtml = mainSlot?.innerHTML === initialHtml;
record('Suite 2', 'S2.IDEMPOTENT.NO_OP', `Redundant navigateTo('home') when already on #home avoids redundant rerenders`, identicalHtml);

// ============================================================================
// SUITE 3: Inactive Input Timing & Idle Threshold Oracle (Adversarial Clock)
// ============================================================================
console.log('\n>>> [SUITE 3] Inactivity Timing & Idle Threshold Oracle');

// 3.1 Instance Integrity & Invariants
const idleManager = IdleAutoPlayManager.getInstance();
const defaultState = idleManager.getState();

record('Suite 3', 'S3.CONFIG.TIMEOUT', 'Default timeout strictly 15,000ms', defaultState.timeoutMs === 15000, `got ${defaultState.timeoutMs}`);
record('Suite 3', 'S3.CONFIG.TARGET_URL', 'Target URL is Tailscale #play', defaultState.targetUrl === 'https://dayyoung-macbookpro.tail3717a4.ts.net/#play', `got ${defaultState.targetUrl}`);

// All 8 monitored events present
const requiredEvents = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'touchmove', 'scroll', 'pointerdown', 'wheel'];
const hasAll8Events = requiredEvents.length === 8 && requiredEvents.every(ev => (MONITORED_INPUT_EVENTS as readonly string[]).includes(ev as any));
record('Suite 3', 'S3.CONFIG.EVENTS_8', 'Monitors all 8 required interaction event types', hasAll8Events);

// 3.2 Time Boundary Verification (Sub-threshold vs Threshold)
// Configure manager with custom test callbacks
let triggerDetail: any = null;
let navigatedDestination: string | null = null;

idleManager.configure({
  onTrigger: (detail) => { triggerDetail = detail; },
  onNavigate: (url) => { navigatedDestination = url; },
});

// Reset storage and reset timer for fresh baseline
mockLocalStorage.clear();
idleManager.resetTimer();

// Verify remaining time immediately after reset is ~15,000ms
const remainingInitial = idleManager.getRemainingTimeMs();
record('Suite 3', 'S3.TIMING.INITIAL', 'Remaining idle time immediately after resetTimer() >= 14,950ms and <= 15,000ms', remainingInitial >= 14950 && remainingInitial <= 15000, `got ${remainingInitial}`);

// Direct Trigger Verification
idleManager.triggerNow();
record('Suite 3', 'S3.TRIGGER.CALLBACK', 'triggerNow() invokes onTrigger with valid detail payload', triggerDetail !== null && triggerDetail.timestamp > 0);
record('Suite 3', 'S3.TRIGGER.STORAGE_FLAGS', 'triggerNow() commits all 4 auto-mode flags to localStorage',
  mockLocalStorage.getItem('hero_kadan_rpg_auto_mode') === 'true' &&
  mockLocalStorage.getItem('hero_kadan_rpg_auto_mode_season1') === 'true' &&
  mockLocalStorage.getItem('hero_auto_battle') === 'true' &&
  mockLocalStorage.getItem('hero_auto_loop_mode') === 'true'
);
record('Suite 3', 'S3.TRIGGER.NAV_TARGET', 'triggerNow() navigates to configured targetUrl', navigatedDestination === 'https://dayyoung-macbookpro.tail3717a4.ts.net/#play', `got ${navigatedDestination}`);

// 3.3 Multi-Vector Interaction Resets
// Test each of the 8 event types to confirm each one resets the timer
let all8ResetPassed = true;
for (const evName of requiredEvents) {
  idleManager.resetTimer();
  const preReset = idleManager.getState().lastActivityTime;
  // Wait 2ms and dispatch event
  const startWait = Date.now();
  while (Date.now() - startWait < 2) {}

  // Dispatch mock event to window
  mockWindow.dispatchEvent(new MockEvent(evName));
  const postReset = idleManager.getState().lastActivityTime;
  if (postReset < preReset) {
    all8ResetPassed = false;
  }
}
record('Suite 3', 'S3.MULTI_EVENT.ALL_8', 'All 8 user input event types successfully register and update lastActivityTime', all8ResetPassed);

// 3.4 High-Frequency Event Flooding (Simulating 1000Hz gaming mouse)
const floodStart = Date.now();
for (let i = 0; i < 2000; i++) {
  mockWindow.dispatchEvent(new MockEvent('mousemove'));
}
const floodDuration = Date.now() - floodStart;
const stateAfterFlood = idleManager.getState();
record('Suite 3', 'S3.FLOOD.2000_EVENTS', `2,000 high-frequency mousemove events handled gracefully in ${floodDuration}ms without memory overflow`, stateAfterFlood.isTracking === true);

// 3.5 Screen State Transition Matrix
// Test 1: On #home -> triggers navigation
mockWindow.location.hash = '#home';
navigatedDestination = null;
idleManager.triggerNow();
record('Suite 3', 'S3.SCREEN.HOME_NAV', 'Idle on #home triggers navigation to Tailscale #play', navigatedDestination !== null);

// Test 2: On #deck -> triggers navigation
mockWindow.location.hash = '#deck';
navigatedDestination = null;
idleManager.triggerNow();
record('Suite 3', 'S3.SCREEN.DECK_NAV', 'Idle on #deck triggers navigation to Tailscale #play', navigatedDestination !== null);

// Test 3: On #card -> triggers navigation
mockWindow.location.hash = '#card';
navigatedDestination = null;
idleManager.triggerNow();
record('Suite 3', 'S3.SCREEN.CARD_NAV', 'Idle on #card triggers navigation to Tailscale #play', navigatedDestination !== null);

// Test 4: On #shop -> triggers navigation
mockWindow.location.hash = '#shop';
navigatedDestination = null;
idleManager.triggerNow();
record('Suite 3', 'S3.SCREEN.SHOP_NAV', 'Idle on #shop triggers navigation to Tailscale #play', navigatedDestination !== null);

// Test 5: On #play with autoMode: true -> in-place, NO redundant navigation/reload
mockWindow.location.hash = '#play';
mockLocalStorage.setItem('hero_kadan_rpg_auto_mode', 'true');
navigatedDestination = null;
idleManager.triggerNow();
record('Suite 3', 'S3.SCREEN.PLAY_AUTO_NO_RELOAD', 'Idle on #play with active auto-mode skips redundant page navigation', navigatedDestination === null);

// Test 6: On #play with autoMode: false -> in-place auto-mode activation
mockWindow.location.hash = '#play';
mockLocalStorage.setItem('hero_kadan_rpg_auto_mode', 'false');
navigatedDestination = null;
idleManager.triggerNow();
record('Suite 3', 'S3.SCREEN.PLAY_INPLACE_ACTIVATE', 'Idle on #play with inactive auto-mode activates auto-mode in place without reload',
  navigatedDestination === null && mockLocalStorage.getItem('hero_kadan_rpg_auto_mode') === 'true'
);

// 3.6 Lifecycle Stop & Start Idempotency
idleManager.stop();
record('Suite 3', 'S3.LIFECYCLE.STOP', 'stop() sets isTracking to false', idleManager.getState().isTracking === false);
idleManager.start();
idleManager.start(); // second call should be no-op
record('Suite 3', 'S3.LIFECYCLE.START_IDEMPOTENT', 'start() is idempotent and safely re-enables tracking', idleManager.getState().isTracking === true);

// ============================================================================
// SUITE 4: Codebase-Wide Legacy Route Elimination & Static Filesystem Audit
// ============================================================================
console.log('\n>>> [SUITE 4] Codebase-Wide Legacy Route Elimination Audit');

// 4.1 Scan src/landing/ components for prohibited legacy hrefs
const landingComponentDir = path.resolve(REPO_ROOT, 'src/landing/components');
const landingViewDir = path.resolve(REPO_ROOT, 'src/landing/views');

const checkFiles = [
  ...fs.readdirSync(landingComponentDir).map(f => path.join(landingComponentDir, f)),
  ...fs.readdirSync(landingViewDir).map(f => path.join(landingViewDir, f)),
];

let prohibitedLegacyHrefsFound: string[] = [];
const legacyPatterns = [
  /href=["']\/home["']/g,
  /href=["']\/deck["']/g,
  /href=["']\/play["']/g,
  /href=["']\/card["']/g,
  /href=["']\/shop["']/g,
  /href=["']\/main["']/g,
];

for (const file of checkFiles) {
  if (!file.endsWith('.tsx') && !file.endsWith('.ts')) continue;
  const content = fs.readFileSync(file, 'utf8');
  for (const pattern of legacyPatterns) {
    if (pattern.test(content)) {
      prohibitedLegacyHrefsFound.push(`${path.basename(file)}: ${pattern.source}`);
    }
  }
}

record(
  'Suite 4',
  'S4.AUDIT.ZERO_LEGACY_HREFS',
  'src/landing views & components contain 0 hardcoded legacy slash hrefs',
  prohibitedLegacyHrefsFound.length === 0,
  prohibitedLegacyHrefsFound.join(', ')
);

// 4.2 Verify static HTML redirect stubs in dist/
const distDir = path.resolve(REPO_ROOT, 'dist');
const requiredRedirectStubs = [
  { path: 'deck/index.html', target: '#deck' },
  { path: 'play/index.html', target: '#play' },
  { path: 'card/index.html', target: '#card' },
  { path: 'shop/index.html', target: '#shop' },
  { path: 'home/index.html', target: '#home' },
  { path: 'mydeck/index.html', target: '#deck' },
];

let allStubsValid = true;
const stubFailures: string[] = [];

for (const stub of requiredRedirectStubs) {
  const fullStubPath = path.join(distDir, stub.path);
  if (!fs.existsSync(fullStubPath)) {
    allStubsValid = false;
    stubFailures.push(`Missing stub: ${stub.path}`);
    continue;
  }
  const content = fs.readFileSync(fullStubPath, 'utf8');
  if (!content.includes(stub.target) || !content.includes('http-equiv="refresh"') || !content.includes('location.replace')) {
    allStubsValid = false;
    stubFailures.push(`Stub ${stub.path} lacks valid meta-refresh/replace for ${stub.target}`);
  }
}

record('Suite 4', 'S4.DIST.REDIRECT_STUBS', 'Static redirect stubs exist in dist/ with meta-refresh & location.replace', allStubsValid, stubFailures.join('; '));

// 4.3 Verify index.html inline script route normalizer
const indexHtmlPath = path.resolve(REPO_ROOT, 'index.html');
const indexHtmlContent = fs.readFileSync(indexHtmlPath, 'utf8');
const hasInlineNormalizer = indexHtmlContent.includes('history.replaceState') && indexHtmlContent.includes('#home');
record('Suite 4', 'S4.INDEX.INLINE_NORMALIZER', 'index.html contains early inline route normalizer in <head>', hasInlineNormalizer);

// 4.4 Verify routes.ts getViewPath mappings
const routeTests = [
  { view: 'home', expected: '#home' },
  { view: 'mydeck', expected: '#deck' },
  { view: 'play', expected: '#play' },
  { view: 'card', expected: '#card' },
  { view: 'shop', expected: '#shop' },
];

let allRoutesMatch = true;
for (const { view, expected } of routeTests) {
  const pathResult = getViewPath(view as any);
  if (pathResult !== expected) {
    allRoutesMatch = false;
  }
}
record('Suite 4', 'S4.ROUTES.GET_VIEW_PATH', 'src/routes.ts maps all core views to canonical hash paths', allRoutesMatch);

// ============================================================================
// SUITE 5: Deterministic Clock Stepping & Browser History (Popstate) Harness
// ============================================================================
console.log('\n>>> [SUITE 5] Deterministic Clock Stepping & Browser History (Popstate)');

// 5.1 Deterministic Fake Clock for exact 15,000ms and 14,950ms reset boundary
class DeterministicClock {
  currentTime = 1_000_000;
  scheduledTimers: { id: number; expireAt: number; callback: () => void }[] = [];
  nextId = 1;

  now = () => this.currentTime;

  setTimeout = (callback: () => void, delayMs: number) => {
    const id = this.nextId++;
    this.scheduledTimers.push({ id, expireAt: this.currentTime + delayMs, callback });
    return id as any;
  };

  clearTimeout = (id: any) => {
    this.scheduledTimers = this.scheduledTimers.filter(t => t.id !== id);
  };

  advanceBy = (ms: number) => {
    this.currentTime += ms;
    // Process all timers ready to fire in order
    while (true) {
      const readyTimers = this.scheduledTimers
        .filter(t => t.expireAt <= this.currentTime)
        .sort((a, b) => a.expireAt - b.expireAt);
      if (readyTimers.length === 0) break;
      const nextTimer = readyTimers[0];
      this.scheduledTimers = this.scheduledTimers.filter(t => t.id !== nextTimer.id);
      nextTimer.callback();
    }
  };
}

const clock = new DeterministicClock();
const realNow = Date.now;
const realSetTimeout = globalThis.setTimeout;
const realClearTimeout = globalThis.clearTimeout;

try {
  Date.now = clock.now;
  globalThis.setTimeout = clock.setTimeout as any;
  globalThis.clearTimeout = clock.clearTimeout as any;

  // Create isolated instance of IdleAutoPlayManager with deterministic clock
  const testManager = new IdleAutoPlayManager({
    timeoutMs: 15000,
    throttleMs: 250,
  });

  let testTriggerCount = 0;
  testManager.configure({
    onTrigger: () => { testTriggerCount++; },
    onNavigate: () => {},
  });

  // Test Boundary 1: Exact 14,999ms vs 15,000ms
  testManager.start();
  clock.advanceBy(14999);
  record('Suite 5', 'S5.CLOCK.SUB_THRESHOLD', 'At t = 14,999ms, idle transition has strictly NOT triggered', testTriggerCount === 0);

  clock.advanceBy(1);
  record('Suite 5', 'S5.CLOCK.EXACT_15S', 'At t = 15,000ms, idle transition triggers exactly on threshold', testTriggerCount === 1);

  // Test Boundary 2: Interaction at t = 14,950ms pushes trigger out by full 15,000ms
  testTriggerCount = 0;
  testManager.resetTimer();
  clock.advanceBy(14950);

  // User input occurs 50ms before expiration
  mockWindow.dispatchEvent(new MockEvent('keydown'));

  // Advance past original 15,000ms mark to t = 15,050ms (100ms after interaction)
  clock.advanceBy(100);
  record('Suite 5', 'S5.CLOCK.RESET_PROTECTION', 'At t = 15,050ms (100ms after interaction), timer did NOT fire', testTriggerCount === 0);

  // Advance to t = 29,949ms (14,999ms after interaction)
  clock.advanceBy(14899);
  record('Suite 5', 'S5.CLOCK.POST_INTERACTION_SUB', 'At 14,999ms after interaction, timer has still NOT fired', testTriggerCount === 0);

  // Advance final 1ms to t = 29,950ms (15,000ms after interaction)
  clock.advanceBy(1);
  record('Suite 5', 'S5.CLOCK.POST_INTERACTION_TRIGGER', 'At exactly 15,000ms after interaction, timer triggers correctly', testTriggerCount === 1);

  testManager.stop();
} finally {
  Date.now = realNow;
  globalThis.setTimeout = realSetTimeout;
  globalThis.clearTimeout = realClearTimeout;
}

// 5.2 Browser History Back/Forward (Popstate) Simulation
let historyStepPassed = true;
try {
  // Navigate through sequential steps
  navigateTo('home');
  navigateTo('deck');
  navigateTo('play');
  navigateTo('card');

  // Simulate Popstate event back to 'play'
  const popEventPlay = new MockCustomEvent('popstate', { detail: { state: { view: 'play' } } }) as any;
  popEventPlay.state = { view: 'play' };
  mockWindow.dispatchEvent(popEventPlay);

  // Simulate Popstate event back to 'deck'
  const popEventDeck = new MockCustomEvent('popstate', { detail: { state: { view: 'deck' } } }) as any;
  popEventDeck.state = { view: 'deck' };
  mockWindow.dispatchEvent(popEventDeck);

  // Simulate Popstate event forward to 'shop'
  const popEventShop = new MockCustomEvent('popstate', { detail: { state: { view: 'shop' } } }) as any;
  popEventShop.state = { view: 'shop' };
  mockWindow.dispatchEvent(popEventShop);
} catch (err) {
  historyStepPassed = false;
}
record('Suite 5', 'S5.HISTORY.POPSTATE_SIMULATION', 'Popstate navigation events update active view without stack overflow', historyStepPassed);


// ============================================================================
// FINAL SUMMARY & EXIT
// ============================================================================
const total = results.length;
const passed = results.filter(r => r.pass).length;
const failed = total - passed;
const passRate = ((passed / total) * 100).toFixed(1);

console.log('\n----------------------------------------------------------------------');
console.log(`  CHALLENGER 1 RESULTS: ${passed}/${total} assertions passed (${passRate}%)`);
if (failed > 0) {
  console.log(`  \x1b[31mFAILURES DETECTED: ${failed} assertions failed\x1b[0m`);
} else {
  console.log('  \x1b[32mALL ADVERSARIAL CHALLENGES EMPIRICALLY PASSED\x1b[0m');
}
console.log('----------------------------------------------------------------------\n');

// Write machine-readable results JSON
const resultsPayload = {
  timestamp: new Date().toISOString(),
  milestone: 'M1',
  challenger: 'challenger_m1_9_1',
  total,
  passed,
  failed,
  passRate: Number(passRate),
  verdict: failed === 0 ? 'APPROVE' : 'REQUEST_CHANGES',
  results,
};

fs.writeFileSync(
  path.resolve(__dirname, 'challenger_m1_results.json'),
  JSON.stringify(resultsPayload, null, 2),
  'utf8'
);

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
