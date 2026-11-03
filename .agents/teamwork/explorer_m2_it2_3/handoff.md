# Handoff Report — explorer_m2_it2_3 (Test Suite Analysis & Verification Blueprint)

## 1. Observation

### 1.1 Empirical Test Suite Audit Results (Baseline)
The following test suites were independently executed to establish the empirical baseline for Milestone 2 Iteration 2:

1. **Targeted Event Delegation & User Interaction Suite**:
   - Command: `npx tsx tests/adversarial_m2_user_interaction.ts`
   - Result: Exit code 1. Total: 18, Passed: 16, Failed: 2 (88.9%).
   - Verbatim Failures:
     ```text
     [CH2.HOME.BACKDROP_CLICK] Clicking modal backdrop dismisses inspect modal            ✗ FAIL
       ↳ Expected: Backdrop click dismisses modal OR has dedicated backdrop dismiss handler
       ↳ Actual  : closedByBackdrop=false, backdropHasDataAction=false, hasDedicatedBackdropOverlay=false
       ↳ Note    : Vulnerability: #home-card-inspect-modal lacks data-action="close-home-card-inspector" on outer backdrop
     ```
     ```text
     [CH2.DECK.BACKDROP_CLICK] Clicking drawer backdrop dismisses deck swap drawer        ✗ FAIL
       ↳ Expected: Backdrop click dismisses drawer OR has dedicated backdrop dismiss handler
       ↳ Actual  : closedByBackdrop=false, drawerHasDataAction=false, hasDedicatedDrawerBackdrop=false
       ↳ Note    : Vulnerability: #deck-swap-drawer-backdrop lacks data-action="close-deck-swap-drawer" on outer backdrop
     ```

2. **Milestone 2 Home & Deck Adversarial Suite**:
   - Command: `npx tsx tests/adversarial_m2_home_deck.ts`
   - Result: Exit code 0. Total: 28, Passed: 28, Failed: 0 (100.0%).

3. **Challenger M2 Adversarial Suite**:
   - Command: `npx tsx tests/challenger_m2_adversarial.ts`
   - Result: Exit code 0. Total: 30, Passed: 30, Failed: 0 (100.0%).

4. **Challenger M2 Deep Stress Suite**:
   - Command: `npx tsx tests/challenger_m2_deep_stress.ts`
   - Result: Exit code 0. Total: 29, Passed: 29, Failed: 0 (100.0%).

5. **Master E2E Suite for Milestone 2**:
   - Command: `npx tsx tests/e2e/run_all.ts --milestone M2`
   - Result: Exit code 0. Total: 11, Passed: 11, Failed: 0 (100.0%).

6. **Adversarial Route Edge-Case Suite**:
   - Command: `npx tsx tests/adversarial_route_edge_cases.ts`
   - Result: Exit code 0. Total: 76, Passed: 76, Failed: 0 (100.0%).

7. **Adversarial Build Pipeline Suite**:
   - Command: `npx tsx tests/adversarial_m1_build_pipeline.ts`
   - Result: Exit code 0. Total: 64, Passed: 64, Failed: 0 (100.0%).

8. **Type Checking & Production Build**:
   - `npx tsc --noEmit`: Exit code 0 (0 errors).
   - `npm run build`: Exit code 0 (4,346 modules transformed, 60 static fallback pages, Google News/Video SEO built).

### 1.2 Target Code Inspection
1. **`src/landing/views/HomeSection.tsx` (lines 473–489)**:
   ```html
   <div
     id="home-card-inspect-modal"
     class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-mono select-none"
     role="dialog"
     aria-modal="true"
   >
     <div class="relative bg-[#fdfcfc] text-[#201d1d] border border-[rgba(15,0,0,0.12)] max-w-lg w-full p-6 sm:p-8 rounded-none shadow-none space-y-6">
       <!-- Close [x] Top Right -->
       <button
         type="button"
         data-action="close-home-card-inspector"
         class="absolute top-4 right-4 min-h-[44px] min-w-[44px] flex items-center justify-center text-stone-500 hover:text-[#201d1d] font-bold text-sm rounded-sm cursor-pointer"
         aria-label="닫기"
       >
         [x]
       </button>
   ```

