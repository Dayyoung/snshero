import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, Bot, Compass, Pause, Play, RotateCcw, Sparkles, Swords, X } from 'lucide-react';
import { t } from '../lib/i18n';
import { cn, getCardSpriteStyle } from '../lib/utils';
import { isSfxMutedGlobal } from '../lib/sound';
import type { CardData, CardElement, CardRarity, ItemRarity, Language, ViewType } from '../types';
import {
 KADAN_RPG_EVENTS,
 getDynamicKadanEncounter,
 getKadanRewardRarity,
 getKadanRpgEncounter,
 getKadanRpgRegion,
 getKadanRpgReward,
 type KadanRpgEvent,
 type KadanRpgReward,
 type KadanRpgTile,
} from '../content/kadanRpgStory';
import { useKadanRpgProgress } from '../hooks/useKadanRpgProgress';
import { useKadanRpgAutoRunner } from '../hooks/useKadanRpgAutoRunner';
import { KadanWorldMap } from '../components/rpg/KadanWorldMap';
import { KadanNpcDialog } from '../components/rpg/KadanNpcDialog';
import { KadanRewardModal } from '../components/rpg/KadanRewardModal';
import { EpisodeMediaWatchModal, EPISODE_MEDIA_WATCH_REWARD_SNS } from '../components/rpg/EpisodeMediaWatchModal';
import { CARD_DATABASE } from '../cardDatabase';
import { INITIAL_CARDS, getCardPower } from '../constants';
import type { KadanBattleResult } from '../lib/kadanRpgBattle';
import { KADAN_RPG_NOVEL_SCRIPTS } from '../content/kadanRpgNovelScript';
import { AdSenseBanner } from '../components/AdSenseBanner';
import { MobileCardPlayScreen } from './MobileCardPlayScreen';
import { isDemoPlayActive, setDemoPlayStep, stopDemoPlay } from '../lib/demoPlayService';
import { isRankingDiverted, handleDivertedMatchResult, endRankingDivert } from '../lib/rankingDivertService';
import { shouldTriggerAmbush, generateAmbushEncounter, type AmbushEncounter } from '../lib/rpg/kadanRpgAmbush';

interface KadanRpgViewProps {
 isAdRemoved?: boolean;
 language: Language;
 currentSeason: string;
 currentDeck: Array<CardData | null>;
 totalPower: number;
 sns: number;
 lowSpecMode: boolean;
 onNavigate: (view: ViewType) => void;
 updateSns: (amount: number, reason?: string, typeOrTarget?: 'earned' | 'purchased' | string, targetName?: string) => Promise<void>;
 addCard: (rarity: CardRarity, indexOverride?: number, isSilent?: boolean) => void;
 addItem: (rarity?: ItemRarity, idOverride?: string) => unknown;
 showCustomAlert: (title: string, message: string, autoCloseSeconds?: number) => void;
 onBattleStateChange?: (inBattle: boolean) => void;
}

const sameTile = (a: KadanRpgTile | null, b: KadanRpgTile | null): boolean => (
 Boolean(a && b && a.x === b.x && a.y === b.y)
);

const clampTile = (tile: KadanRpgTile, width: number, height: number): KadanRpgTile => ({
 x: Math.max(0, Math.min(width - 1, tile.x)),
 y: Math.max(0, Math.min(height - 1, tile.y)),
});

const stepToward = (from: KadanRpgTile, to: KadanRpgTile): KadanRpgTile => {
 if (from.x !== to.x) return { x: from.x + Math.sign(to.x - from.x), y: from.y };
 if (from.y !== to.y) return { x: from.x, y: from.y + Math.sign(to.y - from.y) };
 return from;
};

const formatStageTitle = (event: KadanRpgEvent | null, language: Language): string => {
 if (!event) return t('kadan_rpg_ending_seen', language);
 return `${String(event.chapterNumber).padStart(2, '0')}. ${t(event.chapterTitleKey, language)}`;
};

const getBuffedPlayerDeck = (deck: Array<CardData | null>): CardData[] => {
  const rawDeck = deck.filter((c): c is CardData => Boolean(c));
  try {
    const rawBuff = localStorage.getItem('hero_kadan_active_buff');
    if (!rawBuff) return rawDeck;
    const buff = JSON.parse(rawBuff);
    const buffVal = typeof buff.value === 'number' ? buff.value : (buff.id === 'atk_boost' ? 15 : buff.id === 'mana_surge' ? 20 : 15);
    const multiplier = 1.0 + (buffVal / 100.0);
    return rawDeck.map((card) => ({
      ...card,
      power: Math.round((card.power || 100) * multiplier),
    }));
  } catch {
    return rawDeck;
  }
};

