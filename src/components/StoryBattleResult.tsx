import React, { useState, useCallback, useEffect } from 'react';
import { Trophy, Frown, Gift, Check, ChevronRight, BookOpen } from 'lucide-react';
import { t } from '../lib/i18n';
import { cn } from '../lib/utils';
import type { Language } from '../types';
import { useGameSettings } from '../contexts/GameSettingsContext';

export interface StoryBattleResultProps {
  result: 'win' | 'loss' | 'draw';
  language: Language;
  battleCompleted: boolean;
  rewardClaimed: boolean;
  storyProgressCount: number;
  totalStoryEpisodes: number;
  onClaimReward?: () => void;
  showRewardAction?: boolean;
  episodeTitle?: string;
  onNavigateWebtoon?: () => void;
  className?: string;
}

/**
 * 전투 종료 후 승리/패배/무승부 결과에 따라
 * 관련 스토리 진행, 보상, 다음 행동을 짧게 안내하는 컴포넌트.
 */
export const StoryBattleResult: React.FC<StoryBattleResultProps> = ({
  result,
  language,
  battleCompleted,
  rewardClaimed: initialRewardClaimed,
  storyProgressCount,
  totalStoryEpisodes,
  onClaimReward,
  showRewardAction = true,
  episodeTitle,
  onNavigateWebtoon,
  className,
}) => {
  const { lowSpecMode } = useGameSettings();
  const [rewardClaimedLocal, setRewardClaimedLocal] = useState(initialRewardClaimed);
  const [showRewardToast, setShowRewardToast] = useState(false);

  useEffect(() => {
    setRewardClaimedLocal(initialRewardClaimed);
  }, [initialRewardClaimed]);

  // ID 84: Auto-trigger Webtoon Episode Modal upon clearing chapter final episode stage
  useEffect(() => {
    if (result === 'win' && onNavigateWebtoon && storyProgressCount > 0) {
      const timer = setTimeout(() => {
        onNavigateWebtoon();
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [result, onNavigateWebtoon, storyProgressCount]);

  const handleClaimReward = useCallback(() => {
    if (rewardClaimedLocal || !onClaimReward) return;
    onClaimReward();
    setRewardClaimedLocal(true);
    setShowRewardToast(true);
    window.setTimeout(() => setShowRewardToast(false), 3000);
  }, [rewardClaimedLocal, onClaimReward]);

  const isVictory = result === 'win';
  const ResultIcon = isVictory ? Trophy : Frown;
  const resultColor = isVictory ? 'from-amber-400 to-yellow-500' : 'from-slate-400 to-slate-500';
  const resultBg = isVictory ? 'bg-amber-50/60 border-amber-200/80' : 'bg-slate-50/60 border-slate-200/80';
  const resultTitle = isVictory
    ? t('story_battle_victory', language)
    : t('story_battle_defeat', language);

  return (
    <div className={cn('space-y-3', className)}>
      {/* 결과 헤더 */}
      <div
        className={cn(
          'relative overflow-hidden rounded-2xl border p-4 shadow-sm',
          resultBg,
          lowSpecMode && 'shadow-none',
        )}
      >
        {!lowSpecMode && (
          <div className={cn(
            'absolute -right-3 -top-3 h-16 w-16 rounded-full blur-xl',
            isVictory ? 'bg-amber-400/25' : 'bg-slate-300/20',
          )} />
        )}

        <div className="relative flex items-center gap-3">
          <div className={cn(
            'flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br shadow-sm',
            resultColor,
          )}>
            <ResultIcon size={18} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-black uppercase tracking-tight text-slate-800">
              {resultTitle}
            </p>
            {episodeTitle && (
              <p className="text-[10px] font-semibold text-slate-500 mt-0.5">
                {episodeTitle.startsWith('webtoon_ep_') ? t(episodeTitle, language) : episodeTitle}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 스토리 진행 안내 */}
      <div className="rounded-2xl border border-indigo-200/60 bg-indigo-50/40 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen size={14} className="text-indigo-600" />
            <span className="text-[10px] font-black uppercase tracking-[0.24em] text-indigo-600/70">
              {t('story_title', language)}
            </span>
          </div>
          <span className="rounded-full bg-indigo-200/40 px-2 py-0.5 text-[9px] font-bold text-indigo-700">
            {storyProgressCount}/{totalStoryEpisodes}
          </span>
        </div>

        {battleCompleted && (
          <div className="mt-2 flex items-center gap-1.5 text-[10px] font-semibold text-green-650">
            <Check size={11} className="text-green-550" />
            <span>{t('story_event_mission_complete', language)}</span>
          </div>
        )}

        {/* 보상 클레임 */}
        {isVictory && showRewardAction && (
          <div className="mt-3">
            {rewardClaimedLocal ? (
              <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 border border-slate-200 px-3 py-1.5 text-[9px] font-bold text-slate-500">
                <Check size={10} />
                {t('story_battle_already_claimed', language)}
              </div>
            ) : (
              <button
                type="button"
                onClick={handleClaimReward}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-gradient-to-r from-amber-400 to-yellow-500 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.24em] text-amber-950 shadow-sm transition-all hover:from-amber-300 hover:to-yellow-400 active:scale-95',
                  lowSpecMode && 'from-amber-400 to-yellow-500',
                )}
              >
                <Gift size={10} />
                {t('story_event_reward_ready', language)}
                <ChevronRight size={10} />
              </button>
            )}
          </div>
        )}

        {/* 웹툰 바로가기 */}
        {onNavigateWebtoon && (
          <button
            type="button"
            onClick={onNavigateWebtoon}
            className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-indigo-300 bg-indigo-500 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.24em] text-white shadow-sm transition-all hover:bg-indigo-600 active:scale-95"
          >
            <BookOpen size={10} />
            {t('story_card_webtoon_cta', language)}
            <ChevronRight size={10} />
          </button>
        )}
      </div>

      {/* 보상 토스트 */}
      {showRewardToast && (
        <div className={cn(
          'rounded-full bg-emerald-600 px-4 py-2 text-center text-[10px] font-black text-white shadow-lg',
          lowSpecMode ? '' : 'animate-in fade-in slide-in-from-top-2',
        )}>
          <Gift size={12} className="inline mr-1 -mt-0.5" />
          {t('story_battle_reward', language)}
        </div>
      )}
    </div>
  );
};
