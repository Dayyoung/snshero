import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowLeft,
  BookOpen,
  Bot,
  Box,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FastForward,
  Film,
  Home,
  Info,
  List,
  MessageCircle,
  Pause,
  Sparkles,
  Swords,
  Users,
  X,
} from 'lucide-react';
import { cn, getAssetUrl, getCardSpriteStyle } from '../../lib/utils';
import { t } from '../../lib/i18n';
import { CARD_DATABASE } from '../../cardDatabase';
import type { Language, ViewType } from '../../types';
import type { KadanRpgEvent } from '../../content/kadanRpgStory';
import {
  KADAN_RPG_NOVEL_SCRIPTS,
  type KadanRpgDialogueChoice,
  type KadanRpgSceneCharacter,
  type KadanRpgSubCut,
} from '../../content/kadanRpgNovelScript';
import {
  loadKadanArtStyleMode,
  resolveKadanArtStyleUrl,
  saveKadanArtStyleMode,
  type KadanArtStyleMode,
} from '../../hooks/useKadanRpgProgress';

interface KadanNpcDialogProps {
  event: KadanRpgEvent;
  language: Language;
  isCompleted: boolean;
  autoMode: boolean;
  artStyleMode?: KadanArtStyleMode;
  onChangeArtStyleMode?: (mode: KadanArtStyleMode) => void;
  onToggleArtStyleMode?: () => void;
  canStartBattle: boolean;
  canClaimReward: boolean;
  rebirthLevel?: number;
  onRewardSns?: (amount: number, reason?: string) => void;
  onApplyBuff?: (buff: any, buffName?: string) => void;
  onStartBattle: () => void;
  onClaimReward: () => void;
  onComplete: () => void;
  onClose: () => void;
  onNavigate?: (view: ViewType) => void;
  onToggleAutoMode?: () => void;
}

interface ConversationLine {
  speaker: 'narrator' | 'quote' | 'kadan' | 'speaker' | 'choice';
  cardId?: number;
  name: string;
  nameEn?: string;
  text: string;
  textEn?: string;
  sceneNumber?: number;
  totalScenes?: number;
  sceneTitleKo?: string;
  sceneTitleEn?: string;
  sceneExplanationKo?: string;
  sceneExplanationEn?: string;
  dialogueQuoteKo?: string;
  dialogueQuoteEn?: string;
  sceneImageUrl?: string;
  sceneCharacters?: KadanRpgSceneCharacter[];
  subCuts?: KadanRpgSubCut[];
  choices?: KadanRpgDialogueChoice[];
}

const iconByType = {
  npc: MessageCircle,
  enemy: Swords,
  chest: Box,
  portal: Sparkles,
  story: Sparkles,
};

const getCharacterPortraitStyle = (cardId?: number): React.CSSProperties => {
  const safeId = cardId && CARD_DATABASE[cardId] ? cardId : 41;
  return getCardSpriteStyle(safeId);
};

/**
 * Renders novel paragraphs with highlighted spoken dialogue quotes (“...”)
 * for effortless picture-book reading comprehension.
 */
