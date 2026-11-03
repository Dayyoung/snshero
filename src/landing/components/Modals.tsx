/**
 * src/landing/components/Modals.tsx
 *
 * Secondary action modal dialogs (쇼핑몰, 커뮤니티, 로그인) adhering to OpenCode Terminal-Flat design.
 * Features fixed inset-0 z-50 backdrop overlay, [x] dismiss control, 닫기 button, and 44px+ touch targets.
 * Integrates real Google sign-in and guest sign-in without any LocalStorage mentions.
 * Pure TypeScript template string generator (Zero React runtime).
 */

import { ModalKey } from '../types';
import { getCurrentUser } from '../services/authService';

export interface ModalsProps {
  activeModal: ModalKey;
  onClose?: () => void;
}

export function renderModals(activeModal: ModalKey): string {
  if (!activeModal) return '';

  let modalContent = '';

  if (activeModal === 'mall') {
    modalContent = `
      <div class="modal-dialog bg-[#fdfcfc] text-[#201d1d] font-mono border border-[rgba(15,0,0,0.12)] rounded-none max-w-md w-full shadow-none p-6 relative">
        <button
          type="button"
          data-action="close-modal"
          class="modal-close-trigger absolute top-4 right-4 min-h-[44px] min-w-[44px] flex items-center justify-center text-stone-500 hover:text-[#201d1d] font-bold text-sm rounded-sm focus:outline-none"
          aria-label="닫기"
        >
          [x]
        </button>

        <div class="mb-4">
          <span class="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-[#201d1d] text-[#fdfcfc] rounded-sm mb-2">
            공식 굿즈 몰 · 상점 통합
          </span>
          <h2 class="text-base font-bold tracking-tight m-0">눈히어로 공식 스토어 &amp; 실물 TCG 굿즈</h2>
        </div>

        <p class="text-xs text-stone-600 leading-relaxed mb-4">
          공식 실물 110종 카드 풀세트, 커스텀 머그컵, 프리미엄 코튼 티셔츠, 3x3 배틀 게임테이블 매트를 상점에서 즉시 구매하실 수 있습니다.
        </p>

        <div class="space-y-2 mb-4">
          <button
            type="button"
            data-action="navigate-to-goods"
            class="block w-full py-3 px-4 bg-[#201d1d] text-[#fdfcfc] text-center text-xs font-bold rounded-sm min-h-[44px] hover:opacity-90 transition-opacity flex items-center justify-center cursor-pointer border-none"
          >
            상점 공식 굿즈 몰 둘러보기 (#shop) →
          </button>
        </div>

        <div class="flex justify-end pt-2 border-t border-[rgba(15,0,0,0.08)]">
          <button
            type="button"
            data-action="close-modal"
            class="modal-close-trigger w-full py-2.5 bg-[#f1eeee] text-[#201d1d] border border-[rgba(15,0,0,0.12)] text-xs font-semibold rounded-sm min-h-[44px] hover:bg-[#e8e5e5] transition-colors flex items-center justify-center"
          >
            닫기 (Close)
          </button>
        </div>
      </div>
    `;
  } else if (activeModal === 'community') {
    modalContent = `
      <div class="modal-dialog bg-[#fdfcfc] text-[#201d1d] font-mono border border-[rgba(15,0,0,0.12)] rounded-none max-w-md w-full shadow-none p-6 relative">
        <button
          type="button"
          data-action="close-modal"
          class="modal-close-trigger absolute top-4 right-4 min-h-[44px] min-w-[44px] flex items-center justify-center text-stone-500 hover:text-[#201d1d] font-bold text-sm rounded-sm focus:outline-none"
          aria-label="닫기"
        >
          [x]
        </button>

        <div class="mb-4">
          <span class="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-[#201d1d] text-[#fdfcfc] rounded-sm mb-2">
            커뮤니티 (Community)
          </span>
          <h2 class="text-base font-bold tracking-tight m-0">공식 라운지 &amp; 모험가 채널</h2>
        </div>

        <p class="text-xs text-stone-600 leading-relaxed mb-4">
          모험가 여러분을 위한 공식 소통 공간입니다. 최강 덱 빌딩 공략, 카드 시너지 토론, 실시간 대전 상대를 만나보세요.
        </p>

        <ul class="text-xs space-y-2 mb-6 border border-[rgba(15,0,0,0.08)] p-3 bg-[#f8f7f7] rounded-sm list-none m-0">
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
            class="block w-full py-3 px-4 bg-[#201d1d] text-[#fdfcfc] text-center text-xs font-bold rounded-sm min-h-[44px] leading-[20px] hover:opacity-90 transition-opacity no-underline flex items-center justify-center"
          >
            실시간 Reddit 뉴스룸 바로가기 (/reddit) →
          </a>
        </div>

        <div class="flex justify-end pt-2 border-t border-[rgba(15,0,0,0.08)]">
          <button
            type="button"
            data-action="close-modal"
            class="modal-close-trigger w-full py-2.5 bg-[#f1eeee] text-[#201d1d] border border-[rgba(15,0,0,0.12)] text-xs font-semibold rounded-sm min-h-[44px] hover:bg-[#e8e5e5] transition-colors flex items-center justify-center"
          >
            닫기 (Close)
          </button>
        </div>
      </div>
    `;
  } else if (activeModal === 'login') {
    const user = getCurrentUser();
    const isGoogleUser = Boolean(user && !user.isAnonymous && user.providerId === 'google.com');

    modalContent = `
      <div class="modal-dialog bg-[#fdfcfc] text-[#201d1d] font-mono border border-[rgba(15,0,0,0.12)] rounded-none max-w-md w-full shadow-none p-6 relative">
        <!-- Close [x] Top Right -->
        <button
          type="button"
          data-action="close-modal"
          class="modal-close-trigger absolute top-4 right-4 min-h-[44px] min-w-[44px] flex items-center justify-center text-stone-500 hover:text-[#201d1d] font-bold text-sm rounded-sm focus:outline-none"
          aria-label="닫기"
        >
          [x]
        </button>

        <div class="mb-4">
          <span class="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-[#201d1d] text-[#fdfcfc] rounded-sm mb-2">
            계정 인증 (Account)
          </span>
          <h2 class="text-base font-bold tracking-tight m-0">SNS히어로 계정 로그인</h2>
          <p class="text-xs text-stone-500 m-0 mt-1">
            Google 계정 연동 또는 손님(게스트) 모드로 게임을 플레이할 수 있습니다.
          </p>
        </div>

        ${
          isGoogleUser
            ? `
          <!-- Logged in as Google User -->
          <div class="p-4 bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] rounded-none mb-5 flex items-center gap-3">
            <div class="w-12 h-12 rounded-full overflow-hidden border border-[rgba(15,0,0,0.12)] shrink-0 bg-white">
              <img src="${user.photoURL}" alt="${user.displayName}" class="w-full h-full object-cover" />
            </div>
            <div class="text-xs space-y-0.5 flex-1 min-w-0">
              <div class="font-bold text-[#201d1d] truncate">${user.displayName}</div>
              <div class="text-[11px] text-stone-500 truncate">${user.email}</div>
              <div class="inline-block text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded-xs mt-1">
                ✓ Google 인증 계정
              </div>
            </div>
          </div>

          <div class="space-y-2 mb-4">
            <a
              href="#play"
              data-nav="play"
              data-action="close-modal"
              class="block w-full py-3 px-4 bg-[#201d1d] text-[#fdfcfc] text-center text-xs font-bold rounded-sm min-h-[44px] leading-[20px] hover:opacity-90 transition-opacity no-underline flex items-center justify-center cursor-pointer"
            >
              게임 플레이 출격 →
            </a>
            <button
              type="button"
              data-action="logout-user"
              class="w-full py-2.5 bg-[#f1eeee] hover:bg-stone-200 text-[#201d1d] text-xs font-bold rounded-sm min-h-[44px] border border-[rgba(15,0,0,0.12)] transition-colors cursor-pointer flex items-center justify-center"
            >
              로그아웃 (Sign Out)
            </button>
          </div>
        `
            : `
          <!-- Login Form (Google & Guest) -->
          <div class="space-y-3 mb-5">
            <!-- Real Google Login Button -->
            <button
              type="button"
              data-action="login-google"
              class="w-full py-3.5 px-4 bg-white hover:bg-stone-50 text-[#201d1d] border border-stone-300 font-bold text-xs rounded-sm min-h-[44px] flex items-center justify-center gap-3 transition-colors cursor-pointer shadow-sm active:scale-[0.99]"
            >
              <!-- Google "G" Logo SVG -->
              <svg class="w-5 h-5 shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>Google 계정으로 로그인</span>
            </button>

            <!-- Divider -->
            <div class="flex items-center gap-3 py-1">
              <div class="h-[1px] flex-1 bg-[rgba(15,0,0,0.12)]"></div>
              <span class="text-[10px] text-stone-500 font-bold uppercase">또는</span>
              <div class="h-[1px] flex-1 bg-[rgba(15,0,0,0.12)]"></div>
            </div>

            <!-- Guest Login Button -->
            <button
              type="button"
              data-action="login-guest"
              class="w-full py-3.5 px-4 bg-[#201d1d] hover:bg-stone-800 text-[#fdfcfc] font-bold text-xs rounded-sm min-h-[44px] flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-none active:scale-[0.99]"
            >
              <span>손님(게스트)으로 로그인 →</span>
            </button>
          </div>
        `
        }

        <div class="flex justify-end pt-2 border-t border-[rgba(15,0,0,0.08)]">
          <button
            type="button"
            data-action="close-modal"
            class="modal-close-trigger w-full py-2.5 bg-[#f1eeee] text-[#201d1d] border border-[rgba(15,0,0,0.12)] text-xs font-semibold rounded-sm min-h-[44px] hover:bg-[#e8e5e5] transition-colors flex items-center justify-center cursor-pointer"
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
      class="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop bg-black/50 backdrop-blur-xs font-mono"
      role="dialog"
      aria-modal="true"
    >
      ${modalContent}
    </div>
  `;
}
