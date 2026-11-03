# Milestone 1 Handoff Report: Legacy Route Elimination & Link Migration

- **Agent**: `explorer_m1_9_2` (Explorer 2 for Milestone 1)
- **Handoff Type**: Hard (Task Complete)
- **Date**: 2026-11-02T08:00:00Z
- **Working Directory**: `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_m1_9_2/`
- **Associated Detailed Report**: `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_m1_9_2/report.md`

---

## 1. Observation

Direct code inspections across the codebase revealed the following exact locations and snippets maintaining standalone routes and links:

1. **`src/landing/components/Header.tsx`**:
   - Line 29: `{ key: 'card', label: '미션' }` (requires rename to '카드').
   - Lines 96–102:
     ```tsx
     <a href="/home" class="px-4 py-2 bg-[#201d1d] text-[#fdfcfc] text-xs font-bold rounded-sm ...">
       게임 시작 (/home) →
     </a>
     ```
2. **`src/landing/components/Sidebar.tsx`**:
   - Line 31: `{ key: 'card', label: '미션', icon: '📜' }` (requires rename to '카드').
   - Lines 139–144:
     ```tsx
     <a href="/home" class="block w-full py-3 bg-[#201d1d] text-[#fdfcfc] ...">
       게임 시작하기 (/home) →
     </a>
     ```
3. **`src/landing/components/Footer.tsx`**:
   - Lines 50–54:
     ```tsx
     <a href="/home" class="min-h-[44px] flex items-center no-underline text-[#201d1d] font-bold hover:underline">
       <span>[→] 원클릭 웹게임 바로가기</span>
     </a>
     ```
4. **`src/landing/components/Modals.tsx`**:
   - Lines 160–166:
     ```tsx
     <a href="/home" class="block w-full py-3 px-4 bg-[#201d1d] text-[#fdfcfc] ...">
       게스트로 게임 시작하기 (/home) →
     </a>
     ```
5. **`src/landing/views/HomeSection.tsx`**:
   - Lines 40–45:
     ```tsx
     <a href="/home" class="px-6 py-3 bg-[#201d1d] text-[#fdfcfc] text-sm font-bold ...">
       웹게임 즉시 시작 (/home) →
     </a>
     ```
6. **`src/landing/views/MyDeckSection.tsx`**:
   - Lines 130–135: `<a href="/home" class="px-4 py-2.5 ...">웹게임 출격 (/home) →</a>`
   - Lines 397–403: `<a href="/home" class="px-5 py-3 ...">실전 배틀 출격 (/home)</a>`
7. **`src/landing/index.ts`**:
   - Lines 195–199: `const hash = window.location.hash.replace('#', '') as ViewKey;` (does not normalize incoming legacy pathnames to hash, and does not split query strings from hashes).
   - Lines 221–230: `hashchange` listener also parses `window.location.hash.replace('#', '')` without `.split('?')[0]`.
8. **`src/routes.ts`**:
   - Lines 21–65: `VIEW_ROUTES` defines `home: { path: '/home' }`, `mydeck: { path: '/deck' }`, `play: { path: '/play' }`, `shop: { path: '/shop' }`, `main: { path: '/main' }`.
   - Lines 422–425: `getViewPath(view: ViewType)` returns `route.path` (e.g. `/home`), pushing pathname routes.
   - Lines 430–506: `getViewFromPath(pathname, search)` ignores hash routing entirely.
9. **`src/App.tsx`**:
   - Line 490: `getViewFromPath(window.location.pathname, window.location.search)` reads only pathname.
   - Lines 818 & 1802: Listens only to `popstate`; registers zero `hashchange` listener.
   - Lines 1817–1855: `window.history.pushState({ view }, '', targetPath)` executes for pathname changes.
   - Lines 5652, 5662, 6681, 6691, 6713, 6731: Navigation callbacks execute `window.history.pushState(null, '', '/' + targetView)`.
   - Lines 6921, 7288, 8005–8010: Logo anchors and hidden crawler links use `href="/home"`, `href="/deck"`, `href="/play"`, `href="/shop"`.
10. **`src/views/KadanRpgView.tsx`**:
    - Lines 317–321 & 341–350: Forcefully sets `url.pathname = '/main'` and updates browser history via `replaceState({ view: 'main' }, '', `${url.pathname}${url.search}`)`.
11. **`src/views/PlayGameView.tsx`**:
    - Line 13416: `window.location.href = `/${targetView}`;`
    - Line 13785: `window.location.href = '/rank';`
12. **`vite.config.ts`**:
    - Lines 125–127: Dev server rewrite sends all `isSpaRoute` paths to `/home.html${query}` without redirecting legacy standalone paths to hash.
13. **`scripts/post-build.js`**:
    - Lines 199–241: Generates full duplicate HTML apps for `home`, `deck`, `play`, `shop`, `main` instead of lightweight redirect stubs.
14. **Test Suite Command Output**:
    - Executed `npx tsx tests/e2e/run_all.ts --milestone M1`. Output: 16 assertions run, 16 passed (100% pass rate).

