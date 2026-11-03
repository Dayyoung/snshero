/**
 * tests/adversarial_m2_user_interaction.ts
 *
 * EMPIRICAL ADVERSARIAL USER INTERACTION & EVENT DELEGATION TEST HARNESS (Milestone 2)
 * Challenger 2 Verification Suite
 *
 * Scope:
 * 1. Event Delegation Audit for Home Card Popup:
 *    - Open on fan card click (data-action="inspect-home-card")
 *    - Close on close button (data-action="close-home-card-inspector")
 *    - Close on Escape keydown
 *    - Close on Backdrop click (#home-card-inspect-modal)
 *    - Non-dismissal on click inside modal dialog content
 * 2. Event Delegation Audit for Deck Swap Drawer:
 *    - Open on slot [영웅 교체] button (data-action="open-deck-swap-drawer")
 *    - Close on close button (data-action="close-deck-swap-drawer")
 *    - Close on Escape keydown
 *    - Close on Backdrop click (#deck-swap-drawer-backdrop)
 *    - Non-dismissal on click inside drawer content
 *    - Card swap action (data-action="swap-deck-card") updates squad and closes drawer
 * 3. 4 Core Media Pillars Verification:
 *    - 웹소설, 웹게임, 웹툰, 애니메이션 presence, headings, icons, descriptions, grid
 * 4. 3 Official Serialization Links & Badges Verification:
 *    - Naver Novel, Naver Webtoon, Munpia Novel URLs, titles, target="_blank", [절찬 연재중] badges
 *
 * Usage:
 *   npx tsx tests/adversarial_m2_user_interaction.ts
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as cheerio from 'cheerio';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

// In-Memory Storage Mock for Headless Node.js Execution
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

const mockStorage = new MockStorage();
if (typeof globalThis.localStorage === 'undefined') {
  (globalThis as any).localStorage = mockStorage;
}

// Production Modules Under Test
import {
  renderHomeSection,
  setInspectedHomeCardId,
  getInspectedHomeCardId,
} from '../src/landing/views/HomeSection';
import {
  renderMyDeckSection,
  setEditingSlotIndex,
  getEditingSlotIndex,
  setSelectedDeckCardId,
  getSelectedDeckCardId,
  getCardEffectiveStats,
} from '../src/landing/views/MyDeckSection';
import { cardNurtureStore } from '../src/landing/services/cardNurtureStore';
import { CARD_DATABASE } from '../src/cardDatabase';
import { EXTERNAL_LINKS } from '../src/landing/types';

// Formatting Helpers
const GREEN = '\x1b[92m';
const RED = '\x1b[91m';
const YELLOW = '\x1b[93m';
const CYAN = '\x1b[96m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

interface ChallengeResult {
  suite: string;
  id: string;
  name: string;
  passed: boolean;
  expected?: string;
  actual?: string;
  note?: string;
}

const testResults: ChallengeResult[] = [];

function recordAssertion(
  suite: string,
  id: string,
  name: string,
  condition: boolean,
  expected?: string,
  actual?: string,
  note?: string
): void {
  testResults.push({ suite, id, name, passed: condition, expected, actual, note });
  const status = condition ? `${GREEN}✓ PASS${RESET}` : `${RED}✗ FAIL${RESET}`;
  console.log(`  [${id}] ${name.padEnd(58)} ${status}`);
  if (!condition) {
    if (expected !== undefined && actual !== undefined) {
      console.log(`    ${YELLOW}↳ Expected: ${expected}${RESET}`);
      console.log(`    ${YELLOW}↳ Actual  : ${actual}${RESET}`);
    }
    if (note) {
      console.log(`    ${YELLOW}↳ Note    : ${note}${RESET}`);
    }
  }
}

// ============================================================================
// SIMULATION ENGINE FOR EVENT DELEGATION & GLOBAL KEYDOWN
// Mirrors src/landing/index.ts handleEventDelegation & handleGlobalKeydown exactly
// ============================================================================

interface AppState {
  activeView: string;
  activeModal: string | null;
  isSidebarOpen: boolean;
  selectedDeckCardId: number;
}

function createSimulatedRouter(initialState?: Partial<AppState>) {
  const state: AppState = {
    activeView: 'home',
    activeModal: null,
    isSidebarOpen: false,
    selectedDeckCardId: 1,
    ...initialState,
  };

  /**
   * Evaluates event delegation logic from src/landing/index.ts
   * @param targetElement Cheerio element or virtual target clicked
   * @param $ Cheerio root of the rendered document
   */
  function dispatchClick(targetSelector: string, $: cheerio.CheerioAPI): void {
    const el = $(targetSelector);
    if (el.length === 0) {
      // Element not found in DOM
      return;
    }

    // Traversal: .closest('[data-nav], [data-modal], [data-action], a[href^="#"], a[href="/home"]')
    const matched = el.closest('[data-nav], [data-modal], [data-action], a[href^="#"], a[href="/home"]');
    if (matched.length === 0) {
      // Target did not match any interactive selector — event delegation no-op
      return;
    }

    const nav = matched.attr('data-nav');
    const modal = matched.attr('data-modal');
    const action = matched.attr('data-action');
    const href = matched.attr('href');

    if (nav) {
      state.activeView = nav;
      state.isSidebarOpen = false;
      state.activeModal = null;
      return;
    }

    if (modal) {
      state.activeModal = modal;
      state.isSidebarOpen = false;
      return;
    }

    if (action === 'toggle-sidebar') {
      state.isSidebarOpen = !state.isSidebarOpen;
    } else if (action === 'close-sidebar') {
      state.isSidebarOpen = false;
    } else if (action === 'close-modal') {
      state.activeModal = null;
    } else if (action === 'inspect-home-card') {
      const cardIdStr = matched.attr('data-card-id');
      if (cardIdStr) {
        setInspectedHomeCardId(parseInt(cardIdStr, 10));
      }
    } else if (action === 'close-home-card-inspector') {
      setInspectedHomeCardId(null);
    } else if (action === 'open-deck-swap-drawer') {
      const slotStr = matched.attr('data-slot-index');
      if (slotStr !== null && slotStr !== undefined) {
        setEditingSlotIndex(parseInt(slotStr, 10));
      }
    } else if (action === 'close-deck-swap-drawer') {
      setEditingSlotIndex(null);
    } else if (action === 'swap-deck-card') {
      const slotStr = matched.attr('data-slot-index');
      const cardIdStr = matched.attr('data-card-id');
      if (slotStr !== null && slotStr !== undefined && cardIdStr) {
        const slotIndex = parseInt(slotStr, 10);
        const cardId = parseInt(cardIdStr, 10);
        const success = cardNurtureStore.setDeckCard(slotIndex, cardId);
        if (success) {
          setSelectedDeckCardId(cardId);
          state.selectedDeckCardId = cardId;
          setEditingSlotIndex(null);
        }
      }
    }
  }

  function dispatchKeydown(key: string): void {
    if (key === 'Escape') {
      if (getInspectedHomeCardId()) {
        setInspectedHomeCardId(null);
        return;
      }
      if (getEditingSlotIndex() !== null) {
        setEditingSlotIndex(null);
        return;
      }
      if (state.activeModal) {
        state.activeModal = null;
      } else if (state.isSidebarOpen) {
        state.isSidebarOpen = false;
      }
    }
  }

  return { state, dispatchClick, dispatchKeydown };
}

