import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Bot, Box, CheckCircle2, FastForward, Home, MessageCircle, Pause, Sparkles, Swords, X } from 'lucide-react';
import { cn, getAssetUrl, getCardSpriteStyle } from '../../lib/utils';
import { t } from '../../lib/i18n';
import { CARD_DATABASE } from '../../cardDatabase';
import type { Language, ViewType } from '../../types';
import type { KadanRpgEvent } from '../../content/kadanRpgStory';
import { KADAN_RPG_NOVEL_SCRIPTS, type KadanRpgDialogueChoice, type KadanRpgNovelScriptLine } from '../../content/kadanRpgNovelScript';

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
    if (novelScript) {
      return novelScript.map((line) => ({
        speaker: line.speaker,
        cardId: line.cardId ?? event.speakerCardId,
        name: isEn ? (line.nameEn || line.name) : line.name,
        nameEn: line.nameEn,
        text: isEn ? (line.textEn || line.text) : line.text,
        textEn: line.textEn,
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
  }, [event, fallbackSpeakerName, isEn, language, templateKey]);

  const [dynamicLines, setDynamicLines] = useState<ConversationLine[]>(baseLines);
  const [selectedChoiceIds, setSelectedChoiceIds] = useState<Record<number, string>>({});
  const [choiceTimeLeftMs, setChoiceTimeLeftMs] = useState<number>(0);
  const [choiceTotalDurationMs, setChoiceTotalDurationMs] = useState<number>(5000);

  useEffect(() => {
    setDynamicLines(baseLines);
    setLineIndex(0);
    setSelectedChoiceIds({});
    setChoiceTimeLeftMs(0);
  }, [baseLines, event.id]);

  const conversationLines = dynamicLines;
  const currentLine = conversationLines[lineIndex] ?? conversationLines[0];
  const isFinalLine = lineIndex >= conversationLines.length - 1;
  const isKadan = currentLine?.speaker === 'kadan' || currentLine?.cardId === 41;

  const currentChoices = currentLine?.choices;
  const hasActiveChoices = Boolean(
    (currentChoices && currentChoices.length > 0) || currentLine?.speaker === 'choice'
  ) && Boolean(currentChoices && currentChoices.length > 0 && !selectedChoiceIds[lineIndex]);

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

  const handleSelectChoice = useCallback((choice: KadanRpgDialogueChoice) => {
    setSelectedChoiceIds((prev) => ({ ...prev, [lineIndex]: choice.id }));
    setChoiceTimeLeftMs(0);

    // 1. SNS reward callback
    const snsAmount = choice.bonusType === 'sns' ? choice.bonusValue : (choice.reward?.snsCoins || 0);
    if (snsAmount > 0) {
      const reason = isEn
        ? `[RPG Ch.${event.chapterNumber}] Choice Bonus`
        : `[RPG Ch.${event.chapterNumber}] 선택 보너스`;
      onRewardSns?.(snsAmount, reason);
    }

    // 2. Combat buff callback & storage
    if (choice.bonusType === 'buff' || choice.reward?.buff) {
      const buffId = choice.reward?.buff || (choice.bonusType === 'buff' ? 'atk_boost' : 'dialogue_buff');
      const buffName = isEn
        ? (choice.bonusDescEn || choice.reward?.buffNameEn || 'Combat Buff')
        : (choice.bonusDescKo || choice.reward?.buffName || '전투 버프');
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
      ? (choice.followUpTextEn || choice.followUpLineEn || choice.followUpTextKo || choice.followUpLine || '')
      : (choice.followUpTextKo || choice.followUpLine || choice.followUpTextEn || choice.followUpLineEn || '');

    if (followUpText) {
      const followUpLineObj: ConversationLine = {
        speaker: 'kadan',
        cardId: currentLine?.cardId ?? 41,
        name: isEn ? (currentLine?.nameEn || currentLine?.name || 'Kadan') : (currentLine?.name || '카단'),
        text: followUpText,
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
  }, [
    conversationLines.length,
    currentLine?.cardId,
    currentLine?.name,
    currentLine?.nameEn,
    event.chapterNumber,
    finishConversation,
    isEn,
    lineIndex,
    onApplyBuff,
    onRewardSns,
  ]);

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
  }, [conversationLines.length, currentChoices, finishConversation, handleSelectChoice, hasActiveChoices, lineIndex]);

  const handleSkipToFinal = useCallback(() => {
    if (hasActiveChoices && currentChoices && currentChoices.length > 0) {
      const defaultChoice = currentChoices.find((c) => c.isDefault) ?? currentChoices[0];
      handleSelectChoice(defaultChoice);
    }
    setLineIndex(conversationLines.length - 1);
  }, [conversationLines.length, currentChoices, handleSelectChoice, hasActiveChoices]);

  // Choice countdown timer: 5.0s manual / 1.5s auto
  useEffect(() => {
    if (!hasActiveChoices || !currentChoices || currentChoices.length === 0) {
      setChoiceTimeLeftMs(0);
      return;
    }

    const duration = autoMode ? 1500 : 5000;
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
    const timer = window.setTimeout(advanceConversation, lineIndex < conversationLines.length - 1 ? 1800 : 2300);
    return () => window.clearTimeout(timer);
  }, [advanceConversation, autoMode, conversationLines.length, hasActiveChoices, lineIndex]);

  const primaryLabel = hasActiveChoices
    ? (language === 'ko' ? '기본 선택으로 진행' : 'Select Default & Continue')
    : isFinalLine
    ? canStartBattle
      ? t('kadan_rpg_start_battle', language)
      : canClaimReward
      ? t('kadan_rpg_claim_reward', language)
      : event.isEnding
      ? t('kadan_rpg_finish_ending', language)
      : t('kadan_rpg_continue', language)
    : t('kadan_rpg_continue', language);

  return (
    <div
      className="fixed inset-0 z-[10010] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label={t(event.chapterTitleKey, language) || 'Dialogue'}
    >
      {/* ─── 대사 텍스트 박스 (중앙 팝업 모달) ─── */}
      <div className="relative z-20 w-full max-w-2xl sm:max-w-3xl overflow-hidden rounded-none border-2 border-slate-900/90 bg-slate-950/95 text-white shadow-none backdrop-blur-md">
        {/* 상단 오버레이 헤더 (화자 뱃지 & 에피소드 태그 & 환생 뱃지) */}
        <div className="flex items-center justify-between border-b border-slate-800/80 bg-slate-900/80 px-4 py-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 rounded-sm bg-indigo-600 px-3 py-1 text-xs font-mono font-bold uppercase tracking-wider text-white">
              <Icon size={14} />
              {currentLine.name}
            </span>
            <span className="rounded-sm border border-slate-700 bg-slate-800/90 px-2.5 py-1 text-xs font-mono font-bold text-indigo-300">
              {t(event.chapterTitleKey, language)}
            </span>
            {/* Reincarnation Badge */}
            <span className={cn(
              "inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-xs sm:text-sm font-bold font-mono tracking-tight border select-none",
              rebirthLevel > 0
                ? "bg-amber-950/90 text-amber-300 border-amber-500/80"
                : "bg-slate-800/90 text-emerald-300 border-slate-700"
            )}>
              <span className="text-sm sm:text-base">{rebirthLevel > 0 ? '👑' : '🌱'}</span>
              <span className="text-xs sm:text-sm font-bold font-mono">
                {rebirthLevel > 0 ? (
                  <>
                    <span>{language === 'ko' ? '환생 ' : 'Rebirth Lv.'}</span>
                    <span className="text-sm sm:text-base font-bold text-amber-100">{rebirthLevel}</span>
                    <span>{language === 'ko' ? '회차' : ''}</span>
                  </>
                ) : (
                  t('kadan_rpg_first_journey_badge', language)
                )}
              </span>
            </span>
            {isCompleted && (
              <span className="inline-flex items-center gap-1 rounded-sm bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 text-xs font-mono font-bold text-emerald-400">
                <CheckCircle2 size={13} />
                {t('kadan_rpg_completed', language)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-slate-400 font-bold tracking-widest uppercase hidden sm:inline-block">
              [STORY DIALOGUE]
            </span>
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center p-1.5 rounded-sm hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              aria-label={t('kadan_rpg_close', language) || 'Close'}
              title={t('kadan_rpg_close', language) || 'Close'}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* 대사 본문 & 팝업 내부 캐릭터 포트레이트 */}
        <div className="p-3.5 sm:p-5">
          <div
            className={cn(
              "flex items-center gap-3 sm:gap-4.5",
              isKadan ? "flex-row" : "flex-row-reverse"
            )}
          >
            {/* ─── 팝업 내부 캐릭터 정중앙 포트레이트 프레임 ─── */}
            <div
              key={`standing-portrait-${currentLine.cardId}-${lineIndex}`}
              className={cn(
                "relative shrink-0 w-24 sm:w-32 md:w-36 h-28 sm:h-38 md:h-42 rounded-none overflow-hidden border-2 border-slate-700/80 bg-[#201d1d] shadow-none flex items-center justify-center select-none transition-all duration-300 transform animate-in fade-in scale-95"
              )}
            >
              {/* 캐릭터 이미지 (정중앙 정렬) */}
              <div className="w-full h-full p-1.5 flex items-center justify-center overflow-hidden">
                <div
                  className="w-full h-full rounded-none transition-transform duration-300 filter brightness-105 contrast-105 bg-center bg-no-repeat"
                  style={getCharacterPortraitStyle(currentLine.cardId)}
                />
              </div>
            </div>

            {/* ─── 대사 텍스트 및 진행도 게이지 ─── */}
            <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch">
              <p className="min-h-[3.5rem] whitespace-pre-line break-words font-mono text-xs sm:text-base font-semibold leading-relaxed text-slate-100">
                {currentLine.text}
              </p>

              <div>
                {/* 프로그레스 인디케이터 게이지 */}
                <div className="mt-3 flex gap-1.5">
                  {conversationLines.map((line, index) => (
                    <span
                      key={`${line.speaker}-${index}`}
                      className={cn(
                        'h-1 flex-1 rounded-none transition-all duration-200',
                        index <= lineIndex ? 'bg-indigo-400' : 'bg-slate-800'
                      )}
                    />
                  ))}
                </div>

                <div className="mt-2.5 flex flex-col gap-1.5 border-t border-slate-800/60 pt-2 text-[11px] font-bold text-slate-400 sm:flex-row sm:items-center sm:justify-between">
                  <span className="leading-snug break-words font-mono text-slate-300">
                    {autoMode ? (language === 'ko' ? '⚡️ 자동 진행 중 (클릭 시 수동 전환)' : '⚡️ Auto progression is running...') : t(event.objectiveKey, language)}
                  </span>
                  <div className="flex items-center gap-1.5 self-start sm:self-auto font-mono text-[11px] text-indigo-300 shrink-0">
                    <span className="text-slate-400 font-mono">{language === 'ko' ? '진행 단계' : 'Stage'}</span>
                    <span className="rounded-sm bg-indigo-950/80 px-2 py-0.5 border border-indigo-700/50 text-indigo-200">
                      {lineIndex + 1} / {conversationLines.length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ─── 인터랙티브 선택지 및 카운트다운 타이머 섹션 ─── */}
          {hasActiveChoices && currentChoices && currentChoices.length > 0 && (
            <div className="mt-4 pt-3.5 border-t border-slate-800/80">
              {/* 타이머 바 */}
              <div className="w-full mb-3">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1">
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block w-2 h-2 rounded-none bg-amber-400" />
                    <span className="font-bold text-amber-300">
                      {language === 'ko' ? '운명의 선택 (결단 카운트다운)' : 'Fate Decision (Countdown)'}
                    </span>
                    {autoMode && (
                      <span className="text-[10px] text-cyan-300 bg-cyan-950/80 px-1.5 py-0.5 border border-cyan-800 rounded-sm">
                        {language === 'ko' ? '자동 선택 (1.5초)' : 'Auto-Pick (1.5s)'}
                      </span>
                    )}
                  </span>
                  <span className="font-mono font-bold text-amber-200">
                    {(choiceTimeLeftMs / 1000).toFixed(1)}s
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-900 border border-slate-700/80 rounded-none overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-none transition-all duration-75 ease-linear"
                    style={{
                      width: `${Math.max(0, Math.min(100, (choiceTimeLeftMs / choiceTotalDurationMs) * 100))}%`
                    }}
                  />
                </div>
              </div>

              {/* 선택지 버튼 목록 */}
              <div className="flex flex-col gap-2">
                {currentChoices.map((choice) => (
                  <button
                    key={choice.id}
                    type="button"
                    onClick={() => handleSelectChoice(choice)}
                    className={cn(
                      "w-full min-h-[44px] p-2.5 sm:p-3 text-left font-mono rounded-sm border transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2 cursor-pointer",
                      choice.isDefault
                        ? "bg-slate-900/90 hover:bg-slate-800 border-amber-500/80 text-white"
                        : "bg-slate-950/80 hover:bg-slate-800/80 border-slate-700/80 text-slate-200"
                    )}
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn(
                        "px-2 py-0.5 text-[11px] font-mono font-bold rounded-sm border uppercase tracking-wider shrink-0",
                        choice.attitude === '[결의/돌파]'
                          ? "text-amber-300 border-amber-600/80 bg-amber-950/40"
                          : choice.attitude === '[신중/통찰]'
                          ? "text-cyan-300 border-cyan-600/80 bg-cyan-950/40"
                          : "text-violet-300 border-violet-600/80 bg-violet-950/40"
                      )}>
                        {isEn ? (choice.attitudeEn || choice.badgeEn || choice.attitude || choice.badge) : (choice.attitude || choice.badge)}
                      </span>
                      <span className="text-xs sm:text-sm font-semibold leading-snug">
                        {isEn ? (choice.labelEn || choice.textEn || choice.labelKo || choice.text) : (choice.labelKo || choice.text || choice.labelEn)}
                      </span>
                      {choice.isDefault && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-sm border border-amber-500/60 bg-amber-950/60 text-amber-300 shrink-0">
                          {isEn ? 'DEFAULT' : '기본 선택'}
                        </span>
                      )}
                    </div>
                    {(choice.bonusDescKo || choice.bonusDescEn || choice.reward) && (
                      <span className="text-[11px] font-mono font-bold text-emerald-400 shrink-0 self-start sm:self-center">
                        {isEn ? (choice.bonusDescEn || choice.bonusDescKo) : (choice.bonusDescKo || choice.bonusDescEn)}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 액션 버튼 바 */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/80 bg-slate-900/60 p-3">
          <div className="flex items-center gap-2">
            {onToggleAutoMode && (
              <button
                type="button"
                onClick={onToggleAutoMode}
                className={cn(
                  "min-h-[44px] rounded-sm px-3 py-2 text-xs font-mono font-bold transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 border",
                  autoMode
                    ? "bg-indigo-600/90 border-indigo-500 text-white"
                    : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                )}
                title={autoMode ? (language === 'ko' ? '자동 진행 끄기' : 'Turn Off Auto') : (language === 'ko' ? '자동 진행 켜기' : 'Turn On Auto')}
              >
                {autoMode ? <Bot size={14} className="animate-spin text-cyan-200" /> : <Pause size={14} />}
                <span>{autoMode ? t('kadan_rpg_auto_on', language) : t('kadan_rpg_auto_off', language)}</span>
              </button>
            )}

            {!isFinalLine && (
              <button
                type="button"
                onClick={handleSkipToFinal}
                className="min-h-[44px] rounded-sm px-3 py-2 text-xs font-mono font-bold border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                title={language === 'ko' ? '대화 스킵' : 'Skip Dialog'}
              >
                <FastForward size={14} className="text-amber-400" />
                <span>{language === 'ko' ? '스킵' : 'Skip'}</span>
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
                className="min-h-[44px] rounded-sm border border-slate-700 bg-slate-800/80 hover:bg-slate-700 px-3 py-2 text-xs font-mono font-bold text-slate-300 transition-all hover:text-white active:scale-95 cursor-pointer flex items-center gap-1.5"
                title={language === 'ko' ? '로비(홈)로 나가기' : 'Exit to Home'}
              >
                <Home size={14} className="text-indigo-400" />
                <span>{language === 'ko' ? '로비로 나가기' : 'Exit to Home'}</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] rounded-sm border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-mono font-bold text-slate-300 transition-all hover:bg-slate-700 active:scale-95 cursor-pointer flex items-center gap-1"
            >
              <span>{t('kadan_rpg_close', language)}</span>
            </button>
            <button
              type="button"
              onClick={advanceConversation}
              className={cn(
                'min-h-[44px] rounded-sm px-5 py-2 text-xs font-mono font-bold text-white shadow-none transition-all active:scale-95 cursor-pointer flex items-center gap-1.5',
                hasActiveChoices
                  ? 'bg-amber-600 hover:bg-amber-500'
                  : isFinalLine && canStartBattle
                  ? 'bg-rose-600 hover:bg-rose-500'
                  : isFinalLine && canClaimReward
                  ? 'bg-amber-500 hover:bg-amber-400'
                  : event.isEnding
                  ? 'bg-violet-600 hover:bg-violet-500'
                  : 'bg-indigo-600 hover:bg-indigo-500',
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
