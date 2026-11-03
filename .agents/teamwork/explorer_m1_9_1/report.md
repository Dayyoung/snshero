# Milestone 1 Technical Blueprint: Hash Route Navigation Core & History State

- **Milestone**: M1 (Hash Route Navigation Core & History State)
- **Author**: `explorer_m1_9_1`
- **Target Files**:
  - `index.html`
  - `src/routes.ts`
  - `src/landing/types.ts`
  - `src/landing/index.ts`
  - `src/landing/components/Header.tsx`
  - `src/landing/components/Sidebar.tsx`
  - `src/landing/components/Footer.tsx`
  - `src/landing/components/Modals.tsx`
  - `src/landing/views/HomeSection.tsx`
  - `src/landing/views/MyDeckSection.tsx`
- **Verification Command**: `npx tsc --noEmit && npm run build`
- **Date**: 2026-11-02T07:55:00Z

---

## 1. Executive Summary

Milestone 1 establishes the single-page application (SPA) client-side hash navigation foundation on `index.html` for SNSHero.com.

### Problem Statement
In previous iterations, the application was split between a vanilla TypeScript landing engine on `index.html` and a React 19 app on `home.html`. Internal links across the landing interface (`Header.tsx`, `Sidebar.tsx`, `HomeSection.tsx`, `MyDeckSection.tsx`, `Footer.tsx`, and `Modals.tsx`) pointed directly to the standalone route `/home`, causing full page reloads and navigating away from `index.html`. Furthermore, if a user landed on `https://snshero.com/` with an empty hash or `#`, the URL was not normalized, and legacy standalone routes (`/home`, `/deck`, `/play`, `/main`, `/card`, `/shop`) were not intercepted or redirected.

### Objective
Provide an exact, production-ready, function-by-function implementation blueprint for the Worker agent to:
1. Establish reliable client-side hash navigation (`#home`, `#deck`, `#play`, `#card`, `#shop`) on `index.html`.
2. Handle initial load hash parsing, defaulting to `#home` if the hash is empty or `#`, and normalizing the URL in-place using `history.replaceState`.
3. Listen to both `hashchange` and `popstate` events, smoothly updating active sections without full page reloads.
4. Guarantee zero infinite render loops through reentrancy locks (`isProgrammaticRouting`) and state-comparison guards.
5. Eliminate all remaining `href="/home"` links across all navigation headers, drawers, buttons, and footers, migrating them to clean `#play` or `#home` hash actions.

---

## 2. In-Depth Current State & Gap Audit

| Location | Observed Implementation | Gap / Failure Mode | Required Worker Action |
|---|---|---|---|
| `index.html:723–726` | Mounts `<script type="module" src="/src/landing/index.ts"></script>` into `<div id="landing-root"></div>`. No pre-bundle URL normalization. | When user enters `https://snshero.com/` or legacy `/deck`, URL remains unnormalized until module executes. If server rewrites `/deck` to `index.html`, path is unhandled. | Add an inline `<script>` in `<head>` that immediately normalizes empty hash/`#` to `#home` and redirects legacy `/home`, `/deck`, `/play`, etc. to `/#<hash>`. |
| `index.html:780–808` | Hidden SEO navigation links point to `https://snshero.com/deck`, `/play`, `/shop`. | Crawlers and search engines index legacy standalone paths. | Update links to `/#deck`, `/#play`, `/#shop`. |
| `src/routes.ts:12–65` | `VIEW_ROUTES` maps views to pathname strings: `home: '/home'`, `mydeck: '/deck'`, `play: '/play'`, `shop: '/shop'`. No entry for `card`. | Routes resolve to pathname URLs instead of hash anchors; lacks `#card` definition. | Update paths to `#home`, `#deck`, `#play`, `#shop`, `#card`, and add aliases for each. |
| `src/routes.ts:422–425` | `getViewPath(view)` returns `route.path` (e.g. `'/home'`). | Ignores hash routes. | Map views to canonical `#home`, `#deck`, `#play`, `#card`, `#shop`. |
| `src/routes.ts:430–506` | `getViewFromPath(pathname, search)` inspects only pathname and query parameters. | Ignores `window.location.hash`. | Update `getViewFromPath` to parse `hash` first, then legacy pathnames. |
| `src/landing/types.ts:10–11` | `TOP_NAV_ITEMS` and `SIDE_NAV_ITEMS` include `'미션'`. | Violates prompt requirement: *"카드 (구 미션): 명칭을 '미션'에서 '카드'로 변경한다."* | Change `'미션'` to `'카드'`. |
| `src/landing/index.ts:57–89` | `renderApp()` blows away the entire root element via `root.innerHTML = ...`. | Re-rendering the whole page causes DOM thrashing, destroys header/sidebar focus, and causes scroll jitter. | Implement selective slot updating: only replace `#landing-main-slot` and active header/sidebar styles when shell is already mounted. |
| `src/landing/index.ts:91–106` | `handleEventDelegation` updates `state.activeView = nav; window.location.hash = nav; renderApp();` without calling `event.preventDefault()`. | Clicking an `<a>` tag executes default browser jump and triggers redundant `hashchange` events without reentrancy protection. | Add `event.preventDefault()` on navigation elements, route through centralized `navigateTo()` controller with `isProgrammaticRouting` lock. |
| `src/landing/index.ts:193–230` | `mountLanding()` parses hash with `window.location.hash.replace('#', '')`. Does not handle `#`, `#/`, query params, or legacy pathnames. | Fails on `#`, `#/deck`, `#play?ep=1`, or when landing on `/home`. Does not replace state with `#home`. | Implement robust `parseRoute()` and replace URL with `#home` via `history.replaceState`. |
| `Header.tsx:97` | `<a href="/home">게임 시작 (/home) →</a>` | Full page reload navigating away from `index.html`. | Change to `<a href="#play" data-nav="play">게임 시작 →</a>`. |
| `Sidebar.tsx:140` | `<a href="/home">게임 시작하기 (/home) →</a>` | Full page reload navigating away from `index.html`. | Change to `<a href="#play" data-nav="play">게임 시작하기 →</a>`. |
| `HomeSection.tsx:41` | `<a href="/home">웹게임 즉시 시작 (/home) →</a>` | Full page reload navigating away from `index.html`. | Change to `<a href="#play" data-nav="play">웹게임 즉시 시작 →</a>`. |
| `MyDeckSection.tsx:131, 398` | `<a href="/home">웹게임 출격 (/home) →</a>` | Full page reload navigating away from `index.html`. | Change to `<a href="#play" data-nav="play">웹게임 출격 →</a>`. |
| `Footer.tsx:50` | `<a href="/home"><span>[→] 원클릭 웹게임 바로가기</span></a>` | Full page reload navigating away from `index.html`. | Change to `<a href="#play" data-nav="play"><span>[→] 원클릭 웹게임 바로가기</span></a>`. |
| `Modals.tsx:161` | `<a href="/home">게스트로 게임 시작하기 (/home) →</a>` | Full page reload navigating away from `index.html`. | Change to `<a href="#play" data-nav="play">게스트로 게임 시작하기 →</a>`. |

