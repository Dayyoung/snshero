# Milestone 2: Navigation Components & Modals — Investigation & Specification Report

## 1. Observation

### 1.1 Authoritative Requirements & Inputs
- **`ORIGINAL_REQUEST.md` (lines 58–63)**:
  - **Main (Top) Menu**: 홈, 마이덱, 플레이, 미션, 상점, 쇼핑몰 (exact 6 items only, eliminate all others).
  - **Side Menu**: 로그인, 홈, 마이덱, 플레이, 미션, 상점, 쇼핑몰, 커뮤니티 (exact 8 items only).
  - **Secondary Modals**: 쇼핑몰, 커뮤니티, 로그인 클릭 시 준비 중 안내 모달 표시 또는 공식 링크 연결.
  - **Zero Onboarding Popups**: 첫 접속 시 노출되던 모든 온보딩 도움말 및 튜토리얼 팝업 일체 제거.
- **`PROJECT.md` (§ Navigation & Routing Contract, lines 93–103)**:
  - Active view keys: `'home' | 'deck' | 'play' | 'card' | 'shop'`.
  - Modals: `'mall' | 'community' | 'login' | null`.
  - Top Nav items: `['home', 'deck', 'play', 'card', 'shop', 'mall']`.
  - Side Nav items: `['login', 'home', 'deck', 'play', 'card', 'shop', 'mall', 'community']`.
- **`TEST_INFRA.md` & `tests/e2e/tier1_feature_coverage.ts` Assertions**:
  - `T1.NAV.1` (line 191): Checks `src/landing/components/Header.tsx` includes all 6 items: `'홈'`, `'마이덱'`, `'플레이'`, `'미션'`, `'상점'`, `'쇼핑몰'`.
  - `T1.NAV.2` (line 204): Checks `src/landing/components/Sidebar.tsx` includes all 8 items: `'로그인'`, `'홈'`, `'마이덱'`, `'플레이'`, `'미션'`, `'상점'`, `'쇼핑몰'`, `'커뮤니티'`.
  - `T1.NAV.3` (line 217): Checks `src/landing/components/Modals.tsx` includes `'쇼핑몰'` / `'mall'` and dismiss control (`'닫기'`, `'close'`, `'[x]'`, `'onClose'`).
  - `T1.NAV.4` (line 230): Checks `src/landing/components/Modals.tsx` includes `'커뮤니티'` / `'community'` and dismiss control (`'닫기'`, `'close'`, `'[x]'`, `'onClose'`).
  - `T1.NAV.5` (line 243): Checks `src/landing/components/Modals.tsx` includes `'로그인'` / `'login'` and dismiss control (`'닫기'`, `'close'`, `'[x]'`, `'onClose'`).
  - `T1.RESP.1` (line 131): Mobile 360px fluid responsive layout (`overflow-x-hidden`, `w-full`).
  - `T1.RESP.2` (line 141): Tablet 768px adaptability (checks `md:`, `768px`, `@media` in Header/Sidebar/CSS).
  - `T1.RESP.3` (line 151): Desktop 1024px+ layout (checks `lg:`, `desktop` in Header/index.ts).
  - `T1.RESP.4` (line 160): 3-Tier character visual assets catalog in `src/landing/services/assetCatalog.ts` (references `cutouts` / `anime-character-sheets`, `seat/` / `bust`, and `cards1.png` / `cards2.png` / `sd`).
  - `T1.RESP.5` (line 174): Zero onboarding popups on initial visit.
  - `T2.B6.1` (`tier2_boundary_corner.ts`, line 177): 320px viewport touch target resilience (`min-h-[44px]` in `Header.tsx` / `landing.css`).
  - `T3.C1.5` (`tier3_cross_feature.ts`, line 122): Modal lifecycle & dismiss handlers (`onClose`, `fixed`, `z-50`, `backdrop`).

### 1.2 Current Baseline E2E Status
Execution of `npx tsx tests/e2e/run_all.ts --milestone M2 --allow-fail`:
```
Total Assertions Run : 13
Passed               : 2  (T1.RESP.1, T1.RESP.5)
Failed               : 11 (T1.RESP.2, T1.RESP.3, T1.RESP.4, T1.NAV.1~5, T2.B6.1, T3.C1.5, T4.W1.1)
```
Failure reason: Missing components in `src/landing/components/` (`Header.tsx`, `Sidebar.tsx`, `Modals.tsx`) and `src/landing/services/assetCatalog.ts`.

### 1.3 Physical Asset Availability on Filesystem
Verified via filesystem checks:
- 7-Head cutouts: `public/anime-character-sheets/cutouts/*.png` (112 high-res character cutout files).
- Bust portraits: `public/seat/*.png` (113 individual character portrait files, IDs 1–110).
- 3-Head SD sprites: `public/cards1.png` (IDs 1–100, 10x10 grid) and `public/cards2.png` (IDs 101–110, 10x10 grid).

### 1.4 Architecture & Dependency Constraint
- `PROJECT.md` line 5 & `T1.MPA.4` line 89: `dist/index.html` must remain an ultra-lightweight standalone static web service with **zero heavy dependencies** (`vendor-react` must NOT be loaded or bundled in root index).
- Therefore, all components in `src/landing/components/` and `src/landing/views/` must be authored in pure, lightweight TypeScript using functional DOM generation/template strings, without importing React runtime.

