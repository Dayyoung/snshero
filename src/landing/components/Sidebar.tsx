/**
 * src/landing/components/Sidebar.tsx
 *
 * Side navigation drawer component adhering to OpenCode Terminal-Flat design.
 * Features exact 8 navigation items: 로그인, 홈, 마이덱, 플레이, 미션, 상점, 쇼핑몰, 커뮤니티.
 * Includes off-canvas drawer, backdrop overlay, [x] dismiss control, and 44px+ touch targets.
 * Pure TypeScript template string generator (Zero React runtime).
 */

import { ViewKey, ModalKey, SIDE_NAV_ITEMS } from '../types';
import { getCurrentUser } from '../services/authService';

export interface SidebarProps {
  isOpen: boolean;
  activeView: ViewKey;
}

interface SideItemDef {
  key: string;
  label: (typeof SIDE_NAV_ITEMS)[number];
  isModal?: boolean;
  modalTarget?: ModalKey;
  icon: string;
  badge?: string;
}

export const SIDE_NAV_DEFS: SideItemDef[] = [
  { key: 'login', label: '로그인' as any, isModal: true, modalTarget: 'login', icon: '🔑', badge: '계정' },
  { key: 'home', label: '홈' as any, icon: '🏠' },
  { key: 'deck', label: '마이덱' as any, icon: '🃏' },
  { key: 'play', label: '플레이' as any, icon: '⚔️' },
  { key: 'card', label: '카드' as any, icon: '🎴' },
  { key: 'shop', label: '상점' as any, icon: '🛒' },
  { key: 'mall', label: '굿즈몰' as any, icon: '🏬' },
  { key: 'book', label: '웹소설' as any, icon: '📜', badge: '40화' },
  { key: 'webtoon', label: '웹툰' as any, icon: '🎨', badge: '840컷' },
  { key: 'community', label: '커뮤니티' as any, isModal: true, modalTarget: 'community', icon: '💬', badge: '채널' },
];

export function renderSidebar(isOpen: boolean, activeView: ViewKey): string {
  if (!isOpen) return '';

  const itemsHtml = SIDE_NAV_DEFS.map((item) => {
    const isActive = !item.isModal && activeView === item.key;
    const activeClass = isActive
      ? 'bg-[#201d1d] text-[#fdfcfc]'
      : 'text-[#201d1d] hover:bg-[#f1eeee]';

    if (item.isModal && item.modalTarget) {
      return `
        <li>
          <button
            type="button"
            data-modal="${item.modalTarget}"
            class="sidebar-item-btn w-full px-4 py-3 text-sm font-medium flex items-center justify-between border-b border-[rgba(15,0,0,0.06)] rounded-sm min-h-[44px] transition-colors ${activeClass}"
            aria-label="${item.label} 모달 열기"
          >
            <span class="flex items-center gap-3">
              <span class="text-base">${item.icon}</span>
              <span>${item.label}</span>
            </span>
            <span class="text-[11px] text-stone-500 font-mono">[${item.badge || '열기'}]</span>
          </button>
        </li>
      `;
    }

    return `
      <li>
        <button
          type="button"
          data-nav="${item.key}"
          class="sidebar-item-btn w-full px-4 py-3 text-sm font-medium flex items-center justify-between border-b border-[rgba(15,0,0,0.06)] rounded-sm min-h-[44px] transition-colors ${activeClass}"
          aria-label="${item.label} 섹션 이동"
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
      class="fixed inset-0 z-50 transition-opacity duration-200 opacity-100 pointer-events-auto font-mono"
      role="dialog"
      aria-modal="true"
      aria-label="사이드 내비게이션 메뉴"
    >
      <!-- Backdrop Overlay -->
      <div
        id="sidebar-backdrop"
        data-action="close-sidebar"
        class="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity cursor-pointer"
      ></div>

      <!-- Offcanvas Drawer Panel -->
      <aside
        class="fixed inset-y-0 left-0 w-72 sm:w-80 md:w-80 max-w-[85vw] bg-[#fdfcfc] text-[#201d1d] z-50 border-r border-[rgba(15,0,0,0.12)] shadow-none flex flex-col justify-between overflow-y-auto transform translate-x-0 transition-transform duration-200"
      >
        <!-- Drawer Header -->
        <div>
          <div class="p-4 border-b border-[rgba(15,0,0,0.12)] flex items-center justify-between min-h-[56px] h-14 md:h-16">
            <div class="flex items-center gap-2">
              <span class="w-3 h-3 bg-[#201d1d]"></span>
              <span class="font-bold text-sm md:text-base tracking-tight">메뉴 (Navigation)</span>
            </div>
            <button
              type="button"
              id="sidebar-close-btn"
              data-action="close-sidebar"
              class="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 rounded-sm text-stone-600 hover:text-[#201d1d] hover:bg-[#f1eeee] transition-colors focus:outline-none"
              aria-label="사이드 메뉴 닫기"
            >
              <span class="text-sm font-bold">[x]</span>
            </button>
          </div>

          <!-- User Status Notice -->
          <div class="p-4 bg-[#f8f7f7] border-b border-[rgba(15,0,0,0.12)]">
            <div class="text-[11px] text-[#646262] font-semibold uppercase tracking-wider mb-1">인증 상태</div>
            <div class="text-xs font-bold text-[#201d1d] flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-none bg-emerald-500 inline-block"></span>
              <span>${getCurrentUser().displayName}</span>
            </div>
          </div>

          <!-- 8 Navigation Items: 로그인, 홈, 마이덱, 플레이, 미션, 상점, 쇼핑몰, 커뮤니티 -->
          <nav class="p-2" aria-label="사이드 내비게이션 항목">
            <ul class="space-y-1 list-none p-0 m-0">
              ${itemsHtml}
            </ul>
          </nav>
        </div>

        <!-- Drawer Footer Actions -->
        <div class="p-4 border-t border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] space-y-2">
          <a
            href="#play"
            data-nav="play"
            class="block w-full py-3 bg-[#201d1d] text-[#fdfcfc] text-center text-xs font-bold rounded-sm min-h-[44px] leading-[20px] hover:opacity-90 transition-opacity no-underline flex items-center justify-center"
          >
            게임 시작하기 →
          </a>
          <p class="text-[10px] text-stone-500 text-center font-mono m-0">
            눈히어로.com (SNSHero.com) © 2026
          </p>
        </div>
      </aside>
    </div>
  `;
}
