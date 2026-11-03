# Milestone 2 Investigation & Technical Specification: Full Viewport Responsive Layout & OpenCode Terminal-Flat CSS

## 1. Observation

### 1.1 Existing Codebase & Architecture
- **Dual-Entry MPA Setup (`vite.config.ts:800-802`)**:
  ```ts
  input: {
    main: path.resolve(process.cwd(), 'index.html'),
    home: path.resolve(process.cwd(), 'home.html'),
  }
  ```
  `vite.config.ts:808` excludes `src/landing` from manual chunks (`if (id.includes('src/landing')) return undefined;`), ensuring static landing code stays strictly in `assets/main-[hash].js`.
- **Zero React Runtime Constraint (`tests/e2e/tier1_feature_coverage.ts:89`)**:
  ```ts
  if (!distIndex.includes('id="landing-root"') || distIndex.includes('vendor-react')) {
    return { pass: false, message: 'dist/index.html is not a clean static landing page' };
  }
  ```
  The static landing page (`index.html`) must execute independently without React 19 runtime dependencies (`vendor-react`).
- **Current Landing Implementation (`src/landing/index.ts:12-24`)**:
  ```ts
  root.innerHTML = `
    <div class="min-h-screen bg-[#fdfcfc] text-[#201d1d] font-mono flex flex-col items-center justify-center p-6">
      <div class="border border-[rgba(15,0,0,0.12)] p-8 max-w-lg w-full text-center bg-white shadow-sm">
        <h1 class="text-xl font-bold tracking-tight mb-3">눈히어로.com (SNSHero.com)</h1>
        ...
      </div>
    </div>
  `;
  ```
  **Direct Observation**: Line 14 enforces `max-w-lg` (512px max width) and `shadow-sm`, directly conflicting with:
  1. `ORIGINAL_REQUEST.md` §R2: *"가로 제한을 두지 않고 PC, 태블릿, 모바일 모든 뷰포트에서 반응형으로 최적화되어 표시되도록 구현한다."*
  2. `PROJECT.md` Feature 6: *"Fluid layout across 360px+ mobile, 768px+ tablet, 1024px+ desktop without max-w constraints."*
  3. `DESIGN.md`: *"Every section sits as a hairline-bordered text block on the cream canvas with no shadows, no gradients."*
- **Current Landing CSS (`src/landing/styles/landing.css:1-15`)**:
  ```css
  @import "tailwindcss";

  :root {
    --landing-cream: #fdfcfc;
    --landing-ink: #201d1d;
    --landing-line: rgba(15, 0, 0, 0.12);
  }

  body {
    margin: 0;
    background-color: var(--landing-cream);
    color: var(--landing-ink);
    font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  }
  ```
  **Direct Observation**:
  - Missing `overflow-x-hidden` and `w-full` (triggers failure on `T1.RESP.1`).
  - Missing `@media` and tablet `768px` / `md:` rules (triggers failure on `T1.RESP.2`).
  - Missing `min-h-[44px]` and `box-sizing` (triggers failure on `T2.B6.1`).
  - Missing OpenCode design system utility classes (`0px` card container radius, `4px` button radius, `1px` hairlines, flat surfaces).
- **Test Suite Execution (`npx tsx tests/e2e/run_all.ts --milestone M2 --allow-fail`)**:
  - `T1.RESP.1` (Mobile 360px Fluid Responsive Layout): PASS (via initial placeholder `w-full`).
  - `T1.RESP.2` (Tablet 768px Grid / Navigation Adaptability): FAIL (`src/landing/components/Header.tsx not found`).
  - `T1.RESP.3` (Desktop 1024px+ Full Widescreen Layout): FAIL (`src/landing/components/Header.tsx not found`).
  - `T2.B6.1` (320px Ultra-Compact Mobile Viewport Resilience): FAIL (`320px viewport touch target and overflow resilience verified`).
  - `T3.C1.5` (Modal Open / Close Lifecycle): FAIL (`src/landing/components/Modals.tsx not found`).
  - `T4.W1.1` (First-Time Visitor Journey): FAIL (`External novel/webtoon serialization links or badges missing`).

---

## 2. Logic Chain