2. **`src/landing/views/MyDeckSection.tsx` (lines 124–133)**:
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

3. **`src/landing/index.ts` (lines 219–221, 275–286)**:
   ```typescript
   export function handleEventDelegation(event: Event): void {
     const target = (event.target as HTMLElement).closest('[data-nav], [data-modal], [data-action], a[href^="#"], a[href="/home"]');
     if (!target) return;
     ...
     } else if (action === 'close-home-card-inspector') {
       setInspectedHomeCardId(null);
       renderApp();
     } else if (action === 'open-deck-swap-drawer') {
       const slotStr = target.getAttribute('data-slot-index');
       if (slotStr !== null) {
         setEditingSlotIndex(parseInt(slotStr, 10));
         renderApp();
       }
     } else if (action === 'close-deck-swap-drawer') {
       setEditingSlotIndex(null);
       renderApp();
     }
   ```

4. **Canonical Sibling Backdrop Pattern in `src/landing/components/Sidebar.tsx` (lines 84–101)**:
   ```html
   <div
     id="sidebar-drawer-container"
     class="fixed inset-0 z-50 transition-opacity duration-200 opacity-100 pointer-events-auto font-mono"
     role="dialog"
     aria-modal="true"
     aria-label="사이드 내비게이션 메뉴"
   >
     <!-- Backdrop Overlay -->
     <div
       id="sidebar-backdrop"
       data-action="close-sidebar"
       class="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity cursor-pointer"
     ></div>

     <!-- Offcanvas Drawer Panel -->
     <aside
       class="fixed inset-y-0 left-0 w-72 sm:w-80 md:w-80 max-w-[85vw] bg-[#fdfcfc] text-[#201d1d] z-50 ...
   ```

5. **`tests/adversarial_m2_user_interaction.ts` Internal Assertions**:
   - `CH2.HOME.BACKDROP_CLICK` (lines 341–357):
     ```typescript
     const backdropOuter = $h('#home-card-inspect-modal');
     const backdropHasDataAction = backdropOuter.attr('data-action') === 'close-home-card-inspector';
     const hasDedicatedBackdropOverlay = $h('#home-card-inspect-backdrop, [data-action="close-home-card-inspector"].fixed').length >= 1;

     router.dispatchClick('#home-card-inspect-modal', $h);
     const closedByBackdrop = getInspectedHomeCardId() === null;

     recordAssertion(
       'Suite 1',
       'CH2.HOME.BACKDROP_CLICK',
       'Clicking modal backdrop dismisses inspect modal',
       closedByBackdrop || backdropHasDataAction || hasDedicatedBackdropOverlay,
       ...
     );
     ```
   - `CH2.HOME.INSIDE_CLICK_PRESERVED` (lines 360–374):
     ```typescript
     setInspectedHomeCardId(targetCardId);
     homeHtml = renderHomeSection();
     $h = cheerio.load(homeHtml);
     router.dispatchClick('#home-card-inspect-modal h3', $h);
     const insideClickPreserved = getInspectedHomeCardId() === targetCardId;

     recordAssertion(
       'Suite 1',
       'CH2.HOME.INSIDE_CLICK_PRESERVED',
       'Clicking inside modal dialog content preserves open state (no false dismissal)',
       insideClickPreserved,
       ...
     );
     ```
   - `CH2.DECK.BACKDROP_CLICK` (lines 453–469):
     ```typescript
     const drawerOuter = $d('#deck-swap-drawer-backdrop');
     const drawerHasDataAction = drawerOuter.attr('data-action') === 'close-deck-swap-drawer';
     const hasDedicatedDrawerBackdrop = $d('#deck-swap-backdrop, [data-action="close-deck-swap-drawer"].fixed').length >= 1;

     router.dispatchClick('#deck-swap-drawer-backdrop', $d);
     const closedByDrawerBackdrop = getEditingSlotIndex() === null;

     recordAssertion(
       'Suite 2',
       'CH2.DECK.BACKDROP_CLICK',
       'Clicking drawer backdrop dismisses deck swap drawer',
       closedByDrawerBackdrop || drawerHasDataAction || hasDedicatedDrawerBackdrop,
       ...
     );
     ```

