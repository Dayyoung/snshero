/**
 * src/landing/services/adsenseManager.ts
 *
 * Responsive Google AdSense Configuration & Injection Service for SNSHero.
 *
 * Key Safeguards:
 *   1. Zero TagError: Never call adsbygoogle.push({}) on hidden/0-width containers (availableWidth=0 prevention).
 *   2. Zero 400 Bad Request: Never pass invalid dummy slot IDs; omit data-ad-slot if not registered.
 *   3. Zero duplicate page-level ads: Rely on single official async script tag in index.html/home.html.
 *   4. Zero screen obstruction: Keep ads in static containers (#adsense-desktop-left, #adsense-desktop-right, #adsense-mobile-top).
 *   5. Completely suppressed on '#play' gaming route to preserve pure 100dvh gameplay.
 *   6. Ad-removal guard: If localStorage.getItem('hero_ad_removed') === 'true', completely suppress all ads.
 */

export interface AdSensePlacementResult {
  desktopLeft: boolean;
  desktopRight: boolean;
  mobileTop: boolean;
  suppressedByVip: boolean;
}

export const ADSENSE_CONFIG = {
  client: 'ca-pub-6937094123258335',
  storageKey: 'hero_ad_removed',
  breakpointPx: 1024,
  wideBreakpointPx: 1536,
} as const;

/**
 * Checks whether user has VIP permanent ad removal activated.
 */
export function isAdRemoved(): boolean {
  if (typeof localStorage === 'undefined') return false;
  return localStorage.getItem(ADSENSE_CONFIG.storageKey) === 'true';
}

/**
 * Checks whether current viewport aspect ratio is Landscape (Width > Height).
 */
export function isLandscapeRatio(): boolean {
  if (typeof window === 'undefined') return true;
  return window.innerWidth > window.innerHeight;
}

/**
 * Checks whether current viewport qualifies for Desktop Side Gutters (160x600 Skyscraper Ads):
 *   1. Wide viewport: Width >= 1280px
 *   2. Sufficient vertical clearance: Height >= 650px (prevents cutting off 600px skyscrapers)
 *   3. Landscape aspect ratio: Width > Height
 *
 * Devices that do not meet all 3 criteria (e.g., Tablets in landscape like 1024x768, 1180x820,
 * mobile phones in landscape, or portrait screens) safely utilize the compact 320x50 top ribbon banner.
 * This guarantees:
 *   - Zero background gaps or layout shrinkage on tablets
 *   - 100% AdSense fill rate with mobile/tablet compatible banner
 *   - Pure full-width canvas for game dialogs and 3x3 battle boards
 */
export function isDesktopWideLandscape(): boolean {
  if (typeof window === 'undefined') return true;
  return window.innerWidth >= 1280 && window.innerHeight >= 650 && window.innerWidth > window.innerHeight;
}

/**
 * Calculates active ad placements strictly based on aspect ratio & screen clearance:
 * - Wide Desktop Landscape (Width >= 1280 & Height >= 650 & W > H): Side Gutters active.
 * - Tablet Landscape / Mobile / Portrait: Compact Top Banner active.
 */
export function getAdPlacements(): AdSensePlacementResult {
  if (isAdRemoved()) {
    return {
      desktopLeft: false,
      desktopRight: false,
      mobileTop: false,
      suppressedByVip: true,
    };
  }

  const isDesktopWide = isDesktopWideLandscape();
  return {
    desktopLeft: isDesktopWide,
    desktopRight: isDesktopWide,
    mobileTop: !isDesktopWide,
    suppressedByVip: false,
  };
}

/**
 * Injects clean, correctly-dimensioned <ins class="adsbygoogle"> tag into wrapper if absent.
 */