---

## 2. Logic Chain

1. **Top Nav Exact Items (6 Items)**:
   - `T1.NAV.1` requires literal string inclusion of `'홈'`, `'마이덱'`, `'플레이'`, `'미션'`, `'상점'`, `'쇼핑몰'`.
   - In `ORIGINAL_REQUEST.md` line 68, the Card section is renamed from '미션' to '카드', but the navigation contract explicitly retains `'미션'` as the top-nav label (or `'미션'` with view key `'card'`).
   - Action binding:
     - `'홈'` -> `setView('home')`
     - `'마이덱'` -> `setView('deck')`
     - `'플레이'` -> `setView('play')`
     - `'미션'` -> `setView('card')`
     - `'상점'` -> `setView('shop')`
     - `'쇼핑몰'` -> `openModal('mall')` (secondary modal, not a view change)

2. **Side Nav Exact Items (8 Items) & Drawer Interaction**:
   - `T1.NAV.2` requires literal string inclusion of `'로그인'`, `'홈'`, `'마이덱'`, `'플레이'`, `'미션'`, `'상점'`, `'쇼핑몰'`, `'커뮤니티'`.
   - On mobile/tablet (`< 1024px`), navigation is mediated by an off-canvas drawer triggered by a hamburger button (`min-h-[44px] min-w-[44px]`).
   - The drawer includes an overlay backdrop (`fixed inset-0 bg-black/50 z-40 backdrop-blur-xs`), a side panel (`fixed inset-y-0 left-0 w-72 bg-[#fdfcfc] z-50 border-r`), and dismiss mechanisms: `[x]` button, backdrop click, Escape key, or menu item selection.

3. **Secondary Action Modals (쇼핑몰, 커뮤니티, 로그인)**:
   - `T1.NAV.3`, `T1.NAV.4`, `T1.NAV.5`, and `T3.C1.5` require:
     - Clear Korean titles and English aliases: `'쇼핑몰'`/`'mall'`, `'커뮤니티'`/`'community'`, `'로그인'`/`'login'`.
     - Explicit dismiss controls: top-right `[x]` button and bottom `'닫기'` button, both with `min-h-[44px]` touch targets.
     - Backdrop layer: `fixed inset-0 bg-black/50 z-50 backdrop-blur-xs`.
     - Zero auto-popup on load (`T1.RESP.5`).
   - Specific content:
     - **쇼핑몰 (`mall`)**: Naver SmartStore & official merchandise preview (TCG card pack, artbook, novel) with `/mall` action link and `닫기`.
     - **커뮤니티 (`community`)**: Official Naver Game Lounge, Kakao OpenChat, Discord, and Reddit Newsroom (`/reddit`) guide with `닫기`.
     - **로그인 (`login`)**: Notice that social login is preparing for launch; reassurance that 100% of game progression (cards, 1~100Lv nurture, stat points) is permanently preserved in browser LocalStorage (`hero_card_nurturing`), plus guest play action `/home` and `닫기`.

4. **Responsive Shell & Touch Ergonomics**:
   - `T1.RESP.2` and `T1.RESP.3` dictate responsive classes: `md:` (tablet 768px) and `lg:` (desktop 1024px+).
   - Desktop view (`lg:`): Top nav shows 6 horizontal items; side drawer button is hidden or secondary.
   - Mobile/Tablet view (`< 1024px`): Top nav shows brand + hamburger toggle; side drawer handles 8 items.
   - `T2.B6.1` dictates `min-h-[44px]` touch targets on interactive controls to guarantee mobile one-hand ergonomics even at 320px viewport.

5. **3-Tier Character Visual Assets Catalog**:
   - `T1.RESP.4` requires `src/landing/services/assetCatalog.ts` covering:
     - 7-head: `public/anime-character-sheets/cutouts/*.png`
     - Bust portraits: `public/seat/*.png`
     - 3-head SD: `public/cards1.png` and `public/cards2.png`

---

## 3. Caveats

1. **Milestone Boundary**: Milestone 2 is strictly scoped to the responsive shell, Navigation (`Header.tsx`, `Sidebar.tsx`), Modals (`Modals.tsx`), and Character Asset Catalog (`assetCatalog.ts`). The deep interactive logic of the 5 main view sections (Home vertical scroll with novel/webtoon badges, MyDeck 5-card slot TP calculator, Play 5-button webtoon viewer, Card 1~100Lv nurture engine with red dot indicators, and Shop 8 fixed items) is scheduled for Milestone 3.
2. **Zero React in Landing**: All landing code must remain pure TypeScript DOM generation to avoid pulling `vendor-react` into the root `dist/index.html` bundle.
3. **Dual Routing Coordination**: Navigating to `/home` from the landing page cleanly switches from the static landing page to the rich SPA entry `home.html` as defined by the MPA architecture in Milestone 1.

---

## 4. Conclusion & Technical Specifications

### 4.1 Component Architecture Overview

