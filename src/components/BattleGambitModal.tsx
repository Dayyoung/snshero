import React, { useState, useEffect } from 'react';
import { GambitConfig, GambitPriorityType, TacticalStance, Language } from '../types';

interface BattleGambitModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: GambitConfig;
  onSaveConfig: (newConfig: GambitConfig) => void;
  language?: Language;
  isAutoBattle?: boolean;
  onToggleAutoBattle?: () => void;
}

export const BattleGambitModal: React.FC<BattleGambitModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  language = 'ko',
  isAutoBattle,
  onToggleAutoBattle,
}) => {
  const isKo = language === 'ko';
  const [slots, setSlots] = useState<[GambitPriorityType, GambitPriorityType, GambitPriorityType]>(config.slots);
  const [activeStance, setActiveStance] = useState<TacticalStance>(config.activeStance);
  const [autoDisassembleNR, setAutoDisassembleNR] = useState<boolean>(config.autoDisassembleNR);

  useEffect(() => {
    if (isOpen) {
      setSlots(config.slots);
      setActiveStance(config.activeStance);
      setAutoDisassembleNR(config.autoDisassembleNR);
    }
  }, [isOpen, config]);

  if (!isOpen) return null;

  const gambitOptions: { type: GambitPriorityType; label: string; desc: string; icon: string }[] = [
    {
      type: 'COUNTER_ELEMENT',
      label: isKo ? '속성 상성 카운터 우선' : 'Counter Element Priority',
      desc: isKo ? '수>화>지>풍 상성 우위 타겟을 1순위로 탐색하여 캡처 가산점을 부여합니다.' : 'Prioritize target with elemental advantage (Water>Fire>Earth>Wind).',
      icon: '🔥',
    },
    {
      type: 'SECURE_CORNERS',
      label: isKo ? '모서리 요충지 선점' : 'Secure Corner Slots',
      desc: isKo ? '뒤집히기 어려운 4개 모서리(0,2,6,8) 슬롯을 먼저 방어하여 안전 지대를 구축합니다.' : 'Prioritize corners (0,2,6,8) to secure strong defenses.',
      icon: '🛡️',
    },
    {
      type: 'PRESERVE_ACE',
      label: isKo ? '에이스(전설) 후반 보존' : 'Preserve Ace Cards',
      desc: isKo ? '고파워 에이스 카드를 초반에 낭비하지 않고 중후반 결정타 순간까지 아낍니다.' : 'Hold high-power legendary cards for crucial late-game turns.',
      icon: '👑',
    },
    {
      type: 'SNIPE_HIGH_VALUE',
      label: isKo ? '적 고가치 영웅 저격' : 'Snipe High-Value Target',
      desc: isKo ? '적의 고파워/버프/전설 카드를 최우선 타겟으로 식별하여 즉시 뒤집습니다.' : 'Target high power, buffer, and legendary enemy cards first.',
      icon: '🎯',
    },
    {
      type: 'INTERCEPT_SYNERGY',
      label: isKo ? '적 연계/중앙 선점 차단' : 'Intercept Enemy Synergies',
      desc: isKo ? '적의 속성 시너지 정렬 및 중앙(4) 버프 타일 배치를 사전에 방해합니다.' : 'Block enemy center line-ups and elemental synergy bonuses.',
      icon: '⚡',
    },
  ];

  const stanceOptions: { id: TacticalStance; label: string; icon: string; desc: string; details: string }[] = [
    { 
      id: 'attack', 
      label: isKo ? '공격형 AI 모델' : 'Aggressive Model', 
      icon: '⚔️', 
      desc: isKo ? '뒤집기 가중치 1.6x & 중앙 돌파' : '1.6x Flip Weight & Breakthrough',
      details: isKo ? '적극적으로 상대 카드를 뒤집고 취약 슬롯을 집중 공략합니다.' : 'Aggressively flips opponent cards and penetrates vulnerable board slots.'
    },
    { 
      id: 'defense', 
      label: isKo ? '방어형 AI 모델' : 'Defensive Model', 
      icon: '🛡️', 
      desc: isKo ? '모서리 선점 & 노출 방어 2.5x' : 'Corner Guard & 2.5x Safety',
      details: isKo ? '모서리와 방어 요충지를 먼저 선점해 상대방의 역전각을 원천 차단합니다.' : 'Secures corners and safe edges to minimize vulnerable card exposures.'
    },
    { 
      id: 'balanced', 
      label: isKo ? '밸런스 AI 모델' : 'Balanced Model', 
      icon: '⚖️', 
      desc: isKo ? '스탠다드 균형 Heuristics' : 'Optimal Standard Heuristics',
      details: isKo ? '공격과 방어의 밸런스를 유지하며 매 턴 가장 최적의 시뮬레이션을 수행합니다.' : 'Balances attack and defense dynamically with standard optimal heuristics.'
    },
  ];

  const handleSlotChange = (index: number, value: GambitPriorityType) => {
    const newSlots = [...slots] as [GambitPriorityType, GambitPriorityType, GambitPriorityType];
    newSlots[index] = value;
    setSlots(newSlots);
  };

  const handleSave = () => {
    onSaveConfig({
      slots,
      activeStance,
      autoDisassembleNR,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[350] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs font-mono select-none pointer-events-auto animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#fdfcfc] border-2 border-[#201d1d] rounded-none p-4 sm:p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-black/15 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">🤖</span>
            <div>
              <h2 className="text-sm sm:text-base font-black text-[#201d1d] uppercase tracking-wide">
                {isKo ? 'AI 전투 모델 및 전술 설정' : 'AI Battle Model & Tactics Settings'}
              </h2>
              <p className="text-[11px] text-gray-500 font-medium">
                {isKo ? '설정된 모델과 전술은 영구 저장되어 다음 전투에도 계속 적용됩니다.' : 'Saved settings persist automatically for all future battles.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-500 hover:text-black font-bold text-lg cursor-pointer active:scale-95"
            aria-label={isKo ? '닫기' : 'Close'}
          >
            [✕]
          </button>
        </div>

        {/* Auto Battle Quick Toggle (If provided) */}
        {onToggleAutoBattle !== undefined && (
          <div className="p-3 bg-amber-50/80 border border-amber-300 rounded-sm flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-base animate-pulse">⚡</span>
              <div>
                <div className="text-xs font-black text-amber-950">
                  {isKo ? 'AI 자동 전투 상태' : 'AI Auto-Battle Status'}
                </div>
                <div className="text-[10px] text-amber-800">
                  {isAutoBattle 
                    ? (isKo ? '자동 전투가 활성화되어 있습니다.' : 'Auto-battle is currently active.') 
                    : (isKo ? '자동 전투가 꺼져 있습니다 (수동 조작).' : 'Auto-battle is currently off.')}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onToggleAutoBattle}
              className={`min-h-[36px] px-3 py-1 rounded-sm text-xs font-bold transition-all cursor-pointer flex items-center gap-1 border shadow-xs active:scale-95 ${
                isAutoBattle
                  ? 'bg-amber-600 text-white border-amber-700 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                  : 'bg-white text-gray-700 border-black/20 hover:bg-gray-100'
              }`}
            >
              <span>{isAutoBattle ? '[ AUTO ON ]' : '[ MANUAL OFF ]'}</span>
            </button>
          </div>
        )}

        {/* Tactical Model Selection (Item 401) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider">
              {isKo ? '[1] AI 전투 모델 (전술 스탠스)' : '[1] AI Battle Model (Tactical Stance)'}
            </h3>
            <span className="text-[10px] text-indigo-700 font-bold bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
              {isKo ? '선택 시 다음 전투 기본값' : 'Applies to Next Battles'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {stanceOptions.map(st => {
              const isSelected = activeStance === st.id;
              return (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setActiveStance(st.id)}
                  className={`min-h-[48px] p-2.5 rounded-sm text-left border transition-all cursor-pointer flex flex-col justify-between gap-1 active:scale-95 ${
                    isSelected
                      ? 'bg-slate-900 text-white border-2 border-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.35)] ring-2 ring-indigo-500/30 scale-[1.01]'
                      : 'bg-white text-gray-700 border-black/15 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black flex items-center gap-1">
                      <span>{st.icon}</span>
                      <span>{st.label}</span>
                    </span>
                    {isSelected && <span className="text-[10px] text-indigo-400 font-black">[선택]</span>}
                  </div>
                  <div className={`text-[10px] font-medium leading-tight ${isSelected ? 'text-indigo-200' : 'text-gray-500'}`}>
                    {st.desc}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Model Description banner */}
          <div className="w-full p-2 bg-indigo-50 border border-indigo-200 rounded-sm text-[11px] text-indigo-950 flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0 animate-ping" />
            <span>{stanceOptions.find(s => s.id === activeStance)?.details}</span>
          </div>
        </div>

        {/* 3-Slot Priority Customization (Item 393) */}
        <div className="space-y-2.5 pt-2 border-t border-black/10">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider">
              {isKo ? '[2] 세부 전술 지침 (Gambit 3-슬롯 우선순위)' : '[2] Priority Gambits (3 Slots)'}
            </h3>
          </div>

          <div className="space-y-2">
            {[0, 1, 2].map(slotIdx => {
              const currentPriority = slots[slotIdx];
              const weightText = slotIdx === 0 
                ? (isKo ? '1순위 (최대 가중치)' : 'Slot #1 (Max Weight)') 
                : slotIdx === 1 
                ? (isKo ? '2순위 (중간 가중치)' : 'Slot #2 (Med Weight)') 
                : (isKo ? '3순위 (보조 가중치)' : 'Slot #3 (Sub Weight)');
              return (
                <div key={slotIdx} className="p-2.5 bg-white border border-black/15 rounded-sm space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-amber-800">
                      SLOT #{slotIdx + 1} : {weightText}
                    </span>
                  </div>
                  <select
                    value={currentPriority}
                    onChange={e => handleSlotChange(slotIdx, e.target.value as GambitPriorityType)}
                    className="w-full min-h-[40px] p-2 bg-[#fdfcfc] border border-black/20 rounded-sm text-xs font-mono font-bold focus:outline-none focus:border-black cursor-pointer"
                  >
                    {gambitOptions.map(opt => (
                      <option key={opt.type} value={opt.type}>
                        {opt.icon} {opt.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-gray-500 leading-tight">
                    {gambitOptions.find(o => o.type === currentPriority)?.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Item 405: Smart Auto-Disassemble Filter */}
        <div className="p-3 bg-amber-50/60 border border-amber-300/80 rounded-sm flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <span className="text-sm">♻️</span>
              <span className="text-xs font-bold text-amber-950">
                {isKo ? '자동 전투 파밍 중 N/R 카드 자동 분해' : 'Auto-Disassemble N/R Cards in Auto-Battle'}
              </span>
            </div>
            <p className="text-[10px] text-amber-800 leading-tight">
              {isKo ? '가방 가득 참 방지를 위해 일반(N/R) 카드를 즉시 골드 및 강화 가루로 환전합니다.' : 'Recycles normal N/R cards into Gold & Powder during farming.'}
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer min-h-[44px]">
            <input
              type="checkbox"
              checked={autoDisassembleNR}
              onChange={e => setAutoDisassembleNR(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#201d1d]"></div>
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-black/15">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-4 py-2 bg-white text-gray-700 border border-black/20 hover:bg-gray-100 rounded-sm text-xs font-bold cursor-pointer active:scale-95"
          >
            {isKo ? '취소' : 'Cancel'}
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="min-h-[44px] px-5 py-2 bg-[#201d1d] text-[#fdfcfc] hover:bg-black rounded-sm text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md active:scale-95"
          >
            <span>[✓]</span>
            <span>{isKo ? '설정 저장 및 모델 적용' : 'Save & Apply Model'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

