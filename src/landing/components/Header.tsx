/**
 * src/landing/components/Header.tsx
 *
 * Top navigation component adhering to OpenCode Terminal-Flat design.
 * Features exact 9 navigation items: 홈, 마이덱, 플레이, 카드, 상점, 굿즈몰, 웹소설, 웹툰, 설정.
 * Fully supports live 12-language localization (i18n).
 * Includes md: and lg: responsive utilities and 44px+ touch targets.
 * Pure TypeScript template string generator (Zero React runtime).
 */

import { ViewKey, ModalKey, TOP_NAV_ITEMS } from '../types';
import { getCurrentUser } from '../services/authService';
import { t, getCurrentLanguage } from '../services/i18n';

export interface HeaderProps {
  activeView: ViewKey;
  onNavigate?: (view: ViewKey) => void;
  onOpenModal?: (modal: ModalKey) => void;
  onToggleSidebar?: () => void;
}

interface NavItemDef {
  key: ViewKey | 'mall';
  i18nKey: string;
  defaultLabel: string;
  isModal?: boolean;
}

export const TOP_NAV_DEFS: NavItemDef[] = [
  { key: 'home', i18nKey: 'nav_home', defaultLabel: '홈' },
  { key: 'deck', i18nKey: 'nav_deck', defaultLabel: '마이덱' },
  { key: 'play', i18nKey: 'nav_play', defaultLabel: '플레이' },
  { key: 'card', i18nKey: 'nav_card', defaultLabel: '카드' },
  { key: 'shop', i18nKey: 'nav_shop', defaultLabel: '상점' },
  { key: 'mall', i18nKey: 'nav_mall', defaultLabel: '굿즈몰' },
  { key: 'book', i18nKey: 'nav_book', defaultLabel: '웹소설' },
  { key: 'webtoon', i18nKey: 'nav_webtoon', defaultLabel: '웹툰' },
  { key: 'setting', i18nKey: 'nav_setting', defaultLabel: '설정' },
];

export function renderHeader(activeView: ViewKey): string {
  const currentLang = getCurrentLanguage();
  const brandName = currentLang === 'ko' ? '눈히어로.com' : 'SNSHero.com';

  const navItemsHtml = TOP_NAV_DEFS.map((item) => {
    const isActive = !item.isModal && activeView === item.key;
    const label = t(item.i18nKey, item.defaultLabel);
    const activeClass = isActive
      ? 'bg-[#201d1d] text-[#fdfcfc]'
      : 'text-[#646262] hover:text-[#201d1d] hover:bg-[#f1eeee]';

    if (item.isModal) {
      return `
        <button
          type="button"
          data-modal="${item.key}"
          class="nav-item-btn px-3 py-2 text-xs font-semibold rounded-sm transition-colors min-h-[44px] flex items-center justify-center ${activeClass}"
          aria-label="${label} 모달 열기"
        >
          ${label}
        </button>
      `;
    }

    return `
      <button
        type="button"
        data-nav="${item.key}"
        class="nav-item-btn px-3 py-2 text-xs font-semibold rounded-sm transition-colors min-h-[44px] flex items-center justify-center ${activeClass}"
        aria-current="${isActive ? 'page' : 'false'}"
        aria-label="${label} 섹션 이동"
      >
        ${label}
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
            <span>${brandName}</span>
            <span class="hidden md:inline-block text-[11px] font-normal text-[#646262] border border-[rgba(15,0,0,0.12)] px-1.5 py-0.5 rounded-sm">
              v2.1
            </span>
          </a>
        </div>

        <!-- Desktop Navigation Bar -->
        <nav class="hidden lg:flex items-center gap-1.5 desktop-nav-cluster" aria-label="메인 상단 내비게이션">
          ${navItemsHtml}
        </nav>

        <!-- Right Action: Setting, User Login & Game Launch -->
        <div class="flex items-center gap-2">
          <a
            href="#setting"
            data-nav="setting"
            class="p-2 bg-[#f8f7f7] hover:bg-[#f1eeee] text-[#201d1d] border border-[rgba(15,0,0,0.12)] text-xs font-bold rounded-sm min-h-[44px] min-w-[44px] inline-flex items-center justify-center cursor-pointer no-underline ${activeView === 'setting' ? 'bg-[#201d1d] text-[#fdfcfc]' : ''}"
            aria-label="${t('nav_setting')}"
            title="${t('setting_title')}"
          >
            ⚙️
          </a>
          ${(() => {
            const user = getCurrentUser();
            const isGoogle = !user.isAnonymous && user.providerId === 'google.com';
            if (isGoogle) {
              return `
                <button
                  type="button"
                  data-modal="login"
                  class="px-2.5 py-1.5 bg-[#f8f7f7] hover:bg-[#f1eeee] text-[#201d1d] border border-[rgba(15,0,0,0.12)] text-xs font-bold rounded-sm min-h-[44px] flex items-center gap-1.5 cursor-pointer"
                  aria-label="내 계정 정보"
                >
                  <img src="${user.photoURL}" alt="${user.displayName}" class="w-5 h-5 rounded-full object-cover" />
                  <span class="hidden sm:inline max-w-[90px] truncate">${user.displayName}</span>
                </button>
              `;
            }
            return `
              <button
                type="button"
                data-modal="login"
                class="px-3 py-2 bg-[#f8f7f7] hover:bg-[#f1eeee] text-[#201d1d] border border-[rgba(15,0,0,0.12)] text-xs font-bold rounded-sm min-h-[44px] flex items-center justify-center cursor-pointer"
                aria-label="${t('btn_login')}"
              >
                ${t('btn_login')}
              </button>
            `;
          })()}
          <a
            href="#play"
            data-nav="play"
            class="px-3.5 sm:px-4 py-2 bg-[#201d1d] text-[#fdfcfc] text-xs font-bold rounded-sm hover:opacity-90 transition-opacity min-h-[44px] inline-flex items-center justify-center no-underline"
            aria-label="${t('btn_game_start')}"
          >
            ${t('btn_game_start')}
          </a>
        </div>
      </div>
    </header>
  `;
}
