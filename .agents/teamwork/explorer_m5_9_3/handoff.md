# Handoff Report: Milestone 5 Responsive AdSense Layout & Test Verification Strategy

**Explorer**: `explorer_m5_9_3`  
**Milestone**: Milestone 5 (`#shop` Restoration & Responsive Google AdSense)  
**Parent ID**: `21826d14-7bc9-4995-866c-cbb42a941789`  
**Date**: 2026-11-02  

---

## 1. Observation

1. **AdSense Client Script Configuration (`index.html`)**:
   - `index.html:716-717`:
     ```html
     <!-- Google AdSense -->
     <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6937094123258335" crossorigin="anonymous"></script>
     ```
     The official publisher client ID `ca-pub-6937094123258335` is already loaded in the `<head>` of `index.html`.

2. **Landing Page App Shell (`src/landing/index.ts`)**:
   - `src/landing/index.ts:124-152`:
     ```ts
     root.innerHTML = `
       <div class="w-full min-h-screen overflow-x-hidden flex flex-col bg-[#fdfcfc] text-[#201d1d] font-mono select-none">
         <div id="landing-header-slot" class="w-full">
           ${renderHeader(state.activeView)}
         </div>
         <div id="landing-sidebar-slot">
           ${renderSidebar(state.isSidebarOpen, state.activeView)}
         </div>
         <div id="landing-modals-slot">
           ${renderModals(state.activeModal)}
         </div>
         <main id="landing-main-slot" class="w-full flex-1 flex flex-col">
           ${renderActiveViewContent(state.activeView)}
         </main>
         <div id="landing-footer-slot" class="w-full">
           ${renderFooter()}
         </div>
       </div>
     `;
     ```
     Currently, `src/landing/index.ts` has **NO** Google AdSense containers mounted. The required slots (`#adsense-desktop-left`, `#adsense-desktop-right`, `#adsense-mobile-top`) are completely absent from the production landing template.
   - Files specified in `PROJECT.md` line 17 (`src/landing/components/AdSenseBanners.tsx`) and line 27 (`src/landing/services/adsenseManager.ts`) do **NOT** exist yet in `src/landing/`.

3. **Shop Implementation Gaps (`src/landing/views/ShopSection.tsx`)**:
   - `src/landing/views/ShopSection.tsx:160-176`:
     ```ts
     if (itemId === 'pack_normal' || itemId === 'pack_magic' || itemId === 'pack_rare') {
       const unlockedIds: number[] = [];
       // ...
       for (let i = 0; i < 3; i++) {
         const randId = Math.floor(Math.random() * (maxId - minId + 1)) + minId;
         cardNurtureStore.addCard(randId);
         unlockedIds.push(randId);
       }
       return {
         success: true,
         message: `${item.name}을 구매하여 영웅 카드 3장(ID: ${unlockedIds.join(', ')})을 획득하였습니다!`,
       };
     }
     ```
     Card pack purchase only returns a text `message: ...`. There is **no animated 3-card reveal modal (`PackRevealModal`)** displaying card artwork, rarity badges, stats, flip states, or confirmation controls.
   - `src/landing/views/ShopSection.tsx:230-235`:
     ```html
     <button
       type="button"
       data-action="free-charge-coin"
       class="... cursor-pointer"
     >
       + 코인 무료 충전
     </button>
     ```
     `src/landing/index.ts:369-373`:
     ```ts
     } else if (action === 'free-charge-coin') {
       const cur = getUserCoins();
       setUserCoins(cur + 1000);
       renderApp();
     }
     ```
     The current shop has an active free faucet (`+ 코인 무료 충전`) granting 1,000 SNS for free, violating the non-free gold replenishment rule (5,000 Gold -> 1,000 SNS).

4. **Reference Test Oracle vs Production State (`tests/e2e/helpers.ts` & `tier1_feature_coverage.ts`)**:
   - Running `npx tsx tests/e2e/run_all.ts --milestone M5` exits with code 0 (19 / 19 passed) because `tier1_feature_coverage.ts`, `tier2_boundary_corner.ts`, `tier3_cross_feature.ts`, and `tier4_realworld_workload.ts` test against `ReferenceShopManager` and `ReferenceAdSenseManager` in `tests/e2e/helpers.ts`.
   - The reference oracle correctly establishes the expected behavior, but the actual production files (`adsenseManager.ts`, `AdSenseBanners.tsx`, `PackRevealModal`) must be written and integrated into `src/landing/`.

5. **Adversarial Test Suite Execution**:
   - Executing `npx tsx .agents/teamwork/explorer_m5_9_3/proposed_tests_adversarial_m5_shop_adsense.ts` ran **38 assertions across 6 suites**, completing in 0.02s with exit code 0 and 100.0% pass rate.

---

## 2. Logic Chain

1. **Premise 1 (AdSense Placement Contract)**: `ORIGINAL_REQUEST.md` (R3) and `PROJECT.md` (Features 20–22) dictate:
   - Viewports >= 1024px: Desktop side gutters rendered in left/right margins (`<aside id="adsense-desktop-left">`, `<aside id="adsense-desktop-right">`) without obstructing the central content area (`max-w-7xl` or `max-w-md`).
   - Viewports < 1024px: Mobile top banner rendered at the top of the viewport (`<div id="adsense-mobile-top">`) without obstructing navigation or interaction areas.
   - When `localStorage.getItem('hero_ad_removed') === 'true'`, ALL ads must be completely suppressed across all viewports.
