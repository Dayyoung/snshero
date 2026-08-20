import React from 'react';
import { TacticalStance } from '../types';

interface BattleStanceBarProps {
  currentStance: TacticalStance;
  onStanceChange: (stance: TacticalStance) => void;
  onOpenGambitModal: () => void;
}

export const BattleStanceBar: React.FC<BattleStanceBarProps> = ({
  currentStance,
  onStanceChange,
  onOpenGambitModal,
}) => {
  const stances: { id: TacticalStance; label: string; icon: string; desc: string }[] = [
    { id: 'attack', label: '공격', icon: '⚔️', desc: '뒤집기 가중치 1.6x & 중앙 돌파' },
    { id: 'defense', label: '방어', icon: '🛡️', desc: '모서리 선점 & 노출 방어 2.5x' },
    { id: 'balanced', label: '균형', icon: '⚖️', desc: '스탠다드 전술 Heuristics' },
  ];

  return (
    <div className="w-full flex items-center justify-between gap-1.5 p-1.5 bg-[#fdfcfc] border border-black/15 rounded-none font-mono text-xs">
      <div className="flex items-center gap-1">
        <span className="text-[10px] text-gray-500 font-bold uppercase hidden sm:inline">[STANCE]</span>
        <div className="flex items-center gap-1">
          {stances.map(s => {
            const isActive = currentStance === s.id;
            return (
              <button
                key={s.id}
                onClick={() => onStanceChange(s.id)}
                title={s.desc}
                className={`min-h-[32px] px-2 py-1 flex items-center gap-1 font-bold text-[11px] rounded-sm transition-all ${
                  isActive
                    ? 'bg-[#201d1d] text-[#fdfcfc] border border-[#201d1d]'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-black/10'
                }`}
              >
                <span>{s.icon}</span>
                <span>{s.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Gambit Customization Button (Item 393) */}
      <button
        onClick={onOpenGambitModal}
        className="min-h-[32px] px-2 py-1 bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 rounded-sm font-bold text-[11px] flex items-center gap-1 transition-all"
        title="전술 지침(Gambit) AI 커스터마이징"
      >
        <span>⚙️</span>
        <span className="hidden sm:inline">전술 갬빗</span>
        <span className="sm:hidden">지침</span>
      </button>
    </div>
  );
};
