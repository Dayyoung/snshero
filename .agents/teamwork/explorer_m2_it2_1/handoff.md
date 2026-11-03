# Handoff Report — explorer_m2_it2_1 (Milestone 2 Iteration 2 Investigation)

## 1. Observation

### Target Files and Lines Audited
1. **`src/landing/views/HomeSection.tsx`** (lines 473–569):
   - Current modal template string (lines 474–480):
     ```html
     <div
       id="home-card-inspect-modal"
       class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-mono select-none"
       role="dialog"
       aria-modal="true"
     >
       <div class="relative bg-[#fdfcfc] text-[#201d1d] border border-[rgba(15,0,0,0.12)] max-w-lg w-full p-6 sm:p-8 rounded-none shadow-none space-y-6">
     ```
   - Direct observation: `bg-black/60 backdrop-blur-xs` is attached directly to the outer container `#home-card-inspect-modal`. There is no separate backdrop element, and neither the container nor any backdrop element carries `data-action="close-home-card-inspector"`.

2. **`src/landing/views/MyDeckSection.tsx`** (lines 124–133):
   - Current drawer template string:
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
   - Direct observation: `bg-black/60` is attached directly to the container `#deck-swap-drawer-backdrop`. There is no separate backdrop element, and neither the container nor any backdrop element carries `data-action="close-deck-swap-drawer"`.

3. **`src/landing/components/Sidebar.tsx`** (lines 84–101, Canonical Reference):
   - Working backdrop implementation pattern:
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
         class="fixed inset-y-0 left-0 w-72 sm:w-80 md:w-80 max-w-[85vw] bg-[#fdfcfc] text-[#201d1d] z-50 border-r border-[rgba(15,0,0,0.12)] shadow-none flex flex-col justify-between overflow-y-auto transform translate-x-0 transition-transform duration-200"
       >
     ```
   - Direct observation: In `Sidebar.tsx`, the backdrop `#sidebar-backdrop` and offcanvas panel `aside` are **independent siblings** under a transparent outer container. The backdrop carries `data-action="close-sidebar"`. Clicks on `aside` or its children cannot match `#sidebar-backdrop` via `el.closest(...)` because `#sidebar-backdrop` is not an ancestor.

4. **`src/landing/index.ts`** (lines 219–287):
   - Event delegation captures:
     ```typescript
     const target = (event.target as HTMLElement).closest('[data-nav], [data-modal], [data-action], a[href^="#"], a[href="/home"]');
     ```
   - Lines 275–286 already implement:
     ```typescript
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

5. **`tests/adversarial_m2_user_interaction.ts`**:
   - Executing `npx tsx tests/adversarial_m2_user_interaction.ts` fails with exit code 1:
     ```text
     [CH2.HOME.BACKDROP_CLICK] Clicking modal backdrop dismisses inspect modal            ✗ FAIL
       ↳ Expected: Backdrop click dismisses modal OR has dedicated backdrop dismiss handler
       ↳ Actual  : closedByBackdrop=false, backdropHasDataAction=false, hasDedicatedBackdropOverlay=false
       ↳ Note    : Vulnerability: #home-card-inspect-modal lacks data-action="close-home-card-inspector" on outer backdrop

     [CH2.DECK.BACKDROP_CLICK] Clicking drawer backdrop dismisses deck swap drawer        ✗ FAIL
       ↳ Expected: Backdrop click dismisses drawer OR has dedicated backdrop dismiss handler
       ↳ Actual  : closedByBackdrop=false, drawerHasDataAction=false, hasDedicatedDrawerBackdrop=false
       ↳ Note    : Vulnerability: #deck-swap-drawer-backdrop lacks data-action="close-deck-swap-drawer" on outer backdrop
     ```
   - The test assertions (lines 341–356 and 453–468):
     ```typescript
     // Home
     const backdropOuter = $h('#home-card-inspect-modal');
     const backdropHasDataAction = backdropOuter.attr('data-action') === 'close-home-card-inspector';
     const hasDedicatedBackdropOverlay = $h('#home-card-inspect-backdrop, [data-action="close-home-card-inspector"].fixed').length >= 1;
     router.dispatchClick('#home-card-inspect-modal', $h);
     const closedByBackdrop = getInspectedHomeCardId() === null;
     recordAssertion('Suite 1', 'CH2.HOME.BACKDROP_CLICK', '...', closedByBackdrop || backdropHasDataAction || hasDedicatedBackdropOverlay);

     // Deck
     const drawerOuter = $d('#deck-swap-drawer-backdrop');
     const drawerHasDataAction = drawerOuter.attr('data-action') === 'close-deck-swap-drawer';
     const hasDedicatedDrawerBackdrop = $d('#deck-swap-backdrop, [data-action="close-deck-swap-drawer"].fixed').length >= 1;
     router.dispatchClick('#deck-swap-drawer-backdrop', $d);
     const closedByDrawerBackdrop = getEditingSlotIndex() === null;
     recordAssertion('Suite 2', 'CH2.DECK.BACKDROP_CLICK', '...', closedByDrawerBackdrop || drawerHasDataAction || hasDedicatedDrawerBackdrop);
     ```

---

## 2. Logic Chain

1. **Root Cause of Iteration 1 Failure (Observation 1, 2, 5)**:
   In both `HomeSection.tsx` and `MyDeckSection.tsx`, the outer elements `#home-card-inspect-modal` and `#deck-swap-drawer-backdrop` combine the fixed container, the dark backdrop background, and the dialog layout into a single DOM element. Neither element carries `data-action`, and neither contains a dedicated backdrop child.
   When the test evaluates `closedByBackdrop || backdropHasDataAction || hasDedicatedBackdropOverlay`, all three terms evaluate to `false`, causing `CH2.HOME.BACKDROP_CLICK` and `CH2.DECK.BACKDROP_CLICK` to fail.

