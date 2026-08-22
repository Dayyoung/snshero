import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Flame, 
  Waves, 
  Wind, 
  Mountain, 
  User, 
  Skull, 
  Sparkles, 
  HelpCircle, 
  ChevronRight, 
  Info,
  Shield,
  Zap,
  Leaf,
  Hammer,
  Bot,
  Ghost
} from 'lucide-react';
import { Language } from '../types';
import { FACTION_MATCHUP, getFactionMultiplier, ADVANTAGE_THRESHOLD, DISADVANTAGE_THRESHOLD } from '../lib/battleSynergy';

interface ElementAdvantageModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  lowSpecMode?: boolean;
}

type TabType = 'circle' | 'tester' | 'tiles';

export const ElementAdvantageModal: React.FC<ElementAdvantageModalProps> = ({
  isOpen,
  onClose,
  language,
  lowSpecMode = false,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('circle');
  const [selectedAttacker, setSelectedAttacker] = useState<string>('water');
  const [selectedDefender, setSelectedDefender] = useState<string>('fire');

  const isKo = language === 'ko';

  if (!isOpen) return null;

  const elements = [
    { key: 'water', nameKo: '물 (Water)', nameEn: 'Water (물)', icon: Waves, color: 'text-cyan-400', bg: 'bg-cyan-950/60', border: 'border-cyan-500/50', beats: 'fire', weakTo: 'earth' },
    { key: 'fire', nameKo: '불 (Fire)', nameEn: 'Fire (불)', icon: Flame, color: 'text-red-400', bg: 'bg-red-950/60', border: 'border-red-500/50', beats: 'wind', weakTo: 'water' },
    { key: 'wind', nameKo: '바람 (Wind)', nameEn: 'Wind (바람)', icon: Wind, color: 'text-emerald-400', bg: 'bg-emerald-950/60', border: 'border-emerald-500/50', beats: 'earth', weakTo: 'fire' },
    { key: 'earth', nameKo: '대지 (Earth)', nameEn: 'Earth (대지)', icon: Mountain, color: 'text-amber-400', bg: 'bg-amber-950/60', border: 'border-amber-500/50', beats: 'water', weakTo: 'wind' },
  ];

  const factions = [
    { key: 'human', nameKo: '인간', nameEn: 'Human', icon: User, color: 'text-sky-400', beats: 'undead' },
    { key: 'undead', nameKo: '언데드', nameEn: 'Undead', icon: Skull, color: 'text-purple-400', beats: 'elf' },
    { key: 'elf', nameKo: '엘프', nameEn: 'Elf', icon: Leaf, color: 'text-green-400', beats: 'dwarf' },
    { key: 'dwarf', nameKo: '드워프', nameEn: 'Dwarf', icon: Hammer, color: 'text-zinc-300', beats: 'robot' },
    { key: 'robot', nameKo: '로봇', nameEn: 'Robot', icon: Bot, color: 'text-slate-300', beats: 'dragon' },
    { key: 'dragon', nameKo: '드래곤', nameEn: 'Dragon', icon: Zap, color: 'text-rose-400', beats: 'dwarf' },
    { key: 'monster', nameKo: '몬스터', nameEn: 'Monster', icon: Ghost, color: 'text-orange-400', beats: 'robot' },
  ];

  const allTypes = [...elements, ...factions];

  const currentMultiplier = getFactionMultiplier(selectedAttacker, selectedDefender);
  const isAdvantage = currentMultiplier >= ADVANTAGE_THRESHOLD;
  const isDisadvantage = currentMultiplier <= DISADVANTAGE_THRESHOLD;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm select-none font-mono pointer-events-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ duration: lowSpecMode ? 0.05 : 0.18 }}
          className="w-full max-w-lg bg-[#141824] border border-slate-700/80 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90dvh]"
        >
          {/* Header */}
          <div className="px-4 py-3 bg-[#0d111d] border-b border-slate-700/80 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-950/80 border border-indigo-500/50 flex items-center justify-center text-indigo-400">
                <Sparkles size={16} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                  <span>{isKo ? '속성 상성 퀵 가이드' : 'Element Advantage Guide'}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-900/60 border border-indigo-500/40 text-indigo-300 font-normal">
                    {isKo ? '인게임 참조' : 'In-Game Reference'}
                  </span>
                </h2>
                <p className="text-[11px] text-slate-400">
                  {isKo ? '전투 중 카드 캡처 및 스탯 보정 상성표' : 'Combat capture multipliers & bonus stats'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title={isKo ? '닫기' : 'Close'}
            >
              <X size={18} />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="grid grid-cols-3 bg-[#0a0e18] border-b border-slate-800 p-1 gap-1 shrink-0 text-xs">
            <button
              onClick={() => setActiveTab('circle')}
              className={`py-1.5 px-2 rounded-lg font-medium text-center transition-all cursor-pointer ${
                activeTab === 'circle'
                  ? 'bg-indigo-600 text-white shadow-xs font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              {isKo ? '4대 원소 순환' : '4-Element Cycle'}
            </button>
            <button
              onClick={() => setActiveTab('tester')}
              className={`py-1.5 px-2 rounded-lg font-medium text-center transition-all cursor-pointer ${
                activeTab === 'tester'
                  ? 'bg-indigo-600 text-white shadow-xs font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              {isKo ? '실시간 상성 계산기' : 'Matchup Tester'}
            </button>
            <button
              onClick={() => setActiveTab('tiles')}
              className={`py-1.5 px-2 rounded-lg font-medium text-center transition-all cursor-pointer ${
                activeTab === 'tiles'
                  ? 'bg-indigo-600 text-white shadow-xs font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              {isKo ? '지형 & 시너지 룰' : 'Tiles & Synergy'}
            </button>
          </div>

          {/* Body Content */}
          <div className="p-4 overflow-y-auto space-y-4 text-xs text-slate-300">
            {activeTab === 'circle' && (
              <div className="space-y-4">
                {/* 4 Elements Circular Diagram */}
                <div className="p-3 bg-[#0d1220] border border-slate-800 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Zap size={13} className="text-amber-400" />
                      {isKo ? '주요 4원소 상성 순환고리' : '4 Core Elemental Cycle'}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 font-bold">
                      {isKo ? '우위 시: +15% / +2 PWR' : 'Advantage: +15% / +2 PWR'}
                    </span>
                  </div>

                  {/* Flow Diagram Cards */}
                  <div className="grid grid-cols-2 gap-2">
                    {elements.map((elem) => {
                      const IconComp = elem.icon;
                      const beatTarget = elements.find(e => e.key === elem.beats);
                      return (
                        <div
                          key={elem.key}
                          className={`p-2.5 rounded-lg border ${elem.border} ${elem.bg} flex flex-col justify-between space-y-1.5`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <IconComp size={16} className={elem.color} />
                              <span className={`font-bold ${elem.color}`}>
                                {isKo ? elem.nameKo : elem.nameEn}
                              </span>
                            </div>
                            <span className="text-[10px] bg-slate-900/80 px-1 rounded text-slate-300">
                              PWR+
                            </span>
                          </div>

                          <div className="text-[11px] flex items-center justify-between text-slate-300 pt-1 border-t border-slate-800/80">
                            <span className="text-emerald-400 flex items-center gap-0.5 font-bold">
                              <span>우위</span>
                              <ChevronRight size={12} />
                              <span>{beatTarget ? (isKo ? beatTarget.nameKo.split(' ')[0] : beatTarget.nameEn.split(' ')[0]) : ''}</span>
                            </span>
                            <span className="text-[10px] text-amber-300 font-mono">+15%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Summary cycle badge */}
                  <div className="p-2 bg-slate-900/90 border border-slate-800 rounded-lg text-[11px] text-center text-slate-300 font-mono leading-relaxed">
                    <span className="text-cyan-400 font-bold">💧 물</span>
                    <span className="text-slate-500 mx-1">──▶</span>
                    <span className="text-red-400 font-bold">🔥 불</span>
                    <span className="text-slate-500 mx-1">──▶</span>
                    <span className="text-emerald-400 font-bold">🌪️ 바람</span>
                    <span className="text-slate-500 mx-1">──▶</span>
                    <span className="text-amber-400 font-bold">🌱 대지</span>
                    <span className="text-slate-500 mx-1">──▶</span>
                    <span className="text-cyan-400 font-bold">💧 물</span>
                  </div>
                </div>

                {/* Sub Factions List */}
                <div className="p-3 bg-[#0d1220] border border-slate-800 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Shield size={13} className="text-indigo-400" />
                      {isKo ? '종족 / 군단 세력 상성 (+10%)' : 'Faction Matchup (+10%)'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px]">
                    <div className="p-2 bg-slate-900/60 border border-slate-800 rounded flex items-center justify-between">
                      <span className="text-sky-300 font-bold">👤 인간 ──▶ 💀 언데드</span>
                      <span className="text-emerald-400 font-mono">+10%</span>
                    </div>
                    <div className="p-2 bg-slate-900/60 border border-slate-800 rounded flex items-center justify-between">
                      <span className="text-purple-300 font-bold">💀 언데드 ──▶ 🧝 엘프</span>
                      <span className="text-emerald-400 font-mono">+10%</span>
                    </div>
                    <div className="p-2 bg-slate-900/60 border border-slate-800 rounded flex items-center justify-between">
                      <span className="text-green-300 font-bold">🧝 엘프 ──▶ 🔨 드워프</span>
                      <span className="text-emerald-400 font-mono">+10%</span>
                    </div>
                    <div className="p-2 bg-slate-900/60 border border-slate-800 rounded flex items-center justify-between">
                      <span className="text-zinc-300 font-bold">🔨 드워프 ──▶ 🤖 로봇</span>
                      <span className="text-emerald-400 font-mono">+10%</span>
                    </div>
                    <div className="p-2 bg-slate-900/60 border border-slate-800 rounded flex items-center justify-between">
                      <span className="text-slate-300 font-bold">🤖 로봇 ──▶ 🐉 드래곤</span>
                      <span className="text-emerald-400 font-mono">+10%</span>
                    </div>
                    <div className="p-2 bg-slate-900/60 border border-slate-800 rounded flex items-center justify-between">
                      <span className="text-orange-300 font-bold">👾 몬스터 ──▶ 🤖 로봇</span>
                      <span className="text-emerald-400 font-mono">+10%</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'tester' && (
              <div className="space-y-4">
                <div className="p-3 bg-[#0d1220] border border-slate-800 rounded-xl space-y-3">
                  <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Info size={13} className="text-indigo-400" />
                    {isKo ? '공격 카드 속성 vs 방어 카드 속성 선택' : 'Select Attacker vs Defender Elements'}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Attacker Selector */}
                    <div>
                      <label className="text-[10px] text-indigo-300 font-bold block mb-1.5">
                        {isKo ? '내 카드 (공격 측)' : 'Attacker (My Card)'}
                      </label>
                      <select
                        value={selectedAttacker}
                        onChange={(e) => setSelectedAttacker(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-2 text-xs focus:outline-hidden focus:border-indigo-500 cursor-pointer"
                      >
                        {allTypes.map(t => (
                          <option key={t.key} value={t.key}>
                            {isKo ? t.nameKo : t.nameEn}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Defender Selector */}
                    <div>
                      <label className="text-[10px] text-rose-300 font-bold block mb-1.5">
                        {isKo ? '상대 카드 (수비 측)' : 'Defender (Target)'}
                      </label>
                      <select
                        value={selectedDefender}
                        onChange={(e) => setSelectedDefender(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-2 text-xs focus:outline-hidden focus:border-rose-500 cursor-pointer"
                      >
                        {allTypes.map(t => (
                          <option key={t.key} value={t.key}>
                            {isKo ? t.nameKo : t.nameEn}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Realtime Result Card */}
                  <div className={`p-3 rounded-lg border flex flex-col items-center justify-center text-center space-y-1.5 ${
                    isAdvantage 
                      ? 'bg-emerald-950/40 border-emerald-500/60' 
                      : isDisadvantage 
                        ? 'bg-rose-950/40 border-rose-500/60' 
                        : 'bg-slate-900/60 border-slate-800'
                  }`}>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-100 uppercase">{selectedAttacker}</span>
                      <span className="text-slate-500">VS</span>
                      <span className="text-sm font-bold text-slate-100 uppercase">{selectedDefender}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-base font-black px-2 py-0.5 rounded ${
                        isAdvantage 
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/50' 
                          : isDisadvantage 
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-400/50' 
                            : 'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}>
                        {isAdvantage ? (isKo ? '🔥 상성 우위 (ADVANTAGE)' : '🔥 ADVANTAGE') :
                         isDisadvantage ? (isKo ? '⚠️ 상성 열세 (DISADVANTAGE)' : '⚠️ DISADVANTAGE') :
                         (isKo ? '⚖️ 대등 (NEUTRAL)' : '⚖️ NEUTRAL')}
                      </span>
                      <span className="text-sm font-mono font-bold text-amber-300">
                        x{currentMultiplier.toFixed(2)}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-300 mt-1 max-w-sm">
                      {isAdvantage ? (
                        isKo 
                          ? '공격 시 최종 전투력 +15% 증가 및 원소 증폭 콤보(+2 PWR)가 적용되어 상대 카드를 손쉽게 캡처합니다!' 
                          : 'Attacking multiplier increased by +15% with +2 PWR Amplified Strike for easy card capture!'
                      ) : isDisadvantage ? (
                        isKo 
                          ? '상대 속성에 억제되어 전투력이 10~15% 감소합니다. 높은 기본 스탯이나 원소 공명(+1) 배치를 활용하세요.' 
                          : 'Suppressed by opposing element, reducing effective combat power by 10-15%. Use resonance or high base stats.'
                      ) : (
                        isKo 
                          ? '속성 상성 가감이 없는 중립 관계입니다. 기본 스탯 수치와 동일/합 룰(SAME/PLUS)로 승부하세요.' 
                          : 'Neutral relationship with no elemental modifier. Rely on directional stats, SAME, and PLUS rules.'
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'tiles' && (
              <div className="space-y-4">
                {/* Tile Bonus Rule */}
                <div className="p-3 bg-[#0d1220] border border-slate-800 rounded-xl space-y-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-300 uppercase">
                    <Sparkles size={14} />
                    {isKo ? '속성 타일 보너스 (+2 PWR)' : 'Elemental Tile Bonus (+2 PWR)'}
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {isKo 
                      ? '3x3 전장에 배치된 속성 타일(물/불/바람/대지 등)과 일치하는 카드를 놓으면, 해당 카드의 상/우/하/좌 4방향 스탯이 모두 +2 증가합니다!' 
                      : 'Placing a card on a matching elemental tile (Water/Fire/Wind/Earth) grants a massive +2 bonus to all 4 directional stats!'}
                  </p>
                  <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                    <div className="p-1.5 bg-cyan-950/40 border border-cyan-500/30 rounded text-cyan-300 font-bold flex items-center gap-1">
                      <Waves size={12} /> <span>물 타일: 물 카드 +2 PWR</span>
                    </div>
                    <div className="p-1.5 bg-red-950/40 border border-red-500/30 rounded text-red-300 font-bold flex items-center gap-1">
                      <Flame size={12} /> <span>불 타일: 불 카드 +2 PWR</span>
                    </div>
                    <div className="p-1.5 bg-emerald-950/40 border border-emerald-500/30 rounded text-emerald-300 font-bold flex items-center gap-1">
                      <Wind size={12} /> <span>바람 타일: 바람 카드 +2 PWR</span>
                    </div>
                    <div className="p-1.5 bg-amber-950/40 border border-amber-500/30 rounded text-amber-300 font-bold flex items-center gap-1">
                      <Mountain size={12} /> <span>대지 타일: 대지 카드 +2 PWR</span>
                    </div>
                  </div>
                </div>

                {/* Ally Resonance Rule */}
                <div className="p-3 bg-[#0d1220] border border-slate-800 rounded-xl space-y-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-cyan-300 uppercase">
                    <Zap size={14} />
                    {isKo ? '아군 속성 공명 (Resonance +1)' : 'Ally Elemental Resonance (+1)'}
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {isKo 
                      ? '이미 전장에 놓인 아군 카드와 동일한 속성의 카드를 바로 옆에 배치하면 원소 공명(Resonance)이 발동하여 스탯 +1 보너스를 추가 획득합니다.' 
                      : 'Placing a card adjacent to an existing ally card with the same element triggers Elemental Resonance (+1 Stat Boost).'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 bg-[#0d111d] border-t border-slate-700/80 flex items-center justify-between shrink-0">
            <span className="text-[11px] text-slate-400">
              {isKo ? '💡 팁: 상성 우위 활용 시 역전 캡처가 가능합니다' : '💡 Tip: Exploit elemental advantage for decisive captures'}
            </span>
            <button
              onClick={onClose}
              className="px-3.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-md"
            >
              {isKo ? '확인 (닫기)' : 'Close'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
