# Comprehensive Survey Report: Architecture, Hash Routing & Legacy Standalone Route Elimination

- **Subagent**: `explorer_survey_9_1`
- **Date**: 2026-11-02T07:45:00Z
- **Working Directory**: `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_survey_9_1/`
- **Target Specification**: `/Users/dayyoung/project/snshero/.agents/teamwork/ORIGINAL_REQUEST.md` (Approved Task Prompt — 2026-11-02T07:32:49Z)

---

## 1. Executive Summary

This investigation surveys the architecture, routing structure, and legacy route footprint of SNSHero Revolution.

In a previous iteration (commit `7c974408b`), the application was split into a **dual-entry MPA architecture**:
1. `index.html` was repurposed to mount an ultra-lightweight, zero-React vanilla TypeScript template string engine (`src/landing/index.ts`) into `<div id="landing-root"></div>`.
2. `home.html` was introduced to mount the full React 19 application (`src/main.tsx` / `src/App.tsx`) into `<div id="root"></div>` under the path `/home`.
3. To support client-side deep linking, `vite.config.ts` implemented server rewrite middleware (`isSpaRoute`), and `scripts/post-build.js` generated duplicate HTML files and folders for 40+ routes (`dist/home/`, `dist/deck/`, `dist/play/`, `dist/shop/`, etc.) from `home.html`.

This dual-entry architecture created two disjoint applications with incompatible state containers, isolated stores (`cardNurtureStore` vs `SnsContext`/`CARD_DATABASE`), and persistent legacy standalone routes (`/home`, `/deck`, `/play`, `/main`, `/shop`, `/card`).

Under the **Approved Task Prompt (2026-11-02T07:32:49Z)**, the mandate is:
> **"Replace legacy standalone page routes (`/home`, `/deck`, `/play`, `/main`, `/shop`, `/card`) with fully functional hash-based single-page sections (`#home`, `#deck`, `#play`, `#card`, `#shop`) on the main application for production deployment. Complete replacement: Ensure `#home`, `#deck`, `#play`, `#card`, and `#shop` provide full functional parity so legacy routes (`/home`, `/deck`, `/play`, `/main`, `/shop`, `/card`) can be completely removed."**

This report details the exact current routing implementation, dependencies, risks, and a concrete phased migration plan to achieve 100% hash route parity, an idle 15-second auto-play transition, and responsive Google AdSense integration.

---

## 2. In-Depth Current Routing Structure Audit

### 2.1. Dual Entry Points: `index.html` vs `home.html`

| Dimension | `index.html` (Landing) | `home.html` (Main App) |
|---|---|---|
| **File Path** | `/Users/dayyoung/project/snshero/index.html` | `/Users/dayyoung/project/snshero/home.html` |
| **Script Entry** | `<script type="module" src="/src/landing/index.ts"></script>` (Line 723) | `<script type="module" src="/src/main.tsx"></script>` (Line 778) |
| **Root DOM** | `<div id="landing-root"></div>` (Line 726) | `<div id="root"></div>` (Line 781) |
| **CSS Loaded** | `<link rel="stylesheet" href="/src/landing/styles/landing.css" />` | `<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />` + `index.css` |
| **Watchdog** | None | HTML-level watchdog timer (6000ms retry) (Lines 752–776) |
| **Engine Type** | Vanilla TypeScript string interpolation (`innerHTML`) | React 19 + TypeScript + Motion + Context API |

#### Observations:
- In `index.html`, the landing page uses hash routing internally (`#home`, `#deck`, `#play`, `#card`, `#shop`) via `window.location.hash`, but exposes multiple external escape buttons (`href="/home"`) in `Header.tsx:97`, `Sidebar.tsx:140`, `HomeSection.tsx:41`, `MyDeckSection.tsx:131, 398`, `Footer.tsx:50`, and `Modals.tsx:161`.
- Clicking "웹게임 즉시 시작 (/home) →" navigates the browser away from `index.html` to the standalone route `/home`, loading `home.html`.
- `home.html` then runs the React SPA, which uses `window.history.pushState` to transition to other standalone routes (`/deck`, `/play`, `/shop`, `/main`).

