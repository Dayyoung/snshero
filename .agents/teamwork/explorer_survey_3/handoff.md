# Handoff Report: Survey Explorer 3 (Progression, Systems, Codex & App Chrome)

- **Date**: 2026-10-18T10:20:00Z
- **Author**: Survey Explorer 3 (`explorer_survey_3`)
- **Working Directory**: `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_survey_3/`
- **Scope**:
  1. `src/views/ProfileView.tsx`
  2. `src/views/SettingView.tsx`
  3. `src/views/SeasonHubView.tsx`
  4. `src/views/CompanionView.tsx`
  5. `src/views/EventView.tsx`
  6. `src/views/StockMarketView.tsx`
  7. `src/views/PredictionMarketView.tsx`
  8. `src/views/WikiCardView.tsx`
  9. `src/views/WorldCodexView.tsx`
  10. `src/App.tsx` (top navigation, drawer menus, floating dock, modal containers)

---

## 1. Observation

Direct programmatic and manual audits were executed across the 10 assigned targets using automated regex parsers (`survey_analyzer.py`, `detail_auditor.py`, `touch_target_auditor.py`, `i18n_auditor.py`), `npx tsc --noEmit`, and `npm run build`.

### 1.1 Non-Compliance Summary by File

| Target File | Total Lines | Gradients (`bg-gradient-to-*`) | Rounded Violations (`lg/xl/2xl/3xl/full`) | Shadows (`shadow-*`) | Prohibited Animations (`ping/bounce`) | Non-Mono Fonts (`font-sans/serif`) | Sub-44px Touch Targets | LocalStorage Non-Compliant Keys |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `src/views/ProfileView.tsx` | 693 | 1 | 24 | 21 | 0 | 1 (`font-sans`) | 8 | 0 |
| `src/views/SettingView.tsx` | 2,322 | 5 | 82 | 51 | 4 (`animate-bounce`) | 2 (`font-sans`) | 0 (toggles contain min-h-11 wrappers) | 1 (`firebase_db_mode`) |
| `src/views/SeasonHubView.tsx` | 1,056 | 14 | 48 | 10 | 0 | 0 | 14 | 0 |
| `src/views/CompanionView.tsx` | 725 | 3 | 31 | 21 | 0 | 1 (`font-sans`) | 8 | 0 |
| `src/views/EventView.tsx` | 946 | 7 | 22 | 16 | 0 | 3 (`font-sans`) | 9 | 0 |
| `src/views/StockMarketView.tsx` | 1,629 | 0 | 0 | 0 | 0 | 0 | 1 (trade close button) | 0 |
| `src/views/PredictionMarketView.tsx` | 1,590 | 6 | 55 | 37 | 3 (`animate-bounce`) | 1 (`font-sans`) | 0 | 0 |
| `src/views/WikiCardView.tsx` | 1,042 | 1 | 23 | 12 | 0 | 1 (`font-sans`) | 2 | 0 |
| `src/views/WorldCodexView.tsx` | 450 | 0 | 5 | 1 | 0 | 0 | 8 | 0 |
| `src/App.tsx` (Chrome & Modals) | 8,343 | 17 | 93 | 71 | 13 (`ping`/`bounce`) | 10 (`font-sans`) | 4 (drawer header icons) | 1 (`snshero_audio_settings`) |
| **Total** | **18,796** | **54** | **383** | **240** | **20** | **19** | **54** | **2** |

---

### 1.2 Target-Specific Verbatim Observations

#### 1. `src/views/ProfileView.tsx`
- **Line 215**: Root element uses `font-sans`, `bg-slate-50/30`, and `text-slate-800`:
  ```tsx
  <div id="profile-info" className="p-4 md:p-8 pb-32 flex flex-col gap-6 max-w-4xl mx-auto min-h-screen bg-slate-50/30 text-slate-800 font-sans">
  ```
- **Line 222**: PageHeader rightAction help button is only 32x32px with `rounded-full`:
  ```tsx
  className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center hover:bg-slate-100 transition-colors"
  ```
- **Line 231**: Container `#profile-card` uses `rounded-lg shadow-sm`:
  ```tsx
  <div id="profile-card" className="bg-white border border-slate-100 rounded-lg p-5 sm:p-6 space-y-8 shadow-sm">
  ```
- **Line 233**: Profile preview card uses `rounded-3xl`, multi-stop gradient, and shadow:
  ```tsx
  <section className="space-y-4 rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-slate-50 p-5 shadow-sm">
  ```
