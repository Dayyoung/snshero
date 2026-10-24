import React, { useCallback, useEffect, useMemo, useState } from 'react';
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

interface KadanNpcDialogProps {
  event: KadanRpgEvent;
  language: Language;
  isCompleted: boolean;
  autoMode: boolean;
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
        className="mb-3 last:mb-0 font-mono text-xs sm:text-sm md:text-[15px] leading-relaxed text-slate-100 break-words"
      >
        {parts.map((part, sIdx) => {
          const isQuote =
            (part.startsWith('“') && part.endsWith('”')) ||
            (part.startsWith('"') && part.endsWith('"'));
          if (isQuote) {
            return (
              <span
                key={sIdx}
                className="font-bold text-amber-300 bg-amber-950/40 px-1 py-0.5 rounded-sm border border-amber-500/30"
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
  const [selectedCharCardId, setSelectedCharCardId] = useState<number | null>(null);
  const [showSceneIndexModal, setShowSceneIndexModal] = useState(false);
  const [autoSpeedMode, setAutoSpeedMode] = useState<'normal' | 'slow' | 'fast'>('normal');

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

  const handleSkipToFinal = useCallback(() => {
    if (hasActiveChoices && currentChoices && currentChoices.length > 0) {
      const defaultChoice = currentChoices.find((c) => c.isDefault) ?? currentChoices[0];
      handleSelectChoice(defaultChoice);
    }
    setLineIndex(conversationLines.length - 1);
  }, [conversationLines.length, currentChoices, handleSelectChoice, hasActiveChoices]);

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
      ? '기본 선택으로 진행'
      : 'Select Default & Continue'
    : isFinalLine
    ? canStartBattle
      ? t('kadan_rpg_start_battle', language)
      : canClaimReward
      ? t('kadan_rpg_claim_reward', language)
      : event.isEnding
      ? t('kadan_rpg_finish_ending', language)
      : t('kadan_rpg_continue', language)
    : language === 'ko'
    ? '다음 그림책 장면 ▶'
    : 'Next Scene ▶';

  // Active sub-cut or main storybook scene image
  const subCuts = currentLine?.subCuts ?? [];
  const activeSubCut =
    activeSubCutIdx !== null && subCuts[activeSubCutIdx] ? subCuts[activeSubCutIdx] : null;

  const displayImageUrl = getAssetUrl(
    activeSubCut?.imageUrl ||
      currentLine?.sceneImageUrl ||
      `/images/webtoon/episode_${String(event.chapterNumber).padStart(2, '0')}/scene_01.webp`
  );

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

  const selectedCharacterObj = useMemo(() => {
    if (!selectedCharCardId) return null;
    return sceneCharacters.find((c) => c.cardId === selectedCharCardId) ?? null;
  }, [sceneCharacters, selectedCharCardId]);

  const sceneTitle = isEn
    ? currentLine?.sceneTitleEn || currentLine?.sceneTitleKo || t(event.chapterTitleKey, language)
    : currentLine?.sceneTitleKo || currentLine?.sceneTitleEn || t(event.chapterTitleKey, language);

  const sceneExplanation = isEn
    ? currentLine?.sceneExplanationEn || currentLine?.sceneExplanationKo
    : currentLine?.sceneExplanationKo || currentLine?.sceneExplanationEn;

  const dialogueQuote = isEn
    ? activeSubCut?.dialogueEn || currentLine?.dialogueQuoteEn || currentLine?.dialogueQuoteKo
    : activeSubCut?.dialogueKo || currentLine?.dialogueQuoteKo || currentLine?.dialogueQuoteEn;

  const displayedNovelText = isEn
    ? activeSubCut?.narrationEn || currentLine?.textEn || currentLine?.text
    : activeSubCut?.narrationKo || currentLine?.text;

  return (
    <div
      className="fixed inset-0 z-[10010] flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label={t(event.chapterTitleKey, language) || 'Storybook Dialogue'}
    >
      {/* ─── 그림책(Storybook) 메인 모달 프레임 ─── */}
      <div className="relative z-20 flex max-h-[94dvh] w-full max-w-4xl flex-col overflow-hidden rounded-none border-2 border-stone-700 bg-[#141216] text-[#fdfcfc] shadow-none font-mono">
        {/* ─── 1. 상단 그림책 헤더 바 (회차 제목 · 완독 모드 전환 · 목차 · 닫기) ─── */}
        <div className="shrink-0 flex flex-wrap items-center justify-between gap-2 border-b border-stone-800 bg-[#1c191e] px-3 py-2 sm:px-4">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span className="inline-flex items-center gap-1.5 rounded-sm bg-amber-600 px-2.5 py-1 text-xs font-mono font-black uppercase tracking-wider text-stone-950">
              <BookOpen size={14} />
              <span>
                {language === 'ko'
                  ? `그림책 제${event.chapterNumber}화`
                  : `STORYBOOK EP.${event.chapterNumber}`}
              </span>
            </span>
            <span className="truncate rounded-sm border border-stone-700 bg-stone-900 px-2.5 py-1 text-xs font-mono font-bold text-amber-200 max-w-[200px] sm:max-w-xs">
              {t(event.chapterTitleKey, language)}
            </span>
            {/* Reincarnation Badge */}
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-[11px] font-bold font-mono border select-none',
                rebirthLevel > 0
                  ? 'bg-amber-950/90 text-amber-300 border-amber-500/80'
                  : 'bg-stone-900 text-emerald-300 border-stone-700'
              )}
            >
              <span>{rebirthLevel > 0 ? '👑' : '🌱'}</span>
              <span>
                {rebirthLevel > 0
                  ? language === 'ko'
                    ? `환생 ${rebirthLevel}회차`
                    : `Rebirth Lv.${rebirthLevel}`
                  : t('kadan_rpg_first_journey_badge', language)}
              </span>
            </span>
            {isCompleted && (
              <span className="inline-flex items-center gap-1 rounded-sm bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 text-[11px] font-mono font-bold text-emerald-400">
                <CheckCircle2 size={12} />
                {t('kadan_rpg_completed', language)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {/* 그림책 보기 모드 전환: 장절 완독(10장면) vs 대사/문장별 50컷 */}
            <button
              type="button"
              onClick={() =>
                setViewGranularity((prev) => (prev === 'storybook' ? 'all_cuts' : 'storybook'))
              }
              className={cn(
                'min-h-[38px] sm:min-h-[40px] rounded-sm px-2.5 py-1 text-[11px] font-mono font-bold border transition-colors cursor-pointer flex items-center gap-1.5',
                viewGranularity === 'all_cuts'
                  ? 'bg-indigo-600 border-indigo-400 text-white'
                  : 'bg-stone-900 border-stone-700 text-amber-300 hover:bg-stone-800'
              )}
              title={
                language === 'ko'
                  ? '장절 통합 그림책 모드와 전체 50컷 낱장 그림책 모드를 전환합니다'
                  : 'Toggle between Chapter Storybook mode and 50-Cut Granular mode'
              }
            >
              <Film size={13} />
              <span>
                {viewGranularity === 'storybook'
                  ? language === 'ko'
                    ? '🎞️ 50컷 세밀 보기'
                    : '🎞️ 50-Cut Mode'
                  : language === 'ko'
                  ? '📚 장절 통합 보기'
                  : '📚 Storybook Mode'}
              </span>
            </button>

            {/* 장면 목차 버튼 */}
            <button
              type="button"
              onClick={() => setShowSceneIndexModal((prev) => !prev)}
              className="min-h-[38px] sm:min-h-[40px] rounded-sm border border-stone-700 bg-stone-900 hover:bg-stone-800 px-2.5 py-1 text-[11px] font-mono font-bold text-stone-200 transition-colors cursor-pointer flex items-center gap-1"
              title={language === 'ko' ? '장면 목차 열기' : 'Scene Index'}
            >
              <List size={13} className="text-amber-400" />
              <span className="hidden sm:inline">{language === 'ko' ? '장면 목차' : 'Scenes'}</span>
              <span className="text-amber-300 font-black">
                {lineIndex + 1}/{conversationLines.length}
              </span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="min-h-[40px] min-w-[40px] flex items-center justify-center p-1.5 rounded-sm hover:bg-stone-800 text-stone-400 hover:text-white transition-colors cursor-pointer border border-transparent hover:border-stone-700"
              aria-label={t('kadan_rpg_close', language) || 'Close'}
              title={t('kadan_rpg_close', language) || 'Close'}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ─── 스크롤 가능한 그림책 본문 영역 (상단 16:9 장면 삽화 + 등장인물 무대 + 하단 소설 100% 원문 & 해설) ─── */}
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar bg-[#18151b]">
          {/* ─── 2. 그림책 장면 삽화 캔버스 (16:9 와이드 장면 + 좌우 책장 넘김 + 세부 컷 필름바) ─── */}
          <div className="relative w-full bg-[#0d0b0f] border-b border-stone-800">
            <div className="relative mx-auto w-full max-w-3xl aspect-video overflow-hidden bg-stone-950 select-none">
              <img
                key={`storybook-scene-${event.chapterNumber}-${lineIndex}-${activeSubCutIdx ?? 'main'}`}
                src={displayImageUrl}
                alt={sceneTitle}
                className="h-full w-full object-cover transition-all duration-300"
                loading="eager"
              />

              {/* 상단 장면 타이틀 오버레이 배지 */}
              <div className="pointer-events-none absolute inset-x-0 top-0 bg-black/65 px-3 py-1.5 flex items-center justify-between gap-2 border-b border-white/10">
                <span className="truncate text-[11px] sm:text-xs font-mono font-bold text-amber-200">
                  {sceneTitle}
                </span>
                <span className="shrink-0 rounded-sm bg-amber-500/20 border border-amber-400/50 px-2 py-0.5 text-[10px] font-mono font-black text-amber-300">
                  {language === 'ko'
                    ? `소설 원문 100% 수록 · ${lineIndex + 1}/${conversationLines.length}장면`
                    : `100% Full Novel · Page ${lineIndex + 1}/${conversationLines.length}`}
                </span>
              </div>

              {/* 좌우 그림책 페이지 넘김 버튼 (44px+ 터치 타깃) */}
              {lineIndex > 0 && (
                <button
                  type="button"
                  onClick={retreatConversation}
                  className="absolute left-2 top-1/2 -translate-y-1/2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-sm bg-black/70 hover:bg-black/90 text-white border border-white/25 transition-all active:scale-95 cursor-pointer"
                  aria-label={language === 'ko' ? '이전 장면' : 'Previous Scene'}
                  title={language === 'ko' ? '이전 장면으로 돌아가기' : 'Previous Scene'}
                >
                  <ChevronLeft size={22} />
                </button>
              )}
              <button
                type="button"
                onClick={advanceConversation}
                className="absolute right-2 top-1/2 -translate-y-1/2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-sm bg-black/70 hover:bg-amber-600 text-white border border-white/25 transition-all active:scale-95 cursor-pointer"
                aria-label={language === 'ko' ? '다음 장면' : 'Next Scene'}
                title={language === 'ko' ? '다음 장면으로 넘기기' : 'Next Scene'}
              >
                <ChevronRight size={22} />
              </button>
            </div>

            {/* ─── 2-B. 장면 내 세부 컷(Sub-Cuts) 필름 스트립 (장절 모드일 때 세부 컷 즉시 전환 가능) ─── */}
            {viewGranularity === 'storybook' && subCuts.length > 1 && (
              <div className="mx-auto max-w-3xl px-3 py-2 bg-[#141218] border-t border-stone-800/80 flex items-center gap-2 overflow-x-auto custom-scrollbar">
                <span className="shrink-0 text-[11px] font-mono font-bold text-stone-400 flex items-center gap-1">
                  <Film size={12} className="text-amber-400" />
                  <span>{language === 'ko' ? '이 장면의 세부 컷:' : 'Scene Cuts:'}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setActiveSubCutIdx(null)}
                  className={cn(
                    'shrink-0 min-h-[34px] px-2.5 py-1 rounded-sm text-[11px] font-mono font-bold border transition-colors cursor-pointer',
                    activeSubCutIdx === null
                      ? 'bg-amber-500 text-stone-950 border-amber-400 font-black'
                      : 'bg-stone-900 text-stone-300 border-stone-700 hover:bg-stone-800'
                  )}
                >
                  {language === 'ko' ? '대표 합본 장면' : 'Main Scene'}
                </button>
                {subCuts.map((sc, idx) => (
                  <button
                    key={sc.cutNumber}
                    type="button"
                    onClick={() => setActiveSubCutIdx(idx)}
                    className={cn(
                      'shrink-0 min-h-[34px] px-2.5 py-1 rounded-sm text-[11px] font-mono font-bold border transition-colors cursor-pointer flex items-center gap-1.5',
                      activeSubCutIdx === idx
                        ? 'bg-amber-500 text-stone-950 border-amber-400 font-black'
                        : 'bg-stone-900 text-stone-300 border-stone-700 hover:bg-stone-800'
                    )}
                  >
                    <span>
                      {language === 'ko' ? `컷 #${sc.cutNumber}` : `Cut #${sc.cutNumber}`}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* ─── 2-C. 이 장면에 함께 등장하는 캐릭터 무대 & 인물 관계 도감 바 ─── */}
            <div className="mx-auto max-w-3xl px-3 py-2.5 bg-[#1b1820] border-t border-stone-800">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[11px] font-mono font-bold text-amber-300 flex items-center gap-1.5">
                  <Users size={13} />
                  <span>
                    {language === 'ko'
                      ? `장면 등장인물 (${sceneCharacters.length}명) — 인물을 눌러 소설 속 역할·관계를 확인하세요`
                      : `Characters in Scene (${sceneCharacters.length}) — Tap to view story role`}
                  </span>
                </span>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
                {sceneCharacters.map((ch) => {
                  const isSpk = ch.isSpeaker || ch.cardId === currentLine.cardId;
                  const isSelected = selectedCharCardId === ch.cardId;
                  const seatUrl = ch.seatAsset ? getAssetUrl(ch.seatAsset) : null;
                  const roleShort = isEn
                    ? ch.roleEn.split('·')[0].trim()
                    : ch.roleKo.split('·')[0].trim();

                  return (
                    <button
                      key={ch.cardId}
                      type="button"
                      onClick={() =>
                        setSelectedCharCardId((prev) => (prev === ch.cardId ? null : ch.cardId))
                      }
                      className={cn(
                        'shrink-0 min-h-[52px] flex items-center gap-2.5 rounded-sm border px-2.5 py-1.5 text-left transition-all cursor-pointer',
                        isSelected
                          ? 'bg-amber-950/80 border-amber-400 text-white'
                          : isSpk
                          ? 'bg-indigo-950/80 border-indigo-400/90 text-white'
                          : 'bg-stone-900/90 border-stone-700/80 text-stone-200 hover:bg-stone-800'
                      )}
                    >
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-none border border-stone-600 bg-stone-950 flex items-center justify-center">
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
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-mono font-black text-white truncate">
                            {isEn ? ch.nameEn : ch.nameKo}
                          </span>
                          {isSpk && (
                            <span className="rounded-sm bg-amber-500 px-1.5 py-0.2 text-[9px] font-mono font-black text-stone-950">
                              {language === 'ko' ? '중심/발화' : 'ACTIVE'}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] font-mono text-stone-300 truncate max-w-[170px]">
                          {roleShort}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* 선택된 캐릭터 상세 소설 설정 안내창 */}
              {selectedCharacterObj && (
                <div className="mt-2 rounded-none border border-amber-500/50 bg-amber-950/30 p-2.5 text-xs font-mono text-amber-100 flex items-start justify-between gap-2">
                  <div>
                    <span className="font-black text-amber-300">
                      [{isEn ? selectedCharacterObj.nameEn : selectedCharacterObj.nameKo}]
                    </span>{' '}
                    <span>
                      {isEn ? selectedCharacterObj.roleEn : selectedCharacterObj.roleKo}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedCharCardId(null)}
                    className="text-amber-300 hover:text-white px-1 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ─── 3. 그림책 하단 이야기 페이지 (장면 해설 + 핵심 대사 + 소설 원문 100% 지문) ─── */}
          <div className="mx-auto max-w-3xl p-3.5 sm:p-5 space-y-3.5">
            {/* 3-A. [💡 장면 해설 & 이야기 이해 가이드] */}
            {sceneExplanation && (
              <div className="rounded-none border border-indigo-500/40 bg-indigo-950/35 p-3">
                <div className="flex items-center gap-1.5 text-xs font-mono font-black text-indigo-300 mb-1">
                  <Info size={14} className="shrink-0 text-indigo-400" />
                  <span>
                    {language === 'ko'
                      ? '💡 장면 해설 & 소설 줄거리 이해 가이드'
                      : '💡 Scene Commentary & Story Comprehension Guide'}
                  </span>
                </div>
                <p className="whitespace-pre-line font-mono text-xs sm:text-[13px] leading-relaxed text-indigo-100/95">
                  {sceneExplanation}
                </p>
              </div>
            )}

            {/* 3-B. [🗣️ 핵심 대사 하이라이트 박스] */}
            {dialogueQuote && (
              <div className="rounded-none border-l-4 border-amber-400 bg-stone-900/90 p-3 flex items-start gap-3">
                <div className="h-11 w-11 shrink-0 overflow-hidden rounded-none border border-amber-500/60 bg-stone-950 flex items-center justify-center">
                  <div
                    className="h-full w-full bg-center bg-no-repeat"
                    style={{
                      ...getCharacterPortraitStyle(currentLine.cardId),
                      aspectRatio: '256 / 296',
                    }}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="inline-flex items-center gap-1 rounded-sm bg-amber-500/20 border border-amber-500/50 px-2 py-0.5 text-[11px] font-mono font-black text-amber-300">
                      <Icon size={12} />
                      {currentLine.name}
                    </span>
                    <span className="text-[10px] font-mono text-stone-400">
                      {language === 'ko' ? '핵심 대사' : 'Key Dialogue'}
                    </span>
                  </div>
                  <p className="font-mono text-xs sm:text-sm font-bold leading-relaxed text-amber-200 break-words">
                    {dialogueQuote}
                  </p>
                </div>
              </div>
            )}

            {/* 3-C. [📖 소설 원문 100% 무삭제 지문 & 대사] */}
            <div className="rounded-none border border-stone-700/90 bg-[#121015] p-3.5 sm:p-4">
              <div className="flex items-center justify-between gap-2 border-b border-stone-800 pb-2 mb-3">
                <span className="text-[11px] font-mono font-black uppercase tracking-wider text-stone-300 flex items-center gap-1.5">
                  <BookOpen size={13} className="text-amber-400" />
                  <span>
                    {language === 'ko'
                      ? '📖 소설 원문 100% 지문 및 대사 (무삭제 완역)'
                      : '📖 100% Unabridged Novel Passage & Dialogue'}
                  </span>
                </span>
                <span className="text-[11px] font-mono font-bold text-amber-400">
                  {language === 'ko'
                    ? `페이지 ${lineIndex + 1} / ${conversationLines.length}`
                    : `Page ${lineIndex + 1} / ${conversationLines.length}`}
                </span>
              </div>

              <div className="max-h-[260px] sm:max-h-[320px] overflow-y-auto pr-1 custom-scrollbar">
                {renderFormattedNovelText(displayedNovelText || '')}
              </div>

              {/* 진행도 게이지 바 */}
              <div className="mt-4 pt-2.5 border-t border-stone-800/80">
                <div className="flex gap-1">
                  {conversationLines.map((line, index) => (
                    <button
                      key={`${line.speaker}-${index}`}
                      type="button"
                      onClick={() => setLineIndex(index)}
                      title={`${index + 1} / ${conversationLines.length}`}
                      className={cn(
                        'h-2 flex-1 rounded-none transition-all duration-200 cursor-pointer',
                        index === lineIndex
                          ? 'bg-amber-400'
                          : index < lineIndex
                          ? 'bg-indigo-500'
                          : 'bg-stone-800 hover:bg-stone-700'
                      )}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* ─── 3-D. 인터랙티브 운명의 선택지 및 카운트다운 타이머 섹션 ─── */}
            {hasActiveChoices && currentChoices && currentChoices.length > 0 && (
              <div className="rounded-none border-2 border-amber-500/80 bg-[#1c1614] p-3.5 sm:p-4">
                <div className="w-full mb-3">
                  <div className="flex items-center justify-between text-[11px] font-mono text-stone-300 mb-1">
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block w-2 h-2 rounded-none bg-amber-400" />
                      <span className="font-bold text-amber-300">
                        {language === 'ko'
                          ? '운명의 선택 (결단 카운트다운)'
                          : 'Fate Decision (Countdown)'}
                      </span>
                      {autoMode && (
                        <span className="text-[10px] text-cyan-300 bg-cyan-950/80 px-1.5 py-0.5 border border-cyan-800 rounded-sm">
                          {language === 'ko' ? '자동 선택 (3.0초)' : 'Auto-Pick (3.0s)'}
                        </span>
                      )}
                    </span>
                    <span className="font-mono font-bold text-amber-200">
                      {(choiceTimeLeftMs / 1000).toFixed(1)}s
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-stone-900 border border-stone-700/80 rounded-none overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-none transition-all duration-75 ease-linear"
                      style={{
                        width: `${Math.max(
                          0,
                          Math.min(100, (choiceTimeLeftMs / choiceTotalDurationMs) * 100)
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  {currentChoices.map((choice) => (
                    <button
                      key={choice.id}
                      type="button"
                      onClick={() => handleSelectChoice(choice)}
                      className={cn(
                        'w-full min-h-[44px] p-2.5 sm:p-3 text-left font-mono rounded-sm border transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2 cursor-pointer',
                        choice.isDefault
                          ? 'bg-stone-900 hover:bg-stone-800 border-amber-500/80 text-white'
                          : 'bg-stone-950 hover:bg-stone-800/80 border-stone-700 text-stone-200'
                      )}
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={cn(
                            'px-2 py-0.5 text-[11px] font-mono font-bold rounded-sm border uppercase tracking-wider shrink-0',
                            choice.attitude === '[결의/돌파]'
                              ? 'text-amber-300 border-amber-600/80 bg-amber-950/40'
                              : choice.attitude === '[신중/통찰]'
                              ? 'text-cyan-300 border-cyan-600/80 bg-cyan-950/40'
                              : 'text-violet-300 border-violet-600/80 bg-violet-950/40'
                          )}
                        >
                          {isEn
                            ? choice.attitudeEn ||
                              choice.badgeEn ||
                              choice.attitude ||
                              choice.badge
                            : choice.attitude || choice.badge}
                        </span>
                        <span className="text-xs sm:text-sm font-semibold leading-snug">
                          {isEn
                            ? choice.labelEn || choice.textEn || choice.labelKo || choice.text
                            : choice.labelKo || choice.text || choice.labelEn}
                        </span>
                        {choice.isDefault && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-sm border border-amber-500/60 bg-amber-950/60 text-amber-300 shrink-0">
                            {isEn ? 'DEFAULT' : '기본 선택'}
                          </span>
                        )}
                      </div>
                      {(choice.bonusDescKo || choice.bonusDescEn || choice.reward) && (
                        <span className="text-[11px] font-mono font-bold text-emerald-400 shrink-0 self-start sm:self-center">
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

        {/* ─── 4. 장면 목차(Scene Index) 드로어 오버레이 ─── */}
        {showSceneIndexModal && (
          <div className="absolute inset-0 z-30 flex flex-col bg-[#141216]/98 p-4 font-mono">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <List size={16} className="text-amber-400" />
                <h3 className="text-sm font-black text-white">
                  {language === 'ko'
                    ? `제 ${event.chapterNumber}화 그림책 전체 장면 목차 (${conversationLines.length}장면)`
                    : `EP.${event.chapterNumber} Picture-Book Scene Index (${conversationLines.length} Scenes)`}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSceneIndexModal(false)}
                className="min-h-[40px] px-3 py-1 rounded-sm border border-stone-700 bg-stone-900 text-xs font-bold text-stone-300 hover:text-white cursor-pointer"
              >
                {language === 'ko' ? '닫기 ✕' : 'Close ✕'}
              </button>
            </div>
            <div className="flex-1 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2.5 pr-1 custom-scrollbar">
              {conversationLines.map((item, idx) => {
                const thumbUrl = getAssetUrl(
                  item.sceneImageUrl ||
                    `/images/webtoon/episode_${String(event.chapterNumber).padStart(2, '0')}/scene_01.webp`
                );
                const itemTitle = isEn
                  ? item.sceneTitleEn || item.nameEn || item.name
                  : item.sceneTitleKo || item.name;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setLineIndex(idx);
                      setShowSceneIndexModal(false);
                    }}
                    className={cn(
                      'flex items-center gap-3 p-2 rounded-sm border text-left transition-colors cursor-pointer',
                      idx === lineIndex
                        ? 'bg-amber-950/60 border-amber-400 text-white'
                        : 'bg-stone-900/90 border-stone-800 text-stone-300 hover:bg-stone-800'
                    )}
                  >
                    <img
                      src={thumbUrl}
                      alt={itemTitle}
                      className="w-20 aspect-video object-cover rounded-none border border-stone-700 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-amber-300 truncate">{itemTitle}</p>
                      <p className="mt-1 text-[11px] text-stone-300 line-clamp-2">{item.text}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── 5. 하단 액션 & 그림책 네비게이션 컨트롤 바 ─── */}
        <div className="shrink-0 flex flex-wrap items-center justify-between gap-2 border-t border-stone-800 bg-[#1c191e] p-2.5 sm:px-4">
          <div className="flex items-center gap-1.5 flex-wrap">
            {onToggleAutoMode && (
              <button
                type="button"
                onClick={onToggleAutoMode}
                className={cn(
                  'min-h-[44px] rounded-sm px-3 py-2 text-xs font-mono font-bold transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 border',
                  autoMode
                    ? 'bg-indigo-600/90 border-indigo-400 text-white'
                    : 'bg-stone-900 border-stone-700 text-stone-300 hover:bg-stone-800'
                )}
              >
                {autoMode ? (
                  <Bot size={14} className="animate-spin text-cyan-200" />
                ) : (
                  <Pause size={14} />
                )}
                <span>
                  {autoMode
                    ? t('kadan_rpg_auto_on', language)
                    : t('kadan_rpg_auto_off', language)}
                </span>
              </button>
            )}

            {autoMode && (
              <button
                type="button"
                onClick={() =>
                  setAutoSpeedMode((prev) =>
                    prev === 'normal' ? 'slow' : prev === 'slow' ? 'fast' : 'normal'
                  )
                }
                className="min-h-[44px] rounded-sm px-2.5 py-2 text-[11px] font-mono font-bold border border-stone-700 bg-stone-900 text-amber-300 hover:bg-stone-800 cursor-pointer"
                title={language === 'ko' ? '자동 책장 넘김 속도 변경' : 'Change Auto-Turn Speed'}
              >
                {autoSpeedMode === 'slow'
                  ? language === 'ko'
                    ? '🐢 정독(4.8s)'
                    : '🐢 Slow'
                  : autoSpeedMode === 'fast'
                  ? language === 'ko'
                    ? '⚡ 고속(1.2s)'
                    : '⚡ Fast'
                  : language === 'ko'
                  ? '📖 보통(2.6s)'
                  : '📖 Normal'}
              </button>
            )}

            {!isFinalLine && (
              <button
                type="button"
                onClick={handleSkipToFinal}
                className="min-h-[44px] rounded-sm px-3 py-2 text-xs font-mono font-bold border border-stone-700 bg-stone-900 hover:bg-stone-800 text-stone-300 transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                title={language === 'ko' ? '마지막 장면으로 이동' : 'Skip to Final Scene'}
              >
                <FastForward size={14} className="text-amber-400" />
                <span>{language === 'ko' ? '끝 장면으로' : 'To End'}</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {onNavigate && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigate('home');
                }}
                className="min-h-[44px] rounded-sm border border-stone-700 bg-stone-900 hover:bg-stone-800 px-3 py-2 text-xs font-mono font-bold text-stone-300 transition-all hover:text-white active:scale-95 cursor-pointer hidden sm:flex items-center gap-1.5"
              >
                <Home size={14} className="text-indigo-400" />
                <span>{language === 'ko' ? '로비' : 'Home'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={retreatConversation}
              disabled={lineIndex === 0}
              className={cn(
                'min-h-[44px] rounded-sm border px-3 py-2 text-xs font-mono font-bold transition-all flex items-center gap-1',
                lineIndex === 0
                  ? 'border-stone-800 bg-stone-950 text-stone-600 cursor-not-allowed'
                  : 'border-stone-700 bg-stone-900 text-stone-200 hover:bg-stone-800 active:scale-95 cursor-pointer'
              )}
            >
              <ArrowLeft size={14} />
              <span>{language === 'ko' ? '이전' : 'Prev'}</span>
            </button>

            <button
              type="button"
              onClick={advanceConversation}
              className={cn(
                'min-h-[44px] rounded-sm px-4 sm:px-5 py-2 text-xs font-mono font-black text-white shadow-none transition-all active:scale-95 cursor-pointer flex items-center gap-1.5',
                hasActiveChoices
                  ? 'bg-amber-600 hover:bg-amber-500 text-stone-950'
                  : isFinalLine && canStartBattle
                  ? 'bg-rose-600 hover:bg-rose-500'
                  : isFinalLine && canClaimReward
                  ? 'bg-amber-500 hover:bg-amber-400 text-stone-950'
                  : event.isEnding
                  ? 'bg-violet-600 hover:bg-violet-500'
                  : 'bg-amber-500 hover:bg-amber-400 text-stone-950'
              )}
            >
              <span>{primaryLabel}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
