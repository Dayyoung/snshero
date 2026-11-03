# Milestone 1 Empirical Challenger Report: Hash Routing Core & Idle Auto-Play

- **Agent**: `challenger_m1_9_1` (Challenger 1)
- **Role**: empirical_challenger (critic, specialist)
- **Target**: Milestone 1 (`worker_m1_9`)
- **Date**: 2026-11-02T08:32:00Z
- **Verdict**: **APPROVE**
- **Overall Risk Assessment**: **LOW**

---

## 1. Executive Summary

As Challenger 1 for Milestone 1, I empirically designed, implemented, and executed an adversarial test harness (`tests/adversarial_m1_challenger1.ts`) targeting the newly deployed client-side hash routing core and global 15-second idle auto-play engine.

Across 5 comprehensive test suites containing **85 distinct adversarial assertions**, all 85 passed (100.0% pass rate) with zero unhandled exceptions, zero race conditions, zero memory leaks, and zero routing regressions.

Production build (`npm run build`), strict TypeScript type checking (`npx tsc --noEmit`), Milestone 1 master E2E suite (`npx tsx tests/e2e/run_all.ts --milestone M1`), and dedicated unit tests (`npx tsx tests/unit_m1_idle_autoplay.ts`) were all executed independently and passed with 100% success.

---

## 2. Adversarial Challenge Dimensions & Stress Testing

### Dimension 1: Hash Route Transitions & Exhaustive Input Normalization (52/52 PASS)
- **Canonical Routes**: `#home`, `#deck`, `#play`, `#card`, `#shop` resolve cleanly to their corresponding `ViewKey`.
- **Slash Permutations**: Leading slashes (`#/play`), trailing slashes (`#play/`), and combined slashes (`#/play/`) normalize without crashing.
- **Case Insensitivity**: Uppercase and mixed case variants (`#HOME`, `#Deck`, `#pLaY`, `#CARD`, `#sHoP`) normalize to lowercase `ViewKey`.
- **Query Parameter Stripping**: Query strings on hash routes (`#play?auto=true&season=1`, `#shop?pack=bronze`, `#deck?activeSlot=2`) are stripped before route matching.
- **Alias Resolution**: Backward-compatible aliases (`#main-lobby` -> `home`, `#mydeck` -> `deck`, `#main` -> `play`, `#battle` -> `play`, `#cards` -> `card`, `#mission` -> `card`, `#missions` -> `card`, `#companion` -> `card`, `#store` -> `shop`) map seamlessly.
- **Adversarial / Hostile Inputs**: Empty strings, bare `#`, multiple `###`, unregistered routes (`#unknown_route`), XSS attempts (`#<script>alert(1)</script>`), directory traversals (`#../../etc/passwd`), and encoded characters (`#%2e%2e%2f`) safely default to `'home'` without DOM corruption.
- **Legacy Pathname Fallback**: When hash is absent, pathname strings (`/home`, `/deck`, `/play`, `/card`, `/shop`, etc.) fall back to the equivalent hash route.
- **Precedence Invariant**: Hash routing strictly takes precedence over pathname (`parseRoute('#card', '/play') === 'card'`).

### Dimension 2: Rapid Consecutive Transitions & DOM Section Rendering (5/5 PASS)
- **1,000 Rapid Sequential Transitions**: Executed 1,000 back-to-back synchronous `navigateTo()` calls cycling through all 5 views (`home -> deck -> play -> card -> shop`). Execution completed in 214.7ms with zero errors.
- **DOM Consistency**: `landing-main-slot` remained populated with valid rendered HTML corresponding to the final transition state.
- **Reentrancy Mutex Lock**: The `isProgrammaticRouting` lock prevents infinite loops between programmatic hash updates and native `hashchange`/`popstate` listeners.
- **Audio Cleanup Hook**: Repeated 200-cycle ping-pong transitions (`#play <-> #home`) reliably executed `stopPlayTts()` each time `#play` was exited.
- **Idempotency Guard**: Redundant navigation to the currently active view (`navigateTo('home')` while on `#home`) safely avoided DOM thrashing.

### Dimension 3: Inactivity Timing & Idle Threshold Oracle (16/16 PASS)
- **Configuration Invariants**: Verified exact 15,000ms idle threshold, `https://dayyoung-macbookpro.tail3717a4.ts.net/#play` destination, `#play` fallback, and 250ms event throttle.
- **All 8 Interaction Vectors**: Verified that all 8 required events (`mousemove`, `mousedown`, `keydown`, `touchstart`, `touchmove`, `scroll`, `pointerdown`, `wheel`) register on `window` with `{ capture: true, passive: true }` and update `lastActivityTime`.
- **High-Frequency Burst Resistance**: Flooded 2,000 `mousemove` events in < 1ms; `throttleMs` (250ms) effectively prevented timer recreation thrashing while maintaining timestamp accuracy.
- **In-Place Screen Scenario Matrix**:
  - Inactive on `#home`, `#deck`, `#card`, `#shop`: triggers navigation to Tailscale `#play`.
  - Inactive on `#play` with `autoMode: false`: activates auto-mode in place without redundant page reload.
  - Inactive on `#play` with `autoMode: true`: bypasses redundant reload and resets countdown.
