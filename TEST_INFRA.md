# SNSHero Independent Static Landing & /home Decoupling E2E Test Infrastructure (TEST_INFRA.md)

## 1. Overview & Architecture

This document establishes the comprehensive test architecture, methodology, and coverage criteria for the **SNSHero Independent Static Landing Page & /home Decoupling** (`index.html`, `home.html`, `src/landing/`, `scripts/post-build.js`, `src/routes.ts`, and associated responsive/nurture modules).

The testing strategy employs a **Dual-Track 4-Tier Automated Verification Framework** driven by a standalone, autonomous TypeScript test runner (`tests/e2e/run_all.ts` via `npx tsx`):

```
+---------------------------------------------------------------------------------------------------+
|          SNSHero Independent Static Landing & /home Decoupling Master 4-Tier E2E Test Harness     |
+---------------------------------------------------------------------------------------------------+
|  Tier 1: Feature Coverage & Interface Contracts (45 Assertions across 10 Feature Groups)          |
|  - Group 1 (Dual-Entry MPA Architecture, F1-F5): index.html standalone entry, home.html SPA entry,|
|    vite.config.ts MPA rollup inputs, scripts/post-build.js route preservation, src/routes.ts.     |
|  - Group 2 (Responsive Layout & Zero Popups, F6-F7, F11): 360px/768px/1024px responsive, 3-tier   |
|    character assets (7-head cutout, bust, 3-head SD), 0 onboarding popups on initial visit.       |
|  - Group 3 (Navigation & Modals, F8-F10): Top 6 nav items, Side 8 nav items, secondary action    |
|    modals (쇼핑몰, 커뮤니티, 로그인) with dismiss [x] and official guidance.                       |
|  - Group 4 (Home Section & External Badges, F12): Vertical scroll landing, SnowHero intro,       |
|    Naver Web Novel, Naver Webtoon, Munpia links with "[절찬 연재중]" indicator badges.            |
|  - Group 5 (MyDeck Section & TP Metrics, F13): 5-card composition display, Deck TP formula        |
|    (sum of active card stats), Total TP formula (all owned cards).                                |
|  - Group 6 (Play Section & Media Controls, F14): 5 buttons [닫기, 이전, 다음, 나레이션, TTS],     |
|    TTS default OFF state, 40-episode webtoon scene asset selector.                                |
|  - Group 7 (Card Section & 1~100Lv Nurture Engine, F15-F16): '카드' naming, collection rate,      |
|    110-card grid, 1~100Lv EXP progression, stat points on level-up, red dot indicator, 4-way stat.|
|  - Group 8 (LocalStorage Persistence, F17): hero_card_nurturing schema serialization, reload      |
|    persistence across browser sessions, zero state loss.                                          |
|  - Group 9 (Shop Section 8 Fixed Items, F18): Exact 8 shop items without extra clutter: 일반 카드팩, |
|    매직 카드팩, 희귀 카드팩, 아이템 팩, 광고 제거, 공식 소설, 공식 동영상, 코인 충전.             |
|  - Group 10 (Static Build Integrity, F19): Exit code 0, 0 broken local links, zero runtime server |
|    dependencies for static landing bundle.                                                        |
+---------------------------------------------------------------------------------------------------+
|  Tier 2: Boundary Value Analysis & Corner Cases (10 Assertions across 7 Boundaries)               |
|  - Boundary 1 (Max Level 100 Cap): Card reaching Lv 100 caps EXP at max, prevents Lv 101, zero     |
|    overflow stat points, stable stat point expenditure.                                           |
|  - Boundary 2 (Level 1 Initial State): 0 EXP, 0 unspent stat points, baseline card stats, no red dot.|
|  - Boundary 3 (Missing / Corrupted Storage): Corrupted JSON in hero_card_nurturing recovers to     |
|    default schema without runtime fatal error.                                                    |
|  - Boundary 4 (Route Fallbacks & Trailing Slashes): /index.html, /, /home, /home/ cleanly resolve.  |
|  - Boundary 5 (Rapid Concurrency & Debounce): Rapid consecutive nurture taps correctly accrue EXP  |
|    without race condition drops or double-spent points.                                           |
|  - Boundary 6 (Viewport Extremes): Ultra-narrow 320px mobile and ultra-wide 3840px 4K display     |
|    maintain zero horizontal bleed and 44px+ touch targets.                                        |
|  - Boundary 7 (Offline Host Emulation): Fully renders from static file:// or isolated static port |
|    with 0 external API roundtrips.                                                                |
+---------------------------------------------------------------------------------------------------+
|  Tier 3: Pairwise Combinations & State Machine (6 Assertions across 6 Interactions)                |
|  - Combination 1 (Nurture -> Stat Point -> Deck TP): Nurturing active deck card and spending      |
|    stat points dynamically increments Deck TP and Total TP in real-time.                          |
|  - Combination 2 (Shop Purchase -> Inventory -> Collection Rate): Purchasing card pack updates   |
|    ownedCardIds, refreshes collection rate (X / 110), and updates Total TP.                       |
|  - Combination 3 (Play Scene Stepper -> TTS State): Stepping between scenes preserves TTS OFF      |
|    contract unless explicitly toggled by user.                                                    |
|  - Combination 4 (Dual Routing / <-> /home): Navigating from static landing to /home loads full    |
|    game SPA, returning to / restores static landing cleanly.                                      |
|  - Combination 5 (Modal Lifecycle & Screen Freeze): Opening Shopping/Community/Login modal traps |
|    focus and closing restores background section interactability.                                 |
|  - Combination 6 (Bulk Stat Allocation): Allocating multiple points across top/right/bottom/left   |
|    clears red dot only when unspentPoints === 0.                                                  |
+---------------------------------------------------------------------------------------------------+
|  Tier 4: Real-World Workload Scenarios (5 Assertions across 5 User Journeys)                       |
|  - Scenario 1 (First-Time Visitor Journey): Landing on /, zero popups, smooth scroll through     |
|    introduction, verifying external novel/webtoon badges, opening shop modal.                      |
|  - Scenario 2 (Complete Card Nurture 1->100 Loop): Selecting Card 1, nurturing to Lv 100,         |
|    observing red dot indicator, allocating all 99 points, verifying localStorage across reload.   |
|  - Scenario 3 (MyDeck Optimization & TP Audit): Inspecting 5-card deck, verifying exact formula    |
|    sum against cardDatabase stats, validating Total TP against inventory.                         |
|  - Scenario 4 (Play Viewer 40-Episode Experience): Browsing webtoon scenes, verifying 5 buttons,  |
|    ensuring TTS remains OFF until tapped.                                                         |
|  - Scenario 5 (End-to-End Persistence Stress): Simulating user session with multiple card levels,  |
|    browser storage reload, and full data integrity verification.                                  |
+---------------------------------------------------------------------------------------------------+
```

