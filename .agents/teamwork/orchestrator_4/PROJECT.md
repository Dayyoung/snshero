# Project: SNSHero Revolution — Comprehensive Terminal-Flat UI/UX Visual Unification

## Architecture
- **Domain**: UI/UX Design System Overhaul across all 22+ views in `src/views/*` and shared components in `src/components/*` & `src/App.tsx`.
- **Design System**: Canonical OpenCode Terminal-Flat (`DESIGN.md`):
  - Typography: 100% Monospace (`font-mono`) across all labels, headers, stats, badges, and buttons.
  - 2-Tier Border Radius: `rounded-none` (0px) on all containers, panels, cards, modals, tables, and section frames; `rounded-sm` (4px max) on interactive buttons, inputs, and badges. Complete elimination of `rounded-lg/xl/2xl/3xl` and decorative `rounded-full` pills.
  - Flat Surfaces: Warm Cream (`#fdfcfc`, `#f8f7f7`, `#f1eeee`) and Ink Dark (`#201d1d`, `#302c2c`, `#0e0c0c`) with 1px hairline borders (`border-[rgba(15,0,0,0.12)]`, `border-[#201d1d]`, `border-white/15`). Complete elimination of multi-stop gradients (`bg-gradient-to-*`) and drop shadows (`shadow-md/lg/xl/2xl`).
  - Distraction-Free: Complete elimination of `animate-ping` and `animate-bounce`.
- **Mobile Ergonomics**:
  - Minimum 44px touch target (`min-h-[44px]` or `h-11`/`44px+`) on all interactive buttons, tabs, pagination, header actions, and modal close buttons.
  - Zero Viewport Intrusion: 3x3 card battle board, card hand, mini-game touch canvas, and webtoon/movie media viewports must remain completely unobstructed by floating widgets or HUD bars.
  - Clean progressive disclosure with collapsible drawers, segmented hubs, and immediate top-layer `[x]` / `[SKIP]` controls.
- **Data & System Integrity**:
  - 100% LocalStorage persistence under `hero_*` keys preserved without reset.
  - 100% i18n multilingual support (12 languages) preserved without broken keys.
  - 100% Vite `safeLazy` dynamic glob imports in `App.tsx` preserved without directory index imports.
