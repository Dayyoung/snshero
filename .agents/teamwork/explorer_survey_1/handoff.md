# Core Gameplay & Battle Screens Survey & Specification Report

**Survey Explorer**: Explorer Survey 1 (Core Gameplay & Battle Screens)  
**Date & Timestamp**: 2026-10-18T10:20:00Z  
**Parent Agent ID**: `3a464f6d-bcf9-4b99-af07-b0e05ceb817a`  
**Working Directory**: `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_survey_1/`  
**Reference Design System**: `DESIGN.md` (OpenCode Terminal-Flat Canonical Design System)  
**Assigned Scope**:
1. `src/views/HomeView.tsx`
2. `src/views/MobileCardPlayScreen.tsx`
3. `src/views/MyDeckView.tsx`
4. `src/views/PlayGameView.tsx`
5. `src/components/PageHeader.tsx` & Battle/Game HUD Overlays (`TacticalCommandHUD.tsx`, `TacticalSynergyMatrix.tsx`, `StarBreathingUltimateWidget.tsx`, `ElementalTempestWidget.tsx`, `MinimalistMissionHUD.tsx`, `ResponsiveCleanHUD.tsx`, `DemoPlayHUD.tsx`, `BattleBossHUD.tsx`, `MissionGameCardHUD.tsx`)

---

## 1. Observation

Direct, programmatic, and AST/regex inspection of the 5 assigned target files and associated HUD overlays yielded the following findings:

### 1.1 Summary Metric Matrix

| Target File | Total Lines | Forbidden Gradients (`bg-gradient-to-*`) | Forbidden Radii (`rounded-lg/xl/2xl/3xl`) | Pill/Circle Radius (`rounded-full`) | Heavy Shadows (`shadow-md/lg/xl/2xl`) | Distracting Animations (`ping/bounce/pulse`) | Non-Mono Fonts (`font-sans/serif`) | Buttons Lacking 44px+ (`min-h-[44px]`) |
|---|---|---|---|---|---|---|---|---|
| `src/views/HomeView.tsx` | 902 | 0 | 0 | 0 | 0 | 0 | 0 | 0 (main CTAs compliant; child modal spot fixes needed) |
| `src/views/MobileCardPlayScreen.tsx` | 2,728 | 0 | 1 (`rounded-b-lg`) | 3 | 1 (`shadow-sm`) | 3 (`animate-pulse`) | 0 | 5 key action buttons (Skills & LifeCycle toggle) |
| `src/views/MyDeckView.tsx` | 3,619 | 0 | 0 | 0 | 0 | 0 | 0 | 3 modal action buttons (sort & filter compliant) |
| `src/views/PlayGameView.tsx` | 18,648 | **68** | **248** (35 `3xl`, 72 `2xl`, 93 `xl`, 48 `lg`) | **112** | **134** (21 `2xl`, 18 `xl`, 54 `lg`, 41 `md`) | **134** (9 `ping`, 22 `bounce`, 103 `pulse`) | **40** (`font-sans`) | **70+** across modals, story scenes, and floating HUDs |
| `src/components/PageHeader.tsx` | 66 | 0 | 0 | 0 | 0 | 0 | 0 | 0 (100% compliant) |
| `src/components/battle/TacticalCommandHUD.tsx` | 739 | 0 | 0 | 0 | 0 | 0 | 0 | 2 (`claim pack` & minigame lounge link) |
| `src/components/battle/TacticalSynergyMatrix.tsx` | 182 | 0 | 0 | 0 | 0 | 1 (`animate-pulse`) | 0 | 1 (minimize toggle) |
| `src/components/battle/StarBreathingUltimateWidget.tsx` | 237 | 0 | 0 | 0 | **5** (1 `2xl`, 1 `xl`, 1 `lg`, 2 `sm`) | 0 | 0 | 4 (action button & modal triggers) |
| `src/components/battle/ElementalTempestWidget.tsx` | 178 | 0 | 0 | 0 | 1 (`shadow-xl`) | 0 | 0 | 0 (toggle & cast button compliant) |
| `src/components/MinimalistMissionHUD.tsx` | 410 | 0 | 0 | 0 | 1 (`shadow-2xl`) | 1 (`animate-pulse`) | 0 | 4 (Exit, Help, Pause, Settlement CTAs) |
| `src/components/ResponsiveCleanHUD.tsx` | 151 | 0 | 0 | 0 | 0 | 2 (`pulse`, `bounce`) | 0 | 3 (Exit, Pause, Help buttons) |
| `src/components/DemoPlayHUD.tsx` | 105 | 0 | 0 | 1 | 1 (`shadow-sm`) | 1 (`animate-pulse`) | 0 | 1 (Exit button `min-h-[30px]`) |
| `src/components/BattleBossHUD.tsx` | 132 | 0 | 0 | 0 | 1 (`shadow-md`) | 2 (`animate-pulse`) | 0 | 0 |
| `src/components/MissionGameCardHUD.tsx` | 68 | 0 | 0 | 1 | 1 (`shadow-md`) | 1 (`animate-pulse`) | 0 | 1 (Fever booster button) |
| `src/components/OpponentThreatHUD.tsx` | 46 | 0 | 0 | 0 | 0 | 0 | 0 | 0 (100% compliant) |
| `src/components/OpponentHandElementHUD.tsx` | 114 | 0 | 0 | 0 | 0 | 0 | 0 | 0 (100% compliant) |

---

### 1.2 Target-by-Target Specific Line Observations

#### A. Target 1: `src/views/HomeView.tsx` (902 lines)
1. **Visual Style & Geometry**:
   - `HomeView.tsx` has successfully transitioned to OpenCode terminal-flat styling (`bg-[#fdfcfc]`, `text-[#201d1d]`, `font-mono`, hairline borders `border-[rgba(15,0,0,0.12)]`).
   - Line 250: Main lobby card container uses `rounded-none border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc]`.
   - Line 255: Wordmark rendered as `S&SHERO.com` with monospace hierarchy.
   - Line 339: Primary Battle CTA is `min-h-[44px] rounded-sm bg-[#201d1d] text-[#fdfcfc] border border-[#201d1d]`.
