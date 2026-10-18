# Handoff Report: Survey Explorer 2 (Economy, Social & Content Views)
**Author**: Survey Explorer 2  
**Milestone**: Full-Screen DESIGN.md Terminal-Flat Visual Unification Survey  
**Date**: 2026-10-18T10:20:00Z  
**Assigned Views**:
1. `src/views/ShopView.tsx` (Economy / Gacha / IAP / Crypto)
2. `src/views/CardMarketplaceView.tsx` (P2P Trading / Marketplace)
3. `src/views/NovelView.tsx` (40-Episode Web Novel & Webtoon Reader)
4. `src/views/MovieView.tsx` (40-Episode Cinematic Theater & MP4 Player)
5. `src/views/RankingView.tsx` (PvP / Leaderboard / Matchmaking)
6. `src/views/GuildListView.tsx` & `src/views/GuildDetailView.tsx` (Guild Social Hub)
7. `src/views/CommunityView.tsx` & `src/views/RedditCommunityView.tsx` (Community & Forums)

---

## 1. Observation

Direct code inspections, automated AST scans, and pattern audits were executed against all 9 assigned view files (totaling 20,226 lines of code) and related subcomponents.

### 1.1 Summary Matrix of Visual & Ergonomic Violations

| Target View | Lines | Banned Classes Total | Gradients (`bg-gradient-to-*`) | Radii Violations (`rounded-lg/xl/2xl/3xl/full`) | Drop Shadows (`shadow-*`) | Animations (`animate-ping/bounce/pulse`) | Non-Mono Fonts (`font-sans/serif`) | `<button>` Count | Sub-44px Buttons | Compliance Status |
|---|---|---|---|---|---|---|---|---|---|---|
| `ShopView.tsx` | 6,596 | **289** | 17 | 180 | 68 | 9 | 15 | 108 | 39 | ⚠️ Severe Legacy Violations |
| `CardMarketplaceView.tsx` | 1,766 | **0** | 0 | 0 | 0 | 0 | 0 | 34 | 13 | 🟡 Visual Compliant / Touch Target Deficit |
| `NovelView.tsx` | 2,298 | **0** | 0 | 0 | 0 | 0 | 0 | 57 | 8 | 🟡 Visual Compliant / Minor Touch Deficit |
| `MovieView.tsx` | 1,078 | **0** | 0 | 0 | 0 | 0 | 0 | 19 | 0 | 🟢 Fully Compliant (100% 44px+) |
| `RankingView.tsx` | 2,164 | **147** | 6 | 68 | 47 | 10 | 16 | 35 | 30 | ⚠️ Severe Legacy Violations |
| `GuildListView.tsx` | 579 | **54** | 1 | 31 | 21 | 0 | 1 | 17 | 17 | ⚠️ Severe Legacy Violations |
| `GuildDetailView.tsx` | 1,221 | **0** | 0 | 0 | 0 | 0 | 0 | 22 | 0 | 🟢 Fully Compliant (Exemplary) |
| `CommunityView.tsx` | 3,510 | **82** | 3 | 42 | 25 | 8 | 4 | 70 | 68 | ⚠️ Severe Legacy Violations |
| `RedditCommunityView.tsx` | 1,014 | **22** | 0 | 15 | 3 | 3 | 1 | 3 | 3 | ⚠️ Severe Legacy Violations (+ Subcomponents) |
| **Total** | **20,226** | **594** | **27** | **336** | **164** | **30** | **37** | **365** | **178** | **Overall: 594 Banned Tokens / 178 Sub-44px Controls** |

---

### 1.2 Target-by-Target Direct Observations & Verbatim Code Quotes

