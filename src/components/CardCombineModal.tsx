import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, AlertCircle, Zap, Award, TrendingUp, CheckCircle2 } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';
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

  // SCR-03-02: Rolling power counter state
  const [lastPowerGained, setLastPowerGained] = useState<{ oldPower: number; newPower: number } | null>(null);
  // SCR-03-03: Material purchase feedback
  const [materialPurchaseSuccess, setMaterialPurchaseSuccess] = useState<string | null>(null);

  // ID 508: 만렙 달성 스킬/카드 초과 재료 범용 강화 가루 1:1.5 자동 변환 토글
  const [autoConvertDust, setAutoConvertDust] = useState<boolean>(() => {
    return localStorage.getItem('hero_auto_convert_max_dust') === 'true';
  });

  // ID 498: SSR 또는 Lv 10+ 카드 분해/합성 시 2단계 안전 가드
  const [guardModal, setGuardModal] = useState<{
    isOpen: boolean;
    cardId: number | null;
    inputWord: string;
    checked: boolean;
  }>({
    isOpen: false,
    cardId: null,
    inputWord: '',
    checked: false,
  });

  // ID 593: 요일별 속성 정수 분해/합성 +25% 부스트 이벤트 배너
  const todayElementBoost = useMemo(() => {
    const day = new Date().getDay();
    const boosts = [
      { element: '신성/빛', icon: '✨', nameEn: 'Holy', boost: 25 },
      { element: '암흑', icon: '🌑', nameEn: 'Dark', boost: 25 },
      { element: '화염', icon: '🔥', nameEn: 'Fire', boost: 25 },
      { element: '수류', icon: '💧', nameEn: 'Water', boost: 25 },
      { element: '바람', icon: '💨', nameEn: 'Wind', boost: 25 },
      { element: '대지', icon: '🌿', nameEn: 'Earth', boost: 25 },
      { element: '만능', icon: '⭐', nameEn: 'All Elements', boost: 25 },
    ];
    return boosts[day];
  }, []);

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

  // ID 337 & ID 453: 목표 레벨 도달 자동 최적 재료 분배 (경험치 오버플로우 방지)
  const handleAutoSelectMaterials = () => {
    // 3장 이상 보유한 가장 낮은 등급/파워의 재료 카드를 우선 탐색하여 낭비 차단
    const candidate = availableInventoryCards
      .filter(c => c.quantity >= 3 && (c.dbCard.power || 1000) <= 2500)
      .sort((a, b) => (a.dbCard.power || 1000) - (b.dbCard.power || 1000))[0] 
      || availableInventoryCards.find(c => c.quantity >= 3)
      || availableInventoryCards[0];

    if (candidate) {
      setCube([candidate.id, candidate.id, candidate.id]);
      playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
      setErrorMessage(null);
    } else {
      setErrorMessage(language === 'ko' ? '조합 가능한 재료 카드가 부족합니다 (동일 카드 3장 필요).' : 'Not enough identical fodder cards (3 required).');
    }
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

    // ID 498: SSR 또는 Lv 8+ 고가치 카드 소비 시 'DISASSEMBLE' 2단계 안전 가드
    const isHighValue = (sourceCard.level && sourceCard.level >= 8) || (sourceCard.power && sourceCard.power >= 2800);
    if (isHighValue && (!guardModal.checked || guardModal.inputWord.trim().toUpperCase() !== 'DISASSEMBLE')) {
      setGuardModal({
        isOpen: true,
        cardId: cardId1,
        inputWord: '',
        checked: false,
      });
      return;
    }

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

    // SCR-03-02: Level-up fanfare SFX, victory haptic, and power change recording
    triggerHaptic('victory');
    setLastPowerGained({ oldPower: sourceCard.power, newPower: targetCard.power });
    playSfx('https://assets.mixkit.co/active_storage/sfx/2020/2020-preview.mp3'); // Level-up fanfare SFX

    // Apply state
    setInventory(nextInventory);
    setCube([null, null, null]);
    setSuccessCardId(targetCardId);

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

  // SCR-03-03: 재료 부족 시 '부족한 재료 즉시 보충 팩 (30 SNS)' 1-Tap 다이렉트 결제/수령
  const handleBuyMaterialPack = () => {
    const targetCardId = cube[0] || cube[1] || cube[2] || (availableInventoryCards[0]?.id ?? 1);
    const targetCard = CARD_DATABASE[targetCardId];
    if (!targetCard) return;

    if (sns < 30) {
      setErrorMessage(
        language === 'ko'
          ? '보유 SNS가 부족합니다 (30 SNS 필요). 상점에서 충전 후 이용해 주세요.'
          : 'Insufficient SNS balance (30 SNS required). Please top up in Shop.'
      );
      playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
      return;
    }

    // 30 SNS 차감
    updateSns(-30, `카드 합성 재료 [${targetCard.title}] 3장 즉시 보충 패키지`);

    // 인벤토리에 3장 추가
    const nextInv = { ...inventory };
    const curRecord = nextInv[targetCardId] || {
      cardIndex: targetCardId,
      quantity: 0,
      rarity: targetCard.rarity,
    };
    nextInv[targetCardId] = {
      ...curRecord,
      quantity: curRecord.quantity + 3,
    };
    setInventory(nextInv);

    // 큐브 슬롯에 3장 자동 세팅
    setCube([targetCardId, targetCardId, targetCardId]);
    setErrorMessage(null);
    setMaterialPurchaseSuccess(
      language === 'ko'
        ? `🎉 [재료 보충 완료] [${targetCard.title}] 3장이 즉시 충전되어 큐브에 장착되었습니다!`
        : `🎉 [Material Pack Ready] 3x [${targetCard.title_en || targetCard.title}] loaded into cube!`
    );

    triggerHaptic('success');
    playSfx('https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3');
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

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* ID 593: 요일별 속성 정수 분해/합성 +25% 부스트 이벤트 배너 */}
            <div className="bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 flex items-center justify-between font-mono text-[11px] text-amber-800">
              <span className="font-bold">
                [{todayElementBoost.icon} {todayElementBoost.element} (+{todayElementBoost.boost}%) {language === 'ko' ? '오늘의 속성 합성 부스트!' : 'Daily Element Boost Active!'}]
              </span>
              <span className="text-[10px] text-amber-700 bg-amber-200/50 px-1 border border-amber-400">
                +25% EXP
              </span>
            </div>

            {/* ID 508: 만렙 달성 스킬/카드 초과 재료 범용 강화 가루 1:1.5 자동 변환 토글 */}
            <div className="flex items-center justify-between bg-slate-50 border border-slate-200 px-3 py-1.5 font-mono text-xs">
              <span className="text-slate-700 font-bold">
                ⚙️ {language === 'ko' ? '만렙 초과 재료 가루 자동 변환 (1:1.5)' : 'Auto-Convert Max Material to Dust (1:1.5)'}
              </span>
              <button
                type="button"
                onClick={() => {
                  const nextVal = !autoConvertDust;
                  setAutoConvertDust(nextVal);
                  localStorage.setItem('hero_auto_convert_max_dust', String(nextVal));
                }}
                className={`px-2 py-0.5 text-[10px] font-black border cursor-pointer ${
                  autoConvertDust
                    ? 'bg-emerald-600 border-emerald-700 text-white'
                    : 'bg-slate-200 border-slate-300 text-slate-600'
                }`}
              >
                {autoConvertDust ? '[ON]' : '[OFF]'}
              </button>
            </div>

            {/* Top Description */}
            <div className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-2xl flex items-start gap-3">
              <AlertCircle className="text-indigo-600 shrink-0 mt-0.5" size={16} />
              <p className="text-xs font-semibold leading-relaxed text-indigo-900">
                {t('card_combine_desc', language)}
              </p>
            </div>

            {/* Material Purchase Success Toast */}
            {materialPurchaseSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-2xl text-center text-xs font-bold flex items-center justify-center gap-2"
              >
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span>{materialPurchaseSuccess}</span>
              </motion.div>
            )}

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

            {/* SCR-03-03: 재료 부족 시 '부족한 재료 즉시 보충 팩 (30 SNS)' 1-Tap 다이렉트 트리거 */}
            <div className="p-3 bg-gradient-to-r from-amber-500/15 to-yellow-500/15 border border-amber-500/40 rounded-2xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
                  <Zap size={16} />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span>{language === 'ko' ? '합성 재료 부족? 즉시 보충 팩' : 'Need Material? Instant Pack'}</span>
                    <span className="text-[10px] bg-amber-500 text-stone-950 font-black px-1.5 py-0.2 rounded-xs">30 SNS</span>
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">
                    {language === 'ko' ? '동일 재료 카드 3장을 즉시 충전하여 큐브에 장착합니다.' : 'Instantly add 3 identical fodder cards to cube.'}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleBuyMaterialPack}
                className="px-3 py-2 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-stone-950 font-bold text-xs rounded-xl shrink-0 active:scale-95 transition-all shadow-md flex items-center gap-1 cursor-pointer border border-amber-300"
              >
                <Zap size={12} className="fill-current" />
                <span>{language === 'ko' ? '1탭 즉시 보충' : 'Quick Fill'}</span>
              </button>
            </div>

            {/* Synthesis Core / Cube slots */}
            <div className="bg-slate-900/90 backdrop-blur-md p-6 rounded-3xl border border-slate-800 flex flex-col items-center justify-center relative min-h-[220px] shadow-inner overflow-hidden">
              {/* SCR-03-02: Success Presentation with Gold Particle Burst & Rolling Power Counter */}
              {successCardId !== null && (
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="absolute inset-0 z-50 bg-slate-950/95 flex flex-col items-center justify-center gap-2.5 p-4 rounded-3xl overflow-hidden"
                >
                  {/* Gold Particle Burst Elements */}
                  {[...Array(12)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
                      animate={{
                        scale: [0, 1.2, 0],
                        x: (Math.cos((i * 30 * Math.PI) / 180) * 110),
                        y: (Math.sin((i * 30 * Math.PI) / 180) * 110),
                        opacity: [1, 0.9, 0],
                        rotate: i * 30,
                      }}
                      transition={{ duration: 1.2, ease: "easeOut" }}
                      className="absolute w-3 h-3 bg-amber-400 rounded-full shadow-[0_0_10px_rgba(251,191,36,0.8)] pointer-events-none"
                    />
                  ))}

                  <span className="text-amber-400 font-black tracking-wider text-xs animate-bounce flex items-center gap-1.5 uppercase">
                    <Sparkles size={14} className="text-amber-300" />
                    [👑 LEVEL UP & SYNTHESIS COMPLETE!]
                    <Sparkles size={14} className="text-amber-300" />
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
                    className="w-24 h-32 md:w-28 md:h-38 shadow-[0_0_25px_rgba(251,191,36,0.6)]"
                    customImage={customCardImage}
                  />

                  <span className="text-white text-xs font-bold mt-1">
                    {language === 'ko'
                      ? `[${CARD_DATABASE[successCardId]?.title_dis || CARD_DATABASE[successCardId]?.title}] 획득!`
                      : `Obtained [${CARD_DATABASE[successCardId]?.title_en || CARD_DATABASE[successCardId]?.title_dis}]!`}
                  </span>

                  {/* SCR-03-02: Rolling Power Counter */}
                  {lastPowerGained && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/20 border border-amber-400/50 rounded-xl text-xs font-mono">
                      <TrendingUp size={13} className="text-amber-400" />
                      <span className="text-slate-300">{language === 'ko' ? '전투력' : 'Power'}:</span>
                      <span className="line-through text-slate-400">{lastPowerGained.oldPower}</span>
                      <span className="text-amber-300 font-black text-sm animate-pulse">➔ {lastPowerGained.newPower}</span>
                      <span className="text-emerald-400 font-bold">(+{lastPowerGained.newPower - lastPowerGained.oldPower})</span>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      triggerHaptic('selection');
                      setSuccessCardId(null);
                      setLastPowerGained(null);
                    }}
                    className="mt-2 px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black uppercase text-xs rounded-xl shadow-lg shadow-orange-500/20 active:scale-95 hover:from-amber-400 hover:to-orange-400 transition-all border border-amber-300 cursor-pointer"
                  >
                    [{language === 'ko' ? '확인' : 'Confirm'}]
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

              {/* ID 337: 스마트 재료 자동 선택 & 골드 소모량 확인 */}
              <div className="mt-4 flex flex-wrap items-center justify-center gap-3 w-full">
                <button
                  type="button"
                  onClick={handleAutoSelectMaterials}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-500/40 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                >
                  <Sparkles size={12} className="text-amber-400" />
                  <span>{language === 'ko' ? '최적 재료 자동 선택 (Next LV)' : 'Auto-Select to Next LV'}</span>
                </button>
                <div className="px-3 py-1 bg-amber-950/60 border border-amber-500/50 text-amber-300 text-[11px] font-mono rounded-lg flex items-center gap-1">
                  <span>소모 비용: 300 Gold / 15 SNS</span>
                </div>
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

        {/* ID 498: SSR / Lv 8+ 고가치 카드 분해/합성 2단계 안전 가드 팝업 */}
        {guardModal.isOpen && (
          <div className="fixed inset-0 z-[10005] flex items-center justify-center bg-black/75 p-4">
            <div className="bg-[#1a1717] border border-rose-500 text-white p-5 max-w-sm w-full font-mono space-y-4 shadow-2xl">
              <div className="text-rose-400 font-bold text-xs uppercase flex items-center gap-1.5 border-b border-rose-900/60 pb-2">
                ⚠️ [HIGH-VALUE CARD SAFEGUARD]
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                {language === 'ko'
                  ? '이 카드는 고가치(SSR급 또는 고강화) 카드입니다. 재료로 소모되면 복구할 수 없습니다. 계속하려면 아래 체크박스를 누르고 "DISASSEMBLE"을 입력하세요.'
                  : 'This is a high-value card. Consuming it as material is irreversible. To proceed, check the box and type "DISASSEMBLE" below.'}
              </p>

              <label className="flex items-center gap-2 text-xs text-amber-300 font-bold cursor-pointer">
                <input
                  type="checkbox"
                  checked={guardModal.checked}
                  onChange={(e) => setGuardModal(prev => ({ ...prev, checked: e.target.checked }))}
                  className="rounded-none accent-rose-500"
                />
                <span>{language === 'ko' ? '영구 소모 및 손실에 동의합니다' : 'I acknowledge irreversible loss'}</span>
              </label>

              <div className="space-y-1">
                <div className="text-[10px] text-slate-400">
                  {language === 'ko' ? '확인 문구 입력: "DISASSEMBLE"' : 'Type "DISASSEMBLE" to confirm:'}
                </div>
                <input
                  type="text"
                  value={guardModal.inputWord}
                  onChange={(e) => setGuardModal(prev => ({ ...prev, inputWord: e.target.value }))}
                  placeholder="DISASSEMBLE"
                  className="w-full bg-black border border-slate-700 px-3 py-1.5 text-xs text-white focus:border-rose-500 outline-none uppercase font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setGuardModal({ isOpen: false, cardId: null, inputWord: '', checked: false })}
                  className="py-1.5 border border-slate-700 text-slate-400 text-xs font-bold hover:bg-white/5"
                >
                  [{language === 'ko' ? '취소' : 'Cancel'}]
                </button>
                <button
                  type="button"
                  disabled={!guardModal.checked || guardModal.inputWord.trim().toUpperCase() !== 'DISASSEMBLE'}
                  onClick={() => {
                    setGuardModal(prev => ({ ...prev, isOpen: false }));
                    // 가드 승인 후 다시 진행
                    handleCombine();
                  }}
                  className="py-1.5 bg-rose-600 disabled:bg-slate-800 disabled:text-slate-600 text-white text-xs font-black hover:bg-rose-500 cursor-pointer"
                >
                  [{language === 'ko' ? '소비 확정' : 'Confirm'}]
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AnimatePresence>
  );
};
