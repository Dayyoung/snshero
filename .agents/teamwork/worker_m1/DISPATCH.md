# Dispatch: Worker M1 (Implementation)

- Role: Worker (`teamwork_worker`)
- Working Directory: /Users/dayyoung/project/snshero/.agents/teamwork/worker_m1/
- Original Request: /Users/dayyoung/project/snshero/.agents/teamwork/ORIGINAL_REQUEST.md
- Project Scope: /Users/dayyoung/project/snshero/PROJECT.md
- Explorer Reports:
  - M1-1 (HTML entries): /Users/dayyoung/project/snshero/.agents/teamwork/explorer_m1_1/handoff.md & survey_report.md
  - M1-2 (Vite MPA): /Users/dayyoung/project/snshero/.agents/teamwork/explorer_m1_2/handoff.md & survey_report.md
  - M1-3 (Routing & Post-build): /Users/dayyoung/project/snshero/.agents/teamwork/explorer_m1_3/handoff.md & survey_report.md

## Write Ownership (Exclusive)
You have exclusive write ownership over:
- `index.html`
- `home.html`
- `vite.config.ts`
- `scripts/post-build.js`
- `src/routes.ts`
- `src/landing/index.ts`
- `src/landing/styles/landing.css`

## Mission
Implement Milestone 1 (Static Architecture & MPA Decoupling):
1. Create `home.html`:
   - Exact copy of the existing SPA entry point, pointing to `/src/main.tsx` and `<div id="root"></div>`.
2. Refactor `index.html`:
   - Point script tag to `/src/landing/index.ts`.
   - Remove `<div id="root"></div>` and replace with `<div id="landing-root"></div>`.
   - Remove heavy runtime dependencies / game-specific scripts while preserving metadata, fonts, OpenGraph, JSON-LD.
3. Create `src/landing/index.ts` and `src/landing/styles/landing.css`:
   - Initialize bootstrap code mounting `#landing-root` with an initial valid layout so build succeeds cleanly.
4. Update `vite.config.ts`:
   - Add `rollupOptions.input: { main: path.resolve(process.cwd(), 'index.html'), home: path.resolve(process.cwd(), 'home.html') }`.
   - Add dev server middleware rewriting `/home` to `home.html` as detailed in `explorer_m1_2/survey_report.md`.
5. Update `scripts/post-build.js`:
   - Ensure `dist/index.html` is preserved as the standalone static landing page.
   - Use `dist/home.html` as the template for `dist/home/index.html` and other SPA subroutes (`deck`, `play`, `shop`, etc.).
6. Update `src/routes.ts`:
   - Set `home.path = '/home'`, aliases `['/home']`.
   - Update path normalization so `/home` cleanly maps to SPA home view, and `/` is decoupled.
7. Verification:
   - Run `npx tsc --noEmit` and ensure 0 TypeScript errors.
   - Run `npm run build` and ensure exit code 0.
   - Verify that `dist/index.html` and `dist/home.html` both exist and decode properly.
8. Deliver handoff report to `/Users/dayyoung/project/snshero/.agents/teamwork/worker_m1/handoff.md` and message orchestrator.

## MANDATORY INTEGRITY WARNING
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.


## 2026-11-02T03:41:14Z
당신은 마일스톤 1 구현 워커(teamwork_worker)입니다.
작업 디렉토리: /Users/dayyoung/project/snshero/.agents/teamwork/worker_m1/
원본 요구사항: /Users/dayyoung/project/snshero/.agents/teamwork/ORIGINAL_REQUEST.md
프로젝트 명세: /Users/dayyoung/project/snshero/PROJECT.md
작업 지침서: /Users/dayyoung/project/snshero/.agents/teamwork/worker_m1/DISPATCH.md
선행 탐색 보고서:
- M1-1 (HTML 엔트리): /Users/dayyoung/project/snshero/.agents/teamwork/explorer_m1_1/handoff.md 및 survey_report.md
- M1-2 (Vite MPA): /Users/dayyoung/project/snshero/.agents/teamwork/explorer_m1_2/handoff.md 및 survey_report.md
- M1-3 (라우팅 & 사후빌드): /Users/dayyoung/project/snshero/.agents/teamwork/explorer_m1_3/handoff.md 및 survey_report.md

반드시 ORIGINAL_REQUEST.md, PROJECT.md, DISPATCH.md를 먼저 읽으십시오.

## 전속 작성 권한 (Write Ownership)
당신은 다음 파일들에 대한 독점적 수정/생성 권한을 가집니다:
- `index.html`
- `home.html`
- `vite.config.ts`
- `scripts/post-build.js`
- `src/routes.ts`
- `src/landing/index.ts`
- `src/landing/styles/landing.css`

## 임무
1. `home.html` 생성: 기존 SPA의 모든 스크립트, 워치독, Leaflet CSS, `#root`, `/src/main.tsx`를 담은 완전한 SPA 진입점 생성.
2. `index.html` 리팩토링: `/src/landing/index.ts`와 `/src/landing/styles/landing.css`, `<div id="landing-root"></div>`를 로드하는 초경량 순수 정적 랜딩 진입점으로 전환 (React/Three.js 등 무거운 의존성 제거, 메타태그/JSON-LD/폰트 보존).
3. `src/landing/index.ts` 및 `src/landing/styles/landing.css` 생성: 부트스트랩 코드 및 초기 레이아웃 구조 구현.
4. `vite.config.ts` 수정: `build.rollupOptions.input`에 `{ main: 'index.html', home: 'home.html' }` 설정 및 dev/preview 서버 `/home` rewrite 미들웨어 추가.
5. `scripts/post-build.js` 수정: `dist/index.html`을 정적 랜딩으로 보존하고 `dist/home.html`을 베이스 템플릿으로 사용하여 `dist/home` 및 SPA 서브라우트 생성.
6. `src/routes.ts` 수정: `home.path = '/home'`, aliases `['/home']`, cleanPath 매핑 조정.
7. 빌드 및 타입 검증:
   - `npx tsc --noEmit` 실행하여 에러 0건 확인
   - `npm run build` 실행하여 exit code 0 및 `dist/index.html`, `dist/home.html` 생성 확인
8. 인수인계서(`/Users/dayyoung/project/snshero/.agents/teamwork/worker_m1/handoff.md`) 작성 및 오케스트레이터에게 완료 보고 메시지 전송.
