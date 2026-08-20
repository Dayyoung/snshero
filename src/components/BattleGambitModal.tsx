import React, { useState } from 'react';
import { GambitConfig, GambitPriorityType, TacticalStance } from '../types';

interface BattleGambitModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: GambitConfig;
  onSaveConfig: (newConfig: GambitConfig) => void;
}

const GAMBIT_OPTIONS: { type: GambitPriorityType; label: string; desc: string; icon: string }[] = [
  {
    type: 'COUNTER_ELEMENT',
    label: '속성 상성 카운터 우선',
    desc: '수>화>지>풍 상성 우위 타겟을 1순위로 탐색하여 캡처 가산점을 부여합니다.',
    icon: '🔥',
  },
  {
    type: 'SECURE_CORNERS',
    label: '모서리 요충지 선점',
    desc: '뒤집히기 어려운 4개 모서리(0,2,6,8) 슬롯을 먼저 방어하여 안전 지대를 구축합니다.',
    icon: '🛡️',
  },
  {
    type: 'PRESERVE_ACE',
    label: '에이스(전설) 후반 보존',
    desc: '고파워 에이스 카드를 초반에 낭비하지 않고 중후반 결정타 순간까지 아낍니다.',
    icon: '👑',
  },
  {
    type: 'SNIPE_HIGH_VALUE',
    label: '적 고가치 영웅 저격',
    desc: '적의 고파워/버프/전설 카드를 최우선 타겟으로 식별하여 즉시 뒤집습니다.',
    icon: '🎯',
  },
  {
    type: 'INTERCEPT_SYNERGY',
    label: '적 연계/중앙 선점 차단',
    desc: '적의 속성 시너지 정렬 및 중앙(4) 버프 타일 배치를 사전에 방해합니다.',
    icon: '⚡',
  },
];

export const BattleGambitModal: React.FC<BattleGambitModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
}) => {
  const [slots, setSlots] = useState<[GambitPriorityType, GambitPriorityType, GambitPriorityType]>(config.slots);
  const [activeStance, setActiveStance] = useState<TacticalStance>(config.activeStance);
  const [autoDisassembleNR, setAutoDisassembleNR] = useState<boolean>(config.autoDisassembleNR);

  if (!isOpen) return null;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-mono">
      <div className="w-full max-w-lg bg-[#fdfcfc] border border-[#201d1d] rounded-none p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-black/10 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚙️</span>
            <div>
              <h2 className="text-base font-bold text-[#201d1d] uppercase tracking-wide">
                전술 지침(Gambit) 튜닝 시스템
              </h2>
              <p className="text-xs text-gray-500">AI 자동전투의 판단 알고리즘 우선순위를 직접 조립합니다.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-500 hover:text-black font-bold text-lg"
          >
            [✕]
          </button>
        </div>

        {/* 3-Slot Priority Customization (Item 393) */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
            [AI 전술 우선순위 3-슬롯 구성]
          </h3>

          {[0, 1, 2].map(slotIdx => {
            const currentPriority = slots[slotIdx];
            const weightText = slotIdx === 0 ? '1순위 (최대 가중치)' : slotIdx === 1 ? '2순위 (중간 가중치)' : '3순위 (보조 가중치)';
            return (
              <div key={slotIdx} className="p-3 bg-white border border-black/15 rounded-sm space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-700">
                    SLOT #{slotIdx + 1} : {weightText}
                  </span>
                </div>
                <select
                  value={currentPriority}
                  onChange={e => handleSlotChange(slotIdx, e.target.value as GambitPriorityType)}
                  className="w-full min-h-[44px] p-2 bg-[#fdfcfc] border border-black/20 rounded-sm text-xs font-mono font-medium focus:outline-none focus:border-black"
                >
                  {GAMBIT_OPTIONS.map(opt => (
                    <option key={opt.type} value={opt.type}>
                      {opt.icon} {opt.label}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-gray-500 leading-tight">
                  {GAMBIT_OPTIONS.find(o => o.type === currentPriority)?.desc}
                </p>
              </div>
            );
          })}
        </div>

        {/* Tactical Stance Selector (Item 401) */}
        <div className="space-y-2 pt-2 border-t border-black/10">
          <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
            [기본 전술 스탠스]
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'attack', label: '공격형 (ATK)', icon: '⚔️', desc: '적극 캡처' },
              { id: 'defense', label: '방어형 (DEF)', icon: '🛡️', desc: '모서리 방어' },
              { id: 'balanced', label: '균형형 (BAL)', icon: '⚖️', desc: '상황 적응' },
            ].map(st => (
              <button
                key={st.id}
                type="button"
                onClick={() => setActiveStance(st.id as TacticalStance)}
                className={`min-h-[44px] p-2 rounded-sm text-xs font-bold flex flex-col items-center justify-center border transition-all ${
                  activeStance === st.id
                    ? 'bg-[#201d1d] text-[#fdfcfc] border-[#201d1d]'
                    : 'bg-white text-gray-700 border-black/15 hover:bg-gray-50'
                }`}
              >
                <span>{st.icon} {st.label}</span>
                <span className="text-[10px] opacity-80">{st.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Item 405: Smart Auto-Disassemble Filter */}
        <div className="p-3 bg-amber-50/60 border border-amber-300/80 rounded-sm flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <span className="text-sm">♻️</span>
              <span className="text-xs font-bold text-amber-950">자동 연속 파밍 중 N/R 등급 자동 분해</span>
            </div>
            <p className="text-[11px] text-amber-800 leading-tight">
              가방 용량 100% 도달 시 일반(N/R) 카드를 즉시 골드 및 강화 가루로 환전하여 파밍 중단을 방지합니다.
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
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-black/10">
          <button
            onClick={onClose}
            className="min-h-[44px] px-4 py-2 bg-white text-gray-700 border border-black/20 hover:bg-gray-100 rounded-sm text-xs font-bold"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            className="min-h-[44px] px-5 py-2 bg-[#201d1d] text-[#fdfcfc] hover:bg-black rounded-sm text-xs font-bold flex items-center gap-1.5"
          >
            <span>[✓]</span>
            <span>전술 지침 적용하기</span>
          </button>
        </div>
      </div>
    </div>
  );
};
