// ==========================================================================
// SNSHero.com - G-went : Responsive Mobile Controller (responsive.js)
// ==========================================================================

(function() {
  'use strict';

  let currentMobileTab = 'bank'; // 'bank' or 'deck'
  let rotatePromptDismissed = false;

  // Zoom & Pan state for in-game board
  let currentScale = 1.0;
  let posX = 0;
  let posY = 0;
  const minScale = 1.0;
  const maxScale = 3.5;

  let isPinching = false;
  let startPinchDist = 0;
  let startPinchScale = 1.0;

  let isPanning = false;
  let touchStartX = 0;
  let touchStartY = 0;
  let panStartX = 0;
  let panStartY = 0;
  let lastTouchTime = 0;
  let toastTimer = null;

  function initMobileSystem() {
    setupMobileTabs();
    setupRotateOverlay();
    setupTouchZoomControls();
    setupTouchGestures();
    updateTabBadges();

    // Viewport & Orientation events
    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('orientationchange', () => {
      setTimeout(handleViewportChange, 150);
    });
    window.addEventListener('gwent-language-changed', handleLanguageChange);

    // Watch start-game button click to check rotation
    const startBtn = document.getElementById('start-game');
    if (startBtn) {
      startBtn.addEventListener('click', () => {
        setTimeout(handleViewportChange, 300);
      });
    }

    // Exit game button reset
    const exitBtn = document.getElementById('exit-game');
    if (exitBtn) {
      exitBtn.addEventListener('click', () => {
        rotatePromptDismissed = false;
        resetZoom(false);
        setTimeout(handleViewportChange, 300);
      });
    }

    // Initial check
    handleViewportChange();
  }

  // --------------------------------------------------------------------------
  // 1. Mobile Deckbuilder Tabs
  // --------------------------------------------------------------------------
  function setupMobileTabs() {
    const tabBank = document.getElementById('mobile-tab-bank');
    const tabDeck = document.getElementById('mobile-tab-deck');

    if (tabBank) {
      tabBank.addEventListener('click', (e) => {
        e.preventDefault();
        setMobileTab('bank');
      });
    }

    if (tabDeck) {
      tabDeck.addEventListener('click', (e) => {
        e.preventDefault();
        setMobileTab('deck');
      });
    }

    // Set initial default tab view
    setMobileTab('bank');

    // Auto-update badges periodically
    setInterval(updateTabBadges, 400);
  }

  function setMobileTab(tab) {
    currentMobileTab = tab;
    const tabBank = document.getElementById('mobile-tab-bank');
    const tabDeck = document.getElementById('mobile-tab-deck');
    const bankElem = document.getElementById('card-bank');
    const deckElem = document.getElementById('card-deck');

    if (tab === 'bank') {
      tabBank?.classList.add('active');
      tabDeck?.classList.remove('active');
      document.body.classList.add('mobile-view-bank');
      document.body.classList.remove('mobile-view-deck');
      bankElem?.classList.add('mobile-active');
      deckElem?.classList.remove('mobile-active');
      if (bankElem) bankElem.scrollTop = 0;
    } else {
      tabDeck?.classList.add('active');
      tabBank?.classList.remove('active');
      document.body.classList.add('mobile-view-deck');
      document.body.classList.remove('mobile-view-bank');
      deckElem?.classList.add('mobile-active');
      bankElem?.classList.remove('mobile-active');
      if (deckElem) deckElem.scrollTop = 0;
    }

    if (window.AudioManager) {
      AudioManager.playSFX('ui_card');
    }
  }

  function updateTabBadges() {
    const bankBadge = document.getElementById('mobile-tab-bank-count');
    const deckBadge = document.getElementById('mobile-tab-deck-count');

    if (window.dm) {
      if (bankBadge && dm.bank) {
        const bankCount = dm.bank.filter(c => c.count > 0).length;
        bankBadge.innerText = bankCount;
      }
      if (deckBadge && dm.deck) {
        const deckCount = dm.deck.filter(c => c.count > 0).reduce((sum, c) => sum + c.count, 0);
        deckBadge.innerText = deckCount;
      }
    }
  }

  // --------------------------------------------------------------------------
  // 2. Screen Rotation Prompt Overlay (During Battle)
  // --------------------------------------------------------------------------
  function setupRotateOverlay() {
    const overlay = document.getElementById('rotate-device-overlay');
    const dismissBtn = document.getElementById('rotate-dismiss-btn');

    if (dismissBtn) {
      dismissBtn.addEventListener('click', () => {
        rotatePromptDismissed = true;
        overlay?.classList.add('hide');
        
        // Show in-game zoom controls & hint toast
        showZoomToast();
        const zoomControls = document.getElementById('board-zoom-controls');
        zoomControls?.classList.remove('hide');
        resetZoom(false);
      });
    }
  }

  function handleViewportChange() {
    const isPortrait = window.innerHeight > window.innerWidth;
    const isMobileWidth = window.innerWidth <= 768;
    const isGameActive = document.getElementById('deck-customization')?.classList.contains('hide');

    const rotateOverlay = document.getElementById('rotate-device-overlay');
    const zoomControls = document.getElementById('board-zoom-controls');

    if (isGameActive) {
      document.body.classList.add('in-game-active');
      if (isPortrait && isMobileWidth && !rotatePromptDismissed) {
        rotateOverlay?.classList.remove('hide');
        zoomControls?.classList.add('hide');
      } else {
        rotateOverlay?.classList.add('hide');
        if (isMobileWidth) {
          zoomControls?.classList.remove('hide');
        } else {
          zoomControls?.classList.add('hide');
        }

        if (!isPortrait) {
          // Reset dismiss flag when rotated to landscape
          rotatePromptDismissed = false;
          resetZoom(false);
        }
      }
    } else {
      document.body.classList.remove('in-game-active');
      rotateOverlay?.classList.add('hide');
      zoomControls?.classList.add('hide');
      resetZoom(false);
    }
  }

  // --------------------------------------------------------------------------
  // 3. Multitouch Pinch-to-Zoom & Pan Engine for In-game Board
  // --------------------------------------------------------------------------
  function setupTouchZoomControls() {
    const btnIn = document.getElementById('btn-zoom-in');
    const btnOut = document.getElementById('btn-zoom-out');
    const btnReset = document.getElementById('btn-zoom-reset');

    function bindButton(btn, action) {
      if (!btn) return;
      let handled = false;
      btn.addEventListener('touchend', (e) => {
        e.preventDefault();
        e.stopPropagation();
        handled = true;
        action();
        setTimeout(() => { handled = false; }, 300);
      }, { passive: false });
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!handled) action();
      });
    }

    bindButton(btnIn, () => zoomBy(0.35));
    bindButton(btnOut, () => zoomBy(-0.35));
    bindButton(btnReset, () => resetZoom(true));
  }

  function zoomBy(delta) {
    const newScale = Math.min(Math.max(currentScale + delta, minScale), maxScale);
    if (newScale === currentScale) return;
    currentScale = newScale;
    clampPosition();
    updateBoardTransform(true);
  }

  function resetZoom(animated) {
    currentScale = 1.0;
    posX = 0;
    posY = 0;
    updateBoardTransform(animated);
  }

  function clampPosition() {
    if (currentScale <= 1.0) {
      posX = 0;
      posY = 0;
      return;
    }

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const boardH = vw * 1080 / 1920;

    // Allow panning scaled content within comfortable view limits
    const maxOffsetX = (vw * (currentScale - 1)) / 2 + 60;
    const maxOffsetY = Math.max(0, (boardH * currentScale - vh) / 2 + 100);

    posX = Math.max(-maxOffsetX, Math.min(maxOffsetX, posX));
    posY = Math.max(-maxOffsetY, Math.min(maxOffsetY, posY));
  }

  function updateBoardTransform(animated) {
    const mainBoard = document.querySelector('main');
    if (!mainBoard) return;

    if (animated) {
      mainBoard.style.transition = 'transform 0.25s cubic-bezier(0.2, 0.9, 0.3, 1)';
    } else {
      mainBoard.style.transition = 'none';
    }

    const isPortrait = window.innerHeight > window.innerWidth;
    const isMobileWidth = window.innerWidth <= 768;

    if (isPortrait && isMobileWidth) {
      mainBoard.style.transform = `translate3d(${posX}px, ${posY}px, 0) scale(${currentScale})`;
    } else {
      // Landscape or Desktop: keep default or allow subtle zoom
      if (currentScale > 1.0) {
        mainBoard.style.transform = `translateX(-50%) translate3d(${posX}px, ${posY}px, 0) scale(${currentScale})`;
      } else {
        mainBoard.style.transform = '';
      }
    }

    const zoomResetBtn = document.getElementById('btn-zoom-reset');
    if (zoomResetBtn) {
      zoomResetBtn.innerText = currentScale.toFixed(1) + 'x';
    }
  }

  function setupTouchGestures() {
    const mainBoard = document.querySelector('main');
    if (!mainBoard) return;

    let touchDistance = 0;

    function getTouchDist(t1, t2) {
      return Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
    }

    window.addEventListener('touchstart', (e) => {
      const isGameActive = document.getElementById('deck-customization')?.classList.contains('hide');
      if (!isGameActive) return;

      // Ignore touches on zoom controls or modals
      if (e.target.closest('#board-zoom-controls') || 
          e.target.closest('#rotate-device-overlay') || 
          e.target.closest('#rules-modal') || 
          e.target.closest('#card-gallery-modal')) {
        return;
      }

      if (e.touches.length === 2) {
        isPinching = true;
        isPanning = false;
        startPinchDist = getTouchDist(e.touches[0], e.touches[1]);
        startPinchScale = currentScale;
        panStartX = posX;
        panStartY = posY;
      } else if (e.touches.length === 1) {
        isPinching = false;
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        panStartX = posX;
        panStartY = posY;
        touchDistance = 0;

        // Double-tap zoom check
        const now = Date.now();
        if (now - lastTouchTime < 300) {
          if (currentScale > 1.1) {
            resetZoom(true);
          } else {
            currentScale = 2.0;
            // Center near touch point
            const vw = window.innerWidth;
            const vh = window.innerHeight;
            posX = (vw / 2 - touchStartX) * 0.8;
            posY = (vh / 2 - touchStartY) * 0.8;
            clampPosition();
            updateBoardTransform(true);
          }
          lastTouchTime = 0;
          return;
        }
        lastTouchTime = now;
      }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      const isGameActive = document.getElementById('deck-customization')?.classList.contains('hide');
      if (!isGameActive) return;

      if (isPinching && e.touches.length === 2) {
        const currentDist = getTouchDist(e.touches[0], e.touches[1]);
        if (startPinchDist > 0) {
          const factor = currentDist / startPinchDist;
          currentScale = Math.min(Math.max(startPinchScale * factor, minScale), maxScale);
          clampPosition();
          updateBoardTransform(false);
          if (e.cancelable) e.preventDefault();
        }
      } else if (e.touches.length === 1 && currentScale > 1.05) {
        const dx = e.touches[0].clientX - touchStartX;
        const dy = e.touches[0].clientY - touchStartY;
        touchDistance = Math.hypot(dx, dy);

        if (touchDistance > 8) {
          isPanning = true;
          posX = panStartX + dx;
          posY = panStartY + dy;
          clampPosition();
          updateBoardTransform(false);
          if (e.cancelable) e.preventDefault();
        }
      }
    }, { passive: false });

    window.addEventListener('touchend', () => {
      isPinching = false;
      isPanning = false;
    }, { passive: true });
  }

  function showZoomToast(message) {
    const toast = document.getElementById('board-zoom-toast');
    const toastText = document.getElementById('board-zoom-toast-text');
    if (!toast) return;

    const isEn = window.I18N && I18N.currentLang === 'en';
    const defaultMsg = isEn 
      ? '💡 Pinch with two fingers or use zoom buttons to scale.' 
      : '💡 두 손가락으로 전장을 확대/축소하거나 이동할 수 있습니다.';

    if (toastText) {
      toastText.innerText = message || defaultMsg;
    }

    toast.classList.remove('hide');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.add('hide');
    }, 2800);
  }

  // --------------------------------------------------------------------------
  // 4. Multilingual Translation
  // --------------------------------------------------------------------------
  function handleLanguageChange(e) {
    const isEn = e.detail && e.detail.lang === 'en';
    
    // Tab labels
    const tabBankText = document.getElementById('mobile-tab-bank-text');
    const tabDeckText = document.getElementById('mobile-tab-deck-text');
    if (tabBankText) tabBankText.innerText = isEn ? 'Card Collection' : '보유 카드 컬렉션';
    if (tabDeckText) tabDeckText.innerText = isEn ? 'Cards in Deck' : '덱 편성 카드';

    // Rotation prompt
    const rotateTitle = document.getElementById('rotate-prompt-title');
    const rotateDesc = document.getElementById('rotate-prompt-desc');
    const rotateBtn = document.getElementById('rotate-dismiss-btn');

    if (rotateTitle) rotateTitle.innerText = isEn ? 'Please Rotate to Landscape' : '화면을 가로로 돌려주세요';
    if (rotateDesc) rotateDesc.innerText = isEn 
      ? 'Gwent battlefield and hand cards are best experienced in Landscape mode.' 
      : '궨트는 가로 모드(Landscape)에서 전장과 손패가 가장 넓고 선명하게 표시됩니다.';
    if (rotateBtn) rotateBtn.innerText = isEn ? 'Continue in Portrait' : '세로 모드로 계속하기';

    // Toast label
    const toastText = document.getElementById('board-zoom-toast-text');
    if (toastText) {
      toastText.innerText = isEn 
        ? '💡 Pinch with two fingers or use zoom buttons to scale.' 
        : '💡 두 손가락으로 전장을 확대/축소하거나 이동할 수 있습니다.';
    }
  }

  // Bootstrap when DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMobileSystem);
  } else {
    initMobileSystem();
  }

  window.ResponsiveController = {
    setMobileTab,
    updateTabBadges,
    handleViewportChange,
    zoomBy,
    resetZoom,
    showZoomToast
  };
})();
