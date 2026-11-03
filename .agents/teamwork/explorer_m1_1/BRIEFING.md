# BRIEFING — 2026-11-02T03:41:00Z

## Mission
Milestone 1 HTML 엔트리 포인트 분리(index.html -> 정적 랜딩 웹 서비스 진입점, home.html -> 리치 게임 SPA 진입점) 정밀 조사 및 워커 즉시 구현용 코드 사양 도출

## 🔒 My Identity
- Archetype: teamwork_explorer
- Roles: Explorer, Architecture & Entrypoint Specialist
- Working directory: /Users/dayyoung/project/snshero/.agents/teamwork/explorer_m1_1
- Original parent: 7b342c7a-1d74-43d7-a388-5ffc926b3969
- Milestone: Milestone 1 (HTML Entry Points & Landing Entry Setup)

## 🔒 Key Constraints
- Read-only investigation — do NOT implement
- Reply to caller in Korean
- Write report to survey_report.md and handoff.md in working directory
- 5-Component Handoff Report format (Observation, Logic Chain, Caveats, Conclusion, Verification Method)

## Current Parent
- Conversation ID: 7b342c7a-1d74-43d7-a388-5ffc926b3969
- Updated: 2026-11-02T03:41:00Z

## Investigation State
- **Explored paths**:
  - `index.html` (869 라인 전수 분석 완료: 메타/JSON-LD/폰트 보존 항목 vs main.tsx/워치독/Leaflet 제거 항목 식별)
  - `home.html` (신규 파일 전체 사양 및 코드 작성 완료)
  - `vite.config.ts` (rollupOptions.input 듀얼 엔트리 및 dev/preview server /home 리라이트 사양 도출)
  - `scripts/post-build.js` (dist/home.html 기반 SPA 라우트 생성 및 dist/index.html 보존 사양 도출)
  - `src/routes.ts` (home.path = '/home', getViewPath 폴백, cleanPath 분기 사양 도출)
  - `src/landing/index.ts` & `src/landing/styles/landing.css` (빌드 통과용 최소 부트스트랩 스텁 명세 완료)
- **Key findings**:
  - `index.html` 라인 718~781을 `/src/landing/index.ts` 및 `<div id="landing-root"></div>`로 교체하면 SEO 손실 없이 초경량 번들 실현 가능.
  - `home.html`을 신규 생성하여 기존 리치 SPA를 완벽히 유지.
  - `scripts/post-build.js`에서 SPA 라우트 템플릿을 `home.html`로 전환해야 서브 라우트 깨짐 방지 가능.
- **Unexplored areas**: None for Milestone 1 HTML Entry Points scope.

## Key Decisions Made
- `index.html`의 DOM 마운트 노드를 `<div id="landing-root"></div>`로 지정하여 React SPA의 `#root`와 격리.
- `home.html`의 캐노니컬 URL을 `https://snshero.com/home`으로 설정.
- `vite.config.ts`에 dev/preview용 `/home` URL 리라이트 미들웨어 추가하여 개발 편의성 보장.

## Artifact Index
- /Users/dayyoung/project/snshero/.agents/teamwork/explorer_m1_1/DISPATCH.md — 지시서 및 메시지 로그
- /Users/dayyoung/project/snshero/.agents/teamwork/explorer_m1_1/BRIEFING.md — 작업 기억 및 제약사항 인덱스
- /Users/dayyoung/project/snshero/.agents/teamwork/explorer_m1_1/progress.md — 활성 상태 및 단계별 진행 로그
- /Users/dayyoung/project/snshero/.agents/teamwork/explorer_m1_1/survey_report.md — 상세 조사 보고서 (구현 코드 사양 포함)
- /Users/dayyoung/project/snshero/.agents/teamwork/explorer_m1_1/handoff.md — 5-컴포넌트 인수인계서
