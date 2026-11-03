# BRIEFING — 2026-11-02T08:39:30Z

## Mission
Investigate critical defect in `scripts/post-build.js` where `dist/home.html` is overwritten with a redirect stub instead of being preserved as the master React SPA template, causing downstream SEO scripts to break. Provide exact bug-free drop-in replacement.

## 🔒 My Identity
- Archetype: explorer
- Roles: [investigation, synthesis, report]
- Working directory: /Users/dayyoung/project/snshero/.agents/teamwork/explorer_m1_it2_1
- Original parent: 21826d14-7bc9-4995-866c-cbb42a941789
- Milestone: Milestone 1 Iteration 2 Remediation

## 🔒 Key Constraints
- Read-only investigation — do NOT implement
- Write only to /Users/dayyoung/project/snshero/.agents/teamwork/explorer_m1_it2_1/
- No modifications to source code files

## Current Parent
- Conversation ID: 21826d14-7bc9-4995-866c-cbb42a941789
- Updated: 2026-11-02T08:39:30Z

## Investigation State
- **Explored paths**: `scripts/post-build.js`, `dist/home.html`, `dist/home/index.html`, `dist/404.html`, `dist/movie/ep-1/index.html`, `scripts/generate-news-seo.ts`, `scripts/generate-video-seo.ts`, `src/routes.ts`, `vite.config.ts`, `tests/adversarial_m1_build_pipeline.ts`
- **Key findings**: Verified that `scripts/post-build.js:251-258` overwrites `dist/home.html` with a 16-line redirect stub. This corrupts `dist/404.html`, all 80 movie/cinema pages, and all 120 news pages. Also confirmed shadow defect in `src/routes.ts:486`.
- **Unexplored areas**: None. Exact drop-in code replacements formulated and documented.

## Key Decisions Made
- Guard both `dist/home.html` and `dist/index.html` from being overwritten in both legacy route redirect generation (lines 250-260) and standard route generation (lines 277-286).
- Document companion fix for `src/routes.ts` lines 484-502 to resolve the dead code issue.

## Artifact Index
- `DISPATCH.md` — record of incoming dispatch
- `progress.md` — liveness heartbeat
- `report.md` — comprehensive investigation report with exact drop-in replacements
- `handoff.md` — 5-component handoff report
