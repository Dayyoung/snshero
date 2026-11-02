# Dispatch: E2E Test Writer (E2E Testing Track)

- Role: E2E Test Suite Creator (`teamwork_test_writer`)
- Working Directory: /Users/dayyoung/project/snshero/.agents/teamwork/test_writer_e2e/
- Original Request: /Users/dayyoung/project/snshero/.agents/teamwork/ORIGINAL_REQUEST.md
- Project Scope: /Users/dayyoung/project/snshero/PROJECT.md

## Mission
You are the dedicated E2E Test Writer in the E2E Testing Track.
Your objective is to design and implement a comprehensive, requirement-driven, opaque-box E2E test suite covering all features in `PROJECT.md § Feature Inventory` and all acceptance criteria in `ORIGINAL_REQUEST.md` (R1 to R5).

### Tasks:
1. Create `/Users/dayyoung/project/snshero/TEST_INFRA.md` following the template in Project Pattern:
   - Test Philosophy: opaque-box, requirement-driven, 0 internal module dependencies.
   - Feature Inventory with coverage mappings (Tiers 1-4).
   - Test Architecture & runner instructions.
2. Implement the automated test runner and test cases under `tests/e2e/` (e.g. using Node.js / Playwright / TypeScript scripts):
   - **Tier 1 - Feature Coverage**: >=5 test cases per feature covering representative happy-path inputs for all 5 requirements (R1..R5).
   - **Tier 2 - Boundary & Corner Cases**: >=5 boundary/edge test cases per feature (invalid routes, missing localStorage keys, max level 100 boundaries, empty state, rapid clicks, network disconnect).
   - **Tier 3 - Cross-Feature Combinations**: Pairwise coverage (e.g., card nurture + deck TP calculation, shop purchase + deck, play TTS toggle + webtoon scene change, navigation between / and /home).
   - **Tier 4 - Real-World Application Scenarios**: Realistic end-to-end user journeys (first-time visitor browsing landing page, navigating to cards, nurturing cards up to level 100, allocating stats, checking deck TP update, verifying localStorage persistence across refresh, opening shop).
3. Verify that the test runner executes cleanly and produces clear, structured pass/fail reports.
4. When the test suite and runner are completely implemented and ready to test against the upcoming implementation, publish `/Users/dayyoung/project/snshero/TEST_READY.md` at project root with:
   - Test Runner command: e.g. `npx tsx tests/e2e/run_all.ts` or `npm run test:e2e` (or python script)
   - Coverage Summary table (Tiers 1-4 counts)
   - Feature Checklist
5. Write your handoff report to `/Users/dayyoung/project/snshero/.agents/teamwork/test_writer_e2e/handoff.md` and message the orchestrator.


## 2026-11-02T03:33:26Z
당신은 E2E 테스트 작성 에이전트(teamwork_test_writer)입니다.
작업 디렉토리: /Users/dayyoung/project/snshero/.agents/teamwork/test_writer_e2e/
원본 요구사항: /Users/dayyoung/project/snshero/.agents/teamwork/ORIGINAL_REQUEST.md
프로젝트 명세: /Users/dayyoung/project/snshero/PROJECT.md
작업 지침서: /Users/dayyoung/project/snshero/.agents/teamwork/test_writer_e2e/DISPATCH.md

반드시 ORIGINAL_REQUEST.md, PROJECT.md, DISPATCH.md를 먼저 읽으십시오.
임무:
1. /Users/dayyoung/project/snshero/TEST_INFRA.md를 작성하십시오. (오페이크 박스, 요구사항 기반 테스트 철학, 4-Tier 테스트 케이스 매핑: Tier 1 기능 커버리지, Tier 2 경계/코너 케이스, Tier 3 교차 기능 조합, Tier 4 실제 유저 시나리오)
2. `tests/e2e/` 디렉토리에 실행 가능한 자동화 테스트 러너 및 테스트 스위트 코드를 구현하십시오. (Node.js/Playwright/TypeScript 기반으로 브라우저 렌더링, 반응형, 6대/8대 메뉴, 쇼핑몰/커뮤니티/로그인 모달, 홈 섹션 외부 링크 '절찬 연재중' 배지, 마이덱 TP 계산, 플레이 섹션 5버튼/TTS OFF, 카드 섹션 1~100Lv 육성, 스탯 포인트 분배, 빨간 점 인디케이터, 로컬스토리지 새로고침 영구 보존, 상점 8개 항목, 첫 접속 온보딩 팝업 0건 등을 전수 검증)
3. 테스트 스위트 구현이 완료되면 프로젝트 루트에 `/Users/dayyoung/project/snshero/TEST_READY.md`를 발행하십시오.
4. handoff.md를 작성하고 완료 보고 메시지를 보내십시오.