---

### 2.2. Build & Dev Server Configuration: `vite.config.ts`

- **Rollup Inputs** (`vite.config.ts:798–802`):
  ```typescript
  rollupOptions: {
    input: {
      main: path.resolve(process.cwd(), 'index.html'),
      home: path.resolve(process.cwd(), 'home.html'),
    },
  ```
- **SPA Route Detection** (`vite.config.ts:44–104`):
  `isSpaRoute(pathname)` marks any path that is not `/`, `/index.html`, `/api/*`, `/mall/*`, `/gwent/*`, `/ai/*`, or an asset file as an SPA route.
- **Dev Server Rewrite** (`vite.config.ts:117–129`):
  Rewrites all SPA requests to `/home.html${query}`:
  ```typescript
  if (isSpaRoute(normalized)) {
    req.url = `/home.html${query}`;
  }
  ```
- **Preview Server Rewrite** (`vite.config.ts:131–158`):
  Checks for pre-rendered `dist/[cleanPath]/index.html` or `dist/[cleanPath].html`, falling back to `/home.html`.

#### Consequence:
The dev and preview servers actively divert any URL other than `/` to `home.html`. This creates an artificial wall between the landing shell (`index.html`) and the game engine (`home.html`).

---

### 2.3. Post-Build Pipeline: `scripts/post-build.js`

- **SPA Template Selection** (`scripts/post-build.js:108`):
  ```javascript
  const spaTemplatePath = fs.existsSync(homeHtmlPath) ? homeHtmlPath : indexPath;
  ```
- **Pre-generated Route Directory Creation** (`scripts/post-build.js:199–241`):
  Iterates over an array of 40+ routes:
  `['home', 'bench', 'benchmark', 'shbp', 'reddit', 'play', 'card-play', 'deck', 'mydeck', 'shop', 'battle', 'market', ...]`
  And creates:
  1. `dist/[route]/index.html`
  2. `dist/[route].html`
  Both are verbatim copies of `dist/home.html` with injected SEO tags.
- **404 Fallback** (`scripts/post-build.js:254–259`):
  `dist/404.html` is copied from `home.html`.

#### Consequence:
A static hosting server serves `dist/home/index.html` for `/home`, `dist/deck/index.html` for `/deck`, etc. Every route is treated as a separate standalone HTML document, cementing standalone route dependency.

---

### 2.4. Route Definition & Resolution: `src/routes.ts`

- **Route Definitions** (`src/routes.ts:12–417`):
  - `home`: `path: '/home'`, `aliases: ['/home', '/main-lobby']` (Lines 21–28)
  - `main`: `path: '/main'` (Lines 29–35)
  - `mydeck`: `path: '/deck'`, `aliases: ['/mydeck']` (Lines 36–43)
  - `play`: `path: '/play'` (Lines 44–50)
  - `'card-play'`: `path: '/card-play'`, `aliases: ['/card-battle', '/mobile-card-battle']` (Lines 51–58)
  - `shop`: `path: '/shop'` (Lines 59–65)
  - Note: There is currently **no** standalone `/card` route in `src/routes.ts` (only `/wiki/card` at Line 367 and `/card-play` at Line 52). In `src/landing/types.ts`, `card` is the key for the card collection & nurture view.
- **Route Retrieval (`getViewPath`)** (`src/routes.ts:422–425`):
  ```typescript
  export function getViewPath(view: ViewType): string {
    const route = VIEW_ROUTES[view];
    return route ? route.path : '/home';
  }
  ```
  Returns absolute pathnames (`/home`, `/deck`, `/play`), **never** hashes.
- **Path Resolution (`getViewFromPath`)** (`src/routes.ts:428–506`):
  Parses `pathname` and `search`. Completely **ignores `window.location.hash`**.
  Falls back to `'home'` if path is `/home` or unmatched.

