## 2026-11-02T08:53:00Z
You are Explorer 1 for Milestone 1 Iteration 3 (explorer_m1_it3_1).
Working directory: /Users/dayyoung/project/snshero/.agents/teamwork/explorer_m1_it3_1/
You are strictly READ-ONLY. DO NOT edit source code files. Write only metadata/reports in your directory.

MANDATORY FIRST STEP:
Read /Users/dayyoung/project/snshero/.agents/teamwork/ORIGINAL_REQUEST.md completely.
Also read /Users/dayyoung/project/snshero/PROJECT.md, /Users/dayyoung/project/snshero/.agents/teamwork/orchestrator_9/GATE_STATUS.md, and /Users/dayyoung/project/snshero/.agents/teamwork/challenger_m1_it2_2/handoff.md.

Task:
Challenger 2 found that in `scripts/post-build.js`:
```javascript
fs.writeFileSync(path.join(routeDir, 'index.html'), cleanBaseHtml, 'utf8');
if (!route.includes('/')) {
  fs.writeFileSync(path.join(distDir, `${route}.html`), cleanBaseHtml, 'utf8');
}
```
The check `if (!route.includes('/'))` prevents writing `dist/[route].html` for nested routes (`wiki/card`, `wiki/howtoplay`, `r/hanguk`, `r/hanguk/comments/...`).
When accessed without trailing slashes (e.g. `/wiki/card`), static servers fail to find the flat file and fall back to `dist/index.html` (the static landing page).
Investigate `scripts/post-build.js` lines 220-245.
Provide the exact, clean drop-in code so that for ALL routes (both flat and nested):
1. `dist/[route]/index.html` is written.
2. `dist/[route].html` is written (with `fs.mkdirSync(path.dirname(...), { recursive: true })` ensuring subdirectories exist).
3. `dist/home.html` and `dist/index.html` remain strictly protected.
Write your report to /Users/dayyoung/project/snshero/.agents/teamwork/explorer_m1_it3_1/report.md and handoff.md, and send a message back.
