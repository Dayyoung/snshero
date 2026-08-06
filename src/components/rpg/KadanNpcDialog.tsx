import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, CheckCircle2, MessageCircle, Sparkles, Swords } from 'lucide-react';
import { cn, getAssetUrl } from '../../lib/utils';
import { t } from '../../lib/i18n';
import { CARD_DATABASE } from '../../cardDatabase';
import type { Language } from '../../types';
import type { KadanRpgEvent } from '../../content/kadanRpgStory';
import { KADAN_RPG_NOVEL_SCRIPTS } from '../../content/kadanRpgNovelScript';
import { getCharacterAssetManifestEntry } from '../../content/characterAssetManifest';

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
}

const iconByType = {
  npc: MessageCircle,
  enemy: Swords,
  chest: Box,
  portal: Sparkles,
  story: Sparkles,
};

const getCharacterPortraitUrl = (cardId?: number): string => {
  const safeId = cardId && CARD_DATABASE[cardId] ? cardId : 41;
  const manifest = getCharacterAssetManifestEntry(safeId);
  if (manifest?.targetAssetPath) {
    return manifest.targetAssetPath;
  }
  const paddedId = String(safeId).padStart(3, '0');
  return getAssetUrl(`/character/${paddedId}.png`);
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
    <div className="absolute inset-x-3 bottom-3 z-30 mx-auto max-w-3xl">
      {/* ─── 텍스트 박스 상단 전신 캐릭터 일러스트 (Visual Novel Full-Body Stand Portrait) ─── */}
      <div
        key={`standing-portrait-${currentLine.cardId}-${lineIndex}`}
        className={cn(
          "absolute bottom-[calc(100%-12px)] pointer-events-none flex items-end select-none z-10 transition-all duration-300 transform animate-in fade-in slide-in-from-bottom-4",
          isKadan ? "left-4 sm:left-10 origin-bottom-left" : "right-4 sm:right-10 origin-bottom-right"
        )}
      >
        {/* 캐릭터 배경 판타지 후광 (Glow Ring & Aura) */}
        <div
          className="absolute inset-0 rounded-full blur-2xl opacity-60 scale-110 -z-10"
          style={{
            background: isKadan
              ? 'radial-gradient(circle, rgba(99,102,241,0.5) 0%, rgba(168,85,247,0.2) 60%, transparent 80%)'
              : 'radial-gradient(circle, rgba(244,63,94,0.5) 0%, rgba(251,146,60,0.2) 60%, transparent 80%)'
          }}
        />

        {/* 캐릭터 전신 수묵/사이버 그리드 그림자 패드 */}
        <div className="absolute bottom-0 inset-x-0 h-12 bg-gradient-to-t from-slate-950/80 to-transparent blur-md -z-10" />

        <img
          src={getCharacterPortraitUrl(currentLine.cardId)}
          alt={currentLine.name}
          className="h-56 sm:h-72 md:h-84 w-auto max-w-[220px] sm:max-w-[320px] object-contain drop-shadow-[0_16px_28px_rgba(0,0,0,0.6)] filter brightness-105 contrast-105"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            if (!target.dataset.failedOnce) {
              target.dataset.failedOnce = 'true';
              target.src = getAssetUrl('/character/041.png');
            }
          }}
        />
      </div>

      {/* ─── 대사 텍스트 박스 ─── */}
      <div className="relative z-20 overflow-hidden rounded-xl border-2 border-slate-900/90 bg-slate-950/95 text-white shadow-2xl backdrop-blur-md">
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

        {/* 대사 본문 */}
        <div className="p-4 sm:p-5">
          <p className="min-h-[3.5rem] whitespace-pre-line break-words font-mono text-sm sm:text-base font-semibold leading-relaxed text-slate-100 drop-shadow-sm">
            {currentLine.text}
          </p>

          {/* 프로그레스 인디케이터 게이지 */}
          <div className="mt-4 flex gap-1.5">
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

          <div className="mt-2.5 flex items-center justify-between text-xs font-bold text-slate-400">
            <span>
              {autoMode ? t('kadan_rpg_auto_dialog_hint', language) : t(event.objectiveKey, language)}
            </span>
            <span className="font-mono text-[11px] text-indigo-300">
              {lineIndex + 1} / {conversationLines.length}
            </span>
          </div>
        </div>

        {/* 액션 버튼 바 */}
        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-800/80 bg-slate-900/60 p-3">
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
  );
};