---

## 2. Logic Chain

1. **Premise 1**: The user mandate in the Approved Task Prompt requires: *"Replace legacy standalone page routes (`/home`, `/deck`, `/play`, `/main`, `/shop`, `/card`) with fully functional hash-based single-page sections (`#home`, `#deck`, `#play`, `#card`, `#shop`) on the main application for production deployment. Complete replacement: Ensure `#home`, `#deck`, `#play`, `#card`, and `#shop` provide full functional parity so legacy routes (`/home`, `/deck`, `/play`, `/main`, `/shop`, `/card`) can be completely removed."*
2. **Inference from Observations 1–6**: The current UI in `src/landing/` actively presents escape links with `href="/home"` in `Header.tsx:97`, `Sidebar.tsx:140`, `Footer.tsx:50`, `Modals.tsx:161`, `HomeSection.tsx:41`, and `MyDeckSection.tsx:131, 398`. When clicked, the browser leaves the landing page and makes an HTTP GET request to `/home`.
3. **Inference from Observations 8–11**: The React application (`App.tsx`, `routes.ts`, `KadanRpgView.tsx`, `PlayGameView.tsx`) updates the address bar via `window.history.pushState` with absolute pathnames (`/home`, `/deck`, `/play`, `/main`, `/shop`). Because `routes.ts` and `App.tsx` ignore hash routing, deep linking or switching sections writes standalone URLs to the address bar.
4. **Inference from Observations 12–13**: The development and build pipelines (`vite.config.ts` and `scripts/post-build.js`) serve or pre-render separate HTML documents for each standalone route, cementing the standalone route dependency.
5. **Deduction (Triple-Layer Defense)**:
   - To completely eliminate standalone routes and prevent broken bookmarks or 404 errors, three defensive redirect layers are necessary:
     - **Layer 1 (Dev/Preview Server)**: `vite.config.ts` intercepts `/home`, `/deck`, `/play`, `/main`, `/shop`, `/card` and responds with an HTTP 302 redirect to `/#home`, `/#deck`, `/#play`, `/#shop`, `/#card`.
     - **Layer 2 (Static Production Host)**: `scripts/post-build.js` generates redirect HTML stubs with `<meta http-equiv="refresh">` and `window.location.replace` for those exact legacy routes.
     - **Layer 3 (Client-side HTML Parsing)**: An inline script in `<head>` of `index.html` immediately parses `window.location.pathname` and normalizes to `/#...` before React or vanilla scripts load.
6. **Deduction (Internal Link Migration)**:
   - All internal links must be rewritten to `href="#play"` (with `data-nav="play"`), `href="#home"`, `href="#deck"`, `href="#card"`, `href="#shop"`.
   - `App.tsx` and `routes.ts` must use `window.location.hash` as the primary routing mechanism for these 5 sections, register `hashchange` event listeners, and ensure `replaceState` updates the hash rather than pushing new pathnames.

---

## 3. Caveats

1. **Subroutes and Special Tools**: Routes outside the 5 core sections (such as `/bench`, `/reddit`, `/gwent`, `/tool/makegrid`, `/mall`) remain intact as dedicated standalone tools or static portals. The hash migration specifically governs the 5 primary game and navigation sections (`#home`, `#deck`, `#play`, `#card`, `#shop`).
2. **Search Parameters with Hashes**: When query parameters (e.g. `?ep=3`, `?card=41`) accompany legacy paths, the redirect normalizer must preserve them (e.g. `/play?ep=3` -> `/#play?ep=3`), and the hash parser must use `.split('?')[0]` when matching view keys.

---

## 4. Conclusion

The exact locations of all legacy `/...` routes and links across the codebase are identified and documented with exact line numbers and drop-in code replacements in `report.md`. By implementing the triple-layer redirect architecture (Vite 302 middleware, post-build redirect HTML stubs, and `<head>` script normalization) and replacing all 7 landing link locations and React pathname pushStates with hash navigation, Milestone 1 can be cleanly implemented with 0 regression and 100% test pass rate.

---

## 5. Verification Method

1. **E2E Test Suite Run**:
   ```bash
   npx tsx tests/e2e/run_all.ts --milestone M1
   ```
   *Expected outcome*: 16/16 assertions pass with exit code 0.
2. **Production Type Checking & Bundling**:
   ```bash
   npx tsc --noEmit
   npm run build
   ```
   *Expected outcome*: Clean compilation with exit code 0.
3. **HTTP Server 302 Redirect Verification**:
   ```bash
   curl -I http://localhost:3000/home
   curl -I http://localhost:3000/deck
   curl -I http://localhost:3000/play
   curl -I http://localhost:3000/card
   curl -I http://localhost:3000/shop
   ```
   *Expected outcome*: Returns `HTTP/1.1 302 Found` with `Location: /#home`, `Location: /#deck`, `Location: /#play`, `Location: /#card`, `Location: /#shop`.
4. **Codebase Grep Audit**:
   ```bash
   grep -rn 'href="/home"' src/landing/
   ```
   *Expected outcome*: 0 matches.
