# Milestone 1 Iteration 3: Explorer 3 Handoff Report

- **Author**: Explorer 3 (`explorer_m1_it3_3`)
- **Role**: Teamwork Explorer (Read-Only Investigation & Synthesis)
- **Working Directory**: `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_m1_it3_3/`
- **Recipient**: Orchestrator (`21826d14-7bc9-4995-866c-cbb42a941789`)
- **Date**: 2026-11-02T18:05:00Z
- **Reference Report**: `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_m1_it3_3/report.md`

---

## 1. Observation

1. **Reproduction and Status of Challenger 2's 3 Reported Failures**:
   - Challenger 2 reported 3 failing live HTTP tests:
     - `[FAIL] [LIVE-HTTP-24] GET /r/hanguk`
     - `[FAIL] [LIVE-HTTP-26] GET /r/hanguk/comments/post_vibecoding_master`
     - `[FAIL] [LIVE-HTTP-28] GET /wiki/card`
   - In commit `bfefd8c41`, `scripts/post-build.js` lines 291–306 were amended to remove `if (!route.includes('/'))`, creating `${route}.html` with recursive parent directories for all nested routes.
   - We executed direct HTTP probes against the preview server (`http://localhost:3000`):
     ```bash
     $ curl -s http://localhost:3000/r/hanguk | grep -o 'id="[^"]*"'
     id="root"

     $ curl -s http://localhost:3000/r/hanguk/comments/post_vibecoding_master | grep -o 'id="[^"]*"'
     id="root"

     $ curl -s http://localhost:3000/wiki/card | grep -o 'id="[^"]*"'
     id="root"
     ```
   - When running `tests/adversarial_route_edge_cases.ts`:
     - `[PASS] [LIVE-HTTP-24] GET /r/hanguk (deep route)`
     - `[PASS] [LIVE-HTTP-26] GET /r/hanguk/comments/post_vibecoding_master`
     - `[PASS] [LIVE-HTTP-28] GET /wiki/card (nested deep route without trailing slash)`
   - All 3 tests originally failing in Challenger 2 are now confirmed **PASSING**.

2. **Current Failures in `tests/adversarial_route_edge_cases.ts` (66/76 PASS)**:
   - When executing `npx tsx tests/adversarial_route_edge_cases.ts`:
     - Suite 1 (Path resolution stress tests): 43/43 PASS (100.0%).
     - Suite 2 (Filesystem asset audit):
       - `[FAIL] [EDGE-SPA-ALL-ROUTES]`: Expected 0 failing files, got 251 failing files.
       - `[FAIL] [EDGE-ASSET-PATHS-ABSOLUTE]`: Expected 0 files with relative assets, got 2 files (`dist/home.html`, `dist/404.html`).
     - Suite 3 (Live HTTP probes):
       - `[FAIL] [LIVE-HTTP-6] GET /home/ (trailing slash)`: Status 200, hasRoot=false, hasScript=false
       - `[FAIL] [LIVE-HTTP-8] GET /home/ with query`: Status 200, hasRoot=false, hasScript=false
       - `[FAIL] [LIVE-HTTP-9] GET /deck`: Status 200, hasRoot=false, hasScript=false
       - `[FAIL] [LIVE-HTTP-10] GET /deck/ (trailing slash)`: Status 200, hasRoot=false, hasScript=false
       - `[FAIL] [LIVE-HTTP-11] GET /play`: Status 200, hasRoot=false, hasScript=false
       - `[FAIL] [LIVE-HTTP-12] GET /play/ (trailing slash)`: Status 200, hasRoot=false, hasScript=false
       - `[FAIL] [LIVE-HTTP-13] GET /shop`: Status 200, hasRoot=false, hasScript=false
       - `[FAIL] [LIVE-HTTP-14] GET /shop/ (trailing slash)`: Status 200, hasRoot=false, hasScript=false
     - Total: 66 Passed, 10 Failed (86.8% pass rate).

3. **Code Root Causes**:
   - **Root Cause A (`EDGE-ASSET-PATHS-ABSOLUTE`)**:
     `dist/home.html` contains `<script src="./assets/home-*.js">` directly emitted by Vite. In `scripts/post-build.js`, `ensureAbsoluteAssetPaths` creates `cleanBaseHtml` (`/assets/home-*.js`), but `cleanBaseHtml` is never written back to `dist/home.html` or `dist/404.html`.
   - **Root Cause B (`EDGE-SPA-ALL-ROUTES` and `LIVE-HTTP-6..14`)**:
     - `scripts/post-build.js` lines 216–274 write a bare 15-line `redirectHtml` stub for routes matching `legacyRoutesToHash` (`home`, `deck`, `play`, `shop`, `card`, etc.). Because this stub lacks `<div id="root"></div>` and `<script src="/assets/home-*.js"></script>`, tests inspecting the file or HTTP response fail.
     - `scripts/generate-news-seo.ts` line 658 wipes `public/r/news/comments`, but does not wipe `dist/r/news/comments`, leaving ~240 stale files from an earlier broken build in `dist/`.

