import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Bot, Compass, Pause, Play, RotateCcw, Sparkles, Swords } from 'lucide-react';
import { t } from '../lib/i18n';
import { cn } from '../lib/utils';
import type { CardData, CardRarity, ItemRarity, Language, ViewType } from '../types';
import {
  KADAN_RPG_EVENTS,
  getKadanRewardRarity,
  getKadanRpgEncounter,
  getKadanRpgRegion,
  getKadanRpgReward,
  type KadanRpgEvent,
  type KadanRpgTile,
} from '../content/kadanRpgStory';
import { useKadanRpgProgress } from '../hooks/useKadanRpgProgress';
import { useKadanRpgAutoRunner } from '../hooks/useKadanRpgAutoRunner';
import { KadanWorldMap } from '../components/rpg/KadanWorldMap';
import { KadanNpcDialog } from '../components/rpg/KadanNpcDialog';
import { KadanRewardModal } from '../components/rpg/KadanRewardModal';
import { KadanBattleGate } from '../components/rpg/KadanBattleGate';
import type { KadanBattleResult } from '../lib/kadanRpgBattle';
import { KADAN_RPG_NOVEL_SCRIPTS } from '../content/kadanRpgNovelScript';

interface KadanRpgViewProps {
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
  showCustomAlert: (title: string, message: string) => void;
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

export const KadanRpgView: React.FC<KadanRpgViewProps> = ({
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
  const [isMoving, setIsMoving] = useState(false);

  const activeEncounter = battleEvent?.encounterId ? getKadanRpgEncounter(battleEvent.encounterId) : undefined;
  const activeReward = rewardEvent?.rewardId ? getKadanRpgReward(rewardEvent.rewardId) : undefined;
  const isComplete = !nextEvent;
  const isAtTarget = sameTile(heroTile, nextEvent?.tile ?? null);
  const hasDialog = Boolean(activeEvent && !battleEvent && !rewardEvent);
  const hasBattle = Boolean(activeEvent?.encounterId && !battleEvent && !rewardEvent);
  const hasReward = Boolean(rewardEvent && activeReward);

  useEffect(() => {
    const region = getKadanRpgRegion(nextEvent?.regionId ?? progress.currentRegionId);
    setHeroTile(clampTile(progress.lastTile, region.width, region.height));
    setTargetTile(nextEvent?.tile ?? null);
  }, [nextEvent, progress.currentChapterId, progress.currentRegionId, progress.rebirthLevel]);

  useEffect(() => {
    if (!targetTile || sameTile(heroTile, targetTile)) {
      setIsMoving(false);
      return;
    }

    setIsMoving(true);
    const timer = window.setTimeout(() => {
      setHeroTile((previous) => {
        const next = stepToward(previous, targetTile);
        setLastTile(next);
        return next;
      });
    }, lowSpecMode ? 110 : 180);

    return () => window.clearTimeout(timer);
  }, [heroTile, lowSpecMode, setLastTile, targetTile]);

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
    if (progress.autoMode || isMoving || activeEvent || battleEvent || rewardEvent || !targetTile) return;
    if (!sameTile(heroTile, targetTile)) return;

    const arrivedEvent = regionEvents.find((event) => sameTile(event.tile, targetTile));
    if (arrivedEvent) {
      openEvent(arrivedEvent);
    }
  }, [activeEvent, battleEvent, heroTile, isMoving, openEvent, progress.autoMode, regionEvents, rewardEvent, targetTile]);

  const handleEventPress = useCallback((event: KadanRpgEvent) => {
    pauseForManualInput();
    setTargetTile(event.tile);
    if (sameTile(heroTile, event.tile)) openEvent(event);
  }, [heroTile, openEvent, pauseForManualInput]);

  const handleTilePress = useCallback((tile: KadanRpgTile) => {
    pauseForManualInput();
    setTargetTile(clampTile(tile, currentRegion.width, currentRegion.height));
  }, [currentRegion.height, currentRegion.width, pauseForManualInput]);

