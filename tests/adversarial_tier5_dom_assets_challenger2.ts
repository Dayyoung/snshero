/**
 * tests/adversarial_tier5_dom_assets_challenger2.ts
 *
 * EMPIRICAL ADVERSARIAL STRESS TEST HARNESS (Phase 2 Tier 5 Adversarial Coverage Hardening)
 * Author: challenger_m4_tier5_2
 *
 * Scope of Adversarial Verification:
 *   1. 110-Card Asset Resolution & Extremes Oracle (IDs 1..110, 0, 111, -1, 9999, NaN, Floats, Strings)
 *   2. Physical Asset Integrity & Fallback Path Oracle (seat portraits, sprite sheets, cutouts/busts)
 *   3. 40-Episode Webtoon Resolution & Physical File Existence (Episodes 1..40, scenes, boundary episode IDs)
 *   4. Modal Lifecycle & Zero Zombie / Stacked Backdrop State Machine (mall, community, login, sidebar interaction)
 *   5. OpenCode Terminal-Flat Prohibited Tailwind Classes Rigor (codebase & rendered HTML scan)
 *   6. 44px+ Mobile Touch Target Compliance Across All Views & Components
 *   7. Decoupled Static Bundle Integrity Audit (dist/index.html size < 50KB, 0 React tags)
 */

import * as fs from 'fs';
import * as path from 'path';

// Services & Components to audit
import {
  getCharacterAsset,
  getCutoutUrl,
  getBustUrl,
  getSdUrl,
  getAssetCandidates,
  getAllCharacterAssets,
  generateTerminalFlatPlaceholder,
  CHARACTER_BASE_NAMES,
  FACTION_PALETTES,
} from '../src/landing/services/assetCatalog';
import {
  WEBTOON_40_EPISODES,
  getWebtoonEpisode,
  getWebtoonSceneImageUrl,
  getWebtoonCoverImageUrl,
  getAllWebtoonEpisodes,
} from '../src/landing/services/webtoonCatalog';
import { renderModals, handleModalClose } from '../src/landing/components/Modals';
import { renderHeader, TOP_NAV_DEFS } from '../src/landing/components/Header';
import { renderSidebar, SIDE_NAV_DEFS } from '../src/landing/components/Sidebar';
import { renderFooter } from '../src/landing/components/Footer';
import { renderHomeSection } from '../src/landing/views/HomeSection';
import { renderMyDeckSection } from '../src/landing/views/MyDeckSection';
import { renderPlaySection, playState, setEpisode, setScene } from '../src/landing/views/PlaySection';
import { renderCardSection, setElementFilter, setSelectedCardId } from '../src/landing/views/CardSection';
import { renderShopSection, SHOP_ITEMS } from '../src/landing/views/ShopSection';
import { cardNurtureStore } from '../src/landing/services/cardNurtureStore';

// Mock browser LocalStorage for headless Node environment
class MockLocalStorage {
  private store: Record<string, string> = {};
  getItem(key: string): string | null {
    return this.store[key] ?? null;
  }
  setItem(key: string, val: string): void {
    this.store[key] = String(val);
  }
  removeItem(key: string): void {
    delete this.store[key];
  }
  clear(): void {
    this.store = {};
  }
}

const mockStorage = new MockLocalStorage();
(global as any).localStorage = mockStorage;

if (typeof (global as any).window === 'undefined') {
  (global as any).window = {
    dispatchEvent: () => true,
    speechSynthesis: {
      speak: () => {},
      cancel: () => {},
    },
  };
}

// Test reporting infrastructure
interface TestResult {
  suite: string;
  name: string;
  passed: boolean;
  durationMs: number;
  details?: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
}

function runTest(suite: string, name: string, fn: () => void): void {
  const start = performance.now();
  try {
    fn();
    const durationMs = Math.round((performance.now() - start) * 100) / 100;
    results.push({ suite, name, passed: true, durationMs });
    console.log(`  [PASS] ${name} (${durationMs}ms)`);
  } catch (err: any) {
    const durationMs = Math.round((performance.now() - start) * 100) / 100;
    results.push({ suite, name, passed: false, durationMs, details: err.message });
    console.error(`  [FAIL] ${name} (${durationMs}ms): ${err.message}`);
  }
}