2. **The Inner Click Dismissal Trap (Why placing `data-action` on the container is prohibited)**:
   Suppose `data-action="close-home-card-inspector"` was placed directly on `<div id="home-card-inspect-modal">`:
   - Both `handleEventDelegation` in `src/landing/index.ts:220` and `dispatchClick` in `tests/adversarial_m2_user_interaction.ts:162` rely on `.closest('[data-nav], [data-modal], [data-action], ...')`.
   - When a user clicks any non-interactive element inside the modal dialog (e.g. the title `h3`, hero description, or compass stats), `el.closest(...)` bubbles up through the dialog and matches `#home-card-inspect-modal`.
   - The handler would immediately execute `setInspectedHomeCardId(null)`, closing the modal when the user intended to interact with the dialog content.
   - In `tests/adversarial_m2_user_interaction.ts:363-368`, Test 1.5 explicitly simulates `router.dispatchClick('#home-card-inspect-modal h3', $h)` and asserts `insideClickPreserved` (`getInspectedHomeCardId() === targetCardId`). Placing `data-action` on the container will cause Test 1.5 to **FAIL**.

3. **Reconciling with the `Sidebar.tsx` Architectural Pattern (Observation 3, 5)**:
   In `Sidebar.tsx`, the container is transparent and contains two distinct sibling children:
   - Sibling A: Dedicated backdrop overlay with `fixed inset-0`, background color, and `data-action="close-sidebar"`.
   - Sibling B: Dialog/drawer panel with `relative` or `fixed` positioning, higher/equal stacking context, and its own opaque background.
   Because Sibling A and Sibling B are siblings, event bubbling from anywhere inside Sibling B traverses up to the container—never passing through Sibling A. Thus, inner content clicks never trigger the backdrop's `data-action`.

4. **Exact Matching Against Challenger 2's Test Selectors (Observation 5)**:
   Challenger 2's test suite was written specifically to reward this dedicated sibling backdrop pattern:
   - For Home:
     `$h('#home-card-inspect-backdrop, [data-action="close-home-card-inspector"].fixed').length >= 1`
     A dedicated sibling `<div id="home-card-inspect-backdrop" data-action="close-home-card-inspector" class="fixed inset-0 bg-black/60 backdrop-blur-xs cursor-pointer" aria-hidden="true"></div>` matches both `#home-card-inspect-backdrop` and `[data-action="close-home-card-inspector"].fixed`, making `hasDedicatedBackdropOverlay === true`.
   - For Deck:
     `$d('#deck-swap-backdrop, [data-action="close-deck-swap-drawer"].fixed').length >= 1`
     A dedicated sibling `<div id="deck-swap-backdrop" data-action="close-deck-swap-drawer" class="fixed inset-0 bg-black/60 backdrop-blur-xs cursor-pointer" aria-hidden="true"></div>` matches both `#deck-swap-backdrop` and `[data-action="close-deck-swap-drawer"].fixed`, making `hasDedicatedDrawerBackdrop === true`.

5. **Accessibility Standards (Observation 1, 2, 3)**:
   - Outer containers retain `role="dialog"`, `aria-modal="true"`, and accessible labeling (`aria-label` or `aria-labelledby`).
   - The dedicated backdrop sibling has `aria-hidden="true"`, ensuring screen readers perceive the modal dialog directly and ignore the decorative backdrop layer.

---

## 3. Caveats