- **Lines 234–237**: Avatar container uses `rounded-2xl`, emoticon badge uses `rounded-full shadow-md`.
- **Line 546**: Save profile button uses `rounded-lg shadow-md shadow-indigo-600/10`.
- **Lines 642–687**: Help modal container uses `rounded-2xl shadow-2xl`, and close/navigation buttons (Lines 657, 670, 681) use `w-8 h-8 rounded-full` (sub-44px touch targets).

#### 2. `src/views/SettingView.tsx`
- **Line 547**: Root container already enforces `bg-[#fdfcfc] text-[#201d1d] font-mono pb-32`.
- **Lines 687, 705**: Badges use `rounded-full` (`bg-rose-600 rounded-full`, `w-2 h-2 rounded-full`).
- **Lines 736, 741, 828, 833, 886, 891, 913, 918, 965, 970, 1038, 1064**: Toggle switches use `rounded-full` (`w-12 h-6 rounded-full`, inner knob `w-5 h-5 rounded-full shadow-sm`).
- **Lines 1117, 1421, 1442, 2088, 2178**: Five multi-stop gradients (`bg-gradient-to-br from-slate-500 to-slate-600`, `bg-gradient-to-r from-amber-400 to-orange-500 rounded-3xl`, etc.).
- **Lines 1222, 1228**: Non-mono fonts:
  ```tsx
  <p className="text-[10px] font-semibold leading-relaxed font-sans text-slate-650">{strat.pros}</p>
  ```
- **Lines 624, 1434, 1508, 2179**: Four `animate-bounce` instances (`<span className="text-xl animate-bounce">⚔️</span>`, `<AlertTriangle size={28} className="text-white animate-bounce" />`).
- **Line 2059**: Strategy Simulation modal uses `rounded-3xl shadow-2xl`, close button (Line 2069) is `p-2 hover:bg-slate-100 rounded-full`.
- **Line 2175**: Season Change modal uses `rounded-3xl shadow-2xl`, icon container (Line 2178) is `w-16 h-16 bg-gradient-to-br ... rounded-full animate-bounce`.
- **Line 2239**: Help modal uses `rounded-2xl shadow-2xl` and close button (Line 2243) is `p-1.5 rounded-full`.
- **LocalStorage**: `firebase_db_mode` (Line 1606, 1612) violates the `hero_*` naming rule.

#### 3. `src/views/SeasonHubView.tsx`
- **Lines 284–287**: Hero banner contains multi-stop gradients, heavy blurs, and circular decorative blobs:
  ```tsx
  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 p-5 sm:p-6 mb-4 border border-indigo-500/20 shadow-lg">
    <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-indigo-500/10 to-transparent rounded-full blur-2xl" />
    <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-purple-500/10 to-transparent rounded-full blur-xl" />
  ```
- **Line 301**: Banner help trigger button is only 28x28px:
  ```tsx
  className="w-7 h-7 rounded-full border border-white/30 flex items-center justify-center hover:bg-white/10 transition-colors"
  ```
- **Lines 313, 325, 328, 396, 443**: Badges, indicators, and progress bars use `rounded-full`.
- **Lines 479, 489, 497, 504, 511**: Season pass action buttons use `rounded-full` with sub-44px `min-h-10`:
  ```tsx
  className="inline-flex min-h-10 items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-white"
  ```
- **Line 993**: Help modal uses `rounded-2xl shadow-2xl` with sub-44px `w-8 h-8 rounded-full` navigation buttons.
- **Bottom Clearance**: Line 903 enforces `pb-36` (`overflow-y-auto px-4 pb-36`), properly clearing the bottom dock.

#### 4. `src/views/CompanionView.tsx`
- **Line 223**: Root container uses `font-sans`, `app-bg`, `text-slate-800`.
- **Line 231**: Header help button is `w-8 h-8 rounded-full` (32x32px).
- **Line 239**: Sub-tabs container uses `rounded-lg bg-stone-900 border border-stone-800`, inner tab buttons use `rounded-md py-1.5 shadow-sm` (< 44px).
- **Lines 299, 301**: Companion slot selector buttons use `w-10 h-10 rounded-lg shadow-xs`, active state uses `border-indigo-650 bg-gradient-to-tr from-indigo-600 to-violet-650 scale-105 shadow-md`.
- **Line 369**: Card summary panel uses `bg-gradient-to-r from-slate-900 to-slate-950 rounded-lg shadow-md`.
- **Modals**:
  - Line 458: Equipment management modal uses `rounded-lg shadow-2xl`.
  - Line 593: Upgrade success modal uses `rounded-3xl shadow-2xl`.
  - Line 623: Skill tree modal uses `md:rounded-3xl shadow-2xl`.
  - Line 663: Help modal uses `rounded-2xl shadow-2xl` with `w-8 h-8 rounded-full` buttons.

