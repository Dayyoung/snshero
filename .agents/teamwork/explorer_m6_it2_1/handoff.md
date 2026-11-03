# E2E Helper & Production Import Architecture Report

**Explorer**: `explorer_m6_it2_1` (Milestone 6 Iteration 2 Explorer 1)  
**Parent Conversation ID**: `21826d14-7bc9-4995-866c-cbb42a941789`  
**Working Directory**: `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_m6_it2_1/`  
**Status**: Investigation Complete — Strategy Formulated for Worker  

---

## 1. Observation (직접 관측 사실)

### 1.1 Test Doubles in `tests/e2e/helpers.ts` (Lines 87–576)
Direct inspection of `tests/e2e/helpers.ts` reveals five in-memory test double classes spanning 490 lines:
1. **`ReferenceHashRouter`** (Lines 88–125):
   ```typescript
   export class ReferenceHashRouter {
     normalizeHashRoute(rawHashOrPath: string): HashRoute { ... }
     isLegacyRoute(route: string): boolean { ... }
     getLegacyRedirect(route: string): HashRoute | null { ... }
   }
   ```
2. **`ReferenceIdleAutoPlayManager`** (Lines 128–180):
   ```typescript
   export class ReferenceIdleAutoPlayManager {
     private currentIdleMs: number = 0;
     private isAutoPlayActive: boolean = false;
     resetTimer(): void { ... }
     handleUserInteraction(): void { ... }
     tick(deltaMs: number): { redirected: boolean; targetUrl?: string; autoModeSet: boolean } { ... }
     getIdleTime(): number { ... }
     isTriggered(): boolean { ... }
   }
   ```
3. **`ReferenceNurtureStore`** (Lines 183–388):
   ```typescript
   export class ReferenceNurtureStore implements NurtureState {
     cards: Record<number, CardNurtureData> = {};
     ownedCardIds: number[] = [1, 2, 3, 4, 5];
     activeDeckIds: number[] = [1, 2, 3, 4, 5];
     getDeckTP(): number { ... }
     getTotalTP(): number { ... }
     setDeckCard(slotIndex: number, cardId: number): boolean { ... }
     nurtureCard(cardId: number, expGain: number): { ... } { ... }
     awardBattleVictoryExp(expGain: number): { ... } { ... }
     setRepeatHunting(enabled: boolean): void { ... }
     isRepeatHuntingActive(): boolean { ... }
     allocateStat(cardId: number, direction: string): boolean { ... }
     hasUnspentPoints(cardId: number): boolean { ... }
     addCard(cardId: number): boolean { ... }
     saveToStorage(): void { ... }
     loadFromStorage(): void { ... }
   }
   ```
4. **`ReferenceShopManager`** (Lines 390–531):
   ```typescript
   export class ReferenceShopManager {
     getBalances(): CurrencyBalanceState { ... }
     purchaseCardPack(packTier: 'normal' | 'magic' | 'rare'): { ... } { ... }
     exchangeGoldForSns(goldAmount: number): { ... } { ... }
   }
   ```
5. **`ReferenceAdSenseManager`** (Lines 533–576):
   ```typescript
   export class ReferenceAdSenseManager {
     isAdRemoved(): boolean { ... }
     getPlacements(viewportWidth: number): AdSensePlacementResult { ... }
   }
   ```

### 1.2 Usage Across Master E2E Tiers
- `tests/e2e/tier1_feature_coverage.ts`: Imports and instantiates `ReferenceHashRouter`, `ReferenceIdleAutoPlayManager`, `ReferenceNurtureStore`, `ReferenceShopManager`, `ReferenceAdSenseManager` across 19 assertion test blocks.
- `tests/e2e/tier2_boundary_corner.ts`: Imports and instantiates `ReferenceHashRouter`, `ReferenceIdleAutoPlayManager`, `ReferenceNurtureStore`, `ReferenceShopManager`, `ReferenceAdSenseManager` across 11 assertion test blocks.
- `tests/e2e/tier3_cross_feature.ts`: Imports and instantiates all 5 reference classes across 7 cross-feature test blocks.
- `tests/e2e/tier4_realworld_workload.ts`: Imports and instantiates all 5 reference classes across 6 workload journey blocks.

