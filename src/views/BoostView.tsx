import React from 'react';
import { ArrowLeft, Zap, Sparkles, TrendingUp, ShieldAlert } from 'lucide-react';
import { Language, ViewType } from '../types';

export interface BoostViewProps {
  onNavigate: (view: ViewType) => void;
  language: Language;
  sns: number;
  updateSns: (amount: number, reason?: string) => void;
  showCustomAlert?: (message: string) => void;
}

export const BoostView: React.FC<BoostViewProps> = ({
  onNavigate,
  language,
  sns,
  updateSns,
  showCustomAlert,
}) => {
  const handleActivateBoost = (cost: number, name: string) => {
    if (sns < cost) {
      if (showCustomAlert) {
        showCustomAlert(language === 'ko' ? 'SNS 포인트가 부족합니다.' : 'Not enough SNS points.');
      }
      return;
    }
    updateSns(-cost, `Activate ${name}`);
    if (showCustomAlert) {
      showCustomAlert(language === 'ko' ? `${name} 부스터가 활성화되었습니다!` : `${name} Booster activated!`);
    }
  };

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
          {language === 'ko' ? '[ 영웅 부스터 센터 ]' : '[ Hero Booster Center ]'}
        </span>
        <div className="text-xs font-mono">
          SNS: <strong>{sns.toLocaleString()}</strong>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] p-4 rounded-none flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Zap className="text-amber-500" size={18} />
            <span className="font-mono font-bold text-sm">
              {language === 'ko' ? '경험치 2배 부스터 (1시간)' : '2x EXP Booster (1 Hr)'}
            </span>
          </div>
          <p className="text-xs font-mono opacity-70">
            {language === 'ko' ? '모든 아케이드 게임 승리 시 획득 경험치가 2배로 증가합니다.' : 'Double all EXP earned from arcade and card matches.'}
          </p>
          <button
            onClick={() => handleActivateBoost(50, language === 'ko' ? '경험치 2배' : '2x EXP')}
            className="w-full py-2 text-xs font-mono border border-[#201d1d] bg-[#0f0000] text-white rounded-sm hover:opacity-90 active:scale-95 cursor-pointer min-h-[36px]"
          >
            {language === 'ko' ? '50 SNS로 활성화' : 'Activate (50 SNS)'}
          </button>
        </div>

        <div className="border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] p-4 rounded-none flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="text-emerald-600" size={18} />
            <span className="font-mono font-bold text-sm">
              {language === 'ko' ? '골드/SNS 캐시백 부스터' : 'Gold/SNS Cashback Booster'}
            </span>
          </div>
          <p className="text-xs font-mono opacity-70">
            {language === 'ko' ? '상점 소환 및 P2P 거래 시 10% 캐시백이 적립됩니다.' : 'Receive 10% instant rebate on summons & trading.'}
          </p>
          <button
            onClick={() => handleActivateBoost(100, language === 'ko' ? '캐시백' : 'Cashback')}
            className="w-full py-2 text-xs font-mono border border-[#201d1d] bg-[#0f0000] text-white rounded-sm hover:opacity-90 active:scale-95 cursor-pointer min-h-[36px]"
          >
            {language === 'ko' ? '100 SNS로 활성화' : 'Activate (100 SNS)'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BoostView;
