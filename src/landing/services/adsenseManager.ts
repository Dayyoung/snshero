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
 * Calculates active ad placements strictly based on aspect ratio:
 * - Width > Height (Landscape): Desktop Left & Right side gutters active.
 * - Width <= Height (Portrait): Mobile Top banner active.
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

  const isLandscape = isLandscapeRatio();
  return {
    desktopLeft: isLandscape,
    desktopRight: isLandscape,
    mobileTop: !isLandscape,
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
    ins.style.cssText = 'display:block; width:100%; min-width:280px; max-width:468px; height:50px; min-height:50px; margin:0 auto;';
    ins.setAttribute('data-ad-format', 'horizontal');
    ins.setAttribute('data-full-width-responsive', 'true');
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
 * Dynamically displayed when Width <= Height (Portrait).
 */
export function renderMobileTopBanner(_activeView?: string): string {
  if (isAdRemoved()) return '';

  return `
    <div
      id="adsense-mobile-top"
      class="adsense-banner-top w-full bg-[#f8f7f7] border-b border-[rgba(15,0,0,0.12)] text-center px-2 py-0.5 select-none overflow-hidden"
      style="display: none;"
      aria-label="Google AdSense Mobile Banner"
    >
      <div class="adsense-banner-inner max-w-sm sm:max-w-md mx-auto overflow-hidden">
        <div class="flex items-center justify-between text-[8px] font-mono text-stone-400 uppercase tracking-wider px-1 leading-none mb-0.5">
          <span>[AD] Google Ads</span>
          <span class="text-[7px] text-stone-300">Sponsored</span>
        </div>
        <div class="adsense-slot-wrapper w-full min-h-[50px] flex items-center justify-center overflow-hidden"></div>
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

    // Reset unwanted body padding/margins injected by AdSense
    if (document.body && (document.body.style.paddingTop || document.body.style.marginTop)) {
      document.body.style.paddingTop = '0px';
      document.body.style.marginTop = '0px';
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

  // 2. Aspect Ratio Check: Width > Height (Landscape) vs Width <= Height (Portrait)
  const isLandscape = isLandscapeRatio();

  if (isLandscape) {
    // 화면비율 너비 > 높이: 좌우 배너 표시, 상단 배너 숨김
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
    // 화면비율 너비 <= 높이: 상단 배너 표시, 좌우 배너 숨김
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
 * Initializes a DOM MutationObserver and window listeners to enforce strict
 * AdSense containment and aspect-ratio synchronization in real time.
 */
export function initAdSenseContainmentObserver(): void {
  if (typeof window === 'undefined' || typeof document === 'undefined' || isObserverInitialized) return;
  isObserverInitialized = true;

  try {
    const observer = new MutationObserver(() => {
      cleanupUncontainedAds();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Initial layout pass
    syncAdSenseRatioLayout();
    cleanupUncontainedAds();
  } catch {}

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

      const isLandscape = isLandscapeRatio();

      // Only query active containers for current aspect ratio
      const activeSelector = isLandscape
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
