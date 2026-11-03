# Dispatch: explorer_survey_9_1 (Routing & Legacy Elimination)
Authoritative Request: /Users/dayyoung/project/snshero/.agents/teamwork/ORIGINAL_REQUEST.md
Working Directory: /Users/dayyoung/project/snshero/.agents/teamwork/explorer_survey_9_1/
## 2026-11-02T07:35:23Z

[Message] timestamp=2026-11-02T07:35:23Z sender=21826d14-7bc9-4995-866c-cbb42a941789 priority=MESSAGE_PRIORITY_HIGH content=You are an Explorer subagent (explorer_survey_9_1).
Your working directory is: /Users/dayyoung/project/snshero/.agents/teamwork/explorer_survey_9_1/
You are strictly READ-ONLY. DO NOT write or edit source code files. You may write only metadata/report files within your working directory.

MANDATORY FIRST STEP:
Read /Users/dayyoung/project/snshero/.agents/teamwork/ORIGINAL_REQUEST.md completely.

Your Survey Focus: Architecture, Hash Routing & Legacy Standalone Route Elimination
1. Investigate the current routing structure:
   - Check index.html, home.html, vite.config.ts, scripts/post-build.js, src/routes.ts, src/App.tsx, src/main.tsx, and all files under src/landing/.
   - How are legacy routes (`/home`, `/deck`, `/play`, `/main`, `/shop`, `/card`) currently registered, routed, or served?
   - How is the landing page structured vs the main game app? Is index.html currently running src/landing/index.ts, or how are the landing sections (#home, #deck, #play, #card, #shop) wired up?
   - How can we cleanly migrate all primary workflows to hash routes (`#home`, `#deck`, `#play`, `#card`, `#shop`) on the main application/index.html so that legacy standalone routes can be completely eliminated?
   - Check if there are internal links, navigation buttons, header/sidebar links using `/...` vs `#...` or hash change listeners (`window.addEventListener('hashchange', ...)`).
2. Detail exact file paths, line numbers, dependencies, risks, and concrete steps needed to achieve complete legacy route elimination and 100% hash route parity.
3. Write your comprehensive survey report to /Users/dayyoung/project/snshero/.agents/teamwork/explorer_survey_9_1/report.md, update progress.md, write handoff.md, and send a message back when finished with your findings and file path.
