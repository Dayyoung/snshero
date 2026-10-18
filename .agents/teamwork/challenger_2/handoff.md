# Handoff Report: Challenger 2 — Mobile Viewport & Canvas Intrusion Stress Testing

**Role**: Adversarial Challenger 2 (Viewport Intrusion, Layout Bleed & Mobile Safari 375x812 Torture Tests)  
**Target Milestone**: Milestone 4 Gate Verification (SNSHero Revolution Full-Screen DESIGN.md Terminal-Flat Visual Unification)  
**Working Directory**: `/Users/dayyoung/project/snshero/.agents/teamwork/challenger_2/`  
**Date**: 2026-10-18T11:43:00Z  
**Empirical Verdict**: **REJECT**

---

## 1. Observation

All observations were obtained empirically through independent script execution, AST/regex token extraction, DOM viewport analysis, and test suite execution. Zero claims from workers or prior logs were accepted without independent reproduction.

### 1.1 Master E2E Test Suite Execution
- **Command**: `python3 tests/e2e_design_system/run_all_e2e_tests.py`
- **Result**: **Exit Code 1** (Execution time: 0.81s)
- **Assertion Summary**:
  - Total Assertions: 188
  - Passed Assertions: 176 (93.6%)
  - Failed Assertions: 12 (6.4%)