#### 1. `src/views/ShopView.tsx` (6,596 lines)
- **Banned CSS Tokens (289)**:
  - Multi-stop decorative gradients: `bg-gradient-to-r`, `bg-gradient-to-br` (17 occurrences, e.g., lines 3430–3433, 3545).
  - Banned radii: `rounded-lg` (37), `rounded-xl` (51), `rounded-2xl` (41), `rounded-3xl` (17), `rounded-full` (34).
    - Verbatim quote (line 6228):
      ```tsx
      <div key={order.orderId} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col gap-4">
      ```
    - Verbatim quote (line 3138):
      ```tsx
      <motion.div ... className="fixed bottom-24 left-1/2 z-[200] bg-black text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl shadow-2xl">
      ```
    - Verbatim quote (line 3152):
      ```tsx
      <motion.div ... className="fixed top-4 sm:top-8 left-1/2 -translate-x-1/2 z-[110] bg-red-600 text-white px-4 sm:px-6 py-3 rounded-lg shadow-xl ...">
      ```
  - Drop shadows: 68 occurrences (`shadow-sm`, `shadow-md`, `shadow-lg`, `shadow-xl`, `shadow-2xl`).
  - Distracting animations: `animate-ping` (line 5988), `animate-bounce` (lines 3370, 3376, 3485, 3491, 6530), `animate-pulse` (lines 2975, 3330, 3331).
  - Explicit non-mono typography: 15 occurrences of `font-sans` (lines 4923, 5145, 5208, 5423, 5522).
- **Interactive Touch Targets (< 44px)**:
  - 39 buttons lack `min-h-[44px]`.
  - Verbatim close button quotes:
    - Line 4882: `<button className="absolute top-4 right-4 p-1.5 hover:bg-slate-50 border border-slate-200 rounded-lg text-slate-400 hover:text-slate-600">`
    - Line 5020: `<button className="absolute top-4 right-4 p-1.5 hover:bg-slate-50 border border-slate-200 rounded-lg text-slate-400 hover:text-slate-600">`
    - Line 5153: `<button className="absolute top-4 right-4 p-1.5 hover:bg-slate-100 rounded-full text-slate-400 cursor-pointer">`
    - Line 5706: `<button className="mr-1 p-1 hover:bg-slate-100 rounded-lg text-slate-600 transition cursor-pointer">`
  - Action buttons:
    - Line 6456: `<button className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-lg active:scale-95">`
    - Line 6503: `<button className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-600 text-stone-900 font-bold text-xs rounded-lg">`
- **Data Persistence & LocalStorage**:
  - Keys: `hero_ad_removed`, `hero_auto_loop_card`, `hero_auto_loop_is_ranking`, `hero_auto_loop_mode`, `hero_current_steps`, `hero_deck`, `hero_dupe_mileage`, `hero_gacha_stamp_track_v1`, `hero_goods_pending_order`, `hero_goods_pending_payment`, `hero_inventory`, `hero_monthly_sns_limit`, `hero_monthly_sns_spent`, `hero_player_stamina`, `hero_sns`, `hero_sns_history`, `hero_steps_claimed_date`, `hero_today_claimed_steps`, `hero_user_sns`. 100% comply with `hero_*` prefix standard.

#### 2. `src/views/CardMarketplaceView.tsx` (1,766 lines)
- **Banned CSS Tokens (0)**:
  - Fully compliant palette: `bg-[#fdfcfc]`, `bg-[#f8f7f7]`, `bg-[#201d1d]`, `border-[rgba(15,0,0,0.12)]`.
  - Radii strictly restricted to `rounded-none` and `rounded-sm`. 0 instances of gradients, drop shadows, or pulse/bounce animations.
