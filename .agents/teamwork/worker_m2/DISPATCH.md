## 2026-11-02T05:25:11Z
# Dispatch Assignment: worker_m2

## Mission
Implement Milestone 2: Responsive Shell, Navigation & Assets (Features 6–11) based on the comprehensive specifications from `explorer_m2_1`, `explorer_m2_2`, and `explorer_m2_3`.

## Deliverables & Write Ownership
You have exclusive write ownership over:
- `src/landing/types.ts`
- `src/landing/styles/landing.css`
- `src/landing/components/Header.tsx`
- `src/landing/components/Sidebar.tsx`
- `src/landing/components/Modals.tsx`
- `src/landing/components/Footer.tsx`
- `src/landing/services/assetCatalog.ts`
- `src/landing/views/HomeSection.tsx` (M2 layout placeholder containing external serialization links for T4.W1.1)
- `src/landing/index.ts`

## Strict Constraints & Requirements
1. **ZERO REACT RUNTIME IN LANDING**: Do NOT import React runtime (`vendor-react`) in `src/landing/`. All landing components must be pure TypeScript template string renderers / DOM generators. `dist/index.html` must remain ultra-lightweight (< 50 KB, target < 25 KB).
2. **OpenCode Terminal-Flat Aesthetics**:
   - `font-mono` on all text elements
   - 0px border-radius on cards, panels, containers, modals (`rounded-none`)
   - 4px border-radius on buttons, inputs, badges (`rounded-sm`)
   - 1px hairline borders (`rgba(15, 0, 0, 0.12)` or `border-neutral-800`)
   - Single flat cream (`#fdfcfc`) or ink (`#201d1d`) surfaces. No shadows (`shadow-none`), no multi-color gradients.
3. **Ergonomic 44px+ Touch Targets**:
   - Every interactive control (`button`, `a`, `[role="button"]`) must have `min-h-[44px]` and `box-sizing: border-box`.
4. **Navigation Exact Items**:
   - Top Nav (`Header.tsx`): Exact 6 items: `'홈'`, `'마이덱'`, `'플레이'`, `'미션'`, `'상점'`, `'쇼핑몰'`. Include `md:`, `lg:`, `min-h-[44px]`.
   - Side Nav (`Sidebar.tsx`): Exact 8 items: `'로그인'`, `'홈'`, `'마이덱'`, `'플레이'`, `'미션'`, `'상점'`, `'쇼핑몰'`, `'커뮤니티'`. Include off-canvas drawer, backdrop, `[x]` dismiss, `min-h-[44px]`.
5. **Secondary Action Modals (`Modals.tsx`)**:
   - Modals for `'쇼핑몰'` (`mall`), `'커뮤니티'` (`community`), `'로그인'` (`login`).
   - Must include `fixed inset-0 z-50 backdrop bg-black/50`, top-right `[x]` dismiss, bottom `닫기` button, and explanation that LocalStorage permanently saves 100% of game progression.
6. **Zero Onboarding Popups**:
   - Do NOT include `showTutorial`, `onboarding`, `FirstVisit`, `window.alert`, or `initialModal: true` in `index.ts` or `Modals.tsx`.
   - Initial modal state must strictly be `activeModal = null`.
7. **3-Tier Character Visual Assets Catalog (`assetCatalog.ts`)**:
   - 110-character catalog covering:
     - 7-head: `cutouts` (`public/anime-character-sheets/cutouts/`)
     - Torso/bust: `bust` (`public/anime-character-sheets/busts/`) and `seat/` (`public/seat/`)
     - 3-head SD: `sd` / `3head` (`public/seat/`, `public/cards1.png`, `public/cards2.png`)
   - Multi-tier prioritized fallback and inline terminal-flat SVG data-URI generator.
8. **Verification**:
   - Run `npx tsc --noEmit` (must be 0 errors).
   - Run `npm run build` (must succeed with exit code 0).
   - Run `npx tsx tests/e2e/run_all.ts --milestone M2` (must be 100.0% PASS).
   - Run `npx tsx tests/e2e/run_all.ts --milestone M1` (must remain 100.0% PASS).
   - Submit Google Form report via `python3 skills/report-ex/scripts/submit_report.py` and record in `WORK_LOGS.md`.
   - Commit changes via `git commit` (DO NOT git push).

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Authoritative Inputs
- `/Users/dayyoung/project/snshero/.agents/teamwork/ORIGINAL_REQUEST.md`
- `/Users/dayyoung/project/snshero/PROJECT.md`
- `/Users/dayyoung/project/snshero/TEST_INFRA.md`
- `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_m2_1/handoff.md`
- `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_m2_2/handoff.md`
- `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_m2_3/handoff.md`

## Output Requirements
Write your handoff report to:
`/Users/dayyoung/project/snshero/.agents/teamwork/worker_m2/handoff.md`
Report back via send_message when complete.
