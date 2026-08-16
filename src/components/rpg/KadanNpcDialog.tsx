import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Bot, Box, CheckCircle2, MessageCircle, Pause, Sparkles, Swords } from 'lucide-react';
import { cn, getAssetUrl, getCardSpriteStyle } from '../../lib/utils';
import { t } from '../../lib/i18n';
import { CARD_DATABASE } from '../../cardDatabase';
import type { Language } from '../../types';
import type { KadanRpgEvent } from '../../content/kadanRpgStory';
import { KADAN_RPG_NOVEL_SCRIPTS } from '../../content/kadanRpgNovelScript';

interface KadanNpcDialogProps {
  event: KadanRpgEvent;
  language: Language;
  isCompleted: boolean;
  autoMode: boolean;
  canStartBattle: boolean;
  canClaimReward: boolean;
  onStartBattle: () => void;
  onClaimReward: () => void;
  onComplete: () => void;
  onClose: () => void;
  onToggleAutoMode?: () => void;
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
  onStartBattle,
  onClaimReward,
  onComplete,
  onClose,
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
  const conversationLines = useMemo(() => {
    const novelScript = language === 'ko' ? KADAN_RPG_NOVEL_SCRIPTS[event.chapterNumber] : undefined;
    if (novelScript) {
      return novelScript.map((line) => ({
        speaker: line.speaker,
        cardId: line.cardId ?? event.speakerCardId,
        name: line.name,
        text: line.text,
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
  }, [event, fallbackSpeakerName, language, templateKey]);

  useEffect(() => {
    setLineIndex(0);
  }, [event.id]);

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

  const advanceConversation = useCallback(() => {
    if (lineIndex < conversationLines.length - 1) {
      setLineIndex((current) => current + 1);
      return;
    }
    finishConversation();
  }, [conversationLines.length, finishConversation, lineIndex]);

  useEffect(() => {
    if (!autoMode) return;
    const timer = window.setTimeout(advanceConversation, lineIndex < conversationLines.length - 1 ? 1800 : 2300);
    return () => window.clearTimeout(timer);
  }, [advanceConversation, autoMode, conversationLines.length, lineIndex]);

  const currentLine = conversationLines[lineIndex] ?? conversationLines[0];
  const isFinalLine = lineIndex >= conversationLines.length - 1;
  const isKadan = currentLine.speaker === 'kadan' || currentLine.cardId === 41;

  const primaryLabel = isFinalLine
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
      <div className="relative z-20 w-full max-w-2xl sm:max-w-3xl overflow-hidden rounded-xl border-2 border-slate-900/90 bg-slate-950/95 text-white shadow-2xl backdrop-blur-md">
        {/* 상단 오버레이 헤더 (화자 뱃지 & 에피소드 태그) */}
        <div className="flex items-center justify-between border-b border-slate-800/80 bg-slate-900/80 px-4 py-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1 text-xs font-black uppercase tracking-wider text-white shadow-sm">
              <Icon size={14} />
              {currentLine.name}
            </span>
            <span className="rounded-md border border-slate-700 bg-slate-800/90 px-2.5 py-1 text-xs font-bold text-indigo-300">
              {t(event.chapterTitleKey, language)}
            </span>
            {isCompleted && (
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 text-xs font-bold text-emerald-400">
                <CheckCircle2 size={13} />
                {t('kadan_rpg_completed', language)}
              </span>
            )}
          </div>
          <span className="text-[10px] font-mono text-slate-400 font-bold tracking-widest uppercase hidden sm:inline-block">
            [STORY DIALOGUE]
          </span>
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
                "relative shrink-0 w-24 sm:w-32 md:w-36 h-28 sm:h-38 md:h-42 rounded-xl overflow-hidden border-2 border-slate-700/80 bg-gradient-to-b from-slate-900 to-slate-950 shadow-xl flex items-center justify-center select-none transition-all duration-300 transform animate-in fade-in scale-95"
              )}
            >
              {/* 캐릭터 배경 후광 (Glow Ring & Aura) */}
              <div
                className="absolute inset-0 rounded-full blur-2xl opacity-65 scale-150 -z-10 pointer-events-none"
                style={{
                  background: isKadan
                    ? 'radial-gradient(circle, rgba(99,102,241,0.7) 0%, rgba(168,85,247,0.3) 60%, transparent 80%)'
                    : 'radial-gradient(circle, rgba(244,63,94,0.7) 0%, rgba(251,146,60,0.3) 60%, transparent 80%)'
                }}
              />

              {/* 캐릭터 이미지 (정중앙 정렬) */}
              <div className="w-full h-full p-1.5 flex items-center justify-center overflow-hidden">
                <div
                  className="w-full h-full rounded-lg transition-transform duration-300 drop-shadow-[0_6px_16px_rgba(0,0,0,0.8)] filter brightness-105 contrast-105 bg-center bg-no-repeat"
                  style={getCharacterPortraitStyle(currentLine.cardId)}
                />
              </div>
            </div>

            {/* ─── 대사 텍스트 및 진행도 게이지 ─── */}
            <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch">
              <p className="min-h-[3.5rem] whitespace-pre-line break-words font-mono text-xs sm:text-base font-semibold leading-relaxed text-slate-100 drop-shadow-sm">
                {currentLine.text}
              </p>

              <div>
                {/* 프로그레스 인디케이터 게이지 */}
                <div className="mt-3 flex gap-1.5">
                  {conversationLines.map((line, index) => (
                    <span
                      key={`${line.speaker}-${index}`}
                      className={cn(
                        'h-1.5 flex-1 rounded-full transition-all duration-300',
                        index <= lineIndex ? 'bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]' : 'bg-slate-800'
                      )}
                    />
                  ))}
                </div>

                <div className="mt-2.5 flex flex-col gap-1.5 border-t border-slate-800/60 pt-2 text-[11px] font-bold text-slate-400 sm:flex-row sm:items-center sm:justify-between">
                  <span className="leading-snug break-words text-slate-300">
                    {autoMode ? (language === 'ko' ? '⚡️ 자동 진행 중 (클릭 시 수동 전환)' : '⚡️ Auto progression is running...') : t(event.objectiveKey, language)}
                  </span>
                  <div className="flex items-center gap-1.5 self-start sm:self-auto font-mono text-[11px] text-indigo-300 shrink-0">
                    <span className="text-slate-400 font-sans">{language === 'ko' ? '진행 단계' : 'Stage'}</span>
                    <span className="rounded bg-indigo-950/80 px-2 py-0.5 border border-indigo-700/50 text-indigo-200">
                      {lineIndex + 1} / {conversationLines.length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 액션 버튼 바 */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/80 bg-slate-900/60 p-3">
          {onToggleAutoMode ? (
            <button
              type="button"
              onClick={onToggleAutoMode}
              className={cn(
                "min-h-10 rounded-lg px-3 py-2 text-xs font-bold transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 border",
                autoMode
                  ? "bg-indigo-600/90 border-indigo-500 text-white shadow-sm"
                  : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
              )}
            >
              {autoMode ? <Bot size={14} className="animate-spin text-cyan-200" /> : <Pause size={14} />}
              <span>{autoMode ? t('kadan_rpg_auto_on', language) : t('kadan_rpg_auto_off', language)}</span>
            </button>
          ) : <div />}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="min-h-10 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-bold text-slate-300 transition-all hover:bg-slate-700 active:scale-95 cursor-pointer"
            >
              {t('kadan_rpg_close', language)}
            </button>
            <button
              type="button"
              onClick={advanceConversation}
              className={cn(
                'min-h-10 rounded-lg px-5 py-2 text-xs font-bold text-white shadow-lg transition-all active:scale-95 cursor-pointer flex items-center gap-1.5',
                isFinalLine && canStartBattle
                  ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30'
                  : isFinalLine && canClaimReward
                    ? 'bg-amber-500 hover:bg-amber-400 shadow-amber-500/30'
                    : event.isEnding
                      ? 'bg-violet-600 hover:bg-violet-500 shadow-violet-600/30'
                      : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30',
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