const renderFormattedNovelText = (rawText: string) => {
  const paragraphs = rawText.split(/\n\n+/).filter((p) => p.trim().length > 0);
  return paragraphs.map((para, pIdx) => {
    const parts = para.split(/(“[^”]+”|"[^"]+")/g);
    return (
      <p
        key={pIdx}
        className="mb-3.5 last:mb-0 font-mono text-sm sm:text-base md:text-lg leading-relaxed text-slate-100 break-words"
      >
        {parts.map((part, sIdx) => {
          const isQuote =
            (part.startsWith('“') && part.endsWith('”')) ||
            (part.startsWith('"') && part.endsWith('"'));
          if (isQuote) {
            return (
              <span
                key={sIdx}
                className="font-bold text-amber-300 bg-amber-950/40 px-1.5 py-0.5 rounded-sm border border-amber-500/30"
              >
                {part}
              </span>
            );
          }
          return <span key={sIdx}>{part}</span>;
        })}
      </p>
    );
  });
};

export const KadanNpcDialog: React.FC<KadanNpcDialogProps> = ({
  event,
  language,
  isCompleted,
  autoMode,
  artStyleMode: propArtStyleMode,
  onChangeArtStyleMode,
  onToggleArtStyleMode,
  canStartBattle,
  canClaimReward,
  rebirthLevel = 0,
  onRewardSns,
  onApplyBuff,
  onStartBattle,
  onClaimReward,
  onComplete,
  onClose,
  onNavigate,
  onToggleAutoMode,
}) => {
  const Icon = iconByType[event.nodeType];
  const card = CARD_DATABASE[event.speakerCardId];
  const speakerName = language === 'ko' ? card?.title : card?.title_en;
  const templateKey = event.isEnding
    ? 'kadan_rpg_dialog_ending'
    : event.nodeType === 'chest'
    ? 'kadan_rpg_dialog_chest'
    : event.nodeType === 'enemy'
    ? 'kadan_rpg_dialog_enemy'
    : event.nodeType === 'portal'
    ? 'kadan_rpg_dialog_portal'
    : 'kadan_rpg_dialog_story';

  const [lineIndex, setLineIndex] = useState(0);
  const [activeSubCutIdx, setActiveSubCutIdx] = useState<number | null>(null);
  const [viewGranularity, setViewGranularity] = useState<'storybook' | 'all_cuts'>('storybook');
  const [localArtStyleMode, setLocalArtStyleMode] = useState<KadanArtStyleMode>(() =>
    propArtStyleMode ?? loadKadanArtStyleMode()
  );
  const [selectedCharCardId, setSelectedCharCardId] = useState<number | null>(null);
  const [showSceneIndexModal, setShowSceneIndexModal] = useState(false);
  const [autoSpeedMode, setAutoSpeedMode] = useState<'normal' | 'slow' | 'fast'>('normal');

  const artStyleMode = propArtStyleMode ?? localArtStyleMode;

  useEffect(() => {
    if (propArtStyleMode) {
      setLocalArtStyleMode(propArtStyleMode);
    }
  }, [propArtStyleMode]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleStyleUpdated = (e: Event) => {
      const customEvent = e as CustomEvent<{ artStyleMode?: KadanArtStyleMode }>;
      const next =
        customEvent.detail?.artStyleMode === 'liveaction' ? 'liveaction' : 'animation';
      setLocalArtStyleMode(next);
    };
    window.addEventListener('hero_art_style_updated', handleStyleUpdated);
    return () => {
      window.removeEventListener('hero_art_style_updated', handleStyleUpdated);
    };
  }, []);

  const handleSetArtStyleMode = useCallback(
    (nextMode: KadanArtStyleMode) => {
      const saved = saveKadanArtStyleMode(nextMode);
      setLocalArtStyleMode(saved);
      onChangeArtStyleMode?.(saved);
    },
    [onChangeArtStyleMode]
  );

  const toggleArtStyleMode = useCallback(() => {
    if (onToggleArtStyleMode) {
      onToggleArtStyleMode();
      return;
    }
    const next: KadanArtStyleMode = artStyleMode === 'animation' ? 'liveaction' : 'animation';
    handleSetArtStyleMode(next);
  }, [artStyleMode, handleSetArtStyleMode, onToggleArtStyleMode]);

  const resolveArtStyleUrl = useCallback(
    (rawUrl: string) => resolveKadanArtStyleUrl(rawUrl, artStyleMode),
    [artStyleMode]
  );

  // Suspend Background BGM Processing during Dialogue Overlay to reduce CPU/audio load
  useEffect(() => {
    window.dispatchEvent(new Event('snshero-dialogue-overlay-open'));
    return () => {
      window.dispatchEvent(new Event('snshero-dialogue-overlay-close'));
    };
  }, []);

  const fallbackSpeakerName = speakerName || t('kadan_rpg_unknown_echo', language);
  const isEn = language !== 'ko';

  const baseLines = useMemo<ConversationLine[]>(() => {
    const novelScript = KADAN_RPG_NOVEL_SCRIPTS[event.chapterNumber];
    if (novelScript && novelScript.length > 0) {
      if (viewGranularity === 'all_cuts') {
        // Expand all subCuts into individual Picture-Book pages (~50 pages per episode)
        const expanded: ConversationLine[] = [];
        novelScript.forEach((line) => {
          if (line.speaker === 'choice' || !line.subCuts || line.subCuts.length === 0) {
            expanded.push({
              ...line,
              cardId: line.cardId ?? event.speakerCardId,
              name: isEn ? (line.nameEn || line.name) : line.name,
              text: isEn ? (line.textEn || line.text) : line.text,
            });
          } else {
            line.subCuts.forEach((cut, cIdx) => {
              const cutSpeakerName = isEn
                ? cut.speakerEn || line.nameEn || line.name
                : cut.speakerKo || line.name;
              const cutText = isEn
                ? cut.narrationEn || line.textEn || line.text
                : cut.narrationKo || line.text;
              const cutDialog = isEn ? cut.dialogueEn : cut.dialogueKo;
              expanded.push({
                speaker: line.speaker,
                cardId: line.cardId ?? event.speakerCardId,
                name: cutSpeakerName,
                nameEn: cut.speakerEn || line.nameEn,
                text: cutText,
                textEn: cut.narrationEn,
                sceneNumber: cut.cutNumber,
                sceneTitleKo: `[제${event.chapterNumber}화 · 세부 컷 #${cut.cutNumber}] ${line.sceneTitleKo?.replace(/^\[[^\]]+\]\s*/, '') || ''}`,
                sceneTitleEn: `[EP.${event.chapterNumber} · Cut #${cut.cutNumber}] ${line.sceneTitleEn?.replace(/^\[[^\]]+\]\s*/, '') || ''}`,
                sceneExplanationKo: line.sceneExplanationKo,
                sceneExplanationEn: line.sceneExplanationEn,
                dialogueQuoteKo: cutDialog || (cIdx === 0 ? line.dialogueQuoteKo : ''),
                dialogueQuoteEn: cutDialog || (cIdx === 0 ? line.dialogueQuoteEn : ''),
                sceneImageUrl: cut.imageUrl || line.sceneImageUrl,
                sceneCharacters: line.sceneCharacters,
                subCuts: line.subCuts,
              });
            });
          }
        });
        return expanded.map((item, idx) => ({
          ...item,
          sceneNumber: idx + 1,
          totalScenes: expanded.length,
        }));
      }

      return novelScript.map((line, idx) => ({
        speaker: line.speaker,
        cardId: line.cardId ?? event.speakerCardId,
        name: isEn ? (line.nameEn || line.name) : line.name,
        nameEn: line.nameEn,
        text: isEn ? (line.textEn || line.text) : line.text,
        textEn: line.textEn,
        sceneNumber: line.sceneNumber ?? idx + 1,
        totalScenes: line.totalScenes ?? novelScript.length,
        sceneTitleKo: line.sceneTitleKo,
        sceneTitleEn: line.sceneTitleEn,
        sceneExplanationKo: line.sceneExplanationKo,
        sceneExplanationEn: line.sceneExplanationEn,
        dialogueQuoteKo: line.dialogueQuoteKo,
        dialogueQuoteEn: line.dialogueQuoteEn,
        sceneImageUrl: line.sceneImageUrl,
        sceneCharacters: line.sceneCharacters,
        subCuts: line.subCuts,
        choices: line.choices,
      }));
    }

    const params = {
      chapter: event.chapterNumber,
      title: t(event.chapterTitleKey, language),
      speaker: fallbackSpeakerName,
    };
    const typeKey = event.isEnding ? 'ending' : event.nodeType;
    return [
      {
        speaker: 'narrator' as const,
        cardId: event.speakerCardId,
        name: t(event.chapterTitleKey, language),
        text: t(templateKey, language, params),
      },
      {
        speaker: 'kadan' as const,
        cardId: 41,
        name: 'Kadan',
        text: t(`kadan_rpg_dialog_kadan_${typeKey}`, language, params),
      },
      {
        speaker: 'speaker' as const,
        cardId: event.speakerCardId,
        name: fallbackSpeakerName,
        text: t(`kadan_rpg_dialog_speaker_${typeKey}`, language, params),
      },
    ];
  }, [event, fallbackSpeakerName, isEn, language, templateKey, viewGranularity]);

  const [dynamicLines, setDynamicLines] = useState<ConversationLine[]>(baseLines);
  const [selectedChoiceIds, setSelectedChoiceIds] = useState<Record<number, string>>({});
  const [choiceTimeLeftMs, setChoiceTimeLeftMs] = useState<number>(0);
  const [choiceTotalDurationMs, setChoiceTotalDurationMs] = useState<number>(5000);

  useEffect(() => {
    setDynamicLines(baseLines);
    setLineIndex(0);
    setActiveSubCutIdx(null);
    setSelectedChoiceIds({});
    setChoiceTimeLeftMs(0);
    setSelectedCharCardId(null);
  }, [baseLines, event.id]);

  useEffect(() => {
    setActiveSubCutIdx(null);
    setSelectedCharCardId(null);
  }, [lineIndex]);

  const conversationLines = dynamicLines;
  const currentLine = conversationLines[lineIndex] ?? conversationLines[0];
  const isFinalLine = lineIndex >= conversationLines.length - 1;

  const currentChoices = currentLine?.choices;
  const hasActiveChoices =
    Boolean((currentChoices && currentChoices.length > 0) || currentLine?.speaker === 'choice') &&
    Boolean(currentChoices && currentChoices.length > 0 && !selectedChoiceIds[lineIndex]);

  const finishConversation = useCallback(() => {
    if (canStartBattle) {
      onStartBattle();
      return;
    }
    if (canClaimReward) {
      onClaimReward();
      return;
    }
    onComplete();
  }, [canClaimReward, canStartBattle, onClaimReward, onComplete, onStartBattle]);

  const handleSelectChoice = useCallback(
    (choice: KadanRpgDialogueChoice) => {
      setSelectedChoiceIds((prev) => ({ ...prev, [lineIndex]: choice.id }));
      setChoiceTimeLeftMs(0);

      // 1. SNS reward callback
      const snsAmount =
        choice.bonusType === 'sns' ? choice.bonusValue : choice.reward?.snsCoins || 0;
      if (snsAmount > 0) {
        const reason = isEn
          ? `[RPG Ch.${event.chapterNumber}] Choice Bonus`
          : `[RPG Ch.${event.chapterNumber}] 선택 보너스`;
        onRewardSns?.(snsAmount, reason);
      }

      // 2. Combat buff callback & storage
      if (choice.bonusType === 'buff' || choice.reward?.buff) {
        const buffId =
          choice.reward?.buff || (choice.bonusType === 'buff' ? 'atk_boost' : 'dialogue_buff');
        const buffName = isEn
          ? choice.bonusDescEn || choice.reward?.buffNameEn || 'Combat Buff'
          : choice.bonusDescKo || choice.reward?.buffName || '전투 버프';
        const buffObj = {
          id: buffId,
          type: choice.bonusType || 'buff',
          value: choice.bonusValue || 15,
          name: choice.bonusDescKo || choice.reward?.buffName || buffName,
          nameEn: choice.bonusDescEn || choice.reward?.buffNameEn || buffName,
          chapterNumber: event.chapterNumber,
          timestamp: Date.now(),
        };
        onApplyBuff?.(buffObj, buffName);
        try {
          localStorage.setItem('hero_kadan_active_buff', JSON.stringify(buffObj));
        } catch {}
      }

      // 3. Inject follow-up reaction line
      const followUpText = isEn
        ? choice.followUpTextEn ||
          choice.followUpLineEn ||
          choice.followUpTextKo ||
          choice.followUpLine ||
          ''
        : choice.followUpTextKo ||
          choice.followUpLine ||
          choice.followUpTextEn ||
          choice.followUpLineEn ||
          '';

      if (followUpText) {
        const followUpLineObj: ConversationLine = {
          speaker: 'kadan',
          cardId: currentLine?.cardId ?? 41,
          name: isEn
            ? currentLine?.nameEn || currentLine?.name || 'Kadan'
            : currentLine?.name || '카단',
          text: followUpText,
          sceneTitleKo: isEn ? 'Decision Outcome' : '선택의 결과 · 운명의 공명',
          sceneTitleEn: 'Decision Outcome · Resonance of Fate',
          sceneExplanationKo: currentLine?.sceneExplanationKo,
          sceneExplanationEn: currentLine?.sceneExplanationEn,
          sceneImageUrl: currentLine?.sceneImageUrl,
          sceneCharacters: currentLine?.sceneCharacters,
        };

        setDynamicLines((prev) => {
          const next = [...prev];
          next.splice(lineIndex + 1, 0, followUpLineObj);
          return next;
        });

        setLineIndex((curr) => curr + 1);
      } else {
        if (lineIndex < conversationLines.length - 1) {
          setLineIndex((curr) => curr + 1);
        } else {
          finishConversation();
        }
      }
    },
    [
      conversationLines.length,
      currentLine,
      event.chapterNumber,
      finishConversation,
      isEn,
      lineIndex,
      onApplyBuff,
      onRewardSns,
    ]
  );

  const advanceConversation = useCallback(() => {
    if (hasActiveChoices && currentChoices && currentChoices.length > 0) {
      const defaultChoice = currentChoices.find((c) => c.isDefault) ?? currentChoices[0];
      handleSelectChoice(defaultChoice);
      return;
    }
    if (lineIndex < conversationLines.length - 1) {
      setLineIndex((current) => current + 1);
      return;
    }
    finishConversation();
  }, [
    conversationLines.length,
    currentChoices,
    finishConversation,
    handleSelectChoice,
    hasActiveChoices,
    lineIndex,
  ]);

  const retreatConversation = useCallback(() => {
    if (lineIndex > 0) {
      setLineIndex((current) => current - 1);
    }
  }, [lineIndex]);

  const handleSkipStory = useCallback(() => {
    if (hasActiveChoices && currentChoices && currentChoices.length > 0) {
      const defaultChoice = currentChoices.find((c) => c.isDefault) ?? currentChoices[0];
      const snsAmount =
        defaultChoice.bonusType === 'sns'
          ? defaultChoice.bonusValue
          : defaultChoice.reward?.snsCoins || 0;
      if (snsAmount > 0) {
        onRewardSns?.(
          snsAmount,
          isEn
            ? `[RPG Ch.${event.chapterNumber}] Choice Bonus`
            : `[RPG Ch.${event.chapterNumber}] 선택 보너스`
        );
      }
    }
    finishConversation();
  }, [
    currentChoices,
    event.chapterNumber,
    finishConversation,
    hasActiveChoices,
    isEn,
    onRewardSns,
  ]);

  // Choice countdown timer: 5.0s manual / 3.0s auto
  useEffect(() => {
    if (!hasActiveChoices || !currentChoices || currentChoices.length === 0) {
      setChoiceTimeLeftMs(0);
      return;
    }

    const duration = autoMode ? 3000 : 5000;
    setChoiceTotalDurationMs(duration);
    setChoiceTimeLeftMs(duration);

    const deadline = Date.now() + duration;

    const intervalId = window.setInterval(() => {
      const remaining = Math.max(0, deadline - Date.now());
      setChoiceTimeLeftMs(remaining);

      if (remaining <= 0) {
        window.clearInterval(intervalId);
        const defaultChoice = currentChoices.find((c) => c.isDefault) ?? currentChoices[0];
        handleSelectChoice(defaultChoice);
      }
    }, 50);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [autoMode, currentChoices, handleSelectChoice, hasActiveChoices, lineIndex]);

  // Normal dialogue auto-advance (paused when waiting on choices)
  useEffect(() => {
    if (!autoMode) return;
    if (hasActiveChoices) return;
    const delayMs =
      autoSpeedMode === 'slow' ? 4800 : autoSpeedMode === 'fast' ? 1200 : 2600;
    const timer = window.setTimeout(
      advanceConversation,
      lineIndex < conversationLines.length - 1 ? delayMs : 3000
    );
    return () => window.clearTimeout(timer);
  }, [advanceConversation, autoMode, autoSpeedMode, conversationLines.length, hasActiveChoices, lineIndex]);

  const primaryLabel = hasActiveChoices
    ? language === 'ko'
      ? '선택 완료 ▶'
      : 'Confirm ▶'
    : isFinalLine
    ? canStartBattle
      ? t('kadan_rpg_start_battle', language)
      : canClaimReward
      ? t('kadan_rpg_claim_reward', language)
      : event.isEnding
      ? t('kadan_rpg_finish_ending', language)
      : t('kadan_rpg_continue', language)
    : language === 'ko'
    ? '다음 ▶'
    : 'Next ▶';

  // Active sub-cut or main storybook scene image
  const subCuts = currentLine?.subCuts ?? [];
  const activeSubCut =
    activeSubCutIdx !== null && subCuts[activeSubCutIdx] ? subCuts[activeSubCutIdx] : null;

  const rawSceneUrl =
    activeSubCut?.imageUrl ||
    currentLine?.sceneImageUrl ||
    `/images/webtoon/episode_${String(event.chapterNumber).padStart(2, '0')}/scene_01.webp`;

  const displayImageUrl = getAssetUrl(resolveArtStyleUrl(rawSceneUrl));

  const sceneCharacters: KadanRpgSceneCharacter[] = useMemo(() => {
    if (currentLine?.sceneCharacters && currentLine.sceneCharacters.length > 0) {
      return currentLine.sceneCharacters;
    }
    const cid = currentLine?.cardId ?? event.speakerCardId ?? 41;
    const dbCard = CARD_DATABASE[cid];
    return [
      {
        cardId: cid,
        nameKo: dbCard?.title || currentLine?.name || '카단',
        nameEn: dbCard?.title_en || currentLine?.nameEn || 'Kadan',
        roleKo: dbCard?.lore_ko || '소설 주요 등장인물',
        roleEn: dbCard?.lore_en || 'Key Novel Character',
        isSpeaker: true,
      },
    ];
  }, [currentLine, event.speakerCardId]);

  const sceneTitle = isEn
    ? currentLine?.sceneTitleEn || currentLine?.sceneTitleKo || t(event.chapterTitleKey, language)
    : currentLine?.sceneTitleKo || currentLine?.sceneTitleEn || t(event.chapterTitleKey, language);

  const displayedNovelText = isEn
    ? activeSubCut?.narrationEn || currentLine?.textEn || currentLine?.text
    : activeSubCut?.narrationKo || currentLine?.text;

  const sceneProgressPct = Math.max(
    4,
    Math.min(100, Math.round(((lineIndex + 1) / Math.max(1, conversationLines.length)) * 100))
  );

  const dialogContent = (
    <div
      className="fixed inset-0 z-[20000] flex h-[100dvh] max-h-[100dvh] w-screen flex-col overflow-hidden bg-[#0d0c10] text-[#fdfcfc] font-mono select-none animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label={t(event.chapterTitleKey, language) || 'Story Dialogue'}
    >
      {/* ─── 1. 상단 전체화면 헤더 바: 회차 제목 · 장면 진행도 · 삽화모드(애니/무비) · 닫기 ─── */}
      <div className="shrink-0 flex items-center justify-between gap-2 border-b border-stone-800 bg-[#16141b] px-3 sm:px-5 py-2.5">
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <span className="shrink-0 rounded-sm bg-amber-500 px-2.5 py-1 text-xs sm:text-sm font-mono font-black text-stone-950">
            {language === 'ko' ? `제${event.chapterNumber}화 / 40화` : `EP.${event.chapterNumber} / 40`}
          </span>
          <span className="truncate text-sm sm:text-base md:text-lg font-mono font-extrabold text-stone-100">
            {t(event.chapterTitleKey, language)}
          </span>
          <span className="shrink-0 rounded-sm border border-stone-700 bg-stone-900 px-2 py-0.5 text-xs font-mono font-bold text-amber-300">
            {lineIndex + 1} / {conversationLines.length}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* 장면 구성 단위 토글: 10장면 요약 / 50컷 전체 */}
          <div
            className="hidden sm:inline-flex min-h-[40px] items-center rounded-sm border border-stone-700 bg-stone-950 p-0.5 font-mono"
            role="group"
            aria-label={language === 'ko' ? '장면 구성 전환' : 'Scene Granularity'}
          >
            <button
              type="button"
              onClick={() => setViewGranularity('storybook')}
              className={cn(
                'min-h-[34px] px-2.5 py-1 rounded-sm text-xs font-mono font-bold transition-colors cursor-pointer',
                viewGranularity === 'storybook'
                  ? 'bg-emerald-400 text-stone-950 font-black'
                  : 'text-stone-400 hover:text-stone-200'
              )}
            >
              📚 {language === 'ko' ? '10장면' : '10 Scenes'}
            </button>
            <button
              type="button"
              onClick={() => setViewGranularity('all_cuts')}
              className={cn(
                'min-h-[34px] px-2.5 py-1 rounded-sm text-xs font-mono font-bold transition-colors cursor-pointer',
                viewGranularity === 'all_cuts'
                  ? 'bg-emerald-400 text-stone-950 font-black'
                  : 'text-stone-400 hover:text-stone-200'
              )}
            >
              🎞️ {language === 'ko' ? '전체컷' : 'All Cuts'}
            </button>
          </div>

          {/* 삽화모드 토글: 애니 / 무비 */}
          <div
            className="inline-flex min-h-[40px] items-center rounded-sm border border-stone-700 bg-stone-950 p-0.5 font-mono"
            role="group"
            aria-label={language === 'ko' ? '삽화모드 전환' : 'Illustration Mode'}
          >
            <button
              type="button"
              onClick={() => handleSetArtStyleMode('animation')}
              className={cn(
                'min-h-[34px] px-2.5 py-1 rounded-sm text-xs font-mono font-bold transition-colors cursor-pointer',
                artStyleMode === 'animation'
                  ? 'bg-cyan-400 text-stone-950 font-black'
                  : 'text-stone-400 hover:text-stone-200'
              )}
            >
              🎨 {language === 'ko' ? '애니' : 'Anime'}
            </button>
            <button
              type="button"
              onClick={() => handleSetArtStyleMode('liveaction')}
              className={cn(
                'min-h-[34px] px-2.5 py-1 rounded-sm text-xs font-mono font-bold transition-colors cursor-pointer',
                artStyleMode === 'liveaction'
                  ? 'bg-amber-400 text-stone-950 font-black'
                  : 'text-stone-400 hover:text-stone-200'
              )}
            >
              🎬 {language === 'ko' ? '무비' : 'Movie'}
            </button>
          </div>

          {/* 닫기 */}
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-sm border border-stone-700 bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-white transition-colors cursor-pointer"
            aria-label={t('kadan_rpg_close', language) || 'Close'}
            title={t('kadan_rpg_close', language) || 'Close'}
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* 상단 회차 장면 진행 프로그레스 라인 */}
      <div className="h-1 w-full shrink-0 bg-stone-900 overflow-hidden">
        <div
          className="h-full bg-amber-400 transition-all duration-300 ease-out"
          style={{ width: `${sceneProgressPct}%` }}
        />
      </div>

      {/* ─── 2. 전체화면 몰입형 본문 영역: ① 대화면 삽화 + ② 등장인물 + ③ 전체화면 대사창 ─── */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden bg-[#121016]">
        {/* ① 삽화 (모바일 상단 와이드 뷰포트 / 데스크톱 좌측 58% 풀하이트 시네마틱 뷰포트) */}
        <div className="relative w-full h-[38dvh] sm:h-[45dvh] lg:h-full lg:w-[58%] shrink-0 bg-stone-950 border-b lg:border-b-0 lg:border-r border-stone-800 select-none overflow-hidden flex items-center justify-center">
          <img
            key={`storybook-scene-${event.chapterNumber}-${lineIndex}`}
            src={displayImageUrl}
            alt={sceneTitle}
            className="h-full w-full object-cover"
            loading="eager"
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-black/75 border-t border-white/10 px-3 sm:px-4 py-2 flex items-center justify-between gap-2">
            <span className="truncate text-xs sm:text-sm font-mono font-bold text-amber-200">
              {sceneTitle}
            </span>
            <span className="shrink-0 text-[11px] font-mono text-stone-300">
              {artStyleMode === 'liveaction'
                ? language === 'ko'
                  ? '🎬 70mm 무비 컷'
                  : '🎬 70mm Movie Cut'
                : language === 'ko'
                ? '🎨 애니메이션 컷'
                : '🎨 Anime Cut'}
            </span>
          </div>
        </div>

        {/* 우측/하단: ② 등장인물 캐스트 바 + ③ 몰입형 대사 및 선택지 영역 */}
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden bg-[#141218]">
          {/* ② 등장인물 (간결한 캐릭터 바) */}
          <div className="shrink-0 px-3 sm:px-5 py-2.5 bg-[#1b1822] border-b border-stone-800 flex items-center gap-2 overflow-x-auto custom-scrollbar">
            <span className="shrink-0 text-xs font-mono font-bold text-stone-400">
              {language === 'ko' ? '등장인물' : 'Cast'}
            </span>
            {sceneCharacters.map((ch) => {
              const isSpk = ch.isSpeaker || ch.cardId === currentLine.cardId;
              const seatUrl = ch.seatAsset ? getAssetUrl(ch.seatAsset) : null;
              return (
                <div
                  key={ch.cardId}
                  className={cn(
                    'shrink-0 flex items-center gap-2 rounded-sm border px-2.5 py-1',
                    isSpk
                      ? 'bg-amber-950/80 border-amber-400 text-amber-200'
                      : 'bg-stone-900 border-stone-700 text-stone-300'
                  )}
                >
                  <div className="h-7 w-7 shrink-0 overflow-hidden rounded-none border border-stone-600 bg-stone-950">
                    {seatUrl ? (
                      <img
                        src={seatUrl}
                        alt={isEn ? ch.nameEn : ch.nameKo}
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <div
                        className="h-full w-full bg-center bg-no-repeat"
                        style={{
                          ...getCharacterPortraitStyle(ch.cardId),
                          aspectRatio: '256 / 296',
                        }}
                      />
                    )}
                  </div>
                  <span className="text-xs sm:text-sm font-mono font-bold">
                    {isEn ? ch.nameEn : ch.nameKo}
                  </span>
                </div>
              );
            })}
          </div>

          {/* ③ 해당 대사 (전체화면 남은 영역을 꽉 채우는 몰입형 대화창) */}
          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-4 sm:p-6 flex flex-col justify-between gap-4">
            <div className="rounded-none border border-stone-800 bg-[#0f0d13] p-4 sm:p-5 flex-1 flex flex-col">
              <div className="mb-3 flex items-center justify-between gap-2 border-b border-stone-800/80 pb-2.5">
                <span className="inline-flex items-center gap-1.5 rounded-sm bg-amber-500/20 border border-amber-500/60 px-2.5 py-1 text-xs sm:text-sm font-mono font-black text-amber-300">
                  <Icon size={14} />
                  {currentLine.name}
                </span>
                {autoMode && (
                  <span className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-mono font-bold text-cyan-300">
                    <Bot size={13} className="animate-spin" />
                    {language === 'ko' ? '자동 스토리 진행 중' : 'Auto Story Playing'}
                  </span>
                )}
              </div>
              <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
                {renderFormattedNovelText(displayedNovelText || '')}
              </div>
            </div>

            {/* 선택지가 있는 장면일 때만 선택지 표시 */}
            {hasActiveChoices && currentChoices && currentChoices.length > 0 && (
              <div className="shrink-0 rounded-none border border-amber-500/80 bg-[#1c1614] p-3.5 sm:p-4 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-mono text-amber-300">
                  <span className="font-bold">
                    {language === 'ko' ? '운명의 선택' : 'Choice of Fate'}
                  </span>
                  <span className="font-bold">{(choiceTimeLeftMs / 1000).toFixed(1)}s</span>
                </div>
                <div className="flex flex-col gap-2">
                  {currentChoices.map((choice) => (
                    <button
                      key={choice.id}
                      type="button"
                      onClick={() => handleSelectChoice(choice)}
                      className={cn(
                        'w-full min-h-[46px] px-3.5 py-2.5 text-left font-mono rounded-sm border transition-colors flex items-center justify-between gap-2 cursor-pointer text-xs sm:text-sm font-semibold',
                        choice.isDefault
                          ? 'bg-stone-900 hover:bg-stone-800 border-amber-500/80 text-white'
                          : 'bg-stone-950 hover:bg-stone-800/80 border-stone-700 text-stone-200'
                      )}
                    >
                      <span>
                        {isEn
                          ? choice.labelEn || choice.textEn || choice.labelKo || choice.text
                          : choice.labelKo || choice.text || choice.labelEn}
                      </span>
                      {(choice.bonusDescKo || choice.bonusDescEn) && (
                        <span className="text-xs font-mono font-bold text-emerald-400 shrink-0">
                          {isEn
                            ? choice.bonusDescEn || choice.bonusDescKo
                            : choice.bonusDescKo || choice.bonusDescEn}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── 3. 하단 전체화면 컨트롤 바: 자동플레이 · 스킵 · 이전/다음 ─── */}
      <div className="shrink-0 flex items-center justify-between gap-2 border-t border-stone-800 bg-[#16141b] px-3 sm:px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center gap-2">
          {/* 자동플레이 */}
          {onToggleAutoMode && (
            <button
              type="button"
              onClick={onToggleAutoMode}
              className={cn(
                'min-h-[44px] rounded-sm px-3.5 py-2 text-xs sm:text-sm font-mono font-bold transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 border',
                autoMode
                  ? 'bg-indigo-600 border-indigo-400 text-white'
                  : 'bg-stone-900 border-stone-700 text-stone-300 hover:bg-stone-800'
              )}
            >
              {autoMode ? (
                <Bot size={15} className="animate-spin text-cyan-200" />
              ) : (
                <Pause size={15} />
              )}
              <span>
                {autoMode
                  ? language === 'ko'
                    ? '자동플레이 ON'
                    : 'Auto ON'
                  : language === 'ko'
                  ? '자동플레이 OFF'
                  : 'Auto OFF'}
              </span>
            </button>
          )}

          {/* 스킵 */}
          <button
            type="button"
            onClick={handleSkipStory}
            className="min-h-[44px] rounded-sm px-3.5 py-2 text-xs sm:text-sm font-mono font-bold border border-stone-700 bg-stone-900 hover:bg-stone-800 text-stone-300 transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
            title={language === 'ko' ? '대화 건너뛰기' : 'Skip Dialogue'}
          >
            <FastForward size={15} className="text-amber-400" />
            <span>{language === 'ko' ? '스킵' : 'Skip'}</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {lineIndex > 0 && (
            <button
              type="button"
              onClick={retreatConversation}
              className="min-h-[44px] min-w-[44px] rounded-sm border border-stone-700 bg-stone-900 text-stone-200 hover:bg-stone-800 px-3 py-2 text-xs sm:text-sm font-mono font-bold transition-all active:scale-95 cursor-pointer flex items-center justify-center"
              aria-label={language === 'ko' ? '이전' : 'Prev'}
              title={language === 'ko' ? '이전 장면' : 'Previous'}
            >
              <ChevronLeft size={18} />
            </button>
          )}

          {/* 다음 / 전투 시작 / 완료 */}
          <button
            type="button"
            onClick={advanceConversation}
            className={cn(
              'min-h-[44px] rounded-sm px-5 sm:px-6 py-2 text-xs sm:text-sm font-mono font-black text-white shadow-none transition-all active:scale-95 cursor-pointer flex items-center gap-1.5',
              hasActiveChoices
                ? 'bg-amber-500 hover:bg-amber-400 text-stone-950'
                : isFinalLine && canStartBattle
                ? 'bg-rose-600 hover:bg-rose-500 text-white'
                : 'bg-amber-500 hover:bg-amber-400 text-stone-950'
            )}
          >
            <span>{primaryLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );

  if (typeof document !== 'undefined') {
    return createPortal(dialogContent, document.body);
  }
  return dialogContent;
};
