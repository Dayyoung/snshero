import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, X, Trophy, CheckCircle, Gem, Sparkles, Coins } from 'lucide-react';
import { playSfx } from '../lib/sound';
import { triggerHaptic } from '../lib/haptic';

interface TowerSweepBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  maxClearedFloor: number;
  language: string;
  onSweepComplete: (floor: number, sweepsCount: number, rewards: { gold: number; gems: number }) => void;
}

export const TowerSweepBottomSheet: React.FC<TowerSweepBottomSheetProps> = ({
  isOpen,
  onClose,
  maxClearedFloor,
  language,
  onSweepComplete
}) => {
  const isKo = language === 'ko';
  const [selectedFloor, setSelectedFloor] = useState<number>(Math.max(1, maxClearedFloor));
  const [sweepTimes, setSweepTimes] = useState<number>(1);
  const [sweepResult, setSweepResult] = useState<{ gold: number; gems: number } | null>(null);

  if (!isOpen) return null;

  const handleSweep = () => {
    triggerHaptic('heavy');
    playSfx('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
    const goldEarned = selectedFloor * 200 * sweepTimes;
    const gemsEarned = selectedFloor * 2 * sweepTimes;
    
    setSweepResult({ gold: goldEarned, gems: gemsEarned });
    onSweepComplete(selectedFloor, sweepTimes, { gold: goldEarned, gems: gemsEarned });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[999999] flex items-end justify-center bg-black/80 backdrop-blur-xs font-mono select-none">
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="w-full max-w-md bg-[#161414] border-t-2 border-amber-500 p-4 text-white shadow-2xl rounded-t-xl max-h-[85vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
            <div className="flex items-center gap-1.5 text-amber-400">
              <Zap size={18} />
              <span className="text-xs font-black uppercase tracking-wider">
                {isKo ? '[시련의 탑 쾌속 소탕 바텀시트]' : '[TOWER INSTANT SWEEP]'}
              </span>
            </div>
            <button
              onClick={onClose}
              className="text-white/60 hover:text-white p-1 rounded-sm min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {sweepResult ? (
            <div className="p-4 bg-amber-500/10 border border-amber-500/40 rounded-sm text-center space-y-3 mb-3">
              <div className="text-amber-400 font-black text-sm flex items-center justify-center gap-1">
                <Trophy size={16} />
                <span>{isKo ? '소탕 작전 완수!' : 'SWEEP COMPLETE!'}</span>
              </div>
              <div className="flex justify-center gap-4 text-xs font-bold">
                <span className="flex items-center gap-1 text-yellow-300">
                  <Coins size={14} /> +{sweepResult.gold.toLocaleString()} Gold
                </span>
                <span className="flex items-center gap-1 text-cyan-300">
                  <Gem size={14} /> +{sweepResult.gems} Gems
                </span>
              </div>
              <button
                onClick={() => {
                  setSweepResult(null);
                  onClose();
                }}
                className="w-full min-h-[44px] bg-amber-400 hover:bg-amber-300 text-black font-black text-xs py-2 rounded-sm cursor-pointer shadow-md"
              >
                [{isKo ? '확인 및 보상 수령' : 'Collect Rewards'}]
              </button>
            </div>
          ) : (
            <div className="space-y-4 mb-3">
              <p className="text-[11px] text-white/70">
                {isKo 
                  ? '이미 3성 클리어한 층을 즉시 소탕하여 전투 없이 골드와 보석을 고속 획득합니다.' 
                  : 'Instantly sweep cleared floors to claim gold and gems without battle.'}
              </p>

              {/* Floor Selector */}
              <div className="space-y-1.5">
                <label className="text-xs text-amber-300 font-bold">
                  {isKo ? '소탕할 층 선택' : 'Select Floor'}:
                </label>
                <div className="grid grid-cols-5 gap-1.5 max-h-28 overflow-y-auto p-1 bg-black/40 border border-white/10 rounded-sm">
                  {Array.from({ length: Math.max(1, maxClearedFloor) }, (_, i) => i + 1).map((fl) => (
                    <button
                      key={fl}
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        setSelectedFloor(fl);
                      }}
                      className={`min-h-[38px] text-xs font-bold border rounded-sm cursor-pointer transition-all ${
                        selectedFloor === fl 
                          ? 'bg-amber-400 text-black border-amber-300' 
                          : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10'
                      }`}
                    >
                      {fl}F
                    </button>
                  ))}
                </div>
              </div>

              {/* Sweeps Count */}
              <div className="flex items-center justify-between p-2.5 bg-black/40 border border-white/10 rounded-sm">
                <span className="text-xs text-white/80">{isKo ? '연속 소탕 횟수' : 'Sweep Count'}</span>
                <div className="flex items-center gap-2">
                  {[1, 3, 5, 10].map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        setSweepTimes(count);
                      }}
                      className={`min-h-[36px] px-2.5 text-xs font-bold border rounded-sm cursor-pointer ${
                        sweepTimes === count 
                          ? 'bg-amber-400 text-black border-amber-300' 
                          : 'bg-white/5 border-white/10 text-white/70'
                      }`}
                    >
                      {count}회
                    </button>
                  ))}
                </div>
              </div>

              {/* Expected rewards */}
              <div className="p-2.5 bg-amber-950/20 border border-amber-500/30 rounded-sm flex items-center justify-between text-xs">
                <span className="text-white/60">{isKo ? '예상 보상 합계' : 'Total Rewards'}:</span>
                <span className="text-amber-300 font-bold">
                  +{selectedFloor * 200 * sweepTimes} Gold / +{selectedFloor * 2 * sweepTimes} Gems
                </span>
              </div>

              {/* Sweep Action Button */}
              <button
                type="button"
                onClick={handleSweep}
                disabled={maxClearedFloor <= 0}
                className="w-full min-h-[48px] bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-black text-xs uppercase tracking-wider rounded-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-98 disabled:opacity-40"
              >
                <Zap size={16} />
                <span>[{selectedFloor}층 {sweepTimes}회 원터치 쾌속 소탕 시작]</span>
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