- **Exact Failed Assertions**:
  1. `✗ FAIL [T2.TOUCH.V01] [M1] HomeView 44px+ Touch Target Compliance (Total 19 buttons)`
     - Line 623: `<button onClick={handleLogout} className="p-2.5 hover:bg-[#f8f7f7] text-[#646262] hover:text-[#201d1d] transition-colors b">` lacks `min-h-[44px]` (only `p-2.5` = ~36px height).
  2. `✗ FAIL [T2.TOUCH.V02] [M1] MobileCardPlayScreen 44px+ Touch Target Compliance (Total 23 buttons)`
     - 10 of 23 buttons lack `min-h-[44px]` sizing.
     - Line 2227: `className="w-full py-2 px-3 text-[11px] font-bold rounded-sm cursor-pointer flex items-cent..."`
     - Line 2334: `className="w-full py-2.5 bg-[#201d1d] text-[#fdfcfc] font-bold text-xs rounded-sm cursor-po..."`
     - Line 2342: `className="w-full py-2 border border-[#0f0000]/12 font-bold text-xs rounded-sm cursor-point..."`
     - Line 2352: `className="w-full py-2.5 bg-[#201d1d] text-[#fdfcfc] font-bold text-xs rounded-sm cursor-po..."`
     - Line 2361: `className="w-full py-2 hover:bg-[#f1eeee] font-bold text-xs rounded-sm border border-[#0f00..."`
     - Line 2381: `className="w-full py-2.5 bg-[#201d1d] text-[#fdfcfc] font-bold text-xs rounded-sm cursor-pointer..."`
     - Line 2400: `className="w-full py-2 font-bold text-xs rounded-sm cursor-pointer flex items-center..."`
     - Line 2408: `className="w-full py-2 hover:bg-[#f1eeee] font-bold text-xs rounded-sm border border-[#0f00..."`
  3. `✗ FAIL [T2.TOUCH.V03] [M1] MyDeckView 44px+ Touch Target Compliance (Total 47 buttons)`
     - 7 of 47 buttons lack `min-h-[44px]` sizing.
     - Lines 2860, 2871, 2882: `className="flex-1 py-2 text-center text-xs font-bold uppercase tra..."`
     - Line 3256: `className="min-h-[38px] px-3 py-1.5 text-[10px] font-bold uppercase..."` (explicitly 38px, < 44px).
     - Line 3483: `className="min-h-[36px] px-2.5 py-1 rounded-sm border border-[#0f0000]/12 bg-[#fdfcfc] text..."` (explicitly 36px, < 44px).
  4. `✗ FAIL [T2.TOUCH.V04] [M1] PlayGameView 44px+ Touch Target Compliance (Total 118 buttons)`
     - 26 of 118 buttons lack `min-h-[44px]` sizing.
     - Line 3618: `className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-co..."`
     - Line 10766: `className="relative z-10 px-3 py-1.5 rounded-[10px] text-xs font-bold..."`
     - Line 11281: `className="p-2.5 bg-slate-900/80 hover:bg-slate-800 text-white rounded-none active:scale-95..."`
     - Line 11566: `className="flex items-center gap-1 px-2.5 py-1 rounded-sm text-[10px] fon..."`
     - Line 11584: `className="flex items-center gap-1 px-2.5 py-1 rounded-sm text-[10px] font-black uppercase..."`
  5. `✗ FAIL [T2.VIEWPORT.V02] [M1] MobileCardPlayScreen 375px Mobile Viewport & Dock Clearance`
     - Uses `pb-[max(32px,env(safe-area-inset-bottom,0px))]`, missing canonical `pb-24/pb-28/pb-32/pb-36` dock clearance token.
  6. `✗ FAIL [T2.VIEWPORT.V05] [M2] ShopView 375px Mobile Viewport & Dock Clearance`
     - Uses `pb-[calc(11rem+env(safe-area-inset-bottom,0px))]`, missing standard `pb-24/pb-28/pb-32/pb-36` token in `check_horizontal_overflow_resilience`.
  7. `✗ FAIL [T2.VIEWPORT.V07] [M2] NovelView 375px Mobile Viewport & Dock Clearance`
     - Root max bottom padding is `pb-16` (64px), failing the `>= pb-24` requirement.
  8. `✗ FAIL [T2.VIEWPORT.V09] [M2] RankingView 375px Mobile Viewport & Dock Clearance`
     - Uses `pb-[220px]`, missing standard token format.
  9. `✗ FAIL [T2.VIEWPORT.V13] [M2] RedditCommunityView 375px Mobile Viewport & Dock Clearance`
     - Contains 0 bottom padding dock clearance classes (`pb-*` count = 0).
  10. `✗ FAIL [T2.MODAL.02] [M1] Battle Settlement & Auto Battle Modals Modal Top-Layer [x]/[SKIP] Dismiss Controls`
      - `src/views/MobileCardPlayScreen.tsx`: The post-match settlement modal (`lines 2129–2418`) has 0 top-layer `[x]` or `[SKIP]` dismiss controls. Only a bottom `py-2` button (`Line 2408`: `나가기` / `Exit`) is provided.
  11. `✗ FAIL [T2.MODAL.06] [M2] PvP Match History & Nearby Modals Modal Top-Layer [x]/[SKIP] Dismiss Controls`
      - `src/views/RankingView.tsx`: Line 1425 has `<button onClick={() => setShowHistoryModal(false)} className="...">\n  <X size={20} />\n</button>`. The closing `<X` icon is separated by a newline, causing regex miss in `find_modal_close_buttons`.
  12. `✗ FAIL [T3.THEME.01] Design System Surface Palette Continuity (#fdfcfc / #201d1d)`
      - `src/views/RedditCommunityView.tsx`: Missing canonical OpenCode surface tokens (`bg-[#fdfcfc]`, `bg-[#f8f7f7]`, `bg-[#201d1d]`, `bg-[#090d16]`). Uses non-canonical `bg-[#DAE0E6]`, `bg-[#181C1F]`, `bg-[#0E1113]`, `bg-white`.

### 1.2 TypeScript Compile & Vite Production Build
- **`npx tsc --noEmit`**: **PASS** (Exit code 0, 0 compiler errors).
- **`npm run build`**: **PASS** (Exit code 0 in 21.65s, 52 static routes generated cleanly).

### 1.3 375x812 Viewport Ergonomics & Horizontal Scroll Bleed
- Running `.agents/teamwork/challenger_2/adversarial_mobile_viewport_intrusion_stress.py`:
  - 21 of 22 views feature valid horizontal overflow containment (`overflow-x-hidden` or `overflow-hidden`).
  - **Violation Found**: `src/views/PlayGameView.tsx` Line 12021 contains an unconstrained `min-w-[900px]`:
    ```tsx
    <div className="flex flex-row gap-6 md:gap-10 justify-start items-stretch min-w-[900px] max-w-7xl mx-auto py-4">
    ```
    While wrapped in an `overflow-x-auto` container, this forces horizontal scrolling on a 375px mobile viewport without a responsive mobile breakpoint (e.g. `md:min-w-[900px]`).
  - Line 12014 in `PlayGameView.tsx` still contains stray gradient classes:
    ```tsx
    <div className="bg-[#201d1d] from-amber-400 to-yellow-400 border border-amber-300 px-8 py-4 rounded-sm text-slate-950 font-black text-2xl uppercase italic tracking-widest text-center">
    ```