```
src/landing/
├── index.ts                     # Bootstrap shell, state store, DOM orchestrator
├── styles/
│   └── landing.css              # OpenCode flat styling, 44px+ touch rules, responsive utilities
├── components/
│   ├── Header.tsx               # Top Nav (6 items: 홈, 마이덱, 플레이, 미션, 상점, 쇼핑몰)
│   ├── Sidebar.tsx              # Side Nav (8 items: 로그인, 홈, 마이덱, 플레이, 미션, 상점, 쇼핑몰, 커뮤니티)
│   ├── Modals.tsx               # Modals (쇼핑몰, 커뮤니티, 로그인 + backdrop + dismiss [x])
│   └── Footer.tsx               # Minimalist footer
├── services/
│   └── assetCatalog.ts          # 3-Tier character visual assets (7-head cutouts, bust, 3-head SD)
└── views/ (Placeholders for M2, full implementation in M3)
    ├── HomeSection.tsx
    ├── MyDeckSection.tsx
    ├── PlaySection.tsx
    ├── CardSection.tsx
    └── ShopSection.tsx
```

---

### 4.2 Detailed Code Specifications

#### 1) `src/landing/components/Header.tsx`
- **Purpose**: Render the sticky top navigation bar with exact 6 navigation items, responsive hamburger button, and game SPA launch link.
- **Contract & Assertions Satisfied**: `T1.NAV.1`, `T1.RESP.2` (`md:`), `T1.RESP.3` (`lg:`), `T2.B6.1` (`min-h-[44px]`).
- **Proposed Implementation**:

```typescript
import { ViewKey, ModalKey, TOP_NAV_ITEMS } from '../types';

export interface HeaderProps {
  activeView: ViewKey;
  onNavigate: (view: ViewKey) => void;
  onOpenModal: (modal: ModalKey) => void;
  onToggleDrawer: () => void;
}

interface NavItemDef {
  key: ViewKey | 'mall';
  label: string;
  isModal?: boolean;
}

export const TOP_NAV_DEFS: NavItemDef[] = [
  { key: 'home', label: '홈' },
  { key: 'deck', label: '마이덱' },
  { key: 'play', label: '플레이' },
  { key: 'card', label: '미션' },
  { key: 'shop', label: '상점' },
  { key: 'mall', label: '쇼핑몰', isModal: true },
];

export function renderHeader(props: HeaderProps): string {
  const { activeView } = props;

  const navItemsHtml = TOP_NAV_DEFS.map((item) => {
    const isActive = !item.isModal && activeView === item.key;
    const activeClass = isActive
      ? 'bg-[#201d1d] text-[#fdfcfc]'
      : 'text-[#646262] hover:text-[#201d1d] hover:bg-[#f1eeee]';

    return `
      <button
        type="button"
        data-nav="${item.key}"
        data-is-modal="${item.isModal ? 'true' : 'false'}"
        class="nav-item-btn px-3 py-2 text-xs font-semibold rounded-sm transition-colors min-h-[44px] flex items-center justify-center ${activeClass}"
        aria-current="${isActive ? 'page' : 'false'}"
      >
        ${item.label}
      </button>
    `;
  }).join('');

  return `
    <header class="sticky top-0 z-30 w-full bg-[#fdfcfc]/95 border-b border-[rgba(15,0,0,0.12)] backdrop-blur-sm">
      <div class="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 min-h-[44px] flex items-center justify-between">
        <!-- Brand & Logo -->
        <div class="flex items-center gap-3">
          <button
            type="button"
            id="mobile-drawer-toggle"
            class="block lg:hidden p-2 rounded-sm text-[#201d1d] hover:bg-[#f1eeee] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="사이드 메뉴 열기"
          >
            <span class="text-lg leading-none font-bold">☰</span>
          </button>
          <a href="#home" data-nav="home" class="brand-link flex items-center gap-2 text-sm font-bold tracking-tight text-[#201d1d] min-h-[44px]">
            <span class="w-2.5 h-2.5 bg-[#201d1d] rounded-none inline-block"></span>
            <span>눈히어로.com</span>
            <span class="hidden md:inline-block text-[11px] font-normal text-[#646262] border border-[rgba(15,0,0,0.12)] px-1.5 py-0.5 rounded-sm">
              v2.1
            </span>
          </a>
        </div>

        <!-- Desktop Navigation (Exact 6 items: 홈, 마이덱, 플레이, 미션, 상점, 쇼핑몰) -->
        <nav class="hidden lg:flex items-center gap-1.5" aria-label="메인 상단 내비게이션">
          ${navItemsHtml}
        </nav>

        <!-- Right Action: Game SPA Launch -->
        <div class="flex items-center gap-2">
          <a
            href="/home"
            class="px-4 py-2 bg-[#201d1d] text-[#fdfcfc] text-xs font-bold rounded-sm hover:opacity-90 transition-opacity min-h-[44px] inline-flex items-center justify-center"
          >
            게임 시작 (/home) →
          </a>
        </div>
      </div>
    </header>
  `;
}

export function bindHeaderEvents(container: HTMLElement, props: HeaderProps): void {
  // Mobile drawer toggle
  const toggleBtn = container.querySelector('#mobile-drawer-toggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      props.onToggleDrawer();
    });
  }

  // Brand link
  const brandLink = container.querySelector('.brand-link');
  if (brandLink) {
    brandLink.addEventListener('click', (e) => {
      e.preventDefault();
      props.onNavigate('home');
    });
  }

  // Nav buttons
  const navButtons = container.querySelectorAll('.nav-item-btn');
  navButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.getAttribute('data-nav');
      const isModal = btn.getAttribute('data-is-modal') === 'true';
      if (!key) return;

      if (isModal) {
        props.onOpenModal(key as ModalKey);
      } else {
        props.onNavigate(key as ViewKey);
      }
    });
  });
}
```

