import React, { useState, useEffect } from 'react';
import { Language } from '../types';
import { CARD_DATABASE } from '../cardDatabase';
import { triggerHaptic } from '../lib/haptic';

interface CraftingStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

export interface ElementEssenceInventory {
  FIRE: number;
  WATER: number;
  EARTH: number;
  WIND: number;
}

const ESSENCE_STORAGE_KEY = 'hero_element_essences';

export function getElementEssences(): ElementEssenceInventory {
  try {
    const raw = localStorage.getItem(ESSENCE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : { FIRE: 120, WATER: 95, EARTH: 80, WIND: 110 };
  } catch {
    return { FIRE: 120, WATER: 95, EARTH: 80, WIND: 110 };
  }
}

export function saveElementEssences(essences: ElementEssenceInventory): void {
  try {
    localStorage.setItem(ESSENCE_STORAGE_KEY, JSON.stringify(essences));
    window.dispatchEvent(new Event('snshero_essences_updated'));
  } catch {
    // ignore
  }
}

/**
 * ID 443: 속성 에센스 환급 및 카드 연성 제작소(Crafting Store) 모달
 */
export const CraftingStoreModal: React.FC<CraftingStoreModalProps> = ({
  isOpen,
  onClose,
  language,
}) => {
  const [essences, setEssences] = useState<ElementEssenceInventory>(getElementEssences());
  const [selectedTargetCardId, setSelectedTargetCardId] = useState<number>(1);
  const [craftFeedback, setCraftFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setEssences(getElementEssences());
      setCraftFeedback(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const targetCard = CARD_DATABASE[selectedTargetCardId] || CARD_DATABASE[1];
  const requiredElement = (targetCard.element || 'WATER') as keyof ElementEssenceInventory;
  const cost = 50; // 50 에센스 소모
  const currentCount = essences[requiredElement] || 0;
  const canCraft = currentCount >= cost;

  const handleCraft = () => {
    if (!canCraft) return;
    const next = {
      ...essences,
      [requiredElement]: currentCount - cost,
    };
    saveElementEssences(next);
    setEssences(next);

    // 카드 인벤토리 추가
    try {
      const invRaw = localStorage.getItem('hero_inventory');
      const inv = invRaw ? JSON.parse(invRaw) : {};
      inv[selectedTargetCardId] = {
        cardId: selectedTargetCardId,
        quantity: (inv[selectedTargetCardId]?.quantity || 0) + 1,
        level: 1,
      };
      localStorage.setItem('hero_inventory', JSON.stringify(inv));
      window.dispatchEvent(new Event('snshero_inventory_updated'));
    } catch {
      // ignore
    }

    triggerHaptic('victory');
    setCraftFeedback(language === 'ko' ? `★ [${targetCard.title}] 카드 제작 연성 성공!` : `Successfully forged [${targetCard.title_en || targetCard.title}]!`);
    setTimeout(() => setCraftFeedback(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 font-mono select-none">
      <div className="bg-[#fdfcfc] dark:bg-[#1a1717] border border-[#201d1d]/20 dark:border-white/20 p-5 max-w-md w-full shadow-2xl rounded-none flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#201d1d]/10 dark:border-white/10 pb-3">
          <div>
            <span className="text-[10px] uppercase tracking-widest text-[#201d1d]/60 dark:text-white/60">
              [ELEMENTAL ESSENCE FORGE]
            </span>
            <h3 className="text-sm font-black text-[#201d1d] dark:text-white">
              {language === 'ko' ? '속성 에센스 연성 제작소' : 'Elemental Crafting Store'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-xs px-2 py-1 border border-[#201d1d]/20 dark:border-white/20 hover:bg-black/5"
          >
            [X]
          </button>
        </div>

        {/* Essence Inventory Badges */}
        <div className="grid grid-cols-4 gap-2 text-center text-xs">
          <div className="p-2 bg-red-500/10 border border-red-500/40 text-red-600 dark:text-red-400 font-bold">
            🔥 {essences.FIRE}
          </div>
          <div className="p-2 bg-blue-500/10 border border-blue-500/40 text-blue-600 dark:text-blue-400 font-bold">
            💧 {essences.WATER}
          </div>
          <div className="p-2 bg-amber-500/10 border border-amber-500/40 text-amber-600 dark:text-amber-400 font-bold">
            ⛰️ {essences.EARTH}
          </div>
          <div className="p-2 bg-emerald-500/10 border border-emerald-500/40 text-emerald-600 dark:text-emerald-400 font-bold">
            🌪️ {essences.WIND}
          </div>
        </div>

        {/* Target Card Selection */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
            {language === 'ko' ? '제작할 목표 카드 선택:' : 'Select Target Card to Forge:'}
          </label>
          <select
            value={selectedTargetCardId}
            onChange={(e) => setSelectedTargetCardId(Number(e.target.value))}
            className="w-full bg-black/5 dark:bg-white/5 border border-slate-300 dark:border-slate-700 p-2 text-xs font-bold"
          >
            {[1, 2, 11, 12, 21, 22, 31, 32].map((id) => {
              const c = CARD_DATABASE[id];
              return (
                <option key={id} value={id}>
                  #{id} {c.title} ({c.element || 'WATER'} / PWR {c.power})
                </option>
              );
            })}
          </select>
        </div>

        {/* Forge Recipe Box */}
        <div className="p-3 bg-black/5 dark:bg-white/5 border border-[#201d1d]/10 dark:border-white/10 text-xs space-y-2">
          <div className="flex justify-between items-center font-bold">
            <span>필요 속성 에센스:</span>
            <span className={canCraft ? 'text-emerald-600 font-black' : 'text-rose-500 font-black'}>
              {currentCount} / {cost} [{requiredElement}]
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground">
            {language === 'ko'
              ? '카드를 분해(Scrap)하면 해당 속성의 에센스를 환급받아 원하는 카드를 확정 제작할 수 있습니다.'
              : 'Dismantling cards refunds attribute essences, which can be forged into guaranteed target cards.'}
          </p>
        </div>

        {craftFeedback && (
          <div className="text-xs font-bold text-emerald-600 text-center animate-pulse">
            {craftFeedback}
          </div>
        )}

        {/* Forge Button */}
        <button
          disabled={!canCraft}
          onClick={handleCraft}
          className={`w-full py-2.5 text-xs font-bold uppercase tracking-wider transition-all ${
            canCraft
              ? 'bg-[#201d1d] text-white dark:bg-white dark:text-[#201d1d] hover:opacity-90 active:scale-98'
              : 'bg-black/20 dark:bg-white/20 text-slate-400 cursor-not-allowed'
          }`}
        >
          {canCraft ? `[⚒️ ${targetCard.title} 확정 제작 (50 에센스 소모)]` : '[에센스 부족]'}
        </button>
      </div>
    </div>
  );
};
