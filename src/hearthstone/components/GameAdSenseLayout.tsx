import React, { useEffect, useRef, useState } from 'react';
import {
  initAdSenseContainmentObserver,
  isAdRemoved,
  protectLinksFromVignette,
  pushAdSenseTags,
  syncAdSenseRatioLayout,
} from '../../landing/services/adsenseManager';

export interface GameAdSenseLayoutProps {
  screenKey: string;
  children: React.ReactNode;
}

/**
 * Responsive Google AdSense Layout Shell for /game.html
 * Matches Google AdSense Policy while blending seamlessly with the Elwin Village Dark-Gold Fantasy Theme:
 * - PC Wide Landscape (>=1280x650, W > H): Left & Right 160x600 Skyscraper Gutters
 * - Tablet & Smartphone (<1280px or Portrait): Slim 320x50 Top Ribbon Banner (52px)
 * - Automatically suppressed when VIP Ad Removal (`hero_ad_removed === 'true'`) is active
 */
export const GameAdSenseLayout: React.FC<GameAdSenseLayoutProps> = ({
  screenKey,
  children,
}) => {
  const [vipAdRemoved, setVipAdRemoved] = useState<boolean>(() => isAdRemoved());
  const mobileTopRef = useRef<HTMLDivElement | null>(null);
  const leftGutterRef = useRef<HTMLElement | null>(null);
  const rightGutterRef = useRef<HTMLElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (mobileTopRef.current && !mobileTopRef.current.style.display) {
      mobileTopRef.current.style.display = 'none';
    }
    if (leftGutterRef.current && !leftGutterRef.current.style.display) {
      leftGutterRef.current.style.display = 'none';
    }
    if (rightGutterRef.current && !rightGutterRef.current.style.display) {
      rightGutterRef.current.style.display = 'none';
    }

    initAdSenseContainmentObserver();
    syncAdSenseRatioLayout('game');
    pushAdSenseTags('game');

    const handleAdRemovalChange = () => {
      setVipAdRemoved(isAdRemoved());
      syncAdSenseRatioLayout('game');
    };

    window.addEventListener('storage', handleAdRemovalChange);
    window.addEventListener('snshero_ad_removed_updated', handleAdRemovalChange);
    return () => {
      window.removeEventListener('storage', handleAdRemovalChange);
      window.removeEventListener('snshero_ad_removed_updated', handleAdRemovalChange);
    };
  }, []);

  useEffect(() => {
    if (rootRef.current) {
      protectLinksFromVignette(rootRef.current);
    }
    syncAdSenseRatioLayout('game');
    pushAdSenseTags('game');
  }, [screenKey, vipAdRemoved]);

  return (
    <div
      ref={rootRef}
      className="flex h-[100dvh] w-full flex-col overflow-hidden bg-[#090604] text-[#f8ebd2]"
    >
      {/* Tablet & Smartphone Top Ribbon Banner (320x50 inside 52px safe bar) */}
      {!vipAdRemoved && (
        <div
          id="adsense-mobile-top"
          ref={mobileTopRef}
          style={{ height: 52, minHeight: 52, maxHeight: 52 }}
          className="adsense-banner-top w-full shrink-0 select-none overflow-hidden border-b border-[#c8a158]/30 bg-[#100a06] px-1 text-center"
          aria-label="Google AdSense Top Banner"
        >
          <div className="adsense-banner-inner mx-auto flex h-[50px] max-w-[360px] items-center justify-center gap-1.5 overflow-hidden">
            <span className="shrink-0 rounded border border-amber-500/35 bg-black/70 px-1 py-0.5 text-[8px] font-extrabold tracking-wider text-amber-200/75 uppercase">
              AD
            </span>
            <div className="adsense-slot-wrapper flex h-[50px] max-h-[50px] min-h-[50px] flex-1 items-center justify-center overflow-hidden" />
          </div>
        </div>
      )}

      {/* Central Row: PC Left Gutter + Game Viewport + PC Right Gutter */}
      <div className="relative flex min-h-0 w-full flex-1 flex-row justify-center overflow-hidden">
        {!vipAdRemoved && (
          <aside
            id="adsense-desktop-left"
            ref={leftGutterRef}
            className="adsense-gutter adsense-desktop-left w-[176px] shrink-0 select-none flex-col items-center justify-center border-r border-[#c8a158]/25 bg-[#0c0805] px-2 py-3 text-center"
            aria-label="Google AdSense Left Wing"
          >
            <div className="w-[160px] rounded-xl border border-[#c8a158]/25 bg-black/55 p-1.5">
              <div className="mb-1 flex items-center justify-between border-b border-amber-500/20 pb-1 text-[9px] font-bold tracking-wider text-amber-200/65 uppercase">
                <span>AD</span>
                <span>Google Ads</span>
              </div>
              <div className="adsense-slot-wrapper flex min-h-[600px] w-full items-center justify-center overflow-hidden" />
            </div>
          </aside>
        )}

        <main
          id="hs-game-viewport"
          className="relative h-full min-h-0 min-w-0 flex-1 overflow-hidden bg-[#090604]"
        >
          {children}
        </main>

        {!vipAdRemoved && (
          <aside
            id="adsense-desktop-right"
            ref={rightGutterRef}
            className="adsense-gutter adsense-desktop-right w-[176px] shrink-0 select-none flex-col items-center justify-center border-l border-[#c8a158]/25 bg-[#0c0805] px-2 py-3 text-center"
            aria-label="Google AdSense Right Wing"
          >
            <div className="w-[160px] rounded-xl border border-[#c8a158]/25 bg-black/55 p-1.5">
              <div className="mb-1 flex items-center justify-between border-b border-amber-500/20 pb-1 text-[9px] font-bold tracking-wider text-amber-200/65 uppercase">
                <span>AD</span>
                <span>Google Ads</span>
              </div>
              <div className="adsense-slot-wrapper flex min-h-[600px] w-full items-center justify-center overflow-hidden" />
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};
