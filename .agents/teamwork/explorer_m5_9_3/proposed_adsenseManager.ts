/**
 * src/landing/services/adsenseManager.ts (PROPOSED BLUEPRINT)
 *
 * Responsive Google AdSense Configuration & Injection Service.
 *
 * Requirements:
 *   - Desktop viewports (>= 1024px): Left & Right side gutters (<aside id="adsense-desktop-left">, <aside id="adsense-desktop-right">).
 *   - Mobile/Tablet viewports (< 1024px): Top banner ad unit (<div id="adsense-mobile-top">).
 *   - Non-obstructing layout: Gutters placed outside central container without blocking playfield, hand, or navigation.
 *   - Ad-removal guard: If localStorage.getItem('hero_ad_removed') === 'true', completely suppress all ads.
 *   - Safe error handling: Try/catch around window.adsbygoogle push to prevent unhandled script exceptions.
 * Pure TypeScript (Zero React runtime).
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
  slots: {
    desktopLeft: '1000000001',
    desktopRight: '1000000002',
    mobileTop: '1000000003',
  },
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

  if (width >= ADSENSE_CONFIG.breakpointPx) {
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
 */
export function renderDesktopLeftGutter(): string {
  if (isAdRemoved()) return '';

  return `
    <aside
      id="adsense-desktop-left"
      class="adsense-gutter adsense-desktop-left hidden lg:flex flex-col items-center justify-start py-6 px-2 w-[160px] xl:w-[200px] shrink-0 text-center select-none"
      aria-label="Google AdSense Left Wing"
    >
      <div class="w-full border border-[rgba(15,0,0,0.12)] bg-[#f8f7f7] p-2 rounded-none">
        <div class="flex items-center justify-between text-[9px] font-mono text-stone-500 uppercase tracking-wider pb-1 mb-1 border-b border-[rgba(15,0,0,0.08)]">
          <span>[AD]</span>
          <span>Google Ads</span>
        </div>
        <ins
          class="adsbygoogle"
          style="display:block; min-height:600px; width:100%; min-width:140px;"
          data-ad-client="${ADSENSE_CONFIG.client}"
          data-ad-slot="${ADSENSE_CONFIG.slots.desktopLeft}"
          data-ad-format="vertical"
          data-full-width-responsive="false"
        ></ins>
      </div>
    </aside>
  `;
}

/**
 * Renders Desktop Right Side Gutter Ad Unit (<aside id="adsense-desktop-right">)
 */
export function renderDesktopRightGutter(): string {
  if (isAdRemoved()) return '';

  return `
    <aside
      id="adsense-desktop-right"
      class="adsense-gutter adsense-desktop-right hidden lg:flex flex-col items-center justify-start py-6 px-2 w-[160px] xl:w-[200px] shrink-0 text-center select-none"
      aria-label="Google AdSense Right Wing"
    >
      <div class="w-full border border-[rgba(15,0,0,0.12)] bg-[#f8f7f7] p-2 rounded-none">
        <div class="flex items-center justify-between text-[9px] font-mono text-stone-500 uppercase tracking-wider pb-1 mb-1 border-b border-[rgba(15,0,0,0.08)]">
          <span>[AD]</span>
          <span>Google Ads</span>
        </div>
        <ins
          class="adsbygoogle"
          style="display:block; min-height:600px; width:100%; min-width:140px;"
          data-ad-client="${ADSENSE_CONFIG.client}"
          data-ad-slot="${ADSENSE_CONFIG.slots.desktopRight}"
          data-ad-format="vertical"
          data-full-width-responsive="false"
        ></ins>
      </div>
    </aside>
  `;
}

/**
 * Renders Mobile/Tablet Top Banner Ad Unit (<div id="adsense-mobile-top">)
 */
export function renderMobileTopBanner(): string {
  if (isAdRemoved()) return '';

  return `
    <div
      id="adsense-mobile-top"
      class="adsense-banner-top w-full block lg:hidden bg-[#f8f7f7] border-b border-[rgba(15,0,0,0.12)] text-center px-2 py-1 select-none"
      aria-label="Google AdSense Mobile Banner"
    >
      <div class="max-w-md mx-auto">
        <div class="flex items-center justify-between text-[9px] font-mono text-stone-500 uppercase tracking-wider px-1 pb-0.5">
          <span>[AD] Google Ads</span>
          <span class="text-[8px] text-stone-400">Sponsored</span>
        </div>
        <ins
          class="adsbygoogle"
          style="display:block; min-height:50px; max-height:100px; width:100%; min-width:250px;"
          data-ad-client="${ADSENSE_CONFIG.client}"
          data-ad-slot="${ADSENSE_CONFIG.slots.mobileTop}"
          data-ad-format="horizontal"
          data-full-width-responsive="true"
        ></ins>
      </div>
    </div>
  `;
}

/**
 * Safe initializer to push adsbygoogle instances when ads are mounted in DOM.
 */
export function pushAdSenseTags(): void {
  if (isAdRemoved()) return;
  if (typeof window === 'undefined') return;

  try {
    const uninitialized = document.querySelectorAll('ins.adsbygoogle:not([data-adsbygoogle-status])');
    if (uninitialized.length === 0) return;

    const win = window as any;
    win.adsbygoogle = win.adsbygoogle || [];
    uninitialized.forEach(() => {
      try {
        win.adsbygoogle.push({});
      } catch (err) {
        // Safe catch per slot push
      }
    });
  } catch (e) {
    // Top-level safe catch
  }
}