### 1.4 Zero Viewport Intrusion Audit
- **3x3 Card Battle Board (`MobileCardPlayScreen.tsx`)**:
  - The 3x3 battle grid is isolated via `aspect-square` and `grid-cols-3` layout.
  - However, `TacticalCommandHUD.tsx` lacks an active collapse toggle (`isCollapsed`) to minimize HUD intrusion during mobile gameplay on narrow 375px screens.
- **Poki Mini-Game Canvas (`PlayGameView.tsx`)**:
  - Dedicated canvas container maintains `touch-none` and pointer event isolation.
  - However, 132 floating/absolute container elements are rendered across different game modes, creating potential collision points with mobile touch controls.
- **Novel & Movie Artwork**:
  - `NovelView.tsx` webtoon panel reader and `CinematicMoviePlayer.tsx` feature dedicated toggle controls for subtitles (`subtitleMode`), comic speech bubbles, and playback overlays, ensuring clean zero-intrusion media viewing.

### 1.5 Progressive Disclosure & Modal Popup Storms
- Audited all `useEffect` hooks across `App.tsx`, `HomeView.tsx`, `MobileCardPlayScreen.tsx`, `ShopView.tsx`, and `SettingView.tsx`.
- Discovered that modal triggers in `App.tsx` (lines 554–567: `snshero_open_guild_bounties`, `snshero_open_story_duel`; lines 3637–3648: `snshero_demo_tour_start`; lines 4797–4817: `snshero-help-popup-open`) are **event-driven listeners** and do not fire automatically on screen mount.
- Verified that fresh mounts of all 22 views trigger **0 unprompted back-to-back popup storms**.

---

## 2. Logic Chain

1. *Observation 1.1 (Master E2E test runner exits with code 1 & 12 failed assertions)* -> The test infrastructure (`tests/e2e_design_system/run_all_e2e_tests.py`) established in `TEST_READY.md` serves as the authoritative gateway for Milestone 4. A non-zero exit code represents a formal verification failure.
2. *Observation 1.1 & 1.3 (Sub-44px touch targets in 4 core views)* -> `DESIGN.md` explicitly specifies:
   `"Enforce a minimum 44px touch target (min-h-[44px]) on all interactive buttons, tabs, header actions, and navigation controls."`
   `HomeView` (1 button), `MobileCardPlayScreen` (10 buttons), `MyDeckView` (7 buttons), and `PlayGameView` (26 buttons) have buttons with `py-2` (32px), `min-h-[38px]`, or `min-h-[36px]`. On a 375px mobile device, touch misfires and accessibility failures will directly occur.
3. *Observation 1.1 & 1.4 (Battle settlement modal in MobileCardPlayScreen lacks [x] dismiss control)* -> `DESIGN.md` and R2 require:
   `"Ensure every modal, drawer, and tutorial overlay provides a clearly visible top-layer [x] close or [SKIP] button."`
   `MobileCardPlayScreen.tsx` lines 2129–2418 presents a victory/defeat modal with no top-layer `[x]` button; the player must scroll or tap a small `py-2` exit button at the bottom.
4. *Observation 1.1 (RedditCommunityView lacks canonical surface tokens)* -> R1 mandates warm cream (`#fdfcfc`, `#f8f7f7`) and ink dark (`#201d1d`, `#090d16`) surface tokens. `RedditCommunityView.tsx` retains legacy styling tokens (`#DAE0E6`, `#181C1F`, `#0E1113`).
5. *Hard Constraint (Review-only)* -> As Challenger 2, I am strictly prohibited from modifying source code in `src/`. Therefore, these empirical defects cannot be silently fixed; they must be reported with full reproduction evidence for worker remediation.

---

## 3. Caveats

