import React from 'react';
import { BookOpen, Swords, Sparkles } from 'lucide-react';
import { t } from '../lib/i18n';
import { cn } from '../lib/utils';
import type { Language } from '../types';
import { useGameSettings } from '../contexts/GameSettingsContext';

export interface StoryBattleBannerProps {
  /** 캐릭터1 이름 (현재 언어) */
  character1Name?: string;
  /** 캐릭터2 이름 (현재 언어) */
  character2Name?: string;
  /** 연결된 에피소드 제목 (현재 언어) */
  episodeTitle?: string;
  /** 현재 선택된 언어 */
  language: Language;
  /** 추가 클래스 */
  className?: string;
}

/**
 * 전투 직전에 이 카드들이 왜 싸우는지 한 줄로 이해시켜주는 배너.
 * 실제 게임 보드와 조작을 방해하지 않는 미니멀한 디자인.
 */
export const StoryBattleBanner: React.FC<StoryBattleBannerProps> = ({
  character1Name,
  character2Name,
  episodeTitle,
  language,
  className,
}) => {
  const { lowSpecMode } = useGameSettings();

  const contextTitle = t('story_battle_context_title', language);
  const descTemplate = t('story_battle_context_desc', language);
  const rawEpisode = episodeTitle || (language === 'ko' ? '현재 에피소드' : 'Current Episode');
  const formattedEpisode = rawEpisode.startsWith('webtoon_ep_') ? t(rawEpisode, language) : rawEpisode;
  const description = descTemplate.replace('{episode}', formattedEpisode);

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-indigo-200/60 bg-gradient-to-r from-indigo-50/90 via-purple-50/80 to-indigo-50/90 shadow-sm',
        lowSpecMode && 'from-indigo-50 via-purple-50 to-indigo-50',
        className,
      )}
    >
      {/* 배경 장식 — lowSpecMode에서는 숨김 */}
      {!lowSpecMode && (
        <>
          <div className="absolute -right-2 -top-2 h-16 w-16 rounded-full bg-indigo-300/20 blur-xl" />
          <div className="absolute -bottom-2 -left-2 h-12 w-12 rounded-full bg-purple-300/20 blur-lg" />
        </>
      )}

      <div className="relative px-4 py-3 sm:px-5 sm:py-3.5">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/15">
            <BookOpen size={14} className="text-indigo-600" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.24em] text-indigo-600/70">
            {contextTitle}
          </span>
          {episodeTitle && (
            <span className="rounded-full border border-indigo-200/60 bg-indigo-100/50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.2em] text-indigo-600">
              {t('story_battle_context_episode', language).replace('{episode}', formattedEpisode)}
            </span>
          )}
        </div>

        {/* 캐릭터 대결 구도 */}
        {character1Name && character2Name && (
          <div className="flex items-center gap-2 mb-2">
            <span className="rounded-full bg-indigo-100/70 px-3 py-1 text-[11px] font-bold text-indigo-800">
              {character1Name}
            </span>
            <Swords size={14} className="text-purple-500" />
            <span className="rounded-full bg-purple-100/70 px-3 py-1 text-[11px] font-bold text-purple-800">
              {character2Name}
            </span>
          </div>
        )}

        {/* 설명 */}
        <p className="text-[11px] font-semibold leading-relaxed text-slate-600">
          {description}
        </p>

        {/* 프로그레스 힌트 */}
        <div className="mt-2 flex items-center gap-1.5">
          <Sparkles size={10} className="text-amber-500" />
          <span className="text-[9px] font-bold text-amber-600/80">
            {t('story_battle_victory', language)}
          </span>
        </div>
      </div>
    </div>
  );
};