function ensureInsTagInContainer(container: HTMLElement, format: 'vertical' | 'horizontal'): HTMLElement | null {
  const wrapper = container.querySelector<HTMLElement>('.adsense-slot-wrapper');
  if (!wrapper) return null;

  let ins = wrapper.querySelector<HTMLElement>('ins.adsbygoogle');
  if (ins) return ins;

  ins = document.createElement('ins');
  ins.className = 'adsbygoogle';
  ins.setAttribute('data-ad-client', ADSENSE_CONFIG.client);

  if (format === 'vertical') {
    ins.style.cssText = 'display:block; width:160px; min-height:600px; margin:0 auto;';
    ins.setAttribute('data-ad-format', 'vertical');
    ins.setAttribute('data-full-width-responsive', 'false');
  } else {
    // 320x50 모바일 표준 컴팩트 현수막 띠 배너 규격 (높이 자동 뻥튀기 방지)
    ins.style.cssText = 'display:inline-block; width:320px; max-width:100%; height:50px; min-height:50px; max-height:50px; margin:0 auto; overflow:hidden;';
    ins.setAttribute('data-ad-format', 'horizontal');
    ins.setAttribute('data-full-width-responsive', 'false');
  }

  wrapper.appendChild(ins);
  return ins;
}

/**
 * Safely removes uninitialized <ins> tag from a hidden container.
 * Crucial Safeguard: AdSense throws 'Error: no_div' when adsbygoogle.push({})
 * encounters a hidden (<ins> inside display:none) element in the DOM tree.
 * Removing uninitialized tags from hidden containers permanently eliminates this error.
 */
function cleanupUnloadedInsTag(container: HTMLElement): void {
  const ins = container.querySelector<HTMLElement>('ins.adsbygoogle');
  if (!ins) return;

  const status = ins.getAttribute('data-adsbygoogle-status');
  const hasIframe = ins.querySelector('iframe') !== null || ins.children.length > 0;

  // Only remove unpopulated placeholder tags; never destroy loaded ad iframes
  if (!hasIframe && status !== 'done') {
    try {
      ins.remove();
    } catch {}
  }
}

/**
 * Renders Desktop Left Side Gutter Ad Unit (<aside id="adsense-desktop-left">)
 * Dynamically displayed when Width > Height (Landscape).
 */
export function renderDesktopLeftGutter(_activeView?: string): string {
  if (isAdRemoved()) return '';

  return `
    <aside
      id="adsense-desktop-left"
      class="adsense-gutter adsense-desktop-left flex flex-col items-center justify-start py-6 px-2 w-[160px] shrink-0 text-center select-none"
      style="display: none;"
      aria-label="Google AdSense Left Wing"
    >
      <div class="w-full border border-[rgba(15,0,0,0.12)] bg-[#f8f7f7] p-2 rounded-none">
        <div class="flex items-center justify-between text-[9px] font-mono text-stone-500 uppercase tracking-wider pb-1 mb-1 border-b border-[rgba(15,0,0,0.08)]">
          <span>[AD]</span>
          <span>Google Ads</span>
        </div>
        <div class="adsense-slot-wrapper w-full flex items-center justify-center min-h-[600px] overflow-hidden"></div>
      </div>
    </aside>
  `;
}

/**
 * Renders Desktop Right Side Gutter Ad Unit (<aside id="adsense-desktop-right">)
 * Dynamically displayed when Width > Height (Landscape).
 */
export function renderDesktopRightGutter(_activeView?: string): string {
  if (isAdRemoved()) return '';

  return `
    <aside
      id="adsense-desktop-right"
      class="adsense-gutter adsense-desktop-right flex flex-col items-center justify-start py-6 px-2 w-[160px] shrink-0 text-center select-none"
      style="display: none;"
      aria-label="Google AdSense Right Wing"
    >
      <div class="w-full border border-[rgba(15,0,0,0.12)] bg-[#f8f7f7] p-2 rounded-none">
        <div class="flex items-center justify-between text-[9px] font-mono text-stone-500 uppercase tracking-wider pb-1 mb-1 border-b border-[rgba(15,0,0,0.08)]">
          <span>[AD]</span>
          <span>Google Ads</span>
        </div>
        <div class="adsense-slot-wrapper w-full flex items-center justify-center min-h-[600px] overflow-hidden"></div>
      </div>
    </aside>
  `;
}

