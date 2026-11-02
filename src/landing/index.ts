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
import { renderMyDeckSection } from './views/MyDeckSection';
import { renderPlaySection, handlePlayAction, stopPlayTts } from './views/PlaySection';
import { renderCardSection, setSelectedCardId, setElementFilter, setOwnedFilter } from './views/CardSection';
import { renderShopSection, executeShopPurchase, setUserCoins, getUserCoins } from './views/ShopSection';
import { cardNurtureStore } from './services/cardNurtureStore';

interface LandingState {
  activeView: ViewKey;
  activeModal: ModalKey;
  isSidebarOpen: boolean;
  selectedDeckCardId?: number;
}

const state: LandingState = {
  activeView: 'home',
  activeModal: null,
  isSidebarOpen: false,
  selectedDeckCardId: 1,
};

function renderActiveViewContent(view: ViewKey): string {
  if (view === 'home') {
    return renderHomeSection();
  }
  if (view === 'deck') {
    return renderMyDeckSection(state.selectedDeckCardId || 1);
  }
  if (view === 'play') {
    return renderPlaySection();
  }
  if (view === 'card') {
    return renderCardSection();
  }
  if (view === 'shop') {
    return renderShopSection();
  }

  return renderHomeSection();
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
    if (state.activeView === 'play' && nav !== 'play') {
      stopPlayTts();
    }
    state.activeView = nav;
    state.isSidebarOpen = false;
    window.location.hash = nav;
    renderApp();
  } else if (modal) {
    if (state.activeView === 'play') {
      stopPlayTts();
    }
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
  } else if (action === 'select-deck-card') {
    const cardIdStr = target.getAttribute('data-card-id');
    if (cardIdStr) {
      state.selectedDeckCardId = parseInt(cardIdStr, 10);
      renderApp();
    }
  } else if (action && action.startsWith('play-')) {
    handlePlayAction(action, target as HTMLElement);
    renderApp();
  } else if (action === 'select-card') {
    const cardId = Number(target.getAttribute('data-card-id'));
    if (cardId) {
      setSelectedCardId(cardId);
      renderApp();
    }
  } else if (action === 'close-card-inspector') {
    setSelectedCardId(null);
    renderApp();
  } else if (action === 'nurture-card') {
    const cardId = Number(target.getAttribute('data-card-id'));
    const expGain = Number(target.getAttribute('data-exp') || '50');
    if (cardId) {
      cardNurtureStore.nurtureCard(cardId, expGain);
      renderApp();
    }
  } else if (action === 'allocate-stat') {
    const cardId = Number(target.getAttribute('data-card-id'));
    const direction = target.getAttribute('data-direction') as 'top' | 'right' | 'bottom' | 'left';
    if (cardId && direction) {
      cardNurtureStore.allocateStat(cardId, direction);
      renderApp();
    }
  } else if (action === 'filter-card-element') {
    const el = target.getAttribute('data-element') || 'all';
    setElementFilter(el);
    renderApp();
  } else if (action === 'filter-card-owned') {
    const owned = target.getAttribute('data-filter') as 'all' | 'owned' | 'unowned';
    setOwnedFilter(owned || 'all');
    renderApp();
  } else if (action === 'buy-shop-item') {
    const itemId = target.getAttribute('data-item-id');
    if (itemId) {
      const res = executeShopPurchase(itemId);
      if (!res.success) {
        alert(res.message);
      }
      renderApp();
    }
  } else if (action === 'free-charge-coin') {
    const cur = getUserCoins();
    setUserCoins(cur + 1000);
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
    } else if (state.activeView === 'play') {
      stopPlayTts();
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
  document.addEventListener('change', (event: Event) => {
    const target = event.target as HTMLElement;
    const action = target?.getAttribute('data-action');
    if (action && action.startsWith('play-')) {
      handlePlayAction(action, target);
      renderApp();
    }
  });
  document.addEventListener('input', (event: Event) => {
    const target = event.target as HTMLElement;
    const action = target?.getAttribute('data-action');
    if (action && action === 'play-scrub-scene') {
      handlePlayAction(action, target);
      renderApp();
    }
  });

  window.addEventListener('keydown', handleGlobalKeydown);
  window.addEventListener('hashchange', () => {
    const currentHash = window.location.hash.replace('#', '') as ViewKey;
    if (validViews.includes(currentHash) && currentHash !== state.activeView) {
      if (state.activeView === 'play' && currentHash !== 'play') {
        stopPlayTts();
      }
      state.activeView = currentHash;
      renderApp();
    }
  });

  if (typeof window !== 'undefined') {
    window.addEventListener('snshero_card_nurture_updated', () => {
      renderApp();
    });
    window.addEventListener('snshero_sns_updated', () => {
      renderApp();
    });
  }

  renderApp();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountLanding);
} else {
  mountLanding();
}
