/**
 * src/landing/index.ts
 *
 * Standalone static landing page orchestrator for SNSHero.com.
 * Dual-entry MPA architecture: Zero React runtime, zero server dependencies.
 * OpenCode Terminal-Flat design, 44px+ touch targets, responsive 360px ~ 3840px layout.
 * Enforces Zero-Onboarding-Popup guard on initial visit.
 */

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

function renderActiveViewContent(view: ViewKey): string {
  if (view === 'home') {
    return renderHomeSection();
  }

  const titles: Record<ViewKey, { ko: string; desc: string }> = {
    home: { ko: '홈 (Home)', desc: '눈히어로 공식 소개 및 연재관' },
    deck: { ko: '마이덱 (My Deck)', desc: '현재 내 5장 덱 구성 및 Deck TP / Total TP 확인' },
    play: { ko: '플레이 (Play Theater)', desc: '40부작 웹툰 씬 뷰어 및 오디오 나레이션' },
    card: { ko: '카드 수집 및 육성 (Card Collection & Nurture)', desc: '110종 카드 수집율 및 1~100레벨 카드 육성 엔진' },
    shop: { ko: '상점 (Card Shop)', desc: '일반/매직/희귀 카드팩 및 공식 굿즈/아이템 상점' },
  };

  const current = titles[view] || { ko: view, desc: '섹션 안내' };

  return `
    <div class="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 py-10 font-mono">
      <section class="border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] p-6 sm:p-8 rounded-none shadow-none space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[rgba(15,0,0,0.08)] gap-2">
          <div>
            <span class="text-[11px] text-stone-500 uppercase tracking-widest">[VIEW: ${view.toUpperCase()}]</span>
            <h1 class="text-lg sm:text-xl font-bold text-[#201d1d] m-0">${current.ko}</h1>
          </div>
          <span class="px-2 py-1 bg-[#f1eeee] text-[#646262] text-xs font-semibold rounded-sm">
            Milestone 3 준비 완료
          </span>
        </div>
        <p class="text-xs sm:text-sm text-stone-600 leading-relaxed m-0">
          ${current.desc} 기능의 전체 인터랙티브 시스템(카드 육성, 1~100Lv 레벨업, 스탯 배분, 덱 TP 계산기, 상점 8종)이 Milestone 3에서 완벽히 연동됩니다.
        </p>
        <div class="pt-4 flex flex-wrap gap-3">
          <a
            href="/home"
            class="px-5 py-3 bg-[#201d1d] text-[#fdfcfc] text-xs font-bold rounded-sm hover:opacity-90 transition-opacity min-h-[44px] inline-flex items-center justify-center no-underline"
          >
            기존 카드 배틀 게임 바로가기 (/home) →
          </a>
          <button
            type="button"
            data-nav="home"
            class="px-4 py-3 bg-[#f1eeee] text-[#201d1d] border border-[rgba(15,0,0,0.12)] text-xs font-semibold rounded-sm min-h-[44px] inline-flex items-center justify-center hover:bg-[#e8e5e5] transition-colors"
          >
            ← 홈으로 돌아가기
          </button>
        </div>
      </section>
    </div>
  `;
}

function renderApp(): void {
  const root = document.getElementById('landing-root') || document.getElementById('root');
  if (!root) return;

  root.innerHTML = `
    <div class="w-full min-h-screen overflow-x-hidden flex flex-col bg-[#fdfcfc] text-[#201d1d] font-mono select-none">
      <!-- Top Navigation (Header: exact 6 items, md:, lg:, min-h-[44px]) -->
      <div id="landing-header-slot" class="w-full">
        ${renderHeader(state.activeView)}
      </div>

      <!-- Side Navigation (Sidebar Drawer: exact 8 items, off-canvas, backdrop, [x]) -->
      <div id="landing-sidebar-slot">
        ${renderSidebar(state.isSidebarOpen, state.activeView)}
      </div>

      <!-- Secondary Action Modals (쇼핑몰, 커뮤니티, 로그인) -->
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

function handleEventDelegation(event: Event): void {
  const target = (event.target as HTMLElement).closest('[data-nav], [data-modal], [data-action]');
  if (!target) return;

  const nav = target.getAttribute('data-nav') as ViewKey | null;
  const modal = target.getAttribute('data-modal') as ModalKey | null;
  const action = target.getAttribute('data-action');

  if (nav) {
    state.activeView = nav;
    state.isSidebarOpen = false;
    window.location.hash = nav;
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

function handleGlobalKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    if (state.activeModal) {
      state.activeModal = null;
      renderApp();
    } else if (state.isSidebarOpen) {
      state.isSidebarOpen = false;
      renderApp();
    }
  }
}

function mountLanding(): void {
  // Sync view from initial URL hash if present
  const hash = window.location.hash.replace('#', '') as ViewKey;
  const validViews: ViewKey[] = ['home', 'deck', 'play', 'card', 'shop'];
  if (validViews.includes(hash)) {
    state.activeView = hash;
  }

  // Register event listeners
  document.addEventListener('click', handleEventDelegation);
  window.addEventListener('keydown', handleGlobalKeydown);
  window.addEventListener('hashchange', () => {
    const currentHash = window.location.hash.replace('#', '') as ViewKey;
    if (validViews.includes(currentHash) && currentHash !== state.activeView) {
      state.activeView = currentHash;
      renderApp();
    }
  });

  renderApp();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountLanding);
} else {
  mountLanding();
}