---

#### 2) `src/landing/components/Sidebar.tsx`
- **Purpose**: Render the off-canvas drawer navigation containing the exact 8 side menu items, with backdrop, dismissal controls, and keyboard handling.
- **Contract & Assertions Satisfied**: `T1.NAV.2` (Side 8 items: 로그인, 홈, 마이덱, 플레이, 미션, 상점, 쇼핑몰, 커뮤니티), `T1.RESP.2` (`md:`), `T2.B6.1` (`min-h-[44px]`).
- **Proposed Implementation**:

```typescript
import { ViewKey, ModalKey, SIDE_NAV_ITEMS } from '../types';

export interface SidebarProps {
  isOpen: boolean;
  activeView: ViewKey;
  onNavigate: (view: ViewKey) => void;
  onOpenModal: (modal: ModalKey) => void;
  onClose: () => void;
}

interface SideItemDef {
  key: string;
  label: string;
  isModal?: boolean;
  icon: string;
}

export const SIDE_NAV_DEFS: SideItemDef[] = [
  { key: 'login', label: '로그인', isModal: true, icon: '🔑' },
  { key: 'home', label: '홈', icon: '🏠' },
  { key: 'deck', label: '마이덱', icon: '🃏' },
  { key: 'play', label: '플레이', icon: '⚔️' },
  { key: 'card', label: '미션', icon: '📜' },
  { key: 'shop', label: '상점', icon: '🛒' },
  { key: 'mall', label: '쇼핑몰', isModal: true, icon: '🏬' },
  { key: 'community', label: '커뮤니티', isModal: true, icon: '💬' },
];

export function renderSidebar(props: SidebarProps): string {
  const { isOpen, activeView } = props;

  const itemsHtml = SIDE_NAV_DEFS.map((item) => {
    const isActive = !item.isModal && activeView === item.key;
    const activeClass = isActive
      ? 'bg-[#201d1d] text-[#fdfcfc]'
      : 'text-[#201d1d] hover:bg-[#f1eeee]';

    return `
      <li>
        <button
          type="button"
          data-side-nav="${item.key}"
          data-is-modal="${item.isModal ? 'true' : 'false'}"
          class="sidebar-item-btn w-full px-4 py-3 text-sm font-medium flex items-center justify-between border-b border-[rgba(15,0,0,0.06)] rounded-sm min-h-[44px] transition-colors ${activeClass}"
        >
          <span class="flex items-center gap-3">
            <span class="text-base">${item.icon}</span>
            <span>${item.label}</span>
          </span>
          <span class="text-xs text-stone-400">→</span>
        </button>
      </li>
    `;
  }).join('');

  return `
    <div
      id="sidebar-drawer-container"
      class="fixed inset-0 z-50 transition-opacity duration-200 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}"
      aria-hidden="${isOpen ? 'false' : 'true'}"
    >
      <!-- Backdrop -->
      <div id="sidebar-backdrop" class="fixed inset-0 bg-black/50 backdrop-blur-xs"></div>

      <!-- Drawer Panel -->
      <aside
        class="fixed inset-y-0 left-0 w-72 sm:w-80 max-w-[85vw] bg-[#fdfcfc] text-[#201d1d] z-50 border-r border-[rgba(15,0,0,0.12)] shadow-2xl flex flex-col justify-between overflow-y-auto transform transition-transform duration-200 ${isOpen ? 'translate-x-0' : '-translate-x-full'}"
      >
        <!-- Header -->
        <div>
          <div class="p-4 border-b border-[rgba(15,0,0,0.12)] flex items-center justify-between min-h-[56px]">
            <div class="flex items-center gap-2">
              <span class="w-3 h-3 bg-[#201d1d]"></span>
              <span class="font-bold text-sm tracking-tight">메뉴 (Navigation)</span>
            </div>
            <button
              type="button"
              id="sidebar-close-btn"
              class="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 rounded-sm text-stone-600 hover:text-[#201d1d] hover:bg-[#f1eeee] transition-colors"
              aria-label="닫기"
            >
              <span class="text-base font-bold">[x]</span>
            </button>
          </div>

          <!-- User / Guest Status Notice -->
          <div class="p-4 bg-[#f8f7f7] border-b border-[rgba(15,0,0,0.12)]">
            <div class="text-[11px] text-[#646262] font-semibold uppercase tracking-wider mb-1">인증 상태</div>
            <div class="text-xs font-bold text-[#201d1d] flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-none bg-emerald-500 inline-block"></span>
              <span>게스트 모험가 (LocalStorage 자동저장)</span>
            </div>
          </div>

          <!-- 8 Navigation Items: 로그인, 홈, 마이덱, 플레이, 미션, 상점, 쇼핑몰, 커뮤니티 -->
          <nav class="p-2" aria-label="사이드 내비게이션">
            <ul class="space-y-1">
              ${itemsHtml}
            </ul>
          </nav>
        </div>

        <!-- Footer Actions -->
        <div class="p-4 border-t border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] space-y-2">
          <a
            href="/home"
            class="block w-full py-3 bg-[#201d1d] text-[#fdfcfc] text-center text-xs font-bold rounded-sm min-h-[44px] leading-[20px] hover:opacity-90 transition-opacity"
          >
            게임 시작하기 (/home) →
          </a>
          <p class="text-[10px] text-stone-500 text-center font-mono">
            눈히어로.com (SNSHero.com) © 2026
          </p>
        </div>
      </aside>
    </div>
  `;
}

export function bindSidebarEvents(container: HTMLElement, props: SidebarProps): void {
  // Close button
  const closeBtn = container.querySelector('#sidebar-close-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      props.onClose();
    });
  }

  // Backdrop click dismiss
  const backdrop = container.querySelector('#sidebar-backdrop');
  if (backdrop) {
    backdrop.addEventListener('click', () => {
      props.onClose();
    });
  }

  // Item click
  const buttons = container.querySelectorAll('.sidebar-item-btn');
  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.getAttribute('data-side-nav');
      const isModal = btn.getAttribute('data-is-modal') === 'true';
      if (!key) return;

      if (isModal) {
        props.onOpenModal(key as ModalKey);
      } else {
        props.onNavigate(key as ViewKey);
      }
      props.onClose();
    });
  });

  // ESC key listener
  const handleKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && props.isOpen) {
      props.onClose();
    }
  };
  window.addEventListener('keydown', handleKeydown);
}
```