- **Storage Persistence & Event Dispatch**: Confirmed atomic writing of `hero_kadan_rpg_auto_mode`, `hero_kadan_rpg_auto_mode_season1`, `hero_auto_battle`, `hero_auto_loop_mode`, and broadcast of `hero_kadan_rpg_auto_mode_updated` and `snshero_idle_autoplay_triggered`.

### Dimension 4: Codebase-Wide Legacy Route Elimination Audit (4/4 PASS)
- **0 Legacy Hrefs in Landing UI**: Programmatic regex audit across all components and views in `src/landing/` confirmed zero hardcoded `href="/home"`, `href="/deck"`, `href="/play"`, `href="/card"`, `href="/shop"`, or `href="/main"` links.
- **Static Redirect Stubs**: Confirmed static HTML redirect stubs exist in `dist/deck/index.html`, `dist/play/index.html`, `dist/card/index.html`, `dist/shop/index.html`, `dist/home/index.html`, and `dist/mydeck/index.html` featuring both `<meta http-equiv="refresh">` and `location.replace` to `/#...`.
- **Inline Head Normalizer**: Verified `index.html` early `<script>` normalizes legacy and root URLs to `/#home` via `history.replaceState`.
- **Routes Mapping**: Verified `src/routes.ts` maps all core views (`home`, `mydeck`, `play`, `card`, `shop`) to `#home`, `#deck`, `#play`, `#card`, `#shop`.

### Dimension 5: Deterministic Clock Stepping & Browser History (8/8 PASS)
- **Exact Clock Stepping**:
  - Advancing time to 14,999ms confirmed that idle transition strictly does NOT fire.
  - Advancing 1ms further to exactly 15,000ms confirmed that idle transition fires.
- **Interaction Reset Boundary Protection**:
  - Triggering a `keydown` interaction at t = 14,950ms (50ms before expiration) rescheduled the timer.
  - Advancing to t = 15,050ms (100ms after interaction): transition did NOT fire.
  - Advancing to t = 29,949ms (14,999ms after interaction): transition did NOT fire.
  - Advancing to t = 29,950ms (exactly 15,000ms after interaction): transition fired.
- **Popstate Simulation**: Simulating browser Back/Forward navigation with `PopStateEvent` across multiple history frames updated active views without reentrancy crashes.

---

## 3. Stress Test Results Summary

| Suite | Category | Assertions | Passed | Failed | Pass Rate |
|---|---|---|---|---|---|
| Suite 1 | Hash Route Transitions & Normalization Matrix | 52 | 52 | 0 | 100.0% |
| Suite 2 | Rapid Consecutive Transitions & DOM Stress | 5 | 5 | 0 | 100.0% |
| Suite 3 | Inactivity Timing & Idle Threshold Oracle | 16 | 16 | 0 | 100.0% |
| Suite 4 | Codebase-Wide Legacy Route Elimination Audit | 4 | 4 | 0 | 100.0% |
| Suite 5 | Deterministic Clock Stepping & Popstate | 8 | 8 | 0 | 100.0% |
| **TOTAL** | **All Challenger 1 Adversarial Suites** | **85** | **85** | **0** | **100.0%** |

Machine-readable audit trail recorded in: `tests/challenger_m1_results.json`.

---

## 4. Build, Type Safety & Regression Test Status

- `npx tsc --noEmit`: 0 errors (Exit code 0)
- `npm run build`: Production bundle succeeded with exit code 0 (`dist/` generated with all static stubs and SEO assets)
- `npx tsx tests/e2e/run_all.ts --milestone M1`: 16/16 assertions PASS (100.0%)
- `npx tsx tests/unit_m1_idle_autoplay.ts`: 26/26 assertions PASS (100.0%)
- `npx tsx --loader ./tests/esm-loader.mjs tests/adversarial_m1_challenger1.ts`: 85/85 assertions PASS (100.0%)

---

## 5. Verdict & Recommendation

**Verdict**: **APPROVE**

Milestone 1 satisfies all functional, architectural, adversarial, and performance requirements specified in `ORIGINAL_REQUEST.md` and `PROJECT.md`. The implementation is robust against edge cases, rapid navigation thrashing, high-frequency user input flooding, and legacy route redirection.
