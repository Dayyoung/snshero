# Handoff Report — challenger_m2_9_2 (Milestone 2 Challenge)

## 1. Observation
- Target files inspected and audited:
  - `src/landing/index.ts` (lines 219–381): event delegation (`handleEventDelegation`) and global keydown (`handleGlobalKeydown`).
  - `src/landing/views/HomeSection.tsx` (lines 85–276, 280–370, 373–440, 473–569): official logo `/logo-ko.png`, 5-card fan-folded preview, 4 media pillars, 3 serialization links with `[절찬 연재중]` badges, and `#home-card-inspect-modal`.
  - `src/landing/views/MyDeckSection.tsx` (lines 118–250, 450–620): 5 active deck slots with compass stats, unspent point red dot, `[영웅 교체]` buttons, and `#deck-swap-drawer-backdrop`.
  - `src/landing/services/cardNurtureStore.ts`: active squad storage and dynamic Deck TP recalculation.
- Verification command outputs:
  - `npx tsc --noEmit`: exit code 0 (0 errors).
  - `npm run build`: exit code 0 (4,346 modules transformed, 60 static fallback pages and SEO assets generated).
  - `npx tsx tests/adversarial_m2_home_deck.ts`: Total Assertions: 28, Passed: 28, Failed: 0 (100.0%).
  - `npx tsx tests/challenger_m2_adversarial.ts`: Total Assertions: 30, Passed: 30, Failed: 0 (100.0%).
  - `npx tsx tests/e2e/run_all.ts --milestone M2`: Total Assertions: 11, Passed: 11, Failed: 0 (100.0%).
  - `npx tsx tests/adversarial_route_edge_cases.ts`: Total Assertions: 76, Passed: 76, Failed: 0 (100.0%).
  - `npx tsx tests/adversarial_m1_build_pipeline.ts`: Total Assertions: 64, Passed: 64, Failed: 0 (100.0%).
  - `npx tsx tests/adversarial_m2_user_interaction.ts`: Total Assertions: 18, Passed: 16, Failed: 2 (88.9%).
- Verbatim failures from `tests/adversarial_m2_user_interaction.ts`:
  1. `[CH2.HOME.BACKDROP_CLICK]`:
     ```text
     [CH2.HOME.BACKDROP_CLICK] Clicking modal backdrop dismisses inspect modal ✗ FAIL
       ↳ Expected: Backdrop click dismisses modal OR has dedicated backdrop dismiss handler
       ↳ Actual  : closedByBackdrop=false, backdropHasDataAction=false, hasDedicatedBackdropOverlay=false
       ↳ Note    : Vulnerability: #home-card-inspect-modal lacks data-action="close-home-card-inspector" on outer backdrop
     ```
  2. `[CH2.DECK.BACKDROP_CLICK]`:
     ```text
     [CH2.DECK.BACKDROP_CLICK] Clicking drawer backdrop dismisses deck swap drawer ✗ FAIL
       ↳ Expected: Backdrop click dismisses drawer OR has dedicated backdrop dismiss handler
       ↳ Actual  : closedByBackdrop=false, drawerHasDataAction=false, hasDedicatedDrawerBackdrop=false
       ↳ Note    : Vulnerability: #deck-swap-drawer-backdrop lacks data-action="close-deck-swap-drawer" on outer backdrop
     ```
- Verbatim code snippets:
  - `src/landing/views/HomeSection.tsx:474-480`:
    ```html
    <div
      id="home-card-inspect-modal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-mono select-none"
      role="dialog"
      aria-modal="true"
    >
      <div class="relative bg-[#fdfcfc] text-[#201d1d] border border-[rgba(15,0,0,0.12)] max-w-lg w-full p-6 sm:p-8 rounded-none shadow-none space-y-6">
    ```
  - `src/landing/views/MyDeckSection.tsx:124-132`:
    ```html
    <div
      id="deck-swap-drawer-backdrop"
      class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="deck-swap-drawer-title"
    >
      <div class="relative w-full max-w-4xl bg-[#fdfcfc] border border-[#201d1d] shadow-2xl rounded-none flex flex-col max-h-[90dvh] overflow-hidden">
    ```
  - `src/landing/index.ts:219-223`:
    ```typescript
    export function handleEventDelegation(event: Event): void {
      const target = (event.target as HTMLElement).closest('[data-nav], [data-modal], [data-action], a[href^="#"], a[href="/home"]');
      if (!target) return;
    ```