2. **Touch Targets**:
   - Lines 357–397 (3 Core Secondary Actions: Deck, Shop, Rank): All enforce `min-h-[44px] px-2 py-2 rounded-sm border border-[rgba(15,0,0,0.12)] hover:bg-[#201d1d] hover:text-[#fdfcfc]`.
   - Lines 401–442 (3 Core IP Media Shortcuts: Novel, Webtoon, Movie): All enforce `min-h-[44px] px-2 py-2 rounded-sm`.
   - Line 268 & 293: Deck CP / Edit buttons enforce `min-h-11 rounded-sm`.
3. **Progressive Disclosure & Spatial Layout**:
   - The lobby separates high-frequency actions into two 3-column rows (lines 355, 400) and moves auxiliary tools into `HomeQuickHub` (line 445), preventing button congestion.
   - Modals rendered: `NotificationCenterModal`, `MailboxModal`, `NoticeModal`, `AfkPatrolModal`, `Milestone600CelebrationModal`, `PwaEventModal`, `HomeCategoryHubModal`.
   - Potential Issue: Back-to-back popup triggers upon page mount if local storage flags are absent.
4. **LocalStorage Keys**:
   - `hero_bgm`, `hero_sfx`, `hero_win_streak`, `hero_match_history`. All conform to `hero_*`.

#### B. Target 2: `src/views/MobileCardPlayScreen.tsx` (2,728 lines)
1. **Forbidden Classes**:
   - Line 2117: `TacticalCommandHUD` container has `rounded-b-lg border-x border-b border-white/10`. (`rounded-b-lg` is a direct violation of the 2-tier border radius rule).
   - Lines 1580, 1718, 2034: `<span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />` and `<span className="w-2 h-2 rounded-full bg-white inline-block animate-pulse" />`. (`rounded-full` and `animate-pulse` are non-compliant).
   - Line 2065: `border-blue-600 shadow-sm` on selected card in player hand. (`shadow-sm` is non-compliant).
2. **Touch Target Deficits (CRITICAL)**:
   - **Lines 1950–2023 (In-Battle Skill Action Bar)**:
     ```tsx
     1956: className={cn("min-w-0 px-1 rounded-sm border flex items-center justify-center gap-1 text-[11px] disabled:opacity-40", ...)}
     1976: className={cn("min-w-0 px-1 rounded-sm border flex items-center justify-center gap-1 text-[11px] disabled:opacity-40", ...)}
     1995: className={cn("min-w-0 px-1 rounded-sm border flex items-center justify-center gap-1 text-[11px] disabled:opacity-40", ...)}
     2012: className={cn("min-w-0 px-1 rounded-sm border flex items-center justify-center gap-1 text-[10px] font-bold", ...)}
     ```
     These 4 interactive buttons (Power Skill +2, Defense Shield, Element Burst +1, Auto Battle Toggle) measure approximately 24–28px in height, severely violating the mobile `min-h-[44px]` requirement.
   - **Lines 1657–1674 (Smart LifeCycle Toggle `[+]`/`[-]`)**:
     ```tsx
     1666: className={cn("px-2 rounded-sm text-[11px] font-bold border cursor-pointer", ...)}
     ```
     Measures ~24px height; fails `min-h-[44px]`.
3. **Progressive Disclosure & Playfield Clearance**:
   - 3x3 Battle Board (`#mobile-card-center-board`): Rendered in an aspect-square container (min 300px, sm 360px) with 9 flat cells.
   - Opponent Hand (`#mobile-card-opponent-deck`): Correctly provided with a collapsible accordion (`isOpponentDeckExpanded`, line 1705) defaulting to collapsed, saving 120px+ vertical viewport height.
   - Stacking Risk: On screens with height < 750px (e.g. mobile Safari with URL bar expanded), rendering Top Header + Ranking Divert HUD + Smart LifeCycle HUD + Opponent Deck Accordion + 3x3 Board + Skill Bar + Player Hand (footer) + TacticalSynergyMatrix + TacticalCommandHUD results in substantial vertical scroll creep.
4. **LocalStorage Keys**:
   - `hero_auto_battle`, `hero_auto_loop_mode`, `hero_auto_loop_is_ranking`, `hero_auto_loop_match_count`, `hero_sns`, `hero_user_sns`, `hero_user_diamonds`, `hero_tower_trials_floor_v1`, `hero_tower_titles_v1`, `hero_tower_costumes_v1`. (All compliant).

#### C. Target 3: `src/views/MyDeckView.tsx` (3,619 lines)
1. **Visual Style & Geometry**:
   - Thoroughly styled in OpenCode terminal-flat (`bg-[#fdfcfc]`, `text-[#201d1d]`, `font-mono`, hairline rules).
   - Zero gradients, zero `rounded-xl/2xl/3xl`, zero heavy shadows.
2. **Touch Targets**:
   - Line 1601: `min-w-11 min-h-11 rounded-sm` (Help button).
   - Line 1608: `min-h-24` (Deck Power Hero block).
   - Line 1632: `min-h-11` (Active deck dropdown).
   - Line 1647: `min-h-11` (Synergy trigger).
   - Lines 2157, 2169, 2176: Sort and 4-way direction buttons (`▲`, `▶`, `▼`, `◀`) all enforce `min-h-11 min-w-11`.
   - Sub-44px targets:
     - Line 2128: Checkbox `<input>` has `w-4 h-4 min-w-[20px] min-h-[20px]`, but outer `<label>` has `min-h-11` (Acceptable tap target).
     - Modal triggers in secondary popups (`CardCompareModal`, `CardDisassembleModal`, `CardCombineModal`) have several internal action buttons configured at `py-2 px-3` (~36px).