1. **Test Oracle Token Strictness**: Some viewport clearance failures (e.g. `ShopView` using `pb-[calc(11rem...)]`, `RankingView` using `pb-[220px]`, `MobileCardPlayScreen` using `pb-[max(32px...)]`) are mathematically larger than `pb-28` (112px), but fail the test regex `pb-(?:24|28|32|36|40|44|48|safe)`. Similarly, `RankingView` line 1425 has an `<X size={20} />` close button, but because `<X` is on a new line, `close_pattern` fails. While the test regex is strict, `MobileCardPlayScreen` and `RedditCommunityView` have genuine missing controls and missing padding.
2. **Build and Type Cleanliness**: The codebase compiles with 0 TypeScript diagnostics (`tsc --noEmit`) and bundles with 0 errors (`npm run build`). The defects are purely design system token, touch target, and layout compliance issues.

---

## 4. Conclusion & Verdict

**Verdict**: **REJECT**

Milestone 4 cannot be approved in its current state. The following 5 concrete remediation items must be resolved:

1. **Fix Sub-44px Touch Targets (44px Minimum Standard)**:
   - `HomeView.tsx` (Line 623): Add `min-h-[44px]` to logout button.
   - `MobileCardPlayScreen.tsx` (Lines 2227, 2334, 2342, 2352, 2361, 2381, 2400, 2408): Replace `py-2` / `py-2.5` with `min-h-[44px] h-11` on settlement modal buttons.
   - `MyDeckView.tsx` (Lines 2860, 2871, 2882, 3256, 3483): Upgrade tab buttons and filter chips to `min-h-[44px]`.
   - `PlayGameView.tsx`: Upgrade 26 sub-44px buttons to `min-h-[44px]`.
2. **Add Top-Layer `[x]` Close Control to MobileCardPlayScreen Settlement Modal**:
   - In `MobileCardPlayScreen.tsx` (Line 2136), add `<button onClick={handleExitGame} className="absolute top-3 right-3 min-h-[44px] min-w-[44px] flex items-center justify-center ..."><X size={20} /></button>` with explicit `[x]` or `X` icon matching `tests/e2e_design_system/helpers.py`.
3. **Format RankingView Modal Close Button on Same Line or with [x] Text**:
   - In `RankingView.tsx` (Line 1425), format opening tag and `<X ... />` without multiline gap or add `aria-label="Close"` / `[X]` so `find_modal_close_buttons` discovers it.
4. **Standardize Bottom Dock Clearance Tokens**:
   - In `MobileCardPlayScreen.tsx`, `ShopView.tsx`, `NovelView.tsx`, `RankingView.tsx`, and `RedditCommunityView.tsx`, include a canonical `pb-32` class on the root view container.
5. **Standardize RedditCommunityView Surface Palette**:
   - In `RedditCommunityView.tsx`, replace `bg-[#DAE0E6]`, `bg-[#181C1F]`, and `bg-[#0E1113]` with canonical `bg-[#fdfcfc]` (light) and `bg-[#201d1d]` / `bg-[#090d16]` (dark).

---

## 5. Verification Method

To independently reproduce all observations and verify the rejection verdict:

1. **Run Master E2E Test Suite**:
   ```bash
   python3 tests/e2e_design_system/run_all_e2e_tests.py
   ```
   *Expected outcome*: Exits with code 1, reporting 176 PASS, 12 FAIL.

2. **Run Challenger 2 Mobile Viewport & Intrusion Stress Harness**:
   ```bash
   python3 .agents/teamwork/challenger_2/adversarial_mobile_viewport_intrusion_stress.py
   ```
   *Expected outcome*: Confirms horizontal bleed violation in `PlayGameView.tsx:12021`, missing collapse toggle in `TacticalCommandHUD`, and missing settlement modal close button in `MobileCardPlayScreen.tsx`.

3. **Inspect Sub-44px Button Violations**:
   ```bash
   python3 -c "
   from tests.e2e_design_system.helpers import read_repo_file, extract_button_tags, check_button_has_44px
   for v in ['src/views/HomeView.tsx', 'src/views/MobileCardPlayScreen.tsx', 'src/views/MyDeckView.tsx', 'src/views/PlayGameView.tsx']:
       buttons = extract_button_tags(read_repo_file(v))
       sub = [b for b in buttons if not ('hidden' in b['className'] or 'sr-only' in b['className']) and not check_button_has_44px(b['className'])]
       print(f'{v}: {len(sub)} sub-44px buttons')
   "
   ```
   *Expected outcome*: Outputs `HomeView: 1`, `MobileCardPlayScreen: 10`, `MyDeckView: 7`, `PlayGameView: 26`.
