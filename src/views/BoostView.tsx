import React from 'react';
import { Zap, ArrowLeft } from 'lucide-react';
import { Language } from '../types';

interface BoostViewProps {
  onNavigate: (view: any) => void;
  language: Language;
  sns: number;
  updateSns: (amt: number) => void;
  showCustomAlert?: (msg: string) => void;
}

export const BoostView: React.FC<BoostViewProps> = ({
  onNavigate,
  language,
  sns
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
          {language === 'ko' ? '경험치 & 골드 부스터' : 'EXP & Gold Boosters'}
        </h2>
      </div>
      <div className="p-4 border border-[#201d1d]/20 bg-white rounded-sm text-center">
        <Zap size={24} className="mx-auto mb-2 text-amber-500" />
        <p className="text-xs text-[#201d1d]/70 mb-2">
          {language === 'ko'
            ? '일일 2배 부스터를 활성화하여 빠른 성장을 경험하세요.'
            : 'Activate 2x Daily Boosters for accelerated progression.'}
        </p>
        <span className="text-xs font-bold text-amber-700">보유 SNS: {sns.toLocaleString()}</span>
      </div>
    </div>
  );
};

export default BoostView;