---

### 2.5. View State & Navigation in Main React App: `src/App.tsx`

1. **Initial View Resolution** (`src/App.tsx:468–491, 526–532`):
   ```typescript
   function getViewFromPathAndUrl(): ViewType {
     ...
     return getViewFromPath(window.location.pathname, window.location.search);
   }
   ```
   Uses only `window.location.pathname`. `window.location.hash` is entirely ignored.
2. **Browser History Event Listeners** (`src/App.tsx:818, 1802`):
   Contains two separate `popstate` listeners that call `getViewFromPathAndUrl()` and `setView()`.
   **Zero `hashchange` listeners exist in `src/App.tsx`.**
3. **URL Synchronization Effect** (`src/App.tsx:1817–1855`):
   ```typescript
   const currentPath = window.location.pathname;
   let targetPath = getViewPath(view);
   ...
   if (currentFullUrl !== targetPath) {
     window.history.pushState({ view }, '', targetPath);
   }
   ```
   Whenever `view` changes (`setView`), `App.tsx` pushes the pathname (`/home`, `/deck`, `/play`, `/shop`, `/main`) into the browser's address bar.
4. **Hardcoded Internal Link Elements**:
   - `src/App.tsx:8005–8010`: Hidden SEO crawl links: `<a href="/home">`, `<a href="/deck">`, `<a href="/play">`, `<a href="/shop">`.
   - `src/App.tsx:6921, 6957`: Header/nav links `<a href="/">`, `<a href="/mall">`.

---

### 2.6. Vanilla Landing Engine: `src/landing/`

`src/landing/` consists of:
- `index.ts`: Singleton controller managing `state.activeView` (`'home' | 'deck' | 'play' | 'card' | 'shop'`), `renderApp()`, event delegation on `data-nav`, and `window.addEventListener('hashchange', ...)`.
- `components/`: `Header.tsx` (6 items), `Sidebar.tsx` (8 items), `Footer.tsx`, `Modals.tsx`.
- `views/`:
  - `HomeSection.tsx`: Introduction + external links (Naver Novel, Naver Webtoon, Munpia) + character visual showcase.
  - `MyDeckSection.tsx`: 5-slot deck representation, calculated Deck TP and Total TP.
  - `PlaySection.tsx`: 40-episode webtoon scene viewer with TTS narration toggle (OFF by default). **Note: Does NOT contain the tile game, episode movement, or card battle.**
  - `CardSection.tsx`: 110-card collection grid, 1~100Lv EXP progression, 4-way stat allocation (Top, Right, Bottom, Left), unspent stat point red dot indicators.
  - `ShopSection.tsx`: 8 fixed shop items, LocalStorage coin debit/credit simulation.
- `services/`:
  - `cardNurtureStore.ts`: LocalStorage persistence under key `'hero_card_nurturing'`. Isolated from the main app's card inventory.

---

## 3. Analysis: Legacy Route Footprint & Disconnects

### 3.1. Inventory of Legacy Standalone Routes to Eliminate

| Legacy Route | Current Main App Handler (`App.tsx`) | `src/landing/` Handler | Target Hash Route | Target User Experience Requirement |
|---|---|---|---|---|
| `/home` | `HomeView.tsx` | `HomeSection.tsx` | `#home` | Display SNS Hero logo and Cool Card Deck logo, retain all existing Home features. |
| `/deck` | `MyDeckView.tsx` | `MyDeckSection.tsx` | `#deck` | Support My Deck editing, retain all existing Deck features. |
| `/play` | `PlayGameView.tsx` (110 minigames) | `PlaySection.tsx` (Webtoon viewer) | `#play` | Initial screen starts on existing tile game (`KadanRpgView`). Navigating/moving initiates episode dialogue, transitions to card play (`MobileCardPlayScreen`), auto-play enabled upon completion. Existing Play features remain accessible. |
| `/main` | `KadanRpgView.tsx` (Tile RPG) | None | `#play` | Merged into `#play` as the primary adventure loop entry point. |
| `/card` | None in `routes.ts` (alias to `/card-play` or `/companion`) | `CardSection.tsx` (110 cards + nurture) | `#card` | Character nurturing restricted strictly to owned characters; EXP earned exclusively by winning card battles; repeat hunting (`반복 사냥`) enabled. |
| `/shop` | `ShopView.tsx` | `ShopSection.tsx` (8 items) | `#shop` | Card pack purchase and currency recharge fixed using in-game LocalStorage currency balances (`hero_sns`), ensuring card packs can be opened and currencies are debited/credited. |