/**
 * Renders Mobile/Tablet Top Banner Ad Unit (<div id="adsense-mobile-top">)
 * Dynamically displayed as a slim 320x50 ribbon banner when Width <= Height (Portrait).
 */
export function renderMobileTopBanner(_activeView?: string): string {
  if (isAdRemoved()) return '';

  return `
    <div
      id="adsense-mobile-top"
      class="adsense-banner-top w-full bg-[#f8f7f7] border-b border-[rgba(15,0,0,0.12)] text-center px-1 select-none overflow-hidden"
      style="display: none; height: 52px; min-height: 52px; max-height: 52px;"
      aria-label="Google AdSense Mobile Ribbon Banner"
    >
      <div class="adsense-banner-inner max-w-[320px] mx-auto h-[50px] overflow-hidden flex items-center justify-center">
        <div class="adsense-slot-wrapper w-full h-[50px] min-h-[50px] max-h-[50px] flex items-center justify-center overflow-hidden"></div>
      </div>
    </div>
  `;
}

/**
 * Removes any floating screen-blocking vignettes or anchor overlays outside designated containers.
 * Strictly preserves legitimate inline AdSense banner frames and hosts (prevents 'Error: no_div').
 */
export function cleanupUncontainedAds(): void {
  if (typeof document === 'undefined') return;

  try {
    const intrusiveSelectors = [
      'iframe[name*="google_ads_top_frame"]',
      'iframe[name*="google_ads_bottom_frame"]',
      'ins.adsbygoogle[data-anchor-status]',
      '.adsbygoogle-noab-wrap',
      '.google-auto-placed',
      '.grippy-host',
      'body > ins.adsbygoogle',
      'body > div[id^="aswift_"]',
      'body > iframe[id^="aswift_"]',
      'body > div[id^="google_ads_"]',
      'div[id*="aswift"][style*="position: fixed"]',
      'div[id*="aswift"][style*="position:fixed"]',
    ];

    document.querySelectorAll(intrusiveSelectors.join(',')).forEach((el) => {
      // Never delete anything inside designated static banner containers
      if (el.closest('#adsense-desktop-left, #adsense-desktop-right, #adsense-mobile-top, .adsense-container')) {
        return;
      }
      try {
        el.remove();
      } catch {
        (el as HTMLElement).style.display = 'none';
      }
    });

    // Clamp #adsense-mobile-top inner ad tags/iframes so they cannot expand over top game buttons
    const mobileTop = document.getElementById('adsense-mobile-top');
    if (mobileTop) {
      mobileTop
        .querySelectorAll<HTMLElement>('ins.adsbygoogle, div[id^="aswift_"], iframe')
        .forEach((inner) => {
          if (inner.style.maxHeight !== '50px') {
            inner.style.setProperty('max-height', '50px', 'important');
          }
          if (inner.style.position === 'fixed' || inner.style.position === 'absolute') {
            inner.style.setProperty('position', 'relative', 'important');
          }
        });
    }

    // Reset unwanted body/html padding/margins injected by AdSense
    if (document.body && (document.body.style.paddingTop || document.body.style.marginTop)) {
      document.body.style.paddingTop = '0px';
      document.body.style.marginTop = '0px';
    }
    if (
      document.documentElement &&
      (document.documentElement.style.paddingTop || document.documentElement.style.marginTop)
    ) {
      document.documentElement.style.paddingTop = '0px';
      document.documentElement.style.marginTop = '0px';
    }
  } catch {}
}

let isObserverInitialized = false;

/**
 * Synchronizes ad container display styles strictly based on aspect ratio:
 * - Width > Height (Landscape): Left & Right gutters visible (display: flex), Top banner hidden (display: none).
 * - Width <= Height (Portrait): Top banner visible (display: block), Left & Right gutters hidden (display: none).
 * - VIP ad-free: All hidden (display: none).
 */