3. **Progressive Disclosure**:
   - `DeckCommandHub` (line 62, line 1640) consolidates 18+ auxiliary actions into 4 segmented categories (`ai`, `inventory`, `presets`, `codex`).
   - Detailed card sorting options are nested under `<details className="w-full min-w-0 rounded-none border ...">` (line 2134) with `min-h-11` summary trigger.
4. **LocalStorage Keys**:
   - `hero_deck`, `hero_deck_{season}`, `hero_deck_guest_{season}`, `hero_active_deck_preset_{season}`, `hero_deck_preset_{activeDeckPreset}_{season}`, `hero_deck_preset_name_{num}_{season}`, `hero_deck_preset_icon_{num}_{season}`, `hero_mydeck_viral_share_{date}`, `hero_user_avatar`, `hero_auto_loop_card`, `hero_auto_loop_mode`, `hero_auto_loop_is_ranking`. (All compliant).

#### D. Target 4: `src/views/PlayGameView.tsx` (18,648 lines)
1. **Massive Concentration of Legacy Non-Compliant Classes**:
   - `PlayGameView.tsx` contains 68 gradients, 248 forbidden border radii (`rounded-lg/xl/2xl/3xl`), 112 `rounded-full` pills/circles, 134 heavy shadows (`shadow-md/lg/xl/2xl`), 134 distracting animations (`animate-ping/bounce/pulse`), and 40 instances of `font-sans`.
   - **Cluster 1 (Lines 300–430: BossCardItem & MissionCharacterPortrait)**:
     - Line 313: `w-24 h-34 sm:w-28 sm:h-38 rounded-lg shadow-lg pointer-events-none transform group-hover:scale-105`
     - Line 359: `rounded-3xl border bg-slate-900 overflow-hidden shadow-xl`
     - Line 364: `bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 font-black text-xs px-3 py-1 rounded-full shadow-md z-10 animate-pulse`
     - Line 387: `ShieldAlert size={40} className="text-red-500 animate-bounce mb-2"`
     - Line 418: `rounded-xl transition-all cursor-pointer hover:scale-[1.02] shadow-md`
     - Line 421: `bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500`
   - **Cluster 2 (Lines 3530–3640: Legacy Modals & Cards)**:
     - Line 3538: `bg-slate-950 text-slate-100 w-full max-w-sm rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(99,102,241,0.2)]`
     - Line 3541: `bg-gradient-to-r from-indigo-950 to-slate-955 text-white border-b border-indigo-500/20`
     - Line 3542: `w-9 h-9 bg-indigo-500/10 rounded-xl`
     - Line 3571: `py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg`
     - Line 3611: `bg-slate-900 text-white rounded-3xl border border-slate-800 shadow-[0_20px_50px_rgba(0,0,0,0.5)]`
     - Line 3633: `space-y-3 bg-slate-950 p-4 rounded-2xl border border-indigo-500/20`
   - **Cluster 3 (Lines 10880–12240: Dungeon Battle, Results & GPS Mini-Game)**:
     - Line 10886: `rounded-3xl`
     - Line 10912: `rounded-xl`
     - Line 10978: `bg-slate-900 text-white w-full max-w-md rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)]`
     - Line 10982: `bg-gradient-to-r from-amber-400 to-yellow-400`
     - Line 11071: `bg-slate-900/90 backdrop-blur-xl border border-cyan-500/30 p-4 rounded-2xl shadow-[0_4px_24px_rgba(6,182,212,0.15)]`
     - Line 11077: `w-2 h-2 rounded-full bg-green-500 animate-ping`
     - Line 11089: `bg-gradient-to-r from-blue-400 to-cyan-400`
     - Line 11170: `animate-bounce`
     - Line 11176: `p-1 border border-slate-800 rounded-2xl group-hover:border-indigo-400 hover:shadow-lg transition-all transform active:scale-95 bg-slate-900 overflow-hidden w-12 h-12 flex items-center justify-center shadow-md`
     - Line 11354, 11372, 11390, 11408: `rounded-2xl`
     - Line 11433: `Bot size={20} className="text-red-400 animate-bounce"`
     - Line 11458: `w-4 h-4 border-2 border-yellow-400 rounded-full animate-ping`
     - Line 11664: `bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-2xl shadow-lg shadow-xl`
     - Line 11680: `rounded-3xl shadow-xl`
     - Line 11720: `bg-gradient-to-r from-red-600 to-rose-600 rounded-2xl shadow-lg shadow-xl`
     - Line 11770: `rounded-3xl overflow-hidden shadow-2xl`
     - Line 11772: `bg-gradient-to-r from-blue-600 to-indigo-600`
     - Line 11848: `bg-gradient-to-r from-amber-500 to-yellow-500 rounded-2xl shadow-lg`
     - Line 11873: `bg-gradient-to-r from-amber-400 via-orange-500 to-red-500`
     - Line 11875: `Trophy size={26} className="animate-bounce text-slate-950"`
     - Line 12145: `bg-gradient-to-r from-yellow-450 to-amber-500 text-amber-955 rounded-2xl shadow-lg`
     - Line 12166: `bg-slate-900 text-white w-full max-w-md max-h-[90dvh] rounded-3xl overflow-hidden shadow-2xl`
     - Line 12170: `bg-gradient-to-r from-yellow-450 to-amber-500`
     - Line 12198: `animate-bounce`
   - **Cluster 4 (Lines 13250–15050: Modals, Overlays, Floating Controls & Versus Matchup)**:
     - Line 13258: `max-w-sm bg-[#1a1414] border-2 border-amber-400 p-4 shadow-2xl`
     - Line 13261: `w-16 h-16 rounded-full bg-gradient-to-tr from-amber-600 via-yellow-400 to-amber-200 shadow-lg animate-bounce`
     - Line 13432: `rounded-2xl shadow-2xl border`
     - Line 13665: `w-full rounded-sm border p-3 sm:p-4 text-white font-mono flex items-center justify-between gap-3 shadow-md`
     - Line 14116: `rounded-3xl overflow-hidden shadow-2xl`
     - Line 14118: `bg-gradient-to-r from-amber-500 to-yellow-600`
     - Line 14136: `animate-bounce`
     - Line 14139: `rounded-xl`
     - Line 14268: `rounded-xl shadow-lg`
     - Line 14325: `rounded-3xl shadow-2xl`
     - Line 14331: `rounded-3xl`
     - Line 14334: `rounded-full shadow-md`
     - Line 14357, 14365, 14397, 14419: `rounded-2xl`
     - Line 14467: `rounded-xl`
     - Line 14488: `bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 rounded-2xl`
     - Line 14502: `rounded-2xl`
     - Line 14532: `rounded-3xl shadow-[0_0_50px_rgba(99,102,241,0.2)]`
     - Line 14534: `bg-gradient-to-r from-indigo-955 to-slate-955`
     - Line 14539: `p-2 rounded-full`
     - Line 14544: `font-sans`
     - Line 14553, 14571: `rounded-xl`
     - Line 14593: `py-3.5 bg-indigo-650 hover:bg-indigo-550 text-white rounded-2xl font-bold uppercase tracking-wider transition-all active:scale-95 shadow-lg shadow-indigo-600/20`
     - Line 14613: `bg-slate-900/90 backdrop-blur-xl border border-cyan-500/30 p-4 rounded-2xl shadow-[0_4px_24px_rgba(6,182,212,0.15)] text-white space-y-4 font-sans`
     - Line 14619: `w-2 h-2 rounded-full bg-green-500 animate-ping`
     - Line 14631: `bg-gradient-to-r from-blue-400 to-cyan-400`
     - Line 14648: `rounded-xl`
     - Line 14655: `rounded-full shadow-lg`
     - Line 14676: `bg-amber-500 text-white px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full shadow-lg shadow-amber-500/20 animate-pulse`
     - Line 14688: `bg-slate-900/90 backdrop-blur-md border border-slate-800 p-3 rounded-2xl text-slate-100 font-sans text-[10px] space-y-2 shadow-xl min-w-[140px] pointer-events-auto`
     - Line 14712: `rounded-lg shadow-sm`
     - Line 14774: `rounded-lg shadow-[0_4px_15px_rgba(0,0,0,0.4)]`
     - Line 14790: `rounded-2xl shadow-lg shadow-md`
     - Line 14852: `rounded-2xl animate-bounce-subtle shadow-lg`
     - Line 14871: `shadow-md`
     - Line 14921: `rounded-2xl`
     - Line 14927, 14952: `bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900`
     - Line 14936, 14961: `rounded-2xl shadow-lg`
     - Line 14978: `bg-gradient-to-r drop-shadow-[0_0_15px_rgba(255,255,255,0.6)]`
     - Line 14996: `animate-ping`
   - **Cluster 5 (Lines 15140–15360: Floating Battle Overlays & Skill Controls)**:
     - Line 15134–15136: `border-8 rounded-full animate-roar-ripple`
     - Line 15182: `px-2.5 py-1.5 rounded-sm border font-mono text-[11px] font-black shadow-lg transition-all cursor-pointer flex items-center gap-1 active:scale-95 shadow-[0_0_12px_rgba(244,63,94,0.6)] animate-pulse`
     - Line 15211: `w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 shadow-2xl flex items-center justify-center transition-all duration-300 active:scale-95 cursor-pointer touch-target relative bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 border-amber-300 text-slate-950 shadow-[0_0_25px_rgba(245,158,11,0.85)] ring-2 ring-amber-300/80`
     - Line 15223: `animate-spin drop-shadow-md`
     - Line 15228: `rounded-full border shadow-md animate-pulse`
     - Line 15238: `backdrop-blur-md rounded-md shadow-xl`
     - Line 15316: `w-10 h-10 sm:w-11 sm:h-11 rounded-full border-2 border-gray-600 bg-gray-800 text-gray-400 flex items-center justify-center font-black text-xs shadow-lg`
     - Line 15324: `w-10 h-10 sm:w-11 sm:h-11 rounded-full border-2 shadow-lg flex items-center justify-center transition-all active:scale-95 cursor-pointer bg-black/90`
     - Line 15358: `bg-slate-950/90 border border-amber-500/30 backdrop-blur-md text-amber-400 p-4 rounded-2xl shadow-[0_0_30px_rgba(245,158,11,0.15)] flex items-center justify-between gap-4 font-sans`
     - Line 15360: `w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold animate-pulse text-base`
