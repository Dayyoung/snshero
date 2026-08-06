import React from 'react';
import { Language } from '../types';
import { t } from '../lib/i18n';
import { ShoppingBag, ExternalLink } from 'lucide-react';

interface NativeAdProps {
  className?: string;
  language: Language;
  variant?: 'card' | 'banner';
}

/**
 * NativeAd — 인피드 네이티브 광고 컴포넌트
 * 콘텐츠 피드에 자연스럽게 녹아드는 스타일로 SNSHero 공식 굿즈 샵을 홍보합니다.
 * P2-2: 좌측 사이드바 광고를 대체하는 인피드 네이티브 광고
 */
export function NativeAd({ className = '', language, variant = 'card' }: NativeAdProps) {
  if (variant === 'banner') {
    return (
      <a
        href="https://shop.snshero.com/"
        target="_blank"
        rel="noopener noreferrer"
        className={`relative block w-full overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm hover:shadow-md active:scale-[0.99] transition-all cursor-pointer group ${className}`}
      >
        <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4">
          {/* 상품 이미지 */}
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden shrink-0 bg-slate-100 border border-slate-200">
            <img
              src="/banner_nano_banana.png"
              alt="SNSHero Shop"
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
          </div>

          {/* 텍스트 영역 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest bg-amber-50 px-1.5 py-0.5 rounded">
                AD
              </span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">
                {t('ad_notice', language)}
              </span>
            </div>
            <p className="text-xs sm:text-sm font-bold text-slate-800 leading-snug line-clamp-2">
              {t('shop_banner_text', language)}
            </p>
          </div>

          {/* CTA */}
          <div className="shrink-0 flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] sm:text-xs font-extrabold uppercase tracking-wider rounded-lg transition-colors">
            <ShoppingBag size={12} />
            <span className="hidden sm:inline">{language === 'ko' ? '쇼핑하기' : 'SHOP'}</span>
          </div>
        </div>
      </a>
    );
  }

  // Card variant — 게임 모드 카드와 유사한 그리드 스타일
  return (
    <a
      href="https://shop.snshero.com/"
      target="_blank"
      rel="noopener noreferrer"
      className={`group border border-amber-200/80 rounded-3xl overflow-hidden shadow-lg hover:shadow-xl transition-all flex flex-col bg-gradient-to-br from-white to-amber-50/30 cursor-pointer active:scale-[0.98] ${className}`}
    >
      {/* 이미지 영역 */}
      <div className="relative w-full aspect-[16/10] overflow-hidden bg-slate-900 border-b border-amber-100">
        <img
          src="/banner_nano_banana.png"
          alt="SNSHero Official Shop"
          className="w-full h-full object-cover transition-transform duration-500 ease-out brightness-110 contrast-105 group-hover:scale-110"
        />

        {/* AD 배지 */}
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md bg-gradient-to-br from-amber-400 to-orange-500">
            <ShoppingBag size={18} className="text-white" />
          </div>
          <span className="text-[9px] font-black text-white uppercase tracking-widest bg-black/40 backdrop-blur-xs px-2 py-1 rounded-lg">
            AD
          </span>
        </div>

        {/* 바로가기 아이콘 */}
        <div className="absolute top-3 right-3">
          <div className="p-1.5 text-white/80 bg-black/40 hover:bg-black/60 hover:text-white backdrop-blur-xs transition-all rounded-lg border border-white/10">
            <ExternalLink size={14} />
          </div>
        </div>
      </div>

      {/* 텍스트 영역 */}
      <div className="p-3 sm:p-4 flex flex-col gap-1.5 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[8px] font-black text-amber-600 uppercase tracking-widest bg-amber-100 px-1.5 py-0.5 rounded">
            {t('ad_notice', language)}
          </span>
          <span className="text-[9px] font-bold text-amber-500 uppercase tracking-wide">
            OFFICIAL SHOP
          </span>
        </div>
        <p className="text-xs sm:text-sm font-extrabold text-slate-800 leading-snug">
          {t('shop_banner_text', language)}
        </p>
        <div className="mt-auto pt-2 flex items-center gap-1 text-amber-600 text-[10px] font-bold uppercase">
          <ShoppingBag size={11} />
          {language === 'ko' ? '굿즈 쇼핑하기' : 'SHOP NOW'}
          <ExternalLink size={10} className="ml-auto opacity-50" />
        </div>
      </div>
    </a>
  );
}
