# Milestone 6 Iteration 2: Tier 1–4 Test Refactoring Strategy & Blueprint Report

**Author**: `explorer_m6_it2_2` (Tier 1–4 Test Refactoring Explorer)  
**Parent Agent ID**: `21826d14-7bc9-4995-866c-cbb42a941789`  
**Working Directory**: `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_m6_it2_2/`  
**Target Deliverables**:
- `tests/e2e/helpers.ts`
- `tests/e2e/tier1_feature_coverage.ts` (51 assertions total, 24 rewired to production)
- `tests/e2e/tier2_boundary_corner.ts` (12 assertions total, 12 rewired to production)
- `tests/e2e/tier3_cross_feature.ts` (7 assertions total, 7 rewired to production)
- `tests/e2e/tier4_realworld_workload.ts` (6 assertions total, 6 rewired to production)
- `tests/adversarial_challenger_m4_empirical.ts` (1 tautology assertion fix at line 466)
- Supporting production services:
  - `src/landing/services/hashRouter.ts` (extracted router service re-exported by `src/landing/index.ts`)
  - `src/landing/services/idleAutoPlayManager.ts` (tick & interaction simulation methods)

---

## 1. Observation (직접 관측 사실)

### 1.1 Forensic Audit Finding Confirmation
From the Forensic Audit Report (`auditor_m6_master/handoff.md`), the master E2E test suite in `tests/e2e/` was flagged for **INTEGRITY VIOLATION (REJECTED)** due to:
1. **Duplicate Test Doubles**: `tests/e2e/helpers.ts` defines 5 duplicate in-memory reference classes:
   - `ReferenceHashRouter` (lines 88–125)
   - `ReferenceIdleAutoPlayManager` (lines 128–180)
   - `ReferenceNurtureStore` (lines 183–388)
   - `ReferenceShopManager` (lines 390–534)
   - `ReferenceAdSenseManager` (lines 536–570)
2. **Pervasive Import Across All 4 Tiers**:
   - `tests/e2e/tier1_feature_coverage.ts`: 24 assertions instantiate and exercise these classes (`T1.HASH.1,3,4`, `T1.IDLE.1..4`, `T1.HOME.3`, `T1.DECK.2..5`, `T1.CARD.2,4..6`, `T1.SHOP.2..5`, `T1.ADS.1..4`).
   - `tests/e2e/tier2_boundary_corner.ts`: All 12 assertions (`T2.B1.1` through `T2.B7.2`) exercise these classes.
   - `tests/e2e/tier3_cross_feature.ts`: All 7 assertions (`T3.C1.1` through `T3.C1.7`) exercise these classes.
   - `tests/e2e/tier4_realworld_workload.ts`: All 6 assertions (`T4.W1.1` through `T4.W1.6`) exercise these classes.
   - **Total affected assertions**: 49 assertions out of 76 assertions directly depend on these 5 reference classes.
3. **Tautological Assertion**:
   - `tests/adversarial_challenger_m4_empirical.ts:466` contains `assert('Rapid Toggle Stress', '1,000 rapid autoMode toggles complete without deadlock', true);` where the condition is a hardcoded literal `true`.

### 1.2 Genuine Production Deliverables in `src/landing/`
Investigation with `view_file` and Node execution tests confirms that genuine, production-grade implementations already exist in `src/landing/`:
1. **`src/landing/services/cardNurtureStore.ts`**:
   - Exports `CardNurtureStore` class and `cardNurtureStore` singleton.
   - Full API available: `nurtureCard`, `allocateStat`, `getDeckTP`, `getTotalTP`, `awardBattleVictoryExp`, `setRepeatHunting`, `isRepeatHuntingActive`, `isCardOwned`, `addCard`, `setDeckCard`, `swapDeckCards`, `saveToStorage`, `loadFromStorage`.
   - Guaranteed ownership gating at line 246 (`!this.isCardOwned(cardId)`).
   - Dual-write persistence to `hero_card_nurturing`, `hero_deck`, and `hero_inventory`.
2. **`src/landing/views/ShopSection.tsx`**:
   - Exports `executeShopPurchase(itemId: string): ShopPurchaseResult` for card packs (`pack_normal`, `pack_magic`, `pack_rare`).
   - Exports `exchangeGoldForSns(goldAmount: number)` with 5,000 Gold -> 1,000 SNS rate and insufficient balance rejection.
   - Exports currency accessors: `getUserCoins()`, `setUserCoins(amount)`, `getUserGold()`, `setUserGold(amount)`.
3. **`src/landing/services/adsenseManager.ts`**:
   - Exports `getAdPlacements(viewportWidth?: number): AdSensePlacementResult`.
   - Exports `isAdRemoved(): boolean`.
   - Supports 1024px desktop breakpoint and VIP suppression (`hero_ad_removed`).
