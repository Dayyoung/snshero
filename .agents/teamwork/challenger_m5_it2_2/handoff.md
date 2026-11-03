# Empirical Challenge Report: Milestone 5 Iteration 2 (Currency Debit, Gold Exchange & AdSense VIP Guard)

**Challenger**: `challenger_m5_it2_2` (Milestone 5 Iteration 2 Challenger 2)  
**Parent Conversation ID**: `21826d14-7bc9-4995-866c-cbb42a941789`  
**Working Directory**: `/Users/dayyoung/project/snshero/.agents/teamwork/challenger_m5_it2_2/`  
**Evaluation Scope**: Currency Debit Hierarchy, Non-Free Gold Exchange Invariants, Faucet Elimination, and Responsive AdSense Layout & VIP Guard  
**Verdict**: **APPROVE**  

---

## 1. Observation

### 1.1 Gold Exchange Invariants (`src/landing/views/ShopSection.tsx:314-384`)
- Executing `exchangeGoldForSns(5000)` with `hero_gold: 10000` and `hero_sns: 1000`:
  - Returns `{ success: true, snsGranted: 1000, message: "5,000 골드를 1,000 SNS 코인으로 환전하였습니다!" }`.
  - Exactly 5,000 Gold is debited (`hero_gold` becomes `5000`).
  - Exactly 1,000 SNS is credited to both `hero_sns` (becomes `2000`) and `hero_earned_sns` (becomes `2000`).
- Insufficient Gold Boundary:
  - At `hero_gold: 4999` (1 Gold below requirement): `exchangeGoldForSns(5000)` returns `{ success: false, snsGranted: 0, error: "보유 골드가 부족합니다." }`.
  - Zero balance leakage: `hero_gold` remains `4999`, and `hero_sns` remains `2000`.
  - At `hero_gold: 0`, `goldAmount: 0`, and negative amounts (`-5000`): execution returns `success: false` and `snsGranted: 0` without balance mutation.
- High-Volume Conservation:
  - 100 consecutive exchanges of 5,000 Gold (total 500,000 Gold) cleanly yielded 100,000 SNS with `hero_gold` reaching 0 and zero balance deviation.
- Execution via Shop Item:
  - `executeShopPurchase('coin_charge')` triggers `exchangeGoldForSns(5000)` and syncs `hero_gold` and `hero_sns`.

### 1.2 Earned-First Currency Debit Hierarchy (`src/landing/views/ShopSection.tsx:242-275`)
- When `hero_earned_sns` >= cost:
  - Starting with `earned: 1000`, `purchased: 500`, `total: 1500`, cost `400`:
  - `debitUserCoins(400)` returns `true`.
  - Post-state: `hero_earned_sns = 600`, `hero_purchased_sns = 500`, `hero_sns = 1100`.
- When `hero_earned_sns` < cost (split debit):
  - Starting with `earned: 300`, `purchased: 500`, `total: 800`, cost `400`:
  - `debitUserCoins(400)` returns `true`.
  - Post-state: `hero_earned_sns = 0`, `hero_purchased_sns = 400`, `hero_sns = 400`.
- When `hero_earned_sns` == 0:
  - Starting with `earned: 0`, `purchased: 400`, `total: 400`, cost `250`:
  - `debitUserCoins(250)` returns `true`.
  - Post-state: `hero_earned_sns = 0`, `hero_purchased_sns = 150`, `hero_sns = 150`.
- When total balance < cost:
  - Starting with `earned: 50`, `purchased: 50`, `total: 100`, cost `300`:
  - `debitUserCoins(300)` returns `false`.
  - Post-state: balances remain untouched (`earned: 50`, `purchased: 50`, `total: 100`) with zero leakage.
- Seasonal key synchronization:
  - `hero_sns_season1` and active season keys (`hero_sns_${season}`) are updated synchronously with `hero_sns`.

### 1.3 Zero Free Faucets Verification
- Full text scan across all 9 landing source files (`ShopSection.tsx`, `index.ts`, `Header.tsx`, `Sidebar.tsx`, `Modals.tsx`, `HomeSection.tsx`, `CardSection.tsx`, `PlaySection.tsx`, `MyDeckSection.tsx`) yielded **0 matches** for:
  - `free-charge-coin`
  - `+ 코인 무료 충전`
  - `무료 충전`