---

## 3. The 4 Core Architectural Invariants

### Invariant 1: Reliable Client-Side Hash Navigation (`#home`, `#deck`, `#play`, `#card`, `#shop`)
- All user-accessible sections must correspond to a canonical hash:
  - `#home` -> `HomeSection`
  - `#deck` -> `MyDeckSection`
  - `#play` -> `PlaySection`
  - `#card` -> `CardSection`
  - `#shop` -> `ShopSection`
- Aliases must be resolved transparently:
  - `mydeck` -> `deck`
  - `main` or `battle` -> `play`
  - `mission` or `missions` or `cards` -> `card`
  - `store` -> `shop`
- All interactive links across the landing interface must use `data-nav="<key>"` and `href="#<key>"`.

### Invariant 2: Initial Load Hash Parsing & In-Place Normalization
- When a user accesses `https://snshero.com/`, `https://snshero.com/#`, or `https://snshero.com/#/`:
  - `parseRoute()` must evaluate the view as `'home'`.
  - The URL must be normalized in-place to `/#home` using `window.history.replaceState({ view: 'home' }, '', '#home')`.
  - **Critical Rule**: Do NOT use `window.location.hash = 'home'` on initial load, because setting `.hash` pushes an extra entry onto the browser's history stack. If pushed, clicking the browser's "Back" button would take the user to the blank URL `https://snshero.com/`, which would re-trigger the initial load and push `#home` again, trapping the user. `replaceState` avoids this trap completely.

### Invariant 3: Smooth Section Switching Without Full Page Reloads
- A single full layout render (`renderApp()`) is performed on initial boot to establish:
  - Header slot: `<div id="landing-header-slot">`
  - Sidebar slot: `<div id="landing-sidebar-slot">`
  - Modals slot: `<div id="landing-modals-slot">`
  - Main slot: `<main id="landing-main-slot">`
  - Footer slot: `<div id="landing-footer-slot">`