- **Dual Track Organization**:
  - **E2E Testing Track**: Autonomous requirement-driven test harness, verifying all 22+ views for 0 prohibited CSS classes, 100% 44px+ touch targets, modal close accessibility, and viewport clearance across Tiers 1–4. Publishes `TEST_READY.md`.
  - **Implementation Track**:
    - **Milestone 1 (M1)**: Core Gameplay & Battle Views (`MobileCardPlayScreen.tsx`, `PlayGameView.tsx`, `MyDeckView.tsx`, `HomeView.tsx`, Battle HUDs)
    - **Milestone 2 (M2)**: Economy, Social & Content Views (`ShopView.tsx`, `RankingView.tsx`, `GuildListView.tsx`, `CommunityView.tsx`, `RedditCommunityView.tsx`, `CardMarketplaceView.tsx`, `NovelView.tsx`, `MovieView.tsx`)
    - **Milestone 3 (M3)**: Systems, Progression, Codex & Global App Chrome (`ProfileView.tsx`, `SettingView.tsx`, `SeasonHubView.tsx`, `CompanionView.tsx`, `EventView.tsx`, `StockMarketView.tsx`, `PredictionMarketView.tsx`, `WikiCardView.tsx`, `WorldCodexView.tsx`, `App.tsx`)
    - **Milestone 4 (M4 - Final)**: 100% E2E Test Suite Pass (Tiers 1–4) + Tier 5 Adversarial Coverage Hardening + Forensic Audit + Google Form Report

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | In-Battle Skill Action Bar 44px Sizing | Expand Power, Shield, Burst, and Auto buttons in `MobileCardPlayScreen.tsx` to `min-h-[44px]` | M1 | Survey 1 (FEAT-101) |
| 2 | Tactical Command HUD Wrapper Flattening | Remove `rounded-b-lg` from `MobileCardPlayScreen.tsx` line 2117; apply `rounded-none` | M1 | Survey 1 (FEAT-102) |
| 3 | Smart LifeCycle Bar Toggle 44px | Upgrade LifeCycle toggle in `MobileCardPlayScreen.tsx` to `min-h-[44px] min-w-[44px]` | M1 | Survey 1 (FEAT-103) |
| 4 | Hand Selection Shadow Removal | Remove `shadow-sm` on active card outline in `MobileCardPlayScreen.tsx` | M1 | Survey 1 (FEAT-104) |
| 5 | BossCardItem Terminal-Flat Styling | Convert `PlayGameView.tsx` BossCardItem to solid `#fdfcfc`, `rounded-none`, 44px CTAs | M1 | Survey 1 (FEAT-105) |
| 6 | Dungeon Battle Results Modals | Flatten `PlayGameView.tsx` dungeon clear dialogs to `rounded-none`, 44px CTAs, no gradients | M1 | Survey 1 (FEAT-106) |
| 7 | GPS Workout Adventure Dashboard | Convert `PlayGameView.tsx` GPS HUD to `rounded-none font-mono` flat box; remove ping/blur | M1 | Survey 1 (FEAT-107) |
| 8 | PlayGame Final Results Summary Modal | Replace rounded/gradient modal in `PlayGameView.tsx` with terminal-flat frame & 44px buttons | M1 | Survey 1 (FEAT-108) |
| 9 | Game Rules & How to Play Modal | Flatten rules modal in `PlayGameView.tsx` to `rounded-none`, add top-right 44px `[x]` | M1 | Survey 1 (FEAT-109) |
| 10 | Floating Robot Auto-Battle Controls Dock | Convert floating circular neon buttons in `PlayGameView.tsx` to clean docked terminal toolbar | M1 | Survey 1 (FEAT-110) |
| 11 | Versus Card Flip Matchup Screen | Flatten versus cards in `PlayGameView.tsx` to `rounded-none border-[#201d1d]` | M1 | Survey 1 (FEAT-111) |
| 12 | 110 Guardian Mission Selector Toolbar | Upgrade all action badges to `min-h-[44px]` in `PlayGameView.tsx`; remove `shadow-md` | M1 | Survey 1 (FEAT-112) |
| 13 | Star Breathing Ultimate Widget Overhaul | Strip `shadow-xl/2xl`, expand cast button to `min-h-[44px]`, flatten modal to `rounded-none` | M1 | Survey 1 (FEAT-113) |
| 14 | Elemental Tempest Widget Flattening | Remove `shadow-xl` from `ElementalTempestWidget.tsx`, ensure solid surface | M1 | Survey 1 (FEAT-114) |
| 15 | Minimalist Mission HUD Sizing & Shadows | Sizing toolbar buttons to `min-h-11`, strip `shadow-2xl` from settlement modal | M1 | Survey 1 (FEAT-115) |
| 16 | Responsive Clean HUD Sizing & Animation | Replace `animate-bounce` with static high-contrast badge; expand toolbar buttons to `min-h-11` | M1 | Survey 1 (FEAT-116) |
| 17 | Demo Play HUD Sizing & Flattening | Remove `shadow-sm` and `animate-pulse`; upgrade exit button to `min-h-[44px]` | M1 | Survey 1 (FEAT-117) |
| 18 | Gacha Pack & Mileage Shop Overhaul | Cleanse 289 banned classes in `ShopView.tsx`; enforce `rounded-none`, solid surfaces, 44px CTAs | M2 | Survey 2 (F-01) |
| 19 | Crypto & Goods Checkout Modals | Unify checkout modals in `ShopView.tsx` to terminal-flat frames with 44px `[x]` buttons | M2 | Survey 2 (F-02) |
| 20 | P2P Marketplace Toast & Action Controls | Upgrade 13 sub-44px buttons and `[x]` toast dismiss controls in `CardMarketplaceView.tsx` | M2 | Survey 2 (F-03) |
| 21 | Novel & Webtoon Chapter Drawer Sizing | Add `min-h-[44px]` to chapter drawer close `[X]` and episode cards in `NovelView.tsx` | M2 | Survey 2 (F-04) |
| 22 | Movie Player Canvas Shadow Removal | Remove `shadow-2xl` from `CinematicMoviePlayer.tsx` line 687 | M2 | Survey 2 (F-05) |
| 23 | Season Leaderboard & PvP Grid Overhaul | Cleanse 147 banned classes in `RankingView.tsx`; replace gradients with solid CTAs | M2 | Survey 2 (F-06) |
| 24 | Ranking History & Bluetooth/Wi-Fi Modals | Flatten match history and nearby search dialogs in `RankingView.tsx` with 44px `[x]` | M2 | Survey 2 (F-07) |
| 25 | Guild Creation & List Management Overhaul | Cleanse 54 banned classes in `GuildListView.tsx`; align with `GuildDetailView.tsx` standard | M2 | Survey 2 (F-08) |
| 26 | Guild Detail Reference Verification | Verify 100% compliance of `GuildDetailView.tsx` as gold standard reference | M2 | Survey 2 (F-09) |
| 27 | Community Fan Events & Reactions Overhaul | Cleanse 82 banned classes in `CommunityView.tsx`; flatten cards, upgrade 68 buttons to 44px | M2 | Survey 2 (F-10) |
| 28 | Reddit Community Shell & Subcomponents | Enforce `font-mono`, `rounded-none`, 44px buttons across `RedditCommunityView.tsx` and subcomponents | M2 | Survey 2 (F-11) |
| 29 | Profile Info & Showcase Card Overhaul | Convert `ProfileView.tsx` root to `font-mono`, card to `rounded-none`, help to 44px | M3 | Survey 3 (FEAT-301) |
| 30 | Profile Help Modal Standardization | Convert modal to `rounded-none border-[#201d1d]`, close button to 44px `[x]` | M3 | Survey 3 (FEAT-302) |
| 31 | Settings Toggles & Sliders Overhaul | Refactor toggles in `SettingView.tsx` to `rounded-sm` flat switches; tracks to `rounded-none` | M3 | Survey 3 (FEAT-303) |
| 32 | Settings Strategy Simulator Modal | Convert simulator dialog in `SettingView.tsx` to `rounded-none` with 44px primary CTA | M3 | Survey 3 (FEAT-304) |
| 33 | Season Change Dialog Overhaul | Strip `rounded-3xl` and `animate-bounce` from season change modal in `SettingView.tsx` | M3 | Survey 3 (FEAT-305) |
| 34 | Settings Storage Key Migration | Migrate `firebase_db_mode` to `hero_firebase_db_mode` with fallback | M3 | Survey 3 (FEAT-306) |
| 35 | Season Hub Hero Banner Overhaul | Flatten banner in `SeasonHubView.tsx` to solid `#201d1d`, strip decorative blurs, 44px help | M3 | Survey 3 (FEAT-307) |
| 36 | Season Pass Action Buttons Sizing | Upgrade action buttons in `SeasonHubView.tsx` to `min-h-[44px] rounded-sm` | M3 | Survey 3 (FEAT-308) |
| 37 | Companion Sub-Tabs & Slot Selectors | Convert `CompanionView.tsx` to `font-mono`, slots to `min-w-[44px] min-h-[44px] rounded-sm` | M3 | Survey 3 (FEAT-309) |
| 38 | Companion Equipment & Skill Modals | Convert equipment and skill dialogs in `CompanionView.tsx` to `rounded-none` with 44px `[x]` | M3 | Survey 3 (FEAT-310) |
| 39 | Event Balance & Feature Banners Overhaul | Enforce `font-mono` in `EventView.tsx`, flatten banners to `rounded-none border-[#201d1d]` | M3 | Survey 3 (FEAT-311) |
| 40 | Event Nine-Slot & Diorama Modals | Convert modals in `EventView.tsx` to `rounded-none font-mono` with 44px close | M3 | Survey 3 (FEAT-312) |
| 41 | Stock Market Trade Modal Close Sizing | Add `min-h-[44px] min-w-[44px]` to trade modal close button in `StockMarketView.tsx` | M3 | Survey 3 (FEAT-313) |
| 42 | Prediction Market Cards & Betting Overhaul | Flatten cards in `PredictionMarketView.tsx` to `rounded-none`, remove `animate-bounce` | M3 | Survey 3 (FEAT-314) |
| 43 | Prediction Market Dialogs Overhaul | Convert bet and history dialogs in `PredictionMarketView.tsx` to `rounded-none font-mono` | M3 | Survey 3 (FEAT-315) |
| 44 | Wiki Card Explorer & Filters Overhaul | Enforce `font-mono` in `WikiCardView.tsx`, flatten cards to `rounded-none`, 44px help | M3 | Survey 3 (FEAT-316) |
| 45 | World Codex Help & Detail Modal Sizing | Upgrade help dialog in `WorldCodexView.tsx` to `rounded-none` with 44px controls | M3 | Survey 3 (FEAT-317) |
| 46 | App Chrome: Hamburger Drawer Header | Sizing drawer header icons in `App.tsx` to `min-h-[44px] min-w-[44px] rounded-sm` | M3 | Survey 3 (FEAT-318) |
| 47 | App Chrome: Hamburger Drawer Menu Items | Enforce `font-mono rounded-none min-h-[44px]` across all drawer buttons in `App.tsx` | M3 | Survey 3 (FEAT-319) |
| 48 | App Chrome: Global Floating Chat Window | Convert chat container in `App.tsx` to `rounded-none`, remove ping/bounce animations | M3 | Survey 3 (FEAT-320) |
| 49 | App Chrome: Welcome & Gacha Modals | Refactor dialogs in `App.tsx` to `rounded-none font-mono` with 44px CTAs | M3 | Survey 3 (FEAT-321) |
| 50 | App Storage Key Migration | Migrate `snshero_audio_settings` to `hero_audio_settings` with fallback in `App.tsx` | M3 | Survey 3 (FEAT-322) |
| 51 | Dual-Track Requirement-Driven E2E Suite | Autonomous opaque-box test runner covering Tiers 1-4 across all 22+ views (`TEST_READY.md`) | E2E-Track | Dual Track Architecture |
| 52 | 100% E2E Test Suite Pass | Verification that 100% of Tiers 1–4 E2E tests pass with zero regressions | M4 | Dual Track Architecture |
| 53 | Tier 5 Adversarial Coverage Hardening | White-box stress testing, edge-case torture tests, and forensic integrity audit | M4 | Project Pattern §Dual Track |
| 54 | Project Hygiene, Lint, Build & Reporting | `npm run lint` & `npm run build` 0 errors, local commit, WORK_LOGS.md, Google Form report | M4 | ORIGINAL_REQUEST §R4 |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| E2E | E2E Testing Suite | Requirements-driven test suite (Tiers 1–4) & runner publishing `TEST_READY.md` | Survey | IN_PROGRESS |
| M1 | Core Gameplay & Battle Screens | `MobileCardPlayScreen.tsx`, `PlayGameView.tsx`, `MyDeckView.tsx`, `HomeView.tsx`, Battle HUDs (Features 1–17) | Survey | IN_PROGRESS |
| M2 | Economy, Social & Content Views | `ShopView.tsx`, `RankingView.tsx`, `GuildListView.tsx`, `CommunityView.tsx`, `RedditCommunityView.tsx`, `CardMarketplaceView.tsx`, `NovelView.tsx`, `MovieView.tsx` (Features 18–28) | Survey | IN_PROGRESS |
| M3 | Systems, Progression & App Chrome | `ProfileView.tsx`, `SettingView.tsx`, `SeasonHubView.tsx`, `CompanionView.tsx`, `EventView.tsx`, `StockMarketView.tsx`, `PredictionMarketView.tsx`, `WikiCardView.tsx`, `WorldCodexView.tsx`, `App.tsx` (Features 29–50) | Survey | IN_PROGRESS |
| M4 | Final Milestone & Hardening | Pass 100% E2E Tests (Tiers 1–4) + Tier 5 Adversarial Hardening + Forensic Audit + Google Form Report | M1, M2, M3, E2E | PLANNED |

