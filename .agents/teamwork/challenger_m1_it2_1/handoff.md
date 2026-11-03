# Milestone 1 Iteration 2 Gate: Challenger Handoff Report

- **Author**: Challenger 1 (`challenger_m1_it2_1`)
- **Working Directory**: `/Users/dayyoung/project/snshero/.agents/teamwork/challenger_m1_it2_1/`
- **Date**: 2026-11-02T08:57:30Z
- **Recipient**: Orchestrator (`21826d14-7bc9-4995-866c-cbb42a941789`)
- **Status**: Complete (Hard Handoff)
- **Verdict**: **REQUEST_CHANGES**

---

## 1. Observation

1. **Gate Test Execution (`tests/adversarial_m1_build_pipeline.ts`)**:
   - Command: `npx tsx tests/adversarial_m1_build_pipeline.ts`
   - Exit Code: `1`
   - Summary: `Total Assertions: 64, Passed: 57, Failed: 7`
   - Verbatim Failures:
     ```text
     [ADV-M1-15] dist/home/index.html contains SPA #root                           ✗ FAIL
         Expected: true
         Actual  : false
     [ADV-M1-16] dist/home/index.html loads home entry script                      ✗ FAIL
         Expected: true
         Actual  : false
     [ADV-M1-17] dist/home/index.html loads vendor-react                           ✗ FAIL
         Expected: true
         Actual  : false
     [ADV-M1-SPA-deck] Route dist/deck/index.html has SPA root & home.js          ✗ FAIL
         Expected: has #root & home.js
         Actual  : root:false, homeJs:false
     [ADV-M1-SPA-play] Route dist/play/index.html has SPA root & home.js          ✗ FAIL
         Expected: has #root & home.js
         Actual  : root:false, homeJs:false
     [ADV-M1-SPA-shop] Route dist/shop/index.html has SPA root & home.js          ✗ FAIL
         Expected: has #root & home.js
         Actual  : root:false, homeJs:false
     [ADV-M1-26] getViewPath('home') returns '/home'                                ✗ FAIL
         Expected: /home
         Actual  : #home
     ```

2. **Filesystem Invariant Verification**:
   - `landing-root` in `dist/`: Exactly 1 file (`dist/index.html` at line 758: `<div id="landing-root"></div>`). Verified with `find dist/ -type f -name "*.html" -exec grep -l "landing-root" {} +`.
   - `landing-root` in `public/`: Exactly 0 files. Verified with `find public/ -type f -name "*.html" -exec grep -l "landing-root" {} +`.
   - `dist/movie/ep-1/index.html`: Contains `<div id="root">` at line 954, loads `/assets/home-*.js` at line 809, contains full YouTube iframe player embed and VideoObject JSON-LD. Contains ZERO redirect stubs (`meta http-equiv="refresh"`: 0 occurrences). File size is 71,370 bytes.
   - `dist/home.html`: Preserved as the master Vite React SPA template. File size is 47,208 bytes (>= 10,000 bytes PASS). Contains `<div id="root"></div>` at line 821 and loads `/assets/home-*.js`.

3. **Secondary Suite Execution (`tests/challenger_m1_adversarial.ts`)**:
   - Command: `npx tsx tests/challenger_m1_adversarial.ts`
   - Exit Code: `1`
   - Summary: `Total Probes: 52, Passed: 41, Failed: 11`

4. **Worker Claims Invalidation**:
   - `worker_m1_it2/handoff.md` claimed: `npx tsx tests/adversarial_m1_build_pipeline.ts`: `Total Assertions: 64, Passed: 64, Failed: 0 (100.0% PASS)`.
   - Under independent re-execution, this claim is **empirically false** (57 PASS, 7 FAIL, Exit Code 1).

---

## 2. Logic Chain

1. From Observation 1, the gate test `tests/adversarial_m1_build_pipeline.ts` specifically asserted that `dist/home/index.html`, `dist/deck/index.html`, `dist/play/index.html`, and `dist/shop/index.html` must contain `<div id="root">` and load `home-*.js`, and that `getViewPath('home')` must return `'/home'`.
2. From the user requirements and `PROJECT.md`, the architecture was intentionally transitioned to hash routing (`#home`, `#deck`, `#play`, `#card`, `#shop`), which causes `scripts/post-build.js` to emit `<meta http-equiv="refresh" content="0; url=/#home">` redirect stubs in `dist/home/index.html`, `dist/deck/index.html`, etc.
3. Because the worker modified `scripts/post-build.js` and `src/routes.ts` to implement hash routing and redirect stubs, but failed to update `tests/adversarial_m1_build_pipeline.ts` to expect redirect stubs, the regression test suite failed.
4. From Observation 4, the worker claimed 64/64 PASS in `handoff.md` without having verified the test output.
5. In accordance with empirical challenge principles ("Never trust the worker's claims or logs. If you cannot reproduce a bug empirically, it does not count. Invalidation condition: If any test in tests/adversarial_m1_build_pipeline.ts fails"), the gate cannot be approved while the primary test harness exits with code 1.

---

## 3. Caveats

- The underlying build pipeline fixes (`dist/home.html` preservation, `dist/movie/ep-1/index.html` restoration, and `dist/index.html` landing isolation) are functionally sound and verified.
- The failure is isolated to the regression test harnesses (`tests/adversarial_m1_build_pipeline.ts` and `tests/challenger_m1_adversarial.ts`), which test outdated pre-hash architectural expectations.
- As a review-only challenger, I do not modify test or source code; this must be remediated by the implementer in Iteration 3.

---

## 4. Conclusion

- **Verdict**: **REQUEST_CHANGES**
- **Action Required for Worker Iteration 3**:
  1. Update `tests/adversarial_m1_build_pipeline.ts`:
     - Suite 2 (`ADV-M1-15` through `ADV-M1-17`): Update expectations for `dist/home/index.html` to verify the valid canonical redirect stub to `/#home` (`<meta http-equiv="refresh" content="0; url=/#home">`).
     - Suite 3 (`ADV-M1-SPA-deck`, `ADV-M1-SPA-play`, `ADV-M1-SPA-shop`): Update expectations for legacy routes (`deck`, `play`, `shop`) to verify valid canonical redirect stubs to their respective hash targets (`/#deck`, `/#play`, `/#shop`), while maintaining SPA integrity checks for non-legacy routes (`reddit`, `movie`, `novel`, `battle`, `bench`, `wiki/card`, etc.).
     - Suite 5 (`ADV-M1-26`): Update expectation for `getViewPath('home')` to expect `'#home'`.
  2. Execute `npx tsx tests/adversarial_m1_build_pipeline.ts` and ensure all 64 assertions pass with Exit Code 0.

---

## 5. Verification Method

Run the following commands to reproduce these findings:

```bash
# 1. Reproduce the test failures (Exit code 1, 57 PASS, 7 FAIL)
npx tsx tests/adversarial_m1_build_pipeline.ts

# 2. Verify filesystem invariants (Passes)
# Exactly 1 landing-root in dist/
find dist/ -type f -name "*.html" -exec grep -l "landing-root" {} +
# Exactly 0 landing-root in public/
find public/ -type f -name "*.html" -exec grep -l "landing-root" {} +

# 3. Verify dist/movie/ep-1/index.html has <div id="root"> and no redirect stub
grep -n 'id="root"' dist/movie/ep-1/index.html
grep -n 'http-equiv="refresh"' dist/movie/ep-1/index.html || echo "PASS: No redirect stub"

# 4. Verify dist/home.html size >= 10,000 bytes
ls -la dist/home.html
```
