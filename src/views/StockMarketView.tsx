import React from 'react';
import { TrendingUp, ArrowLeft } from 'lucide-react';
import { Language } from '../types';

interface StockMarketViewProps {
  language: Language;
  sns: number;
  updateSns: (amt: number) => void;
  playSfx?: (sfx: string) => void;
  inventory?: any[];
}

export const StockMarketView: React.FC<StockMarketViewProps> = ({
  language,
  sns
}) => {
  return (
    <div className="w-full max-w-lg mx-auto p-4 font-mono text-[#201d1d]">
      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-[#201d1d]/15">
        <TrendingUp size={18} className="text-amber-500" />
        <h2 className="text-sm font-black">
          {language === 'ko' ? 'SNS 모의 주식 거래소' : 'SNS Stock Exchange'}
        </h2>
      </div>
      <div className="p-4 border border-[#201d1d]/20 bg-white rounded-sm">
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs font-bold">{language === 'ko' ? '보유 자산' : 'Balance'}</span>
          <span className="text-xs font-black text-amber-700">{sns.toLocaleString()} SNS</span>
        </div>
        <p className="text-xs text-[#201d1d]/70 leading-relaxed">
          {language === 'ko'
            ? '게임 내 길드 및 히어로 기업들의 가치를 실시간으로 분석하고 모의 주식에 투자하세요.'
            : 'Trade mock stocks of in-game guilds and hero corporations.'}
        </p>
      </div>
    </div>
  );
};

export default StockMarketView;