// ============================================================================
// MAIN RUNNER
// ============================================================================

async function runAdversarialInteractionAudit() {
  console.log(`\n${BOLD}${CYAN}======================================================================${RESET}`);
  console.log(`${BOLD}${CYAN}  CHALLENGER 2: EMPIRICAL USER INTERACTION & EVENT DELEGATION AUDIT  ${RESET}`);
  console.log(`${BOLD}${CYAN}======================================================================${RESET}`);
  console.log(`Repo Root        : ${REPO_ROOT}`);
  console.log(`Audited Surface  : src/landing/index.ts, HomeSection.tsx, MyDeckSection.tsx\n`);

  // Initialize clean card nurture baseline
  mockStorage.clear();
  cardNurtureStore.initDefaultCards();
  cardNurtureStore.ownedCardIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  (cardNurtureStore as any).activeDeckIds = [1, 2, 3, 4, 5];
  setInspectedHomeCardId(null);
  setEditingSlotIndex(null);

  // --------------------------------------------------------------------------
  // SUITE 1: Home Card Inspect Popup Lifecycle & Event Delegation
  // --------------------------------------------------------------------------
  console.log(`${BOLD}>>> Suite 1: Home Card Inspect Popup Opening & Closing Lifecycle${RESET}`);

  // Test 1.1: Fan Card Click Opens Modal
  setInspectedHomeCardId(null);
  let homeHtml = renderHomeSection();
  let $h = cheerio.load(homeHtml);
  let router = createSimulatedRouter({ activeView: 'home' });

  const firstFanCard = $h('[data-action="inspect-home-card"]').first();
  const targetCardId = parseInt(firstFanCard.attr('data-card-id') || '1', 10);

  router.dispatchClick('[data-action="inspect-home-card"]:first', $h);
  const modalOpened = getInspectedHomeCardId() === targetCardId;

  recordAssertion(
    'Suite 1',
    'CH2.HOME.INSPECT_OPEN',
    'Clicking fan-deck card opens inspection modal with card ID',
    modalOpened,
    `Inspected card ID = ${targetCardId}`,
    `Inspected card ID = ${getInspectedHomeCardId()}`
  );

  // Re-render with modal open
  homeHtml = renderHomeSection();
  $h = cheerio.load(homeHtml);
  const modalElement = $h('#home-card-inspect-modal');
  const hasCutoutImg = modalElement.find('img[alt*="7등신 풀바디"]').length >= 1;
  const hasCompassStats = modalElement.text().includes('북 (N)') && modalElement.text().includes('동 (E)');

  recordAssertion(
    'Suite 1',
    'CH2.HOME.MODAL_CONTENT',
    'Open inspect modal renders 7-head cutout and 4-way compass stats',
    modalElement.length === 1 && hasCutoutImg && hasCompassStats,
    'Modal present with cutout and compass stats',
    `modal=${modalElement.length}, cutout=${hasCutoutImg}, compass=${hasCompassStats}`
  );

  // Test 1.2: Close Button Dismisses Modal
  const closeBtn = modalElement.find('[data-action="close-home-card-inspector"]').first();
  const hasCloseBtn = closeBtn.length >= 1;

  router.dispatchClick('#home-card-inspect-modal [data-action="close-home-card-inspector"]:first', $h);
  const closedByButton = getInspectedHomeCardId() === null;

  recordAssertion(
    'Suite 1',
    'CH2.HOME.CLOSE_BUTTON',
    'Clicking close button ([x] or 닫기) dismisses inspect modal',
    hasCloseBtn && closedByButton,
    'getInspectedHomeCardId() === null after clicking close button',
    `hasCloseBtn=${hasCloseBtn}, result=${getInspectedHomeCardId()}`
  );

  // Test 1.3: Escape Key Dismisses Modal
  setInspectedHomeCardId(targetCardId);
  router.dispatchKeydown('Escape');
  const closedByEscape = getInspectedHomeCardId() === null;

  recordAssertion(
    'Suite 1',
    'CH2.HOME.ESCAPE_KEY',
    'Pressing Escape key dismisses active inspect modal',
    closedByEscape,
    'getInspectedHomeCardId() === null after Escape',
    `result=${getInspectedHomeCardId()}`
  );

  // Test 1.4: Backdrop Click Dismissal Check
  // Reopen modal
  setInspectedHomeCardId(targetCardId);
  homeHtml = renderHomeSection();
  $h = cheerio.load(homeHtml);

  // Check backdrop element attributes
  const backdropOuter = $h('#home-card-inspect-modal');
  const backdropHasDataAction = backdropOuter.attr('data-action') === 'close-home-card-inspector';
  const hasDedicatedBackdropOverlay = $h('#home-card-inspect-backdrop, [data-action="close-home-card-inspector"].fixed').length >= 1;

  // Simulate click on backdrop outer container
  router.dispatchClick('#home-card-inspect-modal', $h);
  const closedByBackdrop = getInspectedHomeCardId() === null;

  recordAssertion(
    'Suite 1',
    'CH2.HOME.BACKDROP_CLICK',
    'Clicking modal backdrop dismisses inspect modal',
    closedByBackdrop || backdropHasDataAction || hasDedicatedBackdropOverlay,
    'Backdrop click dismisses modal OR has dedicated backdrop dismiss handler',
    `closedByBackdrop=${closedByBackdrop}, backdropHasDataAction=${backdropHasDataAction}, hasDedicatedBackdropOverlay=${hasDedicatedBackdropOverlay}`,
    'Vulnerability: #home-card-inspect-modal lacks data-action="close-home-card-inspector" on outer backdrop'
  );

  // Test 1.5: Click Inside Modal Dialog Does NOT Accidentally Dismiss
  setInspectedHomeCardId(targetCardId);
  homeHtml = renderHomeSection();
  $h = cheerio.load(homeHtml);
  router.dispatchClick('#home-card-inspect-modal h3', $h);
  const insideClickPreserved = getInspectedHomeCardId() === targetCardId;

  recordAssertion(
    'Suite 1',
    'CH2.HOME.INSIDE_CLICK_PRESERVED',
    'Clicking inside modal dialog content preserves open state (no false dismissal)',
    insideClickPreserved,
    'Modal stays open on content click',
    `getInspectedHomeCardId() = ${getInspectedHomeCardId()}`
  );

  setInspectedHomeCardId(null); // Clean up

  // --------------------------------------------------------------------------
  // SUITE 2: Deck Swap Drawer Lifecycle & Event Delegation
  // --------------------------------------------------------------------------
  console.log(`\n${BOLD}>>> Suite 2: Deck Swap Drawer Opening & Closing Lifecycle${RESET}`);

  // Test 2.1: [영웅 교체] Button Opens Drawer
  setEditingSlotIndex(null);
  let deckHtml = renderMyDeckSection(1);
  let $d = cheerio.load(deckHtml);

  const swapBtn = $d('[data-action="open-deck-swap-drawer"][data-slot-index="0"]').first();
  const hasSwapBtn = swapBtn.length >= 1;

  router.dispatchClick('[data-action="open-deck-swap-drawer"][data-slot-index="0"]', $d);
  const drawerOpened = getEditingSlotIndex() === 0;

  recordAssertion(
    'Suite 2',
    'CH2.DECK.DRAWER_OPEN',
    'Clicking [영웅 교체] button on Slot 0 opens swap drawer for slot 0',
    hasSwapBtn && drawerOpened,
    'getEditingSlotIndex() === 0',
    `hasSwapBtn=${hasSwapBtn}, getEditingSlotIndex()=${getEditingSlotIndex()}`
  );

  // Re-render with drawer open
  deckHtml = renderMyDeckSection(1);
  $d = cheerio.load(deckHtml);
  const drawerBackdrop = $d('#deck-swap-drawer-backdrop');
  const hasTitle = deckHtml.includes('출격 영웅 카드 교체 (SLOT 01)');
  const hasOwnedCards = $d('#deck-swap-drawer-backdrop [data-action="swap-deck-card"]').length >= 1;

  recordAssertion(
    'Suite 2',
    'CH2.DECK.DRAWER_CONTENT',
    'Open swap drawer renders slot title and equippable owned cards',
    drawerBackdrop.length === 1 && hasTitle && hasOwnedCards,
    'Drawer open with slot title and equippable cards',
    `backdrop=${drawerBackdrop.length}, hasTitle=${hasTitle}, hasOwnedCards=${hasOwnedCards}`
  );

  // Test 2.2: Close Button Dismisses Drawer
  const drawerCloseBtn = drawerBackdrop.find('[data-action="close-deck-swap-drawer"]').first();
  const hasDrawerCloseBtn = drawerCloseBtn.length >= 1;

  router.dispatchClick('#deck-swap-drawer-backdrop [data-action="close-deck-swap-drawer"]:first', $d);
  const closedByDrawerBtn = getEditingSlotIndex() === null;

  recordAssertion(
    'Suite 2',
    'CH2.DECK.CLOSE_BUTTON',
    'Clicking close button (✕ 닫기 or 취소) dismisses swap drawer',
    hasDrawerCloseBtn && closedByDrawerBtn,
    'getEditingSlotIndex() === null after clicking close button',
    `hasCloseBtn=${hasDrawerCloseBtn}, result=${getEditingSlotIndex()}`
  );

  // Test 2.3: Escape Key Dismisses Drawer
  setEditingSlotIndex(1); // Open for slot 1
  router.dispatchKeydown('Escape');
  const closedByDrawerEscape = getEditingSlotIndex() === null;

  recordAssertion(
    'Suite 2',
    'CH2.DECK.ESCAPE_KEY',
    'Pressing Escape key dismisses active deck swap drawer',
    closedByDrawerEscape,
    'getEditingSlotIndex() === null after Escape',
    `result=${getEditingSlotIndex()}`
  );

  // Test 2.4: Backdrop Click Dismissal Check for Drawer
  setEditingSlotIndex(0);
  deckHtml = renderMyDeckSection(1);
  $d = cheerio.load(deckHtml);

  const drawerOuter = $d('#deck-swap-drawer-backdrop');
  const drawerHasDataAction = drawerOuter.attr('data-action') === 'close-deck-swap-drawer';
  const hasDedicatedDrawerBackdrop = $d('#deck-swap-backdrop, [data-action="close-deck-swap-drawer"].fixed').length >= 1;

  router.dispatchClick('#deck-swap-drawer-backdrop', $d);
  const closedByDrawerBackdrop = getEditingSlotIndex() === null;

  recordAssertion(
    'Suite 2',
    'CH2.DECK.BACKDROP_CLICK',
    'Clicking drawer backdrop dismisses deck swap drawer',
    closedByDrawerBackdrop || drawerHasDataAction || hasDedicatedDrawerBackdrop,
    'Backdrop click dismisses drawer OR has dedicated backdrop dismiss handler',
    `closedByBackdrop=${closedByDrawerBackdrop}, drawerHasDataAction=${drawerHasDataAction}, hasDedicatedDrawerBackdrop=${hasDedicatedDrawerBackdrop}`,
    'Vulnerability: #deck-swap-drawer-backdrop lacks data-action="close-deck-swap-drawer" on outer backdrop'
  );

  // Test 2.5: Swapping Card Updates Squad and Closes Drawer
  setEditingSlotIndex(0);
  deckHtml = renderMyDeckSection(1);
  $d = cheerio.load(deckHtml);

  // Card 6 is owned and not currently in active squad [1, 2, 3, 4, 5]
  const equipBtn = $d('[data-action="swap-deck-card"][data-card-id="6"]').first();
  const hasEquipBtn = equipBtn.length >= 1;

  router.dispatchClick('[data-action="swap-deck-card"][data-card-id="6"]', $d);
  const newActiveSquad = cardNurtureStore.getDeckCardIds();
  const slot0IsCard6 = newActiveSquad[0] === 6;
  const drawerClosedAfterSwap = getEditingSlotIndex() === null;

  recordAssertion(
    'Suite 2',
    'CH2.DECK.SWAP_ACTION',
    'Clicking [이 영웅으로 교체] equips Card 6 into Slot 0 and closes drawer',
    hasEquipBtn && slot0IsCard6 && drawerClosedAfterSwap,
    'Slot 0 = 6, drawer closed',
    `hasEquipBtn=${hasEquipBtn}, slot0=${newActiveSquad[0]}, drawerOpen=${getEditingSlotIndex() !== null}`
  );

  // Reset slot 0 back to card 1
  cardNurtureStore.setDeckCard(0, 1);
  setEditingSlotIndex(null);

  // --------------------------------------------------------------------------
  // SUITE 3: 4 Core Media Pillars Verification
  // --------------------------------------------------------------------------
  console.log(`\n${BOLD}>>> Suite 3: 4 Core Media Pillars Verification (웹소설, 웹게임, 웹툰, 애니메이션)${RESET}`);

  homeHtml = renderHomeSection();
  $h = cheerio.load(homeHtml);

  const pillarsContainer = $h('section:contains("눈히어로 4대 핵심 미디어 생태계")');
  const hasPillarsSection = pillarsContainer.length >= 1;

  // Pillar 1: 웹소설
  const pillarNovel = pillarsContainer.find(':contains("40부작 공식 웹소설")');
  const hasPillarNovel = pillarNovel.length >= 1 && pillarsContainer.text().includes('NOVEL · 40 EPISODES');

  // Pillar 2: 웹게임
  const pillarGame = pillarsContainer.find(':contains("원클릭 AI 카드 웹게임")');
  const hasPillarGame = pillarGame.length >= 1 && pillarsContainer.text().includes('GAME · 110 CARDS');

  // Pillar 3: 웹툰
  const pillarWebtoon = pillarsContainer.find(':contains("840컷+ 비주얼 웹툰")');
  const hasPillarWebtoon = pillarWebtoon.length >= 1 && pillarsContainer.text().includes('WEBTOON · 840+ PANELS');

  // Pillar 4: 애니메이션
  const pillarAnime = pillarsContainer.find(':contains("시네마틱 애니메이션")');
  const hasPillarAnime = pillarAnime.length >= 1 && pillarsContainer.text().includes('ANIME · 40 MP4 FILMS');

  // Responsive Grid Check: grid-cols-1 sm:grid-cols-2 lg:grid-cols-4
  const gridElement = pillarsContainer.find('.grid');
  const has4ColGrid = (gridElement.attr('class') || '').includes('lg:grid-cols-4');

  recordAssertion(
    'Suite 3',
    'CH2.PIL.ALL_4_PRESENT',
    'Preserves all 4 media pillars: 웹소설, 웹게임, 웹툰, 애니메이션',
    hasPillarsSection && hasPillarNovel && hasPillarGame && hasPillarWebtoon && hasPillarAnime,
    'All 4 pillars present with respective metadata tags',
    `novel=${hasPillarNovel}, game=${hasPillarGame}, webtoon=${hasPillarWebtoon}, anime=${hasPillarAnime}`
  );

  recordAssertion(
    'Suite 3',
    'CH2.PIL.GRID_RESPONSIVE',
    'Media pillars rendered in responsive 4-column layout (lg:grid-cols-4)',
    has4ColGrid,
    'Contains class lg:grid-cols-4',
    `classes: ${gridElement.attr('class')}`
  );

  // --------------------------------------------------------------------------
  // SUITE 4: 3 Official Serialization Links & [절찬 연재중] Badges
  // --------------------------------------------------------------------------
  console.log(`\n${BOLD}>>> Suite 4: 3 Official Serialization Links & [절찬 연재중] Badges${RESET}`);

  const serialSection = $h('section:contains("공식 연재 플랫폼 바로가기")');
  const hasSerialSection = serialSection.length >= 1;

  // 1. Naver Web Novel Link
  const naverNovelAnchor = serialSection.find(`a[href="${EXTERNAL_LINKS.naverNovel}"]`);
  const hasNaverNovelUrl = naverNovelAnchor.length >= 1 && naverNovelAnchor.attr('href') === 'http://novel.naver.com/challenge/list?novelId=1250635';
  const naverNovelNewTab = naverNovelAnchor.attr('target') === '_blank' && (naverNovelAnchor.attr('rel') || '').includes('noopener');
  const naverNovelMinH = (naverNovelAnchor.attr('class') || '').includes('min-h-[44px]');

  recordAssertion(
    'Suite 4',
    'CH2.SERIAL.NAVER_NOVEL',
    'Naver Web Novel link exists with target="_blank" and min-h-[44px]',
    hasNaverNovelUrl && naverNovelNewTab && naverNovelMinH,
    'Valid Naver Novel anchor',
    `url=${naverNovelAnchor.attr('href')}, target=${naverNovelAnchor.attr('target')}, minH=${naverNovelMinH}`
  );

  // 2. Naver Webtoon Link
  const naverWebtoonAnchor = serialSection.find(`a[href="${EXTERNAL_LINKS.naverWebtoon}"]`);
  const hasNaverWebtoonUrl = naverWebtoonAnchor.length >= 1 && naverWebtoonAnchor.attr('href') === 'https://comic.naver.com/challenge/list?titleId=856677';
  const naverWebtoonNewTab = naverWebtoonAnchor.attr('target') === '_blank' && (naverWebtoonAnchor.attr('rel') || '').includes('noopener');
  const naverWebtoonMinH = (naverWebtoonAnchor.attr('class') || '').includes('min-h-[44px]');

  recordAssertion(
    'Suite 4',
    'CH2.SERIAL.NAVER_WEBTOON',
    'Naver Webtoon link exists with target="_blank" and min-h-[44px]',
    hasNaverWebtoonUrl && naverWebtoonNewTab && naverWebtoonMinH,
    'Valid Naver Webtoon anchor',
    `url=${naverWebtoonAnchor.attr('href')}, target=${naverWebtoonAnchor.attr('target')}, minH=${naverWebtoonMinH}`
  );

  // 3. Munpia Novel Link
  const munpiaAnchor = serialSection.find(`a[href="${EXTERNAL_LINKS.munpiaNovel}"]`);
  const hasMunpiaUrl = munpiaAnchor.length >= 1 && munpiaAnchor.attr('href') === 'https://nlink.munpia.com/link/munpia/novel/616551';
  const munpiaNewTab = munpiaAnchor.attr('target') === '_blank' && (munpiaAnchor.attr('rel') || '').includes('noopener');
  const munpiaMinH = (munpiaAnchor.attr('class') || '').includes('min-h-[44px]');

  recordAssertion(
    'Suite 4',
    'CH2.SERIAL.MUNPIA',
    'Munpia Novel link exists with target="_blank" and min-h-[44px]',
    hasMunpiaUrl && munpiaNewTab && munpiaMinH,
    'Valid Munpia anchor',
    `url=${munpiaAnchor.attr('href')}, target=${munpiaAnchor.attr('target')}, minH=${munpiaMinH}`
  );

  // 4. Exactly 3 [절찬 연재중] Badges
  const badges = serialSection.find('span:contains("[절찬 연재중]")');
  const badgeCount = badges.length;
  const badgesHaveEmerald = badges.toArray().every((b) => ($h(b).attr('class') || '').includes('bg-emerald-600'));

  recordAssertion(
    'Suite 4',
    'CH2.SERIAL.BADGES_COUNT',
    'All 3 serialization platforms display "[절찬 연재중]" emerald badges',
    badgeCount === 3 && badgesHaveEmerald,
    'Exactly 3 emerald badges',
    `badgeCount=${badgeCount}, allEmerald=${badgesHaveEmerald}`
  );

  // --------------------------------------------------------------------------
  // SUMMARY & VERDICT
  // --------------------------------------------------------------------------
  const total = testResults.length;
  const passed = testResults.filter((r) => r.passed).length;
  const failed = testResults.filter((r) => !r.passed).length;
  const passRate = ((passed / total) * 100).toFixed(1);

  console.log(`\n${BOLD}${CYAN}----------------------------------------------------------------------${RESET}`);
  console.log(`${BOLD}CHALLENGER 2 TEST EXECUTION SUMMARY${RESET}`);
  console.log(`${BOLD}${CYAN}----------------------------------------------------------------------${RESET}`);
  console.log(`Total Assertions Run : ${total}`);
  console.log(`Passed               : ${GREEN}${passed}${RESET}`);
  console.log(`Failed               : ${failed > 0 ? RED + failed + RESET : '0'}`);
  console.log(`Pass Rate            : ${passRate === '100.0' ? GREEN : YELLOW}${passRate}%${RESET}\n`);

  if (failed > 0) {
    console.log(`${RED}${BOLD}[VERDICT] REQUEST_CHANGES — ${failed} challenge assertion(s) failed.${RESET}\n`);
    process.exit(1);
  } else {
    console.log(`${GREEN}${BOLD}[VERDICT] APPROVE — All ${total} adversarial challenge assertions PASSED!${RESET}\n`);
    process.exit(0);
  }
}

runAdversarialInteractionAudit().catch((err) => {
  console.error('Fatal crash in challenger 2 test runner:', err);
  process.exit(1);
});