#### 5. `src/views/EventView.tsx`
- **Line 442**: Root container uses `font-sans`, `bg-slate-50/50`, `text-slate-800`.
- **Line 449**: Header help button is `w-7 h-7 rounded-full` (28x28px).
- **Line 462**: SNS balance header uses `rounded-2xl border bg-gradient-to-r from-amber-50 via-white to-purple-50 shadow-sm`.
- **Lines 476, 486**: Quick-link buttons use `rounded-full border`.
- **Lines 505, 561**: Event banner cards use `rounded-xl border-2 shadow-md hover:shadow-xl` with inner `bg-gradient-to-r from-[#120d1d]/95...`.
- **Modals**:
  - Line 809: Nine-slot event modal uses `rounded-3xl shadow-2xl font-sans`.
  - Line 812: Modal header uses `bg-gradient-to-r from-blue-600 to-indigo-600`.
  - Line 853: Help modal uses `rounded-2xl shadow-2xl` with `w-8 h-8 rounded-full` controls (Lines 862, 875, 886).
  - Line 915: Diorama modal uses `rounded-3xl shadow-2xl font-sans` with `bg-gradient-to-r` header (Line 917).

#### 6. `src/views/StockMarketView.tsx`
- **Design Compliance Status**: **Exemplary**.
- **Lines 1–1630**:
  - `bg-gradient`: 0 occurrences.
  - `rounded-*`: Only `rounded-none` and `rounded-sm`.
  - `shadow-*`: 0 occurrences.
  - `animate-ping` / `animate-bounce`: 0 occurrences.
  - Typography: 100% `font-mono`.
  - Modals (Lines 1258, 1553): Use `rounded-none border border-[#201d1d] bg-[#fdfcfc]` and ASCII `[x]` buttons.
- **Minor Improvement**:
  - Line 1269: Trading modal close button `className="text-[#fdfcfc] hover:opacity-80 text-xs font-bold px-2 py-1 border border-white/20 rounded-sm cursor-pointer shrink-0"` lacks `min-h-[44px] min-w-[44px]`.

#### 7. `src/views/PredictionMarketView.tsx`
- **Lines 644, 665, 674, 682, 743, 773**: Cards and filter chips use `rounded-lg shadow-sm`.
- **Lines 709, 718, 786, 801**: Betting option buttons use `rounded-2xl shadow-xs`.
- **Lines 751, 764**: Prediction card frames use `rounded-3xl shadow-md`.
- **Lines 1103, 1115, 1148, 1310, 1530, 1542**: Six multi-stop gradients across bet buttons and modal headers.
- **Lines 1498, 1531, 1566**: Three `animate-bounce` animations on gift icons.
- **Modals**:
  - Line 935: Market bet dialog uses `rounded-3xl shadow-2xl font-sans`.
  - Line 1144: Live match modal uses `rounded-3xl` with `bg-gradient-to-r` header.
  - Line 1306: Match history modal uses `rounded-3xl`.
  - Line 1423: Help popup uses `rounded-3xl`.

#### 8. `src/views/WikiCardView.tsx`
- **Line 530**: Root container uses `font-sans`:
  ```tsx
  <div className="min-h-screen app-bg text-slate-800 font-sans pb-32 overflow-x-hidden">
  ```
- **Line 535**: Top summary card uses `rounded-xl shadow-sm`.
- **Line 559**: Completion bar uses multi-stop gradient: `bg-gradient-to-r from-indigo-500 via-purple-500 to-amber-500 rounded-full`.
- **Lines 566–581, 710, 723, 823, 860, 867**: Filters, stat tiles, and card listing tiles use `rounded-lg shadow-sm`.
- **Line 654**: Header help button uses `w-8 h-8 rounded-full` (sub-44px).
- **Line 992**: Help modal uses `rounded-2xl shadow-2xl` with `p-1 rounded-full` close button (Line 1001).