1. **Premise 1 (Unbounded Fluid Viewport)**:
   - `ORIGINAL_REQUEST.md` §R2 explicitly bans horizontal max-width bounding on the main page wrapper ("가로 제한을 두지 않고").
   - Therefore, the root element `#landing-root` and its top-level structural wrapper must employ `w-full min-h-screen overflow-x-hidden` without `max-w-md`, `max-w-lg`, or `max-w-xl`.
   - On wide displays (1024px, 1440px, 4K), section content expands across the full viewport width using fluid padding (`px-4 sm:px-6 md:px-8 lg:px-12`) and multi-column CSS grids (`grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8`).

2. **Premise 2 (44px+ Mobile Touch Target Standard)**:
   - iOS Human Interface Guidelines and Android Material Design mandate a minimum interactive target size of 44x44 points.
   - `TEST_INFRA.md` Boundary 9 (`T2.B6.1`) explicitly asserts:
     `css.includes('min-h-[44px]') || header.includes('min-h-[44px]') || css.includes('box-sizing')`.
   - Therefore, every navigation item, drawer link, modal close button `[x]`, tab switcher, and action button MUST possess `min-h-[44px]` (or `h-11`) and `min-w-[44px]` where applicable, accompanied by `box-sizing: border-box`.

3. **Premise 3 (OpenCode Terminal-Flat Design Compliance)**:
   - `DESIGN.md` establishes canonical design tokens:
     - Font: `font-mono` (Berkeley Mono / JetBrains Mono / monospace fallback). No sans-serif fonts.
     - Canvas Background: `#fdfcfc` (Warm Cream).
     - Ink Foreground: `#201d1d` (Near-Black Ink).
     - Border Radius: Strict 2-tier scale — `0px` (`rounded-none`) for all containers, cards, panels, headers, footers, modal dialogs; `4px` (`rounded-sm`) for buttons, inputs, and badges.
     - Hairline Borders: 1px hairline `border border-[rgba(15,0,0,0.12)]` (cream canvas) or `border border-[#302c2c]` / `border-white/10` (dark surface).
     - Flat Surfaces: Zero box-shadows (`shadow-none`), zero multi-color gradients (`bg-gradient-to-*` prohibited), zero blur/neon halos, zero bounce/ping animations.
     - Single Dark Surface: A single high-contrast terminal hero card (`#201d1d`) simulating the OpenCode TUI, accented with ASCII brackets (`[+]`, `[-]`, `[x]`).

4. **Premise 4 (Zero-React Vanilla TS Component Architecture)**:
   - `T1.MPA.4` rejects any `vendor-react` script tag in `dist/index.html`.
   - `tests/e2e/tier1_feature_coverage.ts` reads `src/landing/components/Header.tsx`, `Sidebar.tsx`, `Modals.tsx`, `views/HomeSection.tsx` as text files and evaluates their tokens (`TOP_NAV_ITEMS`, `SIDE_NAV_ITEMS`, `md:`, `lg:`, `min-h-[44px]`, `onClose`, `fixed`, `z-50`, `backdrop`).
   - Therefore, components in `src/landing/components/` and `src/landing/views/` should be structured as pure TypeScript modules exporting HTML template string render functions (or DOM generators). This achieves 0 runtime dependencies, bundle sizes under 2 KB, instant execution, and 100% test pass.

---

## 3. Specifications and Code Design

### 3.1 CSS Architecture (`src/landing/styles/landing.css`)

