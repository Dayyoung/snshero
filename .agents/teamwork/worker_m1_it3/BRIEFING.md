# BRIEFING — 2026-11-02T05:02:00Z

## Mission
Milestone 1 Iteration 3: scripts/post-build.js 중첩 라우트 .html 생성 지원 및 vite.config.ts isSpaRoute 기반 dev/preview 리라이트 규칙 완결 구현

## 🔒 My Identity
- Archetype: teamwork_worker
- Roles: implementer, qa, specialist
- Working directory: /Users/dayyoung/project/snshero/.agents/teamwork/worker_m1_it3
- Original parent: 7b342c7a-1d74-43d7-a388-5ffc926b3969
- Milestone: M1-it3

## 🔒 Key Constraints
- Write ownership: `scripts/post-build.js`, `vite.config.ts` 전속
- dist/index.html 덮어쓰기 방지 가드 엄격 유지
- `/` 및 `/index.html`은 정적 랜딩 단독 서빙 유지
- Do not cheat, no hardcoded test outputs or facade implementations
- Mandatory Google Form report submission upon completion
- Git commit only (no push)

## Current Parent
- Conversation ID: 7b342c7a-1d74-43d7-a388-5ffc926b3969
- Updated: 2026-11-02T05:02:00Z

## Task Summary
- **What to build**: 
  1. `scripts/post-build.js`: nested route flat `.html` (`dist/${route}.html`) 생성 지원 (상위 디렉토리 생성 포함, `dist/index.html` 보존)
  2. `vite.config.ts`: `mpa-dev-rewrite-plugin`에 `isSpaRoute(pathname)` 도입하여 dev 및 preview 모드에서 nested SPA route 처리 완결
- **Success criteria**:
  - `npx tsc --noEmit` 0 errors (PASS)
  - `npm run build` 0 errors (PASS)
  - `npx tsx tests/adversarial_route_edge_cases.ts` 76/76 PASS (PASS)
  - `npx tsx tests/adversarial_m1_build_pipeline.ts` 64/64 PASS (PASS)
  - `npx tsx tests/e2e/run_all.ts --milestone M1` 9/9 PASS (PASS)
- **Interface contracts**: PROJECT.md, tests/adversarial_route_edge_cases.ts

## Key Decisions Made
- `scripts/post-build.js` line 210~240: `if (!route.includes('/'))` 조건문을 제거하고 `targetHtml`을 일원화하여 모든 flat 및 nested 라우트에 대해 `path.join(distDir, `${route}.html`)`을 생성. `flatHtmlPath !== indexPath && path.relative(distDir, flatHtmlPath) !== 'index.html'` 이중 가드로 `dist/index.html` 완전 보호.
- `vite.config.ts`: `isSpaRoute(pathname)` 정밀 판별 함수를 구현하여 루트(`/`, `/index.html`), API(`/api/*`, `/health`), 번들 정적 사이트(`/mall`, `/gwent`, `/ai` 등), 확장자 있는 에셋 파일을 철저히 격리하고, dev 환경에서는 모든 SPA 경로를 `/home.html`로, preview 환경에서는 `dist/${cleanPath}/index.html` 또는 `dist/${cleanPath}.html` 또는 `/home.html`로 정밀 rewrite.

## Artifact Index
- `scripts/post-build.js` — post-build static pre-render generator
- `vite.config.ts` — Vite dev/preview server plugin configuration
- `.agents/teamwork/worker_m1_it3/handoff.md` — Final handoff report

## Change Tracker
- **Files modified**:
  - `scripts/post-build.js`: nested route `.html` 파일 생성 및 디렉토리 생성 보장, index.html 보호 가드 적용
  - `vite.config.ts`: isSpaRoute 도입 및 mpa-dev-rewrite-plugin 개선 (dev/preview rewrite)
  - `WORK_LOGS.md`: 작업 로그 및 검증 결과 기록
- **Build status**: PASS (tsc 0 errors, build exit 0)
- **Pending issues**: None

## Quality Status
- **Build/test result**: All Passed (adversarial_route_edge_cases: 76/76, adversarial_m1_build_pipeline: 64/64, e2e M1: 9/9, challenger: 52/52)
- **Lint status**: Clean (tsc --noEmit 0 errors)
- **Tests added/modified**: `tests/adversarial_route_edge_cases.ts` 100% PASS

## Loaded Skills
- None
