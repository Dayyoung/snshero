import React from 'react';
import { motion } from 'motion/react';
import { X, Sparkles, Wand2, Shield, Swords, Zap } from 'lucide-react';

interface AutoDeckBuilderSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyPreset: (presetType: 'balanced' | 'aggressive' | 'defensive' | 'speed') => void;
}

export const AutoDeckBuilderSheet: React.FC<AutoDeckBuilderSheetProps> = ({
  isOpen,
  onClose,
  onApplyPreset
}) => {
  if (!isOpen) return null;

  const presets = [
    {
      id: 'aggressive' as const,
      name: '극딜 공격형 (Attack Focus)',
      desc: '공격력 최우선 5장 자동 선별, 속전속결 클리어',
      icon: Swords,
      badge: '추천'
    },
    {
      id: 'defensive' as const,
      name: '철벽 방어형 (Defense Wall)',
      desc: '체력 및 방어력 최상위 카드 5장 편성',
      icon: Shield,
      badge: '안정'
    },
    {
      id: 'balanced' as const,
      name: '황금 밸런스형 (All-Rounder)',
      desc: '시너지 및 원소 상성 조화로운 표준 덱',
      icon: Wand2,
      badge: '기본'
    },
    {
      id: 'speed' as const,
      name: '민첩 치명타형 (Crit & Speed)',
      desc: '크리티컬 확률 및 선공권 극대화 덱',
      icon: Zap,
      badge: '특화'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px] flex items-end justify-center select-none font-mono">
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="w-full max-w-md bg-[#fdfcfc] border-t-2 border-[#201d1d] p-4 shadow-2xl space-y-3"
      >
        <div className="flex items-center justify-between border-b border-[rgba(15,0,0,0.12)] pb-2">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-amber-500" />
            <span className="text-xs font-black uppercase text-[#201d1d]">
              [AI 1-TAP AUTO DECK BUILDER]
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center border border-[rgba(15,0,0,0.12)] bg-white hover:bg-zinc-100 rounded-sm cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>

        <p className="text-[11px] text-[#504a4a]">
          보유 중인 카드를 인공지능이 분석하여 최적의 5장 조합을 원터치로 편성합니다.
        </p>

        <div className="space-y-2">
          {presets.map((preset) => {
            const Icon = preset.icon;
            return (
              <button
                key={preset.id}
                onClick={() => {
                  onApplyPreset(preset.id);
                  onClose();
                }}
                className="w-full p-2.5 bg-white border border-[rgba(15,0,0,0.12)] hover:border-[#201d1d] hover:bg-zinc-50 rounded-sm flex items-center justify-between text-left transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-zinc-100 rounded-sm flex items-center justify-center text-[#201d1d]">
                    <Icon size={16} />
                  </div>
                  <div>
                    <div className="text-xs font-black text-[#201d1d] flex items-center gap-1.5">
                      <span>{preset.name}</span>
                      <span className="px-1.5 py-0.2 bg-zinc-200 text-[#201d1d] text-[9px] rounded-xs font-normal">
                        {preset.badge}
                      </span>
                    </div>
                    <div className="text-[10px] text-[#504a4a]">
                      {preset.desc}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};
