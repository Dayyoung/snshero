# Milestone 1 Investigation Report: Legacy Route Elimination & Link Migration

- **Investigator**: `explorer_m1_9_2` (Explorer 2 for Milestone 1)
- **Date**: 2026-11-02T07:58:00Z
- **Working Directory**: `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_m1_9_2/`
- **Scope**: Legacy standalone route elimination (`/home`, `/deck`, `/play`, `/main`, `/shop`, `/card`), internal link migration to hash sections (`#home`, `#deck`, `#play`, `#card`, `#shop`), and URL normalization / redirect architecture.

---

## 1. Executive Summary

In a prior release iteration (commit `7c974408b`), the application was separated into a dual-entry architecture (`index.html` loading vanilla TypeScript `src/landing/index.ts` vs `home.html` loading React 19 `src/main.tsx`). In that configuration, multiple UI controls exposed escape links directly to standalone routes (`/home`, `/deck`, `/play`, `/shop`), while `App.tsx` and various subcomponents continued calling `window.history.pushState` with absolute pathnames.

Under the Approved Task Prompt, all primary user workflows must operate via **clean hash routing on the main application**:
- `#home` replaces legacy `/home`
- `#deck` replaces legacy `/deck`
- `#play` replaces legacy `/play` and `/main`
- `#card` replaces legacy `/card` (and previous `/companion` / `/mission`)
- `#shop` replaces legacy `/shop`

This report provides the exhaustive inventory, exact line numbers, before-and-after code replacement specifications, and a three-layer redirect architecture ensuring **zero legacy `/...` link remains in the UI and all legacy URLs instantly and cleanly normalize to hash sections**.

---

## 2. Legacy Route Footprint & Mapping Specification

| Legacy Path | Aliases | Target Hash Route | Target View Handler | Normalization Behavior |
|---|---|---|---|---|
| `/home` | `/main-lobby` | `/#home` | `HomeSection.tsx` / `HomeView.tsx` | Instant 302 / client `replaceState` to `/#home` |
| `/deck` | `/mydeck` | `/#deck` | `MyDeckSection.tsx` / `MyDeckView.tsx` | Instant 302 / client `replaceState` to `/#deck` |
| `/play` | none | `/#play` | `PlaySection.tsx` / `KadanRpgView.tsx` | Instant 302 / client `replaceState` to `/#play` |
| `/main` | `/main/*` | `/#play` | `PlaySection.tsx` / `KadanRpgView.tsx` | Instant 302 / client `replaceState` to `/#play` (preserves `?ep=...`) |
| `/card` | `/card-play`, `/mobile-card-battle` | `/#card` | `CardSection.tsx` / `CardNurtureView` | Instant 302 / client `replaceState` to `/#card` |
| `/shop` | none | `/#shop` | `ShopSection.tsx` / `ShopView.tsx` | Instant 302 / client `replaceState` to `/#shop` |

---

## 3. Exhaustive Internal Link Audit & Exact Replacements

### 3.1. Landing Components (`src/landing/components/`)

#### 1) `src/landing/components/Header.tsx`
- **Line 29**: Nav definition for card section.
  - **Before**:
    ```typescript
    { key: 'card', label: '미션' },
    ```
  - **After**:
    ```typescript
    { key: 'card', label: '카드' },
    ```
- **Lines 96–102**: Top right call-to-action button currently points to `/home`.
  - **Before**:
    ```tsx
            <!-- Right Action: Game SPA Launch & Quick Links -->
            <div class="flex items-center gap-2">
              <a
                href="/home"
                class="px-4 py-2 bg-[#201d1d] text-[#fdfcfc] text-xs font-bold rounded-sm hover:opacity-90 transition-opacity min-h-[44px] inline-flex items-center justify-center no-underline"
              >
                게임 시작 (/home) →
              </a>
            </div>
    ```
  - **After**:
    ```tsx
            <!-- Right Action: Game Launch & Quick Links -->
            <div class="flex items-center gap-2">
              <a
                href="#play"
                data-nav="play"
                class="px-4 py-2 bg-[#201d1d] text-[#fdfcfc] text-xs font-bold rounded-sm hover:opacity-90 transition-opacity min-h-[44px] inline-flex items-center justify-center no-underline"
              >
                게임 시작 →
              </a>
            </div>
    ```

