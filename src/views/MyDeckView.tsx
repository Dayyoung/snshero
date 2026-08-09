import React, { useEffect, useState, useMemo } from 'react';
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
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CardItem } from '../components/CardItem';
import { ArDeckViewer } from '../components/ArDeckViewer';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronLeft, ChevronRight, HelpCircle, Trophy, Info, Zap, Package, Shield, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Gift, Star as StarIcon, Edit2, Plus, Gem, Footprints, Sparkles, Share2, Camera, BookOpen, Users, PawPrint, Trash2, Layers, Lock, Search } from 'lucide-react';
import { CardDisassembleModal } from '../components/CardDisassembleModal';
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
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      id={`deck-slot-${idx}`}
      className={cn("flex flex-col items-center gap-2 group", className)}
    >
      <div className="text-[10px] sm:text-xs font-black text-black/30 uppercase tracking-tighter">
        {card.customName ? (
          <span className="text-blue-600 italic">"{card.customName}"</span>
        ) : (
          `SLOT_${idx + 1}`
        )}
      </div>
      <div className="relative overflow-hidden rounded-xl group/card" {...attributes} {...listeners}>
        <CardItem 
          card={card} 
          onClick={() => handleCardClick(idx)} 
          className="w-[17.2vw] min-w-[3.4rem] max-w-[5.2rem] h-[24.5vw] min-h-[4.9rem] max-h-[7.5rem] sm:w-24 sm:h-32 md:w-32 md:h-44 cursor-grab active:cursor-grabbing hover:ring-4 hover:ring-blue-500 transition-all rounded-xl"
          customImage={customCardImage}
          />
        {representativeCardId === (card.imageIndex ?? null) && representativePetCardId ? (
          <MonsterPetBadge
            cardId={representativePetCardId}
            className="absolute right-1 top-1 z-10 border-emerald-200 bg-white/95 px-1 py-1"
            imageClassName="h-5 w-5"
            label={t('monster_pet_badge', language)}
          />
        ) : null}

        {/* Stats Summary Overlay */}
        <div className="absolute inset-x-0 bottom-0 bg-white/95 backdrop-blur-sm p-1 rounded-b-xl border-t border-slate-200 opacity-100 sm:opacity-0 sm:group-hover/card:opacity-100 transition-opacity">
          <div className="grid grid-cols-4 gap-0.5">
            {(['N', 'E', 'S', 'W'] as const).map((dir, statIdx) => (
              <div key={dir} className="flex flex-col items-center rounded bg-slate-50 px-0.5 py-0.5 ring-1 ring-slate-200">
                <span className="text-[5px] font-black text-slate-500 leading-none">{dir}</span>
                <span className="text-[8px] font-black text-slate-950 leading-none mt-0.5">{card.stats[statIdx]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Equipment Dots */}
      <div className="flex gap-1">
        {['necklace', 'ring1', 'ring2', 'boots'].map(slot => (
          <div 
            key={slot}
            className={cn(
              "w-2 h-2 rounded-full",
              card?.equipment?.[slot as EquipmentSlot] ? "bg-yellow-400 animate-pulse" : "bg-gray-200"
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
                  "w-1.5 h-1.5 rounded-full transition-all duration-300",
                  "bg-cyan-400 animate-pulse shadow-[0_0_3px_rgba(34,211,238,0.5)]"
                )}
              />
              
              {/* Tooltip */}
              {isActive && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-32 p-2 bg-black text-white text-[10px] rounded-lg opacity-0 group-hover/skill:opacity-100 pointer-events-none transition-all z-50 shadow-xl border border-white/10">
                  <div className="font-black border-b border-white/20 pb-1 mb-1 flex justify-between uppercase italic">
                    <span>{name}</span>
                    <span className="text-yellow-400">Lv.{skill?.level}</span>
                  </div>
                  <p className="font-bold opacity-80 leading-tight">{desc}</p>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-black" />
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
  const [selectedCardForDetail, setSelectedCardForDetail] = useState<CardData | null>(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingCardIndex, setEditingCardIndex] = useState<number | null>(null);
  const [selectingIndex, setSelectingIndex] = useState<number | null>(null);
  const [itemManageIndex, setItemManageIndex] = useState<number | null>(null);
  const [itemSlotTab, setItemSlotTab] = useState<EquipmentSlot>('necklace');
  const [isEncyclopediaOpen, setIsEncyclopediaOpen] = useState(false);
  const [isAchievementsModalOpen, setIsAchievementsModalOpen] = useState(false);
  const [isCombineModalOpen, setIsCombineModalOpen] = useState(false);
  const [is3DDeckViewerOpen, setIs3DDeckViewerOpen] = useState(false);
  const [isDisassembleModalOpen, setIsDisassembleModalOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [helpStep, setHelpStep] = useState(0);
  const { isLocked } = useCardLock();

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
  const cardSkins = useCardSkins(season);
  const { getCareState, getRewardStatus, performAction, claimReward } = useHeroCare({
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

  const handleOptimizeDeck = () => {
    const sortedOwned = [...ownedCards]
      .map(card => ({
        card,
        power: getCardPower(card)
      }))
      .sort((a, b) => b.power - a.power);

    if (sortedOwned.length === 0) {
      alert(language === 'ko' ? '보유한 카드가 없습니다.' : 'No cards owned.');
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

    updateDeck(bestCards);
    playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
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

  // Local state for editing modal
  const [editName, setEditName] = useState('');
  const [editNotes, setEditNotes] = useState('');

  const [visibleCardLimit, setVisibleCardLimit] = useState(40);
  const [activeCategory, setActiveCategory] = useState<'all' | 'battle' | 'collection' | 'growth' | 'special' | 'social'>('all');

  // Sync popup state to App.tsx
  React.useEffect(() => {
    const isAnyOpen = !!selectedCardForDetail || isPopupOpen || isItemModalOpen || editingCardIndex !== null || selectingIndex !== null || itemManageIndex !== null || isEncyclopediaOpen || showDeckPowerDetails || showTotalPowerDetails || isAchievementsModalOpen || showOptimizeSuccessModal || isCombineModalOpen;
    setGlobalPopupOpen(isAnyOpen);
    
    // Explicit return to reset when unmounting
    return () => setGlobalPopupOpen(false);
  }, [selectedCardForDetail, isPopupOpen, isItemModalOpen, editingCardIndex, selectingIndex, itemManageIndex, isEncyclopediaOpen, showDeckPowerDetails, showTotalPowerDetails, isAchievementsModalOpen, showOptimizeSuccessModal, isCombineModalOpen, setGlobalPopupOpen]);

  // 최상단 공용 뒤로가기 버튼 이벤트 수신 처리
  React.useEffect(() => {
    const handleGlobalBack = (e: Event) => {
      if (isPopupOpen) {
        e.preventDefault();
        playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
        setIsPopupOpen(false);
        setSelectingIndex(null);
      }
    };
    window.addEventListener('global-back', handleGlobalBack);
    return () => window.removeEventListener('global-back', handleGlobalBack);
  }, [isPopupOpen, playSfx]);

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

    setSelectingIndex(index);
    setIsPopupOpen(true);
    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
  };

  const selectMasterCard = (imgIdx: number, overrideTargetIndex?: number) => {
    playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
    let targetIndex = overrideTargetIndex ?? selectingIndex;
    
    if (targetIndex === null) {
      const emptyIdx = currentDeck.findIndex(c => !c.imageIndex || c.imageIndex === 0);
      targetIndex = emptyIdx !== -1 ? emptyIdx : 0;
    }

    const alreadyInDeck = currentDeck.some((c, idx) => idx !== targetIndex && c.imageIndex === imgIdx);
    if (alreadyInDeck) {
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
  };

  const [sortBy, setSortBy] = useState<'index' | 'level' | 'power' | 'name' | 'rarity' | 'stats_total' | 'recent'>('recent');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showOwnedOnly, setShowOwnedOnly] = useState(true);
  const [cardSearchQuery, setCardSearchQuery] = useState('');
  const [selectedElementFilter, setSelectedElementFilter] = useState<'ALL' | 'WATER' | 'FIRE' | 'EARTH' | 'WIND' | 'HOLY' | 'DARK'>('ALL');

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
       
       return {
         idx,
         card,
         power: getCardPower(card),
         isOwned: ownedCards.some(c => c.imageIndex === idx),
         isInDeck: currentDeck.some(c => c && c.imageIndex === idx)
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
          const el = String((item.card as any).element || dbCard?.element || '').toUpperCase();
          if (!el.includes(selectedElementFilter)) return false;
        }

        // Search Query Filter (Item 44)
        if (cardSearchQuery.trim() !== '') {
          const q = cardSearchQuery.toLowerCase();
          const dbCard = CARD_DATABASE[item.idx];
          const nameKo = String(item.card.title_dis || dbCard?.title_dis || '').toLowerCase();
          const nameEn = String((item.card as any).title_en || dbCard?.title_en || '').toLowerCase();
          const lore = String((item.card as any).lore_ko || dbCard?.lore_ko || '').toLowerCase();
          if (!nameKo.includes(q) && !nameEn.includes(q) && !lore.includes(q)) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        let comparison = 0;
        const cardA = a.card;
        const cardB = b.card;
        
        switch (sortBy) {
          case 'recent':
            // Higher index or inventory acquired timestamp
            comparison = b.idx - a.idx;
            break;
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
  }, [showOwnedOnly, ownedCards, inventory, sortBy, sortOrder, language, selectionContext, currentDeck, selectedElementFilter, cardSearchQuery]);

  const iconMap: Record<string, any> = {
    Zap,
    ArrowUp,
    ArrowDown,
    ArrowLeft,
    ArrowRight,
    Gift,
    Star: StarIcon
  };

  return (
    <div className="p-3 sm:p-6 md:p-8 pb-48 flex flex-col gap-5 sm:gap-6 md:gap-10 max-w-4xl mx-auto min-h-screen w-full overflow-x-hidden app-bg text-slate-800 font-sans">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-2 w-full">
        <div className="flex items-center gap-2">
          <PageHeader title={t('mydeck', language)} />
          <button
            onClick={() => { setIsHelpOpen(true); setHelpStep(0); }}
            className="w-8 h-8 rounded-full border border-slate-300 bg-white flex items-center justify-center hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
            aria-label="Help"
          >
            <HelpCircle size={16} className="text-slate-500" />
          </button>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-1.5 sm:gap-2">
          <button
            onClick={() => {
              playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
              const cardIndices = currentDeck.map(c => c.imageIndex || 0);
              const nickname = user?.displayName || 'SNSMaster';
              window.history.pushState({}, '', `/share?id=${encodeURIComponent(nickname)}&card1=${cardIndices[0]||0}&card2=${cardIndices[1]||0}&card3=${cardIndices[2]||0}&card4=${cardIndices[3]||0}&card5=${cardIndices[4]||0}`);
              onNavigate('share');
            }}
            className="min-h-10 sm:min-h-11 px-2.5 sm:px-3 py-2 sm:py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg active:scale-95 transition-all cursor-pointer shadow-sm flex items-center gap-1.5 touch-target"
            title={t('share', language)}
          >
            <Share2 size={14} className="shrink-0" />
            <span className="text-[10px] font-bold uppercase">{t('share', language)}</span>
          </button>
          <button
            onClick={() => {
              playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
              setIs3DDeckViewerOpen(true);
            }}
            className="min-h-10 sm:min-h-11 px-2.5 sm:px-3 py-2 sm:py-2.5 bg-teal-500 hover:bg-teal-600 text-white rounded-lg active:scale-95 transition-all cursor-pointer shadow-md flex items-center gap-1.5 touch-target"
            title={language === 'ko' ? '덱 3D 감상' : '3D DECK VIEW'}
          >
            <Camera size={14} className="shrink-0" />
            <span className="text-[10px] font-bold uppercase">{language === 'ko' ? '3D' : '3D'}</span>
          </button>

          <button
            onClick={() => {
              playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
              setIsDisassembleModalOpen(true);
            }}
            className="min-h-10 sm:min-h-11 px-2.5 sm:px-3 py-2 sm:py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg active:scale-95 transition-all cursor-pointer shadow-md flex items-center gap-1.5 touch-target"
            title={language === 'ko' ? '카드 분해/환급' : 'Card Disassemble'}
          >
            <Trash2 size={14} className="shrink-0" />
            <span className="text-[10px] font-bold uppercase">{language === 'ko' ? '분해' : 'SCRAP'}</span>
          </button>
        </div>
      </div>

      {/* Multi-Deck Presets Control Bar (Item 31) */}
      <div className="bg-slate-900 text-white p-2.5 sm:p-3 rounded-2xl flex flex-wrap items-center justify-between gap-2 sm:gap-3 shadow-lg">
        <div className="flex items-center gap-2">
          <Layers size={18} className="text-indigo-400 shrink-0" />
          <span className="text-xs font-black uppercase tracking-wider text-slate-200">
            {language === 'ko' ? '멀티 덱 프리셋' : 'Deck Presets'}
          </span>
        </div>

        <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl">
          {[1, 2, 3].map((presetNum) => (
            <button
              key={presetNum}
              onClick={() => handleSwitchDeckPreset(presetNum)}
              className={cn(
                "px-2.5 sm:px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-black uppercase transition-all flex items-center gap-1 cursor-pointer",
                activeDeckPreset === presetNum
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-400 hover:text-white hover:bg-slate-700"
              )}
            >
              <span>DECK {presetNum}</span>
              {activeDeckPreset === presetNum && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </button>
          ))}
        </div>
      </div>


      <div className="flex flex-wrap items-center justify-end gap-3 mt-3 sm:mt-4 mb-2 pb-3 sm:pb-4 border-b border-slate-200/60 font-sans">
        
        <div className="grid grid-cols-3 gap-1.5 sm:flex sm:flex-wrap sm:items-center sm:justify-end sm:gap-3 w-full md:w-auto">
          <button
            onClick={() => {
              if (selectionContext === 'upgrade') {
                setSelectionContext('replace');
              } else {
                setSelectionContext('upgrade');
                setIsPopupOpen(true);
              }
              playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
            }}
            id="hero-nurture-btn"
            className={cn(
              "px-2 sm:px-6 py-2.5 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1 sm:gap-2 border touch-target active:scale-[0.98] shadow-sm cursor-pointer",
              selectionContext === 'upgrade' 
                ? "bg-white text-purple-600 border-purple-200" 
                : "bg-purple-600 text-white hover:bg-purple-500 border-purple-500 shadow-purple-500/10"
            )}
          >
            <StarIcon size={14} className="shrink-0 sm:w-4 sm:h-4" />
            <span className="truncate">{t('hero_nurture', language)}</span>
          </button>
          <button 
            onClick={() => {
              if (selectionContext === 'equipment') {
                setSelectionContext('replace');
              } else {
                setSelectionContext('equipment');
                setIsPopupOpen(true);
              }
              playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
            }}
            id="inventory-btn"
            className={cn(
              "px-2 sm:px-6 py-2.5 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1 sm:gap-2 border touch-target active:scale-[0.98] shadow-sm cursor-pointer",
              selectionContext === 'equipment' 
                ? "bg-white text-blue-600 border-blue-200" 
                : "bg-slate-900 text-white hover:bg-slate-800 border-slate-900 shadow-slate-900/10"
            )}
          >
            <Package size={14} className="shrink-0 sm:w-4 sm:h-4" />
            <span className="truncate">{t('inventory', language)}</span>
          </button>
          <button 
            onClick={() => {
              setIsAchievementsModalOpen(true);
              playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
            }}
            className="bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-900 px-2 sm:px-6 py-2.5 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-wider hover:opacity-95 transition-all flex items-center justify-center gap-1 sm:gap-2 border border-amber-300 touch-target active:scale-[0.98] shadow-sm shadow-amber-400/10 cursor-pointer"
          >
            <Trophy size={14} className="shrink-0 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">{t('my_achievements', language)}</span>
            <span className="sm:hidden">{Math.round((unlockedAchievements.length / ALL_ACHIEVEMENTS.length) * 100)}%</span>
            <span className="hidden sm:inline">({Math.round((unlockedAchievements.length / ALL_ACHIEVEMENTS.length) * 100)}%)</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-6 md:gap-8">
        <div className="flex flex-col items-center gap-3 sm:gap-4 w-full">
          <div id="deck-list" className="mx-auto flex w-full max-w-full flex-nowrap sm:flex-wrap justify-center items-center gap-1 xs:gap-2 sm:gap-4 md:gap-6 px-0.5 sm:px-1">
          <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext 
              items={currentDeckWithSkins.map(c => c.id)}
              strategy={horizontalListSortingStrategy}
            >
              {currentDeckWithSkins.map((card, idx) => (
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
                />
              ))}
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
                    className="w-20 h-28 sm:w-24 sm:h-32 md:w-32 md:h-44 shadow-2xl scale-105"
                    customImage={customCardImage}
                    />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
          </div>
          

        </div>
        
        {/* 카드 최적화 버튼 (중앙 정렬) */}
        <div className="flex justify-center items-center flex-wrap gap-3 w-full my-1 sm:my-2">
          <button
            onClick={handleOptimizeDeck}
            className="px-5 sm:px-6 py-2.5 bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-900 text-xs sm:text-sm font-bold uppercase rounded-xl shadow-md border border-amber-300 hover:opacity-95 active:scale-[0.98] transition-all flex items-center gap-2 touch-target cursor-pointer shadow-amber-400/10"
            title={language === 'ko' ? '스킬/아이템이 적용된 최종 카드파워 기준 자동 최적화' : 'Auto-optimize based on final power including skills/items'}
          >
            <Zap size={14} className="sm:w-4 sm:h-4 fill-current animate-pulse text-slate-900" />
            <span>{t('card_optimize', language)}</span>
          </button>
          
          <button
            onClick={() => {
              setIsCombineModalOpen(true);
              playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
            }}
            className="px-5 sm:px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs sm:text-sm font-bold uppercase rounded-xl shadow-md border border-purple-500 hover:opacity-95 active:scale-[0.98] transition-all flex items-center gap-2 touch-target cursor-pointer shadow-purple-500/10"
            title={language === 'ko' ? '동일한 카드 3장을 상위 등급 카드로 합성' : 'Combine 3 identical cards into a higher tier'}
          >
            <Sparkles size={14} className="sm:w-4 sm:h-4 text-yellow-300 animate-pulse" />
            <span>{t('card_combine', language)}</span>
          </button>
        </div>
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

      <div className="ollama-panel space-y-4 sm:space-y-6">
        <h3 className="font-bold flex items-center gap-2 tracking-normal text-xs sm:text-sm underline decoration-2">
          <Package size={14} className="sm:w-4 sm:h-4" />
          {t('battle_stats', language)}
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-px bg-black border border-gray-300 rounded-xl overflow-hidden">
          <div 
            className="bg-white p-3 sm:p-5 md:p-6 cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => setShowDeckPowerDetails(true)}
            title="Click to see details"
          >
            <span className="text-black/40 flex items-center gap-1 text-xs sm:text-sm font-bold mb-1.5 sm:mb-2">
              {t('deck_power', language)} <Info size={12} className="sm:w-3.5 sm:h-3.5 opacity-50" />
            </span>
            <span className={cn("font-bold tracking-tight truncate block", String(deckPower.toLocaleString()).length > 8 ? "text-lg sm:text-xl" : String(deckPower.toLocaleString()).length > 5 ? "text-xl sm:text-2xl" : "text-2xl sm:text-3xl")} title={deckPower.toLocaleString()}>
              {deckPower.toLocaleString()}
            </span>
            <div className="text-[9px] sm:text-[10px] text-gray-500 mt-1.5 sm:mt-2 opacity-60">
              * {t('deck_tp_guide', language)}
            </div>
          </div>
          <div 
            className="bg-white p-3 sm:p-5 md:p-6 cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => setShowTotalPowerDetails(true)}
            title="Click to see details"
          >
            <span className="text-black/40 flex items-center gap-1 text-xs sm:text-sm font-bold mb-1.5 sm:mb-2">
              {t('total_power', language)} <Info size={12} className="sm:w-3.5 sm:h-3.5 opacity-50" />
            </span>
            <span className={cn("font-bold tracking-tight truncate block", String(calculatedTotalPower.toLocaleString()).length > 8 ? "text-lg sm:text-xl" : String(calculatedTotalPower.toLocaleString()).length > 5 ? "text-xl sm:text-2xl" : "text-2xl sm:text-3xl")} title={calculatedTotalPower.toLocaleString()}>
              {calculatedTotalPower.toLocaleString()}
            </span>
            <div className="text-[9px] sm:text-[10px] text-gray-500 mt-1.5 sm:mt-2 opacity-60">
              * {t('all_cards_tp_guide', language)}
            </div>
          </div>

          <div className="bg-white p-3 sm:p-5 md:p-6">
            <span className="text-black/40 block text-xs sm:text-sm font-bold mb-1.5 sm:mb-2">{t('unique_cards', language)}</span>
            <span className={cn("font-bold tracking-tight truncate block", String(uniqueCount).length > 8 ? "text-lg sm:text-xl" : String(uniqueCount).length > 5 ? "text-xl sm:text-2xl" : "text-2xl sm:text-3xl")} title={String(uniqueCount)}>{uniqueCount}</span>
            <div className="text-[9px] sm:text-[10px] text-gray-500 mt-1.5 sm:mt-2 opacity-60">
              * {t('types_owned_guide', language)}
            </div>
          </div>

          <div className="bg-white p-3 sm:p-5 md:p-6">
            <span className="text-black/40 block text-xs sm:text-sm font-bold mb-1.5 sm:mb-2">{t('total_cards', language)}</span>
            <span className={cn("font-bold tracking-tight truncate block", String(totalCount).length > 8 ? "text-lg sm:text-xl" : String(totalCount).length > 5 ? "text-xl sm:text-2xl" : "text-2xl sm:text-3xl")} title={String(totalCount)}>{totalCount}</span>
            <div className="text-[9px] sm:text-[10px] text-gray-500 mt-1.5 sm:mt-2 opacity-60">
              * {t('all_duplicates_guide', language)}
            </div>
          </div>

          <div className="bg-white p-3 sm:p-5 md:p-6 flex flex-col justify-between">
            <div>
              <span className="text-black/40 block text-xs sm:text-sm font-bold mb-1.5 sm:mb-2">{t('win_rate', language)}</span>
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
            <div className="flex flex-col gap-1 sm:gap-1.5 mt-2 border-t border-gray-100 pt-2 w-full">
              <div className="flex justify-between items-center min-w-0">
                <div className="flex items-baseline gap-1">
                  <span className="text-base sm:text-lg lg:text-xl font-black text-black truncate">{stats.wins}</span>
                  <span className="text-[9px] sm:text-[10px] font-bold opacity-30">{t('wins_unit', language)}</span>
                </div>
                {stats.winStreak > 0 && (
                  <span className="text-[9px] sm:text-[10px] font-bold text-blue-600 truncate">{stats.winStreak} {t('win_streak', language)} 🔥</span>
                )}
              </div>
              <div className="flex justify-between items-center min-w-0">
                <div className="flex items-baseline gap-1">
                  <span className="text-base sm:text-lg lg:text-xl font-black text-black truncate">{stats.losses}</span>
                  <span className="text-[9px] sm:text-[10px] font-bold opacity-30">{t('losses_unit', language)}</span>
                </div>
                {stats.lossStreak > 0 && (
                  <span className="text-[9px] sm:text-[10px] font-bold text-red-600 truncate">{stats.lossStreak} {t('loss_streak', language)} 🌧️</span>
                )}
              </div>
              <div className="flex justify-between items-center min-w-0">
                <div className="flex items-baseline gap-1">
                  <span className="text-base sm:text-lg lg:text-xl font-black text-black truncate">{stats.draws}</span>
                  <span className="text-[9px] sm:text-[10px] font-bold opacity-30">{t('draws_unit', language)}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white p-3 sm:p-5 md:p-6 flex flex-col justify-between">
            <div>
              <span className="text-black/40 block text-xs sm:text-sm font-bold mb-1.5 sm:mb-2">{t('magic_chance', language)}</span>
              <span className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight text-blue-600 block">
                Total: {(20 + itemMagicChanceBonus + (currentDeck.reduce((acc, card) => {
                  if (!card) return acc;
                  const s = card.skills?.find(skill => skill.effect.type === 'special');
                  if (!s) return acc;
                  return acc + (s.effect.value * Math.floor((s.level + 1) / 6));
                }, 0) * 100)).toFixed(0)}%
              </span>
            </div>
            <div className="text-[9px] sm:text-[10px] text-gray-500 mt-2 sm:mt-4 font-bold">
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
            className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 active:scale-95 transition-all cursor-pointer touch-target flex items-center gap-1.5"
            aria-label={t('home_view_codex', language)}
          >
            <BookOpen size={14} />
            <span>{t('home_view_codex', language)}</span>
            <ArrowRight size={12} className="text-slate-400" />
          </button>
          <button
            onClick={() => {
              playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
              onNavigate('webtoon');
            }}
            className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 active:scale-95 transition-all cursor-pointer touch-target flex items-center gap-1.5"
            aria-label={t('home_webtoon_read', language)}
          >
            <BookOpen size={14} />
            <span>{t('home_webtoon_read', language)}</span>
            <ArrowRight size={12} className="text-slate-400" />
          </button>
          <button
            onClick={() => {
              playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
              onNavigate('shop');
            }}
            className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 active:scale-95 transition-all cursor-pointer touch-target flex items-center gap-1.5"
            aria-label={t('home_get_card', language)}
          >
            <Package size={14} />
            <span>{t('home_get_card', language)}</span>
            <ArrowRight size={12} className="text-slate-400" />
          </button>
        </div>
      </div>


      <AnimatePresence>
        {isItemModalOpen && itemManageIndex !== null && currentDeck[itemManageIndex] && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              setIsItemModalOpen(false);
              setItemManageIndex(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="bg-white border border-gray-200 rounded-lg w-full max-w-md overflow-hidden flex flex-col max-h-[80vh] shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Package size={18} />
                  {t('inventory', language)}
                </h3>
                <button 
                  onClick={() => {
                    setIsItemModalOpen(false);
                    setItemManageIndex(null);
                  }} 
                  className="hover:bg-gray-100 p-1 rounded-md transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Slot Tabs */}
              <div className="flex gap-2 p-3 bg-gray-50 border-b border-gray-100 overflow-x-auto scrollbar-hide">
                {(['necklace', 'ring1', 'ring2', 'boots'] as const).map(slot => (
                  <button
                    key={slot}
                    onClick={() => setItemSlotTab(slot)}
                    className={cn(
                      "px-3 py-1.5 text-[10px] font-bold uppercase rounded-md border transition-all whitespace-nowrap",
                      itemSlotTab === slot 
                        ? "bg-slate-900 text-white border-slate-900" 
                        : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"
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
                          "text-[9px] font-bold px-1.5 py-0.5 rounded border transition-colors",
                          s > 0 ? "bg-green-50 border-green-200 text-green-700" : 
                          s < 0 ? "bg-red-50 border-red-200 text-red-700" : 
                          "bg-gray-50 border-gray-100 text-gray-400"
                        )}>
                          {labels[i]}:{s > 0 ? '+'+s : s}
                        </span>
                      );
                    };

                    return (
                      <>
                        {/* Currently Equipped */}
                        <div className="space-y-2">
                           <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t('equipment', language)}</div>
                            {currentItem ? (
                              <div className={cn(
                                "p-3 rounded-xl border-2 flex justify-between items-center group transition-all",
                                currentItem.rarity === "rare" ? "bg-yellow-50/50 border-yellow-400/30" : 
                                currentItem.rarity === "magic" ? "bg-blue-50/50 border-blue-400/30" : 
                                "bg-white border-gray-200"
                              )}>
                                 <div className="flex items-center gap-3">
                                    <div className={cn(
                                      "w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden border-2 shrink-0",
                                      currentItem.rarity === "rare" ? "bg-yellow-100 border-yellow-400" :
                                      currentItem.rarity === "magic" ? "bg-blue-100 border-blue-400" :
                                      "bg-gray-100 border-gray-200"
                                    )}>
                                       <ItemIcon imageIndex={currentItem.imageIndex} size={32} />
                                    </div>
                                    <div>
                                       <div className="flex items-center gap-2">
                                         <p className="text-xs font-black">{language === 'ko' ? currentItem.name_ko : currentItem.name_en}</p>
                                         <span className={cn(
                                           "text-[7px] font-black uppercase px-1.5 py-0.5 rounded border shrink-0",
                                           currentItem.rarity === "rare" ? "bg-yellow-400 text-black border-yellow-500" :
                                           currentItem.rarity === "magic" ? "bg-blue-600 text-white border-blue-700" :
                                           "bg-gray-400 text-white border-gray-500"
                                         )}>
                                           {t(`rarity_${currentItem.rarity}` as any, language) || currentItem.rarity}
                                         </span>
                                       </div>
                                       <div className="flex flex-wrap gap-1 mt-1">
                                          {currentItem.stats.map((s: number, i: number) => renderStatLabel(s, i))}
                                          {currentItem.magicChance && (
                                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border bg-purple-50 border-purple-200 text-purple-700">
                                              M:+{currentItem.magicChance}%
                                            </span>
                                          )}
                                       </div>
                                    </div>
                                 </div>
                                 <button 
                                   onClick={() => unequipItem(currentItem.id, itemManageIndex, itemSlotTab)}
                                   className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-all"
                                 >
                                   <X size={14} />
                                 </button>
                              </div>
                            ) : (
                             <div className="p-4 border border-dashed border-gray-200 rounded-md text-center text-xs text-gray-300 italic">
                                {t('no_items', language)}
                             </div>
                           )}
                        </div>

                        {/* Inventory Items */}
                        <div className="space-y-2">
                           <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t('available', language)}</div>
                           <div className="space-y-2">
                              {finalItems.length === 0 ? (
                                <div className="text-center py-6 text-xs text-gray-300 italic border border-dashed border-gray-100 rounded-md">
                                   {t('no_items', language)}
                                </div>
                              ) : (
                                finalItems.map((group: any) => (
                                  <button
                                    key={group.ids[0]}
                                    onClick={() => equipItem(group.ids[0], itemManageIndex, itemSlotTab)}
                                    className={cn(
                                      "w-full p-3 border-2 rounded-xl text-left flex justify-between items-center transition-all group",
                                      group.rarity === "rare" ? "bg-white border-yellow-400/20 hover:border-yellow-400" :
                                      group.rarity === "magic" ? "bg-white border-blue-400/20 hover:border-blue-400" :
                                      "bg-white border-gray-200 hover:border-slate-800"
                                    )}
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className={cn(
                                        "w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden border-2 shrink-0 group-hover:scale-110 transition-transform",
                                        group.rarity === "rare" ? "bg-yellow-50 border-yellow-200 group-hover:border-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.1)]" :
                                        group.rarity === "magic" ? "bg-blue-50 border-blue-200 group-hover:border-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.1)]" :
                                        "bg-gray-50 border-gray-100 group-hover:border-gray-300"
                                      )}>
                                        <ItemIcon imageIndex={group.imageIndex} size={32} />
                                      </div>
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <p className="text-xs font-black">
                                            {language === 'ko' ? group.name_ko : group.name_en}
                                          </p>
                                          <span className={cn(
                                            "text-[7px] font-black uppercase px-1.5 py-0.5 rounded border shrink-0",
                                            group.rarity === "rare" ? "bg-yellow-400 text-black border-yellow-500" :
                                            group.rarity === "magic" ? "bg-blue-600 text-white border-blue-700" :
                                            "bg-gray-400 text-white border-gray-500"
                                          )}>
                                            {t(`rarity_${group.rarity}` as any, language) || group.rarity}
                                          </span>
                                          <span className="text-[10px] text-blue-600 font-black">x{group.quantity}</span>
                                        </div>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                          {group.stats.map((s: number, i: number) => renderStatLabel(s, i))}
                                          {group.magicChance && (
                                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border bg-purple-50 border-purple-200 text-purple-700">
                                              M:+{group.magicChance}%
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    <Plus size={14} className="text-gray-300 group-hover:text-black transition-colors" />
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
            className="fixed inset-0 bg-white/95 backdrop-blur-sm z-[200] flex items-center justify-center p-4 sm:p-8"
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white w-full max-w-5xl h-[90vh] rounded-3xl border border-slate-100 flex flex-col overflow-hidden shadow-2xl font-sans"
            >
              <div className="p-4 sm:p-6 border-b border-slate-200 flex flex-col sm:flex-row gap-4 items-start bg-white relative">


                <div className="space-y-1">
                  <h3 className="text-2xl font-bold tracking-tight leading-none">
                    {selectionContext === 'upgrade' 
                      ? (t('hero_nurture', language) || '업그레이드할 카드를 선택하세요') 
                      : selectionContext === 'equipment' 
                        ? (language === 'ko' ? '아이템을 장착할 카드를 선택하세요' : 'Select Card for Equipment') 
                        : selectionContext === 'customize'
                          ? (language === 'ko' ? '덱 구성하기 (최대 5장)' : 'Customize Deck (Max 5)')
                          : t('select_card', language)}
                  </h3>
                  <p className="text-sm font-bold opacity-40 tracking-normal italic">
                    {selectionContext === 'customize' 
                      ? (language === 'ko' ? '카드를 클릭하여 덱에 추가하거나 제거하세요.' : 'Click cards to add or remove from your battle deck.')
                      : t('deck_select_guide', language)}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row flex-wrap gap-4 w-full sm:w-auto mt-2 sm:mt-0">
                  {selectionContext !== 'upgrade' && selectionContext !== 'equipment' && (
                    <label className="flex items-center gap-2 cursor-pointer bg-white border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-all">
                      <input 
                        type="checkbox" 
                        checked={showOwnedOnly}
                        onChange={(e) => setShowOwnedOnly(e.target.checked)}
                        className="w-4 h-4 min-w-[20px] min-h-[20px] rounded border-gray-300 text-black focus:ring-black cursor-pointer"
                      />
                      <span className="text-xs font-bold whitespace-nowrap">{t('owned_only', language)}</span>
                    </label>
                  )}

                  <div className="flex bg-gray-100 p-1 rounded-lg gap-1 overflow-x-auto scrollbar-hide">
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
                          "px-2 py-1 text-[10px] font-black uppercase rounded transition-all whitespace-nowrap flex items-center gap-1",
                          sortBy === opt.id ? "bg-black text-white shadow-sm" : "bg-transparent text-gray-500 hover:bg-gray-200"
                        )}
                      >
                        {opt.label}
                        {sortBy === opt.id && (sortOrder === 'asc' ? <ArrowUp size={8} /> : <ArrowDown size={8} />)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── Item 44: Card Search Bar & Element Filter Chips ── */}
              <div className="px-4 sm:px-6 pt-2 pb-2 space-y-2 border-b border-gray-100 bg-gray-50/50">
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <div className="relative flex-1 w-full">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={cardSearchQuery}
                      onChange={(e) => setCardSearchQuery(e.target.value)}
                      placeholder={language === 'ko' ? '카드 이름 또는 설명 검색...' : 'Search card name or lore...'}
                      className="w-full pl-8 pr-8 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-800 focus:outline-none focus:border-black transition-colors"
                    />
                    {cardSearchQuery && (
                      <button
                        onClick={() => setCardSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  {/* Element Chips */}
                  <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto scrollbar-hide py-0.5">
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
                          "px-2.5 py-1 text-[10px] font-black rounded-md border transition-all whitespace-nowrap shadow-xs cursor-pointer",
                          selectedElementFilter === chip.id
                            ? `${chip.color} ring-2 ring-black/20 scale-105`
                            : "bg-white text-gray-600 border-gray-200 hover:bg-gray-100"
                        )}
                      >
                        {language === 'ko' ? chip.labelKo : chip.labelEn}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 sm:p-6 scrollbar-thin scrollbar-thumb-black">
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 sm:gap-4 justify-items-center">
                  {processedCards.slice(0, visibleCardLimit).map((item) => {
                    const { idx, card, power, isOwned, isInDeck } = item;
                    const previewCard = card;

                    return (
                      <div key={idx} className={cn("flex flex-col items-center gap-1 transition-all group/card", !isOwned && "opacity-20 grayscale")}>
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
                                    alert(language === 'ko' ? '덱에 있는 카드만 선택 가능합니다.' : 'Only cards in the deck can be selected.');
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
                              "w-20 h-28 sm:w-24 sm:h-32 md:w-28 md:h-40 transition-all cursor-pointer hover:ring-2 hover:ring-blue-500",
                              isInDeck && "ring-2 ring-blue-500 ring-offset-2"
                            )}
                            customImage={customCardImage}
                            lowSpecMode={true}
                            />
                          {isInDeck && (
                            <div className="absolute inset-0 bg-blue-600/20 border-4 border-blue-600 rounded-xl flex items-center justify-center pointer-events-none z-10">
                              <div className="bg-blue-600 text-white text-[10px] font-black px-2 py-0.5 rounded uppercase shadow-lg">
                                IN DECK
                              </div>
                            </div>
                          )}
                          
                          {/* Bottom Left: Power Badge removed */}


                          {/* Bottom Right: Status Icons (Equipment/Skills) */}
                          <div className="absolute bottom-0 right-0 flex gap-0.5 p-1 z-20 pointer-events-none">
                            {inventory[idx]?.equipment && Object.keys(inventory[idx].equipment).length > 0 && (
                              <div className="bg-orange-500 text-white p-0.5 rounded-full shadow-lg border border-white/50">
                                <Package size={8} />
                              </div>
                            )}
                            {inventory[idx]?.skills && inventory[idx].skills.some((s: any) => s.level > 1) && (
                              <div className="bg-yellow-500 text-white p-0.5 rounded-full shadow-lg border border-white/50">
                                <Zap size={8} />
                              </div>
                            )}
                          </div>

                          {/* Top Right: Quantity */}
                          {isOwned && inventory[idx] && (
                            <div className="absolute -top-1 -right-1 bg-blue-600 text-white text-[10px] sm:text-xs font-black px-1.5 min-w-[18px] h-[18px] flex items-center justify-center border-2 border-white rounded-full z-30 shadow-xl">
                              {inventory[idx].quantity}
                            </div>
                          )}
                        </div>
                        <span className="text-xs sm:text-sm font-black text-black/80 truncate w-20 text-center tracking-tighter uppercase italic mt-1">
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
                      className="px-6 py-2.5 rounded-full bg-slate-900 border border-slate-700 text-amber-300 font-mono text-xs font-bold hover:bg-slate-800 hover:border-amber-400 transition-all shadow-lg cursor-pointer"
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
                <div className="p-6 bg-black border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-6 relative shrink-0">
                  {/* Floating Notification */}
                  <AnimatePresence>
                    {selectMessage && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute -top-12 left-1/2 -translate-x-1/2 bg-red-600 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-2xl z-50 whitespace-nowrap"
                      >
                        {selectMessage}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 italic">Active_Combat_Formation</h4>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                      {[0, 1, 2, 3, 4].map(idx => {
                        const card = currentDeck[idx];
                        return (
                          <div key={idx} className={cn(
                            "w-12 h-16 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all",
                            card ? "border-blue-600 bg-blue-600/10" : "border-white/10 bg-white/5 border-dashed"
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
                    className="w-full sm:w-auto px-10 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-bold uppercase tracking-wider transition-all active:scale-95 shadow-md hover:shadow-lg cursor-pointer"
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
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[300] flex items-center justify-center p-4"
          onClick={() => setShowDeckPowerDetails(false)}
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            onClick={e => e.stopPropagation()}
            className="bg-white w-full max-w-sm rounded-lg shadow-2xl p-6 border border-gray-200"
          >
            <div className="flex justify-between items-center mb-3 pb-2 border-b">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Trophy size={18} className="text-amber-500" />
                {t('deck_power', language)} {t('details', language)}
              </h3>
              <button onClick={() => setShowDeckPowerDetails(false)} className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"><X size={20}/></button>
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
                  <div className="p-3 bg-slate-900 text-white rounded-xl mb-3 space-y-2 text-xs font-mono shadow-inner">
                    <div className="flex justify-between items-center border-b border-slate-700/60 pb-1.5">
                      <span className="text-slate-300">{language === 'ko' ? '카드 기본 스탯 합' : 'Base Stats Sum'}</span>
                      <span className="font-black text-amber-400">{totalBase.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-slate-700/60 pb-1.5">
                      <span className="text-slate-300">{language === 'ko' ? '스킬 강화 보너스' : 'Skill Node Bonus'}</span>
                      <span className="font-black text-emerald-400">+{totalSkill.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-slate-700/60 pb-1.5">
                      <span className="text-slate-300">{language === 'ko' ? '장비 아이템 보너스' : 'Equipment Bonus'}</span>
                      <span className="font-black text-blue-400">+{totalEquip.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300 flex items-center gap-1">
                        <Sparkles size={12} className="text-purple-400" />
                        {language === 'ko' ? '동일 속성 시너지 (3장+)' : 'Mono-Element Synergy (+10%)'}
                      </span>
                      <span className={cn("font-black", hasSynergy ? "text-purple-300" : "text-slate-500")}>
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
                        <div key={i} className="flex justify-between items-center text-xs p-2.5 bg-gray-50 border border-gray-200 rounded-lg shadow-2xs">
                          <div className="flex flex-col min-w-0 pr-2">
                            <span className="truncate font-black text-gray-800">{i+1}. {getFormattedCardName({ ...card, imageIndex: card.imageIndex || 0 }, language)}</span>
                            <div className="flex flex-wrap gap-1 mt-0.5">
                              <span className="text-[9px] text-gray-500 font-bold bg-gray-100 px-1 rounded-xs">{t('base', language)} {basePower}</span>
                              {bonus > 0 && <span className="text-[9px] text-green-600 font-bold bg-green-50 px-1 rounded-xs">+{bonus}</span>}
                              {ep > 0 && (
                                <span className="text-[9px] text-blue-600 font-bold bg-blue-50 px-1 rounded-xs">+{ep}</span>
                              )}
                            </div>
                          </div>
                          <span className="font-black text-blue-600 text-sm shrink-0">+{total}</span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t-2 border-slate-900 font-black text-base text-slate-900">
                    <span>{language === 'ko' ? '총 전투력 (Grand TP)' : 'Grand Total TP'}:</span>
                    <span className="text-xl text-blue-600">{grandTotalTP.toLocaleString()}</span>
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
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[300] flex items-center justify-center p-4"
          onClick={() => setShowTotalPowerDetails(false)}
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            onClick={e => e.stopPropagation()}
            className="bg-white w-full max-w-md rounded-lg shadow-2xl p-6 border border-gray-200"
          >
            <div className="flex justify-between items-center mb-4 pb-2 border-b">
              <h3 className="font-bold text-lg">{t('total_power', language)} Detail</h3>
              <button onClick={() => setShowTotalPowerDetails(false)} className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"><X size={20}/></button>
            </div>
            <p className="text-sm text-gray-500 mb-4">* {language === 'ko' ? '총 TP = 소유한 모든 카드의 (파워 × 보유 수량) 총합' : 'Total TP = Sum of all owned cards (Power × Qty)'}</p>
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
                  <div key={idx} className="flex justify-between items-center text-sm p-3 bg-slate-50 border border-slate-100 rounded-xl shadow-sm">
                    <div className="flex flex-col w-1/2">
                      <span className="truncate font-bold text-slate-800">{getFormattedCardName(dbCard, language)}</span>
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        <span className="text-[10px] text-slate-500 font-bold bg-slate-100 px-1 rounded-sm">B:{basePower}</span>
                        {skillBonus > 0 && <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1 rounded-sm">S:+{skillBonus}</span>}
                        {equipBonus > 0 && <span className="text-[10px] text-sky-600 font-bold bg-sky-50 px-1 rounded-sm">E:+{equipBonus}</span>}
                      </div>
                    </div>
                    <span className="text-slate-400 text-xs px-2 font-bold">{Math.round(unitPower)} × {qty}</span>
                    <span className="font-bold text-amber-600 min-w-[60px] text-right text-lg">+{Math.round(total)}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-slate-100 font-bold text-lg text-slate-900">
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
            className="fixed inset-0 z-[500] flex items-center justify-center bg-slate-900/80 p-4 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-lg rounded-3xl overflow-hidden flex flex-col shadow-2xl border border-slate-100 font-sans"
            >
              <div className="bg-slate-900 text-white p-6 flex justify-between items-center border-b border-slate-800">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-gradient-to-tr from-amber-400 to-yellow-500 rounded-xl text-slate-900">
                    <Edit2 size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl md:text-2xl font-black italic uppercase tracking-tighter">{t('edit_card_details', language)}</h3>
                    <p className="text-[10px] opacity-60 font-bold uppercase tracking-widest">SLOT_{editingCardIndex + 1}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setEditingCardIndex(null)} 
                  className="w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-red-600 rounded-full transition-all"
                >
                  <X />
                </button>
              </div>

              <div className="p-6 space-y-6">
                 <div className="flex justify-center mb-4">
                    <CardItem 
                      card={currentDeck[editingCardIndex]!} 
                      className="w-32 h-44 shadow-2xl" 
                      customImage={customCardImage} />
                 </div>

                 <div className="space-y-4">
                    <div className="space-y-1.5 font-sans">
                      <label className="text-[10px] font-bold uppercase text-slate-400 ml-1">{t('card_custom_name', language)}</label>
                      <input 
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder={t('name_placeholder', language)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-1.5 font-sans">
                      <label className="text-[10px] font-bold uppercase text-slate-400 ml-1">{t('card_notes', language)}</label>
                      <textarea 
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        placeholder={t('notes_placeholder', language)}
                        rows={4}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all resize-none"
                      />
                    </div>
                 </div>

                 <div className="flex gap-4 pt-4">
                    <button 
                      onClick={() => setEditingCardIndex(null)}
                      className="flex-1 py-4 bg-gray-100 text-black font-black uppercase text-xs rounded-2xl hover:bg-gray-200 transition-all"
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
                      className="flex-1 py-4 bg-slate-900 text-white font-bold uppercase text-xs rounded-2xl hover:bg-indigo-600 transition-all shadow-md active:scale-95 cursor-pointer"
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
            className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-y-auto"
            onClick={() => setSelectedCardForDetail(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-[95%] md:w-[90vw] h-[95vh] md:h-[90vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row relative"
              onClick={e => e.stopPropagation()}
            >
              {/* Close Button Top */}
              <button 
                onClick={() => setSelectedCardForDetail(null)}
                className="absolute top-4 right-4 z-20 p-2 bg-black/10 hover:bg-black/20 rounded-full transition-all"
              >
                <X size={24} />
              </button>

              {/* Left Side: Card Visual & Stats */}
              <div className="w-full md:w-1/2 bg-gray-50 flex flex-col items-center justify-center p-6 gap-4 border-r border-slate-100 shrink-0">
                <CardItem 
                  card={selectedCardForDetail} 
                  isLocked={true} 
                  className="w-32 h-44 shadow-[0_10px_30px_rgba(0,0,0,0.2)] scale-75" 
                  customImage={customCardImage} 
                  />
                
                <div className="w-full">
                   <div className="text-center">
                     <h3 className="text-xl font-black italic uppercase tracking-tighter leading-none">{getFormattedCardName(selectedCardForDetail, language)}</h3>
                     <div className="flex items-center justify-center gap-2 mt-2">
                        <span className={cn(
                          "px-2 py-0.5 text-[9px] font-black uppercase rounded border text-white shadow-sm",
                          ['rare', 'legendary', 'platinum', 'social', 'epic'].includes(selectedCardForDetail.rarity.toLowerCase()) ? "bg-gradient-to-r from-pink-500 to-purple-600 border-pink-400" : 
                          selectedCardForDetail.rarity.toLowerCase() === 'gold' ? "bg-gradient-to-r from-yellow-500 to-amber-600 border-yellow-400 text-yellow-950" :
                          ['silver', 'magic'].includes(selectedCardForDetail.rarity.toLowerCase()) ? "bg-gradient-to-r from-slate-400 to-slate-600 border-slate-300" :
                          "bg-gradient-to-r from-amber-600 to-amber-800 border-amber-500"
                        )}>
                          {selectedCardForDetail.rarity}
                        </span>
                        <span className="text-sm font-black italic opacity-40">Lv.{selectedCardForDetail.level}</span>
                     </div>
                     {isSelectedCardPetEquipped ? (
                       <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-700">
                         <MonsterPetBadge cardId={selectedCardPetId} imageClassName="h-5 w-5" className="border-transparent bg-transparent p-0 shadow-none" />
                         <span>{t('monster_pet_badge', language)}</span>
                       </div>
                     ) : null}
                   </div>
                </div>
              </div>

              {/* Right Side: Tabified Content (ID 88) */}
              <div className="w-full md:w-1/2 p-6 flex flex-col min-h-0 bg-white">
                 {/* Segmented Tab Navigation Bar */}
                 <div className="flex border-b border-slate-200 mb-4 pb-1 gap-1">
                   <button
                     onClick={() => setCardDetailTab('stats')}
                     className={cn(
                       "flex-1 py-1.5 text-center text-xs font-black uppercase transition-all rounded-t-lg border-b-2 cursor-pointer",
                       cardDetailTab === 'stats' 
                         ? "border-indigo-600 text-indigo-600 bg-indigo-50/50" 
                         : "border-transparent text-slate-400 hover:text-slate-600"
                     )}
                   >
                     {language === 'ko' ? '스탯 & 장비' : 'Stats & Gear'}
                   </button>
                   <button
                     onClick={() => setCardDetailTab('skills')}
                     className={cn(
                       "flex-1 py-1.5 text-center text-xs font-black uppercase transition-all rounded-t-lg border-b-2 cursor-pointer",
                       cardDetailTab === 'skills' 
                         ? "border-indigo-600 text-indigo-600 bg-indigo-50/50" 
                         : "border-transparent text-slate-400 hover:text-slate-600"
                     )}
                   >
                     {language === 'ko' ? '스킬 & 노드' : 'Skills & Nodes'}
                   </button>
                   <button
                     onClick={() => setCardDetailTab('lore')}
                     className={cn(
                       "flex-1 py-1.5 text-center text-xs font-black uppercase transition-all rounded-t-lg border-b-2 cursor-pointer",
                       cardDetailTab === 'lore' 
                         ? "border-indigo-600 text-indigo-600 bg-indigo-50/50" 
                         : "border-transparent text-slate-400 hover:text-slate-600"
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
                          <h4 className="text-xs font-black uppercase tracking-widest opacity-40 border-b border-slate-100 pb-1 flex items-center gap-1">
                            <Package size={12} /> {t('equipment', language)}
                          </h4>
                          <div className="grid grid-cols-4 gap-2">
                             {(['necklace', 'ring1', 'ring2', 'boots'] as const).map(slot => {
                               const item = selectedCardForDetail.equipment?.[slot];
                               return (
                                 <div key={slot} className="flex flex-col items-center gap-1">
                                    <div className={cn(
                                      "w-12 h-12 rounded-xl flex items-center justify-center border transition-all",
                                      item ? (
                                        item.rarity === 'rare' ? "bg-yellow-50 border-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.2)]" :
                                        item.rarity === 'magic' ? "bg-blue-50 border-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.2)]" :
                                        "bg-white border-slate-200 shadow-sm"
                                      ) : "bg-slate-50 border-slate-200 border-dashed border-2"
                                    )}>
                                      {slot === 'necklace' ? (
                                        <Package size={20} className={item ? (item.rarity === 'rare' ? 'text-yellow-600' : item.rarity === 'magic' ? 'text-blue-600' : 'text-slate-800') : 'opacity-10'} />
                                      ) : slot === 'boots' ? (
                                        <Footprints size={20} className={item ? (item.rarity === 'rare' ? 'text-yellow-600' : item.rarity === 'magic' ? 'text-blue-600' : 'text-slate-800') : 'opacity-10'} />
                                      ) : (
                                        <Gem size={20} className={item ? (item.rarity === 'rare' ? 'text-yellow-600' : item.rarity === 'magic' ? 'text-blue-600' : 'text-slate-800') : 'opacity-10'} />
                                      )}
                                    </div>
                                    <span className="text-[8px] font-bold uppercase text-slate-400">{slot}</span>
                                 </div>
                               )
                             })}
                          </div>
                        </div>

                        {/* Monster Pet */}
                        <div className="space-y-3 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <h4 className="text-xs font-black uppercase tracking-widest text-emerald-700 flex items-center gap-2">
                                <PawPrint size={12} />
                                {t('monster_pet_section_title', language)}
                              </h4>
                              <p className="mt-1 text-[11px] font-semibold text-slate-600 leading-relaxed">
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
                              'rounded-full border px-2.5 py-1 uppercase tracking-wider',
                              isSelectedCardMonsterPetCandidate
                                ? 'border-emerald-200 bg-white text-emerald-700'
                                : 'border-slate-200 bg-white text-slate-500'
                            )}>
                              {isSelectedCardMonsterPetCandidate
                                ? t(`monster_pet_candidate_${selectedMonsterPetGroup ?? 'monster'}`, language)
                                : t('monster_pet_candidate_none', language)}
                            </span>
                            <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-slate-500">
                              {representativeCardId
                                ? t('monster_pet_hint_target_ready', language)
                                : t('monster_pet_hint_profile_avatar', language)}
                            </span>
                          </div>
                          <div className="rounded-xl border border-white/80 bg-white/90 p-3 text-[11px] font-semibold text-slate-600 leading-relaxed">
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
                              className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-[11px] font-black uppercase tracking-wider text-white shadow-sm transition-all active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-300"
                            >
                              <PawPrint size={14} />
                              {t('monster_pet_action_set', language)}
                            </button>
                            <button
                              type="button"
                              onClick={handleClearMonsterPet}
                              disabled={!representativePetCardId}
                              className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-[11px] font-black uppercase tracking-wider text-slate-700 shadow-sm transition-all active:scale-95 disabled:cursor-not-allowed disabled:text-slate-350"
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
                            onAction={handleHeroCareAction}
                            onClaimReward={handleHeroCareRewardClaim}
                          />
                        )}
                      </div>
                    )}

                    {/* TAB 2: SKILLS & ABILITIES */}
                    {cardDetailTab === 'skills' && (
                      <div className="space-y-3">
                         <h4 className="text-xs font-black uppercase tracking-widest opacity-40 border-b border-slate-100 pb-1 flex items-center gap-1">
                           <Zap size={12} fill="currentColor" /> {t('skills', language)}
                         </h4>
                         <div className="space-y-2">
                            {(!selectedCardForDetail.skills || selectedCardForDetail.skills.filter((s: any) => s.level > 0).length === 0) ? (
                              <p className="text-[10px] font-bold opacity-30 italic">{t('no_skills_available', language) || 'No abilities discovered yet'}</p>
                            ) : (
                              selectedCardForDetail.skills.filter((s: any) => s.level > 0).map((skill: any) => {
                                const baseSkill = INITIAL_SKILLS.find(s => s.id === skill.id) || skill;
                                const Icon = iconMap[baseSkill.icon] || Zap;
                                return (
                                  <div key={skill.id} className="flex gap-3 p-3 bg-gray-50 rounded-xl border border-slate-100">
                                     <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
                                        <Icon size={16} />
                                     </div>
                                     <div className="min-w-0">
                                        <div className="flex justify-between items-center mb-0.5">
                                           <span className="text-[11px] font-black italic uppercase leading-none">{language === 'ko' ? baseSkill.name : baseSkill.name_en}</span>
                                           <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-1 rounded">Lv.{skill.level}</span>
                                        </div>
                                        <p className="text-[10px] font-bold opacity-50 leading-tight">
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
                              <h4 className="text-xs font-black uppercase tracking-widest opacity-40 border-b border-slate-100 pb-1 flex items-center gap-1">
                                <BookOpen size={12} /> {t('card_lore_title', language) || 'Card Lore & Story'}
                              </h4>
                              {loreText ? (
                                <div className="p-4 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl border border-amber-200/50 shadow-inner">
                                  <p className="text-[11px] leading-relaxed font-medium text-amber-950/80 italic whitespace-pre-line">
                                    "{loreText}"
                                  </p>
                                </div>
                              ) : (
                                <p className="text-[10px] font-bold opacity-30 italic">No lore record found for this card.</p>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    )}
                 </div>

                 {/* Bottom Action Buttons */}
                 <div className="mt-6 grid grid-cols-2 gap-3 shrink-0 pt-2 border-t border-slate-100">
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
                      className="py-4 bg-gray-100 hover:bg-gray-200 text-black rounded-2xl font-black uppercase italic tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2"
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
                      className="py-4 bg-black hover:bg-blue-600 text-white rounded-2xl font-black uppercase italic tracking-widest transition-all active:scale-95 shadow-xl flex items-center justify-center gap-2"
                    >
                      <Zap size={16} fill="currentColor" />
                      {t('equip', language) || 'Equip'}
                    </button>
                 </div>
                 <div className="mt-3 grid grid-cols-2 gap-3 shrink-0">
                   <button
                     onClick={() => {
                       playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                       onNavigate('world-codex');
                       setSelectedCardForDetail(null);
                     }}
                     className="py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase italic tracking-widest transition-all active:scale-95 shadow-xl flex items-center justify-center gap-2 text-[11px]"
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
                     className="py-3.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-2xl font-black uppercase italic tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 text-[11px]"
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
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowOptimizeSuccessModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white border border-slate-100 p-8 rounded-3xl shadow-2xl max-w-sm w-full space-y-6 text-center select-none font-sans"
              onClick={e => e.stopPropagation()}
            >
              <div className="mx-auto w-16 h-16 bg-gradient-to-tr from-amber-400 to-yellow-500 border border-amber-300 rounded-full flex items-center justify-center shadow-md animate-bounce">
                <Trophy size={28} className="text-slate-900" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold uppercase tracking-tight text-slate-800 leading-none">
                  {language === 'ko' ? '최적화 완료!' : 'DECK OPTIMIZED!'}
                </h3>
                <p className="text-xs font-bold text-slate-400 leading-tight">
                  {t('deck_optimized_success', language)}
                </p>
              </div>
              <button
                onClick={() => setShowOptimizeSuccessModal(false)}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3.5 rounded-xl font-bold uppercase tracking-wider text-xs shadow-md active:scale-95 transition-all cursor-pointer"
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
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm"
            onClick={() => setIsAchievementsModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-150 shadow-2xl font-sans"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 bg-slate-900 text-white flex justify-between items-center shrink-0 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-tr from-amber-400 to-yellow-500 text-slate-900 rounded-xl">
                    <Trophy size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold uppercase tracking-tight italic leading-none">{t('my_achievements', language)}</h3>
                    <p className="text-[10px] uppercase opacity-40 mt-1 tracking-widest">{t('achievements_desc', language)}</p>
                  </div>
                </div>
                <button onClick={() => setIsAchievementsModalOpen(false)} className="hover:bg-white/10 p-2 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="flex gap-2 p-4 bg-slate-50 border-b border-slate-200 overflow-x-auto scrollbar-hide shrink-0">
                {(['all', 'battle', 'collection', 'growth', 'special', 'social'] as const).map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={cn(
                      "px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg border transition-all shrink-0 cursor-pointer shadow-xs",
                      activeCategory === cat ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-400 border-slate-200 hover:border-slate-300"
                    )}
                  >
                    {cat === 'all' ? (language === 'ko' ? '전체' : 'ALL') : t(`category_${cat}`, language)}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-gray-50/30">
                {ALL_ACHIEVEMENTS.filter(a => activeCategory === 'all' || a.category === activeCategory).map(achievement => {
                  const isUnlocked = unlockedAchievements.includes(achievement.id);
                  const progress = achievementProgress[achievement.id] || 0;
                  const percent = Math.min(100, (progress / achievement.targetValue) * 100);
                  
                  return (
                    <div 
                      key={achievement.id}
                      className={cn(
                        "p-4 rounded-2xl border transition-all relative overflow-hidden group/ach font-sans",
                        isUnlocked ? "bg-amber-50/80 border-amber-300 shadow-md" : "bg-white border-slate-150 shadow-sm opacity-80 hover:opacity-100"
                      )}
                    >
                      <div className="flex justify-between items-start relative z-10">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {isUnlocked ? <StarIcon size={14} className="text-yellow-600 fill-current" /> : <Shield size={14} className="text-gray-400" />}
                            <h4 className="text-sm font-bold uppercase tracking-tight text-slate-800">{achievement.title[language] || achievement.title['ko']}</h4>
                          </div>
                          <p className="text-[10px] font-bold opacity-60 leading-tight pr-8">
                            {achievement.description[language] || achievement.description['ko']}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-[9px] font-bold uppercase mb-1 opacity-30">{t('reward', language)}</div>
                          <div className="flex items-center gap-1 justify-end mb-2">
                            <span className="text-xs font-black italic text-blue-600">+{achievement.rewardAmount}</span>
                            <span className="text-[9px] font-bold uppercase opacity-40 tracking-tighter">{achievement.rewardType}</span>
                          </div>
                             {isUnlocked ? (
                               claimedAchievements.includes(achievement.id) ? (
                                 <div className="text-[9px] font-bold bg-slate-100 text-slate-400 px-3 py-1.5 rounded-lg uppercase flex items-center gap-1">
                                    <StarIcon size={8} />
                                    {language === 'ko' ? '수령완료' : 'CLAIMED'}
                                 </div>
                               ) : (
                                 <button 
                                   onClick={() => claimAchievementReward?.(achievement.id)}
                                   className="text-[9px] font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3 py-1.5 rounded-lg shadow-sm hover:shadow-md hover:from-blue-700 hover:to-indigo-700 active:scale-95 transition-all uppercase cursor-pointer"
                                 >
                                    {language === 'ko' ? '획득하기' : 'CLAIM'}
                                 </button>
                               )
                             ) : (
                               <div className="text-[9px] font-bold bg-slate-50 text-slate-300 px-3 py-1.5 rounded-lg uppercase">
                                  {language === 'ko' ? '미달성' : 'LOCKED'}
                               </div>
                             )}
                        </div>
                      </div>

                      <div className="mt-4 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${percent}%` }}
                          className={cn(
                            "h-full rounded-full transition-all duration-1000",
                            isUnlocked ? "bg-amber-400" : "bg-blue-500"
                          )}
                        />
                      </div>
                      <div className="flex justify-between mt-2 px-1">
                        <span className="text-[8px] font-bold uppercase opacity-40 tracking-widest">{t('achievement_progress', language)}</span>
                        <span className="text-[8px] font-bold italic text-slate-500">
                          {progress.toLocaleString()} / {achievement.targetValue.toLocaleString()} ({percent.toFixed(0)}%)
                        </span>
                      </div>

                      {isUnlocked && (
                         <div className="absolute top-0 right-0 p-1.5 bg-yellow-400 text-amber-950 text-[7px] font-black uppercase transform rotate-45 translate-x-4 -translate-y-2 shadow-sm border border-amber-300/30">
                            {t('achievement_unlocked', language)}
                         </div>
                      )}
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
            className="fixed inset-0 z-[209] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsHelpOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl max-w-lg w-full"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4 sticky top-0 z-10 bg-white pt-2">
                <h3 className="text-lg font-extrabold text-slate-800">
                  {language === 'ko' ? '도움말' : 'Help'}
                </h3>
                <button
                  onClick={() => setIsHelpOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {helpStep === 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-slate-700">
                    {language === 'ko' ? '간소화된 덱 관리' : 'Simplified Deck Management'}
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {language === 'ko'
                      ? '덱 관리 화면이 미니멀하게 재구성되었습니다. 불필요한 설명 텍스트와 배지가 제거되고, 핵심 기능(덱 편성, 최적화, 합성, 전투 통계)만 남았습니다.'
                      : 'The deck management screen has been redesigned with minimalism in mind. Unnecessary descriptions and badges have been removed, leaving only core features: deck composition, optimization, combining, and battle stats.'}
                  </p>
                </div>
              )}

              {helpStep === 1 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-slate-700">
                    {language === 'ko' ? '오늘의 카드 / 추천 카드' : 'Today\'s Card / Recommended Cards'}
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {language === 'ko'
                      ? '오늘의 캐릭터와 팩션 추천 카드 섹션이 바로가기 버튼으로 대체되었습니다. 카드 백과, 웹툰, 상점으로 빠르게 이동할 수 있습니다.'
                      : 'The today\'s character and faction recommendation sections have been replaced with shortcut buttons. You can quickly navigate to the card wiki, webtoon, and shop.'}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between mt-5 pt-3 border-t border-slate-100">
                <button
                  onClick={() => setHelpStep(prev => Math.max(0, prev - 1))}
                  disabled={helpStep === 0}
                  className="p-2 rounded-full hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="text-xs font-bold text-slate-400">
                  {helpStep + 1} / 2
                </span>
                <button
                  onClick={() => setHelpStep(prev => Math.min(1, prev + 1))}
                  disabled={helpStep === 1}
                  className="p-2 rounded-full hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
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

    </div>
  );
};

export default MyDeckView;
