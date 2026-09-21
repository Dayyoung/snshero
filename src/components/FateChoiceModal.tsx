/**
 * FateChoiceModal.tsx - SCR-04-15
 * 10연차 소환 직전 '운명 선택의 갈림길' (태양의 마법진 vs 달의 마법진 버프 선택)
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sun, Moon, Sparkles, Flame, Shield, X } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

export interface FateBuff {
  id: 'sun' | 'moon';
  titleKo: string;
  titleEn: string;
  descKo: string;
  descEn: string;
  multiplier: string;
}

interface FateChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFate: (buff: FateBuff) => void;
  language?: string;
}

export const FateChoiceModal: React.FC<FateChoiceModalProps> = ({
  isOpen,
  onClose,
  onSelectFate,
  language = 'ko',
}) => {
  if (!isOpen) return null;

  const sunBuff: FateBuff = {
    id: 'sun',
    titleKo: '태양의 심판 마법진',
    titleEn: 'Solar Judgement Circle',
    descKo: 'SSR/전설 등급 등장 확률 1.5배 상승 & 공격형 카드 가중치',
    descEn: '1.5x SSR/Legendary Rate & ATK Card Weight',
    multiplier: '1.5x SSR',
  };

  const moonBuff: FateBuff = {
    id: 'moon',
    titleKo: '달빛의 은총 마법진',
    titleEn: 'Lunar Grace Circle',
    descKo: '10연차 중복 시 소울더스트 2배 환급 & 방어/지원형 카드 가중치',
    descEn: '2x Soul Dust on Dupes & Support Card Weight',
    multiplier: '2.0x DUST',
  };

  const handleSelect = (buff: FateBuff) => {
    triggerHaptic('heavy');
    onSelectFate(buff);
    onClose();
  };

  return (
    <AnimatePresence>
      <div 
        onClick={onClose}
        className="fixed inset-0 z-[10000] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 font-mono select-none"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.85 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-sm bg-gradient-to-b from-slate-900 via-purple-950 to-slate-950 border-2 border-amber-400 rounded-2xl p-5 text-white shadow-2xl relative text-center"
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 text-slate-400 hover:text-white p-1 cursor-pointer"
          >
            <X size={20} />
          </button>

          <div className="inline-block p-3 bg-amber-500/20 rounded-full text-amber-300 border border-amber-400/50 mb-2">
            <Sparkles size={28} className="animate-pulse" />
          </div>

          <h2 className="text-lg font-black text-amber-300 uppercase tracking-tight">
            🔮 {language === 'ko' ? '운명 선택의 갈림길' : 'CROSSROAD OF FATE'}
          </h2>
          <p className="text-xs text-slate-300 mt-1 mb-4">
            {language === 'ko'
              ? '10연차 소환 전, 마법진을 선택하여 소환 운명을 결정하세요!'
              : 'Choose your arcane circle to bless your 10x summon!'}
          </p>

          <div className="grid grid-cols-1 gap-3 mb-4">
            {/* 태양의 마법진 */}
            <div
              onClick={() => handleSelect(sunBuff)}
              className="p-3.5 bg-gradient-to-r from-amber-500/20 to-rose-500/20 border-2 border-amber-400 rounded-xl text-left cursor-pointer hover:brightness-125 transition-all active:scale-98 relative group"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Sun size={18} className="text-amber-400" />
                  <span className="text-xs font-black text-amber-300">
                    {language === 'ko' ? sunBuff.titleKo : sunBuff.titleEn}
                  </span>
                </div>
                <span className="text-[10px] font-black px-1.5 py-0.5 bg-amber-500 text-slate-950 rounded">
                  {sunBuff.multiplier}
                </span>
              </div>
              <p className="text-[11px] text-slate-200">
                {language === 'ko' ? sunBuff.descKo : sunBuff.descEn}
              </p>
            </div>

            {/* 달의 마법진 */}
            <div
              onClick={() => handleSelect(moonBuff)}
              className="p-3.5 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border-2 border-indigo-400 rounded-xl text-left cursor-pointer hover:brightness-125 transition-all active:scale-98 relative group"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Moon size={18} className="text-indigo-400" />
                  <span className="text-xs font-black text-indigo-300">
                    {language === 'ko' ? moonBuff.titleKo : moonBuff.titleEn}
                  </span>
                </div>
                <span className="text-[10px] font-black px-1.5 py-0.5 bg-indigo-500 text-white rounded">
                  {moonBuff.multiplier}
                </span>
              </div>
              <p className="text-[11px] text-slate-200">
                {language === 'ko' ? moonBuff.descKo : moonBuff.descEn}
              </p>
            </div>
          </div>

          <p className="text-[10px] text-slate-400">
            {language === 'ko' ? '마법진을 탭하면 즉시 소환이 시작됩니다.' : 'Tap a circle to begin summon.'}
          </p>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
