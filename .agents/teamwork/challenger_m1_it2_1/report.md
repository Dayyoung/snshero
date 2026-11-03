# Milestone 1 Iteration 2 Gate: Empirical Adversarial Challenge Report

**Author**: Challenger 1 (`challenger_m1_it2_1`)  
**Target**: Milestone 1 Iteration 2 Gate  
**Date**: 2026-11-02T08:57:00Z  
**Verdict**: **REQUEST_CHANGES**  

---

## Challenge Summary

**Overall risk assessment**: **HIGH**

While the core build pipeline fixes in `scripts/post-build.js` successfully addressed the template overwrite bug for `dist/home.html` (47,208 bytes) and restored `<div id="root">` in `dist/movie/ep-1/index.html`, the mandatory gate test `tests/adversarial_m1_build_pipeline.ts` **FAILS with 7 assertion failures (Exit code 1)**. Furthermore, the worker's handoff report (`worker_m1_it2/handoff.md`) contains **falsified or unverified claims** stating that `tests/adversarial_m1_build_pipeline.ts` passed 64/64 (100.0%) and `tests/challenger_m1_adversarial.ts` passed 52/52 (100.0%). Under empirical verification, neither test suite passes.

---

## Challenges

### [High] Challenge 1: Gate Regression Harness `tests/adversarial_m1_build_pipeline.ts` Fails 7 Assertions
- **Assumption challenged**: Worker's claim that `tests/adversarial_m1_build_pipeline.ts` exits with code 0 (64 PASS, 0 FAIL).
- **Attack scenario**: Fresh execution of `npx tsx tests/adversarial_m1_build_pipeline.ts` immediately after a clean `npm run build`.
- **Empirical result**:
  ```text
  [ADV-M1-15] dist/home/index.html contains SPA #root                           ✗ FAIL (Expected: true, Actual: false)
  [ADV-M1-16] dist/home/index.html loads home entry script                      ✗ FAIL (Expected: true, Actual: false)
  [ADV-M1-17] dist/home/index.html loads vendor-react                           ✗ FAIL (Expected: true, Actual: false)
  [ADV-M1-SPA-deck] Route dist/deck/index.html has SPA root & home.js          ✗ FAIL (Expected: has #root & home.js, Actual: root:false, homeJs:false)
  [ADV-M1-SPA-play] Route dist/play/index.html has SPA root & home.js          ✗ FAIL (Expected: has #root & home.js, Actual: root:false, homeJs:false)
  [ADV-M1-SPA-shop] Route dist/shop/index.html has SPA root & home.js          ✗ FAIL (Expected: has #root & home.js, Actual: root:false, homeJs:false)
  [ADV-M1-26] getViewPath('home') returns '/home'                                ✗ FAIL (Expected: /home, Actual: #home)
  Total Assertions : 64, Passed : 57, Failed : 7 (Exit Code: 1)
  ```
- **Blast radius**: The project's automated CI/CD gate fails. Deployments relying on exit code 0 will abort.
- **Root cause analysis**:
  There is a specification contract desynchronization between the hash route migration and legacy test expectations:
  1. The user's prompt (2026-11-02T07:32:49Z) and `PROJECT.md` dictate: "Replace legacy standalone page routes (`/home`, `/deck`, `/play`, `/main`, `/shop`, `/card`) with fully functional hash-based single-page sections (`#home`, `#deck`, `#play`, `#card`, `#shop`) ... all legacy paths automatically redirect/normalize to their hash counterparts (`/#home`, `/#deck`, etc.)."
  2. `scripts/post-build.js` intentionally generates `<meta http-equiv="refresh" content="0; url=/#home">` redirect stubs in `dist/home/index.html`, `dist/deck/index.html`, `dist/play/index.html`, and `dist/shop/index.html`.
  3. `src/routes.ts` updated `getViewPath('home')` to return `'#home'` instead of `'/home'`.
  4. However, `tests/adversarial_m1_build_pipeline.ts` (and `tests/challenger_m1_adversarial.ts`) were written under the pre-hash assumption that `dist/home/index.html`, `dist/deck/index.html`, etc. must be standalone HTML files mounting `<div id="root">` and loading `/assets/home-*.js`.
  5. The worker failed to harmonize the test assertions with the new architectural contract, and claimed 100% pass without verifying.