- `SHOP_ITEMS` defines exactly 8 items:
  1. `pack_normal`: 300 SNS
  2. `pack_magic`: 800 SNS
  3. `pack_rare`: 1500 SNS
  4. `item_pack`: 500 SNS
  5. `ad_remove`: 1000 SNS
  6. `official_novel`: 100 SNS
  7. `official_movie`: 200 SNS
  8. `coin_charge`: `priceCoins: 0`, `priceText: '5,000 골드'`, `badge: '골드 환전'`, action: `골드 환전소 열기 (5,000G → 1,000 SNS)`.
- All other 7 items have `priceCoins > 0`. There are zero free currency faucets in the codebase.

### 1.4 Responsive AdSense & VIP Guard (`adsenseManager.ts`, `AdSenseBanners.tsx`)
- Viewport Breakpoints (`breakpointPx: 1024`):
  - Viewports < 1024px (tested at 320px, 375px, 768px, 1023px):
    - `getAdPlacements(width)`: `{ desktopLeft: false, desktopRight: false, mobileTop: true, suppressedByVip: false }`.
  - Viewports >= 1024px (tested at 1024px, 1280px, 1440px, 1920px, 2560px, 3840px):
    - `getAdPlacements(width)`: `{ desktopLeft: true, desktopRight: true, mobileTop: false, suppressedByVip: false }`.
- CSS Class Compliance:
  - Desktop left gutter (`renderDesktopLeftGutter`): `<aside id="adsense-desktop-left" class="... hidden lg:flex ...">`.
  - Desktop right gutter (`renderDesktopRightGutter`): `<aside id="adsense-desktop-right" class="... hidden lg:flex ...">`.
  - Mobile top banner (`renderMobileTopBanner`): `<div id="adsense-mobile-top" class="... block lg:hidden ...">`.
  - Configuration: publisher ID `ca-pub-6937094123258335`, slots `1000000001`, `1000000002`, `1000000003`.
- VIP Ad-Removal Guard (`hero_ad_removed === 'true'`):
  - `isAdRemoved()` returns `true`.
  - `renderDesktopLeftGutter()`, `renderDesktopRightGutter()`, `renderMobileTopBanner()` return `""` (empty strings).
  - `renderAdSenseLayoutWrapper()` emits zero ad elements, zero `adsense-*` IDs, and zero `adsbygoogle` attributes.
  - `getAdPlacements()` returns `suppressedByVip: true` with all placement flags `false` across all viewports.
  - `pushAdSenseTags()` safely aborts without pushing to `window.adsbygoogle`.
  - Purchasing `ad_remove` (1,000 SNS) sets `hero_ad_removed = 'true'` in LocalStorage and immediately suppresses ads.
  - Non-true values (`'false'`, `'0'`, `null`) do NOT suppress ads.

### 1.5 Remediated Test Suite Verification (`tests/adversarial_m5_shop_adsense.ts`)
- The remediated adversarial harness was executed directly:
  - All mock doubles (`ReferenceShopManager`, `ReferenceAdSenseManager`, `ReferenceNurtureStore`) and mock template generators (`renderMockPackRevealModal`) have been completely purged (0 occurrences).
  - Imports genuine functions from `src/landing/views/ShopSection.tsx` and `src/landing/services/adsenseManager.ts`.
  - `ADV-M5-GOLD-05` strictly checks `hasFreeFaucetButton === false`.
  - Result: 38 / 38 PASS (100.0%).

### 1.6 Full Test Suite Results
1. `npx tsx tests/adversarial_m5_it2_2_empirical_stress.ts`: **47 / 47 PASS (100.0%)**
2. `npx tsx tests/challenger_m5_9_2_empirical_currency_adsense.ts`: **48 / 48 PASS (100.0%)**
3. `npx tsx tests/adversarial_m5_shop_adsense.ts`: **38 / 38 PASS (100.0%)**
4. `npx tsx tests/challenger_m5_9_1_empirical_invariants.ts`: **37 / 37 PASS (100.0%)**
5. `npx tsx tests/e2e/run_all.ts` (Tiers 1–4): **76 / 76 PASS (100.0%)**
6. `npx tsc --noEmit && npm run build`: **Exit code 0 (Clean Build, 0 Errors)**