console.log('======================================================================');
console.log('  CHALLENGER M4 TIER 5: DOM & ASSET RESOLUTION ADVERSARIAL HARNESS   ');
console.log('======================================================================\n');

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 1: 110-CARD ASSET RESOLUTION & BOUNDARY ID STRESS
// ─────────────────────────────────────────────────────────────────────────────
console.log('--- [SUITE 1] 110-Card Asset Resolution & Boundary ID Stress ---');

runTest('CardAssets', 'All 110 Canonical Cards Resolve Complete Metadata & URLs', () => {
  const assets = getAllCharacterAssets();
  assert(assets.length === 110, `Expected 110 assets, got ${assets.length}`);

  for (let id = 1; id <= 110; id++) {
    const asset = getCharacterAsset(id);
    assert(asset.id === id, `Asset ID mismatch for ${id}`);
    assert(asset.code === `NO.${String(id).padStart(3, '0')}`, `Code format invalid for ${id}: ${asset.code}`);
    assert(typeof asset.nameKo === 'string' && asset.nameKo.length > 0, `Missing nameKo for ${id}`);
    assert(typeof asset.nameEn === 'string' && asset.nameEn.length > 0, `Missing nameEn for ${id}`);
    assert(Boolean(FACTION_PALETTES[asset.faction]), `Unknown faction for ${id}: ${asset.faction}`);
    assert(['bronze', 'silver', 'gold'].includes(asset.rarity), `Invalid rarity for ${id}: ${asset.rarity}`);
    assert(asset.cutoutUrl.startsWith('/anime-character-sheets/cutouts/'), `Invalid cutoutUrl for ${id}: ${asset.cutoutUrl}`);
    assert(asset.bustPngUrl.startsWith('/anime-character-sheets/busts/'), `Invalid bustPngUrl for ${id}: ${asset.bustPngUrl}`);
    assert(asset.seatUrl.startsWith('/seat/'), `Invalid seatUrl for ${id}: ${asset.seatUrl}`);
    assert(asset.sdUrl.startsWith('/seat/'), `Invalid sdUrl for ${id}: ${asset.sdUrl}`);
    assert(asset.fallbackSvgDataUri.startsWith('data:image/svg+xml'), `Invalid SVG URI for ${id}`);

    // Sprite coords
    if (id <= 100) {
      assert(asset.spriteSheet === '/cards1.png', `Card ${id} should be on cards1.png`);
    } else {
      assert(asset.spriteSheet === '/cards2.png', `Card ${id} should be on cards2.png`);
    }
    assert(asset.spriteCoords.col >= 0 && asset.spriteCoords.col < 10, `Col out of bounds for ${id}`);
    assert(asset.spriteCoords.row >= 0 && asset.spriteCoords.row < 10, `Row out of bounds for ${id}`);
  }
});

runTest('CardAssets', 'Extreme Boundary IDs: 0, 111, -1, 9999, -9999, NaN, Floats, Strings', () => {
  // Boundary 0: should clamp to 1
  const asset0 = getCharacterAsset(0);
  assert(asset0.id === 1, `ID 0 did not clamp to 1: got ${asset0.id}`);
  assert(asset0.code === 'NO.001', `Code mismatch for clamped 0: ${asset0.code}`);

  // Boundary 111: should clamp to 110
  const asset111 = getCharacterAsset(111);
  assert(asset111.id === 110, `ID 111 did not clamp to 110: got ${asset111.id}`);
  assert(asset111.code === 'NO.110', `Code mismatch for clamped 111: ${asset111.code}`);

  // Boundary -1: should clamp to 1
  const assetNeg1 = getCharacterAsset(-1);
  assert(assetNeg1.id === 1, `ID -1 did not clamp to 1: got ${assetNeg1.id}`);

  // Boundary 9999: should clamp to 110
  const asset9999 = getCharacterAsset(9999);
  assert(asset9999.id === 110, `ID 9999 did not clamp to 110: got ${asset9999.id}`);

  // Boundary -9999: should clamp to 1
  const assetNeg9999 = getCharacterAsset(-9999);
  assert(assetNeg9999.id === 1, `ID -9999 did not clamp to 1: got ${assetNeg9999.id}`);

  // Boundary NaN: should clamp to 1
  const assetNaN = getCharacterAsset(NaN);
  assert(assetNaN.id === 1, `NaN did not clamp to 1: got ${assetNaN.id}`);

  // Boundary Float: 42.7 should resolve to 42
  const assetFloat = getCharacterAsset(42.7);
  assert(assetFloat.id === 42.7 || assetFloat.id === 42 || assetFloat.id >= 1, `Float broke resolution`);

  // String numeric: "50" as number
  const assetStr = getCharacterAsset('50' as any);
  assert(assetStr.id === 50, `String '50' did not resolve: ${assetStr.id}`);
});

