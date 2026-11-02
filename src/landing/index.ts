/**
 * src/landing/index.ts
 *
 * Standalone static landing page orchestrator for SNSHero.com.
 * Dual-entry MPA architecture: Zero React runtime, zero server dependencies.
 * Full client-side hash routing (#home, #deck, #play, #card, #shop).
 * OpenCode Terminal-Flat design, 44px+ touch targets, responsive 360px ~ 3840px layout.
 * Enforces Zero-Onboarding-Popup guard on initial visit.
 */

import './styles/landing.css';
import { ViewKey, ModalKey, RouteOptions } from './types';
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
import { initIdleAutoPlay } from './services/idleAutoPlayManager';

interface LandingState {
  activeView: ViewKey;
  activeModal: ModalKey;
  isSidebarOpen: boolean;
  selectedDeckCardId?: number;
}

export const VALID_VIEWS: readonly ViewKey[] = ['home', 'deck', 'play', 'card', 'shop'] as const;

export const HASH_VIEW_MAP: Record<string, ViewKey> = {
  home: 'home',
  'main-lobby': 'home',
  deck: 'deck',
  mydeck: 'deck',
  play: 'play',
  main: 'play',
  battle: 'play',
  card: 'card',
  cards: 'card',
  mission: 'card',
  missions: 'card',
  companion: 'card',
  shop: 'shop',
  store: 'shop',
};

export const LEGACY_PATH_MAP: Record<string, ViewKey> = {
  '/home': 'home',
  '/main-lobby': 'home',
  '/deck': 'deck',
  '/mydeck': 'deck',
  '/play': 'play',
  '/main': 'play',
  '/card': 'card',
  '/cards': 'card',
  '/mission': 'card',
  '/missions': 'card',
  '/shop': 'shop',
  '/store': 'shop',
};

const state: LandingState = {
  activeView: 'home',
  activeModal: null,
  isSidebarOpen: false,
  selectedDeckCardId: 1,
};

let isProgrammaticRouting = false;

/**
 * Parses the current URL hash or legacy pathname into a valid ViewKey.
 * Defaults to 'home' if empty or unrecognized.
 */
export function parseRoute(hashString?: string, pathnameString?: string): ViewKey {
  const rawHash = (hashString !== undefined ? hashString : (typeof window !== 'undefined' ? window.location.hash : ''))
    .replace(/^#\/?/, '')
    .split('?')[0]
    .replace(/\/$/, '')
    .toLowerCase();

  if (rawHash && rawHash in HASH_VIEW_MAP) {
    return HASH_VIEW_MAP[rawHash];
  }

  const cleanPath = (pathnameString !== undefined ? pathnameString : (typeof window !== 'undefined' ? window.location.pathname : ''))
    .replace(/\/$/, '')
    .toLowerCase();

  if (cleanPath && cleanPath in LEGACY_PATH_MAP) {
    return LEGACY_PATH_MAP[cleanPath];
  }

  return 'home';
}

function renderActiveViewContent(view: ViewKey): string {
  if (view === 'home') return renderHomeSection();
  if (view === 'deck') return renderMyDeckSection(state.selectedDeckCardId || 1);
  if (view === 'play') return renderPlaySection();
  if (view === 'card') return renderCardSection();
  if (view === 'shop') return renderShopSection();
  return renderHomeSection();
}

/**
 * Renders the entire application DOM tree.
 */
export function renderApp(): void {
  const root = document.getElementById('landing-root') || document.getElementById('root');
  if (!root) return;

  root.innerHTML = `
    <div class="w-full min-h-screen overflow-x-hidden flex flex-col bg-[#fdfcfc] text-[#201d1d] font-mono select-none">
      <!-- Top Navigation -->
      <div id="landing-header-slot" class="w-full">
        ${renderHeader(state.activeView)}
      </div>

      <!-- Side Navigation -->
      <div id="landing-sidebar-slot">
        ${renderSidebar(state.isSidebarOpen, state.activeView)}
      </div>

      <!-- Secondary Action Modals -->
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

/**
 * Smoothly updates the active section and active header/sidebar styles
 * without full page reloads or DOM destruction.
 */
export function renderSectionContent(view: ViewKey): void {
  const mainSlot = document.getElementById('landing-main-slot');
  const headerSlot = document.getElementById('landing-header-slot');
  const sidebarSlot = document.getElementById('landing-sidebar-slot');

  if (mainSlot && headerSlot) {
    headerSlot.innerHTML = renderHeader(view);
    if (sidebarSlot) {
      sidebarSlot.innerHTML = renderSidebar(state.isSidebarOpen, view);
    }
    mainSlot.innerHTML = renderActiveViewContent(view);
    window.scrollTo({ top: 0, behavior: 'instant' });
  } else {
    renderApp();
  }
}

/**
 * Centralized navigation controller with reentrancy lock.
 */
export function navigateTo(targetView: ViewKey, options?: RouteOptions): void {
  const resolvedView: ViewKey = VALID_VIEWS.includes(targetView) ? targetView : 'home';
  const targetHash = `#${resolvedView}`;

  // State Comparison Guard: do not re-render if already active and hash matches
  if (state.activeView === resolvedView && window.location.hash === targetHash) {
    return;
  }

  // Cleanup side effects of previous view
  if (state.activeView === 'play' && resolvedView !== 'play') {
    stopPlayTts();
  }

  state.activeView = resolvedView;
  state.isSidebarOpen = false;
  state.activeModal = null;

  // URL Hash Synchronization with Reentrancy Lock
  if (options?.updateHash !== false && window.location.hash !== targetHash) {
    isProgrammaticRouting = true;
    try {
      if (options?.replace) {
        window.history.replaceState({ view: resolvedView }, '', targetHash);
      } else {
        window.location.hash = resolvedView;
      }
    } finally {
      setTimeout(() => {
        isProgrammaticRouting = false;
      }, 0);
    }
  }

  renderSectionContent(resolvedView);

  // Dispatch custom event for external listeners (e.g. idle timer, adsense)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('snshero_hash_route_changed', { detail: { view: resolvedView } }));
  }
}