- **Interactive Touch Targets (< 44px)**:
  - 13 buttons lack `min-h-[44px]`.
  - Verbatim toast dismiss quotes:
    - Line 951: `<button onClick={() => setPriceAlertToast(null)} className="text-[#646262] hover:text-[#201d1d] font-black text-xs px-2 py-1 rounded-sm cursor-pointer">[x]</button>`
    - Line 967: `<button onClick={() => setViralShareNotice(null)} className="text-[#646262] hover:text-[#201d1d] font-black text-xs px-2 py-1 rounded-sm cursor-pointer">[x]</button>`
    - Line 987: `<button onClick={() => setGasRebateNotice(null)} className="text-emerald-800 hover:text-[#201d1d] font-black text-xs px-2 py-1 rounded-sm cursor-pointer">[x]</button>`
    - Line 1003: `<button onClick={() => setAutoBuySuccessMsg(null)} className="text-[#646262] hover:text-[#201d1d] font-black text-xs px-2 py-1 rounded-sm cursor-pointer">[x]</button>`
    - Line 1023: `<button onClick={() => setFirstTradeBonusToast(false)} className="text-[#646262] hover:text-[#201d1d] font-black text-xs px-2 py-1 rounded-sm cursor-pointer">[x]</button>`
  - Action buttons:
    - Line 1147: `min-h-[36px] text-[11px] font-bold text-[#646262] hover:text-[#201d1d] flex items-center gap-1` (36px < 44px)
    - Line 1156: `min-h-[36px] px-2 text-[10px] text-rose-700 font-bold hover:underline cursor-pointer` (36px < 44px)
    - Line 1546: `absolute top-3 right-3 min-h-[36px] px-2 rounded-sm border border-[rgba(15,0,0,0.12)] text-xs font-bold text-[#646262]` (36px < 44px)
- **Data Persistence**: `hero_market_first_trade_reward`, `hero_market_watchlist_v1`, `hero_offline_mode`, `hero_sns`, `hero_sns_points`.

#### 3. `src/views/NovelView.tsx` (2,298 lines)
- **Banned CSS Tokens (0)**:
  - 0 gradients, 0 rounded-lg/xl/2xl/3xl, 0 drop shadows, 0 bounce/ping animations.
  - Surface palette strictly adheres to `#fdfcfc`, `#f8f7f7`, `#201d1d`, `border-[rgba(15,0,0,0.12)]`.
- **Interactive Touch Targets (< 44px)**:
  - 8 buttons lack `min-h-[44px]`:
    - Line 1072: `<button onClick={() => setShowChapterDrawer(false)} className="text-stone-500 hover:text-stone-900 font-bold text-xs cursor-pointer">[X]</button>` (close button lacking 44px pad)
    - Line 1087: chapter drawer episode card buttons: `p-2 border rounded-sm text-left transition-all cursor-pointer flex flex-col justify-between` (height depends on text, can be ~34px)
    - Line 1269: prompt copy button in novel paragraph: `opacity-0 group-hover:opacity-100 transition-opacity p-1 text-[10px] text-[#646262]`
    - Line 1339: prompt mode inline toggle: `text-[10px] font-mono text-[#201d1d] hover:underline flex items-center gap-1 cursor-pointer`
    - Line 1521: search filter clear button `px-1.5 py-0.5 text-[10px]`
    - Line 1951: search input clear `[x]` button: `absolute right-2.5 top-1/2 -translate-y-1/2 text-[#646262]`
- **Zero Intrusion Verification**:
  - Webtoon panel card (`WebtoonPanelCard.tsx`), Speech bubbles (`WebtoonSpeechBubble.tsx`), and SFX overlays (`WebtoonSfxOverlay.tsx`) render within dedicated viewports without clipping or obscuring character faces.
  - Floating episode navigation dock (lines 2221–2287) uses fixed bottom docking (`z-40 max-w-[95vw] min-h-[44px]`) without blocking the reading flow.

#### 4. `src/views/MovieView.tsx` (1,078 lines)
- **Banned CSS Tokens (0)**:
  - 0 gradients, 0 rounded-lg/xl/2xl/3xl, 0 drop shadows, 0 bounce/ping animations.
- **Interactive Touch Targets (< 44px)**:
  - 0 violations! All 19 buttons in `MovieView.tsx` feature `min-h-[44px]` or `min-h-[64px]` (episode grid buttons at line 931 feature `min-h-[64px]`).
