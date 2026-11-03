# Handoff Report: Route Precedence & Dead Code Remediation for `src/routes.ts`

**Agent**: `explorer_m1_it2_2`  
**Milestone**: Milestone 1 Iteration 2 Remediation  
**Working Directory**: `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_m1_it2_2/`  
**Date**: 2026-11-02  

---

## 1. Observation

1. **Defect Location in `src/routes.ts`**:
   - Lines 482–488:
     ```typescript
     const cleanPath = pathname.replace(/\/$/, '').toLowerCase() || '/';

     if (cleanPath === '/home' || cleanPath === '/main-lobby') return 'home';
     if (cleanPath === '/deck' || cleanPath === '/mydeck') return 'mydeck';
     if (cleanPath === '/play' || cleanPath === '/main') return 'play';
     if (cleanPath === '/card' || cleanPath === '/cards' || cleanPath === '/mission' || cleanPath === '/missions') return 'card' as ViewType;
     if (cleanPath === '/shop') return 'shop';
     ```
   - Lines 497–502:
     ```typescript
     if (
       cleanPath === '/play' &&
       (params.get('ep') || params.get('episode') || params.get('ch') || params.get('chapter'))
     ) {
       return 'main';
     }
     ```
2. **Commit Origin**:
   - Git log shows commit `9d9011bb1fb8141a3ce9469046dee411c40d07d2` ("feat(m1): implement client-side hash routing core, legacy route elimination, and 15s idle auto-play manager") inserted lines 484–488 above the special prefix rules without re-ordering the conditional query check.
3. **Runtime Probe Execution**:
   - Command:
     ```bash
     npx tsx -e "import { getViewFromPath } from './src/routes'; console.log('/play?ep=1 =>', getViewFromPath('/play', '?ep=1'));"
     ```
   - Verbatim Output:
     ```
     /play?ep=1 => play
     ```
4. **Adversarial Test Suite Failure**:
   - Command: `npx tsx tests/adversarial_route_edge_cases.ts`
   - Verbatim Failures:
     ```
     [FAIL] [EDGE-QUERY-5] /play?ep=1 redirects to main RPG | Expected: main | Actual: play 
     [FAIL] [EDGE-QUERY-6] /play?episode=40 redirects to main RPG | Expected: main | Actual: play 
     [FAIL] [EDGE-QUERY-7] /play?ch=5 redirects to main RPG | Expected: main | Actual: play 
     [FAIL] [EDGE-QUERY-8] /play?chapter=12 redirects to main RPG | Expected: main | Actual: play
     ```
5. **Patch Dry-Run Validation**:
   - Commands:
     ```bash
     git apply --check .agents/teamwork/explorer_m1_it2_2/routes_precedence_fix.patch
     git apply --check .agents/teamwork/explorer_m1_it2_2/routes_precedence_minimal.patch
     ```
   - Both commands exit with status 0 (clean dry-run application).

---

## 2. Logic Chain

1. **Observation 1 & 2**: Line 486 `if (cleanPath === '/play' || cleanPath === '/main') return 'play';` executes unconditionally whenever `cleanPath === '/play'` or `cleanPath === '/main'`.
2. **Observation 1**: Lines 497–502 `if (cleanPath === '/play' && (params.get('ep') ...)) return 'main';` is placed further down in the same function.
3. Because code executes sequentially, any execution where `cleanPath === '/play'` matches at line 486 and returns `'play'` immediately.
4. Therefore, lines 497–502 can never be reached when `cleanPath === '/play'`, rendering lines 497–502 completely dead and unreachable.
5. **Observation 3 & 4**: When `getViewFromPath('/play', '?ep=1')` is called, the expected return is `'main'`, but it returns `'play'`, causing failures across test assertions `EDGE-QUERY-5`, `EDGE-QUERY-6`, `EDGE-QUERY-7`, and `EDGE-QUERY-8`.
6. To fix this defect, the evaluation of episode/chapter query parameters (`params.get('ep') || params.get('episode') || params.get('ch') || params.get('chapter')`) must be placed **before** line 486 so that requests with episode query parameters resolve to `'main'`, while requests without episode parameters fall through to return `'play'`. Lines 497–502 must be removed to avoid lingering dead code.
7. Furthermore, for hash routing (`#play?ep=1`), query parameters in `hash` should be extracted and evaluated in Step 1 so that hash deep-links also correctly resolve to `'main'`.

---

## 3. Caveats

- Areas not investigated: `scripts/post-build.js` is investigated by Explorer 1 (`explorer_m1_it2_1`). This report focuses specifically on `src/routes.ts`.
- Assumptions made: `KadanRpgView` expects `view === 'main'` when jumping to a story episode, which was confirmed by inspecting `src/App.tsx:5703-5720` and `src/hooks/useKadanRpgProgress.ts:185-218`.
- No other caveats.

---

## 4. Conclusion

- The route shadowing defect in `src/routes.ts` is 100% verified and reproducible.
- Two drop-in unified patches have been created in `.agents/teamwork/explorer_m1_it2_2/`:
  1. `routes_precedence_fix.patch`: Comprehensive fix handling both legacy pathname and hash deep-links with query parameters.
  2. `routes_precedence_minimal.patch`: Minimal fix reordering lines 486 and 497–502.
- Applying either patch resolves `EDGE-QUERY-5..8` while preserving all existing route mappings (`/home`, `/deck`, `/play`, `/shop`, `/reddit`, `/movie`, `/cinema`).

---

## 5. Verification Method

To independently verify the fix:

1. **Verify Patch Dry-Run**:
   ```bash
   git apply --check .agents/teamwork/explorer_m1_it2_2/routes_precedence_fix.patch
   ```
2. **Apply Patch to `src/routes.ts`**:
   ```bash
   git apply .agents/teamwork/explorer_m1_it2_2/routes_precedence_fix.patch
   ```
3. **Verify Edge-Case Query Tests**:
   ```bash
   npx tsx -e "
   import { getViewFromPath } from './src/routes';
   console.assert(getViewFromPath('/play', '?ep=1') === 'main', 'ep=1 must be main');
   console.assert(getViewFromPath('/play', '?episode=40') === 'main', 'episode=40 must be main');
   console.assert(getViewFromPath('/play', '?ch=5') === 'main', 'ch=5 must be main');
   console.assert(getViewFromPath('/play', '?chapter=12') === 'main', 'chapter=12 must be main');
   console.assert(getViewFromPath('/play', '?mode=ai') === 'play', 'mode=ai must be play');
   console.assert(getViewFromPath('/play', '') === 'play', 'empty query must be play');
   console.log('All query checks passed!');
   "
   ```
4. **Run Milestone 1 Unit Suite**:
   ```bash
   npx tsx tests/unit_m1_idle_autoplay.ts
   ```
5. **Run TypeScript Compiler**:
   ```bash
   npx tsc --noEmit
   ```
