# Handoff Report: Milestone 1 Iteration 2 Remediation Completion

- **Agent**: `worker_m1_it2` (Implementer / QA Specialist)
- **Recipient**: Orchestrator (`21826d14-7bc9-4995-866c-cbb42a941789`)
- **Working Directory**: `/Users/dayyoung/project/snshero/.agents/teamwork/worker_m1_it2/`
- **Milestone**: Milestone 1 Iteration 2 Remediation
- **Handoff Type**: Hard (Task Complete)
- **Date**: 2026-11-02T08:52:00Z

---

## 1. Observation

1. **Pre-fix Defect 1 (Overwriting `dist/home.html` in `scripts/post-build.js`)**:
   - In `scripts/post-build.js:250-258`, iterating over `legacyRoutesToHash['home']` caused `flatHtmlPath = path.join(distDir, 'home.html')` to write the 16-line `redirectHtml` stub over `dist/home.html`.
   - `dist/home.html` shrank from ~46 KB to 535 bytes, losing its React SPA bundle and `<div id="root"></div>`.
   - `dist/404.html` and downstream generators (`scripts/generate-video-seo.ts`, `scripts/generate-news-seo.ts`) used `dist/home.html` as `spaTemplatePath`, causing all 80 movie/cinema static HTML pages (e.g. `dist/movie/ep-1/index.html`) to lose `<div id="root"></div>` and contain `<meta http-equiv="refresh" content="0; url=/#home">`.

2. **Pre-fix Defect 2 (Shadowed query parameters in `src/routes.ts`)**:
   - `src/routes.ts:486` had:
     ```typescript
     if (cleanPath === '/play' || cleanPath === '/main') return 'play';
     ```
   - Lines 497–502 evaluated `(params.get('ep') || ...)` but were never reached because line 486 returned early.
   - Executing `getViewFromPath('/play', '?ep=1')` returned `'play'` instead of `'main'`.

3. **Post-fix Source Code Changes**:
   - `scripts/post-build.js`: Added `isProtectedTemplate` guard in Step 0b and `isProtectedMasterTemplate` in Step 3:
     ```javascript
     const flatHtmlPath = path.join(distDir, `${route}.html`);
     const isProtectedTemplate =
       route === 'home' ||
       flatHtmlPath === homeHtmlPath ||
       flatHtmlPath === indexPath ||
       path.relative(distDir, flatHtmlPath) === 'home.html' ||
       path.relative(distDir, flatHtmlPath) === 'index.html';

     if (!isProtectedTemplate) {
       ...
       fs.writeFileSync(flatHtmlPath, redirectHtml, 'utf8');
     }
     ```
     `dist/home/index.html` receives the redirect stub to `/#home`, while `dist/home.html` remains the untouched ~47 KB compiled React SPA bundle.
   - `src/routes.ts`: Reordered query parameter check before static `/play` fallback, parsed hash queries into `params`, and removed dead code at lines 497–502.
   - `scripts/generate-video-seo.ts`: Confirmed `resolveSpaBaseTemplate()` and `baseHtml` load the intact `dist/home.html`.

4. **Post-fix Build & Artifact Verification**:
   - `npx tsc --noEmit` exited with code 0 (0 errors).
   - `npm run build` completed with code 0.
   - `dist/home.html` size: 47,208 bytes (>= 10,000 bytes). Contains `<div id="root"></div>` and `/assets/home-*.js`.
   - `dist/home/index.html`: Contains `<meta http-equiv="refresh" content="0; url=/#home">` redirect stub.
   - `dist/404.html` size: 47,208 bytes. Contains `<div id="root"></div>`.
   - `dist/movie/ep-1/index.html`: Contains `<div id="root">\n...` and YouTube `iframe` (`https://www.youtube.com/embed/62ziCvTMfB8`). ZERO `url=/#home` redirect tags.
   - `getViewFromPath('/play', '?ep=1')`: Returns `'main'`.
   - Idempotency test: Executing `node scripts/post-build.js` a second time produced an identical SHA-256 hash for `dist/home.html`.
   - `npx tsx tests/e2e/run_all.ts --milestone M1`: 16/16 assertions passed (100.0%).
   - Explorer 3 independent 5-target verification harness: ALL 5 TARGETS VERIFIED SUCCESSFULLY.