---

## 2. 4-Tier Test Suite Specification

### Tier 1: Feature Coverage & Interface Contracts (45 Tests)

#### T1.1 Dual-Entry MPA Architecture (Features 1–5, R1)
- **Objective**: Verify separation of static landing entry (`index.html`), rich SPA entry (`home.html`), Rollup inputs, post-build scripts, and router definitions.
- **Authoritative Sources**: `ORIGINAL_REQUEST.md` §R1, `PROJECT.md` Features 1–5.
- **Assertions**:
  1. `T1.MPA.1` **Root Landing Entry**: `index.html` loads `src/landing/index.ts` and contains zero heavy game bundle tags.
  2. `T1.MPA.2` **Game SPA Entry**: `home.html` exists and loads `src/main.tsx` for the full card battle experience.
  3. `T1.MPA.3` **Vite Rollup Config**: `vite.config.ts` configures multi-entry build `{ main: 'index.html', home: 'home.html' }`.
  4. `T1.MPA.4` **Post-Build Script**: `scripts/post-build.js` copies/creates `dist/home.html` and `dist/home/index.html` without overwriting `dist/index.html`.
  5. `T1.MPA.5` **Router Decoupling**: `src/routes.ts` maps game home to `/home` and leaves `/` for the static landing.

#### T1.2 Responsive Layout & Zero Onboarding Popups (Features 6–7, 11, R2, R3)
- **Objective**: Verify responsive layouts across 360px, 768px, and 1024px+, asset resolution, and 100% elimination of onboarding popups.
- **Authoritative Sources**: `ORIGINAL_REQUEST.md` §R2, §R3, `PROJECT.md` Features 6, 7, 11.
- **Assertions**:
  1. `T1.RESP.1` **Mobile Viewport (360px)**: Root landing layout renders without horizontal overflow or fixed max-width constraints.
  2. `T1.RESP.2` **Tablet Viewport (768px)**: Fluid grid and navigation adjust seamlessly.
  3. `T1.RESP.3` **Desktop Viewport (1024px+)**: Full widescreen layout with appropriate side/top navigation.
  4. `T1.RESP.4` **3-Tier Character Assets**: 7-head cutouts, bust portraits, and 3-head SD sprites are referenced with valid paths.
  5. `T1.RESP.5` **Zero Onboarding Popups**: First visit initiates with 0 onboarding/tutorial/help modal overlays.

