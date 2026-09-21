/**
 * DeckSynergyMasteryModal.tsx - SCR-03-15
 * 종족/속성 3/5세트 시너지 콤보 마스터리 트리 & 만능 와일드카드 크리스털 연동
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, Gem, Zap, Shield, Flame, Check } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

interface SynergyNode {
  id: string;
  nameKo: string;
  nameEn: string;
  tier: number; // 3 or 5
  descKo: string;
  descEn: string;
  isUnlocked: boolean;
  currentCount: number;
}

interface DeckSynergyMasteryModalProps {
  isOpen: boolean;
  onClose: () => void;
  language?: string;
  wildcardCount?: number;
  onBuyWildcard?: () => void;
}

export const DeckSynergyMasteryModal: React.FC<DeckSynergyMasteryModalProps> = ({
  isOpen,
  onClose,
  language = 'ko',
  wildcardCount = 0,
  onBuyWildcard,
}) => {
  const [wildcards, setWildcards] = useState(wildcardCount);

  if (!isOpen) return null;

  const synergies: SynergyNode[] = [
    {
      id: 'fire_3',
      nameKo: '화염의 맹위 (3세트)',
      nameEn: 'Blazing Fury (3-Set)',
      tier: 3,
      descKo: '전체 유닛 공격력 +15% 및 턴 시작 시 적 전열 5 데미지 화상',
      descEn: '+15% Total ATK & 5 burn dmg to enemy front row',
      isUnlocked: true,
      currentCount: 3,
    },
    {
      id: 'fire_5',
      nameKo: '불멸의 불사조 (5세트)',
      nameEn: 'Immortal Phoenix (5-Set)',
      tier: 5,
      descKo: '치명적 피해를 입을 시 체력 30%로 1회 부활 (전투당 1회)',
      descEn: 'Revive with 30% HP once per battle on lethal damage',
      isUnlocked: false,
      currentCount: 4, // 1장 부족!
    },
    {
      id: 'water_3',
      nameKo: '수호의 해일 (3세트)',
      nameEn: 'Tidal Aegis (3-Set)',
      tier: 3,
      descKo: '전체 아군 쉴드 +20 및 디버프 1회 면역',
      descEn: '+20 Total Shield & 1 Debuff Immunity',
      isUnlocked: true,
      currentCount: 3,
    },
  ];

  const handleUseWildcard = () => {
    if (wildcards <= 0) {
      if (onBuyWildcard) onBuyWildcard();
      return;
    }
    setWildcards(prev => prev - 1);
    triggerHaptic('success');
  };

  return (
    <AnimatePresence>
      <div 
        onClick={onClose}
        className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 font-mono select-none"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-sm bg-slate-900 border-2 border-indigo-500 rounded-xl p-4 text-white shadow-2xl relative"
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 text-slate-400 hover:text-white p-1 cursor-pointer"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-2 pb-2 border-b border-slate-700">
            <Sparkles size={18} className="text-amber-400" />
            <h3 className="text-sm font-black text-amber-300 uppercase">
              {language === 'ko' ? '시너지 콤보 마스터리 트리' : 'Synergy Mastery Tree'}
            </h3>
          </div>

          {/* 와일드카드 크리스털 배너 */}
          <div className="my-3 p-3 bg-gradient-to-r from-purple-900/60 to-indigo-900/60 border border-purple-500/50 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gem size={22} className="text-pink-400 animate-bounce" />
              <div>
                <div className="text-[11px] font-black text-pink-300">
                  {language === 'ko' ? '만능 와일드카드 크리스털' : 'Wildcard Crystal'}
                </div>
                <div className="text-[9px] text-slate-300">
                  {language === 'ko' ? '부족한 세트 조건을 1장 즉시 충족!' : 'Fulfills 1 missing synergy piece!'}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleUseWildcard}
              className="px-2.5 py-1.5 bg-pink-500 hover:bg-pink-400 text-slate-950 font-black text-[10px] rounded cursor-pointer active:scale-95 transition-all"
            >
              {wildcards > 0 
                ? (language === 'ko' ? `사용 (보유:${wildcards})` : `Use (${wildcards})`)
                : (language === 'ko' ? '구매 (990원)' : 'Buy ($0.99)')}
            </button>
          </div>

          {/* 시너지 노드 목록 */}
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {synergies.map((syn) => (
              <div
                key={syn.id}
                className={`p-2.5 rounded-lg border ${
                  syn.isUnlocked 
                    ? 'bg-indigo-950/40 border-indigo-500/60' 
                    : 'bg-slate-800/40 border-slate-700 opacity-85'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {syn.id.startsWith('fire') ? <Flame size={14} className="text-rose-400" /> : <Zap size={14} className="text-sky-400" />}
                    <span className="text-xs font-bold text-white">
                      {language === 'ko' ? syn.nameKo : syn.nameEn}
                    </span>
                  </div>
                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                    syn.isUnlocked ? 'bg-emerald-500 text-slate-950' : 'bg-amber-500/30 text-amber-300'
                  }`}>
                    {syn.currentCount}/{syn.tier} {syn.isUnlocked ? 'ACTIVE' : 'LACKING'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-300 mt-1">
                  {language === 'ko' ? syn.descKo : syn.descEn}
                </p>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full mt-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded cursor-pointer"
          >
            {language === 'ko' ? '닫기' : 'Close'}
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