#### 9. `src/views/WorldCodexView.tsx`
- **Line 170**: Root container has proper `pb-24` bottom clearance.
- **Lines 173, 175**: Header help button uses `h-8 w-8 rounded-full` (sub-44px).
- **Lines 192, 200**: Quick navigation buttons use `h-9` (sub-44px).
- **Line 393**: Help modal uses `rounded-3xl shadow-2xl`:
  ```tsx
  className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl"
  ```
- **Line 401**: Modal close button uses `flex h-8 w-8 items-center justify-center rounded-full border`.
- **Lines 415, 428, 437**: Modal pagination and close buttons use `rounded-lg py-1.5` (< 44px).

#### 10. `src/App.tsx` (App Chrome & Global Modals)
- **Top HUD Controls (Lines 6494, 6523, 6545)**: `#hud-audio-toggle`, Hamburger menu button, and `#global-header-back-btn` already conform to `min-h-11 min-w-11 rounded-sm`.
- **Hamburger Drawer Header (Lines 6594, 6608, 6619, 6629)**:
  - Settings button (Line 6594): `min-h-10 min-w-10 rounded-lg shadow-sm` (40px, rounded-lg).
  - Mall link (Line 6608): `p-2 rounded-lg shadow-sm` (sub-44px).
  - Wiki guide button (Line 6619): `w-9 h-9 rounded-lg shadow-sm` (36px).
  - Close button (Line 6629): `p-2 rounded-lg shadow-sm` (sub-44px).
- **Hamburger Drawer Items (Lines 6650–6806)**:
  - Line 6650: `bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl shadow-md font-sans`.
  - Line 6668: `rounded-xl font-sans bg-indigo-50/50 shadow-sm`.
  - Line 6671: `rounded-full` avatar frame.
  - Lines 6717, 6735, 6753, 6771, 6789: `font-sans rounded-xl shadow-xs`.
  - Line 6721: `bg-gradient-to-r from-orange-500 via-amber-500 to-rose-500`.
- **Global Chat Floating Window (Lines 7017–7025)**:
  - Desktop/Mobile modal wrapper: `md:rounded-3xl md:border md:border-slate-200/80 md:shadow-2xl`.
  - Header: `bg-gradient-to-r from-slate-900 to-slate-800`.
  - Line 7055: `bg-amber-400 animate-ping`.
  - Lines 7299–7301: `animate-bounce` on typing dots.
- **Global Reward & Onboarding Modals (Lines 7415–7620)**:
  - Line 7418: `<div className="text-4xl mb-4 animate-bounce">🎁</div>`.
  - Lines 7513, 7552, 7587, 7615: Multi-stop gradients (`bg-gradient-to-r from-blue-600 to-indigo-650`), `rounded-2xl`, `rounded-[20px]`, `shadow-[0_4px_25px_...]`.
  - Lines 7656, 7672, 7744, 7781: Four `animate-ping` radar/beacon pings.
  - Lines 7827, 7976, 8023, 8093: Four `animate-bounce` icon animations.
- **Bottom Navigation Dock (`src/components/Navbar.tsx`)**:
  - Lines 109–190: Conforms to `font-mono`, `bg-[var(--ui-canvas)]`, `min-h-11 h-full` (44px+), active indicator `rounded-sm bg-[#201d1d]`. Red dot indicator (Line 164) is `rounded-full h-2.5 w-2.5`.
- **LocalStorage Keys**:
  - `snshero_audio_settings` (Line 383, 386) violates `hero_*` rule.
- **Import Safety**:
  - All 10 assigned targets and views in `App.tsx` use `safeLazy` with named view fallbacks. Zero directory-index imports detected.

---

## 2. Logic Chain

1. **Premise 1 (`DESIGN.md` Canonical Spec)**:
   - Typography must be 100% Monospace (`font-mono`). Sans-serif faces (`font-sans`) are prohibited.
   - Geometry has strictly two tiers: `rounded-none` (`0px`) for all containers, cards, frames, and modals; `rounded-sm` (`4px`) maximum for interactive buttons, inputs, and badges. Legacy radii (`rounded-lg`, `rounded-xl`, `rounded-2xl`, `rounded-3xl`, and `rounded-full` on buttons/cards) are violations.
   - Surfaces must be solid Warm Cream (`#fdfcfc`, `#f8f7f7`, `#f1eeee`) and Ink Dark (`#201d1d`, `#302c2c`). Multi-stop gradients (`bg-gradient-to-*`), drop shadows (`shadow-*`), and distracting animations (`animate-ping`, `animate-bounce`) are strictly prohibited.
   - Touch targets must measure at least 44px (`min-h-[44px] min-w-[44px]`).
   - Modals must expose a top-layer `[x]` close or `[SKIP]` control.
   - All client persistence must use the `hero_*` key prefix.

