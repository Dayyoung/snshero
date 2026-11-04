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
 * Calculates active ad placements for a given viewport width.
 */
export function getAdPlacements(viewportWidth?: number): AdSensePlacementResult {
  if (isAdRemoved()) {
    return {
      desktopLeft: false,
      desktopRight: false,
      mobileTop: false,
      suppressedByVip: true,
    };
  }

  const width =
    viewportWidth !== undefined
      ? viewportWidth
      : typeof window !== 'undefined'
      ? window.innerWidth
      : 1024;

  if (width >= ADSENSE_CONFIG.wideBreakpointPx) {
    return {
      desktopLeft: true,
      desktopRight: true,
      mobileTop: false,
      suppressedByVip: false,
    };
  }

  return {
    desktopLeft: false,
    desktopRight: false,
    mobileTop: true,
    suppressedByVip: false,
  };
}

/**
 * Renders Desktop Left Side Gutter Ad Unit (<aside id="adsense-desktop-left">)
 * Restricted to ultra-wide desktop viewports (>= 1536px 2xl) to prevent encroaching on main content.
 * Completely hidden on game viewports ('play') to guarantee zero game/touch obstruction.
 */
export function renderDesktopLeftGutter(activeView?: string): string {
  if (isAdRemoved() || activeView === 'play') return '';

  return `
    <aside
      id="adsense-desktop-left"
      class="adsense-gutter adsense-desktop-left hidden 2xl:flex flex-col items-center justify-start py-6 px-2 w-[160px] shrink-0 text-center select-none"
      aria-label="Google AdSense Left Wing"
    >
      <div class="w-full border border-[rgba(15,0,0,0.12)] bg-[#f8f7f7] p-2 rounded-none">
        <div class="flex items-center justify-between text-[9px] font-mono text-stone-500 uppercase tracking-wider pb-1 mb-1 border-b border-[rgba(15,0,0,0.08)]">
          <span>[AD]</span>
          <span>Google Ads</span>
        </div>
        <ins
          class="adsbygoogle"
          style="display:block; width:160px; height:600px; max-width:160px; max-height:600px; margin:0 auto; overflow:hidden;"
          data-ad-client="${ADSENSE_CONFIG.client}"
          data-ad-format="rectangle"
          data-full-width-responsive="false"
        ></ins>
      </div>
    </aside>
  `;
}

/**
 * Renders Desktop Right Side Gutter Ad Unit (<aside id="adsense-desktop-right">)
 * Restricted to ultra-wide desktop viewports (>= 1536px 2xl) to prevent encroaching on main content.
 * Completely hidden on game viewports ('play') to guarantee zero game/touch obstruction.
 */
export function renderDesktopRightGutter(activeView?: string): string {
  if (isAdRemoved() || activeView === 'play') return '';

  return `
    <aside
      id="adsense-desktop-right"
      class="adsense-gutter adsense-desktop-right hidden 2xl:flex flex-col items-center justify-start py-6 px-2 w-[160px] shrink-0 text-center select-none"
      aria-label="Google AdSense Right Wing"
    >
      <div class="w-full border border-[rgba(15,0,0,0.12)] bg-[#f8f7f7] p-2 rounded-none">
        <div class="flex items-center justify-between text-[9px] font-mono text-stone-500 uppercase tracking-wider pb-1 mb-1 border-b border-[rgba(15,0,0,0.08)]">
          <span>[AD]</span>
          <span>Google Ads</span>
        </div>
        <ins
          class="adsbygoogle"
          style="display:block; width:160px; height:600px; max-width:160px; max-height:600px; margin:0 auto; overflow:hidden;"
          data-ad-client="${ADSENSE_CONFIG.client}"
          data-ad-format="rectangle"
          data-full-width-responsive="false"
        ></ins>
      </div>
    </aside>
  `;
}

/**
 * Renders Mobile/Tablet Top Banner Ad Unit (<div id="adsense-mobile-top">)
 * Compact slim banner format (50px mobile, 60px tablet) to prevent blocking screen content.
 * Completely hidden on game viewports ('play') to preserve full screen gameplay.
 */