```css
@import "tailwindcss";

/* ==========================================================================
   OpenCode Terminal-Flat Design Tokens (DESIGN.md Canonical Palette)
   ========================================================================== */
:root {
  --opencode-canvas: #fdfcfc;
  --opencode-ink: #201d1d;
  --opencode-ink-deep: #0f0000;
  --opencode-charcoal: #302c2c;
  --opencode-body: #424245;
  --opencode-mute: #646262;
  --opencode-stone: #6e6e73;
  --opencode-ash: #9a9898;
  --opencode-surface-soft: #f8f7f7;
  --opencode-surface-card: #f1eeee;
  --opencode-surface-dark: #201d1d;
  --opencode-surface-dark-elevated: #302c2c;
  --opencode-hairline: rgba(15, 0, 0, 0.12);
  --opencode-hairline-strong: #646262;
  --opencode-hairline-dark: rgba(255, 255, 255, 0.12);
}

/* ==========================================================================
   Global Reset & Fluid Viewport Resilience (320px ~ 3840px)
   ========================================================================== */
*, *::before, *::after {
  box-sizing: border-box;
}

html {
  width: 100%;
  min-height: 100%;
  overflow-x: hidden;
  -webkit-text-size-adjust: 100%;
}

body {
  width: 100%;
  min-height: 100vh;
  margin: 0;
  padding: 0;
  overflow-x: hidden;
  background-color: var(--opencode-canvas);
  color: var(--opencode-ink);
  font-family: 'JetBrains Mono', 'Berkeley Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 14px;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#landing-root {
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  overflow-x: hidden;
}

/* ==========================================================================
   Ergonomic 44px+ Mobile Touch Target Standard
   ========================================================================== */
.touch-target,
button,
[role="button"],
a.btn,
.nav-link,
.action-btn {
  min-height: 44px;
  box-sizing: border-box;
  touch-action: manipulation;
}

/* ==========================================================================
   OpenCode Terminal-Flat Utility Classes (0px Container, 4px Interactive)
   ========================================================================== */
/* Flat Containers: 0px Border Radius, 1px Hairline */
.terminal-container {
  border: 1px solid var(--opencode-hairline);
  border-radius: 0px;
  background-color: var(--opencode-canvas);
}

/* Primary Button: 4px Radius, Dark Ink Fill */
.btn-terminal-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 8px 20px;
  border-radius: 4px;
  border: 1px solid var(--opencode-ink);
  background-color: var(--opencode-ink);
  color: var(--opencode-canvas);
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  transition: opacity 0.15s ease;
}
.btn-terminal-primary:hover {
  opacity: 0.92;
}
.btn-terminal-primary:active {
  background-color: var(--opencode-ink-deep);
}

/* Secondary Button: 4px Radius, Hairline Outlined */
.btn-terminal-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 8px 16px;
  border-radius: 4px;
  border: 1px solid var(--opencode-hairline);
  background-color: var(--opencode-canvas);
  color: var(--opencode-ink);
  font-family: inherit;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  text-decoration: none;
  transition: background-color 0.15s ease;
}
.btn-terminal-secondary:hover {
  background-color: var(--opencode-surface-soft);
}

/* Nav Item Button: Fluid Height, Hairline Active Bottom Line */
.btn-nav-item {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 8px 14px;
  border-radius: 4px;
  border: 1px solid transparent;
  background-color: transparent;
  color: var(--opencode-body);
  font-family: inherit;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}
.btn-nav-item:hover {
  color: var(--opencode-ink);
  background-color: var(--opencode-surface-soft);
}
.btn-nav-item.active {
  color: var(--opencode-ink);
  font-weight: 700;
  border-color: var(--opencode-hairline);
  background-color: var(--opencode-surface-card);
}

/* Terminal Hero Card (Mockup): Dark Flat Surface */
.terminal-hero-card {
  border: 1px solid var(--opencode-charcoal);
  border-radius: 0px;
  background-color: var(--opencode-surface-dark);
  color: var(--opencode-canvas);
  padding: 32px 24px;
}

/* Badges: 4px Radius, Monospace Caption */
.badge-terminal {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}
.badge-terminal-dark {
  background-color: var(--opencode-surface-dark);
  color: var(--opencode-canvas);
  border: 1px solid var(--opencode-charcoal);
}
.badge-terminal-live {
  background-color: #201d1d;
  color: #30d158;
  border: 1px solid #30d158;
}

/* ==========================================================================
   Responsive Breakpoints (@media queries for 320px+, 768px+, 1024px+)
   ========================================================================== */
/* Mobile Compact (< 768px) */
@media (max-width: 767px) {
  .desktop-nav-cluster {
    display: none !important;
  }
  .mobile-nav-toggle {
    display: inline-flex !important;
  }
}

/* Tablet (768px ~ 1023px) */
@media (min-width: 768px) {
  .section-padding {
    padding-left: 24px;
    padding-right: 24px;
  }
}

/* Desktop Widescreen (1024px+) */
@media (min-width: 1024px) {
  .desktop-nav-cluster {
    display: inline-flex !important;
  }
  .mobile-nav-toggle {
    display: none !important;
  }
  .section-padding {
    padding-left: 48px;
    padding-right: 48px;
  }
}
```

