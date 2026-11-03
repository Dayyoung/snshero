# Dispatch: Explorer Survey 1

- Role: Explorer (Architecture & Routing Specialist)
- Working Directory: /Users/dayyoung/project/snshero/.agents/teamwork/explorer_survey_1/
- Original Request: /Users/dayyoung/project/snshero/.agents/teamwork/ORIGINAL_REQUEST.md

## Mission
Investigate R1 (Static Architecture, Routing, Decoupling) and R5 (Static Build & Automated Verification).
Analyze the existing codebase (`index.html`, `vite.config.ts`, `src/App.tsx`, package scripts, etc.) and propose how to implement:
1. The new standalone static landing page for `/` and `/index.html` with zero external server runtime dependency (HTML, CSS, JS, assets).
2. Moving or routing the existing application to `/home`.
3. Clear separation of build outputs and assets.
4. Automated verification harness for testing the static page and interactions.

Produce a comprehensive survey report at `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_survey_1/survey_report.md` and deliver `handoff.md`.


## 2026-11-02T03:21:56Z
당신은 탐색 에이전트(teamwork_explorer)입니다.
작업 디렉토리: /Users/dayyoung/project/snshero/.agents/teamwork/explorer_survey_1/
원본 요구사항 파일: /Users/dayyoung/project/snshero/.agents/teamwork/ORIGINAL_REQUEST.md
작업 지침서: /Users/dayyoung/project/snshero/.agents/teamwork/explorer_survey_1/DISPATCH.md

반드시 ORIGINAL_REQUEST.md와 DISPATCH.md를 먼저 읽으십시오.
임무:
R1 (메인 정적 랜딩 페이지 신규 개발 및 소스 완전 분리) 및 R5 (독립 정적 빌드 및 자동화 검증 환경)에 대해 코드베이스를 정밀 조사하십시오.
1. 현재 프로젝트 구조, vite 설정(`vite.config.ts`), 진입점(`index.html`), `src/App.tsx`, 라우팅 방식 분석
2. 메인 접속 경로(/ 또는 /index.html)를 순수 정적 웹 페이지(HTML, CSS, JS, 이미지)로 완전히 독립 분리하는 최적의 아키텍처 방안 (서버 런타임 의존성 0)
3. 기존 홈 화면을 /home 경로로 접근 가능하게 분리/대체하는 방안
4. 정적 빌드 및 배포 무결성 검증, 브라우저 렌더링/인터랙션 테스트 방안
5. 구체적인 파일 구조, 빌드 스크립트, 의존성 관계 도출

조사 결과를 `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_survey_1/survey_report.md`에 상세히 작성하고, Handoff Protocol에 따라 `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_survey_1/handoff.md`를 작성한 뒤 오케스트레이터에게 완료 보고 메시지를 보내십시오.
