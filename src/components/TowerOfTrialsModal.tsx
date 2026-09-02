import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Sparkles, X, Shield, Swords, Gem, Award, Lock, Play } from 'lucide-react';
import { playSfx } from '../lib/sound';

interface TowerOfTrialsModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: string;
  onStartFloor?: (floor: number) => void;
  onStartTowerFloor?: (floor: number) => void;
}

interface FloorData {
  floor: number;
  modifierKo: string;
  modifierEn: string;
  bossPower: number;
  diamondReward: number;
  isUnlocked: boolean;
  isCleared: boolean;
}

const TOWER_PROGRESS_KEY = 'hero_tower_trials_floor_v1';

export const TowerOfTrialsModal: React.FC<TowerOfTrialsModalProps> = ({
  isOpen,
  onClose,
  language,
  onStartFloor,
  onStartTowerFloor,
}) => {
  const [mounted, setMounted] = useState<boolean>(false);
  const [clearedFloor, setClearedFloor] = useState<number>(() => {
    try {
      return parseInt(localStorage.getItem(TOWER_PROGRESS_KEY) || '14', 10);
    } catch (e) {
      return 14;
    }
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const floors: FloorData[] = Array.from({ length: 50 }, (_, i) => {
    const fl = i + 1;
    const isBoss = fl % 5 === 0;
    return {
      floor: fl,
      modifierKo: fl > 30 ? '🚫 자동전투 불가 (수동 전술 전용)' : isBoss ? '👑 보스 구역: 방어막 +100' : '전장 마나 파동 활성화',
      modifierEn: fl > 30 ? '🚫 Manual Only (Auto-Play Disabled)' : isBoss ? '👑 Boss Zone: Barrier +100' : 'Mana Wave Active',
      bossPower: 120 + fl * 12,
      diamondReward: isBoss ? 50 : 15,
      isUnlocked: fl <= clearedFloor + 1,
      isCleared: fl <= clearedFloor,
    };
  });

  const handleSelectFloor = (floor: number, isUnlocked: boolean) => {
    if (!isUnlocked) return;
    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    if (onStartFloor) {
      onStartFloor(floor);
    }
    if (onStartTowerFloor) {
      onStartTowerFloor(floor);
    }
    onClose();
  };

  if (!isOpen || !mounted || typeof document === 'undefined') return null;

  const content = (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md font-mono select-none pointer-events-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="relative w-full max-w-md bg-[#201d1d] border border-[rgba(255,255,255,0.2)] rounded-none p-4 sm:p-5 text-[#fdfcfc] shadow-2xl max-h-[88vh] flex flex-col pointer-events-auto"
      >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.12)] pb-2 mb-3">
            <div className="flex items-center gap-1.5">
              <Trophy size={16} className="text-amber-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                [ TOWER OF TRIALS (50 FLOORS) ]
              </span>
            </div>
            <button
              onClick={onClose}
              className="text-white/60 hover:text-white p-1 rounded-sm border border-transparent hover:border-white/20"
            >
              <X size={14} />
            </button>
          </div>

          <p className="text-[10px] text-white/80 mb-2 leading-relaxed">
            {language === 'ko'
              ? '주간 50층 무한의 시련 탑! 30층 이상부터는 오직 수동 전술로만 등반 가능하며, 매 5층 보스 격파 시 다이아 잭팟을 지급합니다.'
              : 'Weekly 50-Floor Tower of Trials! Floors 31+ require pure manual tactics for weekly diamond rewards.'}
          </p>

          <div className="bg-[#141212] border border-white/10 p-2 rounded-none mb-3 flex items-center justify-between text-xs font-bold">
            <span className="text-amber-300">
              {language === 'ko' ? `현재 최고 도달: ${clearedFloor}층` : `Current Record: Floor ${clearedFloor}`}
            </span>
            <span className="text-cyan-300 flex items-center gap-1 text-[11px]">
              <Gem size={12} />
              {language === 'ko' ? `누적 보상: ${clearedFloor * 15} 다이아` : `Bounty: ${clearedFloor * 15} Gems`}
            </span>
          </div>

          {/* Floor List Scrollable */}
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 mb-3 scrollbar-thin">
            {floors.slice(0, Math.min(50, clearedFloor + 5)).map(f => (
              <div
                key={f.floor}
                onClick={() => handleSelectFloor(f.floor, f.isUnlocked)}
                className={`p-2 rounded-none border flex items-center justify-between transition-all ${
                  f.isCleared
                    ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                    : f.isUnlocked
                    ? 'bg-amber-950/40 border-amber-400 text-amber-200 cursor-pointer hover:bg-amber-900/50'
                    : 'bg-[#141212]/40 border-white/10 opacity-50 cursor-not-allowed text-white/40'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold w-12 text-white">
                    F.{f.floor}
                  </span>
                  <div>
                    <div className="text-[10px] font-bold text-white/90">
                      {language === 'ko' ? f.modifierKo : f.modifierEn}
                    </div>
                    <div className="text-[8px] text-white/50">
                      PWR {f.bossPower} | +{f.diamondReward} Gems
                    </div>
                  </div>
                </div>

                <div>
                  {f.isCleared ? (
                    <span className="text-[9px] text-emerald-400 font-bold">[CLEAR]</span>
                  ) : f.isUnlocked ? (
                    <button className="px-2 py-1 bg-amber-400 text-[#201d1d] text-[9px] font-bold rounded-xs flex items-center gap-1">
                      <Play size={10} /> [도전]
                    </button>
                  ) : (
                    <Lock size={12} className="text-white/30" />
                  )}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={onClose}
            className="w-full py-2.5 bg-[#fdfcfc] text-[#201d1d] hover:bg-amber-300 transition-colors text-xs font-bold uppercase rounded-sm flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Sparkles size={13} />
            <span>{language === 'ko' ? '[ 닫기 ]' : '[ Close ]'}</span>
          </button>
        </motion.div>
    </div>
  );

  return createPortal(content, document.body);
};