---

## 2. Logic Chain

1. **Premise 1**: The Forensic Auditor (`auditor_m5_9_1`) rejected commit `313dee611` due to test rigging (`typeof === 'boolean'`), local mock string verification (`renderMockPackRevealModal`), and missing production imports in `tests/adversarial_m5_shop_adsense.ts`.
2. **Premise 2**: Remediation Worker (`worker_m5_it2`) committed `217f21798` and `875290f01` to replace test doubles with genuine production imports, eliminate local mock functions, and assert `hasFreeFaucetButton === false`.
3. **Premise 3**: Independent execution of `tests/adversarial_m5_shop_adsense.ts` confirms 38 / 38 assertions pass directly against `ShopSection.tsx` and `adsenseManager.ts` without test doubles or tautologies (Observation 1.5).
4. **Premise 4**: An independent adversarial stress test harness (`tests/adversarial_m5_it2_2_empirical_stress.ts`) was authored and executed, verifying all boundary conditions for Gold exchange (5,000G -> 1,000 SNS, 4,999G rejection, zero balance loss), earned-first debit order, zero free faucets, and responsive AdSense breakpoints (1024px) with VIP suppression (Observation 1.1–1.4).
5. **Premise 5**: Regression testing across `run_all.ts` (76 assertions) and prior challenger suites passed 100%, and production type checking and compilation completed with exit code 0 (Observation 1.6).
6. **Conclusion**: All Milestone 5 deliverables satisfy contract requirements, maintain strict data integrity, and pass empirical adversarial challenge. The implementation is fully verified and ready for approval.

---

## 3. Caveats

- **No caveats.** All currency exchange, debit ordering, faucet elimination, and responsive AdSense invariants were empirically tested against production source code and verified across multiple viewports and adversarial edge cases.

---

## 4. Conclusion

**Verdict: APPROVE**

The Milestone 5 Iteration 2 deliverables are fully approved:
1. `exchangeGoldForSns` functions authentically: debits exactly 5,000 Gold to credit 1,000 SNS (and `hero_earned_sns`), and rejects any gold balance < 5,000 with zero balance leakage.
2. The currency debit hierarchy strictly exhausts `hero_earned_sns` before consuming `hero_purchased_sns`, preserving balances on rejection and syncing seasonal keys.
3. Zero free faucets exist across the codebase; `free-charge-coin` and all free coin text have been completely eliminated.
4. Responsive AdSense renders desktop gutters with `hidden lg:flex` (>= 1024px) and mobile top banner with `block lg:hidden` (< 1024px), and VIP ad removal (`hero_ad_removed === 'true'`) suppresses 100% of ad units.
5. All test suites pass 100%, and the production bundle builds cleanly.

---

## 5. Verification Method

To independently reproduce all empirical verification results:

1. **Run Challenger Stress Harness**:
   ```bash
   npx tsx tests/adversarial_m5_it2_2_empirical_stress.ts
   ```
   *Expected Output*: `Total Assertions Run: 47, Passed: 47, Failed: 0, Pass Rate: 100.0%`.

2. **Run Challenger Currency & AdSense Suite**:
   ```bash
   npx tsx tests/challenger_m5_9_2_empirical_currency_adsense.ts
   ```
   *Expected Output*: `Total Assertions Run: 48, Passed: 48, Failed: 0, Pass Rate: 100.0%`.

3. **Run Remediated Adversarial Suite**:
   ```bash
   npx tsx tests/adversarial_m5_shop_adsense.ts
   ```
   *Expected Output*: `Total Assertions Run: 38, Passed: 38, Failed: 0, Pass Rate: 100.0%`.

4. **Run Full 4-Tier E2E Suite**:
   ```bash
   npx tsx tests/e2e/run_all.ts
   ```
   *Expected Output*: `Total Assertions Run: 76, Passed: 76, Failed: 0, Pass Rate: 100.0%`.

5. **Run Type Checking & Build**:
   ```bash
   npx tsc --noEmit && npm run build
   ```
   *Expected Output*: Exit code 0, 0 errors, successful production bundle.
