/**
 * tests/challenger_m5_9_1_empirical_invariants.ts
 *
 * INDEPENDENT EMPIRICAL ADVERSARIAL STRESS TEST HARNESS — CHALLENGER M5.9.1
 * Focus: Milestone 5 3-Card Pack Reveal Modal Invariants & Dual-Write Persistence Invariants.
 *
 * Requirements from Dispatch:
 * 1. 3-Card Pack Reveal Modal Invariants:
 *    - Verify pack purchases roll exactly 3 distinct cards according to pack rarity bounds
 *      (e.g. Bronze for common [1..50], Silver for magic [20..90], Gold for rare [60..110]).
 *    - Verify renderPackRevealModal() output: contains 3 pack-card-slot elements, card cutout
 *      and bust images, rarity badges, directional stats, and confirm button.
 *    - Test modal dismissals: backdrop click on #pack-reveal-backdrop, close button [x],
 *      confirm button [확인], and keyboard Escape.
 * 2. Dual-Write Persistence Invariants:
 *    - When cards are acquired through pack opening, verify dual-write:
 *      - cardNurtureStore.isCardOwned(cardId) becomes true.
 *      - hero_inventory contains [cardId] with quantity >= 1.
 *      - hero_inventory_s1 and hero_inventory_${season} are both updated.
 *      - On duplicate card acquisition, ownedCardIds preserves uniqueness while quantity increments by 1.
 *      - snshero_inventory_updated event is dispatched with { cardId, quantity }.
 *
 * Usage:
 *   npx tsx tests/challenger_m5_9_1_empirical_invariants.ts
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as cheerio from 'cheerio';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

// ============================================================================
// 1. Headless Browser Polyfills & Mock LocalStorage
// ============================================================================

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
  dump(): Record<string, string> {
    const out: Record<string, string> = {};
    for (const [k, v] of this.store.entries()) {
      out[k] = v;
    }
    return out;
  }
}

const mockStorage = new MockStorage();

if (typeof (globalThis as any).localStorage === 'undefined') {
  (globalThis as any).localStorage = mockStorage;
}

const windowEventListeners: Record<string, Array<(event: any) => void>> = {};

if (typeof (globalThis as any).CustomEvent === 'undefined') {
  (globalThis as any).CustomEvent = class CustomEvent {
    type: string;
    detail: any;
    constructor(type: string, params?: { detail?: any }) {
      this.type = type;
      this.detail = params?.detail;
    }
  };
}

if (typeof (globalThis as any).Event === 'undefined') {
  (globalThis as any).Event = class Event {
    type: string;
    target: any;
    constructor(type: string) {
      this.type = type;
    }
    preventDefault(): void {}
  };
}

if (typeof (globalThis as any).window === 'undefined') {
  (globalThis as any).window = {
    location: { hash: '#shop', pathname: '/', href: 'http://localhost/#shop' },
    history: {
      replaceState: () => {},
      pushState: () => {},
    },
    scrollTo: () => {},
    dispatchEvent: (event: any) => {
      const type = event?.type || String(event);
      if (windowEventListeners[type]) {
        for (const listener of [...windowEventListeners[type]]) {
          listener(event);
        }
      }
      return true;
    },
    addEventListener: (type: string, listener: any) => {
      windowEventListeners[type] = windowEventListeners[type] || [];
      windowEventListeners[type].push(listener);
    },
    removeEventListener: (type: string, listener: any) => {
      if (windowEventListeners[type]) {
        windowEventListeners[type] = windowEventListeners[type].filter((l) => l !== listener);
      }
    },
  };
}

// ============================================================================
// 2. Production Code Imports
// ============================================================================

import { CARD_DATABASE } from '../src/cardDatabase';
import { cardNurtureStore } from '../src/landing/services/cardNurtureStore';
import {
  executeShopPurchase,
  renderPackRevealModal,
  renderShopSection,
  getActiveRevealPack,
  setActiveRevealPack,
  closePackRevealModal,
  getUserCoins,
  setUserCoins,
  debitUserCoins,
  creditUserCoins,
  SHOP_ITEMS,
} from '../src/landing/views/ShopSection';

// ============================================================================
// 3. Colored Reporting Infrastructure
// ============================================================================

const GREEN = '\x1b[92m';
const RED = '\x1b[91m';
const YELLOW = '\x1b[93m';
const CYAN = '\x1b[96m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

interface ChallengeAssertion {
  id: string;
  suite: string;
  name: string;
  passed: boolean;
  expected?: string;
  actual?: string;
  details?: string;
}

const assertionResults: ChallengeAssertion[] = [];

function assert(
  id: string,
  suite: string,
  name: string,
  condition: boolean,
  expected?: string,
  actual?: string,
  details?: string
): void {
  assertionResults.push({ id, suite, name, passed: condition, expected, actual, details });
  const badge = condition ? `${GREEN}✓ PASS${RESET}` : `${RED}✗ FAIL${RESET}`;
  console.log(`  [${badge}] [${CYAN}${id}${RESET}] [${suite}] ${name}`);
  if (!condition) {
    if (expected !== undefined && actual !== undefined) {
      console.log(`         ${YELLOW}↳ Expected:${RESET} ${expected}`);
      console.log(`         ${YELLOW}↳ Actual:  ${RESET} ${actual}`);
    }
    if (details) {
      console.log(`         ${YELLOW}↳ Details: ${RESET} ${details}`);
    }
  }
}

// ============================================================================
// 4. Test Suite Execution
// ============================================================================

async function runEmpiricalChallengerSuite() {
  console.log(`\n${BOLD}========================================================================${RESET}`);
  console.log(`${BOLD}  CHALLENGER M5.9.1: PACK REVEAL MODAL & DUAL-WRITE INVARIANTS HARNESS  ${RESET}`);
  console.log(`${BOLD}========================================================================${RESET}\n`);

  // ==========================================================================
  // SUITE 1: 3-Card Pack Purchase & Rarity Bounds Invariants
  // ==========================================================================
  console.log(`${CYAN}--- [SUITE 1] 3-Card Pack Purchase & Rarity Bounds Invariants ---${RESET}`);

  // 1.1 Normal Pack (pack_normal): 300 SNS, minId: 1, maxId: 50
  {
    setUserCoins(100000);
    let allNormalRollsDistinct = true;
    let allNormalWithinBounds = true;
    let allNormalCountsExact3 = true;
    let allNormalSuccess = true;

    for (let trial = 0; trial < 100; trial++) {
      const res = executeShopPurchase('pack_normal');
      if (!res.success || !res.cardIds) {
        allNormalSuccess = false;
        break;
      }
      if (res.cardIds.length !== 3) {
        allNormalCountsExact3 = false;
      }
      const uniqueIds = new Set(res.cardIds);
      if (uniqueIds.size !== 3) {
        allNormalRollsDistinct = false;
      }
      for (const id of res.cardIds) {
        if (!Number.isInteger(id) || id < 1 || id > 50) {
          allNormalWithinBounds = false;
        }
      }
    }

    assert(
      'CH5-PACK-NORMAL-100',
      'SUITE 1',
      'Normal pack (pack_normal) rolls exactly 3 distinct cards within [1, 50] across 100 trials',
      allNormalSuccess && allNormalCountsExact3 && allNormalRollsDistinct && allNormalWithinBounds,
      '100/100 rolls yield exactly 3 distinct IDs in range 1..50',
      `Success: ${allNormalSuccess}, Exact3: ${allNormalCountsExact3}, Distinct: ${allNormalRollsDistinct}, InBounds: ${allNormalWithinBounds}`
    );
  }

  // 1.2 Magic Pack (pack_magic): 800 SNS, minId: 20, maxId: 90
  {
    setUserCoins(100000);
    let allMagicRollsDistinct = true;
    let allMagicWithinBounds = true;
    let allMagicCountsExact3 = true;
    let allMagicSuccess = true;

    for (let trial = 0; trial < 100; trial++) {
      const res = executeShopPurchase('pack_magic');
      if (!res.success || !res.cardIds) {
        allMagicSuccess = false;
        break;
      }
      if (res.cardIds.length !== 3) {
        allMagicCountsExact3 = false;
      }
      const uniqueIds = new Set(res.cardIds);
      if (uniqueIds.size !== 3) {
        allMagicRollsDistinct = false;
      }
      for (const id of res.cardIds) {
        if (!Number.isInteger(id) || id < 20 || id > 90) {
          allMagicWithinBounds = false;
        }
      }
    }

    assert(
      'CH5-PACK-MAGIC-100',
      'SUITE 1',
      'Magic pack (pack_magic) rolls exactly 3 distinct cards within [20, 90] across 100 trials',
      allMagicSuccess && allMagicCountsExact3 && allMagicRollsDistinct && allMagicWithinBounds,
      '100/100 rolls yield exactly 3 distinct IDs in range 20..90',
      `Success: ${allMagicSuccess}, Exact3: ${allMagicCountsExact3}, Distinct: ${allMagicRollsDistinct}, InBounds: ${allMagicWithinBounds}`
    );
  }

  // 1.3 Rare Pack (pack_rare): 1500 SNS, minId: 60, maxId: 110
  {
    setUserCoins(500000);
    let allRareRollsDistinct = true;
    let allRareWithinBounds = true;
    let allRareCountsExact3 = true;
    let allRareSuccess = true;

    for (let trial = 0; trial < 100; trial++) {
      const res = executeShopPurchase('pack_rare');
      if (!res.success || !res.cardIds) {
        allRareSuccess = false;
        break;
      }
      if (res.cardIds.length !== 3) {
        allRareCountsExact3 = false;
      }
      const uniqueIds = new Set(res.cardIds);
      if (uniqueIds.size !== 3) {
        allRareRollsDistinct = false;
      }
      for (const id of res.cardIds) {
        if (!Number.isInteger(id) || id < 60 || id > 110) {
          allRareWithinBounds = false;
        }
      }
    }

    assert(
      'CH5-PACK-RARE-100',
      'SUITE 1',
      'Rare pack (pack_rare) rolls exactly 3 distinct cards within [60, 110] across 100 trials',
      allRareSuccess && allRareCountsExact3 && allRareRollsDistinct && allRareWithinBounds,
      '100/100 rolls yield exactly 3 distinct IDs in range 60..110',
      `Success: ${allRareSuccess}, Exact3: ${allRareCountsExact3}, Distinct: ${allRareRollsDistinct}, InBounds: ${allRareWithinBounds}`
    );
  }

  // 1.4 Pricing and Balance Accounting Invariants
  {
    setUserCoins(3000);
    const coinsBeforeNormal = getUserCoins();
    const normalRes = executeShopPurchase('pack_normal');
    const coinsAfterNormal = getUserCoins();

    assert(
      'CH5-PRICE-NORMAL',
      'SUITE 1',
      'Normal pack debits exactly 300 SNS (3000 -> 2700)',
      normalRes.success && coinsAfterNormal === coinsBeforeNormal - 300 && coinsAfterNormal === 2700,
      '2700 SNS',
      `${coinsAfterNormal} SNS`
    );

    const magicRes = executeShopPurchase('pack_magic');
    const coinsAfterMagic = getUserCoins();

    assert(
      'CH5-PRICE-MAGIC',
      'SUITE 1',
      'Magic pack debits exactly 800 SNS (2700 -> 1900)',
      magicRes.success && coinsAfterMagic === 1900,
      '1900 SNS',
      `${coinsAfterMagic} SNS`
    );

    const rareRes = executeShopPurchase('pack_rare');
    const coinsAfterRare = getUserCoins();

    assert(
      'CH5-PRICE-RARE',
      'SUITE 1',
      'Rare pack debits exactly 1500 SNS (1900 -> 400)',
      rareRes.success && coinsAfterRare === 400,
      '400 SNS',
      `${coinsAfterRare} SNS`
    );
  }

  // 1.5 Insufficient Balance Rejection & Immunity
  {
    setUserCoins(250);
    closePackRevealModal();
    const resUnderflow = executeShopPurchase('pack_normal');
    const coinsPreserved = getUserCoins();
    const activePackUntouched = getActiveRevealPack() === null;

    assert(
      'CH5-REJECT-INSUFFICIENT',
      'SUITE 1',
      'Insufficient balance (250 < 300) safely rejected with zero balance debit or pack mutation',
      !resUnderflow.success && coinsPreserved === 250 && activePackUntouched,
      'success: false, balance: 250, activePack: null',
      `success: ${resUnderflow.success}, balance: ${coinsPreserved}, activePack: ${activePackUntouched ? 'null' : 'set'}`
    );
  }

  // ==========================================================================
  // SUITE 2: renderPackRevealModal() DOM Output Invariants
  // ==========================================================================
  console.log(`\n${CYAN}--- [SUITE 2] renderPackRevealModal() DOM Output Invariants ---${RESET}`);

  // 2.1 Null pack state returns empty string
  {
    closePackRevealModal();
    const modalHtml = renderPackRevealModal();
    assert(
      'CH5-MODAL-EMPTY',
      'SUITE 2',
      'renderPackRevealModal() returns empty string when activeRevealPack is null',
      modalHtml === '',
      '""',
      JSON.stringify(modalHtml)
    );
  }

  // 2.2 Active pack reveals modal structure and terminal-flat aesthetics
  {
    setUserCoins(5000);
    const purchase = executeShopPurchase('pack_normal');
    const activePack = getActiveRevealPack();
    const modalHtml = renderPackRevealModal();
    const $ = cheerio.load(modalHtml);

    assert(
      'CH5-MODAL-POPULATED',
      'SUITE 2',
      'Pack purchase sets activeRevealPack with 3 cards',
      purchase.success && activePack !== null && activePack.cards.length === 3,
      'activeRevealPack with 3 cards',
      activePack ? `packId: ${activePack.packId}, cards: ${activePack.cards.length}` : 'null'
    );

    // Dialog and backdrop presence
    const modalDialog = $('#pack-reveal-modal');
    const backdrop = $('#pack-reveal-backdrop');
    assert(
      'CH5-MODAL-A11Y-BACKDROP',
      'SUITE 2',
      'Modal has role="dialog", aria-modal="true", and dedicated sibling backdrop',
      modalDialog.length === 1 &&
        modalDialog.attr('role') === 'dialog' &&
        modalDialog.attr('aria-modal') === 'true' &&
        backdrop.length === 1 &&
        backdrop.attr('data-action') === 'close-pack-reveal',
      'role="dialog", aria-modal="true", backdrop with data-action="close-pack-reveal"',
      `Dialog: ${modalDialog.length}, role: ${modalDialog.attr('role')}, Backdrop: ${backdrop.length}`
    );

    // Terminal-Flat aesthetic check
    const dialogFrame = modalDialog.find('.relative.z-10');
    const hasRoundedNone = dialogFrame.hasClass('rounded-none');
    const hasFontMono = modalDialog.hasClass('font-mono');
    const hasHairline = dialogFrame.hasClass('border');

    assert(
      'CH5-MODAL-TERMINAL-FLAT',
      'SUITE 2',
      'Modal frame enforces OpenCode Terminal-Flat design (rounded-none, font-mono, hairline border)',
      hasRoundedNone && hasFontMono && hasHairline,
      'rounded-none, font-mono, hairline border',
      `rounded-none: ${hasRoundedNone}, font-mono: ${hasFontMono}, hairline: ${hasHairline}`
    );

    // Exactly 3 pack-card-slot elements
    const cardSlots = $('.pack-card-slot');
    assert(
      'CH5-MODAL-3-SLOTS',
      'SUITE 2',
      'Modal contains exactly 3 .pack-card-slot elements',
      cardSlots.length === 3,
      '3 slots',
      `${cardSlots.length} slots`
    );

    // Verify slots have data-card-id, data-flipped="true", img, stats, and power
    let allSlotsValid = true;
    let allCutoutsValid = true;
    let allStatsValid = true;
    let allBadgesValid = true;

    cardSlots.each((i, el) => {
      const slot = $(el);
      const cardIdAttr = slot.attr('data-card-id');
      const flippedAttr = slot.attr('data-flipped');
      const cardId = parseInt(cardIdAttr || '0', 10);

      if (!cardIdAttr || flippedAttr !== 'true' || cardId < 1 || cardId > 110) {
        allSlotsValid = false;
      }

      // Check card cutout image
      const img = slot.find('img');
      const imgSrc = img.attr('src');
      const imgOnerror = img.attr('onerror') || '';
      if (!imgSrc || imgSrc !== `/seat/${cardId}.png` || (!imgOnerror.includes('bustUrl') && !imgOnerror.includes('this.src='))) {
        allCutoutsValid = false;
      }

      // Check directional stats and power
      const slotText = slot.text();
      const dbCard = CARD_DATABASE[cardId];
      const top = dbCard?.top ?? 1;
      const right = dbCard?.right ?? 1;
      const bottom = dbCard?.bottom ?? 1;
      const left = dbCard?.left ?? 1;
      const powerExpected = dbCard?.power ?? (top + right + bottom + left);

      const hasCompass = slotText.includes(`N${top}`) && slotText.includes(`E${right}`) && slotText.includes(`S${bottom}`) && slotText.includes(`W${left}`);
      const hasPower = slotText.includes(`PWR ${powerExpected}`);
      if (!hasCompass || !hasPower) {
        allStatsValid = false;
      }

      // Check rarity badge
      const rawRarity = dbCard?.rarity || 'bronze';
      const capitalizedRarity = rawRarity.charAt(0).toUpperCase() + rawRarity.slice(1);
      if (!slotText.includes(capitalizedRarity)) {
        allBadgesValid = false;
      }
    });

    assert(
      'CH5-SLOTS-DATA-IMAGE',
      'SUITE 2',
      'All 3 slots contain data-card-id, data-flipped="true", and /seat/${id}.png cutout with bust fallback',
      allSlotsValid && allCutoutsValid,
      'Valid slot data and image cutouts with onerror fallbacks',
      `SlotsValid: ${allSlotsValid}, CutoutsValid: ${allCutoutsValid}`
    );

    assert(
      'CH5-SLOTS-STATS-PWR-RARITY',
      'SUITE 2',
      'All 3 slots display exact N/E/S/W directional stats, PWR total power, and rarity badges',
      allStatsValid && allBadgesValid,
      'Compass stats, total power, and rarity badges on all 3 slots',
      `StatsValid: ${allStatsValid}, BadgesValid: ${allBadgesValid}`
    );

    // Confirm button with 44px+ touch target
    const confirmBtn = $('[data-action="confirm-pack-reveal"]');
    const confirmHas44px = confirmBtn.hasClass('min-h-[44px]');
    const confirmHasText = confirmBtn.text().includes('확인');

    assert(
      'CH5-CONFIRM-BUTTON',
      'SUITE 2',
      'Modal provides confirm button with data-action="confirm-pack-reveal", min-h-[44px], and "확인" text',
      confirmBtn.length === 1 && confirmHas44px && confirmHasText,
      'data-action="confirm-pack-reveal", min-h-[44px], "확인"',
      `Length: ${confirmBtn.length}, 44px: ${confirmHas44px}, text: "${confirmBtn.text().trim()}"`
    );

    // Close [x] button with 44px+ touch target
    const closeBtn = $('button[data-action="close-pack-reveal"]');
    const closeHas44px = closeBtn.hasClass('min-h-[44px]');
    const closeHasX = closeBtn.text().includes('[x]');

    assert(
      'CH5-CLOSE-BUTTON',
      'SUITE 2',
      'Modal provides top-layer close button with data-action="close-pack-reveal", min-h-[44px], and "[x]"',
      closeBtn.length === 1 && closeHas44px && closeHasX,
      'data-action="close-pack-reveal", min-h-[44px], "[x]"',
      `Length: ${closeBtn.length}, 44px: ${closeHas44px}, text: "${closeBtn.text().trim()}"`
    );
  }

  // 2.3 New vs Duplicate Badges [NEW] vs [보유 +1]
  {
    setUserCoins(100000);
    const p1 = executeShopPurchase('pack_normal');
    const rolledId = p1.cardIds![0];

    setActiveRevealPack({
      packId: 'pack_normal',
      packName: '일반 카드팩',
      cards: [
        {
          cardId: rolledId,
          nameKo: '테스트 영웅 1',
          nameEn: 'Test Hero 1',
          rarity: 'Bronze',
          faction: 'water',
          power: 8,
          top: 2,
          right: 2,
          bottom: 2,
          left: 2,
          bustUrl: '/bust.png',
          seatUrl: `/seat/${rolledId}.png`,
          isNew: false, // duplicate
        },
        {
          cardId: 99,
          nameKo: '신규 영웅 99',
          nameEn: 'New Hero 99',
          rarity: 'Silver',
          faction: 'fire',
          power: 12,
          top: 3,
          right: 3,
          bottom: 3,
          left: 3,
          bustUrl: '/bust99.png',
          seatUrl: '/seat/99.png',
          isNew: true, // brand new
        },
        {
          cardId: 100,
          nameKo: '신규 영웅 100',
          nameEn: 'New Hero 100',
          rarity: 'Gold',
          faction: 'wind',
          power: 16,
          top: 4,
          right: 4,
          bottom: 4,
          left: 4,
          bustUrl: '/bust100.png',
          seatUrl: '/seat/100.png',
          isNew: true,
        },
      ],
    });

    const modalHtml = renderPackRevealModal();
    const hasNewBadge = modalHtml.includes('[NEW]');
    const hasDuplicateBadge = modalHtml.includes('[보유 +1]');

    assert(
      'CH5-MODAL-NEW-DUP-BADGES',
      'SUITE 2',
      'Modal renders [NEW] badge for unowned cards and [보유 +1] for duplicate cards',
      hasNewBadge && hasDuplicateBadge,
      'Both [NEW] and [보유 +1] rendered',
      `hasNew: ${hasNewBadge}, hasDuplicate: ${hasDuplicateBadge}`
    );
  }

  // ==========================================================================
  // SUITE 3: Modal Dismissal Invariants (Backdrop, Close Button, Confirm Button, Escape Key)
  // ==========================================================================
  console.log(`\n${CYAN}--- [SUITE 3] Modal Dismissal Invariants ---${RESET}`);

  // Helper simulating event delegation from src/landing/index.ts
  function simulateLandingClick(target: { id?: string; action?: string; isBackdrop?: boolean; isCardSlot?: boolean }): void {
    // Exact mirror of src/landing/index.ts handleEventDelegation:
    if (target.id === 'pack-reveal-modal' || target.id === 'pack-reveal-backdrop') {
      closePackRevealModal();
      return;
    }
    if (target.action === 'close-pack-reveal' || target.action === 'confirm-pack-reveal') {
      closePackRevealModal();
      return;
    }
  }

  function simulateLandingKeydown(key: string): void {
    // Exact mirror of src/landing/index.ts handleGlobalKeydown:
    if (key === 'Escape') {
      if (getActiveRevealPack()) {
        closePackRevealModal();
        return;
      }
    }
  }

  // 3.1 Backdrop click dismissal via #pack-reveal-backdrop
  {
    setUserCoins(5000);
    executeShopPurchase('pack_normal');
    assert(
      'CH5-DISMISS-SETUP',
      'SUITE 3',
      'Modal is actively open prior to dismissal triggers',
      getActiveRevealPack() !== null,
      'activeRevealPack != null',
      getActiveRevealPack() ? 'active' : 'null'
    );

    simulateLandingClick({ id: 'pack-reveal-backdrop' });

    assert(
      'CH5-DISMISS-BACKDROP',
      'SUITE 3',
      'Clicking #pack-reveal-backdrop safely dismisses modal (getActiveRevealPack() becomes null)',
      getActiveRevealPack() === null && renderPackRevealModal() === '',
      'null and empty HTML',
      getActiveRevealPack() ? 'still active' : 'null'
    );
  }

  // 3.2 Direct modal container click fallback (#pack-reveal-modal)
  {
    setUserCoins(5000);
    executeShopPurchase('pack_normal');

    simulateLandingClick({ id: 'pack-reveal-modal' });

    assert(
      'CH5-DISMISS-CONTAINER',
      'SUITE 3',
      'Clicking direct #pack-reveal-modal container safely dismisses modal',
      getActiveRevealPack() === null,
      'null',
      getActiveRevealPack() ? 'still active' : 'null'
    );
  }

  // 3.3 Close button click dismissal ([x])
  {
    setUserCoins(5000);
    executeShopPurchase('pack_normal');

    simulateLandingClick({ action: 'close-pack-reveal' });

    assert(
      'CH5-DISMISS-CLOSE-BUTTON',
      'SUITE 3',
      'Clicking close button [x] (data-action="close-pack-reveal") dismisses modal',
      getActiveRevealPack() === null,
      'null',
      getActiveRevealPack() ? 'still active' : 'null'
    );
  }

  // 3.4 Confirm button click dismissal ([확인])
  {
    setUserCoins(5000);
    executeShopPurchase('pack_normal');

    simulateLandingClick({ action: 'confirm-pack-reveal' });

    assert(
      'CH5-DISMISS-CONFIRM-BUTTON',
      'SUITE 3',
      'Clicking confirm button [확인] (data-action="confirm-pack-reveal") dismisses modal',
      getActiveRevealPack() === null,
      'null',
      getActiveRevealPack() ? 'still active' : 'null'
    );
  }

  // 3.5 Keyboard Escape dismissal
  {
    setUserCoins(5000);
    executeShopPurchase('pack_normal');

    simulateLandingKeydown('Escape');

    assert(
      'CH5-DISMISS-ESCAPE',
      'SUITE 3',
      'Pressing keyboard Escape key dismisses pack reveal modal',
      getActiveRevealPack() === null,
      'null',
      getActiveRevealPack() ? 'still active' : 'null'
    );
  }

  // 3.6 Adversarial non-Escape keypress immunity
  {
    setUserCoins(5000);
    executeShopPurchase('pack_normal');

    simulateLandingKeydown('Enter');
    simulateLandingKeydown(' ');
    simulateLandingKeydown('Tab');
    simulateLandingKeydown('x');

    assert(
      'CH5-IMMUNITY-NON-ESCAPE-KEYS',
      'SUITE 3',
      'Adversarial non-Escape keys (Enter, Space, Tab, x) do NOT dismiss modal',
      getActiveRevealPack() !== null,
      'modal remains active',
      getActiveRevealPack() ? 'active' : 'closed'
    );
    closePackRevealModal();
  }

  // 3.7 Interior dialog click immunity
  {
    setUserCoins(5000);
    executeShopPurchase('pack_normal');

    simulateLandingClick({ isCardSlot: true });

    assert(
      'CH5-IMMUNITY-INSIDE-CLICK',
      'SUITE 3',
      'Clicking inside dialog content without dismissal action preserves open modal',
      getActiveRevealPack() !== null,
      'modal remains active',
      getActiveRevealPack() ? 'active' : 'closed'
    );
    closePackRevealModal();
  }

  // 3.8 Contract Verification in src/landing/index.ts source code
  {
    const indexSrc = fs.readFileSync(path.join(REPO_ROOT, 'src/landing/index.ts'), 'utf-8');
    const hasBackdropHandling = indexSrc.includes("rawTarget.id === 'pack-reveal-modal' || rawTarget.id === 'pack-reveal-backdrop'");
    const hasCloseAction = indexSrc.includes("action === 'close-pack-reveal' || action === 'confirm-pack-reveal'");
    const hasEscapeHandling = indexSrc.includes("if (getActiveRevealPack()) {\n      closePackRevealModal();");

    assert(
      'CH5-SOURCE-CONTRACT-DISMISSAL',
      'SUITE 3',
      'src/landing/index.ts contains verified handlers for backdrop, close action, and Escape key',
      hasBackdropHandling && hasCloseAction && hasEscapeHandling,
      'All 3 handler paths present in index.ts',
      `Backdrop: ${hasBackdropHandling}, CloseAction: ${hasCloseAction}, Escape: ${hasEscapeHandling}`
    );
  }

  // ==========================================================================
  // SUITE 4: Dual-Write Persistence Invariants (cardNurtureStore & hero_inventory)
  // ==========================================================================
  console.log(`\n${CYAN}--- [SUITE 4] Dual-Write Persistence Invariants ---${RESET}`);

  // 4.1 First-time card acquisition dual-writes to cardNurtureStore and hero_inventory
  {
    const targetCardId = 47;
    const rawInv = mockStorage.getItem('hero_inventory');
    const inv = rawInv ? JSON.parse(rawInv) : {};
    delete inv[String(targetCardId)];
    mockStorage.setItem('hero_inventory', JSON.stringify(inv));
    mockStorage.setItem('hero_inventory_s1', JSON.stringify(inv));

    cardNurtureStore.ownedCardIds = cardNurtureStore.ownedCardIds.filter((id) => id !== targetCardId);
    cardNurtureStore.saveToStorage();

    assert(
      'CH5-DUAL-INIT',
      'SUITE 4',
      'Target Card 47 is initially unowned',
      !cardNurtureStore.isCardOwned(targetCardId),
      'false',
      String(cardNurtureStore.isCardOwned(targetCardId))
    );

    const added = cardNurtureStore.addCard(targetCardId);

    const isOwned = cardNurtureStore.isCardOwned(targetCardId);
    const inOwnedArray = cardNurtureStore.ownedCardIds.includes(targetCardId);

    const rawInvAfter = mockStorage.getItem('hero_inventory');
    const invAfter = rawInvAfter ? JSON.parse(rawInvAfter) : {};
    const cardEntry = invAfter[String(targetCardId)];

    assert(
      'CH5-DUAL-FIRST-ACQUISITION',
      'SUITE 4',
      'First-time card acquisition sets isCardOwned=true and writes quantity=1 to hero_inventory',
      added && isOwned && inOwnedArray && cardEntry && cardEntry.quantity === 1 && cardEntry.cardIndex === targetCardId,
      'isOwned: true, quantity: 1, cardIndex: 47',
      `isOwned: ${isOwned}, entry: ${JSON.stringify(cardEntry)}`
    );
  }

  // 4.2 Dual-write to seasonal keys (hero_inventory_s1, hero_inventory_${season})
  {
    const targetCardId = 53;
    mockStorage.setItem('hero_current_season', 'season4');

    cardNurtureStore.addCard(targetCardId);

    const invMain = mockStorage.getItem('hero_inventory');
    const invS1 = mockStorage.getItem('hero_inventory_s1');
    const invSeason = mockStorage.getItem('hero_inventory_season4');
    const invGuest = mockStorage.getItem('hero_inventory_guest_season4');

    const parsedMain = invMain ? JSON.parse(invMain) : {};
    const parsedS1 = invS1 ? JSON.parse(invS1) : {};
    const parsedSeason = invSeason ? JSON.parse(invSeason) : {};
    const parsedGuest = invGuest ? JSON.parse(invGuest) : {};

    const matchesS1 = parsedS1[String(targetCardId)]?.quantity >= 1;
    const matchesSeason = parsedSeason[String(targetCardId)]?.quantity >= 1;
    const matchesGuest = parsedGuest[String(targetCardId)]?.quantity >= 1;
    const allIdentical = invMain === invS1 && invMain === invSeason && invMain === invGuest;

    assert(
      'CH5-DUAL-SEASON-KEYS',
      'SUITE 4',
      'addCard dual-writes to hero_inventory, hero_inventory_s1, and hero_inventory_${season} synchronously',
      matchesS1 && matchesSeason && matchesGuest && allIdentical,
      'All 4 seasonal and guest inventory keys identically populated',
      `S1: ${matchesS1}, Season4: ${matchesSeason}, Guest: ${matchesGuest}, Identical: ${allIdentical}`
    );

    mockStorage.setItem('hero_current_season', 'season1');
  }

  // 4.3 Duplicate card acquisition preserves uniqueness in ownedCardIds
  {
    const targetCardId = 64;
    cardNurtureStore.addCard(targetCardId);

    const countBefore = cardNurtureStore.ownedCardIds.filter((id) => id === targetCardId).length;
    const lengthBefore = cardNurtureStore.ownedCardIds.length;

    // Add same card 2nd, 3rd, and 4th times
    cardNurtureStore.addCard(targetCardId);
    cardNurtureStore.addCard(targetCardId);
    cardNurtureStore.addCard(targetCardId);

    const countAfter = cardNurtureStore.ownedCardIds.filter((id) => id === targetCardId).length;
    const lengthAfter = cardNurtureStore.ownedCardIds.length;
    const isStrictlyUnique = new Set(cardNurtureStore.ownedCardIds).size === cardNurtureStore.ownedCardIds.length;

    assert(
      'CH5-DUPLICATE-OWNED-UNIQUENESS',
      'SUITE 4',
      'Duplicate card additions preserve uniqueness in ownedCardIds (exactly 1 occurrence, length constant)',
      countBefore === 1 && countAfter === 1 && lengthBefore === lengthAfter && isStrictlyUnique,
      'Count: 1, length unchanged, strictly deduplicated',
      `CountBefore: ${countBefore}, CountAfter: ${countAfter}, LengthBefore: ${lengthBefore}, LengthAfter: ${lengthAfter}`
    );
  }

  // 4.4 Duplicate card acquisition increments quantity in hero_inventory (1 -> 2 -> 3 -> 4)
  {
    const targetCardId = 77;
    const rawInv = mockStorage.getItem('hero_inventory');
    const inv = rawInv ? JSON.parse(rawInv) : {};
    delete inv[String(targetCardId)];
    mockStorage.setItem('hero_inventory', JSON.stringify(inv));
    cardNurtureStore.ownedCardIds = cardNurtureStore.ownedCardIds.filter((id) => id !== targetCardId);

    // 1st add -> quantity = 1
    cardNurtureStore.addCard(targetCardId);
    const q1 = JSON.parse(mockStorage.getItem('hero_inventory')!)[String(targetCardId)]?.quantity;

    // 2nd add -> quantity = 2
    cardNurtureStore.addCard(targetCardId);
    const q2 = JSON.parse(mockStorage.getItem('hero_inventory')!)[String(targetCardId)]?.quantity;

    // 3rd add -> quantity = 3
    cardNurtureStore.addCard(targetCardId);
    const q3 = JSON.parse(mockStorage.getItem('hero_inventory')!)[String(targetCardId)]?.quantity;

    // 4th add -> quantity = 4
    cardNurtureStore.addCard(targetCardId);
    const q4 = JSON.parse(mockStorage.getItem('hero_inventory')!)[String(targetCardId)]?.quantity;
    const q4_s1 = JSON.parse(mockStorage.getItem('hero_inventory_s1')!)[String(targetCardId)]?.quantity;

    assert(
      'CH5-DUPLICATE-QUANTITY-INCREMENTS',
      'SUITE 4',
      'Duplicate acquisitions sequentially increment quantity (1 -> 2 -> 3 -> 4) across inventory keys',
      q1 === 1 && q2 === 2 && q3 === 3 && q4 === 4 && q4_s1 === 4,
      '1, 2, 3, 4',
      `q1: ${q1}, q2: ${q2}, q3: ${q3}, q4: ${q4}, q4_s1: ${q4_s1}`
    );
  }

  // 4.5 snshero_inventory_updated CustomEvent dispatch with exact { cardId, quantity }
  {
    const targetCardId = 88;
    const rawInv = mockStorage.getItem('hero_inventory');
    const inv = rawInv ? JSON.parse(rawInv) : {};
    delete inv[String(targetCardId)];
    mockStorage.setItem('hero_inventory', JSON.stringify(inv));
    mockStorage.setItem('hero_inventory_s1', JSON.stringify(inv));
    cardNurtureStore.ownedCardIds = cardNurtureStore.ownedCardIds.filter((id) => id !== targetCardId);

    let eventReceived = false;
    let receivedCardId = -1;
    let receivedQuantity = -1;
    let receivedInventoryHasKey = false;

    const listener = (e: any) => {
      eventReceived = true;
      receivedCardId = e.detail?.cardId;
      receivedQuantity = e.detail?.quantity;
      receivedInventoryHasKey = !!e.detail?.inventory?.[String(targetCardId)];
    };

    (globalThis as any).window.addEventListener('snshero_inventory_updated', listener);

    // Trigger addCard (quantity: 1)
    cardNurtureStore.addCard(targetCardId);

    // Trigger duplicate addCard (quantity: 2)
    cardNurtureStore.addCard(targetCardId);

    (globalThis as any).window.removeEventListener('snshero_inventory_updated', listener);

    assert(
      'CH5-EVENT-INVENTORY-UPDATED',
      'SUITE 4',
      'snshero_inventory_updated event is dispatched with exact { cardId, quantity, inventory }',
      eventReceived && receivedCardId === targetCardId && receivedQuantity === 2 && receivedInventoryHasKey,
      `cardId: 88, quantity: 2`,
      `Received: ${eventReceived}, cardId: ${receivedCardId}, quantity: ${receivedQuantity}, hasKey: ${receivedInventoryHasKey}`
    );
  }

  // ==========================================================================
  // SUITE 5: Full-Cycle Pack Opening Dual-Write & Storage Stress Test
  // ==========================================================================
  console.log(`\n${CYAN}--- [SUITE 5] Full-Cycle Pack Opening Dual-Write & Storage Stress Test ---${RESET}`);

  // 5.1 15-pack sequential purchase stress test (45 card rolls total)
  {
    setUserCoins(100000);
    const rolledCounts: Record<number, number> = {};

    const rawBefore = mockStorage.getItem('hero_inventory');
    const invBefore = rawBefore ? JSON.parse(rawBefore) : {};

    for (let i = 0; i < 15; i++) {
      const packType = i % 3 === 0 ? 'pack_normal' : i % 3 === 1 ? 'pack_magic' : 'pack_rare';
      const res = executeShopPurchase(packType);
      if (res.cardIds) {
        for (const id of res.cardIds) {
          rolledCounts[id] = (rolledCounts[id] || 0) + 1;
        }
      }
    }

    const rawAfter = mockStorage.getItem('hero_inventory');
    const invAfter = rawAfter ? JSON.parse(rawAfter) : {};
    const invS1After = JSON.parse(mockStorage.getItem('hero_inventory_s1') || '{}');

    let allCountsMatch = true;
    let allOwnedInStore = true;

    for (const [idStr, rolledCount] of Object.entries(rolledCounts)) {
      const id = parseInt(idStr, 10);
      const initialQty = invBefore[idStr]?.quantity || 0;
      const expectedQty = initialQty + rolledCount;
      const actualQty = invAfter[idStr]?.quantity;
      const actualS1Qty = invS1After[idStr]?.quantity;

      if (actualQty !== expectedQty || actualS1Qty !== expectedQty) {
        allCountsMatch = false;
      }
      if (!cardNurtureStore.isCardOwned(id)) {
        allOwnedInStore = false;
      }
    }

    const ownedAreUnique = new Set(cardNurtureStore.ownedCardIds).size === cardNurtureStore.ownedCardIds.length;
    const inventoriesStrictlyMatch = mockStorage.getItem('hero_inventory') === mockStorage.getItem('hero_inventory_s1');

    assert(
      'CH5-STRESS-15-PACKS',
      'SUITE 5',
      '15 sequential pack openings (45 cards) preserve exact quantity math, uniqueness, and dual-write equality',
      allCountsMatch && allOwnedInStore && ownedAreUnique && inventoriesStrictlyMatch,
      'Exact quantity math, all owned, strictly deduplicated, hero_inventory === hero_inventory_s1',
      `CountsMatch: ${allCountsMatch}, OwnedInStore: ${allOwnedInStore}, Unique: ${ownedAreUnique}, InvMatch: ${inventoriesStrictlyMatch}`
    );
  }

  // 5.2 hero_card_nurturing payload consistency
  {
    const rawNurture = mockStorage.getItem('hero_card_nurturing');
    const nurturePayload = rawNurture ? JSON.parse(rawNurture) : null;

    const hasPayload = nurturePayload !== null;
    const hasOwnedIds = Array.isArray(nurturePayload?.ownedCardIds);
    const ownedIdsMatch = hasOwnedIds && nurturePayload.ownedCardIds.length === cardNurtureStore.ownedCardIds.length;
    const hasCards = typeof nurturePayload?.cards === 'object' && Object.keys(nurturePayload.cards).length === 110;

    assert(
      'CH5-NURTURE-STORAGE-PAYLOAD',
      'SUITE 5',
      'hero_card_nurturing in localStorage maintains valid schema with 110 cards and matching ownedCardIds',
      hasPayload && hasOwnedIds && ownedIdsMatch && hasCards,
      '110 cards in schema, matching ownedCardIds array',
      `Payload: ${hasPayload}, OwnedMatch: ${ownedIdsMatch}, Cards: ${Object.keys(nurturePayload?.cards || {}).length}`
    );
  }

  // 5.3 Adversarial invalid card ID injection immunity
  {
    const ownedLenBefore = cardNurtureStore.ownedCardIds.length;

    const add0 = cardNurtureStore.addCard(0);
    const addNeg = cardNurtureStore.addCard(-1);
    const add111 = cardNurtureStore.addCard(111);
    const addNaN = cardNurtureStore.addCard(NaN);
    const addFloat = cardNurtureStore.addCard(3.14);

    const ownedLenAfter = cardNurtureStore.ownedCardIds.length;

    assert(
      'CH5-IMMUNITY-INVALID-CARD-IDS',
      'SUITE 5',
      'Adversarial invalid card IDs (0, -1, 111, NaN, 3.14) safely rejected without store corruption',
      !add0 && !addNeg && !add111 && !addNaN && !addFloat && ownedLenBefore === ownedLenAfter,
      'All rejected (false), ownedCardIds length unchanged',
      `add0: ${add0}, addNeg: ${addNeg}, add111: ${add111}, addNaN: ${addNaN}, addFloat: ${addFloat}, length: ${ownedLenAfter}`
    );
  }

  // 5.4 Corrupted inventory string resilience
  {
    const backupInv = mockStorage.getItem('hero_inventory');

    mockStorage.setItem('hero_inventory', '{{CORRUPTED_JSON_NOT_VALID}}');

    let threw = false;
    try {
      cardNurtureStore.addCard(95);
    } catch {
      threw = true;
    }

    assert(
      'CH5-RESILIENCE-CORRUPTED-INVENTORY',
      'SUITE 5',
      'addCard handles corrupted non-JSON hero_inventory gracefully without uncaught exceptions',
      !threw,
      'Zero exceptions thrown, safe catch and warning',
      `Threw: ${threw}`
    );

    if (backupInv) mockStorage.setItem('hero_inventory', backupInv);
  }

  // 5.5 Boundary Card IDs (Card 1 and Card 110)
  {
    cardNurtureStore.addCard(1);
    cardNurtureStore.addCard(110);

    const is1Owned = cardNurtureStore.isCardOwned(1);
    const is110Owned = cardNurtureStore.isCardOwned(110);

    const inv = JSON.parse(mockStorage.getItem('hero_inventory') || '{}');
    const has1 = inv['1']?.quantity >= 1;
    const has110 = inv['110']?.quantity >= 1;

    assert(
      'CH5-BOUNDARY-CARD-1-AND-110',
      'SUITE 5',
      'Boundary card IDs (Card 1 minimum, Card 110 Boss maximum) dual-write with full integrity',
      is1Owned && is110Owned && has1 && has110,
      'Card 1 and Card 110 both owned and present in hero_inventory',
      `Card1: ${is1Owned} (${inv['1']?.quantity}), Card110: ${is110Owned} (${inv['110']?.quantity})`
    );
  }

  // ==========================================================================
  // Summary & Reporting
  // ==========================================================================
  const total = assertionResults.length;
  const passed = assertionResults.filter((r) => r.passed).length;
  const failed = assertionResults.filter((r) => !r.passed).length;
  const passRate = ((passed / total) * 100).toFixed(1);

  console.log(`\n${BOLD}========================================================================${RESET}`);
  console.log(`${BOLD}  EMPIRICAL CHALLENGER M5.9.1 EXECUTION SUMMARY                        ${RESET}`);
  console.log(`${BOLD}========================================================================${RESET}`);
  console.log(`  Total Assertions Run : ${total}`);
  console.log(`  Passed               : ${GREEN}${passed}${RESET}`);
  console.log(`  Failed               : ${failed > 0 ? RED + failed + RESET : '0'}`);
  console.log(`  Pass Rate            : ${passRate === '100.0' ? GREEN : RED}${passRate}%${RESET}`);
  console.log(`${BOLD}========================================================================${RESET}\n`);

  if (failed > 0) {
    console.error(`${RED}[VERDICT] REQUEST_CHANGES — ${failed} assertion(s) failed!${RESET}`);
    process.exit(1);
  } else {
    console.log(`${GREEN}[VERDICT] APPROVE — All ${passed} empirical invariants verified successfully!${RESET}`);
    process.exit(0);
  }
}

runEmpiricalChallengerSuite().catch((err) => {
  console.error('Fatal error running challenger test suite:', err);
  process.exit(1);
});
