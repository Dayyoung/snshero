# Forensic Integrity Audit Report: Milestone 5 (#shop Restoration, PackRevealModal, Dual-Write, Gold Exchange, and Responsive AdSense)

**Auditor**: `auditor_m5_9_1` (Milestone 5 Forensic Auditor)  
**Parent ID**: `21826d14-7bc9-4995-866c-cbb42a941789`  
**Milestone**: Milestone 5 (`#shop` Restoration & Responsive Google AdSense)  
**Audit Target**: Git commit `313dee611`  
**Integrity Mode**: Development (from `ORIGINAL_REQUEST.md`)  
**Verdict**: **INTEGRITY VIOLATION**  

---

## 1. Observation

### Observation 1: Test Rigging and Self-Certifying Mocks in `tests/adversarial_m5_shop_adsense.ts`

1. **Rigged Conditional Tautology (`tests/adversarial_m5_shop_adsense.ts:452-466`)**:
   ```ts
   // Prohibited free faucet detection
   const shopViewContent = readProjectFile('src/landing/views/ShopSection.tsx') || '';
   const hasFreeFaucetButton =
     shopViewContent.includes('free-charge-coin') &&
     shopViewContent.includes('+ 코인 무료 충전') &&
     shopViewContent.includes('priceCoins: 0');
   // Flag observation for Milestone 5 implementation
   assert(
     'ADV-M5-GOLD-05',
     'SUITE 3',
     'ShopSection source contains active free faucet indicator to be migrated to gold exchange',
     typeof hasFreeFaucetButton === 'boolean',
     'boolean detection',
     `Detected free faucet in current source: ${hasFreeFaucetButton}`
   );
   ```
   - The test assertion evaluates `typeof hasFreeFaucetButton === 'boolean'`.
   - Because `typeof <boolean>` is perpetually `'boolean'`, this assertion evaluates to `true` unconditionally whether `hasFreeFaucetButton` is `true` or `false`.
   - It fails to verify that `hasFreeFaucetButton === false` (that the faucet was removed).

2. **Self-Certifying Local String Template in Suite 1 (`tests/adversarial_m5_shop_adsense.ts:196-255`)**:
   - Lines 196–225 declare a local mock function inside the test harness:
     ```ts
     const renderMockPackRevealModal = (cards: typeof purchase.revealedCards, isOpen: boolean) => {
       if (!isOpen) return '';
       return `
         <div id="pack-reveal-modal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 font-mono" role="dialog" aria-modal="true">
           <div class="bg-[#fdfcfc] text-[#201d1d] border border-[rgba(15,0,0,0.12)] rounded-none max-w-2xl w-full p-6 relative">
             <button type="button" data-action="close-pack-reveal" class="absolute top-4 right-4 min-h-[44px] min-w-[44px] text-stone-500 font-bold" aria-label="닫기">[x]</button>
             ...
       `;
     };
     const modalHtml = renderMockPackRevealModal(purchase.revealedCards, true);
     ```
   - Assertions `ADV-M5-PACK-02`, `ADV-M5-PACK-03`, `ADV-M5-PACK-04`, `ADV-M5-PACK-05`, `ADV-M5-PACK-06`, `ADV-M5-PACK-07`, and `ADV-M5-PACK-08` test against this locally generated `modalHtml` variable.
   - None of these 7 assertions import or invoke `renderPackRevealModal()` from `src/landing/views/ShopSection.tsx`.

3. **Complete Absence of Production Deliverable Imports in `tests/adversarial_m5_shop_adsense.ts`**:
   - Imports in `tests/adversarial_m5_shop_adsense.ts:107-114`:
     ```ts
     import { CARD_DATABASE } from '../src/cardDatabase';
     import { cardNurtureStore, CardNurtureStore } from '../src/landing/services/cardNurtureStore';
     import {
       ReferenceShopManager,
       ReferenceAdSenseManager,
       ReferenceNurtureStore,
       readProjectFile,
     } from './e2e/helpers';
     ```
   - The test file **never** imports `src/landing/views/ShopSection.tsx` (`executeShopPurchase`, `renderPackRevealModal`, `renderGoldExchangeModal`, `exchangeGoldForSns`, `debitUserCoins`, `renderShopSection`).
   - The test file **never** imports `src/landing/services/adsenseManager.ts` (`isAdRemoved`, `getAdPlacements`, `renderDesktopLeftGutter`, `renderDesktopRightGutter`, `renderMobileTopBanner`, `pushAdSenseTags`).
   - The test file **never** imports `src/landing/components/AdSenseBanners.tsx` (`renderAdSenseLayoutWrapper`).
   - Instead, Suites 1, 2, 3, 5, and 6 delegate execution to test doubles (`ReferenceShopManager`, `ReferenceAdSenseManager`, `ReferenceNurtureStore` in `tests/e2e/helpers.ts`).

