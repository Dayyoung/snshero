# BRIEFING — 2026-11-02T07:46:00Z

## Mission
Investigate SNSHero routing architecture: evaluate legacy standalone routes (`/home`, `/deck`, `/play`, `/main`, `/shop`, `/card`), index.html vs home.html vs landing structure, and define concrete migration steps to achieve 100% hash route parity (`#home`, `#deck`, `#play`, `#card`, `#shop`) and eliminate legacy standalone routes.

## 🔒 My Identity
- Archetype: explorer
- Roles: [investigator, surveyor, architect-analyst]
- Working directory: /Users/dayyoung/project/snshero/.agents/teamwork/explorer_survey_9_1/
- Original parent: 21826d14-7bc9-4995-866c-cbb42a941789
- Milestone: survey_routing_and_legacy_elimination

## 🔒 Key Constraints
- Read-only investigation — do NOT implement or modify source code
- Strictly write metadata, reports, and handoffs only inside /Users/dayyoung/project/snshero/.agents/teamwork/explorer_survey_9_1/
- Produce complete evidence chains (exact files, line numbers, quotes, verification methods)
- Always reply to parent via send_message

## Current Parent
- Conversation ID: 21826d14-7bc9-4995-866c-cbb42a941789
- Updated: 2026-11-02T07:46:00Z

## Investigation State
- **Explored paths**: ORIGINAL_REQUEST.md, index.html, home.html, vite.config.ts, scripts/post-build.js, src/routes.ts, src/App.tsx, src/main.tsx, src/landing/*, src/views/*, tests/*
- **Key findings**:
  1. index.html currently runs src/landing/index.ts (vanilla TS string templates) while home.html runs React 19 App.tsx.
  2. Legacy routes (/home, /deck, /play, /main, /shop, /card) are maintained via vite.config.ts isSpaRoute rewriting to home.html, post-build pre-rendering of 40+ duplicate HTML folders, and window.history.pushState in App.tsx.
  3. App.tsx has popstate listeners but 0 hashchange listeners.
  4. Core game features required by the user (tile map KadanRpgView, card battle MobileCardPlayScreen, card nurturing, shop opening) only exist in the main React application.
  5. Clean migration requires unifying index.html to mount src/main.tsx with hash routing (#home, #deck, #play, #card, #shop), decommissioning home.html and duplicate post-build HTML folders, adding an idle 15s auto-play redirect, and integrating responsive gutter/banner AdSense units.
- **Unexplored areas**: None. All survey focuses completed.

## Key Decisions Made
- Fully surveyed codebase and authored comprehensive report.md.
- Structured phased implementation roadmap with risk mitigation.

## Artifact Index
- DISPATCH.md — incoming dispatch instructions
- BRIEFING.md — persistent agent working memory
- progress.md — liveness heartbeat and milestone tracking
- report.md — comprehensive survey report
- handoff.md — 5-component handoff report
