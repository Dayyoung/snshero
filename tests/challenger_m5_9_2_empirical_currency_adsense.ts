/**
 * tests/challenger_m5_9_2_empirical_currency_adsense.ts
 *
 * INDEPENDENT EMPIRICAL ADVERSARIAL STRESS TEST HARNESS — CHALLENGER M5.9.2
 * Milestone 5: Currency Invariants (Faucet Elimination, 5k Gold to 1k SNS Exchange,
 * Debit Hierarchy) & Responsive Google AdSense Layout & VIP Guard.
 *
 * Role: challenger_m5_9_2 (Milestone 5 Challenger 2)
 *
 * Mission Objectives:
 * 1. Currency Debit/Credit & Faucet Elimination:
 *    - Verify all free faucets (`+ 코인 무료 충전`, `coin_charge` 0-cost item) are completely eliminated
 *      from ShopSection.tsx and index.ts.
 *    - Verify non-free gold exchange:
 *      - When hero_gold >= 5000: 5,000 gold debited and 1,000 SNS credited to both hero_sns and hero_earned_sns.
 *      - When hero_gold < 5000 (e.g. 0, 4999): exchange returns failure, debits 0 gold, credits 0 SNS.
 *    - Verify currency debit hierarchy on pack purchase:
 *      - Debits hero_earned_sns first, then hero_purchased_sns.
 *      - Fails gracefully if total SNS is insufficient without balance leakage.
 * 2. Responsive Google AdSense Layout & VIP Guard:
 *    - Verify desktop gutters (<aside id="adsense-desktop-left"> and <aside id="adsense-desktop-right">)
 *      have `hidden lg:flex` and publisher ID `ca-pub-6937094123258335`.
 *    - Verify mobile top banner (<div id="adsense-mobile-top">) has `block lg:hidden`.
 *    - Verify VIP Guard: When localStorage.setItem('hero_ad_removed', 'true'), all gutters and banners
 *      are 100% suppressed (empty strings emitted, tag push disabled).
 *
 * Usage:
 *    npx tsx tests/challenger_m5_9_2_empirical_currency_adsense.ts
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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

const windowEventLog: { type: string; detail?: any }[] = [];

if (typeof (globalThis as any).window === 'undefined') {
  (globalThis as any).window = {
    location: { hash: '#shop', pathname: '/' },
    innerWidth: 1024,
    adsbygoogle: [] as any[],
    dispatchEvent: (evt: any) => {
      windowEventLog.push({ type: evt.type || String(evt), detail: evt.detail });
      return true;
    },
    addEventListener: () => {},
    removeEventListener: () => {},
    scrollTo: () => {},
  };
}

if (typeof (globalThis as any).document === 'undefined') {
  (globalThis as any).document = {
    addEventListener: () => {},
    removeEventListener: () => {},
    getElementById: () => null,
    querySelectorAll: () => [],
  };
}

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

// ============================================================================
// 2. Production Code Imports
// ============================================================================

import {
  SHOP_ITEMS,
  getUserCoins,
  setUserCoins,
  getUserGold,
  setUserGold,
  debitUserCoins,
  creditUserCoins,
  exchangeGoldForSns,
  executeGoldExchange,
  executeShopPurchase,
  renderShopSection,
  renderPackRevealModal,
  renderGoldExchangeModal,
  getActiveRevealPack,
  setActiveRevealPack,
  closePackRevealModal,
  isGoldExchangeModalOpen,
  openGoldExchangeModal,
  closeGoldExchangeModal,
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

import {
  renderAdSenseLayoutWrapper,
} from '../src/landing/components/AdSenseBanners';

import { cardNurtureStore } from '../src/landing/services/cardNurtureStore';

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
console.log(`${BOLD}  SNSHero CHALLENGER M5.9.2: CURRENCY INVARIANTS & ADSENSE VIP GUARD  ${RESET}`);
console.log(`${BOLD}========================================================================${RESET}\n`);

// Helper to read repository source files
function readRepoFile(relPath: string): string {
  const fullPath = path.resolve(REPO_ROOT, relPath);
  return fs.readFileSync(fullPath, 'utf-8');
}

// ============================================================================
// SUITE 1: Prohibited Free Faucets Elimination & Shop Catalog Integrity
// ============================================================================
console.log(`${CYAN}--- [SUITE 1] Prohibited Free Faucets Elimination & Shop Catalog Integrity ---${RESET}`);
{
  const shopSource = readRepoFile('src/landing/views/ShopSection.tsx');
  const indexSource = readRepoFile('src/landing/index.ts');

  // 1. Verify `+ 코인 무료 충전` is 100% eliminated from ShopSection.tsx
  const hasFreeCoinText = shopSource.includes('+ 코인 무료 충전') || shopSource.includes('코인 무료 충전');
  assert(
    'CHG-M5-FAUCET-01',
    'SUITE 1',
    'ShopSection.tsx contains ZERO instances of "+ 코인 무료 충전" or free coin text',
    !hasFreeCoinText,
    'false (no free coin text)',
    `hasFreeCoinText: ${hasFreeCoinText}`
  );

  // 2. Verify `free-charge-coin` data-action is eliminated from ShopSection.tsx and index.ts
  const hasFreeChargeCoinAction = shopSource.includes('free-charge-coin') || indexSource.includes('free-charge-coin');
  assert(
    'CHG-M5-FAUCET-02',
    'SUITE 1',
    'ShopSection.tsx and index.ts contain ZERO instances of "free-charge-coin" data-action',
    !hasFreeChargeCoinAction,
    'false (no free-charge-coin)',
    `hasFreeChargeCoinAction: ${hasFreeChargeCoinAction}`
  );

  // 3. Verify exactly 8 registered shop items
  assert(
    'CHG-M5-FAUCET-03',
    'SUITE 1',
    'SHOP_ITEMS array contains exactly 8 distinct items matching project specification',
    SHOP_ITEMS.length === 8,
    '8 items',
    `Found: ${SHOP_ITEMS.length} items`
  );

  // 4. Inspect the 8th item (coin_charge) — must be non-free Gold Exchange
  const coinChargeItem = SHOP_ITEMS.find((it) => it.id === 'coin_charge');
  assert(
    'CHG-M5-FAUCET-04',
    'SUITE 1',
    'Item "coin_charge" is configured as Gold Exchange (5,000 Gold requirement in description & priceText)',
    coinChargeItem !== undefined &&
      coinChargeItem.name === '코인 충전' &&
      coinChargeItem.badge === '골드 환전' &&
      coinChargeItem.priceText.includes('5,000 골드') &&
      coinChargeItem.actionText.includes('5,000G → 1,000 SNS'),
    'Configured as non-free 5,000 Gold exchange',
    `coinChargeItem: ${JSON.stringify(coinChargeItem)}`
  );

  // 5. Verify direct purchase of 'coin_charge' via executeShopPurchase enforces gold exchange
  mockStorage.clear();
  mockStorage.setItem('hero_gold', '0');
  mockStorage.setItem('hero_sns', '100');
  const zeroGoldPurchase = executeShopPurchase('coin_charge');
  assert(
    'CHG-M5-FAUCET-05',
    'SUITE 1',
    'executeShopPurchase("coin_charge") fails when user has 0 gold (zero free grants)',
    zeroGoldPurchase.success === false &&
      getUserCoins() === 100 &&
      getUserGold() === 0,
    'success: false, coins: 100, gold: 0',
    `success: ${zeroGoldPurchase.success}, coins: ${getUserCoins()}, gold: ${getUserGold()}`
  );

  // 6. Verify header button in rendered shop section opens gold exchange instead of giving free coins
  const renderedShop = renderShopSection();
  assert(
    'CHG-M5-FAUCET-06',
    'SUITE 1',
    'Rendered Shop HTML contains [골드 환전소] button with data-action="open-gold-exchange"',
    renderedShop.includes('data-action="open-gold-exchange"') &&
      renderedShop.includes('[골드 환전소]'),
    'Contains [골드 환전소] and open-gold-exchange',
    'Verified via HTML template matching'
  );

  // 7. Verify no item in SHOP_ITEMS awards SNS for free (all items either cost SNS or cost Gold)
  const itemsWithFreeSns = SHOP_ITEMS.filter((it) => {
    if (it.id === 'coin_charge') return false; // Handled by gold exchange
    return it.priceCoins <= 0;
  });
  assert(
    'CHG-M5-FAUCET-07',
    'SUITE 1',
    'All card packs, items, and content require non-zero SNS coins (> 0)',
    itemsWithFreeSns.length === 0,
    '0 free items',
    `Found free items: ${itemsWithFreeSns.map((i) => i.name).join(', ')}`
  );
}

// ============================================================================
// SUITE 2: Non-Free Gold Exchange Invariants (5,000 Gold -> 1,000 SNS)
// ============================================================================
console.log(`\n${CYAN}--- [SUITE 2] Non-Free Gold Exchange Invariants (5,000 Gold -> 1,000 SNS) ---${RESET}`);
{
  // Test Case 2.1: Normal exchange with sufficient gold (hero_gold = 5000)
  mockStorage.clear();
  mockStorage.setItem('hero_gold', '5000');
  mockStorage.setItem('hero_sns', '0');
  mockStorage.setItem('hero_earned_sns', '0');
  mockStorage.setItem('hero_purchased_sns', '0');

  const exchExact = exchangeGoldForSns(5000);
  assert(
    'CHG-M5-GOLD-01',
    'SUITE 2',
    'Exact 5,000 Gold exchange succeeds with snsGranted: 1000',
    exchExact.success === true && exchExact.snsGranted === 1000,
    'success: true, snsGranted: 1000',
    `success: ${exchExact.success}, snsGranted: ${exchExact.snsGranted}`
  );

  assert(
    'CHG-M5-GOLD-02',
    'SUITE 2',
    'Exact 5,000 Gold exchange debits exactly 5,000 gold (5000 -> 0)',
    getUserGold() === 0 && mockStorage.getItem('hero_gold') === '0',
    'hero_gold: 0',
    `hero_gold: ${getUserGold()}`
  );

  assert(
    'CHG-M5-GOLD-03',
    'SUITE 2',
    'Exact 5,000 Gold exchange credits exactly 1,000 SNS to hero_sns and hero_earned_sns',
    getUserCoins() === 1000 &&
      mockStorage.getItem('hero_sns') === '1000' &&
      mockStorage.getItem('hero_earned_sns') === '1000' &&
      mockStorage.getItem('hero_purchased_sns') === '0',
    'hero_sns: 1000, hero_earned_sns: 1000, hero_purchased_sns: 0',
    `hero_sns: ${getUserCoins()}, earned: ${mockStorage.getItem('hero_earned_sns')}, purchased: ${mockStorage.getItem('hero_purchased_sns')}`
  );

  // Test Case 2.2: Exchange with surplus gold (hero_gold = 15000)
  mockStorage.setItem('hero_gold', '15000');
  const exchSurplus = exchangeGoldForSns(5000);
  assert(
    'CHG-M5-GOLD-04',
    'SUITE 2',
    'Exchange with surplus gold debits exactly 5,000 (15000 -> 10000) and credits 1,000 SNS (1000 -> 2000)',
    exchSurplus.success === true &&
      getUserGold() === 10000 &&
      getUserCoins() === 2000 &&
      mockStorage.getItem('hero_earned_sns') === '2000',
    'Gold: 10000, SNS: 2000, earned_sns: 2000',
    `Gold: ${getUserGold()}, SNS: ${getUserCoins()}, earned_sns: ${mockStorage.getItem('hero_earned_sns')}`
  );

  // Test Case 2.3: Boundary failure at 4,999 gold
  mockStorage.setItem('hero_gold', '4999');
  const exch4999 = exchangeGoldForSns(5000);
  assert(
    'CHG-M5-GOLD-05',
    'SUITE 2',
    'Exchange at 4,999 Gold is rejected (success: false, snsGranted: 0)',
    exch4999.success === false && exch4999.snsGranted === 0,
    'success: false, snsGranted: 0',
    `success: ${exch4999.success}, snsGranted: ${exch4999.snsGranted}`
  );

  assert(
    'CHG-M5-GOLD-06',
    'SUITE 2',
    'Rejected 4,999 Gold exchange preserves gold balance (remains 4999) with ZERO debit',
    getUserGold() === 4999,
    'Gold: 4999',
    `Gold: ${getUserGold()}`
  );

  assert(
    'CHG-M5-GOLD-07',
    'SUITE 2',
    'Rejected 4,999 Gold exchange preserves SNS balance (remains 2000) with ZERO credit',
    getUserCoins() === 2000 && mockStorage.getItem('hero_earned_sns') === '2000',
    'SNS: 2000, earned: 2000',
    `SNS: ${getUserCoins()}, earned: ${mockStorage.getItem('hero_earned_sns')}`
  );

  // Test Case 2.4: Zero gold boundary failure
  mockStorage.setItem('hero_gold', '0');
  const exchZeroGold = exchangeGoldForSns(5000);
  assert(
    'CHG-M5-GOLD-08',
    'SUITE 2',
    'Exchange at 0 Gold is rejected without balance mutation',
    exchZeroGold.success === false &&
      getUserGold() === 0 &&
      getUserCoins() === 2000,
    'success: false, Gold: 0, SNS: 2000',
    `success: ${exchZeroGold.success}, Gold: ${getUserGold()}, SNS: ${getUserCoins()}`
  );

  // Test Case 2.5: Zero or negative exchange amounts
  const exchZeroAmount = exchangeGoldForSns(0);
  const exchNegativeAmount = exchangeGoldForSns(-5000);
  assert(
    'CHG-M5-GOLD-09',
    'SUITE 2',
    'Zero and negative exchange amounts are rejected with error',
    exchZeroAmount.success === false &&
      exchNegativeAmount.success === false &&
      exchZeroAmount.snsGranted === 0 &&
      exchNegativeAmount.snsGranted === 0,
    'Both rejected with snsGranted: 0',
    `Zero: ${exchZeroAmount.success}, Negative: ${exchNegativeAmount.success}`
  );

  // Test Case 2.6: Modal state and UI rendering verification
  openGoldExchangeModal();
  assert(
    'CHG-M5-GOLD-10',
    'SUITE 2',
    'Gold exchange modal open state is reactive (isGoldExchangeModalOpen() === true)',
    isGoldExchangeModalOpen() === true,
    'true',
    String(isGoldExchangeModalOpen())
  );

  mockStorage.setItem('hero_gold', '3000');
  const modalUnderfunded = renderGoldExchangeModal();
  assert(
    'CHG-M5-GOLD-11',
    'SUITE 2',
    'Modal disables exchange button when hero_gold < 5000 with warning notice',
    modalUnderfunded.includes('disabled') &&
      modalUnderfunded.includes('보유 골드가 부족합니다') &&
      modalUnderfunded.includes('3,000 Gold'),
    'Contains disabled and warning notice',
    'Verified via HTML template matching'
  );

  mockStorage.setItem('hero_gold', '10000');
  const modalFunded = renderGoldExchangeModal();
  assert(
    'CHG-M5-GOLD-12',
    'SUITE 2',
    'Modal enables exchange button when hero_gold >= 5000 with preview calculation',
    !modalFunded.includes('disabled') &&
      modalFunded.includes('환전 실행 (1,000 SNS)') &&
      modalFunded.includes('data-action="execute-gold-exchange"'),
    'Button enabled without disabled attribute',
    'Verified via HTML template matching'
  );

  closeGoldExchangeModal();
  assert(
    'CHG-M5-GOLD-13',
    'SUITE 2',
    'Modal returns empty string when closed (isGoldExchangeModalOpen() === false)',
    !isGoldExchangeModalOpen() && renderGoldExchangeModal() === '',
    'Empty string',
    renderGoldExchangeModal()
  );
}

// ============================================================================
// SUITE 3: Currency Debit Hierarchy (Earned-First, Purchased-Second)
// ============================================================================
console.log(`\n${CYAN}--- [SUITE 3] Currency Debit Hierarchy (Earned-First, Purchased-Second) ---${RESET}`);
{
  // Test Case 3.1: Debit strictly from hero_earned_sns when earned >= cost
  mockStorage.clear();
  mockStorage.setItem('hero_sns', '1000');
  mockStorage.setItem('hero_earned_sns', '700');
  mockStorage.setItem('hero_purchased_sns', '300');
  mockStorage.setItem('hero_current_season', 'season1');

  const debitedEarnedOnly = debitUserCoins(300); // e.g. Normal pack (300 SNS)
  assert(
    'CHG-M5-HIER-01',
    'SUITE 3',
    'When earned >= cost, debits exclusively from hero_earned_sns (700 -> 400)',
    debitedEarnedOnly === true &&
      mockStorage.getItem('hero_earned_sns') === '400' &&
      mockStorage.getItem('hero_purchased_sns') === '300' &&
      getUserCoins() === 700,
    'earned: 400, purchased: 300, total: 700',
    `earned: ${mockStorage.getItem('hero_earned_sns')}, purchased: ${mockStorage.getItem('hero_purchased_sns')}, total: ${getUserCoins()}`
  );

  // Test Case 3.2: Debit splits across earned and purchased when earned < cost
  // Currently earned: 400, purchased: 300. Total: 700.
  // Debit 500 SNS (e.g. item_pack): 400 from earned (exhausts to 0), remaining 100 from purchased (300 -> 200).
  const debitedSplit = debitUserCoins(500);
  assert(
    'CHG-M5-HIER-02',
    'SUITE 3',
    'When earned < cost, exhausts hero_earned_sns to 0 and debits remainder from hero_purchased_sns',
    debitedSplit === true &&
      mockStorage.getItem('hero_earned_sns') === '0' &&
      mockStorage.getItem('hero_purchased_sns') === '200' &&
      getUserCoins() === 200,
    'earned: 0, purchased: 200, total: 200',
    `earned: ${mockStorage.getItem('hero_earned_sns')}, purchased: ${mockStorage.getItem('hero_purchased_sns')}, total: ${getUserCoins()}`
  );

  // Test Case 3.3: Debit strictly from purchased when earned is already 0
  // Currently earned: 0, purchased: 200. Total: 200.
  // Debit 100 SNS (e.g. official_novel): 100 from purchased (200 -> 100).
  const debitedPurchasedOnly = debitUserCoins(100);
  assert(
    'CHG-M5-HIER-03',
    'SUITE 3',
    'When earned is 0, debits remainder cleanly from hero_purchased_sns (200 -> 100)',
    debitedPurchasedOnly === true &&
      mockStorage.getItem('hero_earned_sns') === '0' &&
      mockStorage.getItem('hero_purchased_sns') === '100' &&
      getUserCoins() === 100,
    'earned: 0, purchased: 100, total: 100',
    `earned: ${mockStorage.getItem('hero_earned_sns')}, purchased: ${mockStorage.getItem('hero_purchased_sns')}, total: ${getUserCoins()}`
  );

  // Test Case 3.4: Insufficient total balance rejects debit without leakage
  // Currently total: 100. Attempt to debit 300 SNS.
  const debitedInsufficient = debitUserCoins(300);
  assert(
    'CHG-M5-HIER-04',
    'SUITE 3',
    'debitUserCoins returns false when total balance < cost',
    debitedInsufficient === false,
    'false',
    String(debitedInsufficient)
  );

  assert(
    'CHG-M5-HIER-05',
    'SUITE 3',
    'Rejected debit preserves balances with 0 leakage (earned: 0, purchased: 100, total: 100)',
    mockStorage.getItem('hero_earned_sns') === '0' &&
      mockStorage.getItem('hero_purchased_sns') === '100' &&
      getUserCoins() === 100,
    'earned: 0, purchased: 100, total: 100',
    `earned: ${mockStorage.getItem('hero_earned_sns')}, purchased: ${mockStorage.getItem('hero_purchased_sns')}, total: ${getUserCoins()}`
  );

  // Test Case 3.5: Legacy fallback when split keys are missing but hero_sns exists
  mockStorage.clear();
  mockStorage.setItem('hero_sns', '800'); // No hero_earned_sns or hero_purchased_sns in storage
  const debitedLegacy = debitUserCoins(300);
  assert(
    'CHG-M5-HIER-06',
    'SUITE 3',
    'Legacy balance without split keys treats total as earned, debits cleanly (800 -> 500)',
    debitedLegacy === true &&
      getUserCoins() === 500 &&
      mockStorage.getItem('hero_earned_sns') === '500' &&
      mockStorage.getItem('hero_purchased_sns') === '0',
    'total: 500, earned: 500, purchased: 0',
    `total: ${getUserCoins()}, earned: ${mockStorage.getItem('hero_earned_sns')}, purchased: ${mockStorage.getItem('hero_purchased_sns')}`
  );

  // Test Case 3.6: Multi-purchase sequence simulating real user session
  // User starts with 2,000 SNS (1,000 earned + 1,000 purchased)
  mockStorage.clear();
  mockStorage.setItem('hero_sns', '2000');
  mockStorage.setItem('hero_earned_sns', '1000');
  mockStorage.setItem('hero_purchased_sns', '1000');
  mockStorage.setItem('hero_current_season', 'season1');

  // Purchase 1: Magic Pack (800 SNS) -> debits 800 from earned (earned: 200, purchased: 1000, total: 1200)
  const buy1 = executeShopPurchase('pack_magic');
  // Purchase 2: Magic Pack (800 SNS) -> debits 200 from earned (0), 600 from purchased (400, total: 400)
  const buy2 = executeShopPurchase('pack_magic');
  // Purchase 3: Magic Pack (800 SNS) -> INSUFFICIENT! Only 400 remaining.
  const buy3 = executeShopPurchase('pack_magic');

  assert(
    'CHG-M5-HIER-07',
    'SUITE 3',
    'Sequential pack purchases correctly cascade through hierarchy and halt when exhausted',
    buy1.success === true &&
      buy2.success === true &&
      buy3.success === false &&
      getUserCoins() === 400 &&
      mockStorage.getItem('hero_earned_sns') === '0' &&
      mockStorage.getItem('hero_purchased_sns') === '400',
    'buy1: true, buy2: true, buy3: false, remaining: 400 (purchased)',
    `buy1: ${buy1.success}, buy2: ${buy2.success}, buy3: ${buy3.success}, total: ${getUserCoins()}, purchased: ${mockStorage.getItem('hero_purchased_sns')}`
  );
}

// ============================================================================
// SUITE 4: Responsive Google AdSense Layout & Classes
// ============================================================================
console.log(`\n${CYAN}--- [SUITE 4] Responsive Google AdSense Layout & Classes ---${RESET}`);
{
  mockStorage.clear(); // Ensure ad removal is NOT active

  // 1. Verify Desktop Left Gutter HTML
  const leftGutter = renderDesktopLeftGutter();
  assert(
    'CHG-M5-ADS-01',
    'SUITE 4',
    'renderDesktopLeftGutter returns <aside id="adsense-desktop-left"> with hidden lg:flex',
    leftGutter.includes('<aside') &&
      leftGutter.includes('id="adsense-desktop-left"') &&
      leftGutter.includes('hidden lg:flex'),
    'Contains <aside id="adsense-desktop-left" and hidden lg:flex',
    'Verified via template inspection'
  );

  assert(
    'CHG-M5-ADS-02',
    'SUITE 4',
    'Desktop Left Gutter contains publisher ID ca-pub-6937094123258335 and slot 1000000001',
    leftGutter.includes(`data-ad-client="${ADSENSE_CONFIG.client}"`) &&
      leftGutter.includes(`data-ad-slot="${ADSENSE_CONFIG.slots.desktopLeft}"`) &&
      leftGutter.includes('ca-pub-6937094123258335'),
    'Contains ca-pub-6937094123258335 and slot 1000000001',
    'Verified'
  );

  // 2. Verify Desktop Right Gutter HTML
  const rightGutter = renderDesktopRightGutter();
  assert(
    'CHG-M5-ADS-03',
    'SUITE 4',
    'renderDesktopRightGutter returns <aside id="adsense-desktop-right"> with hidden lg:flex',
    rightGutter.includes('<aside') &&
      rightGutter.includes('id="adsense-desktop-right"') &&
      rightGutter.includes('hidden lg:flex'),
    'Contains <aside id="adsense-desktop-right" and hidden lg:flex',
    'Verified via template inspection'
  );

  assert(
    'CHG-M5-ADS-04',
    'SUITE 4',
    'Desktop Right Gutter contains publisher ID ca-pub-6937094123258335 and slot 1000000002',
    rightGutter.includes(`data-ad-client="${ADSENSE_CONFIG.client}"`) &&
      rightGutter.includes(`data-ad-slot="${ADSENSE_CONFIG.slots.desktopRight}"`) &&
      rightGutter.includes('ca-pub-6937094123258335'),
    'Contains ca-pub-6937094123258335 and slot 1000000002',
    'Verified'
  );

  // 3. Verify Mobile Top Banner HTML
  const mobileBanner = renderMobileTopBanner();
  assert(
    'CHG-M5-ADS-05',
    'SUITE 4',
    'renderMobileTopBanner returns <div id="adsense-mobile-top"> with block lg:hidden',
    mobileBanner.includes('<div') &&
      mobileBanner.includes('id="adsense-mobile-top"') &&
      mobileBanner.includes('block lg:hidden'),
    'Contains <div id="adsense-mobile-top" and block lg:hidden',
    'Verified via template inspection'
  );

  assert(
    'CHG-M5-ADS-06',
    'SUITE 4',
    'Mobile Top Banner contains publisher ID ca-pub-6937094123258335 and slot 1000000003',
    mobileBanner.includes(`data-ad-client="${ADSENSE_CONFIG.client}"`) &&
      mobileBanner.includes(`data-ad-slot="${ADSENSE_CONFIG.slots.mobileTop}"`) &&
      mobileBanner.includes('ca-pub-6937094123258335'),
    'Contains ca-pub-6937094123258335 and slot 1000000003',
    'Verified'
  );

  // 4. Verify Layout Wrapper Assembly
  const layoutHtml = renderAdSenseLayoutWrapper('<div id="test-content">Main Area</div>');
  assert(
    'CHG-M5-ADS-07',
    'SUITE 4',
    'renderAdSenseLayoutWrapper places mobile banner above main and gutters flanking main slot',
    layoutHtml.includes('id="adsense-mobile-top"') &&
      layoutHtml.includes('id="adsense-desktop-left"') &&
      layoutHtml.includes('id="landing-main-slot"') &&
      layoutHtml.includes('id="adsense-desktop-right"'),
    'Contains mobile top, desktop left, landing-main-slot, and desktop right',
    'Verified layout structure'
  );

  // 5. Breakpoint Placement Logic Tests
  const desktopPlacement = getAdPlacements(1024);
  const mobilePlacement = getAdPlacements(1023);
  assert(
    'CHG-M5-ADS-08',
    'SUITE 4',
    'getAdPlacements correctly splits at 1024px breakpoint (desktop gutters vs mobile top)',
    desktopPlacement.desktopLeft &&
      desktopPlacement.desktopRight &&
      !desktopPlacement.mobileTop &&
      !mobilePlacement.desktopLeft &&
      !mobilePlacement.desktopRight &&
      mobilePlacement.mobileTop,
    '1024px: gutters on, top off; 1023px: top on, gutters off',
    `1024px: ${JSON.stringify(desktopPlacement)}, 1023px: ${JSON.stringify(mobilePlacement)}`
  );
}

// ============================================================================
// SUITE 5: VIP Ad-Removal Guard (hero_ad_removed 100% Suppression)
// ============================================================================
console.log(`\n${CYAN}--- [SUITE 5] VIP Ad-Removal Guard (hero_ad_removed 100% Suppression) ---${RESET}`);
{
  // 1. Initial State: Ads are NOT removed
  mockStorage.clear();
  assert(
    'CHG-M5-VIP-01',
    'SUITE 5',
    'isAdRemoved() returns false when hero_ad_removed is absent',
    isAdRemoved() === false,
    'false',
    String(isAdRemoved())
  );

  // 2. Set hero_ad_removed = 'true'
  mockStorage.setItem('hero_ad_removed', 'true');
  assert(
    'CHG-M5-VIP-02',
    'SUITE 5',
    'isAdRemoved() returns true when hero_ad_removed === "true"',
    isAdRemoved() === true,
    'true',
    String(isAdRemoved())
  );

  // 3. Verify 100% suppression of HTML emitters
  const suppressedLeft = renderDesktopLeftGutter();
  const suppressedRight = renderDesktopRightGutter();
  const suppressedMobile = renderMobileTopBanner();
  assert(
    'CHG-M5-VIP-03',
    'SUITE 5',
    'All AdSense HTML rendering functions return empty strings when VIP ad removal is active',
    suppressedLeft === '' && suppressedRight === '' && suppressedMobile === '',
    'All empty strings ("")',
    `left: "${suppressedLeft}", right: "${suppressedRight}", mobile: "${suppressedMobile}"`
  );

  // 4. Verify Layout Wrapper contains NO ads when suppressed
  const cleanLayout = renderAdSenseLayoutWrapper('<div id="test-content">Play Area</div>');
  const hasAnyAdTag =
    cleanLayout.includes('adsense-desktop-left') ||
    cleanLayout.includes('adsense-desktop-right') ||
    cleanLayout.includes('adsense-mobile-top') ||
    cleanLayout.includes('adsbygoogle') ||
    cleanLayout.includes('ca-pub-');
  assert(
    'CHG-M5-VIP-04',
    'SUITE 5',
    'renderAdSenseLayoutWrapper contains ZERO ad elements or AdSense attributes under VIP guard',
    !hasAnyAdTag && cleanLayout.includes('id="landing-main-slot"'),
    'Zero ad tags, clean main slot intact',
    `hasAnyAdTag: ${hasAnyAdTag}`
  );

  // 5. Test Placement matrix across all standard mobile, tablet, and desktop viewports
  const viewportsToTest = [320, 360, 375, 414, 600, 768, 820, 1023, 1024, 1280, 1440, 1920, 2560, 3840];
  const allViewportsSuppressed = viewportsToTest.every((vp) => {
    const p = getAdPlacements(vp);
    return !p.desktopLeft && !p.desktopRight && !p.mobileTop && p.suppressedByVip;
  });
  assert(
    'CHG-M5-VIP-05',
    'SUITE 5',
    'getAdPlacements returns 100% suppressed across all 14 viewports (320px..3840px)',
    allViewportsSuppressed,
    'true for all 14 viewports',
    `allViewportsSuppressed: ${allViewportsSuppressed}`
  );

  // 6. Test Tag Push Guard: pushAdSenseTags() does not push to window.adsbygoogle
  (globalThis as any).window.adsbygoogle = [];
  pushAdSenseTags();
  assert(
    'CHG-M5-VIP-06',
    'SUITE 5',
    'pushAdSenseTags() safely aborts without pushing to window.adsbygoogle under VIP guard',
    (globalThis as any).window.adsbygoogle.length === 0,
    'adsbygoogle array remains empty (length: 0)',
    `adsbygoogle length: ${(globalThis as any).window.adsbygoogle.length}`
  );

  // 7. Test in-game ad removal item purchase in ShopSection
  mockStorage.clear();
  mockStorage.setItem('hero_sns', '1500');
  mockStorage.setItem('hero_earned_sns', '1500');
  mockStorage.setItem('hero_purchased_sns', '0');

  const buyAdRemove = executeShopPurchase('ad_remove');
  assert(
    'CHG-M5-VIP-07',
    'SUITE 5',
    'Purchasing "ad_remove" item (1,000 SNS) activates VIP guard in LocalStorage and debits coins',
    buyAdRemove.success === true &&
      getUserCoins() === 500 &&
      mockStorage.getItem('hero_ad_removed') === 'true' &&
      isAdRemoved() === true,
    'success: true, coins: 500, hero_ad_removed: "true"',
    `success: ${buyAdRemove.success}, coins: ${getUserCoins()}, hero_ad_removed: ${mockStorage.getItem('hero_ad_removed')}`
  );

  // 8. Robustness test: non-"true" values do NOT suppress ads
  mockStorage.setItem('hero_ad_removed', 'false');
  assert(
    'CHG-M5-VIP-08',
    'SUITE 5',
    'Setting hero_ad_removed = "false" does NOT activate VIP suppression (isAdRemoved() === false)',
    isAdRemoved() === false && renderDesktopLeftGutter() !== '',
    'isAdRemoved: false, gutter rendered',
    `isAdRemoved: ${isAdRemoved()}`
  );

  mockStorage.setItem('hero_ad_removed', '0');
  assert(
    'CHG-M5-VIP-09',
    'SUITE 5',
    'Setting hero_ad_removed = "0" does NOT activate VIP suppression (isAdRemoved() === false)',
    isAdRemoved() === false,
    'false',
    String(isAdRemoved())
  );
}

// ============================================================================
// SUITE 6: PackRevealModal Lifecycle & Dual-Write Storage Integrity
// ============================================================================
console.log(`\n${CYAN}--- [SUITE 6] PackRevealModal Lifecycle & Dual-Write Storage Integrity ---${RESET}`);
{
  mockStorage.clear();
  mockStorage.setItem('hero_sns', '5000');
  mockStorage.setItem('hero_earned_sns', '5000');
  mockStorage.setItem('hero_purchased_sns', '0');

  // 1. Purchase card pack and verify 3 revealed cards
  const packBuy = executeShopPurchase('pack_normal');
  const revealPack = getActiveRevealPack();
  assert(
    'CHG-M5-PACK-01',
    'SUITE 6',
    'executeShopPurchase("pack_normal") activates 3-card reveal pack in getActiveRevealPack()',
    packBuy.success === true &&
      revealPack !== null &&
      revealPack.cards.length === 3,
    'revealPack with 3 cards',
    `Cards count: ${revealPack?.cards.length}`
  );

  // 2. Verify PackRevealModal DOM structure
  const modalHtml = renderPackRevealModal();
  assert(
    'CHG-M5-PACK-02',
    'SUITE 6',
    'renderPackRevealModal() generates valid OpenCode Terminal-Flat dialog with 3 slots',
    modalHtml.includes('id="pack-reveal-modal"') &&
      modalHtml.includes('id="pack-reveal-backdrop"') &&
      modalHtml.includes('data-action="close-pack-reveal"') &&
      modalHtml.includes('data-action="confirm-pack-reveal"') &&
      (modalHtml.match(/class="pack-card-slot/g) || []).length === 3,
    'Modal with backdrop, actions, and 3 slots',
    'Verified via HTML template matching'
  );

  // 3. Verify modal dismissal lifecycles
  closePackRevealModal();
  assert(
    'CHG-M5-PACK-03',
    'SUITE 6',
    'closePackRevealModal() clears active reveal pack and renders empty string',
    getActiveRevealPack() === null && renderPackRevealModal() === '',
    'null and empty string',
    `active: ${getActiveRevealPack()}, rendered: "${renderPackRevealModal()}"`
  );

  // 4. Verify Dual-Write persistence: all 3 cards exist in cardNurtureStore and hero_inventory
  const rolledIds = revealPack?.cards.map((c) => c.cardId) || [];
  const rawInventory = mockStorage.getItem('hero_inventory');
  const seasonInventory = mockStorage.getItem('hero_inventory_season1');

  const inNurture = rolledIds.every((id) => cardNurtureStore.isCardOwned(id));
  const inRawInventory = rolledIds.every((id) => rawInventory && rawInventory.includes(String(id)));
  const inSeasonInventory = rolledIds.every((id) => seasonInventory && seasonInventory.includes(String(id)));

  assert(
    'CHG-M5-PACK-04',
    'SUITE 6',
    'Rolled cards dual-written to cardNurtureStore, hero_inventory, and hero_inventory_season1',
    inNurture && inRawInventory && inSeasonInventory,
    'All rolled cards present in all 3 storage locations',
    `inNurture: ${inNurture}, inRaw: ${inRawInventory}, inSeason: ${inSeasonInventory}`
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
console.log(`${BOLD}  CHALLENGER M5.9.2 TEST EXECUTION SUMMARY                              ${RESET}`);
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