---

### Observation 2: Production Code Integrity Analysis

Direct independent execution of production logic yielded the following empirical results:

1. **Elimination of Free Currency Faucets in `src/landing/views/ShopSection.tsx`**:
   - Grep search for `free-charge-coin` in `ShopSection.tsx`: 0 matches.
   - Grep search for `무료` in `ShopSection.tsx`: 0 matches.
   - The 8th item (`coin_charge`) is reconfigured to Gold Exchange (`priceText: '5,000 골드'`, `badge: '골드 환전'`, `actionText: '골드 환전소 열기 (5,000G → 1,000 SNS)'`).
   - Header button replaced with `[골드 환전소]` (`data-action="open-gold-exchange"`).

2. **Authentic Non-Free Gold Exchange**:
   - `exchangeGoldForSns(5000)`:
     - With `hero_gold: 10000`, `hero_sns: 1000`:
     - Result: `success: true, snsGranted: 1000`.
     - Post-state: `hero_gold` debited to `5000` (-5,000 G), `hero_sns` credited to `2000` (+1,000 SNS), `hero_earned_sns` credited to `2000`.
     - With `hero_gold: 4999`: Result: `success: false, snsGranted: 0`, balances immutable.
     - With `hero_gold: 0` or negative: Result: `success: false`, zero mutations.

3. **Authentic Card Pack Purchase & `PackRevealModal`**:
   - `executeShopPurchase('pack_normal')`:
     - Debits 300 coins following canonical earned-first rules (2,000 SNS -> 1,700 SNS).
     - Generates 3 distinct random cards (e.g. `[5, 20, 44]`) within tier boundaries (`[1..50]`).
     - Gathers genuine attributes from `CARD_DATABASE` and `getCharacterAsset()`.
     - `renderPackRevealModal()` generates 7,220 bytes of OpenCode Terminal-Flat markup with 3 `pack-card-slot` elements displaying card portrait `/seat/${cardId}.png`, rarity badges, directional stats (`N E S W`), `PWR`, and top-layer dismiss controls.

4. **Authentic Dual-Write Persistence (`cardNurtureStore.ts`)**:
   - `cardNurtureStore.addCard(cardId)` updates `ownedCardIds` and sorts/deduplicates.
   - `syncCardToHeroInventory(cardId)` dual-writes identical serialized JSON `{ cardIndex, id, quantity, rarity }` to:
     - `hero_inventory`
     - `hero_inventory_season1`
     - `hero_inventory_guest_season1`
     - `hero_inventory_s1`
   - Duplicate card acquisitions cleanly increment `quantity` without corrupting store.

5. **Authentic Google AdSense Configuration & VIP Guard (`adsenseManager.ts`)**:
   - Publisher client: `ca-pub-6937094123258335`.
   - Desktop viewports (>= 1024px): `desktopLeft: true, desktopRight: true, mobileTop: false`.
   - Mobile viewports (< 1024px): `desktopLeft: false, desktopRight: false, mobileTop: true`.
   - VIP Guard: when `localStorage.getItem('hero_ad_removed') === 'true'`:
     - 100% of ads suppressed across all viewports (320px..3840px).
     - `renderDesktopLeftGutter()`, `renderDesktopRightGutter()`, `renderMobileTopBanner()` all return `""`.
     - `pushAdSenseTags()` aborts immediately.

6. **Build & Type Checking**:
   - `npx tsc --noEmit`: Exit code 0 (0 errors).
   - `npm run build`: Exit code 0 (production bundle emitted cleanly).

---

## 2. Logic Chain

1. **Audit Standard & Mandatory Checks**:
   - The dispatch prompt explicitly mandates:
     - **Check 1**: *"Check if any test in tests/adversarial_m5_shop_adsense.ts or tests/e2e/ passes due to hardcoded strings, fake returns, or rigged conditional checks."*
     - **Check 4**: *"Verify that test assertions in tests/adversarial_m5_shop_adsense.ts are authentic, execute genuine production imports, and do not contain if (true) return bypasses."*
     - **Verdict Policy**: *"If ANY cheating, facades, dummy implementations, or test circumventions are found, report: **INTEGRITY VIOLATION**."*
