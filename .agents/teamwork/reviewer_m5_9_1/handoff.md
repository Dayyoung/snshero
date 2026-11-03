# Milestone 5 Review & Adversarial Challenge Report

**Reviewer**: `reviewer_m5_9_1` (Milestone 5 Reviewer 1 - Code & Behavioral Review)  
**Parent Conversation ID**: `21826d14-7bc9-4995-866c-cbb42a941789`  
**Milestone**: Milestone 5 (`#shop` Restoration & Responsive Google AdSense)  
**Date**: 2026-11-02  
**Final Verdict**: **APPROVE**  

---

## 1. Observation

1. **Elimination of Free Faucets & Non-Free Gold Exchange (`src/landing/views/ShopSection.tsx`)**:
   - In `src/landing/views/ShopSection.tsx`, lines 143–151: Item 8 is configured as:
     ```ts
     {
       id: 'coin_charge',
       name: '코인 충전',
       category: '재화',
       priceText: '5,000 골드',
       priceCoins: 0,
       badge: '골드 환전',
       description: '인게임 5,000 골드를 1,000 SNS 코인으로 환전합니다. (보유 골드 소진)',
       actionText: '골드 환전소 열기 (5,000G → 1,000 SNS)',
     }
     ```
   - In `src/landing/views/ShopSection.tsx`, lines 314–375: `exchangeGoldForSns(goldAmount: number = 5000)` enforces:
     - `goldAmount <= 0` aborts with error message.
     - `currentGold < goldAmount` aborts with `'보유 골드가 부족합니다.'`.
     - `snsGranted = Math.floor(goldAmount / 5)` (1,000 SNS for 5,000 Gold).
     - Debits `hero_gold` and credits `hero_sns`, `hero_sns_${season}`, and `hero_earned_sns`.
     - Dispatches `snshero_sns_updated`, `sns_updated`, and `snshero_gold_updated`.
   - In `src/landing/views/ShopSection.tsx`, lines 777–784: Header button is rendered as `[골드 환전소]` with `data-action="open-gold-exchange"`.
   - Global grep confirmed zero instances of `free-charge-coin` or `+ 코인 무료 충전` in `ShopSection.tsx`.

2. **Currency Debit Hierarchy (`src/landing/views/ShopSection.tsx:242-275`)**:
   - `debitUserCoins(cost: number)` implements canonical earned-first rules:
     ```ts
     if (earned >= cost) {
       earned -= cost;
     } else {
       const remainder = cost - earned;
       earned = 0;
       purchased = Math.max(0, purchased - remainder);
     }
     ```
   - If `currentTotal < cost`, returns `false` without balance changes.
   - Synchronously updates `hero_sns`, `hero_sns_${season}`, `hero_earned_sns`, and `hero_purchased_sns`.

3. **3-Card Pack Reveal Modal (`src/landing/views/ShopSection.tsx:425-483`, `523-631`)**:
   - When a pack item (`pack_normal`, `pack_magic`, `pack_rare`) is purchased, rolls exactly 3 distinct cards via:
     ```ts
     while (unlockedIds.length < 3) {
       const randId = Math.floor(Math.random() * (maxId - minId + 1)) + minId;
       if (!unlockedIds.includes(randId)) {
         unlockedIds.push(randId);
       }
     }
     ```
   - For each card, calls `cardNurtureStore.addCard(cardId)`.
   - `renderPackRevealModal()` renders an OpenCode Terminal-Flat dialog (`#pack-reveal-modal`, `role="dialog"`, `aria-modal="true"`) with:
     - Sibling backdrop overlay (`#pack-reveal-backdrop`, `data-action="close-pack-reveal"`).
     - Close button `[x]` with `data-action="close-pack-reveal"`, `min-h-[44px] min-w-[44px]`.
     - 3 `.pack-card-slot` elements displaying `/seat/${cardId}.png`, rarity badge, NEW/duplicate counter, nameKo, nameEn, faction, N/E/S/W directional stats, and PWR total power.
     - Confirm button with `data-action="confirm-pack-reveal"`, `min-h-[44px]`, `rounded-sm`.