4. **`src/landing/services/idleAutoPlayManager.ts`**:
   - Exports `IdleAutoPlayManager` and `initIdleAutoPlay()`.
   - Configures `timeoutMs` (15,000ms), `targetUrl` (`https://dayyoung-macbookpro.tail3717a4.ts.net/#play`), and writes `hero_kadan_rpg_auto_mode` = `'true'`.
5. **`src/landing/index.ts` Node Import Constraint**:
   - Direct execution of `import('./src/landing/index.ts')` in Node.js/tsx throws `ERR_UNKNOWN_FILE_EXTENSION: Unknown file extension ".css"` due to `import './styles/landing.css';` on line 11.
   - Router definitions (`VALID_VIEWS`, `HASH_VIEW_MAP`, `LEGACY_PATH_MAP`, `parseRoute`) are pure TypeScript functions. Extracting them into `src/landing/services/hashRouter.ts` and re-exporting them in `src/landing/index.ts` creates a clean, headless-importable production module.

---

## 2. Logic Chain (추론 사슬)

1. **Premise 1 (Integrity Standard)**: Test suites must test actual production deliverables, never test doubles or isolated in-memory clones (`Reference*Manager` / `Reference*Store`).
2. **Premise 2 (API Parity)**: The methods on `ReferenceNurtureStore`, `ReferenceShopManager`, and `ReferenceAdSenseManager` match the genuine production functions in `cardNurtureStore.ts`, `ShopSection.tsx`, and `adsenseManager.ts`.
3. **Premise 3 (Deterministic Execution for Idle Manager)**: In production, `IdleAutoPlayManager` tracks wall-clock time via `setTimeout(15000)` and `Date.now()`. To test 15-second countdowns, sub-millisecond boundaries (14,999ms vs 15,000ms), and last-millisecond user resets without 15-second real sleeps, `IdleAutoPlayManager` can natively include deterministic clock simulation methods (`tick(deltaMs)`, `handleUserInteraction()`, `getIdleTime()`, `isTriggered()`). This allows the genuine class to be tested directly.
4. **Premise 4 (Headless Environment Polyfill)**: Production code checks `typeof localStorage !== 'undefined'` and `typeof window !== 'undefined'`. By configuring `globalThis.localStorage = mockStorage` in a centralized `setupTestEnvironment()` helper in `helpers.ts`, all production functions run against mock storage in Node.js without any code modifications to their core storage access patterns.
5. **Conclusion**: By purging the 5 `Reference*` classes from `helpers.ts`, providing pure router service `src/landing/services/hashRouter.ts`, augmenting `IdleAutoPlayManager` with simulation methods, and re-wiring the 49 assertions to genuine production modules, 100% of the 76 assertions across Tiers 1–4 will test authentic production code while preserving 100% test pass fidelity.

---

## 3. Caveats

1. **Global Storage Isolation Between Tests**:
   Because `cardNurtureStore` and `ShopSection` operate on `localStorage`, each test that sets custom balances (`setUserCoins`, `setUserGold`, `mockStorage.setItem`) must use a fresh `MockLocalStorage` or call `mockStorage.clear()` to avoid cross-assertion state leakage.
2. **Browser Environment Polyfills**:
   Node.js lacks native `window.dispatchEvent` and `CustomEvent`. `helpers.ts` must ensure `globalThis.window` and `globalThis.CustomEvent` are safely defined so production events (`snshero_sns_updated`, `snshero_card_nurture_updated`) execute without crashing.
3. **Pure Router Extraction Scope**:
   `src/landing/services/hashRouter.ts` must be re-exported by `src/landing/index.ts` (`export * from './services/hashRouter';`) so that production bundling in `dist/index.html` remains 100% identical and unchanged.

---

## 4. Concrete Refactoring Blueprints

### 4.1 Production Deliverable Enhancements

