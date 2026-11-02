# Project: SNSHero Independent Static Landing & /home Decoupling

## Architecture
- **Dual-Entry Architecture (Vite Multi-Page Application)**:
  - Root entry (`index.html`): Ultra-lightweight standalone static landing web service loading `src/landing/index.ts`. Zero heavy runtime dependencies (no React 19 / Three.js / TensorFlow / Motion in initial bundle). Runs completely standalone on any static web host or local file system.
  - Rich Game SPA entry (`home.html`): Dedicated entry point loading `src/main.tsx` for the full interactive card battle game.
  - Bundler configuration (`vite.config.ts`): Multi-entry rollup configuration `{ main: 'index.html', home: 'home.html' }`.
  - Route generator (`scripts/post-build.js`): Preserves `dist/index.html` as the pure static landing page and generates `dist/home.html`, `dist/home/index.html` and SPA aliases without overwriting root.
  - Application router (`src/routes.ts`): Maps `/home` cleanly to the game home view and decouples `/`.

- **Component & Module Structure (`src/landing/`)**:
  - `src/landing/index.ts`: Application bootstrap and DOM mounting.
  - `src/landing/styles/landing.css`: OpenCode Terminal-Flat design styling (`font-mono`, `#fdfcfc` cream, `#201d1d` ink, 1px hairlines, 0px/4px radii).
  - `src/landing/components/`:
    - `Header.tsx` (Top Nav: 6 items)
    - `Sidebar.tsx` (Side Nav: 8 items)
    - `Modals.tsx` (Shop, Community, Login modals)
    - `Footer.tsx`
  - `src/landing/views/`:
    - `HomeSection.tsx` (Vertical scroll, introductions, Naver Webtoon/Novel & Munpia links with "절찬 연재중")
    - `MyDeckSection.tsx` (5-card composition, Deck TP, Total TP)
    - `PlaySection.tsx` (5 buttons: 닫기, 이전, 다음, 나레이션, TTS default OFF; Webtoon 40-ep scenes)
    - `CardSection.tsx` (Card collection rate, 110 card list, 1~100Lv nurture, stat allocation, red dot indicators)
    - `ShopSection.tsx` (Exact 8 items grid)
  - `src/landing/services/`:
    - `cardNurtureStore.ts` (1~100Lv EXP logic, stat points, localStorage `hero_card_nurturing` persistence)
    - `assetCatalog.ts` (7-head cutouts, bust portraits, 3-head SD sprite mappings)

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Standalone Static Landing Entry | `index.html` loads `src/landing/index.ts` with 0 heavy runtime dependencies | M1 | Survey 1 |
| 2 | Legacy SPA Entry Separation | `home.html` loads `src/main.tsx` for the rich card battle SPA | M1 | Survey 1 |
| 3 | Vite MPA Rollup Inputs | `vite.config.ts` builds both `index.html` and `home.html` entries | M1 | Survey 1 |
| 4 | Post-build Route Preservation | `scripts/post-build.js` maintains pure `dist/index.html` and creates `dist/home` routes | M1 | Survey 1 |
| 5 | Route Definition Update | `src/routes.ts` sets `home.path = '/home'` and decouples `/` | M1 | Survey 1 |
| 6 | Full Viewport Responsive Layout | Fluid layout across 360px+ mobile, 768px+ tablet, 1024px+ desktop without max-w constraints | M2 | Survey 2 |
| 7 | 3-Tier Character Visual Assets | Integration of 7-head cutouts, bust portraits, and 3-head SD sprites | M2 | Survey 2 |
| 8 | Top Navigation (6 Items) | 홈, 마이덱, 플레이, 미션, 상점, 쇼핑몰 | M2 | Survey 2 |
| 9 | Side Navigation (8 Items) | 로그인, 홈, 마이덱, 플레이, 미션, 상점, 쇼핑몰, 커뮤니티 | M2 | Survey 2 |
| 10 | Secondary Action Modals | Preparing / info modals for 쇼핑몰, 커뮤니티, 로그인 | M2 | Survey 2 |
| 11 | Zero Onboarding Popup Guard | Total suppression and elimination of initial onboarding/tutorial/help popups on first visit | M2 | Survey 2 |
| 12 | Home Section Vertical Scroll | SnowHero intro, web novel, web game, anime, Naver novel/webtoon & Munpia links with "절찬 연재중" | M3 | Survey 3 |
| 13 | My Deck Section Simple View | Current 5 cards, Deck TP ($N+E+S+W$), Total TP (all owned cards) | M3 | Survey 3 |
| 14 | Play Section Streamlined Viewer | 5 buttons [닫기, 이전, 다음, 나레이션, TTS], TTS default OFF, 40-ep webtoon scene selector | M3 | Survey 3 |
| 15 | Card Section Grid & Collection Rate | Renamed from '미션' to '카드', collection rate display, 110 card grid | M3 | Survey 3 |
| 16 | Card Nurturing 1~100Lv Engine | EXP gain from nurture, max Lv 100, stat points on level up, red dot indicator, 4-way stat allocation | M3 | Survey 3 |
| 17 | LocalStorage State Persistence | `hero_card_nurturing` schema permanently persisted in localStorage across refreshes | M3 | Survey 3 |
| 18 | Shop Section 8 Fixed Items | 일반 카드팩, 매직 카드팩, 희귀 카드팩, 아이템 팩, 광고 제거, 공식 소설, 공식 동영상, 코인 충전 | M3 | Survey 3 |
| 19 | Static Build Integrity Verification | Exit code 0, 0 broken links, bundle size verification script | M4 | Survey 1 |
| 20 | Browser Rendering & Interaction E2E Suite | Playwright E2E testing for responsive layouts, navigation, card nurture, level up, stat upgrade, localStorage reload, zero popups | M4 | Survey 1 |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Static Architecture & MPA Decoupling | Features 1–5: `index.html`, `home.html`, `vite.config.ts`, `scripts/post-build.js`, `src/routes.ts` | none | DONE (Build passed, 775 HTMLs verified, 5 test suites 223 assertions 100% PASS, bundle < 1.79 KB) |
| M2 | Responsive Shell, Navigation & Assets | Features 6–11: Responsive layout, Top 6 & Side 8 nav, character assets (7-head/bust/3-head), modals, zero-popup guard | M1 | DONE (13/13 M2 E2E PASS, 30/30 Adversarial PASS, Clean Audit, 110 cards 3-tier assets verified, bundle 34.5 KB) |
| M3 | Core Sections & Card Nurturing System | Features 12–18: Home (with external links & badges), My Deck (Deck/Total TP), Play (5 buttons, TTS OFF), Card (1~100Lv nurture, red dot, stat upgrade, localStorage), Shop (8 items) | M2 | DONE (43/43 M3 assertions PASS, 69/69 full suite PASS, 54/54 adversarial tests PASS, Clean Audit, bundle 43.5 KB, commit 75fc970c0) |
| M4 | Final Milestone: 100% E2E Test Pass & Hardening | Features 19–20: 100% pass of E2E test suite (Tiers 1–4) followed by Tier 5 adversarial hardening | M1, M2, M3, TEST_READY.md | DONE (117/117 assertions 100% PASS across 3 test suites, Clean Forensic Audit, bundle 43.55 KB, commit 4bfc68d25) |