2. **Deduction from Observations**:
   - `ProfileView.tsx`, `CompanionView.tsx`, `EventView.tsx`, and `WikiCardView.tsx` set `font-sans` on their root containers, violating Premise 1. Changing these to `font-mono` immediately brings typography into compliance.
   - Across 8 views and `App.tsx`, 383 instances of `rounded-lg/xl/2xl/3xl/full` and 240 instances of `shadow-*` exist. Modals and cards use `rounded-2xl` or `rounded-3xl` with `shadow-2xl`. Replacing container classes with `rounded-none border border-[rgba(15,0,0,0.12)] shadow-none` restores the terminal-flat hierarchy.
   - 54 instances of `bg-gradient-to-*` and 20 instances of `animate-ping` / `animate-bounce` were found in headers, banners, and buttons. Replacing them with flat Ink Dark (`bg-[#201d1d] text-[#fdfcfc]`) or flat Soft Surface (`bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)]`) eliminates visual clutter without breaking functionality.
   - 54 interactive elements (chiefly header action buttons `w-8 h-8 rounded-full` and modal close/pagination buttons) fail the 44px touch target threshold. Updating them to `min-h-[44px] min-w-[44px] rounded-sm inline-flex items-center justify-center` resolves mobile ergonomics issues.
   - `StockMarketView.tsx` demonstrates that a view can feature deep interactive trading while achieving 0 gradients, 0 shadows, 0 rounded violations, and 100% `font-mono`. It serves as the live project reference.
   - In `SettingView.tsx` (`firebase_db_mode`) and `App.tsx` (`snshero_audio_settings`), two localStorage keys fail the `hero_*` naming rule and must be aliased/migrated to `hero_firebase_db_mode` and `hero_audio_settings`.

3. **Synthesis**:
   - The refactoring task is purely visual and structural (class and layout replacement). All underlying business logic, state machines, and API handlers remain unchanged.

---

## 3. Caveats

1. **Third-Party Embedded Widgets**:
   - Google AdSense banners (`AdSenseBanner.tsx`) render external iframes whose internal styling is controlled by Google. Outer wrappers in `App.tsx` must enforce `rounded-none border border-slate-200 dark:border-slate-800`.
2. **Mini-Game Touch Canvases**:
   - Canvas-based games embedded in views (e.g. Diorama and Nine-Slot minigames in `EventView.tsx`) render pixels on HTML5 `<canvas>`. Only the modal chrome and trigger cards are in scope for HTML/Tailwind styling.
3. **LocalStorage Migration Safety**:
   - When renaming `snshero_audio_settings` and `firebase_db_mode`, implementers must provide backward-compatible fallback reads (`localStorage.getItem('hero_audio_settings') || localStorage.getItem('snshero_audio_settings')`) to prevent reset of existing user settings.

---

## 4. Conclusion

The 10 targets in Scope 3 require visual and ergonomics unification:
- **`StockMarketView.tsx`**: Fully compliant with DESIGN.md (0 gradients, 0 shadows, strict 2-tier radius, 100% mono). Only requires a 44px sizing fix on its trade modal close button.
- **`WorldCodexView.tsx`**: Nearly compliant; only requires replacing 5 rounded/shadow classes and sizing 8 buttons to 44px.
- **`ProfileView.tsx`, `CompanionView.tsx`, `EventView.tsx`, `WikiCardView.tsx`**: Require replacing `font-sans` with `font-mono` on their root wrappers, removing ~12 gradients, resetting container radii to `rounded-none`, and standardizing help modals.
- **`SettingView.tsx` & `PredictionMarketView.tsx`**: High violation counts (82 and 55 rounded violations; 51 and 37 shadows); toggle switches should be refactored to terminal-flat rectangular switches (`rounded-sm` or `[ON]` / `[OFF]`), and modals stripped of `rounded-3xl` and multi-stop gradients.
- **`App.tsx`**: Hamburger drawer, floating global chat, and onboarding/welcome modals contain 17 gradients, 93 rounded violations, 71 shadows, and 13 prohibited animations. Top HUD buttons are already 44px compliant; drawer action icons must be expanded from 36-40px to 44px.