2. **Touch Target Deficits in PlayGameView.tsx**:
   - `BossCardItem` button (line 411): `py-3` with no `min-h-[44px]`.
   - Story dialogue buttons (lines 11582, 11596): `px-2.5 py-1 text-[10px]` (~24px height).
   - Demo auto-match buttons (lines 13624, 13638): `min-h-[38px] px-3 py-1.5` and `min-h-[38px] px-2.5 py-1.5` (sub-44px).
   - Close button in feedback banner (line 13688): `p-1 text-white/70 rounded-xs` (~24px tap area).
   - Card play list action badge (line 14002): `min-h-[32px] px-2.5 py-1`.
   - Grid skills buttons in battle (line 15320): `w-10 h-10 sm:w-11 sm:h-11` (on mobile, 40px diameter fails 44px minimum).
3. **Progressive Disclosure in PlayGameView.tsx**:
   - In `gameState === 'modeSelect'` (lines 13570–14010):
     - The view renders:
       1. Top PageHeader + Help modal trigger.
       2. Daily missions component.
       3. CODEX HUD with collection percentage progress bar.
       4. Hot Target (recommended unowned card) banner with 1-tap battle CTA.
       5. Random 1:1 battle button.
       6. 6-element filter bar + unowned only toggle.
       7. Real-time search bar.
       8. Grid of 110 Guardian missions.
     - Layout hierarchy is clean and responsive, but legacy modals attached to this state need conversion to solid warm cream/ink dark flat surfaces.
   - In `gameState === 'playing'` (lines 15115–15400):
     - Floating robot auto-battle and grid skills panel at lines 15143–15345 obstructs active canvas on narrow viewports; requires conversion to a collapsible dock or bottom bar.