- On subsequent hash transitions:
  - Only update `landing-header-slot` (to toggle active nav button style).
  - Only update `landing-main-slot` (with the new section's HTML).
  - Close the sidebar drawer if open.
  - Reset scroll position via `window.scrollTo({ top: 0, behavior: 'instant' })`.
  - Execute cleanup functions (e.g. `stopPlayTts()` when navigating away from `'play'`).

### Invariant 4: Zero Infinite Render Loops
- Infinite loops occur when a hash update triggers a `hashchange` event, which re-triggers a navigation function, which re-sets the hash.
- **Three-tier defense**:
  1. **State Guard**: If `state.activeView === targetView` and `window.location.hash === '#' + targetView`, `navigateTo()` exits immediately.
  2. **Reentrancy Lock**: A module-scoped boolean `isProgrammaticRouting` is set to `true` immediately before mutating `window.location.hash` or `history.pushState()`, and cleared asynchronously via `setTimeout(() => { isProgrammaticRouting = false; }, 0)`.
  3. **Listener Guard**: The `hashchange` listener checks `if (isProgrammaticRouting) return;`. If the hash change was initiated by code, the event listener ignores it.

---

## 4. File-by-File Implementation Blueprint for Worker

### 4.1. `index.html`

#### Location
`/Users/dayyoung/project/snshero/index.html`

#### Exact Modifications
1. **Add early route normalizer script** inside `<head>` right before `<script type="module" src="/src/landing/index.ts"></script>`:
```html
    <!-- Early Client-Side Hash Normalizer & Legacy Route Interceptor -->
    <script>
      (function() {
        try {
          var pathname = window.location.pathname.replace(/\/$/, '').toLowerCase() || '/';
          var hash = window.location.hash;
          var legacyMap = {
            '/home': '#home',
            '/main-lobby': '#home',
            '/deck': '#deck',
            '/mydeck': '#deck',
            '/play': '#play',
            '/main': '#play',
            '/card': '#card',
            '/cards': '#card',
            '/mission': '#card',
            '/missions': '#card',
            '/shop': '#shop'
          };
          if (legacyMap[pathname] && (!hash || hash === '#' || hash === '#/')) {
            window.location.replace('/' + legacyMap[pathname]);
          } else if (!hash || hash === '#' || hash === '#/') {
            if (window.history && window.history.replaceState) {
              window.history.replaceState({ view: 'home' }, '', '#home');
            }
          }
        } catch (e) {
          console.warn('[RouteNormalizer] Early normalization warning:', e);
        }
      })();
    </script>
    <script type="module" src="/src/landing/index.ts"></script>
```

2. **Update crawler fallback links (Lines 780–808)**:
Replace `/deck`, `/play`, `/shop` with `/#deck`, `/#play`, `/#shop`.

---

### 4.2. `src/routes.ts`

#### Location
`/Users/dayyoung/project/snshero/src/routes.ts`

#### Exact Modifications
1. **Update `VIEW_ROUTES` core entries**:
```typescript
  home: {
    path: '#home',
    aliases: ['/home', '/main-lobby', '#home', '#main-lobby'],
    titleKo: '눈히어로.com - 카단의 여정 (원클릭 AI 웹 카드 게임)',
    titleEn: "SNSHero.com - Kadan's Journey (One-Click AI Web Card Game)",
    descriptionKo: '복잡한 가입 없이 클릭 한 번으로 시작하는 AI 웹 카드 게임 눈히어로.com - 카단의 여정 로비입니다.',
    descriptionEn: "Start instantly with one click at SNSHero.com - Kadan's Journey. Collect 110+ hero cards with AI battles.",
  },
  main: {
    path: '#play',
    aliases: ['/main', '#main', '#play'],
    titleKo: '눈히어로.com - 카단의 여정 - 메인 RPG',
    titleEn: "SNSHero.com - Kadan's Journey - Main RPG",
    descriptionKo: '카단이 소설 속 지도를 자동으로 이동하며 대화, 카드 전투, 보상 획득을 진행하는 눈히어로.com - 카단의 여정 메인 RPG 모드입니다.',
    descriptionEn: "Explore the map, battle AI enemies, and experience the epic RPG storyline of SNSHero.com - Kadan's Journey.",
  },
  mydeck: {
    path: '#deck',
    aliases: ['/deck', '/mydeck', '#deck', '#mydeck'],
    titleKo: '마이덱 (My Deck) - 눈히어로.com 카드 컬렉션',
    titleEn: 'My Deck - SNSHero.com Card Collection',
    descriptionKo: '수집한 영웅 카드 덱을 구성하고 강력한 장비를 장착하여 나만의 최강 시너지 조합을 설계하세요.',
    descriptionEn: 'Manage your card deck, equip items, and optimize your battle synergy on SNSHero.com.',
  },
  play: {
    path: '#play',
    aliases: ['/play', '#play'],
    titleKo: '배틀 대전 (Play Battle) - 눈히어로.com 실시간 카드 배틀',
    titleEn: 'Battle Arena (Play) - SNSHero.com Real-Time Card Battle',
    descriptionKo: '인공지능(AI) 라이벌과 대적하여 실시간 자동 전투를 벌이고 랭킹 포인트와 명예를 획득하세요.',
    descriptionEn: 'Battle AI rivals in real-time card matches and earn ranking points on SNSHero.com.',
  },
  card: {
    path: '#card',
    aliases: ['/card', '/cards', '/mission', '/missions', '#card', '#cards', '#mission', '#missions'],
    titleKo: '카드 도감 및 육성 (Card Nurturing) - 눈히어로.com',
    titleEn: 'Card Collection & Nurturing - SNSHero.com',
    descriptionKo: '보유한 카드를 확인하고 카드 대결을 통해 획득한 경험치로 100레벨까지 육성 및 스탯을 강화하세요.',
    descriptionEn: 'View owned cards, level up to Lv 100 via battle victory EXP, and allocate stat points.',
  },
  shop: {
    path: '#shop',
    aliases: ['/shop', '#shop'],
    titleKo: '카드 상점 (Shop) - 눈히어로.com 카드 및 스킨 뽑기',
    titleEn: 'Shop - SNSHero.com Card & Skin Gacha',
    descriptionKo: 'SNS 포인트를 사용하여 등급별 카드를 소환하고 컬렉션을 완성하세요.',
    descriptionEn: 'Summon cards and skins with SNS points or crypto on SNSHero.com.',
  },
```

2. **Update `getViewPath(view: ViewType): string`**:
```typescript
export function getViewPath(view: ViewType): string {
  const hashRoutes: Record<string, string> = {
    home: '#home',
    mydeck: '#deck',
    deck: '#deck',
    play: '#play',
    main: '#play',
    card: '#card',
    shop: '#shop',
  };
  if (hashRoutes[view as string]) {
    return hashRoutes[view as string];
  }
  const route = VIEW_ROUTES[view];
  return route ? route.path : '#home';
}
```

3. **Update `getViewFromPath(pathname: string, search = '', hash = ''): ViewType`**:
```typescript
export function getViewFromPath(pathname: string, search = '', hash = ''): ViewType {
  // 1. URL 해시(#) 파싱 우선 처리
  const rawHash = (hash || (typeof window !== 'undefined' ? window.location.hash : ''))
    .replace(/^#\/?/, '')
    .split('?')[0]
    .replace(/\/$/, '')
    .toLowerCase();

  if (rawHash) {
    if (rawHash === 'home' || rawHash === 'main-lobby') return 'home';
    if (rawHash === 'deck' || rawHash === 'mydeck') return 'mydeck';
    if (rawHash === 'play' || rawHash === 'main' || rawHash === 'battle') return 'play';
    if (rawHash === 'card' || rawHash === 'cards' || rawHash === 'mission' || rawHash === 'missions') return 'card' as ViewType;
    if (rawHash === 'shop' || rawHash === 'store') return 'shop';
  }

  const params = new URLSearchParams(search);
  const queryView = params.get('view');
  
  if (queryView) {
    if (queryView in VIEW_ROUTES) return queryView as ViewType;
    if (queryView === 'makegrid' || queryView === 'tool/grid') return 'tool-makegrid';
    if (queryView === 'checkgrid' || queryView === 'tool/checkgrid') return 'tool-checkgrid';
  }

  // 2. 레거시 URL 경로 정규화 매핑
  const cleanPath = pathname.replace(/\/$/, '').toLowerCase() || '/';

  if (cleanPath === '/home' || cleanPath === '/main-lobby') return 'home';
  if (cleanPath === '/deck' || cleanPath === '/mydeck') return 'mydeck';
  if (cleanPath === '/play' || cleanPath === '/main') return 'play';
  if (cleanPath === '/card' || cleanPath === '/cards' || cleanPath === '/mission' || cleanPath === '/missions') return 'card' as ViewType;
  if (cleanPath === '/shop') return 'shop';

  // 특수 접두사 라우팅 (novel, movie, reddit 등 기존 로직 보존)
  if (cleanPath.startsWith('/creator/')) return 'creator';
  if (cleanPath.startsWith('/novel/s1-') || cleanPath.startsWith('/book/')) return 'novel';
  if (cleanPath.startsWith('/movie/') || cleanPath.startsWith('/animation/')) return 'movie';
  if (cleanPath.startsWith('/cinema/') || cleanPath.startsWith('/live-cinema/')) return 'cinema';
  if (cleanPath === '/script' || cleanPath.startsWith('/script/')) return 'script';
  if (cleanPath.startsWith('/main/')) return 'main';
  if (cleanPath.startsWith('/gotest')) return 'home';
  if (cleanPath === '/gwent' || cleanPath.startsWith('/gwent/')) return 'gwent';

  // Aliases 검색
  for (const [v, meta] of Object.entries(VIEW_ROUTES) as [ViewType, RouteMeta][]) {
    if (meta.path.toLowerCase() === cleanPath) return v;
    if (meta.aliases) {
      for (const alias of meta.aliases) {
        if (alias.toLowerCase() === cleanPath) return v;
      }
    }
  }

  return 'home';
}
```

---

### 4.3. `src/landing/types.ts`

#### Location
`/Users/dayyoung/project/snshero/src/landing/types.ts`

#### Exact Modifications
```typescript
// Replace '미션' with '카드'
export const TOP_NAV_ITEMS = ['홈', '마이덱', '플레이', '카드', '상점', '쇼핑몰'] as const;
export const SIDE_NAV_ITEMS = ['로그인', '홈', '마이덱', '플레이', '카드', '상점', '쇼핑몰', '커뮤니티'] as const;

export interface RouteOptions {
  replace?: boolean;
  updateHash?: boolean;
}
```

---

### 4.4. `src/landing/index.ts`

#### Location
`/Users/dayyoung/project/snshero/src/landing/index.ts`

#### Full Function-by-Function Implementation
```typescript
/**
 * src/landing/index.ts
 *
 * Standalone static landing page orchestrator for SNSHero.com.
 * Dual-entry MPA architecture: Zero React runtime, zero server dependencies.
 * Full client-side hash routing (#home, #deck, #play, #card, #shop).
 * OpenCode Terminal-Flat design, 44px+ touch targets, responsive 360px ~ 3840px layout.
 * Enforces Zero-Onboarding-Popup guard on initial visit.
 */

import './styles/landing.css';
import { ViewKey, ModalKey, RouteOptions } from './types';
import { renderHeader } from './components/Header';
import { renderSidebar } from './components/Sidebar';
import { renderModals } from './components/Modals';
import { renderFooter } from './components/Footer';
import { renderHomeSection } from './views/HomeSection';
import { renderMyDeckSection } from './views/MyDeckSection';
import { renderPlaySection, handlePlayAction, stopPlayTts } from './views/PlaySection';
import { renderCardSection, setSelectedCardId, setElementFilter, setOwnedFilter } from './views/CardSection';
import { renderShopSection, executeShopPurchase, setUserCoins, getUserCoins } from './views/ShopSection';
import { cardNurtureStore } from './services/cardNurtureStore';

interface LandingState {
  activeView: ViewKey;
  activeModal: ModalKey;
  isSidebarOpen: boolean;
  selectedDeckCardId?: number;
}

export const VALID_VIEWS: readonly ViewKey[] = ['home', 'deck', 'play', 'card', 'shop'] as const;

export const HASH_VIEW_MAP: Record<string, ViewKey> = {
  home: 'home',
  'main-lobby': 'home',
  deck: 'deck',
  mydeck: 'deck',
  play: 'play',
  main: 'play',
  battle: 'play',
  card: 'card',
  cards: 'card',
  mission: 'card',
  missions: 'card',
  companion: 'card',
  shop: 'shop',
  store: 'shop',
};

export const LEGACY_PATH_MAP: Record<string, ViewKey> = {
  '/home': 'home',
  '/main-lobby': 'home',
  '/deck': 'deck',
  '/mydeck': 'deck',
  '/play': 'play',
  '/main': 'play',
  '/card': 'card',
  '/cards': 'card',
  '/mission': 'card',
  '/missions': 'card',
  '/shop': 'shop',
  '/store': 'shop',
};

const state: LandingState = {
  activeView: 'home',
  activeModal: null,
  isSidebarOpen: false,
  selectedDeckCardId: 1,
};

let isProgrammaticRouting = false;

/**
 * Parses the current URL hash or legacy pathname into a valid ViewKey.
 * Defaults to 'home' if empty or unrecognized.
 */
export function parseRoute(hashString?: string, pathnameString?: string): ViewKey {
  const rawHash = (hashString !== undefined ? hashString : (typeof window !== 'undefined' ? window.location.hash : ''))
    .replace(/^#\/?/, '')
    .split('?')[0]
    .replace(/\/$/, '')
    .toLowerCase();

  if (rawHash && rawHash in HASH_VIEW_MAP) {
    return HASH_VIEW_MAP[rawHash];
  }

  const cleanPath = (pathnameString !== undefined ? pathnameString : (typeof window !== 'undefined' ? window.location.pathname : ''))
    .replace(/\/$/, '')
    .toLowerCase();

  if (cleanPath && cleanPath in LEGACY_PATH_MAP) {
    return LEGACY_PATH_MAP[cleanPath];
  }

  return 'home';
}

function renderActiveViewContent(view: ViewKey): string {
  if (view === 'home') return renderHomeSection();
  if (view === 'deck') return renderMyDeckSection(state.selectedDeckCardId || 1);
  if (view === 'play') return renderPlaySection();
  if (view === 'card') return renderCardSection();
  if (view === 'shop') return renderShopSection();
  return renderHomeSection();
}

/**
 * Renders the entire application DOM tree.
 */
export function renderApp(): void {
  const root = document.getElementById('landing-root') || document.getElementById('root');
  if (!root) return;

  root.innerHTML = `
    <div class="w-full min-h-screen overflow-x-hidden flex flex-col bg-[#fdfcfc] text-[#201d1d] font-mono select-none">
      <!-- Top Navigation -->
      <div id="landing-header-slot" class="w-full">
        ${renderHeader(state.activeView)}
      </div>

      <!-- Side Navigation -->
      <div id="landing-sidebar-slot">
        ${renderSidebar(state.isSidebarOpen, state.activeView)}
      </div>

      <!-- Secondary Action Modals -->
      <div id="landing-modals-slot">
        ${renderModals(state.activeModal)}
      </div>

      <!-- Main Content Slot -->
      <main id="landing-main-slot" class="w-full flex-1 flex flex-col">
        ${renderActiveViewContent(state.activeView)}
      </main>

      <!-- Terminal Footer -->
      <div id="landing-footer-slot" class="w-full">
        ${renderFooter()}
      </div>
    </div>
  `;
}

/**
 * Smoothly updates the active section and active header/sidebar styles
 * without full page reloads or DOM destruction.
 */
export function renderSectionContent(view: ViewKey): void {
  const mainSlot = document.getElementById('landing-main-slot');
  const headerSlot = document.getElementById('landing-header-slot');
  const sidebarSlot = document.getElementById('landing-sidebar-slot');

  if (mainSlot && headerSlot) {
    headerSlot.innerHTML = renderHeader(view);
    if (sidebarSlot) {
      sidebarSlot.innerHTML = renderSidebar(state.isSidebarOpen, view);
    }
    mainSlot.innerHTML = renderActiveViewContent(view);
    window.scrollTo({ top: 0, behavior: 'instant' });
  } else {
    renderApp();
  }
}

/**
 * Centralized navigation controller with reentrancy lock.
 */
export function navigateTo(targetView: ViewKey, options?: RouteOptions): void {
  const resolvedView: ViewKey = VALID_VIEWS.includes(targetView) ? targetView : 'home';
  const targetHash = `#${resolvedView}`;

  // State Comparison Guard: do not re-render if already active and hash matches
  if (state.activeView === resolvedView && window.location.hash === targetHash) {
    return;
  }

  // Cleanup side effects of previous view
  if (state.activeView === 'play' && resolvedView !== 'play') {
    stopPlayTts();
  }

  state.activeView = resolvedView;
  state.isSidebarOpen = false;
  state.activeModal = null;

  // URL Hash Synchronization with Reentrancy Lock
  if (options?.updateHash !== false && window.location.hash !== targetHash) {
    isProgrammaticRouting = true;
    try {
      if (options?.replace) {
        window.history.replaceState({ view: resolvedView }, '', targetHash);
      } else {
        window.location.hash = resolvedView;
      }
    } finally {
      setTimeout(() => {
        isProgrammaticRouting = false;
      }, 0);
    }
  }

  renderSectionContent(resolvedView);

  // Dispatch custom event for external listeners (e.g. idle timer, adsense)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('snshero_hash_route_changed', { detail: { view: resolvedView } }));
  }
}