---

## 2. Logic Chain

1. **Step 1**: From Observation 1, the 3 failing tests from Challenger 2 (`GET /r/hanguk`, `GET /r/hanguk/comments/post_vibecoding_master`, `GET /wiki/card`) failed because static web servers received clean URLs without trailing slashes and found neither a directory match nor a flat `.html` file, falling back to `dist/index.html` (`#landing-root`).
2. **Step 2**: Commit `bfefd8c41` fixed this by writing `${route}.html` for all routes in `routes` (both flat and nested). Verified with `curl` and `tests/adversarial_route_edge_cases.ts` (LIVE-HTTP-24, LIVE-HTTP-26, LIVE-HTTP-28 are now 100% passing).
3. **Step 3**: From Observation 2, `tests/adversarial_route_edge_cases.ts` currently fails on 10 assertions because:
   - `dist/home.html` and `dist/404.html` have relative paths `./assets/`.
   - `dist/home/index.html`, `dist/deck.html`, `dist/deck/index.html`, etc. contain bare `redirectHtml` stubs lacking `#root` and `assets/home-*.js`.
   - Stale news comments remain in `dist/r/news/comments/`.
4. **Step 4**: In `home.html` lines 33–63, the SPA template **already includes an early client-side hash normalizer** that intercepts `/home`, `/deck`, `/play`, `/card`, `/shop` and calls `window.location.replace('/' + legacyMap[pathname])` in `<head>`.
5. **Step 5**: Therefore, if `post-build.js` writes `cleanBaseHtml` (with `<meta http-equiv="refresh" content="0; url=/${targetHash}">` injected) for `legacyRoutesToHash`, AND saves `cleanBaseHtml` back to `dist/home.html` and `dist/404.html`, AND clears `dist/r/news/comments/`:
   - Real users in browsers are immediately redirected to `/#home`, `/#deck`, etc. before DOM rendering (satisfying Milestone 1 R1).
   - All test harnesses finding `#root` and `assets/home-*.js` pass 100%.
   - `tests/adversarial_route_edge_cases.ts` will reach **76/76 PASS (100.0%)**.

---

## 3. Caveats

- `tests/e2e/run_all.ts --milestone M1` is already passing 16/16 (100.0%) and is completely unaffected.
- The preview server on port 3000 must be running for live HTTP probes (PID 56068 currently active).
- No code was modified in `src/` or `scripts/` during this read-only exploration turn.

---

## 4. Conclusion

- **Defects from Challenger 2**:
  - `GET /r/hanguk`: **FIXED** (Verified returns `id="root"`).
  - `GET /r/hanguk/comments/post_vibecoding_master`: **FIXED** (Verified returns `id="root"`).
  - `GET /wiki/card`: **FIXED** (Verified returns `id="root"`).
- **Remediation for Worker M1 Iteration 3**:
  1. In `scripts/post-build.js`:
     - Wrap `legacyRoutesToHash` output into `cleanBaseHtml` with injected `<meta http-equiv="refresh">` so `#root` and `assets/home-*.js` are preserved.
     - Save `cleanBaseHtml` back to `dist/home.html` and `dist/404.html` (eliminates `./assets/` relative path error).
  2. In `scripts/generate-news-seo.ts`:
     - Delete `dist/r/news/comments` and `dist/reddit/comments` at startup (eliminates stale unhydrated files).

---

## 5. Verification Method

To verify 76/76 PASS after the Worker applies the remediation:

```bash
# 1. Type safety check
npx tsc --noEmit

# 2. Production build
npm run build

# 3. Verify preview server is active
lsof -i :3000 || npx vite preview --host 0.0.0.0 --port 3000 &
sleep 2

# 4. Run the adversarial route edge-case suite (Target: 76/76 PASS)
npx tsx tests/adversarial_route_edge_cases.ts

# 5. Direct verification of the 3 Challenger 2 routes
curl -s http://localhost:3000/r/hanguk | grep -o 'id="[^"]*"'
# Expected: id="root"

curl -s http://localhost:3000/r/hanguk/comments/post_vibecoding_master | grep -o 'id="[^"]*"'
# Expected: id="root"

curl -s http://localhost:3000/wiki/card | grep -o 'id="[^"]*"'
# Expected: id="root"

# 6. Verify full Milestone 1 test matrix
npx tsx tests/e2e/run_all.ts --milestone M1
npx tsx tests/adversarial_m1_build_pipeline.ts
npx tsx tests/challenger_m1_adversarial.ts
```

**Invalidation Conditions**:
- If `tests/adversarial_route_edge_cases.ts` reports < 76 passed assertions.
- If `curl -s http://localhost:3000/wiki/card` returns `id="landing-root"`.
