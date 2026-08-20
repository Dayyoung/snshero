import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, X, BookOpen, Check, Lock } from 'lucide-react';
import { playSfx } from '../lib/sound';

interface MonsterBeastariumModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: string;
}

interface MonsterEntry {
  id: string;
  nameKo: string;
  nameEn: string;
  icon: string;
  requiredKills: number;
  currentKills: number;
  buffKo: string;
  buffEn: string;
  isUnlocked: boolean;
  isSelectedPet: boolean;
}

const BEASTARIUM_STORAGE_KEY = 'hero_beastarium_pet_v1';

export const MonsterBeastariumModal: React.FC<MonsterBeastariumModalProps> = ({
  isOpen,
  onClose,
  language,
}) => {
  const [selectedPetId, setSelectedPetId] = useState<string>(() => {
    try {
      return localStorage.getItem(BEASTARIUM_STORAGE_KEY) || 'slime';
    } catch (e) {
      return 'slime';
    }
  });

  const monsters: MonsterEntry[] = [
    {
      id: 'slime',
      nameKo: '말랑 슬라임',
      nameEn: 'Bouncy Slime',
      icon: '🟢',
      requiredKills: 1,
      currentKills: 5,
      buffKo: '골드/SNS 획득량 +2%',
      buffEn: 'Gold & SNS Bounty +2%',
      isUnlocked: true,
      isSelectedPet: selectedPetId === 'slime',
    },
    {
      id: 'goblin',
      nameKo: '황금 고블린',
      nameEn: 'Loot Goblin',
      icon: '👺',
      requiredKills: 3,
      currentKills: 4,
      buffKo: '마나샘 점령 보너스 +3 SNS',
      buffEn: 'Mana Spring Bonus +3 SNS',
      isUnlocked: true,
      isSelectedPet: selectedPetId === 'goblin',
    },
    {
      id: 'dragon',
      nameKo: '아기 드래곤',
      nameEn: 'Whelp Dragon',
      icon: '🐲',
      requiredKills: 5,
      currentKills: 6,
      buffKo: '화속성/용족 카드 파워 +1',
      buffEn: 'Fire/Dragon Card Power +1',
      isUnlocked: true,
      isSelectedPet: selectedPetId === 'dragon',
    },
    {
      id: 'golem',
      nameKo: '고대 골렘',
      nameEn: 'Ancient Golem',
      icon: '🗿',
      requiredKills: 10,
      currentKills: 8,
      buffKo: '철벽 방어 성공 시 +5 SNS',
      buffEn: 'Ironclad Defense +5 SNS',
      isUnlocked: false,
      isSelectedPet: selectedPetId === 'golem',
    },
  ];

  const handleSelectPet = (id: string, isUnlocked: boolean) => {
    if (!isUnlocked) return;
    playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
    setSelectedPetId(id);
    localStorage.setItem(BEASTARIUM_STORAGE_KEY, id);
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
              <BookOpen size={16} className="text-emerald-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                [ MONSTER BEASTARIUM &amp; MINI-PET ]
              </span>
            </div>
            <button
              onClick={onClose}
              className="text-white/60 hover:text-white p-1 rounded-sm border border-transparent hover:border-white/20"
            >
              <X size={14} />
            </button>
          </div>

          <p className="text-[10px] text-white/80 mb-3 leading-relaxed">
            {language === 'ko'
              ? '보스 토벌 누적 처치 수로 해금되는 미니 도트 펫! 동행 펫을 설정하여 고유 패시브 탐험 버프를 활성화하세요.'
              : 'Unlock follow-pets by defeating chapter bosses! Equip your mini-pet for permanent exploration buffs.'}
          </p>

          {/* Monster List */}
          <div className="space-y-2 mb-4">
            {monsters.map(m => (
              <div
                key={m.id}
                onClick={() => handleSelectPet(m.id, m.isUnlocked)}
                className={`p-2.5 rounded-none border flex items-center justify-between transition-all cursor-pointer ${
                  m.isSelectedPet
                    ? 'bg-emerald-950/60 border-emerald-400 text-emerald-300'
                    : m.isUnlocked
                    ? 'bg-[#141212] border-white/20 hover:border-emerald-500/60 text-white'
                    : 'bg-[#141212]/50 border-white/10 opacity-50 cursor-not-allowed text-white/40'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{m.icon}</span>
                  <div>
                    <div className="text-xs font-bold flex items-center gap-1">
                      <span>{language === 'ko' ? m.nameKo : m.nameEn}</span>
                      {!m.isUnlocked && <Lock size={10} className="text-rose-400" />}
                    </div>
                    <div className="text-[9px] text-amber-300/90 font-mono mt-0.5">
                      {language === 'ko' ? m.buffKo : m.buffEn}
                    </div>
                  </div>
                </div>

                <div className="text-right text-[9px] font-bold">
                  {m.isSelectedPet ? (
                    <span className="text-emerald-400 flex items-center gap-0.5">
                      <Check size={12} /> [장착 중]
                    </span>
                  ) : m.isUnlocked ? (
                    <span className="text-white/60 hover:text-white">[장착하기]</span>
                  ) : (
                    <span className="text-rose-400">
                      {m.currentKills}/{m.requiredKills} 처치
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={onClose}
            className="w-full py-2 bg-[#fdfcfc] text-[#201d1d] hover:bg-emerald-300 transition-colors text-xs font-bold uppercase rounded-sm flex items-center justify-center gap-1.5"
          >
            <Sparkles size={13} />
            <span>{language === 'ko' ? '[ 도감 닫기 ]' : '[ Close Beastarium ]'}</span>
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