- **Embedded Component Audit (`CinematicMoviePlayer.tsx`)**:
  - Found 1 violation in `src/components/movie/CinematicMoviePlayer.tsx` line 687:
    `isFullscreen ? 'fixed inset-0 z-50 h-[100dvh] w-screen justify-between' : 'rounded-none border border-white/15 shadow-2xl'`
    Needs removal of `shadow-2xl`.

#### 5. `src/views/RankingView.tsx` (2,164 lines)
- **Banned CSS Tokens (147)**:
  - Multi-stop gradients: 6 occurrences (lines 1052, 1080, 1094, 1471, 1551).
    - Verbatim quote (line 1052):
      ```tsx
      <div className="mb-4 p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-400/30 backdrop-blur-xs flex flex-wrap items-center justify-between gap-3 shadow-md">
      ```
    - Verbatim quote (line 1080):
      ```tsx
      <button ... className="px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black rounded-xl text-xs shadow-md shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shrink-0">
      ```
    - Verbatim quote (line 1094):
      ```tsx
      <button onClick={handleRealTimePvp} className="sm:col-span-1 bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold py-3.5 px-3 rounded-none border border-red-500/40 shadow-xs ...">
      ```
  - Banned radii: `rounded-lg` (14), `rounded-xl` (17), `rounded-2xl` (10), `rounded-3xl` (12), `rounded-full` (15).
    - Verbatim quote (line 1447):
      ```tsx
      <motion.div ... className="bg-slate-950 border border-slate-800 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl relative z-10 font-sans flex flex-col max-h-[80vh] text-white">
      ```
  - Drop shadows: 47 occurrences (`shadow-md`, `shadow-sm`, `shadow-2xl`, `shadow-[0_0_15px_rgba(59,130,246,0.4)]`).
  - Animations: `animate-bounce` (lines 1473, 1640), `animate-pulse` (lines 1055, 1261, 1337, 1598, 1639).
  - Explicit non-mono typography: 16 occurrences of `font-sans` (lines 1011, 1131, 1170, 1190, 1229).
- **Interactive Touch Targets (< 44px)**:
  - 30 of 35 buttons lack `min-h-[44px]`.
  - Verbatim close button quotes:
    - Line 1016: `inline-flex min-h-9 min-w-9 items-center justify-center rounded-full border border-slate-300` (36px < 44px)
    - Line 1246: `p-1.5 rounded-lg active:scale-95 transition-all shrink-0 flex items-center justify-center cursor-pointer border`
    - Line 1458: `<button onClick={() => setShowHistoryModal(false)} className="text-white hover:text-red-400 transition-colors cursor-pointer">` (bare icon without minimum touch target)

#### 6. `src/views/GuildListView.tsx` & `src/views/GuildDetailView.tsx`
- **`GuildListView.tsx` (579 lines)**:
  - Banned tokens: 54 total (1 gradient at line 489, 14 `rounded-lg`, 3 `rounded-xl`, 9 `rounded-2xl`, 2 `rounded-3xl`, 3 `rounded-full`, 21 `shadow-*`, 1 `font-sans` at line 156).
  - Verbatim quotes:
    - Line 156: `<div className="min-h-screen app-bg text-slate-800 font-sans pb-32 overflow-x-hidden">`
    - Line 177: `<button onClick={() => onSelectGuild(userGuild.id, false)} className="w-10 h-10 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center justify-center transition-all active:scale-95 cursor-pointer shadow-sm">` (40px < 44px)
    - Line 409: `<div className="bg-white border border-slate-100 rounded-3xl p-6 w-full max-w-md shadow-2xl relative">`
    - Line 489: `<button type="submit" className="flex-1 bg-gradient-to-r from-yellow-450 to-amber-500 text-amber-950 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all active:scale-[0.98] shadow-lg shadow-yellow-200/40 cursor-pointer">`
  - 17 of 17 buttons fail 44px touch target requirement (`min-h-9 min-w-9`, `w-10 h-10`, `py-2.5 rounded-lg`).