#### 2) `src/landing/components/Sidebar.tsx`
- **Line 31**: Sidebar definition for card section.
  - **Before**:
    ```typescript
    { key: 'card', label: '미션', icon: '📜' },
    ```
  - **After**:
    ```typescript
    { key: 'card', label: '카드', icon: '📜' },
    ```
- **Lines 139–144**: Drawer bottom action button currently points to `/home`.
  - **Before**:
    ```tsx
              <a
                href="/home"
                class="block w-full py-3 bg-[#201d1d] text-[#fdfcfc] text-center text-xs font-bold rounded-sm min-h-[44px] leading-[20px] hover:opacity-90 transition-opacity no-underline flex items-center justify-center"
              >
                게임 시작하기 (/home) →
              </a>
    ```
  - **After**:
    ```tsx
              <a
                href="#play"
                data-nav="play"
                class="block w-full py-3 bg-[#201d1d] text-[#fdfcfc] text-center text-xs font-bold rounded-sm min-h-[44px] leading-[20px] hover:opacity-90 transition-opacity no-underline flex items-center justify-center"
              >
                게임 시작하기 →
              </a>
    ```

#### 3) `src/landing/components/Footer.tsx`
- **Lines 50–54**: Footer quick links currently point to `/home`.
  - **Before**:
    ```tsx
              <a
                href="/home"
                class="min-h-[44px] flex items-center no-underline text-[#201d1d] font-bold hover:underline"
              >
                <span>[→] 원클릭 웹게임 바로가기</span>
              </a>
    ```
  - **After**:
    ```tsx
              <a
                href="#play"
                data-nav="play"
                class="min-h-[44px] flex items-center no-underline text-[#201d1d] font-bold hover:underline"
              >
                <span>[→] 원클릭 웹게임 바로가기</span>
              </a>
    ```

#### 4) `src/landing/components/Modals.tsx`
- **Lines 160–166**: Guest login modal action button currently points to `/home`.
  - **Before**:
    ```tsx
            <div class="space-y-2 mb-4">
              <a
                href="/home"
                class="block w-full py-3 px-4 bg-[#201d1d] text-[#fdfcfc] text-center text-xs font-bold rounded-sm min-h-[44px] leading-[20px] hover:opacity-90 transition-opacity no-underline flex items-center justify-center"
              >
                게스트로 게임 시작하기 (/home) →
              </a>
            </div>
    ```
  - **After**:
    ```tsx
            <div class="space-y-2 mb-4">
              <a
                href="#play"
                data-nav="play"
                class="block w-full py-3 px-4 bg-[#201d1d] text-[#fdfcfc] text-center text-xs font-bold rounded-sm min-h-[44px] leading-[20px] hover:opacity-90 transition-opacity no-underline flex items-center justify-center"
              >
                게스트로 게임 시작하기 →
              </a>
            </div>
    ```

---

### 3.2. Landing Views (`src/landing/views/`)

#### 1) `src/landing/views/HomeSection.tsx`
- **Lines 40–45**: Primary banner action button currently points to `/home`.
  - **Before**:
    ```tsx
                  <a
                    href="/home"
                    class="px-6 py-3 bg-[#201d1d] text-[#fdfcfc] text-sm font-bold rounded-sm hover:opacity-90 transition-opacity min-h-[44px] inline-flex items-center justify-center no-underline shadow-none"
                  >
                    웹게임 즉시 시작 (/home) →
                  </a>
    ```
  - **After**:
    ```tsx
                  <a
                    href="#play"
                    data-nav="play"
                    class="px-6 py-3 bg-[#201d1d] text-[#fdfcfc] text-sm font-bold rounded-sm hover:opacity-90 transition-opacity min-h-[44px] inline-flex items-center justify-center no-underline shadow-none"
                  >
                    웹게임 즉시 시작 →
                  </a>
    ```

#### 2) `src/landing/views/MyDeckSection.tsx`
- **Lines 130–135**: Header quick action button currently points to `/home`.
  - **Before**:
    ```tsx
                  <a
                    href="/home"
                    class="px-4 py-2.5 bg-[#f1eeee] text-[#201d1d] border border-[rgba(15,0,0,0.12)] text-xs font-bold rounded-sm hover:bg-[#e8e5e5] transition-colors min-h-[44px] inline-flex items-center justify-center no-underline"
                  >
                    웹게임 출격 (/home) →
                  </a>
    ```
  - **After**:
    ```tsx
                  <a
                    href="#play"
                    data-nav="play"
                    class="px-4 py-2.5 bg-[#f1eeee] text-[#201d1d] border border-[rgba(15,0,0,0.12)] text-xs font-bold rounded-sm hover:bg-[#e8e5e5] transition-colors min-h-[44px] inline-flex items-center justify-center no-underline"
                  >
                    웹게임 출격 →
                  </a>
    ```