#### T1.3 Navigation & Secondary Modals (Features 8–10, R3)
- **Objective**: Verify Top Nav (6 items), Side Nav (8 items), and modal dialogs for shopping mall, community, and login.
- **Authoritative Sources**: `ORIGINAL_REQUEST.md` §R3, `PROJECT.md` Features 8–10.
- **Assertions**:
  1. `T1.NAV.1` **Top Navigation 6 Items**: Contains exact items: 홈, 마이덱, 플레이, 미션, 상점, 쇼핑몰.
  2. `T1.NAV.2` **Side Navigation 8 Items**: Contains exact items: 로그인, 홈, 마이덱, 플레이, 미션, 상점, 쇼핑몰, 커뮤니티.
  3. `T1.NAV.3` **Shopping Mall Modal**: Clicking 쇼핑몰 opens preparing/guidance modal with close button.
  4. `T1.NAV.4` **Community Modal**: Clicking 커뮤니티 opens preparing/official link modal with close button.
  5. `T1.NAV.5` **Login Modal**: Clicking 로그인 opens login/account guidance modal with close button.

#### T1.4 Home Section & External Links (Feature 12, R4)
- **Objective**: Verify vertical scroll landing, SnowHero introduction, web novel/game/anime sections, and external links with badges.
- **Authoritative Sources**: `ORIGINAL_REQUEST.md` §R4, `PROJECT.md` Feature 12.
- **Assertions**:
  1. `T1.HOME.1` **Vertical Scroll Structure**: Home section contains structured scrollable sections.
  2. `T1.HOME.2` **SnowHero Introduction**: Hero branding and lore description present.
  3. `T1.HOME.3` **Naver Web Novel Link**: Points to `http://novel.naver.com/challenge/list?novelId=1250635` with `[절찬 연재중]` badge.
  4. `T1.HOME.4` **Naver Webtoon Link**: Points to `https://comic.naver.com/challenge/list?titleId=856677` with `[절찬 연재중]` badge.
  5. `T1.HOME.5` **Munpia Web Novel Link**: Points to `https://nlink.munpia.com/link/munpia/novel/616551` with `[절찬 연재중]` badge.

#### T1.5 MyDeck Section & TP Metrics (Feature 13, R4)
- **Objective**: Verify MyDeck section simple view, 5 cards display, Deck TP, and Total TP formulas.
- **Authoritative Sources**: `ORIGINAL_REQUEST.md` §R4, `PROJECT.md` Feature 13.
- **Assertions**:
  1. `T1.DECK.1` **5-Card Slot Display**: Exactly 5 active deck slots displayed cleanly.
  2. `T1.DECK.2` **Deck TP Calculation**: Deck TP correctly equals the sum of stats for the 5 deck cards.
  3. `T1.DECK.3` **Total TP Calculation**: Total TP correctly reflects total power across all owned cards.
  4. `T1.DECK.4` **Minimalist Interface**: No clutter or unnecessary battle buttons in MyDeck simple view.
  5. `T1.DECK.5` **Card Slot Click / Details**: Clicking slot reveals card details or level info.

