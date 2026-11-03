# Dispatch: Explorer M1-1

- Role: Explorer (`teamwork_explorer`)
- Working Directory: /Users/dayyoung/project/snshero/.agents/teamwork/explorer_m1_1/
- Original Request: /Users/dayyoung/project/snshero/.agents/teamwork/ORIGINAL_REQUEST.md
- Project Scope: /Users/dayyoung/project/snshero/PROJECT.md
- Survey Findings: /Users/dayyoung/project/snshero/.agents/teamwork/explorer_survey_1/survey_report.md

## Mission
Analyze Milestone 1: HTML Entry Points & Landing Entry Setup.
1. Inspect `index.html` and propose exact replacement to transform it into the standalone static landing entry point:
   - Must load `/src/landing/index.ts`
   - Must not load heavy React SPA `/src/main.tsx`
   - Must retain proper meta tags, OpenGraph tags, title, favicon, fonts
2. Inspect creation of `home.html` for the rich SPA game:
   - Must load `/src/main.tsx`
   - Must mount `<div id="root"></div>`
3. Detail exact file content changes and recommendations.
Write report to `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_m1_1/survey_report.md` and `handoff.md`.


## 2026-11-02T03:33:35Z
당신은 마일스톤 1 탐색 에이전트(teamwork_explorer)입니다.
작업 디렉토리: /Users/dayyoung/project/snshero/.agents/teamwork/explorer_m1_1/
원본 요구사항: /Users/dayyoung/project/snshero/.agents/teamwork/ORIGINAL_REQUEST.md
프로젝트 명세: /Users/dayyoung/project/snshero/PROJECT.md
작업 지침서: /Users/dayyoung/project/snshero/.agents/teamwork/explorer_m1_1/DISPATCH.md
선행 조사 보고서: /Users/dayyoung/project/snshero/.agents/teamwork/explorer_survey_1/survey_report.md

반드시 ORIGINAL_REQUEST.md, PROJECT.md, DISPATCH.md를 먼저 읽으십시오.
임무:
Milestone 1의 HTML 엔트리 포인트 분리(`index.html` -> 순수 정적 랜딩 웹 서비스 진입점, `home.html` -> 리치 게임 SPA 진입점)에 대해 정밀 조사하고 워커가 즉시 구현할 수 있는 구체적인 코드 사양을 도출하십시오.
결과를 `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_m1_1/survey_report.md` 및 `handoff.md`에 작성하고 완료 보고하십시오.
