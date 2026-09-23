import React from 'react';
import { ShoppingCart, ArrowLeft } from 'lucide-react';
import { Language } from '../types';

interface MallViewProps {
  language: Language;
  onNavigate: (view: any) => void;
  playSfx?: (sfx: string) => void;
}

export const MallView: React.FC<MallViewProps> = ({
  language,
  onNavigate
}) => {
  return (
    <div className="w-full max-w-lg mx-auto p-4 font-mono text-[#201d1d]">
      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-[#201d1d]/15">
        <button
          type="button"
          onClick={() => onNavigate('home')}
          className="p-1 hover:bg-[#201d1d]/5 rounded cursor-pointer"
        >
          <ArrowLeft size={18} />
        </button>
        <h2 className="text-sm font-black">
          {language === 'ko' ? '공식 굿즈 몰' : 'Official Merch Mall'}
        </h2>
      </div>
      <div className="p-4 border border-[#201d1d]/20 bg-white rounded-sm text-center">
        <ShoppingCart size={24} className="mx-auto mb-2 text-amber-600" />
        <p className="text-xs text-[#201d1d]/70">
          {language === 'ko'
            ? '실물 카드 굿즈 및 한정판 피규어 주문 스토어입니다.'
            : 'Order real physical card decks and limited hero figurines.'}
        </p>
      </div>
    </div>
  );
};

export default MallView;