#### T1.6 Play Section & Media Controls (Feature 14, R4)
- **Objective**: Verify 5 buttons, TTS default OFF, and 40-episode webtoon scene viewer.
- **Authoritative Sources**: `ORIGINAL_REQUEST.md` §R4, `PROJECT.md` Feature 14.
- **Assertions**:
  1. `T1.PLAY.1` **5 Control Buttons**: Contains exact buttons: 닫기, 이전, 다음, 나레이션, TTS.
  2. `T1.PLAY.2` **TTS Default OFF**: Initial load sets `isTtsActive = false` (no autoplaying audio).
  3. `T1.PLAY.3` **TTS Toggle**: Clicking TTS toggles state to active.
  4. `T1.PLAY.4` **Webtoon Image Selection**: Only webtoon episode images are selectable for viewing.
  5. `T1.PLAY.5` **Previous/Next Navigation**: Stepping prev/next correctly updates scene index.

#### T1.7 Card Section & 1~100Lv Nurture Engine (Features 15–16, R4)
- **Objective**: Verify '카드' naming, collection rate, 110-card grid, 1~100Lv EXP gain, stat points, red dot, and 4-way allocation.
- **Authoritative Sources**: `ORIGINAL_REQUEST.md` §R4, `PROJECT.md` Features 15–16.
- **Assertions**:
  1. `T1.CARD.1` **'카드' Naming & Rate**: Section clearly titled '카드' with collection rate (e.g. `X / 110`).
  2. `T1.CARD.2` **110 Card Grid**: Renders all 110 cards in catalogue.
  3. `T1.CARD.3` **Nurture EXP Progression**: Nurturing card awards EXP and triggers level-up when threshold reached.
  4. `T1.CARD.4` **Max Level 100**: Level caps at 100; cannot exceed 100.
  5. `T1.CARD.5` **Stat Points & Red Dot**: Leveling up awards stat points; card displays red dot indicator while points remain unspent.
  6. `T1.CARD.6` **4-Way Stat Allocation**: Points can be allocated to top, right, bottom, or left stats.

#### T1.8 LocalStorage State Persistence (Feature 17, R4)
- **Objective**: Verify serialization and persistence of `hero_card_nurturing`.
- **Authoritative Sources**: `ORIGINAL_REQUEST.md` §R4, `PROJECT.md` Feature 17.
- **Assertions**:
  1. `T1.STORE.1` **Schema Compliance**: Serialized storage matches `CardNurtureData` interface contract.
  2. `T1.STORE.2` **Persistence on Nurture**: Card level and EXP update immediately in localStorage.
  3. `T1.STORE.3` **Persistence on Stat Allocation**: Spent points and bonus stats persist across reload.
  4. `T1.STORE.4` **Owned Cards Persistence**: Owned card inventory persists across reload.

#### T1.9 Shop Section 8 Fixed Items (Feature 18, R4)
- **Objective**: Verify exact 8 shop items and zero extra clutter.
- **Authoritative Sources**: `ORIGINAL_REQUEST.md` §R4, `PROJECT.md` Feature 18.
- **Assertions**:
  1. `T1.SHOP.1` **Exact 8 Items**: Renders exactly: 일반 카드팩, 매직 카드팩, 희귀 카드팩, 아이템 팩, 광고 제거, 공식 소설, 공식 동영상, 코인 충전.
  2. `T1.SHOP.2` **No Prohibited Extras**: Zero legacy items or clutter outside the 8 items.
  3. `T1.SHOP.3` **Card Pack Items**: Normal, Magic, Rare pack cards have clear purchase actions.
  4. `T1.SHOP.4` **Item Pack & Ad Removal**: Item pack and ad removal have clear labels.
  5. `T1.SHOP.5` **Official Content & Coins**: Official novel, official video, and coin recharge present.