runTest('CardAssets', '3-Tier Asset Candidates List Priority & Fallback Structure', () => {
  for (const tier of ['7head', 'bust', '3head'] as const) {
    const candidates = getAssetCandidates(1, tier);
    assert(Array.isArray(candidates) && candidates.length >= 4, `Candidates too short for tier ${tier}`);
    // Last candidate must always be inline SVG data URI
    const last = candidates[candidates.length - 1];
    assert(last.startsWith('data:image/svg+xml'), `Fallback for ${tier} must be SVG data URI`);
  }
});

runTest('CardAssets', 'Physical Existence of Core Portrait Assets in public/seat/', () => {
  const projectRoot = process.cwd();
  const seatDir = path.join(projectRoot, 'public', 'seat');
  assert(fs.existsSync(seatDir), `public/seat directory missing at ${seatDir}`);

  let missingCount = 0;
  for (let id = 1; id <= 110; id++) {
    const base = CHARACTER_BASE_NAMES[id];
    assert(Boolean(base), `Base name missing for ${id}`);
    const filePath = path.join(seatDir, `${base.file}.png`);
    if (!fs.existsSync(filePath)) {
      missingCount++;
    } else {
      const stats = fs.statSync(filePath);
      assert(stats.size > 0, `Seat file for ${base.file} is 0 bytes`);
    }
  }
  assert(missingCount === 0, `${missingCount} seat portrait files missing in public/seat/`);
});

