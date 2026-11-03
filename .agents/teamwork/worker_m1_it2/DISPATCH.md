## 2026-11-02T08:42:19Z
You are the Remediation Worker for Milestone 1 Iteration 2 (worker_m1_it2).
Working directory: /Users/dayyoung/project/snshero/.agents/teamwork/worker_m1_it2/

MANDATORY FIRST STEP:
Read /Users/dayyoung/project/snshero/.agents/teamwork/ORIGINAL_REQUEST.md completely.
Also read /Users/dayyoung/project/snshero/PROJECT.md and the three Remediation Explorer reports:
- /Users/dayyoung/project/snshero/.agents/teamwork/explorer_m1_it2_1/handoff.md (post-build.js home.html protection)
- /Users/dayyoung/project/snshero/.agents/teamwork/explorer_m1_it2_2/handoff.md (routes.ts query precedence)
- /Users/dayyoung/project/snshero/.agents/teamwork/explorer_m1_it2_3/handoff.md (verification criteria)

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Remediation Tasks:
1. Fix `scripts/post-build.js`:
   - In lines 250-260, add `isProtectedTemplate` check so that `dist/home.html` is strictly NEVER overwritten with a redirect stub. `dist/home/index.html` must remain a redirect stub to `/#home`, but `dist/home.html` must remain the compiled React SPA bundle.
   - In lines 277-286, ensure `dist/home.html` is also protected from non-legacy route writes.
   - Reference exact code in `explorer_m1_it2_1/handoff.md` Section 4.A & 4.B.
2. Fix `src/routes.ts`:
   - In `getViewFromPath()`, reorder the check for `/play` so query parameters (`params.get('ep') || params.get('episode') || params.get('ch') || params.get('chapter')`) are evaluated before the static `/play` fallback, returning `'main'` when query params exist.
   - You can apply the patch from `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_m1_it2_2/routes_precedence_fix.patch` or implement the reordering directly.
3. Fix `scripts/generate-video-seo.ts`:
   - In lines 699-705, ensure baseHtml loads `dist/home.html` (the React SPA bundle) instead of `dist/index.html`.
4. Verification:
   - Run `npx tsc --noEmit` (0 errors)
   - Run `npm run build`
   - Verify: `test $(wc -c < dist/home.html) -ge 10000` (must be ~46KB, not a 16-line stub)
   - Verify: `grep -q 'id="root"' dist/home.html`
   - Verify: `grep -q 'id="root"' dist/movie/ep-1/index.html` and verify NO `url=/#home` redirect stub in movie ep-1
   - Verify: `npx tsx tests/e2e/run_all.ts --milestone M1` (16/16 PASS)
   - Verify: `npx tsx -e "import { getViewFromPath } from './src/routes'; console.log(getViewFromPath('/play', '?ep=1'));"` prints `'main'`
   - Commit locally (do NOT push).
5. Write your handoff report to /Users/dayyoung/project/snshero/.agents/teamwork/worker_m1_it2/handoff.md and notify the orchestrator.