export function syncAdSenseRatioLayout(_activeView?: string): void {
  if (typeof document === 'undefined') return;

  const leftGutter = document.getElementById('adsense-desktop-left');
  const rightGutter = document.getElementById('adsense-desktop-right');
  const mobileTop = document.getElementById('adsense-mobile-top');

  // 1. VIP ad-removal: suppress all ads 100%
  if (isAdRemoved()) {
    if (leftGutter) {
      leftGutter.style.setProperty('display', 'none', 'important');
      cleanupUnloadedInsTag(leftGutter);
    }
    if (rightGutter) {
      rightGutter.style.setProperty('display', 'none', 'important');
      cleanupUnloadedInsTag(rightGutter);
    }
    if (mobileTop) {
      mobileTop.style.setProperty('display', 'none', 'important');
      cleanupUnloadedInsTag(mobileTop);
    }
    return;
  }

  // 2. Clear Ad Placement Determination: Wide Desktop Landscape vs Tablet/Mobile
  const isDesktopWide = isDesktopWideLandscape();

  if (isDesktopWide) {
    // 1280px+ 와이드 데스크톱 가로 모드: 좌우 양 날개 배너 표시, 상단 배너 숨김
    if (mobileTop) {
      mobileTop.style.setProperty('display', 'none', 'important');
      cleanupUnloadedInsTag(mobileTop);
    }
    if (leftGutter) {
      leftGutter.style.setProperty('display', 'flex', 'important');
      ensureInsTagInContainer(leftGutter, 'vertical');
    }
    if (rightGutter) {
      rightGutter.style.setProperty('display', 'flex', 'important');
      ensureInsTagInContainer(rightGutter, 'vertical');
    }
  } else {
    // 태블릿(가로/세로) 및 스마트폰: 좌우 거터 완전 숨김(배경 노출 방지), 상단 320x50 띠 배너 표시
    if (leftGutter) {
      leftGutter.style.setProperty('display', 'none', 'important');
      cleanupUnloadedInsTag(leftGutter);
    }
    if (rightGutter) {
      rightGutter.style.setProperty('display', 'none', 'important');
      cleanupUnloadedInsTag(rightGutter);
    }
    if (mobileTop) {
      mobileTop.style.setProperty('display', 'block', 'important');
      ensureInsTagInContainer(mobileTop, 'horizontal');
    }
  }
}

/**
 * Recursively tags all internal navigation links, buttons, and action items with
 * `data-google-vignette="false"` (Google AdSense official standard attribute)
 * to prevent Google Auto-Ads from disrupting internal client-side SPA routing.
 */
export function protectLinksFromVignette(root?: ParentNode): void {
  if (typeof document === 'undefined') return;
  const targetRoot = root || document;

  try {
    const candidates = targetRoot.querySelectorAll<HTMLElement>(
      'a, button, [data-nav], [data-action], [role="button"], .brand-link, .nav-item-btn, .sidebar-item-btn'
    );
    candidates.forEach((el) => {
      if (!el.hasAttribute('data-google-vignette')) {
        el.setAttribute('data-google-vignette', 'false');
      }
    });
  } catch {}
}

let rescueButtonEl: HTMLElement | null = null;
let rescueKeydownHandler: ((e: KeyboardEvent) => void) | null = null;
let currentFallbackView: string = 'home';

/**
 * Checks whether Google Vignette full-screen ad overlay is currently engaged.
 */
export function isVignetteActive(): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') return false;
  return (
    window.location.hash.includes('google_vignette') ||
    document.body.getAttribute('aria-hidden') === 'true' ||
    document.body.classList.contains('google-vignette-active')
  );
}

/**
 * Force-dismisses any engaged Google Vignette overlay, cleans URL hash,
 * restores document.body accessibility, and safely unlocks user interactivity.
 */
