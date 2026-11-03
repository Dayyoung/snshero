# BRIEFING — 2026-11-02T03:45:00Z

## Mission
Milestone 1의 Vite Multi-Page Application (MPA) 번들러 설정(`vite.config.ts`)에 대해 정밀 조사하고 워커가 즉시 구현할 수 있는 구체적인 rollupOptions input 사양 도출

## 🔒 My Identity
- Archetype: explorer
- Roles: teamwork_explorer
- Working directory: /Users/dayyoung/project/snshero/.agents/teamwork/explorer_m1_2/
- Original parent: 7b342c7a-1d74-43d7-a388-5ffc926b3969
- Milestone: Milestone 1 (Static Architecture & MPA Decoupling)

## 🔒 Key Constraints
- Read-only investigation — do NOT implement
- Reply to the user in Korean
- Write report to /Users/dayyoung/project/snshero/.agents/teamwork/explorer_m1_2/survey_report.md and handoff.md
- Send message back to caller id 7b342c7a-1d74-43d7-a388-5ffc926b3969

## Current Parent
- Conversation ID: 7b342c7a-1d74-43d7-a388-5ffc926b3969
- Updated: 2026-11-02T03:45:00Z

## Investigation State
- **Explored paths**: ORIGINAL_REQUEST.md, PROJECT.md, DISPATCH.md, explorer_survey_1/survey_report.md, vite.config.ts, scripts/post-build.js, scripts/watch-build.js, src/routes.ts, index.html, package.json
- **Key findings**:
  1. `vite.config.ts`에서 ESM 환경 특성상 `__dirname` 대신 `process.cwd()` 일관 사용 필수 확인.
  2. `rollupOptions.input: { main: path.resolve(process.cwd(), 'index.html'), home: path.resolve(process.cwd(), 'home.html') }` 사양 확정.
  3. `entryFileNames: assets/[name]-[hash].js`에 의해 `main-[hash].js`, `home-[hash].js`로 완벽 분리.
  4. 개발/프리뷰 서버에서 `/home` 요청 시 `home.html`을 서빙하기 위한 `mpa-dev-rewrite-plugin` 필요성 및 구현 코드 확정.
  5. `scripts/post-build.js`에서 `dist/index.html`을 SPA 템플릿으로 쓰지 않고 독립 보존하며, `dist/home.html`을 템플릿으로 SPA 서브라우트 생성하도록 분리하는 핵심 사양 확립.
  6. `src/routes.ts`의 `home.path = '/home'` 업데이트 사양 도출.
- **Unexplored areas**: 없음 (모든 대상 영역 완결 분석)

## Key Decisions Made
- `survey_report.md` 및 `handoff.md`에 워커가 바로 적용 가능한 프로덕션 코드 사양 작성 완료

## Artifact Index
- `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_m1_2/survey_report.md` — Vite MPA 번들러 설정 및 rollupOptions input 정밀 사양서
- `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_m1_2/handoff.md` — 5대 필수 항목 기반 인계 보고서
- `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_m1_2/progress.md` — 진행 상황 및 liveness heartbeat
