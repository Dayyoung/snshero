import React from 'react';
import { ArrowLeft, ShoppingBag, Gift, Package, Sparkles } from 'lucide-react';
import { Language, ViewType } from '../types';

export interface MallViewProps {
  language: Language;
  onNavigate: (view: ViewType) => void;
  playSfx: (url: string) => void;
}

export const MallView: React.FC<MallViewProps> = ({
  language,
  onNavigate,
  playSfx,
}) => {
  return (
    <div className="w-full max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6 flex flex-col gap-5 text-[#201d1d]">
      <div className="flex items-center justify-between border-b border-[rgba(15,0,0,0.12)] pb-3">
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-1.5 text-xs font-mono border border-[rgba(15,0,0,0.15)] px-3 py-1.5 rounded-sm hover:bg-[#f1eeee] active:scale-95 cursor-pointer min-h-[36px]"
        >
          <ArrowLeft size={14} />
          <span>{language === 'ko' ? '로비로 이동' : 'Back to Lobby'}</span>
        </button>
        <span className="font-mono font-bold text-sm sm:text-base">
          {language === 'ko' ? '[ 공식 히어로 굿즈 몰 ]' : '[ Hero Official Goods Mall ]'}
        </span>
        <div className="w-16" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] p-4 rounded-none flex flex-col gap-3">
          <div className="aspect-square bg-[#f1eeee] rounded-sm flex items-center justify-center">
            <Package size={32} className="opacity-40" />
          </div>
          <div className="flex flex-col">
            <span className="font-mono font-bold text-xs sm:text-sm">
              {language === 'ko' ? '시즌 1 한정 아크릴 스탠드' : 'Season 1 Acrylic Stand'}
            </span>
            <span className="font-mono text-xs text-amber-700 font-bold">$18.99</span>
          </div>
        </div>

        <div className="border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] p-4 rounded-none flex flex-col gap-3">
          <div className="aspect-square bg-[#f1eeee] rounded-sm flex items-center justify-center">
            <Gift size={32} className="opacity-40" />
          </div>
          <div className="flex flex-col">
            <span className="font-mono font-bold text-xs sm:text-sm">
              {language === 'ko' ? '오리지널 홀로그램 카드 팩' : 'Holographic Card Pack'}
            </span>
            <span className="font-mono text-xs text-amber-700 font-bold">$12.50</span>
          </div>
        </div>

        <div className="border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] p-4 rounded-none flex flex-col gap-3">
          <div className="aspect-square bg-[#f1eeee] rounded-sm flex items-center justify-center">
            <ShoppingBag size={32} className="opacity-40" />
          </div>
          <div className="flex flex-col">
            <span className="font-mono font-bold text-xs sm:text-sm">
              {language === 'ko' ? '스마트 게이밍 장패드' : 'Gaming Desk Mat'}
            </span>
            <span className="font-mono text-xs text-amber-700 font-bold">$24.99</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MallView;
