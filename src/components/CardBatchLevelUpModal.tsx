import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowUp, CheckCheck, X, Zap, Shield, ChevronRight } from 'lucide-react';
import { CardData, Language } from '../types';
import { CARD_DATABASE } from '../cardDatabase';
import { CardItem } from './CardItem';
import { cn, getFormattedCardName } from '../lib/utils';

interface CardBatchLevelUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetCard: CardData | null;
  availableMaterialCards: CardData[];
  language: Language;
  onConfirmBatchUpgrade: (selectedMaterialIds: string[], levelGain: number, totalCostSns: number) => void;
  playSfx: (url: string) => void;
}

export const CardBatchLevelUpModal: React.FC<CardBatchLevelUpModalProps> = ({
  isOpen,
  onClose,
  targetCard,
  availableMaterialCards,
  language,
  onConfirmBatchUpgrade,
  playSfx,
}) => {
  const [selectedMaterialIds, setSelectedMaterialIds] = useState<string[]>([]);

  if (!isOpen || !targetCard) return null;

  // Toggle material card selection
  const toggleSelectMaterial = (cardId: string) => {
    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    setSelectedMaterialIds(prev =>
      prev.includes(cardId) ? prev.filter(id => id !== cardId) : [...prev, cardId]
    );
  };

  // Batch Select All Materials
  const handleSelectAll = () => {
    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    if (selectedMaterialIds.length === availableMaterialCards.length) {
      setSelectedMaterialIds([]);
    } else {
      setSelectedMaterialIds(availableMaterialCards.map(c => c.id));
    }
  };

  // Live Stat Increase Preview Calculation (Item 27)
  const currentLevel = targetCard.level || 1;
  const expGained = selectedMaterialIds.length * 100;
  const levelGain = Math.floor(expGained / 200); // 200 exp per level up
  const targetLevel = currentLevel + levelGain;
  const totalCostSns = selectedMaterialIds.length * 50;

  const currentStats = targetCard.stats || [1, 1, 1, 1];
  const statGain = levelGain * 2;
  const targetStats = currentStats.map(s => s + statGain);

  const handleConfirm = () => {
    if (selectedMaterialIds.length === 0) return;
    playSfx('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
    onConfirmBatchUpgrade(selectedMaterialIds, levelGain, totalCostSns);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[88vh]"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-indigo-50/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
                <Sparkles size={20} />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  {language === 'ko' ? '카드 일괄 레벨업 (Batch Level-Up)' : 'Batch Card Level-Up'}
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  {language === 'ko' ? '재료 카드를 일괄 선택하여 스탯 상승 및 목표 레벨을 미리봅니다.' : 'Batch select material cards & preview stat gains.'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Live Preview Panel (Item 27) */}
          <div className="p-4 bg-slate-900 text-white flex items-center justify-between gap-3 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <CardItem card={targetCard} className="w-14 h-20 rounded-lg shadow-md" />
              <div>
                <h4 className="font-black text-sm text-indigo-300">
                  {getFormattedCardName(targetCard, language)}
                </h4>
                <div className="flex items-center gap-2 mt-1 text-xs">
                  <span className="font-bold text-slate-400">Lv.{currentLevel}</span>
                  <ChevronRight size={14} className="text-emerald-400" />
                  <span className="font-black text-emerald-400 text-sm">
                    Lv.{targetLevel} {levelGain > 0 && `(+${levelGain})`}
                  </span>
                </div>
              </div>
            </div>

            {/* Live Stat Gain Breakdown */}
            <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700 text-right space-y-1 shrink-0">
              <div className="text-[10px] font-bold text-slate-400">
                {language === 'ko' ? '예상 스탯 상승' : 'Stat Increase'}
              </div>
              <div className="flex items-center gap-1.5 text-xs font-black text-emerald-400">
                <ArrowUp size={14} />
                <span>N/E/S/W +{statGain}</span>
              </div>
              <div className="text-[10px] font-bold text-amber-400">
                소모 SNS: -{totalCostSns}
              </div>
            </div>
          </div>

          {/* Batch Material Select Controls */}
          <div className="p-3 bg-slate-100 border-b border-slate-200 flex items-center justify-between text-xs">
            <span className="font-bold text-slate-600">
              {language === 'ko' 
                ? `선택된 재료 카드: ${selectedMaterialIds.length}장` 
                : `Selected Materials: ${selectedMaterialIds.length}`}
            </span>
            <button
              onClick={handleSelectAll}
              className="px-3 py-1 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1"
            >
              <CheckCheck size={14} className="text-indigo-600" />
              <span>{selectedMaterialIds.length === availableMaterialCards.length ? (language === 'ko' ? '전체 해제' : 'Deselect All') : (language === 'ko' ? '전체 일괄 선택' : 'Select All')}</span>
            </button>
          </div>

          {/* Materials Grid */}
          <div className="p-4 overflow-y-auto grid grid-cols-4 sm:grid-cols-5 gap-2.5 flex-1 min-h-[220px]">
            {availableMaterialCards.length === 0 ? (
              <div className="col-span-full py-12 text-center text-slate-400 font-bold text-xs">
                {language === 'ko' ? '사용 가능한 재료 카드가 없습니다.' : 'No material cards available.'}
              </div>
            ) : (
              availableMaterialCards.map(matCard => {
                const isSelected = selectedMaterialIds.includes(matCard.id);
                return (
                  <div
                    key={matCard.id}
                    onClick={() => toggleSelectMaterial(matCard.id)}
                    className={cn(
                      "relative rounded-xl overflow-hidden cursor-pointer transition-all border-2 flex flex-col items-center p-1",
                      isSelected 
                        ? "border-indigo-600 bg-indigo-50/80 ring-2 ring-indigo-400 scale-95" 
                        : "border-slate-200 bg-white hover:border-slate-300"
                    )}
                  >
                    <CardItem card={matCard} className="w-12 h-16 rounded-md shadow-xs" />
                    <span className="text-[9px] font-bold text-slate-700 truncate w-full text-center mt-1">
                      {getFormattedCardName(matCard, language)}
                    </span>
                    {isSelected && (
                      <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">
                        ✓
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-300 transition-all cursor-pointer"
            >
              {language === 'ko' ? '취소' : 'Cancel'}
            </button>

            <button
              disabled={selectedMaterialIds.length === 0}
              onClick={handleConfirm}
              className={cn(
                "px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer",
                selectedMaterialIds.length > 0
                  ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
              )}
            >
              {language === 'ko' ? '일괄 강화 실행' : 'Execute Batch Upgrade'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