## 2. Logic Chain
1. **Observation 1 & 4**: In `src/landing/index.ts`, `handleEventDelegation` captures click events and queries `(event.target as HTMLElement).closest('[data-nav], [data-modal], [data-action], a[href^="#"], a[href="/home"]')`. If no ancestor matches, it returns immediately with zero state mutation.
2. **Observation 4**: In `HomeSection.tsx`, `#home-card-inspect-modal` is a fixed fullscreen overlay containing the dialog card. Neither `#home-card-inspect-modal` nor any ancestor element carries a `data-action` attribute. Clicking directly on the dark backdrop around the modal dialog produces `target = null` in `handleEventDelegation`. The inspected card ID remains set, and the modal fails to close on backdrop click.
3. **Observation 4**: In `MyDeckSection.tsx`, `#deck-swap-drawer-backdrop` is also a fixed fullscreen overlay containing the drawer dialog. Neither `#deck-swap-drawer-backdrop` nor any ancestor element carries a `data-action` attribute. Clicking directly on the dark backdrop around the drawer dialog produces `target = null` in `handleEventDelegation`. The editing slot index remains set, and the drawer fails to close on backdrop click.
4. **Contrast with Working Pattern in `Sidebar.tsx`**: In `Sidebar.tsx:91-96`, the backdrop is separated into an independent sibling element:
   ```html
   <div id="sidebar-backdrop" data-action="close-sidebar" class="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity cursor-pointer"></div>
   ```
   This ensures clicking outside the drawer invokes `action === 'close-sidebar'` without bubbling from clicks inside the offcanvas panel.
5. **Observation 2 & Dispatch Requirements**: The dispatch explicitly required:
   > "Test event delegation in `src/landing/index.ts`: inspect home card popup opening and closing (backdrop, close button, Escape key), deck swap drawer opening and closing (backdrop, close button, Escape key)."
   Close button and Escape key dismissals function correctly (100% pass across all tests), but backdrop click dismissals fail completely on both overlays.
6. **Other Features Verified**:
   - 4 media pillars (`웹소설`, `웹게임`, `웹툰`, `애니메이션`): fully present, correctly rendered, responsive 4-column layout (`CH2.PIL.ALL_4_PRESENT`, `CH2.PIL.GRID_RESPONSIVE` pass).
   - 3 serialization links (Naver Web Novel, Naver Webtoon, Munpia): canonical URLs present, `target="_blank"`, `rel="noopener noreferrer"`, `min-h-[44px]`, with 3 emerald `[절찬 연재중]` badges (`CH2.SERIAL.*` pass).
   - Core suites: `adversarial_m2_home_deck.ts` (28/28), `challenger_m2_adversarial.ts` (30/30), `e2e/run_all.ts` (11/11), `adversarial_route_edge_cases.ts` (76/76), `adversarial_m1_build_pipeline.ts` (64/64) all pass.

## 3. Caveats
- The failure is isolated to backdrop click dismissal for `#home-card-inspect-modal` and `#deck-swap-drawer-backdrop`.
- Close button (`[x]`, `닫기`, `✕ 닫기`, `취소`) and keyboard `Escape` dismissals operate with 100% reliability.
- As a review-only empirical challenger, implementation code was not modified to fix the issue directly.

## 4. Conclusion
**Verdict**: **REQUEST_CHANGES**

### Actionable Fixes Required from Worker:
1. **Home Card Inspect Modal Backdrop**:
   In `src/landing/views/HomeSection.tsx`, split `#home-card-inspect-modal` into a container and a dedicated backdrop sibling with `data-action="close-home-card-inspector"`, or add a direct target check in `handleEventDelegation` in `src/landing/index.ts`:
   ```typescript
   if ((event.target as HTMLElement)?.id === 'home-card-inspect-modal') {
     setInspectedHomeCardId(null);
     renderApp();
     return;
   }
   ```
2. **Deck Swap Drawer Backdrop**:
   In `src/landing/views/MyDeckSection.tsx`, split `#deck-swap-drawer-backdrop` into a container and a dedicated backdrop sibling with `data-action="close-deck-swap-drawer"`, or add a direct target check in `handleEventDelegation` in `src/landing/index.ts`:
   ```typescript
   if ((event.target as HTMLElement)?.id === 'deck-swap-drawer-backdrop') {
     setEditingSlotIndex(null);
     renderApp();
     return;
   }
   ```
3. Once updated, verify with `npx tsx tests/adversarial_m2_user_interaction.ts` until all 18 assertions pass 100%.

## 5. Verification Method
Run the following verification commands to independently reproduce the findings:
```bash
# 1. Targeted user interaction & event delegation challenge harness (18 assertions)
npx tsx tests/adversarial_m2_user_interaction.ts

# 2. Existing Milestone 2 adversarial test harness (28 assertions)
npx tsx tests/adversarial_m2_home_deck.ts

# 3. Challenger M2 stress suite (30 assertions)
npx tsx tests/challenger_m2_adversarial.ts

# 4. Milestone 2 E2E test suite (11 assertions)
npx tsx tests/e2e/run_all.ts --milestone M2

# 5. Route edge cases suite (76 assertions)
npx tsx tests/adversarial_route_edge_cases.ts

# 6. Build pipeline suite (64 assertions)
npx tsx tests/adversarial_m1_build_pipeline.ts

# 7. Type-checking & Build
npx tsc --noEmit
npm run build
```
- Files to inspect:
  - `src/landing/views/HomeSection.tsx:474-480`
  - `src/landing/views/MyDeckSection.tsx:124-132`
  - `src/landing/index.ts:219-223`
  - `tests/adversarial_m2_user_interaction.ts`
- Invalidation condition: `npx tsx tests/adversarial_m2_user_interaction.ts` exits with code 0 and all 18 assertions pass.