---

## 5. Structured Feature Inventory

| ID | Feature Name | Target File | Current Violations | Recommended Design-Compliant Fix | Dependencies / Notes |
| :---: | :--- | :--- | :--- | :--- | :--- |
| **FEAT-301** | Profile Info & Showcase Card | `src/views/ProfileView.tsx` | Root `font-sans`; preview card `rounded-3xl bg-gradient-to-br shadow-sm`; avatar `rounded-2xl shadow-sm`; header help button `w-8 h-8 rounded-full` | Change root to `font-mono bg-[#fdfcfc] text-[#201d1d]`; card to `rounded-none border border-[rgba(15,0,0,0.12)] bg-[#f8f7f7] shadow-none`; help button to `min-w-[44px] min-h-[44px] rounded-sm` | `getCardAvatarStyle`, `MonsterPetBadge` |
| **FEAT-302** | Profile Help Modal | `src/views/ProfileView.tsx` | Modal container `rounded-2xl shadow-2xl`; close & pagination buttons `w-8 h-8 rounded-full` (< 44px) | Modal container `rounded-none border border-[#201d1d] bg-[#fdfcfc] shadow-none`; buttons `min-w-[44px] min-h-[44px] rounded-sm border text-xs` with `[x]` | `HELP_SLIDES` |
| **FEAT-303** | Settings Toggles & Sliders | `src/views/SettingView.tsx` | Toggles use `rounded-full` (82 instances) & `shadow-sm`; volume sliders use `rounded-lg` | Standardize toggles to `rounded-sm` flat switches or ASCII `[ON]` / `[OFF]`; slider tracks to `rounded-none border` | `useGameSettings` |
| **FEAT-304** | Strategy Simulator Modal | `src/views/SettingView.tsx` | Modal `rounded-3xl shadow-2xl`; CTA button `bg-gradient-to-r rounded-2xl shadow-lg`; close button `rounded-full` | Container `rounded-none border border-[#201d1d] shadow-none bg-[#fdfcfc]`; CTA button `button-primary` (`bg-[#201d1d] text-[#fdfcfc] rounded-sm min-h-[44px]`); close button `[x]` `min-h-[44px]` | `handleSimulate` |
| **FEAT-305** | Season Change Dialog | `src/views/SettingView.tsx` | Modal `rounded-3xl shadow-2xl`; icon `w-16 h-16 bg-gradient-to-br rounded-full animate-bounce`; action buttons `rounded-2xl` | Container `rounded-none border border-[#201d1d] shadow-none`; icon box `w-12 h-12 rounded-sm border border-[#201d1d] bg-[#f8f7f7] text-[#201d1d]` (no bounce); buttons `rounded-sm min-h-[44px]` | `localStorage.setItem('hero_current_season')` |
| **FEAT-306** | Settings Storage Key Migration | `src/views/SettingView.tsx` | Key `firebase_db_mode` lacks `hero_*` prefix | Migrate to `hero_firebase_db_mode` with fallback read from `firebase_db_mode` | `localStorage` |
| **FEAT-307** | Season Hub Hero Banner | `src/views/SeasonHubView.tsx` | Banner `rounded-2xl bg-gradient-to-br shadow-lg`; decorative blurred blobs `blur-2xl rounded-full`; help button `w-7 h-7 rounded-full` | Banner `rounded-none border border-[rgba(15,0,0,0.12)] bg-[#201d1d] text-[#fdfcfc] shadow-none`; remove decorative blur divs; help button `min-w-[44px] min-h-[44px] rounded-sm` | `config.titleKey` |
| **FEAT-308** | Season Pass Action Buttons | `src/views/SeasonHubView.tsx` | Action buttons use `rounded-full min-h-10` (< 44px) & `bg-gradient-to-r` | Convert to `min-h-[44px] rounded-sm px-4 py-2 text-xs font-mono border` (flat cream/ink) | `onNavigate` |
| **FEAT-309** | Companion Sub-Tabs & Slots | `src/views/CompanionView.tsx` | Root `font-sans`; sub-tabs `rounded-lg`; slot buttons `w-10 h-10 rounded-lg` (< 44px); active slot `bg-gradient-to-tr scale-105 shadow-md` | Change root to `font-mono`; sub-tabs to `rounded-none border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc]`; slots to `min-w-[44px] min-h-[44px] rounded-sm border bg-[#201d1d] text-[#fdfcfc]` | `selectedCompanionIndex` |
| **FEAT-310** | Companion Equipment & Skill Modals | `src/views/CompanionView.tsx` | Equipment modal `rounded-lg shadow-2xl`; skill modal `md:rounded-3xl shadow-2xl` | Convert containers to `rounded-none border border-[#201d1d] bg-[#fdfcfc] shadow-none`; ensure `[x]` close buttons have `min-h-[44px] min-w-[44px]` | `inventory`, `skills` |
| **FEAT-311** | Event Balance & Feature Banners | `src/views/EventView.tsx` | Root `font-sans`; balance card `rounded-2xl bg-gradient-to-r shadow-sm`; banners `rounded-xl border-2 shadow-md bg-gradient-to-r`; help button `w-7 h-7 rounded-full` | Root `font-mono`; balance card `rounded-none border border-[rgba(15,0,0,0.12)] bg-[#f8f7f7] shadow-none`; banners `rounded-none border border-[#201d1d] bg-[#fdfcfc]`; help button `min-w-[44px] min-h-[44px] rounded-sm` | `sns`, `minigames` |
| **FEAT-312** | Event Nine-Slot & Diorama Modals | `src/views/EventView.tsx` | Modal containers `rounded-3xl shadow-2xl font-sans`; modal headers `bg-gradient-to-r` | Containers `rounded-none border border-[#201d1d] bg-[#fdfcfc] shadow-none font-mono`; headers solid `bg-[#201d1d] text-[#fdfcfc]` with `[x]` | `HeroNineSlotModal`, `Diorama` |
| **FEAT-313** | Stock Market Trade Modal Close Touch Target | `src/views/StockMarketView.tsx` | Trade modal close button `px-2 py-1` lacks `min-h-[44px] min-w-[44px]` | Add `min-h-[44px] min-w-[44px] inline-flex items-center justify-center` | Already 100% terminal-flat |
| **FEAT-314** | Prediction Market Cards & Betting | `src/views/PredictionMarketView.tsx` | Cards `rounded-3xl shadow-md`; option buttons `rounded-2xl shadow-xs`; bet actions `bg-gradient-to-r`; gift icons `animate-bounce` | Cards `rounded-none border border-[rgba(15,0,0,0.12)] shadow-none bg-[#fdfcfc]`; buttons `rounded-sm min-h-[44px] border`; remove `animate-bounce` | `selectedMarket`, `odds` |
| **FEAT-315** | Prediction Market Modals | `src/views/PredictionMarketView.tsx` | Bet dialog `rounded-3xl shadow-2xl font-sans`; live match & history modals `rounded-3xl bg-gradient-to-r` | Convert all modal containers to `rounded-none border border-[#201d1d] bg-[#fdfcfc] shadow-none font-mono`; headers flat `bg-[#201d1d]` | `liveMatchModal`, `showHistoryModal` |
| **FEAT-316** | Wiki Card Explorer & Filters | `src/views/WikiCardView.tsx` | Root `font-sans`; filters & cards `rounded-lg shadow-sm`; progress bar `bg-gradient-to-r rounded-full`; help button `w-8 h-8 rounded-full` | Root `font-mono bg-[#fdfcfc] text-[#201d1d]`; filters & cards `rounded-none border border-[rgba(15,0,0,0.12)] shadow-none`; progress bar solid `bg-[#201d1d] rounded-none`; help button `min-w-[44px] min-h-[44px] rounded-sm` | `CARD_DATABASE`, `t()` |
| **FEAT-317** | World Codex Help & Detail Modal | `src/views/WorldCodexView.tsx` | Help modal `rounded-3xl shadow-2xl`; close button `h-8 w-8 rounded-full`; pagination buttons `rounded-lg py-1.5` (< 44px) | Modal `rounded-none border border-[#201d1d] bg-[#fdfcfc] shadow-none`; close button `[x]` `min-h-[44px] min-w-[44px] rounded-sm`; pagination `min-h-[44px] rounded-sm` | `helpSlides` |
| **FEAT-318** | App Chrome: Hamburger Drawer Header Controls | `src/App.tsx` | Drawer header icons (Settings, Mall, Wiki, Close) are `min-h-10 min-w-10 rounded-lg shadow-sm` or `w-9 h-9 rounded-lg` (< 44px) | Set `min-h-[44px] min-w-[44px] rounded-sm border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] text-[#201d1d] shadow-none flex items-center justify-center` | `setIsMenuOpen` |
| **FEAT-319** | App Chrome: Hamburger Drawer Menu Items | `src/App.tsx` | Menu buttons use `font-sans rounded-xl shadow-xs`, login card uses `bg-gradient-to-r rounded-xl shadow-md`, avatar uses `rounded-full` | Convert to `font-mono rounded-none border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] text-[#201d1d] shadow-none min-h-[44px]`; avatar frame `rounded-sm` | `handleLogin`, `setView` |
| **FEAT-320** | App Chrome: Global Floating Chat Window | `src/App.tsx` | Chat modal uses `md:rounded-3xl md:shadow-2xl`; header uses `bg-gradient-to-r`; beacon ping uses `animate-ping`; dots use `animate-bounce` | Container `rounded-none border border-[#201d1d] bg-[#090d16] text-[#fdfcfc] shadow-none`; header solid `bg-[#201d1d]`; replace `animate-ping` with static status chip; replace `animate-bounce` with subtle pulse or static typography | `isChatOpen`, `localAiStatus` |
| **FEAT-321** | App Chrome: Welcome & Gacha Reward Modals | `src/App.tsx` | Modals use `rounded-3xl/rounded-[20px]`, `shadow-2xl`, multi-stop gradients (`bg-gradient-to-r`), `animate-ping`, `animate-bounce` | Replace with canonical TUI modal: `rounded-none border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] shadow-none font-mono`; CTAs `button-primary` (`bg-[#201d1d] text-[#fdfcfc] rounded-sm min-h-[44px]`); replace animated icons with ASCII bracket tags | `isFirstVisit`, `gacha` |
| **FEAT-322** | App Storage Key Migration | `src/App.tsx` | Key `snshero_audio_settings` lacks `hero_*` prefix | Migrate to `hero_audio_settings` with fallback read | `audioSettingsStore` |