#### Blueprint P1: `src/landing/services/hashRouter.ts` (New Production Service)
Extract pure routing logic from `src/landing/index.ts` into `src/landing/services/hashRouter.ts`:
```typescript
/**
 * src/landing/services/hashRouter.ts
 * Single-Page Application Hash Navigation & Route Normalization Service.
 */

export type ViewKey = 'home' | 'deck' | 'play' | 'card' | 'shop';
export type HashRoute = '#home' | '#deck' | '#play' | '#card' | '#shop';
export type LegacyRoute = '/home' | '/deck' | '/play' | '/main' | '/shop' | '/card';

export const VALID_VIEWS: readonly ViewKey[] = ['home', 'deck', 'play', 'card', 'shop'] as const;

export const HASH_ROUTES: readonly HashRoute[] = [
  '#home',
  '#deck',
  '#play',
  '#card',
  '#shop',
] as const;

export const LEGACY_ROUTES: readonly LegacyRoute[] = [
  '/home',
  '/deck',
  '/play',
  '/main',
  '/shop',
  '/card',
] as const;

export const HASH_VIEW_MAP: Record<string, ViewKey> = {
  home: 'home',
  'main-lobby': 'home',
  deck: 'deck',
  mydeck: 'deck',
  play: 'play',
  main: 'play',
  battle: 'play',
  card: 'card',
  cards: 'card',
  mission: 'card',
  missions: 'card',
  companion: 'card',
  shop: 'shop',
  store: 'shop',
};

export const LEGACY_PATH_MAP: Record<string, ViewKey> = {
  '/home': 'home',
  '/main-lobby': 'home',
  '/deck': 'deck',
  '/mydeck': 'deck',
  '/play': 'play',
  '/main': 'play',
  '/card': 'card',
  '/cards': 'card',
  '/mission': 'card',
  '/missions': 'card',
  '/shop': 'shop',
  '/store': 'shop',
};

export const LEGACY_ROUTE_MAPPING: Record<LegacyRoute, HashRoute> = {
  '/home': '#home',
  '/deck': '#deck',
  '/play': '#play',
  '/main': '#play',
  '/shop': '#shop',
  '/card': '#card',
};

export function parseRoute(hashString?: string, pathnameString?: string): ViewKey {
  const rawHash = (hashString !== undefined ? hashString : (typeof window !== 'undefined' ? window.location.hash : ''))
    .replace(/^#\/?/, '')
    .split('?')[0]
    .replace(/\/$/, '')
    .toLowerCase();

  if (rawHash && rawHash in HASH_VIEW_MAP) {
    return HASH_VIEW_MAP[rawHash];
  }

  const cleanPath = (pathnameString !== undefined ? pathnameString : (typeof window !== 'undefined' ? window.location.pathname : ''))
    .replace(/\/$/, '')
    .toLowerCase();

  if (cleanPath && cleanPath in LEGACY_PATH_MAP) {
    return LEGACY_PATH_MAP[cleanPath];
  }

  return 'home';
}

export function normalizeHashRoute(rawHashOrPath: string): HashRoute {
  if (!rawHashOrPath) return '#home';
  const clean = rawHashOrPath.split('?')[0].trim();
  if (clean in LEGACY_ROUTE_MAPPING) {
    return LEGACY_ROUTE_MAPPING[clean as LegacyRoute];
  }
  const normalizedHash = clean.startsWith('#') ? clean : `#${clean}`;
  if (HASH_ROUTES.includes(normalizedHash as HashRoute)) {
    return normalizedHash as HashRoute;
  }
  const view = parseRoute(clean.startsWith('#') ? clean : undefined, !clean.startsWith('#') ? clean : undefined);
  const candidate = `#${view}` as HashRoute;
  if (HASH_ROUTES.includes(candidate)) {
    return candidate;
  }
  return '#home';
}

export function isLegacyRoute(route: string): boolean {
  const clean = route.split('?')[0].trim();
  return clean in LEGACY_ROUTE_MAPPING;
}

export function getLegacyRedirect(route: string): HashRoute | null {
  const clean = route.split('?')[0].trim();
  if (clean in LEGACY_ROUTE_MAPPING) {
    return LEGACY_ROUTE_MAPPING[clean as LegacyRoute];
  }
  return null;
}
```
In `src/landing/index.ts`:
Replace duplicate definitions with:
```typescript
export * from './services/hashRouter';
```

#### Blueprint P2: `src/landing/services/idleAutoPlayManager.ts`
Add deterministic simulation methods directly to `IdleAutoPlayManager`:
```typescript
export class IdleAutoPlayManager {
  ...
  private currentIdleMs: number = 0;
  private isAutoPlayActive: boolean = false;

  public handleUserInteraction(): void {
    this.currentIdleMs = 0;
    this.handleUserActivity();
  }

  public getIdleTime(): number {
    return this.currentIdleMs;
  }

  public isTriggered(): boolean {
    return this.isAutoPlayActive;
  }