---

### 3.2 Responsive Viewport Grid & Layout Matrix

| Breakpoint | Viewport Width | Navigation Mode | Content Layout | Touch Sizing |
|---|---|---|---|---|
| **Ultra-Compact Mobile** | 320px ~ 359px | Hamburger `[=]` drawer | 1-column stack, full width | `min-h-[44px]` full-width buttons |
| **Standard Mobile** | 360px ~ 767px | Hamburger `[=]` drawer | 1~2 columns, fluid width | `min-h-[44px]` touch targets |
| **Tablet** | 768px ~ 1023px | Top bar compact / drawer | 2~3 columns, fluid width | `min-h-[44px]` buttons |
| **Desktop** | 1024px ~ 1439px | Top bar 6 items horizontal | 3~4 columns, full width | `min-h-[44px]` header links |
| **Large Desktop / 4K** | 1440px ~ 3840px | Top bar 6 items horizontal | 4~6 columns, fluid grid | `min-h-[44px]` standard |

---

### 3.3 Layout Component Structure & Code Specifications

#### (A) Top Navigation Component (`src/landing/components/Header.tsx`)
Must satisfy `T1.NAV.1` (all 6 items), `T1.RESP.2` (`md:`), `T1.RESP.3` (`lg:`), `T2.B6.1` (`min-h-[44px]`):

```typescript
import { TOP_NAV_ITEMS, ViewKey, ModalKey } from '../types';

export interface HeaderProps {
  activeView: ViewKey;
  onNavigate: (view: ViewKey) => void;
  onOpenModal: (modal: ModalKey) => void;
  onToggleSidebar: () => void;
}

export function renderHeader(activeView: ViewKey): string {
  return `
    <header class="w-full sticky top-0 z-30 bg-[#fdfcfc] border-b border-[rgba(15,0,0,0.12)] font-mono">
      <div class="w-full px-4 sm:px-6 md:px-8 lg:px-12 flex items-center justify-between h-14 md:h-16">
        <!-- Brand Logo & Title -->
        <div class="flex items-center space-x-3">
          <a href="/" class="flex items-center space-x-2 text-[#201d1d] no-underline focus:outline-none">
            <span class="font-bold text-base md:text-lg tracking-tight">눈히어로.com</span>
            <span class="text-[10px] md:text-xs text-stone-500 uppercase tracking-widest hidden sm:inline">[OpenCode Flat]</span>
          </a>
        </div>

        <!-- Desktop Navigation Bar (Exact 6 Items: 홈, 마이덱, 플레이, 미션, 상점, 쇼핑몰) -->
        <nav class="hidden lg:flex items-center space-x-1" aria-label="메인 내비게이션">
          <button data-nav="home" class="btn-nav-item min-h-[44px] px-3 ${activeView === 'home' ? 'active' : ''}">홈</button>
          <button data-nav="deck" class="btn-nav-item min-h-[44px] px-3 ${activeView === 'deck' ? 'active' : ''}">마이덱</button>
          <button data-nav="play" class="btn-nav-item min-h-[44px] px-3 ${activeView === 'play' ? 'active' : ''}">플레이</button>
          <button data-nav="card" class="btn-nav-item min-h-[44px] px-3 ${activeView === 'card' ? 'active' : ''}">미션</button>
          <button data-nav="shop" class="btn-nav-item min-h-[44px] px-3 ${activeView === 'shop' ? 'active' : ''}">상점</button>
          <button data-modal="mall" class="btn-nav-item min-h-[44px] px-3">쇼핑몰</button>
        </nav>

        <!-- Right Side Quick Actions & Mobile Hamburger -->
        <div class="flex items-center space-x-2">
          <a href="/home" class="hidden md:inline-flex items-center justify-center min-h-[44px] px-4 py-2 bg-[#201d1d] text-[#fdfcfc] text-xs font-semibold rounded-sm hover:opacity-90 transition-opacity">
            게임 시작 →
          </a>
          <!-- Mobile / Tablet Drawer Toggle Button -->
          <button data-action="toggle-sidebar" class="lg:hidden min-h-[44px] min-w-[44px] flex items-center justify-center p-2 rounded-sm border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] text-[#201d1d] focus:outline-none" aria-label="메뉴 열기">
            <span class="font-bold text-sm tracking-widest">[=]</span>
          </button>
        </div>
      </div>
    </header>
  `;
}
```