## Interface Contracts
### 1. View Routing & Lazy Loading (`src/App.tsx`)
- All 22 views must continue to be loaded via `safeLazy(loadViewSafely('ViewName'), 'ViewName')`.
- Zero directory index imports (`from './views'` or `from './lib/xxx'` without filename).
- Bottom navigation dock clearance: every view root container must specify sufficient bottom padding (`pb-28` to `pb-36`) so active content is never obscured by the fixed bottom navigation dock.

### 2. Design System Tokens (`DESIGN.md`)
- Typography: `font-mono` on all text nodes.
- Palette:
  - Surface Canvas: `bg-[#fdfcfc]` (light) / `bg-[#090d16]` or `bg-[#201d1d]` (dark)
  - Surface Inset: `bg-[#f8f7f7]` / `bg-[#141212]`
  - Borders: `border border-[rgba(15,0,0,0.12)]` (light) / `border border-white/15` or `border-stone-800` (dark)
  - Primary CTA: `bg-[#201d1d] text-[#fdfcfc] border border-[#201d1d] rounded-sm min-h-[44px]`
  - Secondary CTA: `bg-transparent text-[#201d1d] border border-[rgba(15,0,0,0.12)] rounded-sm min-h-[44px]`
- Radius:
  - Container / Panel / Modal / Card: `rounded-none` (0px)
  - Interactive Button / Input / Badge: `rounded-sm` (4px max)
  - Forbidden: `rounded-lg`, `rounded-xl`, `rounded-2xl`, `rounded-3xl`, and `rounded-full` pills on containers and buttons.