### 3.2. Codebase-Wide Internal Links Requiring Migration

A full grep scan reveals all internal links using legacy `/...` paths:

| File Path | Line Number | Current Code | Required Update | Rationale |
|---|---|---|---|---|
| `src/App.tsx` | 8005 | `<a href="/home">{t('home', language)}</a>` | `<a href="#home">{t('home', language)}</a>` | Eliminate `/home` route reference |
| `src/App.tsx` | 8006 | `<a href="/deck">{t('mydeck', language)}</a>` | `<a href="#deck">{t('mydeck', language)}</a>` | Eliminate `/deck` route reference |
| `src/App.tsx` | 8007 | `<a href="/play">{t('play', language)}</a>` | `<a href="#play">{t('play', language)}</a>` | Eliminate `/play` route reference |
| `src/App.tsx` | 8008 | `<a href="/shop">{t('shop', language)}</a>` | `<a href="#shop">{t('shop', language)}</a>` | Eliminate `/shop` route reference |
| `src/views/HomeView.tsx` | 263 | `<a href="/" onClick={...}>` | `<a href="#home" onClick={...}>` | Clean hash navigation for logo |
| `src/views/PlayGameView.tsx` | 13416 | `window.location.href = `/${targetView}`;` | `window.location.hash = `#${targetView}`;` | Prevent full page reloads to `/` routes |
| `src/components/reddit/RedditAdCard.tsx` | 23 | `window.location.href = '/home';` | `window.location.hash = '#home';` | Hash transition instead of standalone `/home` |
| `src/components/reddit/RedditSidebarLeft.tsx` | 78 | `window.location.href = '/' + targetView;` | `window.location.hash = '#' + targetView;` | Hash transition |
| `src/landing/components/Header.tsx` | 97 | `<a href="/home">게임 시작 (/home) →</a>` | `<a href="#home">게임 시작 →</a>` | Eliminate standalone `/home` link |
| `src/landing/components/Sidebar.tsx` | 140 | `<a href="/home">게임 시작하기 (/home) →</a>` | `<a href="#home">게임 시작하기 →</a>` | Eliminate standalone `/home` link |
| `src/landing/views/HomeSection.tsx` | 41 | `<a href="/home">웹게임 즉시 시작 (/home) →</a>` | `<a href="#home">웹게임 즉시 시작 →</a>` | Eliminate standalone `/home` link |
| `src/landing/views/MyDeckSection.tsx` | 131, 398 | `<a href="/home">...</a>` | `<a href="#home">...</a>` | Eliminate standalone `/home` link |

---

## 4. Architectural Target & Clean Migration Strategy

### 4.1. The Architectural Choice: Single Unified Application on `index.html`

Why must `index.html` mount the main application (`src/main.tsx` / React `App.tsx`) with hash routing?

