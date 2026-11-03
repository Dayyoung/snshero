# Review & Adversarial Audit Report: Milestone 1 (M1)

- **Reviewer / Adversarial Critic**: `reviewer_m1_9_2`
- **Milestone Under Review**: M1 (Hash Route Navigation Core, Legacy Route Elimination & Global 15s Idle Auto-Play Transition)
- **Subject Worker**: `worker_m1_9` (Commits: `9d9011bb1`, `ecc34ad2f`)
- **Evaluation Date**: 2026-11-02T08:28:30Z

---

## 1. Review Summary

**Verdict**: **APPROVE**

Milestone 1 satisfies all functional, architectural, and integrity requirements:
1. **Hash Routing Core**: Canonical hash routing (`#home`, `#deck`, `#play`, `#card`, `#shop`) implemented cleanly with reentrancy protection and DOM slot replacement.
2. **Legacy Route Elimination**: All 7 hardcoded `href="/home"` links in landing components migrated to `#play` (`data-nav="play"`). 3-layer redirect architecture (Vite dev/preview 302 -> static `dist/` HTML stubs -> `<head>` replaceState) completely eliminates standalone routes without browser back-button trapping.
3. **15-Second Idle Auto-Play Transition**: Genuine production engine tracking 8 DOM input events with capture listeners, 250ms throttling, double-checked timestamp expiration, localStorage auto-mode flags (`hero_kadan_rpg_auto_mode`, `hero_kadan_rpg_auto_mode_season1`, `hero_auto_battle`, `hero_auto_loop_mode`), and custom event dispatch.
4. **Integrity Audit**: ZERO integrity violations detected. No dummy facade implementations, no hardcoded cheating, no fake assertions.
5. **Build & Test**: Strict TypeScript check (`npx tsc --noEmit`) passes with 0 errors; production build (`npm run build`) passes with exit code 0; E2E runner (`tests/e2e/run_all.ts --milestone M1`) passes 16/16 assertions (100%); unit test suite (`tests/unit_m1_idle_autoplay.ts`) passes 26/26 assertions (100%).

---

## 2. Findings

### [Minor] Finding 1: `tests/unit_m1_idle_autoplay.ts` hangs indefinitely in Node CLI environments

- **What**: When executing `npx tsx tests/unit_m1_idle_autoplay.ts`, all 26 assertions pass and print `TOTAL: 26 | PASSED: 26 | FAILED: 0`, but the process does not terminate and remains running until manually killed.
- **Where**: `tests/unit_m1_idle_autoplay.ts:114` and `src/landing/services/idleAutoPlayManager.ts:189, 295, 322`
- **Why**: 
  - Test 3 invokes `manager.triggerNow()`, which calls `performNavigation()`, which resets and schedules a new 15,000ms `setTimeout`.
  - In a Node.js CLI environment without a browser DOM (`typeof window === 'undefined'`), `isCurrentlyOnPlayScreen()` returns `false`, so every 15s expiration re-executes `performNavigation()` and re-schedules another 15s timer infinitely.
  - In addition, `tests/unit_m1_idle_autoplay.ts` does not call `manager.stop()` to unregister timers, and only calls `process.exit(1)` on failure, omitting an explicit `process.exit(0)` on success.
- **Severity**: Minor (does not affect browser production runtime or E2E runner; only affects standalone Node CLI execution).
- **Suggestion**: In a subsequent maintenance turn or milestone cleanup, call `manager.stop()` or add `process.exit(0)` at the conclusion of `runTests()`.

---

## 3. Verified Claims

| Claim by `worker_m1_9` | Verification Method | Result |
|---|---|---|
| `npx tsc --noEmit` passes with 0 errors | Executed in clean workspace | **PASS** (exit code 0) |
| `npm run build` succeeds | Executed Vite build and post-build generator | **PASS** (exit code 0) |
| `npx tsx tests/e2e/run_all.ts --milestone M1` passes 16/16 | Executed master E2E test runner | **PASS** (16/16, 100.0%) |
| `npx tsx tests/unit_m1_idle_autoplay.ts` passes 26/26 | Executed dedicated unit test runner | **PASS** (26/26, 100.0%) |
| Zero `href="/home"` links in landing components | Grep scan and Python AST file walk across `src/landing/` | **PASS** (0 anchor tags) |
| 3-Layer Legacy Redirect System active | Inspected `vite.config.ts`, `dist/deck/index.html`, and `index.html` inline `<script>` | **PASS** (all 3 layers verified) |
| All 8 DOM input events monitored | Inspected `MONITORED_INPUT_EVENTS` in `idleAutoPlayManager.ts` | **PASS** (8/8 monitored) |
| LocalStorage auto-mode flags persisted | Inspected `commitAutoModeFlags()` and verified in tests | **PASS** (all 4 keys written) |