  const completeActiveEvent = useCallback((event: KadanRpgEvent) => {
    completeEvent(event.id, heroTile);
    setActiveEvent(null);
    setBattleEvent(null);
    setRewardEvent(null);
  }, [completeEvent, heroTile]);

  const claimReward = useCallback(async (event: KadanRpgEvent) => {
    if (!event.rewardId || progress.claimedRewardIds.includes(event.rewardId)) {
      completeActiveEvent(event);
      return;
    }

    const reward = getKadanRpgReward(event.rewardId);
    if (!reward) {
      completeActiveEvent(event);
      return;
    }

    if (reward.sns > 0) {
      await updateSns(reward.sns, t('kadan_rpg_reward_reason', language), 'earned');
    }
    reward.cardIds.forEach((cardId) => {
      addCard(getKadanRewardRarity(cardId), cardId, progress.autoMode);
    });
    if (reward.itemRarity) {
      addItem(reward.itemRarity);
    }

    markRewardClaimed(reward.id);
    completeActiveEvent(event);
  }, [
    addCard,
    addItem,
    completeActiveEvent,
    language,
    markRewardClaimed,
    progress.autoMode,
    progress.claimedRewardIds,
    updateSns,
  ]);

  const handleBattleComplete = useCallback((result: KadanBattleResult) => {
    if (!battleEvent?.encounterId) return;
    const encounter = getKadanRpgEncounter(battleEvent.encounterId);
    if (!encounter) return;

    if (result === 'win' || result === 'draw' || encounter.allowLossProgress) {
      markEncounterCleared(encounter.id);
      setBattleEvent(null);
      if (battleEvent.rewardId) {
        setRewardEvent(battleEvent);
      } else {
        completeActiveEvent(battleEvent);
      }
      return;
    }

    setBattleEvent(null);
    setActiveEvent(battleEvent);
    showCustomAlert(t('kadan_rpg_battle_loss_title', language), t('kadan_rpg_battle_loss_desc', language));
  }, [battleEvent, completeActiveEvent, language, markEncounterCleared, showCustomAlert]);

