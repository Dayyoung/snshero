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
 isAutoBattle?: boolean;
 forceShow?: boolean;
}

export const AdSenseBanner: React.FC<AdSenseBannerProps> = ({
 slot,
 format = 'auto',
 responsive = true,
 className = '',
 style = {},
 showLabel = false,
 isAdRemoved = false,
 isAutoBattle = false,
 forceShow = false,
}) => {
 const isAutoModeActive = isAutoBattle || (typeof window !== 'undefined' && (
 localStorage.getItem('hero_auto_battle') === 'true' ||
 localStorage.getItem('hero_auto_loop_mode') !== null
 ));
 const isActuallyAdRemoved = !forceShow && (isAdRemoved || isAutoModeActive || (typeof window !== 'undefined' && localStorage.getItem('hero_ad_removed') === 'true'));
 if (isActuallyAdRemoved) {
 return null;
 }

 const insRef = useRef<HTMLModElement>(null);
 const isLoadedRef = useRef(false);

 useEffect(() => {
 if (isLoadedRef.current) return;
 if (typeof window === 'undefined') return;

 // 약간의 딜레이 후 DOM 너비가 계산된 시점에 adsbygoogle.push 실행
 const timer = setTimeout(() => {
 try {
 const ins = insRef.current;
 if (!ins) return;

 // 이미 광고가 채워졌거나 adsbygoogle 상태가 완료된 경우 중복 push 방지
 const status = ins.getAttribute('data-adsbygoogle-status');
 if (status === 'done' || ins.children.length > 0) {
 isLoadedRef.current = true;
 return;
 }

 const win = window as unknown as { adsbygoogle?: Array<Record<string, unknown>> };
 win.adsbygoogle = win.adsbygoogle || [];
 win.adsbygoogle.push({});
 isLoadedRef.current = true;
 } catch (e) {
 // AdSense push safe catch
 }
 }, 150);

 return () => clearTimeout(timer);
 }, []);

 const getMinHeight = () => {
 switch (format) {
 case 'horizontal': return '90px';
 case 'rectangle': return '250px';
 case 'vertical': return '600px';
 case 'fluid': return '120px';
 default: return '90px';
 }
 };

 // Google AdSense에서 slot 번호 없는 fluid 포맷은 TagError를 발생시키므로 안전하게 auto로 매핑
 const safeFormat = format === 'fluid' ? 'auto' : format;

 const mergedStyle: React.CSSProperties = {
 display: 'block',
 minHeight: (style as React.CSSProperties)?.minHeight || getMinHeight(),
 width: '100%',
 minWidth: '250px',
 ...(format === 'horizontal' ? { maxHeight: '120px' } : {}),
 ...style,
 };

 return (
 <div className={`adsense-container w-full overflow-hidden text-center select-none rounded-sm transition-all ${className}`}>
 {showLabel && (
 <div className="flex items-center justify-between px-2 py-0.5 text-[9px] font-mono text-slate-400/80 uppercase tracking-wider bg-black/5 dark:bg-white/5 border-b border-inherit/10 mb-1">
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
 data-ad-format={safeFormat}
 data-full-width-responsive={responsive ? 'true' : 'false'}
 />
 </div>
 );
};