---

#### 3) `src/landing/components/Modals.tsx`
- **Purpose**: Render modal dialogs for 쇼핑몰 (`mall`), 커뮤니티 (`community`), and 로그인 (`login`), equipped with top-layer `[x]` button, bottom `닫기` button, backdrop click dismissal, and keyboard accessibility.
- **Contract & Assertions Satisfied**: `T1.NAV.3`, `T1.NAV.4`, `T1.NAV.5`, `T3.C1.5`, `T4.W1.1`, `T2.B6.1`.
- **Proposed Implementation**:

```typescript
import { ModalKey } from '../types';

export interface ModalsProps {
  activeModal: ModalKey;
  onClose: () => void;
}

export function renderModals(props: ModalsProps): string {
  const { activeModal } = props;
  if (!activeModal) return '';

  let modalContent = '';

  if (activeModal === 'mall') {
    modalContent = `
      <div class="modal-dialog bg-[#fdfcfc] text-[#201d1d] font-mono border border-[rgba(15,0,0,0.12)] rounded-none max-w-md w-full shadow-2xl p-6 relative">
        <!-- Close [x] Top Right -->
        <button
          type="button"
          class="modal-close-trigger absolute top-4 right-4 min-h-[44px] min-w-[44px] flex items-center justify-center text-stone-500 hover:text-[#201d1d] font-bold text-sm rounded-sm"
          aria-label="닫기"
        >
          [x]
        </button>

        <div class="mb-4">
          <span class="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-[#201d1d] text-[#fdfcfc] rounded-sm mb-2">
            쇼핑몰 (Mall) · 오픈 준비 중
          </span>
          <h2 class="text-base font-bold tracking-tight">눈히어로 공식 스토어 &amp; 굿즈샵</h2>
        </div>

        <p class="text-xs text-stone-600 leading-relaxed mb-4">
          눈히어로 공식 네이버 스마트스토어 및 실물 TCG 굿즈몰이 오픈 준비 중입니다.
          실물 110종 카드팩, 한정판 일러스트 양장본 설정집, 40부작 판타지 웹소설 소장본이 곧 입고됩니다.
        </p>

        <div class="space-y-2 mb-6">
          <a
            href="/mall"
            class="block w-full py-3 px-4 bg-[#201d1d] text-[#fdfcfc] text-center text-xs font-bold rounded-sm min-h-[44px] leading-[20px] hover:opacity-90 transition-opacity"
          >
            공식 스토어 안내 바로가기 (/mall) →
          </a>
        </div>

        <div class="flex justify-end pt-2 border-t border-[rgba(15,0,0,0.08)]">
          <button
            type="button"
            class="modal-close-trigger w-full py-2.5 bg-[#f1eeee] text-[#201d1d] border border-[rgba(15,0,0,0.12)] text-xs font-semibold rounded-sm min-h-[44px] hover:bg-[#e8e5e5] transition-colors"
          >
            닫기 (Close)
          </button>
        </div>
      </div>
    `;
  } else if (activeModal === 'community') {
    modalContent = `
      <div class="modal-dialog bg-[#fdfcfc] text-[#201d1d] font-mono border border-[rgba(15,0,0,0.12)] rounded-none max-w-md w-full shadow-2xl p-6 relative">
        <!-- Close [x] Top Right -->
        <button
          type="button"
          class="modal-close-trigger absolute top-4 right-4 min-h-[44px] min-w-[44px] flex items-center justify-center text-stone-500 hover:text-[#201d1d] font-bold text-sm rounded-sm"
          aria-label="닫기"
        >
          [x]
        </button>

        <div class="mb-4">
          <span class="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-[#201d1d] text-[#fdfcfc] rounded-sm mb-2">
            커뮤니티 (Community)
          </span>
          <h2 class="text-base font-bold tracking-tight">공식 라운지 &amp; 모험가 채널</h2>
        </div>

        <p class="text-xs text-stone-600 leading-relaxed mb-4">
          모험가 여러분을 위한 공식 소통 공간입니다. 최강 덱 빌딩 공략, 카드 시너지 토론, 실시간 대전 상대를 만나보세요.
        </p>

        <ul class="text-xs space-y-2 mb-6 border border-[rgba(15,0,0,0.08)] p-3 bg-[#f8f7f7] rounded-sm">
          <li class="flex items-center justify-between">
            <span class="font-semibold">네이버 게임 라운지</span>
            <span class="text-[11px] text-stone-500">공식 공략 &amp; 이벤트</span>
          </li>
          <li class="flex items-center justify-between">
            <span class="font-semibold">카카오톡 오픈채팅방</span>
            <span class="text-[11px] text-stone-500">실시간 모험가 잡담</span>
          </li>
          <li class="flex items-center justify-between">
            <span class="font-semibold">공식 디스코드 (Discord)</span>
            <span class="text-[11px] text-stone-500">글로벌 커뮤니티</span>
          </li>
          <li class="flex items-center justify-between">
            <span class="font-semibold">Reddit 글로벌 뉴스룸</span>
            <span class="text-[11px] text-stone-500">실시간 테크/게임 뉴스</span>
          </li>
        </ul>

        <div class="space-y-2 mb-4">
          <a
            href="/reddit"
            class="block w-full py-3 px-4 bg-[#201d1d] text-[#fdfcfc] text-center text-xs font-bold rounded-sm min-h-[44px] leading-[20px] hover:opacity-90 transition-opacity"
          >
            실시간 Reddit 뉴스룸 바로가기 (/reddit) →
          </a>
        </div>

        <div class="flex justify-end pt-2 border-t border-[rgba(15,0,0,0.08)]">
          <button
            type="button"
            class="modal-close-trigger w-full py-2.5 bg-[#f1eeee] text-[#201d1d] border border-[rgba(15,0,0,0.12)] text-xs font-semibold rounded-sm min-h-[44px] hover:bg-[#e8e5e5] transition-colors"
          >
            닫기 (Close)
          </button>
        </div>
      </div>
    `;
  } else if (activeModal === 'login') {
    modalContent = `
      <div class="modal-dialog bg-[#fdfcfc] text-[#201d1d] font-mono border border-[rgba(15,0,0,0.12)] rounded-none max-w-md w-full shadow-2xl p-6 relative">
        <!-- Close [x] Top Right -->
        <button
          type="button"
          class="modal-close-trigger absolute top-4 right-4 min-h-[44px] min-w-[44px] flex items-center justify-center text-stone-500 hover:text-[#201d1d] font-bold text-sm rounded-sm"
          aria-label="닫기"
        >
          [x]
        </button>

        <div class="mb-4">
          <span class="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-[#201d1d] text-[#fdfcfc] rounded-sm mb-2">
            로그인 (Login) · 게스트 보존
          </span>
          <h2 class="text-base font-bold tracking-tight">계정 로그인 &amp; 게스트 플레이 안내</h2>
        </div>

        <p class="text-xs text-stone-600 leading-relaxed mb-3">
          Google 및 Apple 원클릭 소셜 로그인은 정식 서비스 런칭 시 오픈될 예정입니다.
        </p>

        <div class="p-3 bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] rounded-sm mb-5 text-xs text-stone-700 leading-relaxed">
          <span class="font-bold text-[#201d1d]">로컬스토리지(LocalStorage) 100% 영구 보존:</span><br/>
          현재 획득한 카드, 1~100Lv 카드 육성 경험치, 스탯 포인트, 덱 구성 데이터는 회원가입이나 로그인 없이도 브라우저에 안전하게 영구 저장됩니다.
        </div>

        <div class="space-y-2 mb-4">
          <a
            href="/home"
            class="block w-full py-3 px-4 bg-[#201d1d] text-[#fdfcfc] text-center text-xs font-bold rounded-sm min-h-[44px] leading-[20px] hover:opacity-90 transition-opacity"
          >
            게스트로 게임 시작하기 (/home) →
          </a>
        </div>

        <div class="flex justify-end pt-2 border-t border-[rgba(15,0,0,0.08)]">
          <button
            type="button"
            class="modal-close-trigger w-full py-2.5 bg-[#f1eeee] text-[#201d1d] border border-[rgba(15,0,0,0.12)] text-xs font-semibold rounded-sm min-h-[44px] hover:bg-[#e8e5e5] transition-colors"
          >
            닫기 (Close)
          </button>
        </div>
      </div>
    `;
  }

  return `
    <div
      id="landing-modal-overlay"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
    >
      ${modalContent}
    </div>
  `;
}

export function bindModalEvents(container: HTMLElement, props: ModalsProps): void {
  const overlay = container.querySelector('#landing-modal-overlay');
  if (!overlay) return;

  // Backdrop click dismiss
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      props.onClose();
    }
  });

  // Close buttons ([x] and 닫기)
  const closeButtons = overlay.querySelectorAll('.modal-close-trigger');
  closeButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      props.onClose();
    });
  });

  // ESC key dismiss
  const handleKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      props.onClose();
    }
  };
  window.addEventListener('keydown', handleKeydown, { once: true });
}
```

