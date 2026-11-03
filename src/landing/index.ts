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
import { renderHomeSection, setInspectedHomeCardId, getInspectedHomeCardId } from './views/HomeSection';
import {
  renderMyDeckSection,
  setEditingSlotIndex,
  getEditingSlotIndex,
  setSelectedDeckCardId,
  getSelectedDeckCardId,
  setInspectedDeckCardId,
  getInspectedDeckCardId,
} from './views/MyDeckSection';
import { renderPlaySection, handlePlayAction, stopPlayTts } from './views/PlaySection';
import { renderCardSection, setSelectedCardId, setElementFilter, setOwnedFilter } from './views/CardSection';
import {
  renderShopSection,
  executeShopPurchase,
  setUserCoins,
  getUserCoins,
  openGoldExchangeModal,
  closeGoldExchangeModal,
  executeGoldExchange,
  closePackRevealModal,
  getActiveRevealPack,
  isGoldExchangeModalOpen,
  setShopCategoryTab,
  openCoinChargeModal,
  closeCoinChargeModal,
  selectChargeCountry,
  backToCountrySelection,
  selectChargePackage,
  executeCoinCharge,
  openProductDetail,
  closeProductDetail,
  setDetailQty,
  setDetailSize,
  setDetailFaction,
  proceedToShipping,
  backToDetail,
  proceedToGoodsCountry,
  backToShipping,
  selectGoodsPaymentCountry,
  backToGoodsCountrySelection,
  executeGoodsCheckout,
} from './views/ShopSection';
import { loginWithGoogle, loginAsGuest, logoutUser } from './services/authService';
import {
  renderDesktopLeftGutter,
  renderDesktopRightGutter,
  renderMobileTopBanner,
  pushAdSenseTags,
} from './services/adsenseManager';
import { cardNurtureStore } from './services/cardNurtureStore';
import { initIdleAutoPlay } from './services/idleAutoPlayManager';
import { playRpgState, runAutoStep, ensureGameStarted } from './services/playRpgEngine';

interface LandingState {
  activeView: ViewKey;
  activeModal: ModalKey;
  isSidebarOpen: boolean;
  selectedDeckCardId?: number;
}

import {
  VALID_VIEWS,
  HASH_ROUTES,
  LEGACY_ROUTES,
  HASH_VIEW_MAP,
  LEGACY_PATH_MAP,
  LEGACY_ROUTE_MAPPING,
  parseRoute,
  normalizeHashRoute,
  isLegacyRoute,
  getLegacyRedirect,
} from './services/hashRouter';
export * from './services/hashRouter';

const state: LandingState = {
  activeView: 'home',
  activeModal: null,
  isSidebarOpen: false,
  selectedDeckCardId: 1,
};