  public tick(deltaMs: number): { redirected: boolean; targetUrl?: string; autoModeSet: boolean } {
    this.currentIdleMs += deltaMs;
    if (this.currentIdleMs >= this.timeoutMs) {
      this.isAutoPlayActive = true;
      this.executeIdleTransition();
      const autoModeSet = typeof localStorage !== 'undefined'
        ? localStorage.getItem('hero_kadan_rpg_auto_mode') === 'true'
        : false;
      return {
        redirected: true,
        targetUrl: this.targetUrl,
        autoModeSet,
      };
    }
    const autoModeSet = typeof localStorage !== 'undefined'
      ? localStorage.getItem('hero_kadan_rpg_auto_mode') === 'true'
      : false;
    return {
      redirected: false,
      autoModeSet,
    };
  }
  ...
}
```

---

### 4.2 Test Suite Refactoring Blueprints

#### Blueprint T0: `tests/e2e/helpers.ts`
1. **Purge**: Delete `ReferenceHashRouter`, `ReferenceIdleAutoPlayManager`, `ReferenceNurtureStore`, `ReferenceShopManager`, and `ReferenceAdSenseManager` (lines 88–576).
2. **Add**: Setup helper ensuring mock storage is active on `globalThis`:
```typescript
export function setupTestEnvironment(): MockLocalStorage {
  const storage = new MockLocalStorage();
  (globalThis as any).localStorage = storage;
  if (typeof (globalThis as any).window === 'undefined') {
    (globalThis as any).window = {
      location: {
        hash: '#home',
        pathname: '/',
        origin: 'http://localhost',
        href: 'http://localhost/#home',
      },
      innerWidth: 1024,
      dispatchEvent: () => true,
      addEventListener: () => {},
      removeEventListener: () => {},
    };
  }
  if (typeof (globalThis as any).document === 'undefined') {
    (globalThis as any).document = {
      addEventListener: () => {},
      removeEventListener: () => {},
      visibilityState: 'visible',
    };
  }
  if (typeof (globalThis as any).Event === 'undefined') {
    (globalThis as any).Event = class Event {
      type: string;
      constructor(type: string) { this.type = type; }
    };
  }
  if (typeof (globalThis as any).CustomEvent === 'undefined') {
    (globalThis as any).CustomEvent = class CustomEvent extends (globalThis as any).Event {
      detail: any;
      constructor(type: string, params?: any) {
        super(type);
        this.detail = params?.detail;
      }
    };
  }
  return storage;
}
```

#### Blueprint T1: `tests/e2e/tier1_feature_coverage.ts`
**Import Replacement**:
```typescript
// Replace lines 8-19:
import {
  readProjectFile,
  projectPathExists,
  parseHtml,
  runTestAssertion,
  MockLocalStorage,
  setupTestEnvironment,
} from './helpers';
import {
  TestResult,
  HASH_ROUTES,
  LEGACY_ROUTES,
  LEGACY_ROUTE_MAPPING,
  IDLE_AUTO_PLAY_CONFIG,
  TOP_NAV_ITEMS,
  SIDE_NAV_ITEMS,
  SHOP_8_ITEMS,
  EXTERNAL_LINKS,
} from './types';
import { CARD_DATABASE } from '../../src/cardDatabase';