---

## 2. Logic Chain

1. **Why `[CH2.HOME.BACKDROP_CLICK]` Failed (Observation 1.1 & 1.2)**:
   In `HomeSection.tsx`, `#home-card-inspect-modal` is a single fixed container that also holds the dialog card. Neither `#home-card-inspect-modal` nor any child overlay carries `data-action="close-home-card-inspector"`, nor is there any element with `id="home-card-inspect-backdrop"`. Therefore:
   - `closedByBackdrop = false`
   - `backdropHasDataAction = false`
   - `hasDedicatedBackdropOverlay = false`
   All three conditions in `CH2.HOME.BACKDROP_CLICK` evaluated to false.

2. **Why `[CH2.DECK.BACKDROP_CLICK]` Failed (Observation 1.1 & 1.2)**:
   In `MyDeckSection.tsx`, `#deck-swap-drawer-backdrop` is also a single fixed container enclosing the drawer card. It does not carry `data-action="close-deck-swap-drawer"`, nor is there any element with `id="deck-swap-backdrop"`. Therefore:
   - `closedByDrawerBackdrop = false`
   - `drawerHasDataAction = false`
   - `hasDedicatedDrawerBackdrop = false`
   All three conditions in `CH2.DECK.BACKDROP_CLICK` evaluated to false.

3. **Critical Trap & Regression Vulnerability (Observation 1.5)**:
   If the remediation worker naively puts `data-action="close-home-card-inspector"` directly onto the outer container `#home-card-inspect-modal`, clicking anywhere inside the modal (e.g. `<h3>` in `CH2.HOME.INSIDE_CLICK_PRESERVED`) will bubble up and match via `el.closest('[data-action]')`.
   This causes `router.dispatchClick('#home-card-inspect-modal h3', $h)` to erroneously dismiss the modal, failing `CH2.HOME.INSIDE_CLICK_PRESERVED`!
   Similarly, putting `data-action="close-deck-swap-drawer"` on `#deck-swap-drawer-backdrop` would cause unhandled clicks on text and guidance labels inside the drawer to trigger false dismissals.

4. **The Non-Regressive Architecture (Observation 1.4 & 1.5)**:
   The clean pattern already proven in `src/landing/components/Sidebar.tsx` is to separate the backdrop into a **dedicated sibling overlay** placed behind the dialog panel (`z-10`):
   - In `HomeSection.tsx`:
     Inside `<div id="home-card-inspect-modal" ...>`, insert:
     ```html
     <!-- Dedicated Backdrop Overlay -->
     <div
       id="home-card-inspect-backdrop"
       data-action="close-home-card-inspector"
       class="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity cursor-pointer"
     ></div>
     <!-- Dialog Card Content (z-10) -->
     <div class="relative z-10 bg-[#fdfcfc] ...">
     ```
   - In `MyDeckSection.tsx`:
     Inside `<div id="deck-swap-drawer-backdrop" ...>`, insert:
     ```html
     <!-- Dedicated Drawer Backdrop Overlay -->
     <div
       id="deck-swap-backdrop"
       data-action="close-deck-swap-drawer"
       class="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity cursor-pointer"
     ></div>
     <!-- Drawer Content Panel (z-10) -->
     <div class="relative z-10 w-full max-w-4xl bg-[#fdfcfc] ...">
     ```