#### T1.10 Static Build Integrity (Feature 19, R5)
- **Objective**: Verify static bundle integrity, 0 broken assets, and 0 runtime server calls.
- **Authoritative Sources**: `ORIGINAL_REQUEST.md` §R5, `PROJECT.md` Feature 19.
- **Assertions**:
  1. `T1.BUILD.1` **Production Build Execution**: `npm run build` succeeds with exit code 0.
  2. `T1.BUILD.2` **Dist Output Structure**: `dist/index.html` and `dist/home.html` exist.
  3. `T1.BUILD.3` **Zero Server API Calls**: Static landing executes with zero mandatory backend server endpoints.

---

### Tier 2: Boundary Value Analysis & Corner Cases (10 Tests)

- `T2.B1.1` **Max Level 100 Cap**: A card at Level 100 with full EXP cannot level up to 101, nor gain additional unspent points beyond cap.
- `T2.B1.2` **Level 1 Baseline State**: Fresh un-nurtured card starts at Lv 1, 0 EXP, 0 unspent points, and 0 bonus stats.
- `T2.B2.1` **Corrupted LocalStorage Recovery**: Malformed JSON string in `hero_card_nurturing` resets gracefully to defaults without crashing the UI.
- `T2.B2.2` **Missing LocalStorage Key**: Empty `localStorage` initializes clean default state with starter cards.
- `T2.B3.1` **Route Trailing Slash Resolution**: `/home`, `/home/`, `/`, and `/index.html` all route cleanly.
- `T2.B3.2` **Invalid Route Fallback**: Navigating to undefined hash/path falls back safely to home landing.
- `T2.B4.1` **Rapid Concurrency Nurture**: 50 rapid successive nurture actions properly accumulate total EXP without dropped updates.
- `T2.B5.1` **Zero Points Allocation Attempt**: Attempting to allocate stat when `statPoints === 0` safely returns false and does nothing.
- `T2.B6.1` **Mobile 320px Extreme Boundary**: Layout remains readable and buttons adhere to `min-h-[44px]` at 320px width.
- `T2.B7.1` **Static Offline Host Simulation**: All landing scripts and styles load without external network calls (file:// or localhost).

---

### Tier 3: Pairwise Combinations & State Machine (6 Tests)

- `T3.C1.1` **Nurture -> Stat Allocation -> Deck TP Update**: Nurturing Card 1 in the active deck to level up and allocating 1 point to `top` immediately increases Deck TP by 1.
- `T3.C1.2` **Shop Pack Purchase -> Collection Rate -> Total TP**: Buying a card pack adds new cards, incrementing collection count and Total TP.
- `T3.C1.3` **Play Section Scene Navigation -> TTS Invariance**: Changing scenes from 1 to 2 keeps TTS in OFF state unless toggled.
- `T3.C1.4` **Dual Routing Transition**: Switching between landing `/` and `/home` preserves independent application state.
- `T3.C1.5` **Modal Focus & Dismissal Cycle**: Opening Shopping Mall modal prevents background clicks; closing it restores section scroll.
- `T3.C1.6` **Bulk Stat Allocation Red Dot Clear**: Spending all accumulated stat points clears the red dot indicator immediately.

---

### Tier 4: Real-World Workload Scenarios (5 Tests)

- `T4.W1.1` **First-Time Visitor Journey**: Initial visit on desktop & mobile, 0 popups encountered, reviews novel/webtoon badges, opens and closes community modal.
- `T4.W1.2` **Full 1->100 Card Nurture & Reload Journey**: Nurtures Card 1 from Lv 1 all the way to Lv 100, distributes 99 stat points across all 4 directions, reloads page, and confirms persistent stats.
- `T4.W1.3` **Deck Optimization & Mathematical TP Audit**: Configures 5 cards, calculates predicted Deck TP ($N+E+S+W$) and Total TP, verifying exact mathematical agreement.
- `T4.W1.4` **Play Section 40-Episode Reading Journey**: Browses through webtoon episodes, steps through scenes with Next/Prev, tests TTS toggle on/off.
- `T4.W1.5` **Full Static Deployment Workload**: Audits production `dist/` bundle for zero broken relative links, standalone asset portability, and lightweight payload.

---

## 3. Test Execution Harness Guide

Run the suite from the repository root:

```bash
# 1. Full Master Landing E2E Verification (All 4 Tiers, 66 Assertions)
npx tsx tests/e2e/run_all.ts

# 2. Tier-Specific Invocations
npx tsx tests/e2e/run_all.ts --tier 1   # Tier 1: Feature Coverage (45 assertions)
npx tsx tests/e2e/run_all.ts --tier 2   # Tier 2: Boundary & Corner Cases (10 assertions)
npx tsx tests/e2e/run_all.ts --tier 3   # Tier 3: Cross-Feature State Machine (6 assertions)
npx tsx tests/e2e/run_all.ts --tier 4   # Tier 4: Real-World Workload Scenarios (5 assertions)

# 3. Progressive Milestone Invocations
npx tsx tests/e2e/run_all.ts --milestone M1   # Milestone 1: Static Architecture & MPA Decoupling
npx tsx tests/e2e/run_all.ts --milestone M2   # Milestone 2: Responsive Shell, Navigation & Assets
npx tsx tests/e2e/run_all.ts --milestone M3   # Milestone 3: Core Sections & Card Nurturing
npx tsx tests/e2e/run_all.ts --milestone M4   # Milestone 4: 100% E2E Pass & Hardening
npx tsx tests/e2e/run_all.ts --milestone ALL  # All Milestones

# 4. JSON Output & Automation
npx tsx tests/e2e/run_all.ts --json
npx tsx tests/e2e/run_all.ts --allow-fail
npx tsx tests/e2e/run_all.ts --verbose
```

---

## 4. Traceability Matrix

| Feature ID | Feature Name | Test IDs | Target Milestone | Status |
|---|---|---|---|---|
| **F1–F5** | Dual-Entry MPA Architecture | `T1.MPA.1` ~ `T1.MPA.5` | M1 | PENDING |
| **F6–F7, F11** | Responsive Layout & Zero Popups | `T1.RESP.1` ~ `T1.RESP.5` | M2 | PENDING |
| **F8–F10** | Top 6 & Side 8 Nav & Modals | `T1.NAV.1` ~ `T1.NAV.5` | M2 | PENDING |
| **F12** | Home Section & External Badges | `T1.HOME.1` ~ `T1.HOME.5` | M3 | PENDING |
| **F13** | MyDeck Section & TP Metrics | `T1.DECK.1` ~ `T1.DECK.5` | M3 | PENDING |
| **F14** | Play Section 5 Buttons & TTS OFF | `T1.PLAY.1` ~ `T1.PLAY.5` | M3 | PENDING |
| **F15–F16** | Card Section 1~100Lv Nurture & Red Dot | `T1.CARD.1` ~ `T1.CARD.6` | M3 | PENDING |
| **F17** | LocalStorage State Persistence | `T1.STORE.1` ~ `T1.STORE.4` | M3 | PENDING |
| **F18** | Shop Section 8 Fixed Items | `T1.SHOP.1` ~ `T1.SHOP.5` | M3 | PENDING |
| **F19** | Static Build Integrity | `T1.BUILD.1` ~ `T1.BUILD.3` | M4 | PENDING |
| **Boundary** | Boundary & Corner Analysis | `T2.B1.1` ~ `T2.B7.1` | M1–M3 | PENDING |
| **Integration** | Cross-Feature Interactions | `T3.C1.1` ~ `T3.C1.6` | M2–M3 | PENDING |
| **Workload** | Real-World Workload Scenarios | `T4.W1.1` ~ `T4.W1.5` | M3–M4 | PENDING |