#### E. Target 5: Shared Chrome & Battle HUD Overlays
1. **`src/components/PageHeader.tsx` (66 lines)**:
   - Line 25: `sticky top-0 z-50 w-full min-w-0 px-3 pb-2.5 sm:px-4 sm:pb-3 pt-[calc(env(safe-area-inset-top,0px)+0.625rem)] flex items-center justify-between gap-3 shrink-0 bg-[var(--ui-canvas)] border-b border-[var(--ui-line)] font-mono text-[var(--ui-ink)]`
   - Line 36: Back button `min-h-11 min-w-11 h-11 px-3 rounded-sm border flex items-center gap-1.5 text-xs font-mono font-bold uppercase transition-colors cursor-pointer select-none`
   - **Assessment**: 100% compliant with `DESIGN.md`.
2. **`src/components/battle/TacticalCommandHUD.tsx` (739 lines)**:
   - Command grid buttons (ASSAULT, COUNTER, SYNERGY) on lines 580, 612, 644 all have `min-h-[44px] rounded-sm font-mono`.
   - Sub-44px targets:
     - Line 556: `claimDailyOverridePack` button `px-1.5 py-0.5 text-[10px]` (~22px height).
     - Line 568: `onOpenMinigameLounge` link `text-[10px]`.
3. **`src/components/battle/StarBreathingUltimateWidget.tsx` (237 lines)**:
   - Non-compliant classes:
     - Line 60: `shadow-xl`.
     - Line 104: `shadow-lg backdrop-blur-xs`.
     - Line 147: `shadow-sm`.
     - Line 163: `shadow-xl`.
     - Line 177: `shadow-2xl`.
   - Touch targets:
     - Line 143: `handleCast` button is `py-1.5 px-2 text-xs` (~32px height, fails `min-h-[44px]`).
     - Line 183: Modal close button `[x]` is `p-1 rounded-sm`.
     - Line 223: Confirm button is `w-full py-2 bg-stone-900 text-xs`.
4. **`src/components/battle/ElementalTempestWidget.tsx` (178 lines)**:
   - Line 60: `shadow-xl` (Non-compliant).
   - Line 82: Collapse toggle is `min-h-[44px] min-w-[44px]` (Complies).
   - Line 153: Spell cast button is `min-h-[44px] px-2.5 py-1` (Complies).
5. **`src/components/MinimalistMissionHUD.tsx` (410 lines)**:
   - Header is `h-11` (44px), but:
     - Line 257: Exit button is `px-2 py-1 text-[10px]`.
     - Lines 296, 304: Help & Pause buttons are `w-7 h-7` (28px height).
     - Line 318: Settlement modal has `shadow-2xl`.
     - Lines 384, 394: Continue and Exit CTAs are `py-2.5 px-3` (~36px height).
6. **`src/components/ResponsiveCleanHUD.tsx` (151 lines)**:
   - Line 55: Exit button is `px-2 py-1 text-[11px]`.
   - Lines 117, 127: Pause and Mute buttons are `p-1`.
   - Line 139: Help button is `px-1.5 py-1 text-[10px]`.
   - Line 97: `animate-bounce` on combo multiplier.
7. **`src/components/DemoPlayHUD.tsx` (105 lines)**:
   - Line 56: `shadow-sm`.
   - Line 64: `rounded-full bg-emerald-400 animate-pulse`.
   - Line 95: Exit button is `min-h-[30px] min-w-[70px]` (fails `min-h-[44px]`).

---

## 2. Logic Chain

1. **Premise 1 (DESIGN.md Canonical Rules)**:
   - All text roles must use monospaced typography (`font-mono`).
   - Border radius has strictly two tiers: `rounded-none` (0px) for containers/modals/panels/cards/racks, and `rounded-sm` (4px maximum) for interactive buttons/inputs/badges. `rounded-full` is restricted exclusively to circular avatars in testimonials.
   - Decorative drop shadows (`shadow-md`, `shadow-lg`, `shadow-xl`, `shadow-2xl`) and decorative multi-stop gradients (`bg-gradient-to-*`) are prohibited. Surfaces must be flat solid Warm Cream (`#fdfcfc`, `#f8f7f7`, `#f1eeee`) or Ink Dark (`#201d1d`, `#302c2c`, `#0e0c0c`) bordered by 1px hairlines (`border-[rgba(15,0,0,0.12)]`, `border-[#201d1d]`, `border-stone-800`).
   - Distracting animations (`animate-ping`, `animate-bounce`) are prohibited.
   - Interactive touch targets must guarantee `min-h-[44px]` (or `h-11` / `44px+` equivalent) for one-hand mobile ergonomics.
   - Progressive disclosure requires grouping high-density buttons into segmented tabs, accordions, or modal hubs to eliminate viewport intrusion over active gameplay boards (3x3 grid, hand, mini-game canvas).