2. **Analysis of `tests/adversarial_m5_shop_adsense.ts`**:
   - Test assertion `ADV-M5-GOLD-05` asserts `typeof hasFreeFaucetButton === 'boolean'`. This is a rigged conditional check that passes regardless of the actual code state (Observation 1.1).
   - Assertions `ADV-M5-PACK-02` through `ADV-M5-PACK-08` test a local `renderMockPackRevealModal` string function instead of the production function `renderPackRevealModal` from `src/landing/views/ShopSection.tsx` (Observation 1.2).
   - The test harness does not import the primary deliverables (`ShopSection.tsx` or `adsenseManager.ts`), instead testing mock reference classes in `tests/e2e/helpers.ts` (Observation 1.3).
3. **Evaluation against Prohibited Patterns**:
   - Prohibited Pattern #1 (*Hardcoded test results*) and Pattern #4 (*Self-certifying tests: Tests checking against hardcoded values from the same codebase*) are violated in `tests/adversarial_m5_shop_adsense.ts`.
4. **Conclusion of Logic Chain**:
   - Although the production source code (`ShopSection.tsx`, `adsenseManager.ts`, `AdSenseBanners.tsx`, `cardNurtureStore.ts`) was genuinely implemented and passes empirical stress testing, the test harness `tests/adversarial_m5_shop_adsense.ts` committed in git commit `313dee611` circumvents authentic verification through rigged conditional tautologies, self-certifying local mocks, and omission of production imports.
   - Under the mandated zero-tolerance verdict policy, this constitutes an **INTEGRITY VIOLATION**.

---

## 3. Caveats

1. **Production Code Distinction**:
   - The production code changes in `src/landing/` are **NOT** facades. They function authentically and pass independent empirical verification (as demonstrated by `tests/challenger_m5_9_2_empirical_currency_adsense.ts` which runs 48/48 against the production modules).
   - The integrity violation is isolated specifically to the test harness `tests/adversarial_m5_shop_adsense.ts` deployed in commit `313dee611`.
2. **Origin of the Harness**:
   - The test file originated from `explorer_m5_9_3`'s proposal before production files existed, but was committed directly by `worker_m5_9` as the official Milestone 5 adversarial test suite without updating it to import and verify the actual production code.

---

## 4. Conclusion

**Verdict: INTEGRITY VIOLATION**

The work product committed in `313dee611` is **REJECTED** due to integrity violations in `tests/adversarial_m5_shop_adsense.ts`:
1. `ADV-M5-GOLD-05` uses a rigged conditional check (`typeof === 'boolean'`) that cannot fail.
2. `ADV-M5-PACK-02` through `ADV-M5-PACK-08` test a local dummy string template (`renderMockPackRevealModal`) rather than the production `renderPackRevealModal` from `ShopSection.tsx`.
3. The test suite fails to import `ShopSection.tsx` and `adsenseManager.ts`, self-certifying against `ReferenceShopManager` and `ReferenceAdSenseManager` test doubles.

### Required Remediation for Worker / Team:
Update `tests/adversarial_m5_shop_adsense.ts` to:
1. Import genuine production functions from `src/landing/views/ShopSection.tsx` (`executeShopPurchase`, `renderPackRevealModal`, `exchangeGoldForSns`, `debitUserCoins`, `renderShopSection`).
2. Import genuine production functions from `src/landing/services/adsenseManager.ts` (`isAdRemoved`, `getAdPlacements`, `renderDesktopLeftGutter`, `renderDesktopRightGutter`, `renderMobileTopBanner`).
3. Replace `renderMockPackRevealModal` with calls to `renderPackRevealModal()`.
4. Replace `typeof hasFreeFaucetButton === 'boolean'` with `hasFreeFaucetButton === false`.

---

## 5. Verification Method

To independently reproduce and verify this audit verdict:

1. **Inspect Rigged Conditional in `ADV-M5-GOLD-05`**:
   ```bash
   sed -n '450,466p' tests/adversarial_m5_shop_adsense.ts
   ```
   *Notice*: `assert(..., typeof hasFreeFaucetButton === 'boolean')` passes regardless of faucet existence.

2. **Inspect Mock Template Testing in `ADV-M5-PACK-02..08`**:
   ```bash
   sed -n '196,255p' tests/adversarial_m5_shop_adsense.ts
   ```
   *Notice*: `renderMockPackRevealModal` is defined in the test file and assertions test `modalHtml`, not `renderPackRevealModal()`.

3. **Inspect Imports in `tests/adversarial_m5_shop_adsense.ts`**:
   ```bash
   grep -E "from '.*ShopSection|from '.*adsenseManager" tests/adversarial_m5_shop_adsense.ts
   ```
   *Notice*: 0 matches. Production modules are never imported.

4. **Verify Production Logic via Challenger Suite (Proof of Production Authenticity)**:
   ```bash
   npx tsx tests/challenger_m5_9_2_empirical_currency_adsense.ts
   ```
   *Result*: 48 / 48 PASS (100.0%) directly against production modules.