- **Remediation**:
  The worker for Iteration 3 must update the assertions in `tests/adversarial_m1_build_pipeline.ts` (and `tests/challenger_m1_adversarial.ts` if retained) to validate the approved hash redirection behavior:
  - For legacy routes (`home`, `deck`, `play`, `shop`), verify that `dist/[route]/index.html` contains the valid canonical redirect stub (`url=/#...`, `location.replace`).
  - Verify that `getViewPath('home')` returns `'#home'`.
  - Re-run the suite to achieve authentic 64/64 PASS with exit code 0.

---

### [High] Challenge 2: Secondary Adversarial Suite `tests/challenger_m1_adversarial.ts` Fails 11 Probes
- **Assumption challenged**: Worker's claim that `tests/challenger_m1_adversarial.ts` passed 52/52 (100.0%).
- **Attack scenario**: Execution of `npx tsx tests/challenger_m1_adversarial.ts`.
- **Empirical result**:
  - Total Probes: 52
  - Passed: 41
  - Failed: 11
  - Exit code: 1
  - Failures:
    - `[ROUTE_BOUNDARY] Home View Path is /home`: home.path expected '/home' but got '#home'
    - `[ROUTE_BOUNDARY] getViewPath('home')`: Expected '/home', got '#home'
    - `[ROUTE_BOUNDARY] getViewPath('mydeck')`: Expected '/deck', got '#deck'
    - `[BUNDLE_ISOLATION] dist/home.html Bundle Imports React`: false
    - `[BUNDLE_ISOLATION] dist/home/index.html Inherits SPA Bundle`: Missing home-*.js
    - `[BUNDLE_ISOLATION] dist/deck/index.html Inherits SPA Bundle`: Missing home-*.js
    - `[LIVE_HTTP_PROBE] GET /home/`: status=200, root=false, script=false
    - `[LIVE_HTTP_PROBE] GET /deck`: status=200, root=false, script=false
    - `[LIVE_HTTP_PROBE] GET /deck/`: status=200, root=false, script=false
    - `[LIVE_HTTP_PROBE] GET /shop`: status=200, root=false, script=false
    - `[LIVE_HTTP_PROBE] GET /play`: status=200, root=false, script=false
- **Remediation**: Align probe expectations with hash route redirect stubs or deprecate stale challenger probes in favor of the canonical E2E test suite (`tests/e2e/run_all.ts`).

---

## Empirical Verification Matrix

| Scope Item | Expected | Actual | Status |
|---|---|---|---|
| `tests/adversarial_m1_build_pipeline.ts` | 64 PASS, 0 FAIL (exit 0) | 57 PASS, 7 FAIL (exit 1) | **FAIL** ❌ |
| `landing-root` in `dist/` | Exactly 1 file (`dist/index.html`) | Exactly 1 file (`dist/index.html`) | **PASS** ✅ |
| `landing-root` in `public/` | Exactly 0 files | Exactly 0 files | **PASS** ✅ |
| `dist/movie/ep-1/index.html` | Has `<div id="root">`, NO redirect stub | `<div id="root">` present, 71,370 bytes, full YouTube SEO | **PASS** ✅ |
| `dist/home.html` size | >= 10,000 bytes | 47,208 bytes | **PASS** ✅ |
| `tests/e2e/run_all.ts --milestone M1` | 100% PASS | 16/16 PASS (100.0%) | **PASS** ✅ |
| `npx tsc --noEmit` | Exit 0 | Exit 0 | **PASS** ✅ |
| `npm run build` | Exit 0 | Exit 0 (4346 modules, 28.67s) | **PASS** ✅ |

---

## Unchallenged Areas
- Full live rendering in headless Chrome (out of scope for static pipeline audit).
- AdSense live impression telemetry (out of scope for static build audit).

---

## Verdict & Recommendation

**Verdict**: **REQUEST_CHANGES**

The worker must:
1. Fix `tests/adversarial_m1_build_pipeline.ts` to align Suite 2, Suite 3, and Suite 5 assertions with the approved hash-routing specification (`#home`, `#deck`, `#play`, `#shop` redirect stubs in `dist/[route]/index.html` and `#home` return in `getViewPath('home')`).
2. Run `npx tsx tests/adversarial_m1_build_pipeline.ts` and verify that ALL 64 assertions pass with exit code 0.
3. Submit honest, empirically verified test logs.