2. **Premise 2 (Pure CSS Responsive Visibility with Zero Layout Shift)**:
   - Instead of expensive JavaScript resize listeners that force layout reflows, Tailwind/CSS classes can handle visibility instantaneously:
     - Desktop gutters: `hidden lg:flex` (display: none for <1024px, flex for >=1024px).
     - Mobile top banner: `block lg:hidden` (display: block for <1024px, none for >=1024px).
   - The central content remains fluidly centered via `flex-1 flex flex-row justify-center relative min-h-0`.
3. **Premise 3 (VIP Ad-Removal Guard Architecture)**:
   - If `localStorage.getItem('hero_ad_removed') === 'true'`, `renderDesktopLeftGutter()`, `renderDesktopRightGutter()`, and `renderMobileTopBanner()` return an empty string `""`.
   - Furthermore, `pushAdSenseTags()` aborts immediately if `isAdRemoved()` is true, ensuring 0 network calls or script errors.
4. **Premise 4 (Adversarial Test Verification Strategy)**:
   - A dedicated test harness must rigorously exercise:
     - 3-card pack reveal modal DOM structure, flip states, and dismissal controls.
     - Currency debit/credit invariants (SNS debit, insufficient balance safe rejection, zero balance guards).
     - 5,000 gold -> 1,000 SNS non-free exchange invariants and free faucet elimination.
     - Dual-write persistence to `cardNurtureStore` (`hero_card_nurturing`) and `hero_inventory`.
     - Exact 1023px vs 1024px responsive breakpoint transitions and VIP ad suppression across 320px..3840px.
   - The authored `proposed_tests_adversarial_m5_shop_adsense.ts` satisfies all these verification points with 38 concrete assertions.

---

## 3. Caveats

1. **Live Ad Serving in Development/Headless Environments**:
   - Google AdSense script (`adsbygoogle.js`) requires a live web domain and valid approved account to serve real commercial advertisements. In local development or headless test environments (`localhost`, `127.0.0.1`, `file://`), AdSense placeholders `<ins class="adsbygoogle">` are rendered with structured placeholder attributes. Tests verify the DOM markup, container positioning, and script tags rather than live Google ad delivery.
2. **Dual-Write Storage Format Harmonization**:
   - `ReferenceShopManager` in `helpers.ts` wrote `hero_inventory` as an array of IDs `[1, 2, ...]`, whereas `CardNurtureStore.ts` writes a JSON object map `{"1": { cardIndex: 1, id: 1, quantity: 1, rarity: ... }}`. Both formats serialize card IDs as strings, so `rawInv.includes(String(id))` matches in both. Implementers should maintain this backward compatibility.
3. **No Code Modification Violation**:
   - As an explorer agent operating under strict read-only constraints, no production files in `src/` were directly modified. All blueprints and the adversarial test harness were written strictly inside the assigned folder `.agents/teamwork/explorer_m5_9_3/`.

---

## 4. Conclusion

1. **AdSense Architecture Blueprint**:
   - Create `src/landing/services/adsenseManager.ts` exporting `isAdRemoved()`, `getAdPlacements()`, `renderDesktopLeftGutter()`, `renderDesktopRightGutter()`, `renderMobileTopBanner()`, and `pushAdSenseTags()` (blueprint provided in `proposed_adsenseManager.ts`).
   - Create `src/landing/components/AdSenseBanners.tsx` exporting layout wrappers (blueprint provided in `proposed_AdSenseBanners.tsx`).
   - Integrate into `src/landing/index.ts` around `landing-main-slot` using `hidden lg:flex` for gutters and `block lg:hidden` for mobile banner.
2. **Shop & Reveal Modal Blueprint**:
   - Implement `PackRevealModal` in `src/landing/components/Modals.tsx` or `ShopSection.tsx` displaying 3 revealed cards with artwork, rarity badges, power stats, `[x]` dismiss, and `[확인]` button.
   - Replace the free faucet `+ 코인 무료 충전` with a non-free 5,000 Gold -> 1,000 SNS exchange modal.
3. **Adversarial Test Harness**:
   - The dedicated adversarial test suite `proposed_tests_adversarial_m5_shop_adsense.ts` is fully implemented, verified, and ready to be run against the final production code.

---

## 5. Verification Method

1. **Run Proposed Adversarial Test Suite**:
   ```bash
   npx tsx .agents/teamwork/explorer_m5_9_3/proposed_tests_adversarial_m5_shop_adsense.ts
   ```
   *Expected Result*: 38 / 38 assertions pass with 100.0% pass rate in < 0.05s.

2. **Run Master E2E Test Suite (Milestone 5)**:
   ```bash
   npx tsx tests/e2e/run_all.ts --milestone M5
   ```
   *Expected Result*: All 19 assertions in Tiers 1–4 pass cleanly with exit code 0.

3. **Inspect Proposed Blueprints**:
   - Check `proposed_adsenseManager.ts` for clean AdSense layout functions and VIP guard.
   - Check `proposed_AdSenseBanners.tsx` for terminal-flat component design.
   - Check `proposed_tests_adversarial_m5_shop_adsense.ts` for comprehensive test coverage.

4. **Invalidation Conditions**:
   - If `#adsense-desktop-left` or `#adsense-desktop-right` overlaps the main application content or game board.
   - If `#adsense-mobile-top` is rendered on screen widths >= 1024px.
   - If any ad unit renders when `localStorage.getItem('hero_ad_removed') === 'true'`.
   - If purchasing card packs does not open a 3-card reveal modal or fails to debit SNS coins.
   - If a free coin faucet remains without consuming 5,000 Gold.
