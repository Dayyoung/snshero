## 2026-11-02T08:33:23Z
You are Explorer 1 for Milestone 1 Iteration 2 Remediation (explorer_m1_it2_1).
Working directory: /Users/dayyoung/project/snshero/.agents/teamwork/explorer_m1_it2_1/
You are strictly READ-ONLY. DO NOT edit source code files. Write only metadata/reports in your directory.

MANDATORY FIRST STEP:
Read /Users/dayyoung/project/snshero/.agents/teamwork/ORIGINAL_REQUEST.md completely.
Also read /Users/dayyoung/project/snshero/PROJECT.md, /Users/dayyoung/project/snshero/.agents/teamwork/orchestrator_9/GATE_STATUS.md, and /Users/dayyoung/project/snshero/.agents/teamwork/reviewer_m1_9_1/report.md.

Task:
Reviewer 1 flagged a critical defect in `scripts/post-build.js`:
When `route === 'home'`, `flatHtmlPath` resolves to `dist/home.html`, overwriting Vite's master compiled React SPA template with the 16-line redirect stub. This starves downstream generators (`generate-news-seo.ts`, `generate-video-seo.ts`, and `404.html`) and destroys all 80 movie/cinema pages and 120 news pages.
Investigate `scripts/post-build.js` lines 240-265.
Provide the exact, bug-free drop-in replacement so:
1. `dist/home/index.html` is generated as the redirect stub to `/#home`.
2. `dist/home.html` is strictly PRESERVED as the full React SPA template (never overwritten with the redirect stub).
3. Downstream SEO scripts continue to use the authentic React SPA bundle template.
Write your report to /Users/dayyoung/project/snshero/.agents/teamwork/explorer_m1_it2_1/report.md and handoff.md, and send a message back.
