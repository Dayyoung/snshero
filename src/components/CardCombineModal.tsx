import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, AlertCircle } from 'lucide-react';
import { Language, CardData, InventoryRecord } from '../types';
import { CardItem } from './CardItem';
import { CARD_DATABASE } from '../cardDatabase';
import { t } from '../lib/i18n';
import { syncCardWithDatabase } from '../constants';

interface CardCombineModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  inventory: Record<number, InventoryRecord>;
  setInventory: React.Dispatch<React.SetStateAction<Record<number, InventoryRecord>>>;
  updateSns: (amount: number, reason?: string) => void;
  playSfx: (url: string) => void;
  customCardImage?: string | null;
  syncUserData?: (data: any) => Promise<void>;
  user?: any;
  stats?: any;
  currentDeck?: CardData[];
  itemInventory?: any[];
  totalPower?: number;
  isAutoBattle?: boolean;
  lowSpecMode?: boolean;
  sns: number;
}

export const CardCombineModal: React.FC<CardCombineModalProps> = ({
  isOpen,
  onClose,
  language,
  inventory,
  setInventory,
  updateSns,
  playSfx,
  customCardImage,
  syncUserData,
  user,
  stats,
  currentDeck,
  itemInventory,
  totalPower = 0,
  isAutoBattle = false,
  lowSpecMode = false,
  sns,
}) => {
  // Cube slots (up to 3 cards)
  const [cube, setCube] = useState<(number | null)[]>([null, null, null]);
  const [successCardId, setSuccessCardId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Available user cards list based on inventory quantities (excluding cards already inside the cube)
  const availableInventoryCards = useMemo(() => {
    // Count occurrences of card IDs currently placed inside the cube
    const cubeCounts: Record<number, number> = {};
    cube.forEach((id) => {
      if (id !== null) {
        cubeCounts[id] = (cubeCounts[id] || 0) + 1;
      }
    });

    return Object.entries(inventory)
      .map(([idxStr, val]) => {
        const record = val as InventoryRecord;
        const idx = parseInt(idxStr, 10);
        const dbCard = CARD_DATABASE[idx];
        if (!dbCard) return null;

        const insideCubeCount = cubeCounts[idx] || 0;
        const availableQty = record.quantity - insideCubeCount;

        if (availableQty <= 0) return null;

        return {
          id: idx,
          quantity: availableQty,
          dbCard,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => a.id - b.id);
  }, [inventory, cube]);

  // Click handler to move a card from inventory list to the cube
  const handleSelectCardForCube = (cardId: number) => {
    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    setSuccessCardId(null);
    setErrorMessage(null);

    // Find the first empty slot in the cube
    const emptySlotIdx = cube.findIndex((slot) => slot === null);
    if (emptySlotIdx !== -1) {
      const nextCube = [...cube];
      nextCube[emptySlotIdx] = cardId;
      setCube(nextCube);
    }
  };

  // Click handler to remove a card from the cube
  const handleRemoveCardFromCube = (slotIdx: number) => {
    playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
    setSuccessCardId(null);
    setErrorMessage(null);

    const nextCube = [...cube];
    nextCube[slotIdx] = null;
    setCube(nextCube);
  };

  // Perform card combination
  const handleCombine = async () => {
    setErrorMessage(null);

    // 1. Must put exactly 3 cards
    if (cube.some((slot) => slot === null)) {
      setErrorMessage(
        language === 'ko'
          ? '카드 3개가 모두 채워지지 않았습니다.'
          : 'You must fill all 3 slots.'
      );
      playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
      return;
    }

    const cardId1 = cube[0]!;
    const cardId2 = cube[1]!;
    const cardId3 = cube[2]!;

    // 2. All 3 cards must be identical
    if (cardId1 !== cardId2 || cardId2 !== cardId3) {
      setErrorMessage(
        language === 'ko'
          ? '같은 카드만 조합이 가능합니다.'
          : 'Only identical cards can be combined.'
      );
      playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
      return;
    }

    const sourceCard = CARD_DATABASE[cardId1];
    if (!sourceCard) return;

    // Find upper card: same element/race (category/type), but higher level/index or power.
    // In CARD_DATABASE:
    // element groups: water (1-10), fire (11-20), air/wind (21-30), earth/land (31-40), human (41-50), undead (51-60), elf (61-70), dwarf (71-80), monster (81-90), robot (91-100), dragon (101-110).
    // Typically ID increases sequentially within the same category.
    // Let's find the card with ID = sourceCardId + 1. If it has the same element/race (and is not out of bounds of that category), we pick it.
    // Category ranges are groups of 10. Let's make sure it doesn't cross the group boundary (e.g. 10 -> 11).
    const isAtBoundary = sourceCard.id % 10 === 0;
    let targetCardId = sourceCard.id + 1;

    if (isAtBoundary) {
      // If already level 10 (max), it cannot go higher within the element group. Just reward level 10 itself or stay.
      targetCardId = sourceCard.id;
    }

    const targetCard = CARD_DATABASE[targetCardId];
    if (!targetCard) {
      setErrorMessage(
        language === 'ko'
          ? '합성 가능한 상위 카드를 찾을 수 없습니다.'
          : 'No higher tier card found.'
      );
      return;
    }

    // Process synthesis: consume 3 source cards, add 1 target card
    const nextInventory = { ...inventory };

    // Consume 3 cards
    const sourceRecord = nextInventory[cardId1];
    if (!sourceRecord || sourceRecord.quantity < 3) {
      setErrorMessage(
        language === 'ko'
          ? '보유 수량이 부족합니다.'
          : 'Insufficient cards in inventory.'
      );
      return;
    }

    // Update source card quantity
    if (sourceRecord.quantity === 3) {
      delete nextInventory[cardId1];
    } else {
      nextInventory[cardId1] = {
        ...sourceRecord,
        quantity: sourceRecord.quantity - 3,
      };
    }

    // Add target card
    const targetRecord = nextInventory[targetCardId] || {
      cardIndex: targetCardId,
      quantity: 0,
      rarity: targetCard.rarity,
    };
    nextInventory[targetCardId] = {
      ...targetRecord,
      quantity: targetRecord.quantity + 1,
    };

    // Calculate power change
    const powerConsumed = sourceCard.power * 3;
    const powerEarned = targetCard.power;
    const netPowerChange = powerEarned - powerConsumed;
    const nextTotalPower = totalPower + netPowerChange;

    // Apply state
    setInventory(nextInventory);
    setCube([null, null, null]);
    setSuccessCardId(targetCardId);
    playSfx('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3'); // Synthesis success SFX

    // Sync to Firestore if online
    if (user && user.uid !== 'guest-id' && syncUserData) {
      syncUserData({
        inventory: nextInventory,
        totalPower: nextTotalPower,
        sns,
        stats,
        currentDeck,
        itemInventory,
        isAutoBattle,
        lowSpecMode,
        language,
        lastSync: Date.now(),
      });
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white text-slate-800 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl border border-slate-100/80 relative z-[10000] font-sans flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white flex items-center justify-between border-b border-indigo-700/10 shrink-0">
            <div className="flex items-center gap-2">
              <Sparkles size={20} className="text-yellow-300 animate-pulse" />
              <h2 className="text-base font-bold uppercase tracking-tight">
                {t('card_combine_title', language)}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Top Description */}
            <div className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-2xl flex items-start gap-3">
              <AlertCircle className="text-indigo-600 shrink-0 mt-0.5" size={16} />
              <p className="text-xs font-semibold leading-relaxed text-indigo-900">
                {t('card_combine_desc', language)}
              </p>
            </div>

            {/* Error Message Box */}
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-2xl text-center text-xs font-semibold"
              >
                {errorMessage}
              </motion.div>
            )}

            {/* Synthesis Core / Cube slots */}
            <div className="bg-slate-900/90 backdrop-blur-md p-6 rounded-3xl border border-slate-800 flex flex-col items-center justify-center relative min-h-[220px] shadow-inner">
              {/* Success Presentation */}
              {successCardId !== null && (
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1.1, opacity: 1 }}
                  className="absolute inset-0 z-50 bg-slate-950/95 flex flex-col items-center justify-center gap-3 p-4 rounded-3xl"
                >
                  <span className="text-amber-400 font-bold tracking-wider text-xs animate-bounce flex items-center gap-1">
                    <Sparkles size={12} className="text-amber-400" /> COMBINE SUCCESS <Sparkles size={12} className="text-amber-400" />
                  </span>
                  <CardItem
                    card={
                      syncCardWithDatabase(
                        {
                          id: `combined-success`,
                          imageIndex: successCardId,
                          stats: CARD_DATABASE[successCardId]?.stats || [1, 1, 1, 1],
                          rarity: CARD_DATABASE[successCardId]?.rarity || 'bronze',
                          level: 1,
                        } as any,
                        inventory
                      )
                    }
                    className="w-24 h-32 md:w-28 md:h-38 shadow-[0_0_20px_rgba(251,191,36,0.4)]"
                    customImage={customCardImage}
                  />
                  <span className="text-white text-xs font-semibold mt-2">
                    {language === 'ko'
                      ? `[${CARD_DATABASE[successCardId]?.title_dis}] 획득!`
                      : `Obtained [${CARD_DATABASE[successCardId]?.title_en || CARD_DATABASE[successCardId]?.title_dis}]!`}
                  </span>
                  <button
                    onClick={() => setSuccessCardId(null)}
                    className="mt-3 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold uppercase text-[10px] rounded-xl shadow-lg shadow-orange-500/20 active:scale-95 hover:from-amber-600 hover:to-orange-600 transition-all border-0 cursor-pointer"
                  >
                    확인
                  </button>
                </motion.div>
              )}

              <div className="flex justify-center gap-4 md:gap-8 items-center w-full">
                {cube.map((cardId, slotIdx) => (
                  <div
                    key={slotIdx}
                    className="relative flex flex-col items-center justify-center border border-dashed border-slate-700 hover:border-indigo-500/50 rounded-2xl w-24 h-32 md:w-28 md:h-38 bg-black/40 transition-colors"
                  >
                    {cardId !== null ? (
                      <>
                        <CardItem
                          card={
                            syncCardWithDatabase(
                              {
                                id: `cube-slot-${slotIdx}`,
                                imageIndex: cardId,
                                stats: CARD_DATABASE[cardId]?.stats || [1, 1, 1, 1],
                                rarity: CARD_DATABASE[cardId]?.rarity || 'bronze',
                                level: 1,
                              } as any,
                              inventory
                            )
                          }
                          className="w-24 h-32 md:w-28 md:h-38"
                          customImage={customCardImage}
                        />
                        <button
                          onClick={() => handleRemoveCardFromCube(slotIdx)}
                          className="absolute -top-2 -right-2 p-1.5 bg-rose-600 text-white rounded-full hover:bg-rose-500 transition-colors shadow-md cursor-pointer"
                          title="Remove card"
                        >
                          <X size={10} />
                        </button>
                      </>
                    ) : (
                      <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider text-center px-2">
                        SLOT {slotIdx + 1}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Combine Activation Button */}
              <button
                onClick={handleCombine}
                className="mt-6 px-8 py-3.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-indigo-500/20 active:scale-95 transition-all flex items-center gap-2 cursor-pointer border-0"
              >
                <Sparkles size={14} className="text-yellow-300 animate-spin-slow" />
                <span>{t('card_combine_btn', language)}</span>
              </button>
            </div>

            {/* Inventory listing / Choose cards */}
            <div className="space-y-3">
              <h3 className="font-bold text-xs text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1.5">
                {language === 'ko' ? '보유한 큐브 목록' : 'AVAILABLE INVENTORY'}
              </h3>

              {availableInventoryCards.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 max-h-[220px] overflow-y-auto pr-1">
                  {availableInventoryCards.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleSelectCardForCube(item.id)}
                      className="border border-slate-200/80 rounded-2xl p-3 bg-slate-50/40 flex flex-col items-center gap-1.5 cursor-pointer hover:bg-indigo-50/30 hover:border-indigo-300 transition-all select-none"
                    >
                      <CardItem
                        card={
                          syncCardWithDatabase(
                            {
                              id: `inv-combine-${item.id}`,
                              imageIndex: item.id,
                              stats: item.dbCard.stats || [1, 1, 1, 1],
                              rarity: item.dbCard.rarity || 'bronze',
                              level: 1,
                            } as any,
                            inventory
                          )
                        }
                        className="w-14 h-20 md:w-16 md:h-22 shadow-sm"
                        customImage={customCardImage}
                      />
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full text-center">
                        QTY: {item.quantity}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 font-semibold py-6 text-center">
                  {language === 'ko'
                    ? '합성 가능한 보유 카드가 없거나 이미 모두 큐브에 등록되었습니다.'
                    : 'No available duplicate cards in inventory.'}
                </p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 bg-white border-t border-slate-100 flex justify-end shrink-0">
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            >
              {t('close', language)}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