### 1.3 State of Genuine Production Deliverables in `src/landing/`
1. **`src/landing/services/cardNurtureStore.ts`**:
   - Genuine `CardNurtureStore` class and `cardNurtureStore` singleton exist.
   - Implements all methods: `getDeckTP()`, `getTotalTP()`, `isCardOwned(id)`, `setDeckCard(slot, id)`, `nurtureCard(id, exp)`, `awardBattleVictoryExp(exp)`, `setRepeatHunting(bool)`, `isRepeatHuntingActive()`, `allocateStat(id, dir)`, `hasUnspentPoints(id)`, `addCard(id)`, `saveToStorage()`, `loadFromStorage()`.
   - Uses `localStorage` directly from the runtime environment.
2. **`src/landing/views/ShopSection.tsx`**:
   - Contains genuine production functions: `executeShopPurchase(itemId)`, `exchangeGoldForSns(goldAmount)`, `getUserCoins()`, `setUserCoins()`, `getUserGold()`, `setUserGold()`, `debitUserCoins()`, `creditUserCoins()`, `renderPackRevealModal()`, `closePackRevealModal()`, `getActiveRevealPack()`, `isGoldExchangeModalOpen()`.
3. **`src/landing/services/adsenseManager.ts`**:
   - Contains genuine production functions: `getAdPlacements(viewportWidth)`, `isAdRemoved()`, `renderDesktopLeftGutter()`, `renderDesktopRightGutter()`, `renderMobileTopBanner()`, `ADSENSE_CONFIG`.
4. **`src/landing/services/idleAutoPlayManager.ts`**:
   - Genuine `IdleAutoPlayManager` class and `idleAutoPlayManager` singleton exist.
   - Monitors 8 browser input events (`MONITORED_INPUT_EVENTS`), manages timers, updates `hero_kadan_rpg_auto_mode`, and executes redirects.
5. **`src/landing/index.ts`**:
   - Contains router engine: `parseRoute(hashString?, pathnameString?)`, `HASH_VIEW_MAP`, `LEGACY_PATH_MAP`, `VALID_VIEWS`.

### 1.4 Tautological Assertion in `tests/adversarial_challenger_m4_empirical.ts`
- Line 466:
  ```typescript
  assert('Rapid Toggle Stress', '1,000 rapid autoMode toggles complete without deadlock', true);
  ```
  Passes hardcoded literal `true` regardless of whether the loop executed or deadlocked.

---

## 2. Logic Chain (추론 사슬)

1. **Premise 1**: The Forensic Integrity Auditor (`auditor_m6_master`) issued an `INTEGRITY VIOLATION` verdict because `tests/e2e/helpers.ts` contains duplicate in-memory reference classes that shield production code from being tested by `tests/e2e/run_all.ts`.
2. **Premise 2**: To satisfy Check 1 of the forensic audit, `tests/e2e/helpers.ts` must contain **0 reference classes** (`class Reference*`), and the test suites must directly exercise genuine modules in `src/landing/`.
3. **Premise 3**: Inspection of `src/landing/` shows that genuine production implementations already match the interface contracts in `PROJECT.md`. Specifically:
   - `cardNurtureStore.ts` and `adsenseManager.ts` already expose 100% of the methods tested in the suites.
   - `ShopSection.tsx` exposes `executeShopPurchase` and `exchangeGoldForSns`; adding convenient production alias `purchaseCardPack(tier)` and `getShopBalances()` guarantees seamless compatibility.
   - `idleAutoPlayManager.ts` is designed for browser timers; adding deterministic `tick(deltaMs)`, `getIdleTime()`, and `handleUserInteraction()` enables headless Node/CLI testing directly on the production class.
   - `src/landing/index.ts` contains routing tables `HASH_VIEW_MAP` and `LEGACY_PATH_MAP`; exporting `normalizeHashRoute(raw)` and `getLegacyRedirect(route)` provides canonical router methods for both app and tests.
4. **Premise 4**: In `tests/e2e/helpers.ts`, deleting lines 87–576 and replacing them with genuine re-exports from `../../src/landing/` establishes `helpers.ts` as a clean import bridge. Test files (`tier1` through `tier4`) can then import production classes and functions directly.
5. **Premise 5**: In `tests/adversarial_challenger_m4_empirical.ts:466`, tracking `toggleCount` in the 1,000-iteration loop and verifying `toggleCount === 1000 && !toggleDeadlock` replaces the literal `true` tautology with an empirical check.