export const KadanRpgView: React.FC<KadanRpgViewProps> = ({
 isAdRemoved = false,
 language,
 currentSeason,
 currentDeck,
 totalPower,
 sns,
 lowSpecMode,
 onNavigate,
 updateSns,
 addCard,
 addItem,
 showCustomAlert,
 onBattleStateChange,
}) => {
 const {
 progress,
 nextEvent,
 setAutoMode,
 setLastTile,
 markNpcMet,
 markChestOpened,
 markEncounterCleared,
 markRewardClaimed,
 completeEvent,
 resetProgress,
 reincarnateProgress,
 } = useKadanRpgProgress(currentSeason);

 const currentRegion = getKadanRpgRegion(nextEvent?.regionId ?? progress.currentRegionId);
 const regionEvents = useMemo(() => (
 KADAN_RPG_EVENTS.filter((event) => event.regionId === currentRegion.id)
 ), [currentRegion.id]);

 const [heroTile, setHeroTile] = useState<KadanRpgTile>(() => clampTile(progress.lastTile, currentRegion.width, currentRegion.height));
 const [targetTile, setTargetTile] = useState<KadanRpgTile | null>(nextEvent?.tile ?? null);
 const [activeEvent, setActiveEvent] = useState<KadanRpgEvent | null>(null);
 const [battleEvent, setBattleEvent] = useState<KadanRpgEvent | null>(null);
 const [rewardEvent, setRewardEvent] = useState<KadanRpgEvent | null>(null);
 const [mediaPromptEvent, setMediaPromptEvent] = useState<KadanRpgEvent | null>(null);
 const [mediaPromptChapterReward, setMediaPromptChapterReward] = useState<{ reward: KadanRpgReward; totalSns: number } | null>(null);
 const [isMoving, setIsMoving] = useState(false);
 const [heroStepCount, setHeroStepCount] = useState(0);
 const [lastAmbushStep, setLastAmbushStep] = useState(-99);
 const [ambushedInLeg, setAmbushedInLeg] = useState(false);
 const [currentChapterLegId, setCurrentChapterLegId] = useState<string | null>(nextEvent?.id ?? null);
 const [ambushAlert, setAmbushAlert] = useState<AmbushEncounter | null>(null);
 const [ambushBattle, setAmbushBattle] = useState<AmbushEncounter | null>(null);
 const [ambushCountdown, setAmbushCountdown] = useState<number>(1.0);

 const activeEncounter = useMemo(() => {
 if (!battleEvent) return undefined;
 return getDynamicKadanEncounter(battleEvent, progress.rebirthLevel);
 }, [battleEvent, progress.rebirthLevel]);

 const activeReward = rewardEvent?.rewardId ? getKadanRpgReward(rewardEvent.rewardId) : undefined;

 const isBattling = Boolean((activeEncounter && battleEvent) || ambushBattle);

 const rpgOpponent = useMemo(() => {
 if (!activeEncounter || !battleEvent) return null;

 const diffBonus = activeEncounter.difficulty === 'boss' ? 2 : activeEncounter.difficulty === 'hard' ? 1 : activeEncounter.difficulty === 'normal' ? 0 : -1;
 const rebirthBonus = Math.max(0, Math.floor(progress.rebirthLevel));
 const totalBonus = diffBonus + Math.min(3, rebirthBonus);

 const boostStat = (val: number) => Math.max(1, Math.min(10, val + totalBonus));

 const oppCards: CardData[] = activeEncounter.opponentCardIds.map((cardId, idx) => {
 const base = CARD_DATABASE[cardId];
 if (!base) return INITIAL_CARDS[0];

 const scaledLevel = Math.min(10, base.level + Math.max(0, progress.rebirthLevel) + (activeEncounter.difficulty === 'boss' ? 1 : 0));
 const scaledPower = (base.power || 100) + totalBonus * 30 + Math.floor(battleEvent.chapterNumber * 3);

 const card: CardData = {
 id: `kadan-card-${cardId}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
 title: base.title,
 title_en: base.title_en,
 title_dis: base.title,
 stats: [boostStat(base.top), boostStat(base.right), boostStat(base.bottom), boostStat(base.left)],
 element: (base.element || 'neutral') as CardElement,
 rarity: (scaledLevel >= 6 || progress.rebirthLevel >= 2 ? 'UR' : scaledLevel >= 4 ? 'SSR' : scaledLevel >= 3 ? 'SR' : scaledLevel >= 2 ? 'R' : 'N'),
 power: scaledPower,
 imageIndex: base.id,
 level: scaledLevel,
 };
 return card;
 });

 const rebirthLabel = progress.rebirthLevel > 0
 ? (language === 'ko' ? ` (환생 ${progress.rebirthLevel}회차)` : ` (Rebirth Lv.${progress.rebirthLevel})`)
 : '';
 const chapterPrefix = language === 'ko'
 ? `[제 ${battleEvent.chapterNumber}화] `
 : `[Ch.${battleEvent.chapterNumber}] `;

 return {
 id: `kadan-${activeEncounter.id}`,
 name: `${chapterPrefix}${t(activeEncounter.opponentNameKey, language)}${rebirthLabel}`,
 deck: oppCards,
 totalPower: oppCards.reduce((acc, c) => acc + (c.power || 0), 0),
 };
 }, [activeEncounter, battleEvent, language, progress.rebirthLevel]);

 const isCurrentlyInBattle = Boolean((activeEncounter && battleEvent && rpgOpponent) || ambushBattle);

 useEffect(() => {
 onBattleStateChange?.(isCurrentlyInBattle);
 if (isCurrentlyInBattle) {
 window.dispatchEvent(new CustomEvent('snshero-rpg-battle-state', { detail: { inBattle: true } }));
 window.dispatchEvent(new Event('snshero-help-popup-open'));
 } else {
 window.dispatchEvent(new CustomEvent('snshero-rpg-battle-state', { detail: { inBattle: false } }));
 window.dispatchEvent(new Event('snshero-help-popup-close'));
 }
 return () => {
 onBattleStateChange?.(false);
 window.dispatchEvent(new CustomEvent('snshero-rpg-battle-state', { detail: { inBattle: false } }));
 window.dispatchEvent(new Event('snshero-help-popup-close'));
 };
 }, [isCurrentlyInBattle, onBattleStateChange]);

 const isComplete = !nextEvent;
 const [isEndingDismissed, setIsEndingDismissed] = useState(false);
 const [rebirthCountdown, setRebirthCountdown] = useState<number>(3.0);
 const [dismissedEventId, setDismissedEventId] = useState<string | null>(null);
 const isAtTarget = sameTile(heroTile, nextEvent?.tile ?? null);
 const hasDialog = Boolean(activeEvent && activeEvent.nodeType !== 'enemy' && !battleEvent && !rewardEvent);
 const hasBattle = Boolean(activeEvent && activeEvent.nodeType === 'enemy' && !battleEvent && !rewardEvent);
 const hasReward = Boolean(rewardEvent && activeReward);

 // 데모모드 또는 랭킹분기 상태에서 /main 진입 시 autoMode 자동 강제 활성화
 useEffect(() => {
 if ((isDemoPlayActive() || isRankingDiverted()) && !progress.autoMode) {
 setAutoMode(true);
 }
 }, [progress.autoMode, setAutoMode]);

 // 스토리 완결(isComplete) 도달 시 자동모드에서는 닫힌 팝업도 다시 열어 자동 환생 루프 보장
 useEffect(() => {
 if (isComplete && isEndingDismissed && (progress.autoMode || isDemoPlayActive() || isRankingDiverted())) {
 setIsEndingDismissed(false);
 }
 }, [isComplete, isEndingDismissed, progress.autoMode]);

 // Auto mode setting is persisted in local storage and managed by user toggle
 useEffect(() => {
 const region = getKadanRpgRegion(nextEvent?.regionId ?? progress.currentRegionId);
 setHeroTile(clampTile(progress.lastTile, region.width, region.height));
 setTargetTile(nextEvent?.tile ?? null);
 setDismissedEventId(null);
 }, [nextEvent, progress.currentChapterId, progress.currentRegionId, progress.rebirthLevel]);

 useEffect(() => {
  if (nextEvent?.id && nextEvent.id !== currentChapterLegId) {
   setCurrentChapterLegId(nextEvent.id);
   setAmbushedInLeg(false);
  }
 }, [nextEvent?.id, currentChapterLegId]);

 useEffect(() => {
  if (!targetTile || sameTile(heroTile, targetTile) || ambushAlert || ambushBattle) {
   setIsMoving(false);
   return;
  }

  setIsMoving(true);
  const timer = window.setTimeout(() => {
   setHeroTile((previous) => {
    const next = stepToward(previous, targetTile);
    setLastTile(next);

    const nextStep = heroStepCount + 1;
    setHeroStepCount(nextStep);

    const isDest = sameTile(next, targetTile);
    const isStart = sameTile(next, currentRegion.startTile);

    const triggered = shouldTriggerAmbush(
     nextStep,
     lastAmbushStep,
     ambushedInLeg,
     isDest,
     undefined,
     isStart
    );

    if (triggered && !activeEvent && !battleEvent && !rewardEvent) {
     const encounter = generateAmbushEncounter(
      nextEvent?.chapterNumber ?? 1,
      progress.rebirthLevel,
      currentRegion.id
     );
     setLastAmbushStep(nextStep);
     setAmbushedInLeg(true);
     setAmbushAlert(encounter);
    }

    return next;
   });
  }, lowSpecMode ? 110 : 180);

  return () => window.clearTimeout(timer);
 }, [
  heroTile,
  lowSpecMode,
  setLastTile,
  targetTile,
  ambushAlert,
  ambushBattle,
  heroStepCount,
  lastAmbushStep,
  ambushedInLeg,
  currentRegion,
  nextEvent,
  progress.rebirthLevel,
  activeEvent,
  battleEvent,
  rewardEvent,
 ]);

 const pauseForManualInput = useCallback(() => {
 if (progress.autoMode) setAutoMode(false);
 }, [progress.autoMode, setAutoMode]);

 const moveToEvent = useCallback((event: KadanRpgEvent) => {
 setTargetTile(event.tile);
 }, []);

 const openEvent = useCallback((event: KadanRpgEvent) => {
 setActiveEvent(event);
 if (event.nodeType === 'npc' || event.nodeType === 'story' || event.nodeType === 'portal') {
 markNpcMet(event.id);
 }
 if (event.nodeType === 'chest') {
 markChestOpened(event.id);
 }
 }, [markChestOpened, markNpcMet]);

 useEffect(() => {
 if (isMoving || activeEvent || battleEvent || rewardEvent || mediaPromptEvent || !targetTile || ambushAlert || ambushBattle) return;
 if (!sameTile(heroTile, targetTile)) return;

 const arrivedEvent = regionEvents.find((event) => sameTile(event.tile, targetTile));
 if (arrivedEvent) {
 if (dismissedEventId === arrivedEvent.id) {
 setTargetTile(null);
 return;
 }
 openEvent(arrivedEvent);
 setTargetTile(null);
 }
 }, [activeEvent, battleEvent, dismissedEventId, heroTile, isMoving, mediaPromptEvent, openEvent, regionEvents, rewardEvent, targetTile, ambushAlert, ambushBattle]);

 const handleEventPress = useCallback((event: KadanRpgEvent) => {
 pauseForManualInput();
 setDismissedEventId(null);
 if (sameTile(heroTile, event.tile)) {
 openEvent(event);
 setTargetTile(null);
 } else {
 setTargetTile(event.tile);
 }
 }, [heroTile, openEvent, pauseForManualInput]);

 const handleTilePress = useCallback((tile: KadanRpgTile) => {
 pauseForManualInput();
 setDismissedEventId(null);
 setTargetTile(clampTile(tile, currentRegion.width, currentRegion.height));
 }, [currentRegion.height, currentRegion.width, pauseForManualInput]);

 const completeActiveEvent = useCallback((event: KadanRpgEvent) => {
 completeEvent(event.id, heroTile);
 setActiveEvent(null);
 setBattleEvent(null);
 setRewardEvent(null);
 setMediaPromptEvent(null);
 setMediaPromptChapterReward(null);
 setDismissedEventId(null);

 const nextChapterEvent = KADAN_RPG_EVENTS.find((e) => e.chapterNumber === event.chapterNumber + 1);
 if (nextChapterEvent) {
 setTargetTile(nextChapterEvent.tile);
 }
 }, [completeEvent, heroTile]);

 const openEpisodeEndMediaPrompt = useCallback(async (event: KadanRpgEvent) => {
 let claimedInfo: { reward: KadanRpgReward; totalSns: number } | null = null;

 if (event.rewardId && !progress.claimedRewardIds.includes(event.rewardId)) {
 const reward = getKadanRpgReward(event.rewardId);
 if (reward) {
 const rebirthMultiplier = 1 + (progress.rebirthLevel * 0.25);
 const totalSns = reward.sns > 0 ? Math.ceil(reward.sns * rebirthMultiplier) : 0;
 if (totalSns > 0) {
 const reason = progress.rebirthLevel > 0
 ? `${t('kadan_rpg_reward_reason', language)} (${progress.rebirthLevel}환 +${progress.rebirthLevel * 25}%)`
 : t('kadan_rpg_reward_reason', language);
 await updateSns(totalSns, reason, 'earned');
 }
 reward.cardIds.forEach((cardId) => {
 addCard(getKadanRewardRarity(cardId), cardId, progress.autoMode);
 });
 if (reward.itemRarity) {
 addItem(reward.itemRarity);
 }
 markRewardClaimed(reward.id);
 claimedInfo = { reward, totalSns };
 }
 }

 setActiveEvent(null);
 setBattleEvent(null);
 setRewardEvent(null);
 setMediaPromptChapterReward(claimedInfo);
 setMediaPromptEvent(event);
 }, [
 addCard,
 addItem,
 language,
 markRewardClaimed,
 progress.autoMode,
 progress.claimedRewardIds,
 progress.rebirthLevel,
 updateSns,
 ]);

 const handleClaimEpisodeMediaReward = useCallback(async (mediaType: 'anime' | 'movie', chapterNum: number) => {
 const mediaLabelKo = mediaType === 'anime' ? '애니메이션' : '무비(시네마)';
 const mediaLabelEn = mediaType === 'anime' ? 'Animation' : 'Movie';
 const reason = language === 'ko'
 ? `[스토리 제 ${chapterNum}화] ${mediaLabelKo} 시청 보상`
 : `[Story EP.${chapterNum}] ${mediaLabelEn} Watch Bonus`;

 await updateSns(EPISODE_MEDIA_WATCH_REWARD_SNS, reason, 'earned');

 try {
 localStorage.setItem(`hero_story_media_watch_ep_${chapterNum}`, 'true');
 const storageKey = mediaType === 'anime'
 ? `hero_movie_watched_${currentSeason}`
 : `hero_cinema_watched_${currentSeason}`;
 const rawList = localStorage.getItem(storageKey);
 const watchedList: number[] = rawList ? JSON.parse(rawList) : [];
 if (!watchedList.includes(chapterNum)) {
 localStorage.setItem(storageKey, JSON.stringify([...watchedList, chapterNum]));
 }
 } catch {}

 showCustomAlert(
 language === 'ko' ? `제 ${chapterNum}화 ${mediaLabelKo} 시청 보상 지급!` : `EP.${chapterNum} ${mediaLabelEn} Reward Granted!`,
 language === 'ko'
 ? `유튜브 영상을 시청하고 돌아오셔서 +${EPISODE_MEDIA_WATCH_REWARD_SNS} SNS 보상이 지급되었습니다!`
 : `You earned +${EPISODE_MEDIA_WATCH_REWARD_SNS} SNS for watching Episode ${chapterNum}!`,
 2
 );
 }, [currentSeason, language, showCustomAlert, updateSns]);

 const claimReward = useCallback(async (event: KadanRpgEvent) => {
 await openEpisodeEndMediaPrompt(event);
 }, [openEpisodeEndMediaPrompt]);

 const handleBattleComplete = useCallback((result: KadanBattleResult) => {
 if (!battleEvent) return;
 try {
  localStorage.removeItem('hero_kadan_active_buff');
 } catch {}
 const encounter = getDynamicKadanEncounter(battleEvent, progress.rebirthLevel);
 if (!encounter) return;

 // 랭킹 분기 또는 데모 모드일 때 매치 결과 기록 및 3전 완료 시 랭킹 자동 복귀 처리
 if (isRankingDiverted() || isDemoPlayActive()) {
 handleDivertedMatchResult(result, onNavigate, language, showCustomAlert, true);
 }

 if (result === 'win' || result === 'draw' || encounter.allowLossProgress) {
 markEncounterCleared(encounter.id);
 setBattleEvent(null);
 void openEpisodeEndMediaPrompt(battleEvent);
 return;
 }

 setBattleEvent(null);
 setActiveEvent(battleEvent);
 showCustomAlert(t('kadan_rpg_battle_loss_title', language), t('kadan_rpg_battle_loss_desc', language), 3);
 }, [battleEvent, language, markEncounterCleared, onNavigate, openEpisodeEndMediaPrompt, progress.rebirthLevel, showCustomAlert]);

 const handleEngageAmbush = useCallback(() => {
  if (!ambushAlert) return;
  setAmbushBattle(ambushAlert);
  setAmbushAlert(null);
 }, [ambushAlert]);

 const handleRetreatAmbush = useCallback(() => {
  setAmbushAlert(null);
  if (progress.autoMode) setAutoMode(false);
  showCustomAlert(
   language === 'ko' ? '기습 후퇴' : 'Ambush Avoided',
   language === 'ko' ? '산적들의 기습을 피해 안전하게 우회했습니다.' : 'Safely avoided the ambush.',
   2
  );
 }, [language, progress.autoMode, setAutoMode, showCustomAlert]);

 useEffect(() => {
  if (!ambushAlert || !progress.autoMode) {
   setAmbushCountdown(1.0);
   return;
  }

  const durationMs = 1000;
  const deadline = Date.now() + durationMs;
  setAmbushCountdown(1.0);

  let hasEngaged = false;
  const intervalId = window.setInterval(() => {
   const remainingMs = Math.max(0, deadline - Date.now());
   setAmbushCountdown(remainingMs / 1000);

   if (remainingMs <= 0 && !hasEngaged) {
    hasEngaged = true;
    window.clearInterval(intervalId);
    handleEngageAmbush();
   }
  }, 50);

  return () => {
   window.clearInterval(intervalId);
  };
 }, [ambushAlert, handleEngageAmbush, progress.autoMode]);

 const handleAmbushBattleComplete = useCallback(async (result: KadanBattleResult) => {
  if (!ambushBattle) return;
  const currentEncounter = ambushBattle;

  try {
   localStorage.removeItem('hero_kadan_active_buff');
  } catch {}

  if (result === 'win' || result === 'draw') {
   const earnedSns = currentEncounter.spoilsCoins;
   await updateSns(earnedSns, 'kadan_rpg_ambush_victory', 'earned');

   if (Math.random() < 0.25 && currentEncounter.deck.length > 0) {
    const dropCard = currentEncounter.deck[Math.floor(Math.random() * currentEncounter.deck.length)];
    if (dropCard.imageIndex) {
     addCard(getKadanRewardRarity(dropCard.imageIndex), dropCard.imageIndex, progress.autoMode);
    }
   }

   if (Math.random() < 0.15) {
    const itemRarity: ItemRarity = (nextEvent?.chapterNumber ?? 1) > 15 ? 'magic' : 'normal';
    addItem(itemRarity);
   }

   showCustomAlert(
    language === 'ko' ? '기습 격퇴 성공!' : 'Ambush Repelled!',
    language === 'ko'
     ? `${currentEncounter.name}을(를) 격퇴하고 +${earnedSns} SNS를 획득했습니다!`
     : `Defeated ${currentEncounter.nameEn} and gained +${earnedSns} SNS!`,
    3
   );
  } else {
   showCustomAlert(
    language === 'ko' ? '기습 안전 탈출' : 'Safe Retreat',
    language === 'ko'
     ? '산적들의 기습을 뿌리치고 무사히 탈출했습니다!'
     : 'You broke through the ambush and safely retreated!',
    3
   );
  }

  setAmbushBattle(null);
 }, [addCard, addItem, ambushBattle, language, nextEvent?.chapterNumber, progress.autoMode, showCustomAlert, updateSns]);

 const autoRunner = useKadanRpgAutoRunner({
 enabled: progress.autoMode,
 isComplete,
 hasTarget: Boolean(nextEvent),
 isAtTarget,
 hasDialog,
 hasBattle,
 hasReward,
 isBusy: isMoving || Boolean(battleEvent) || Boolean(mediaPromptEvent) || Boolean(activeEvent && !battleEvent && !rewardEvent) || Boolean(ambushAlert) || Boolean(ambushBattle),
 onMoveToTarget: () => {
 if (nextEvent) moveToEvent(nextEvent);
 },
 onInteractTarget: () => {
 if (nextEvent && dismissedEventId !== nextEvent.id) openEvent(nextEvent);
 },
 onAdvanceDialog: () => {
 if (!activeEvent) return;
 if (activeEvent.nodeType === 'enemy') {
 setBattleEvent(activeEvent);
 } else {
 void openEpisodeEndMediaPrompt(activeEvent);
 }
 },
 onStartBattle: () => {
 if (activeEvent) setBattleEvent(activeEvent);
 },
 onClaimReward: () => {
 if (rewardEvent) {
 void claimReward(rewardEvent);
 }
 },
 onContinue: () => {
 if (nextEvent) moveToEvent(nextEvent);
 },
 });

 const completionPercent = Math.round((progress.completedChapterIds.length / KADAN_RPG_EVENTS.length) * 100);
 const completedIds = progress.completedChapterIds;
 const currentObjective = nextEvent
 ? t(nextEvent.objectiveKey, language)
 : t('kadan_rpg_objective_complete', language);
 const epilogueLines = language === 'ko'
 ? KADAN_RPG_NOVEL_SCRIPTS[40]
 : [
 { name: t('kadan_rpg_ending_epilogue_title', language), text: t('kadan_rpg_ending_epilogue_1', language) },
 { name: t('kadan_rpg_ending_epilogue_title', language), text: t('kadan_rpg_ending_epilogue_2', language) },
 { name: t('kadan_rpg_ending_epilogue_title', language), text: t('kadan_rpg_ending_epilogue_3', language) },
 ];

 const handleCloseDialog = useCallback(() => {
 if (activeEvent) {
 setDismissedEventId(activeEvent.id);
 }
 setActiveEvent(null);
 setTargetTile(null);
 setAutoMode(false);
 if (isDemoPlayActive()) {
 stopDemoPlay();
 }
 if (isRankingDiverted()) {
 endRankingDivert(false);
 }
 }, [activeEvent, setAutoMode]);

 const handleReincarnate = useCallback(() => {
 setIsEndingDismissed(false);
 setActiveEvent(null);
 setBattleEvent(null);
 setRewardEvent(null);
 setMediaPromptEvent(null);
 setMediaPromptChapterReward(null);
 setAmbushAlert(null);
 setAmbushBattle(null);
 setHeroStepCount(0);
 setLastAmbushStep(-99);
 setAmbushedInLeg(false);
 setIsMoving(false);
 reincarnateProgress();
 }, [reincarnateProgress]);

 // 환생 팝업 노출 시 멈추지 않고 3초 카운트다운 후 자동 환생 및 다음 회차 계속 진행
 useEffect(() => {
 if (!isComplete || isEndingDismissed) {
 setRebirthCountdown(3.0);
 return;
 }

 const durationMs = 3000;
 const deadline = Date.now() + durationMs;
 setRebirthCountdown(3.0);

 let hasReincarnated = false;
 const intervalId = window.setInterval(() => {
 const remainingMs = Math.max(0, deadline - Date.now());
 setRebirthCountdown(remainingMs / 1000);

 if (remainingMs <= 0 && !hasReincarnated) {
 hasReincarnated = true;
 window.clearInterval(intervalId);
 handleReincarnate();
 }
 }, 50);

 return () => {
 window.clearInterval(intervalId);
 };
 }, [isComplete, isEndingDismissed, handleReincarnate]);

 return (
 <div className="flex h-full min-h-screen flex-col bg-[#fdfcfc] text-slate-900 font-mono overflow-x-hidden pb-28">
 {!isBattling && (
 <header className="h-16 shrink-0 border-b border-slate-100 bg-white px-4 md:px-6">
 <div className="mx-auto flex h-full max-w-6xl items-center justify-between gap-3">
 <button
 type="button"
 onClick={() => onNavigate('home')}
 className="flex h-11 w-11 items-center justify-center rounded-sm border border-slate-200/70 bg-slate-50 text-slate-700 shadow-sm transition-all active:scale-95"
 aria-label={t('home', language)}
 >
 <ArrowLeft size={20} />
 </button>
 <div className="min-w-0 flex-1">
 <div className="flex items-center gap-2">
 <p className="truncate text-xs font-black uppercase tracking-normal text-indigo-600">{t('kadan_rpg_title_badge', language)}</p>
 {/* Reincarnation Badge in Top Header */}
 <span className={cn(
 "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs sm:text-sm font-mono font-bold tracking-tight border select-none",
 progress.rebirthLevel > 0
 ? "bg-amber-950/90 text-amber-300 border-amber-500/80 shadow-[0_0_12px_rgba(245,158,11,0.35)] animate-pulse"
 : "bg-slate-100 text-slate-700 border-slate-300"
 )}>
 <span className="text-sm sm:text-base">{progress.rebirthLevel > 0 ? '👑' : '🌱'}</span>
 <span className="text-xs sm:text-sm font-black">
 {progress.rebirthLevel > 0 ? (
 <>
 <span>{language === 'ko' ? '환생 ' : 'Rebirth Lv.'}</span>
 <span className="text-sm sm:text-base font-black text-amber-100">{progress.rebirthLevel}</span>
 <span>{language === 'ko' ? '회차' : ''}</span>
 </>
 ) : (
 t('kadan_rpg_first_journey_badge', language)
 )}
 </span>
 </span>
 </div>
 <h1 className="truncate text-base font-extrabold tracking-normal text-slate-900 md:text-lg">{t('kadan_rpg_title', language)}</h1>
 </div>
 {isComplete && (
 <button
 type="button"
 onClick={() => setIsEndingDismissed(false)}
 className="flex min-h-10 sm:min-h-11 items-center gap-1.5 rounded-sm bg-[#201d1d] px-3 py-2 text-xs font-black text-white shadow-none shadow-none transition-all hover:brightness-110 active:scale-95 cursor-pointer animate-pulse shrink-0"
 title={language === 'ko' ? '엔딩 및 환생 팝업 보기' : 'View Ending & Rebirth'}
 >
 <Sparkles size={16} className="text-amber-300" />
 <span>{language === 'ko' ? '엔딩/환생' : 'Ending'}</span>
 </button>
 )}
 <div className={cn(
 "relative inline-flex items-center justify-center overflow-hidden rounded-none transition-all",
 progress.autoMode ? "p-[2px] shadow-[0_0_12px_rgba(59,130,246,0.6)]" : ""
 )}>
 {progress.autoMode && (
 <div className="absolute -inset-[180%] animate-[spin_2.5s_linear_infinite] bg-[conic-gradient(from_0deg,transparent_0deg,transparent_180deg,#1d4ed8_270deg,#60a5fa_330deg,#93c5fd_360deg)]" />
 )}
 <button
 type="button"
 onClick={() => setAutoMode(!progress.autoMode)}
 className={cn(
 "relative z-10 flex min-h-11 items-center gap-2 rounded-[6px] px-3 py-2 text-sm font-bold transition-all active:scale-95 cursor-pointer",
 progress.autoMode
 ? "bg-indigo-600 text-white"
 : "border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
 )}
 >
 {progress.autoMode ? <Bot size={18} className="animate-spin text-cyan-200" /> : <Pause size={18} />}
 <span className="hidden sm:inline">{progress.autoMode ? t('kadan_rpg_auto_on', language) : t('kadan_rpg_auto_off', language)}</span>
 </button>
 </div>
 </div>
 </header>
 )}

 <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 overflow-y-auto p-3 sm:p-4 md:p-6 pb-[calc(env(safe-area-inset-bottom)+5rem)]">
 {isComplete && (
 <div className="flex items-center justify-between rounded-none border border-violet-300 bg-[#201d1d] p-3 text-white shadow-none animate-in fade-in duration-200">
 <div className="flex items-center gap-2">
 <Sparkles size={18} className="text-amber-300 animate-spin" />
 <div>
 <p className="text-[10px] font-black uppercase tracking-wider text-violet-200">{t('kadan_rpg_ending_popup_badge', language)}</p>
 <p className="text-xs font-black">{t('kadan_rpg_ending_popup_title', language)}</p>
 </div>
 </div>
 <button
 type="button"
 onClick={() => setIsEndingDismissed(false)}
 className="min-h-[44px] flex min-h-[38px] items-center gap-1.5 rounded-md bg-white px-3 py-1.5 text-xs font-black text-violet-900 shadow-sm transition-all hover:bg-violet-50 active:scale-95 cursor-pointer"
 >
 <span>{language === 'ko' ? '엔딩/환생 보기' : 'View Ending'}</span>
 </button>
 </div>
 )}
 <div className="relative">
 <KadanWorldMap
 region={currentRegion}
 events={regionEvents}
 heroTile={heroTile}
 targetTile={targetTile}
 activeEventId={activeEvent?.id}
 completedEventIds={completedIds}
 rebirthLevel={progress.rebirthLevel}
 language={language}
 lowSpecMode={lowSpecMode}
 onTilePress={handleTilePress}
 onEventPress={handleEventPress}
 />

 {activeEvent && !battleEvent && !rewardEvent && (
 <KadanNpcDialog
 event={activeEvent}
 language={language}
 autoMode={progress.autoMode}
 isCompleted={completedIds.includes(activeEvent.id)}
 canStartBattle={true}
 canClaimReward={Boolean(activeEvent.rewardId && !progress.claimedRewardIds.includes(activeEvent.rewardId) && progress.clearedEncounterIds.includes(activeEvent.encounterId || `enc-ch${String(activeEvent.chapterNumber).padStart(2, '0')}`))}
 rebirthLevel={progress.rebirthLevel}
 onRewardSns={(amount, reason) => {
  updateSns(amount, reason, 'earned');
 }}
 onApplyBuff={(buff) => {
  try {
   localStorage.setItem('hero_kadan_active_buff', JSON.stringify(buff));
  } catch {}
 }}
 onStartBattle={() => setBattleEvent(activeEvent)}
 onClaimReward={() => void openEpisodeEndMediaPrompt(activeEvent)}
 onComplete={() => void openEpisodeEndMediaPrompt(activeEvent)}
 onClose={handleCloseDialog}
 onToggleAutoMode={() => setAutoMode(!progress.autoMode)}
 onNavigate={onNavigate}
 />
 )}

 {activeEncounter && battleEvent && rpgOpponent && createPortal(
 <div className="fixed inset-0 z-[99999] w-full h-[100dvh] max-h-[100dvh] bg-[#060a14] flex flex-col items-center justify-center overflow-hidden pointer-events-auto select-none touch-none">
 <MobileCardPlayScreen
 isAdRemoved={isAdRemoved}
 playerDeck={getBuffedPlayerDeck(currentDeck)}
 opponentCustomDeck={rpgOpponent.deck}
 opponentName={rpgOpponent.name}
 language={language}
 initialAutoBattle={true}
 autoCloseOnComplete={progress.autoMode || isDemoPlayActive() || isRankingDiverted()}
 onToggleAutoBattle={() => setAutoMode(!progress.autoMode)}
 onBack={(completed) => {
  setBattleEvent(null);
  if (!completed && progress.autoMode) {
   setAutoMode(false);
  }
 }}
 recordMatchResult={(result) => {
 handleBattleComplete(result);
 }}
 playSfx={(url) => {
 if (isSfxMutedGlobal()) return;
 try {
 const audio = new Audio(url);
 audio.volume = 0.5;
 audio.play().catch(() => {});
 } catch (e) {}
 }}
 sns={sns}
 updateSns={updateSns}
 addCard={addCard}
 />
 </div>,
 document.body
 )}

 {ambushBattle && createPortal(
 <div className="fixed inset-0 z-[99999] w-full h-[100dvh] max-h-[100dvh] bg-[#060a14] flex flex-col items-center justify-center overflow-hidden pointer-events-auto select-none touch-none">
 <MobileCardPlayScreen
 isAdRemoved={isAdRemoved}
 playerDeck={getBuffedPlayerDeck(currentDeck)}
 opponentCustomDeck={ambushBattle.deck}
 opponentName={language === 'ko' ? `[기습] ${ambushBattle.name}` : `[Ambush] ${ambushBattle.nameEn}`}
 language={language}
 initialAutoBattle={true}
 autoCloseOnComplete={progress.autoMode || isDemoPlayActive() || isRankingDiverted()}
 onToggleAutoBattle={() => setAutoMode(!progress.autoMode)}
 onBack={(completed) => {
  setAmbushBattle(null);
  if (!completed && progress.autoMode) {
   setAutoMode(false);
  }
 }}
 recordMatchResult={(result) => {
 void handleAmbushBattleComplete(result);
 }}
 playSfx={(url) => {
 if (isSfxMutedGlobal()) return;
 try {
 const audio = new Audio(url);
 audio.volume = 0.5;
 audio.play().catch(() => {});
 } catch (e) {}
 }}
 sns={sns}
 updateSns={updateSns}
 addCard={addCard}
 />
 </div>,
 document.body
 )}

 {ambushAlert && (
 <div 
 className="fixed inset-0 z-[10020] flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs font-mono select-none"
 role="dialog"
 aria-modal="true"
 aria-label="Ambush Encounter"
 >
 <div className="w-full max-w-lg rounded-none border border-amber-500/80 bg-[#201d1d] text-[#fdfcfc] p-5 shadow-none">
 <div className="flex items-center justify-between border-b border-amber-500/30 pb-3 mb-4">
 <div className="flex items-center gap-2">
 <span className="h-2 w-2 bg-amber-400 rounded-none inline-block animate-pulse" />
 <span className="text-xs font-black uppercase tracking-wider text-amber-400">
 {language === 'ko' ? '[필드 기습 / FIELD AMBUSH]' : '[FIELD AMBUSH]'}
 </span>
 </div>
 <div className="flex items-center gap-2">
 <span className="text-[11px] font-mono text-stone-400">
 CH.{String(nextEvent?.chapterNumber ?? 1).padStart(2, '0')}
 </span>
 <button
 type="button"
 onClick={handleRetreatAmbush}
 className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-sm bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white border border-stone-600 transition-colors cursor-pointer"
 aria-label={language === 'ko' ? '기습 후퇴' : 'Retreat'}
 title={language === 'ko' ? '안전 후퇴' : 'Safe Retreat'}
 >
 <X size={18} />
 </button>
 </div>
 </div>

 <div className="flex items-center gap-4 mb-4">
 <div className="w-20 sm:w-24 aspect-[256/296] shrink-0 rounded-none border border-amber-500/40 bg-stone-900 flex items-center justify-center overflow-hidden p-1">
 <div 
 className="w-full aspect-[256/296] max-h-full bg-center bg-no-repeat"
 style={{
 ...getCardSpriteStyle(ambushAlert.leaderCardId),
 aspectRatio: '256 / 296',
 }}
 />
 </div>
 <div className="min-w-0 flex-1">
 <h3 className="text-base font-extrabold text-amber-200 truncate">
 {language === 'ko' ? ambushAlert.name : ambushAlert.nameEn}
 </h3>
 <p className="mt-1 text-xs text-stone-300 leading-relaxed italic">
 "{language === 'ko' ? ambushAlert.dialogQuoteKo : ambushAlert.dialogQuoteEn}"
 </p>
 <div className="mt-2.5 flex items-center gap-2 text-[11px] text-stone-400">
 <span>{language === 'ko' ? '예상 전리품:' : 'Spoils:'}</span>
 <span className="text-amber-300 font-bold">+{ambushAlert.spoilsCoins} SNS</span>
 <span>·</span>
 <span className="text-indigo-300 font-bold">{language === 'ko' ? '카드/아이템 획득 찬스' : 'Card/Item Drop'}</span>
 </div>
 </div>
 </div>

 {progress.autoMode && (
 <div className="mb-4">
 <div className="flex justify-between text-[10px] text-amber-400/90 font-bold mb-1">
 <span>⚡ {language === 'ko' ? '자동 전투 개시 중...' : 'Engaging Auto-Battle...'}</span>
 <span>{Math.max(0, ambushCountdown).toFixed(1)}s</span>
 </div>
 <div className="h-1.5 w-full bg-stone-800 rounded-none overflow-hidden">
 <div 
 className="h-full bg-amber-400 transition-all duration-100 ease-linear"
 style={{ width: `${Math.max(0, Math.min(100, (ambushCountdown / 1.0) * 100))}%` }}
 />
 </div>
 </div>
 )}

 <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-800">
 <button
 type="button"
 onClick={handleRetreatAmbush}
 className="min-h-[44px] rounded-sm bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-xs px-4 py-2 border border-stone-600 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
 >
 <span>{language === 'ko' ? '후퇴하기 (RETREAT)' : 'RETREAT'}</span>
 </button>
 <button
 type="button"
 onClick={handleEngageAmbush}
 className="min-h-[44px] flex-1 rounded-sm bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs px-4 py-2 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
 >
 <Swords size={16} />
 <span>{language === 'ko' ? '전투 개시 (ENGAGE BATTLE)' : 'ENGAGE BATTLE'}</span>
 </button>
 </div>
 </div>
 </div>
 )}

 {activeReward && rewardEvent && (
 <KadanRewardModal
 reward={activeReward}
 language={language}
 onClaim={() => void claimReward(rewardEvent)}
 onClose={() => {
 setRewardEvent(null);
 if (progress.autoMode) setAutoMode(false);
 }}
 />
 )}

 {mediaPromptEvent && (
 <EpisodeMediaWatchModal
 chapterNumber={mediaPromptEvent.chapterNumber}
 language={language}
 chapterReward={mediaPromptChapterReward?.reward ?? null}
 chapterRewardSnsTotal={mediaPromptChapterReward?.totalSns}
 onClaimWatchReward={handleClaimEpisodeMediaReward}
 onProceedNext={() => completeActiveEvent(mediaPromptEvent)}
 />
 )}
 </div>

 {/* ─── 맵 바로 아래 배치된 진행도(Progress) 카드 ─── */}
 <section className="w-full rounded-none border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] p-4 mb-4 pb-4 shadow-xs">
 <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
 <div className="flex-1 min-w-0">
 <div className="mb-2 flex items-center justify-between text-xs font-bold text-[#646262]">
 <span>{t('kadan_rpg_progress', language)}</span>
 <span>{completionPercent}%</span>
 </div>
 <div className="h-2 overflow-hidden rounded-sm bg-[#f1eeee]">
 <div className="h-full bg-[#201d1d] transition-all" style={{ width: `${completionPercent}%` }} />
 </div>
 <p className="mt-2 truncate text-xs font-bold text-[#201d1d]">
 {formatStageTitle(nextEvent, language)}
 </p>
 <p className="mt-0.5 truncate text-[10px] font-semibold text-[#646262]">{currentObjective}</p>
 </div>
 <div className={cn(
 "relative inline-flex items-center justify-center overflow-hidden rounded-sm transition-all shrink-0",
 progress.autoMode ? "p-[2px] shadow-[0_0_10px_rgba(59,130,246,0.5)]" : ""
 )}>
 {progress.autoMode && (
 <div className="absolute -inset-[180%] animate-[spin_2.5s_linear_infinite] bg-[conic-gradient(from_0deg,transparent_0deg,transparent_180deg,#1d4ed8_270deg,#60a5fa_330deg,#93c5fd_360deg)]" />
 )}
 <button
 type="button"
 onClick={() => setAutoMode(!progress.autoMode)}
 className={`min-h-[44px] relative z-10 flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-[2px] px-3 text-xs font-bold transition-all cursor-pointer ${
 progress.autoMode
 ? 'bg-[#201d1d] text-[#fdfcfc]'
 : 'bg-[#fdfcfc] text-[#201d1d] border border-[#646262] hover:bg-[#f8f7f7]'
 }`}
 >
 {progress.autoMode ? <Pause size={14} className="text-blue-400" /> : <Play size={14} />}
 <span>{progress.autoMode ? t('kadan_rpg_auto_on', language) : t('kadan_rpg_auto_off', language)}</span>
 </button>
 </div>
 </div>
 </section>
 </main>

 {isComplete && !isEndingDismissed && (
 <div className="fixed inset-0 z-[20000] flex items-center justify-center bg-slate-950/85 p-3 sm:p-4 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] backdrop-blur-sm">
 <div className="w-full max-w-2xl max-h-[85dvh] sm:max-h-[88dvh] flex flex-col overflow-hidden rounded-none border border-violet-200 bg-white shadow-none">
 {/* Header */}
 <div className="shrink-0 border-b border-slate-100 bg-[#201d1d] p-4 sm:p-5 text-white flex items-center justify-between">
 <div className="flex items-center gap-3">
 <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-none bg-white/15 shrink-0">
 <Sparkles size={22} />
 </div>
 <div>
 <p className="text-xs font-black uppercase tracking-normal text-violet-100">{t('kadan_rpg_ending_popup_badge', language)}</p>
 <h2 className="text-lg sm:text-xl font-black">{t('kadan_rpg_ending_popup_title', language)}</h2>
 </div>
 </div>
 <button
 type="button"
 onClick={() => setIsEndingDismissed(true)}
 className="min-h-[44px] flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-sm bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer border border-white/20 shrink-0"
 aria-label={t('close', language)}
 >
 <X size={18} />
 </button>
 </div>

 {/* Content body */}
 <div className="flex-1 min-h-0 space-y-3 overflow-y-auto p-4 sm:p-5 custom-scrollbar">
 <p className="text-sm font-bold leading-6 text-slate-700">{t('kadan_rpg_ending_popup_desc', language)}</p>
 <div className="space-y-3 rounded-none bg-slate-50 p-3 sm:p-4">
 <p className="text-xs font-black uppercase tracking-normal text-violet-600">{t('kadan_rpg_ending_epilogue_title', language)}</p>
 {epilogueLines.map((line, index) => (
 <div key={`${line.name}-${index}`} className="rounded-none bg-white p-3 shadow-sm">
 <p className="text-xs font-black text-slate-500">{line.name}</p>
 <p className="mt-1 text-sm font-semibold leading-6 text-slate-800">{line.text}</p>
 </div>
 ))}
 </div>
 </div>

 {/* Footer */}
 <div className="shrink-0 flex flex-col gap-2.5 border-t border-slate-100 p-3 sm:p-4 bg-slate-50/90">
 <div className="w-full">
 <div className="flex justify-between text-[11px] text-violet-700 font-black mb-1 font-mono">
 <span>⚡ {language === 'ko' ? '자동 환생 및 다음 회차 진행 중...' : 'Auto-Reincarnating to Next Cycle...'}</span>
 <span>{Math.max(0, rebirthCountdown).toFixed(1)}s</span>
 </div>
 <div className="h-1.5 w-full bg-violet-100 rounded-none overflow-hidden border border-violet-200">
 <div
 className="h-full bg-violet-600 transition-all duration-75 ease-linear"
 style={{ width: `${Math.max(0, Math.min(100, (rebirthCountdown / 3.0) * 100))}%` }}
 />
 </div>
 </div>
 <div className="flex flex-wrap items-center justify-between gap-2.5 sm:gap-3">
 <div className="rounded-none bg-violet-100 border border-violet-300 px-3.5 py-2 text-sm font-black text-violet-900 flex items-center gap-1.5">
 <span>👑</span>
 <span>{t('kadan_rpg_rebirth_level', language)}</span>
 <span className="text-base sm:text-lg font-black text-violet-950 font-mono">{progress.rebirthLevel}</span>
 </div>
 <div className="flex items-center gap-2">
 <button
 type="button"
 onClick={() => {
 setAutoMode(false);
 setIsEndingDismissed(true);
 }}
 className="min-h-11 rounded-sm border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition-all hover:bg-slate-50 active:scale-95 cursor-pointer shadow-xs"
 >
 {language === 'ko' ? '닫기 (나중에 하기)' : t('close', language)}
 </button>
 <button
 type="button"
 onClick={handleReincarnate}
 className="min-h-11 rounded-sm bg-violet-600 hover:bg-violet-700 px-5 py-2 text-sm font-black text-white shadow-none shadow-none transition-all active:scale-95 cursor-pointer"
 >
 {t('kadan_rpg_reincarnate', language)} ({Math.max(1, Math.ceil(rebirthCountdown))}s)
 </button>
 </div>
 </div>
 </div>
 </div>
 </div>
 )}
 </div>
 );
};

export default KadanRpgView;