// Genuine Production Imports:
import {
  normalizeHashRoute,
  getLegacyRedirect,
} from '../../src/landing/services/hashRouter';
import {
  IdleAutoPlayManager,
} from '../../src/landing/services/idleAutoPlayManager';
import {
  CardNurtureStore,
  cardNurtureStore,
} from '../../src/landing/services/cardNurtureStore';
import {
  executeShopPurchase,
  exchangeGoldForSns,
  getUserCoins,
  setUserCoins,
  getUserGold,
  setUserGold,
} from '../../src/landing/views/ShopSection';
import {
  getAdPlacements,
} from '../../src/landing/services/adsenseManager';
```

**Assertion Rewiring Details**:
- `T1.HASH.1`: Call `normalizeHashRoute(expectedHash)` directly instead of `new ReferenceHashRouter()`.
- `T1.HASH.3`: Call `getLegacyRedirect('/home')` and `getLegacyRedirect('/main')` directly.
- `T1.HASH.4`: Call `getLegacyRedirect(legacy)` directly.
- `T1.IDLE.1`:
  ```typescript
  const mockStorage = setupTestEnvironment();
  const idleManager = new IdleAutoPlayManager({ timeoutMs: 15000 });
  const tick10s = idleManager.tick(10000);
  if (tick10s.redirected) return { pass: false, message: 'Idle manager triggered prematurely at 10,000ms' };
  const tick15s = idleManager.tick(5000);
  if (!tick15s.redirected) return { pass: false, message: 'Idle manager failed to trigger at exactly 15,000ms' };
  ```
- `T1.IDLE.2`:
  ```typescript
  const mockStorage = setupTestEnvironment();
  const idleManager = new IdleAutoPlayManager();
  const res = idleManager.tick(15000);
  const expectedUrl = 'https://dayyoung-macbookpro.tail3717a4.ts.net/#play';
  if (res.targetUrl !== expectedUrl) return { pass: false, message: `Target URL mismatch: got ${res.targetUrl}` };
  ```
- `T1.IDLE.3`:
  ```typescript
  const mockStorage = setupTestEnvironment();
  const idleManager = new IdleAutoPlayManager();
  idleManager.tick(15000);
  const flag = mockStorage.getItem('hero_kadan_rpg_auto_mode');
  if (flag !== 'true') return { pass: false, message: `Expected flag = 'true', got '${flag}'` };
  ```
- `T1.IDLE.4`:
  ```typescript
  const mockStorage = setupTestEnvironment();
  const idleManager = new IdleAutoPlayManager();
  idleManager.tick(12000);
  idleManager.handleUserInteraction();
  if (idleManager.getIdleTime() !== 0) return { pass: false, message: `Timer not reset to 0: ${idleManager.getIdleTime()}` };
  const tickPostReset = idleManager.tick(10000);
  if (tickPostReset.redirected) return { pass: false, message: 'Triggered prematurely after reset' };
  ```
- `T1.HOME.3`:
  ```typescript
  setupTestEnvironment();
  const oracle = new CardNurtureStore();
  const deckTP = oracle.getDeckTP();
  if (typeof deckTP !== 'number' || deckTP <= 0) return { pass: false, message: `Invalid Deck TP: ${deckTP}` };
  ```
- `T1.DECK.2`:
  ```typescript
  setupTestEnvironment();
  const oracle = new CardNurtureStore();
  oracle.addCard(6);
  const swapSuccess = oracle.setDeckCard(0, 6);
  if (!swapSuccess) return { pass: false, message: 'Failed to set Card 6 into deck slot 0' };
  if (oracle.activeDeckIds[0] !== 6) return { pass: false, message: `Expected Card 6 in slot 0, got ${oracle.activeDeckIds[0]}` };
  const unownedSwap = oracle.setDeckCard(0, 99);
  if (unownedSwap) return { pass: false, message: 'Unowned card allowed into deck slot' };
  ```
- `T1.DECK.3`:
  ```typescript
  setupTestEnvironment();
  const oracle = new CardNurtureStore();
  const baseTP = oracle.getDeckTP();
  oracle.nurtureCard(2, 100);
  oracle.allocateStat(2, 'top');
  const updatedTP = oracle.getDeckTP();
  if (updatedTP !== baseTP + 1) return { pass: false, message: `Expected ${baseTP + 1}, got ${updatedTP}` };
  ```
- `T1.DECK.4`:
  ```typescript
  setupTestEnvironment();
  const oracle = new CardNurtureStore();
  const initialTotal = oracle.getTotalTP();
  oracle.addCard(7);
  const newTotal = oracle.getTotalTP();
  if (newTotal <= initialTotal) return { pass: false, message: 'Total TP did not increase' };
  ```
- `T1.DECK.5`:
  ```typescript
  const mockStorage = setupTestEnvironment();
  const oracle = new CardNurtureStore();
  oracle.setDeckCard(1, 4);
  oracle.saveToStorage();
  const stored = mockStorage.getItem('hero_deck');
  if (!stored || !stored.includes('4')) return { pass: false, message: 'Active deck not persisted under hero_deck' };
  ```
- `T1.CARD.2`:
  ```typescript
  setupTestEnvironment();
  const oracle = new CardNurtureStore();
  const isOwned = oracle.isCardOwned(50);
  if (isOwned) return { pass: false, message: 'Card 50 should not be owned by default' };
  const nurtureResult = oracle.nurtureCard(50, 500);
  if (nurtureResult.expGained > 0 || nurtureResult.leveledUp) return { pass: false, message: 'Unowned Card 50 gained EXP' };
  if (oracle.cards[50].level !== 1) return { pass: false, message: `Unowned card level altered: ${oracle.cards[50].level}` };
  ```
- `T1.CARD.4`:
  ```typescript
  setupTestEnvironment();
  const oracle = new CardNurtureStore();
  const initialExp1 = oracle.cards[1].exp;
  const reward = oracle.awardBattleVictoryExp(50);
  if (reward.expAwarded !== 50) return { pass: false, message: `Expected 50 EXP awarded, got ${reward.expAwarded}` };
  if (oracle.cards[1].exp !== initialExp1 + 50) return { pass: false, message: `Card 1 EXP not updated: ${oracle.cards[1].exp}` };
  ```
- `T1.CARD.5`:
  ```typescript
  setupTestEnvironment();
  const oracle = new CardNurtureStore();
  oracle.setRepeatHunting(true);
  if (!oracle.isRepeatHuntingActive()) return { pass: false, message: 'Failed to activate repeat hunting' };
  oracle.setRepeatHunting(false);
  if (oracle.isRepeatHuntingActive()) return { pass: false, message: 'Failed to deactivate repeat hunting' };
  ```
- `T1.CARD.6`:
  ```typescript
  setupTestEnvironment();
  const oracle = new CardNurtureStore();
  oracle.nurtureCard(1, 100);
  if (oracle.cards[1].level !== 2 || oracle.cards[1].statPoints !== 1) return { pass: false, message: 'Expected Lv 2 & 1 pt' };
  if (!oracle.hasUnspentPoints(1)) return { pass: false, message: 'Red dot indicator not active' };
  oracle.allocateStat(1, 'right');
  if (oracle.cards[1].statPoints !== 0 || oracle.cards[1].bonusStats.right !== 1) return { pass: false, message: 'Stat not allocated to right' };
  if (oracle.hasUnspentPoints(1)) return { pass: false, message: 'Red dot still active after spending point' };
  ```
- `T1.SHOP.2`:
  ```typescript
  setupTestEnvironment();
  setUserCoins(1000);
  const res = executeShopPurchase('pack_normal');
  if (!res.success) return { pass: false, message: `Card pack purchase failed: ${res.message}` };
  if (!res.revealedCards || res.revealedCards.length !== 3) return { pass: false, message: `Expected 3 revealed cards, got ${res.revealedCards?.length}` };
  ```
- `T1.SHOP.3`:
  ```typescript
  const mockStorage = setupTestEnvironment();
  setUserCoins(1000);
  const res = executeShopPurchase('pack_magic');
  if (!res.success || !res.revealedCards) return { pass: false, message: 'Purchase failed' };
  const rolledCardId = res.revealedCards[0].cardId;
  if (!cardNurtureStore.isCardOwned(rolledCardId)) return { pass: false, message: `Card ${rolledCardId} missing in cardNurtureStore` };
  const rawInv = mockStorage.getItem('hero_inventory');
  if (!rawInv || !rawInv.includes(String(rolledCardId))) return { pass: false, message: `Card ${rolledCardId} not in hero_inventory` };
  ```
- `T1.SHOP.4`:
  ```typescript
  setupTestEnvironment();
  setUserCoins(1000);
  const initialSns = getUserCoins();
  const res = executeShopPurchase('pack_normal');
  if (!res.success) return { pass: false, message: 'Purchase failed' };
  const afterSns = getUserCoins();
  if (afterSns !== initialSns - 300) return { pass: false, message: `Expected ${initialSns - 300} SNS, got ${afterSns}` };
  ```
- `T1.SHOP.5`:
  ```typescript
  setupTestEnvironment();
  setUserGold(10000);
  setUserCoins(1000);
  const initialGold = getUserGold();
  const initialSns = getUserCoins();
  const exchange = exchangeGoldForSns(5000);
  if (!exchange.success) return { pass: false, message: `Gold exchange failed: ${exchange.message}` };
  if (exchange.snsGranted !== 1000) return { pass: false, message: `Expected 1000 SNS granted, got ${exchange.snsGranted}` };
  if (getUserGold() !== initialGold - 5000) return { pass: false, message: `Gold balance not debited: ${getUserGold()}` };
  if (getUserCoins() !== initialSns + 1000) return { pass: false, message: `SNS balance not credited: ${getUserCoins()}` };
  ```
- `T1.ADS.1`:
  ```typescript
  setupTestEnvironment();
  const desktop = getAdPlacements(1280);
  if (!desktop.desktopLeft || !desktop.desktopRight) return { pass: false, message: 'Desktop gutters not active at 1280px' };
  if (desktop.mobileTop) return { pass: false, message: 'Mobile top banner should not be active on desktop' };
  ```
- `T1.ADS.2`:
  ```typescript
  setupTestEnvironment();
  const mobile = getAdPlacements(375);
  if (!mobile.mobileTop) return { pass: false, message: 'Mobile top banner not active on 375px' };
  if (mobile.desktopLeft || mobile.desktopRight) return { pass: false, message: 'Desktop gutters must be inactive on mobile' };
  ```
- `T1.ADS.3`:
  ```typescript
  setupTestEnvironment();
  const placements = getAdPlacements(1440);
  if (!placements.desktopLeft || !placements.desktopRight) return { pass: false, message: 'Desktop layout failed placement test' };
  ```
- `T1.ADS.4`:
  ```typescript
  const mockStorage = setupTestEnvironment();
  mockStorage.setItem('hero_ad_removed', 'true');
  const desktop = getAdPlacements(1440);
  const mobile = getAdPlacements(375);
  if (desktop.desktopLeft || desktop.desktopRight || desktop.mobileTop) return { pass: false, message: 'Desktop ads not suppressed with VIP' };
  if (mobile.desktopLeft || mobile.desktopRight || mobile.mobileTop) return { pass: false, message: 'Mobile ads not suppressed with VIP' };
  if (!desktop.suppressedByVip || !mobile.suppressedByVip) return { pass: false, message: 'VIP suppression flag not set' };
  ```

#### Blueprint T2: `tests/e2e/tier2_boundary_corner.ts`
**Import Replacement**:
```typescript
import {
  runTestAssertion,
  MockLocalStorage,
  setupTestEnvironment,
} from './helpers';
import { TestResult } from './types';
import { normalizeHashRoute } from '../../src/landing/services/hashRouter';
import { IdleAutoPlayManager } from '../../src/landing/services/idleAutoPlayManager';
import { CardNurtureStore } from '../../src/landing/services/cardNurtureStore';
import {
  executeShopPurchase,
  exchangeGoldForSns,
  getUserCoins,
  setUserCoins,
  getUserGold,
  setUserGold,
} from '../../src/landing/views/ShopSection';
import { getAdPlacements } from '../../src/landing/services/adsenseManager';
```
**Rewiring**:
- `T2.B1.1` (Max Lv 100): `new CardNurtureStore()`, test `oracle.nurtureCard(1, 999999)` returns `leveledUp === false` and `cards[1].level === 100`.
- `T2.B1.2` (Lv 1 Baseline): `new CardNurtureStore()`, test clean baseline.
- `T2.B2.1` (Unowned Card 110): `new CardNurtureStore()`, test unowned nurture rejection.
- `T2.B3.1` (14,999ms vs 15,000ms): `setupTestEnvironment()`, `const idleManager = new IdleAutoPlayManager({ timeoutMs: 15000 })`, test `tick(14999)` -> `redirected: false`, `tick(1)` -> `redirected: true`.
- `T2.B3.2` (Reset at last second): `setupTestEnvironment()`, `tick(14900)`, `handleUserInteraction()`, `tick(5000)` -> `redirected: false`, `getIdleTime() === 5000`.
- `T2.B4.1` (Insufficient SNS): `setupTestEnvironment()`, `setUserCoins(100)`, `executeShopPurchase('pack_normal')` -> `success: false`, `revealedCards: []`, `getUserCoins() === 100`.
- `T2.B4.2` (Invalid Gold): `setupTestEnvironment()`, `setUserGold(2000)`, `setUserCoins(500)`, `exchangeGoldForSns(0)` -> `success: false`, `exchangeGoldForSns(5000)` -> `success: false`, balances unchanged.
- `T2.B5.1` (1023px vs 1024px): `setupTestEnvironment()`, `getAdPlacements(1023)` vs `getAdPlacements(1024)`.
- `T2.B5.2` (VIP 320px..3840px): `setupTestEnvironment()`, `mockStorage.setItem('hero_ad_removed', 'true')`, test `getAdPlacements(w)`.
- `T2.B6.1` (Malformed Hash Route): Call `normalizeHashRoute(invalid)` directly.
- `T2.B7.1` (Corrupted JSON): `setupTestEnvironment()`, `mockStorage.setItem('hero_card_nurturing', 'INVALID_JSON_CORRUPTED_{{{{')`, `const oracle = new CardNurtureStore()`, `oracle.loadFromStorage()` does not throw, defaults restored.
- `T2.B7.2` (0 Stat Points): `new CardNurtureStore()`, `oracle.allocateStat(1, 'top') === false`.

#### Blueprint T3: `tests/e2e/tier3_cross_feature.ts`
**Import Replacement**:
```typescript
import {
  runTestAssertion,
  MockLocalStorage,
  setupTestEnvironment,
} from './helpers';
import { TestResult } from './types';
import { normalizeHashRoute } from '../../src/landing/services/hashRouter';
import { IdleAutoPlayManager } from '../../src/landing/services/idleAutoPlayManager';
import { CardNurtureStore } from '../../src/landing/services/cardNurtureStore';
import {
  executeShopPurchase,
  exchangeGoldForSns,
  getUserCoins,
  setUserCoins,
  getUserGold,
  setUserGold,
} from '../../src/landing/views/ShopSection';
import { getAdPlacements } from '../../src/landing/services/adsenseManager';
```
**Rewiring**:
- `T3.C1.1`: `setupTestEnvironment()`, `IdleAutoPlayManager`, `normalizeHashRoute('#deck')`, `idleManager.handleUserInteraction()`, `tick(10000)`.
- `T3.C1.2`: `setupTestEnvironment()`, `new CardNurtureStore()`, `oracle.awardBattleVictoryExp(50)` twice, `oracle.allocateStat(1, 'top')`, `oracle.getDeckTP() === initialDeckTP + 1`.
- `T3.C1.3`: `setupTestEnvironment()`, `const store = new CardNurtureStore()`, unowned Card 20 cannot nurture, `store.addCard(20)` dual-writes, nurture now succeeds (`newLevel: 2`).
- `T3.C1.4`: `setupTestEnvironment()`, `setUserCoins(100)`, `setUserGold(10000)`, `executeShopPurchase('pack_normal')` fails, `exchangeGoldForSns(5000)` succeeds, `executeShopPurchase('pack_normal')` now succeeds, SNS balance becomes 800.
- `T3.C1.5`: `setupTestEnvironment()`, `new CardNurtureStore()`, `oracle.setRepeatHunting(true)`, loop 3 victories, Card 1 reaches Lv 2, 50 EXP.
- `T3.C1.6`: `setupTestEnvironment()`, `getAdPlacements(1440)` vs `getAdPlacements(375)`, then `hero_ad_removed = 'true'`, both suppressed.
- `T3.C1.7`: Call `normalizeHashRoute(legacy)` for all legacy routes (`/home`, `/deck`, `/play`, `/main`, `/shop`, `/card`).

#### Blueprint T4: `tests/e2e/tier4_realworld_workload.ts`
**Import Replacement**:
```typescript
import {
  readProjectFile,
  projectPathExists,
  runTestAssertion,
  MockLocalStorage,
  setupTestEnvironment,
} from './helpers';
import { TestResult, EXTERNAL_LINKS } from './types';
import { CARD_DATABASE } from '../../src/cardDatabase';
import { normalizeHashRoute } from '../../src/landing/services/hashRouter';
import { IdleAutoPlayManager } from '../../src/landing/services/idleAutoPlayManager';
import { CardNurtureStore, cardNurtureStore } from '../../src/landing/services/cardNurtureStore';
import {
  executeShopPurchase,
  exchangeGoldForSns,
  getUserCoins,
  setUserCoins,
  getUserGold,
  setUserGold,
} from '../../src/landing/views/ShopSection';
import { getAdPlacements } from '../../src/landing/services/adsenseManager';
```
**Rewiring**:
- `T4.W1.1`: `normalizeHashRoute('') === '#home'`, `new CardNurtureStore().getDeckTP() > 0`.
- `T4.W1.2`: `setupTestEnvironment()`, `IdleAutoPlayManager({ timeoutMs: 15000 })`, three 5s ticks -> redirected to targetUrl, `hero_kadan_rpg_auto_mode` = `'true'`.
- `T4.W1.3`: `setupTestEnvironment()`, `new CardNurtureStore()`, `awardBattleVictoryExp(50)`, `setRepeatHunting(true)`, second victory levels Card 1 to Lv 2.
- `T4.W1.4`: `setupTestEnvironment()`, `new CardNurtureStore()`, `addCard(6)`, `setDeckCard(0, 6)`, `nurtureCard(6, 100)`, `allocateStat(6, 'bottom')`, `saveToStorage()`, reload in new instance, slot 0 is 6 and bonus stat is 1.
- `T4.W1.5`: `const mockStorage = setupTestEnvironment()`, `setUserCoins(50)`, `setUserGold(15000)`, `exchangeGoldForSns(5000)` -> SNS 1050, `executeShopPurchase('pack_magic')` -> dual writes, remaining SNS 250.
- `T4.W1.6`: `setupTestEnvironment()`, `getAdPlacements(1440)` vs `getAdPlacements(375)`, `hero_ad_removed = 'true'`, verified VIP suppression.

#### Blueprint T5: `tests/adversarial_challenger_m4_empirical.ts` (Tautology Fix)
At line 466:
```typescript
// BEFORE:
assert('Rapid Toggle Stress', '1,000 rapid autoMode toggles complete without deadlock', true);