1. **Functional Parity Requirements**:
   The prompt specifies:
   - `#play`: "The initial screen must start on the existing tile game screen. Navigating/moving initiates an episode. Once the episode finishes, proceed to card play as before, and enable auto-play after completion."
   - `#card`: "Character nurturing is restricted strictly to owned characters. Nurturing requires EXP earned exclusively by winning card battles. After a match ends, enable repeat hunting (`반복 사냥`)."
   - `#shop`: "Fix card pack purchase and currency recharge functionality using in-game currency balances and LocalStorage, ensuring card packs can be opened and currencies are properly credited and debited."

   These are **core game engine systems** implemented in React (`KadanRpgView.tsx`, `MobileCardPlayScreen.tsx`, `PlayGameView.tsx`, `ShopView.tsx`, `CardDatabase`, `SnsContext`). The string-template engine in `src/landing/` lacks these capabilities.
2. **True Single-Page Application**:
   When `index.html` mounts `src/main.tsx`, users access `https://snshero.com/#home`, `#deck`, `#play`, `#card`, `#shop`. All interactions occur within a single client-side runtime without reloading or requiring server-side path rewrites.
3. **Complete Legacy Elimination**:
   `home.html` becomes obsolete. `dist/` contains a single production `index.html`. Legacy bookmarks (`/home`, `/deck`, `/play`) can be caught either by a 5-line static redirect in `dist/` or Vite fallback that immediately rewrites `window.location.replace('/#' + route)`.

---

### 4.2. Detailed Migration Blueprint

```
                      CURRENT ARCHITECTURE (Dual-Entry MPA)
                      
   User Request: / --------------> index.html -----> src/landing/index.ts (Vanilla TS)
                                                          │
                                                Click: "게임 시작 (/home)"
                                                          ▼
   User Request: /home, /deck ---> home.html ------> src/main.tsx -----> App.tsx (React 19)
   User Request: /play, /shop      (Vite Rewrite                          │
                                    & post-build static HTML duplicates)   ▼
                                                                  window.history.pushState
                                                                  (/home, /deck, /play, /shop)
                                                                  [STANDALONE ROUTES ACTIVE]
```

```
                      TARGET ARCHITECTURE (100% Hash SPA)
                      
   User Request: / ------------------------┐
   User Request: /#home -------------------|
   User Request: /#deck -------------------|
   User Request: /#play -------------------|-----> index.html -----> src/main.tsx -----> App.tsx
   User Request: /#card -------------------|                                               │
   User Request: /#shop -------------------|                                               │
   Legacy URL:   /home, /deck, etc. -------┘ (Client/fallback redirect)                     │
                                                                                           ▼
                                                                           window.location.hash
                                                                           & hashchange listener
                                                                           (#home, #deck, #play, #card, #shop)
                                                                           [ZERO STANDALONE ROUTES]
```

---

## 5. Concrete Step-by-Step Implementation Plan

### Phase 1: Hash Routing Core in `src/routes.ts` & `src/App.tsx`

1. **`src/routes.ts`**:
   - Update `VIEW_ROUTES`:
     - `home`: `hash: '#home'`, `path: '#home'`
     - `mydeck`: `hash: '#deck'`, `path: '#deck'`
     - `play`: `hash: '#play'`, `path: '#play'`
     - `card`: add new entry `card` (`hash: '#card'`, `path: '#card'`)
     - `shop`: `hash: '#shop'`, `path: '#shop'`
     - `main`: alias to `#play`
   - Update `getViewPath(view: ViewType)`:
     ```typescript
     export function getViewPath(view: ViewType): string {
       const hashRoutes: Record<string, string> = {
         home: '#home',
         mydeck: '#deck',
         play: '#play',
         main: '#play',
         card: '#card',
         shop: '#shop',
       };
       return hashRoutes[view] || `#${view}`;
     }
     ```
   - Update `getViewFromPath(pathname: string, search = '', hash = '')`:
     - Inspect `hash` (or `window.location.hash`) **first**:
       - `#home` -> `'home'`
       - `#deck` -> `'mydeck'`
       - `#play` -> `'play'` (or `'main'` depending on initial state)
       - `#card` -> `'card'`
       - `#shop` -> `'shop'`
     - Fallback for legacy paths:
       - If `pathname === '/home'` -> redirect to `/#home`
       - If `pathname === '/deck'` -> redirect to `/#deck`
       - If `pathname === '/play'` or `'/main'` -> redirect to `/#play`
       - If `pathname === '/shop'` -> redirect to `/#shop`
       - If `pathname === '/card'` -> redirect to `/#card`