---

## 3. Caveats

- **Read-Only Scope**: This report provides the architectural design, method mappings, and code diffs. Implementation must be carried out by the worker agent.
- **Headless Node Environment**: In Node/tsx (used by `tests/e2e/run_all.ts`), browser globals (`localStorage`, `window`, `document`) do not exist natively. `tests/e2e/helpers.ts` must initialize mock storage and browser stub globals at the module level (identical to `tests/adversarial_m4_card_nurturing.ts` and `tests/adversarial_m5_shop_adsense.ts`) before loading production modules.

---

## 4. Conclusion & Actionable Implementation Strategy

### 4.1 Method-by-Method Mapping Table

| # | Reference Class & Method | Genuine Production Counterpart | File Location | Status & Action |
|---|---|---|---|---|
| **1** | `ReferenceHashRouter.normalizeHashRoute(raw)` | `normalizeHashRoute(rawHashOrPath: string): string` | `src/landing/index.ts` | **Add to `src/landing/index.ts`** using `parseRoute` / `HASH_VIEW_MAP` / `LEGACY_PATH_MAP`. |
| **2** | `ReferenceHashRouter.getLegacyRedirect(route)` | `getLegacyRedirect(route: string): string \| null` | `src/landing/index.ts` | **Add to `src/landing/index.ts`** resolving `LEGACY_PATH_MAP`. |
| **3** | `ReferenceHashRouter.isLegacyRoute(route)` | `isLegacyRoute(route: string): boolean` | `src/landing/index.ts` | **Add to `src/landing/index.ts`** checking `getLegacyRedirect(route) !== null`. |
| **4** | `ReferenceIdleAutoPlayManager.tick(deltaMs)` | `IdleAutoPlayManager.prototype.tick(deltaMs: number)` | `src/landing/services/idleAutoPlayManager.ts` | **Add to `IdleAutoPlayManager`** to advance simulated time and trigger transition. |
| **5** | `ReferenceIdleAutoPlayManager.handleUserInteraction()` | `IdleAutoPlayManager.prototype.handleUserInteraction()` | `src/landing/services/idleAutoPlayManager.ts` | **Add to `IdleAutoPlayManager`** (resets simulated idle timer). |
| **6** | `ReferenceIdleAutoPlayManager.getIdleTime()` | `IdleAutoPlayManager.prototype.getIdleTime(): number` | `src/landing/services/idleAutoPlayManager.ts` | **Add to `IdleAutoPlayManager`** returning elapsed idle ms. |
| **7** | `ReferenceIdleAutoPlayManager.isTriggered()` | `IdleAutoPlayManager.prototype.isTriggered(): boolean` | `src/landing/services/idleAutoPlayManager.ts` | **Add to `IdleAutoPlayManager`** checking auto-mode flag. |
| **8** | `ReferenceNurtureStore.getDeckTP()` | `CardNurtureStore.prototype.getDeckTP(): number` | `src/landing/services/cardNurtureStore.ts` | **Exact Match** — already exists in production. |
| **9** | `ReferenceNurtureStore.getTotalTP()` | `CardNurtureStore.prototype.getTotalTP(): number` | `src/landing/services/cardNurtureStore.ts` | **Exact Match** — already exists in production. |
| **10** | `ReferenceNurtureStore.isCardOwned(cardId)` | `CardNurtureStore.prototype.isCardOwned(cardId): boolean` | `src/landing/services/cardNurtureStore.ts` | **Exact Match** — already exists in production. |
| **11** | `ReferenceNurtureStore.setDeckCard(slot, id)` | `CardNurtureStore.prototype.setDeckCard(slot, id): boolean` | `src/landing/services/cardNurtureStore.ts` | **Exact Match** — already exists in production. |
| **12** | `ReferenceNurtureStore.nurtureCard(id, exp)` | `CardNurtureStore.prototype.nurtureCard(id, exp)` | `src/landing/services/cardNurtureStore.ts` | **Exact Match** — already exists in production. |
| **13** | `ReferenceNurtureStore.awardBattleVictoryExp(exp)` | `CardNurtureStore.prototype.awardBattleVictoryExp(exp)` | `src/landing/services/cardNurtureStore.ts` | **Exact Match** — already exists in production. |
| **14** | `ReferenceNurtureStore.setRepeatHunting(enabled)` | `CardNurtureStore.prototype.setRepeatHunting(enabled)` | `src/landing/services/cardNurtureStore.ts` | **Exact Match** — already exists in production. |
| **15** | `ReferenceNurtureStore.isRepeatHuntingActive()` | `CardNurtureStore.prototype.isRepeatHuntingActive()` | `src/landing/services/cardNurtureStore.ts` | **Exact Match** — already exists in production. |
| **16** | `ReferenceNurtureStore.allocateStat(id, dir)` | `CardNurtureStore.prototype.allocateStat(id, dir)` | `src/landing/services/cardNurtureStore.ts` | **Exact Match** — already exists in production. |
| **17** | `ReferenceNurtureStore.hasUnspentPoints(id)` | `CardNurtureStore.prototype.hasUnspentPoints(id)` | `src/landing/services/cardNurtureStore.ts` | **Exact Match** — already exists in production. |
| **18** | `ReferenceNurtureStore.addCard(id)` | `CardNurtureStore.prototype.addCard(id): boolean` | `src/landing/services/cardNurtureStore.ts` | **Exact Match** — already exists in production. |
| **19** | `ReferenceNurtureStore.saveToStorage()` | `CardNurtureStore.prototype.saveToStorage(): void` | `src/landing/services/cardNurtureStore.ts` | **Exact Match** — already exists in production. |
| **20** | `ReferenceNurtureStore.loadFromStorage()` | `CardNurtureStore.prototype.loadFromStorage(): void` | `src/landing/services/cardNurtureStore.ts` | **Exact Match** — already exists in production. |
| **21** | `ReferenceShopManager.purchaseCardPack(tier)` | `purchaseCardPack(tier: 'normal' \| 'magic' \| 'rare')` | `src/landing/views/ShopSection.tsx` | **Add alias to `ShopSection.tsx`** delegating to `executeShopPurchase(`pack_${tier}`)`. |
| **22** | `ReferenceShopManager.exchangeGoldForSns(gold)` | `exchangeGoldForSns(goldAmount: number)` | `src/landing/views/ShopSection.tsx` | **Exact Match** — already exists in production. |
| **23** | `ReferenceShopManager.getBalances()` | `getShopBalances(): CurrencyBalanceState` | `src/landing/views/ShopSection.tsx` | **Add to `ShopSection.tsx`** returning `{ sns, earnedSns, purchasedSns, gold }`. |
| **24** | `ReferenceAdSenseManager.getPlacements(w)` | `getAdPlacements(viewportWidth?: number)` | `src/landing/services/adsenseManager.ts` | **Exact Match** — already exists in production. |
| **25** | `ReferenceAdSenseManager.isAdRemoved()` | `isAdRemoved(): boolean` | `src/landing/services/adsenseManager.ts` | **Exact Match** — already exists in production. |

