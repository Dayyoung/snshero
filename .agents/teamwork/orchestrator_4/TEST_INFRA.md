# E2E Test Infra: SNSHero Revolution Terminal-Flat Visual Unification

## Test Philosophy
- Opaque-box, requirement-driven. No dependency on implementation design.
- Verification channels: static AST/regex analysis, headless viewport geometry testing, touch target sizing audit, modal accessibility verification, and live bundle compilation.
- Methodology: Category-Partition + Boundary Value Analysis + Pairwise Combinatorial Testing + Real-World Workload Testing.

## Feature Inventory & Test Coverage
| # | Feature Area | Requirement | Tier 1 | Tier 2 | Tier 3 |
|---|-------------|-------------|:------:|:------:|:------:|
| 1 | Monospace Typography | All text labels/headers/badges enforce `font-mono`, 0 `font-sans`/`font-serif` | 5 | 5 | ✓ |
| 2 | 2-Tier Border Radius | `rounded-none` (0px) containers, `rounded-sm` (4px max) interactive elements | 5 | 5 | ✓ |
| 3 | Flat Surfaces & Borders | Solid Warm Cream (#fdfcfc)/Ink Dark (#201d1d), 1px hairlines, 0 gradients, 0 drop shadows | 5 | 5 | ✓ |
| 4 | Distraction-Free Animation | 0 `animate-ping`, 0 `animate-bounce` in target views | 5 | 5 | ✓ |
| 5 | Mobile 44px+ Touch Ergonomics | Minimum 44px height (`min-h-[44px]`) on all interactive buttons, tabs, pagination, and header CTAs | 5 | 5 | ✓ |
| 6 | Modal Close Accessibility | Top-layer visible `[x]` / `[SKIP]` buttons with 44px+ tap targets on all modals/drawers | 5 | 5 | ✓ |
| 7 | Zero Viewport Intrusion | 3x3 battle board, hand, mini-game canvas, and media artwork unobstructed by floating HUDs | 5 | 5 | ✓ |
| 8 | View Routing & Safe Lazy Loading | 100% `safeLazy` glob imports in `App.tsx`, 0 directory index imports | 5 | 5 | ✓ |
| 9 | LocalStorage Key Compliance | All persistent keys adhere to `hero_*` prefix format; 0 key resets | 5 | 5 | ✓ |
| 10 | Multilingual Support (i18n) | Clean translation keys across all 12 supported languages without raw translation keys | 5 | 5 | ✓ |

## Test Architecture
- Test runner: Python automated test runner `tests/e2e_design_system/run_all_e2e_tests.py`
- Test case format: programmatic AST token audits, viewport layout checks, and assertion suites
- Directory layout:
  - `tests/e2e_design_system/tier1_feature_coverage.py`
  - `tests/e2e_design_system/tier2_boundary_corner.py`
  - `tests/e2e_design_system/tier3_cross_feature.py`
  - `tests/e2e_design_system/tier4_realworld_workload.py`
  - `tests/e2e_design_system/run_all_e2e_tests.py`

## Real-World Application Scenarios (Tier 4)
| # | Scenario | Features Exercised | Complexity |
|---|----------|--------------------|------------|
| 1 | Full Mobile Onboarding & Home Navigation (375x812 viewport) | Monospace, flat surfaces, 44px touch targets, zero overflow | High |
| 2 | Card Battle & Skill Execution Flow (`MobileCardPlayScreen`) | 3x3 board clearance, 44px skill bar, LifeCycle toggle, hand selection | High |
| 3 | Poki Mini-Game Session & Settlement (`PlayGameView`) | Canvas clearance, MinimalistMissionHUD, CleanHUD, 44px exit/help CTAs | High |
| 4 | Gacha Summon, Shop Checkout & Marketplace Trading | Flat modals, 44px toast dismiss, LocalStorage persistence | High |
| 5 | Web Novel Reading & Cinematic Movie Playback | Drawer navigation, speech bubbles, SFX overlays, fullscreen player | High |
| 6 | Settings Adjustment & Strategy Simulation Flow | Flat toggles, slider tracks, simulator modal, LocalStorage key integrity | Medium |

## Coverage Thresholds
- Tier 1: ≥5 per feature area (≥50 test assertions)
- Tier 2: ≥5 per feature area (≥50 boundary assertions)
- Tier 3: pairwise coverage of view routes and component interactions (≥10 composite assertions)
- Tier 4: ≥6 realistic end-to-end application scenarios
- **Total: ≥116 programmatic test assertions across all 22+ views**
