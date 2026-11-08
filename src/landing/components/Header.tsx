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
import { audioManager } from '../services/audioManager';
import { t, tr, getCurrentLanguage } from '../services/i18n';

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
          data-google-vignette="false"
          class="nav-item-btn px-3 py-2 text-xs font-semibold rounded-sm transition-colors min-h-[44px] flex items-center justify-center ${activeClass}"
          aria-label="${label}"
        >
          ${label}
        </button>
      `;
    }

    return `
      <button
        type="button"
        data-nav="${item.key}"
        data-google-vignette="false"
        class="nav-item-btn px-3 py-2 text-xs font-semibold rounded-sm transition-colors min-h-[44px] flex items-center justify-center ${activeClass}"
        aria-current="${isActive ? 'page' : 'false'}"
        aria-label="${label}"
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
            aria-label="${tr('사이드 메뉴 열기', 'Open Side Menu', 'サイドメニューを開く')}"
          >
            <span class="text-sm font-bold tracking-widest">[=]</span>
          </button>
          <a
            href="#home"
            data-nav="home"
            data-google-vignette="false"
            class="brand-link flex items-center gap-2 min-h-[44px] no-underline hover:opacity-90 transition-opacity"
            aria-label="${brandName}"
          >
            <img
              src="${t('logo_src', '/logo-ko.png')}"
              alt="${brandName}"
              class="h-8 sm:h-9 md:h-10 w-auto max-w-[140px] sm:max-w-[180px] md:max-w-[220px] object-contain bg-transparent filter drop-shadow-none"
              loading="eager"
            />
            <span class="hidden xl:inline-block text-[10px] font-normal text-[#646262] border border-[rgba(15,0,0,0.12)] px-1.5 py-0.5 rounded-sm">
              v2.1
            </span>
          </a>
        </div>

        <!-- Desktop Navigation Bar -->
        <nav class="hidden lg:flex items-center gap-1.5 desktop-nav-cluster" aria-label="${tr('메인 상단 내비게이션', 'Main Top Navigation', 'メイン上部ナビゲーション')}">
          ${navItemsHtml}
        </nav>

        <!-- Right Action: Audio Mute, Setting, User Login & Game Launch -->
        <div class="flex items-center gap-1.5 sm:gap-2">
          <!-- Audio Mute / Unmute Button (Precision SVG + Unmistakable ON / MUTE Badge) -->
          ${(() => {
            const isMuted = audioManager.isMuted();
            return `
              <button
                type="button"
                data-action="toggle-mute"
                aria-pressed="${isMuted ? 'true' : 'false'}"
                class="group px-2.5 sm:px-3 py-1.5 rounded-sm border text-xs font-mono font-bold min-h-[44px] inline-flex items-center gap-1.5 sm:gap-2 cursor-pointer transition-all select-none active:scale-95 ${
                  isMuted
                    ? 'bg-rose-50 hover:bg-rose-100/90 text-rose-700 border-rose-400'
                    : 'bg-[#fdfcfc] hover:bg-[#f4f2f2] text-[#201d1d] border-[#201d1d]/25 hover:border-[#201d1d]/50'
                }"
                aria-label="${isMuted ? tr('음소거 상태 (클릭하여 소리 켜기)', 'Muted (Click to Unmute)', 'ミュート中（クリックで音声オン）') : tr('사운드 켜짐 (클릭하여 음소거)', 'Sound ON (Click to Mute)', 'サウンドオン（クリックでミュート）')}"
                title="${isMuted ? tr('현재 음소거됨 — 클릭하면 소리가 켜집니다', 'Currently Muted — Click to turn sound ON', '現在ミュート中 — クリックで音声オン') : tr('현재 소리 켜짐 — 클릭하면 음소거됩니다', 'Sound is ON — Click to Mute', '現在サウンドオン — クリックでミュート')}"
              >
                <!-- Live Status Dot -->
                <span class="w-2 h-2 rounded-full shrink-0 ${
                  isMuted
                    ? 'bg-rose-500'
                    : 'bg-emerald-500 animate-pulse'
                }"></span>

                <!-- Precision Vector Speaker Icon -->
                ${
                  isMuted
                    ? `
                      <svg viewBox="0 0 24 24" class="w-4 h-4 shrink-0 text-rose-600" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" fill-opacity="0.15" />
                        <line x1="22" y1="9" x2="16" y2="15" />
                        <line x1="16" y1="9" x2="22" y2="15" />
                      </svg>
                    `
                    : `
                      <svg viewBox="0 0 24 24" class="w-4 h-4 shrink-0 text-[#201d1d]" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" fill-opacity="0.12" />
                        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                        <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                      </svg>
                    `
                }

                <!-- Explicit Mute / Sound ON Badge -->
                <span class="px-1.5 py-0.5 text-[10px] font-mono font-black tracking-tight rounded-xs leading-none ${
                  isMuted
                    ? 'bg-rose-600 text-white'
                    : 'bg-emerald-600 text-white'
                }">
                  ${isMuted ? tr('음소거', 'MUTE', '消音') : tr('소리ON', 'ON', 'ON')}
                </span>
              </button>
            `;
          })()}

          <!-- Settings Button (Precision Vector Sliders Icon) -->
          <a
            href="#setting"
            data-nav="setting"
            data-google-vignette="false"
            class="group px-2.5 sm:px-3 py-1.5 border text-xs font-mono font-bold rounded-sm min-h-[44px] min-w-[44px] inline-flex items-center justify-center gap-1.5 cursor-pointer no-underline transition-all active:scale-95 ${
              activeView === 'setting'
                ? 'bg-[#201d1d] text-[#fdfcfc] border-[#201d1d]'
                : 'bg-[#fdfcfc] hover:bg-[#f4f2f2] text-[#201d1d] border-[#201d1d]/25 hover:border-[#201d1d]/50'
            }"
            aria-label="${t('nav_setting')}"
            title="${t('setting_title')}"
          >
            <svg
              viewBox="0 0 24 24"
              class="w-4 h-4 shrink-0 transition-transform duration-300 group-hover:rotate-45"
              fill="none"
              stroke="currentColor"
              stroke-width="1.9"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            <span class="hidden xl:inline text-[11px] tracking-tight">${t('nav_setting', '설정')}</span>
          </a>
          ${(() => {
            const user = getCurrentUser();
            const isGoogle = !user.isAnonymous && user.providerId === 'google.com';
            if (isGoogle) {
              return `
                <button
                  type="button"
                  data-modal="login"
                  data-google-vignette="false"
                  class="px-2.5 py-1.5 bg-[#f8f7f7] hover:bg-[#f1eeee] text-[#201d1d] border border-[rgba(15,0,0,0.12)] text-xs font-bold rounded-sm min-h-[44px] flex items-center gap-1.5 cursor-pointer"
                  aria-label="${tr('내 계정 정보', 'My Account Info', 'マイアカウント情報')}"
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
                data-google-vignette="false"
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
            data-google-vignette="false"
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