- **`GuildDetailView.tsx` (1,221 lines)**:
  - Banned tokens: **0**!
  - Buttons: All 22 buttons strictly enforce `min-h-[44px]` or `min-h-[46px]`.
  - Exemplary terminal-flat implementation with solid `#fdfcfc` / `#201d1d` surfaces, `rounded-none` containers, `rounded-sm` buttons, and 44px+ touch targets on all modals and drawers.

#### 7. `src/views/CommunityView.tsx` & `src/views/RedditCommunityView.tsx`
- **`CommunityView.tsx` (3,510 lines)**:
  - Banned tokens: 82 total (3 gradients at lines 2555, 2564, 2604; 14 `rounded-lg`, 8 `rounded-xl`, 5 `rounded-2xl`, 3 `rounded-3xl`, 12 `rounded-full`, 25 `shadow-*`, 8 animations, 4 `font-sans` at lines 2587, 2590, 3177, 3257).
  - Verbatim quotes:
    - Line 2550: `"border border-slate-200/80 rounded-2xl sm:rounded-3xl overflow-hidden shadow-md"`
    - Line 2604: `bg-gradient-to-r ${cat.color} hover:opacity-95 shadow-lg shadow-indigo-200/40`
    - Line 3177: `<div className="w-full max-w-sm bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-2xl font-sans">`
    - Line 3439: `<button className="absolute top-4 right-4 p-1.5 hover:bg-slate-100 rounded-full text-slate-400">`
  - 68 of 70 buttons lack `min-h-[44px]` (most use `min-h-9`, `p-1.5`, `px-3 py-1.5 rounded-lg`).
- **`RedditCommunityView.tsx` (1,014 lines)**:
  - Root container explicitly defines `font-sans` at line 559:
    ```tsx
    <div className={`min-h-screen w-full max-w-full overflow-x-clip flex flex-col font-sans ...`}>
    ```
  - Banned tokens: 22 in main view (`rounded-2xl` lines 646, 700, 761, 888, 900, 922; `rounded-full` lines 651, 689, 708, 860, 868; `animate-pulse` lines 653, 656; `animate-ping` line 655).
  - 3 of 3 buttons in main view are sub-44px (`py-1 rounded-full`, `py-1.5 rounded-lg`, `py-2.5 rounded-full`).
  - Subcomponents in `src/components/reddit/*.tsx` (23 files) contain 286 additional banned tokens due to faithful replication of reddit.com round pill geometry (`rounded-full`, `rounded-2xl`, `shadow-sm`).

---

## 2. Logic Chain

1. **Premise 1: DESIGN.md is Canonical and Absolute**:
   - Section "Overview" and "Colors" in `DESIGN.md` mandate Berkeley Mono / `font-mono` exclusively across every text role, warm cream `#fdfcfc` canvas, ink `#201d1d` surfaces, 1px hairline borders (`border-[rgba(15,0,0,0.12)]`), 0px radius (`rounded-none`) on all containers, 4px radius (`rounded-sm`) on interactive elements, and zero decorative gradients, drop shadows, or bouncy animations.
2. **Premise 2: Mobile Ergonomics Mandates 44px+ Touch Targets**:
   - `ORIGINAL_REQUEST.md` (R3) and WCAG AA guidelines require all buttons, interactive tabs, pagination controls, and modal close buttons to measure at least 44px in physical height (`min-h-[44px] min-w-[44px]`).
