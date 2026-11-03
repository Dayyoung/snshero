/**
 * tests/adversarial_m5_it2_2_empirical_stress.ts
 *
 * EMPIRICAL ADVERSARIAL STRESS TEST HARNESS — CHALLENGER M5 IT2-2
 * Focus: Currency Debit Hierarchy, Non-Free Gold Exchange Invariants,
 * Free Faucet Elimination, and Responsive AdSense Layout & VIP Guard.
 *
 * Role: challenger_m5_it2_2 (Milestone 5 Iteration 2 Challenger 2)
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

const windowEvents: { type: string; detail?: any }[] = [];

if (typeof (globalThis as any).window === 'undefined') {
  (globalThis as any).window = {
    location: { hash: '#shop', pathname: '/' },
    innerWidth: 1024,
    adsbygoogle: [] as any[],
    dispatchEvent: (evt: any) => {
      windowEvents.push({ type: evt.type || String(evt), detail: evt.detail });
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

import { renderAdSenseLayoutWrapper } from '../src/landing/components/AdSenseBanners';
import { cardNurtureStore } from '../src/landing/services/cardNurtureStore';

// ============================================================================
// 3. Test Harness Infrastructure
// ============================================================================

const GREEN = '\x1b[92m';
const RED = '\x1b[91m';
const YELLOW = '\x1b[93m';
const CYAN = '\x1b[96m';
const RESET = '\x1b[0m';

interface TestResult {
  id: string;
  suite: string;
  name: string;
  passed: boolean;
  expected?: string;
  actual?: string;
  details?: string;
}

const testResults: TestResult[] = [];

function assert(
  id: string,
  suite: string,
  name: string,
  condition: boolean,
  expected?: string,
  actual?: string,
  details?: string
): void {
  testResults.push({ id, suite, name, passed: condition, expected, actual, details });
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

function readProjectFile(relPath: string): string {
  try {
    return fs.readFileSync(path.join(REPO_ROOT, relPath), 'utf-8');
  } catch (err) {
    return '';
  }
}

// ============================================================================
// SUITE 1: Gold-to-SNS Exchange (5,000 Gold -> 1,000 SNS) Invariants & Stress
// ============================================================================

async function runSuite1_GoldExchange() {
  console.log('\n--- [SUITE 1] Gold Exchange (5,000 Gold -> 1,000 SNS) Adversarial Invariants ---');

  // Baseline reset
  mockStorage.clear();
  setUserGold(10000);
  setUserCoins(1000);

  // Test 1.1: Standard exchange of 5,000 Gold
  const res1 = exchangeGoldForSns(5000);
  assert(
    'STRESS-GOLD-01',
    'SUITE 1',
    'exchangeGoldForSns(5000) returns success: true, snsGranted: 1000',
    res1.success === true && res1.snsGranted === 1000,
    'success: true, snsGranted: 1000',
    `success: ${res1.success}, snsGranted: ${res1.snsGranted}`
  );
  assert(
    'STRESS-GOLD-02',
    'SUITE 1',
    '5,000 Gold exchange accurately debits hero_gold from 10,000 to 5,000',
    getUserGold() === 5000,
    '5000',
    String(getUserGold())
  );
  assert(
    'STRESS-GOLD-03',
    'SUITE 1',
    '5,000 Gold exchange accurately credits hero_sns from 1,000 to 2,000 and hero_earned_sns to 2,000',
    getUserCoins() === 2000 && mockStorage.getItem('hero_earned_sns') === '2000',
    'hero_sns: 2000, hero_earned_sns: 2000',
    `hero_sns: ${getUserCoins()}, hero_earned_sns: ${mockStorage.getItem('hero_earned_sns')}`
  );

  // Test 1.2: Second exchange of remaining 5,000 Gold (exact boundary to 0 Gold)
  const res2 = exchangeGoldForSns(5000);
  assert(
    'STRESS-GOLD-04',
    'SUITE 1',
    'Subsequent 5,000 Gold exchange drains gold to 0 and credits another 1,000 SNS (hero_sns: 3000)',
    res2.success === true && res2.snsGranted === 1000 && getUserGold() === 0 && getUserCoins() === 3000,
    'success: true, gold: 0, sns: 3000',
    `success: ${res2.success}, gold: ${getUserGold()}, sns: ${getUserCoins()}`
  );

  // Test 1.3: Insufficient Gold (0 Gold left)
  const res3 = exchangeGoldForSns(5000);
  assert(
    'STRESS-GOLD-05',
    'SUITE 1',
    'Exchange with 0 Gold returns success: false, snsGranted: 0 with error',
    res3.success === false && res3.snsGranted === 0 && typeof res3.error === 'string',
    'success: false, snsGranted: 0, has error string',
    `success: ${res3.success}, snsGranted: ${res3.snsGranted}, error: ${res3.error}`
  );
  assert(
    'STRESS-GOLD-06',
    'SUITE 1',
    'Rejected exchange at 0 Gold causes ZERO balance mutation (gold: 0, sns: 3000)',
    getUserGold() === 0 && getUserCoins() === 3000,
    'gold: 0, sns: 3000',
    `gold: ${getUserGold()}, sns: ${getUserCoins()}`
  );

  // Test 1.4: Off-by-one boundary test at 4,999 Gold
  setUserGold(4999);
  const res4 = exchangeGoldForSns(5000);
  assert(
    'STRESS-GOLD-07',
    'SUITE 1',
    'Exchange at 4,999 Gold (1 Gold below requirement) is strictly rejected',
    res4.success === false && res4.snsGranted === 0,
    'success: false, snsGranted: 0',
    `success: ${res4.success}, snsGranted: ${res4.snsGranted}`
  );
  assert(
    'STRESS-GOLD-08',
    'SUITE 1',
    'Rejected exchange at 4,999 Gold preserves exact 4,999 Gold balance with 0 leakage',
    getUserGold() === 4999,
    '4999',
    String(getUserGold())
  );

  // Test 1.5: Adversarial inputs (negative, zero, NaN, float)
  const resZero = exchangeGoldForSns(0);
  assert(
    'STRESS-GOLD-09',
    'SUITE 1',
    'exchangeGoldForSns(0) is rejected as invalid amount',
    resZero.success === false && resZero.snsGranted === 0,
    'success: false, snsGranted: 0',
    `success: ${resZero.success}`
  );

  const resNeg = exchangeGoldForSns(-5000);
  assert(
    'STRESS-GOLD-10',
    'SUITE 1',
    'exchangeGoldForSns(-5000) is rejected as invalid amount',
    resNeg.success === false && resNeg.snsGranted === 0,
    'success: false, snsGranted: 0',
    `success: ${resNeg.success}`
  );

  // Test 1.6: Execute shop item "coin_charge" via executeShopPurchase
  setUserGold(15000);
  setUserCoins(500);
  const purchaseRes = executeShopPurchase('coin_charge');
  assert(
    'STRESS-GOLD-11',
    'SUITE 1',
    'executeShopPurchase("coin_charge") triggers authentic 5,000 Gold exchange (success: true)',
    purchaseRes.success === true && getUserGold() === 10000 && getUserCoins() === 1500,
    'success: true, gold: 10000, sns: 1500',
    `success: ${purchaseRes.success}, gold: ${getUserGold()}, sns: ${getUserCoins()}`
  );

  // Test 1.7: 100-cycle high-throughput conservation stress test
  // Start with 500,000 Gold and 0 SNS. Exchange 5,000 Gold 100 times.
  setUserGold(500000);
  setUserCoins(0);
  let totalExchangedSns = 0;
  for (let i = 0; i < 100; i++) {
    const r = exchangeGoldForSns(5000);
    if (r.success) totalExchangedSns += r.snsGranted;
  }
  assert(
    'STRESS-GOLD-12',
    'SUITE 1',
    '100-cycle high-volume stress test exchanges 500,000 Gold to exactly 100,000 SNS with 0 leakage',
    getUserGold() === 0 && getUserCoins() === 100000 && totalExchangedSns === 100000,
    'gold: 0, sns: 100000, exchanged: 100000',
    `gold: ${getUserGold()}, sns: ${getUserCoins()}, exchanged: ${totalExchangedSns}`
  );
}

// ============================================================================
// SUITE 2: Earned-First Currency Debit Hierarchy
// ============================================================================

async function runSuite2_DebitHierarchy() {
  console.log('\n--- [SUITE 2] Currency Debit Hierarchy (Earned-First, Purchased-Second) ---');

  // Test 2.1: Earned is greater than cost
  // earned: 1000, purchased: 500, cost: 400 -> post: earned: 600, purchased: 500, total: 1100
  mockStorage.setItem('hero_earned_sns', '1000');
  mockStorage.setItem('hero_purchased_sns', '500');
  mockStorage.setItem('hero_sns', '1500');
  const deb1 = debitUserCoins(400);
  assert(
    'STRESS-DEBIT-01',
    'SUITE 2',
    'When earned >= cost, debits exclusively from hero_earned_sns (1000 -> 600) leaving purchased untouched (500)',
    deb1 === true &&
      mockStorage.getItem('hero_earned_sns') === '600' &&
      mockStorage.getItem('hero_purchased_sns') === '500' &&
      getUserCoins() === 1100,
    'earned: 600, purchased: 500, total: 1100',
    `earned: ${mockStorage.getItem('hero_earned_sns')}, purchased: ${mockStorage.getItem('hero_purchased_sns')}, total: ${getUserCoins()}`
  );

  // Test 2.2: Earned is less than cost (split debit)
  // earned: 300, purchased: 500, cost: 400 -> post: earned: 0, purchased: 400, total: 400
  mockStorage.setItem('hero_earned_sns', '300');
  mockStorage.setItem('hero_purchased_sns', '500');
  mockStorage.setItem('hero_sns', '800');
  const deb2 = debitUserCoins(400);
  assert(
    'STRESS-DEBIT-02',
    'SUITE 2',
    'When earned < cost, exhausts hero_earned_sns to 0 and takes remainder (100) from purchased (500 -> 400)',
    deb2 === true &&
      mockStorage.getItem('hero_earned_sns') === '0' &&
      mockStorage.getItem('hero_purchased_sns') === '400' &&
      getUserCoins() === 400,
    'earned: 0, purchased: 400, total: 400',
    `earned: ${mockStorage.getItem('hero_earned_sns')}, purchased: ${mockStorage.getItem('hero_purchased_sns')}, total: ${getUserCoins()}`
  );

  // Test 2.3: Earned is 0, all from purchased
  // earned: 0, purchased: 400, cost: 250 -> post: earned: 0, purchased: 150, total: 150
  const deb3 = debitUserCoins(250);
  assert(
    'STRESS-DEBIT-03',
    'SUITE 2',
    'When earned == 0, debits remainder exclusively from hero_purchased_sns (400 -> 150)',
    deb3 === true &&
      mockStorage.getItem('hero_earned_sns') === '0' &&
      mockStorage.getItem('hero_purchased_sns') === '150' &&
      getUserCoins() === 150,
    'earned: 0, purchased: 150, total: 150',
    `earned: ${mockStorage.getItem('hero_earned_sns')}, purchased: ${mockStorage.getItem('hero_purchased_sns')}, total: ${getUserCoins()}`
  );

  // Test 2.4: Insufficient total balance
  // earned: 50, purchased: 50, total: 100, cost: 300 (normal pack) -> rejected
  mockStorage.setItem('hero_earned_sns', '50');
  mockStorage.setItem('hero_purchased_sns', '50');
  mockStorage.setItem('hero_sns', '100');
  const deb4 = debitUserCoins(300);
  assert(
    'STRESS-DEBIT-04',
    'SUITE 2',
    'When total < cost (100 < 300), debitUserCoins returns false',
    deb4 === false,
    'false',
    String(deb4)
  );
  assert(
    'STRESS-DEBIT-05',
    'SUITE 2',
    'Rejected debit leaves balances completely intact (earned: 50, purchased: 50, total: 100) with 0 currency loss',
    mockStorage.getItem('hero_earned_sns') === '50' &&
      mockStorage.getItem('hero_purchased_sns') === '50' &&
      getUserCoins() === 100,
    'earned: 50, purchased: 50, total: 100',
    `earned: ${mockStorage.getItem('hero_earned_sns')}, purchased: ${mockStorage.getItem('hero_purchased_sns')}, total: ${getUserCoins()}`
  );

  // Test 2.5: Legacy fallback when hero_earned_sns and hero_purchased_sns are not set yet
  mockStorage.removeItem('hero_earned_sns');
  mockStorage.removeItem('hero_purchased_sns');
  mockStorage.setItem('hero_sns', '700');
  const debLegacy = debitUserCoins(300);
  assert(
    'STRESS-DEBIT-06',
    'SUITE 2',
    'Legacy single-key hero_sns data treats entire balance as earned and debits cleanly (700 -> 400)',
    debLegacy === true &&
      getUserCoins() === 400 &&
      mockStorage.getItem('hero_earned_sns') === '400' &&
      mockStorage.getItem('hero_purchased_sns') === '0',
    'total: 400, earned: 400, purchased: 0',
    `total: ${getUserCoins()}, earned: ${mockStorage.getItem('hero_earned_sns')}, purchased: ${mockStorage.getItem('hero_purchased_sns')}`
  );

  // Test 2.6: Seasonal key synchronization
  mockStorage.setItem('hero_current_season', 'season3');
  mockStorage.setItem('hero_earned_sns', '500');
  mockStorage.setItem('hero_purchased_sns', '500');
  mockStorage.setItem('hero_sns', '1000');
  debitUserCoins(200);
  assert(
    'STRESS-DEBIT-07',
    'SUITE 2',
    'debitUserCoins updates active seasonal key hero_sns_season3 in lockstep with hero_sns',
    mockStorage.getItem('hero_sns_season3') === '800' && mockStorage.getItem('hero_sns') === '800',
    'hero_sns_season3: 800, hero_sns: 800',
    `hero_sns_season3: ${mockStorage.getItem('hero_sns_season3')}, hero_sns: ${mockStorage.getItem('hero_sns')}`
  );
  mockStorage.setItem('hero_current_season', 'season1');
}

// ============================================================================
// SUITE 3: Codebase-Wide Zero Free Faucets Verification
// ============================================================================

async function runSuite3_ZeroFreeFaucets() {
  console.log('\n--- [SUITE 3] Codebase-Wide Zero Free Faucets Invariants ---');

  const filesToScan = [
    'src/landing/views/ShopSection.tsx',
    'src/landing/index.ts',
    'src/landing/components/Header.tsx',
    'src/landing/components/Sidebar.tsx',
    'src/landing/components/Modals.tsx',
    'src/landing/views/HomeSection.tsx',
    'src/landing/views/CardSection.tsx',
    'src/landing/views/PlaySection.tsx',
    'src/landing/views/MyDeckSection.tsx',
  ];

  let foundProhibitedFaucet = false;
  let prohibitedLocations: string[] = [];

  for (const relPath of filesToScan) {
    const content = readProjectFile(relPath);
    if (content.includes('free-charge-coin')) {
      foundProhibitedFaucet = true;
      prohibitedLocations.push(`${relPath}: includes "free-charge-coin"`);
    }
    if (content.includes('+ 코인 무료 충전')) {
      foundProhibitedFaucet = true;
      prohibitedLocations.push(`${relPath}: includes "+ 코인 무료 충전"`);
    }
    if (content.includes('무료 충전')) {
      foundProhibitedFaucet = true;
      prohibitedLocations.push(`${relPath}: includes "무료 충전"`);
    }
  }

  assert(
    'STRESS-FAUCET-01',
    'SUITE 3',
    'Grep across all 9 landing source files confirms 0 instances of "free-charge-coin", "+ 코인 무료 충전", or "무료 충전"',
    foundProhibitedFaucet === false,
    '0 occurrences',
    foundProhibitedFaucet ? prohibitedLocations.join('; ') : '0 occurrences'
  );

  // Check SHOP_ITEMS in ShopSection
  assert(
    'STRESS-FAUCET-02',
    'SUITE 3',
    'SHOP_ITEMS has exactly 8 items',
    SHOP_ITEMS.length === 8,
    '8 items',
    `${SHOP_ITEMS.length} items`
  );

  const zeroPriceItems = SHOP_ITEMS.filter((item) => item.priceCoins === 0);
  assert(
    'STRESS-FAUCET-03',
    'SUITE 3',
    'The ONLY item with priceCoins === 0 is "coin_charge" (which requires 5,000 Gold)',
    zeroPriceItems.length === 1 &&
      zeroPriceItems[0].id === 'coin_charge' &&
      zeroPriceItems[0].priceText.includes('골드') &&
      zeroPriceItems[0].badge.includes('환전'),
    '1 item ("coin_charge", priceText contains 골드, badge contains 환전)',
    `${zeroPriceItems.length} items (${zeroPriceItems.map((i) => i.id).join(', ')})`
  );

  // Verify that all 7 other items have priceCoins > 0
  const nonFreeItems = SHOP_ITEMS.filter((item) => item.id !== 'coin_charge');
  const allNonFreeHavePositiveCost = nonFreeItems.every((item) => item.priceCoins > 0);
  assert(
    'STRESS-FAUCET-04',
    'SUITE 3',
    'All 7 non-exchange shop items require strictly positive SNS coins (priceCoins > 0)',
    allNonFreeHavePositiveCost,
    'true',
    String(allNonFreeHavePositiveCost)
  );
}

// ============================================================================
// SUITE 4: Responsive Google AdSense Layout & Breakpoints
// ============================================================================

async function runSuite4_ResponsiveAdSense() {
  console.log('\n--- [SUITE 4] Responsive Google AdSense Layout & Breakpoints ---');

  // Verify breakpoint constant
  assert(
    'STRESS-ADS-01',
    'SUITE 4',
    'ADSENSE_CONFIG specifies exact 1024px breakpoint and official publisher client ID',
    ADSENSE_CONFIG.breakpointPx === 1024 && ADSENSE_CONFIG.client === 'ca-pub-6937094123258335',
    'breakpoint: 1024, client: ca-pub-6937094123258335',
    `breakpoint: ${ADSENSE_CONFIG.breakpointPx}, client: ${ADSENSE_CONFIG.client}`
  );

  // Test viewport matrix across mobile, tablet, desktop, and widescreen
  const viewportMatrix = [
    { width: 320, expectedMobile: true, expectedDesktop: false, label: '320px (iPhone SE)' },
    { width: 375, expectedMobile: true, expectedDesktop: false, label: '375px (iPhone Standard)' },
    { width: 768, expectedMobile: true, expectedDesktop: false, label: '768px (iPad Mini / Portrait)' },
    { width: 1023, expectedMobile: true, expectedDesktop: false, label: '1023px (1px below Desktop Breakpoint)' },
    { width: 1024, expectedMobile: false, expectedDesktop: true, label: '1024px (Exact Desktop Breakpoint)' },
    { width: 1280, expectedMobile: false, expectedDesktop: true, label: '1280px (Standard Desktop)' },
    { width: 1440, expectedMobile: false, expectedDesktop: true, label: '1440px (MacBook Pro Desktop)' },
    { width: 1920, expectedMobile: false, expectedDesktop: true, label: '1920px (Full HD Desktop)' },
    { width: 2560, expectedMobile: false, expectedDesktop: true, label: '2560px (2K QHD Display)' },
    { width: 3840, expectedMobile: false, expectedDesktop: true, label: '3840px (4K UHD Display)' },
  ];

  mockStorage.removeItem('hero_ad_removed');

  for (const vp of viewportMatrix) {
    const placement = getAdPlacements(vp.width);
    const pass =
      placement.mobileTop === vp.expectedMobile &&
      placement.desktopLeft === vp.expectedDesktop &&
      placement.desktopRight === vp.expectedDesktop &&
      placement.suppressedByVip === false;

    assert(
      `STRESS-ADS-VP-${vp.width}`,
      'SUITE 4',
      `Viewport ${vp.label}: mobileTop=${vp.expectedMobile}, desktopGutters=${vp.expectedDesktop}`,
      pass,
      `mobileTop: ${vp.expectedMobile}, desktop: ${vp.expectedDesktop}`,
      `mobileTop: ${placement.mobileTop}, desktop: ${placement.desktopLeft}`
    );
  }

  // HTML classes verification
  const leftGutterHtml = renderDesktopLeftGutter();
  const rightGutterHtml = renderDesktopRightGutter();
  const mobileTopHtml = renderMobileTopBanner();

  assert(
    'STRESS-ADS-CLASS-01',
    'SUITE 4',
    'Desktop Left Gutter includes responsive utility "hidden lg:flex" and role aside',
    leftGutterHtml.includes('<aside') &&
      leftGutterHtml.includes('id="adsense-desktop-left"') &&
      leftGutterHtml.includes('hidden lg:flex'),
    'contains <aside, id="adsense-desktop-left", hidden lg:flex',
    'verified in template'
  );

  assert(
    'STRESS-ADS-CLASS-02',
    'SUITE 4',
    'Desktop Right Gutter includes responsive utility "hidden lg:flex" and role aside',
    rightGutterHtml.includes('<aside') &&
      rightGutterHtml.includes('id="adsense-desktop-right"') &&
      rightGutterHtml.includes('hidden lg:flex'),
    'contains <aside, id="adsense-desktop-right", hidden lg:flex',
    'verified in template'
  );

  assert(
    'STRESS-ADS-CLASS-03',
    'SUITE 4',
    'Mobile Top Banner includes responsive utility "block lg:hidden"',
    mobileTopHtml.includes('<div') &&
      mobileTopHtml.includes('id="adsense-mobile-top"') &&
      mobileTopHtml.includes('block lg:hidden'),
    'contains <div, id="adsense-mobile-top", block lg:hidden',
    'verified in template'
  );

  // Wrapper structure verification
  const dummySlot = '<div id="test-main-slot">PLAYFIELD_CONTENT</div>';
  const wrappedHtml = renderAdSenseLayoutWrapper(dummySlot);
  assert(
    'STRESS-ADS-WRAPPER',
    'SUITE 4',
    'renderAdSenseLayoutWrapper places mobile banner above main and desktop gutters flanking main content slot',
    wrappedHtml.indexOf('adsense-mobile-top') < wrappedHtml.indexOf('test-main-slot') &&
      wrappedHtml.indexOf('adsense-desktop-left') < wrappedHtml.indexOf('test-main-slot') &&
      wrappedHtml.indexOf('test-main-slot') < wrappedHtml.indexOf('adsense-desktop-right'),
    'mobile banner < left gutter < main slot < right gutter',
    'verified in DOM ordering'
  );
}

// ============================================================================
// SUITE 5: VIP Ad-Removal Guard (hero_ad_removed === 'true')
// ============================================================================

async function runSuite5_VipAdRemoval() {
  console.log('\n--- [SUITE 5] VIP Ad-Removal Guard (hero_ad_removed 100% Suppression) ---');

  // Activate VIP Ad-Removal
  mockStorage.setItem('hero_ad_removed', 'true');

  assert(
    'STRESS-VIP-01',
    'SUITE 5',
    'isAdRemoved() evaluates to true when hero_ad_removed === "true"',
    isAdRemoved() === true,
    'true',
    String(isAdRemoved())
  );

  // Verify all renderers emit empty strings
  const left = renderDesktopLeftGutter();
  const right = renderDesktopRightGutter();
  const mobile = renderMobileTopBanner();
  assert(
    'STRESS-VIP-02',
    'SUITE 5',
    'renderDesktopLeftGutter(), renderDesktopRightGutter(), and renderMobileTopBanner() return empty strings under VIP guard',
    left === '' && right === '' && mobile === '',
    'left: "", right: "", mobile: ""',
    `left: "${left}", right: "${right}", mobile: "${mobile}"`
  );

  // Verify wrapper produces 0 ad units under VIP guard
  const wrapped = renderAdSenseLayoutWrapper('<main id="landing-main-slot">GAME_CONTENT</main>');
  const containsAnyAdTag =
    wrapped.includes('adsense-desktop-left') ||
    wrapped.includes('adsense-desktop-right') ||
    wrapped.includes('adsense-mobile-top') ||
    wrapped.includes('adsbygoogle') ||
    wrapped.includes('ca-pub-');

  assert(
    'STRESS-VIP-03',
    'SUITE 5',
    'renderAdSenseLayoutWrapper emits zero ad containers or AdSense attributes under VIP guard',
    containsAnyAdTag === false,
    'false (zero ad elements)',
    `containsAnyAdTag: ${containsAnyAdTag}`
  );

  // Verify getAdPlacements returns 100% suppressed across all widths
  const widths = [320, 375, 480, 768, 1023, 1024, 1280, 1440, 1920, 2560, 3840];
  const allSuppressed = widths.every((w) => {
    const p = getAdPlacements(w);
    return (
      p.suppressedByVip === true &&
      p.desktopLeft === false &&
      p.desktopRight === false &&
      p.mobileTop === false
    );
  });
  assert(
    'STRESS-VIP-04',
    'SUITE 5',
    'getAdPlacements returns suppressedByVip: true and false across all viewports (320px..3840px)',
    allSuppressed,
    'true',
    String(allSuppressed)
  );

  // Verify pushAdSenseTags does not push anything under VIP guard
  (window as any).adsbygoogle = [];
  pushAdSenseTags();
  assert(
    'STRESS-VIP-05',
    'SUITE 5',
    'pushAdSenseTags() aborts without pushing to window.adsbygoogle under VIP guard',
    (window as any).adsbygoogle.length === 0,
    '0 pushes',
    `${(window as any).adsbygoogle.length} pushes`
  );

  // Adversarial values: 'false', '0', null, undefined
  mockStorage.setItem('hero_ad_removed', 'false');
  assert(
    'STRESS-VIP-06',
    'SUITE 5',
    'Setting hero_ad_removed = "false" does NOT suppress ads (isAdRemoved() === false)',
    isAdRemoved() === false,
    'false',
    String(isAdRemoved())
  );

  mockStorage.setItem('hero_ad_removed', '0');
  assert(
    'STRESS-VIP-07',
    'SUITE 5',
    'Setting hero_ad_removed = "0" does NOT suppress ads (isAdRemoved() === false)',
    isAdRemoved() === false,
    'false',
    String(isAdRemoved())
  );

  mockStorage.removeItem('hero_ad_removed');
  assert(
    'STRESS-VIP-08',
    'SUITE 5',
    'When hero_ad_removed is absent, isAdRemoved() defaults to false',
    isAdRemoved() === false,
    'false',
    String(isAdRemoved())
  );

  // Purchasing ad_remove item from shop
  setUserCoins(2000);
  const buyAdRemove = executeShopPurchase('ad_remove');
  assert(
    'STRESS-VIP-09',
    'SUITE 5',
    'executeShopPurchase("ad_remove") debits 1,000 SNS and activates VIP guard in LocalStorage',
    buyAdRemove.success === true &&
      getUserCoins() === 1000 &&
      mockStorage.getItem('hero_ad_removed') === 'true' &&
      isAdRemoved() === true,
    'success: true, coins: 1000, hero_ad_removed: "true", isAdRemoved: true',
    `success: ${buyAdRemove.success}, coins: ${getUserCoins()}, stored: ${mockStorage.getItem('hero_ad_removed')}`
  );
}

// ============================================================================
// MAIN RUNNER
// ============================================================================

async function main() {
  console.log('========================================================================');
  console.log('  CHALLENGER M5 IT2-2: CURRENCY, FAUCETS & RESPONSIVE ADSENSE STRESS    ');
  console.log('========================================================================');

  await runSuite1_GoldExchange();
  await runSuite2_DebitHierarchy();
  await runSuite3_ZeroFreeFaucets();
  await runSuite4_ResponsiveAdSense();
  await runSuite5_VipAdRemoval();

  const total = testResults.length;
  const passed = testResults.filter((r) => r.passed).length;
  const failed = total - passed;
  const rate = ((passed / total) * 100).toFixed(1);

  console.log('\n========================================================================');
  console.log('  CHALLENGER M5 IT2-2 TEST EXECUTION SUMMARY                            ');
  console.log('========================================================================');
  console.log(`  Total Assertions Run : ${total}`);
  console.log(`  Passed               : ${passed}`);
  console.log(`  Failed               : ${failed}`);
  console.log(`  Pass Rate            : ${rate}%`);
  console.log('========================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal unhandled error:', err);
  process.exit(1);
});
