import React, { useState, useEffect } from 'react';
import { Layers, Copy, Edit2, Check, X, Shield, Swords, Castle, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';
import { triggerHaptic } from '../lib/haptic';
import { isSfxMutedGlobal } from '../lib/sound';

export interface DeckPresetSwitcherProps {
  activePreset: number;
  onSwitchPreset: (presetNum: number) => void;
  onCopyPreset: (sourcePreset: number, targetPreset: number) => void;
  season: string;
  language: string;
  className?: string;
}

const DEFAULT_PRESET_METAS = [
  { num: 1, defaultName: 'PVP 공격', defaultIcon: '⚔️', tag: 'PVP ATTACK' },
  { num: 2, defaultName: 'PVP 방어', defaultIcon: '🛡️', tag: 'PVP DEFENSE' },
  { num: 3, defaultName: '타워 보스용', defaultIcon: '🏰', tag: 'TOWER BOSS' },
];

export const DeckPresetSwitcher: React.FC<DeckPresetSwitcherProps> = ({
  activePreset,
  onSwitchPreset,
  onCopyPreset,
  season,
  language,
  className,
}) => {
  const isKo = language === 'ko';

  // Preset names and icons from localStorage
  const [presetNames, setPresetNames] = useState<Record<number, string>>({});
  const [presetIcons, setPresetIcons] = useState<Record<number, string>>({});

  // Editing state
  const [editingPreset, setEditingPreset] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editIcon, setEditIcon] = useState('');

  // Copy modal state
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [copyTargetPreset, setCopyTargetPreset] = useState<number | null>(null);
  const [copySuccessMsg, setCopySuccessMsg] = useState<string | null>(null);

  const loadPresetMetas = () => {
    try {
      const names: Record<number, string> = {};
      const icons: Record<number, string> = {};
      DEFAULT_PRESET_METAS.forEach(({ num, defaultName, defaultIcon }) => {
        names[num] = localStorage.getItem(`hero_deck_preset_name_${num}_${season}`) || defaultName;
        icons[num] = localStorage.getItem(`hero_deck_preset_icon_${num}_${season}`) || defaultIcon;
      });
      setPresetNames(names);
      setPresetIcons(icons);
    } catch {}
  };

  useEffect(() => {
    loadPresetMetas();
  }, [season]);

  const handleStartEdit = (e: React.MouseEvent, num: number) => {
    e.stopPropagation();
    setEditingPreset(num);
    setEditName(presetNames[num] || DEFAULT_PRESET_METAS[num - 1].defaultName);
    setEditIcon(presetIcons[num] || DEFAULT_PRESET_METAS[num - 1].defaultIcon);
    triggerHaptic('light');
  };

  const handleSaveEdit = () => {
    if (editingPreset === null) return;
    const finalName = editName.trim().slice(0, 10) || DEFAULT_PRESET_METAS[editingPreset - 1].defaultName;
    const finalIcon = editIcon || DEFAULT_PRESET_METAS[editingPreset - 1].defaultIcon;

    try {
      localStorage.setItem(`hero_deck_preset_name_${editingPreset}_${season}`, finalName);
      localStorage.setItem(`hero_deck_preset_icon_${editingPreset}_${season}`, finalIcon);
    } catch {}

    setPresetNames(prev => ({ ...prev, [editingPreset]: finalName }));
    setPresetIcons(prev => ({ ...prev, [editingPreset]: finalIcon }));
    setEditingPreset(null);
    triggerHaptic('success');
  };

  const handleExecuteCopy = (target: number) => {
    onCopyPreset(activePreset, target);
    setCopyTargetPreset(null);
    setShowCopyModal(false);
    triggerHaptic('heavy');
    setCopySuccessMsg(isKo ? `덱 ${activePreset} ➔ 덱 ${target} 복사 완료!` : `Copied Deck ${activePreset} to Deck ${target}!`);
    setTimeout(() => setCopySuccessMsg(null), 2500);
  };

  return (
    <div className={cn("w-full bg-[#141212] border border-[#201d1d]/40 rounded-xl p-2.5 font-mono shadow-md", className)}>
      {/* Header bar: Title & Copy Deck Button */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
        <div className="flex items-center gap-1.5">
          <Layers size={14} className="text-amber-400" />
          <span className="text-xs font-black uppercase text-amber-300 tracking-wider">
            {isKo ? '3구 덱 프리셋' : 'DECK PRESETS'}
          </span>
          <span className="text-[10px] text-slate-400 hidden sm:inline">
            ({isKo ? '원터치 덱 전환' : '1-Tap Switcher'})
          </span>
        </div>

        <button
          type="button"
          onClick={() => {
            setShowCopyModal(true);
            triggerHaptic('light');
          }}
          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-white/10 rounded-md text-[10px] font-bold flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
          title={isKo ? '현재 활성 덱을 다른 슬롯에 복사' : 'Copy Active Deck'}
        >
          <Copy size={11} className="text-indigo-400" />
          <span>{isKo ? '덱 복사' : 'Copy Deck'}</span>
        </button>
      </div>

      {/* 3-Slot Preset Switcher Row */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
        {DEFAULT_PRESET_METAS.map(({ num, tag }) => {
          const isActive = activePreset === num;
          const name = presetNames[num] || DEFAULT_PRESET_METAS[num - 1].defaultName;
          const icon = presetIcons[num] || DEFAULT_PRESET_METAS[num - 1].defaultIcon;

          return (
            <div
              key={num}
              onClick={() => {
                if (!isActive) {
                  onSwitchPreset(num);
                  triggerHaptic('medium');
                }
              }}
              className={cn(
                "relative flex flex-col items-center justify-between p-2 rounded-lg border transition-all cursor-pointer select-none",
                isActive
                  ? "bg-amber-400/10 border-amber-400 text-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.25)] ring-1 ring-amber-400"
                  : "bg-slate-900/80 border-slate-800 text-slate-400 hover:bg-slate-850 hover:text-slate-200 hover:border-slate-700"
              )}
            >
              {/* Active Indicator & Tag */}
              <div className="w-full flex items-center justify-between text-[9px] font-black tracking-widest uppercase mb-1">
                <span className={isActive ? "text-amber-400 font-black" : "text-slate-500"}>
                  {`#0${num}`}
                </span>
                {isActive && (
                  <span className="flex items-center gap-1 text-emerald-400 text-[9px] font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {isKo ? '사용중' : 'ACTIVE'}
                  </span>
                )}
              </div>

              {/* Icon & Name */}
              <div className="flex items-center gap-1.5 my-0.5">
                <span className="text-base sm:text-lg leading-none">{icon}</span>
                <span className="text-xs font-black truncate max-w-[70px] sm:max-w-[90px]">
                  {name}
                </span>
              </div>

              {/* Bottom Tag & Edit Button */}
              <div className="w-full flex items-center justify-between mt-1 pt-1 border-t border-white/5">
                <span className="text-[8px] text-slate-500 font-bold truncate">
                  {tag}
                </span>
                <button
                  type="button"
                  onClick={(e) => handleStartEdit(e, num)}
                  className="p-1 text-slate-500 hover:text-amber-300 transition-colors cursor-pointer"
                  title={isKo ? '이름 및 아이콘 편집' : 'Edit Name & Icon'}
                >
                  <Edit2 size={10} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Copy Success Toast Banner */}
      {copySuccessMsg && (
        <div className="mt-2 py-1 px-2.5 bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 text-[11px] font-bold rounded-lg flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
          <Check size={13} className="text-emerald-400 shrink-0" />
          <span>{copySuccessMsg}</span>
        </div>
      )}

      {/* Inline Edit Modal */}
      {editingPreset !== null && (
        <div className="fixed inset-0 z-[10020] bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#141212] border-2 border-amber-400 rounded-2xl p-4 shadow-2xl text-white font-mono space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="text-sm font-black text-amber-300 uppercase">
                {isKo ? `덱 #${editingPreset} 설정 편집` : `Edit Deck #${editingPreset}`}
              </span>
              <button
                type="button"
                onClick={() => setEditingPreset(null)}
                className="text-slate-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            {/* Icon Select */}
            <div>
              <label className="text-[11px] text-slate-400 font-bold block mb-1">
                {isKo ? '대표 아이콘 선택' : 'Preset Icon'}
              </label>
              <div className="flex flex-wrap gap-1.5">
                {['⚔️', '🛡️', '🏰', '🔥', '💧', '🌿', '⚡', '👑', '💀', '🎯'].map((ic) => (
                  <button
                    key={ic}
                    type="button"
                    onClick={() => setEditIcon(ic)}
                    className={cn(
                      "w-9 h-9 rounded-lg text-lg flex items-center justify-center border transition-all cursor-pointer",
                      editIcon === ic ? "bg-amber-400/20 border-amber-400 scale-105" : "bg-slate-800 border-slate-700 hover:bg-slate-700"
                    )}
                  >
                    {ic}
                  </button>
                ))}
              </div>
            </div>

            {/* Name Input */}
            <div>
              <label className="text-[11px] text-slate-400 font-bold block mb-1">
                {isKo ? '덱 이름 (최대 10자)' : 'Deck Name (Max 10 chars)'}
              </label>
              <input
                type="text"
                maxLength={10}
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder={DEFAULT_PRESET_METAS[editingPreset - 1].defaultName}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:border-amber-400 focus:outline-hidden"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingPreset(null)}
                className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold text-slate-300"
              >
                {isKo ? '취소' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="flex-1 py-2 bg-amber-400 hover:bg-amber-300 text-black rounded-lg text-xs font-black uppercase tracking-wider"
              >
                {isKo ? '저장 완료' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Copy Preset Modal */}
      {showCopyModal && (
        <div className="fixed inset-0 z-[10020] bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#141212] border-2 border-indigo-500 rounded-2xl p-4 shadow-2xl text-white font-mono space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="text-sm font-black text-indigo-300 uppercase flex items-center gap-1.5">
                <Copy size={16} />
                {isKo ? `현재 덱(덱 #${activePreset}) 복사하기` : `Copy Current Deck (#${activePreset})`}
              </span>
              <button
                type="button"
                onClick={() => setShowCopyModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {isKo
                ? `현재 활성화된 덱 #${activePreset}의 5장 카드 구성을 어느 슬롯에 덮어쓰시겠습니까?`
                : `Select target preset to overwrite with current Deck #${activePreset} configuration:`}
            </p>

            {/* Target Selection Buttons */}
            <div className="space-y-2">
              {[1, 2, 3].map((targetNum) => {
                if (targetNum === activePreset) return null;
                const targetName = presetNames[targetNum] || DEFAULT_PRESET_METAS[targetNum - 1].defaultName;
                const targetIcon = presetIcons[targetNum] || DEFAULT_PRESET_METAS[targetNum - 1].defaultIcon;

                return (
                  <button
                    key={targetNum}
                    type="button"
                    onClick={() => handleExecuteCopy(targetNum)}
                    className="w-full py-2.5 px-3 bg-slate-900 hover:bg-indigo-950/80 border border-slate-700 hover:border-indigo-400 rounded-xl text-left flex items-center justify-between group transition-all cursor-pointer active:scale-98"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{targetIcon}</span>
                      <div>
                        <div className="text-xs font-bold text-white group-hover:text-indigo-300">
                          {`덱 #${targetNum}: ${targetName}`}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {isKo ? '기존 카드를 현재 덱으로 덮어씀' : 'Overwrite with current deck'}
                        </div>
                      </div>
                    </div>
                    <Copy size={14} className="text-slate-500 group-hover:text-indigo-400" />
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setShowCopyModal(false)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold text-slate-300 mt-2"
            >
              {isKo ? '닫기' : 'Close'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