export function handleEventDelegation(event: Event): void {
  const target = (event.target as HTMLElement).closest('[data-nav], [data-modal], [data-action], a[href^="#"], a[href="/home"]');
  if (!target) return;

  const nav = target.getAttribute('data-nav') as ViewKey | null;
  const modal = target.getAttribute('data-modal') as ModalKey | null;
  const action = target.getAttribute('data-action');
  const href = target.getAttribute('href');

  // Handle direct data-nav or hash anchors
  if (nav && VALID_VIEWS.includes(nav)) {
    event.preventDefault();
    navigateTo(nav);
    return;
  }

  // Intercept legacy href="/home" links
  if (href === '/home') {
    event.preventDefault();
    navigateTo('home');
    return;
  }

  // Intercept internal hash anchor clicks
  if (href && href.startsWith('#')) {
    const rawTarget = href.replace(/^#\/?/, '').toLowerCase();
    const mapped = HASH_VIEW_MAP[rawTarget];
    if (mapped) {
      event.preventDefault();
      navigateTo(mapped);
      return;
    }
  }

  if (modal) {
    if (state.activeView === 'play') {
      stopPlayTts();
    }
    state.activeModal = modal;
    state.isSidebarOpen = false;
    renderApp();
  } else if (action === 'toggle-sidebar') {
    state.isSidebarOpen = !state.isSidebarOpen;
    renderApp();
  } else if (action === 'close-sidebar') {
    state.isSidebarOpen = false;
    renderApp();
  } else if (action === 'close-modal') {
    state.activeModal = null;
    renderApp();
  } else if (action === 'select-deck-card') {
    const cardIdStr = target.getAttribute('data-card-id');
    if (cardIdStr) {
      state.selectedDeckCardId = parseInt(cardIdStr, 10);
      renderApp();
    }
  } else if (action && action.startsWith('play-')) {
    handlePlayAction(action, target as HTMLElement);
    renderApp();
  } else if (action === 'select-card') {
    const cardId = Number(target.getAttribute('data-card-id'));
    if (cardId) {
      setSelectedCardId(cardId);
      renderApp();
    }
  } else if (action === 'close-card-inspector') {
    setSelectedCardId(null);
    renderApp();
  } else if (action === 'nurture-card') {
    const cardId = Number(target.getAttribute('data-card-id'));
    const expGain = Number(target.getAttribute('data-exp') || '50');
    if (cardId) {
      cardNurtureStore.nurtureCard(cardId, expGain);
      renderApp();
    }
  } else if (action === 'allocate-stat') {
    const cardId = Number(target.getAttribute('data-card-id'));
    const direction = target.getAttribute('data-direction') as 'top' | 'right' | 'bottom' | 'left';
    if (cardId && direction) {
      cardNurtureStore.allocateStat(cardId, direction);
      renderApp();
    }
  } else if (action === 'filter-card-element') {
    const el = target.getAttribute('data-element') || 'all';
    setElementFilter(el);
    renderApp();
  } else if (action === 'filter-card-owned') {
    const owned = target.getAttribute('data-filter') as 'all' | 'owned' | 'unowned';
    setOwnedFilter(owned || 'all');
    renderApp();
  } else if (action === 'buy-shop-item') {
    const itemId = target.getAttribute('data-item-id');
    if (itemId) {
      const res = executeShopPurchase(itemId);
      if (!res.success) {
        alert(res.message);
      }
      renderApp();
    }
  } else if (action === 'free-charge-coin') {
    const cur = getUserCoins();
    setUserCoins(cur + 1000);
    renderApp();
  }
}

export function handleGlobalKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    if (state.activeModal) {
      state.activeModal = null;
      renderApp();
    } else if (state.isSidebarOpen) {
      state.isSidebarOpen = false;
      renderApp();
    } else if (state.activeView === 'play') {
      stopPlayTts();
    }
  }
}