2. **`src/App.tsx`**:
   - In `getViewFromPathAndUrl()`: Read `window.location.hash` first.
   - Add `window.addEventListener('hashchange', handleHashRouting)` in the URL listener `useEffect`.
   - In the URL synchronization `useEffect` (`App.tsx:1817–1855`):
     - Instead of `window.history.pushState({ view }, '', targetPath)` with pathname:
     - Set `window.location.hash = targetHash` (or `window.history.replaceState(null, '', targetHash)`).
   - Ensure `popstate` and `hashchange` both synchronize seamlessly without infinite loops.

---

### Phase 2: Feature Parity & Section Implementation

#### 1. `#home` Parity (`HomeView.tsx`)
- Display both:
  1. **SNS Hero Logo**: `/logo-ko.png` / `/logo-en.png` (already present at `HomeView.tsx:275`).
  2. **Cool Card Deck Logo**: Add Cool Card Deck emblem badge next to or under the title (e.g. `nunhero-logo.png` or dedicated Cool Card Deck logo).
- Retain 100% of existing Home features:
  - 5-card fan deck showcase (`LobbyInteractiveCard`)
  - CP & win-streak HUD
  - Quick action hub, mailbox, notices, media links.

#### 2. `#deck` Parity (`MyDeckView.tsx`)
- Display and edit 5 active cards, equipment slots, skill slots.
- Retain all existing deck features, filter by faction/rarity, save deck to LocalStorage (`hero_deck_cards`).

#### 3. `#play` Parity (`KadanRpgView.tsx` + `PlayGameView.tsx`)
- Requirements:
  - Initial screen starts on the **existing tile game screen** (`KadanRpgView.tsx`).
  - Navigating/moving initiates an episode.
  - When dialogue finishes, transitions to card play (`MobileCardPlayScreen.tsx`).
  - Once card play finishes, enables auto-play.
  - Existing Play features (`PlayGameView` minigame arcade) remain accessible via navigation or quick toggle.
- Implementation:
  - Map `#play` to `KadanRpgView` by default (or start on tile view).
  - Ensure `isAutoBattle` / `autoMode` can be toggled cleanly upon episode completion.

#### 4. `#card` Parity (Character Nurturing & Repeat Hunting)
- Requirements:
  - Restrict character nurturing strictly to **owned characters** (`ownedCardIds` / `hero_deck_cards` + `hero_all_cards`).
  - Nurturing requires EXP earned **exclusively by winning card battles**.
  - When a match ends (in `MobileCardPlayScreen.tsx` / `PlayGameView.tsx`), award victory EXP to participating cards and enable **Repeat Hunting (`반복 사냥`)**.
  - Provide 1~100Lv EXP progression, stat points (1 pt/level), 4-way allocation (Top, Right, Bottom, Left), and red dot indicators for unspent points.
- Implementation:
  - Create a dedicated React `CardNurtureView` (or integrate `CardSection` into `App.tsx` views) using the formula:
    `expToNext = level * 100`.
  - In `MobileCardPlayScreen.tsx` match result handler: On victory, award EXP to owned cards, update LocalStorage (`hero_card_nurturing`), and display `[⚡ 반복 사냥 (Repeat Hunt)]` button to immediately rematch without leaving the battle loop.

#### 5. `#shop` Parity (`ShopView.tsx`)
- Requirements:
  - Fix card pack purchase and currency recharge functionality using in-game currency balances (`hero_sns`) and LocalStorage.
  - Ensure card packs can be opened (`GachaRevealSequence`), new cards are added to inventory (`addCard`), and currencies are properly credited and debited.
