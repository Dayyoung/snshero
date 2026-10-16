import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { triggerHaptic } from '../lib/haptic';
import { UserStats, CardData, InventoryRecord, Language, ViewType, EquipmentSlot, AiStrategy } from '../types';
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  defaultDropAnimationSideEffects
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  rectSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CardItem } from '../components/CardItem';
import { ArDeckViewer } from '../components/ArDeckViewer';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronLeft, ChevronRight, HelpCircle, Trophy, Info, Zap, Package, Shield, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Gift, Star as StarIcon, Edit2, Plus, Gem, Footprints, Sparkles, Share2, Camera, BookOpen, Users, PawPrint, Trash2, Layers, Lock, Search, Flame, Swords, Maximize2 } from 'lucide-react';
import { CardDisassembleModal } from '../components/CardDisassembleModal';
import { ElementAdvantageModal } from '../components/ElementAdvantageModal';
import { useCardLock } from '../hooks/useCardLock';
import { cn, getFormattedCardName } from '../lib/utils';
import { CARD_DATABASE } from '../cardDatabase';
import { t } from '../lib/i18n';
import { getCardRarityRank } from '../lib/cardRarity';
import { PageHeader } from '../components/PageHeader';
import { getSkillPointBonus, getPowerMultiplier, INITIAL_SKILLS, syncCardWithDatabase, getCardPower } from '../constants';
import { ITEM_DATABASE } from '../constants/itemDatabase';
import { ItemIcon } from '../components/ItemIcon';
import { Item } from '../types';
import { ALL_ACHIEVEMENTS } from '../constants/achievements';
import { createCommunityPost } from '../lib/communityHelper';
import { useCardSkins } from '../hooks/useCardSkins';
import { useHeroCare } from '../hooks/useHeroCare';
import { getTodayCard, getTodayCharacterLine, getTodayStoryHook } from '../lib/homeIpUtils';
import { getCharacterIpProfile, getFactionDef } from '../content/characterIpUtils';
import { HeroCarePanel } from '../components/HeroCarePanel';
import { MonsterPetBadge } from '../components/MonsterPetBadge';
import { useMonsterPet } from '../hooks/useMonsterPet';
import { getMonsterPetGroup, isMonsterPetCandidate, parseCardAvatarId } from '../lib/monsterPet';
import { CardCombineModal } from '../components/CardCombineModal';
import { DeckSynergyCalculator } from '../components/DeckSynergyCalculator';
import { DeckSynergyVisualizer } from '../components/DeckSynergyVisualizer';
import { DeckBondSynergyEngine } from '../lib/DeckBondSynergyEngine';
import { DeckChemistryMeter } from '../components/DeckChemistryMeter';
import { buildOptimalSynergyDeck } from '../lib/deckSynergyEngine';
import { DeckPresetCodeModal } from '../components/DeckPresetCodeModal';
import { DeckBalanceRadarChart } from '../components/DeckBalanceRadarChart';
import { CardCompareModal } from '../components/CardCompareModal';
import { MaterialDeficitModal } from '../components/MaterialDeficitModal';
import { TacticalPassivePerksModal } from '../components/battle/TacticalPassivePerksModal';
import { DeckCommandHub } from '../components/DeckCommandHub';
import { maybeTriggerTourOrProceedToBattle } from '../lib/smartLoopTourService';
import { startRankingDivert } from '../lib/rankingDivertService';
import { isDemoPlayActive } from '../lib/demoPlayService';
import { createMyDeckWebMcpTools, useWebMcpTools } from '../lib/webMcp/index';

interface MyDeckViewProps {
  currentDeck: CardData[];
  ownedCards: CardData[];
  updateDeck: (newDeck: CardData[]) => void;
  selectedCompanionIndex: number;
  setSelectedCompanionIndex: (index: number) => void;
  stats: UserStats;
  inventory: Record<number, InventoryRecord>;
  globalTotalPower: number;
  language: Language;
  onNavigate: (view: ViewType) => void;
  customCardImage?: string | null;
  equipItem: (itemId: string, deckIndex: number) => void;
  unequipItem: (itemId: string, deckIndex: number) => void;
  itemInventory: Item[];
  playSfx: (url: string) => void;
  setGlobalPopupOpen: (open: boolean) => void;
  user?: any | null;
  unlockedAchievements?: string[];
  claimedAchievements?: string[];
  achievementProgress?: Record<string, number>;
  claimAchievementReward?: (id: string) => void;
  aiStrategy: AiStrategy;
  onAiStrategyChange: (strategy: AiStrategy) => void;
  isImpersonating?: boolean;
  itemMagicChanceBonus: number;
  setInventory: React.Dispatch<React.SetStateAction<Record<number, InventoryRecord>>>;
  updateSns: (amount: number, reason?: string) => void;
  syncUserData?: (data: any) => Promise<void>;
  currentSeason?: string;
  isAutoBattle?: boolean;
  lowSpecMode?: boolean;
  sns: number;
  showCustomAlert?: (title: string, message: string) => void;
}


interface SortableCardItemProps {
  card: CardData;
  idx: number;
  handleCardClick: (index: number) => void;
  setItemManageIndex: (index: number) => void;
  setIsItemModalOpen: (open: boolean) => void;
  setEditingCardIndex: (index: number) => void;
  setEditName: (name: string) => void;
  setEditNotes: (notes: string) => void;
  iconMap: Record<string, any>;
  language: Language;
  customCardImage?: string | null;
  unequipItem: (itemId: string, deckIndex: number) => void;
  className?: string;
  representativeCardId?: number | null;
  representativePetCardId?: number | null;
  activeQuickSlot?: number | null;
  setActiveQuickSlot?: React.Dispatch<React.SetStateAction<number | null>>;
  setSelectingIndex?: React.Dispatch<React.SetStateAction<number | null>>;
  setIsPopupOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  setSelectedCardForDetail?: React.Dispatch<React.SetStateAction<CardData | null>>;
  setCardDetailTab?: React.Dispatch<React.SetStateAction<'stats' | 'skills' | 'lore'>>;
  isSynergyActive?: boolean;
  synergyElement?: string;
  isShaking?: boolean;
}