export function mountLanding(): void {
  // 1. Initial route resolution
  const initialView = parseRoute();
  state.activeView = initialView;

  // 2. Normalize initial URL to `#${initialView}` without creating an extra history frame
  const targetHash = `#${initialView}`;
  if (window.location.hash !== targetHash) {
    try {
      window.history.replaceState({ view: initialView }, '', targetHash);
    } catch {
      window.location.hash = initialView;
    }
  }

  // 3. Register Event Listeners
  document.addEventListener('click', handleEventDelegation);
  document.addEventListener('change', (event: Event) => {
    const target = event.target as HTMLElement;
    const action = target?.getAttribute('data-action');
    if (action && action.startsWith('play-')) {
      handlePlayAction(action, target);
      renderApp();
    }
  });
  document.addEventListener('input', (event: Event) => {
    const target = event.target as HTMLElement;
    const action = target?.getAttribute('data-action');
    if (action && action === 'play-scrub-scene') {
      handlePlayAction(action, target);
      renderApp();
    }
  });

  window.addEventListener('keydown', handleGlobalKeydown);

  // 4. hashchange Listener (handles user manual hash edit or direct # links)
  window.addEventListener('hashchange', () => {
    if (isProgrammaticRouting) return;
    const parsedView = parseRoute();
    if (parsedView !== state.activeView) {
      navigateTo(parsedView, { updateHash: false });
    }
  });

  // 5. popstate Listener (handles browser Back / Forward buttons)
  window.addEventListener('popstate', (event: PopStateEvent) => {
    if (isProgrammaticRouting) return;
    const stateView = event.state?.view as ViewKey | undefined;
    const targetView = stateView && VALID_VIEWS.includes(stateView) ? stateView : parseRoute();
    if (targetView !== state.activeView) {
      navigateTo(targetView, { updateHash: false });
    }
  });

  // 6. Custom store events
  if (typeof window !== 'undefined') {
    window.addEventListener('snshero_card_nurture_updated', () => {
      renderApp();
    });
    window.addEventListener('snshero_sns_updated', () => {
      renderApp();
    });
  }

  // 7. Initial render
  renderApp();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountLanding);
} else {
  mountLanding();
}
```

---

### 4.5. `Header.tsx`, `Sidebar.tsx`, `Footer.tsx` & View Files

1. **`src/landing/components/Header.tsx`**:
   - Change `TOP_NAV_DEFS[3]` label from `'미션'` to `'카드'`:
     ```typescript
     { key: 'card', label: '카드' }
     ```
   - Change Line 96–102 (Right Action button):
     ```html
     <a
       href="#play"
       data-nav="play"
       class="px-4 py-2 bg-[#201d1d] text-[#fdfcfc] text-xs font-bold rounded-sm hover:opacity-90 transition-opacity min-h-[44px] inline-flex items-center justify-center no-underline"
       aria-label="플레이 게임 섹션으로 이동"
     >
       게임 시작 →
     </a>
     ```

2. **`src/landing/components/Sidebar.tsx`**:
   - Change `SIDE_NAV_DEFS[4]` label from `'미션'` to `'카드'`:
     ```typescript
     { key: 'card', label: '카드', icon: '📜' }
     ```
   - Change Line 140 (Drawer footer button):
     ```html
     <a
       href="#play"
       data-nav="play"
       class="block w-full py-3 bg-[#201d1d] text-[#fdfcfc] text-center text-xs font-bold rounded-sm min-h-[44px] leading-[20px] hover:opacity-90 transition-opacity no-underline flex items-center justify-center"
     >
       게임 시작하기 →
     </a>
     ```

3. **`src/landing/components/Footer.tsx`**:
   - Change Line 50:
     ```html
     <a
       href="#play"
       data-nav="play"
       class="min-h-[44px] flex items-center no-underline text-[#201d1d] font-bold hover:underline"
     >
       <span>[→] 원클릭 웹게임 바로가기</span>
     </a>
     ```

4. **`src/landing/views/HomeSection.tsx`**:
   - Change Line 40–45:
     ```html
     <a
       href="#play"
       data-nav="play"
       class="px-6 py-3 bg-[#201d1d] text-[#fdfcfc] text-sm font-bold rounded-sm hover:opacity-90 transition-opacity min-h-[44px] inline-flex items-center justify-center no-underline shadow-none"
     >
       웹게임 즉시 시작 →
     </a>
     ```

5. **`src/landing/views/MyDeckSection.tsx`**:
   - Change Line 130–135:
     ```html
     <a
       href="#play"
       data-nav="play"
       class="px-4 py-2.5 bg-[#f1eeee] text-[#201d1d] border border-[rgba(15,0,0,0.12)] text-xs font-bold rounded-sm hover:bg-[#e8e5e5] transition-colors min-h-[44px] inline-flex items-center justify-center no-underline"
     >
       웹게임 출격 →
     </a>
     ```
   - Change Line 397–402:
     ```html
     <a
       href="#play"
       data-nav="play"
       class="px-5 py-3 bg-[#f1eeee] text-[#201d1d] border border-[rgba(15,0,0,0.12)] text-xs font-bold rounded-sm hover:bg-[#e8e5e5] transition-colors min-h-[44px] inline-flex items-center justify-center no-underline"
     >
       실전 배틀 출격
     </a>
     ```

6. **`src/landing/components/Modals.tsx`**:
   - Change Line 161–166:
     ```html
     <a
       href="#play"
       data-nav="play"
       class="w-full py-3 bg-[#201d1d] text-[#fdfcfc] text-center text-xs font-bold rounded-sm min-h-[44px] flex items-center justify-center hover:opacity-90 transition-opacity no-underline"
     >
       게스트로 게임 시작하기 →
     </a>
     ```

---

## 5. Verification & Test Suite

### 5.1. Compilation and Build Check
```bash
npx tsc --noEmit
npm run build
```
Expected output: Exit code 0, 0 TypeScript errors, bundle generated in `dist/`.

### 5.2. Functional Hash Navigation Matrix
| Test Case | Initial Action | Expected Result | Verification Check |
|---|---|---|---|
| TC-M1-01 | Open `http://localhost:3000/` | Hash automatically normalized to `http://localhost:3000/#home` | `window.location.hash === '#home'`, HomeSection active |
| TC-M1-02 | Open `http://localhost:3000/#` | Hash automatically normalized to `http://localhost:3000/#home` | `window.location.hash === '#home'`, HomeSection active |
| TC-M1-03 | Open `http://localhost:3000/#deck` | Directly mounts MyDeckSection | `state.activeView === 'deck'`, MyDeckSection rendered |
| TC-M1-04 | Open `http://localhost:3000/#play` | Directly mounts PlaySection | `state.activeView === 'play'`, PlaySection rendered |
| TC-M1-05 | Open `http://localhost:3000/#card` | Directly mounts CardSection | `state.activeView === 'card'`, CardSection rendered |
| TC-M1-06 | Open `http://localhost:3000/#shop` | Directly mounts ShopSection | `state.activeView === 'shop'`, ShopSection rendered |
| TC-M1-07 | Click Header `마이덱` button | Hash changes to `#deck`, MyDeckSection loads without page reload | Zero page refresh, URL is `/#deck` |
| TC-M1-08 | Click browser "Back" button | Smoothly returns to previous section | `popstate` triggers `navigateTo`, correct section renders |
| TC-M1-09 | Click browser "Forward" button | Smoothly advances to forward section | `popstate` triggers `navigateTo`, correct section renders |
| TC-M1-10 | Open `http://localhost:3000/#invalid_route` | Gracefully defaults to `#home` | `state.activeView === 'home'`, zero crashes |
| TC-M1-11 | Grep for `href="/home"` in `src/landing/` | Exactly 0 matches found | `grep -rn 'href="/home"' src/landing/` returns 0 results |