3. **Inference from Observations**:
   - While `MovieView.tsx` (100% compliant) and `GuildDetailView.tsx` (100% compliant) fully satisfy both Premises 1 and 2, and `CardMarketplaceView.tsx` and `NovelView.tsx` satisfy Premise 1 (0 banned CSS tokens) but retain minor touch target omissions (<44px dismiss and inline buttons), the remaining views (`ShopView.tsx`, `RankingView.tsx`, `GuildListView.tsx`, `CommunityView.tsx`, and `RedditCommunityView.tsx`) violate both Premises with 594 banned token occurrences and 178 sub-44px interactive controls.
4. **Conclusion from Logic Chain**:
   - A prioritized, systematic transformation is required:
     - Immediate full-view refactor for the 5 heavy-violation targets (`ShopView`, `RankingView`, `GuildListView`, `CommunityView`, `RedditCommunityView`).
     - Surgical touch-target adjustments for `CardMarketplaceView` (13 buttons) and `NovelView` (8 buttons).
     - Light cosmetic fix for `CinematicMoviePlayer.tsx` (1 `shadow-2xl` removal) embedded in `MovieView`.
     - `GuildDetailView` serves as the gold-standard reference implementation.

---

## 3. Caveats

- **Scope Boundary**: This survey focuses exclusively on the 9 views specified in the dispatch. Other views (`HomeView`, `MobileCardPlayScreen`, `MyDeckView`, `PlayGameView`, `ProfileView`, etc.) were investigated by Explorer 1 and were excluded from this analysis.
- **`src/components/reddit/*` Subcomponents**: `RedditCommunityView.tsx` is an orchestration container that delegates rendering to 23 subcomponents under `src/components/reddit/`. While the main view has 22 violations, complete terminal-flat unification requires refactoring the subcomponents as well.
- **Third-Party Payment SDKs**: `ShopView.tsx` hosts `PayPalScriptProvider` and `PayPalButtons`. PayPal renders inside an iframe where external button styling is controlled by PayPal's SDK, but its enclosing containers, wrappers, fallback states, and custom modals must strictly conform to `rounded-none`, `border-[#0f0000]/12`, and `font-mono`.

---

## 4. Conclusion

1. **Architectural Health**:
   - All 9 views are dynamically loaded with zero bundle-time single-point-of-failure (SPOF) via `safeLazy` in `src/App.tsx`.
   - All LocalStorage keys strictly adhere to the `hero_*` naming convention and isolate season data properly.
   - TypeScript compilation (`npx tsc --noEmit`) passes with 0 errors across the entire application.
2. **Design Discrepancy Split**:
   - **Compliant Tier**: `MovieView.tsx` and `GuildDetailView.tsx` are 100% compliant with DESIGN.md terminal-flat styling and 44px+ touch targets.
   - **Near-Compliant Tier**: `CardMarketplaceView.tsx` (0 banned tokens, 13 sub-44px buttons) and `NovelView.tsx` (0 banned tokens, 8 sub-44px buttons).
   - **Legacy Violation Tier**: `ShopView.tsx` (289 banned tokens, 39 sub-44px buttons), `RankingView.tsx` (147 banned tokens, 30 sub-44px buttons), `CommunityView.tsx` (82 banned tokens, 68 sub-44px buttons), `GuildListView.tsx` (54 banned tokens, 17 sub-44px buttons), and `RedditCommunityView.tsx` (22 banned tokens, 3 sub-44px buttons + 286 in subcomponents).
3. **Actionable Roadmap**:
   - Provide concrete replacement patterns for each violation category.
   - Downstream implementers should use `GuildDetailView.tsx` as the canonical reference template.

---

## 5. Verification Method

To independently verify all findings and validate future implementations:

