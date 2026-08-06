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
    <div className="absolute inset-x-3 bottom-3 z-30 mx-auto max-w-3xl rounded-lg border border-slate-200 bg-white shadow-2xl">
      <div className="p-4">
        <div className="flex shrink-0 items-center gap-3">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100 shadow-inner">
            <img
              src={getCharacterPortraitUrl(currentLine.cardId)}
              alt={currentLine.name}
              className="h-full w-full object-cover object-top"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (!target.dataset.failedOnce) {
                  target.dataset.failedOnce = 'true';
                  target.src = getAssetUrl('/character/041.png');
                }
              }}
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-lg bg-slate-950 px-2.5 py-1 text-xs font-bold text-white">
                <Icon size={14} />
                {currentLine.name}
              </span>
              <span className="rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700">
                {t(event.chapterTitleKey, language)}
              </span>
              {isCompleted && (
                <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                  <CheckCircle2 size={14} />
                  {t('kadan_rpg_completed', language)}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="mt-3 min-w-0">
          <p className="whitespace-pre-line break-words text-sm font-semibold leading-6 text-slate-700">
            {currentLine.text}
          </p>
          <div className="mt-3 flex gap-1.5">
            {conversationLines.map((line, index) => (
              <span
                key={`${line.speaker}-${index}`}
                className={cn('h-1.5 flex-1 rounded-full', index <= lineIndex ? 'bg-indigo-500' : 'bg-slate-200')}
              />
            ))}
          </div>
          <p className="mt-2 text-xs font-bold text-slate-500">
            {autoMode ? t('kadan_rpg_auto_dialog_hint', language) : t(event.objectiveKey, language)}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 p-3">
        <button
          type="button"
          onClick={onClose}
          className="min-h-11 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-700 transition-all active:scale-95"
        >
          {t('kadan_rpg_close', language)}
        </button>
        <button
          type="button"
          onClick={advanceConversation}
          className={cn(
            'min-h-11 rounded-lg px-4 py-2 text-sm font-bold text-white shadow-md transition-all active:scale-95',
            isFinalLine && canStartBattle
              ? 'bg-rose-600 shadow-rose-600/10'
              : isFinalLine && canClaimReward
                ? 'bg-amber-500 shadow-amber-500/10'
                : event.isEnding
                  ? 'bg-violet-600 shadow-violet-600/10'
                  : 'bg-indigo-600 shadow-indigo-600/10',
          )}
        >
          {primaryLabel}
        </button>
      </div>
    </div>
  );
};
