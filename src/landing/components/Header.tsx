/**
 * src/landing/components/Header.tsx
 *
 * Top navigation component adhering to OpenCode Terminal-Flat design.
 * Features exact 6 navigation items: 홈, 마이덱, 플레이, 미션, 상점, 쇼핑몰.
 * Includes md: and lg: responsive utilities and 44px+ touch targets.
 * Pure TypeScript template string generator (Zero React runtime).
 */

import { ViewKey, ModalKey, TOP_NAV_ITEMS } from '../types';

export interface HeaderProps {
  activeView: ViewKey;
  onNavigate?: (view: ViewKey) => void;
  onOpenModal?: (modal: ModalKey) => void;
  onToggleSidebar?: () => void;
}

interface NavItemDef {
  key: ViewKey | 'mall';
  label: (typeof TOP_NAV_ITEMS)[number];
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

export function renderHeader(activeView: ViewKey): string {
  const navItemsHtml = TOP_NAV_DEFS.map((item) => {
    const isActive = !item.isModal && activeView === item.key;
    const activeClass = isActive
      ? 'bg-[#201d1d] text-[#fdfcfc]'
      : 'text-[#646262] hover:text-[#201d1d] hover:bg-[#f1eeee]';

    if (item.isModal) {
      return `
        <button
          type="button"
          data-modal="${item.key}"
          class="nav-item-btn px-3 py-2 text-xs font-semibold rounded-sm transition-colors min-h-[44px] flex items-center justify-center ${activeClass}"
          aria-label="${item.label} 모달 열기"
        >
          ${item.label}
        </button>
      `;
    }

    return `
      <button
        type="button"
        data-nav="${item.key}"
        class="nav-item-btn px-3 py-2 text-xs font-semibold rounded-sm transition-colors min-h-[44px] flex items-center justify-center ${activeClass}"
        aria-current="${isActive ? 'page' : 'false'}"
        aria-label="${item.label} 섹션 이동"
      >
        ${item.label}
      </button>
    `;
  }).join('');

  return `
    <header class="sticky top-0 z-30 w-full bg-[#fdfcfc]/95 border-b border-[rgba(15,0,0,0.12)] backdrop-blur-sm font-mono">
      <div class="w-full px-4 sm:px-6 md:px-8 lg:px-12 h-14 md:h-16 min-h-[44px] flex items-center justify-between">
        <!-- Brand & Logo -->
        <div class="flex items-center gap-3">
          <button
            type="button"
            data-action="toggle-sidebar"
            class="lg:hidden p-2 rounded-sm text-[#201d1d] border border-[rgba(15,0,0,0.12)] hover:bg-[#f1eeee] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="사이드 메뉴 열기"
          >
            <span class="text-sm font-bold tracking-widest">[=]</span>
          </button>
          <a href="#home" data-nav="home" class="brand-link flex items-center gap-2 text-sm md:text-base font-bold tracking-tight text-[#201d1d] min-h-[44px] no-underline">
            <span class="w-2.5 h-2.5 bg-[#201d1d] rounded-none inline-block"></span>
            <span>눈히어로.com</span>
            <span class="hidden md:inline-block text-[11px] font-normal text-[#646262] border border-[rgba(15,0,0,0.12)] px-1.5 py-0.5 rounded-sm">
              v2.1
            </span>
          </a>
        </div>

        <!-- Desktop Navigation Bar (Exact 6 items: 홈, 마이덱, 플레이, 미션, 상점, 쇼핑몰) -->
        <nav class="hidden lg:flex items-center gap-1.5 desktop-nav-cluster" aria-label="메인 상단 내비게이션">
          ${navItemsHtml}
        </nav>

        <!-- Right Action: Game SPA Launch & Quick Links -->
        <div class="flex items-center gap-2">
          <a
            href="/home"
            class="px-4 py-2 bg-[#201d1d] text-[#fdfcfc] text-xs font-bold rounded-sm hover:opacity-90 transition-opacity min-h-[44px] inline-flex items-center justify-center no-underline"
          >
            게임 시작 (/home) →
          </a>
        </div>
      </div>
    </header>
  `;
}