const SortableCardItem: React.FC<SortableCardItemProps> = ({
  card,
  idx,
  handleCardClick,
  setItemManageIndex,
  setIsItemModalOpen,
  setEditingCardIndex,
  setEditName,
  setEditNotes,
  iconMap,
  language,
  customCardImage,
  unequipItem,
  className,
  representativeCardId,
  representativePetCardId,
  activeQuickSlot,
  setActiveQuickSlot,
  setSelectingIndex,
  setIsPopupOpen,
  setSelectedCardForDetail,
  setCardDetailTab,
  isSynergyActive,
  synergyElement,
  isShaking,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : isShaking ? 25 : 1,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      id={`deck-slot-${idx}`}
      className={cn("flex shrink-0 flex-col items-center gap-2 group", className)}
    >
      <div className="text-[10px] sm:text-xs font-black text-black/30 uppercase tracking-tighter">
        {card.customName ? (
          <span className="text-blue-600 italic">"{card.customName}"</span>
        ) : (
          `SLOT_${idx + 1}`
        )}
      </div>
      <div className={cn(
        "relative rounded-none group/card border border-transparent transition-colors",
        isShaking ? "border-[#201d1d] z-30" : "",
        isSynergyActive && !isShaking ? "border-[#646262]" : ""
      )} {...attributes} {...listeners}>
        {isShaking && (
          <div className="absolute top-1 left-1/2 -translate-x-1/2 z-30 px-2 py-0.5 bg-[#201d1d] text-[#fdfcfc] font-bold text-[9px] rounded-sm border border-[#fdfcfc] uppercase leading-none whitespace-nowrap">
            {language === 'ko' ? '⚡ 장착 완료!' : '⚡ EQUIPPED!'}
          </div>
        )}
        {isSynergyActive && !isShaking && (
          <div className="absolute top-1 left-1 z-20 px-1 py-0.5 bg-[#201d1d] text-[#fdfcfc] font-bold text-[8px] rounded-sm border border-[#646262] uppercase leading-none">
            ✨AURA
          </div>
        )}
        <CardItem 
          card={card} 
          onClick={() => handleCardClick(idx)} 
          className="w-[27vw] min-w-[5.8rem] max-w-[7.5rem] h-[38vw] min-h-[8.2rem] max-h-[10.5rem] sm:w-24 sm:h-32 md:w-32 md:h-44 cursor-grab active:cursor-grabbing rounded-none"
          customImage={customCardImage}
          language={language}
          />
        {representativeCardId === (card.imageIndex ?? null) && representativePetCardId ? (
          <MonsterPetBadge
            cardId={representativePetCardId}
            className="absolute right-1 top-1 z-10 border-[#0f0000]/12 bg-[#fdfcfc] px-1 py-1"
            imageClassName="h-5 w-5"
            label={t('monster_pet_badge', language)}
          />
        ) : null}

      </div>

      {/* Equipment Dots */}
      <div className="flex gap-1">
        {['necklace', 'ring1', 'ring2', 'boots'].map(slot => (
          <div 
            key={slot}
            className={cn(
              "w-2 h-2 rounded-none border border-[#0f0000]/20",
              card?.equipment?.[slot as EquipmentSlot] ? "bg-[#201d1d]" : "bg-[#f1eeee]"
            )}
            title={slot}
          />
        ))}
      </div>

      {/* Skill Dots (Only show active skills) */}
      <div className="flex flex-wrap justify-center gap-1 mt-1 max-w-[80px]">
        {INITIAL_SKILLS.filter(baseSkill => (card.skills?.find(s => s.id === baseSkill.id)?.level || 0) > 0).map(baseSkill => {
          const skill = card.skills?.find(s => s.id === baseSkill.id);
          const isActive = (skill?.level || 0) > 0;
          const name = language === 'ko' ? baseSkill.name : baseSkill.name_en;
          const desc = language === 'ko' ? baseSkill.description : baseSkill.description_en;
          
          return (
            <div key={baseSkill.id} className="relative group/skill">
              <div 
                className={cn(
                  "w-1.5 h-1.5 rounded-none transition-colors",
                  "bg-[#201d1d]"
                )}
              />
              
              {/* Tooltip */}
              {isActive && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-32 p-2 bg-[#201d1d] text-[#fdfcfc] text-[10px] rounded-none opacity-0 group-hover/skill:opacity-100 pointer-events-none transition-opacity z-50 border border-[#646262]/40">
                  <div className="font-bold border-b border-white/20 pb-1 mb-1 flex justify-between uppercase">
                    <span>{name}</span>
                    <span>Lv.{skill?.level}</span>
                  </div>
                  <p className="opacity-80 leading-tight">{desc}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const MyDeckView: React.FC<MyDeckViewProps> = ({
  currentDeck, 
  ownedCards, 
  updateDeck, 
  selectedCompanionIndex,
  setSelectedCompanionIndex,
  stats, 
  inventory, 
  globalTotalPower, 
  language,
  onNavigate,
  customCardImage,
  equipItem,
  unequipItem,
  itemInventory,
  playSfx,
  setGlobalPopupOpen,
  user,
  unlockedAchievements = [],
  claimedAchievements = [],
  claimAchievementReward,
  achievementProgress = {},
  isImpersonating = false,
  itemMagicChanceBonus = 0,
  setInventory,
  updateSns,
  syncUserData,
  currentSeason,
  isAutoBattle,
  lowSpecMode,
  sns,
  showCustomAlert,
}) => {
  const [cardDetailTab, setCardDetailTab] = useState<'stats' | 'skills' | 'lore'>('stats');

  // ─── 스마트 루프: 상점 소환 후 덱 자동 강화 장착 ────────────────
  const [autoSwapBanner, setAutoSwapBanner] = useState<string | null>(null);
  const autoSwapHandledRef = useRef(false);
  const autoSwapTimerRef = useRef<NodeJS.Timeout | null>(null);
  const autoSwapCountdownRef = useRef<NodeJS.Timeout | null>(null);

  // 컴포넌트 언마운트 시에만 타이머 정리 (currentDeck 변경 등으로 조기 취소되는 현상 원천 방지)
  useEffect(() => {
    return () => {
      if (autoSwapTimerRef.current) clearTimeout(autoSwapTimerRef.current);
      if (autoSwapCountdownRef.current) clearInterval(autoSwapCountdownRef.current);
    };
  }, []);

  const handleInstantReturnToBattle = useCallback((isNewCardApplied = false) => {
    if (autoSwapCountdownRef.current) clearInterval(autoSwapCountdownRef.current);
    if (autoSwapTimerRef.current) clearTimeout(autoSwapTimerRef.current);
    setAutoSwapBanner(null);

    let isAutoLoopRanking = false;
    try {
      isAutoLoopRanking = localStorage.getItem('hero_auto_loop_is_ranking') === 'true';
    } catch {}

    // 랭킹 자동 플레이 진행 중 신규 카드가 마이덱에 적용된 경우: 미션게임(/play)으로 이동하여 새로운 카드플레이 시작
    if (isNewCardApplied || isAutoLoopRanking) {
      const targetMode = isDemoPlayActive() ? 'play' : undefined;
      startRankingDivert(onNavigate, language, undefined, targetMode);
      return;
    }

    maybeTriggerTourOrProceedToBattle(onNavigate);
  }, [onNavigate, language]);

  // ─── 덱 최적화/강화 시 적용 슬롯 흔들림 애니메이션 (Card Shake FX) ───
  const [shakingSlotIndices, setShakingSlotIndices] = useState<number[]>([]);
  const shakeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const autoReturnTimerRef = useRef<NodeJS.Timeout | null>(null);

  const triggerCardShake = useCallback((indices: number[], andReturnToAutoLoop = false) => {
    if (!indices || indices.length === 0) return;
    setShakingSlotIndices(indices);
    playSfx('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
    triggerHaptic('heavy');

    if (shakeTimeoutRef.current) clearTimeout(shakeTimeoutRef.current);
    shakeTimeoutRef.current = setTimeout(() => {
      setShakingSlotIndices([]);
    }, 1200);

    // 명시적으로 자동 복귀 플래그가 지정된 경우에만 애니메이션 재생 후 대전 복귀
    if (andReturnToAutoLoop) {
      if (autoReturnTimerRef.current) clearTimeout(autoReturnTimerRef.current);
      autoReturnTimerRef.current = setTimeout(() => {
        handleInstantReturnToBattle(true);
      }, 1400);
    }
  }, [playSfx, handleInstantReturnToBattle]);

  // 외부(DeckUpgradeModal 등)에서 덱 슬롯 업그레이드 이벤트 수신
  useEffect(() => {
    const handleDeckSlotsUpgraded = (e: Event) => {
      const customEvent = e as CustomEvent<{ slots: number[] }>;
      const slots = customEvent.detail?.slots || [];
      if (slots.length > 0) {
        triggerCardShake(slots, true);
      }
    };

    window.addEventListener('snshero_deck_slots_upgraded', handleDeckSlotsUpgraded as EventListener);
    return () => {
      window.removeEventListener('snshero_deck_slots_upgraded', handleDeckSlotsUpgraded as EventListener);
      if (shakeTimeoutRef.current) clearTimeout(shakeTimeoutRef.current);
      if (autoReturnTimerRef.current) clearTimeout(autoReturnTimerRef.current);
    };
  }, [triggerCardShake]);

  useEffect(() => {
    let mode: string | null = null;
    let rawCard: string | null = null;
    try {
      mode = localStorage.getItem('hero_auto_loop_mode');
      rawCard = localStorage.getItem('hero_auto_loop_card');
    } catch {}

    if (mode !== 'deck_swap' || !rawCard || autoSwapHandledRef.current) {
      if (isDemoPlayActive() && !autoSwapHandledRef.current) {
        autoSwapHandledRef.current = true;
        setAutoSwapBanner(
          language === 'ko'
            ? '⚡ [데모플레이] 마이덱 구성 확인 완료. 미션게임(/play)으로 이동합니다 (1.5초)...'
            : '⚡ [Demo Play] My Deck verified. Moving to Mission Game (/play) in 1.5s...'
        );
        autoSwapTimerRef.current = setTimeout(() => {
          startRankingDivert(onNavigate, language, undefined, 'play');
        }, 1500);
      }
      return;
    }
    autoSwapHandledRef.current = true;

    // 팝업/모달 간섭 원천 차단: 모든 모달 강제 닫기
    setIsPopupOpen(false);
    setSelectedCardForDetail(null);
    setIsItemModalOpen(false);
    setShowOptimizeSuccessModal(false);
    setIsSynergyModalOpen(false);
    setIsEncyclopediaOpen(false);
    setIsAchievementsModalOpen(false);
    setIsCombineModalOpen(false);
    setIs3DDeckViewerOpen(false);
    setIsDisassembleModalOpen(false);
    setIsElementAdvantageOpen(false);
    setIsDeckPresetCodeModalOpen(false);
    setIsCompareModalOpen(false);
    setGlobalPopupOpen(false);

    try {
      const cardCandidate = JSON.parse(rawCard);
      const imgIdx = cardCandidate.imageIndex ?? cardCandidate.id;
      const dbCard = CARD_DATABASE[imgIdx] || cardCandidate;
      const newCard = syncCardWithDatabase({
        ...dbCard,
        id: `card_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        imageIndex: imgIdx,
        level: 1,
        hunger: 100,
        happiness: 100,
      }, inventory);

      // 덱에서 최약체 카드 슬롯 찾기
      let minPower = 9999;
      let weakestSlot = 0;
      const baseDeck = (currentDeck && currentDeck.length > 0) ? currentDeck : (() => {
        try {
          const raw = localStorage.getItem('hero_deck');
          return raw ? JSON.parse(raw) : [];
        } catch { return []; }
      })();

      baseDeck.forEach((c: CardData, idx: number) => {
        const p = getCardPower(c);
        if (p < minPower) {
          minPower = p;
          weakestSlot = idx;
        }
      });

      const updatedDeck = [...baseDeck];
      const replacedCard = updatedDeck[weakestSlot];
      if (updatedDeck.length < 5) {
        updatedDeck.push(newCard);
      } else {
        updatedDeck[weakestSlot] = newCard;
      }

      // 로컬스토리지 영구 동기화
      try {
        const season = currentSeason || 'season1';
        localStorage.setItem('hero_deck', JSON.stringify(updatedDeck));
        localStorage.setItem(`hero_deck_${season}`, JSON.stringify(updatedDeck));
        localStorage.setItem(`hero_deck_guest_${season}`, JSON.stringify(updatedDeck));
        localStorage.setItem('hero_auto_loop_is_ranking', 'true');
        window.dispatchEvent(new Event('snshero_deck_updated'));
      } catch {}

      updateDeck(updatedDeck);
      playSfx('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
      triggerHaptic('heavy');
      triggerCardShake([weakestSlot], false);

      try {
        localStorage.removeItem('hero_auto_loop_mode');
        localStorage.removeItem('hero_auto_loop_card');
      } catch {}

      const cardName = newCard.title || newCard.name;
      const replacedName = replacedCard ? (replacedCard.title || replacedCard.name) : '';

      let remainingSec = 2;
      const updateBanner = (sec: number) => {
        setAutoSwapBanner(
          language === 'ko'
            ? `⚡ [신규 덱 장착 완료] '${cardName}'(으)로 교체 장착!\n/main 또는 /play 모드로 이동하여 새로운 카드플레이를 시작합니다 (${sec}초)... (3연패 시 랭킹 복귀)`
            : `⚡ [New Deck Equipped] Equipped '${cardName}'!\nMoving to /main or /play for new card battle in ${sec}s... (Returns to Rank on 3 losses)`
        );
      };

      updateBanner(remainingSec);

      autoSwapCountdownRef.current = setInterval(() => {
        remainingSec -= 1;
        if (remainingSec > 0) {
          updateBanner(remainingSec);
        } else {
          if (autoSwapCountdownRef.current) clearInterval(autoSwapCountdownRef.current);
        }
      }, 1000);

      autoSwapTimerRef.current = setTimeout(() => {
        handleInstantReturnToBattle(true);
      }, 2200);
    } catch (e) {
      console.error('Failed to auto swap deck card', e);
      try {
        localStorage.removeItem('hero_auto_loop_mode');
        localStorage.removeItem('hero_auto_loop_card');
        localStorage.setItem('hero_auto_loop_is_ranking', 'true');
      } catch {}
      handleInstantReturnToBattle();
    }
  }, [inventory, language, playSfx, updateDeck, currentSeason, handleInstantReturnToBattle, triggerCardShake]);
  const [selectedCardForDetail, setSelectedCardForDetail] = useState<CardData | null>(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [showPerksModal, setShowPerksModal] = useState(false);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingCardIndex, setEditingCardIndex] = useState<number | null>(null);
  const [selectingIndex, setSelectingIndex] = useState<number | null>(null);
  const [itemManageIndex, setItemManageIndex] = useState<number | null>(null);
  const [activeQuickSlot, setActiveQuickSlot] = useState<number | null>(null);
  const [itemSlotTab, setItemSlotTab] = useState<EquipmentSlot>('necklace');
  const [isEncyclopediaOpen, setIsEncyclopediaOpen] = useState(false);
  const [isAchievementsModalOpen, setIsAchievementsModalOpen] = useState(false);
  const [isCombineModalOpen, setIsCombineModalOpen] = useState(false);
  const [is3DDeckViewerOpen, setIs3DDeckViewerOpen] = useState(false);
  const [isDisassembleModalOpen, setIsDisassembleModalOpen] = useState(false);
  const [isElementAdvantageOpen, setIsElementAdvantageOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [helpStep, setHelpStep] = useState(0);
  const { isLocked } = useCardLock();

  const kadanCard = CARD_DATABASE[41];
  const kadanName = kadanCard ? (language === 'ko' ? kadanCard.title : kadanCard.title_en) : 'Kadan';
  const kadanCardData: CardData = useMemo(() => {
    const dbCard = CARD_DATABASE[41];
    return {
      id: '41',
      title: dbCard?.title || '카단',
      title_en: dbCard?.title_en || 'Kadan',
      title_dis: dbCard?.title_dis,
      stats: dbCard?.stats || [2, 3, 1, 5],
      power: dbCard?.power || 11,
      rarity: dbCard?.rarity || 'bronze',
      element: dbCard?.element || 'human',
      race: dbCard?.race,
      imageIndex: 41,
      imageUrl: dbCard?.imageUrl,
      level: 1,
      skills: [],
      owner: null,
    };
  }, []);

  const season = currentSeason || 'season1';

  // Multi-Deck Presets State (Item 31)
  const [activeDeckPreset, setActiveDeckPreset] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`hero_active_deck_preset_${season}`);
      return saved ? Number(saved) || 1 : 1;
    }
    return 1;
  });

  const handleSwitchDeckPreset = (targetPreset: number) => {
    if (targetPreset === activeDeckPreset) return;
    
    // Save current deck cards to active preset key
    const currentCardIds = currentDeck.map(c => c.imageIndex || Number(c.id) || 0);
    localStorage.setItem(`hero_deck_preset_${activeDeckPreset}_${season}`, JSON.stringify(currentCardIds));

    // Load target preset cards
    const rawTarget = localStorage.getItem(`hero_deck_preset_${targetPreset}_${season}`);
    let targetIds: number[] = rawTarget ? JSON.parse(rawTarget) : [];

    if (!targetIds || targetIds.length === 0) {
      targetIds = currentCardIds;
      localStorage.setItem(`hero_deck_preset_${targetPreset}_${season}`, JSON.stringify(targetIds));
    }

    const loadedDeck = targetIds.map(imgIdx => {
      const dbCard = CARD_DATABASE[imgIdx];
      if (!dbCard) return null;
      const invData = inventory[imgIdx];
      return syncCardWithDatabase({
        ...dbCard,
        id: `card-${imgIdx}-${Date.now()}`,
        imageIndex: imgIdx,
        owner: null,
        growth: invData?.growth || 0,
        hunger: invData?.hunger || 100,
        happiness: invData?.happiness || 100,
        lastInteraction: invData?.lastInteraction,
      }, inventory);
    }).filter((c): c is CardData => Boolean(c));

    if (loadedDeck.length > 0) {
      updateDeck(loadedDeck);
    }

    setActiveDeckPreset(targetPreset);
    localStorage.setItem(`hero_active_deck_preset_${season}`, String(targetPreset));
    playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
  };

  // ID 427: Preset Custom Name & Icon Metadata
  const [editingPresetNum, setEditingPresetNum] = useState<number | null>(null);
  const [presetNameEdit, setPresetNameEdit] = useState<string>('');
  const [presetIconEdit, setPresetIconEdit] = useState<string>('⚔️');

  const getPresetName = useCallback((num: number): string => {
    try {
      return localStorage.getItem(`hero_deck_preset_name_${num}_${season}`) || `DECK ${num}`;
    } catch {
      return `DECK ${num}`;
    }
  }, [season]);

  const getPresetIcon = useCallback((num: number): string => {
    try {
      return localStorage.getItem(`hero_deck_preset_icon_${num}_${season}`) || (num === 1 ? '⚔️' : num === 2 ? '🛡️' : '🔥');
    } catch {
      return '⚔️';
    }
  }, [season]);

  const handleSavePresetMeta = (num: number) => {
    if (!presetNameEdit.trim()) return;
    localStorage.setItem(`hero_deck_preset_name_${num}_${season}`, presetNameEdit.trim().slice(0, 10));
    localStorage.setItem(`hero_deck_preset_icon_${num}_${season}`, presetIconEdit);
    setEditingPresetNum(null);
    triggerHaptic('heavy');
  };

  // ID 447: Smart Deck Auto-Fill Recommendation Engine
  const handleSmartAutoFill = useCallback(() => {
    if (currentDeck.length >= 5) {
      if (showCustomAlert) {
        showCustomAlert(
          language === 'ko' ? '덱 완성 상태' : 'Deck Full',
          language === 'ko' ? '이미 덱이 5장으로 가득 차 있습니다.' : 'Deck already has 5 cards.'
        );
      }
      return;
    }

    const currentIds = new Set(currentDeck.map(c => c.imageIndex || Number(c.id)));
    // 인벤토리 중 미장착 고파워/속성 보완 카드 탐색
    const candidates = Object.values(inventory)
      .filter((inv: any) => inv && inv.cardId && !currentIds.has(inv.cardId))
      .map((inv: any) => CARD_DATABASE[inv.cardId])
      .filter(Boolean)
      .sort((a, b) => (b.power || 0) - (a.power || 0));

    if (candidates.length === 0) {
      if (showCustomAlert) {
        showCustomAlert(
          language === 'ko' ? '보유 카드 부족' : 'Insufficient Cards',
          language === 'ko' ? '추가할 수 있는 보유 카드가 없습니다.' : 'No additional owned cards found.'
        );
      }
      return;
    }

    const needed = 5 - currentDeck.length;
    const toAdd = candidates.slice(0, needed).map(dbCard => syncCardWithDatabase({
      ...dbCard,
      id: `card-${dbCard.id}-${Date.now()}`,
      imageIndex: dbCard.id,
      owner: null,
      growth: 0,
      hunger: 100,
      happiness: 100,
    }, inventory));

    const newDeck = [...currentDeck, ...toAdd];
    updateDeck(newDeck);
    triggerHaptic('heavy');
    if (showCustomAlert) {
      showCustomAlert(
        language === 'ko' ? '✨ 스마트 자동 완성 완료' : '✨ Smart Auto-Fill Complete',
        language === 'ko'
          ? `최적 시너지 영웅 ${toAdd.length}장을 덱에 편성했습니다!`
          : `Automatically equipped ${toAdd.length} high-synergy cards!`
      );
    }
  }, [currentDeck, inventory, language, showCustomAlert, updateDeck]);

  const cardSkins = useCardSkins(season);

  const { getCareState, getRewardStatus, performAction, claimReward, feedPremium } = useHeroCare({
    season,
    onGrantSns: (amount) => updateSns(amount, 'hero-care-bond-reward'),
  });
  const { getPetIdForRepresentativeCard, assignPet, clearPet, isPetEquipped } = useMonsterPet({ season });
  const representativeAvatar = useMemo(() => {
    if (typeof user?.photoURL === 'string' && user.photoURL.length > 0) {
      return user.photoURL;
    }
    if (typeof window === 'undefined') {
      return null;
    }
    return localStorage.getItem('hero_user_avatar');
  }, [user?.photoURL]);
  const representativeCardId = useMemo(() => parseCardAvatarId(representativeAvatar), [representativeAvatar]);
  const representativePetCardId = representativeCardId ? getPetIdForRepresentativeCard(representativeCardId) : null;
  const todayCard = useMemo(() => getTodayCard(season), [season]);
  const todayLine = useMemo(() => getTodayCharacterLine(todayCard.id, language), [todayCard.id, language]);
  const todayHook = useMemo(() => getTodayStoryHook(todayCard.id, language), [todayCard.id, language]);
  const todayProfile = useMemo(() => getCharacterIpProfile(todayCard.id), [todayCard.id]);
  const todayCardData: CardData = useMemo(() => ({
    id: `today-${todayCard.id}`,
    title_dis: todayCard.title_dis,
    title: todayCard.title,
    title_en: todayCard.title_en,
    stats: todayCard.stats,
    imageIndex: todayCard.id,
    rarity: todayCard.rarity,
    level: todayCard.level,
    owner: null,
    element: todayCard.element,
  }), [todayCard]);
  const isTodayCardInDeck = useMemo(() => currentDeck.some((c) => c.imageIndex === todayCard.id), [currentDeck, todayCard.id]);
  const recommendedCards = useMemo(() => {
    const faction = todayProfile?.faction;
    if (!faction) return [];
    return Object.values(CARD_DATABASE)
      .filter((c) => {
        const profile = getCharacterIpProfile(c.id);
        return profile?.faction === faction && c.id !== todayCard.id;
      })
      .slice(0, 3);
  }, [todayProfile, todayCard.id]);
  const factionName = todayProfile?.faction
    ? (getFactionDef(todayProfile.faction)?.nameKey
        ? t(getFactionDef(todayProfile.faction)!.nameKey, language)
        : todayProfile.faction)
    : '';
  
  // Sync activeSkinKey onto currentDeck cards from hook state
  const currentDeckWithSkins = useMemo(() => 
    currentDeck.map(card => {
      const skinKey = cardSkins.activeSkinMap[card.imageIndex ?? 0];
      if (skinKey && card.activeSkinKey !== skinKey) {
        return { ...card, activeSkinKey: skinKey };
      }
      if (!skinKey && card.activeSkinKey) {
        return { ...card, activeSkinKey: undefined };
      }
      return card;
    }),
    [currentDeck, cardSkins.activeSkinMap],
  );

  // 1-Tap Optimal Synergy Deck Auto-Fill (Row 748 / ID 585)
  const handleAutoFillOptimalSynergy = () => {
    playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
    const allAvailable = ownedCards.length > 0 ? ownedCards : currentDeck;
    const optimalDeck = buildOptimalSynergyDeck(allAvailable as any[], 8);
    if (optimalDeck && optimalDeck.length > 0) {
      updateDeck(optimalDeck as CardData[]);
      triggerCardShake([0, 1, 2, 3, 4].slice(0, optimalDeck.length), true);
      if (showCustomAlert) {
        showCustomAlert(
          language === 'ko' ? '✨ 최적 시너지 덱 편성 완료' : '✨ Optimal Synergy Deck Built',
          language === 'ko'
            ? '보유 카드 중 가장 강력한 세트 결속 보너스를 발휘하는 8장의 카드가 덱에 자동 편성되었습니다!'
            : '8 cards with the strongest elemental bond bonuses have been equipped to your active deck!'
        );
      }
    }
  };

  // Real-time Deck Synergy Calculation (Row 23)
  const activeSynergies = useMemo(() => {
    const elementCounts: Record<string, number> = {};
    let urCount = 0;
    let ssrCount = 0;
    
    currentDeck.forEach(card => {
      if (!card) return;
      const dbCard = CARD_DATABASE[card.imageIndex || 0];
      const elem = (card.element || dbCard?.element || 'FIRE').toUpperCase();
      elementCounts[elem] = (elementCounts[elem] || 0) + 1;
      const rarity = (dbCard?.rarity || card.rarity || 'N').toUpperCase();
      if (rarity === 'UR' || rarity === 'LR') urCount++;
      if (rarity === 'SSR') ssrCount++;
    });

    const list: { name: string; icon: string; count: number; active: boolean; effect: string; progress: string; desc: string }[] = [];

    const elementNames: Record<string, { ko: string; en: string; icon: string }> = {
      FIRE: { ko: '화염', en: 'Fire', icon: '🔥' },
      WATER: { ko: '물', en: 'Water', icon: '💧' },
      EARTH: { ko: '대지', en: 'Earth', icon: '🌿' },
      WIND: { ko: '바람', en: 'Wind', icon: '⚡' },
      LIGHT: { ko: '빛', en: 'Light', icon: '✨' },
      DARK: { ko: '어둠', en: 'Dark', icon: '🌑' },
    };

    Object.entries(elementCounts).forEach(([elem, count]) => {
      if (count >= 2) {
        const meta = elementNames[elem] || { ko: elem, en: elem, icon: '🔮' };
        const name = language === 'ko' ? `${meta.ko} 공명` : `${meta.en} Resonance`;
        const isTri = count >= 3;
        list.push({
          name,
          icon: meta.icon,
          count,
          active: true,
          effect: isTri ? (language === 'ko' ? '+10% 전력' : '+10% PWR') : (language === 'ko' ? '+5% 공격' : '+5% ATK'),
          progress: `${count}/5`,
          desc: language === 'ko' ? `${meta.ko} 속성 ${count}장 배치: ${isTri ? '동일 속성 시너지 10% 전력 증가' : '공격력 5% 증가'}` : `${meta.en} x${count}: ${isTri ? '+10% Total Power' : '+5% ATK'}`
        });
      }
    });

    if (urCount >= 2) {
      list.push({
        name: language === 'ko' ? 'UR 정점 각성' : 'UR Apex',
        icon: '👑',
        count: urCount,
        active: true,
        effect: language === 'ko' ? '+8% 치명' : '+8% Crit',
        progress: `${urCount}/2`,
        desc: language === 'ko' ? `UR 카드 ${urCount}장: 치명타율 +8%` : `UR cards x${urCount}: +8% Crit Rate`
      });
    } else if (ssrCount >= 3) {
      list.push({
        name: language === 'ko' ? 'SSR 엘리트 결집' : 'SSR Elite',
        icon: '⭐',
        count: ssrCount,
        active: true,
        effect: language === 'ko' ? '+5% 전력' : '+5% PWR',
        progress: `${ssrCount}/3`,
        desc: language === 'ko' ? `SSR 카드 ${ssrCount}장: 전력 +5%` : `SSR cards x${ssrCount}: +5% Power`
      });
    }

    return list;
  }, [currentDeck, language]);

  const selectedHeroCareState = selectedCardForDetail ? getCareState(selectedCardForDetail) : null;
  const selectedHeroCareRewardStatus = selectedCardForDetail ? getRewardStatus(selectedCardForDetail) : null;
  const selectedMonsterPetGroup = selectedCardForDetail ? getMonsterPetGroup(selectedCardForDetail) : null;
  const isSelectedCardMonsterPetCandidate = isMonsterPetCandidate(selectedCardForDetail);
  const selectedCardPetId = selectedCardForDetail?.imageIndex ?? null;
  const isSelectedCardPetEquipped = isPetEquipped(representativeCardId, selectedCardPetId);

  const handleSetMonsterPet = () => {
    if (!selectedCardForDetail?.imageIndex) return;
    if (!representativeCardId) {
      showCustomAlert?.(
        t('monster_pet_section_title', language),
        t('monster_pet_target_missing', language),
      );
      return;
    }
    if (!isSelectedCardMonsterPetCandidate) {
      showCustomAlert?.(
        t('monster_pet_section_title', language),
        t('monster_pet_hint_eligible', language),
      );
      return;
    }
    if (representativeCardId === selectedCardForDetail.imageIndex) {
      showCustomAlert?.(
        t('monster_pet_section_title', language),
        t('monster_pet_target_same_card', language),
      );
      return;
    }

    const didAssign = assignPet(representativeCardId, selectedCardForDetail.imageIndex);
    if (!didAssign) return;
    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    showCustomAlert?.(
      t('monster_pet_section_title', language),
      t('monster_pet_target_ready', language, {
        pet: getFormattedCardName(selectedCardForDetail, language),
      }),
    );
  };

  const handleClearMonsterPet = () => {
    if (!representativeCardId) {
      showCustomAlert?.(
        t('monster_pet_section_title', language),
        t('monster_pet_target_missing', language),
      );
      return;
    }

    const didClear = clearPet(representativeCardId);
    if (!didClear) return;
    playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
    showCustomAlert?.(
      t('monster_pet_section_title', language),
      t('monster_pet_cleared', language),
    );
  };

  const handleHeroCareAction = (action: 'feed' | 'train' | 'play' | 'rest') => {
    if (!selectedCardForDetail) return;
    performAction(selectedCardForDetail, action);
    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
  };

  const handleHeroCareRewardClaim = () => {
    if (!selectedCardForDetail) return;
    const reward = claimReward(selectedCardForDetail);
    if (!reward) {
      showCustomAlert?.(
        t('hero_care_reward_title', language),
        t('hero_care_reward_not_ready', language),
      );
      return;
    }

    playSfx('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
    showCustomAlert?.(
      t('hero_care_reward_title', language),
      t('hero_care_reward_claimed_notice', language, {
        amount: reward.snsReward,
      }),
    );
  };

  const handleHeroCarePremiumFeed = useCallback(() => {
    if (!selectedCardForDetail) return;
    const currentSns = sns ?? stats?.sns ?? 0;
    if (currentSns < 30) {
      playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
      showCustomAlert?.(
        language === 'ko' ? 'SNS 포인트 부족' : 'Insufficient SNS',
        language === 'ko'
          ? '특식 만복 영양제를 먹이려면 30 SNS 포인트가 필요합니다. 상점이나 퀘스트에서 획득하세요!'
          : 'You need 30 SNS to feed a Premium Treat. Earn more in the shop or quests!'
      );
      return;
    }

    updateSns(-30, '다마고치 특식 만복 영양제 충전');
    feedPremium(selectedCardForDetail);
    triggerHaptic('success');
    playSfx('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
    showCustomAlert?.(
      language === 'ko' ? '특식 충전 완료' : 'Premium Treat Given',
      language === 'ko'
        ? '특식 만복 영양제를 먹여 포만감과 기분이 +40, 친밀도가 +10 상승했습니다!'
        : 'Fed premium treat! Hunger & Mood +40, Affinity +10 boosted!'
    );
  }, [feedPremium, language, playSfx, selectedCardForDetail, showCustomAlert, sns, stats?.sns, updateSns]);

  const handleOptimizeDeck = () => {
    const sortedOwned = [...ownedCards]
      .map(card => ({
        card,
        power: getCardPower(card)
      }))
      .sort((a, b) => b.power - a.power);

    if (sortedOwned.length === 0) {
      showCustomAlert?.(
        language === 'ko' ? '카드 보유 부족' : 'No Cards Owned',
        language === 'ko' ? '보유한 카드가 없습니다.' : 'No cards owned.'
      );
      return;
    }

    const bestCards = sortedOwned.slice(0, 5).map(item => {
      const existingInDeck = currentDeck.find(c => c && c.imageIndex === item.card.imageIndex);
      if (existingInDeck) {
        return existingInDeck;
      }
      
      const invData = inventory[item.card.imageIndex];
      return syncCardWithDatabase({
        ...item.card,
        id: `card-${item.card.imageIndex}-${Date.now()}`,
        owner: null,
        growth: invData?.growth || 0,
        hunger: invData?.hunger || 100,
        happiness: invData?.happiness || 100,
        lastInteraction: invData?.lastInteraction,
      }, inventory);
    });

    // 변경된 카드 슬롯 인덱스 계산
    const changedSlots: number[] = [];
    bestCards.forEach((c, idx) => {
      const prev = currentDeck[idx];
      if (!prev || prev.imageIndex !== c.imageIndex || prev.id !== c.id) {
        changedSlots.push(idx);
      }
    });

    updateDeck(bestCards);
    triggerHaptic('success');
    playSfx('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');

    // 적용된 슬롯 카드 흔들기 효과 발동 (수동 최적화이므로 자동 대전 복귀 없이 마이덱 유지)
    const targetsToShake = changedSlots.length > 0 ? changedSlots : [0, 1, 2, 3, 4].slice(0, bestCards.length);
    triggerCardShake(targetsToShake, false);

    setShowOptimizeSuccessModal(true);
  };

  const displayItemInventory = useMemo(() => {
    if (!isImpersonating) return itemInventory;
    const simItems = ITEM_DATABASE.map((item, idx) => ({
      ...item,
      id: `sim-item-${idx}`,
      equippedToId: null
    }));
    return [...itemInventory, ...simItems];
  }, [itemInventory, isImpersonating]);

  
  // States for showing detail popups
  const [showDeckPowerDetails, setShowDeckPowerDetails] = useState(false);
  const [showTotalPowerDetails, setShowTotalPowerDetails] = useState(false);
  const [showOptimizeSuccessModal, setShowOptimizeSuccessModal] = useState(false);
  const [isSynergyModalOpen, setIsSynergyModalOpen] = useState(false);
  const [isVisualizerOpen, setIsVisualizerOpen] = useState(false);
  const activeBonds = useMemo(() => DeckBondSynergyEngine.getInstance().evaluateDeckBonds(currentDeck), [currentDeck]);
  const deckElementSynergyActive = useMemo(() => {
    if (activeBonds.length > 0) return true;
    const elements = currentDeck.map(c => String((c as any)?.element || CARD_DATABASE[c?.imageIndex || 0]?.element || 'WATER').toUpperCase());
    const counts: Record<string, number> = {};
    elements.forEach(el => counts[el] = (counts[el] || 0) + 1);
    return Math.max(0, ...Object.values(counts)) >= 3;
  }, [activeBonds.length, currentDeck]);

  // SCR-03: 동일 속성 3장 이상 장착 시 발동되는 팩션 시너지 오라 (Faction Synergy Aura)
  const factionSynergy = useMemo(() => {
    const counts: Record<string, number> = {};
    currentDeck.forEach(c => {
      const elem = String((c as any)?.element || CARD_DATABASE[c?.imageIndex || 0]?.element || 'WATER').toUpperCase();
      counts[elem] = (counts[elem] || 0) + 1;
    });
    for (const [elem, count] of Object.entries(counts)) {
      if (count >= 3) {
        return { element: elem, count, boostPercent: 15 };
      }
    }
    return null;
  }, [currentDeck]);

  // Local state for editing modal
  const [editName, setEditName] = useState('');
  const [editNotes, setEditNotes] = useState('');

  const [visibleCardLimit, setVisibleCardLimit] = useState(120);
  const [activeCategory, setActiveCategory] = useState<'all' | 'battle' | 'collection' | 'growth' | 'special' | 'social'>('all');

  // Sync popup state to App.tsx
  React.useEffect(() => {
    const isAnyOpen = !!selectedCardForDetail || isPopupOpen || isItemModalOpen || editingCardIndex !== null || selectingIndex !== null || itemManageIndex !== null || isEncyclopediaOpen || showDeckPowerDetails || showTotalPowerDetails || isAchievementsModalOpen || showOptimizeSuccessModal || isCombineModalOpen || isSynergyModalOpen || isVisualizerOpen;
    setGlobalPopupOpen(isAnyOpen);
    if (isAnyOpen) {
      window.dispatchEvent(new Event('snshero-modal-open'));
    } else {
      window.dispatchEvent(new Event('snshero-modal-close'));
    }
    
    // Explicit return to reset when unmounting
    return () => {
      setGlobalPopupOpen(false);
      window.dispatchEvent(new Event('snshero-modal-close'));
    };
  }, [selectedCardForDetail, isPopupOpen, isItemModalOpen, editingCardIndex, selectingIndex, itemManageIndex, isEncyclopediaOpen, showDeckPowerDetails, showTotalPowerDetails, isAchievementsModalOpen, showOptimizeSuccessModal, isCombineModalOpen, isSynergyModalOpen, isVisualizerOpen, setGlobalPopupOpen]);

  // 최상단 공용 뒤로가기 버튼 이벤트 수신 처리
  React.useEffect(() => {
    const handleGlobalBack = (e: Event) => {
      if (isVisualizerOpen) {
        e.preventDefault();
        playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
        setIsVisualizerOpen(false);
        return;
      }
      if (isSynergyModalOpen) {
        e.preventDefault();
        playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
        setIsSynergyModalOpen(false);
        return;
      }
      if (isPopupOpen) {
        e.preventDefault();
        playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
        setIsPopupOpen(false);
        setSelectingIndex(null);
        setSelectionContext('replace');
      }
    };
    window.addEventListener('global-back', handleGlobalBack);
    return () => window.removeEventListener('global-back', handleGlobalBack);
  }, [isPopupOpen, isSynergyModalOpen, isVisualizerOpen, playSfx]);

  // Calculate true total power based on inventory and unit power
  const calculatedTotalPower = Object.entries(inventory).reduce((acc, [idx, record]) => {
    const cardIdx = Number(idx);
    const dbCard = CARD_DATABASE[cardIdx];
    if (!dbCard) return acc;
    
    // Check if this card is in the deck to include skill bonus and multiplier
    const deckInstance = currentDeck.find(c => c && c.imageIndex === cardIdx);
    const bonus = deckInstance ? getSkillPointBonus(deckInstance) : 0;
    const multiplier = deckInstance ? getPowerMultiplier(deckInstance) : 1;
    const unitPower = (dbCard.power + bonus) * multiplier;
    
    return acc + (unitPower * (record as InventoryRecord).quantity);
  }, 0) + currentDeck.reduce((acc: number, card) => {
    if (!card) return acc;
    const equipPower: number = (Object.values(card.equipment || {}) as any[]).reduce((sum: number, item: any) => sum + (item?.stats?.reduce((a:number,b:number)=>a+b,0) || 0) * 10, 0);
    return acc + (equipPower * getPowerMultiplier(card));
  }, 0);

  // Calculate deck power based on current 5 cards
  const deckPower = currentDeck.reduce((acc, c) => {
    if (!c) return acc;
    return acc + getCardPower(c);
  }, 0);

  const uniqueCount = (Object.values(inventory) as InventoryRecord[]).filter(r => r.quantity > 0).length;
  const totalCount = (Object.values(inventory) as InventoryRecord[]).reduce((acc, r) => acc + r.quantity, 0);

  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
    
    if (over && active.id !== over.id) {
      const oldIndex = currentDeck.findIndex(c => c.id === active.id);
      const newIndex = currentDeck.findIndex(c => c.id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newDeck = arrayMove(currentDeck, oldIndex, newIndex);
        updateDeck(newDeck);
      }
    }
  };

  const [selectionContext, setSelectionContext] = useState<'replace' | 'upgrade' | 'equipment' | 'customize'>('replace');

  const [selectMessage, setSelectMessage] = useState<string | null>(null);

  const toggleDeckCard = (imgIdx: number) => {
    const dbCard = CARD_DATABASE[imgIdx];
    if (!dbCard) return;

    const isInDeck = currentDeck.some(c => c.imageIndex === imgIdx);

    if (isInDeck) {
      if (currentDeck.length <= 1) {
        setSelectMessage(language === 'ko' ? '최소 1장의 카드는 덱에 있어야 합니다.' : 'At least 1 card must be in the deck.');
        setTimeout(() => setSelectMessage(null), 2000);
        return;
      }
      const newDeck = currentDeck.filter(c => c.imageIndex !== imgIdx);
      updateDeck(newDeck);
      playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
    } else {
      if (currentDeck.length >= 5) {
        setSelectMessage(language === 'ko' ? '덱은 최대 5장까지 가능합니다.' : 'Deck can have max 5 cards.');
        setTimeout(() => setSelectMessage(null), 2000);
        return;
      }
      
      const invData = inventory[imgIdx];
      const newCard = syncCardWithDatabase({
        ...dbCard,
        id: `card-${imgIdx}-${Date.now()}`,
        imageIndex: imgIdx,
        owner: null,
        growth: invData?.growth || 0,
        hunger: invData?.hunger || 100,
        happiness: invData?.happiness || 100,
        lastInteraction: invData?.lastInteraction,
      }, inventory);

      updateDeck([...currentDeck, newCard]);
      playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
    }
  };

  const handleCardClick = (index: number) => {
    if (selectionContext === 'upgrade') {
      setSelectedCompanionIndex(index);
      onNavigate('skill');
      setSelectionContext('replace');
      return;
    }
    
    if (selectionContext === 'equipment') {
      setItemManageIndex(index);
      setIsItemModalOpen(true);
      setSelectionContext('replace');
      playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
      return;
    }

    // 출전 덱 클릭 시 선택 팝업 없이 곧바로 첫 번째(또는 해당 슬롯) 카드선택 리스트팝업 표시
    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    triggerHaptic('light');
    setActiveQuickSlot(null);
    setSelectingIndex(index ?? 0);
    setSelectionContext('replace');
    setIsPopupOpen(true);
  };

  const selectMasterCard = (imgIdx: number, overrideTargetIndex?: number) => {
    playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
    let targetIndex = overrideTargetIndex ?? selectingIndex;
    
    if (targetIndex === null) {
      const emptyIdx = currentDeck.findIndex(c => !c.imageIndex || c.imageIndex === 0);
      targetIndex = emptyIdx !== -1 ? emptyIdx : 0;
    }

    const existingIndex = currentDeck.findIndex(c => c && (c.imageIndex === imgIdx || Number(c.imageIndex) === imgIdx));
    if (existingIndex !== -1) {
      if (existingIndex !== targetIndex) {
        // Swap slots
        const newDeck = [...currentDeck];
        const temp = newDeck[targetIndex];
        newDeck[targetIndex] = newDeck[existingIndex];
        newDeck[existingIndex] = temp;
        updateDeck(newDeck);
      }
      setIsPopupOpen(false);
      setSelectingIndex(null);
      setSelectionContext('replace');
      return;
    }

    const dbCard = CARD_DATABASE[imgIdx];
    if (!dbCard) return;

    const invData = inventory[imgIdx];
    const newCard = syncCardWithDatabase({
      ...dbCard,
      id: `card-${imgIdx}-${Date.now()}`,
      imageIndex: imgIdx,
      owner: null,
      growth: invData?.growth || 0,
      hunger: invData?.hunger || 100,
      happiness: invData?.happiness || 100,
      lastInteraction: invData?.lastInteraction,
    }, inventory);

    const newDeck = [...currentDeck];
    newDeck[targetIndex] = newCard;
    
    updateDeck(newDeck);
    setIsPopupOpen(false);
    setSelectingIndex(null);
    setSelectionContext('replace');
  };

  // WebMCP Screen Tools: AI Agent Deck Optimization & Card Equipment
  const myDeckTools = useMemo(() => {
    return createMyDeckWebMcpTools({
      onOptimizeDeck: handleOptimizeDeck,
      onSwapCard: (slotIndex, cardId) => {
        selectMasterCard(cardId, slotIndex);
      },
      getDeckInfo: () => ({
        currentDeck: currentDeck.map((c, idx) => ({
          slot: idx,
          id: c.id,
          name: c.name,
          imageIndex: c.imageIndex,
          power: getCardPower(c),
          stats: c.stats
        })),
        totalDeckPower: currentDeck.reduce((acc, c) => acc + getCardPower(c), 0),
        ownedCount: ownedCards.length
      })
    });
  }, [currentDeck, handleOptimizeDeck, ownedCards.length]);

  useWebMcpTools(myDeckTools);

  const [sortBy, setSortBy] = useState<'index' | 'level' | 'power' | 'name' | 'rarity' | 'stats_total' | 'recent' | 'dir_up' | 'dir_down' | 'dir_left' | 'dir_right' | 'meta_counter'>('recent');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showOwnedOnly, setShowOwnedOnly] = useState(true);
  const [cardSearchQuery, setCardSearchQuery] = useState('');
  const [selectedElementFilter, setSelectedElementFilter] = useState<'ALL' | 'WATER' | 'FIRE' | 'EARTH' | 'WIND' | 'HOLY' | 'DARK'>('ALL');
  // ID 352: 역할 및 희귀도 다중 교차 필터
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<'ALL' | 'ATTACK' | 'DEFENSE'>('ALL');
  const [selectedRarityFilter, setSelectedRarityFilter] = useState<'ALL' | 'SSR' | 'SR' | 'R' | 'N'>('ALL');

  // ID 342 & ID 372: 덱 프리셋 복제 & 덱 코드/QR 모달
  const [isDeckPresetCodeModalOpen, setIsDeckPresetCodeModalOpen] = useState(false);

  // ID 377: 카드 1:1 비교 모달 상태
  const [compareCardA, setCompareCardA] = useState<CardData | null>(null);
  const [compareCardB, setCompareCardB] = useState<CardData | null>(null);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

  // ID 402: 돌파 재료 부족 딥링크 모달 상태
  const [isMaterialDeficitOpen, setIsMaterialDeficitOpen] = useState(false);
  const [deficitInfo, setDeficitInfo] = useState<{ name: string; req: number; cur: number }>({ name: '화염의 각성석', req: 5, cur: 2 });

  // ID 347: 1~3장 배치 후 최적 시너지 기반 덱 자동 완성
  const handleAutoFillSynergy = () => {
    const filled = currentDeck.filter((c): c is CardData => Boolean(c));
    const cardPool = ownedCards.length > 0 ? ownedCards : Object.values(CARD_DATABASE).map(c => syncCardWithDatabase({ ...c } as unknown as CardData, inventory));
    const optimal = buildOptimalSynergyDeck(cardPool, filled);
    if (optimal && optimal.length > 0) {
      updateDeck(optimal.slice(0, 5));
    }
  };

  // ID 412: 빈 슬롯 탭 시 인벤토리 자동 스크롤
  const handleEmptySlotTap = () => {
    const el = document.getElementById('mydeck-card-inventory-grid');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };


  const processedCards = React.useMemo(() => {
    // For Upgrade/Equipment, show the actual cards in the deck
    if (selectionContext === 'upgrade' || selectionContext === 'equipment') {
      return currentDeck.map((card, idx) => {
        if (!card) return null;
        return {
          idx: card.imageIndex,
          deckIdx: idx, // Pass the real index
          card,
          power: getCardPower(card),
          isOwned: true,
          isInDeck: true
        };
      }).filter((item): item is NonNullable<typeof item> => item !== null);
    }

    const baseIds = Array.from({ length: 110 }, (_, i) => i + 1);
    
    const allProcessed = baseIds.map(idx => {
       const dbCard = CARD_DATABASE[idx];
       if (!dbCard) return null;

       const card = syncCardWithDatabase({
         id: `preview-${idx}`,
         imageIndex: idx,
         stats: dbCard.stats || [1,1,1,1],
         rarity: dbCard.rarity || 'bronze',
         level: inventory[idx]?.level || 1,
       } as CardData, inventory);
       
       const isOwned = (inventory[idx]?.quantity || 0) > 0 || 
                       (inventory[String(idx) as any]?.quantity || 0) > 0 || 
                       ownedCards.some(c => c && (c.imageIndex === idx || Number(c.imageIndex) === idx));

       return {
         idx,
         card,
         power: getCardPower(card),
         isOwned,
         isInDeck: currentDeck.some(c => c && (c.imageIndex === idx || Number(c.imageIndex) === idx))
       };
    }).filter((item): item is NonNullable<typeof item> => item !== null);

    return allProcessed
      .filter(item => {
        if (selectionContext === 'upgrade' || selectionContext === 'equipment') {
          if (!item.isInDeck) return false;
        } else {
          if (showOwnedOnly && !item.isOwned) return false;
        }

        // Element Filter (Item 44)
        if (selectedElementFilter !== 'ALL') {
          const dbCard = CARD_DATABASE[item.idx];
          const rawEl = String((item.card as any).element || dbCard?.element || (item.card as any).race || dbCard?.race || '').toLowerCase();
          const target = selectedElementFilter.toLowerCase();
          const matches = (
            rawEl === target ||
            (target === 'wind' && (rawEl === 'air' || rawEl === 'wind')) ||
            (target === 'earth' && (rawEl === 'earth' || rawEl === 'land')) ||
            (target === 'water' && (rawEl === 'water' || rawEl === 'aqua')) ||
            (target === 'fire' && (rawEl === 'fire' || rawEl === 'flame')) ||
            (target === 'holy' && (rawEl === 'holy' || rawEl === 'light' || rawEl === 'human' || rawEl === 'elf')) ||
            (target === 'dark' && (rawEl === 'dark' || rawEl === 'undead' || rawEl === 'shadow' || rawEl === 'demon' || rawEl === 'monster'))
          );
          if (!matches) return false;
        }

        // Search Query Filter (Item 44)
        if (cardSearchQuery.trim() !== '') {
          const q = cardSearchQuery.toLowerCase();
          const dbCard = CARD_DATABASE[item.idx];
          const nameKo = String(item.card.title || item.card.title_dis || dbCard?.title || dbCard?.title_dis || '').toLowerCase();
          const nameEn = String((item.card as any).title_en || dbCard?.title_en || '').toLowerCase();
          const lore = String((item.card as any).lore_ko || dbCard?.lore_ko || '').toLowerCase();
          if (!nameKo.includes(q) && !nameEn.includes(q) && !lore.includes(q)) {
            return false;
          }
        }

        // ID 352: 역할 필터 (공격형 vs 방어형)
        if (selectedRoleFilter !== 'ALL') {
          const u = (item.card.stats as any)?.up ?? item.card.stats?.[0] ?? 0;
          const r = (item.card.stats as any)?.right ?? item.card.stats?.[1] ?? 0;
          const d = (item.card.stats as any)?.down ?? item.card.stats?.[2] ?? 0;
          const l = (item.card.stats as any)?.left ?? item.card.stats?.[3] ?? 0;
          const isAttack = (u + r) >= (d + l);
          if (selectedRoleFilter === 'ATTACK' && !isAttack) return false;
          if (selectedRoleFilter === 'DEFENSE' && isAttack) return false;
        }

        // ID 352: 희귀도 필터 (SSR / SR / R / N)
        if (selectedRarityFilter !== 'ALL') {
          const rarity = (item.card.rarity || 'bronze').toUpperCase();
          if (selectedRarityFilter === 'SSR' && rarity !== 'DIAMOND' && rarity !== 'GOLD') return false;
          if (selectedRarityFilter === 'SR' && rarity !== 'SILVER') return false;
          if (selectedRarityFilter === 'R' && rarity !== 'BRONZE') return false;
          if (selectedRarityFilter === 'N' && rarity !== 'COMMON' && rarity !== 'NORMAL') return false;
        }

        return true;
      })
      .sort((a, b) => {
        // Prioritize owned cards over unowned cards when browsing all
        if (a.isOwned !== b.isOwned) {
          return a.isOwned ? -1 : 1;
        }

        let comparison = 0;
        const cardA = a.card;
        const cardB = b.card;
        
        switch (sortBy) {
          case 'recent': {
            const timeA = inventory[a.idx]?.acquiredAt || (a.isOwned ? a.idx : 0);
            const timeB = inventory[b.idx]?.acquiredAt || (b.isOwned ? b.idx : 0);
            if (timeA !== timeB) {
              comparison = timeA - timeB;
            } else {
              comparison = a.idx - b.idx;
            }
            break;
          }
          case 'level':
            comparison = cardA.level - cardB.level;
            break;
          case 'power':
          case 'stats_total':
            comparison = a.power - b.power;
            break;
          case 'name': {
            const nameA = (language === 'ko' ? cardA.title_dis : (cardA as any).title_en) || '';
            const nameB = (language === 'ko' ? cardB.title_dis : (cardB as any).title_en) || '';
            comparison = nameA.localeCompare(nameB);
            break;
          }
          case 'rarity': {
            comparison = getCardRarityRank(cardA.rarity) - getCardRarityRank(cardB.rarity);
            break;
          }
          // ID 362: 상하좌우 4방향 수치 기준 원터치 퀵 정렬
          case 'dir_up': {
            const uA = (cardA.stats as any)?.up ?? cardA.stats?.[0] ?? 0;
            const uB = (cardB.stats as any)?.up ?? cardB.stats?.[0] ?? 0;
            comparison = uA - uB;
            break;
          }
          case 'dir_right': {
            const rA = (cardA.stats as any)?.right ?? cardA.stats?.[1] ?? 0;
            const rB = (cardB.stats as any)?.right ?? cardB.stats?.[1] ?? 0;
            comparison = rA - rB;
            break;
          }
          case 'dir_down': {
            const dA = (cardA.stats as any)?.down ?? cardA.stats?.[2] ?? 0;
            const dB = (cardB.stats as any)?.down ?? cardB.stats?.[2] ?? 0;
            comparison = dA - dB;
            break;
          }
          case 'dir_left': {
            const lA = (cardA.stats as any)?.left ?? cardA.stats?.[3] ?? 0;
            const lB = (cardB.stats as any)?.left ?? cardB.stats?.[3] ?? 0;
            comparison = lA - lB;
            break;
          }
          // ID 387: 메타 상성 카운터 픽 우선 정렬
          case 'meta_counter': {
            const elemA = String(cardA.element || '').toLowerCase();
            const elemB = String(cardB.element || '').toLowerCase();
            const isCounterA = elemA === 'water' || elemA === 'earth';
            const isCounterB = elemB === 'water' || elemB === 'earth';
            comparison = (isCounterA ? 1 : 0) - (isCounterB ? 1 : 0);
            break;
          }
          case 'index':
          default:
            comparison = a.idx - b.idx;
            break;
        }

        if (comparison !== 0) {
          return sortOrder === 'asc' ? comparison : -comparison;
        }

        if (a.isInDeck !== b.isInDeck) {
          return a.isInDeck ? -1 : 1;
        }
        return a.idx - b.idx;
      });
  }, [showOwnedOnly, ownedCards, inventory, sortBy, sortOrder, language, selectionContext, currentDeck, selectedElementFilter, selectedRoleFilter, selectedRarityFilter, cardSearchQuery]);

  const iconMap: Record<string, any> = {
    Zap,
    ArrowUp,
    ArrowDown,
    ArrowLeft,
    ArrowRight,
    Gift,
    Star: StarIcon
  };

  // SCR-03: 내 덱 도전장 URL 공유 및 일일 1회 +50 SNS 바이럴 루프
  const todayStr = new Date().toISOString().slice(0, 10);
  const [myDeckViralClaimed, setMyDeckViralClaimed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(`hero_mydeck_viral_share_${new Date().toISOString().slice(0, 10)}`) === 'true';
    } catch {
      return false;
    }
  });
  const [challengeLinkCopied, setChallengeLinkCopied] = useState(false);

  const handleShareMyDeckChallenge = useCallback(() => {
    const deckIds = currentDeck.map(c => c?.imageIndex || Number(c?.id) || 0).filter(id => id > 0);
    const deckParam = deckIds.length > 0 ? deckIds.join('-') : '1-11-31-51-101';
    const shareUrl = `https://snshero.com/?challenge=${deckParam}&ref=mydeck`;

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(shareUrl).catch(() => {});
    }
    setChallengeLinkCopied(true);
    setTimeout(() => setChallengeLinkCopied(false), 2500);
    playSfx('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
    triggerHaptic('success');

    const shareKey = `hero_mydeck_viral_share_${todayStr}`;
    let alreadyClaimed = myDeckViralClaimed;
    try {
      alreadyClaimed = alreadyClaimed || localStorage.getItem(shareKey) === 'true';
    } catch {}

    if (!alreadyClaimed) {
      try {
        localStorage.setItem(shareKey, 'true');
      } catch {}
      setMyDeckViralClaimed(true);
      updateSns(50, 'mydeck-viral-challenge-share');
      showCustomAlert?.(
        language === 'ko' ? '도전장 링크 복사 & +50 SNS 지급' : 'Challenge Link Copied & +50 SNS',
        language === 'ko'
          ? `내 5장 덱 도전장 URL(${shareUrl})이 클립보드에 복사되었습니다! 일일 첫 공유 보상으로 +50 SNS가 즉시 지급되었습니다.`
          : `Your 5-card deck challenge URL (${shareUrl}) has been copied! +50 SNS daily share reward granted.`
      );
    } else {
      showCustomAlert?.(
        language === 'ko' ? '도전장 링크 복사 완료' : 'Challenge Link Copied',
        language === 'ko'
          ? `내 5장 덱 도전장 URL(${shareUrl})이 복사되었습니다! 친구에게 공유하여 무설치 즉시 대결을 신청하세요.`
          : `Your 5-card deck challenge URL (${shareUrl}) has been copied to clipboard!`
      );
    }
  }, [currentDeck, language, myDeckViralClaimed, playSfx, showCustomAlert, todayStr, updateSns]);

  return (
    <div className="p-4 sm:p-6 md:p-8 pb-48 flex flex-col gap-6 max-w-4xl mx-auto min-h-screen w-full overflow-x-hidden touch-pan-y overscroll-x-none bg-[#fdfcfc] text-[#201d1d] font-mono">
      {/* Smart Loop Deck Swap Banner */}
      <AnimatePresence>
        {autoSwapBanner && (
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-4 right-4 z-[999999] pointer-events-auto flex justify-center"
          >
            <div className="bg-[#201d1d] border border-[#646262] text-[#fdfcfc] px-5 py-3 rounded-none max-w-md w-full text-center text-xs font-mono font-bold whitespace-pre-line leading-relaxed flex flex-col items-center gap-2">
              <span>{autoSwapBanner}</span>
              <button
                type="button"
                onClick={() => handleInstantReturnToBattle(true)}
                className="min-h-[44px] px-4 py-2 bg-[#fdfcfc] text-[#201d1d] font-bold rounded-sm text-xs hover:bg-[#f1eeee] transition-colors cursor-pointer border border-[#201d1d]"
              >
                {language === 'ko' ? '⚡ 즉시 새 모드로 출격' : '⚡ Start New Battle Now'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="flex flex-col gap-5 border-b border-[#0f0000]/12 pb-5 w-full">
        <div className="flex items-center gap-2">
          <PageHeader title={t('mydeck', language)} />
          <button
            onClick={() => { setIsHelpOpen(true); setHelpStep(0); }}
            className="min-w-11 min-h-11 rounded-sm border border-[#0f0000]/12 bg-[#fdfcfc] flex items-center justify-center hover:bg-[#f1eeee] transition-colors cursor-pointer shrink-0"
            aria-label="Help"
          >
            <HelpCircle size={16} className="text-[#646262]" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-px border border-[#0f0000]/12 bg-[#0f0000]/12">
          <button type="button" onClick={() => setShowDeckPowerDetails(true)} className="min-h-24 min-w-0 bg-[#201d1d] p-4 text-left text-[#fdfcfc] hover:bg-[#302c2c]">
            <span className="flex items-center gap-2 text-xs leading-relaxed">{t('deck_power', language)} <Info size={14} /></span>
            <span className="mt-2 block break-all text-2xl sm:text-3xl font-bold tabular-nums">{deckPower.toLocaleString()}</span>
          </button>
          <div className="min-w-0 bg-[#f8f7f7] p-4">
            <span className="text-xs leading-relaxed text-[#646262]">{t('total_power', language)}</span>
            <span className="mt-2 block break-all text-2xl sm:text-3xl font-bold tabular-nums">{globalTotalPower.toLocaleString()}</span>
          </div>
        </div>

        {/* SCR-03: [MY DECK CHALLENGE & SYNERGY HUD] Editorial Bar */}
        <div className="border border-[#0f0000]/12 bg-[#f8f7f7] p-3.5 sm:p-4 rounded-none font-mono flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#0f0000]/12 pb-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2 py-0.5 bg-[#201d1d] text-[#fdfcfc] text-[10px] font-bold rounded-none uppercase tracking-wider">
                MY DECK CHALLENGE & SYNERGY HUD
              </span>
              <span className="text-xs font-bold text-[#646262]">
                {language === 'ko'
                  ? `덱 ID: [${currentDeck.map(c => c?.imageIndex || Number(c?.id) || 1).join('-') || '1-11-31-51-101'}]`
                  : `DECK ID: [${currentDeck.map(c => c?.imageIndex || Number(c?.id) || 1).join('-') || '1-11-31-51-101'}]`}
              </span>
            </div>
            <span className="text-xs font-bold text-[#201d1d]">
              {currentDeck.some(c => String(c?.element || '').toUpperCase() === 'WATER')
                ? (language === 'ko' ? '✓ 속성 시너지 안정' : '✓ Balanced Synergy')
                : (language === 'ko' ? '⚠️ 부족 속성·전력 표적 소환 권장' : '⚠️ Target Summon Recommended')}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleShareMyDeckChallenge}
              className="min-h-[44px] px-3.5 py-2.5 bg-[#201d1d] hover:bg-[#302c2c] text-[#fdfcfc] border border-[#201d1d] rounded-sm text-xs font-bold flex items-center justify-between gap-2 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2 truncate">
                <Share2 size={14} className="shrink-0" />
                <span className="truncate">
                  {challengeLinkCopied
                    ? (language === 'ko' ? '[도전장 링크 복사됨!]' : '[Challenge Link Copied!]')
                    : myDeckViralClaimed
                      ? (language === 'ko' ? '[내 덱 도전장 링크 복사 (오늘 보상 완료)]' : '[Copy Deck Challenge URL (Claimed)]')
                      : (language === 'ko' ? '[내 덱 도전장 링크 복사 (+50 SNS)]' : '[Copy Deck Challenge URL (+50 SNS)]')}
                </span>
              </span>
              <ArrowRight size={14} className="shrink-0 opacity-80" />
            </button>
            <button
              type="button"
              onClick={() => {
                playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                onNavigate('shop');
              }}
              className="min-h-[44px] px-3.5 py-2.5 bg-[#fdfcfc] hover:bg-[#f1eeee] text-[#201d1d] border border-[#0f0000]/12 rounded-sm text-xs font-bold flex items-center justify-between gap-2 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2 truncate">
                <Package size={14} className="shrink-0" />
                <span className="truncate">
                  {language === 'ko' ? '[상점 표적 소환 바로가기]' : '[Go to Target Summon Shop]'}
                </span>
              </span>
              <ArrowRight size={14} className="shrink-0 opacity-70" />
            </button>
          </div>
        </div>
      </div>

      {/* Multi-Deck Presets Control Bar (Item 31 & ID 427, ID 447, ID 477) */}
      <details className="group bg-[#f8f7f7] text-[#201d1d] border border-[#0f0000]/12 rounded-none font-mono">
        <summary className="flex min-h-12 items-center justify-between gap-3 px-3 sm:px-4 cursor-pointer list-none text-sm font-bold">
          <span>{t('ui_deck_presets', language)} / {getPresetName(activeDeckPreset)}</span>
          <span aria-hidden="true" className="group-open:hidden">[+]</span><span aria-hidden="true" className="hidden group-open:inline">[-]</span>
        </summary>
        <div className="p-3 sm:p-4 border-t border-[#0f0000]/12 flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Layers size={18} className="text-[#646262] shrink-0" />
            <span className="text-sm font-bold text-[#201d1d]">
              {language === 'ko' ? '멀티 덱 프리셋' : 'Deck Presets'}
            </span>
          </div>

          <div className="flex items-center gap-2">

            <div className="flex flex-wrap items-center gap-1">
              {[1, 2, 3].map((presetNum) => (
                <div key={presetNum} className="flex items-center">
                  <button
                    onClick={() => handleSwitchDeckPreset(presetNum)}
                    className={cn(
                      "min-h-11 px-3 py-2 rounded-sm border text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer",
                      activeDeckPreset === presetNum
                        ? "bg-[#201d1d] text-[#fdfcfc] border-[#201d1d]"
                        : "bg-[#fdfcfc] text-[#646262] border-[#0f0000]/12 hover:bg-[#f1eeee]"
                    )}
                  >
                    <span>{getPresetIcon(presetNum)}</span>
                    <span className="truncate max-w-[80px]">{getPresetName(presetNum)}</span>
                    {activeDeckPreset === presetNum && (
                      <span aria-hidden="true">*</span>
                    )}
                  </button>

                  {/* ID 427: Rename & Icon Edit Button for Active Preset */}
                  {activeDeckPreset === presetNum && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingPresetNum(presetNum);
                        setPresetNameEdit(getPresetName(presetNum));
                        setPresetIconEdit(getPresetIcon(presetNum));
                      }}
                      className="min-w-11 min-h-11 rounded-sm text-[#646262] hover:bg-[#f1eeee] transition-colors"
                      title="프리셋 이름/아이콘 수정"
                    >
                      ✏️
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ID 477: Dynamic Deck Synergy & Weakness Advisory Tag */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs leading-relaxed px-1 py-2 border-t border-[#0f0000]/12">
          <div className="flex flex-wrap items-center gap-1.5 text-[#646262]">
            <span className="text-[#201d1d] font-bold">⚠️ [상성 점검]</span>
            <span>
              {currentDeck.some(c => c.element === 'WATER')
                ? '밸런스 양호 (수/화/지/풍 포진)'
                : '수속성 카드 부재: 화속성 덱 상대 시 취약할 수 있습니다.'}
            </span>
          </div>
          <span className="text-[#646262] font-bold">5장 시너지 풀</span>
        </div>

        {/* ID 427: Inline Edit Modal / Drawer */}
        {editingPresetNum !== null && (
          <div className="p-3 bg-[#fdfcfc] rounded-none border border-[#0f0000]/12 flex flex-wrap items-center gap-2 mt-1">
            <span className="text-xs font-bold text-[#201d1d]">DECK {editingPresetNum} 설정:</span>
            {/* Icon Picker */}
            <div className="flex gap-1">
              {['⚔️', '🛡️', '🔥', '💧', '🌿', '⚡', '👑'].map((ic) => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => setPresetIconEdit(ic)}
                  className={`min-h-11 min-w-11 p-2 rounded-sm text-sm border ${presetIconEdit === ic ? 'bg-[#201d1d] text-[#fdfcfc] border-[#201d1d]' : 'bg-[#f8f7f7] text-[#201d1d] border-[#0f0000]/12'}`}
                >
                  {ic}
                </button>
              ))}
            </div>
            {/* Name Input */}
            <input
              type="text"
              maxLength={10}
              value={presetNameEdit}
              onChange={(e) => setPresetNameEdit(e.target.value)}
              placeholder="덱 이름 (최대 10자)"
              className="min-h-11 px-3 py-2 bg-[#fdfcfc] border border-[#0f0000]/12 rounded-sm text-xs text-[#201d1d] max-w-[140px]"
            />
            <button
              type="button"
              onClick={() => handleSavePresetMeta(editingPresetNum)}
              className="min-h-11 px-3 py-2 bg-[#201d1d] hover:bg-[#302c2c] text-[#fdfcfc] rounded-sm text-xs font-bold"
            >
              저장
            </button>
            <button
              type="button"
              onClick={() => setEditingPresetNum(null)}
              className="min-h-11 px-3 py-2 bg-[#fdfcfc] border border-[#0f0000]/12 text-[#646262] rounded-sm text-xs font-bold"
            >
              취소
            </button>
          </div>
        )}
        </div>
      </details>

      <div className="flex flex-col gap-4 md:gap-6">
        <div className="flex flex-col items-center gap-3 sm:gap-4 w-full">
          {/* Active Deck Header Bar with Compact Synergy Button */}
          <div className="flex items-center justify-between flex-wrap gap-2 w-full max-w-4xl px-1 sm:px-2 pt-1 pb-1 font-mono">
            <button type="button"
              onClick={() => {
                playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                triggerHaptic('light');
                setActiveQuickSlot(null);
                setSelectingIndex(0);
                setSelectionContext('replace');
                setIsPopupOpen(true);
              }}
              className="min-h-11 flex flex-wrap items-center gap-2 px-3 py-2 border border-[#0f0000]/12 rounded-sm bg-[#fdfcfc] cursor-pointer group select-none hover:bg-[#f1eeee] transition-colors text-left"
              title={language === 'ko' ? '출전 덱 첫 번째 카드 선택 리스트 열기' : 'Open Deck Card Selection List'}
            >
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#201d1d]">
                {language === 'ko' ? '출전 덱 (5장)' : 'Active Deck (5 Cards)'}
              </span>
              <span className="text-[10px] font-bold text-[#201d1d] bg-[#f8f7f7] px-1.5 py-0.5 rounded-sm border border-[#0f0000]/12">
                {language === 'ko' ? '[카드 선택]' : '[SELECT]'}
              </span>
              <span className="text-[10px] text-[#646262] hidden xs:inline">
                {language === 'ko' ? '· 클릭하여 카드 선택' : '· Click to select card'}
              </span>
            </button>

            {/* Compact Synergy Modal Trigger Button */}
            <button
              type="button"
              onClick={() => {
                setIsSynergyModalOpen(true);
                playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
              }}
              className="min-h-11 inline-flex items-center gap-2 px-3 py-2 rounded-sm border border-[#0f0000]/12 bg-[#fdfcfc] hover:bg-[#f1eeee] text-[#201d1d] text-xs font-bold transition-colors cursor-pointer font-mono"
              title={language === 'ko' ? '덱 시너지 및 프리셋 팝업 열기' : 'Open Synergy & Presets Popup'}
            >
              <Sparkles size={12} className="text-[#201d1d] shrink-0" />
              <span>{language === 'ko' ? '시너지 효과' : 'Synergy Info'}</span>
              <ChevronRight size={11} className="text-[#646262]" />
            </button>
          </div>



          {/* SCR-03: 골든 시너지 아우라 & 덱 슬롯 컨테이너 (3/2 2줄 구조 및 좌우 슬라이드 100% 완전 배제) */}
          <div 
            id="deck-list" 
            className={cn(
              "mx-auto flex flex-col items-center justify-center gap-2.5 sm:gap-4 md:gap-6 w-full max-w-full px-2 sm:px-3 py-4 border rounded-none overflow-x-hidden touch-pan-y overscroll-x-none",
              (deckElementSynergyActive || factionSynergy) && !lowSpecMode
                ? "border-[#201d1d] bg-[#f1eeee]"
                : "bg-[#f8f7f7] border-[#0f0000]/12"
            )}
          >
          <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext 
              items={currentDeckWithSkins.map(c => c.id)}
              strategy={rectSortingStrategy}
            >
              {/* 상단 1행: 3장 (SLOT 1, 2, 3) */}
              <div className="flex flex-nowrap justify-center items-center gap-2 sm:gap-4 md:gap-6 w-full">
                {currentDeckWithSkins.slice(0, 3).map((card, idx) => (
                  <SortableCardItem 
                    key={card.id}
                    card={card}
                    idx={idx}
                    handleCardClick={handleCardClick}
                    setItemManageIndex={setItemManageIndex}
                    setIsItemModalOpen={setIsItemModalOpen}
                    setEditingCardIndex={setEditingCardIndex}
                    setEditName={setEditName}
                    setEditNotes={setEditNotes}
                    iconMap={iconMap}
                    language={language}
                    customCardImage={customCardImage}
                    unequipItem={unequipItem}
                    representativeCardId={representativeCardId}
                    representativePetCardId={representativePetCardId}
                    activeQuickSlot={activeQuickSlot}
                    setActiveQuickSlot={setActiveQuickSlot}
                    setSelectingIndex={setSelectingIndex}
                    setIsPopupOpen={setIsPopupOpen}
                    setSelectedCardForDetail={setSelectedCardForDetail}
                    setCardDetailTab={setCardDetailTab}
                    isSynergyActive={Boolean(factionSynergy && String((card as any)?.element || CARD_DATABASE[card?.imageIndex || 0]?.element || 'WATER').toUpperCase() === factionSynergy.element)}
                    synergyElement={factionSynergy?.element}
                    isShaking={shakingSlotIndices.includes(idx)}
                  />
                ))}
              </div>

              {/* 하단 2행: 2장 (SLOT 4, 5) */}
              <div className="flex flex-nowrap justify-center items-center gap-2 sm:gap-4 md:gap-6 w-full">
                {currentDeckWithSkins.slice(3, 5).map((card, i) => {
                  const idx = i + 3;
                  return (
                    <SortableCardItem 
                      key={card.id}
                      card={card}
                      idx={idx}
                      handleCardClick={handleCardClick}
                      setItemManageIndex={setItemManageIndex}
                      setIsItemModalOpen={setIsItemModalOpen}
                      setEditingCardIndex={setEditingCardIndex}
                      setEditName={setEditName}
                      setEditNotes={setEditNotes}
                      iconMap={iconMap}
                      language={language}
                      customCardImage={customCardImage}
                      unequipItem={unequipItem}
                      representativeCardId={representativeCardId}
                      representativePetCardId={representativePetCardId}
                      activeQuickSlot={activeQuickSlot}
                      setActiveQuickSlot={setActiveQuickSlot}
                      setSelectingIndex={setSelectingIndex}
                      setIsPopupOpen={setIsPopupOpen}
                      setSelectedCardForDetail={setSelectedCardForDetail}
                      setCardDetailTab={setCardDetailTab}
                      isSynergyActive={Boolean(factionSynergy && String((card as any)?.element || CARD_DATABASE[card?.imageIndex || 0]?.element || 'WATER').toUpperCase() === factionSynergy.element)}
                      synergyElement={factionSynergy?.element}
                      isShaking={shakingSlotIndices.includes(idx)}
                    />
                  );
                })}
              </div>
            </SortableContext>

            <DragOverlay dropAnimation={{
              sideEffects: defaultDropAnimationSideEffects({
                styles: {
                  active: {
                    opacity: '0.5',
                  },
                },
              }),
            }}>
              {activeId ? (
                <div className="flex flex-col items-center gap-2">
                   <div className="text-[10px] sm:text-xs font-black text-black/30 uppercase tracking-tighter opacity-0">
                    IDLE
                  </div>
                  <CardItem 
                    card={currentDeck.find(c => c.id === activeId)!} 
                    className="w-20 h-28 sm:w-24 sm:h-32 md:w-32 md:h-44 scale-105 rounded-none border border-[#201d1d]"
                    customImage={customCardImage}
                    />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
          </div>
          

        </div>
        
        {/* SCR-03: 통합 덱 커맨드 허브 (AI 편성, 인벤토리·육성, 프리셋·도구, 도감·상성) */}
        <DeckCommandHub
          language={language}
          onOptimizeDeck={handleOptimizeDeck}
          onAutoFillOptimalSynergy={handleAutoFillOptimalSynergy}
          onCompareCards={() => {
            if (currentDeck.length >= 2) {
              setCompareCardA(currentDeck[0]);
              setCompareCardB(currentDeck[1]);
              setIsCompareModalOpen(true);
            }
          }}
          onOpenSynergyModal={() => {
            setIsSynergyModalOpen(true);
            playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
          }}
          onOpenInventory={() => {
            setSelectionContext('replace');
            setSelectingIndex(null);
            setIsPopupOpen(true);
            playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
          }}
          onOpenEquipment={() => {
            setSelectionContext('equipment');
            setIsPopupOpen(true);
            playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
          }}
          onOpenCombine={() => {
            setIsCombineModalOpen(true);
            playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
          }}
          onOpenHeroNurture={() => {
            setSelectionContext('upgrade');
            setIsPopupOpen(true);
            playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
          }}
          onOpenCardUpgrade={() => {
            playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
            setSelectedCompanionIndex(0);
            onNavigate('skill');
          }}
          activeDeckPreset={activeDeckPreset}
          onSwitchDeckPreset={handleSwitchDeckPreset}
          onOpenPresetCode={() => setIsDeckPresetCodeModalOpen(true)}
          onShareDeck={() => {
            playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
            const cardIndices = currentDeck.map(c => c.imageIndex || 0);
            const nickname = user?.displayName || 'SNSMaster';
            window.history.pushState({}, '', `/share?id=${encodeURIComponent(nickname)}&card1=${cardIndices[0]||0}&card2=${cardIndices[1]||0}&card3=${cardIndices[2]||0}&card4=${cardIndices[3]||0}&card5=${cardIndices[4]||0}`);
            onNavigate('share');
          }}
          onOpen3DViewer={() => {
            playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
            setIs3DDeckViewerOpen(true);
          }}
          onOpenDisassemble={() => {
            playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
            setIsDisassembleModalOpen(true);
          }}
          onOpenElementAdvantage={() => {
            playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
            setIsElementAdvantageOpen(true);
          }}
          onOpenAchievements={() => {
            setIsAchievementsModalOpen(true);
            playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
          }}
          achievementProgressPercent={Math.round((unlockedAchievements.length / ALL_ACHIEVEMENTS.length) * 100)}
          inventoryCount={inventory.length}
        />
      </div>


      {/* Card Combine Modal */}
      {isCombineModalOpen && (
        <CardCombineModal
          isOpen={isCombineModalOpen}
          onClose={() => setIsCombineModalOpen(false)}
          language={language}
          inventory={inventory}
          setInventory={setInventory}
          updateSns={updateSns}
          playSfx={playSfx}
          customCardImage={customCardImage}
          syncUserData={syncUserData}
          user={user}
          stats={stats}
          currentDeck={currentDeck}
          itemInventory={itemInventory}
          totalPower={globalTotalPower}
          isAutoBattle={isAutoBattle}
          lowSpecMode={lowSpecMode}
          sns={sns}
        />
      )}


      <div className="border border-[#0f0000]/12 rounded-none bg-[#f8f7f7] p-4 sm:p-5 space-y-4">
        <h3 className="font-bold flex items-center gap-2 text-sm">
          <Package size={14} className="sm:w-4 sm:h-4" />
          {t('battle_stats', language)}
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-px bg-[#0f0000]/12 border border-[#0f0000]/12 rounded-none overflow-hidden">
          <div 
            className="bg-[#fdfcfc] p-3 sm:p-5 md:p-6 cursor-pointer hover:bg-[#f1eeee] transition-colors"
            onClick={() => setShowDeckPowerDetails(true)}
            title="Click to see details"
          >
            <span className="text-[#646262] flex items-center gap-1 text-xs sm:text-sm font-bold mb-1.5 sm:mb-2">
              {t('deck_power', language)} <Info size={12} className="sm:w-3.5 sm:h-3.5 opacity-50" />
            </span>
            <span className={cn("font-bold tracking-tight truncate block", String(deckPower.toLocaleString()).length > 8 ? "text-lg sm:text-xl" : String(deckPower.toLocaleString()).length > 5 ? "text-xl sm:text-2xl" : "text-2xl sm:text-3xl")} title={deckPower.toLocaleString()}>
              {deckPower.toLocaleString()}
            </span>
            <div className="text-[9px] sm:text-[10px] text-[#646262] mt-1.5 sm:mt-2">
              * {t('deck_tp_guide', language)}
            </div>
          </div>
          <div 
            className="bg-[#fdfcfc] p-3 sm:p-5 md:p-6 cursor-pointer hover:bg-[#f1eeee] transition-colors"
            onClick={() => setShowTotalPowerDetails(true)}
            title="Click to see details"
          >
            <span className="text-[#646262] flex items-center gap-1 text-xs sm:text-sm font-bold mb-1.5 sm:mb-2">
              {t('total_power', language)} <Info size={12} className="sm:w-3.5 sm:h-3.5 opacity-50" />
            </span>
            <span className={cn("font-bold tracking-tight truncate block", String(calculatedTotalPower.toLocaleString()).length > 8 ? "text-lg sm:text-xl" : String(calculatedTotalPower.toLocaleString()).length > 5 ? "text-xl sm:text-2xl" : "text-2xl sm:text-3xl")} title={calculatedTotalPower.toLocaleString()}>
              {calculatedTotalPower.toLocaleString()}
            </span>
            <div className="text-[9px] sm:text-[10px] text-[#646262] mt-1.5 sm:mt-2">
              * {t('all_cards_tp_guide', language)}
            </div>
          </div>

          <div className="bg-[#fdfcfc] p-3 sm:p-5 md:p-6">
            <span className="text-[#646262] block text-xs sm:text-sm font-bold mb-1.5 sm:mb-2">{t('unique_cards', language)}</span>
            <span className={cn("font-bold tracking-tight truncate block", String(uniqueCount).length > 8 ? "text-lg sm:text-xl" : String(uniqueCount).length > 5 ? "text-xl sm:text-2xl" : "text-2xl sm:text-3xl")} title={String(uniqueCount)}>{uniqueCount}</span>
            <div className="text-[9px] sm:text-[10px] text-[#646262] mt-1.5 sm:mt-2">
              * {t('types_owned_guide', language)}
            </div>
          </div>

          <div className="bg-[#fdfcfc] p-3 sm:p-5 md:p-6">
            <span className="text-[#646262] block text-xs sm:text-sm font-bold mb-1.5 sm:mb-2">{t('total_cards', language)}</span>
            <span className={cn("font-bold tracking-tight truncate block", String(totalCount).length > 8 ? "text-lg sm:text-xl" : String(totalCount).length > 5 ? "text-xl sm:text-2xl" : "text-2xl sm:text-3xl")} title={String(totalCount)}>{totalCount}</span>
            <div className="text-[9px] sm:text-[10px] text-[#646262] mt-1.5 sm:mt-2">
              * {t('all_duplicates_guide', language)}
            </div>
          </div>

          <div className="bg-[#fdfcfc] p-3 sm:p-5 md:p-6 flex flex-col justify-between">
            <div>
              <span className="text-[#646262] block text-xs sm:text-sm font-bold mb-1.5 sm:mb-2">{t('win_rate', language)}</span>
              <span className={cn("font-bold tracking-tight truncate block", (() => {
                  const total = stats.wins + stats.losses + stats.draws;
                  const val = total > 0 ? ((stats.wins / total) * 100).toFixed(1) : "0.0";
                  return val.length > 5 ? "text-xl sm:text-2xl" : "text-2xl sm:text-3xl";
              })())}>
                {(() => {
                  const total = stats.wins + stats.losses + stats.draws;
                  return total > 0 ? ((stats.wins / total) * 100).toFixed(1) : "0.0";
                })()}%
              </span>
            </div>
            <div className="flex flex-col gap-1 sm:gap-1.5 mt-2 border-t border-[#0f0000]/12 pt-2 w-full">
              <div className="flex justify-between items-center min-w-0">
                <div className="flex items-baseline gap-1">
                  <span className="text-base sm:text-lg lg:text-xl font-bold text-[#201d1d] truncate">{stats.wins}</span>
                  <span className="text-[9px] sm:text-[10px] font-bold text-[#646262]">{t('wins_unit', language)}</span>
                </div>
                {stats.winStreak > 0 && (
                  <span className="text-[9px] sm:text-[10px] font-bold text-[#201d1d] truncate">{stats.winStreak} {t('win_streak', language)} 🔥</span>
                )}
              </div>
              <div className="flex justify-between items-center min-w-0">
                <div className="flex items-baseline gap-1">
                  <span className="text-base sm:text-lg lg:text-xl font-bold text-[#201d1d] truncate">{stats.losses}</span>
                  <span className="text-[9px] sm:text-[10px] font-bold text-[#646262]">{t('losses_unit', language)}</span>
                </div>
                {stats.lossStreak > 0 && (
                  <span className="text-[9px] sm:text-[10px] font-bold text-[#646262] truncate">{stats.lossStreak} {t('loss_streak', language)} 🌧️</span>
                )}
              </div>
              <div className="flex justify-between items-center min-w-0">
                <div className="flex items-baseline gap-1">
                  <span className="text-base sm:text-lg lg:text-xl font-bold text-[#201d1d] truncate">{stats.draws}</span>
                  <span className="text-[9px] sm:text-[10px] font-bold text-[#646262]">{t('draws_unit', language)}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-[#fdfcfc] p-3 sm:p-5 md:p-6 flex flex-col justify-between">
            <div>
              <span className="text-[#646262] block text-xs sm:text-sm font-bold mb-1.5 sm:mb-2">{t('magic_chance', language)}</span>
              <span className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight text-[#201d1d] block">
                Total: {(20 + itemMagicChanceBonus + (currentDeck.reduce((acc, card) => {
                  if (!card) return acc;
                  const s = card.skills?.find(skill => skill.effect.type === 'special');
                  if (!s) return acc;
                  return acc + (s.effect.value * Math.floor((s.level + 1) / 6));
                }, 0) * 100)).toFixed(0)}%
              </span>
            </div>
            <div className="text-[9px] sm:text-[10px] text-[#646262] mt-2 sm:mt-4 font-bold">
              Base {t('magic_chance', language)}: 20%<br />
              + Item Bonus: {itemMagicChanceBonus.toFixed(0)}%<br />
              + Skill Bonus: {(currentDeck.reduce((acc, card) => {
                if (!card) return acc;
                const s = card.skills?.find(skill => skill.effect.type === 'special');
                if (!s) return acc;
                return acc + (s.effect.value * Math.floor((s.level + 1) / 6));
              }, 0) * 100).toFixed(0)}% (Lucky Draw)
            </div>
          </div>
        </div>

      </div>

      <div className="flex flex-col gap-4 md:gap-5">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
              onNavigate('wiki-card');
            }}
            className="min-h-[44px] px-4 py-2.5 bg-[#fdfcfc] border border-[#0f0000]/12 text-[#201d1d] text-xs font-bold rounded-sm hover:bg-[#f1eeee] transition-colors cursor-pointer flex items-center gap-1.5"
            aria-label={t('home_view_codex', language)}
          >
            <BookOpen size={14} />
            <span>{t('home_view_codex', language)}</span>
            <ArrowRight size={12} className="text-[#646262]" />
          </button>
          <button
            onClick={() => {
              playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
              onNavigate('webtoon');
            }}
            className="min-h-[44px] px-4 py-2.5 bg-[#fdfcfc] border border-[#0f0000]/12 text-[#201d1d] text-xs font-bold rounded-sm hover:bg-[#f1eeee] transition-colors cursor-pointer flex items-center gap-1.5"
            aria-label={t('home_webtoon_read', language)}
          >
            <BookOpen size={14} />
            <span>{t('home_webtoon_read', language)}</span>
            <ArrowRight size={12} className="text-[#646262]" />
          </button>
          <button
            onClick={() => {
              playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
              onNavigate('shop');
            }}
            className="min-h-[44px] px-4 py-2.5 bg-[#201d1d] border border-[#201d1d] text-[#fdfcfc] text-xs font-bold rounded-sm hover:bg-[#302c2c] transition-colors cursor-pointer flex items-center gap-1.5"
            aria-label={t('home_get_card', language)}
          >
            <Package size={14} />
            <span>{t('home_get_card', language)}</span>
            <ArrowRight size={12} className="text-[#fdfcfc]/70" />
          </button>
        </div>
      </div>


      <AnimatePresence>
        {isItemModalOpen && itemManageIndex !== null && currentDeck[itemManageIndex] && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80000] flex items-center justify-center p-4 bg-black/70 font-mono"
            onClick={() => {
              setIsItemModalOpen(false);
              setItemManageIndex(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="bg-[#fdfcfc] border border-[#0f0000]/12 rounded-none w-full max-w-md overflow-hidden flex flex-col max-h-[80vh] relative text-[#201d1d]"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-4 border-b border-[#0f0000]/12 flex justify-between items-center bg-[#f8f7f7]">
                <h3 className="text-base font-bold flex items-center gap-2">
                  <Package size={18} />
                  {t('inventory', language)}
                </h3>
                <button 
                  onClick={() => {
                    setIsItemModalOpen(false);
                    setItemManageIndex(null);
                  }} 
                  className="hover:bg-[#f1eeee] p-2 rounded-sm transition-colors z-[999999] min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer text-[#646262] hover:text-[#201d1d] border border-[#0f0000]/12 bg-[#fdfcfc]"
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Slot Tabs */}
              <div className="flex flex-wrap gap-2 p-3 bg-[#f8f7f7] border-b border-[#0f0000]/12">
                {(['necklace', 'ring1', 'ring2', 'boots'] as const).map(slot => (
                  <button
                    key={slot}
                    onClick={() => setItemSlotTab(slot)}
                    className={cn(
                      "min-h-[44px] px-3 py-2 text-xs font-bold uppercase rounded-sm border transition-colors whitespace-nowrap cursor-pointer",
                      itemSlotTab === slot 
                        ? "bg-[#201d1d] text-[#fdfcfc] border-[#201d1d]" 
                        : "bg-[#fdfcfc] text-[#646262] border-[#0f0000]/12 hover:bg-[#f1eeee]"
                    )}
                  >
                    {slot}
                  </button>
                ))}
              </div>

              {/* Item List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {(() => {
                    const currentItem = currentDeck[itemManageIndex]?.equipment?.[itemSlotTab];
                    
                    const availableItems = displayItemInventory.filter(item => {
                      if (item.equippedToId) return false;
                      const isRing = (s: string) => s === 'ring' || s === 'ring1' || s === 'ring2';
                      if (isRing(item.slot) && isRing(itemSlotTab)) return true;
                      return item.slot === itemSlotTab;
                    });

                    // Group by imageIndex to show quantities
                    const groupedAvailable = availableItems.reduce((acc, item) => {
                      const key = item.imageIndex || 0;
                      if (!acc[key]) {
                        acc[key] = { ...item, quantity: 0, ids: [] };
                      }
                      acc[key].quantity++;
                      acc[key].ids.push(item.id);
                      return acc;
                    }, {} as Record<number, any>);

                    const finalItems = Object.values(groupedAvailable);

                    const renderStatLabel = (s: number, i: number) => {
                      if (s === 0) return null;
                      const labels = ['N', 'E', 'S', 'W'];
                      return (
                        <span key={i} className={cn(
                          "text-[9px] font-bold px-1.5 py-0.5 rounded-sm border transition-colors",
                          s > 0 ? "bg-[#f8f7f7] border-[#201d1d] text-[#201d1d]" : 
                          "bg-[#fdfcfc] border-[#0f0000]/12 text-[#646262]"
                        )}>
                          {labels[i]}:{s > 0 ? '+'+s : s}
                        </span>
                      );
                    };

                    return (
                      <>
                        {/* Currently Equipped */}
                        <div className="space-y-2">
                           <div className="text-[10px] font-bold text-[#646262] uppercase tracking-wider">{t('equipment', language)}</div>
                            {currentItem ? (
                              <div className="p-3 rounded-none border border-[#201d1d] bg-[#f8f7f7] flex justify-between items-center group transition-colors">
                                 <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-none flex items-center justify-center overflow-hidden border border-[#0f0000]/12 bg-[#fdfcfc] shrink-0">
                                       <ItemIcon imageIndex={currentItem.imageIndex} size={32} />
                                    </div>
                                    <div>
                                       <div className="flex items-center gap-2">
                                         <p className="text-xs font-bold">{language === 'ko' ? currentItem.name_ko : currentItem.name_en}</p>
                                         <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-none border border-[#201d1d] bg-[#201d1d] text-[#fdfcfc] shrink-0">
                                           {t(`rarity_${currentItem.rarity}` as any, language) || currentItem.rarity}
                                         </span>
                                       </div>
                                       <div className="flex flex-wrap gap-1 mt-1">
                                          {currentItem.stats.map((s: number, i: number) => renderStatLabel(s, i))}
                                          {currentItem.magicChance && (
                                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-sm border border-[#0f0000]/12 bg-[#fdfcfc] text-[#201d1d]">
                                              M:+{currentItem.magicChance}%
                                            </span>
                                          )}
                                       </div>
                                    </div>
                                 </div>
                                 <button 
                                   onClick={() => unequipItem(currentItem.id, itemManageIndex, itemSlotTab)}
                                   className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[#646262] hover:text-[#201d1d] hover:bg-[#f1eeee] rounded-sm transition-colors cursor-pointer"
                                 >
                                   <X size={14} />
                                 </button>
                              </div>
                            ) : (
                             <div className="p-4 border border-dashed border-[#0f0000]/12 rounded-none text-center text-xs text-[#646262]">
                                {t('no_items', language)}
                             </div>
                           )}
                        </div>

                        {/* Inventory Items */}
                        <div className="space-y-2">
                           <div className="text-[10px] font-bold text-[#646262] uppercase tracking-wider">{t('available', language)}</div>
                           <div className="space-y-2">
                              {finalItems.length === 0 ? (
                                <div className="text-center py-6 text-xs text-[#646262] border border-dashed border-[#0f0000]/12 rounded-none">
                                   {t('no_items', language)}
                                </div>
                              ) : (
                                finalItems.map((group: any) => (
                                  <button
                                    key={group.ids[0]}
                                    onClick={() => equipItem(group.ids[0], itemManageIndex, itemSlotTab)}
                                    className="w-full p-3 border border-[#0f0000]/12 bg-[#fdfcfc] hover:bg-[#f8f7f7] hover:border-[#201d1d] rounded-none text-left flex justify-between items-center transition-colors group cursor-pointer"
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-none flex items-center justify-center overflow-hidden border border-[#0f0000]/12 bg-[#f8f7f7] shrink-0">
                                        <ItemIcon imageIndex={group.imageIndex} size={32} />
                                      </div>
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <p className="text-xs font-bold">
                                            {language === 'ko' ? group.name_ko : group.name_en}
                                          </p>
                                          <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-none border border-[#0f0000]/12 bg-[#f8f7f7] text-[#201d1d] shrink-0">
                                            {t(`rarity_${group.rarity}` as any, language) || group.rarity}
                                          </span>
                                          <span className="text-[10px] text-[#201d1d] font-bold">x{group.quantity}</span>
                                        </div>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                          {group.stats.map((s: number, i: number) => renderStatLabel(s, i))}
                                          {group.magicChance && (
                                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-sm border border-[#0f0000]/12 bg-[#f8f7f7] text-[#201d1d]">
                                              M:+{group.magicChance}%
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    <Plus size={14} className="text-[#646262] group-hover:text-[#201d1d] transition-colors" />
                                  </button>
                                ))
                              )}
                           </div>
                        </div>
                      </>
                    )
                  })()}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isPopupOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/75 z-[80000] flex items-center justify-center p-2 sm:p-6 cursor-pointer"
            onClick={() => {
              setIsPopupOpen(false);
              setSelectingIndex(null);
              setSelectionContext('replace');
            }}
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-[#fdfcfc] text-[#201d1d] w-full max-w-5xl h-[92dvh] rounded-none border border-[#0f0000]/12 flex flex-col overflow-hidden font-mono relative cursor-default"
            >
              {/* Top-Right High-Visibility Floating Close Button (항상 최상위 표시) */}
              <button
                type="button"
                onClick={() => {
                  playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
                  setIsPopupOpen(false);
                  setSelectingIndex(null);
                  setSelectionContext('replace');
                }}
                className="absolute top-3 right-3 sm:top-4 sm:right-4 z-[999999] flex items-center justify-center w-11 h-11 rounded-sm bg-[#201d1d] text-[#fdfcfc] hover:bg-[#302c2c] cursor-pointer transition-colors"
                aria-label="Close"
                title={language === 'ko' ? '닫기' : 'Close'}
              >
                <X size={24} />
              </button>

              <div className="p-4 sm:p-6 border-b border-[#0f0000]/12 flex flex-col gap-4 items-start bg-[#fdfcfc] relative pr-16 max-h-[45dvh] overflow-y-auto shrink-0">
                <div className="space-y-1 pr-8">
                  <h3 className="text-xl sm:text-2xl font-bold tracking-tight leading-none">
                    {selectionContext === 'upgrade' 
                      ? (t('hero_nurture', language) || '업그레이드할 카드를 선택하세요') 
                      : selectionContext === 'equipment' 
                        ? (language === 'ko' ? '아이템을 장착할 카드를 선택하세요' : 'Select Card for Equipment') 
                        : selectionContext === 'customize'
                          ? (language === 'ko' ? '덱 구성하기 (최대 5장)' : 'Customize Deck (Max 5)')
                          : selectingIndex !== null
                            ? (language === 'ko' ? `슬롯 ${selectingIndex + 1}에 장착할 카드 선택` : `Select Card for Slot ${selectingIndex + 1}`)
                            : (language === 'ko' ? '보유 카드 인벤토리' : 'Card Inventory')}
                  </h3>
                  <p className="text-xs sm:text-sm font-bold opacity-40 tracking-normal italic">
                    {selectionContext === 'customize' 
                      ? (language === 'ko' ? '카드를 클릭하여 덱에 추가하거나 제거하세요.' : 'Click cards to add or remove from your battle deck.')
                      : selectionContext === 'replace'
                        ? (language === 'ko' ? '카드를 클릭하여 상세 확인 및 덱 슬롯에 장착하세요.' : 'Click a card to view details and equip to deck.')
                        : t('deck_select_guide', language)}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row flex-wrap gap-4 w-full sm:w-auto mt-2 sm:mt-0">
                  {selectionContext !== 'upgrade' && selectionContext !== 'equipment' && (
                    <label className="min-h-11 flex items-center gap-3 cursor-pointer bg-[#fdfcfc] border border-[#0f0000]/12 px-3 py-2 rounded-sm hover:bg-[#f1eeee] transition-colors">
                      <input 
                        type="checkbox" 
                        checked={showOwnedOnly}
                        onChange={(e) => setShowOwnedOnly(e.target.checked)}
                        className="w-4 h-4 min-w-[20px] min-h-[20px] rounded-none border-gray-300 text-black focus:ring-black cursor-pointer"
                      />
                      <span className="text-xs font-bold whitespace-nowrap">{t('owned_only', language)}</span>
                    </label>
                  )}

                  <details className="w-full min-w-0 rounded-none border border-[#0f0000]/12 bg-[#f8f7f7]">
                    <summary className="min-h-11 px-3 py-3 text-xs font-bold cursor-pointer">{t('details', language)}</summary>
                  <div className="flex flex-wrap p-2 gap-1">
                    {[
                      { id: 'recent', label: language === 'ko' ? '최근' : 'NEW' },
                      { id: 'index', label: 'ID' },
                      { id: 'level', label: 'LV' },
                      { id: 'power', label: 'POW' },
                      { id: 'rarity', label: 'RAR' },
                      { id: 'stats_total', label: 'STATS' },
                      { id: 'name', label: 'NAME' }
                    ].map(opt => (
                      <button 
                        key={opt.id}
                        onClick={() => {
                          if (sortBy === opt.id) {
                            setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
                          } else {
                            setSortBy(opt.id as any);
                            setSortOrder('desc');
                          }
                        }}
                        className={cn(
                          "min-h-11 min-w-11 px-3 py-2 text-xs font-bold rounded-sm transition-colors whitespace-nowrap flex items-center gap-1",
                          sortBy === opt.id ? "bg-[#201d1d] text-[#fdfcfc]" : "bg-transparent text-[#646262] hover:bg-[#f1eeee]"
                        )}
                      >
                        {opt.label}
                        {sortBy === opt.id && (sortOrder === 'asc' ? <ArrowUp size={8} /> : <ArrowDown size={8} />)}
                      </button>
                    ))}
                    {/* ID 362: 상하좌우 4방향 퀵 정렬 버튼 */}
                    <div className="flex items-center gap-0.5 border-l border-gray-300 pl-1">
                      <button
                        onClick={() => { setSortBy('dir_up'); setSortOrder('desc'); }}
                        className={cn("min-h-11 min-w-11 p-2 text-xs font-bold rounded-sm cursor-pointer", sortBy === 'dir_up' ? "bg-[#201d1d] text-[#fdfcfc]" : "bg-[#f1eeee] text-[#646262]")}
                        title="상단 스탯 높은순 정렬"
                      >
                        ▲
                      </button>
                      <button
                        onClick={() => { setSortBy('dir_right'); setSortOrder('desc'); }}
                        className={cn("min-h-11 min-w-11 p-2 text-xs font-bold rounded-sm cursor-pointer", sortBy === 'dir_right' ? "bg-[#201d1d] text-[#fdfcfc]" : "bg-[#f1eeee] text-[#646262]")}
                        title="우측 스탯 높은순 정렬"
                      >
                        ▶
                      </button>
                      <button
                        onClick={() => { setSortBy('dir_down'); setSortOrder('desc'); }}
                        className={cn("min-h-11 min-w-11 p-2 text-xs font-bold rounded-sm cursor-pointer", sortBy === 'dir_down' ? "bg-[#201d1d] text-[#fdfcfc]" : "bg-[#f1eeee] text-[#646262]")}
                        title="하단 스탯 높은순 정렬"
                      >
                        ▼
                      </button>
                      <button
                        onClick={() => { setSortBy('dir_left'); setSortOrder('desc'); }}
                        className={cn("min-h-11 min-w-11 p-2 text-xs font-bold rounded-sm cursor-pointer", sortBy === 'dir_left' ? "bg-[#201d1d] text-[#fdfcfc]" : "bg-[#f1eeee] text-[#646262]")}
                        title="좌측 스탯 높은순 정렬"
                      >
                        ◀
                      </button>
                    </div>

                    {/* ID 387: 메타 카운터 추천 버튼 */}
                    <button
                      onClick={() => { setSortBy('meta_counter'); setSortOrder('desc'); }}
                      className={cn(
                        "min-h-11 px-3 py-2 text-xs font-bold rounded-sm transition-colors flex items-center gap-2 cursor-pointer",
                        sortBy === 'meta_counter' ? "bg-[#201d1d] text-[#fdfcfc]" : "bg-[#fdfcfc] text-[#646262] border border-[#0f0000]/12 hover:bg-[#f1eeee]"
                      )}
                      title="메타 상성 카운터 픽 추천"
                    >
                      <Shield size={10} />
                      <span>{language === 'ko' ? '카운터' : 'COUNTER'}</span>
                    </button>
                  </div>
                  </details>
                </div>
              </div>

              {/* ── Item 44: Card Search Bar & Element Filter Chips ── */}
              <div className="px-4 sm:px-6 py-3 space-y-3 border-b border-[#0f0000]/12 bg-[#f8f7f7] max-h-[32dvh] overflow-y-auto shrink-0">
                <div className="flex flex-col items-stretch gap-3">
                  <div className="relative flex-1 w-full">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={cardSearchQuery}
                      onChange={(e) => setCardSearchQuery(e.target.value)}
                      placeholder={language === 'ko' ? '카드 이름 또는 설명 검색...' : 'Search card name or lore...'}
                      className="min-h-11 w-full pl-9 pr-12 py-3 bg-[#fdfcfc] border border-[#0f0000]/12 rounded-sm text-sm text-[#201d1d] focus:outline-none focus:border-[#201d1d] transition-colors"
                    />
                    {cardSearchQuery && (
                      <button
                        onClick={() => setCardSearchQuery('')}
                        className="absolute right-0 top-1/2 -translate-y-1/2 min-h-11 min-w-11 flex items-center justify-center text-[#646262] hover:text-[#201d1d]"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  {/* Element Chips */}
                  <div className="flex flex-wrap items-center gap-1.5 w-full">
                    {[
                      { id: 'ALL', labelKo: '전체', labelEn: 'ALL', color: 'bg-slate-800 text-white border-slate-700' },
                      { id: 'WATER', labelKo: '수(水)', labelEn: 'Water', color: 'bg-blue-500 text-white border-blue-600' },
                      { id: 'FIRE', labelKo: '화(火)', labelEn: 'Fire', color: 'bg-rose-500 text-white border-rose-600' },
                      { id: 'EARTH', labelKo: '지(地)', labelEn: 'Earth', color: 'bg-emerald-600 text-white border-emerald-700' },
                      { id: 'WIND', labelKo: '풍(風)', labelEn: 'Wind', color: 'bg-teal-500 text-white border-teal-600' },
                      { id: 'HOLY', labelKo: '빛(聖)', labelEn: 'Holy', color: 'bg-amber-400 text-amber-950 border-amber-500' },
                      { id: 'DARK', labelKo: '암(闇)', labelEn: 'Dark', color: 'bg-purple-900 text-purple-100 border-purple-800' }
                    ].map(chip => (
                      <button
                        key={chip.id}
                        onClick={() => setSelectedElementFilter(chip.id as any)}
                        className={cn(
                          "min-h-11 px-3 py-2 text-xs font-bold rounded-sm border transition-colors whitespace-nowrap cursor-pointer",
                          selectedElementFilter === chip.id
                            ? "bg-[#201d1d] text-[#fdfcfc] border-[#201d1d]"
                            : "bg-[#fdfcfc] text-[#646262] border-[#0f0000]/12 hover:bg-[#f1eeee]"
                        )}
                      >
                        {language === 'ko' ? chip.labelKo : chip.labelEn}
                      </button>
                    ))}
                  </div>

                  {/* ID 352: 역할 & 희귀도 다중 교차 필터 칩 바 */}
                  <details className="w-full border-t border-[#0f0000]/12 text-xs font-mono" open={selectedRoleFilter !== 'ALL' || selectedRarityFilter !== 'ALL' ? true : undefined}>
                    <summary className="min-h-11 py-3 cursor-pointer font-bold">{t('details', language)}</summary>
                  <div className="flex flex-wrap items-center gap-2 pb-2">
                    {/* 역할 필터 */}
                    <div className="flex flex-wrap items-center gap-1 bg-[#fdfcfc] border border-[#0f0000]/12 p-1 rounded-none">
                      <span className="text-gray-400 pl-1">{language === 'ko' ? '역할:' : 'Role:'}</span>
                      {[
                        { id: 'ALL', label: 'ALL' },
                        { id: 'ATTACK', label: language === 'ko' ? '공격형' : 'ATK' },
                        { id: 'DEFENSE', label: language === 'ko' ? '방어형' : 'DEF' },
                      ].map((r) => (
                        <button
                          key={r.id}
                          onClick={() => setSelectedRoleFilter(r.id as any)}
                          className={cn(
                            "min-h-11 min-w-11 px-3 py-2 rounded-sm font-bold cursor-pointer transition-colors",
                            selectedRoleFilter === r.id ? "bg-[#201d1d] text-[#fdfcfc]" : "text-[#646262] hover:bg-[#f1eeee]"
                          )}
                        >
                          {r.label}
                        </button>
                      ))}
                    </div>

                    {/* 희귀도 필터 */}
                    <div className="flex flex-wrap items-center gap-1 bg-[#fdfcfc] border border-[#0f0000]/12 p-1 rounded-none">
                      <span className="text-gray-400 pl-1">{language === 'ko' ? '등급:' : 'Rarity:'}</span>
                      {['ALL', 'SSR', 'SR', 'R', 'N'].map((rar) => (
                        <button
                          key={rar}
                          onClick={() => setSelectedRarityFilter(rar as any)}
                          className={cn(
                            "min-h-11 min-w-11 px-3 py-2 rounded-sm font-bold cursor-pointer transition-colors",
                            selectedRarityFilter === rar ? "bg-[#201d1d] text-[#fdfcfc]" : "text-[#646262] hover:bg-[#f1eeee]"
                          )}
                        >
                          {rar}
                        </button>
                      ))}
                    </div>
                  </div>
                  </details>
                </div>
              </div>

              {/* ID 412: 인벤토리 자동 스크롤 타깃 ID */}
              <div id="mydeck-card-inventory-grid" className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 scrollbar-thin scrollbar-thumb-black">
                <div className="grid grid-cols-2 min-[380px]:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-x-3 gap-y-6 justify-items-center">
                  {processedCards.slice(0, visibleCardLimit).map((item) => {
                    const { idx, card, power, isOwned, isInDeck } = item;
                    const previewCard = card;

                    // ID 392: 추천 슬롯 포지션 계산
                    const u = previewCard.stats?.up || previewCard.stats?.[0] || 0;
                    const r = previewCard.stats?.right || previewCard.stats?.[1] || 0;
                    const d = previewCard.stats?.down || previewCard.stats?.[2] || 0;
                    const l = previewCard.stats?.left || previewCard.stats?.[3] || 0;
                    const diff = Math.max(u, r, d, l) - Math.min(u, r, d, l);
                    const slotTag = diff <= 2 ? '[Center]' : (u >= 6 && r >= 6 ? '[Corner]' : '[Edge]');

                    return (
                      <div key={idx} className={cn("min-w-0 flex flex-col items-center gap-2 group/card", !isOwned && "opacity-60 grayscale")}>
                        {/* ID 392: 추천 포지션 가이드 태그 */}
                        <span className="text-[8px] font-mono text-[#646262] bg-[#f8f7f7] px-1 rounded-none border border-[#0f0000]/12">
                          {slotTag}
                        </span>
                        <div className="relative">
                          <CardItem 
                            card={previewCard}
                            onClick={() => {
                              if (!isOwned) return;
                              
                              if (selectionContext === 'customize') {
                                toggleDeckCard(idx);
                                return;
                              }

                              if (selectionContext === 'upgrade' || selectionContext === 'equipment') {
                                const deckIdx = (item as any).deckIdx !== undefined 
                                  ? (item as any).deckIdx 
                                  : currentDeck.findIndex((c) => c && c.imageIndex === idx);

                                if (deckIdx !== -1) {
                                  setSelectedCompanionIndex(deckIdx);
                                  if (selectionContext === 'upgrade') {
                                    onNavigate('skill');
                                  } else {
                                    setItemManageIndex(deckIdx);
                                    setIsItemModalOpen(true);
                                  }
                                  setIsPopupOpen(false);
                                } else {
                                  if (selectionContext === 'upgrade') {
                                    showCustomAlert?.(
                                      language === 'ko' ? '선택 불가' : 'Unavailable',
                                      language === 'ko' ? '덱에 편성된 카드만 선택 가능합니다.' : 'Only cards in the deck can be selected.'
                                    );
                                    return;
                                  }
                                  setSelectionContext('replace');
                                }
                                setIsPopupOpen(false);
                                setSelectionContext('replace');
                              } else if (selectingIndex !== null) {
                                selectMasterCard(idx, selectingIndex);
                              } else {
                                const invData = inventory[idx];
                                const detailCard: CardData = {
                                  id: `detail-${idx}`,
                                  title_dis: CARD_DATABASE[idx]?.title_dis || `Unit_${idx}`,
                                  stats: [...(CARD_DATABASE[idx]?.stats || [1,1,1,1])],
                                  rarity: CARD_DATABASE[idx]?.rarity || 'bronze',
                                  level: invData?.level || 1,
                                  imageIndex: idx,
                                  owner: null,
                                  power: CARD_DATABASE[idx]?.power || 0,
                                  growth: invData?.growth || 0,
                                  skills: invData?.skills,
                                  equipment: invData?.equipment || {}
                                };
                                setSelectedCardForDetail(detailCard);
                              }
                            }}
                            className={cn(
                              "w-20 h-28 sm:w-24 sm:h-32 md:w-28 md:h-40 transition-all cursor-pointer hover:ring-2 hover:ring-[#201d1d]",
                              isInDeck && "ring-2 ring-[#201d1d] ring-offset-2"
                            )}
                            customImage={customCardImage}
                            lowSpecMode={true}
                            />
                          {isInDeck && (
                            <div className="absolute inset-0 border-2 border-[#201d1d] rounded-sm flex items-end justify-center pointer-events-none z-10">
                              <div className="bg-[#201d1d] text-[#fdfcfc] text-[10px] font-bold w-full text-center px-2 py-1">
                                IN DECK
                              </div>
                            </div>
                          )}
                          
                          {/* Bottom Right: Status Icons (Equipment/Skills) */}
                          <div className="absolute bottom-0 right-0 flex gap-0.5 p-1 z-20 pointer-events-none">
                            {inventory[idx]?.equipment && Object.keys(inventory[idx].equipment).length > 0 && (
                              <div className="bg-[#201d1d] text-[#fdfcfc] p-0.5 rounded-none border border-[#fdfcfc]/50">
                                <Package size={8} />
                              </div>
                            )}
                            {inventory[idx]?.skills && inventory[idx].skills.some((s: any) => s.level > 1) && (
                              <div className="bg-[#201d1d] text-[#fdfcfc] p-0.5 rounded-none border border-[#fdfcfc]/50">
                                <Zap size={8} />
                              </div>
                            )}
                          </div>

                          {/* Top Right: Quantity & Upgradeable Badges (Row 1064 / ID 327) */}
                          {isOwned && inventory[idx] && (
                            <div className="absolute -top-1 -right-1 flex flex-col items-end gap-0.5 z-30 pointer-events-none">
                              <div className="bg-[#201d1d] text-[#fdfcfc] text-xs font-bold px-1.5 min-w-6 h-6 flex items-center justify-center border border-[#fdfcfc] rounded-sm">
                                x{inventory[idx].quantity}
                              </div>
                              {inventory[idx].quantity >= 2 && (
                                <span className="px-1.5 py-1 text-[10px] font-bold bg-[#f1eeee] text-[#201d1d] border border-[#0f0000]/12 rounded-none">
                                  {language === 'ko' ? '승급가능' : 'Upgrade'}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <span className="text-xs font-bold text-[#201d1d] w-20 sm:w-24 md:w-28 text-center leading-relaxed break-words mt-1">
                          {CARD_DATABASE[idx]?.title_dis || `UNIT_${idx}`}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* ID 110: Virtualized Load More Cards Button for DOM Optimization */}
                {processedCards.length > visibleCardLimit && (
                  <div className="mt-6 flex justify-center">
                    <button
                      onClick={() => setVisibleCardLimit(prev => prev + 40)}
                      className="min-h-11 px-6 py-3 rounded-sm bg-[#201d1d] border border-[#201d1d] text-[#fdfcfc] font-mono text-xs font-bold hover:bg-[#302c2c] transition-colors cursor-pointer"
                    >
                      {language === 'ko' 
                        ? `카드 더 보기 (+40개) [${visibleCardLimit}/${processedCards.length}]` 
                        : `Load More Cards (+40) [${visibleCardLimit}/${processedCards.length}]`}
                    </button>
                  </div>
                )}
              </div>

              {/* Customization mode footer/info */}
              {selectionContext === 'customize' && (
                <div className="p-6 bg-[#201d1d] border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-6 relative shrink-0 font-mono">
                  {/* Floating Notification */}
                  <AnimatePresence>
                    {selectMessage && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute -top-12 left-1/2 -translate-x-1/2 bg-[#201d1d] text-[#fdfcfc] border border-[#fdfcfc]/30 px-4 py-2 rounded-sm text-xs font-bold z-50 whitespace-nowrap"
                      >
                        {selectMessage}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 bg-[#fdfcfc] rounded-none" />
                      <h4 className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#fdfcfc]/60">Active_Combat_Formation</h4>
                    </div>
                    <div className="flex flex-wrap gap-2 pb-2 justify-center">
                      {[0, 1, 2, 3, 4].map(idx => {
                        const card = currentDeck[idx];
                        return (
                          <div key={idx} className={cn(
                            "w-12 h-16 rounded-none border flex items-center justify-center shrink-0 transition-all",
                            card ? "border-[#fdfcfc] bg-white/10" : "border-white/20 bg-white/5 border-dashed"
                          )}>
                             {card ? (
                               <CardItem card={card} isLocked={true} className="w-full h-full scale-110" customImage={customCardImage} lowSpecMode={true} />
                             ) : (
                               <Plus size={16} className="text-white/20" />
                             )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <button 
                    onClick={() => {
                      setIsPopupOpen(false);
                      setSelectionContext('replace');
                    }}
                    id="confirm-deck-btn"
                    className="w-full sm:w-auto min-h-[44px] px-10 py-3 bg-[#fdfcfc] hover:bg-[#f1eeee] text-[#201d1d] rounded-sm font-bold uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    {language === 'ko' ? '완료' : 'DONE'}
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Deck Power Detail Modal */}
      {showDeckPowerDetails && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/75 z-[80000] flex items-center justify-center p-4 font-mono"
          onClick={() => setShowDeckPowerDetails(false)}
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            onClick={e => e.stopPropagation()}
            className="bg-[#fdfcfc] text-[#201d1d] w-full max-w-sm rounded-none p-6 border border-[#0f0000]/12 relative"
          >
            <div className="flex justify-between items-center mb-3 pb-2 border-b border-[#0f0000]/12">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Trophy size={16} className="text-[#201d1d]" />
                {t('deck_power', language)} {t('details', language)}
              </h3>
              <button 
                type="button"
                onClick={() => setShowDeckPowerDetails(false)} 
                className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-sm bg-[#201d1d] text-[#fdfcfc] hover:bg-[#302c2c] transition-colors z-[999999] cursor-pointer"
                aria-label="Close"
              >
                <X size={18}/>
              </button>
            </div>

            {(() => {
              let totalBase = 0;
              let totalSkill = 0;
              let totalEquip = 0;

              currentDeck.forEach(card => {
                if (!card) return;
                const dbCard = CARD_DATABASE[card.imageIndex || 0];
                totalBase += dbCard?.power || 0;
                totalSkill += getSkillPointBonus(card);
                if (card.equipment) {
                  Object.values(card.equipment).forEach((item: any) => {
                    if (item?.stats) totalEquip += item.stats.reduce((a:number,b:number)=>a+b,0);
                  });
                }
              });

              // Element Synergy Check (Item 52)
              const elements = currentDeck.map(c => String((c as any)?.element || CARD_DATABASE[c?.imageIndex || 0]?.element || 'WATER').toUpperCase());
              const elementCounts: Record<string, number> = {};
              elements.forEach(e => { elementCounts[e] = (elementCounts[e] || 0) + 1; });
              const maxSharedElementCount = Math.max(...Object.values(elementCounts), 0);
              const hasSynergy = maxSharedElementCount >= 3;
              const synergyBonus = hasSynergy ? Math.floor((totalBase + totalSkill + totalEquip) * 0.1) : 0;
              const grandTotalTP = totalBase + totalSkill + totalEquip + synergyBonus;

              return (
                <>
                  {/* Category Summary Bars */}
                  <div className="p-3 bg-[#201d1d] text-[#fdfcfc] rounded-none border border-[#201d1d] mb-3 space-y-2 text-xs font-mono">
                    <div className="flex justify-between items-center border-b border-white/15 pb-1.5">
                      <span className="text-[#fdfcfc]/70">{language === 'ko' ? '카드 기본 스탯 합' : 'Base Stats Sum'}</span>
                      <span className="font-bold text-[#fdfcfc]">{totalBase.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-white/15 pb-1.5">
                      <span className="text-[#fdfcfc]/70">{language === 'ko' ? '스킬 강화 보너스' : 'Skill Node Bonus'}</span>
                      <span className="font-bold text-[#fdfcfc]">+{totalSkill.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-white/15 pb-1.5">
                      <span className="text-[#fdfcfc]/70">{language === 'ko' ? '장비 아이템 보너스' : 'Equipment Bonus'}</span>
                      <span className="font-bold text-[#fdfcfc]">+{totalEquip.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[#fdfcfc]/70 flex items-center gap-1">
                        <Sparkles size={12} className="text-[#fdfcfc]" />
                        {language === 'ko' ? '동일 속성 시너지 (3장+)' : 'Mono-Element Synergy (+10%)'}
                      </span>
                      <span className={cn("font-bold", hasSynergy ? "text-[#fdfcfc]" : "text-[#fdfcfc]/40")}>
                        {hasSynergy ? `+${synergyBonus}` : (language === 'ko' ? '미적용' : 'Inactive')}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4 max-h-[35vh] overflow-y-auto pr-1">
                    {currentDeck.map((card, i) => {
                      const total = getCardPower(card);
                      const dbCard = CARD_DATABASE[card.imageIndex || 0];
                      const basePower = dbCard?.power || 0;
                      const bonus = getSkillPointBonus(card);
                      
                      let ep = 0;
                      if (card.equipment) {
                        Object.values(card.equipment).forEach((item: any) => {
                          if (item?.stats) ep += item.stats.reduce((a:number,b:number)=>a+b,0);
                        });
                      }
                      
                      return (
                        <div key={i} className="flex justify-between items-center text-xs p-2.5 bg-[#f8f7f7] border border-[#0f0000]/12 rounded-none">
                          <div className="flex flex-col min-w-0 pr-2">
                            <span className="truncate font-bold text-[#201d1d]">{i+1}. {getFormattedCardName({ ...card, imageIndex: card.imageIndex || 0 }, language)}</span>
                            <div className="flex flex-wrap gap-1 mt-0.5">
                              <span className="text-[9px] text-[#646262] font-bold bg-[#fdfcfc] border border-[#0f0000]/12 px-1 rounded-none">{t('base', language)} {basePower}</span>
                              {bonus > 0 && <span className="text-[9px] text-[#201d1d] font-bold bg-[#fdfcfc] border border-[#0f0000]/12 px-1 rounded-none">+{bonus}</span>}
                              {ep > 0 && (
                                <span className="text-[9px] text-[#201d1d] font-bold bg-[#fdfcfc] border border-[#0f0000]/12 px-1 rounded-none">+{ep}</span>
                              )}
                            </div>
                          </div>
                          <span className="font-bold text-[#201d1d] text-sm shrink-0">+{total}</span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t border-[#201d1d] font-bold text-base text-[#201d1d]">
                    <span>{language === 'ko' ? '총 전투력 (Grand TP)' : 'Grand Total TP'}:</span>
                    <span className="text-xl text-[#201d1d]">{grandTotalTP.toLocaleString()}</span>
                  </div>
                </>
              );
            })()}
          </motion.div>
        </motion.div>
      )}

      {/* Total Power Detail Modal */}
      {showTotalPowerDetails && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/75 z-[80000] flex items-center justify-center p-4 font-mono"
          onClick={() => setShowTotalPowerDetails(false)}
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            onClick={e => e.stopPropagation()}
            className="bg-[#fdfcfc] text-[#201d1d] w-full max-w-md rounded-none p-6 border border-[#0f0000]/12 relative"
          >
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-[#0f0000]/12">
              <h3 className="font-bold text-base">{t('total_power', language)} Detail</h3>
              <button 
                type="button"
                onClick={() => setShowTotalPowerDetails(false)} 
                className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-sm bg-[#201d1d] text-[#fdfcfc] hover:bg-[#302c2c] transition-colors z-[999999] cursor-pointer"
                aria-label="Close"
              >
                <X size={18}/>
              </button>
            </div>
            <p className="text-xs text-[#646262] mb-4">* {language === 'ko' ? '총 TP = 소유한 모든 카드의 (파워 × 보유 수량) 총합' : 'Total TP = Sum of all owned cards (Power × Qty)'}</p>
            <div className="space-y-2 mb-4 max-h-[50vh] overflow-y-auto pr-2">
              {Object.entries(inventory).sort((a,b)=> Number(a[0])-Number(b[0])).map(([idx, record]) => {
                const cardIdx = Number(idx);
                const dbCard = CARD_DATABASE[cardIdx];
                if (!dbCard || (record as InventoryRecord).quantity <= 0) return null;
                
                const deckInstance = currentDeck.find(c => c.imageIndex === cardIdx);
                const cardObj = {
                  ...dbCard,
                  skills: deckInstance?.skills || (dbCard as any).skills,
                  equipment: deckInstance?.equipment || (dbCard as any).equipment
                } as any;
                const unitPower = getCardPower(cardObj);
                const basePower = dbCard.power || 0;
                const skillBonus = getSkillPointBonus(cardObj);
                let equipBonus = 0;
                if (cardObj.equipment) {
                  Object.values(cardObj.equipment).forEach((item: any) => {
                    if (item?.stats) equipBonus += item.stats.reduce((a:number,b:number)=>a+b,0);
                  });
                }

                const qty = (record as InventoryRecord).quantity;
                const total = unitPower * qty;
                return (
                  <div key={idx} className="flex justify-between items-center text-xs p-3 bg-[#f8f7f7] border border-[#0f0000]/12 rounded-none">
                    <div className="flex flex-col w-1/2">
                      <span className="truncate font-bold text-[#201d1d]">{getFormattedCardName(dbCard, language)}</span>
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        <span className="text-[10px] text-[#646262] font-bold bg-[#fdfcfc] border border-[#0f0000]/12 px-1 rounded-none">B:{basePower}</span>
                        {skillBonus > 0 && <span className="text-[10px] text-[#201d1d] font-bold bg-[#fdfcfc] border border-[#0f0000]/12 px-1 rounded-none">S:+{skillBonus}</span>}
                        {equipBonus > 0 && <span className="text-[10px] text-[#201d1d] font-bold bg-[#fdfcfc] border border-[#0f0000]/12 px-1 rounded-none">E:+{equipBonus}</span>}
                      </div>
                    </div>
                    <span className="text-[#646262] text-xs px-2 font-bold">{Math.round(unitPower)} × {qty}</span>
                    <span className="font-bold text-[#201d1d] min-w-[60px] text-right text-sm">+{Math.round(total)}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-[#201d1d] font-bold text-base text-[#201d1d]">
              <span>TOTAL:</span>
              <span>{calculatedTotalPower.toLocaleString()}</span>
            </div>
          </motion.div>
        </motion.div>
      )}

      <AnimatePresence>
        {editingCardIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80000] flex items-center justify-center bg-black/75 p-4 font-mono"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#fdfcfc] text-[#201d1d] w-full max-w-lg rounded-none overflow-hidden flex flex-col border border-[#0f0000]/12 font-mono"
            >
              <div className="bg-[#201d1d] text-[#fdfcfc] p-5 flex justify-between items-center border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#fdfcfc] rounded-sm text-[#201d1d]">
                    <Edit2 size={18} />
                  </div>
                  <div>
                    <h3 className="text-base md:text-lg font-bold uppercase tracking-tight">{t('edit_card_details', language)}</h3>
                    <p className="text-[10px] opacity-60 font-bold uppercase tracking-widest">SLOT_{editingCardIndex + 1}</p>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => setEditingCardIndex(null)} 
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-sm transition-colors z-[999999] cursor-pointer text-[#fdfcfc]"
                  aria-label="Close"
                >
                  <X />
                </button>
              </div>

              <div className="p-6 space-y-6">
                 <div className="flex justify-center mb-4">
                    <CardItem 
                      card={currentDeck[editingCardIndex]!} 
                      className="w-32 h-44" 
                      customImage={customCardImage} />
                 </div>

                 <div className="space-y-4">
                    <div className="space-y-1.5 font-mono">
                      <label className="text-[10px] font-bold uppercase text-[#646262] ml-1">{t('card_custom_name', language)}</label>
                      <input 
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder={t('name_placeholder', language)}
                        className="w-full bg-[#f8f7f7] border border-[#0f0000]/12 rounded-sm px-4 py-3 text-sm font-medium focus:border-[#201d1d] outline-none transition-colors"
                      />
                    </div>
                    <div className="space-y-1.5 font-mono">
                      <label className="text-[10px] font-bold uppercase text-[#646262] ml-1">{t('card_notes', language)}</label>
                      <textarea 
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        placeholder={t('notes_placeholder', language)}
                        rows={4}
                        className="w-full bg-[#f8f7f7] border border-[#0f0000]/12 rounded-sm px-4 py-3 text-sm font-medium focus:border-[#201d1d] outline-none transition-colors resize-none"
                      />
                    </div>
                 </div>

                 <div className="flex gap-3 pt-4">
                    <button 
                      onClick={() => setEditingCardIndex(null)}
                      className="flex-1 min-h-[44px] py-3 bg-[#f8f7f7] border border-[#0f0000]/12 text-[#201d1d] font-bold uppercase text-xs rounded-sm hover:bg-[#f1eeee] transition-colors cursor-pointer"
                    >
                      {t('back', language)}
                    </button>
                    <button 
                      onClick={() => {
                        const newDeck = [...currentDeck];
                        newDeck[editingCardIndex] = {
                          ...newDeck[editingCardIndex],
                          customName: editName,
                          notes: editNotes
                        };
                        updateDeck(newDeck);
                        setEditingCardIndex(null);
                      }}
                      className="flex-1 min-h-[44px] py-3 bg-[#201d1d] text-[#fdfcfc] font-bold uppercase text-xs rounded-sm hover:bg-[#302c2c] transition-colors cursor-pointer"
                    >
                      {t('save', language)}
                    </button>
                 </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedCardForDetail && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80000] flex items-center justify-center p-4 bg-black/80 overflow-y-auto font-mono"
            onClick={() => setSelectedCardForDetail(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#fdfcfc] text-[#201d1d] w-[95%] md:w-[90vw] h-[95vh] md:h-[90vh] rounded-none border border-[#0f0000]/12 overflow-hidden flex flex-col md:flex-row relative"
              onClick={e => e.stopPropagation()}
            >
              {/* Close Button Top (항상 최상위 표시) */}
              <button 
                type="button"
                onClick={() => setSelectedCardForDetail(null)}
                className="absolute top-3 right-3 sm:top-4 sm:right-4 z-[999999] flex items-center justify-center min-w-[44px] min-h-[44px] w-11 h-11 rounded-sm bg-[#201d1d] text-[#fdfcfc] hover:bg-[#302c2c] border border-[#201d1d] cursor-pointer touch-target transition-colors"
                aria-label="Close"
                title={language === 'ko' ? '닫기' : 'Close'}
              >
                <X size={22} strokeWidth={2.5} className="text-[#fdfcfc]" />
              </button>

              {/* Left Side: Card Visual & Stats */}
              <div className="w-full md:w-1/2 bg-[#f8f7f7] flex flex-col items-center justify-center p-6 gap-4 border-b md:border-b-0 md:border-r border-[#0f0000]/12 shrink-0">
                <CardItem 
                  card={selectedCardForDetail} 
                  isLocked={true} 
                  className="w-32 h-44 scale-75" 
                  customImage={customCardImage} 
                  />
                
                <div className="w-full">
                   <div className="text-center">
                     <h3 className="text-xl font-bold uppercase tracking-tight leading-none">{getFormattedCardName(selectedCardForDetail, language)}</h3>
                     <div className="flex items-center justify-center gap-2 mt-2">
                        <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded-none border border-[#201d1d] bg-[#201d1d] text-[#fdfcfc]">
                          {selectedCardForDetail.rarity}
                        </span>
                        <span className="text-sm font-bold opacity-60">Lv.{selectedCardForDetail.level}</span>
                     </div>
                     {isSelectedCardPetEquipped ? (
                       <div className="mt-3 inline-flex items-center gap-2 rounded-sm border border-[#0f0000]/12 bg-[#fdfcfc] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#201d1d]">
                         <MonsterPetBadge cardId={selectedCardPetId} imageClassName="h-5 w-5" className="border-transparent bg-transparent p-0" />
                         <span>{t('monster_pet_badge', language)}</span>
                       </div>
                     ) : null}
                   </div>
                </div>
              </div>

              {/* Right Side: Tabified Content (ID 88) */}
              <div className="w-full md:w-1/2 p-6 flex flex-col min-h-0 bg-[#fdfcfc]">
                 {/* Segmented Tab Navigation Bar */}
                 <div className="flex border-b border-[#0f0000]/12 mb-4 pb-1 gap-1">
                   <button
                     onClick={() => setCardDetailTab('stats')}
                     className={cn(
                       "flex-1 py-2 text-center text-xs font-bold uppercase transition-colors rounded-sm border cursor-pointer",
                       cardDetailTab === 'stats' 
                         ? "border-[#201d1d] text-[#fdfcfc] bg-[#201d1d]" 
                         : "border-transparent text-[#646262] hover:bg-[#f1eeee]"
                     )}
                   >
                     {language === 'ko' ? '스탯 & 장비' : 'Stats & Gear'}
                   </button>
                   <button
                     onClick={() => setCardDetailTab('skills')}
                     className={cn(
                       "flex-1 py-2 text-center text-xs font-bold uppercase transition-colors rounded-sm border cursor-pointer",
                       cardDetailTab === 'skills' 
                         ? "border-[#201d1d] text-[#fdfcfc] bg-[#201d1d]" 
                         : "border-transparent text-[#646262] hover:bg-[#f1eeee]"
                     )}
                   >
                     {language === 'ko' ? '스킬 & 노드' : 'Skills & Nodes'}
                   </button>
                   <button
                     onClick={() => setCardDetailTab('lore')}
                     className={cn(
                       "flex-1 py-2 text-center text-xs font-bold uppercase transition-colors rounded-sm border cursor-pointer",
                       cardDetailTab === 'lore' 
                         ? "border-[#201d1d] text-[#fdfcfc] bg-[#201d1d]" 
                         : "border-transparent text-[#646262] hover:bg-[#f1eeee]"
                     )}
                   >
                     {language === 'ko' ? '스토리 & 아트' : 'Lore & Art'}
                   </button>
                 </div>

                 <div className="flex-1 overflow-y-auto space-y-6 pr-1 custom-scrollbar">
                    {/* TAB 1: STATS, EQUIPMENT, PET, HERO CARE */}
                    {cardDetailTab === 'stats' && (
                      <div className="space-y-5">
                        {/* Equipment */}
                        <div className="space-y-3 pb-2">
                          <h4 className="text-xs font-bold uppercase tracking-widest opacity-60 border-b border-[#0f0000]/12 pb-1 flex items-center gap-1">
                            <Package size={12} /> {t('equipment', language)}
                          </h4>
                          <div className="grid grid-cols-4 gap-2">
                             {(['necklace', 'ring1', 'ring2', 'boots'] as const).map(slot => {
                               const item = selectedCardForDetail.equipment?.[slot];
                               return (
                                 <div key={slot} className="flex flex-col items-center gap-1">
                                    <div className={cn(
                                      "w-12 h-12 rounded-none flex items-center justify-center border transition-colors",
                                      item ? "bg-[#f8f7f7] border-[#201d1d]" : "bg-[#f8f7f7] border-[#0f0000]/12 border-dashed"
                                    )}>
                                      {slot === 'necklace' ? (
                                        <Package size={20} className={item ? 'text-[#201d1d]' : 'opacity-20'} />
                                      ) : slot === 'boots' ? (
                                        <Footprints size={20} className={item ? 'text-[#201d1d]' : 'opacity-20'} />
                                      ) : (
                                        <Gem size={20} className={item ? 'text-[#201d1d]' : 'opacity-20'} />
                                      )}
                                    </div>
                                    <span className="text-[8px] font-bold uppercase text-[#646262]">{slot}</span>
                                 </div>
                               )
                             })}
                          </div>
                        </div>

                        {/* Monster Pet */}
                        <div className="space-y-3 rounded-none border border-[#0f0000]/12 bg-[#f8f7f7] p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <h4 className="text-xs font-bold uppercase tracking-widest text-[#201d1d] flex items-center gap-2">
                                <PawPrint size={12} />
                                {t('monster_pet_section_title', language)}
                              </h4>
                              <p className="mt-1 text-[11px] font-semibold text-[#646262] leading-relaxed">
                                {t('monster_pet_section_desc', language)}
                              </p>
                            </div>
                            {representativePetCardId ? (
                              <MonsterPetBadge
                                cardId={representativePetCardId}
                                imageClassName="h-7 w-7"
                                label={t('monster_pet_badge', language)}
                              />
                            ) : null}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold">
                            <span className={cn(
                              'rounded-none border px-2.5 py-1 uppercase tracking-wider',
                              isSelectedCardMonsterPetCandidate
                                ? 'border-[#201d1d] bg-[#fdfcfc] text-[#201d1d]'
                                : 'border-[#0f0000]/12 bg-[#fdfcfc] text-[#646262]'
                            )}>
                              {isSelectedCardMonsterPetCandidate
                                ? t(`monster_pet_candidate_${selectedMonsterPetGroup ?? 'monster'}`, language)
                                : t('monster_pet_candidate_none', language)}
                            </span>
                            <span className="rounded-none border border-[#0f0000]/12 bg-[#fdfcfc] px-2.5 py-1 text-[#646262]">
                              {representativeCardId
                                ? t('monster_pet_hint_target_ready', language)
                                : t('monster_pet_hint_profile_avatar', language)}
                            </span>
                          </div>
                          <div className="rounded-none border border-[#0f0000]/12 bg-[#fdfcfc] p-3 text-[11px] font-semibold text-[#646262] leading-relaxed">
                            {isSelectedCardPetEquipped
                              ? t('monster_pet_target_ready', language, { pet: getFormattedCardName(selectedCardForDetail, language) })
                              : isSelectedCardMonsterPetCandidate
                                ? t('monster_pet_hint_eligible', language)
                                : t('monster_pet_hint_ineligible', language)}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={handleSetMonsterPet}
                              disabled={!isSelectedCardMonsterPetCandidate || !representativeCardId || !selectedCardPetId || representativeCardId === selectedCardPetId}
                              className="flex items-center justify-center gap-2 min-h-[44px] rounded-sm bg-[#201d1d] px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-[#fdfcfc] transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <PawPrint size={14} />
                              {t('monster_pet_action_set', language)}
                            </button>
                            <button
                              type="button"
                              onClick={handleClearMonsterPet}
                              disabled={!representativePetCardId}
                              className="flex items-center justify-center gap-2 min-h-[44px] rounded-sm border border-[#0f0000]/12 bg-[#fdfcfc] px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-[#201d1d] transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <X size={14} />
                              {t('monster_pet_action_clear', language)}
                            </button>
                          </div>
                        </div>

                        {selectedHeroCareState && selectedHeroCareRewardStatus && (
                          <HeroCarePanel
                            card={selectedCardForDetail}
                            careState={selectedHeroCareState}
                            rewardStatus={selectedHeroCareRewardStatus}
                            language={language}
                            lowSpecMode={lowSpecMode}
                            snsBalance={sns}
                            onAction={handleHeroCareAction}
                            onClaimReward={handleHeroCareRewardClaim}
                            onQuickFeedPremium={handleHeroCarePremiumFeed}
                          />
                        )}
                      </div>
                    )}

                    {/* TAB 2: SKILLS & ABILITIES */}
                    {cardDetailTab === 'skills' && (
                      <div className="space-y-3">
                         <h4 className="text-xs font-bold uppercase tracking-widest opacity-60 border-b border-[#0f0000]/12 pb-1 flex items-center gap-1">
                           <Zap size={12} fill="currentColor" /> {t('skills', language)}
                         </h4>
                         <div className="space-y-2">
                            {(!selectedCardForDetail.skills || selectedCardForDetail.skills.filter((s: any) => s.level > 0).length === 0) ? (
                              <p className="text-[10px] font-bold opacity-40 italic">{t('no_skills_available', language) || 'No abilities discovered yet'}</p>
                            ) : (
                              selectedCardForDetail.skills.filter((s: any) => s.level > 0).map((skill: any) => {
                                const baseSkill = INITIAL_SKILLS.find(s => s.id === skill.id) || skill;
                                const Icon = iconMap[baseSkill.icon] || Zap;
                                return (
                                  <div key={skill.id} className="flex gap-3 p-3 bg-[#f8f7f7] rounded-none border border-[#0f0000]/12">
                                     <div className="flex-shrink-0 w-8 h-8 rounded-sm bg-[#201d1d] text-[#fdfcfc] flex items-center justify-center">
                                        <Icon size={16} />
                                     </div>
                                     <div className="min-w-0">
                                        <div className="flex justify-between items-center mb-0.5">
                                           <span className="text-[11px] font-bold uppercase leading-none">{language === 'ko' ? baseSkill.name : baseSkill.name_en}</span>
                                           <span className="text-[9px] font-bold text-[#201d1d] bg-[#fdfcfc] border border-[#0f0000]/12 px-1 rounded-none">Lv.{skill.level}</span>
                                        </div>
                                        <p className="text-[10px] font-bold text-[#646262] leading-tight">
                                          {language === 'ko' ? baseSkill.description : baseSkill.description_en}
                                        </p>
                                     </div>
                                  </div>
                                )
                              })
                            )}
                         </div>
                      </div>
                    )}

                    {/* TAB 3: LORE & ARTWORK */}
                    {cardDetailTab === 'lore' && (
                      <div className="space-y-4">
                        {(() => {
                          const dbCard = selectedCardForDetail.imageIndex !== undefined ? CARD_DATABASE[selectedCardForDetail.imageIndex] : null;
                          const loreText = language === 'ko' ? dbCard?.lore_ko : dbCard?.lore_en;
                          return (
                            <div className="space-y-3">
                              <h4 className="text-xs font-bold uppercase tracking-widest opacity-60 border-b border-[#0f0000]/12 pb-1 flex items-center gap-1">
                                <BookOpen size={12} /> {t('card_lore_title', language) || 'Card Lore & Story'}
                              </h4>
                              {loreText ? (
                                <div className="p-4 bg-[#f8f7f7] rounded-none border border-[#0f0000]/12">
                                  <p className="text-[11px] leading-relaxed font-medium text-[#201d1d] whitespace-pre-line">
                                    "{loreText}"
                                  </p>
                                </div>
                              ) : (
                                <p className="text-[10px] font-bold opacity-40 italic">No lore record found for this card.</p>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    )}
                 </div>

                  {/* Quick Slot Equip Controls */}
                  <div className="mt-4 pt-3 border-t border-[#0f0000]/12 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-[#646262]">
                      <span>{language === 'ko' ? '덱 슬롯에 장착하기' : 'Equip to Deck Slot'}</span>
                      {currentDeck.some(c => c && c.imageIndex === selectedCardForDetail.imageIndex) && (
                        <span className="text-[#201d1d] font-bold flex items-center gap-1">
                          ✓ {language === 'ko' ? `슬롯 ${currentDeck.findIndex(c => c && c.imageIndex === selectedCardForDetail.imageIndex) + 1} 장착 중` : 'Currently Equipped'}
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-5 gap-1.5">
                      {[0, 1, 2, 3, 4].map(slotIdx => {
                        const isThisSlot = currentDeck[slotIdx]?.imageIndex === selectedCardForDetail.imageIndex;
                        return (
                          <button
                            key={slotIdx}
                            onClick={() => {
                              selectMasterCard(selectedCardForDetail.imageIndex!, slotIdx);
                              setSelectedCardForDetail(null);
                              setIsPopupOpen(false);
                            }}
                            className={cn(
                              "min-h-[44px] py-2 px-1 text-center rounded-sm text-xs font-bold transition-colors cursor-pointer border",
                              isThisSlot
                                ? "bg-[#201d1d] text-[#fdfcfc] border-[#201d1d]"
                                : "bg-[#f8f7f7] hover:bg-[#f1eeee] text-[#201d1d] border-[#0f0000]/12"
                            )}
                          >
                            <div className="text-[9px] opacity-60 font-mono">SLOT</div>
                            <div>{slotIdx + 1}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                 {/* Bottom Action Buttons */}
                 <div className="mt-4 grid grid-cols-2 gap-3 shrink-0 pt-2 border-t border-[#0f0000]/12">
                    <button 
                      onClick={() => {
                        const deckIdx = currentDeck.findIndex(c => c.imageIndex === selectedCardForDetail.imageIndex);
                        if (deckIdx !== -1) {
                          setSelectedCompanionIndex(deckIdx);
                        } else {
                          setSelectedCompanionIndex(0);
                        }
                        onNavigate('companion');
                        setSelectedCardForDetail(null);
                      }}
                      className="min-h-[44px] py-3 bg-[#f8f7f7] hover:bg-[#f1eeee] border border-[#0f0000]/12 text-[#201d1d] rounded-sm font-bold uppercase tracking-wider text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <StarIcon size={16} />
                      {t('hero_nurture', language) || 'Growth'}
                    </button>
                    <button 
                      id="detail-equip-btn"
                      onClick={() => {
                        selectMasterCard(selectedCardForDetail.imageIndex!);
                        setSelectedCardForDetail(null);
                        setIsPopupOpen(false); 
                      }}
                      className="min-h-[44px] py-3 bg-[#201d1d] hover:bg-[#302c2c] text-[#fdfcfc] rounded-sm font-bold uppercase tracking-wider text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Zap size={16} fill="currentColor" />
                      {t('equip', language) || 'Equip'}
                    </button>
                 </div>
                 {/* RSI-014: Tactical Passive Perks Button */}
                 <div className="mt-2 shrink-0">
                   <button
                     onClick={() => {
                       triggerHaptic('tap');
                       setShowPerksModal(true);
                     }}
                     className="w-full min-h-[44px] py-3 bg-[#f8f7f7] hover:bg-[#f1eeee] border border-[#0f0000]/12 text-[#201d1d] rounded-sm font-mono font-bold uppercase tracking-wider text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                   >
                     <Sparkles size={16} className="text-[#201d1d]" />
                     <span>{language === 'ko' ? '전술 패시브 특성 소켓 (미니게임 배지)' : 'TACTICAL PASSIVE PERK SOCKETS'}</span>
                   </button>
                 </div>
                 <div className="mt-3 grid grid-cols-2 gap-3 shrink-0">
                   <button
                     onClick={() => {
                       playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                       onNavigate('world-codex');
                       setSelectedCardForDetail(null);
                     }}
                     className="min-h-[44px] py-3 bg-[#201d1d] hover:bg-[#302c2c] text-[#fdfcfc] rounded-sm font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 text-[11px] cursor-pointer"
                   >
                     <Users size={16} />
                     {t('story_deck_view_character', language)}
                   </button>
                   <button
                     onClick={() => {
                       playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                       onNavigate('webtoon');
                       setSelectedCardForDetail(null);
                     }}
                     className="min-h-[44px] py-3 bg-[#f8f7f7] hover:bg-[#f1eeee] text-[#201d1d] border border-[#0f0000]/12 rounded-sm font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 text-[11px] cursor-pointer"
                   >
                     <BookOpen size={16} />
                     {t('story_card_webtoon_cta', language)}
                   </button>
                 </div>
                 </div>
            </motion.div>
          </motion.div>
        )}

        {showOptimizeSuccessModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/75 font-mono"
            onClick={() => setShowOptimizeSuccessModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#fdfcfc] border border-[#0f0000]/12 p-8 rounded-none max-w-sm w-full space-y-6 text-center select-none font-mono"
              onClick={e => e.stopPropagation()}
            >
              <div className="mx-auto w-14 h-14 bg-[#201d1d] border border-[#201d1d] rounded-sm flex items-center justify-center">
                <Trophy size={24} className="text-[#fdfcfc]" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold uppercase tracking-tight text-[#201d1d] leading-none">
                  {language === 'ko' ? '최적화 완료!' : 'DECK OPTIMIZED!'}
                </h3>
                <p className="text-xs font-bold text-[#646262] leading-tight">
                  {t('deck_optimized_success', language)}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowOptimizeSuccessModal(false);
                }}
                className="w-full min-h-[44px] bg-[#201d1d] hover:bg-[#302c2c] text-[#fdfcfc] py-3 rounded-sm font-bold uppercase tracking-wider text-xs transition-colors cursor-pointer"
              >
                {language === 'ko' ? '확인' : 'OK'}
              </button>
            </motion.div>
          </motion.div>
        )}

        {isAchievementsModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80000] flex items-center justify-center p-4 bg-black/75 font-mono"
            onClick={() => setIsAchievementsModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#fdfcfc] text-[#201d1d] rounded-none w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] border border-[#0f0000]/12 font-mono relative"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-5 bg-[#201d1d] text-[#fdfcfc] flex justify-between items-center shrink-0 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#fdfcfc] text-[#201d1d] rounded-sm">
                    <Trophy size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold uppercase tracking-tight leading-none">{t('my_achievements', language)}</h3>
                    <p className="text-[10px] uppercase opacity-60 mt-1 tracking-widest">{t('achievements_desc', language)}</p>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => setIsAchievementsModalOpen(false)} 
                  className="hover:bg-white/20 p-2 rounded-sm transition-colors z-[999999] min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer text-[#fdfcfc]"
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex flex-wrap gap-2 p-4 bg-[#f8f7f7] border-b border-[#0f0000]/12 shrink-0">
                {(['all', 'battle', 'collection', 'growth', 'special', 'social'] as const).map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={cn(
                      "min-h-[38px] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-sm border transition-colors shrink-0 cursor-pointer",
                      activeCategory === cat ? "bg-[#201d1d] text-[#fdfcfc] border-[#201d1d]" : "bg-[#fdfcfc] text-[#646262] border-[#0f0000]/12 hover:bg-[#f1eeee]"
                    )}
                  >
                    {cat === 'all' ? (language === 'ko' ? '전체' : 'ALL') : t(`category_${cat}`, language)}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide bg-[#fdfcfc]">
                {ALL_ACHIEVEMENTS.filter(a => activeCategory === 'all' || a.category === activeCategory).map(achievement => {
                  const isUnlocked = unlockedAchievements.includes(achievement.id);
                  const progress = achievementProgress[achievement.id] || 0;
                  const percent = Math.min(100, (progress / achievement.targetValue) * 100);
                  
                  return (
                    <div 
                      key={achievement.id}
                      className={cn(
                        "p-4 rounded-none border transition-colors relative overflow-hidden group/ach font-mono",
                        isUnlocked ? "bg-[#f8f7f7] border-[#201d1d]" : "bg-[#fdfcfc] border-[#0f0000]/12 opacity-80 hover:opacity-100"
                      )}
                    >
                      <div className="flex justify-between items-start relative z-10">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {isUnlocked ? <StarIcon size={14} className="text-[#201d1d] fill-current" /> : <Shield size={14} className="text-[#646262]" />}
                            <h4 className="text-sm font-bold uppercase tracking-tight text-[#201d1d]">{achievement.title[language] || achievement.title['ko']}</h4>
                          </div>
                          <p className="text-[10px] font-bold text-[#646262] leading-tight pr-8">
                            {achievement.description[language] || achievement.description['ko']}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-[9px] font-bold uppercase mb-1 text-[#646262]">{t('reward', language)}</div>
                          <div className="flex items-center gap-1 justify-end mb-2">
                            <span className="text-xs font-bold text-[#201d1d]">+{achievement.rewardAmount}</span>
                            <span className="text-[9px] font-bold uppercase text-[#646262] tracking-tighter">{achievement.rewardType}</span>
                          </div>
                             {isUnlocked ? (
                               <div className="text-[9px] font-bold bg-[#201d1d] text-[#fdfcfc] border border-[#201d1d] px-2.5 py-1.5 rounded-sm uppercase flex items-center gap-1">
                                  <StarIcon size={8} className="text-[#fdfcfc]" />
                                  <span>{language === 'ko' ? '자동 수령완료' : 'AUTO CLAIMED'}</span>
                               </div>
                             ) : (
                               <div className="text-[9px] font-bold bg-[#f8f7f7] text-[#646262] border border-[#0f0000]/12 px-3 py-1.5 rounded-sm uppercase">
                                  {language === 'ko' ? '미달성' : 'LOCKED'}
                               </div>
                             )}
                        </div>
                      </div>

                      <div className="mt-4 h-1.5 bg-[#f1eeee] rounded-none overflow-hidden border border-[#0f0000]/12">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${percent}%` }}
                          className="h-full rounded-none bg-[#201d1d] transition-all duration-1000"
                        />
                      </div>
                      <div className="flex justify-between mt-2 px-1">
                        <span className="text-[8px] font-bold uppercase text-[#646262] tracking-widest">{t('achievement_progress', language)}</span>
                        <span className="text-[8px] font-bold text-[#646262]">
                          {progress.toLocaleString()} / {achievement.targetValue.toLocaleString()} ({percent.toFixed(0)}%)
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3D Active Deck VR Viewer Showcase Modal */}
      {is3DDeckViewerOpen && (
        <ArDeckViewer
          isOpen={is3DDeckViewerOpen}
          onClose={() => setIs3DDeckViewerOpen(false)}
          language={language}
          deckCards={currentDeck}
          inventory={inventory}
        />
      )}

      {/* Help Popup */}
      <AnimatePresence>
        {isHelpOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[209] flex items-center justify-center p-4 bg-black/75 font-mono"
            onClick={() => setIsHelpOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="rounded-none border border-[#0f0000]/12 bg-[#fdfcfc] text-[#201d1d] p-5 max-w-lg w-full font-mono"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4 sticky top-0 z-10 bg-[#fdfcfc] pt-1 pb-2 border-b border-[#0f0000]/12">
                <h3 className="text-base font-bold text-[#201d1d]">
                  {language === 'ko' ? '도움말' : 'Help'}
                </h3>
                <button
                  onClick={() => setIsHelpOpen(false)}
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-[#f1eeee] rounded-sm transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {helpStep === 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-[#201d1d]">
                    {language === 'ko' ? '간소화된 덱 관리' : 'Simplified Deck Management'}
                  </h4>
                  <p className="text-xs text-[#646262] leading-relaxed">
                    {language === 'ko'
                      ? '덱 관리 화면이 미니멀하게 재구성되었습니다. 불필요한 설명 텍스트와 배지가 제거되고, 핵심 기능(덱 편성, 최적화, 합성, 전투 통계)만 남았습니다.'
                      : 'The deck management screen has been redesigned with minimalism in mind. Unnecessary descriptions and badges have been removed, leaving only core features: deck composition, optimization, combining, and battle stats.'}
                  </p>
                </div>
              )}

              {helpStep === 1 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-[#201d1d]">
                    {language === 'ko' ? '오늘의 카드 / 추천 카드' : 'Today\'s Card / Recommended Cards'}
                  </h4>
                  <p className="text-xs text-[#646262] leading-relaxed">
                    {language === 'ko'
                      ? '오늘의 캐릭터와 팩션 추천 카드 섹션이 바로가기 버튼으로 대체되었습니다. 카드 백과, 웹툰, 상점으로 빠르게 이동할 수 있습니다.'
                      : 'The today\'s character and faction recommendation sections have been replaced with shortcut buttons. You can quickly navigate to the card wiki, webtoon, and shop.'}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between mt-5 pt-3 border-t border-[#0f0000]/12">
                <button
                  onClick={() => setHelpStep(prev => Math.max(0, prev - 1))}
                  disabled={helpStep === 0}
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-sm hover:bg-[#f1eeee] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="text-xs font-bold text-[#646262]">
                  {helpStep + 1} / 2
                </span>
                <button
                  onClick={() => setHelpStep(prev => Math.min(1, prev + 1))}
                  disabled={helpStep === 1}
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-sm hover:bg-[#f1eeee] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Card Disassemble / Scrap Modal (Item 32) */}
      <CardDisassembleModal
        isOpen={isDisassembleModalOpen}
        onClose={() => setIsDisassembleModalOpen(false)}
        ownedCards={ownedCards}
        currentDeckCardIds={currentDeck.map(c => c.imageIndex || Number(c.id) || 0)}
        language={language}
        onConfirmDisassemble={(selectedIds, totalRefundSns) => {
          updateSns(totalRefundSns, 'card-disassemble-refund');
          showCustomAlert?.(
            language === 'ko' ? '카드 분해 완료' : 'Disassemble Complete',
            language === 'ko' 
              ? `${selectedIds.length}장의 카드가 분해되어 +${totalRefundSns.toLocaleString()} SNS 포인트를 획득했습니다!`
              : `${selectedIds.length} cards disassembled for +${totalRefundSns.toLocaleString()} SNS Points!`
          );
        }}
        playSfx={playSfx}
      />

      {/* ── Deck Synergy & Smart Presets Modal ── */}
      <AnimatePresence>
        {isSynergyModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80000] flex items-center justify-center p-2.5 sm:p-4 bg-black/75 font-mono select-none"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setIsSynergyModalOpen(false);
              }
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-[#fdfcfc] dark:bg-[#181616] border border-[#0f0000]/12 dark:border-white/20 rounded-none w-full max-w-2xl max-h-[85dvh] flex flex-col overflow-hidden text-[#201d1d] dark:text-slate-100 relative"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-3.5 py-2.5 sm:px-4 sm:py-3 border-b border-[#0f0000]/12 dark:border-white/10 bg-[#f8f7f7] dark:bg-[#201d1d] shrink-0">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-sm bg-[#201d1d] text-[#fdfcfc] shrink-0">
                    <Sparkles size={16} />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold tracking-tight">
                      {language === 'ko' ? '덱 시너지 & 스마트 프리셋' : 'Deck Synergy & Smart Presets'}
                    </h3>
                    <p className="text-[10px] text-[#646262] dark:text-slate-400">
                      {language === 'ko'
                        ? '원소/종족 공명 점수 및 1-TAP 추천 덱 자동 완성'
                        : 'Elemental & Faction Resonance & 1-Tap Auto-Fill'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setIsVisualizerOpen(true);
                      playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                    }}
                    className="min-h-[36px] px-2.5 py-1 rounded-sm border border-[#0f0000]/12 bg-[#fdfcfc] text-[#201d1d] text-[10px] sm:text-[11px] font-bold hover:bg-[#f1eeee] transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles size={12} />
                    <span>{language === 'ko' ? '하모니 차트' : 'Harmony Chart'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsSynergyModalOpen(false)}
                    className="p-1.5 text-[#646262] hover:text-[#201d1d] dark:hover:text-white transition-colors cursor-pointer rounded-sm hover:bg-[#f1eeee] dark:hover:bg-white/10 z-[999999] min-w-[36px] min-h-[36px] flex items-center justify-center"
                    aria-label="Close"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Modal Body: Scrollable */}
              <div className="p-3 sm:p-4 overflow-y-auto flex-1 overscroll-contain space-y-3">
                {/* 1. Deck Chemistry Meter Widget */}
                <DeckChemistryMeter
                  deck={currentDeck as any}
                  language={language}
                />

                {/* 2. 덱 밸런스 레이더 차트 & 전투력 벤치마크 & 속성 시너지 게이지 */}
                <DeckBalanceRadarChart
                  deck={currentDeck as any}
                  language={language}
                />

                {/* 3. 덱 원소/종족 공명 점수 및 프리셋 계산기 */}
                <DeckSynergyCalculator
                  currentDeck={currentDeck}
                  ownedCards={ownedCards}
                  inventory={inventory}
                  language={language}
                  updateDeck={updateDeck}
                  playSfx={playSfx}
                />
              </div>

              {/* Modal Footer */}
              <div className="px-3.5 py-2 sm:px-4 sm:py-2.5 bg-[#f8f7f7] dark:bg-[#201d1d] border-t border-[#0f0000]/12 dark:border-white/10 flex items-center justify-between text-[10px] sm:text-[11px] text-[#646262] dark:text-slate-400 shrink-0">
                <span className="truncate pr-2">
                  {language === 'ko'
                    ? '💡 프리셋 선택 시 보유 카드 중 최적 조합으로 즉시 교체됩니다.'
                    : '💡 Tapping a preset instantly applies the best owned cards.'}
                </span>
                <button
                  type="button"
                  onClick={() => setIsSynergyModalOpen(false)}
                  className="min-h-[36px] px-3 py-1.5 bg-[#201d1d] text-[#fdfcfc] font-bold rounded-sm hover:bg-[#302c2c] transition-colors text-xs cursor-pointer shrink-0"
                >
                  {language === 'ko' ? '닫기' : 'Close'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Deck Synergy Visualizer Modal */}
      <DeckSynergyVisualizer
        deck={currentDeck as any}
        isOpen={isVisualizerOpen}
        onClose={() => setIsVisualizerOpen(false)}
        language={language}
      />

      {/* Element Advantage Guide Modal (Row 18) */}
      <ElementAdvantageModal
        isOpen={isElementAdvantageOpen}
        onClose={() => setIsElementAdvantageOpen(false)}
        language={language}
        lowSpecMode={lowSpecMode}
      />

      {/* ID 342 & ID 372: Deck Preset Export/Import & QR Code Modal */}
      <DeckPresetCodeModal
        isOpen={isDeckPresetCodeModalOpen}
        onClose={() => setIsDeckPresetCodeModalOpen(false)}
        currentDeck={currentDeck}
        onImportDeck={(imported) => updateDeck(imported)}
        language={language}
        onClonePreset={() => {
          showCustomAlert?.(
            language === 'ko' ? '프리셋 복제 완료' : 'Preset Cloned',
            language === 'ko' ? '현재 덱 구성이 새 프리셋 슬롯에 복제되었습니다.' : 'Deck configuration cloned to preset.'
          );
        }}
      />

      {/* ID 377: Card 1:1 Stat Compare Modal */}
      <CardCompareModal
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        cardA={compareCardA}
        cardB={compareCardB}
        language={language}
      />

      {/* ID 402: Breakthrough Material Deficit Deep-link Modal */}
      <MaterialDeficitModal
        isOpen={isMaterialDeficitOpen}
        onClose={() => setIsMaterialDeficitOpen(false)}
        materialName={deficitInfo.name}
        requiredCount={deficitInfo.req}
        currentCount={deficitInfo.cur}
        onNavigateStage={() => {
          setIsMaterialDeficitOpen(false);
          onNavigate('mission');
        }}
        language={language}
      />

      {/* RSI-014: Tactical Passive Perks Modal */}
      {selectedCardForDetail && (
        <TacticalPassivePerksModal
          isOpen={showPerksModal}
          heroId={selectedCardForDetail.id}
          heroName={selectedCardForDetail.title || selectedCardForDetail.title_dis}
          onClose={() => setShowPerksModal(false)}
          language={language}
        />
      )}
    </div>
  );
};

export default MyDeckView;