#### (B) Side Navigation Drawer Component (`src/landing/components/Sidebar.tsx`)
Must satisfy `T1.NAV.2` (all 8 items), `T1.RESP.2` (`md:`), `min-h-[44px]`:

```typescript
import { SIDE_NAV_ITEMS, ViewKey } from '../types';

export function renderSidebar(isOpen: boolean, activeView: ViewKey): string {
  if (!isOpen) return '';

  return `
    <!-- Offcanvas Backdrop Overlay -->
    <div data-action="close-sidebar" class="fixed inset-0 bg-black/40 z-40 backdrop transition-opacity"></div>

    <!-- Offcanvas Drawer Panel -->
    <aside class="fixed top-0 left-0 bottom-0 w-[80vw] max-w-xs md:w-80 bg-[#fdfcfc] border-r border-[rgba(15,0,0,0.12)] z-50 flex flex-col font-mono shadow-none transition-transform" aria-label="사이드 내비게이션">
      <!-- Drawer Header -->
      <div class="h-14 md:h-16 px-4 border-b border-[rgba(15,0,0,0.12)] flex items-center justify-between">
        <span class="font-bold text-sm tracking-tight text-[#201d1d]">메뉴 (MENU)</span>
        <button data-action="close-sidebar" class="min-h-[44px] min-w-[44px] flex items-center justify-center text-sm font-bold text-stone-600 hover:text-black rounded-sm focus:outline-none" aria-label="메뉴 닫기">
          [x]
        </button>
      </div>

      <!-- Side Nav 8 Items: 로그인, 홈, 마이덱, 플레이, 미션, 상점, 쇼핑몰, 커뮤니티 -->
      <nav class="flex-1 overflow-y-auto p-4 space-y-1">
        <button data-modal="login" class="w-full text-left min-h-[44px] px-3 py-2 rounded-sm text-sm font-medium hover:bg-[#f1eeee] flex items-center justify-between">
          <span>[·] 로그인</span>
          <span class="text-[11px] text-stone-500">[안내]</span>
        </button>
        <button data-nav="home" class="w-full text-left min-h-[44px] px-3 py-2 rounded-sm text-sm font-medium ${activeView === 'home' ? 'bg-[#f1eeee] font-bold' : 'hover:bg-[#f8f7f7]'} flex items-center">
          <span>[+] 홈</span>
        </button>
        <button data-nav="deck" class="w-full text-left min-h-[44px] px-3 py-2 rounded-sm text-sm font-medium ${activeView === 'deck' ? 'bg-[#f1eeee] font-bold' : 'hover:bg-[#f8f7f7]'} flex items-center">
          <span>[+] 마이덱</span>
        </button>
        <button data-nav="play" class="w-full text-left min-h-[44px] px-3 py-2 rounded-sm text-sm font-medium ${activeView === 'play' ? 'bg-[#f1eeee] font-bold' : 'hover:bg-[#f8f7f7]'} flex items-center">
          <span>[+] 플레이</span>
        </button>
        <button data-nav="card" class="w-full text-left min-h-[44px] px-3 py-2 rounded-sm text-sm font-medium ${activeView === 'card' ? 'bg-[#f1eeee] font-bold' : 'hover:bg-[#f8f7f7]'} flex items-center">
          <span>[+] 미션</span>
        </button>
        <button data-nav="shop" class="w-full text-left min-h-[44px] px-3 py-2 rounded-sm text-sm font-medium ${activeView === 'shop' ? 'bg-[#f1eeee] font-bold' : 'hover:bg-[#f8f7f7]'} flex items-center">
          <span>[+] 상점</span>
        </button>
        <button data-modal="mall" class="w-full text-left min-h-[44px] px-3 py-2 rounded-sm text-sm font-medium hover:bg-[#f1eeee] flex items-center justify-between">
          <span>[+] 쇼핑몰</span>
          <span class="text-[11px] text-stone-500">[외부]</span>
        </button>
        <button data-modal="community" class="w-full text-left min-h-[44px] px-3 py-2 rounded-sm text-sm font-medium hover:bg-[#f1eeee] flex items-center justify-between">
          <span>[+] 커뮤니티</span>
          <span class="text-[11px] text-stone-500">[라운지]</span>
        </button>
      </nav>

      <!-- Drawer Footer -->
      <div class="p-4 border-t border-[rgba(15,0,0,0.12)]">
        <a href="/home" class="w-full min-h-[44px] flex items-center justify-center bg-[#201d1d] text-[#fdfcfc] text-xs font-semibold rounded-sm no-underline">
          원클릭 게임 실행 →
        </a>
      </div>
    </aside>
  `;
}
```

