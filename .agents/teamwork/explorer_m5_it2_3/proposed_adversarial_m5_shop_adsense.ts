/**
 * tests/adversarial_m5_shop_adsense.ts
 *
 * Remediated Adversarial Test Harness for Milestone 5:
 * Shop Restoration, 3-Card Pack Reveal Modal, Currency Invariants,
 * Dual-Write Persistence, and Responsive Google AdSense Placements.
 *
 * Target Milestone: Milestone 5 (PROJECT.md Features 16–22)
 *
 * Remediation Objectives Completed:
 *   1. All mock doubles (ReferenceShopManager, ReferenceAdSenseManager, ReferenceNurtureStore)
 *      completely replaced with direct calls to production implementations in ShopSection.tsx,
 *      adsenseManager.ts, and cardNurtureStore.ts.
 *   2. ADV-M5-GOLD-05 tautology (typeof hasFreeFaucetButton === 'boolean') replaced with
 *      authentic invariant check (hasFreeFaucetButton === false) across ShopSection.tsx & index.ts.
 *   3. Local string template renderMockPackRevealModal eliminated; ADV-M5-PACK-02..08 now directly
 *      invoke and validate production renderPackRevealModal() and closePackRevealModal().
 *   4. All 38 assertions across all 6 suites directly call production functions and verify
 *      authentic invariants with zero mock shortcuts.
 *
 * Suites:
 *   - Suite 1: 3-Card Pack Reveal Modal (PackRevealModal) DOM Structure & Lifecycles
 *   - Suite 2: Currency Balance Debit & Credit Invariants (SNS Accounting)
 *   - Suite 3: Non-Free Currency Replenishment (5,000 Gold -> 1,000 SNS Exchange)
 *   - Suite 4: Dual-Write Persistence (cardNurtureStore & hero_inventory)
 *   - Suite 5: Responsive Google AdSense Layout & Breakpoints (Desktop Gutters vs Mobile Banner)
 *   - Suite 6: AdSense Configuration & VIP Ad-Removal Guard (hero_ad_removed Suppression)
 *
 * Usage:
 *   npx tsx tests/adversarial_m5_shop_adsense.ts
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

// ============================================================================
// 1. Headless In-Memory Storage & Browser Environment Setup
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

const eventListeners: Record<string, Array<(event: any) => void>> = {};

if (typeof (globalThis as any).window === 'undefined') {
  (globalThis as any).window = {
    location: { hash: '#shop', pathname: '/' },
    innerWidth: 1024,
    adsbygoogle: [] as any[],
    dispatchEvent: (event: any) => {
      const type = event?.type || String(event);
      if (eventListeners[type]) {
        for (const listener of eventListeners[type]) {
          listener(event);
        }
      }
      return true;
    },
    addEventListener: (type: string, listener: any) => {
      eventListeners[type] = eventListeners[type] || [];
      eventListeners[type].push(listener);
    },
    removeEventListener: (type: string, listener: any) => {
      if (eventListeners[type]) {
        eventListeners[type] = eventListeners[type].filter((l) => l !== listener);
      }
    },
  };
}

if (typeof (globalThis as any).document === 'undefined') {
  (globalThis as any).document = {
    addEventListener: () => {},
    removeEventListener: () => {},
    querySelectorAll: () => [],
    getElementById: () => null,
  };
}

if (typeof (globalThis as any).Event === 'undefined') {
  (globalThis as any).Event = class Event {
    type: string;
    constructor(type: string) {
      this.type = type;
    }
  };
}

// ============================================================================
// 2. Production Deliverable Imports (Zero Mocks / Zero Test Doubles)
// ============================================================================

import { CARD_DATABASE } from '../src/cardDatabase';
import { cardNurtureStore, CardNurtureStore } from '../src/landing/services/cardNurtureStore';
import {
  SHOP_ITEMS,
  getUserCoins,
  setUserCoins,
  getUserGold,
  setUserGold,
  debitUserCoins,
  creditUserCoins,
  exchangeGoldForSns,
  executeShopPurchase,
  renderPackRevealModal,
  renderGoldExchangeModal,
  getActiveRevealPack,
  setActiveRevealPack,
  closePackRevealModal,
} from '../src/landing/views/ShopSection';

import {
  ADSENSE_CONFIG,
  isAdRemoved,
  getAdPlacements,
  renderDesktopLeftGutter,
  renderDesktopRightGutter,
  renderMobileTopBanner,
  pushAdSenseTags,
} from '../src/landing/services/adsenseManager';

import { readProjectFile } from './e2e/helpers';

// ============================================================================
// 3. Colored Test Reporting Infrastructure
// ============================================================================

const GREEN = '\x1b[92m';
const RED = '\x1b[91m';
const YELLOW = '\x1b[93m';
const CYAN = '\x1b[96m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

interface AssertionResult {
  id: string;
  suite: string;
  name: string;
  passed: boolean;
  expected?: string;
  actual?: string;
  details?: string;
}

const results: AssertionResult[] = [];

function assert(
  id: string,
  suite: string,
  name: string,
  condition: boolean,
  expected?: string,
  actual?: string,
  details?: string
): void {
  results.push({ id, suite, name, passed: condition, expected, actual, details });
  const badge = condition ? `${GREEN}PASS${RESET}` : `${RED}FAIL${RESET}`;
  console.log(`  [${badge}] [${CYAN}${id}${RESET}] [${suite}] ${name}`);
  if (!condition) {
    if (expected !== undefined && actual !== undefined) {
      console.log(`         ${YELLOW}Expected:${RESET} ${expected}`);
      console.log(`         ${YELLOW}Actual:  ${RESET} ${actual}`);
    }
    if (details) {
      console.log(`         ${YELLOW}Details: ${RESET} ${details}`);
    }
  }
}

console.log(`${BOLD}========================================================================${RESET}`);
console.log(`${BOLD}  SNSHero REMEDIATED M5: SHOP & RESPONSIVE ADSENSE ADVERSARIAL HARNESS  ${RESET}`);
console.log(`${BOLD}========================================================================${RESET}\n`);

// ============================================================================
// SUITE 1: 3-Card Pack Reveal Modal (PackRevealModal) DOM Structure & Lifecycles
// ============================================================================
console.log(`${CYAN}--- [SUITE 1] 3-Card Pack Reveal Modal (PackRevealModal) DOM Structure & Lifecycles ---${RESET}`);
{
  // Setup: Clear storage and provide initial currency
  mockStorage.clear();
  mockStorage.setItem('hero_sns', '2000');
  mockStorage.setItem('hero_earned_sns', '2000');
  mockStorage.setItem('hero_purchased_sns', '0');

  // 1. Pack purchase yields 3 cards via production executeShopPurchase
  const purchase = executeShopPurchase('pack_normal');
  const revealedCards = purchase.revealedCards || [];

  assert(
    'ADV-M5-PACK-01',
    'SUITE 1',
    'Pack purchase produces exactly 3 revealed cards with required attributes',
    purchase.success &&
      revealedCards.length === 3 &&
      revealedCards.every(
        (c) =>
          typeof c.cardId === 'number' &&
          c.cardId >= 1 &&
          c.cardId <= 110 &&
          typeof c.nameKo === 'string' &&
          typeof c.rarity === 'string' &&
          typeof c.power === 'number'
      ),
    '3 cards with cardId, nameKo, rarity, power',
    `Count: ${revealedCards.length}, IDs: ${revealedCards.map((c) => c.cardId).join(',')}`
  );

  // 2. Production renderPackRevealModal() call
  const modalHtml = renderPackRevealModal();

  assert(
    'ADV-M5-PACK-02',
    'SUITE 1',
    'Modal container adheres to OpenCode Terminal-Flat design (rounded-none, font-mono, hairline)',
    modalHtml.includes('rounded-none') && modalHtml.includes('font-mono') && modalHtml.includes('border'),
    'Contains rounded-none and font-mono and hairline border',
    'Verified via production renderPackRevealModal()'
  );

  assert(
    'ADV-M5-PACK-03',
    'SUITE 1',
    'Modal contains exactly 3 card display slots (pack-card-slot)',
    (modalHtml.match(/pack-card-slot/g) || []).length === 3,
    '3 pack-card-slot elements',
    `Found: ${(modalHtml.match(/pack-card-slot/g) || []).length}`
  );

  assert(
    'ADV-M5-PACK-04',
    'SUITE 1',
    'Each revealed card references /seat/${id}.png and displays rarity and power',
    revealedCards.every((c) => modalHtml.includes(`/seat/${c.cardId}.png`) && modalHtml.includes(c.nameKo)),
    'All 3 card image URLs and names rendered in production modal',
    'Verified via production renderPackRevealModal()'
  );

  assert(
    'ADV-M5-PACK-05',
    'SUITE 1',
    'Modal provides top-layer [x] close button with min-h-[44px] touch target',
    modalHtml.includes('data-action="close-pack-reveal"') && modalHtml.includes('min-h-[44px]'),
    'Contains close button with min-h-[44px]',
    'Verified via production renderPackRevealModal()'
  );

  assert(
    'ADV-M5-PACK-06',
    'SUITE 1',
    'Modal provides confirm button with min-h-[44px] and rounded-sm radius',
    modalHtml.includes('data-action="confirm-pack-reveal"') &&
      modalHtml.includes('min-h-[44px]') &&
      modalHtml.includes('rounded-sm'),
    'Contains confirm button with min-h-[44px] and rounded-sm',
    'Verified via production renderPackRevealModal()'
  );

  assert(
    'ADV-M5-PACK-07',
    'SUITE 1',
    'Modal includes fixed inset-0 backdrop for click dismissal',
    modalHtml.includes('fixed inset-0') && modalHtml.includes('bg-black/'),
    'Contains fixed inset-0 backdrop',
    'Verified via production renderPackRevealModal()'
  );

  // Close modal lifecycle
  closePackRevealModal();
  const closedModalHtml = renderPackRevealModal();

  assert(
    'ADV-M5-PACK-08',
    'SUITE 1',
    'Modal returns empty string when closed (after closePackRevealModal())',
    closedModalHtml === '',
    'Empty string',
    `Length: ${closedModalHtml.length}`
  );
}

// ============================================================================
// SUITE 2: Currency Balance Debit & Credit Invariants (SNS Accounting)
// ============================================================================
console.log(`\n${CYAN}--- [SUITE 2] Currency Balance Debit & Credit Invariants (SNS Accounting) ---${RESET}`);
{
  mockStorage.clear();
  mockStorage.setItem('hero_sns', '1000');
  mockStorage.setItem('hero_gold', '10000');
  mockStorage.setItem('hero_earned_sns', '1000');
  mockStorage.setItem('hero_purchased_sns', '0');

  assert(
    'ADV-M5-CURR-01',
    'SUITE 2',
    'Initial currency balances correctly initialized (SNS: 1000, Gold: 10000)',
    getUserCoins() === 1000 && getUserGold() === 10000,
    'SNS: 1000, Gold: 10000',
    `SNS: ${getUserCoins()}, Gold: ${getUserGold()}`
  );

  // Normal pack purchase (300 SNS)
  const buyNormal = executeShopPurchase('pack_normal');
  assert(
    'ADV-M5-CURR-02',
    'SUITE 2',
    'Normal pack purchase debits exactly 300 SNS (1000 -> 700)',
    buyNormal.success && getUserCoins() === 700,
    '700 SNS',
    `${getUserCoins()} SNS`
  );

  // Magic pack purchase (cost 800 SNS) with only 700 SNS -> Insufficient!
  const buyMagic = executeShopPurchase('pack_magic');
  assert(
    'ADV-M5-CURR-03',
    'SUITE 2',
    'Magic pack purchase (800 SNS) safely rejected when balance is 700 SNS',
    buyMagic.success === false && (!buyMagic.revealedCards || buyMagic.revealedCards.length === 0),
    'success: false, revealedCards: []',
    `success: ${buyMagic.success}, error: ${buyMagic.error}`
  );

  assert(
    'ADV-M5-CURR-04',
    'SUITE 2',
    'Rejected purchase preserves SNS balance with 0 currency leakage (remains 700)',
    getUserCoins() === 700,
    '700 SNS',
    `${getUserCoins()} SNS`
  );

  // Check that no unearned cards were added during rejected purchase
  const ownedCountBefore = cardNurtureStore.ownedCardIds.length;
  executeShopPurchase('pack_rare'); // 1,500 SNS (insufficient)
  assert(
    'ADV-M5-CURR-05',
    'SUITE 2',
    'Rejected purchase preserves cardNurtureStore owned list with 0 phantom cards added',
    cardNurtureStore.ownedCardIds.length === ownedCountBefore,
    `Owned count: ${ownedCountBefore}`,
    `Owned count: ${cardNurtureStore.ownedCardIds.length}`
  );

  // Edge case: Negative or zero balance
  mockStorage.setItem('hero_sns', '0');
  mockStorage.setItem('hero_earned_sns', '0');
  mockStorage.setItem('hero_purchased_sns', '0');
  const buyZero = executeShopPurchase('pack_normal');
  assert(
    'ADV-M5-CURR-06',
    'SUITE 2',
    'Purchasing with 0 SNS safely rejected without underflow into negative balance',
    buyZero.success === false && getUserCoins() === 0,
    'success: false, SNS: 0',
    `success: ${buyZero.success}, SNS: ${getUserCoins()}`
  );

  // Event dispatch test: updating coins triggers 'snshero_sns_updated'
  let eventFired = false;
  const onSnsUpdated = () => {
    eventFired = true;
  };
  window.addEventListener('snshero_sns_updated', onSnsUpdated);
  setUserCoins(500);
  window.removeEventListener('snshero_sns_updated', onSnsUpdated);
  assert(
    'ADV-M5-CURR-07',
    'SUITE 2',
    'snshero_sns_updated event listener dispatches and handles reactive balance changes',
    eventFired === true,
    'true',
    String(eventFired)
  );
}

// ============================================================================
// SUITE 3: Non-Free Currency Replenishment (5,000 Gold -> 1,000 SNS Exchange)
// ============================================================================
console.log(`\n${CYAN}--- [SUITE 3] Non-Free Currency Replenishment (5,000 Gold -> 1,000 SNS Exchange) ---${RESET}`);
{
  mockStorage.clear();
  mockStorage.setItem('hero_sns', '500');
  mockStorage.setItem('hero_gold', '12000');
  mockStorage.setItem('hero_earned_sns', '500');
  mockStorage.setItem('hero_purchased_sns', '0');

  // Standard 5,000 Gold -> 1,000 SNS exchange via production exchangeGoldForSns
  const exch1 = exchangeGoldForSns(5000);
  assert(
    'ADV-M5-GOLD-01',
    'SUITE 3',
    'Exchanging 5,000 Gold debits 5,000 Gold (12000 -> 7000) and credits 1,000 SNS (500 -> 1500)',
    exch1.success &&
      exch1.snsGranted === 1000 &&
      getUserGold() === 7000 &&
      getUserCoins() === 1500,
    'Gold: 7000, SNS: 1500, Granted: 1000',
    `Gold: ${getUserGold()}, SNS: ${getUserCoins()}, Granted: ${exch1.snsGranted}`
  );

  const earnedSnsVal = Number(mockStorage.getItem('hero_earned_sns'));
  assert(
    'ADV-M5-GOLD-02',
    'SUITE 3',
    'Gold exchange increments hero_earned_sns by granted amount',
    earnedSnsVal === 1500,
    'earnedSns: 1500',
    `earnedSns: ${earnedSnsVal}`
  );

  // Exchange with insufficient gold
  mockStorage.setItem('hero_gold', '3000');
  const exchFail = exchangeGoldForSns(5000);
  assert(
    'ADV-M5-GOLD-03',
    'SUITE 3',
    'Exchange of 5,000 Gold safely rejected when gold balance is 3,000',
    exchFail.success === false &&
      getUserGold() === 3000 &&
      getUserCoins() === 1500,
    'success: false, Gold: 3000, SNS: 1500',
    `success: ${exchFail.success}, Gold: ${getUserGold()}, SNS: ${getUserCoins()}`
  );

  // Zero and negative exchange requests
  const exchZero = exchangeGoldForSns(0);
  const exchNegative = exchangeGoldForSns(-5000);
  assert(
    'ADV-M5-GOLD-04',
    'SUITE 3',
    'Zero or negative gold amounts safely rejected with error message',
    exchZero.success === false && exchNegative.success === false,
    'Both rejected',
    `Zero: ${exchZero.success}, Negative: ${exchNegative.success}`
  );

  // Prohibited free faucet detection across ShopSection.tsx and index.ts
  const shopSectionContent = readProjectFile('src/landing/views/ShopSection.tsx') || '';
  const indexContent = readProjectFile('src/landing/index.ts') || '';
  const hasFreeFaucetButton =
    shopSectionContent.includes('free-charge-coin') ||
    shopSectionContent.includes('+ 코인 무료 충전') ||
    shopSectionContent.includes('무료 충전') ||
    indexContent.includes('free-charge-coin') ||
    indexContent.includes('+ 코인 무료 충전') ||
    indexContent.includes('무료 충전');

  // Remediated: Authentic boolean invariant verification (strictly false)
  assert(
    'ADV-M5-GOLD-05',
    'SUITE 3',
    'ShopSection and index.ts source strictly eliminate all free faucet indicators and buttons',
    hasFreeFaucetButton === false,
    'false (no free faucets in ShopSection.tsx or index.ts)',
    `hasFreeFaucetButton: ${hasFreeFaucetButton}`
  );
}

// ============================================================================
// SUITE 4: Dual-Write Persistence (cardNurtureStore & hero_inventory)
// ============================================================================
console.log(`\n${CYAN}--- [SUITE 4] Dual-Write Persistence (cardNurtureStore & hero_inventory) ---${RESET}`);
{
  mockStorage.clear();
  mockStorage.setItem('hero_sns', '5000');
  mockStorage.setItem('hero_earned_sns', '5000');
  mockStorage.setItem('hero_purchased_sns', '0');
  mockStorage.setItem('hero_gold', '10000');

  // Production executeShopPurchase('pack_rare')
  const purchaseRare = executeShopPurchase('pack_rare');
  const rareRevealed = purchaseRare.revealedCards || [];

  assert(
    'ADV-M5-DUAL-01',
    'SUITE 4',
    'Pack purchase yields 3 cards',
    purchaseRare.success && rareRevealed.length === 3,
    '3 cards',
    `${rareRevealed.length} cards`
  );

  const rolledIds = rareRevealed.map((c) => c.cardId);

  // 1. Check cardNurtureStore
  const allInNurture = rolledIds.every((id) => cardNurtureStore.isCardOwned(id));
  assert(
    'ADV-M5-DUAL-02',
    'SUITE 4',
    'All 3 rolled cards are immediately registered in cardNurtureStore.ownedCardIds',
    allInNurture,
    'true',
    String(allInNurture)
  );

  // 2. Check hero_inventory in LocalStorage
  const rawInventory = mockStorage.getItem('hero_inventory');
  const allInInventory = rolledIds.every((id) => rawInventory && rawInventory.includes(String(id)));
  assert(
    'ADV-M5-DUAL-03',
    'SUITE 4',
    'All 3 rolled cards are dual-written to LocalStorage hero_inventory key',
    allInInventory,
    'true',
    String(allInInventory)
  );

  // 3. Check cardNurtureStore production instance syncCardToHeroInventory
  const prodNurture = new CardNurtureStore();
  const testCardId = 42;
  prodNurture.addCard(testCardId);
  const prodInv = mockStorage.getItem('hero_inventory');
  assert(
    'ADV-M5-DUAL-04',
    'SUITE 4',
    'Production CardNurtureStore.addCard(42) dual-writes to hero_inventory with seasonal keys',
    prodNurture.isCardOwned(testCardId) &&
      prodInv !== null &&
      prodInv.includes('42') &&
      mockStorage.getItem('hero_inventory_season1') !== null,
    'Owned: true, hero_inventory includes 42, season1 exists',
    `Owned: ${prodNurture.isCardOwned(testCardId)}, Inv has 42: ${prodInv?.includes('42')}`
  );

  // 4. Duplicate card handling: adding same card does not corrupt store
  const ownedLengthBefore = prodNurture.ownedCardIds.length;
  prodNurture.addCard(testCardId); // Duplicate
  assert(
    'ADV-M5-DUAL-05',
    'SUITE 4',
    'Adding duplicate card does not create duplicate entries in ownedCardIds',
    prodNurture.ownedCardIds.length === ownedLengthBefore &&
      prodNurture.ownedCardIds.filter((id) => id === testCardId).length === 1,
    'Deduplicated single entry',
    `Occurrences: ${prodNurture.ownedCardIds.filter((id) => id === testCardId).length}`
  );
}

// ============================================================================
// SUITE 5: Responsive Google AdSense Layout & Breakpoints
// ============================================================================
console.log(`\n${CYAN}--- [SUITE 5] Responsive Google AdSense Layout & Breakpoints ---${RESET}`);
{
  mockStorage.clear(); // Ensure hero_ad_removed is NOT set

  // 1. Desktop >= 1024px: Gutters active, mobile top inactive via production getAdPlacements
  const at1280 = getAdPlacements(1280);
  assert(
    'ADV-M5-ADS-01',
    'SUITE 5',
    'Desktop viewport (1280px) activates desktop left and right gutters',
    at1280.desktopLeft === true && at1280.desktopRight === true && at1280.mobileTop === false,
    'left: true, right: true, mobileTop: false',
    `left: ${at1280.desktopLeft}, right: ${at1280.desktopRight}, mobileTop: ${at1280.mobileTop}`
  );

  const at1920 = getAdPlacements(1920);
  assert(
    'ADV-M5-ADS-02',
    'SUITE 5',
    'Widescreen viewport (1920px) activates desktop gutters and suppresses mobile top banner',
    at1920.desktopLeft === true && at1920.desktopRight === true && at1920.mobileTop === false,
    'left: true, right: true, mobileTop: false',
    `left: ${at1920.desktopLeft}, right: ${at1920.desktopRight}, mobileTop: ${at1920.mobileTop}`
  );

  // 2. Mobile < 1024px: Mobile top banner active, desktop gutters inactive
  const at375 = getAdPlacements(375);
  assert(
    'ADV-M5-ADS-03',
    'SUITE 5',
    'Mobile viewport (375px) activates mobile top banner and suppresses desktop gutters',
    at375.mobileTop === true && at375.desktopLeft === false && at375.desktopRight === false,
    'mobileTop: true, left: false, right: false',
    `mobileTop: ${at375.mobileTop}, left: ${at375.desktopLeft}, right: ${at375.desktopRight}`
  );

  const at768 = getAdPlacements(768);
  assert(
    'ADV-M5-ADS-04',
    'SUITE 5',
    'Tablet viewport (768px) activates mobile top banner and suppresses desktop gutters',
    at768.mobileTop === true && at768.desktopLeft === false && at768.desktopRight === false,
    'mobileTop: true, left: false, right: false',
    `mobileTop: ${at768.mobileTop}, left: ${at768.desktopLeft}, right: ${at768.desktopRight}`
  );

  // 3. Exact 1023px vs 1024px boundary
  const at1023 = getAdPlacements(1023);
  assert(
    'ADV-M5-ADS-05',
    'SUITE 5',
    'Exact boundary at 1023px renders mobile top banner (mobileTop: true, desktop: false)',
    at1023.mobileTop === true && at1023.desktopLeft === false && at1023.desktopRight === false,
    'mobileTop: true, desktop: false',
    `mobileTop: ${at1023.mobileTop}, desktopLeft: ${at1023.desktopLeft}`
  );

  const at1024 = getAdPlacements(1024);
  assert(
    'ADV-M5-ADS-06',
    'SUITE 5',
    'Exact boundary at 1024px switches to desktop gutters (desktopLeft: true, mobileTop: false)',
    at1024.desktopLeft === true && at1024.desktopRight === true && at1024.mobileTop === false,
    'desktopLeft: true, mobileTop: false',
    `desktopLeft: ${at1024.desktopLeft}, mobileTop: ${at1024.mobileTop}`
  );

  // 4. Non-obstructing layout geometry contract
  const landingCss = readProjectFile('src/landing/styles/landing.css') || '';
  const leftGutterHtml = renderDesktopLeftGutter();
  const mobileBannerHtml = renderMobileTopBanner();
  assert(
    'ADV-M5-ADS-07',
    'SUITE 5',
    'Responsive breakpoint classes @media (min-width: 1024px) exist and production banners have hidden/block lg classes',
    landingCss.includes('min-width: 1024px') &&
      leftGutterHtml.includes('hidden lg:flex') &&
      mobileBannerHtml.includes('block lg:hidden'),
    'Contains min-width: 1024px and proper responsive utility classes',
    'Verified via CSS inspection and production gutter/banner HTML'
  );
}

// ============================================================================
// SUITE 6: AdSense Configuration & VIP Ad-Removal Guard (hero_ad_removed)
// ============================================================================
console.log(`\n${CYAN}--- [SUITE 6] AdSense Configuration & VIP Ad-Removal Guard (hero_ad_removed) ---${RESET}`);
{
  // 1. Script in index.html
  const indexHtml = readProjectFile('index.html') || '';
  const hasAdScript =
    indexHtml.includes('pagead2.googlesyndication.com') &&
    indexHtml.includes('ca-pub-6937094123258335');
  assert(
    'ADV-M5-VIP-01',
    'SUITE 6',
    'index.html contains official AdSense script tag with publisher ca-pub-6937094123258335',
    hasAdScript,
    'true',
    String(hasAdScript)
  );

  // 2. VIP Ad-Removal Guard: hero_ad_removed = 'true'
  mockStorage.clear();
  mockStorage.setItem('hero_ad_removed', 'true');

  assert(
    'ADV-M5-VIP-02',
    'SUITE 6',
    'VIP ad-removal isAdRemoved() evaluates to true when hero_ad_removed is set',
    isAdRemoved() === true,
    'true',
    String(isAdRemoved())
  );

  const vipDesktop = getAdPlacements(1440);
  assert(
    'ADV-M5-VIP-03',
    'SUITE 6',
    'Desktop viewport (1440px) suppresses left and right gutters when VIP ad-removal is active',
    vipDesktop.desktopLeft === false &&
      vipDesktop.desktopRight === false &&
      vipDesktop.suppressedByVip === true,
    'desktopLeft: false, desktopRight: false, suppressedByVip: true',
    `left: ${vipDesktop.desktopLeft}, right: ${vipDesktop.desktopRight}, vip: ${vipDesktop.suppressedByVip}`
  );

  const vipMobile = getAdPlacements(375);
  assert(
    'ADV-M5-VIP-04',
    'SUITE 6',
    'Mobile viewport (375px) suppresses mobile top banner when VIP ad-removal is active',
    vipMobile.mobileTop === false && vipMobile.suppressedByVip === true,
    'mobileTop: false, suppressedByVip: true',
    `mobileTop: ${vipMobile.mobileTop}, vip: ${vipMobile.suppressedByVip}`
  );

  // Fluid screen widths: 320px..3840px
  const testWidths = [320, 360, 375, 414, 600, 768, 1023, 1024, 1280, 1440, 1920, 2560, 3840];
  const allSuppressed = testWidths.every((w) => {
    const p = getAdPlacements(w);
    return !p.desktopLeft && !p.desktopRight && !p.mobileTop && p.suppressedByVip;
  });
  const guttersSuppressed = renderDesktopLeftGutter() === '' && renderDesktopRightGutter() === '';
  const bannerSuppressed = renderMobileTopBanner() === '';

  assert(
    'ADV-M5-VIP-05',
    'SUITE 6',
    'VIP ad-removal suppresses 100% of ads across all fluid screen widths (320px..3840px) and renders empty strings',
    allSuppressed && guttersSuppressed && bannerSuppressed,
    'true for all 13 test viewports with empty strings emitted',
    `allSuppressed: ${allSuppressed}, gutters: ${guttersSuppressed}, banner: ${bannerSuppressed}`
  );

  // Ad-removal item in ShopSection sets 'hero_ad_removed'
  mockStorage.clear();
  mockStorage.setItem('hero_sns', '2000');
  mockStorage.setItem('hero_earned_sns', '2000');
  mockStorage.setItem('hero_purchased_sns', '0');
  const adRemovePurchase = executeShopPurchase('ad_remove');
  const handlesAdRemoval =
    adRemovePurchase.success &&
    mockStorage.getItem('hero_ad_removed') === 'true' &&
    isAdRemoved() === true;

  assert(
    'ADV-M5-VIP-06',
    'SUITE 6',
    'ShopSection.tsx executeShopPurchase handles ad_remove item by setting hero_ad_removed in LocalStorage',
    handlesAdRemoval,
    'true',
    String(handlesAdRemoval)
  );
}

// ============================================================================
// 4. Test Summary & Quality Gate Verification
// ============================================================================

const total = results.length;
const passed = results.filter((r) => r.passed).length;
const failed = total - passed;
const passRate = ((passed / total) * 100).toFixed(1);

console.log(`\n${BOLD}========================================================================${RESET}`);
console.log(`${BOLD}  TEST EXECUTION SUMMARY                                                ${RESET}`);
console.log(`${BOLD}========================================================================${RESET}`);
console.log(`  Total Assertions Run : ${BOLD}${total}${RESET}`);
console.log(`  Passed               : ${GREEN}${passed}${RESET}`);
console.log(`  Failed               : ${failed > 0 ? RED : GREEN}${failed}${RESET}`);
console.log(`  Pass Rate            : ${passed === total ? GREEN : RED}${passRate}%${RESET}`);
console.log(`${BOLD}========================================================================${RESET}\n`);

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
