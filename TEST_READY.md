# TEST_READY: SNSHero Independent Static Landing & /home Decoupling E2E Test Suite

## 1. Readiness & Complete Test Harness Declaration

The Master 4-Tier E2E Test Suite and Autonomous Verification Harness for the **SNSHero Independent Static Landing & /home Decoupling** (`ORIGINAL_REQUEST.md ## 2026-11-02T03:18:46Z` and `PROJECT.md`) are **fully implemented, tested, and operational**.

- **Master Test Runner**: `tests/e2e/run_all.ts` (executable via `npx tsx tests/e2e/run_all.ts`)
- **Specification Documents**:
  - `ORIGINAL_REQUEST.md` (Authoritative Requirements R1–R5 & Acceptance Criteria)
  - `PROJECT.md` (Architecture, Feature Inventory 1–20, Milestones M1–M4, Interface Contracts)
  - `TEST_INFRA.md` (4-Tier Master E2E Test Infrastructure Specification)
  - `DESIGN.md` (OpenCode Terminal-Flat Design System)
- **Modular Test Suites**:
  - `tests/e2e/tier1_feature_coverage.ts`: Comprehensive Category-Partition suite covering all 10 feature groups and requirements R1–R5 (45 assertions). Verifies standalone static `index.html` entry, decoupled `home.html` SPA entry, Vite MPA rollup inputs, post-build preservation script, router decoupling, responsive 360px/768px/1024px layouts, 3-tier character visuals, 0 onboarding popups on visit, Top Nav 6 items, Side Nav 8 items, shopping/community/login modals, Home vertical scroll with Naver/Munpia "[절찬 연재중]" badges, MyDeck 5 cards & TP calculation, Play 5 buttons with TTS default OFF, Card 1~100Lv nurture engine with red dot indicator, LocalStorage persistence, Shop 8 fixed items, and build integrity.
  - `tests/e2e/tier2_boundary_corner.ts`: Boundary Value Analysis & Corner Cases (10 assertions). Verifies Level 100 max cap & zero overflow past 100, Level 1 clean baseline state, corrupted JSON recovery in LocalStorage without crashing, missing key default initialization, route trailing slash and fallback resolution, 50 rapid concurrency nurture accruals, zero-point allocation safety, 320px mobile viewport touch ergonomics, and static offline host zero-network integrity.
  - `tests/e2e/tier3_cross_feature.ts`: Pairwise Combinations & State Machine Suite (6 assertions). Verifies Card nurture -> Stat allocation -> Dynamic Deck TP / Total TP sync, Shop pack purchase -> Inventory expansion -> Collection rate update, Play scene stepping preserves TTS OFF state, Dual routing `/` vs `/home` independence, Modal backdrop open/close lifecycle, and Bulk stat point distribution clearing the red dot indicator.
  - `tests/e2e/tier4_realworld_workload.ts`: Real-World Workload Scenarios (5 assertions). Simulates full end-to-end first-time visitor journey (zero popups, landing review, external badges, modal dismiss), full 1->100 card nurture and distribution with page reload persistence check, mathematical Deck TP & Total TP audit against database card powers, Play section 40-episode reading journey, and static deployment build artifact validation.

---

## 2. Test Execution Harness Guide

Anyone can run the test suite directly from the project root:

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

## 3. Coverage Summary Table

| Test Tier | Scope | Total Assertions | Verified Contract & Baseline Logic | Pending Implementation Milestones |
|---|---|---|---|---|
| **Tier 1** | Feature Coverage & Interface Contracts (R1–R5, F1–F18) | **45** | 16 | 29 (Pending M1–M3 implementation) |
| **Tier 2** | Boundary Value Analysis & Corner Cases (Cap, Storage, Viewport) | **10** | 9 | 1 (Pending M2 CSS implementation) |
| **Tier 3** | Pairwise Cross-Feature Combinations & State Machine | **6** | 4 | 2 (Pending M1, M2 implementation) |
| **Tier 4** | Real-World Workload User Journeys & Mathematical Audits | **5** | 3 | 2 (Pending M2, M3 implementation) |
| **Total** | Master E2E Test Suite | **66** | **32** | **34** |