5. **Impact on Other Test Suites (Observation 1.1)**:
   - `tests/adversarial_m2_user_interaction.ts`:
     - `hasDedicatedBackdropOverlay = true` (matches `#home-card-inspect-backdrop, [data-action="close-home-card-inspector"].fixed`).
     - `hasDedicatedDrawerBackdrop = true` (matches `#deck-swap-backdrop, [data-action="close-deck-swap-drawer"].fixed`).
     - `CH2.HOME.INSIDE_CLICK_PRESERVED`: Clicks on `<h3>` do NOT match `#home-card-inspect-backdrop` because it is a sibling, not an ancestor. State preserved (100% PASS).
   - `tests/challenger_m2_adversarial.ts`:
     - Checks all interactive elements for `min-h-[44px]` or `fixed inset-0`. Because both backdrops carry `class="fixed inset-0 ..."`, they satisfy `isFullscreenBackdrop = className.includes('fixed inset-0')`.
     - Zero prohibited border-radius (`rounded-none`).
   - `tests/challenger_m2_deep_stress.ts`:
     - Expects `#home-card-inspect-modal` and `#deck-swap-drawer-backdrop` to exist and contain cutouts, stats, close buttons, and disabled equipped indicators. Retaining the outer container IDs preserves 100% compatibility.
   - `tests/adversarial_m2_home_deck.ts`, `tests/e2e/run_all.ts --milestone M2`, `tests/adversarial_route_edge_cases.ts`, `tests/adversarial_m1_build_pipeline.ts`:
     - Zero regressions.

---

## 3. Caveats

- **Do NOT rename or replace `#home-card-inspect-modal` or `#deck-swap-drawer-backdrop`**: Existing tests in `challenger_m2_deep_stress.ts` and `adversarial_m2_user_interaction.ts` query those exact IDs as the root containers of their respective modal dialogs.
- **Do NOT put `data-action` on the outer containers**: The outer containers (`#home-card-inspect-modal` and `#deck-swap-drawer-backdrop`) must NOT have `data-action` attributes to prevent false click dismissal from elements inside the dialog cards.
- **Ensure `relative z-10` on the inner dialog card**: This ensures the dialog sits visually and functionally in front of the `fixed inset-0` backdrop overlay.

---

## 4. Conclusion & Actionable Remediation Blueprint

### 4.1 Exact Code Changes for Remediation Worker

#### Target File 1: `src/landing/views/HomeSection.tsx`
Replace lines 474–480:
```html
<<<< TARGET CODE (BEFORE):
        <div
          id="home-card-inspect-modal"
          class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-mono select-none"
          role="dialog"
          aria-modal="true"
        >
          <div class="relative bg-[#fdfcfc] text-[#201d1d] border border-[rgba(15,0,0,0.12)] max-w-lg w-full p-6 sm:p-8 rounded-none shadow-none space-y-6">

==== REPLACEMENT CODE (AFTER):
        <div
          id="home-card-inspect-modal"
          class="fixed inset-0 z-50 flex items-center justify-center p-4 font-mono select-none"
          role="dialog"
          aria-modal="true"
        >
          <!-- Dedicated Backdrop Overlay -->
          <div
            id="home-card-inspect-backdrop"
            data-action="close-home-card-inspector"
            class="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity cursor-pointer"
          ></div>

          <div class="relative z-10 bg-[#fdfcfc] text-[#201d1d] border border-[rgba(15,0,0,0.12)] max-w-lg w-full p-6 sm:p-8 rounded-none shadow-none space-y-6">
>>>>
```

#### Target File 2: `src/landing/views/MyDeckSection.tsx`
Replace lines 125–132:
```html
<<<< TARGET CODE (BEFORE):
    <div
      id="deck-swap-drawer-backdrop"
      class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="deck-swap-drawer-title"
    >
      <div class="relative w-full max-w-4xl bg-[#fdfcfc] border border-[#201d1d] shadow-2xl rounded-none flex flex-col max-h-[90dvh] overflow-hidden">

==== REPLACEMENT CODE (AFTER):
    <div
      id="deck-swap-drawer-backdrop"
      class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto font-mono"
      role="dialog"
      aria-modal="true"
      aria-labelledby="deck-swap-drawer-title"
    >
      <!-- Dedicated Drawer Backdrop Overlay -->
      <div
        id="deck-swap-backdrop"
        data-action="close-deck-swap-drawer"
        class="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity cursor-pointer"
      ></div>

      <div class="relative z-10 w-full max-w-4xl bg-[#fdfcfc] border border-[#201d1d] shadow-2xl rounded-none flex flex-col max-h-[90dvh] overflow-hidden">
>>>>
```