---

#### 4) `src/landing/services/assetCatalog.ts`
- **Purpose**: Map and resolve 3 tiers of character visual assets (7-head cutout sheets, bust portraits, 3-head SD sprites) for all 110 cards.
- **Contract & Assertions Satisfied**: `T1.RESP.4` (checks `cutouts` / `anime-character-sheets`, `seat/` / `bust`, `cards1.png` / `cards2.png` / `sd` / `3head`).
- **Proposed Implementation**:

```typescript
/**
 * 3-Tier Character Visual Asset Catalog
 * M1/M2 contract:
 *  - Tier 1: 7-head full-body cutouts (public/anime-character-sheets/cutouts/*.png)
 *  - Tier 2: Bust portraits (public/seat/*.png)
 *  - Tier 3: 3-head SD master sprite sheets (public/cards1.png, public/cards2.png)
 */

export interface CharacterVisualAsset {
  cardId: number;
  cutout7HeadUrl: string;
  bustPortraitUrl: string;
  spriteSheet3HeadUrl: string;
  spriteCol: number;
  spriteRow: number;
}

export function getCharacterBustUrl(cardId: number): string {
  return `/seat/${cardId}.png`;
}

export function getCharacter7HeadCutoutUrl(cardId: number, characterName?: string): string {
  // Mapping for 7-head anime-character-sheets cutouts
  const padId = String(cardId).padStart(3, '0');
  return `/anime-character-sheets/cutouts/${padId}_character.png`;
}

export function getCharacter3HeadSpriteCoords(cardId: number): { sheetUrl: string; col: number; row: number } {
  // IDs 1..100 -> cards1.png (10x10 grid)
  // IDs 101..110 -> cards2.png (10x10 grid, row 0)
  if (cardId <= 100) {
    const idx = cardId - 1;
    return {
      sheetUrl: '/cards1.png',
      col: idx % 10,
      row: Math.floor(idx / 10),
    };
  } else {
    const idx = cardId - 101;
    return {
      sheetUrl: '/cards2.png',
      col: idx % 10,
      row: Math.floor(idx / 10),
    };
  }
}

export function getCharacterAsset(cardId: number, name?: string): CharacterVisualAsset {
  const sprite = getCharacter3HeadSpriteCoords(cardId);
  return {
    cardId,
    cutout7HeadUrl: getCharacter7HeadCutoutUrl(cardId, name),
    bustPortraitUrl: getCharacterBustUrl(cardId),
    spriteSheet3HeadUrl: sprite.sheetUrl,
    spriteCol: sprite.col,
    spriteRow: sprite.row,
  };
}
```

