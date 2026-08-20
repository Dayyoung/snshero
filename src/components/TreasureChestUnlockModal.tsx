import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, X, Gift, Key } from 'lucide-react';
import { playSfx } from '../lib/sound';

interface TreasureChestUnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRewardClaim: (snsBonus: number, itemRarity: 'rare' | 'epic' | 'legendary') => void;
  language: string;
}

interface ChestOption {
  id: number;
  snsReward: number;
  rarity: 'rare' | 'epic' | 'legendary';
  labelKo: string;
  labelEn: string;
}

export const TreasureChestUnlockModal: React.FC<TreasureChestUnlockModalProps> = ({
  isOpen,
  onClose,
  onRewardClaim,
  language,
}) => {
  const [selectedChest, setSelectedChest] = useState<number | null>(null);
  const [isOpened, setIsOpened] = useState<boolean>(false);

  const chests: ChestOption[] = [
    { id: 1, snsReward: 30, rarity: 'rare', labelKo: '신비한 은빛 상자', labelEn: 'Mystic Silver Chest' },
    { id: 2, snsReward: 60, rarity: 'epic', labelKo: '고대 황금 상자', labelEn: 'Ancient Gold Chest' },
    { id: 3, snsReward: 100, rarity: 'legendary', labelKo: '심연의 용린 상자', labelEn: 'Abyssal Dragon Chest' },
  ];

  const handlePickChest = (id: number) => {
    if (selectedChest !== null) return;
    setSelectedChest(id);
    playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
    setTimeout(() => {
      setIsOpened(true);
      const chosen = chests.find(c => c.id === id)!;
      onRewardClaim(chosen.snsReward, chosen.rarity);
    }, 600);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs font-mono">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="relative w-full max-w-sm bg-[#201d1d] border border-[rgba(255,255,255,0.2)] rounded-none p-4 text-[#fdfcfc] shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.12)] pb-2 mb-3">
            <div className="flex items-center gap-1.5">
              <Key size={16} className="text-amber-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                [ BOSS TREASURE CHEST UNLOCK ]
              </span>
            </div>
            <button
              onClick={onClose}
              className="text-white/60 hover:text-white p-1 rounded-sm border border-transparent hover:border-white/20"
            >
              <X size={14} />
            </button>
          </div>

          <p className="text-[10px] text-white/80 mb-4 leading-relaxed text-center">
            {language === 'ko'
              ? '보스 수동 토벌 특별 보상! 3개의 고대 보물상자 중 1개를 선택하여 잠금을 해제하세요.'
              : 'Boss Defeat Special Bounty! Pick 1 of 3 ancient chests to unlock randomized premium rewards.'}
          </p>

          {/* 3 Chests Row */}
          <div className="grid grid-cols-3 gap-2.5 mb-4">
            {chests.map(chest => {
              const isThisSelected = selectedChest === chest.id;
              return (
                <button
                  key={chest.id}
                  onClick={() => handlePickChest(chest.id)}
                  disabled={selectedChest !== null}
                  className={`h-28 rounded-none border flex flex-col items-center justify-center gap-1.5 p-2 transition-all ${
                    isThisSelected
                      ? 'bg-amber-950/80 border-amber-400 scale-105 shadow-[0_0_12px_rgba(251,191,36,0.3)]'
                      : selectedChest !== null
                      ? 'opacity-40 bg-[#141212] border-white/10'
                      : 'bg-[#141212] border-white/20 hover:border-amber-400/80 hover:bg-amber-950/30'
                  }`}
                >
                  <span className="text-3xl animate-bounce">
                    {isOpened && isThisSelected ? '🎁' : '📦'}
                  </span>
                  <span className="text-[9px] font-bold text-center text-white/90 leading-tight">
                    {language === 'ko' ? chest.labelKo : chest.labelEn}
                  </span>
                  <span className="text-[8px] text-amber-300/80 font-bold">
                    {selectedChest === null ? '[SELECT]' : isThisSelected ? '[OPENED]' : ''}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Reveal details */}
          {isOpened && selectedChest !== null && (
            <div className="bg-emerald-950/70 border border-emerald-400/80 p-2.5 rounded-none text-center mb-3">
              <span className="text-xs font-bold text-emerald-300 block mb-0.5">
                {language === 'ko' ? '✨ 상자 잠금 해제 성공!' : '✨ Chest Unlocked!'}
              </span>
              <span className="text-[10px] text-amber-300 font-bold">
                +{chests.find(c => c.id === selectedChest)?.snsReward} SNS &amp; [{chests.find(c => c.id === selectedChest)?.rarity.toUpperCase()} ITEM]
              </span>
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full py-2 bg-[#fdfcfc] text-[#201d1d] hover:bg-amber-300 transition-colors text-xs font-bold uppercase rounded-sm flex items-center justify-center gap-1.5"
          >
            <Sparkles size={13} />
            <span>{isOpened ? (language === 'ko' ? '[ 보상 수령 및 닫기 ]' : '[ Claim & Close ]') : (language === 'ko' ? '[ 건너뛰기 ]' : '[ Skip ]')}</span>
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