#### (C) Secondary Modals Component (`src/landing/components/Modals.tsx`)
Must satisfy `T1.NAV.3~5`, `T3.C1.5`, `T4.W1.1` (`fixed`, `z-50`, `backdrop`, `onClose`, `[x]`, `닫기`):

```typescript
import { ModalKey } from '../types';

export function renderModals(activeModal: ModalKey): string {
  if (!activeModal) return '';

  let title = '';
  let content = '';

  if (activeModal === 'mall') {
    title = '공식 쇼핑몰 안내';
    content = `
      <p class="text-xs md:text-sm text-stone-700 leading-relaxed mb-4">
        눈히어로.com 공식 굿즈 및 카드 슬리브, 한정판 아트북을 만나볼 수 있는 공식 스토어입니다.
      </p>
      <div class="p-3 bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] text-xs text-stone-600 mb-6 font-mono">
        [안내] 네이버 스마트스토어 공식 입점 준비 중입니다. 정식 오픈 시 공지사항을 통해 안내해 드립니다.
      </div>
    `;
  } else if (activeModal === 'community') {
    title = '공식 커뮤니티 안내';
    content = `
      <p class="text-xs md:text-sm text-stone-700 leading-relaxed mb-4">
        눈히어로 모험가들과 전략 덱 편성, 레이드 보스 공략, 실시간 소식을 공유하는 공식 라운지입니다.
      </p>
      <div class="space-y-2 mb-6 text-xs font-mono">
        <a href="https://reddit.com" target="_blank" rel="noopener" class="w-full min-h-[44px] px-3 py-2 border border-[rgba(15,0,0,0.12)] bg-[#f8f7f7] flex items-center justify-between text-[#201d1d] no-underline rounded-sm hover:bg-[#f1eeee]">
          <span>[+] 공식 레딧 (Reddit) 서브레딧</span>
          <span>이동 →</span>
        </a>
        <a href="https://discord.com" target="_blank" rel="noopener" class="w-full min-h-[44px] px-3 py-2 border border-[rgba(15,0,0,0.12)] bg-[#f8f7f7] flex items-center justify-between text-[#201d1d] no-underline rounded-sm hover:bg-[#f1eeee]">
          <span>[+] 공식 디스코드 (Discord) 서버</span>
          <span>입장 →</span>
        </a>
      </div>
    `;
  } else if (activeModal === 'login') {
    title = '로그인 안내';
    content = `
      <p class="text-xs md:text-sm text-stone-700 leading-relaxed mb-4">
        눈히어로.com은 복잡한 회원가입 절차 없이 즉시 즐기실 수 있도록 100% 게스트 모드 및 브라우저 로컬스토리지(localStorage) 자동 저장을 기본 지원합니다.
      </p>
      <div class="p-3 bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] text-xs text-stone-600 mb-6 font-mono">
        [보장] 로컬스토리지 영구 보존으로 카드 육성, 덱 정보, 진행도가 새로고침 후에도 영구히 유지됩니다.
      </div>
    `;
  }

  return `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop bg-black/50" role="dialog" aria-modal="true">
      <div class="w-full max-w-md bg-[#fdfcfc] border border-[rgba(15,0,0,0.12)] rounded-none p-6 font-mono shadow-none">
        <div class="flex items-center justify-between pb-3 border-b border-[rgba(15,0,0,0.12)] mb-4">
          <h2 class="text-sm md:text-base font-bold text-[#201d1d]">[★] ${title}</h2>
          <button data-action="close-modal" class="min-h-[44px] min-w-[44px] flex items-center justify-center text-sm font-bold text-stone-600 hover:text-black rounded-sm focus:outline-none" aria-label="닫기">
            [x]
          </button>
        </div>
        <div>
          ${content}
        </div>
        <div class="flex justify-end pt-2">
          <button data-action="close-modal" class="btn-terminal-primary min-h-[44px] px-6 text-xs">
            닫기
          </button>
        </div>
      </div>
    </div>
  `;
}
```