---

#### 5) `src/landing/index.ts` (Integrated Shell & State Sync)
- **Purpose**: Application orchestrator coordinating reactive state, Top Nav, Side Nav Drawer, Modals, and Main viewport without React or heavy frameworks.
- **Contract & Assertions Satisfied**: `T1.MPA.1`, `T1.RESP.1`, `T1.RESP.3` (`desktop`/`lg:`), `T1.RESP.5` (zero popups on load), `T3.C1.5`.
- **Proposed Implementation**:

```typescript
import './styles/landing.css';
import { ViewKey, ModalKey } from './types';
import { renderHeader, bindHeaderEvents } from './components/Header';
import { renderSidebar, bindSidebarEvents } from './components/Sidebar';
import { renderModals, bindModalEvents } from './components/Modals';

interface LandingState {
  activeView: ViewKey;
  activeModal: ModalKey;
  isDrawerOpen: boolean;
}

class LandingApp {
  private state: LandingState;
  private root: HTMLElement;

  constructor(root: HTMLElement) {
    this.root = root;
    const initialHash = (window.location.hash.replace('#', '') as ViewKey) || 'home';
    const validViews: ViewKey[] = ['home', 'deck', 'play', 'card', 'shop'];

    this.state = {
      activeView: validViews.includes(initialHash) ? initialHash : 'home',
      activeModal: null,
      isDrawerOpen: false,
    };

    window.addEventListener('hashchange', () => {
      const hash = window.location.hash.replace('#', '') as ViewKey;
      if (validViews.includes(hash) && hash !== this.state.activeView) {
        this.setView(hash);
      }
    });
  }

  public init(): void {
    this.render();
  }

  public setView(view: ViewKey): void {
    this.state.activeView = view;
    this.state.isDrawerOpen = false;
    window.location.hash = view;
    this.render();
  }

  public openModal(modal: ModalKey): void {
    this.state.activeModal = modal;
    this.state.isDrawerOpen = false;
    this.render();
  }

  public closeModal(): void {
    this.state.activeModal = null;
    this.render();
  }

  public toggleDrawer(open?: boolean): void {
    this.state.isDrawerOpen = open !== undefined ? open : !this.state.isDrawerOpen;
    this.render();
  }

  private render(): void {
    const { activeView, activeModal, isDrawerOpen } = this.state;

    this.root.innerHTML = `
      <div class="min-h-screen bg-[#fdfcfc] text-[#201d1d] font-mono flex flex-col w-full overflow-x-hidden">
        <!-- Top Navigation -->
        <div id="landing-header-slot">
          ${renderHeader({
            activeView,
            onNavigate: (v) => this.setView(v),
            onOpenModal: (m) => this.openModal(m),
            onToggleDrawer: () => this.toggleDrawer(),
          })}
        </div>

        <!-- Side Navigation Drawer -->
        <div id="landing-sidebar-slot">
          ${renderSidebar({
            isOpen: isDrawerOpen,
            activeView,
            onNavigate: (v) => this.setView(v),
            onOpenModal: (m) => this.openModal(m),
            onClose: () => this.toggleDrawer(false),
          })}
        </div>

        <!-- Active View / Main Container -->
        <main id="landing-main-slot" class="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          ${this.renderActiveViewStub(activeView)}
        </main>

        <!-- Modals Slot -->
        <div id="landing-modals-slot">
          ${renderModals({
            activeModal,
            onClose: () => this.closeModal(),
          })}
        </div>

        <!-- Minimalist Terminal Footer -->
        <footer class="w-full border-t border-[rgba(15,0,0,0.12)] bg-[#f8f7f7] py-8 text-xs text-center text-[#646262]">
          <div class="max-w-7xl mx-auto px-4 space-y-2">
            <p class="font-bold text-[#201d1d]">눈히어로.com (SNSHero.com)</p>
            <p>원클릭 AI 웹 카드 게임 &amp; 40부작 공식 판타지 웹소설·웹툰 플랫폼</p>
            <p class="text-[11px] text-stone-400">OpenCode Flat Terminal Design System · LocalStorage Persistent</p>
          </div>
        </footer>
      </div>
    `;

    // Event binding
    const headerSlot = this.root.querySelector('#landing-header-slot') as HTMLElement;
    if (headerSlot) {
      bindHeaderEvents(headerSlot, {
        activeView,
        onNavigate: (v) => this.setView(v),
        onOpenModal: (m) => this.openModal(m),
        onToggleDrawer: () => this.toggleDrawer(),
      });
    }

    const sidebarSlot = this.root.querySelector('#landing-sidebar-slot') as HTMLElement;
    if (sidebarSlot) {
      bindSidebarEvents(sidebarSlot, {
        isOpen: isDrawerOpen,
        activeView,
        onNavigate: (v) => this.setView(v),
        onOpenModal: (m) => this.openModal(m),
        onClose: () => this.toggleDrawer(false),
      });
    }

    const modalsSlot = this.root.querySelector('#landing-modals-slot') as HTMLElement;
    if (modalsSlot && activeModal) {
      bindModalEvents(modalsSlot, {
        activeModal,
        onClose: () => this.closeModal(),
      });
    }
  }

  private renderActiveViewStub(view: ViewKey): string {
    const titles: Record<ViewKey, string> = {
      home: '눈히어로 공식 홈 (Home)',
      deck: '마이덱 (My Deck)',
      play: '플레이 (Play Theater)',
      card: '카드 수집 및 육성 (Card Collection & Nurture)',
      shop: '카드 상점 (Card Shop)',
    };

    return `
      <section class="border border-[rgba(15,0,0,0.12)] p-6 bg-white shadow-xs rounded-none">
        <div class="flex items-center justify-between mb-4 pb-3 border-b border-[rgba(15,0,0,0.08)]">
          <h1 class="text-base font-bold text-[#201d1d]">${titles[view] || view}</h1>
          <span class="text-xs px-2 py-0.5 bg-[#f1eeee] text-[#646262] rounded-sm">View: [${view}]</span>
        </div>
        <p class="text-xs text-stone-600 mb-6">
          이 섹션은 Milestone 3에서 완전한 반응형 인터랙션 및 카드 육성 시스템으로 구현됩니다.
        </p>
        <a href="/home" class="inline-block px-4 py-2 bg-[#201d1d] text-[#fdfcfc] text-xs font-bold rounded-sm min-h-[44px] leading-[24px]">
          지금 게임 플레이하기 (/home) →
        </a>
      </section>
    `;
  }
}

function mountLanding(): void {
  const root = document.getElementById('landing-root') || document.getElementById('root');
  if (!root) return;

  const app = new LandingApp(root);
  app.init();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountLanding);
} else {
  mountLanding();
}
```