---

## 4. Feature Checklist & Traceability

- [x] **Standalone Static Landing (`index.html`)**: `T1.MPA.1`, `T2.B7.1`, `T3.C1.4`, `T4.W1.1`
- [x] **Decoupled Game SPA Entry (`home.html`)**: `T1.MPA.2`, `T1.MPA.5`, `T3.C1.4`
- [x] **Multi-Page Rollup Config (`vite.config.ts`)**: `T1.MPA.3`, `T4.W1.5`
- [x] **Post-Build Route Preservation (`scripts/post-build.js`)**: `T1.MPA.4`, `T1.BUILD.2`, `T4.W1.5`
- [x] **Responsive Layout (360px / 768px / 1024px)**: `T1.RESP.1`, `T1.RESP.2`, `T1.RESP.3`, `T2.B6.1`
- [x] **3-Tier Character Visual Assets**: `T1.RESP.4`
- [x] **Zero Onboarding Popups Guard (0 Popups on Visit)**: `T1.RESP.5`, `T4.W1.1`
- [x] **Top Navigation (Exact 6 Items: 홈, 마이덱, 플레이, 미션, 상점, 쇼핑몰)**: `T1.NAV.1`
- [x] **Side Navigation (Exact 8 Items: 로그인, 홈, 마이덱, 플레이, 미션, 상점, 쇼핑몰, 커뮤니티)**: `T1.NAV.2`
- [x] **Secondary Action Modals (쇼핑몰, 커뮤니티, 로그인 with Close Buttons)**: `T1.NAV.3`, `T1.NAV.4`, `T1.NAV.5`, `T3.C1.5`, `T4.W1.1`
- [x] **Home Section Vertical Scroll & SnowHero Intro**: `T1.HOME.1`, `T1.HOME.2`
- [x] **External Links with "[절찬 연재중]" Badges (Naver Novel, Naver Webtoon, Munpia)**: `T1.HOME.3`, `T1.HOME.4`, `T1.HOME.5`, `T4.W1.1`
- [x] **MyDeck Section (5 Cards, Deck TP, Total TP)**: `T1.DECK.1`, `T1.DECK.2`, `T1.DECK.3`, `T1.DECK.4`, `T1.DECK.5`, `T3.C1.1`, `T4.W1.3`
- [x] **Play Section (5 Buttons, TTS Default OFF, Webtoon Scene Navigation)**: `T1.PLAY.1`, `T1.PLAY.2`, `T1.PLAY.3`, `T1.PLAY.4`, `T1.PLAY.5`, `T3.C1.3`, `T4.W1.4`
- [x] **Card Section ('카드' Naming & Collection Rate Display)**: `T1.CARD.1`, `T1.CARD.2`, `T3.C1.2`
- [x] **Card Nurturing 1~100Lv Engine (EXP, Max Lv 100, Stat Points, Red Dot, 4-Way Allocation)**: `T1.CARD.3`, `T1.CARD.4`, `T1.CARD.5`, `T1.CARD.6`, `T2.B1.1`, `T2.B1.2`, `T2.B4.1`, `T2.B5.1`, `T3.C1.1`, `T3.C1.6`, `T4.W1.2`
- [x] **LocalStorage Persistence (`hero_card_nurturing`) Across Reload**: `T1.STORE.1`, `T1.STORE.2`, `T1.STORE.3`, `T1.STORE.4`, `T2.B2.1`, `T2.B2.2`, `T4.W1.2`
- [x] **Shop Section (Exact 8 Items: 일반/매직/희귀 카드팩, 아이템 팩, 광고 제거, 공식 소설, 공식 동영상, 코인 충전)**: `T1.SHOP.1`, `T1.SHOP.2`, `T1.SHOP.3`, `T1.SHOP.4`, `T1.SHOP.5`, `T3.C1.2`
- [x] **Static Build Integrity & Zero Mandatory Runtime Backend**: `T1.BUILD.1`, `T1.BUILD.2`, `T1.BUILD.3`, `T4.W1.5`
