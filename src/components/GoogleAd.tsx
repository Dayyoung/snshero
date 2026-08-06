import React from 'react';
import { Language } from '../types';
import { t } from '../lib/i18n';

interface GoogleAdProps {
  className?: string;
  adSlot?: string;
  adFormat?: 'auto' | 'horizontal' | 'vertical' | 'rectangle';
  responsive?: 'true' | 'false';
  style?: React.CSSProperties;
  language: Language;
}

export function GoogleAd({ 
  className = '', 
  adFormat = 'auto',
  style = {},
  language
}: GoogleAdProps) {

  const isVertical = adFormat === 'vertical';

  return (
    <div 
      className={`flex flex-col bg-slate-950 border border-slate-800 rounded-lg overflow-hidden shadow-sm transition-all ${className}`}
      style={isVertical ? { height: style.height || '600px' } : {}}
    >
      {/* Tactical HUD Header for the Ad block */}
      <div className="flex items-center justify-between px-3 py-1 bg-slate-900 border-b border-slate-800 select-none">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-[9px] text-slate-400 font-black tracking-[0.2em] uppercase">
            {t('ad_notice', language)}
          </span>
        </div>
        <span className="text-[7px] text-slate-600 tracking-tighter">
          AD_SLOT
        </span>
      </div>

      {/* Ad Render Zone - Custom Shop Banner with Overlay Text */}
      {isVertical ? (
        /* Vertical Skyscraper Banner (Left side) */
        <a 
          href="https://shop.snshero.com/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="relative flex-1 block w-full overflow-hidden group cursor-pointer bg-slate-900"
        >
          {/* Banner Image cropped vertically */}
          <img 
            src="/banner_nano_banana.png" 
            alt="SNSHero Shop Promotion" 
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out brightness-[0.75] group-hover:brightness-90"
          />

          {/* Text Overlay for Vertical Layout */}
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[1px] group-hover:bg-slate-950/40 transition-colors duration-300 flex flex-col items-center justify-center p-4">
            <span className="text-[10px] text-yellow-400 font-black tracking-widest uppercase block mb-3 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] animate-pulse text-center">
              ★ OFFICIAL SHOP ★
            </span>
            <span className="text-xs md:text-sm text-white font-extrabold tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] text-center break-words leading-relaxed select-none">
              {t('shop_banner_text', language)}
            </span>
          </div>

          {/* Neon Light Border Hover Effect */}
          <div className="absolute inset-0 border border-purple-500/0 group-hover:border-purple-500/50 transition-all duration-300 pointer-events-none rounded-b-lg" />
        </a>
      ) : (
        /* Horizontal Banner (Mobile / Top / Bottom) */
        <a 
          href="https://shop.snshero.com/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="relative block w-full overflow-hidden group cursor-pointer aspect-[468/66] md:aspect-[468/50] min-h-[50px] bg-slate-900"
        >
          {/* Banner Image */}
          <img 
            src="/banner_nano_banana.png" 
            alt="SNSHero Shop Promotion" 
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out brightness-90 group-hover:brightness-100"
          />

          {/* Text Overlay for Horizontal Layout */}
          <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-[1px] group-hover:bg-slate-950/30 transition-colors duration-300 flex items-center justify-center px-4 py-2">
            <div className="text-center transform translate-y-0 group-hover:-translate-y-0.5 transition-transform duration-300">
              <span className="text-[10px] md:text-xs text-yellow-400 font-black tracking-widest uppercase block mb-0.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] animate-pulse">
                ★ OFFICIAL MERCHANDISE SHOP ★
              </span>
              <span className="text-[11px] md:text-sm text-white font-extrabold tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] line-clamp-1">
                {t('shop_banner_text', language)}
              </span>
            </div>
          </div>

          {/* Neon Light Border Hover Effect */}
          <div className="absolute inset-0 border border-purple-500/0 group-hover:border-purple-500/50 transition-all duration-300 pointer-events-none rounded-b-lg" />
        </a>
      )}
    </div>
  );
}
