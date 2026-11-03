/**
 * src/landing/index.ts
 *
 * Standalone static landing page orchestrator for SNSHero.com.
 * Dual-entry MPA architecture: Zero React runtime, zero server dependencies.
 * Full client-side hash routing (#home, #deck, #play, #card, #shop, #mall).
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
import {
  renderCardSection,
  setSelectedCardId,
  getSelectedCardId,
  setElementFilter,
  setOwnedFilter,
} from './views/CardSection';
import { renderBookSection, handleBookAction, initBookEpisodeFromUrl } from './views/BookSection';
import {
  renderWebtoonSection,
  handleWebtoonAction,
  initWebtoonEpisodeFromUrl,
  isWebtoonLightboxOpen,
  closeWebtoonLightbox,
} from './views/WebtoonSection';
import {
  renderShopView,
  executeShopPurchase,
  getUserCoins,
  getUserGold,
  setShopCurrentTab,
  openCoinChargeModal,
  closeCoinChargeModal,
  selectChargeCountry,
  backToCountrySelection,
  backToPackageSelection,
  backToPaymentSelection,
  selectChargePackage,
  executeCoinCharge,
  selectCryptoCoin,
  selectCryptoChain,
  backToCryptoCoinSelection,
  setCryptoSearchQuery,
  copyCryptoDepositAddress,
  verifyCryptoDepositStatus,
  clearPackReveal,
} from './views/ShopSection';
import {
  renderMallView,
  openMallProductDetail,
  closeMallModal,
  setMallQty,
  setMallSize,
  setMallFaction,
  proceedMallToShipping,
  backMallToDetail,
  submitMallShipping,
  backMallToShipping,
  selectMallCountry,
  backMallToCountry,
  executeMallCheckout,
  selectMallCryptoCoin,
  selectMallCryptoChain,
  backMallToCryptoCoin,
  backMallToPayment,
  copyMallCryptoAddress,
  verifyMallCryptoDeposit,
  openMallOrdersList,
  setMallCurrentTab,
} from './views/MallSection';
import { checkAndProcessPayAppSuccess } from './services/paymentService';
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
  if (view === 'shop') return renderShopView();
  if (view === 'mall') return renderMallView();
  if (view === 'book') return renderBookSection();
  if (view === 'webtoon') return renderWebtoonSection();
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
  if (rawTarget.id === 'webtoon-lightbox-modal') {
    closeWebtoonLightbox();
    renderApp();
    return;
  }
  if (rawTarget.id === 'pack-reveal-modal' || rawTarget.id === 'pack-reveal-backdrop') {
    clearPackReveal();
    renderApp();
    return;
  }
  if (rawTarget.id === 'home-card-inspect-modal' || rawTarget.id === 'home-card-inspect-backdrop') {
    setInspectedHomeCardId(null);
    renderApp();
    return;
  }
  if (
    rawTarget.id === 'deck-card-inspect-modal' ||
    rawTarget.id === 'deck-card-inspect-backdrop' ||
    rawTarget.id === 'deck-card-detail-modal' ||
    rawTarget.id === 'deck-card-modal-backdrop'
  ) {
    setInspectedDeckCardId(null);
    renderApp();
    return;
  }
  if (rawTarget.id === 'deck-swap-drawer-backdrop' || rawTarget.id === 'deck-swap-backdrop') {
    setEditingSlotIndex(null);
    renderApp();
    return;
  }
  if (rawTarget.id === 'card-nurture-modal-root' || rawTarget.id === 'card-nurture-modal-backdrop') {
    setSelectedCardId(null);
    renderApp();
    return;
  }
  if (rawTarget.id === 'coin-charge-modal') {
    closeCoinChargeModal();
    renderApp();
    return;
  }
  if (
    rawTarget.id === 'mall-detail-modal' ||
    rawTarget.id === 'mall-shipping-modal' ||
    rawTarget.id === 'mall-country-modal' ||
    rawTarget.id === 'mall-payment-modal' ||
    rawTarget.id === 'mall-celebration-modal' ||
    rawTarget.id === 'mall-crypto-modal' ||
    rawTarget.id === 'mall-orders-modal'
  ) {
    closeMallModal();
    renderApp();
    return;
  }

  const target = rawTarget.closest('[data-nav], [data-modal], [data-action]') as HTMLElement | null;
  if (!target) return;

  // Check 1: Top/Side Nav Button Navigation
  const navKey = target.getAttribute('data-nav') as ViewKey | null;
  if (navKey) {
    navigateTo(navKey);
    return;
  }

  // Check 2: Modal Triggers
  const modalKey = target.getAttribute('data-modal') as ModalKey | null;
  if (modalKey) {
    state.activeModal = modalKey;
    state.isSidebarOpen = false;
    renderApp();
    return;
  }

  // Check 3: Actions
  const action = target.getAttribute('data-action');
  if (!action) return;

  if (action === 'toggle-sidebar') {
    state.isSidebarOpen = !state.isSidebarOpen;
    renderApp();
  } else if (action === 'close-sidebar') {
    state.isSidebarOpen = false;
    renderApp();
  } else if (action === 'close-modal') {
    state.activeModal = null;
    renderApp();
  } else if (action === 'inspect-home-card') {
    const cardId = Number(target.getAttribute('data-card-id'));
    if (cardId) {
      setInspectedHomeCardId(cardId);
      renderApp();
    }
  } else if (action === 'close-home-card-inspect' || action === 'close-home-card-inspector') {
    setInspectedHomeCardId(null);
    renderApp();
  } else if (action === 'inspect-deck-card' || action === 'select-deck-card') {
    const cardId = Number(target.getAttribute('data-card-id'));
    if (cardId) {
      setSelectedDeckCardId(cardId);
      setInspectedDeckCardId(cardId);
      renderApp();
    }
  } else if (action === 'close-deck-card-inspect' || action === 'close-deck-card-modal') {
    setInspectedDeckCardId(null);
    renderApp();
  } else if (action === 'open-deck-swap-drawer') {
    const slotIdx = Number(target.getAttribute('data-slot-index'));
    if (!isNaN(slotIdx)) {
      setEditingSlotIndex(slotIdx);
      renderApp();
    }
  } else if (action === 'close-deck-swap-drawer') {
    setEditingSlotIndex(null);
    renderApp();
  } else if (action === 'swap-deck-slot-card' || action === 'swap-deck-card') {
    const cardId = Number(target.getAttribute('data-card-id'));
    const slotAttr = target.getAttribute('data-slot-index');
    const slotIndex = slotAttr !== null ? Number(slotAttr) : getEditingSlotIndex();
    if (cardId && slotIndex !== null && !isNaN(slotIndex) && cardNurtureStore.isCardOwned(cardId)) {
      cardNurtureStore.setDeckCard(slotIndex, cardId);
      setEditingSlotIndex(null);
      setSelectedDeckCardId(cardId);
      renderApp();
    }
  } else if (action === 'select-card') {
    const cardId = Number(target.getAttribute('data-card-id'));
    if (cardId) {
      setSelectedCardId(cardId);
      renderApp();
    }
  } else if (action === 'close-card-inspector') {
    setSelectedCardId(null);
    renderApp();
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
      setShopCurrentTab(tab);
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
  } else if (action === 'back-to-package-selection') {
    backToPackageSelection();
    renderApp();
  } else if (action === 'back-to-payment-selection') {
    backToPaymentSelection();
    renderApp();
  } else if (action === 'execute-coin-charge') {
    const method = target.getAttribute('data-method') || 'test_sim';
    executeCoinCharge(method).then(() => {
      renderApp();
    });
  } else if (action === 'select-crypto-coin') {
    const coinId = target.getAttribute('data-ccy') || target.getAttribute('data-coin-id');
    if (coinId) {
      selectCryptoCoin(coinId);
      renderApp();
    }
  } else if (action === 'select-crypto-chain') {
    const chainId = target.getAttribute('data-chain') || target.getAttribute('data-chain-id');
    if (chainId) {
      selectCryptoChain(chainId);
      renderApp();
    }
  } else if (action === 'back-to-crypto-coin') {
    backToCryptoCoinSelection();
    renderApp();
  } else if (action === 'copy-crypto-address') {
    const addr = target.getAttribute('data-address') || '';
    copyCryptoDepositAddress(addr);
    renderApp();
  } else if (action === 'verify-crypto-deposit') {
    verifyCryptoDepositStatus();
    renderApp();
  } else if (action === 'close-pack-reveal' || action === 'confirm-pack-reveal') {
    clearPackReveal();
    renderApp();
  }
  // ── Mall (공식 굿즈 몰) Actions ──────────────────────────────────────────
  else if (action === 'switch-mall-tab') {
    const tab = target.getAttribute('data-tab') as any;
    if (tab) {
      setMallCurrentTab(tab);
      renderApp();
    }
  } else if (action === 'open-mall-detail') {
    const productId = target.getAttribute('data-product-id');
    if (productId) {
      openMallProductDetail(productId);
      renderApp();
    }
  } else if (action === 'close-mall-modal') {
    closeMallModal();
    renderApp();
  } else if (action === 'change-mall-qty') {
    const delta = parseInt(target.getAttribute('data-delta') || '0', 10);
    const currQty = parseInt(target.parentElement?.querySelector('span')?.textContent || '1', 10);
    setMallQty(currQty + delta);
    renderApp();
  } else if (action === 'select-mall-size') {
    const size = target.getAttribute('data-size');
    if (size) {
      setMallSize(size);
      renderApp();
    }
  } else if (action === 'change-mall-faction') {
    const sel = target as HTMLSelectElement;
    if (sel && sel.value) {
      setMallFaction(sel.value);
    }
  } else if (action === 'proceed-mall-shipping') {
    proceedMallToShipping();
    renderApp();
  } else if (action === 'back-mall-detail') {
    backMallToDetail();
    renderApp();
  } else if (action === 'submit-mall-shipping') {
    const nameInput = document.getElementById('mall-buyer-name') as HTMLInputElement | null;
    const phoneInput = document.getElementById('mall-buyer-phone') as HTMLInputElement | null;
    const addrInput = document.getElementById('mall-buyer-address') as HTMLInputElement | null;
    const ok = submitMallShipping({
      name: nameInput?.value || '',
      phone: phoneInput?.value || '',
      address: addrInput?.value || '',
    });
    if (ok) {
      renderApp();
    }
  } else if (action === 'back-mall-shipping') {
    backMallToShipping();
    renderApp();
  } else if (action === 'select-mall-country') {
    const countryCode = target.getAttribute('data-country-code');
    if (countryCode) {
      selectMallCountry(countryCode);
      renderApp();
    }
  } else if (action === 'back-mall-country') {
    backMallToCountry();
    renderApp();
  } else if (action === 'execute-mall-checkout') {
    const method = target.getAttribute('data-method') || 'test_sim';
    executeMallCheckout(method).then(() => {
      renderApp();
    });
  } else if (action === 'select-mall-crypto-coin') {
    const coinId = target.getAttribute('data-ccy') || target.getAttribute('data-coin-id');
    if (coinId) {
      selectMallCryptoCoin(coinId);
      renderApp();
    }
  } else if (action === 'select-mall-crypto-chain') {
    const chainId = target.getAttribute('data-chain') || target.getAttribute('data-chain-id');
    if (chainId) {
      selectMallCryptoChain(chainId);
      renderApp();
    }
  } else if (action === 'back-mall-crypto-coin') {
    backMallToCryptoCoin();
    renderApp();
  } else if (action === 'back-mall-payment') {
    backMallToPayment();
    renderApp();
  } else if (action === 'copy-mall-crypto-address') {
    const addr = target.getAttribute('data-address') || '';
    copyMallCryptoAddress(addr);
    renderApp();
  } else if (action === 'verify-mall-crypto-deposit') {
    verifyMallCryptoDeposit();
    renderApp();
  } else if (action === 'open-mall-orders') {
    openMallOrdersList();
    renderApp();
  }
  // ── Play (#play) Actions ─────────────────────────────────────────────────
  else if (action && action.startsWith('play-')) {
    if (target.tagName === 'SELECT' || target.tagName === 'OPTION' || target.tagName === 'INPUT') {
      return;
    }
    handlePlayAction(action, target);
    renderApp();
  }
  // ── Book (웹소설) & Webtoon (웹툰) Actions ────────────────────────────────
  else if (action && action.startsWith('book-')) {
    // Dropdown selects and text inputs must be handled by 'change'/'input' events, not 'click'
    if (target.tagName === 'SELECT' || target.tagName === 'OPTION' || target.tagName === 'INPUT') {
      return;
    }
    handleBookAction(action, target);
    renderApp();
    if (
      action === 'book-prev-episode' ||
      action === 'book-next-episode' ||
      action === 'book-jump-episode' ||
      action === 'book-select-episode'
    ) {
      try {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        if (document.documentElement) document.documentElement.scrollTop = 0;
        if (document.body) document.body.scrollTop = 0;
      } catch {}
    }
  } else if (action && action.startsWith('webtoon-')) {
    // Dropdown selects and text inputs must be handled by 'change'/'input' events, not 'click'
    if (target.tagName === 'SELECT' || target.tagName === 'OPTION' || target.tagName === 'INPUT') {
      return;
    }
    handleWebtoonAction(action, target);
    renderApp();
    if (
      action === 'webtoon-prev-episode' ||
      action === 'webtoon-next-episode' ||
      action === 'webtoon-jump-episode' ||
      action === 'webtoon-select-episode'
    ) {
      try {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        if (document.documentElement) document.documentElement.scrollTop = 0;
        if (document.body) document.body.scrollTop = 0;
      } catch {}
    }
  }
  // ── Auth Actions ────────────────────────────────────────────────────────
  else if (action === 'login-google') {
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
  }
}

export function handleGlobalKeydown(event: KeyboardEvent): void {
  // Webtoon Lightbox (Fullscreen Zoom) Left / Right / ESC Keydown handling
  if (isWebtoonLightboxOpen()) {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      handleWebtoonAction('webtoon-lightbox-prev');
      renderApp();
      return;
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      handleWebtoonAction('webtoon-lightbox-next');
      renderApp();
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      closeWebtoonLightbox();
      renderApp();
      return;
    }
  }

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
    if (event.key === ' ') {
      event.preventDefault();
      handlePlayAction('play-manual-step');
      renderApp();
      return;
    }
  }

  if (event.key === 'Escape') {
    if (getInspectedDeckCardId()) {
      setInspectedDeckCardId(null);
      renderApp();
      return;
    }
    if (getSelectedCardId()) {
      setSelectedCardId(null);
      renderApp();
      return;
    }
    closeCoinChargeModal();
    closeMallModal();
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
      if (playRpgState.subState !== 'map') {
        handlePlayAction('play-dialogue-close');
        renderApp();
      }
    }
  }
}

export function mountLanding(): void {
  // Check for returning payment success query parameters (PayApp redirect)
  const payResult = checkAndProcessPayAppSuccess();
  if (payResult.handled) {
    console.log('[SNSHero] Payment returned successfully:', payResult);
  }

  // 1. Initial route resolution
  const initialView = parseRoute();
  state.activeView = initialView;
  if (initialView === 'play') {
    ensureGameStarted();
  } else if (initialView === 'book') {
    initBookEpisodeFromUrl();
  } else if (initialView === 'webtoon') {
    initWebtoonEpisodeFromUrl();
  }

  // 2. Normalize initial URL to `#${initialView}` without wiping query parameters
  const currentHash = window.location.hash;
  if (!currentHash || !currentHash.startsWith(`#${initialView}`)) {
    const targetHash = `#${initialView}`;
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
    } else if (action && action.startsWith('book-')) {
      handleBookAction(action, target);
      renderApp();
      try {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        if (document.documentElement) document.documentElement.scrollTop = 0;
        if (document.body) document.body.scrollTop = 0;
      } catch {}
    } else if (action && action.startsWith('webtoon-')) {
      handleWebtoonAction(action, target);
      renderApp();
      try {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        if (document.documentElement) document.documentElement.scrollTop = 0;
        if (document.body) document.body.scrollTop = 0;
      } catch {}
    }
  });
  document.addEventListener('input', (event: Event) => {
    const target = event.target as HTMLElement;
    const action = target?.getAttribute('data-action');
    if (action && (action === 'play-scrub-scene' || action === 'play-arcade-search')) {
      handlePlayAction(action, target);
      renderApp();
    } else if (action === 'crypto-search-coin') {
      const inputEl = target as HTMLInputElement;
      const val = inputEl?.value || '';
      const selStart = inputEl?.selectionStart ?? val.length;
      setCryptoSearchQuery(val);
      renderApp();
      const restoredInput = document.getElementById('crypto-coin-search-input') as HTMLInputElement | null;
      if (restoredInput) {
        restoredInput.focus();
        try {
          restoredInput.setSelectionRange(selStart, selStart);
        } catch {}
      }
    } else if (action && action.startsWith('webtoon-')) {
      handleWebtoonAction(action, target);
      renderApp();
    }
  });

  window.addEventListener('keydown', handleGlobalKeydown);

  // 5. hashchange Listener (handles user manual hash edit or direct # links)
  window.addEventListener('hashchange', () => {
    if (isProgrammaticRouting) return;
    checkAndProcessPayAppSuccess();
    const parsedView = parseRoute();
    if (parsedView === 'book') {
      initBookEpisodeFromUrl();
    } else if (parsedView === 'webtoon') {
      initWebtoonEpisodeFromUrl();
    }
    if (parsedView !== state.activeView) {
      navigateTo(parsedView, { updateHash: false });
    } else {
      renderApp();
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
    window.addEventListener('snshero_payapp_processed', () => {
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