1. **Programmatic CSS Audit Command**:
   ```bash
   for file in src/views/ShopView.tsx src/views/CardMarketplaceView.tsx src/views/NovelView.tsx src/views/MovieView.tsx src/views/RankingView.tsx src/views/GuildListView.tsx src/views/GuildDetailView.tsx src/views/CommunityView.tsx src/views/RedditCommunityView.tsx; do
     echo "=== $file ==="
     echo "Gradients: $(rg -c 'bg-gradient-to-' "$file" || echo 0)"
     echo "rounded-lg: $(rg -c '\brounded-lg\b' "$file" || echo 0)"
     echo "rounded-xl: $(rg -c '\brounded-xl\b' "$file" || echo 0)"
     echo "rounded-2xl: $(rg -c '\brounded-2xl\b' "$file" || echo 0)"
     echo "rounded-3xl: $(rg -c '\brounded-3xl\b' "$file" || echo 0)"
     echo "rounded-full: $(rg -c '\brounded-full\b' "$file" || echo 0)"
     echo "shadows: $(rg -c '\bshadow-(sm|md|lg|xl|2xl|inner)\b' "$file" || echo 0)"
     echo "animate-ping/bounce/pulse: $(rg -c '\banimate-(ping|bounce|pulse)\b' "$file" || echo 0)"
     echo "font-sans/serif: $(rg -c '\bfont-(sans|serif)\b' "$file" || echo 0)"
   done
   ```
   *Expected Post-Fix Result*: Every counter must return `0`.

2. **Touch Target Verification Command**:
   Check for buttons lacking `min-h-[44px]`:
   ```bash
   python3 -c '
   import re, glob
   files = ["src/views/ShopView.tsx", "src/views/CardMarketplaceView.tsx", "src/views/NovelView.tsx", "src/views/MovieView.tsx", "src/views/RankingView.tsx", "src/views/GuildListView.tsx", "src/views/GuildDetailView.tsx", "src/views/CommunityView.tsx", "src/views/RedditCommunityView.tsx"]
   for f in files:
       with open(f) as fp: c = fp.read()
       sub = [m.group(0) for m in re.finditer(r"<button\b[^>]*>", c) if not any(k in m.group(0) for k in ["min-h-[44px]", "min-h-[46px]", "min-h-[48px]", "min-h-[64px]", "min-h-11", "min-h-12", "h-11", "h-12"])]
       print(f"{f}: {len(sub)} buttons lacking min-h 44px")
   '
   ```
   *Expected Post-Fix Result*: `0 buttons lacking min-h 44px` across all targets.

3. **TypeScript Build Verification**:
   ```bash
   npx tsc --noEmit
   npm run build
   ```
   *Pass Condition*: Exit code 0, 0 bundling errors.

---

## 6. Structured Feature Inventory List