#### Target File 3 (Optional Safeguard in Browser Runtime): `src/landing/index.ts`
In `handleEventDelegation(event: Event)`, add direct ID checks before `closest()` traversal:
```typescript
<<<< TARGET CODE (BEFORE):
export function handleEventDelegation(event: Event): void {
  const target = (event.target as HTMLElement).closest('[data-nav], [data-modal], [data-action], a[href^="#"], a[href="/home"]');
  if (!target) return;

==== REPLACEMENT CODE (AFTER):
export function handleEventDelegation(event: Event): void {
  const rawTarget = event.target as HTMLElement;
  if (rawTarget?.id === 'home-card-inspect-modal' || rawTarget?.id === 'home-card-inspect-backdrop') {
    setInspectedHomeCardId(null);
    renderApp();
    return;
  }
  if (rawTarget?.id === 'deck-swap-drawer-backdrop' || rawTarget?.id === 'deck-swap-backdrop') {
    setEditingSlotIndex(null);
    renderApp();
    return;
  }

  const target = rawTarget.closest('[data-nav], [data-modal], [data-action], a[href^="#"], a[href="/home"]');
  if (!target) return;
>>>>
```

---

## 5. Verification Method

The remediation worker must execute this exact command sequence in order. All 7 test suites (256 total assertions), type check, and build must pass with 100% success.

### 5.1 Verification Checklist & Commands

```bash
# -----------------------------------------------------------------------------
# STEP 1: Verify the gate-failing suite (Must achieve 18/18 PASS 100.0%)
# -----------------------------------------------------------------------------
npx tsx tests/adversarial_m2_user_interaction.ts

# -----------------------------------------------------------------------------
# STEP 2: Verify existing Milestone 2 adversarial suites (Zero regressions)
# -----------------------------------------------------------------------------
npx tsx tests/adversarial_m2_home_deck.ts          # Must pass 28/28 (100.0%)
npx tsx tests/challenger_m2_adversarial.ts        # Must pass 30/30 (100.0%)
npx tsx tests/challenger_m2_deep_stress.ts        # Must pass 29/29 (100.0%)
npx tsx tests/e2e/run_all.ts --milestone M2       # Must pass 11/11 (100.0%)

# -----------------------------------------------------------------------------
# STEP 3: Verify core routing & build pipeline regression suites
# -----------------------------------------------------------------------------
npx tsx tests/adversarial_route_edge_cases.ts     # Must pass 76/76 (100.0%)
npx tsx tests/adversarial_m1_build_pipeline.ts    # Must pass 64/64 (100.0%)

# -----------------------------------------------------------------------------
# STEP 4: Verify type safety & production bundle build
# -----------------------------------------------------------------------------
npx tsc --noEmit                                  # Must exit code 0
npm run build                                     # Must exit code 0
```

### 5.2 Pass / Invalidation Criteria
- **Pass Criteria**:
  - `tests/adversarial_m2_user_interaction.ts`: 18/18 PASSED (0 failed). Both `[CH2.HOME.BACKDROP_CLICK]` and `[CH2.DECK.BACKDROP_CLICK]` report `✓ PASS`.
  - All existing suites pass 100%: 28 + 30 + 29 + 11 + 76 + 64 = 238 assertions pass with 0 failures.
  - `npx tsc --noEmit` and `npm run build` succeed with exit code 0.
- **Invalidation Conditions**:
  - Any failure in `CH2.HOME.INSIDE_CLICK_PRESERVED` (indicates `data-action` was wrongly placed on outer `#home-card-inspect-modal`).
  - Any failure in `ADV.TOUCH.ALL_INTERACTIVE` or `ADV.TOUCH.BORDER_RADIUS` in `tests/challenger_m2_adversarial.ts` (indicates backdrop missing `fixed inset-0` or using prohibited border-radius).
  - Any failure in `STRESS.DOM.HOME_INSPECT_MODAL` or `STRESS.DOM.DECK_SWAP_DRAWER` in `tests/challenger_m2_deep_stress.ts` (indicates `#home-card-inspect-modal` or `#deck-swap-drawer-backdrop` outer container IDs were altered).