### 3. Touch Ergonomics & Accessibility
- Minimum touch target: `min-h-[44px]` on all `<button>`, `<a>`, and interactive elements.
- Modal Close Buttons: Top-layer `min-h-[44px] min-w-[44px]` with ASCII `[x]` or `[X]` text label, never hidden behind backdrop or nested without focus.

### 4. Data Persistence
- All LocalStorage keys must adhere to `hero_*`.
- Existing player data (`hero_inventory`, `hero_deck`, `hero_sns`, `hero_user_sns`, `hero_user_diamonds`, `hero_dupe_mileage`, etc.) must never be wiped or reset.

## Code Layout
- Core Battle Views: `src/views/HomeView.tsx`, `src/views/MobileCardPlayScreen.tsx`, `src/views/MyDeckView.tsx`, `src/views/PlayGameView.tsx`
- Shared Battle HUDs: `src/components/battle/*`, `src/components/PageHeader.tsx`, `src/components/*HUD.tsx`
- Economy & Social Views: `src/views/ShopView.tsx`, `src/views/CardMarketplaceView.tsx`, `src/views/RankingView.tsx`, `src/views/GuildListView.tsx`, `src/views/GuildDetailView.tsx`, `src/views/CommunityView.tsx`, `src/views/RedditCommunityView.tsx`
- Content & Media Views: `src/views/NovelView.tsx`, `src/views/MovieView.tsx`, `src/components/movie/*`, `src/components/webtoon/*`
- Systems & Progression Views: `src/views/ProfileView.tsx`, `src/views/SettingView.tsx`, `src/views/SeasonHubView.tsx`, `src/views/CompanionView.tsx`, `src/views/EventView.tsx`, `src/views/StockMarketView.tsx`, `src/views/PredictionMarketView.tsx`, `src/views/WikiCardView.tsx`, `src/views/WorldCodexView.tsx`
- Global Chrome: `src/App.tsx`, `src/index.css`
- E2E Tests: `tests/e2e_design_system/`
- Agent Workspace: `.agents/teamwork/`
