/**
 * AdSenseBanner.tsx
 * 구글 애드센스 반응형 광고 유닛 컴포넌트
 */

import React, { useEffect, useRef } from 'react';

interface AdSenseBannerProps {
  slot?: string;
  format?: 'auto' | 'fluid' | 'rectangle' | 'horizontal';
  responsive?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const AdSenseBanner: React.FC<AdSenseBannerProps> = ({
  slot,
  format = 'auto',
  responsive = true,
  className = '',
  style = {},
}) => {
  const isLoaded = useRef(false);

  useEffect(() => {
    if (isLoaded.current) return;
    try {
      if (typeof window !== 'undefined') {
        const adsbygoogle = (window as unknown as { adsbygoogle?: Array<Record<string, unknown>> }).adsbygoogle || [];
        adsbygoogle.push({});
        isLoaded.current = true;
      }
    } catch (e) {
      // AdSense initialization fallback
    }
  }, []);

  return (
    <div className={`adsense-wrapper w-full overflow-hidden text-center my-2 select-none ${className}`}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block', minHeight: '50px', ...style }}
        data-ad-client="ca-pub-6937094123258335"
        {...(slot ? { 'data-ad-slot': slot } : {})}
        data-ad-format={format}
        data-full-width-responsive={responsive ? 'true' : 'false'}
      />
    </div>
  );
};