export function renderMobileTopBanner(activeView?: string): string {
  if (isAdRemoved() || activeView === 'play') return '';

  return `
    <div
      id="adsense-mobile-top"
      class="adsense-banner-top w-full block lg:hidden bg-[#f8f7f7] border-b border-[rgba(15,0,0,0.12)] text-center px-2 py-0.5 select-none overflow-hidden"
      aria-label="Google AdSense Mobile Banner"
    >
      <div class="adsense-banner-inner max-w-sm sm:max-w-md mx-auto overflow-hidden">
        <div class="flex items-center justify-between text-[8px] font-mono text-stone-400 uppercase tracking-wider px-1 leading-none mb-0.5">
          <span>[AD] Google Ads</span>
          <span class="text-[7px] text-stone-300">Sponsored</span>
        </div>
        <div class="w-full h-[50px] sm:h-[60px] max-h-[50px] sm:max-h-[60px] flex items-center justify-center overflow-hidden">
          <ins
            class="adsbygoogle"
            style="display:inline-block; width:100%; max-width:468px; height:50px; max-height:50px; min-height:50px; overflow:hidden;"
            data-ad-client="${ADSENSE_CONFIG.client}"
            data-ad-format="horizontal"
            data-full-width-responsive="true"
          ></ins>
        </div>
      </div>
    </div>
  `;
}

/**
 * Removes any auto-placed ads, floating overlays, anchors, or screen-blocking vignettes
 * inserted by Google Auto-Ads outside designated containers.
 */
export function cleanupUncontainedAds(): void {
  if (typeof document === 'undefined') return;

  try {
    const uncontainedSelectors = [
      '.google-auto-placed',
      '.adsbygoogle-noab-wrap',
      'ins.adsbygoogle[data-anchor-status]',
      'iframe[name*="google_ads_top_frame"]',
      'iframe[name*="google_ads_bottom_frame"]',
      'div[id*="aswift"][style*="position: fixed"]',
      'div[id*="google_ads_iframe"][style*="position: fixed"]',
      '#aswift_0_host',
      '#aswift_1_host',
      '#aswift_2_host',
      '#aswift_3_host',
      '#aswift_4_host',
      '#aswift_5_host',
      '#landing-main-slot .google-auto-placed',
      '#landing-main-slot ins.adsbygoogle',
      '#landing-modals-slot ins.adsbygoogle',
    ];

    document.querySelectorAll(uncontainedSelectors.join(',')).forEach((el) => {
      // Remove any fixed/sticky overlay unconditionally across entire page
      const htmlEl = el as HTMLElement;
      if (htmlEl.style && (htmlEl.style.position === 'fixed' || htmlEl.style.position === 'sticky')) {
        try {
          htmlEl.remove();
        } catch {
          htmlEl.style.display = 'none';
        }
        return;
      }

      // Protect legitimate static ads inside designated containers
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
 * Initializes a DOM MutationObserver to enforce strict AdSense containment in real time.
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

    // Initial pass
    cleanupUncontainedAds();
  } catch {}

  // Handle viewport resize safely to trigger pushes for newly revealed slots
  let resizeTimer: any = null;
  window.addEventListener('resize', () => {
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      pushAdSenseTags();
    }, 200);
  });
}

/**
 * Checks whether an ins.adsbygoogle element is truly visible and has non-zero dimensions in layout.
 * Prevents "No slot size for availableWidth=0" TagError.
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
 *   - Zero "availableWidth=0" TagError
 *   - Zero "Only one enable_page_level_ads" error
 *   - Zero duplicate pushes on already populated slots
 */
export function pushAdSenseTags(): void {
  if (isAdRemoved()) return;
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  // Defer slightly so browser paints and layout calculates accurate widths
  setTimeout(() => {
    try {
      cleanupUncontainedAds();

      // Find ins elements within designated containers that haven't been pushed yet
      const candidateSlots = Array.from(
        document.querySelectorAll<HTMLElement>(
          '#adsense-desktop-left ins.adsbygoogle:not([data-adsbygoogle-status]), ' +
          '#adsense-desktop-right ins.adsbygoogle:not([data-adsbygoogle-status]), ' +
          '#adsense-mobile-top ins.adsbygoogle:not([data-adsbygoogle-status]), ' +
          '.adsense-container ins.adsbygoogle:not([data-adsbygoogle-status])'
        )
      );

      if (candidateSlots.length === 0) return;

      const win = window as any;
      win.adsbygoogle = win.adsbygoogle || [];

      candidateSlots.forEach((slotEl) => {
        // Strict guard: DO NOT push if element is hidden or has 0 width!
        if (!isAdSlotVisible(slotEl)) {
          return;
        }

        // Mark as pending before push so subsequent calls don't duplicate
        slotEl.setAttribute('data-adsbygoogle-status', 'pending');

        try {
          win.adsbygoogle.push({});
        } catch (err) {
          // If push fails, release status so it can retry later
          slotEl.removeAttribute('data-adsbygoogle-status');
        }
      });
    } catch (e) {
      // Top-level safe catch
    }
  }, 80);
}