---

## 6. Worker Execution Checklist

- [ ] 1. Edit `index.html`: Add `<head>` route normalizer script and update SEO links.
- [ ] 2. Edit `src/routes.ts`: Update `VIEW_ROUTES`, `getViewPath`, `getViewFromPath`, and add `card` route.
- [ ] 3. Edit `src/landing/types.ts`: Change `'미션'` to `'카드'`, export `RouteOptions`.
- [ ] 4. Edit `src/landing/index.ts`: Implement `parseRoute`, `navigateTo`, `renderSectionContent`, reentrancy lock, `popstate`/`hashchange` listeners.
- [ ] 5. Edit `Header.tsx`: Update `'카드'` label and change `/home` to `#play` (`data-nav="play"`).
- [ ] 6. Edit `Sidebar.tsx`: Update `'카드'` label and change `/home` to `#play` (`data-nav="play"`).
- [ ] 7. Edit `Footer.tsx`: Change `/home` link to `#play` (`data-nav="play"`).
- [ ] 8. Edit `HomeSection.tsx`, `MyDeckSection.tsx`, `Modals.tsx`: Change `/home` links to `#play` (`data-nav="play"`).
- [ ] 9. Run `npx tsc --noEmit` and verify 0 errors.
- [ ] 10. Run `npm run build` and verify successful production bundling.