---

## 2. Logic Chain

1. [Supported by Obs 1] By adding `isProtectedTemplate` to `scripts/post-build.js`, `dist/home.html` is skipped during flat redirect file generation.
2. [Supported by Obs 3, 4] Vite compiles `home.html` into `dist/home.html` (47,208 bytes) with `<div id="root"></div>`. Because `isProtectedTemplate` skips writing to `dist/home.html`, the file remains the master SPA bundle.
3. [Supported by Obs 1, 4] `dist/home/index.html` is written as the redirect stub to `/#home`, fulfilling the legacy route redirect requirement.
4. [Supported by Obs 1, 4] `scripts/generate-video-seo.ts` and `scripts/generate-news-seo.ts` read `dist/home.html`, finding `<div id="root"></div>`. They inject their SEO/Video markup properly. Consequently, `dist/movie/ep-1/index.html` contains the full player markup and no redirect stub.
5. [Supported by Obs 2, 3, 4] In `src/routes.ts`, placing the query parameter evaluation ahead of the static `/play` return ensures `/play?ep=1` branches to `'main'`, eliminating route shadowing and passing all edge-case tests.

---

## 3. Caveats

- **No Caveats**: All required files were identified, patched with minimal changes, and verified against all criteria specified in the dispatch and explorer reports.
- **Git Push Constraint**: Changes were committed locally only (`bfefd8c41`). `git push` was not executed, adhering strictly to user rules.

---

## 4. Conclusion

- Milestone 1 Iteration 2 Remediation tasks are 100% complete and fully verified.
- `dist/home.html` is permanently protected against overwriting and preserves the compiled React SPA bundle.
- `dist/home/index.html` remains the redirect stub to `/#home`.
- `dist/movie/ep-1/index.html` has `#root` and YouTube iframe restored with no redirect stub.
- `getViewFromPath('/play', '?ep=1')` returns `'main'`.
- All tests pass: `npx tsc --noEmit` (0 errors), `npm run build` (code 0), `tests/e2e/run_all.ts --milestone M1` (16/16 PASS).
- Local commit created: `bfefd8c41`.
- Mandatory Google Form completion report submitted.

---

## 5. Verification Method

To independently reproduce and verify:

```bash
# 1. Type check
npx tsc --noEmit

# 2. Production build
npm run build

# 3. Check dist/home.html preservation
test $(wc -c < dist/home.html) -ge 10000 && grep -q '<div id="root"></div>' dist/home.html && ! grep -q 'http-equiv="refresh"' dist/home.html && echo "TARGET 1 PASS"

# 4. Check dist/movie/ep-1/index.html has #root and NO redirect stub
grep -q '<div id="root">' dist/movie/ep-1/index.html && grep -q '<iframe' dist/movie/ep-1/index.html && ! grep -q 'http-equiv="refresh"' dist/movie/ep-1/index.html && echo "TARGET 2 PASS"

# 5. Check dist/404.html SPA fallback
test $(wc -c < dist/404.html) -ge 10000 && test $(wc -l < dist/404.html) -gt 100 && grep -q '<div id="root"></div>' dist/404.html && ! grep -q 'http-equiv="refresh"' dist/404.html && echo "TARGET 3 PASS"

# 6. Check route query precedence
npx tsx -e "import { getViewFromPath } from './src/routes'; process.exit(getViewFromPath('/play', '?ep=1') === 'main' ? 0 : 1)" && echo "TARGET 4 PASS"

# 7. Check post-build idempotency
H1=$(shasum -a 256 dist/home.html) && node scripts/post-build.js > /dev/null 2>&1 && H2=$(shasum -a 256 dist/home.html) && [ "$H1" = "$H2" ] && echo "TARGET 5 PASS"

# 8. Run M1 E2E suite
npx tsx tests/e2e/run_all.ts --milestone M1
```
