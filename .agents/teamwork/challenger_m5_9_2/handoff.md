# Challenger Report: Milestone 5 Empirical Stress Verification (Currency Invariants & AdSense VIP Guard)

**Challenger**: `challenger_m5_9_2` (Milestone 5 Challenger 2)  
**Parent ID**: `21826d14-7bc9-4995-866c-cbb42a941789`  
**Milestone**: Milestone 5 (`#shop` Restoration & Responsive Google AdSense)  
**Date**: 2026-11-02  
**Final Verdict**: **APPROVE**  

---

## 1. Observation

Direct empirical observations verified through dedicated test execution and source code auditing:

1. **Free Faucet Elimination & Shop Catalog (`src/landing/views/ShopSection.tsx` & `src/landing/index.ts`)**:
   - `ShopSection.tsx` and `index.ts` contain **0 occurrences** of `+ 코인 무료 충전`, free coin buttons, or `data-action="free-charge-coin"`.
   - `SHOP_ITEMS` defines exactly 8 items. The 8th item (`id: 'coin_charge'`, `'코인 충전'`) is dedicated to Gold Exchange (`'골드 환전'`, `'5,000 골드'`, `'골드 환전소 열기 (5,000G → 1,000 SNS)'`).
   - The Shop header bar renders `[골드 환전소]` with `data-action="open-gold-exchange"`.
   - All 8 items strictly enforce currency costs: items 1–7 require between 100 and 1,500 SNS; item 8 routes to non-free gold exchange (5,000 Gold).

2. **Non-Free Gold Exchange Invariants (`exchangeGoldForSns`)**:
   - When `hero_gold >= 5000` (tested with 5,000, 10,000, 15,000):
     - Exactly 5,000 Gold is debited from `hero_gold`.
     - Exactly 1,000 SNS is credited to `hero_sns`, `hero_sns_season1`, and `hero_earned_sns`.
     - `hero_purchased_sns` is untouched (0 mutation).
     - Returns `{ success: true, snsGranted: 1000 }`.
   - Boundary tests for `hero_gold < 5000` (tested with 0, 1, 4,999):
     - Returns `{ success: false, snsGranted: 0, error: '보유 골드가 부족합니다.' }`.
     - 0 Gold debited (balance remains 4,999).
     - 0 SNS credited (balances remain unchanged).
   - Zero or negative amount requests (`0`, `-5000`):
     - Safely rejected with `{ success: false, snsGranted: 0 }`.
   - In `renderGoldExchangeModal()`:
     - Underfunded state (< 5,000 G): warning message `보유 골드가 부족합니다` rendered, button marked `disabled` and `cursor-not-allowed`.
     - Funded state (>= 5,000 G): preview `환전 후: ...` rendered, button enabled with `data-action="execute-gold-exchange"`.

3. **Currency Debit Hierarchy (`debitUserCoins`)**:
   - Tested 4 debit hierarchy scenarios:
     - Earned sufficient (`earned = 700, purchased = 300, cost = 300`): debits 300 exclusively from `hero_earned_sns` (700 -> 400); purchased remains 300.
     - Earned split (`earned = 400, purchased = 300, cost = 500`): exhausts `hero_earned_sns` to 0; debits remainder 100 from `hero_purchased_sns` (300 -> 200).
     - Purchased only (`earned = 0, purchased = 200, cost = 100`): debits 100 cleanly from `hero_purchased_sns` (200 -> 100).
     - Insufficient balance (`total = 100, cost = 300`): returns `false`; balances remain `earned: 0, purchased: 100, total: 100` (zero balance leakage).
   - Legacy balance fallback: when `hero_sns = 800` without split keys, treats total as earned, debits cleanly (`800 -> 500`), and writes back split keys.

4. **Responsive Google AdSense Layout & Breakpoints (`adsenseManager.ts` & `AdSenseBanners.tsx`)**:
   - Desktop Left Gutter: renders `<aside id="adsense-desktop-left" class="adsense-gutter adsense-desktop-left hidden lg:flex ...">` with `data-ad-client="ca-pub-6937094123258335"` and `data-ad-slot="1000000001"`.
   - Desktop Right Gutter: renders `<aside id="adsense-desktop-right" class="adsense-gutter adsense-desktop-right hidden lg:flex ...">` with `data-ad-client="ca-pub-6937094123258335"` and `data-ad-slot="1000000002"`.
   - Mobile Top Banner: renders `<div id="adsense-mobile-top" class="adsense-banner-top w-full block lg:hidden ...">` with `data-ad-client="ca-pub-6937094123258335"` and `data-ad-slot="1000000003"`.
   - Layout Wrapper (`renderAdSenseLayoutWrapper`): places mobile banner above main and desktop gutters flanking `#landing-main-slot` without obstructing playfield elements.
   - Breakpoint logic (`getAdPlacements`):
     - At `1024px`: `desktopLeft: true, desktopRight: true, mobileTop: false`.
     - At `1023px`: `desktopLeft: false, desktopRight: false, mobileTop: true`.