  const autoRunner = useKadanRpgAutoRunner({
    enabled: progress.autoMode,
    isComplete,
    hasTarget: Boolean(nextEvent),
    isAtTarget,
    hasDialog,
    hasBattle,
    hasReward,
    isBusy: isMoving || Boolean(battleEvent) || Boolean(activeEvent && !battleEvent && !rewardEvent),
    onMoveToTarget: () => {
      if (nextEvent) moveToEvent(nextEvent);
    },
    onInteractTarget: () => {
      if (nextEvent) openEvent(nextEvent);
    },
    onAdvanceDialog: () => {
      if (!activeEvent) return;
      if (activeEvent.encounterId) {
        setBattleEvent(activeEvent);
      } else if (activeEvent.rewardId && !progress.claimedRewardIds.includes(activeEvent.rewardId)) {
        setRewardEvent(activeEvent);
      } else {
        completeActiveEvent(activeEvent);
      }
    },
    onStartBattle: () => {
      if (activeEvent?.encounterId) setBattleEvent(activeEvent);
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

  const handleReincarnate = useCallback(() => {
    setActiveEvent(null);
    setBattleEvent(null);
    setRewardEvent(null);
    setIsMoving(false);
    reincarnateProgress();
  }, [reincarnateProgress]);

  return (
    <div className="flex h-full min-h-screen flex-col bg-slate-50/30 text-slate-900">
      <header className="h-16 shrink-0 border-b border-slate-100 bg-white px-4 md:px-6">
        <div className="mx-auto flex h-full max-w-6xl items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-200/70 bg-slate-50 text-slate-700 shadow-sm transition-all active:scale-95"
            aria-label={t('home', language)}
          >
            <ArrowLeft size={20} />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-black uppercase tracking-normal text-indigo-600">{t('kadan_rpg_title_badge', language)}</p>
            <h1 className="truncate text-base font-extrabold tracking-normal text-slate-900 md:text-lg">{t('kadan_rpg_title', language)}</h1>
          </div>
          <div className={cn(
            "relative inline-flex items-center justify-center overflow-hidden rounded-lg transition-all",
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
              {progress.autoMode ? <Bot size={18} className="animate-pulse text-cyan-200" /> : <Pause size={18} />}
              <span className="hidden sm:inline">{progress.autoMode ? t('kadan_rpg_auto_on', language) : t('kadan_rpg_auto_off', language)}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-6xl flex-1 gap-4 overflow-y-auto p-4 pb-24 md:grid-cols-[1fr_280px] md:p-6">
        <div className="relative">
          <KadanWorldMap
            region={currentRegion}
            events={regionEvents}
            heroTile={heroTile}
            targetTile={targetTile}
            activeEventId={activeEvent?.id}
            completedEventIds={completedIds}
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
              canStartBattle={Boolean(activeEvent.encounterId && !progress.clearedEncounterIds.includes(activeEvent.encounterId))}
              canClaimReward={Boolean(activeEvent.rewardId && !progress.claimedRewardIds.includes(activeEvent.rewardId) && (!activeEvent.encounterId || progress.clearedEncounterIds.includes(activeEvent.encounterId)))}
              onStartBattle={() => setBattleEvent(activeEvent)}
              onClaimReward={() => setRewardEvent(activeEvent)}
              onComplete={() => completeActiveEvent(activeEvent)}
              onClose={() => setActiveEvent(null)}
            />
          )}

          {activeEncounter && battleEvent && (
            <KadanBattleGate
              encounter={activeEncounter}
              currentDeck={currentDeck}
              language={language}
              autoBattle={progress.autoMode}
              onToggleAutoBattle={() => setAutoMode(!progress.autoMode)}
              lowSpecMode={lowSpecMode}
              rebirthLevel={progress.rebirthLevel}
              onComplete={handleBattleComplete}
              onClose={() => {
                setBattleEvent(null);
                if (progress.autoMode) setAutoMode(false);
              }}
            />
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
        </div>

        <aside className="space-y-4">
          <section className="rounded-none border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] p-4">
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
                  className={`relative z-10 flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-[2px] px-3 text-xs font-bold transition-all cursor-pointer ${
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
        </aside>
      </main>

      {isComplete && (
        <div className="fixed inset-0 z-[10000] flex items-end justify-center bg-slate-950/75 p-3 backdrop-blur-xs md:items-center">
          <div className="w-full max-w-2xl overflow-hidden rounded-lg border border-violet-200 bg-white shadow-2xl">
            <div className="border-b border-slate-100 bg-gradient-to-r from-violet-700 via-indigo-700 to-slate-950 p-5 text-white">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/15">
                  <Sparkles size={24} />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-normal text-violet-100">{t('kadan_rpg_ending_popup_badge', language)}</p>
                  <h2 className="text-xl font-black">{t('kadan_rpg_ending_popup_title', language)}</h2>
                </div>
              </div>
            </div>
            <div className="max-h-[58vh] space-y-3 overflow-y-auto p-5">
              <p className="text-sm font-bold leading-6 text-slate-700">{t('kadan_rpg_ending_popup_desc', language)}</p>
              <div className="space-y-3 rounded-lg bg-slate-50 p-4">
                <p className="text-xs font-black uppercase tracking-normal text-violet-600">{t('kadan_rpg_ending_epilogue_title', language)}</p>
                {epilogueLines.map((line, index) => (
                  <div key={`${line.name}-${index}`} className="rounded-lg bg-white p-3 shadow-sm">
                    <p className="text-xs font-black text-slate-500">{line.name}</p>
                    <p className="mt-1 text-sm font-semibold leading-6 text-slate-800">{line.text}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 p-4">
              <div className="rounded-lg bg-violet-50 px-3 py-2 text-xs font-black text-violet-700">
                {t('kadan_rpg_rebirth_level', language)} {progress.rebirthLevel}
              </div>
              <button
                type="button"
                onClick={handleReincarnate}
                className="min-h-11 rounded-lg bg-violet-600 px-5 py-2 text-sm font-black text-white shadow-md shadow-violet-600/10 transition-all active:scale-95"
              >
                {t('kadan_rpg_reincarnate', language)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
