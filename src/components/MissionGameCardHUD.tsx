import React from 'react';
import { Sparkles, Trophy, Zap } from 'lucide-react';

interface MissionGameCardHUDProps {
  score: number;
  targetScore: number;
  rewardCardName: string;
  isOwned: boolean;
  feverActive: boolean;
  feverMultiplier: number;
  onOpenFeverModal?: () => void;
}

export const MissionGameCardHUD: React.FC<MissionGameCardHUDProps> = ({
  score,
  targetScore,
  rewardCardName,
  isOwned,
  feverActive,
  feverMultiplier,
  onOpenFeverModal
}) => {
  const progress = Math.min(100, Math.floor((score / targetScore) * 100));

  return (
    <div className="absolute top-2 left-2 right-2 z-30 flex items-center justify-between font-mono select-none pointer-events-none">
      {/* Score & Target */}
      <div className="bg-[#201d1d]/90 text-white px-3 py-1.5 rounded-sm border border-white/20 backdrop-blur-sm pointer-events-auto flex items-center gap-3">
        <div>
          <div className="text-[9px] text-zinc-400">SCORE / TARGET</div>
          <div className="text-xs font-black">
            {score} / <span className="text-amber-400">{targetScore}</span>
          </div>
        </div>
        <div className="w-16 h-2 bg-zinc-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Target Card & Fever Badge */}
      <div className="flex items-center gap-1.5 pointer-events-auto">
        <div className="bg-[#fdfcfc]/95 border border-[rgba(15,0,0,0.12)] px-2 py-1 rounded-sm text-right">
          <div className="text-[8px] text-[#504a4a]">도전 카드</div>
          <div className="text-[10px] font-bold text-[#201d1d] truncate max-w-[90px]">
            {rewardCardName}
          </div>
        </div>

        {/* Fever Booster Button (SCR-09-09) */}
        <button
          onClick={onOpenFeverModal}
          className={`px-2 py-1 rounded-sm border text-[10px] font-black flex items-center gap-1 cursor-pointer transition-all active:scale-95 ${
            feverActive
              ? 'bg-amber-500 text-white border-amber-600 animate-pulse shadow-md'
              : 'bg-white text-amber-700 border-amber-300 hover:bg-amber-50'
          }`}
        >
          <Zap size={11} className={feverActive ? 'text-white' : 'text-amber-600'} />
          <span>{feverActive ? `${feverMultiplier}x FEVER` : 'FEVER 2X'}</span>
        </button>
      </div>
    </div>
  );
};