4. **Dual-Write Inventory Synchronization (`src/landing/services/cardNurtureStore.ts:387-420`)**:
   - `syncCardToHeroInventory(cardId)` writes synchronously to:
     - `hero_inventory`
     - `hero_inventory_${season}`
     - `hero_inventory_guest_${season}`
     - `hero_inventory_s1`
   - Handles duplicate card acquisitions by incrementing `inv[key].quantity = (inv[key].quantity || 0) + 1` while maintaining deduplicated `ownedCardIds`.
   - Dispatches `snshero_inventory_updated` with detail `{ cardId, quantity, inventory }`.

5. **Google AdSense Services & Placements (`src/landing/services/adsenseManager.ts`, `AdSenseBanners.tsx`, `index.html`)**:
   - `index.html` line 717 loads official AdSense script:
     `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6937094123258335" crossorigin="anonymous"></script>`.
   - `ADSENSE_CONFIG.client` is `'ca-pub-6937094123258335'`.
   - Breakpoint logic:
     - Desktop left/right gutters: `hidden lg:flex` (active at `>= 1024px`).
     - Mobile top banner: `block lg:hidden` (active at `< 1024px`).
   - VIP Guard: `isAdRemoved()` checks `localStorage.getItem('hero_ad_removed') === 'true'`. When true, all ad renderers return `''` and `pushAdSenseTags()` aborts immediately. Tested across viewports 320px..3840px with 100% suppression.

6. **Event Action Wiring (`src/landing/index.ts:137-183`, `252-494`)**:
   - Sibling backdrops `#pack-reveal-backdrop` and `#gold-exchange-backdrop` intercept click events and dismiss modals.
   - Global `Escape` keyboard listener checks `getActiveRevealPack()` and `isGoldExchangeModalOpen()` and cleanly closes modals.
   - Desktop gutters `renderDesktopLeftGutter()` and `renderDesktopRightGutter()` flank `<main id="landing-main-slot">`, while `renderMobileTopBanner()` mounts above the main slot.
   - `pushAdSenseTags()` is invoked after initial render and section transitions.

7. **Test Command Results**:
   - `npx tsx tests/adversarial_m5_shop_adsense.ts`: **38/38 PASS (100.0%)** (exit code 0).
   - `npx tsx tests/e2e/run_all.ts`: **76/76 PASS (100.0%)** across Tiers 1-4 (exit code 0).
   - `npx tsc --noEmit`: **0 errors** (exit code 0).
   - `npm run build`: Production bundle succeeded in 26.17s (exit code 0, 4,348 modules transformed).
   - `npx tsx tests/adversarial_m1_build_pipeline.ts`: **64/64 PASS (100.0%)**.
   - `npx tsx tests/adversarial_m2_user_interaction.ts`: **18/18 PASS (100.0%)**.
   - `npx tsx tests/adversarial_m3_play_game_loop.ts`: **30/30 PASS (100.0%)**.
   - `npx tsx tests/adversarial_m4_card_nurturing.ts`: **44/44 PASS (100.0%)**.
   - `npx tsx tests/challenger_m4_9_1_empirical_invariants.ts`: **40/40 PASS (100.0%)**.
   - `npx tsx tests/challenger_m4_9_2_empirical_stress.ts`: **39/39 PASS (100.0%)**.

---

## 2. Logic Chain

1. **Requirement Integrity Verification**:
   - The user request and `PROJECT.md` require `#shop` restoration with 8 items, elimination of free faucets, a 3-card PackRevealModal, dual-write persistence to `cardNurtureStore` and `hero_inventory`, earned-first currency debit, 5,000 Gold -> 1,000 SNS non-free exchange, and responsive Google AdSense units.
