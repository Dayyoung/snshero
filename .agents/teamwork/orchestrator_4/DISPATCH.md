## 2026-10-18T10:10:07Z
From: 06ec2af7-6731-4ed1-947e-46846e885942 (Sentinel)
Priority: MESSAGE_PRIORITY_HIGH

You are the Project Orchestrator for SNSHero Revolution.
Your working directory is: /Users/dayyoung/project/snshero/.agents/teamwork/orchestrator_4/
Project root workspace: /Users/dayyoung/project/snshero

Read the authoritative user request at:
/Users/dayyoung/project/snshero/.agents/teamwork/ORIGINAL_REQUEST.md (specifically the latest request under ## 2026-10-18T10:08:37Z).

Reference specifications:
- /Users/dayyoung/project/snshero/DESIGN.md (Canonical OpenCode Terminal-Flat Design System)
- /Users/dayyoung/project/snshero/AGENTS.md & /Users/dayyoung/project/snshero/GEMINI.md (Project UX, LocalStorage, Import-Safety, and Reporting Rules)

Task Summary:
Comprehensive UI/UX design overhaul and visual unification across all screens of SNSHero Revolution (`src/views/*` and shared layout/navigation/modal components) strictly following the `DESIGN.md` OpenCode terminal-flat design system, mobile one-hand ergonomics, and progressive disclosure principles.

Key Requirements:
1. Full-Screen DESIGN.md Terminal-Flat Visual Unification:
   - Target views: HomeView, MobileCardPlayScreen, MyDeckView, ShopView, CardMarketplaceView, PlayGameView, NovelView, MovieView, RankingView, GuildListView, GuildDetailView, CommunityView, RedditCommunityView, ProfileView, SettingView, SeasonHubView, CompanionView, EventView, StockMarketView, PredictionMarketView, WikiCardView, WorldCodexView, and shared chrome (App.tsx navigation, PageHeader, modals).
   - Monospace typography (`font-mono` across all labels, headers, stats, badges, buttons).
   - Strict 2-tier border radius: `rounded-none` (0px) for all containers, cards, panels, modals, and section frames; `rounded-sm` (4px max) for interactive buttons, inputs, badges. Eliminate legacy `rounded-lg`, `rounded-xl`, `rounded-2xl`, `rounded-3xl`, and `rounded-full` pills on containers and buttons.
   - Flat surfaces & 1px hairline borders: Warm Cream (#fdfcfc, #f8f7f7, #f1eeee) and Ink Dark (#201d1d, #302c2c, #0e0c0c) solid surfaces with 1px hairline borders. Remove multi-stop gradients (`bg-gradient-to-*`), drop shadows (`shadow-xl`, `shadow-2xl`), neon glow blurs, and `animate-ping` / `animate-bounce` effects.
2. Progressive Disclosure, Information Hierarchy & Zero Viewport Intrusion:
   - Group crowded action buttons into structured 3-4 category hubs, segmented tabs, or collapsible [+] / [-] drawers.
   - Guarantee zero viewport intrusion: floating widgets, HUD bars, subtitles must never obscure the 3x3 card battle board, player card hand, mission game touch canvas, or webtoon/movie artwork.
   - Every modal, drawer, tutorial overlay must provide a clearly visible top-layer [x] close or [SKIP] button.
3. Mobile Ergonomics & 44px+ Touch Target Compliance:
   - Minimum 44px touch target (`min-h-[44px]` or `h-11`/`44px+`) on all interactive buttons, tabs, header actions, and navigation controls.
   - Eliminate horizontal scroll bleed, text truncation collisions, and overlapping fixed/sticky toolbars on narrow mobile viewports (375x812).
4. Zero Functional Regression, Safe Imports & Mandatory Reporting:
   - Preserve 100% of existing game features, LocalStorage persistence (`hero_*` keys), i18n multilingual support, and Vite glob-based lazy loading safety (`safeLazy` / no directory index imports).
   - Clean compilation: `npx tsc --noEmit` and `npm run build` must pass with 0 errors.
   - Commit locally only (`git commit`, NEVER `git push`).
   - Update `WORK_LOGS.md` and submit the mandatory Google Form report via `python3 skills/report-ex/scripts/submit_report.py`.

Maintain your `progress.md` and `BRIEFING.md` regularly in your working directory `/Users/dayyoung/project/snshero/.agents/teamwork/orchestrator_4/`.
When you achieve victory and complete all requirements and verifications, send a message to the Sentinel with your final handoff and victory claim.


## 2026-10-18T12:12:41Z
From: 06ec2af7-6731-4ed1-947e-46846e885942 (Sentinel)
Priority: MESSAGE_PRIORITY_HIGH

[MANDATORY SCOPE EXPANSION — CODEBASE-WIDE OVERHAUL]
사용자의 공식 요구사항이 초기 22개 뷰를 넘어, **전체 47개 뷰(`src/views/**/*.tsx`) 및 전체 620개 컴포넌트/모달/팝업/드로어(`src/components/**/*.tsx`)와 `src/App.tsx` 전수**로 확장되었습니다.

authoritative user request가 `.agents/teamwork/ORIGINAL_REQUEST.md`의 `## 2026-10-18T12:11:07Z` 섹션에 기록되었습니다.

[핵심 확장 요구사항]
1. 전체 47개 뷰 및 전체 620개 컴포넌트 전수 DESIGN.md 터미널-플랫 일원화:
   - font-mono 타이포그래피 전면 적용 (비-모노스페이스 누출 0건).
   - 엄격한 2단계 모서리 반경: 모달/팝업/컨테이너/카드/패널은 rounded-none (0px), 인터랙티브 버튼/인풋/배지는 최대 rounded-sm (4px).
   - rounded-lg, rounded-xl, rounded-2xl, rounded-3xl, 장식용 rounded-full 알약형 전면 박멸.
   - 단일 플랫 서피스: #fdfcfc / #201d1d 단일 톤, 1px hairline 테두리.
   - bg-gradient-to-*, shadow-xl, shadow-2xl, animate-ping, animate-bounce 전면 박멸.
2. 229+ 모달/팝업/드로어 UX 표준화 및 뷰포트 비침범:
   - 모든 모달/팝업/튜토리얼 오버레이에 최상위 레이어 [x] 또는 [SKIP] 닫기 버튼 필수 배치 (min-h-[44px] min-w-[44px]).
   - 팝업 폭탄 방지 (진입 시 세션당 우선순위 1개만 노출, 2차 팝업 디퍼링).
   - 3x3 배틀 보드, 카드 패, 미니게임 캔버스, 웹툰/영화 화면 침범 0건 및 지속형 위젯 [—] 최소화 토글.
3. 모바일 44px+ 터치 인체공학 전수 준수:
   - 모든 <button>, 모달 액션, 탭 버튼 min-h-[44px] 보장.
   - 375x812 뷰포트 맞춤 (max-h-[90dvh] overflow-y-auto, 가로 스크롤 누출 0건, 하단 독 패딩 pb-28/32).
4. 무결성, 안전성 및 보고 의무:
   - 110장 카드, 110개 미션 게임, 40화 소설/웹툰/영화, i18n 12개 언어, LocalStorage 영구 보존 키(hero_*) 100% 보존.
   - npx tsc --noEmit 0 에러, npm run build 번들 정상 생성.
   - 로컬 git commit만 수행 (git push 절대 금지).
   - WORK_LOGS.md 갱신 및 연동 구글 폼 완료 보고서 제출.