5. **VIP Ad-Removal Guard (`hero_ad_removed = 'true'`)**:
   - When `localStorage.setItem('hero_ad_removed', 'true')`:
     - `isAdRemoved()` returns `true`.
     - `renderDesktopLeftGutter()`, `renderDesktopRightGutter()`, `renderMobileTopBanner()` return `""` (100% empty strings).
     - `renderAdSenseLayoutWrapper()` contains 0 ad tags and 0 AdSense attributes.
     - `getAdPlacements()` returns `suppressedByVip: true` with all ad slots `false` across all 14 tested viewports (`320px` to `3840px`).
     - `pushAdSenseTags()` safely aborts without pushing to `window.adsbygoogle`.
   - In-game purchase: buying `ad_remove` in `ShopSection` (1,000 SNS) sets `hero_ad_removed = 'true'` and immediately activates full suppression.
   - Strict boolean validation: non-`'true'` values (`'false'`, `'0'`, `null`) do not trigger ad suppression.

6. **Empirical Test Suite Execution Results**:
   - `tests/challenger_m5_9_2_empirical_currency_adsense.ts`: **48 / 48 PASS (100.0%)**
   - `tests/adversarial_m5_shop_adsense.ts`: **38 / 38 PASS (100.0%)**
   - `tests/e2e/run_all.ts`: **76 / 76 PASS (100.0%)** across Tiers 1-4
   - `npx tsc --noEmit`: **0 errors (Exit code 0)**
   - `npm run build`: **Success (Exit code 0)**; `dist/index.html` static landing bundle <= 50 KB with zero React runtime
   - `adversarial_m1_build_pipeline.ts`: **64 / 64 PASS (100.0%)**
   - Historical regression suites (M2, M3, M4): **All PASS (100.0%)**

---

## 2. Logic Chain

1. **Faucet Elimination**: Free faucets undermine in-game economy. Verified that legacy free SNS buttons were eliminated and replaced with the structured Gold Exchange modal.
2. **Mathematical Exchange Invariant**: The exchange rule `5 Gold = 1 SNS` requires `5,000 Gold` for `1,000 SNS`. By verifying boundary cases (`4,999` vs `5,000`), we confirmed that transaction atomicity holds: either 5,000 gold is spent and 1,000 SNS is earned, or the balance is unchanged.
3. **Canonical Debit Hierarchy**: Commercial in-game economies require earned currency to be consumed before purchased currency. Through empirical split tests (`earned < cost` and `earned >= cost`), we proved that `hero_earned_sns` is drained first, remainder debited from `hero_purchased_sns`, and failure preserves total balance with 0 currency leakage.
4. **Responsive CSS Separation**: By using Tailwind responsive utility classes (`hidden lg:flex` for desktop gutters, `block lg:hidden` for mobile banner), the layout adapts seamlessly to viewport dimensions without requiring JavaScript resize listeners, eliminating layout shift (CLS).
5. **VIP Guard Completeness**: By suppressing HTML generation at the template renderer level (`renderDesktopLeftGutter`, `renderDesktopRightGutter`, `renderMobileTopBanner`), zero ad DOM nodes or external AdSense scripts are injected into the DOM when `hero_ad_removed === 'true'`, providing an ironclad VIP ad-free experience.

---

## 3. Caveats

1. **Commercial Ad Delivery**: Real ad creative fill requires approved production domain routing (`snshero.com`). In test environments, tags properly emit `ca-pub-6937094123258335` placeholders.
2. **Viewport Resizing**: While CSS handles desktop vs mobile rendering via media queries, dynamic JavaScript `getAdPlacements()` is used for programmatic checks and unit tests.

---

## 4. Conclusion

**Verdict: APPROVE**

Milestone 5 passes all empirical adversarial challenges with 100% compliance:
- Free currency faucets are completely eradicated.
- Non-free Gold Exchange (5,000 Gold -> 1,000 SNS) operates atomically with strict boundary guards.
- Currency debit hierarchy prioritizes earned SNS before purchased SNS with zero balance leakage.
- Responsive Google AdSense layout cleanly separates desktop gutters (`hidden lg:flex`) and mobile banner (`block lg:hidden`) with publisher ID `ca-pub-6937094123258335`.
- VIP Ad-Removal Guard (`hero_ad_removed = 'true'`) achieves 100% ad suppression across all screen widths.

---

## 5. Verification Method

To independently reproduce and verify this assessment:

1. **Challenger Empirical Test Suite**:
   ```bash
   npx tsx tests/challenger_m5_9_2_empirical_currency_adsense.ts
   ```
   *Expected Output*: 48 / 48 assertions PASS (100.0%).

2. **Milestone 5 Adversarial Harness**:
   ```bash
   npx tsx tests/adversarial_m5_shop_adsense.ts
   ```
   *Expected Output*: 38 / 38 assertions PASS (100.0%).

3. **Master E2E Test Suite**:
   ```bash
   npx tsx tests/e2e/run_all.ts
   ```
   *Expected Output*: 76 / 76 assertions PASS (100.0%).

4. **Static Landing Build & Bundle Integrity**:
   ```bash
   npm run build
   npx tsx tests/adversarial_m1_build_pipeline.ts
   ```
   *Expected Output*: Exit code 0, all 64 assertions PASS.