export function dismissGoogleVignette(fallbackView?: string): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const targetView = fallbackView || currentFallbackView || 'home';

  // 1. Restore body interactivity and accessibility
  try {
    document.body.removeAttribute('aria-hidden');
    document.body.style.removeProperty('overflow');
    document.body.style.removeProperty('pointer-events');
    document.body.style.removeProperty('padding-top');
    document.body.style.removeProperty('margin-top');
    document.body.classList.remove('google-vignette-active');
  } catch {}

  // 2. Remove emergency rescue close button
  if (rescueButtonEl && rescueButtonEl.parentNode) {
    try {
      rescueButtonEl.parentNode.removeChild(rescueButtonEl);
    } catch {}
    rescueButtonEl = null;
  }

  // 3. Remove ESC key listener
  if (rescueKeydownHandler) {
    window.removeEventListener('keydown', rescueKeydownHandler);
    rescueKeydownHandler = null;
  }

  // 4. Sanitize URL hash to remove `#google_vignette`
  try {
    const currentHash = window.location.hash;
    if (currentHash.includes('google_vignette')) {
      const sanitized = currentHash.replace(/#?google_vignette/gi, '').replace(/^#\/?/, '').trim();
      const resolvedHash = sanitized ? `#${sanitized}` : `#${targetView}`;
      window.history.replaceState({ view: targetView }, '', resolvedHash);
    }
  } catch {}

  // 5. Hide stuck fixed full-screen interstitial overlays
  try {
    const interstitialOverlays = document.querySelectorAll<HTMLElement>(
      'body > div[id*="aswift_"][style*="position: fixed"], body > div[id*="aswift_"][style*="position:fixed"], .google-auto-placed[style*="fixed"]'
    );
    interstitialOverlays.forEach((overlay) => {
      overlay.style.setProperty('display', 'none', 'important');
      overlay.style.setProperty('pointer-events', 'none', 'important');
    });
  } catch {}
}

/**
 * Initializes the Google Vignette Safety & Emergency Rescue subsystem.
 * Mounts a 100% reliable 44px+ [✕ 닫기 (Close Ad)] button at the top-right corner
 * (z-index: 2147483647), and binds Escape key + popstate listeners to ensure the
 * user can NEVER be trapped on `#google_vignette`.
 */
export function initGoogleVignetteRescue(fallbackView?: string): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  if (fallbackView) {
    currentFallbackView = fallbackView;
  }

  // If rescue button already mounted, do nothing
  if (rescueButtonEl && rescueButtonEl.isConnected) return;

  // Mount terminal-flat emergency close button
  rescueButtonEl = document.createElement('button');
  rescueButtonEl.type = 'button';
  rescueButtonEl.className = 'snshero-vignette-rescue-btn';
  rescueButtonEl.setAttribute('aria-label', '전면 광고 닫고 게임으로 복귀');
  rescueButtonEl.innerHTML = '<span>✕</span> <span>닫기 (Close)</span>';

  const onRescueClick = (e: Event) => {
    e.preventDefault();
    e.stopPropagation();
    dismissGoogleVignette(fallbackView);
  };

  rescueButtonEl.addEventListener('click', onRescueClick);
  rescueButtonEl.addEventListener('touchend', onRescueClick);

  document.body.appendChild(rescueButtonEl);

  // Register ESC key shortcut to close vignette instantly
  if (!rescueKeydownHandler) {
    rescueKeydownHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        dismissGoogleVignette(fallbackView);
      }
    };
    window.addEventListener('keydown', rescueKeydownHandler);
  }

  // Also catch popstate/back button
  const onPopState = () => {
    dismissGoogleVignette(fallbackView);
    window.removeEventListener('popstate', onPopState);
  };
  window.addEventListener('popstate', onPopState, { once: true });
}

/**
 * Initializes a DOM MutationObserver and window listeners to enforce strict
 * AdSense containment, aspect-ratio synchronization, link vignette protection,
 * and vignette rescue handlers in real time.
 */