- **Lines 397–403**: Inspector card action button currently points to `/home`.
  - **Before**:
    ```tsx
                    <a
                      href="/home"
                      class="px-5 py-3 bg-[#f1eeee] text-[#201d1d] border border-[rgba(15,0,0,0.12)] text-xs font-bold rounded-sm hover:bg-[#e8e5e5] transition-colors min-h-[44px] inline-flex items-center justify-center no-underline"
                    >
                      실전 배틀 출격 (/home)
                    </a>
    ```
  - **After**:
    ```tsx
                    <a
                      href="#play"
                      data-nav="play"
                      class="px-5 py-3 bg-[#f1eeee] text-[#201d1d] border border-[rgba(15,0,0,0.12)] text-xs font-bold rounded-sm hover:bg-[#e8e5e5] transition-colors min-h-[44px] inline-flex items-center justify-center no-underline"
                    >
                      실전 배틀 출격 →
                    </a>
    ```

#### 3) `src/landing/index.ts`
- **Lines 194–200**: Initial hash resolution and legacy URL normalization on mount.
  - **Before**:
    ```typescript
    function mountLanding(): void {
      // Sync view from initial URL hash if present
      const hash = window.location.hash.replace('#', '') as ViewKey;
      const validViews: ViewKey[] = ['home', 'deck', 'play', 'card', 'shop'];
      if (validViews.includes(hash)) {
        state.activeView = hash;
      }
    ```
  - **After**:
    ```typescript
    function mountLanding(): void {
      const pathname = (window.location.pathname || '').replace(/\/+$/, '').toLowerCase();
      const legacyMap: Record<string, ViewKey> = {
        '/home': 'home',
        '/main-lobby': 'home',
        '/deck': 'deck',
        '/mydeck': 'deck',
        '/play': 'play',
        '/main': 'play',
        '/card': 'card',
        '/shop': 'shop',
      };

      if (legacyMap[pathname]) {
        const targetView = legacyMap[pathname];
        state.activeView = targetView;
        const search = window.location.search || '';
        try {
          window.history.replaceState({ view: targetView }, '', `/#${targetView}${search}`);
        } catch {
          window.location.hash = `#${targetView}`;
        }
      } else {
        const rawHash = window.location.hash.replace(/^#/, '');
        const hash = rawHash.split('?')[0] as ViewKey;
        const validViews: ViewKey[] = ['home', 'deck', 'play', 'card', 'shop'];
        if (validViews.includes(hash)) {
          state.activeView = hash;
        }
      }
    ```
- **Lines 221–230**: `hashchange` listener query string splitting.
  - **Before**:
    ```typescript
      window.addEventListener('hashchange', () => {
        const currentHash = window.location.hash.replace('#', '') as ViewKey;
        if (validViews.includes(currentHash) && currentHash !== state.activeView) {
          if (state.activeView === 'play' && currentHash !== 'play') {
            stopPlayTts();
          }
          state.activeView = currentHash;
          renderApp();
        }
      });
    ```
  - **After**:
    ```typescript
      window.addEventListener('hashchange', () => {
        const rawHash = window.location.hash.replace(/^#/, '');
        const currentHash = rawHash.split('?')[0] as ViewKey;
        const validViews: ViewKey[] = ['home', 'deck', 'play', 'card', 'shop'];
        if (validViews.includes(currentHash) && currentHash !== state.activeView) {
          if (state.activeView === 'play' && currentHash !== 'play') {
            stopPlayTts();
          }
          state.activeView = currentHash;
          renderApp();
        }
      });
    ```

---

### 3.3. Main React Application & Routes (`src/App.tsx`, `src/routes.ts`, `src/views/`)

#### 1) `src/routes.ts`
- **Lines 422–425**: `getViewPath` returning hash for core views instead of pathname.
  - **Before**:
    ```typescript
    export function getViewPath(view: ViewType): string {
      const route = VIEW_ROUTES[view];
      return route ? route.path : '/home';
    }
    ```
  - **After**:
    ```typescript
    export const HASH_VIEW_MAP: Record<string, string> = {
      home: '#home',
      mydeck: '#deck',
      play: '#play',
      main: '#play',
      card: '#card',
      shop: '#shop',
    };

    export function getViewPath(view: ViewType): string {
      if (HASH_VIEW_MAP[view]) {
        return HASH_VIEW_MAP[view];
      }
      const route = VIEW_ROUTES[view];
      return route ? route.path : '#home';
    }
    ```
- **Lines 430–506**: `getViewFromPath` supporting hash priority.
  - **Before**:
    ```typescript
    export function getViewFromPath(pathname: string, search = ''): ViewType {
    ```
  - **After**:
    ```typescript
    export function getViewFromPath(pathname: string, search = '', hash = ''): ViewType {
      const currentHash = (hash || (typeof window !== 'undefined' ? window.location.hash : ''))
        .replace(/^#/, '')
        .toLowerCase()
        .split('?')[0];

      if (currentHash === 'home') return 'home';
      if (currentHash === 'deck') return 'mydeck';
      if (currentHash === 'play') return 'play';
      if (currentHash === 'card') return 'card' as ViewType;
      if (currentHash === 'shop') return 'shop';
      if (currentHash === 'main') return 'play';

      // Fallback normalization for legacy standalone paths
      const cleanPath = pathname.replace(/\/+$/, '').toLowerCase() || '/';
      if (cleanPath === '/home' || cleanPath === '/main-lobby') return 'home';
      if (cleanPath === '/deck' || cleanPath === '/mydeck') return 'mydeck';
      if (cleanPath === '/play' || cleanPath === '/main') return 'play';
      if (cleanPath === '/card') return 'card' as ViewType;
      if (cleanPath === '/shop') return 'shop';
      ...
    ```

#### 2) `src/App.tsx`
- **Lines 468–491**: `getViewFromPathAndUrl` with immediate legacy normalization.
  - **Before**:
    ```typescript
    function getViewFromPathAndUrl(): ViewType {
      if (typeof window === 'undefined') return 'home';

      const path = window.location.pathname.replace(/\/$/, '').toLowerCase() || '/';
      ...
      return getViewFromPath(window.location.pathname, window.location.search);
    }
    ```
  - **After**:
    ```typescript
    function getViewFromPathAndUrl(): ViewType {
      if (typeof window === 'undefined') return 'home';

      const path = window.location.pathname.replace(/\/+$/, '').toLowerCase() || '/';
      const legacyToHash: Record<string, string> = {
        '/home': '#home',
        '/main-lobby': '#home',
        '/deck': '#deck',
        '/mydeck': '#deck',
        '/play': '#play',
        '/main': '#play',
        '/card': '#card',
        '/shop': '#shop',
      };

      if (legacyToHash[path]) {
        const targetHash = legacyToHash[path];
        const search = window.location.search || '';
        const normalizedUrl = `/${targetHash}${search}`;
        try {
          window.history.replaceState({ view: path }, '', normalizedUrl);
        } catch {
          window.location.replace(normalizedUrl);
        }
      }

      return getViewFromPath(window.location.pathname, window.location.search, window.location.hash);
    }
    ```
- **Lines 817–824**: URL listener registration.
  - Add `window.addEventListener('hashchange', handleUrlParams);`
  - Remove on cleanup: `window.removeEventListener('hashchange', handleUrlParams);`
- **Lines 1801–1804**: URL router listener registration.
  - Add `window.addEventListener('hashchange', handleUrlRouting);`
  - Remove on cleanup: `window.removeEventListener('hashchange', handleUrlRouting);`
- **Lines 1817–1855**: URL sync effect.
  - **Before**:
    ```typescript
        const currentFullUrl = currentPath + (shouldPreserveSearch ? window.location.search : '');
        if (currentFullUrl !== targetPath) {
          window.history.pushState({ view }, '', targetPath);
        }
    ```
  - **After**:
    ```typescript
        if (targetPath.startsWith('#')) {
          if (window.location.hash !== targetPath) {
            window.history.replaceState({ view }, '', targetPath);
          }
        } else if (currentFullUrl !== targetPath) {
          window.history.pushState({ view }, '', targetPath);
        }
    ```
- **Lines 5652, 5662, 6681, 6691, 6713, 6731**: Navigation callbacks in views.
  - Replace `window.history.pushState(null, '', '/' + targetView)` with:
    ```typescript
    const hash = targetView === 'home' ? '#home' : targetView === 'mydeck' ? '#deck' : targetView === 'main' ? '#play' : `#${targetView}`;
    window.location.hash = hash;
    ```
- **Lines 6920–6929 & 7284–7290**: Drawer brand logo navigation.
  - Change `href="/"` to `href="#home"`.
  - Replace `pushState({ view: 'home' }, '', '/')` with `window.location.hash = '#home'`.
- **Lines 8005–8011**: Hidden SEO crawl navigation.
  - **Before**:
    ```tsx
          <a href="/home">{t('home', language)}</a>
          <a href="/deck">{t('mydeck', language)}</a>
          <a href="/play">{t('play', language)}</a>
          <a href="/shop">{t('shop', language)}</a>
          <a href="/setting">{t('setting', language)}</a>
          <a href="/wiki">Wiki</a>
    ```
  - **After**:
    ```tsx
          <a href="#home">{t('home', language)}</a>
          <a href="#deck">{t('mydeck', language)}</a>
          <a href="#play">{t('play', language)}</a>
          <a href="#card">{language === 'ko' ? '카드' : 'Card'}</a>
          <a href="#shop">{t('shop', language)}</a>
          <a href="/setting">{t('setting', language)}</a>
          <a href="/wiki">Wiki</a>
    ```

#### 3) `src/views/HomeView.tsx`
- **Lines 262–270**: Main logo header.
  - **Before**:
    ```tsx
                    <a
                      href="/"
                      onClick={(e) => {
                        e.preventDefault();
                        onNavigate('home');
                        window.history.pushState({ view: 'home' }, '', '/');
                        window.dispatchEvent(new PopStateEvent('popstate'));
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
    ```
  - **After**:
    ```tsx
                    <a
                      href="#home"
                      onClick={(e) => {
                        e.preventDefault();
                        onNavigate('home');
                        window.location.hash = '#home';
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
    ```
- **Lines 837–845**: Footer logo anchor.
  - Same update: `href="#home"` and `window.location.hash = '#home'`.

#### 4) `src/views/PlayGameView.tsx`
- **Line 13416**: Target view navigation fallback.
  - **Before**:
    ```typescript
    window.location.href = `/${targetView}`;
    ```
  - **After**:
    ```typescript
    const targetHash = targetView === 'main' ? 'play' : targetView === 'mydeck' ? 'deck' : targetView;
    window.location.hash = `#${targetHash}`;
    ```
- **Line 13785**: Ranking match navigation fallback.
  - **Before**:
    ```typescript
    window.location.href = '/rank';
    ```
  - **After**:
    ```typescript
    window.location.hash = '#rank';
    ```

#### 5) `src/views/KadanRpgView.tsx`
- **Lines 317–321**: `handleSelectChapter` URL sync.
  - **Before**:
    ```typescript
    const url = new URL(window.location.href);
    url.pathname = '/main';
    url.searchParams.set('ep', String(safeEp));
    window.history.replaceState({ view: 'main' }, '', `${url.pathname}${url.search}`);
    ```
  - **After**:
    ```typescript
    window.history.replaceState({ view: 'main' }, '', `/#play?ep=${safeEp}`);
    ```
- **Lines 341–350**: `nextEvent` chapter URL update.
  - **Before**:
    ```typescript
    url.pathname = '/main';
    url.searchParams.set('ep', String(nextEvent.chapterNumber));
    ...
    window.history.replaceState({ view: 'main' }, '', `${url.pathname}${url.search}`);
    ```
  - **After**:
    ```typescript
    window.history.replaceState({ view: 'main' }, '', `/#play?ep=${nextEvent.chapterNumber}`);
    ```
- **Lines 968–975**: Header brand logo.
  - Change `href="/"` to `href="#home"`, `window.location.hash = '#home'`.

#### 6) Miscellaneous Brand and Navigational Controls
- `src/components/PageHeader.tsx:57–63`: Change `href="/"` to `href="#home"`, replace `pushState` with `window.location.hash = '#home'`.
- `src/components/reddit/RedditAdCard.tsx:23`: Change `window.location.href = '/home'` to `window.location.hash = '#home'`.
- `src/components/reddit/RedditSidebarLeft.tsx:78`: Change `window.location.href = '/' + targetView` to hash routing via `HASH_VIEW_MAP`.
- `src/components/ShareTemplateCard.tsx:87–95`: Change `href="/"` to `href="#home"`.
- `src/views/ShopView.tsx:5048–5055`: Change `href="/"` to `href="#home"`.
- `src/views/ShareView.tsx:276–283`: Change `href="/"` to `href="#home"`.
- `src/components/reddit/RedditHeader.tsx:129–135`: Change `href="/"` to `href="#home"`.
- `src/components/WikiCardDetailModal.tsx:254–262`: Change URL pathname push to `window.location.hash = `#shop?merchProductId=${encodeURIComponent(productId)}&merchCardId=${cardId}``.
- `src/hooks/useKadanRpgProgress.ts:186–215`: Check `window.location.hash.startsWith('#play')` or `#main` in addition to pathname.

---

## 4. Triple-Layer Immediate Redirect Architecture

When a user directly types or follows an external link to `/home`, `/deck`, `/play`, `/main`, `/card`, or `/shop`, the application enforces a **three-layer defense**:

```
                                DIRECT URL REQUEST
                  (e.g., https://snshero.com/deck?foo=bar)
                                     │
                                     ▼
      ┌─────────────────────────────────────────────────────────────┐
      │ LAYER 1: Dev / Preview Server HTTP 302 Redirect             │
      │ (vite.config.ts middlewares)                                │
      │ Intercepts request -> Returns 302: Location: /#deck?foo=bar │
      └──────────────────────────────┬──────────────────────────────┘
                                     │ (On static CDN/hosting)
                                     ▼
      ┌─────────────────────────────────────────────────────────────┐
      │ LAYER 2: Pre-rendered HTML Redirect Stub                   │
      │ (scripts/post-build.js generates dist/deck/index.html)     │
      │ Serves <meta http-equiv="refresh"> + inline location.replace│
      └──────────────────────────────┬──────────────────────────────┘
                                     │ (On SPA 404 / root fallback)
                                     ▼
      ┌─────────────────────────────────────────────────────────────┐
      │ LAYER 3: In-HTML Immediate Head Script                      │
      │ (index.html inline <script> in <head>)                      │
      │ Runs at parse time -> window.location.replace('/#deck' + q) │
      └─────────────────────────────────────────────────────────────┘
```

### Layer 1: Dev & Preview Server (`vite.config.ts`)
In `configureServer` (lines 117–129) and `configurePreviewServer` (lines 131–158):
```typescript
const legacyRedirects: Record<string, string> = {
  '/home': '/#home',
  '/main-lobby': '/#home',
  '/deck': '/#deck',
  '/mydeck': '/#deck',
  '/play': '/#play',
  '/main': '/#play',
  '/card': '/#card',
  '/shop': '/#shop',
};

if (legacyRedirects[normalized]) {
  _res.writeHead(302, { Location: `${legacyRedirects[normalized]}${query}` });
  _res.end();
  return;
}
```

### Layer 2: Static Post-Build HTML Stubs (`scripts/post-build.js`)
In `scripts/post-build.js` lines 199–241:
For legacy routes (`home`, `deck`, `mydeck`, `play`, `main`, `card`, `shop`), generate lightweight redirect HTML stubs instead of heavy duplicate SPA documents:
```javascript
const legacyRoutesToHash = {
  home: '#home',
  'main-lobby': '#home',
  deck: '#deck',
  mydeck: '#deck',
  play: '#play',
  main: '#play',
  card: '#card',
  shop: '#shop',
};

if (legacyRoutesToHash[route]) {
  const targetHash = legacyRoutesToHash[route];
  const redirectHtml = `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <title>눈히어로.com - 이동 중...</title>
  <meta http-equiv="refresh" content="0; url=/${targetHash}">
  <link rel="canonical" href="https://snshero.com/${targetHash}">
  <script>
    var search = window.location.search || '';
    window.location.replace('/${targetHash}' + search);
  </script>
</head>
<body style="font-family: monospace; padding: 20px; background: #fdfcfc; color: #201d1d;">
  <p>섹션으로 이동 중입니다: <a href="/${targetHash}">/${targetHash}</a></p>
</body>
</html>`;
  fs.writeFileSync(path.join(routeDir, 'index.html'), redirectHtml, 'utf8');
  fs.writeFileSync(flatHtmlPath, redirectHtml, 'utf8');
  continue;
}
```

### Layer 3: Immediate Head Script in `index.html` (and `home.html`)
Inside `<head>` prior to any CSS/JS bundles:
```html
<script>
  (function() {
    try {
      var p = (window.location.pathname || '').replace(/\/+$/, '').toLowerCase();
      var legacyRouteMap = {
        '/home': '#home',
        '/main-lobby': '#home',
        '/deck': '#deck',
        '/mydeck': '#deck',
        '/play': '#play',
        '/main': '#play',
        '/card': '#card',
        '/shop': '#shop'
      };
      if (legacyRouteMap[p]) {
        var targetHash = legacyRouteMap[p];
        var search = window.location.search || '';
        window.location.replace('/' + targetHash + search);
      }
    } catch (e) {}
  })();
</script>
```

---

## 5. Summary of Affected Files

| # | File Path | Scope of Changes |
|---|---|---|
| 1 | `src/landing/components/Header.tsx` | Line 29 (label '카드'), Lines 96-102 (`href="#play"`, `data-nav="play"`) |
| 2 | `src/landing/components/Sidebar.tsx` | Line 31 (label '카드'), Lines 139-144 (`href="#play"`, `data-nav="play"`) |
| 3 | `src/landing/components/Footer.tsx` | Lines 50-54 (`href="#play"`, `data-nav="play"`) |
| 4 | `src/landing/components/Modals.tsx` | Lines 160-166 (`href="#play"`, `data-nav="play"`) |
| 5 | `src/landing/views/HomeSection.tsx` | Lines 40-45 (`href="#play"`, `data-nav="play"`) |
| 6 | `src/landing/views/MyDeckSection.tsx` | Lines 130-135 & 397-403 (`href="#play"`, `data-nav="play"`) |
| 7 | `src/landing/index.ts` | Lines 194-200 (pathname normalization to hash), Lines 221-230 (query stripping on hashchange) |
| 8 | `src/routes.ts` | `HASH_VIEW_MAP`, `getViewPath`, `getViewFromPath` (hash priority & legacy normalization) |
| 9 | `src/App.tsx` | `getViewFromPathAndUrl`, `hashchange` listeners, URL sync effect, nav callbacks, hidden SEO links |
| 10 | `src/views/HomeView.tsx` | Lines 262-270 & 837-845 (brand logo links to `#home`) |
| 11 | `src/views/PlayGameView.tsx` | Line 13416 & 13785 (fallback navigation to hash) |
| 12 | `src/views/KadanRpgView.tsx` | Lines 317-321 & 341-350 (replaceState with `/#play?ep=...`), Lines 968-975 (logo link) |
| 13 | `src/components/PageHeader.tsx` | Lines 57-63 (logo link to `#home`) |
| 14 | `src/components/reddit/RedditAdCard.tsx` | Line 23 (navigate to `#home`) |
| 15 | `src/components/reddit/RedditSidebarLeft.tsx` | Line 78 (navigate via hash map) |
| 16 | `src/hooks/useKadanRpgProgress.ts` | Lines 186-215 (recognize `#play` and `#main` hash) |
| 17 | `vite.config.ts` | Lines 117-158 (dev/preview 302 redirects for legacy routes) |
| 18 | `scripts/post-build.js` | Lines 199-241 (generate lightweight static redirect stubs for legacy routes) |
| 19 | `index.html` & `home.html` | Head script for parse-time URL normalization |

---

## 6. Verification Method

1. **E2E Test Execution**:
   ```bash
   npx tsx tests/e2e/run_all.ts --milestone M1
   ```
   All 16 assertions across Tiers 1–4 must exit 0 with 100% PASS rate.
2. **TypeScript Compilation & Build**:
   ```bash
   npx tsc --noEmit
   npm run build
   ```
   Must pass with 0 errors.
3. **Legacy URL Redirection Verification**:
   - `curl -I http://localhost:3000/home` -> HTTP 302, `Location: /#home`
   - `curl -I http://localhost:3000/deck` -> HTTP 302, `Location: /#deck`
   - `curl -I http://localhost:3000/play` -> HTTP 302, `Location: /#play`
   - `curl -I http://localhost:3000/shop` -> HTTP 302, `Location: /#shop`
   - `curl -I http://localhost:3000/card` -> HTTP 302, `Location: /#card`
4. **Programmatic Grep Verification**:
   ```bash
   rg 'href="/home"' src/
   rg 'href="/deck"' src/
   rg 'href="/play"' src/
   ```
   Must yield 0 results in `src/landing/` and UI links.