---

## 4. Coverage Gaps & Unverified Items

- **Coverage Gaps**: None within Milestone 1 scope.
- **Unverified Items**: Milestone 2 (`#home` logos and `#deck` editing), Milestone 3 (`#play` tile adventure & battle loop), Milestone 4 (`#card` nurturing & repeat hunting), and Milestone 5 (`#shop` pack reveal & AdSense) are scheduled for subsequent milestones per `PROJECT.md`.

---

## 5. Adversarial Challenge & Stress Test Report

### Overall Risk Assessment: LOW

### Stress Review Dimensions:

#### Challenge 1: Programmatic Routing Recursion & Reentrancy
- **Stress Scenario**: Does calling `navigateTo()` or programmatically changing `window.location.hash` trigger an infinite ping-pong between `hashchange` and `popstate`?
- **Analysis & Testing**:
  - `src/landing/index.ts` implements a triple-layer guard:
    1. Mutex flag: `isProgrammaticRouting = true` with deferral reset `setTimeout(() => isProgrammaticRouting = false, 0)`.
    2. State comparison in `hashchange`: `if (parsedView !== state.activeView) navigateTo(...)`.
    3. State & Hash comparison in `navigateTo`: `if (state.activeView === resolvedView && window.location.hash === targetHash) return;`.
- **Result**: **PASS**. Reentrant loops are mathematically impossible under this triple guard.

#### Challenge 2: Idle Timer Cancellation Under High-Frequency Input Storms
- **Stress Scenario**: If a user violently scrolls or moves mouse at 240Hz right at the 14,999ms boundary, does the 250ms event throttle cause a premature trigger or crash?
- **Analysis & Testing**:
  - `handleUserActivity` updates `this.lastActivityTime = Date.now()` on EVERY event regardless of throttling.
  - In `onTimerExpired()`, it re-calculates `now - this.lastActivityTime`. If `elapsed < this.timeoutMs`, it reschedules for the remaining delta instead of triggering.
  - Stress tested with 50 synthetic rapid events in 50ms: 0 errors, no premature triggers.
- **Result**: **PASS**.

#### Challenge 3: Legacy Route Redirection & Browser Back-Button Trapping
- **Stress Scenario**: Does redirecting `/deck` to `/#deck` push an extra history entry that traps the user when clicking the browser's "Back" button?
- **Analysis & Testing**:
  - The static redirect stubs generated by `scripts/post-build.js` in `dist/deck/index.html` use `window.location.replace('/#deck' + search)`.
  - The inline script in `index.html` and `home.html` uses `window.history.replaceState({ view: 'home' }, '', '#home')`.
  - Neither `replace` nor `replaceState` push new history frames.
- **Result**: **PASS**. Browser back-button navigation returns to the external referrer or previous view cleanly.

#### Challenge 4: Complete Elimination of Landing `/home` Links
- **Stress Scenario**: Are there any remaining `/home` links that could bypass the hash router?
- **Analysis & Testing**:
  - Full codebase grep and python file walk confirmed 0 instances of `<a ... href="/home">`.
  - The 7 instances identified in `Header.tsx`, `Sidebar.tsx`, `Footer.tsx`, `Modals.tsx`, `HomeSection.tsx`, and `MyDeckSection.tsx` were all converted to `href="#play"` with `data-nav="play"`.
  - An event delegation interceptor in `src/landing/index.ts:230` catches any dynamic `/home` clicks as a safety net.
- **Result**: **PASS**.

---

## 6. Conclusion

The Milestone 1 deliverable is verified to be of high engineering quality, robust against edge cases, compliant with the project design system and architecture contracts, and completely free of integrity violations.

**Verdict**: **APPROVE**