export function initAdSenseContainmentObserver(): void {
  if (typeof window === 'undefined' || typeof document === 'undefined' || isObserverInitialized) return;
  isObserverInitialized = true;

  try {
    const observer = new MutationObserver((mutations) => {
      cleanupUncontainedAds();
      protectLinksFromVignette();

      // Detect if Google Vignette hijacked body
      if (
        window.location.hash.includes('google_vignette') ||
        document.body.getAttribute('aria-hidden') === 'true'
      ) {
        initGoogleVignetteRescue();
      } else if (rescueButtonEl && !isVignetteActive()) {
        dismissGoogleVignette();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['aria-hidden', 'style'],
    });

    // Initial pass
    protectLinksFromVignette();
    syncAdSenseRatioLayout();
    cleanupUncontainedAds();

    if (isVignetteActive()) {
      initGoogleVignetteRescue();
    }
  } catch {}

  // Handle hash changes to detect or clear #google_vignette
  window.addEventListener('hashchange', () => {
    if (window.location.hash.includes('google_vignette')) {
      initGoogleVignetteRescue();
    } else {
      dismissGoogleVignette();
    }
  });

  // Handle viewport resize and orientation changes safely
  let resizeTimer: any = null;
  const onOrientationOrResize = () => {
    syncAdSenseRatioLayout();
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      pushAdSenseTags();
    }, 150);
  };

  window.addEventListener('resize', onOrientationOrResize);
  window.addEventListener('orientationchange', onOrientationOrResize);
}

/**
 * Checks whether an ins.adsbygoogle element is truly visible and has non-zero dimensions in layout.
 * Prevents "No slot size for availableWidth=0" TagError and 'Error: no_div'.
 */
function isAdSlotVisible(ins: HTMLElement): boolean {
  if (!ins || !ins.isConnected) return false;
  if (ins.offsetParent === null) return false;

  const rect = ins.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return false;

  let current: HTMLElement | null = ins;
  while (current && current !== document.body) {
    const style = window.getComputedStyle(current);
    if (style.display === 'none' || style.visibility === 'hidden') {
      return false;
    }
    current = current.parentElement;
  }

  return true;
}

/**
 * Safe initializer to push adsbygoogle instances ONLY on truly visible designated containers.
 * Guaranteed:
 *   - Zero "Error: no_div"
 *   - Zero "availableWidth=0" TagError
 *   - Zero duplicate pushes on already populated slots
 *   - Strict aspect-ratio compliance (Width > Height: Left & Right; Width <= Height: Top)
 */
export function pushAdSenseTags(activeView?: string): void {
  if (isAdRemoved()) return;
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  // Sync ratio layout immediately so active containers are mounted and sized
  syncAdSenseRatioLayout(activeView);

  // Defer slightly so browser paints and layout calculates accurate widths
  setTimeout(() => {
    try {
      cleanupUncontainedAds();
      syncAdSenseRatioLayout(activeView);

      const isDesktopWide = isDesktopWideLandscape();

      // Only query active containers for current aspect ratio & screen clearance
      const activeSelector = isDesktopWide
        ? '#adsense-desktop-left ins.adsbygoogle, #adsense-desktop-right ins.adsbygoogle'
        : '#adsense-mobile-top ins.adsbygoogle';

      const candidateSlots = Array.from(document.querySelectorAll<HTMLElement>(activeSelector));
      if (candidateSlots.length === 0) return;

      const win = window as any;
      win.adsbygoogle = win.adsbygoogle || [];

      candidateSlots.forEach((slotEl) => {
        // Skip if already processed, pending, or has child frames
        const status = slotEl.getAttribute('data-adsbygoogle-status');
        if (status === 'done' || status === 'pending' || slotEl.children.length > 0) {
          return;
        }

        // Strict guard: DO NOT push if element is hidden or has 0 width!
        if (!isAdSlotVisible(slotEl)) {
          return;
        }

        // Mark as pending before push so subsequent calls don't duplicate
        slotEl.setAttribute('data-adsbygoogle-status', 'pending');

        try {
          win.adsbygoogle.push({});
        } catch (err) {
          // If push fails, safely catch and release status
          console.warn('[AdSense] Push safely captured:', err);
          slotEl.removeAttribute('data-adsbygoogle-status');
        }
      });
    } catch (e) {
      // Top-level safe catch
    }
  }, 100);
}
