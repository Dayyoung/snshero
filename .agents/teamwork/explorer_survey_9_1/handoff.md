# Handoff Report: Architecture, Hash Routing & Legacy Standalone Route Elimination

- **Agent**: `explorer_survey_9_1`
- **Working Directory**: `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_survey_9_1/`
- **Recipient**: Orchestrator / Parent Agent (`21826d14-7bc9-4995-866c-cbb42a941789`)
- **Deliverable**: `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_survey_9_1/report.md`
- **Timestamp**: 2026-11-02T07:47:00Z

---

## 1. Observation

1. **Dual Entry Point Split**:
   - `index.html` (lines 723–726):
     ```html
     <script type="module" src="/src/landing/index.ts"></script>
     </head>
     <body class="bg-[#fdfcfc] text-[#201d1d] font-mono">
       <div id="landing-root"></div>
     ```
   - `home.html` (lines 778–781):
     ```html
     <script type="module" src="/src/main.tsx"></script>
     </head>
     <body>
       <div id="root"></div>
     ```
2. **Vite Multi-Page Build & Middleware Rewrite**:
   - `vite.config.ts:798–802`:
     ```typescript
     rollupOptions: {
       input: {
         main: path.resolve(process.cwd(), 'index.html'),
         home: path.resolve(process.cwd(), 'home.html'),
       },
     ```
   - `vite.config.ts:125–128`:
     ```typescript
     if (isSpaRoute(normalized)) {
       req.url = `/home.html${query}`;
     }
     ```
3. **Post-Build Pre-rendering of Standalone Route Folders**:
   - `scripts/post-build.js:108`:
     ```javascript
     const spaTemplatePath = fs.existsSync(homeHtmlPath) ? homeHtmlPath : indexPath;
     ```
   - `scripts/post-build.js:79–100, 228–241`: Generates `dist/[route]/index.html` and `dist/[route].html` for 40+ paths (`home`, `deck`, `play`, `shop`, `card-play`, etc.) as copies of `home.html`.
4. **Main App Route Definitions & History Manipulation**:
   - `src/routes.ts:12–65`: Maps `home` to `/home`, `mydeck` to `/deck`, `play` to `/play`, `main` to `/main`, `shop` to `/shop`.
   - `src/routes.ts:422–425`: `getViewPath(view)` returns pathnames (`/home`, `/deck`, `/play`), ignoring hashes.
   - `src/routes.ts:428–506`: `getViewFromPath(pathname, search)` resolves views from `pathname`, ignoring `hash`.
   - `src/App.tsx:818, 1802`: Uses `popstate` listeners; **zero** `hashchange` listeners exist.
   - `src/App.tsx:1853`: `window.history.pushState({ view }, '', targetPath)` pushes standalone pathnames into the URL.
5. **Landing Page Links to Standalone Routes**:
   - `src/landing/components/Header.tsx:97`: `<a href="/home">게임 시작 (/home) →</a>`
   - `src/landing/components/Sidebar.tsx:140`: `<a href="/home">게임 시작하기 (/home) →</a>`
   - `src/landing/views/HomeSection.tsx:41`: `<a href="/home">웹게임 즉시 시작 (/home) →</a>`
   - `src/landing/views/MyDeckSection.tsx:131, 398`: `<a href="/home">...</a>`
6. **Feature Gap in `src/landing/`**:
   - `src/landing/views/PlaySection.tsx` only contains a 40-episode webtoon scene viewer.
   - The tile game engine (`KadanWorldMap`), episode dialogue system (`KadanNpcDialog`), and card battle engine (`MobileCardPlayScreen`) exist exclusively in the main React application (`KadanRpgView.tsx`).

---

## 2. Logic Chain