---

### 4.2 Concrete Code Replacements / Diffs for Worker

#### Step 1: Add Production Router Helpers to `src/landing/index.ts`
```typescript
/**
 * Normalizes any raw hash string, route path, or legacy route into a canonical HashRoute.
 */
export function normalizeHashRoute(rawHashOrPath: string): string {
  if (!rawHashOrPath) return '#home';
  const clean = rawHashOrPath.split('?')[0].trim();
  if (clean.startsWith('#')) {
    const key = clean.replace(/^#\/?/, '').replace(/\/$/, '').toLowerCase();
    const view = HASH_VIEW_MAP[key];
    return view ? `#${view}` : '#home';
  }
  const cleanPath = clean.replace(/\/$/, '').toLowerCase();
  const legacyView = LEGACY_PATH_MAP[cleanPath] || (clean.startsWith('/') ? LEGACY_PATH_MAP[clean] : undefined);
  if (legacyView) {
    return `#${legacyView}`;
  }
  const view = HASH_VIEW_MAP[clean.toLowerCase()];
  if (view) {
    return `#${view}`;
  }
  return '#home';
}

export function getLegacyRedirect(route: string): string | null {
  const clean = (route || '').split('?')[0].trim().replace(/\/$/, '').toLowerCase();
  const view = LEGACY_PATH_MAP[clean];
  return view ? `#${view}` : null;
}