export function handleEventDelegation(event: Event): void {
  const target = (event.target as HTMLElement).closest('[data-nav], [data-modal], [data-action], a[href^="#"], a[href="/home"]');
  if (!target) return;

  const nav = target.getAttribute('data-nav') as ViewKey | null;
  const modal = target.getAttribute('data-modal') as ModalKey | null;
  const action = target.getAttribute('data-action');
  const href = target.getAttribute('href');

  // Handle direct data-nav or hash anchors
  if (nav && VALID_VIEWS.includes(nav)) {
    event.preventDefault();
    navigateTo(nav);
    return;
  }

  // Intercept legacy href="/home" links
  if (href === '/home') {
    event.preventDefault();
    navigateTo('home');
    return;
  }

  // Intercept internal hash anchor clicks
  if (href && href.startsWith('#')) {
    const rawTarget = href.replace(/^#\/?/, '').toLowerCase();
    const mapped = HASH_VIEW_MAP[rawTarget];
    if (mapped) {
      event.preventDefault();
      navigateTo(mapped);
      return;
    }
  }

  if (modal) {
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

export function handleGlobalKeydown(event: KeyboardEvent): void {
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

export function mountLanding(): void {
  // 1. Initial route resolution
  const initialView = parseRoute();
  state.activeView = initialView;

  // 2. Normalize initial URL to `#${initialView}` without creating an extra history frame
  const targetHash = `#${initialView}`;
  if (window.location.hash !== targetHash) {
    try {
      window.history.replaceState({ view: initialView }, '', targetHash);
    } catch {
      window.location.hash = initialView;
    }
  }

  // 3. Initialize Global 15-Second Idle Auto-Play Transition
  initIdleAutoPlay({
    timeoutMs: 15000,
    targetUrl: 'https://dayyoung-macbookpro.tail3717a4.ts.net/#play',
    fallbackHash: '#play',
  });

  // 4. Register Event Listeners
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

  // 5. hashchange Listener (handles user manual hash edit or direct # links)
  window.addEventListener('hashchange', () => {
    if (isProgrammaticRouting) return;
    const parsedView = parseRoute();
    if (parsedView !== state.activeView) {
      navigateTo(parsedView, { updateHash: false });
    }
  });

  // 6. popstate Listener (handles browser Back / Forward buttons)
  window.addEventListener('popstate', (event: PopStateEvent) => {
    if (isProgrammaticRouting) return;
    const stateView = event.state?.view as ViewKey | undefined;
    const targetView = stateView && VALID_VIEWS.includes(stateView) ? stateView : parseRoute();
    if (targetView !== state.activeView) {
      navigateTo(targetView, { updateHash: false });
    }
  });

  // 7. Custom store events
  if (typeof window !== 'undefined') {
    window.addEventListener('snshero_card_nurture_updated', () => {
      renderApp();
    });
    window.addEventListener('snshero_sns_updated', () => {
      renderApp();
    });
  }

  // 8. Initial render
  renderApp();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountLanding);
} else {
  mountLanding();
}