## Interface Contracts

### `src/landing/services/cardNurtureStore.ts` ↔ UI Components
```typescript
export interface CardNurtureData {
  cardId: number;        // 1..110
  level: number;         // 1..100
  exp: number;           // Current EXP
  expToNext: number;     // Level * 100
  statPoints: number;    // Unspent stat points
  bonusStats: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  totalBonus: number;
}

export interface NurtureState {
  cards: Record<number, CardNurtureData>;
  ownedCardIds: number[];
  getDeckTP: () => number;
  getTotalTP: () => number;
  nurtureCard: (cardId: number) => { expGained: number; leveledUp: boolean; newLevel: number };
  allocateStat: (cardId: number, direction: 'top' | 'right' | 'bottom' | 'left') => boolean;
  hasUnspentPoints: (cardId: number) => boolean;
  saveToStorage: () => void;
  loadFromStorage: () => void;
}
```

### Navigation & Routing Contract
- Active view keys: `'home' | 'deck' | 'play' | 'card' | 'shop'`
- Modals: `'mall' | 'community' | 'login' | null`
- Top Nav items: `['home', 'deck', 'play', 'card', 'shop', 'mall']`
- Side Nav items: `['login', 'home', 'deck', 'play', 'card', 'shop', 'mall', 'community']`
- TTS Contract: initial `isTtsActive: false`. Audio playback triggered only on explicit user click.
- External links:
  - Naver Web Novel: `http://novel.naver.com/challenge/list?novelId=1250635` (`[절찬 연재중]`)
  - Naver Webtoon: `https://comic.naver.com/challenge/list?titleId=856677` (`[절찬 연재중]`)
  - Munpia: `https://nlink.munpia.com/link/munpia/novel/616551` (`[절찬 연재중]`)

## Code Layout
- `index.html`: Standalone static landing HTML entry point
- `home.html`: Rich game SPA HTML entry point
- `src/landing/`:
  - `index.ts`: Static landing entry script
  - `styles/landing.css`: Canonical OpenCode Terminal-Flat styles
  - `components/`: `Header.tsx`, `Sidebar.tsx`, `Modals.tsx`, `Footer.tsx`
  - `views/`: `HomeSection.tsx`, `MyDeckSection.tsx`, `PlaySection.tsx`, `CardSection.tsx`, `ShopSection.tsx`
  - `services/`: `cardNurtureStore.ts`, `assetCatalog.ts`, `webtoonCatalog.ts`
- `tests/e2e/`: E2E test suites (Tiers 1–4)