export function isLegacyRoute(route: string): boolean {
  return getLegacyRedirect(route) !== null;
}
```

#### Step 2: Add Simulation Methods to `src/landing/services/idleAutoPlayManager.ts`
Inside `IdleAutoPlayManager` class:
```typescript
  private simulatedElapsedMs: number = 0;

  public tick(deltaMs: number): { redirected: boolean; targetUrl?: string; autoModeSet: boolean } {
    if (!this.lastActivityTime) this.lastActivityTime = Date.now();
    this.simulatedElapsedMs += deltaMs;
    const isTriggered = this.simulatedElapsedMs >= this.timeoutMs;
    if (isTriggered) {
      this.executeIdleTransition();
      return {
        redirected: true,
        targetUrl: this.targetUrl,
        autoModeSet: typeof localStorage !== 'undefined' && localStorage.getItem('hero_kadan_rpg_auto_mode') === 'true',
      };
    }
    return {
      redirected: false,
      autoModeSet: typeof localStorage !== 'undefined' && localStorage.getItem('hero_kadan_rpg_auto_mode') === 'true',
    };
  }

  public handleUserInteraction(): void {
    this.simulatedElapsedMs = 0;
    this.resetTimer();
  }

  public getIdleTime(): number {
    return this.simulatedElapsedMs;
  }

  public isTriggered(): boolean {
    return this.simulatedElapsedMs >= this.timeoutMs;
  }
```

#### Step 3: Add Pack Purchase & Balances Helper to `src/landing/views/ShopSection.tsx`
```typescript
export function purchaseCardPack(packTier: 'normal' | 'magic' | 'rare'): {
  success: boolean;
  revealedCards: RevealedCardMeta[];
  deductedSns: number;
  error?: string;
} {
  const prices: Record<string, number> = { normal: 300, magic: 800, rare: 1500 };
  const price = prices[packTier] || 300;
  const res = executeShopPurchase(`pack_${packTier}`);
  return {
    success: res.success,
    revealedCards: res.revealedCards || [],
    deductedSns: res.success ? price : 0,
    error: res.error,
  };
}

export function getShopBalances(): {
  sns: number;
  earnedSns: number;
  purchasedSns: number;
  gold: number;
} {
  return {
    sns: getUserCoins(),
    earnedSns: typeof localStorage !== 'undefined' ? parseInt(localStorage.getItem('hero_earned_sns') || '0', 10) : 0,
    purchasedSns: typeof localStorage !== 'undefined' ? parseInt(localStorage.getItem('hero_purchased_sns') || '0', 10) : 0,
    gold: getUserGold(),
  };
}
```

#### Step 4: Purge Test Doubles & Re-Export Production in `tests/e2e/helpers.ts`
Replace lines 87–576 of `tests/e2e/helpers.ts` with:
```typescript
// ============================================================================
// Headless In-Memory Browser Environment Setup
// ============================================================================

if (typeof globalThis.localStorage === 'undefined') {
  (globalThis as any).localStorage = new MockLocalStorage();
}

if (typeof (globalThis as any).window === 'undefined') {
  (globalThis as any).window = {
    location: { hash: '#home', pathname: '/', origin: 'http://localhost', href: 'http://localhost/#home' },
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
    querySelectorAll: () => [],
    getElementById: () => null,
  };
}

// ============================================================================
// Genuine Production Deliverable Re-Exports (Zero Test Doubles)
// ============================================================================

export {
  normalizeHashRoute,
  getLegacyRedirect,
  isLegacyRoute,
  parseRoute,
  HASH_VIEW_MAP,
  LEGACY_PATH_MAP,
  VALID_VIEWS,
} from '../../src/landing/index';

export {
  IdleAutoPlayManager,
  idleAutoPlayManager,
  initIdleAutoPlay,
} from '../../src/landing/services/idleAutoPlayManager';

export {
  CardNurtureStore,
  cardNurtureStore,
} from '../../src/landing/services/cardNurtureStore';

