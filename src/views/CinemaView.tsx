import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Film,
  ChevronLeft,
  ChevronRight,
  List,
  Sparkles,
  X,
  Play,
  CheckCircle2,
  Maximize,
  Minimize,
  BookOpen,
  Download,
  Camera,
  Image as ImageIcon,
} from 'lucide-react';
import { Language, ViewType } from '../types';
import { t } from '../lib/i18n';
import { cn } from '../lib/utils';
import { triggerHaptic } from '../lib/haptic';
import { PageHeader } from '../components/PageHeader';
import { getSeasonItem, setSeasonItem } from '../lib/webtoonProgress';
import { MOVIE_EPISODES } from '../content/movieEpisodeMapping';
import { LiveActionCinemaPlayer } from '../components/movie/LiveActionCinemaPlayer';
import { movieAudio } from '../lib/MovieAudioSynthesizer';

interface CinemaViewProps {
  language: Language;
  onNavigate: (view: ViewType) => void;
  playSfx?: (url: string) => void;
  currentSeason?: string;
  updateSns?: (amount: number, reason?: string) => void;
  showCustomAlert?: (title: string, message: string, autoCloseSeconds?: number) => void;
}

const TOTAL_EPISODES = 40;

export const CinemaView: React.FC<CinemaViewProps> = ({
  language,
  onNavigate,
  playSfx,
  currentSeason = 'season1',
  updateSns,
  showCustomAlert,
}) => {
  const [currentEpisodeNum, setCurrentEpisodeNum] = useState<number>(() => {
    try {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const epParam = params.get('ep') || params.get('episode');
        if (epParam) {
          const parsedEp = parseInt(epParam, 10);
          if (!isNaN(parsedEp)) {
            return Math.max(1, Math.min(TOTAL_EPISODES, parsedEp));
          }
        }
      }
    } catch {
      // ignore
    }
    const saved = getSeasonItem('hero_cinema_progress', currentSeason);
    const parsed = saved ? parseInt(saved, 10) : 1;
    return isNaN(parsed) || parsed < 1 || parsed > TOTAL_EPISODES ? 1 : Math.max(1, Math.min(TOTAL_EPISODES, parsed));
  });

  const [playerMode, setPlayerMode] = useState<'live-interactive' | 'mp4'>('mp4');
  const [showDrawer, setShowDrawer] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [filterMode, setFilterMode] = useState<'all' | 'mastered' | 'remastered'>('all');
  const mp4ContainerRef = useRef<HTMLDivElement>(null);

  const [claimedRewards, setClaimedRewards] = useState<Record<number, boolean>>(() => {
    try {
      const saved = getSeasonItem('hero_cinema_claimed_episodes', currentSeason);
      const parsed = saved ? JSON.parse(saved) : null;
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    setSeasonItem('hero_cinema_progress', currentEpisodeNum.toString(), currentSeason);
    if (typeof window !== 'undefined') {
      try {
        const url = new URL(window.location.href);
        if (url.searchParams.get('ep') !== currentEpisodeNum.toString()) {
          url.searchParams.set('ep', currentEpisodeNum.toString());
          window.history.replaceState(window.history.state, '', url.pathname + url.search);
        }
      } catch {
        // ignore
      }
    }
  }, [currentEpisodeNum, currentSeason]);

  const handleSelectEpisode = (epNum: number) => {
    if (epNum < 1 || epNum > TOTAL_EPISODES) return;
    movieAudio.unlockSpeech();
    setCurrentEpisodeNum(epNum);
    setShowDrawer(false);
    if (playSfx) playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
  };

  const handleClaimReward = (epNum: number) => {
    if (claimedRewards[epNum]) return;

    const newClaimed = { ...claimedRewards, [epNum]: true };
    setClaimedRewards(newClaimed);
    setSeasonItem('hero_cinema_claimed_episodes', JSON.stringify(newClaimed), currentSeason);

    if (updateSns) {
      updateSns(100, `Live-Action Cinema Ep.${epNum} Watch Reward`);
    }

    if (playSfx) {
      playSfx('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
    }

    if (showCustomAlert) {
      let isAutoLoop = false;
      try {
        isAutoLoop =
          localStorage.getItem('hero_auto_loop_is_ranking') === 'true' ||
          localStorage.getItem('hero_auto_loop_mode') !== null;
      } catch {}

      showCustomAlert(
        language === 'ko' ? '실사 시네마 관람 보상' : 'Live-Action Cinema Reward',
        language === 'ko'
          ? `실사 시네마 제 ${epNum}화 관람 완료 보상으로 100 SNS가 지급되었습니다!`
          : `Received 100 SNS for watching Live-Action Cinema Episode ${epNum}!`,
        isAutoLoop ? 2 : 3
      );
    }
  };

  useEffect(() => {
    if (!claimedRewards[currentEpisodeNum]) {
      const timer = setTimeout(() => {
        handleClaimReward(currentEpisodeNum);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [currentEpisodeNum, claimedRewards]);

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (!mp4ContainerRef.current) return;
    if (!document.fullscreenElement) {
      mp4ContainerRef.current.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  const getEpisodeTitle = (epNum: number): { main: string; sub: string } => {
    const meta = MOVIE_EPISODES[epNum];
    if (!meta) return { main: `제 ${epNum}화`, sub: `Episode ${epNum}` };
    if (language === 'ko') {
      return { main: `제${epNum}화 ${meta.titleKo}`, sub: meta.titleEn };
    } else if (language === 'ja') {
      return { main: `第${epNum}話 ${meta.titleJa || meta.titleKo}`, sub: meta.titleEn };
    }
    return { main: `Ep.${epNum} ${meta.titleEn}`, sub: meta.titleKo };
  };

  const mp4Url =
    currentEpisodeNum === 1
      ? '/videos/cinema/episode_01.mp4?v=card72en'
      : `/videos/episodes/episode_${String(currentEpisodeNum).padStart(2, '0')}.mp4`;

  const posterUrl =
    currentEpisodeNum === 1
      ? '/images/cinema/episode_01_acting/seq_01_frame_01.webp'
      : `/images/webtoon/episode_${String(currentEpisodeNum).padStart(2, '0')}/scene_00.webp`;

  return (
    <div className="flex flex-col min-h-screen bg-[#fdfcfc] text-[#201d1d] font-mono px-0 py-2 sm:py-3 pb-32 max-w-none mx-auto w-full overflow-x-hidden">
      {/* ── Page Header ── */}
      <div className="px-2 sm:px-4">
        <PageHeader
          title={t('cinema_title', language) || 'SNSHero 실사 시네마관 (70mm Live-Action)'}
          onBack={() => onNavigate('home')}
          rightAction={
            <button
              type="button"
              onClick={() => setShowDrawer(true)}
              className="min-h-[44px] flex items-center gap-1.5 px-3 py-1.5 rounded-sm border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] text-xs font-bold text-[#201d1d] hover:bg-[#f8f7f7] transition-colors cursor-pointer shrink-0 font-mono"
            >
              <List size={16} />
              <span className="hidden sm:inline">[{t('cinema_list', language) || '시네마 회차 목록'}]</span>
            </button>
          }
        />
      </div>

      {/* ── Live-Action Cinema Banner Header ── */}
      <div className="mb-3 sm:mb-4 px-3 sm:px-4 py-3 sm:py-4 rounded-none border-y border-x-0 border-[#201d1d] bg-[#201d1d] text-[#fdfcfc]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <div className="p-2 rounded-sm bg-amber-500/20 border border-amber-400/40 text-amber-300 shrink-0 mt-0.5">
              <Camera size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-bold tracking-wider text-amber-400 uppercase">
                  [70MM IMAX LIVE-ACTION CINEMA]
                </span>
                <span className="px-1.5 py-0.5 rounded-sm bg-amber-400 text-black text-[10px] font-bold font-mono">
                  제1화 72프레임 연속 연기 & PyTorch 모션 워핑 적용
                </span>
                <span className="px-1.5 py-0.5 rounded-sm bg-[#fdfcfc]/10 text-[#fdfcfc] border border-[#fdfcfc]/20 text-[10px] font-mono">
                  2.39:1 시네마스코프 · 24fps
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-bold mt-1 text-[#fdfcfc]">
                {t('cinema_subtitle', language) ||
                  '일관된 배우와 소품(은빛 단검·성기사 인장·철제 성배)이 연속 동작 플립북과 PyTorch 광학 흐름 모션으로 실제 연기하는 시네마 영화관입니다.'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-end">
            <a
              href={mp4Url}
              download={`SNSHero_LiveAction_Cinema_EP${String(currentEpisodeNum).padStart(2, '0')}.mp4`}
              className="min-h-[44px] flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-amber-400 hover:bg-amber-300 text-black font-mono text-xs font-bold transition-colors shrink-0"
              title="실사 시네마 MP4 비디오 다운로드"
            >
              <Download size={14} />
              <span>[실사 MP4 다운로드]</span>
            </a>
          </div>
        </div>
      </div>

      {/* ── Main Cinema Player Section ── */}
      <div className="mb-6 space-y-2 sm:space-y-3 w-full">
        {/* Playback Mode Switcher */}
        <div className="flex flex-wrap items-center gap-2 px-2 sm:px-4">
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              movieAudio.stopAll();
              setPlayerMode('mp4');
            }}
            className={cn(
              'min-h-[44px] flex-1 min-w-[160px] flex items-center justify-center gap-2 px-3 py-2 rounded-sm border font-mono text-xs font-bold transition-colors cursor-pointer',
              playerMode === 'mp4'
                ? 'border-[#201d1d] bg-[#201d1d] text-[#fdfcfc]'
                : 'border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] text-[#201d1d] hover:bg-[#f8f7f7]'
            )}
          >
            <Film size={16} className={playerMode === 'mp4' ? 'text-amber-400' : 'text-stone-700'} />
            <span>[🎞️ 24fps 실사 연속 연기 동영상 상영 (MP4)]</span>
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              movieAudio.unlockSpeech();
              setPlayerMode('live-interactive');
            }}
            className={cn(
              'min-h-[44px] flex-1 min-w-[160px] flex items-center justify-center gap-2 px-3 py-2 rounded-sm border font-mono text-xs font-bold transition-colors cursor-pointer',
              playerMode === 'live-interactive'
                ? 'border-[#201d1d] bg-[#201d1d] text-[#fdfcfc]'
                : 'border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] text-[#201d1d] hover:bg-[#f8f7f7]'
            )}
          >
            <Camera size={16} className={playerMode === 'live-interactive' ? 'text-amber-400' : 'text-amber-600'} />
            <span>[🎥 인터랙티브 플립북 시네마관 (70mm LUT)]</span>
          </button>
        </div>

        {playerMode === 'live-interactive' ? (
          <LiveActionCinemaPlayer
            episodeNumber={currentEpisodeNum}
            titleKo={MOVIE_EPISODES[currentEpisodeNum]?.titleKo || `제 ${currentEpisodeNum}화`}
            titleEn={MOVIE_EPISODES[currentEpisodeNum]?.titleEn || `Episode ${currentEpisodeNum}`}
            titleJa={MOVIE_EPISODES[currentEpisodeNum]?.titleJa}
            language={language === 'en' ? 'en' : language === 'ja' ? 'ja' : 'ko'}
            onEpisodeComplete={(ep) => handleClaimReward(ep)}
            onSelectEpisode={(ep) => handleSelectEpisode(ep)}
            totalEpisodes={TOTAL_EPISODES}
          />
        ) : (
          <div
            ref={mp4ContainerRef}
            className={cn(
              'relative w-full rounded-none overflow-hidden bg-black border-y border-x-0 border-[#201d1d] flex flex-col items-center justify-center',
              isFullscreen ? 'fixed inset-0 z-50 rounded-none border-none max-w-none' : 'aspect-video'
            )}
          >
            <video
              key={`cinema-mp4-ep-${currentEpisodeNum}`}
              src={mp4Url}
              autoPlay
              controls
              playsInline
              className="w-full h-full object-cover"
              style={
                currentEpisodeNum > 1
                  ? { filter: 'contrast(1.16) saturate(0.82) sepia(0.10) brightness(0.95)' }
                  : undefined
              }
              poster={posterUrl}
            >
              <p className="text-white text-xs font-mono p-4">
                브라우저가 HTML5 비디오를 지원하지 않습니다.
              </p>
            </video>

            <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
              <a
                href={mp4Url}
                download={`SNSHero_LiveAction_Cinema_EP${String(currentEpisodeNum).padStart(2, '0')}.mp4`}
                className="min-h-[44px] flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-[#201d1d] hover:bg-black text-[#fdfcfc] border border-[#fdfcfc]/30 font-mono text-xs font-bold transition-colors cursor-pointer shrink-0"
              >
                <Download size={14} />
                <span>[⬇️ 24fps MP4 다운로드]</span>
              </a>

              <button
                type="button"
                onClick={toggleFullscreen}
                className="min-h-[44px] min-w-[44px] p-2 rounded-sm bg-[#201d1d] hover:bg-black text-[#fdfcfc] border border-[#fdfcfc]/30 transition-colors cursor-pointer flex items-center justify-center"
              >
                {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
              </button>
            </div>
          </div>
        )}

        {/* Episode Info & Cross-Media Navigation Bar */}
        <div className="p-3 sm:p-4 rounded-none border-y border-x-0 border-[rgba(15,0,0,0.12)] bg-[#f8f7f7] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs font-bold px-2 py-1 rounded-sm bg-[#201d1d] text-amber-400">
              실사 시네마 EP.{String(currentEpisodeNum).padStart(2, '0')}
            </span>
            {currentEpisodeNum === 1 ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-400">
                <Sparkles size={12} />
                [★] 100% 실사 마스터 촬영본
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[11px] font-bold bg-sky-50 text-sky-900 border border-sky-300">
                <CheckCircle2 size={12} />
                [70mm LUT 리마스터 상영]
              </span>
            )}
            <span className="text-xs font-bold text-[#201d1d] font-mono">
              {getEpisodeTitle(currentEpisodeNum).main}
              {getEpisodeTitle(currentEpisodeNum).sub && (
                <span className="text-[11px] text-[#646262] ml-1.5 font-normal">
                  ({getEpisodeTitle(currentEpisodeNum).sub})
                </span>
              )}
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end flex-wrap">
            {/* Cross-Media Navigation: Novel, Webtoon, Animated Movie */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                onNavigate('novel');
              }}
              className="min-h-[44px] flex items-center gap-1.5 px-3 py-1.5 rounded-sm border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] hover:bg-[#f1eeee] text-[#201d1d] text-xs font-bold font-mono transition-colors cursor-pointer"
            >
              <BookOpen size={14} className="text-amber-800" />
              <span>[📖 소설 {currentEpisodeNum}화]</span>
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                onNavigate('webtoon');
              }}
              className="min-h-[44px] flex items-center gap-1.5 px-3 py-1.5 rounded-sm border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] hover:bg-[#f1eeee] text-[#201d1d] text-xs font-bold font-mono transition-colors cursor-pointer"
            >
              <ImageIcon size={14} className="text-blue-800" />
              <span>[🖼️ 웹툰 {currentEpisodeNum}화]</span>
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                onNavigate('movie');
              }}
              className="min-h-[44px] flex items-center gap-1.5 px-3 py-1.5 rounded-sm border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] hover:bg-[#f1eeee] text-[#201d1d] text-xs font-bold font-mono transition-colors cursor-pointer"
            >
              <Film size={14} className="text-purple-800" />
              <span>[🎬 무비 {currentEpisodeNum}화]</span>
            </button>

            {/* Prev / Next Ep */}
            <button
              type="button"
              disabled={currentEpisodeNum <= 1}
              onClick={() => handleSelectEpisode(currentEpisodeNum - 1)}
              className="min-h-[44px] flex items-center gap-1 px-3 py-1.5 rounded-sm border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] hover:bg-[#f1eeee] disabled:opacity-40 text-xs font-bold font-mono transition-colors cursor-pointer"
            >
              <ChevronLeft size={16} />
              <span>이전 화</span>
            </button>

            <button
              type="button"
              disabled={currentEpisodeNum >= TOTAL_EPISODES}
              onClick={() => handleSelectEpisode(currentEpisodeNum + 1)}
              className="min-h-[44px] flex items-center gap-1 px-3 py-1.5 rounded-sm border bg-[#201d1d] text-[#fdfcfc] border-[#201d1d] hover:bg-[#201d1d]/90 text-xs font-bold font-mono transition-colors cursor-pointer"
            >
              <span>다음 화</span>
              <ChevronRight size={16} />
            </button>

            <div className="min-h-[44px] flex items-center gap-1.5 px-3 py-1.5 rounded-sm font-mono text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 shrink-0">
              <CheckCircle2 size={14} className="text-emerald-600" />
              <span>{language === 'ko' ? '[v] 관람 보상 100 SNS 자동 지급' : '[v] 100 SNS Auto-Awarded'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Live-Action Production Specs & Casting Note ── */}
      <div className="px-2 sm:px-4 mb-6">
        <div className="p-3.5 sm:p-4 rounded-none border border-[rgba(15,0,0,0.15)] bg-[#f8f7f7] space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs font-bold text-[#201d1d]">
              [ 🎥 정통 다크 판타지 블록버스터 실사 시네마 제작 명세 (ARRI Alexa 65 · 70mm Panavision) ]
            </span>
            <span className="text-[11px] text-[#646262]">
              시놉시스: {MOVIE_EPISODES[currentEpisodeNum]?.synopsisKo}
            </span>
          </div>
          <p className="text-xs text-[#646262] leading-relaxed">
            기존 2D 웹툰/일러스트 기반 애니메이션 무비와 달리, 실제 배우의 피부 질감·수염에 맺힌 서리·단조된 강철 판금 갑옷·통나무 선술집의 자연 횃불 조명과 2.39:1 시네마스코프 레터박스 및 35mm 필름 그레인을 적용한 실사 시네마 전용 상영관입니다.
          </p>
        </div>
      </div>

      {/* ── Episode Grid View (1 ~ 40화) ── */}
      <div className="space-y-3 px-2 sm:px-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <h3 className="font-mono text-sm font-bold text-[#201d1d]">
              [ 실사 시네마 전체 에피소드 ({TOTAL_EPISODES}부작) ]
            </h3>
          </div>

          <div className="flex items-center gap-1 bg-[#f8f7f7] p-1 rounded-none border border-[rgba(15,0,0,0.12)] text-xs font-mono">
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              className={cn(
                'min-h-[44px] px-3 py-1.5 rounded-sm transition-colors cursor-pointer',
                filterMode === 'all' ? 'bg-[#201d1d] text-[#fdfcfc] font-bold' : 'text-[#201d1d] hover:bg-[#f1eeee]'
              )}
            >
              [전체 (40)]
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('mastered')}
              className={cn(
                'min-h-[44px] px-3 py-1.5 rounded-sm transition-colors cursor-pointer',
                filterMode === 'mastered' ? 'bg-[#201d1d] text-[#fdfcfc] font-bold' : 'text-[#201d1d] hover:bg-[#f1eeee]'
              )}
            >
              [100% 실사 마스터 (EP.01)]
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('remastered')}
              className={cn(
                'min-h-[44px] px-3 py-1.5 rounded-sm transition-colors cursor-pointer',
                filterMode === 'remastered' ? 'bg-[#201d1d] text-[#fdfcfc] font-bold' : 'text-[#201d1d] hover:bg-[#f1eeee]'
              )}
            >
              [70mm LUT 리마스터 (EP.02~40)]
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-8 gap-2">
          {Array.from({ length: TOTAL_EPISODES }, (_, i) => i + 1)
            .filter((ep) => {
              if (filterMode === 'mastered') return ep === 1;
              if (filterMode === 'remastered') return ep > 1;
              return true;
            })
            .map((ep) => {
              const isSelected = ep === currentEpisodeNum;
              const isClaimed = Boolean(claimedRewards[ep]);
              const isMasterLive = ep === 1;

              return (
                <button
                  key={ep}
                  type="button"
                  onClick={() => handleSelectEpisode(ep)}
                  className={cn(
                    'min-h-[68px] relative flex flex-col items-center justify-center p-2.5 rounded-none border transition-colors text-left cursor-pointer font-mono group',
                    isSelected
                      ? 'border-[#201d1d] bg-[#201d1d] text-[#fdfcfc] font-bold'
                      : 'border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] hover:border-[#201d1d] hover:bg-[#f8f7f7] text-[#201d1d]'
                  )}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="text-[11px] font-bold">EP.{String(ep).padStart(2, '0')}</span>
                    <Play
                      size={12}
                      className={cn(
                        isSelected ? 'text-amber-400 fill-current' : 'text-[#646262] group-hover:text-[#201d1d]'
                      )}
                    />
                  </div>

                  <div className="w-full text-center">
                    {isMasterLive ? (
                      <span
                        className={cn(
                          'inline-block px-1.5 py-0.5 rounded-sm text-[9px] font-bold border',
                          isSelected
                            ? 'bg-amber-400 text-black border-amber-400'
                            : 'bg-amber-50 text-amber-900 border-amber-300'
                        )}
                      >
                        ★ 실사 마스터
                      </span>
                    ) : (
                      <span
                        className={cn(
                          'inline-block px-1.5 py-0.5 rounded-sm text-[9px] font-bold border',
                          isSelected
                            ? 'bg-[#fdfcfc] text-[#201d1d] border-[#fdfcfc]'
                            : 'bg-sky-50 text-sky-900 border-sky-200'
                        )}
                      >
                        70mm LUT
                      </span>
                    )}
                  </div>

                  {isClaimed && (
                    <span className={cn('absolute top-1 right-1', isSelected ? 'text-emerald-300' : 'text-emerald-600')}>
                      <CheckCircle2 size={10} />
                    </span>
                  )}
                </button>
              );
            })}
        </div>
      </div>

      {/* ── Slide Drawer: Cinema Episode List ── */}
      <AnimatePresence>
        {showDrawer && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/60">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-md h-full bg-[#fdfcfc] border-l border-[#201d1d] p-4 flex flex-col rounded-none"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[rgba(15,0,0,0.12)] mb-3">
                <div className="flex items-center gap-2">
                  <Camera size={18} className="text-[#201d1d]" />
                  <h3 className="font-mono text-base font-bold text-[#201d1d]">
                    [ 실사 시네마 회차 목록 (40부작) ]
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDrawer(false)}
                  className="min-h-[44px] min-w-[44px] p-1 rounded-sm border border-[rgba(15,0,0,0.12)] hover:bg-[#f1eeee] text-[#201d1d] transition-colors cursor-pointer flex items-center justify-center"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {Array.from({ length: TOTAL_EPISODES }, (_, i) => i + 1).map((ep) => {
                  const isSelected = ep === currentEpisodeNum;
                  const isClaimed = Boolean(claimedRewards[ep]);
                  const isMaster = ep === 1;

                  return (
                    <button
                      key={ep}
                      type="button"
                      onClick={() => handleSelectEpisode(ep)}
                      className={cn(
                        'min-h-[48px] w-full p-3 rounded-sm border text-left flex items-center justify-between transition-colors cursor-pointer font-mono',
                        isSelected
                          ? 'border-[#201d1d] bg-[#201d1d] text-[#fdfcfc] font-bold'
                          : 'border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] hover:bg-[#f8f7f7] text-[#201d1d]'
                      )}
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <span className="text-xs font-bold shrink-0">EP.{String(ep).padStart(2, '0')}</span>
                        <div className="flex flex-col truncate">
                          <span className="text-xs truncate font-medium">{getEpisodeTitle(ep).main}</span>
                          <span
                            className={cn(
                              'text-[10px] truncate font-normal',
                              isSelected ? 'text-[#fdfcfc]/70' : 'text-[#646262]'
                            )}
                          >
                            {getEpisodeTitle(ep).sub}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={cn(
                            'px-1.5 py-0.5 rounded-sm text-[10px] font-bold border',
                            isMaster
                              ? 'bg-amber-400 text-black border-amber-400'
                              : isSelected
                              ? 'bg-[#fdfcfc] text-[#201d1d] border-[#fdfcfc]'
                              : 'bg-sky-50 text-sky-800 border-sky-200'
                          )}
                        >
                          {isMaster ? '★ 실사 마스터' : '70mm LUT'}
                        </span>
                        {isClaimed && (
                          <CheckCircle2 size={14} className={isSelected ? 'text-emerald-300' : 'text-emerald-600'} />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