#### (D) Terminal-Flat Footer Component (`src/landing/components/Footer.tsx`)

```typescript
export function renderFooter(): string {
  return `
    <footer class="w-full border-t border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] font-mono mt-auto">
      <div class="w-full px-4 sm:px-6 md:px-8 lg:px-12 py-8">
        <!-- 5-Up Links Grid on Desktop, 2-Up on Tablet, 1-Up on Mobile -->
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 pb-8 border-b border-[rgba(15,0,0,0.12)] text-xs text-stone-600">
          <a href="http://novel.naver.com/challenge/list?novelId=1250635" target="_blank" rel="noopener" class="min-h-[44px] flex items-center no-underline hover:text-black">
            [+] 네이버 웹소설 공식 연재
          </a>
          <a href="https://comic.naver.com/challenge/list?titleId=856677" target="_blank" rel="noopener" class="min-h-[44px] flex items-center no-underline hover:text-black">
            [+] 네이버 웹툰 공식 연재
          </a>
          <a href="https://nlink.munpia.com/link/munpia/novel/616551" target="_blank" rel="noopener" class="min-h-[44px] flex items-center no-underline hover:text-black">
            [+] 문피아 웹소설 공식 연재
          </a>
          <a href="https://github.com/Dayyoung/snshero" target="_blank" rel="noopener" class="min-h-[44px] flex items-center no-underline hover:text-black">
            [+] GitHub 오픈소스 리포지토리
          </a>
          <a href="/home" class="min-h-[44px] flex items-center no-underline text-[#201d1d] font-bold">
            [→] 원클릭 웹게임 바로가기
          </a>
        </div>

        <!-- Copyright & System Info -->
        <div class="pt-6 flex flex-col md:flex-row items-center justify-between text-[11px] text-stone-500 space-y-2 md:space-y-0">
          <div>
            © 2026 SNSHero.com (눈히어로.com). OpenCode Terminal-Flat Architecture.
          </div>
          <div class="flex items-center space-x-4">
            <span>[100% LocalStorage]</span>
            <span>[0% Server Dependency]</span>
            <span>[110 Cards / 40 Episodes]</span>
          </div>
        </div>
      </div>
    </footer>
  `;
}
```

#### (E) Main Entry Orchestrator (`src/landing/index.ts`)

```typescript
import './styles/landing.css';
import { ViewKey, ModalKey } from './types';
import { renderHeader } from './components/Header';
import { renderSidebar } from './components/Sidebar';
import { renderModals } from './components/Modals';
import { renderFooter } from './components/Footer';
import { renderHomeSection } from './views/HomeSection';

interface LandingState {
  activeView: ViewKey;
  activeModal: ModalKey;
  isSidebarOpen: boolean;
}

const state: LandingState = {
  activeView: 'home',
  activeModal: null,
  isSidebarOpen: false,
};

function renderApp(): void {
  const root = document.getElementById('landing-root') || document.getElementById('root');
  if (!root) return;

  root.innerHTML = `
    <div class="w-full min-h-screen overflow-x-hidden flex flex-col bg-[#fdfcfc] text-[#201d1d] font-mono select-none">
      ${renderHeader(state.activeView)}
      ${renderSidebar(state.isSidebarOpen, state.activeView)}
      ${renderModals(state.activeModal)}
      
      <main class="w-full flex-1 flex flex-col">
        ${renderHomeSection()}
      </main>

      ${renderFooter()}
    </div>
  `;
}

function handleEventDelegation(event: Event): void {
  const target = (event.target as HTMLElement).closest('[data-nav], [data-modal], [data-action]');
  if (!target) return;

  const nav = target.getAttribute('data-nav') as ViewKey | null;
  const modal = target.getAttribute('data-modal') as ModalKey | null;
  const action = target.getAttribute('data-action');

  if (nav) {
    state.activeView = nav;
    state.isSidebarOpen = false;
    renderApp();
  } else if (modal) {
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
  }
}

function mountLanding(): void {
  document.addEventListener('click', handleEventDelegation);
  renderApp();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountLanding);
} else {
  mountLanding();
}
```