export {
  purchaseCardPack,
  executeShopPurchase,
  exchangeGoldForSns,
  getShopBalances,
  getUserCoins,
  setUserCoins,
  getUserGold,
  setUserGold,
  debitUserCoins,
  creditUserCoins,
  renderPackRevealModal,
  closePackRevealModal,
  getActiveRevealPack,
  isGoldExchangeModalOpen,
} from '../../src/landing/views/ShopSection';

export {
  getAdPlacements,
  isAdRemoved,
  renderDesktopLeftGutter,
  renderDesktopRightGutter,
  renderMobileTopBanner,
  ADSENSE_CONFIG,
} from '../../src/landing/services/adsenseManager';
```

#### Step 5: Rewire All 4 Tiers (`tier1`..`tier4`)
In `tests/e2e/tier1_feature_coverage.ts`, `tier2_boundary_corner.ts`, `tier3_cross_feature.ts`, and `tier4_realworld_workload.ts`:
- Change imports:
  ```typescript
  import {
    readProjectFile,
    projectPathExists,
    parseHtml,
    runTestAssertion,
    MockLocalStorage,
    normalizeHashRoute,
    getLegacyRedirect,
    isLegacyRoute,
    IdleAutoPlayManager,
    CardNurtureStore,
    cardNurtureStore,
    purchaseCardPack,
    exchangeGoldForSns,
    getShopBalances,
    getAdPlacements,
    isAdRemoved,
  } from './helpers';
  ```
- Replace calls:
  - `const router = new ReferenceHashRouter(); router.normalizeHashRoute(...)` -> `normalizeHashRoute(...)`
  - `router.getLegacyRedirect(...)` -> `getLegacyRedirect(...)`
  - `new ReferenceIdleAutoPlayManager(mockStorage, ...)` -> `new IdleAutoPlayManager({ timeoutMs: ... })`
  - `new ReferenceNurtureStore(mockStorage)` -> `new CardNurtureStore()` (with `(globalThis as any).localStorage = mockStorage`)
  - `new ReferenceShopManager(...)` -> use direct functions `purchaseCardPack(...)`, `exchangeGoldForSns(...)`, `getShopBalances()`
  - `new ReferenceAdSenseManager(mockStorage)` -> use `getAdPlacements(viewportWidth)`

#### Step 6: Fix Tautological Assertion in `tests/adversarial_challenger_m4_empirical.ts`
At line 440:
```typescript
let toggleCount = 0;
for (let i = 0; i < 1000; i++) {
  activeMode = !activeMode;
  ...
  toggleCount++;
}
...
// Line 466:
assert('Rapid Toggle Stress', '1,000 rapid autoMode toggles complete without deadlock', toggleCount === 1000 && !toggleDeadlock);
```

---

## 5. Verification Method (독립 검증 방법)

After the worker applies the architectural fix:

1. **Verify 0 Test Double Declarations in `tests/e2e/helpers.ts`**:
   ```bash
   grep -nE "class Reference(Hash|Idle|Nurture|Shop|AdSense)" tests/e2e/helpers.ts
   ```
   *Expected Result*: Empty output (0 matches).

2. **Verify 0 Reference Usages across All 4 Tiers**:
   ```bash
   grep -nE "Reference(Hash|Idle|Nurture|Shop|AdSense)" tests/e2e/tier1_feature_coverage.ts tests/e2e/tier2_boundary_corner.ts tests/e2e/tier3_cross_feature.ts tests/e2e/tier4_realworld_workload.ts
   ```
   *Expected Result*: Empty output (0 matches).

3. **Verify 0 Tautological Assertions in Challenger Suite**:
   ```bash
   sed -n '464,468p' tests/adversarial_challenger_m4_empirical.ts
   ```
   *Expected Result*: Shows `toggleCount === 1000 && !toggleDeadlock`, literal `true` is gone.

4. **Run Master E2E Suite Against Genuine Production**:
   ```bash
   npx tsx tests/e2e/run_all.ts
   ```
   *Expected Result*: 76/76 PASS (Exit code 0).

5. **Run Empirical Challenger Suite**:
   ```bash
   npx tsx tests/adversarial_challenger_m4_empirical.ts
   ```
   *Expected Result*: All assertions PASS (Exit code 0).

6. **Verify Build and TypeScript Integrity**:
   ```bash
   npx tsc --noEmit
   npm run build
   ```
   *Expected Result*: 0 errors, build succeeds.