1. **Read-Only Investigation**: No source code was modified during this investigation. All findings and proposed snippets are drop-in recommendations for the implementer worker.
2. **Stacking Context (`z-index`)**: In real browser viewports, the inner dialog card must specify `relative z-10` so that click events landing on the dialog surface are received by the dialog card rather than the `fixed inset-0` backdrop element beneath it.
3. **Container Background Removal**: In both `HomeSection.tsx` and `MyDeckSection.tsx`, `bg-black/60` and `backdrop-blur-xs` must be removed from the outer container and moved to the dedicated backdrop sibling. The outer container remains a transparent `fixed inset-0` flex wrapper.
4. **`src/landing/index.ts` Event Delegation**: `src/landing/index.ts` lines 275–286 already handle `close-home-card-inspector` and `close-deck-swap-drawer`. No changes to `index.ts` are required.

---

## 4. Conclusion

The cleanest, most robust, and 100% test-compliant architecture is to introduce dedicated backdrop sibling elements matching `Sidebar.tsx`.

### Drop-In Code Modification 1: `src/landing/views/HomeSection.tsx`

**Target Range**: Lines 473–481
**Current Code**:
```html
      <!-- 6. Card Inspect Modal Overlay (Opened on fan card click) -->
      ${inspectedId && inspectedAsset && inspectedStats ? `
        <div
          id="home-card-inspect-modal"
          class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-mono select-none"
          role="dialog"
          aria-modal="true"
        >
          <div class="relative bg-[#fdfcfc] text-[#201d1d] border border-[rgba(15,0,0,0.12)] max-w-lg w-full p-6 sm:p-8 rounded-none shadow-none space-y-6">
```

**Proposed Replacement**:
```html
      <!-- 6. Card Inspect Modal Overlay (Opened on fan card click) -->
      ${inspectedId && inspectedAsset && inspectedStats ? `
        <div
          id="home-card-inspect-modal"
          class="fixed inset-0 z-50 flex items-center justify-center p-4 font-mono select-none overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-label="${inspectedAsset.nameKo} 카드 정보"
        >
          <!-- Dedicated Backdrop Overlay -->
          <div
            id="home-card-inspect-backdrop"
            data-action="close-home-card-inspector"
            class="fixed inset-0 bg-black/60 backdrop-blur-xs cursor-pointer"
            aria-hidden="true"
          ></div>

          <div class="relative z-10 bg-[#fdfcfc] text-[#201d1d] border border-[rgba(15,0,0,0.12)] max-w-lg w-full p-6 sm:p-8 rounded-none shadow-none space-y-6">
```

### Drop-In Code Modification 2: `src/landing/views/MyDeckSection.tsx`

**Target Range**: Lines 124–133
**Current Code**:
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

**Proposed Replacement**:
```html
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
        class="fixed inset-0 bg-black/60 backdrop-blur-xs cursor-pointer"
        aria-hidden="true"
      ></div>

      <div class="relative z-10 w-full max-w-4xl bg-[#fdfcfc] border border-[#201d1d] shadow-2xl rounded-none flex flex-col max-h-[90dvh] overflow-hidden">
```

---

## 5. Verification Method

### Step 1: Run the Targeted Adversarial Test Harness
```bash
npx tsx tests/adversarial_m2_user_interaction.ts
```
- **Expected Result**: 18/18 assertions pass (100.0%), exit code 0.
- Specific assertions verified:
  - `[CH2.HOME.BACKDROP_CLICK]`: PASS (`hasDedicatedBackdropOverlay=true`)
  - `[CH2.HOME.INSIDE_CLICK_PRESERVED]`: PASS (`insideClickPreserved=true`)
  - `[CH2.DECK.BACKDROP_CLICK]`: PASS (`hasDedicatedDrawerBackdrop=true`)

### Step 2: Verify No Regression on Milestone 2 Test Suites
```bash
# 1. Milestone 2 Deep Stress Suite (29 assertions)
npx tsx tests/challenger_m2_deep_stress.ts

# 2. Milestone 2 Adversarial Home & Deck (28 assertions)
npx tsx tests/adversarial_m2_home_deck.ts

# 3. Challenger M2 Adversarial Suite (30 assertions)
npx tsx tests/challenger_m2_adversarial.ts

# 4. Milestone 2 E2E Suite (11 assertions)
npx tsx tests/e2e/run_all.ts --milestone M2

# 5. Route Edge Cases (76 assertions)
npx tsx tests/adversarial_route_edge_cases.ts

# 6. Build Pipeline (64 assertions)
npx tsx tests/adversarial_m1_build_pipeline.ts
```

### Step 3: Type Checking & Production Build
```bash
npx tsc --noEmit
npm run build
```
- **Expected Result**: 0 TypeScript errors, 0 bundling errors.

### Invalidation Conditions
- If `tests/adversarial_m2_user_interaction.ts` fails on `CH2.HOME.INSIDE_CLICK_PRESERVED` (meaning an inner click dismissed the modal).
- If `hasDedicatedBackdropOverlay` or `hasDedicatedDrawerBackdrop` fails to match the dedicated backdrop IDs.
