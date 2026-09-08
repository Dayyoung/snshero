/**
 * AdSenseBanner.tsx
 * 구글 애드센스 반응형 디스플레이 광고 유닛 컴포넌트
 */

import React, { useEffect, useRef } from 'react';

interface AdSenseBannerProps {
  slot?: string;
  format?: 'auto' | 'fluid' | 'rectangle' | 'horizontal' | 'vertical';
  responsive?: boolean;
  className?: string;
  style?: React.CSSProperties;
  showLabel?: boolean;
  isAdRemoved?: boolean;
}

export const AdSenseBanner: React.FC<AdSenseBannerProps> = ({
  slot,
  format = 'auto',
  responsive = true,
  className = '',
  style = {},
  showLabel = false,
  isAdRemoved = false,
}) => {
  const isActuallyAdRemoved = isAdRemoved || (typeof window !== 'undefined' && localStorage.getItem('hero_ad_removed') === 'true');
  if (isActuallyAdRemoved) {
    return null;
  }

  const insRef = useRef<HTMLModElement>(null);
  const isLoadedRef = useRef(false);

  useEffect(() => {
    if (isLoadedRef.current) return;
    if (typeof window === 'undefined') return;

    const timer = setTimeout(() => {
      try {
        const ins = insRef.current;
        if (!ins) return;

        // 이미 광고가 채워졌거나 adsbygoogle 상태가 완료된 경우 방지
        const status = ins.getAttribute('data-adsbygoogle-status');
        if (status === 'done' || ins.children.length > 0) {
          isLoadedRef.current = true;
          return;
        }

        const adsbygoogle = (window as unknown as { adsbygoogle?: Array<Record<string, unknown>> }).adsbygoogle || [];
        adsbygoogle.push({});
        isLoadedRef.current = true;
      } catch (e) {
        // AdSense push safe catch
      }
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const mergedStyle: React.CSSProperties = {
    display: 'block',
    ...(format === 'horizontal' ? { maxHeight: '90px', overflow: 'hidden' } : {}),
    ...style,
  };

  return (
    <div className={`adsense-container overflow-hidden text-center select-none ${className}`}>
      {showLabel && (
        <div className="flex items-center justify-between px-1 py-0.5 text-[9px] font-mono text-slate-400/80 uppercase tracking-wider">
          <span>[AD]</span>
          <span>Google Ads</span>
        </div>
      )}
      <ins
        ref={insRef}
        className="adsbygoogle"
        style={mergedStyle}
        data-ad-client="ca-pub-6937094123258335"
        {...(slot ? { 'data-ad-slot': slot } : {})}
        data-ad-format={format}
        data-full-width-responsive={responsive ? 'true' : 'false'}
      />
    </div>
  );
};