// AFTER:
assert('Rapid Toggle Stress', '1,000 rapid autoMode toggles complete without deadlock', iterationCount === 1000);
```

---

## 5. Verification Method (독립 검증 방법)

After the worker agent applies the refactoring blueprints:

1. **Verify Complete Purge of Reference Doubles**:
   ```bash
   grep -nE "Reference(Hash|Idle|Nurture|Shop|AdSense)" tests/e2e/helpers.ts
   grep -nE "Reference(Hash|Idle|Nurture|Shop|AdSense)" tests/e2e/tier1_feature_coverage.ts
   grep -nE "Reference(Hash|Idle|Nurture|Shop|AdSense)" tests/e2e/tier2_boundary_corner.ts
   grep -nE "Reference(Hash|Idle|Nurture|Shop|AdSense)" tests/e2e/tier3_cross_feature.ts
   grep -nE "Reference(Hash|Idle|Nurture|Shop|AdSense)" tests/e2e/tier4_realworld_workload.ts
   ```
   *Expected Output*: Exactly **0 matches** across all files.

2. **Verify Genuine Production Imports**:
   ```bash
   grep -n "from '../../src/landing/services/cardNurtureStore'" tests/e2e/tier1_feature_coverage.ts
   grep -n "from '../../src/landing/views/ShopSection'" tests/e2e/tier1_feature_coverage.ts
   grep -n "from '../../src/landing/services/adsenseManager'" tests/e2e/tier1_feature_coverage.ts
   grep -n "from '../../src/landing/services/idleAutoPlayManager'" tests/e2e/tier1_feature_coverage.ts
   grep -n "from '../../src/landing/services/hashRouter'" tests/e2e/tier1_feature_coverage.ts
   ```
   *Expected Output*: Real production paths imported in each tier file.

3. **Verify Elimination of Tautological Assertion**:
   ```bash
   sed -n '464,468p' tests/adversarial_challenger_m4_empirical.ts
   ```
   *Expected Output*: Line 466 evaluates empirical condition (`iterationCount === 1000`), NOT literal `true`.

4. **Execute Master Test Suite Against Real Production Code**:
   ```bash
   npx tsx tests/e2e/run_all.ts
   ```
   *Expected Output*:
   - Total Assertions: 76
   - Passed: 76
   - Failed: 0
   - Pass Rate: 100.0%

5. **Execute All Adversarial & Empirical Suites**:
   ```bash
   npx tsx tests/adversarial_m4_card_nurturing.ts
   npx tsx tests/adversarial_m5_shop_adsense.ts
   npx tsx tests/adversarial_challenger_m4_empirical.ts
   ```
   *Expected Output*: 100% pass across all suites.

6. **Verify Build & Bundle Hygiene**:
   ```bash
   npx tsc --noEmit
   npm run build
   wc -c dist/index.html
   ```
   *Expected Output*: Exit code 0, 0 TypeScript errors, bundle size <= 50,000 bytes.