---

## 5. Verification Method

### 5.1 Verification Commands
The implementer can verify the implementation directly using the automated test suite:

1. **Milestone 2 Target E2E Assertions (All 13 Tests)**:
   ```bash
   npx tsx tests/e2e/run_all.ts --milestone M2
   ```
   **Acceptance Target**: 13 assertions run, 13 PASS (100.0% Pass Rate).

2. **TypeScript Compilation & Static Type Checking**:
   ```bash
   npx tsc --noEmit
   ```
   **Acceptance Target**: Exit code 0 (zero errors).

3. **Production Standalone Static Build Verification**:
   ```bash
   npm run build
   ```
   **Acceptance Target**: Exit code 0, generates clean `dist/index.html` without `vendor-react` script tags.

4. **Full 4-Tier Master E2E Suite Run**:
   ```bash
   npx tsx tests/e2e/run_all.ts --milestone M1
   ```
   **Acceptance Target**: Milestone 1 regression check remains 100% PASS.

### 5.2 Invalidation Conditions
The implementation shall be considered invalid if:
- Any of the exact 6 Top Nav items or 8 Side Nav items is omitted or misspelled.
- Any interactive button fails the `min-h-[44px]` touch target requirement.
- React runtime (`react`, `react-dom`, `vendor-react`) is imported or bundled into `dist/index.html`.
- Any initial onboarding modal, alert, or prompt is triggered automatically upon loading the landing page.
- Side drawer fails to close upon backdrop click, close button `[x]`, or Escape key press.