2. **Forensic Integrity Audit**:
   - We audited `ShopSection.tsx`, `cardNurtureStore.ts`, and `adsenseManager.ts` for dummy facades, hardcoded outputs, or bypassed tasks.
   - `executeShopPurchase()` uses dynamic random selection (`Math.random()`), not hardcoded card IDs.
   - `debitUserCoins()` implements real arithmetic that strictly prevents negative underflow and prioritizes earned coins.
   - `syncCardToHeroInventory()` parses, increments, serializes, and dispatches real custom events.
   - AdSense integration implements actual DOM elements with real Google AdSense client IDs and responsive CSS utility classes (`hidden lg:flex` / `block lg:hidden`).
   - Zero cheating, zero facade stubs, and zero fake tests were found.
3. **Adversarial Resilience Analysis**:
   - Boundary tests confirm that attempting to purchase packs with insufficient SNS (balance 700 vs cost 800) safely fails, does not deduct coins, and does not leak cards into inventory.
   - Exchange tests confirm that attempting to exchange with insufficient gold (balance 3000 vs required 5000) or negative gold amounts safely fails.
   - VIP tests confirm that setting `hero_ad_removed = 'true'` suppresses 100% of ads across all screen widths from 320px to 3840px.
   - Modal lifecycle tests confirm that ESC key and backdrop clicks dismiss modals without state corruption.
4. **Conclusion Derivation**:
   - Every requirement of Milestone 5 is fully implemented, verified via automated test suites, typechecked with TypeScript, and compiled in production without regression.

---

## 3. Caveats

1. **Live Ad Delivery**: Google AdSense banners render standard `<ins class="adsbygoogle">` tags with official client ID `ca-pub-6937094123258335`. Commercial ad impressions will only serve live creatives when deployed on Google-approved production domains.
2. **Defensive Validation Recommendation**: In `exchangeGoldForSns(goldAmount: number = 5000)`, adding `!Number.isFinite(goldAmount)` alongside `goldAmount <= 0` provides additional defense against non-numeric inputs if ever called programmatically from outside the UI.

---

## 4. Conclusion

**Verdict: APPROVE**

Milestone 5 is fully implemented, structurally sound, behaviorally verified, and completely free of integrity violations:
- Free faucets are 100% eliminated; Item 8 is the non-free Gold Exchange (5,000G -> 1,000 SNS).
- 3-card `PackRevealModal` operates with full visual presentation, N/E/S/W stats, rarity, and dual-write to `cardNurtureStore` and `hero_inventory` (including `hero_inventory_s1`).
- Currency debits enforce earned-first rules and prevent underflow.
- Responsive Google AdSense units are mounted with desktop gutters (`hidden lg:flex`) and mobile banner (`block lg:hidden`), protected by the VIP ad-removal guard.
- All 38 M5 adversarial tests, 76 master E2E tests, TypeScript typechecking, and production build pass with 100% exit code 0.

---

## 5. Verification Method

To independently reproduce this verification:

1. **Run the Milestone 5 Adversarial Test Suite**:
   ```bash
   npx tsx tests/adversarial_m5_shop_adsense.ts
   ```
   *Expected Output*: 38 / 38 assertions PASS (100.0%), exit code 0.

2. **Run the Master E2E Test Suite**:
   ```bash
   npx tsx tests/e2e/run_all.ts
   ```
   *Expected Output*: 76 / 76 assertions PASS (100.0%), exit code 0.

3. **Verify TypeScript Compilation**:
   ```bash
   npx tsc --noEmit
   ```
   *Expected Output*: Exit code 0, 0 errors.

4. **Verify Production Build**:
   ```bash
   npm run build
   ```
   *Expected Output*: Exit code 0, dist/ bundles built cleanly.

5. **Verify Regression Resistance**:
   ```bash
   npx tsx tests/adversarial_m1_build_pipeline.ts && npx tsx tests/adversarial_m2_user_interaction.ts && npx tsx tests/adversarial_m3_play_game_loop.ts && npx tsx tests/adversarial_m4_card_nurturing.ts
   ```
   *Expected Output*: All suites PASS with exit code 0.