---

## 6. Verification Method

### 6.1 Programmatic Verification Commands

1. **TypeScript Type Safety**:
   ```bash
   npx tsc --noEmit
   ```
   *Expected result*: Exit code 0, 0 TypeScript errors.

2. **Production Bundle Verification**:
   ```bash
   npm run build
   ```
   *Expected result*: Exit code 0, all chunks packaged into `dist/`.

3. **Post-Implementation Zero-Violation Audit**:
   Run the following Python script to verify zero prohibited classes remain across the 10 target files:
   ```bash
   python3 -c "
   import re

   targets = [
       'src/views/ProfileView.tsx',
       'src/views/SettingView.tsx',
       'src/views/SeasonHubView.tsx',
       'src/views/CompanionView.tsx',
       'src/views/EventView.tsx',
       'src/views/StockMarketView.tsx',
       'src/views/PredictionMarketView.tsx',
       'src/views/WikiCardView.tsx',
       'src/views/WorldCodexView.tsx',
       'src/App.tsx'
   ]

   patterns = [
       ('gradient', re.compile(r'bg-gradient-to-[a-z]+')),
       ('rounded_violation', re.compile(r'\brounded-(xl|2xl|3xl)\b')),
       ('prohibited_anim', re.compile(r'\banimate-(ping|bounce)\b')),
   ]

   total_violations = 0
   for t in targets:
       with open(t, 'r', encoding='utf-8') as f:
           content = f.read()
       for name, pat in patterns:
           matches = pat.findall(content)
           if matches:
               print(f'FAIL: {t} contains {len(matches)} instances of {name}')
               total_violations += len(matches)

   if total_violations == 0:
       print('SUCCESS: 0 prohibited classes found in all 10 targets.')
   else:
       print(f'FAILURE: {total_violations} violations remain.')
       exit(1)
   "
   ```

4. **Touch Target Verification**:
   Run `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_survey_3/touch_target_auditor.py` to confirm 0 sub-44px interactive elements remain in target files.

### 6.2 Invalidation Conditions
- Any occurrence of `rounded-xl`, `rounded-2xl`, `rounded-3xl`, `bg-gradient-to-*`, `animate-ping`, or `animate-bounce` in target files invalidates compliance.
- Any `<button>` or interactive touch target with height < 44px without `min-h-[44px]` invalidates ergonomics compliance.
- Any new LocalStorage key added without the `hero_*` prefix invalidates persistence compliance.