- Implementation:
  - Verify that `ShopView.tsx` executes purchases against `localStorage.getItem('hero_sns')`, decrements the cost, calls `addCard()`, and triggers `GachaRevealSequence` without relying on dead external endpoints.

---

### Phase 3: Global 15-Second Idle Auto-Play Transition (R2)

- **Requirements**:
  - If user input is absent for 15 seconds or more on **any** screen, automatically navigate to `#play` (`https://dayyoung-macbookpro.tail3717a4.ts.net/#play`) and initiate auto-play.
  - Any user interaction resets the timer.
- **Implementation in `src/App.tsx`**:
  ```typescript
  useEffect(() => {
    let idleTimer: NodeJS.Timeout;
    
    const resetIdleTimer = () => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        // If not already in active auto-play on #play
        const currentHash = window.location.hash;
        if (currentHash !== '#play' || !isAutoBattleActive) {
          console.log('[IdleTracker] 15s idle detected. Navigating to #play and starting auto-play...');
          window.location.hash = '#play';
          setView('main'); // or 'play' with autoMode
          localStorage.setItem('hero_auto_battle', 'true');
          setIsAutoBattle(true);
        }
      }, 15000);
    };

    const activityEvents = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'pointerdown'];
    activityEvents.forEach((evt) => window.addEventListener(evt, resetIdleTimer, { passive: true }));
    resetIdleTimer();

    return () => {
      clearTimeout(idleTimer);
      activityEvents.forEach((evt) => window.removeEventListener(evt, resetIdleTimer));
    };
  }, []);
  ```

---

### Phase 4: Responsive Google AdSense Integration (R3)

- **Requirements**:
  - PC / Desktop (`width >= 1024px`): Display Google ad units in the left and right side gutters/margins without obstructing game interface elements.
  - Tablet & Mobile (`width < 1024px`): Display a mobile banner ad unit at the top of the viewport.
  - Zero obstruction to 3x3 battle boards, player hand, touch canvas, or controls.
  - Configurable publisher (`ca-pub-6937094123258335`) and slot IDs.
- **Implementation in `src/App.tsx` / Layout Wrapper**:
  ```tsx
  <div className="app-layout flex flex-col min-h-screen w-full relative">
    {/* Tablet & Mobile: Top Viewport Banner */}
    <div className="lg:hidden w-full flex justify-center bg-transparent border-b border-[rgba(15,0,0,0.06)] z-20">
      <AdSenseBanner slot="MOBILE_TOP_BANNER" format="horizontal" className="max-w-[728px] max-h-[90px]" />
    </div>

    <div className="flex-1 flex justify-center w-full relative">
      {/* Desktop Left Gutter Ad Unit */}
      <aside className="hidden lg:flex flex-col items-end w-40 xl:w-48 p-2 shrink-0 select-none pointer-events-auto">
        <div className="sticky top-16">
          <AdSenseBanner slot="DESKTOP_LEFT_GUTTER" format="vertical" className="w-[160px] min-h-[600px]" />
        </div>
      </aside>

      {/* Main View Content (375px ~ 1024px centered game stage) */}
      <main className="flex-1 max-w-5xl w-full min-h-screen relative overflow-x-hidden">
        {renderView()}
      </main>

      {/* Desktop Right Gutter Ad Unit */}
      <aside className="hidden lg:flex flex-col items-start w-40 xl:w-48 p-2 shrink-0 select-none pointer-events-auto">
        <div className="sticky top-16">
          <AdSenseBanner slot="DESKTOP_RIGHT_GUTTER" format="vertical" className="w-[160px] min-h-[600px]" />
        </div>
      </aside>
    </div>
  </div>
  ```

---

### Phase 5: Pipeline & Build Simplification

1. **`index.html`**:
   - Change module script: `<script type="module" src="/src/main.tsx"></script>`.
   - Set container: `<div id="root"></div>`.
   - Remove `<script type="module" src="/src/landing/index.ts"></script>`.
