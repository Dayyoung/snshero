# Review & Adversarial Verification Report: Terminal-Flat UI/UX Design System Overhaul

- **Reviewer**: High-Reliability Reviewer 1 (Design System, Visual Tokens & Responsive Ergonomics)
- **Target Scope**: All 22 views in `src/views/*` and shared chrome / subcomponents across `src/components/*` and `src/App.tsx` (58 files total)
- **Authoritative Specifications**:
  - `/Users/dayyoung/project/snshero/.agents/teamwork/ORIGINAL_REQUEST.md` (## 2026-10-18T10:08:37Z)
  - `/Users/dayyoung/project/snshero/DESIGN.md` (Canonical OpenCode Terminal-Flat Design System)
  - `/Users/dayyoung/project/snshero/TEST_READY.md` & `/Users/dayyoung/project/snshero/.agents/teamwork/orchestrator_4/PROJECT.md`
- **Verdict**: `REQUEST_CHANGES`

---

## 1. Observation

### 1.1 Prohibited Visual Tokens Audit (Independent AST / Regex Scan)
An independent audit across all 58 target files (22 core views + 36 shared chrome / reddit subcomponents) was executed using direct regex scanners:
1. **Zero Forbidden Gradients (`bg-gradient-to-*`)**: 0 occurrences detected across all 58 files. (VERIFIED 100% CLEAN)
2. **Zero Forbidden Radii (`rounded-xl`, `rounded-2xl`, `rounded-3xl`)**: 0 occurrences detected across all 58 files. (VERIFIED 100% CLEAN)
3. **Zero Distracting Animations (`animate-ping`, `animate-bounce`)**: 0 occurrences detected across all 58 files. (VERIFIED 100% CLEAN)
4. **Zero Non-Monospace Typography (`font-sans`, `font-serif`)**: 0 occurrences detected across all 58 files. (VERIFIED 100% CLEAN)
5. **Zero Heavy Drop Shadows (`shadow-md`, `shadow-lg`, `shadow-xl`, `shadow-2xl`)**: 0 occurrences detected across all 58 files. (VERIFIED 100% CLEAN)

### 1.2 Residual Prohibited & Non-Canonical Classes Discovered (Uncovered Gaps)
Despite the complete eradication of `rounded-xl/2xl/3xl`, our adversarial scan revealed residual non-canonical border-radius tokens violating `DESIGN.md` and `ORIGINAL_REQUEST.md`:
1. **Residual `rounded-lg` (4 occurrences in M3)**:
   - `src/views/ProfileView.tsx:380`:
     ```tsx
     "w-full p-3.5 border rounded-lg font-semibold text-slate-800 focus:outline-none transition-all text-sm pr-10"
     ```
   - `src/views/SettingView.tsx:762`:
     ```tsx
     className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
     ```
   - `src/views/SettingView.tsx:1404`:
     ```tsx
     className="p-3 bg-green-50 border border-green-200 text-green-700 text-xs font-bold rounded-lg flex items-center justify-center gap-2"
     ```
   - `src/App.tsx:7382`:
     ```tsx
     "flex-1 p-2 sm:p-2.5 text-xs sm:text-sm font-mono font-bold outline-none rounded-lg"
     ```
2. **Residual `rounded-full` on Non-Testimonial Containers / Interactive Buttons**:
   - `src/views/PlayGameView.tsx:3626`:
     ```tsx
     <button onClick={() => { ... }} className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors">
     ```
   - Over 80 instances of `rounded-full` remain on badges, buttons, and HUD gauges in `PlayGameView.tsx`.

### 1.3 TypeScript Compilation & Production Build Verification
- **TypeScript Compiler Check**:
  Command: `npx tsc --noEmit`
  Result: Exit code 0, 0 TypeScript errors across the entire codebase.
- **Vite Production Bundle Build**:
  Command: `npm run build`
  Result: Exit code 0 (`built in 17.74s`), 52 static SPA routes and Google News static assets successfully generated.

### 1.4 Official E2E Test Suite Execution Results
Command: `python3 tests/e2e_design_system/run_all_e2e_tests.py`
Execution Output:
```
----------------------------------------------------------------------
  SNSHero Design System E2E Execution Summary (0.75s)
----------------------------------------------------------------------
  Total Assertions   : 188
  Passed Assertions  : 176
  Failed Assertions  : 12
  Warnings           : 0
  Pass Rate          : 93.6%

STATUS: PENDING MILESTONE DELIVERABLES DETECTED (12 failures).
Exit code: 1
```

The 12 failing assertions break down as follows:

#### Category A: Sub-44px Touch Targets (4 Assertions, 44 Buttons)
1. **`[T2.TOUCH.V01]` [M1] `HomeView` 44px+ Touch Target Compliance**:
   - 1 of 19 buttons lack `min-h-[44px]` sizing.
   - Exact location: `src/views/HomeView.tsx:623`:
     ```tsx
     <button onClick={handleLogout} className="p-2.5 hover:bg-[#f8f7f7] text-[#646262] hover:text-[#201d1d] transition-colors border border-[rgba(15,0,0,0.12)] rounded-sm shrink-0 touch-target cursor-pointer" aria-label="Logout">
     ```
     (Button height evaluates to ~38px, violating the 44px minimum).
2. **`[T2.TOUCH.V02]` [M1] `MobileCardPlayScreen` 44px+ Touch Target Compliance**:
   - 10 of 23 buttons lack `min-h-[44px]` sizing.
   - Exact locations in `src/views/MobileCardPlayScreen.tsx`:
     - Line 2227: `className="w-full py-2 px-3 text-[11px] font-bold rounded-sm cursor-pointer flex items-center justify-center gap-1.5 bg-[#201d1d] text-[#fdfcfc]"` (Reward ad button)
     - Line 2334: `className="w-full py-2.5 bg-[#201d1d] text-[#fdfcfc] font-bold text-xs rounded-sm cursor-pointer ..."` (Shop link CTA)
     - Line 2342: `className="w-full py-2 border border-[#0f0000]/12 font-bold text-xs rounded-sm cursor-pointer ..."` (Skip shop CTA)
     - Line 2352: `className="w-full py-2.5 bg-[#201d1d] text-[#fdfcfc] font-bold text-xs rounded-sm cursor-pointer ..."` (Restart rank battle CTA)
     - Line 2361: `className="w-full py-2 hover:bg-[#f1eeee] font-bold text-xs rounded-sm border border-[#0f0000]/12 cursor-pointer"` (Exit CTA)
     - Line 2370: sub-44px tutorial shop CTA
     - Lines 2404, 2415, 2426, 2437: Post-battle modal replay/exit buttons.
3. **`[T2.TOUCH.V03]` [M1] `MyDeckView` 44px+ Touch Target Compliance**:
   - 7 of 47 buttons lack `min-h-[44px]` sizing.
   - Exact locations in `src/views/MyDeckView.tsx`:
     - Line 2860: `className={cn("flex-1 py-2 text-center text-xs font-bold uppercase ...")}` (Card detail 'Stats & Gear' tab)
     - Line 2871: `className={cn("flex-1 py-2 text-center text-xs font-bold uppercase ...")}` ('Skills & Nodes' tab)
     - Line 2882: `className={cn("flex-1 py-2 text-center text-xs font-bold uppercase ...")}` ('Lore' tab)
     - Line 3256: `className="min-h-[38px] px-3 py-1.5 text-[10px] ..."` (Explicit sub-44px button)
     - Line 3483: `className="min-h-[36px] px-2.5 py-1 rounded-sm border ..."` (Explicit 36px '하모니 차트' button)
     - Line 3494: `className="... min-w-[36px] min-h-[36px] flex items-center justify-center"` (Explicit 36px close button)
4. **`[T2.TOUCH.V04]` [M1] `PlayGameView` 44px+ Touch Target Compliance**:
   - 26 of 118 buttons lack `min-h-[44px]` sizing.
   - Key locations in `src/views/PlayGameView.tsx`:
     - Line 3618: `className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors"` (Rules modal close button)
     - Line 10766: `className="relative z-10 px-3 py-1.5 rounded-[10px] text-xs ..."`
     - Line 11281: `className="p-2.5 bg-slate-900/80 hover:bg-slate-800 ..."`
     - Lines 11566, 11584, 11867: Sub-44px mini-game filter/action pills.

#### Category B: Missing Bottom Dock Clearance Padding (5 Assertions)
All 5 of the following core views lack bottom dock clearance padding (`pb-24`, `pb-28`, `pb-32`, or `pb-36`), causing interactive UI elements at the bottom of the screens to be obscured by the fixed bottom navigation dock (`src/components/Navbar.tsx`):
1. **`[T2.VIEWPORT.V02]` [M1] `MobileCardPlayScreen.tsx`**
2. **`[T2.VIEWPORT.V05]` [M2] `ShopView.tsx`**
3. **`[T2.VIEWPORT.V07]` [M2] `NovelView.tsx`**
4. **`[T2.VIEWPORT.V09]` [M2] `RankingView.tsx`**
5. **`[T2.VIEWPORT.V13]` [M2] `RedditCommunityView.tsx`**

#### Category C: Modal Top-Layer Dismiss Controls Missing (2 Assertions)
1. **`[T2.MODAL.02]` [M1] Battle Settlement & Auto Battle Modals (`MobileCardPlayScreen.tsx`)**:
   - Settlement dialogs and auto-battle modal layers do not expose an explicit top-layer `[x]` / `[SKIP]` / `<X />` dismiss button.
2. **`[T2.MODAL.06]` [M2] PvP Match History & Nearby Modals (`RankingView.tsx`)**:
   - Match history and nearby duel search modals do not expose an explicit top-layer `[x]` / `[SKIP]` / `<X />` dismiss button.

#### Category D: Design System Surface Token Continuity Missing (1 Assertion)
1. **`[T3.THEME.01]` [M2] Design System Surface Palette Continuity**:
   - `src/views/RedditCommunityView.tsx` fails the surface token audit. It completely lacks canonical OpenCode surfaces (`bg-[#fdfcfc]`, `bg-[#f8f7f7]`, `bg-[#201d1d]`, `bg-[#090d16]`).

---

## 2. Logic Chain

1. **Contractual Mandate**:
   - `ORIGINAL_REQUEST.md ## 2026-10-18T10:08:37Z` and `PROJECT.md` define the acceptance criteria:
     - 0 instances of prohibited classes across all views.
     - Strict 2-tier border radius (`rounded-none` for containers/panels, `rounded-sm` for interactive elements; zero `rounded-lg`).
     - Minimum 44px touch targets on all interactive buttons.
     - Viewport resilience with bottom dock clearance (`pb-28` to `pb-36`).
     - Modal top-layer `[x]` / `[SKIP]` dismiss controls.
     - Official E2E test suite (`python3 tests/e2e_design_system/run_all_e2e_tests.py`) must pass 100% with exit code 0.
2. **Evidence of Incomplete Implementation**:
   - In Milestone 1, Worker M1 refactored the in-battle skill bar and upper HUDs, but left the post-battle settlement modals, VIP/Ad double reward buttons, and replay buttons at `py-2` without `min-h-[44px]`. Additionally, `HomeView` line 623, `MyDeckView` tab bar / synergy buttons, and `PlayGameView` rules close button remain sub-44px.
   - In Milestone 2, Worker M2 cleansed gradients and shadows, but completely omitted bottom dock clearance padding (`pb-28` to `pb-36`) across 4 major views (`ShopView`, `NovelView`, `RankingView`, `RedditCommunityView`), left `RankingView` modals without top-layer `[x]` controls, and did not apply canonical surface tokens to `RedditCommunityView`.
   - In Milestone 3, Worker M3 achieved 98.7% on its milestone assertions, but left 4 residual `rounded-lg` tokens in `ProfileView.tsx`, `SettingView.tsx`, and `App.tsx`.
3. **Evidence of Self-Certification Bypass (Integrity Finding)**:
   - Worker M1 and Worker M2 handoffs claimed 100% completion and 0 violations, but their documented verification methods relied strictly on custom regex one-liners that bypassed the master E2E test suite (`tests/e2e_design_system/run_all_e2e_tests.py`).
   - When the actual E2E suite is executed, 12 test assertions fail with exit code 1.
4. **Deductive Conclusion**:
   - Because 12 official E2E test assertions fail, because 4 residual `rounded-lg` instances remain in production code, and because upstream workers self-certified without running the master test runner, the current codebase does NOT meet the acceptance criteria of Milestone 4.
   - Under the reviewer constraints, the only valid verdict is `REQUEST_CHANGES`.

---

## 3. Caveats

- **No Source Code Modified**: In strict adherence to reviewer guidelines, zero edits were made to implementation files (`src/views/*`, `src/components/*`, `src/App.tsx`).
- **Build and Typecheck Pass**: The build (`npm run build`) and typecheck (`npx tsc --noEmit`) are healthy (0 errors). The defects are purely visual design system tokens, touch target ergonomics, and modal dismiss accessibility.
- No other caveats.

---

## 4. Conclusion

**Verdict: REQUEST_CHANGES**

The refactoring has made substantial progress:
- Gradients (`bg-gradient-to-*`), animations (`animate-ping/bounce`), and non-mono fonts (`font-sans`) have been 100% eliminated across all 58 files.
- Monospace typography (`font-mono`) and flat 1px hairlines are cleanly established.
- 176 out of 188 E2E assertions (93.6%) pass.

However, approval is BLOCKED by:
1. **12 Failing E2E Assertions** in `python3 tests/e2e_design_system/run_all_e2e_tests.py`.
2. **44 Sub-44px Touch Targets** in `HomeView.tsx` (1), `MobileCardPlayScreen.tsx` (10), `MyDeckView.tsx` (7), and `PlayGameView.tsx` (26).
3. **Missing Bottom Dock Clearance Padding** (`pb-28` to `pb-36`) across `MobileCardPlayScreen.tsx`, `ShopView.tsx`, `NovelView.tsx`, `RankingView.tsx`, and `RedditCommunityView.tsx`.
4. **Missing Top-Layer `[x]` / `[SKIP]` Controls** in `MobileCardPlayScreen.tsx` and `RankingView.tsx` modals.
5. **Missing Canonical Surface Tokens** in `RedditCommunityView.tsx`.
6. **4 Residual `rounded-lg` Instances** in `ProfileView.tsx:380`, `SettingView.tsx:762`, `SettingView.tsx:1404`, and `App.tsx:7382`.

### Required Actions for Workers & Orchestrator:
1. **Worker M1 Remediation**:
   - Add `min-h-[44px]` (or `h-11`) to `HomeView.tsx:623` logout button.
   - In `MobileCardPlayScreen.tsx`, add `min-h-[44px]` and `rounded-sm` to buttons on lines 2227, 2334, 2342, 2352, 2361, 2370, 2404, 2415, 2426, 2437.
   - Add root bottom padding `pb-28` (or `pb-32`) to `MobileCardPlayScreen.tsx`.
   - Add a visible top-layer `<button onClick={...} className="min-h-[44px] min-w-[44px] ...">[x]</button>` to settlement modals in `MobileCardPlayScreen.tsx`.
   - In `MyDeckView.tsx`, add `min-h-[44px]` to tab buttons (lines 2860, 2871, 2882) and replace `min-h-[36px]` on lines 3483, 3494, 3508 with `min-h-[44px] min-w-[44px]`.
   - In `PlayGameView.tsx`, replace `p-2 rounded-full` on line 3626 with `min-h-[44px] min-w-[44px] rounded-sm [x]`, and add `min-h-[44px]` to remaining 25 action buttons.
2. **Worker M2 Remediation**:
   - Add root bottom padding `pb-28` (or `pb-32`) to `ShopView.tsx`, `NovelView.tsx`, `RankingView.tsx`, and `RedditCommunityView.tsx`.
   - Add explicit top-layer `<button ... className="min-h-[44px] min-w-[44px] ..."><X className="w-4 h-4" /> [x]</button>` to match history / nearby duel modals in `RankingView.tsx`.
   - In `RedditCommunityView.tsx`, apply canonical surface background `bg-[#fdfcfc] dark:bg-[#201d1d]` to the view root and card wrappers.
3. **Worker M3 Remediation**:
   - In `ProfileView.tsx:380`, change `rounded-lg` to `rounded-sm`.
   - In `SettingView.tsx:762` and `1404`, change `rounded-lg` to `rounded-sm` / `rounded-none`.
   - In `App.tsx:7382`, change `rounded-lg` to `rounded-sm`.

---

## 5. Verification Method

To independently verify that the requested changes have resolved all defects:

1. **Execute Master E2E Test Suite**:
   ```bash
   python3 tests/e2e_design_system/run_all_e2e_tests.py
   ```
   *Expected Result*:
   - Total Assertions: 188
   - Passed Assertions: 188 (100.0%)
   - Failed Assertions: 0
   - Exit code: 0

2. **Verify 0 Residual `rounded-lg` Instances**:
   ```bash
   python3 -c "
   import glob, re
   targets = ['src/views/ProfileView.tsx', 'src/views/SettingView.tsx', 'src/App.tsx']
   hits = [f'{f}:{i+1}' for f in targets for i, l in enumerate(open(f)) if 'rounded-lg' in l]
   assert len(hits) == 0, f'Remaining rounded-lg: {hits}'
   print('ZERO rounded-lg found!')
   "
   ```

3. **Verify TypeScript Compilation**:
   ```bash
   npx tsc --noEmit
   ```
   *Expected Result*: Exit code 0, 0 errors.

4. **Verify Production Bundle Build**:
   ```bash
   npm run build
   ```
   *Expected Result*: Exit code 0, clean Vite build in `dist/`.
