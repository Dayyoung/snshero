import React from 'react';
import { Sparkles, ArrowLeft } from 'lucide-react';
import { Language } from '../types';

interface FusionLabViewProps {
  language: Language;
  sns: number;
  updateSns: (amt: number) => void;
  playSfx?: (sfx: string) => void;
  inventory?: any[];
}

export const FusionLabView: React.FC<FusionLabViewProps> = ({
  language,
  sns
}) => {
  return (
    <div className="w-full max-w-lg mx-auto p-4 font-mono text-[#201d1d]">
      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-[#201d1d]/15">
        <Sparkles size={18} className="text-purple-600" />
        <h2 className="text-sm font-black">
          {language === 'ko' ? '카드 융합 연구소' : 'Card Fusion Lab'}
        </h2>
      </div>
      <div className="p-4 border border-[#201d1d]/20 bg-white rounded-sm text-center">
        <p className="text-xs text-[#201d1d]/70 mb-2">
          {language === 'ko'
            ? '카드를 합성하여 새로운 잠재력과 등급의 상위 카드를 획득하세요.'
            : 'Synthesize cards to unlock higher tiers and awakened passives.'}
        </p>
        <span className="text-xs font-bold text-amber-700">보유 SNS: {sns.toLocaleString()}</span>
      </div>
    </div>
  );
};

export default FusionLabView;