2. **`home.html`**:
   - Deprecate / remove or replace with client-side redirect: `<script>window.location.replace('/#home');</script>`.
3. **`vite.config.ts`**:
   - `rollupOptions.input`: Change to `{ main: path.resolve(process.cwd(), 'index.html') }`.
   - Remove MPA rewrites from dev and preview middleware; all routes fall back to `index.html`.
4. **`scripts/post-build.js`**:
   - Use `dist/index.html` as the single base template.
   - For legacy standalone routes (`/home`, `/deck`, `/play`, `/main`, `/shop`, `/card`), generate lightweight static 301/client-redirect HTML stubs (`window.location.replace('/#' + route)`).
   - This prevents 404s for users with cached bookmarks while completely eliminating standalone server routing dependencies.

---

## 6. Risks, Edge Cases & Verification Strategy

### 6.1. Identified Risks & Mitigations

| Risk | Impact | Mitigation Strategy |
|---|---|---|
| **Infinite Routing Loop** between `hashchange` and `setView` | Browser tab freeze / lockup | Add guard: Only update `window.location.hash` if current hash differs from target view hash. |
| **Search Param Stripping** on hash change | Lost query parameters (e.g. `?card=5`, `?ch=2`) | Store search params alongside hash (e.g. `#play?ch=2` or preserve `window.location.search`). |
| **Idle Timer Accidental Trigger during gameplay** | Player disrupted during battle | Listen to all input events (`pointerdown`, `touchstart`, `scroll`, `keydown`); reset timer continuously on any touch. |
| **Gutter Ad Occlusion on Laptops (1024px–1280px)** | Ad covers game board | Wrap game canvas in explicit `max-w-4xl` with CSS `flex-shrink-0` and disable gutters when viewport width < 1200px. |
| **LocalStorage State Conflict** (`hero_card_nurturing` vs `hero_deck_cards`) | Disjoint card inventory | Single Source of Truth: sync owned cards from `hero_deck_cards` & `hero_all_cards` directly into card nurture state. |

### 6.2. Independent Verification Method

1. **TypeScript Type Check**:
   ```bash
   npx tsc --noEmit
   ```
   Must pass with 0 errors.
2. **Production Build**:
   ```bash
   npm run build
   ```
   Must exit with code 0 and generate `dist/index.html` with single bundle entry.
3. **Automated Hash Routing Validation**:
   - Load `http://localhost:3000/#home` -> renders `HomeView` with SNS Hero logo & Cool Card Deck logo.
   - Load `http://localhost:3000/#deck` -> renders `MyDeckView`.
   - Load `http://localhost:3000/#play` -> renders `KadanRpgView` tile map, allows movement to initiate episode, card battle, and auto-play.
   - Load `http://localhost:3000/#card` -> renders character nurturing view restricted to owned cards, with EXP and 4-way stats.
   - Load `http://localhost:3000/#shop` -> allows purchasing card packs with LocalStorage SNS balance, debits coins, reveals cards.
   - Test legacy paths: `http://localhost:3000/home` immediately redirects to `http://localhost:3000/#home`.
4. **15-Second Idle Test**:
   - Remain idle on `#deck` for 15 seconds -> verify automatic transition to `#play` with auto-play active.
   - Touch/click at 14s -> verify timer resets.
5. **AdSense Layout Test**:
   - At desktop width (1280px): verify left and right gutter ads render outside the game container.
   - At mobile width (375px): verify top banner ad renders above navigation with 0 horizontal overflow.

---

## 7. Conclusion

The dual-entry architecture (`index.html` vanilla landing vs `home.html` React app) created duplicate routing layers and standalone route dependencies. Migrating all primary workflows (`#home`, `#deck`, `#play`, `#card`, `#shop`) to hash routes on the main application loaded via `index.html` cleanly resolves these issues, eliminates standalone route dependencies, guarantees full functional parity across all game mechanics, and delivers the 15-second auto-play transition and responsive AdSense layout required for production deployment.