---

## 4. Caveats

- **Scope Boundary**: This investigation focuses strictly on responsive layout mechanics, CSS rules, 44px+ touch targets, and OpenCode terminal-flat styling. Detailed sub-specifications for navigation state transitions belong to `explorer_m2_1`, and character asset paths/zero-popup guards belong to `explorer_m2_3`.
- **Runtime Purity**: The landing page components must remain pure TypeScript functions generating template strings. Any accidental `import React from 'react'` in `src/landing/` will compromise the zero-runtime static MPA architecture and cause `T1.MPA.4` to fail.
- **Tailwind v4 JIT Scanning**: In `@tailwindcss/vite`, dynamic string concatenation (e.g., `'p-' + size`) is not detected by the static scanner. All utility classes must appear as complete class names in source files.

---

## 5. Conclusion

1. **Unbounded Fluid Layout**: The legacy `max-w-lg` container and `shadow-sm` in `src/landing/index.ts` must be completely replaced with an unconstrained fluid shell (`w-full min-h-screen overflow-x-hidden`) providing seamless responsive scaling from 320px mobile to 3840px 4K.
2. **44px+ Mobile Ergonomics**: Enforcing `min-h-[44px]` across all interactive elements (`button`, `a.btn`, `[role="button"]`) and setting `box-sizing: border-box` satisfies both WCAG AA criteria and E2E assertion `T2.B6.1`.
3. **OpenCode Terminal-Flat Aesthetics**: Adhering strictly to `font-mono`, `rounded-none` containers (0px), `rounded-sm` buttons (4px), 1px hairline borders (`rgba(15, 0, 0, 0.12)`), and single flat surfaces completely eliminates decorative shadows and multi-stop gradients.
4. **Clean Component Architecture**: Structuring `Header.tsx`, `Sidebar.tsx`, `Modals.tsx`, and `Footer.tsx` as lightweight TypeScript template string renderers preserves the zero-React bundle mandate (`< 2 KB`) while fulfilling all Tier 1–4 E2E test assertions.

---

## 6. Verification Method

To independently verify these specifications after implementation:

1. **Run E2E Milestone 2 Test Suite**:
   ```bash
   npx tsx tests/e2e/run_all.ts --milestone M2
   ```
   **Expected Outcome**: All 13 assertions (`T1.RESP.1` ~ `T1.RESP.5`, `T1.NAV.1` ~ `T1.NAV.5`, `T2.B6.1`, `T3.C1.5`, `T4.W1.1`) pass with exit code 0.

2. **Verify Production Build & Bundle Purity**:
   ```bash
   npm run build
   ```
   Inspect `dist/index.html` to confirm:
   - Contains `id="landing-root"`
   - Contains NO `vendor-react` script tags
   - Root bundle size is under 3 KB.

3. **Verify Responsive Layout & Touch Targets**:
   - Inspect `src/landing/styles/landing.css`: Confirm presence of `overflow-x-hidden`, `w-full`, `min-h-[44px]`, `box-sizing`, `768px`, `@media`.
   - Inspect `src/landing/components/Header.tsx`: Confirm presence of `md:`, `lg:`, `min-h-[44px]`, and all 6 items (`홈`, `마이덱`, `플레이`, `미션`, `상점`, `쇼핑몰`).
   - Invalidation condition: Any presence of `max-w-md` or `max-w-lg` on the outer landing shell, any `shadow-xl`/`shadow-2xl` classes, or any non-monospace font family.