2. **Premise 2 (Status of Target Views)**:
   - `HomeView.tsx` and `PageHeader.tsx` have already undergone substantial terminal-flat refactoring and demonstrate compliant design patterns, proving the viability of the OpenCode design system in the codebase.
   - `MobileCardPlayScreen.tsx` has achieved terminal-flat compliance on its main 3x3 board and opponent accordion, but its critical in-battle skill bar (lines 1950–2023) and LifeCycle toggle (lines 1657–1674) suffer from sub-44px touch targets (~24–28px), and line 2117 retains a legacy `rounded-b-lg` class.
   - `MyDeckView.tsx` enforces terminal-flat geometry and 44px+ touch targets on all top-level tools, sort buttons, and deck racks, requiring only minor button height upgrades inside secondary modal bodies.
   - `PlayGameView.tsx` (18,648 lines) is the epicenter of legacy technical debt. While the lobby and 110-mission card list (`gameState === 'modeSelect'`) have been partially adapted to terminal-flat style, the file houses 68 gradients, 248 forbidden border radii, 134 heavy drop shadows, 134 animations, 40 `font-sans` declarations, and numerous sub-44px buttons across legacy dungeon, GPS, story boss, and floating HUD overlays.
   - Several shared battle HUDs (`StarBreathingUltimateWidget`, `ElementalTempestWidget`, `MinimalistMissionHUD`, `ResponsiveCleanHUD`, `DemoPlayHUD`, `BattleBossHUD`) harbor residual `shadow-xl/2xl`, `rounded-full`, and sub-44px action buttons.

3. **Deduction & Action Plan**:
   - To achieve full compliance with `ORIGINAL_REQUEST.md ## 2026-10-18T10:08:37Z`, the transformation must execute targeted replacements on:
     1. `MobileCardPlayScreen.tsx`: Enforce `min-h-[44px] h-11 px-2` on the 4 battle skill action buttons (lines 1956, 1976, 1995, 2012) and the LifeCycle toggle (line 1666); change `rounded-b-lg` to `rounded-none` on line 2117.
     2. `PlayGameView.tsx`: Systematically strip all `bg-gradient-to-*` and replace with solid `#201d1d` or `#fdfcfc` flat surfaces; convert all `rounded-3xl`, `rounded-2xl`, `rounded-xl`, `rounded-lg` containers to `rounded-none`; convert interactive buttons to `rounded-sm`; remove all `shadow-md/lg/xl/2xl`; eliminate `animate-ping` and `animate-bounce`; replace `font-sans` with `font-mono`; and expand all interactive buttons to `min-h-[44px]`.
     3. Shared HUDs: Strip `shadow-*` from `StarBreathingUltimateWidget`, `ElementalTempestWidget`, `MinimalistMissionHUD`, and `DemoPlayHUD`; enforce `min-h-[44px]` on all interactive buttons (Exit, Help, Pause, Cast, Claim).

---

## 3. Caveats

1. **Read-Only Explorer Scope**: In accordance with the system instructions and task assignment, no production source files (`src/*`) have been modified during this survey. All findings and proposed remedies are documented here for implementation by subsequent agent roles.
2. **File Scale of PlayGameView.tsx**: At 18,648 lines, `PlayGameView.tsx` contains embedded mini-games, story chapters, and legacy game modes. The programmatic analysis identified 68 gradients, 248 forbidden radii, and 134 shadows throughout this file. Full remediation should be executed modularly or via automated AST regex transforms to avoid regression of mini-game mechanics.
3. **Poki 110 Mini-Game Canvases**: The 110 Poki mini-game canvas viewports themselves are rendered in HTML5 2D Canvas or dedicated components (`DefenseGame`, `SnakeBattleGame`, etc.). The survey examined the outer wrapper chrome, launcher cards, and overlay HUDs (`MinimalistMissionHUD`, `ResponsiveCleanHUD`), which govern the UI controls surrounding the canvas.
4. **Third-Party Leaflet Styles**: In the GPS walking workout mode (line 14609), third-party Leaflet map tiles inject their own internal SVG/canvas pins. The surrounding HUD and floating stats dashboard have been surveyed and flagged for terminal-flat compliance.

---

## 4. Conclusion

1. **Compliance Baseline**: `PageHeader.tsx` is 100% compliant with `DESIGN.md`. `HomeView.tsx` and `MyDeckView.tsx` are 95%+ compliant, requiring only minor modal touch target adjustments.
2. **Key Battle Screen Ergonomic Blocker**: `MobileCardPlayScreen.tsx` has 4 primary battle skill action buttons (Power Boost, Shield, Burst, Auto Battle Toggle) that fail the 44px mobile touch target rule (`min-w-0 px-1 text-[11px]`, ~28px height). Expanding these to `min-h-[44px] h-11 px-2` is an urgent ergonomic necessity.
3. **Main Legacy Visual Debt Center**: `PlayGameView.tsx` accounts for over 85% of all design system violations in the project (68 gradients, 248 forbidden radii, 134 heavy drop shadows, 40 `font-sans` declarations).
4. **HUD Overlays**: Shared HUD components (`StarBreathingUltimateWidget`, `ElementalTempestWidget`, `MinimalistMissionHUD`, `ResponsiveCleanHUD`, `DemoPlayHUD`) require removing lingering drop shadows (`shadow-xl/2xl`) and sizing all toolbar buttons to `min-h-[44px]`.

---

## 5. Verification Method

To independently verify the observations and validate future implementation changes:

1. **Automated Static Audit Command**:
   Run the survey audit script created in this working directory:
   ```bash
   python3 /Users/dayyoung/project/snshero/.agents/teamwork/explorer_survey_1/survey_analyzer.py
   ```
   *Expected Output*: Prints exact counts of forbidden classes (`gradient`, `rounded_forbidden`, `heavy_shadow`, `annoying_animations`, `non_mono_font`, `sub_44_touch`) across all target files.