| # | Feature Name | Target File | Current Violations | Recommended Design-Compliant Fix | Dependencies |
|---|---|---|---|---|---|
| **F-01** | **Gacha Pack & Mileage Shop** | `src/views/ShopView.tsx` | 289 banned classes (`rounded-3xl`, `bg-gradient-to-*`, `shadow-2xl`, `animate-bounce`), 39 sub-44px buttons | Replace all containers with `rounded-none border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc]`; replace buttons with `min-h-[44px] rounded-sm bg-[#201d1d] text-[#fdfcfc]`; remove bounce animations; enforce `font-mono`. | `src/lib/i18n.ts`, `CardItem.tsx` |
| **F-02** | **Crypto & Goods Checkout Modals** | `src/views/ShopView.tsx` | Modals styled with `rounded-2xl`, `rounded-3xl`, `shadow-2xl`, close buttons `p-1.5 rounded-full` (< 44px) | Unify all checkout dialogs into terminal-flat modal frames (`bg-[#fdfcfc] border border-[#201d1d] rounded-none`); add `min-h-[44px] min-w-[44px]` top-layer `[X]` buttons. | `TokenExchangeModal.tsx` |
| **F-03** | **P2P Marketplace Toast & Action Controls** | `src/views/CardMarketplaceView.tsx` | 13 interactive buttons lack `min-h-[44px]` (toasts dismiss `[x]` at lines 951–1023 use `px-2 py-1`, action buttons use `min-h-[36px]`) | Upgrade toast dismiss `[x]` to `min-h-[44px] min-w-[44px] flex items-center justify-center`; elevate `min-h-[36px]` buttons to `min-h-[44px]`. | `src/cardDatabase.ts` |
| **F-04** | **Novel & Webtoon Reader Chapter Drawer** | `src/views/NovelView.tsx` | Chapter drawer close `[X]` button (line 1072) and episode card items (line 1087) lack `min-h-[44px]`; prompt copy buttons (line 1269) lack 44px target | Add `min-h-[44px] min-w-[44px]` to drawer close button; set episode card buttons to `min-h-[48px] rounded-sm border border-[rgba(15,0,0,0.12)]`. | `webtoonEpisodeManifest.json`, `WebtoonPanelCard.tsx` |
| **F-05** | **Cinematic Movie Player Subtitle & Canvas** | `src/views/MovieView.tsx` & `CinematicMoviePlayer.tsx` | `CinematicMoviePlayer.tsx` line 687 has legacy `shadow-2xl` | Remove `shadow-2xl`; ensure canvas border sits flush on `border border-white/15 rounded-none`. | `MovieAudioSynthesizer.ts`, `movieEpisodeMapping.ts` |
| **F-06** | **Season Leaderboard & Matching Action Grid** | `src/views/RankingView.tsx` | 147 banned classes (`bg-gradient-to-r`, `rounded-2xl`, `rounded-3xl`, `shadow-md`, `font-sans`), 30 sub-44px buttons | Replace countdown banner with flat hairline box (`border border-[rgba(15,0,0,0.12)] bg-[#f8f7f7] rounded-none`); convert PvP buttons to solid terminal CTAs (`bg-[#201d1d] text-[#fdfcfc] min-h-[44px] rounded-sm`); eliminate `font-sans`. | `src/types.ts` |
| **F-07** | **Ranking History & Bluetooth/Wi-Fi Modals** | `src/views/RankingView.tsx` | Match history, Nearby search, and Insufficient SNS modals use `rounded-3xl`, `bg-slate-950`, `shadow-2xl`, with bare text close buttons | Refactor all modal frames to `rounded-none border border-[#201d1d] bg-[#fdfcfc]`; add prominent top-layer `[X]` button with `min-h-[44px] min-w-[44px]`. | None |
| **F-08** | **Guild Creation & List Management** | `src/views/GuildListView.tsx` | 54 banned classes (`rounded-3xl`, `bg-gradient-to-r`, `shadow-2xl`, `font-sans`), 17 sub-44px buttons | Align `GuildListView` with `GuildDetailView.tsx` standard: replace `font-sans` with `font-mono`; convert all action buttons to `min-h-[44px] rounded-sm`; flatten Create Guild modal (`rounded-none`, 1px hairline). | `GuildDetailView.tsx` (reference) |
| **F-09** | **Community Fan Events & Post Reactions** | `src/views/CommunityView.tsx` | 82 banned classes (`bg-gradient-to-r`, `rounded-2xl/3xl`, `shadow-md/2xl`, `animate-bounce/ping`, `font-sans`), 68 sub-44px buttons | Flatten Fan Events carousel cards into 1px hairline bordered blocks (`rounded-none bg-[#f8f7f7] border-[rgba(15,0,0,0.12)]`); upgrade all reaction/comment buttons to `min-h-[44px] rounded-sm`; remove bounce/ping animations. | `PageHeader.tsx` |
| **F-10** | **Reddit Community Shell & Subcomponents** | `src/views/RedditCommunityView.tsx` & `src/components/reddit/*` | 22 banned classes in main view + 286 in subcomponents; root container specifies `font-sans`; 3 sub-44px buttons | Replace root `font-sans` with `font-mono`; replace pill buttons (`rounded-full`) with `rounded-sm min-h-[44px]`; eliminate drop shadows across `src/components/reddit/*.tsx`. | `src/components/reddit/*` |
