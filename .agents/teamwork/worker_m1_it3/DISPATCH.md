# Dispatch: Worker M1 Iteration 3 (Nested Routes & Vite Server Rewrite Fix)

- Role: Worker (`teamwork_worker`)
- Working Directory: /Users/dayyoung/project/snshero/.agents/teamwork/worker_m1_it3/
- Original Request: /Users/dayyoung/project/snshero/.agents/teamwork/ORIGINAL_REQUEST.md
- Project Scope: /Users/dayyoung/project/snshero/PROJECT.md
- Challenger Failure Report: /Users/dayyoung/project/snshero/.agents/teamwork/challenger_m1_it2_2/handoff.md
- Adversarial Route Test: /Users/dayyoung/project/snshero/tests/adversarial_route_edge_cases.ts
- Explorer Reports:
  - M1-it3-1: /Users/dayyoung/project/snshero/.agents/teamwork/explorer_m1_it3_1/survey_report.md
  - M1-it3-2: /Users/dayyoung/project/snshero/.agents/teamwork/explorer_m1_it3_2/survey_report.md
  - M1-it3-3: /Users/dayyoung/project/snshero/.agents/teamwork/explorer_m1_it3_3/survey_report.md

## Write Ownership (Exclusive)
- `scripts/post-build.js`
- `vite.config.ts`

## Mission
Implement the fixes for nested route `.html` generation and dev/preview server rewriting:
1. In `scripts/post-build.js`:
   - Remove `if (!route.includes('/'))` guard around flat html generation.
   - For all routes, ensure parent directory exists via `fs.mkdirSync(path.dirname(flatHtmlPath), { recursive: true })` and write `dist/${route}.html`.
   - Maintain the strict guard ensuring `dist/index.html` is NEVER overwritten.
2. In `vite.config.ts`:
   - Update `mpa-dev-rewrite-plugin` with `isSpaRoute(pathname)` classifier as detailed in `explorer_m1_it3_2/survey_report.md`.
   - In dev mode (`configureServer`): rewrite all SPA paths to `/home.html`.
   - In preview mode (`configurePreviewServer`): resolve clean path to `dist/${cleanPath}/index.html` or `dist/${cleanPath}.html` or `/home.html`.
   - Ensure `/` and `/index.html` strictly serve the static landing page.
3. Verification:
   - Run `npx tsc --noEmit` (0 errors)
   - Run `npm run build` (0 errors)
   - Run `npx tsx tests/adversarial_route_edge_cases.ts` (Must pass 76/76!)
   - Run `npx tsx tests/adversarial_m1_build_pipeline.ts` (64/64 PASS)
   - Run `npx tsx tests/e2e/run_all.ts --milestone M1` (9/9 PASS)
4. Deliver handoff report to `/Users/dayyoung/project/snshero/.agents/teamwork/worker_m1_it3/handoff.md` and message orchestrator.

## MANDATORY INTEGRITY WARNING
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## 2026-11-02T04:54:37Z
당신은 마일스톤 1 반복 3 구현 워커(teamwork_worker)입니다.
작업 디렉토리: /Users/dayyoung/project/snshero/.agents/teamwork/worker_m1_it3/
원본 요구사항: /Users/dayyoung/project/snshero/.agents/teamwork/ORIGINAL_REQUEST.md
프로젝트 명세: /Users/dayyoung/project/snshero/PROJECT.md
작업 지침서: /Users/dayyoung/project/snshero/.agents/teamwork/worker_m1_it3/DISPATCH.md
선행 탐색 보고서:
- M1-it3-1: /Users/dayyoung/project/snshero/.agents/teamwork/explorer_m1_it3_1/survey_report.md
- M1-it3-2: /Users/dayyoung/project/snshero/.agents/teamwork/explorer_m1_it3_2/survey_report.md
- M1-it3-3: /Users/dayyoung/project/snshero/.agents/teamwork/explorer_m1_it3_3/survey_report.md
적대적 경로 테스트: /Users/dayyoung/project/snshero/tests/adversarial_route_edge_cases.ts

반드시 위의 모든 문서를 먼저 읽으십시오.

## 전속 작성 권한 (Write Ownership)
- `scripts/post-build.js`
- `vite.config.ts`

## 임무
1. `scripts/post-build.js` 수정: `if (!route.includes('/'))` 제거, 모든 중첩 라우트에 대해 상위 디렉토리 생성 후 `dist/${route}.html` 파일 생성. (`dist/index.html` 덮어쓰기 방지 가드 엄격 유지).
2. `vite.config.ts` 수정: `mpa-dev-rewrite-plugin`에 `isSpaRoute(pathname)` 판별기를 적용하여, 개발 서버 및 프리뷰 서버에서 트레일링 슬래시 없는 중첩 경로를 포함한 모든 SPA 요청이 정상적으로 `home.html` 또는 사전 렌더링된 SPA HTML로 리라이트되도록 구현 (`/` 및 `/index.html`은 정적 랜딩 단독 서빙).
3. 빌드 및 테스트 검증:
   - `npx tsc --noEmit` (0 에러)
   - `npm run build` (0 에러)
   - `npx tsx tests/adversarial_route_edge_cases.ts` (76/76 전수 통과 확인)
   - `npx tsx tests/adversarial_m1_build_pipeline.ts` (64/64 전수 통과 확인)
   - `npx tsx tests/e2e/run_all.ts --milestone M1` (9/9 전수 통과 확인)
4. 인수인계서(`/Users/dayyoung/project/snshero/.agents/teamwork/worker_m1_it3/handoff.md`) 작성 및 완료 보고.

DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

