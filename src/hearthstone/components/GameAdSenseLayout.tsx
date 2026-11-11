import React, { useCallback, useEffect, useRef, useState } from 'react';
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

interface StageMetrics {
  stageW: number;
  stageH: number;
  scale: number;
  letterboxed: boolean;
}

/**
 * Computes uniform stage dimensions & scale so 100% of every game screen fits inside a single
 * viewport without clipping — especially in Mobile Landscape (e.g. 844×390, 667×375, 932×430)
 * or compact laptop screens, adding clean dark-gold letterbox/pillarbox bars when needed.
 */
function computeStageMetrics(availW: number, availH: number): StageMetrics {
  const w = Math.max(240, availW);
  const h = Math.max(200, availH);
  const isLandscape = w > h;

  if (isLandscape) {
    const MIN_STAGE_W = 1220;
    const MAX_STAGE_W = 1520;
    const MIN_STAGE_H = 840;
    const MAX_STAGE_H = 1060;

    const rawScale = Math.min(1, w / MIN_STAGE_W, h / MIN_STAGE_H);
    if (rawScale >= 0.999) {
      return { stageW: w, stageH: h, scale: 1, letterboxed: false };
    }

    const stageW = Math.min(
      MAX_STAGE_W,
      Math.max(MIN_STAGE_W, Math.round(w / rawScale)),
    );
    const stageH = Math.min(
      MAX_STAGE_H,
      Math.max(MIN_STAGE_H, Math.round(h / rawScale)),
    );
    const fitScale = Math.min(1, w / stageW, h / stageH);
    const usedW = stageW * fitScale;
    const usedH = stageH * fitScale;
    const letterboxed = Math.abs(w - usedW) > 6 || Math.abs(h - usedH) > 6;

    return {
      stageW,
      stageH,
      scale: fitScale,
      letterboxed,
    };
  }

  // Portrait mode: native responsive layout down to 360×660; uniform scale only if ultra-short
  const MIN_PORTRAIT_W = 360;
  const MIN_PORTRAIT_H = 660;
  const rawScale = Math.min(1, w / MIN_PORTRAIT_W, h / MIN_PORTRAIT_H);
  if (rawScale >= 0.999) {
    return { stageW: w, stageH: h, scale: 1, letterboxed: false };
  }

  const stageW = Math.max(MIN_PORTRAIT_W, Math.round(w / rawScale));
  const stageH = Math.max(MIN_PORTRAIT_H, Math.round(h / rawScale));
  const fitScale = Math.min(1, w / stageW, h / stageH);
  return {
    stageW,
    stageH,
    scale: fitScale,
    letterboxed: Math.abs(w - stageW * fitScale) > 6 || Math.abs(h - stageH * fitScale) > 6,
  };
}

/**
 * Responsive Google AdSense + Uniform Stage Fit/Letterbox Shell for /game.html
 * - PC Wide Landscape (>=1280x650, W > H): Left & Right 160x600 Skyscraper Gutters
 * - Tablet & Smartphone (<1280px or Portrait): Slim 320x50 Top Ribbon Banner (52px)
 * - Mobile Landscape & Compact Screens: Uniform Stage Scaling + Ornate Dark-Gold Letterbox
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
  const viewportRef = useRef<HTMLElement | null>(null);

  const [stageMetrics, setStageMetrics] = useState<StageMetrics>(() => {
    if (typeof window === 'undefined') {
      return { stageW: 1280, stageH: 840, scale: 1, letterboxed: false };
    }
    return computeStageMetrics(window.innerWidth, window.innerHeight);
  });

  const measureViewport = useCallback(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    const rect = vp.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      setStageMetrics(computeStageMetrics(rect.width, rect.height));
    }
  }, []);

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
    measureViewport();

    const handleAdRemovalChange = () => {
      setVipAdRemoved(isAdRemoved());
      syncAdSenseRatioLayout('game');
      window.requestAnimationFrame(measureViewport);
    };

    const handleResize = () => {
      measureViewport();
    };

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && viewportRef.current) {
      ro = new ResizeObserver(() => measureViewport());
      ro.observe(viewportRef.current);
    }

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    window.addEventListener('storage', handleAdRemovalChange);
    window.addEventListener('snshero_ad_removed_updated', handleAdRemovalChange);
    return () => {
      ro?.disconnect();
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      window.removeEventListener('storage', handleAdRemovalChange);
      window.removeEventListener('snshero_ad_removed_updated', handleAdRemovalChange);
    };
  }, [measureViewport]);

  useEffect(() => {
    if (rootRef.current) {
      protectLinksFromVignette(rootRef.current);
    }
    syncAdSenseRatioLayout('game');
    pushAdSenseTags('game');
    window.requestAnimationFrame(measureViewport);
  }, [screenKey, vipAdRemoved, measureViewport]);

  const frameW = Math.floor(stageMetrics.stageW * stageMetrics.scale);
  const frameH = Math.floor(stageMetrics.stageH * stageMetrics.scale);

  return (
    <div
      ref={rootRef}
      className="flex h-[100dvh] w-full flex-col overflow-hidden bg-[#070402] text-[#f8ebd2]"
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

      {/* Central Row: PC Left Gutter + Scaled/Letterboxed Game Viewport + PC Right Gutter */}
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
          ref={viewportRef}
          style={{
            background:
              'radial-gradient(ellipse at 50% 50%, #160d07 0%, #090503 65%, #040201 100%)',
          }}
          className="relative flex h-full min-h-0 min-w-0 flex-1 items-center justify-center overflow-hidden"
        >
          <div
            id="hs-stage-frame"
            style={{ width: frameW, height: frameH }}
            className={`relative shrink-0 overflow-hidden bg-[#090604] ${
              stageMetrics.letterboxed
                ? 'border-x border-[#c8a158]/35 shadow-[0_0_50px_rgba(0,0,0,0.95)]'
                : ''
            }`}
          >
            <div
              id="hs-stage-canvas"
              style={{
                width: stageMetrics.stageW,
                height: stageMetrics.stageH,
                transform:
                  stageMetrics.scale < 0.999
                    ? `scale(${stageMetrics.scale})`
                    : 'translateZ(0)',
                transformOrigin: 'top left',
              }}
              className="relative overflow-hidden"
            >
              {children}
            </div>
          </div>
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