2. **Regex Validation for Zero Prohibited Classes**:
   ```bash
   # Audit forbidden gradients in target files
   rg --line-number 'bg-gradient-to-' src/views/HomeView.tsx src/views/MobileCardPlayScreen.tsx src/views/MyDeckView.tsx src/views/PlayGameView.tsx src/components/PageHeader.tsx src/components/battle/
   
   # Audit forbidden border radii in target files
   rg --line-number '\brounded-(lg|xl|2xl|3xl)\b' src/views/HomeView.tsx src/views/MobileCardPlayScreen.tsx src/views/MyDeckView.tsx src/views/PlayGameView.tsx src/components/PageHeader.tsx src/components/battle/
   
   # Audit heavy drop shadows in target files
   rg --line-number '\bshadow-(md|lg|xl|2xl)\b' src/views/HomeView.tsx src/views/MobileCardPlayScreen.tsx src/views/MyDeckView.tsx src/views/PlayGameView.tsx src/components/PageHeader.tsx src/components/battle/
   
   # Audit distracting animations in target files
   rg --line-number '\banimate-(ping|bounce)\b' src/views/HomeView.tsx src/views/MobileCardPlayScreen.tsx src/views/MyDeckView.tsx src/views/PlayGameView.tsx src/components/PageHeader.tsx src/components/battle/
   
   # Audit non-mono fonts in target files
   rg --line-number '\bfont-(sans|serif)\b' src/views/HomeView.tsx src/views/MobileCardPlayScreen.tsx src/views/MyDeckView.tsx src/views/PlayGameView.tsx src/components/PageHeader.tsx src/components/battle/
   ```

3. **TypeScript Type Safety Check**:
   ```bash
   npx tsc --noEmit
   ```

4. **Production Build Verification**:
   ```bash
   npm run build
   ```

---

## 6. Structured Feature Inventory & Specification Fix Plan

