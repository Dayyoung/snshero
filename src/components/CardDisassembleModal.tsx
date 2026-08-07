import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2, AlertTriangle, CheckCircle2, X, RefreshCw, Lock, Sparkles, Filter } from 'lucide-react';
import { CardData, Language } from '../types';
import { CARD_DATABASE } from '../cardDatabase';
import { CardItem } from './CardItem';
import { useCardLock } from '../hooks/useCardLock';
import { cn, getFormattedCardName } from '../lib/utils';
import { getCardRarityRank } from '../lib/cardRarity';

interface CardDisassembleModalProps {
  isOpen: boolean;
  onClose: () => void;
  ownedCards: CardData[];
  currentDeckCardIds: number[];
  language: Language;
  onConfirmDisassemble: (selectedCardIds: string[], totalRefundSns: number) => void;
  playSfx: (url: string) => void;
}

export const CardDisassembleModal: React.FC<CardDisassembleModalProps> = ({
  isOpen,
  onClose,
  ownedCards,
  currentDeckCardIds,
  language,
  onConfirmDisassemble,
  playSfx,
}) => {
  const { isLocked } = useCardLock();
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
  const [rarityFilter, setRarityFilter] = useState<string>('all');

  // Calculate duplicate counts to mark duplicate fodder cards
  const cardCountMap = useMemo(() => {
    const map = new Map<number, number>();
    ownedCards.forEach(c => {
      const dbId = c.imageIndex || Number(c.id) || 0;
      map.set(dbId, (map.get(dbId) || 0) + 1);
    });
    return map;
  }, [ownedCards]);

  // Eligible cards for dismantling: Not in active deck and Not locked
  const eligibleCards = useMemo(() => {
    return ownedCards.filter(c => {
      const dbId = c.imageIndex || Number(c.id) || 0;
      const isDeck = currentDeckCardIds.includes(dbId) || currentDeckCardIds.includes(Number(c.id));
      const locked = isLocked(dbId) || isLocked(c.id);
      return !isDeck && !locked;
    });
  }, [ownedCards, currentDeckCardIds, isLocked]);

  const filteredCards = useMemo(() => {
    if (rarityFilter === 'all') return eligibleCards;
    return eligibleCards.filter(c => c.rarity?.toLowerCase() === rarityFilter.toLowerCase());
  }, [eligibleCards, rarityFilter]);

  // Calculate SNS points / Gold refund values per card based on rarity
  const getCardRefundValue = (card: CardData): number => {
    const rarity = card.rarity?.toLowerCase() || 'common';
    switch (rarity) {
      case 'legendary':
      case 'ssr':
        return 1000;
      case 'epic':
      case 'sr':
        return 350;
      case 'rare':
      case 'r':
        return 100;
      default:
        return 30; // Common / N
    }
  };

  const totalRefund = useMemo(() => {
    return selectedCardIds.reduce((sum, id) => {
      const card = ownedCards.find(c => String(c.id) === id);
      return sum + (card ? getCardRefundValue(card) : 0);
    }, 0);
  }, [selectedCardIds, ownedCards]);

  const handleToggleSelectCard = (cardId: string) => {
    playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
    setSelectedCardIds(prev => 
      prev.includes(cardId) ? prev.filter(id => id !== cardId) : [...prev, cardId]
    );
  };

  const handleAutoSelectDuplicates = () => {
    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    const seenMap = new Map<number, number>();
    const toSelect: string[] = [];

    // Keep first copy, select subsequent duplicate copies (excluding N/R if high rarity, or N/R/SR duplicates)
    eligibleCards.forEach(c => {
      const dbId = c.imageIndex || Number(c.id) || 0;
      const currentCount = seenMap.get(dbId) || 0;
      seenMap.set(dbId, currentCount + 1);

      // If we already have 1 copy of this card, select duplicate copies
      if (currentCount >= 1 && (c.rarity === 'common' || c.rarity === 'rare' || c.rarity === 'normal' || c.rarity === 'R' || c.rarity === 'N')) {
        toSelect.push(String(c.id));
      }
    });

    setSelectedCardIds(toSelect);
  };

  const handleConfirm = () => {
    if (selectedCardIds.length === 0) return;
    playSfx('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
    onConfirmDisassemble(selectedCardIds, totalRefund);
    setSelectedCardIds([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center">
                <Trash2 size={20} />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  {language === 'ko' ? '카드 분해 및 환급 (Disassemble)' : 'Card Scrap & Disassemble'}
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  {language === 'ko' ? '불필요하거나 중복된 카드를 분해하여 SNS 포인트를 환급받습니다.' : 'Dismantle duplicate cards for SNS Point refunds.'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Action Bar & Filter */}
          <div className="p-3 sm:p-4 bg-slate-100/60 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {['all', 'common', 'rare', 'epic', 'legendary'].map(r => (
                <button
                  key={r}
                  onClick={() => setRarityFilter(r)}
                  className={cn(
                    "px-2.5 py-1 rounded-lg font-bold uppercase transition-all cursor-pointer text-[11px]",
                    rarityFilter === r
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                  )}
                >
                  {r === 'all' ? (language === 'ko' ? '전체' : 'ALL') : r}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleAutoSelectDuplicates}
                className="px-3 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 rounded-xl font-bold transition-all active:scale-95 flex items-center gap-1 cursor-pointer"
              >
                <Sparkles size={13} />
                <span>{language === 'ko' ? '일반 중복 카드 일괄 선택' : 'Auto Select Duplicates'}</span>
              </button>
              {selectedCardIds.length > 0 && (
                <button
                  onClick={() => setSelectedCardIds([])}
                  className="px-2.5 py-1.5 bg-slate-200 text-slate-700 hover:bg-slate-300 rounded-xl font-bold transition-all text-xs cursor-pointer"
                >
                  {language === 'ko' ? '초기화' : 'Deselect All'}
                </button>
              )}
            </div>
          </div>

          {/* Card List Area */}
          <div className="p-4 overflow-y-auto flex-1 min-h-[220px] max-h-[420px]">
            {filteredCards.length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <Trash2 size={36} className="mx-auto opacity-30" />
                <p className="text-xs font-bold">
                  {language === 'ko' ? '분해 가능한 카드가 없습니다 (잠금 또는 장착 중인 카드 제외)' : 'No eligible cards to disassemble (Locked or Active Deck cards excluded)'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {filteredCards.map(card => {
                  const idStr = String(card.id);
                  const dbId = card.imageIndex || Number(card.id) || 0;
                  const isSelected = selectedCardIds.includes(idStr);
                  const refund = getCardRefundValue(card);
                  const count = cardCountMap.get(dbId) || 1;

                  return (
                    <div
                      key={idStr}
                      onClick={() => handleToggleSelectCard(idStr)}
                      className={cn(
                        "relative rounded-2xl border-2 p-2 flex flex-col items-center gap-1 transition-all cursor-pointer select-none",
                        isSelected 
                          ? "border-rose-500 bg-rose-50/80 shadow-md ring-2 ring-rose-300 scale-[1.02]" 
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                      )}
                    >
                      {/* Selection Badge */}
                      <div className={cn(
                        "absolute top-1.5 right-1.5 z-10 w-5 h-5 rounded-full flex items-center justify-center border text-[10px] font-black transition-all",
                        isSelected ? "bg-rose-600 border-rose-700 text-white" : "bg-white/80 border-slate-300 text-transparent"
                      )}>
                        ✓
                      </div>

                      {/* Duplicate Count Badge */}
                      {count > 1 && (
                        <div className="absolute top-1.5 left-1.5 z-10 bg-indigo-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-xs">
                          x{count}
                        </div>
                      )}

                      <CardItem card={card} className="w-16 h-22 sm:w-20 sm:h-28 rounded-lg shadow-sm" />
                      
                      <div className="text-center w-full min-w-0">
                        <p className="text-[10px] font-black text-slate-800 truncate">
                          {getFormattedCardName(card, language)}
                        </p>
                        <p className="text-[9px] font-extrabold text-amber-600">
                          +{refund} SNS
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer & Confirmation */}
          <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-slate-500 font-semibold">
                {language === 'ko' ? `선택된 카드: ${selectedCardIds.length}장` : `Selected: ${selectedCardIds.length} Cards`}
              </p>
              <p className="text-base sm:text-lg font-black text-amber-600 flex items-center gap-1">
                <span>+{totalRefund.toLocaleString()}</span>
                <span className="text-xs text-slate-500 font-bold">SNS Points</span>
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-bold text-xs hover:bg-slate-100 active:scale-95 transition-all cursor-pointer"
              >
                {language === 'ko' ? '취소' : 'Cancel'}
              </button>
              <button
                disabled={selectedCardIds.length === 0}
                onClick={handleConfirm}
                className={cn(
                  "px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider text-white shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95",
                  selectedCardIds.length > 0 
                    ? "bg-rose-600 hover:bg-rose-700 shadow-rose-200" 
                    : "bg-slate-300 cursor-not-allowed"
                )}
              >
                <Trash2 size={14} />
                <span>{language === 'ko' ? '분해 실행' : 'Confirm Scrap'}</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
