/**
 * src/landing/components/AdSenseBanners.tsx (PROPOSED BLUEPRINT)
 *
 * Responsive Google AdSense Banner Component for SNSHero Landing.
 *
 * Provides:
 *   - Desktop Left Gutter (<aside id="adsense-desktop-left">)
 *   - Desktop Right Gutter (<aside id="adsense-desktop-right">)
 *   - Mobile Top Banner (<div id="adsense-mobile-top">)
 * Adheres strictly to DESIGN.md OpenCode Terminal-Flat design (0px container, hairline borders, monospace).
 * Pure TypeScript (Zero React runtime).
 */

import {
  isAdRemoved,
  renderDesktopLeftGutter,
  renderDesktopRightGutter,
  renderMobileTopBanner,
  pushAdSenseTags,
} from '../services/adsenseManager';

export {
  isAdRemoved,
  renderDesktopLeftGutter,
  renderDesktopRightGutter,
  renderMobileTopBanner,
  pushAdSenseTags,
};

export function renderAdSenseLayoutWrapper(mainContentHtml: string): string {
  const leftGutter = renderDesktopLeftGutter();
  const rightGutter = renderDesktopRightGutter();
  const mobileTop = renderMobileTopBanner();

  return `
    <!-- Mobile Top AdSense Banner (viewports < 1024px) -->
    ${mobileTop}

    <!-- Central Content Area with Desktop Side Gutters (viewports >= 1024px) -->
    <div class="w-full flex-1 flex flex-row justify-center relative min-h-0">
      <!-- Desktop Left Gutter -->
      ${leftGutter}

      <!-- Center Main Application Slot -->
      <main id="landing-main-slot" class="w-full max-w-7xl flex-1 flex flex-col min-w-0">
        ${mainContentHtml}
      </main>

      <!-- Desktop Right Gutter -->
      ${rightGutter}
    </div>
  `;
}