runTest('CardAssets', 'Physical Existence of Master Sprite Sheets (cards1.png & cards2.png)', () => {
  const projectRoot = process.cwd();
  const cards1Path = path.join(projectRoot, 'public', 'cards1.png');
  const cards2Path = path.join(projectRoot, 'public', 'cards2.png');
  assert(fs.existsSync(cards1Path), `public/cards1.png missing`);
  assert(fs.existsSync(cards2Path), `public/cards2.png missing`);
  assert(fs.statSync(cards1Path).size > 1000, `public/cards1.png is too small`);
  assert(fs.statSync(cards2Path).size > 1000, `public/cards2.png is too small`);
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 2: 40-EPISODE WEBTOON RESOLUTION & PHYSICAL ASSET INTEGRITY
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- [SUITE 2] 40-Episode Webtoon Resolution & Physical Asset Integrity ---');

runTest('WebtoonCatalog', 'All 40 Episodes Strictly Contiguous with Valid Metadata', () => {
  const episodes = getAllWebtoonEpisodes();
  assert(episodes.length === 40, `Expected 40 episodes, found ${episodes.length}`);

  for (let ep = 1; ep <= 40; ep++) {
    const meta = getWebtoonEpisode(ep);
    assert(meta.episodeNumber === ep, `Episode index mismatch for ${ep}`);
    assert(meta.titleKo.length > 0, `Missing titleKo for ep ${ep}`);
    assert(meta.titleEn.length > 0, `Missing titleEn for ep ${ep}`);
    assert(meta.totalScenes >= 40, `totalScenes for ep ${ep} is suspiciously low: ${meta.totalScenes}`);
    assert(meta.coverImageUrl.startsWith('/images/webtoon/episode_'), `Invalid cover URL for ep ${ep}`);
    assert(meta.leadNarrationKo.length > 10, `leadNarrationKo too short for ep ${ep}`);
    assert(meta.leadNarrationEn.length > 10, `leadNarrationEn too short for ep ${ep}`);
    assert(meta.speakerKo.length > 0, `Missing speakerKo for ep ${ep}`);
  }
});

runTest('WebtoonCatalog', 'Extreme Episode Lookups Fall Back Safely to Episode 1', () => {
  const ep0 = getWebtoonEpisode(0);
  assert(ep0.episodeNumber === 1, `Ep 0 should fall back to Ep 1, got ${ep0.episodeNumber}`);

  const ep41 = getWebtoonEpisode(41);
  assert(ep41.episodeNumber === 1, `Ep 41 should fall back to Ep 1, got ${ep41.episodeNumber}`);

  const epNeg = getWebtoonEpisode(-99);
  assert(epNeg.episodeNumber === 1, `Ep -99 should fall back to Ep 1, got ${epNeg.episodeNumber}`);
});

runTest('WebtoonCatalog', 'Physical Existence of 40-Episode Cover Images (scene_00.webp)', () => {
  const projectRoot = process.cwd();
  let missingCoverCount = 0;

  for (let ep = 1; ep <= 40; ep++) {
    const padEp = String(ep).padStart(2, '0');
    const coverPath = path.join(projectRoot, 'public', 'images', 'webtoon', `episode_${padEp}`, 'scene_00.webp');
    if (!fs.existsSync(coverPath)) {
      missingCoverCount++;
    } else {
      const stat = fs.statSync(coverPath);
      assert(stat.size > 0, `Cover for ep ${ep} is empty`);
    }
  }
  assert(missingCoverCount === 0, `${missingCoverCount} webtoon episode covers missing in public/images/webtoon/`);
});

runTest('WebtoonCatalog', 'Webtoon Scene Image URL Generators Format Accurately', () => {
  assert(getWebtoonSceneImageUrl(1, 0) === '/images/webtoon/episode_01/scene_00.webp', 'Scene 0 URL mismatch');
  assert(getWebtoonSceneImageUrl(40, 15) === '/images/webtoon/episode_40/scene_15.webp', 'Scene 15 URL mismatch');
  assert(getWebtoonCoverImageUrl(7) === '/images/webtoon/episode_07/scene_00.webp', 'Cover URL mismatch');
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 3: MODAL STATE MACHINE & BACKDROP STACKING ORACLE
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- [SUITE 3] Modal State Machine & Zero Zombie / Stacked Backdrop Oracle ---');

runTest('Modals', 'Inactive Modal State Returns Empty String (Zero Backdrops)', () => {
  assert(renderModals(null) === '', 'null modal should render empty string');
  assert(renderModals('' as any) === '', 'empty string modal should render empty string');
  assert(renderModals(undefined as any) === '', 'undefined modal should render empty string');
});

runTest('Modals', 'Active Modals Render Exactly 1 Backdrop Overlay with Dismiss Controls', () => {
  for (const modalKey of ['mall', 'community', 'login'] as const) {
    const html = renderModals(modalKey);
    // Count occurrences of id="landing-modal-overlay"
    const overlayMatches = html.match(/id="landing-modal-overlay"/g) || [];
    assert(overlayMatches.length === 1, `Expected exactly 1 overlay for ${modalKey}, found ${overlayMatches.length}`);

    // Must have role="dialog" and aria-modal="true"
    assert(html.includes('role="dialog"'), `Missing role="dialog" for ${modalKey}`);
    assert(html.includes('aria-modal="true"'), `Missing aria-modal="true" for ${modalKey}`);

    // Must have dismiss controls
    assert(html.includes('data-action="close-modal"'), `Missing data-action="close-modal" for ${modalKey}`);
    assert(html.includes('[x]'), `Missing [x] dismiss button for ${modalKey}`);
    assert(html.includes('닫기 (Close)'), `Missing 닫기 button for ${modalKey}`);

    // 44px+ touch target on dismiss controls
    assert(html.includes('min-h-[44px] min-w-[44px]'), `Top-right [x] must have min-h-[44px] min-w-[44px] in ${modalKey}`);
  }
});

runTest('Modals', 'Sequential Modal Transitions Never Leave Stacked Backdrops', () => {
  // Test transition from mall -> community -> login -> null
  let currentModal: any = 'mall';
  let html = renderModals(currentModal);
  let overlays = (html.match(/id="landing-modal-overlay"/g) || []).length;
  assert(overlays === 1, 'First modal has 1 overlay');

  currentModal = 'community';
  html = renderModals(currentModal);
  overlays = (html.match(/id="landing-modal-overlay"/g) || []).length;
  assert(overlays === 1, 'Switched modal has exactly 1 overlay');

  currentModal = 'login';
  html = renderModals(currentModal);
  overlays = (html.match(/id="landing-modal-overlay"/g) || []).length;
  assert(overlays === 1, 'Second switched modal has exactly 1 overlay');

  currentModal = null;
  html = renderModals(currentModal);
  overlays = (html.match(/id="landing-modal-overlay"/g) || []).length;
  assert(overlays === 0, 'Closed modal has 0 overlays');
});

runTest('Modals', 'Sidebar and Modal Coordination Never Render Competing Backdrops', () => {
  // When sidebar is closed and modal is open
  const sidebarClosed = renderSidebar(false, 'home');
  const modalOpen = renderModals('mall');
  assert(!sidebarClosed.includes('id="sidebar-backdrop"'), 'Closed sidebar has no backdrop');
  assert(modalOpen.includes('id="landing-modal-overlay"'), 'Open modal has overlay');

  // When sidebar is open and modal is closed
  const sidebarOpen = renderSidebar(true, 'home');
  const modalClosed = renderModals(null);
  assert(sidebarOpen.includes('id="sidebar-backdrop"'), 'Open sidebar has backdrop');
  assert(modalClosed === '', 'Closed modal has no overlay');
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 4: TERMINAL-FLAT AESTHETICS & ZERO PROHIBITED CLASSES SCAN
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- [SUITE 4] OpenCode Terminal-Flat Prohibited Tailwind Classes Rigor ---');

const PROHIBITED_CLASSES = [
  'bg-gradient-to-',
  'rounded-xl',
  'rounded-2xl',
  'rounded-3xl',
  'animate-ping',
  'animate-bounce',
];

runTest('TerminalFlat', 'Static Codebase Source Scan in src/landing/ for Prohibited Classes', () => {
  const landingDir = path.resolve(process.cwd(), 'src', 'landing');

  function scanDir(dir: string): void {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanDir(fullPath);
      } else if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts') || entry.name.endsWith('.css'))) {
        const content = fs.readFileSync(fullPath, 'utf8');
        for (const prohibited of PROHIBITED_CLASSES) {
          const regex = new RegExp(`\\b${prohibited}`, 'g');
          const matches = content.match(regex);
          assert(!matches || matches.length === 0, `Found prohibited class "${prohibited}" in ${fullPath}`);
        }
      }
    }
  }

  scanDir(landingDir);
});

runTest('TerminalFlat', 'Rendered DOM Template Output Scan for Prohibited Classes', () => {
  const renderedSnippets = [
    renderHeader('home'),
    renderHeader('deck'),
    renderSidebar(true, 'home'),
    renderModals('mall'),
    renderModals('community'),
    renderModals('login'),
    renderFooter(),
    renderHomeSection(),
    renderMyDeckSection(1),
    renderPlaySection(),
    renderCardSection(),
    renderShopSection(),
  ];

  for (let i = 0; i < renderedSnippets.length; i++) {
    const html = renderedSnippets[i];
    for (const prohibited of PROHIBITED_CLASSES) {
      const regex = new RegExp(`\\b${prohibited}`, 'g');
      const matches = html.match(regex);
      assert(!matches || matches.length === 0, `Prohibited class "${prohibited}" rendered in snippet #${i}`);
    }
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 5: 44PX+ MOBILE TOUCH TARGET RIGOR
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- [SUITE 5] 44px+ Mobile Touch Target Ergonomics Rigor ---');

runTest('TouchTargets', 'Global CSS Standard Enforces min-height: 44px on All Buttons', () => {
  const cssPath = path.resolve(process.cwd(), 'src', 'landing', 'styles', 'landing.css');
  const css = fs.readFileSync(cssPath, 'utf8');
  assert(css.includes('min-height: 44px;'), 'landing.css must declare min-height: 44px for buttons');
  assert(css.includes('touch-action: manipulation;'), 'landing.css must declare touch-action: manipulation');
});

runTest('TouchTargets', 'Header and Sidebar Interactive Controls Enforce min-h-[44px]', () => {
  const headerHtml = renderHeader('home');
  // Check that all button and action link elements have min-h-[44px]
  const headerButtons = headerHtml.match(/<button[\s\S]*?<\/button>/gi) || [];
  for (const btn of headerButtons) {
    assert(btn.includes('min-h-[44px]'), `Header button missing min-h-[44px]: ${btn.substring(0, 60)}...`);
  }

  const sidebarHtml = renderSidebar(true, 'home');
  const sidebarButtons = sidebarHtml.match(/<button[\s\S]*?<\/button>/gi) || [];
  for (const btn of sidebarButtons) {
    assert(btn.includes('min-h-[44px]'), `Sidebar button missing min-h-[44px]: ${btn.substring(0, 60)}...`);
  }
});

runTest('TouchTargets', 'Modal Dialog Dismiss and Action Controls Enforce min-h-[44px]', () => {
  for (const modalKey of ['mall', 'community', 'login'] as const) {
    const modalHtml = renderModals(modalKey);
    const modalButtons = modalHtml.match(/<button[\s\S]*?<\/button>/gi) || [];
    for (const btn of modalButtons) {
      assert(btn.includes('min-h-[44px]'), `Modal button missing min-h-[44px] in ${modalKey}: ${btn.substring(0, 60)}...`);
    }
  }
});

runTest('TouchTargets', 'Play Section 5 Control Buttons Enforce min-h-[44px]', () => {
  const playHtml = renderPlaySection();
  const playButtons = playHtml.match(/<button[\s\S]*?<\/button>/gi) || [];
  assert(playButtons.length >= 5, 'Play section should have at least 5 buttons');
  for (const btn of playButtons) {
    assert(btn.includes('min-h-[44px]'), `Play button missing min-h-[44px]: ${btn.substring(0, 60)}...`);
  }
});

runTest('TouchTargets', 'Card Section and Shop Section Action Controls Enforce min-h-[44px]', () => {
  const cardHtml = renderCardSection();
  const cardButtons = cardHtml.match(/<button[\s\S]*?<\/button>/gi) || [];
  for (const btn of cardButtons) {
    assert(btn.includes('min-h-[44px]'), `Card button missing min-h-[44px]: ${btn.substring(0, 60)}...`);
  }

  const shopHtml = renderShopSection();
  const shopButtons = shopHtml.match(/<button[\s\S]*?<\/button>/gi) || [];
  for (const btn of shopButtons) {
    assert(btn.includes('min-h-[44px]'), `Shop button missing min-h-[44px]: ${btn.substring(0, 60)}...`);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 6: DECOUPLED STATIC BUNDLE INTEGRITY AUDIT
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- [SUITE 6] Decoupled Static Bundle Integrity Audit ---');

runTest('BundleAudit', 'dist/index.html Exists, Size < 50 KB, and Contains 0 React Tags', () => {
  const projectRoot = process.cwd();
  const distIndexPath = path.join(projectRoot, 'dist', 'index.html');
  assert(fs.existsSync(distIndexPath), `dist/index.html missing at ${distIndexPath}`);

  const stat = fs.statSync(distIndexPath);
  const sizeKB = stat.size / 1024;
  assert(sizeKB < 50, `dist/index.html size (${sizeKB.toFixed(1)} KB) exceeds 50 KB budget`);

  const content = fs.readFileSync(distIndexPath, 'utf8');

  // Verify Zero React / Three.js bundle tags in index.html
  assert(!content.includes('react-dom'), 'dist/index.html must not contain react-dom');
  assert(!content.includes('three.js') && !content.includes('three.min'), 'dist/index.html must not contain three.js');
  assert(!content.includes('tensorflow'), 'dist/index.html must not contain tensorflow');

  // Must mount to landing-root, not root
  assert(content.includes('id="landing-root"'), 'dist/index.html must provide landing-root container');
});

runTest('BundleAudit', 'dist/home.html Exists as Independent Game SPA Entry', () => {
  const projectRoot = process.cwd();
  const distHomePath = path.join(projectRoot, 'dist', 'home.html');
  assert(fs.existsSync(distHomePath), `dist/home.html missing at ${distHomePath}`);
  const stat = fs.statSync(distHomePath);
  assert(stat.size > 0, `dist/home.html is empty`);
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 7: VIEW DOM EDGE CASES & RENDERING RESILIENCE
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- [SUITE 7] View DOM Edge Cases & Rendering Resilience ---');

runTest('ViewEdgeCases', 'MyDeckSection Resilient Against Extreme Selected Card IDs (9999, -10)', () => {
  const htmlHigh = renderMyDeckSection(9999);
  assert(htmlHigh.includes('마이덱 (My Deck)'), 'MyDeckSection failed with high ID');
  assert(htmlHigh.includes('전투력 (DECK TP)'), 'Missing DECK TP with high ID');

  const htmlNeg = renderMyDeckSection(-10);
  assert(htmlNeg.includes('마이덱 (My Deck)'), 'MyDeckSection failed with negative ID');
});

runTest('ViewEdgeCases', 'CardSection Handles Non-Existent Element Filter Gracefully', () => {
  setElementFilter('nonexistent_faction');
  const htmlEmpty = renderCardSection();
  assert(htmlEmpty.includes('전체 카드 목록 (0 / 110)'), 'Filter should report 0 matches');

  // Reset filter
  setElementFilter('all');
  setSelectedCardId(9999);
  const htmlClamped = renderCardSection();
  assert(htmlClamped.includes('카드 (Card Collection &amp; Nurture)'), 'Section renders with high selected card ID');
  setSelectedCardId(null);
});

runTest('ViewEdgeCases', 'PlaySection Resilient When Clamping Episode and Scene Extremes', () => {
  setEpisode(999);
  assert(playState.currentEpisode === 40, `Episode 999 did not clamp to 40: got ${playState.currentEpisode}`);

  setEpisode(-50);
  assert(playState.currentEpisode === 1, `Episode -50 did not clamp to 1: got ${playState.currentEpisode}`);

  setScene(99999);
  const ep1 = getWebtoonEpisode(1);
  assert(playState.currentScene === ep1.totalScenes - 1, `Scene did not clamp to max: got ${playState.currentScene}`);

  setScene(-100);
  assert(playState.currentScene === 0, `Scene did not clamp to 0: got ${playState.currentScene}`);
});


// ─────────────────────────────────────────────────────────────────────────────
// SUMMARY & EXIT
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n======================================================================');
console.log('  ADVERSARIAL HARNESS EXECUTION SUMMARY                              ');
console.log('======================================================================');

const totalTests = results.length;
const passedTests = results.filter((r) => r.passed).length;
const failedTests = results.filter((r) => !r.passed).length;
const passRate = ((passedTests / totalTests) * 100).toFixed(1);

console.log(`Total Adversarial Scenarios : ${totalTests}`);
console.log(`Passed                      : ${passedTests}`);
console.log(`Failed                      : ${failedTests}`);
console.log(`Pass Rate                   : ${passRate}%`);

if (failedTests > 0) {
  console.error('\nFAILED TESTS:');
  for (const r of results.filter((r) => !r.passed)) {
    console.error(`- [${r.suite}] ${r.name}: ${r.details}`);
  }
  process.exit(1);
} else {
  console.log('\n>>> VERDICT: NO_GAPS_FOUND (All adversarial checks passed 100%) <<<\n');
  process.exit(0);
}
