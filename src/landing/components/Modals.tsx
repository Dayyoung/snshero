/**
 * src/landing/components/Modals.tsx
 *
 * Secondary action modal dialogs (쇼핑몰, 커뮤니티, 로그인) adhering to OpenCode Terminal-Flat design.
 * Features fixed inset-0 z-50 backdrop overlay, [x] dismiss control, 닫기 button, and 44px+ touch targets.
 * Includes clear reassurance of 100% LocalStorage game state persistence.
 * Pure TypeScript template string generator (Zero React runtime).
 */

import { ModalKey } from '../types';

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
            쇼핑몰 (Mall) · 오픈 준비 중
          </span>
          <h2 class="text-base font-bold tracking-tight m-0">눈히어로 공식 스토어 &amp; 굿즈샵</h2>
        </div>

        <p class="text-xs text-stone-600 leading-relaxed mb-4">
          눈히어로 공식 네이버 스마트스토어 및 실물 TCG 굿즈몰이 오픈 준비 중입니다.
          실물 110종 카드팩, 한정판 일러스트 양장본 설정집, 40부작 판타지 웹소설 소장본이 곧 입고됩니다.
        </p>

        <div class="space-y-2 mb-6">
          <a
            href="/mall"
            class="block w-full py-3 px-4 bg-[#201d1d] text-[#fdfcfc] text-center text-xs font-bold rounded-sm min-h-[44px] leading-[20px] hover:opacity-90 transition-opacity no-underline flex items-center justify-center"
          >
            공식 스토어 안내 바로가기 (/mall) →
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
  } else if (activeModal === 'community') {
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
            로그인 (Login) · 게스트 보존
          </span>
          <h2 class="text-base font-bold tracking-tight m-0">계정 로그인 &amp; 게스트 플레이 안내</h2>
        </div>

        <p class="text-xs text-stone-600 leading-relaxed mb-3">
          Google 및 Apple 원클릭 소셜 로그인은 정식 서비스 런칭 시 오픈될 예정입니다.
        </p>

        <div class="p-3 bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] rounded-sm mb-5 text-xs text-stone-700 leading-relaxed">
          <span class="font-bold text-[#201d1d]">로컬스토리지(LocalStorage) 100% 영구 보존:</span><br/>
          현재 획득한 카드, 1~100Lv 카드 육성 경험치, 스탯 포인트, 덱 구성 데이터는 회원가입이나 로그인 없이도 브라우저 로컬스토리지(LocalStorage)에 안전하게 영구 저장됩니다.
        </div>

        <div class="space-y-2 mb-4">
          <a
            href="#play"
            data-nav="play"
            class="block w-full py-3 px-4 bg-[#201d1d] text-[#fdfcfc] text-center text-xs font-bold rounded-sm min-h-[44px] leading-[20px] hover:opacity-90 transition-opacity no-underline flex items-center justify-center"
          >
            게스트로 게임 시작하기 →
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

/**
 * Helper to ensure onClose handler contract compliance.
 */
export function handleModalClose(onClose?: () => void): void {
  if (typeof onClose === 'function') {
    onClose();
  }
}