| Feature / UI Surface | Target File & Line Range | Current Violations | Recommended Design-Compliant Fix | Dependencies / Interfaces |
|---|---|---|---|---|
| **In-Battle Skill Action Bar (Power, Shield, Burst, Auto)** | `src/views/MobileCardPlayScreen.tsx`<br>Lines 1948–2024 | • Buttons lack 44px+ height (`px-1 text-[11px]` ~28px)<br>• Fails touch target standard | Change class to `min-h-[44px] h-11 px-2.5 rounded-sm border font-mono text-xs flex items-center justify-center gap-1.5` on all 4 buttons | `skillCharges`, `handleUsePowerSkill`, `toggleAuto` |
| **Tactical Command HUD Wrapper** | `src/views/MobileCardPlayScreen.tsx`<br>Line 2117 | • Uses `rounded-b-lg border-x border-b border-white/10`<br>• Violates 2-tier border radius | Change class to `max-w-[440px] shrink-0 rounded-none border-x border-b border-stone-800` | `TacticalCommandHUD.tsx` |
| **Smart LifeCycle Bar Toggle Button** | `src/views/MobileCardPlayScreen.tsx`<br>Lines 1657–1674 | • Button is `px-2 rounded-sm text-[11px]` (~24px)<br>• Fails 44px+ touch target | Change button class to `min-h-[44px] min-w-[44px] px-2.5 rounded-sm text-xs font-bold border cursor-pointer` | `smartLifeCycleActive`, `t()` |
| **Active Player Hand Card Selection Outline** | `src/views/MobileCardPlayScreen.tsx`<br>Line 2065 | • Uses `shadow-sm` on selected card | Remove `shadow-sm`, rely on `border-2 border-[#201d1d]` or `outline outline-2 outline-[#201d1d]` | `CardItem.tsx` |
| **BossCardItem Component (Lobby/Boss Preview)** | `src/views/PlayGameView.tsx`<br>Lines 313–425 | • `rounded-3xl`, `rounded-xl`, `rounded-lg`, `rounded-full`<br>• `bg-gradient-to-r` on reward tag & button<br>• `shadow-xl`, `shadow-md`<br>• `animate-bounce` on ShieldAlert icon<br>• Sub-44px challenge button (`py-3`) | • Change outer container to `rounded-none border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc]`<br>• Replace gradient with solid `bg-[#201d1d] text-[#fdfcfc]`<br>• Remove `shadow-xl/md` and `animate-bounce`<br>• Change challenge button to `min-h-[44px] h-11 rounded-sm bg-[#201d1d] text-[#fdfcfc]` | `CARD_DATABASE`, `onChallenge` |
| **Dungeon Battle Results & Clear Modals** | `src/views/PlayGameView.tsx`<br>Lines 10978–11005, 11770–11860 | • `rounded-3xl`, `rounded-2xl`<br>• `bg-gradient-to-r`<br>• `shadow-2xl`, `shadow-lg`<br>• Sub-44px buttons | • Change modal container to `rounded-none border border-[#201d1d] bg-[#fdfcfc] text-[#201d1d] p-5 font-mono`<br>• Remove gradients, use `#201d1d` header bar<br>• Buttons: `min-h-[44px] rounded-sm bg-[#201d1d] text-[#fdfcfc]` | `dungeonBattleWinner`, `playSfx` |
| **GPS Workout Adventure Floating Dashboard** | `src/views/PlayGameView.tsx`<br>Lines 14612–14658 | • `rounded-2xl`, `rounded-xl`, `rounded-full`<br>• `backdrop-blur-xl`, `bg-gradient-to-r`<br>• `shadow-[0_4px_24px_...]`, `animate-ping`<br>• `font-sans` | • Change dashboard container to `bg-[#fdfcfc] text-[#201d1d] border border-[#201d1d] rounded-none p-4 font-mono`<br>• Progress bar: solid `bg-[#201d1d] rounded-none`<br>• Remove `animate-ping`, use square ASCII marker `[LIVE]` | `workoutDistance`, `workoutCalories`, Leaflet |
| **Final Results Summary Modal** | `src/views/PlayGameView.tsx`<br>Lines 12166–12245 | • `rounded-3xl`, `rounded-2xl`<br>• `bg-gradient-to-r`<br>• `shadow-2xl`, `shadow-lg`<br>• `animate-bounce` | • Modal container: `rounded-none border-2 border-[#201d1d] bg-[#fdfcfc] text-[#201d1d]`<br>• Action buttons: `min-h-[44px] rounded-sm bg-[#201d1d] text-[#fdfcfc]` | `isPlayerWinner`, `score` |
| **Game Rules / How to Play Modal** | `src/views/PlayGameView.tsx`<br>Lines 14532–14600 | • `rounded-3xl`, `rounded-2xl`, `rounded-xl`, `rounded-full`<br>• `bg-gradient-to-r`<br>• `shadow-[0_0_50px_...]`, `shadow-lg`<br>• `font-sans`<br>• Close button `p-2 rounded-full` | • Container: `rounded-none border border-[#201d1d] bg-[#fdfcfc] text-[#201d1d] font-mono`<br>• Close button: top-right `min-h-[44px] min-w-[44px] rounded-sm border border-[rgba(15,0,0,0.12)]` with `[x]` ASCII text<br>• Rule blocks: `rounded-none border border-[rgba(15,0,0,0.12)] bg-[#f8f7f7]` | `setShowRules`, `t()` |
| **Floating Robot Auto-Battle Controls in Battle** | `src/views/PlayGameView.tsx`<br>Lines 15143–15345 | • `w-12 h-12 rounded-full border-2 shadow-2xl bg-gradient-to-tr ring-2 ring-amber-300`<br>• `animate-spin drop-shadow-md`<br>• Floating grid skill buttons: `w-10 h-10 rounded-full shadow-lg` (sub-44px)<br>• Obstructs active canvas | • Refactor from floating circular neon stack into a clean docked terminal toolbar or collapsible drawer<br>• Buttons: `min-h-[44px] min-w-[44px] rounded-sm border border-[#201d1d] bg-[#fdfcfc] text-[#201d1d]`<br>• Speed toggle: `min-h-[44px] rounded-sm px-3 text-xs font-mono font-bold` | `isAutoBattle`, `autoSpeedMode`, `skillCooldowns` |
| **Versus Card Flip Matchup Screen** | `src/views/PlayGameView.tsx`<br>Lines 14920–15020 | • `rounded-2xl`<br>• `bg-gradient-to-br`<br>• `shadow-lg`, `animate-ping`<br>• `drop-shadow-[0_0_15px_...]` | • Container: `rounded-none border-2 border-[#201d1d] bg-[#fdfcfc] text-[#201d1d] font-mono`<br>• Character card frames: `rounded-none border border-[#201d1d]`<br>• VS badge: `[VS]` ASCII box with solid `#201d1d` fill | `playerProfile`, `aiProfile` |
| **110 Guardian Mission Selector Toolbar & Cards** | `src/views/PlayGameView.tsx`<br>Lines 13615–14010 | • Demo auto-match buttons: `min-h-[38px]`<br>• Feedback close button: `p-1`<br>• Card play list battle badge: `min-h-[32px]`<br>• `shadow-md` on feedback banner | • Upgrade all action buttons to `min-h-[44px]` (`h-11`)<br>• Remove `shadow-md`<br>• Ensure card items maintain `rounded-sm` outline with zero drop shadows | `filteredModes`, `CARD_DATABASE`, `startMissionCardBattle` |
| **Star Breathing Ultimate Widget** | `src/components/battle/StarBreathingUltimateWidget.tsx`<br>Lines 60–230 | • `shadow-xl`, `shadow-2xl`, `shadow-lg`, `shadow-sm`<br>• Buttons: `py-1.5 px-2` (~32px)<br>• Modal close button: `p-1`<br>• Floating z-40 widget risk | • Strip all `shadow-*` classes<br>• Cast button: upgrade to `min-h-[44px] h-11 rounded-sm bg-cyan-950 text-cyan-200 border border-cyan-400`<br>• Modal: `rounded-none border border-stone-700 bg-[#090d16] text-stone-200`<br>• Close button: `min-h-[44px] min-w-[44px] rounded-sm` | `starBreathingStore`, `handleCast` |
| **Elemental Tempest Widget** | `src/components/battle/ElementalTempestWidget.tsx`<br>Lines 60–178 | • `shadow-xl` on container | Remove `shadow-xl`, ensure solid surface with `border border-[#201d1d]/20 dark:border-white/20 rounded-none` | `elementalTempestStore` |
| **Minimalist Mission HUD (Poki / Mini-Game Header)** | `src/components/MinimalistMissionHUD.tsx`<br>Lines 250–405 | • Exit button: `px-2 py-1` (~28px)<br>• Help & Pause: `w-7 h-7` (28px)<br>• Settlement modal: `shadow-2xl`<br>• Modal CTAs: `py-2.5 px-3` (~36px) | • Exit button: `min-h-11 px-3 rounded-sm bg-white/10 border border-white/20`<br>• Help & Pause: `min-h-11 min-w-11 w-11 h-11 rounded-sm`<br>• Settlement modal: `rounded-none border-2 border-[#201d1d] bg-[#fdfcfc] text-[#201d1d]` (no shadow)<br>• Modal CTAs: `min-h-[44px] h-11 rounded-sm` | `standardizedRewardGateway`, `onExit` |
| **Responsive Clean HUD** | `src/components/ResponsiveCleanHUD.tsx`<br>Lines 50–145 | • Exit button: `px-2 py-1`<br>• Pause & Mute buttons: `p-1`<br>• Help button: `px-1.5 py-1`<br>• `animate-bounce` on combo multiplier | • Exit button: `min-h-11 px-3 rounded-sm`<br>• Pause, Mute, Help: `min-h-11 min-w-11 w-11 h-11 rounded-sm`<br>• Replace `animate-bounce` with static high-contrast badge `[Nx COMBO]` | `onExit`, `onTogglePause`, `onToggleMute` |
| **Demo Play HUD** | `src/components/DemoPlayHUD.tsx`<br>Lines 55–102 | • `shadow-sm`<br>• `rounded-full` with `animate-pulse`<br>• Exit button: `min-h-[30px] min-w-[70px]` | • Remove `shadow-sm`<br>• Indicator: square `rounded-none` or `rounded-xs` badge `[DEMO]`<br>• Exit button: `min-h-[44px] min-w-[75px] rounded-sm` | `demoPlayService` |

---

*Report compiled by Explorer Survey 1. Ready for handoff to Orchestrator and Implementation Workers.*
