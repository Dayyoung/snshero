import React from 'react';
import { TacticalStance, Language } from '../types';

interface BattleStanceBarProps {
  currentStance: TacticalStance;
  onStanceChange: (stance: TacticalStance) => void;
  onOpenGambitModal: () => void;
  language?: Language;
}

export const BattleStanceBar: React.FC<BattleStanceBarProps> = ({
  currentStance,
  onStanceChange,
  onOpenGambitModal,
  language = 'ko',
}) => {
  const isKo = language === 'ko';
  const stances: { id: TacticalStance; label: string; icon: string; desc: string; detail: string }[] = [
    { 
      id: 'attack', 
      label: isKo ? '공격형' : 'Attack', 
      icon: '⚔️', 
      desc: isKo ? '뒤집기 가중치 1.6x & 중앙 돌파' : 'Capture Weight 1.6x & Center Push',
      detail: isKo ? '공격형: 상대 카드 캡처 가중치 1.6x 및 취약 슬롯 우선 추천' : 'Aggressive: 1.6x capture weight & focus on vulnerable enemy slots'
    },
    { 
      id: 'defense', 
      label: isKo ? '방어형' : 'Defense', 
      icon: '🛡️', 
      desc: isKo ? '모서리 선점 & 노출 방어 2.5x' : 'Corner Guard & Exposure Def 2.5x',
      detail: isKo ? '방어형: 모서리 선점 & 취약 노출 방어 2.5x 우선 추천' : 'Defensive: Corner lock & 2.5x defensive exposure avoidance'
    },
    { 
      id: 'balanced', 
      label: isKo ? '밸런스' : 'Balanced', 
      icon: '⚖️', 
      desc: isKo ? '스탠다드 전술 Heuristics' : 'Standard Balanced Heuristics',
      detail: isKo ? '밸런스: 공격과 방어 균형 최적 시뮬레이션 유지' : 'Balanced: Standard optimal simulation balancing offense & defense'
    },
  ];

  const activeStanceObj = stances.find(s => s.id === currentStance) || stances[2];

  return (
    <div className="w-full flex flex-col gap-1 p-2 bg-[#fdfcfc] border border-black/15 rounded-sm font-mono text-xs shadow-xs">
      <div className="w-full flex items-center justify-between gap-1.5 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] text-gray-500 font-bold uppercase hidden sm:inline">[TACTICS]</span>
          <div className="flex items-center gap-1">
            {stances.map(s => {
              const isActive = currentStance === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => onStanceChange(s.id)}
                  title={s.desc}
                  className={`min-h-[32px] px-2.5 py-1 flex items-center gap-1.5 font-bold text-[11px] rounded-sm transition-all cursor-pointer ${
                    isActive
                      ? 'bg-slate-900 text-white border-2 border-indigo-500 ring-2 ring-indigo-500/40 shadow-[0_0_12px_rgba(99,102,241,0.35)] scale-[1.02]'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-black/15'
                  }`}
                >
                  <span className="text-xs">{s.icon}</span>
                  <span className="tracking-tight">{s.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Gambit Customization Button (Item 393) */}
        <button
          onClick={onOpenGambitModal}
          className="min-h-[32px] px-2 py-1 bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 rounded-sm font-bold text-[11px] flex items-center gap-1 transition-all cursor-pointer"
          title={isKo ? "전술 지침(Gambit) AI 커스터마이징" : "Tactical Gambit Customization"}
        >
          <span>⚙️</span>
          <span className="hidden sm:inline">{isKo ? "전술 갬빗" : "Gambits"}</span>
          <span className="sm:hidden">{isKo ? "지침" : "AI"}</span>
        </button>
      </div>

      {/* Active Tactical Impact Badge/Tooltip (Row 12) */}
      <div className="w-full px-2 py-1 bg-indigo-50/80 border border-indigo-200/80 rounded-xs flex items-center gap-1.5 text-[10px] font-semibold text-indigo-950">
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse shrink-0" />
        <span className="truncate">{activeStanceObj.detail}</span>
      </div>
    </div>
  );
};

