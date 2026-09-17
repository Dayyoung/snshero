import React, { useState } from 'react';
import { Zap, CheckCircle2, Gift, Shield, Sparkles, Coins } from 'lucide-react';
import { playSfx } from '../lib/sound';
import { triggerHaptic } from '../lib/haptic';

interface GuildDailyQuickHubProps {
  language: string;
  attendedToday: boolean;
  onAttend: () => void;
  onDonate: (amount: number) => void;
  snsBalance: number;
}

export const GuildDailyQuickHub: React.FC<GuildDailyQuickHubProps> = ({
  language,
  attendedToday,
  onAttend,
  onDonate,
  snsBalance
}) => {
  const isKo = language === 'ko';
  const todayStr = new Date().toISOString().slice(0, 10);
  const [isAllInOneDone, setIsAllInOneDone] = useState<boolean>(() => {
    return typeof window !== 'undefined' && localStorage.getItem(`hero_guild_all_in_one_${todayStr}`) === 'true';
  });

  const handleAllInOne = () => {
    triggerHaptic('heavy');
    playSfx('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
    
    // 1. 출석체크 수행 (미완료 시)
    if (!attendedToday) {
      onAttend();
    }

    // 2. 500 SNS 기부 수행 (잔액 충분 시)
    if (snsBalance >= 500) {
      onDonate(500);
    }

    localStorage.setItem(`hero_guild_all_in_one_${todayStr}`, 'true');
    setIsAllInOneDone(true);
  };

  return (
    <div className="w-full bg-[#161414] border border-amber-500/50 p-3 rounded-none font-mono text-white shadow-md">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-none shrink-0">
            <Zap size={16} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-amber-300">
                {isKo ? '[일일 길드 올인원 원터치 허브]' : '[DAILY GUILD ALL-IN-ONE HUB]'}
              </span>
            </div>
            <p className="text-[10px] text-white/70 mt-0.5">
              {isKo
                ? '출석체크(+50 SNS) + 500 SNS 기부 + 길드 AP 버프 활성화를 1-Tap으로 일괄 완료!'
                : 'Check Attendance (+50 SNS) + Donate 500 SNS + Activate Buff in 1-Tap!'}
            </p>
          </div>
        </div>

        <button
          type="button"
          disabled={isAllInOneDone}
          onClick={handleAllInOne}
          className={`w-full sm:w-auto min-h-[48px] px-4 py-2 font-black text-xs uppercase tracking-wider rounded-none flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md active:scale-98 ${
            isAllInOneDone
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500 cursor-default opacity-80'
              : 'bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black border border-amber-300'
          }`}
        >
          {isAllInOneDone ? (
            <>
              <CheckCircle2 size={15} />
              <span>{isKo ? '오늘 올인원 완수됨 (출석+기부+버프)' : 'All-in-One Completed'}</span>
            </>
          ) : (
            <>
              <Sparkles size={15} />
              <span>{isKo ? '⚡ 1-Tap 올인원 활동 시작' : '⚡ 1-Tap All-in-One'}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