1. **Premise 1**: The user's Approved Task Prompt (2026-11-02T07:32:49Z) requires:
   - Replacing standalone page routes (`/home`, `/deck`, `/play`, `/main`, `/shop`, `/card`) with hash-based single-page sections (`#home`, `#deck`, `#play`, `#card`, `#shop`) on the main application.
   - `#play` must start on the existing tile game screen (`KadanRpgView`), move to initiate an episode, transition to card play (`MobileCardPlayScreen`), and support auto-play.
   - `#card` character nurturing restricted strictly to owned characters, earning EXP exclusively by winning card battles, with repeat hunting (`반복 사냥`).
   - `#shop` card pack purchases and currency recharges using in-game LocalStorage balances (`hero_sns`), opening card packs into inventory.
   - Complete elimination of standalone routes (`/home`, `/deck`, `/play`, `/main`, `/shop`, `/card`).
2. **Premise 2**: Based on Observation 6, the required game loop (tile game -> episode -> card battle -> EXP award -> repeat hunt) and full shop opening exist exclusively in the React application (`src/main.tsx` / `src/App.tsx`). `src/landing/` is an isolated vanilla string generator lacking these game loop capabilities.
3. **Inference**: If `index.html` continues to host only `src/landing/` while the React app remains on `home.html`, the system will remain fractured, requiring navigation to `/home` to access the actual game.
4. **Deduction**: Achieving complete legacy route elimination and 100% hash route parity requires unifying the application on `index.html` by mounting `src/main.tsx` directly on `index.html` with hash routing (`#home`, `#deck`, `#play`, `#card`, `#shop`).
5. **Conclusion**:
   - `index.html` must mount `src/main.tsx` into `<div id="root"></div>`.
   - `home.html` must be removed or redirected to `/#home`.
   - `vite.config.ts` must remove `home.html` from `rollupOptions.input` and drop SPA pathname rewrites.
   - `scripts/post-build.js` must use `dist/index.html` as the single base template and replace standalone route folders with client-side hash redirect stubs.
   - `src/routes.ts` and `src/App.tsx` must parse and sync `window.location.hash` and listen to `hashchange`.
   - Implement the global 15-second idle auto-play redirect and responsive Google AdSense layout.

---

## 3. Caveats

1. **External Inbound Links**: Existing Google search index sitelinks, Reddit posts, and bookmarks reference `/deck`, `/play`, `/shop`, `/bench`. To prevent 404 errors for external visitors, `scripts/post-build.js` should generate lightweight 301/client-side meta redirect stubs that immediately forward visitors to `/#deck`, `/#play`, `/#shop`, `/#bench`.
2. **Vanilla Landing Sections**: The 110-card nurturing and stat allocation UI currently in `src/landing/views/CardSection.tsx` needs to be integrated into the React application as `CardNurtureView` (or `#card` component) so it directly references `hero_deck_cards`, `hero_all_cards`, and card battle victory EXP.
3. No other caveats.

---

## 4. Conclusion

The dual-entry MPA architecture (`index.html` landing vs `home.html` React app) created artificial standalone routes and prevented a true single-page application experience. Unifying the entry point on `index.html` with hash-based routing (`#home`, `#deck`, `#play`, `#card`, `#shop`), adding the 15-second idle auto-play redirect, and structuring the responsive AdSense units directly solves all requirements with zero legacy standalone route dependency.

A detailed implementation report with code-level diffs, line references, and a phased execution roadmap has been written to:
`/Users/dayyoung/project/snshero/.agents/teamwork/explorer_survey_9_1/report.md`

---

## 5. Verification Method

To independently verify the survey observations and findings:

1. **Verify Dual Entry Configuration**:
   ```bash
   grep -n "src/landing/index.ts" index.html
   grep -n "src/main.tsx" home.html
   grep -n "home.html" vite.config.ts scripts/post-build.js
   ```
2. **Verify Absence of Hash Routing in App.tsx**:
   ```bash
   grep -n "hashchange" src/App.tsx src/routes.ts
   grep -n "pushState" src/App.tsx
   ```
3. **Verify Build Health**:
   ```bash
   npx tsc --noEmit
   npm run build
   ```
   Both must exit with code 0.
4. **Invalidation Conditions**:
   - If `src/landing/index.ts` is shown to contain the full tile game engine, 3x3 DDA battle board, and gacha opening animation, the deduction that `index.html` must mount `src/main.tsx` would be invalidated. (Inspected and confirmed: `PlaySection.tsx` only contains a 40-episode webtoon scene viewer).
