import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Sparkles, X, Palette, Check } from 'lucide-react';
import { playSfx } from '../lib/sound';

interface TacticianMasteryModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: string;
}

interface AuraSkin {
  id: string;
  nameKo: string;
  nameEn: string;
  requiredLevel: number;
  borderClass: string;
  glowClass: string;
  isUnlocked: boolean;
}

const TACTICIAN_SKIN_STORAGE_KEY = 'hero_tactician_aura_skin_v1';

export const TacticianMasteryModal: React.FC<TacticianMasteryModalProps> = ({
  isOpen,
  onClose,
  language,
}) => {
  const currentLevel = 12; // Level calculated from tactical feats
  const currentExp = 340;
  const maxExp = 500;

  const [activeSkinId, setActiveSkinId] = useState<string>(() => {
    try {
      return localStorage.getItem(TACTICIAN_SKIN_STORAGE_KEY) || 'default';
    } catch (e) {
      return 'default';
    }
  });

  const skins: AuraSkin[] = [
    {
      id: 'default',
      nameKo: '클래식 슬레이트',
      nameEn: 'Classic Slate',
      requiredLevel: 1,
      borderClass: 'border-slate-700',
      glowClass: 'shadow-none',
      isUnlocked: true,
    },
    {
      id: 'neon',
      nameKo: '사이버 네온 블루',
      nameEn: 'Cyber Neon Blue',
      requiredLevel: 5,
      borderClass: 'border-cyan-400',
      glowClass: 'shadow-[0_0_15px_rgba(34,211,238,0.4)]',
      isUnlocked: currentLevel >= 5,
    },
    {
      id: 'magma',
      nameKo: '작열의 마그마 오라',
      nameEn: 'Blazing Magma Aura',
      requiredLevel: 10,
      borderClass: 'border-orange-500',
      glowClass: 'shadow-[0_0_15px_rgba(249,115,22,0.4)]',
      isUnlocked: currentLevel >= 10,
    },
    {
      id: 'frost',
      nameKo: '절대영도 프로스트',
      nameEn: 'Absolute Zero Frost',
      requiredLevel: 15,
      borderClass: 'border-indigo-400',
      glowClass: 'shadow-[0_0_15px_rgba(129,140,248,0.4)]',
      isUnlocked: currentLevel >= 15,
    },
  ];

  const handleSelectSkin = (id: string, isUnlocked: boolean) => {
    if (!isUnlocked) return;
    playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
    setActiveSkinId(id);
    localStorage.setItem(TACTICIAN_SKIN_STORAGE_KEY, id);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs font-mono">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="relative w-full max-w-sm bg-[#201d1d] border border-[rgba(255,255,255,0.2)] rounded-none p-4 text-[#fdfcfc] shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.12)] pb-2 mb-3">
            <div className="flex items-center gap-1.5">
              <Palette size={16} className="text-indigo-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                [ TACTICIAN MASTERY &amp; BOARD AURAS ]
              </span>
            </div>
            <button
              onClick={onClose}
              className="text-white/60 hover:text-white p-1 rounded-sm border border-transparent hover:border-white/20"
            >
              <X size={14} />
            </button>
          </div>

          {/* Level Progress */}
          <div className="bg-[#141212] border border-white/15 p-3 rounded-none mb-3">
            <div className="flex justify-between items-center text-xs mb-1.5 font-bold">
              <span className="text-amber-300">
                {language === 'ko' ? `전술가 등급: Lv.${currentLevel}` : `Tactician Rank: Lv.${currentLevel}`}
              </span>
              <span className="text-white/60 text-[10px]">
                {currentExp} / {maxExp} EXP
              </span>
            </div>
            <div className="w-full bg-white/10 h-1.5 rounded-none overflow-hidden">
              <div
                className="bg-indigo-400 h-full transition-all duration-300"
                style={{ width: `${(currentExp / maxExp) * 100}%` }}
              />
            </div>
          </div>

          <p className="text-[10px] text-white/80 mb-3 leading-relaxed">
            {language === 'ko'
              ? '미션 및 전술 업적으로 숙련도를 올려 3x3 전장 외곽선 오라 스킨을 해금하고 장착하세요.'
              : 'Level up tactician mastery through battle feats to unlock custom 3x3 battlefield aura skins.'}
          </p>

          {/* Skins Grid */}
          <div className="space-y-2 mb-4">
            {skins.map(skin => (
              <div
                key={skin.id}
                onClick={() => handleSelectSkin(skin.id, skin.isUnlocked)}
                className={`p-2.5 rounded-none border flex items-center justify-between transition-all cursor-pointer ${
                  activeSkinId === skin.id
                    ? 'bg-indigo-950/60 border-indigo-400 text-indigo-300'
                    : skin.isUnlocked
                    ? 'bg-[#141212] border-white/20 hover:border-indigo-500/60 text-white'
                    : 'bg-[#141212]/50 border-white/10 opacity-50 cursor-not-allowed text-white/40'
                }`}
              >
                <div>
                  <div className="text-xs font-bold flex items-center gap-1.5">
                    <span className={`w-3 h-3 border ${skin.borderClass} ${skin.glowClass} inline-block`} />
                    <span>{language === 'ko' ? skin.nameKo : skin.nameEn}</span>
                  </div>
                  <div className="text-[9px] text-white/50 font-mono mt-0.5">
                    {language === 'ko' ? `해금 조건: 전술가 Lv.${skin.requiredLevel}` : `Requires Tactician Lv.${skin.requiredLevel}`}
                  </div>
                </div>

                <div className="text-right text-[9px] font-bold">
                  {activeSkinId === skin.id ? (
                    <span className="text-indigo-400 flex items-center gap-0.5">
                      <Check size={12} /> [적용 중]
                    </span>
                  ) : skin.isUnlocked ? (
                    <span className="text-white/60 hover:text-white">[적용하기]</span>
                  ) : (
                    <span className="text-rose-400">[잠김]</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={onClose}
            className="w-full py-2 bg-[#fdfcfc] text-[#201d1d] hover:bg-indigo-300 transition-colors text-xs font-bold uppercase rounded-sm flex items-center justify-center gap-1.5"
          >
            <Sparkles size={13} />
            <span>{language === 'ko' ? '[ 오라 설정 완료 ]' : '[ Close ]'}</span>
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
