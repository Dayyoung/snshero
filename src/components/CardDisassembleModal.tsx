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
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs font-mono text-[#201d1d]">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          className="bg-[#fdfcfc] rounded-none max-w-2xl w-full border border-[rgba(15,0,0,0.12)] overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-3.5 sm:p-4 border-b border-[rgba(15,0,0,0.12)] flex items-center justify-between bg-[#f8f7f7]">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-[#201d1d] text-[#fdfcfc] rounded-sm text-xs">
                <Trash2 size={14} />
              </span>
              <div>
                <h2 className="text-xs sm:text-sm font-black uppercase tracking-tight text-[#201d1d]">
                  {language === 'ko' ? '카드 분해 및 환급 (Disassemble)' : 'Card Scrap & Disassemble'}
                </h2>
                <p className="text-[10px] text-[#646262]">
                  {language === 'ko' ? '불필요한 카드를 분해하여 SNS 포인트를 환급받습니다.' : 'Dismantle duplicate cards for SNS Point refunds.'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="px-2 py-1 text-[#646262] hover:text-[#201d1d] font-bold text-xs cursor-pointer border border-[rgba(15,0,0,0.12)] rounded-sm hover:bg-[#e2e0e0] transition-colors"
            >
              [✕]
            </button>
          </div>

          {/* Top 1-line Estimated Refund Bar & Filters (ID 319) */}
          <div className="p-2.5 bg-[#fdfcfc] border-b border-[rgba(15,0,0,0.12)] flex flex-wrap items-center justify-between gap-2 text-[11px] font-bold">
            {/* Rarity Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto">
              {['all', 'common', 'rare', 'epic', 'legendary'].map(r => (
                <button
                  key={r}
                  onClick={() => setRarityFilter(r)}
                  className={cn(
                    "px-2 py-0.5 rounded-sm font-bold uppercase transition-all cursor-pointer text-[10px] border",
                    rarityFilter === r
                      ? "bg-[#201d1d] text-[#fdfcfc] border-[#201d1d]"
                      : "bg-[#fdfcfc] text-[#646262] border-[rgba(15,0,0,0.12)] hover:bg-[#f8f7f7]"
                  )}
                >
                  {r === 'all' ? (language === 'ko' ? '[전체]' : '[ALL]') : `[${r}]`}
                </button>
              ))}
            </div>

            {/* Auto Select & Reset */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleAutoSelectDuplicates}
                className="px-2 py-0.5 bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] text-[#201d1d] hover:bg-[#e2e0e0] rounded-sm text-[10px] font-bold transition-all active:scale-95 flex items-center gap-1 cursor-pointer"
              >
                <Sparkles size={11} />
                <span>{language === 'ko' ? '중복 카드 선택' : 'Select Duplicates'}</span>
              </button>
              {selectedCardIds.length > 0 && (
                <button
                  onClick={() => setSelectedCardIds([])}
                  className="px-2 py-0.5 bg-[#f8f7f7] text-[#646262] hover:text-[#201d1d] border border-[rgba(15,0,0,0.12)] rounded-sm text-[10px] font-bold transition-all cursor-pointer"
                >
                  [{language === 'ko' ? '초기화' : 'Clear'}]
                </button>
              )}
            </div>
          </div>

          {/* Consolidated 1-line Estimated Refund Banner */}
          <div className="px-3 py-1.5 bg-[#f8f7f7] border-b border-[rgba(15,0,0,0.12)] flex items-center justify-between text-[11px] font-bold">
            <span className="text-[#646262]">
              {language === 'ko' ? `선택: ${selectedCardIds.length}장` : `Selected: ${selectedCardIds.length}`}
            </span>
            <span className="text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-sm">
              [{language === 'ko' ? `예상 환급: +${totalRefund.toLocaleString()} SNS` : `Expected Refund: +${totalRefund.toLocaleString()} SNS`}]
            </span>
          </div>

          {/* Card List Area */}
          <div className="p-3 overflow-y-auto flex-1 min-h-[200px] max-h-[380px] bg-[#fdfcfc]">
            {filteredCards.length === 0 ? (
              <div className="py-10 text-center text-[#646262] space-y-1">
                <Trash2 size={28} className="mx-auto opacity-40" />
                <p className="text-[11px] font-bold">
                  {language === 'ko' ? '분해 가능한 카드가 없습니다 (잠금 또는 장착 중인 카드 제외)' : 'No eligible cards to disassemble (Locked/Active excluded)'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
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
                        "relative rounded-sm border p-1.5 flex flex-col items-center gap-1 transition-all cursor-pointer select-none",
                        isSelected 
                          ? "border-[#201d1d] bg-[#f8f7f7] ring-1 ring-[#201d1d]" 
                          : "border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] hover:bg-[#f8f7f7]"
                      )}
                    >
                      {/* Selection Badge */}
                      <div className={cn(
                        "absolute top-1 right-1 z-10 w-4 h-4 rounded-xs flex items-center justify-center border text-[9px] font-bold transition-all",
                        isSelected ? "bg-[#201d1d] border-[#201d1d] text-[#fdfcfc]" : "bg-[#fdfcfc] border-[rgba(15,0,0,0.12)] text-transparent"
                      )}>
                        ✓
                      </div>

                      {/* Duplicate Count Badge */}
                      {count > 1 && (
                        <div className="absolute top-1 left-1 z-10 bg-[#201d1d] text-[#fdfcfc] text-[8px] font-bold px-1 py-0.2 rounded-xs">
                          x{count}
                        </div>
                      )}

                      <CardItem card={card} className="w-14 h-20 sm:w-16 sm:h-24 rounded-xs border border-[rgba(15,0,0,0.12)]" />
                      
                      <div className="text-center w-full min-w-0">
                        <p className="text-[9px] font-bold text-[#201d1d] truncate">
                          {getFormattedCardName(card, language)}
                        </p>
                        <p className="text-[9px] font-bold text-amber-700">
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
          <div className="p-3 border-t border-[rgba(15,0,0,0.12)] bg-[#f8f7f7] flex items-center justify-between gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-sm border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] text-[#646262] hover:text-[#201d1d] font-bold text-xs hover:bg-[#e2e0e0] active:scale-95 transition-all cursor-pointer"
            >
              [{language === 'ko' ? '취소' : 'Cancel'}]
            </button>
            <button
              disabled={selectedCardIds.length === 0}
              onClick={handleConfirm}
              className={cn(
                "px-4 py-1.5 rounded-sm font-bold text-xs uppercase tracking-wider text-[#fdfcfc] transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 border border-[rgba(15,0,0,0.12)]",
                selectedCardIds.length > 0 
                  ? "bg-[#201d1d] hover:bg-[#333030]" 
                  : "bg-[#646262] opacity-50 cursor-not-allowed"
              )}
            >
              <Trash2 size={12} />
              <span>{language === 'ko' ? `선택 카드 분해 (${selectedCardIds.length})` : `Disassemble (${selectedCardIds.length})`}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