let isProgrammaticRouting = false;

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

      <!-- Mobile Top AdSense Banner (viewports < 1024px) -->
      ${renderMobileTopBanner()}

      <!-- Side Navigation -->
      <div id="landing-sidebar-slot">
        ${renderSidebar(state.isSidebarOpen, state.activeView)}
      </div>

      <!-- Secondary Action Modals -->
      <div id="landing-modals-slot">
        ${renderModals(state.activeModal)}
      </div>

      <!-- Central Content Area with Desktop Side Gutters (viewports >= 1024px) -->
      <div class="w-full flex-1 flex flex-row justify-center relative min-h-0">
        <!-- Desktop Left Gutter -->
        ${renderDesktopLeftGutter()}

        <!-- Central Main Application Slot -->
        <main id="landing-main-slot" class="w-full max-w-7xl flex-1 flex flex-col min-w-0">
          ${renderActiveViewContent(state.activeView)}
        </main>

        <!-- Desktop Right Gutter -->
        ${renderDesktopRightGutter()}
      </div>

      <!-- Terminal Footer -->
      <div id="landing-footer-slot" class="w-full">
        ${renderFooter()}
      </div>
    </div>
  `;

  pushAdSenseTags();
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
    pushAdSenseTags();
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

  // Auto-start Kadan Journey runner when navigating to #play view
  if (resolvedView === 'play') {
    ensureGameStarted();
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
  const rawTarget = event.target as HTMLElement | null;
  if (!rawTarget) return;

  // Direct Backdrop Click Fallback (Dual Defense Layer 2)
  if (rawTarget.id === 'pack-reveal-modal' || rawTarget.id === 'pack-reveal-backdrop') {
    closePackRevealModal();
    renderApp();
    return;
  }
  if (rawTarget.id === 'gold-exchange-modal' || rawTarget.id === 'gold-exchange-backdrop') {
    closeGoldExchangeModal();
    renderApp();
    return;
  }
  if (rawTarget.id === 'home-card-inspect-modal' || rawTarget.id === 'home-card-inspect-backdrop') {
    setInspectedHomeCardId(null);
    renderApp();
    return;
  }
  if (rawTarget.id === 'deck-card-detail-modal' || rawTarget.id === 'deck-card-modal-backdrop') {
    setInspectedDeckCardId(null);
    renderApp();
    return;
  }
  if (rawTarget.id === 'card-nurture-modal-root' || rawTarget.id === 'card-nurture-modal-backdrop') {
    setSelectedCardId(null);
    renderApp();
    return;
  }
  if (rawTarget.id === 'deck-swap-drawer-backdrop' || rawTarget.id === 'deck-swap-backdrop') {
    setEditingSlotIndex(null);
    renderApp();
    return;
  }
  if (rawTarget.id === 'landing-modal-overlay') {
    state.activeModal = null;
    renderApp();
    return;
  }

  const target = rawTarget.closest('[data-nav], [data-modal], [data-action], a[href^="#"], a[href="/home"]');
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
  } else if (action === 'inspect-home-card') {
    const cardIdStr = target.getAttribute('data-card-id');
    if (cardIdStr) {
      setInspectedHomeCardId(parseInt(cardIdStr, 10));
      renderApp();
    }
  } else if (action === 'close-home-card-inspector') {
    setInspectedHomeCardId(null);
    renderApp();
  } else if (action === 'open-deck-swap-drawer') {
    const slotStr = target.getAttribute('data-slot-index');
    if (slotStr !== null) {
      setEditingSlotIndex(parseInt(slotStr, 10));
      renderApp();
    }
  } else if (action === 'close-deck-swap-drawer') {
    setEditingSlotIndex(null);
    renderApp();
  } else if (action === 'swap-deck-card') {
    const slotStr = target.getAttribute('data-slot-index');
    const cardIdStr = target.getAttribute('data-card-id');
    if (slotStr !== null && cardIdStr) {
      const slotIndex = parseInt(slotStr, 10);
      const cardId = parseInt(cardIdStr, 10);
      const success = cardNurtureStore.setDeckCard(slotIndex, cardId);
      if (success) {
        setSelectedDeckCardId(cardId);
        state.selectedDeckCardId = cardId;
        setEditingSlotIndex(null);
      }
      renderApp();
    }
  } else if (action === 'select-deck-card') {
    const cardIdStr = target.getAttribute('data-card-id');
    if (cardIdStr) {
      const id = parseInt(cardIdStr, 10);
      state.selectedDeckCardId = id;
      setSelectedDeckCardId(id);
      setInspectedDeckCardId(id);
      renderApp();
    }
  } else if (action === 'close-deck-card-modal') {
    setInspectedDeckCardId(null);
    renderApp();
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
    // Prohibited: free EXP buttons completely eliminated in Milestone 4.
    // Ignored to prevent cheat injection.
  } else if (action === 'allocate-stat') {
    const cardId = Number(target.getAttribute('data-card-id'));
    const direction = target.getAttribute('data-direction') as 'top' | 'right' | 'bottom' | 'left';
    if (cardId && direction && cardNurtureStore.isCardOwned(cardId)) {
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
    if (itemId === 'coin_charge' || itemId === 'gold_exchange') {
      openGoldExchangeModal();
      renderApp();
      return;
    }
    if (itemId) {
      const res = executeShopPurchase(itemId);
      if (!res.success) {
        console.warn(res.message);
      }
      renderApp();
    }
  } else if (action === 'switch-shop-tab') {
    const tab = target.getAttribute('data-tab') as any;
    if (tab) {
      setShopCategoryTab(tab);
      renderApp();
    }
  } else if (action === 'open-coin-charge-modal') {
    const pkgId = target.getAttribute('data-package-id') || undefined;
    openCoinChargeModal(pkgId);
    renderApp();
  } else if (action === 'close-coin-charge-modal') {
    closeCoinChargeModal();
    renderApp();
  } else if (action === 'select-charge-package') {
    const pkgId = target.getAttribute('data-package-id');
    if (pkgId) {
      selectChargePackage(pkgId);
      renderApp();
    }
  } else if (action === 'select-charge-country') {
    const countryCode = target.getAttribute('data-country-code');
    if (countryCode) {
      selectChargeCountry(countryCode);
      renderApp();
    }
  } else if (action === 'back-to-country-selection') {
    backToCountrySelection();
    renderApp();
  } else if (action === 'execute-coin-charge') {
    const method = target.getAttribute('data-method') || 'sim';
    executeCoinCharge(method);
    renderApp();
  } else if (action === 'open-product-detail' || action === 'open-goods-modal') {
    const productId = target.getAttribute('data-product-id');
    if (productId) {
      openProductDetail(productId);
      renderApp();
    }
  } else if (action === 'close-product-detail' || action === 'close-goods-modal') {
    closeProductDetail();
    renderApp();
  } else if (action === 'proceed-to-shipping') {
    proceedToShipping();
    renderApp();
  } else if (action === 'back-to-detail') {
    backToDetail();
    renderApp();
  } else if (action === 'back-to-shipping') {
    backToShipping();
    renderApp();
  } else if (action === 'select-goods-country') {
    const countryCode = target.getAttribute('data-country-code');
    if (countryCode) {
      selectGoodsPaymentCountry(countryCode);
      renderApp();
    }
  } else if (action === 'back-to-goods-country') {
    backToGoodsCountrySelection();
    renderApp();
  } else if (action === 'execute-goods-checkout') {
    const method = target.getAttribute('data-method') || 'test_sim';
    executeGoodsCheckout(method);
    renderApp();
  } else if (action === 'open-gold-exchange') {
    openGoldExchangeModal();
    renderApp();
  } else if (action === 'execute-gold-exchange') {
    const res = executeGoldExchange(5000);
    if (!res.success) {
      console.warn(res.message);
    }
    closeGoldExchangeModal();
    renderApp();
  } else if (action === 'close-gold-exchange') {
    closeGoldExchangeModal();
    renderApp();
  } else if (action === 'close-pack-reveal' || action === 'confirm-pack-reveal') {
    closePackRevealModal();
    renderApp();
  } else if (action === 'login-google') {
    loginWithGoogle().then((res) => {
      if (res.success) {
        state.activeModal = null;
        renderApp();
      } else if (!res.isCancelled && res.error) {
        alert(res.error);
      }
    });
  } else if (action === 'login-guest') {
    loginAsGuest();
    state.activeModal = null;
    renderApp();
  } else if (action === 'logout-user') {
    logoutUser().then(() => {
      renderApp();
    });
  } else if (action === 'navigate-to-goods') {
    state.activeModal = null;
    setShopCategoryTab('GOODS');
    navigateTo('shop');
  }
}

export function handleGlobalKeydown(event: KeyboardEvent): void {
  if (state.activeView === 'play') {
    if (event.key === 'ArrowUp' || event.key === 'w' || event.key === 'W') {
      event.preventDefault();
      handlePlayAction('play-move-up');
      renderApp();
      return;
    }
    if (event.key === 'ArrowDown' || event.key === 's' || event.key === 'S') {
      event.preventDefault();
      handlePlayAction('play-move-down');
      renderApp();
      return;
    }
    if (event.key === 'ArrowLeft' || event.key === 'a' || event.key === 'A') {
      event.preventDefault();
      handlePlayAction('play-move-left');
      renderApp();
      return;
    }
    if (event.key === 'ArrowRight' || event.key === 'd' || event.key === 'D') {
      event.preventDefault();
      handlePlayAction('play-move-right');
      renderApp();
      return;
    }
  }

  if (event.key === 'Escape') {
    if (getActiveRevealPack()) {
      closePackRevealModal();
      renderApp();
      return;
    }
    if (isGoldExchangeModalOpen()) {
      closeGoldExchangeModal();
      renderApp();
      return;
    }
    closeCoinChargeModal();
    closeProductDetail();
    if (getInspectedHomeCardId()) {
      setInspectedHomeCardId(null);
      renderApp();
      return;
    }
    if (getEditingSlotIndex() !== null) {
      setEditingSlotIndex(null);
      renderApp();
      return;
    }
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
  if (initialView === 'play') {
    ensureGameStarted();
  }

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
    if (action && (action === 'play-scrub-scene' || action === 'play-arcade-search')) {
      handlePlayAction(action, target);
      renderApp();
    }
  });

  document.addEventListener('submit', (event: Event) => {
    const form = event.target as HTMLFormElement;
    if (form && form.getAttribute('data-action') === 'submit-goods-order') {
      event.preventDefault();
      const formData = new FormData(form);
      const buyerName = String(formData.get('buyer_name') || '').trim();
      const buyerPhone = String(formData.get('buyer_phone') || '').trim();
      const buyerAddress = String(formData.get('buyer_address') || '').trim();
      const quantity = parseInt(String(formData.get('goods_qty') || '1'), 10) || 1;
      const size = String(formData.get('goods_size') || 'M');
      const faction = String(formData.get('goods_faction') || '');

      executeGoodsOrder({
        buyerName,
        buyerPhone,
        buyerAddress,
        quantity,
        size,
        faction,
      });
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
    window.addEventListener('snshero_auth_changed', () => {
      renderApp();
    });
  }

  // 8. Auto-Play Runner interval for #play view
  if (typeof window !== 'undefined') {
    setInterval(() => {
      if (state.activeView === 'play' && playRpgState.autoMode) {
        runAutoStep();
        renderApp();
      }
    }, 1400);
  }

  // 9. Initial render
  renderApp();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountLanding);
} else {
  mountLanding();
}
