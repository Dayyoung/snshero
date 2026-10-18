/**
 * CinematicMoviePlayer.tsx
 * In-App Generative Theatrical Movie Player for SNSHero.
 * Renders 20-scene animated storyboards with Ken Burns multi-plane camera motion,
 * HTML5 Canvas particle VFX, procedural Web Audio soundtrack & battle SFX,
 * synchronized bilingual subtitles, SpeechSynthesis voiceover, and full timeline controls.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  X,
  RotateCcw,
  Sparkles,
  Mic,
  MicOff,
  Languages,
  Film,
  CheckCircle2,
  ChevronRight,
  Flame,
  CloudSnow,
  Zap,
  Sword,
} from 'lucide-react';
import { MovieVfxCanvas, MovieVfxType } from './MovieVfxCanvas';
import { movieAudio, MovieBgmTheme, MovieSfxType } from '../../lib/MovieAudioSynthesizer';
import { MOVIE_EPISODES } from '../../content/movieEpisodeMapping';
import WEBTOON_MANIFEST from '../../content/webtoonEpisodeManifest.json';
import { triggerHaptic } from '../../lib/haptic';

export interface CinematicScene {
  sceneNumber: number;
  imageUrl: string;
  narrationKo: string;
  narrationEn: string;
  dialogues?: Array<{ speaker: string; text: string }>;
  vfxType?: MovieVfxType;
  cameraMotion?: 'pan-left' | 'pan-right' | 'zoom-in' | 'zoom-out' | 'shake';
  bgmTheme?: MovieBgmTheme;
  sfxTrigger?: MovieSfxType;
  durationSeconds?: number;
}

export interface CinematicMoviePlayerProps {
  episodeNumber: number;
  titleKo: string;
  titleEn: string;
  titleJa?: string;
  scenes?: CinematicScene[];
  language: 'ko' | 'en' | 'ja';
  onClose?: () => void;
  onEpisodeComplete?: (epNum: number) => void;
  onSelectEpisode?: (epNum: number) => void;
  totalEpisodes?: number;
}

// Fallback scene generator from webtoonEpisodeManifest
const buildScenesForEpisode = (epNum: number, language: 'ko' | 'en' | 'ja' = 'ko'): CinematicScene[] => {
  const manifest = WEBTOON_MANIFEST as Record<string, {
    episodeNumber: number;
    episodeTitle: string;
    totalImages: number;
    images: Array<{
      index: number;
      imageUrl: string;
      type: string;
      narrationEn?: string;
      narrationKo?: string;
      background?: string;
      characters?: string[];
      dialogues?: Array<{ speakerKo?: string; speakerEn?: string; textKo: string; textEn: string }>;
    }>;
  }>;

  const epData = manifest[String(epNum)];
  const meta = MOVIE_EPISODES[epNum];
  const defaultTheme: MovieBgmTheme = meta?.bgmTheme || 'arcane-mystery';
  const defaultVfx: MovieVfxType = meta?.defaultVfx || 'snow';

  const motionCycle: Array<'zoom-in' | 'pan-left' | 'zoom-out' | 'pan-right' | 'shake'> = [
    'zoom-in',
    'pan-left',
    'zoom-out',
    'pan-right',
    'zoom-in',
  ];

  if (!epData || !epData.images || epData.images.length === 0) {
    // Generate minimal fallback scenes if manifest is somehow missing
    return Array.from({ length: 20 }, (_, i) => ({
      sceneNumber: i + 1,
      imageUrl: `https://dayyoung.github.io/image/cartoon/episode_${String(epNum).padStart(2, '0')}/01_scene_${i + 1}.jpeg`,
      narrationKo: `제 ${epNum}화 ${meta?.titleKo || ''} - 씬 ${i + 1}`,
      narrationEn: `Episode ${epNum} ${meta?.titleEn || ''} - Scene ${i + 1}`,
      cameraMotion: motionCycle[i % motionCycle.length],
      vfxType: defaultVfx,
      bgmTheme: defaultTheme,
      durationSeconds: 6,
    }));
  }

  // Filter out title card (index 0) or map scenes 1..20
  const sceneImages = epData.images.filter((img) => img.index > 0);
  const targetImages = sceneImages.length > 0 ? sceneImages : epData.images;

  return targetImages.slice(0, 20).map((img, idx) => {
    const textKo = img.narrationKo || '';
    const textEn = img.narrationEn || '';

    // Smart VFX heuristic based on scene text
    let sceneVfx: MovieVfxType = defaultVfx;
    if (textKo.includes('눈') || textKo.includes('겨울') || textKo.includes('얼음') || textEn.toLowerCase().includes('snow') || textEn.toLowerCase().includes('blizzard')) {
      sceneVfx = 'snow';
    } else if (textKo.includes('불') || textKo.includes('화염') || textKo.includes('용암') || textEn.toLowerCase().includes('fire') || textEn.toLowerCase().includes('flame')) {
      sceneVfx = 'embers';
    } else if (textKo.includes('룬') || textKo.includes('마법') || textKo.includes('별') || textEn.toLowerCase().includes('rune') || textEn.toLowerCase().includes('magic')) {
      sceneVfx = 'runes';
    } else if (textKo.includes('검') || textKo.includes('칼') || textKo.includes('참격') || textKo.includes('격돌') || textEn.toLowerCase().includes('sword') || textEn.toLowerCase().includes('strike')) {
      sceneVfx = 'slash';
    } else if (textKo.includes('안개') || textKo.includes('호수') || textEn.toLowerCase().includes('mist') || textEn.toLowerCase().includes('fog')) {
      sceneVfx = 'fog';
    }

    // Smart SFX trigger on dramatic beats
    let sfxTrigger: MovieSfxType | undefined = undefined;
    if (textKo.includes('검') || textKo.includes('칼날') || textEn.toLowerCase().includes('sword')) {
      sfxTrigger = 'sword-strike';
    } else if (textKo.includes('마법') || textKo.includes('주문') || textEn.toLowerCase().includes('magic')) {
      sfxTrigger = 'magic-cast';
    } else if (textKo.includes('폭풍') || textKo.includes('번개') || textKo.includes('충격') || textEn.toLowerCase().includes('thunder')) {
      sfxTrigger = 'thunder-impact';
    } else if (textKo.includes('방패') || textKo.includes('막아') || textEn.toLowerCase().includes('shield')) {
      sfxTrigger = 'shield-block';
    } else {
      sfxTrigger = 'whoosh';
    }

    // Camera motion: Climax or combat scenes get shake
    let motion: 'zoom-in' | 'pan-left' | 'zoom-out' | 'pan-right' | 'shake' = motionCycle[idx % motionCycle.length];
    if (idx === 18 || textKo.includes('폭발') || textKo.includes('일격') || textEn.toLowerCase().includes('clash')) {
      motion = 'shake';
    }

    const dialogues = img.dialogues?.map((d) => ({
      speaker: (language === 'ko' ? d.speakerKo : d.speakerEn) || d.speakerKo || '',
      text: (language === 'ko' ? d.textKo : d.textEn) || d.textKo || '',
    }));

    return {
      sceneNumber: idx + 1,
      imageUrl: img.imageUrl,
      narrationKo: textKo,
      narrationEn: textEn,
      dialogues,
      cameraMotion: motion,
      vfxType: sceneVfx,
      bgmTheme: defaultTheme,
      sfxTrigger,
      durationSeconds: 6.5,
    };
  });
};

export const CinematicMoviePlayer: React.FC<CinematicMoviePlayerProps> = ({
  episodeNumber,
  titleKo,
  titleEn,
  titleJa,
  scenes: initialScenes,
  language,
  onClose,
  onEpisodeComplete,
  onSelectEpisode,
  totalEpisodes = 40,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Loaded scenes
  const [scenes, setScenes] = useState<CinematicScene[]>(() => {
    return initialScenes && initialScenes.length > 0
      ? initialScenes
      : buildScenesForEpisode(episodeNumber, language);
  });

  const [currentSceneIdx, setCurrentSceneIdx] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isTtsEnabled, setIsTtsEnabled] = useState<boolean>(true);
  const [subtitleMode, setSubtitleMode] = useState<'dual' | 'primary' | 'off'>('dual');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(true);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [sceneProgress, setSceneProgress] = useState<number>(0); // 0 to 100%

  const controlsTimeoutRef = useRef<number | null>(null);
  const progressTimerRef = useRef<number | null>(null);

  // When episodeNumber changes, rebuild scenes
  useEffect(() => {
    const newScenes = initialScenes && initialScenes.length > 0
      ? initialScenes
      : buildScenesForEpisode(episodeNumber, language);
    setScenes(newScenes);
    setCurrentSceneIdx(0);
    setIsCompleted(false);
    setSceneProgress(0);
  }, [episodeNumber, initialScenes, language]);

  const currentScene = scenes[currentSceneIdx] || scenes[0];

  // Auto-hide controls timer
  const resetControlsTimeout = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      window.clearTimeout(controlsTimeoutRef.current);
    }
    if (isPlaying) {
      controlsTimeoutRef.current = window.setTimeout(() => {
        setShowControls(false);
      }, 3500);
    }
  }, [isPlaying]);

  useEffect(() => {
    resetControlsTimeout();
    return () => {
      if (controlsTimeoutRef.current) window.clearTimeout(controlsTimeoutRef.current);
    };
  }, [resetControlsTimeout]);

  // Audio & TTS Synchronization on Scene Change
  useEffect(() => {
    if (!currentScene) return;

    // Start background music theme
    if (currentScene.bgmTheme) {
      movieAudio.startBgm(currentScene.bgmTheme);
    }

    // Trigger one-shot battle/scene sound effect
    if (currentScene.sfxTrigger) {
      movieAudio.playSfx(currentScene.sfxTrigger);
    }

    // Voiceover SpeechSynthesis
    if (isTtsEnabled && isPlaying && !isMuted) {
      const narrationText = language === 'en' ? currentScene.narrationEn : currentScene.narrationKo;
      if (narrationText) {
        movieAudio.speakNarration(narrationText, language === 'en' ? 'en' : 'ko');
      }
    } else {
      movieAudio.stopNarration();
    }

    return () => {
      // Don't stop BGM if theme hasn't changed, but stop narration on scene switch
      movieAudio.stopNarration();
    };
  }, [currentSceneIdx, currentScene, isTtsEnabled, isPlaying, isMuted, language]);

  // Scene auto-advance timer and progress ticker
  useEffect(() => {
    if (!isPlaying || isCompleted) {
      if (progressTimerRef.current) window.clearInterval(progressTimerRef.current);
      return;
    }

    const durationSec = (currentScene?.durationSeconds || 6.5) / playbackSpeed;
    const intervalMs = 50;
    const increment = (intervalMs / (durationSec * 1000)) * 100;

    setSceneProgress(0);

    progressTimerRef.current = window.setInterval(() => {
      setSceneProgress((prev) => {
        const next = prev + increment;
        if (next >= 100) {
          // Advance to next scene
          if (currentSceneIdx < scenes.length - 1) {
            setCurrentSceneIdx((c) => c + 1);
            return 0;
          } else {
            // Episode finished!
            setIsPlaying(false);
            setIsCompleted(true);
            movieAudio.playSfx('victory-chime');
            if (onEpisodeComplete) {
              onEpisodeComplete(episodeNumber);
            }
            return 100;
          }
        }
        return next;
      });
    }, intervalMs);

    return () => {
      if (progressTimerRef.current) window.clearInterval(progressTimerRef.current);
    };
  }, [currentSceneIdx, isPlaying, isCompleted, playbackSpeed, currentScene, scenes.length, episodeNumber, onEpisodeComplete]);

  // Fullscreen toggle
  const toggleFullscreen = async () => {
    triggerHaptic('light');
    if (!containerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.warn('[CinematicMoviePlayer] Fullscreen toggle failed:', err);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Controls Handlers
  const handleTogglePlay = () => {
    triggerHaptic('light');
    movieAudio.initAudio();
    setIsPlaying((prev) => !prev);
    resetControlsTimeout();
  };

  const handlePrevScene = () => {
    triggerHaptic('light');
    movieAudio.playSfx('whoosh');
    setCurrentSceneIdx((prev) => Math.max(0, prev - 1));
    setSceneProgress(0);
    resetControlsTimeout();
  };

  const handleNextScene = () => {
    triggerHaptic('light');
    movieAudio.playSfx('whoosh');
    if (currentSceneIdx < scenes.length - 1) {
      setCurrentSceneIdx((prev) => prev + 1);
      setSceneProgress(0);
    } else {
      setIsCompleted(true);
      setIsPlaying(false);
    }
    resetControlsTimeout();
  };

  const handleJumpToScene = (idx: number) => {
    triggerHaptic('light');
    movieAudio.playSfx('whoosh');
    setCurrentSceneIdx(idx);
    setSceneProgress(0);
    setIsCompleted(false);
    resetControlsTimeout();
  };

  const handleToggleMute = () => {
    triggerHaptic('light');
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    movieAudio.setMuted(nextMuted);
    resetControlsTimeout();
  };

  const handleCycleSpeed = () => {
    triggerHaptic('light');
    const speeds = [1.0, 1.25, 1.5, 2.0];
    const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
    setPlaybackSpeed(speeds[nextIdx]);
    resetControlsTimeout();
  };

  const handleCycleSubtitle = () => {
    triggerHaptic('light');
    const modes: Array<'dual' | 'primary' | 'off'> = ['dual', 'primary', 'off'];
    const nextIdx = (modes.indexOf(subtitleMode) + 1) % modes.length;
    setSubtitleMode(modes[nextIdx]);
    resetControlsTimeout();
  };

  const handleToggleTts = () => {
    triggerHaptic('light');
    setIsTtsEnabled((prev) => !prev);
    resetControlsTimeout();
  };

  const handleReplayEpisode = () => {
    triggerHaptic('medium');
    setIsCompleted(false);
    setCurrentSceneIdx(0);
    setSceneProgress(0);
    setIsPlaying(true);
    movieAudio.initAudio();
  };

  const handlePlayNextEpisode = () => {
    triggerHaptic('medium');
    if (onSelectEpisode && episodeNumber < totalEpisodes) {
      onSelectEpisode(episodeNumber + 1);
    }
  };

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        handleTogglePlay();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrevScene();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNextScene();
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        handleToggleMute();
      } else if (e.key === 'Escape' && isFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // Calculate CSS transform for Ken Burns motion
  const getCameraStyle = (): React.CSSProperties => {
    const motion = currentScene?.cameraMotion || 'zoom-in';
    const duration = (currentScene?.durationSeconds || 6.5) / playbackSpeed;

    let baseTransform = 'scale(1.0) translate(0, 0)';
    if (motion === 'zoom-in') {
      baseTransform = isPlaying ? 'scale(1.18)' : 'scale(1.08)';
    } else if (motion === 'zoom-out') {
      baseTransform = isPlaying ? 'scale(1.02)' : 'scale(1.15)';
    } else if (motion === 'pan-left') {
      baseTransform = isPlaying ? 'scale(1.12) translate(-3.5%, 0)' : 'scale(1.12) translate(1%, 0)';
    } else if (motion === 'pan-right') {
      baseTransform = isPlaying ? 'scale(1.12) translate(3.5%, 0)' : 'scale(1.12) translate(-1%, 0)';
    } else if (motion === 'shake') {
      baseTransform = 'scale(1.14)';
    }

    return {
      transform: baseTransform,
      transition: `transform ${duration}s cubic-bezier(0.25, 1, 0.5, 1)`,
    };
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={resetControlsTimeout}
      onTouchStart={resetControlsTimeout}
      className={`relative w-full overflow-hidden bg-black font-mono select-none ${
        isFullscreen ? 'fixed inset-0 z-50 h-screen w-screen' : 'aspect-video min-h-[380px] max-h-[82vh] rounded-none border border-white/10 shadow-2xl'
      }`}
    >
      {/* 1. KEN BURNS MULTI-PLANE MOTION STAGE */}
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden bg-black">
        <img
          key={`${episodeNumber}_scene_${currentSceneIdx}`}
          src={currentScene?.imageUrl}
          alt={`Scene ${currentSceneIdx + 1}`}
          style={getCameraStyle()}
          className={`h-full w-full object-cover will-change-transform ${
            currentScene?.cameraMotion === 'shake' && isPlaying ? 'animate-pulse' : ''
          }`}
          onError={(e) => {
            // Graceful fallback to dark atmospheric poster
            (e.target as HTMLImageElement).src =
              'https://dayyoung.github.io/image/cartoon/episode_01/00_SNSHERO_Episode_01_title_card_202608311350.jpeg';
          }}
        />

        {/* Cinematic Vignette & Lighting Gradient */}
        <div className="pointer-events-none absolute inset-0 bg-radial-[circle_at_center,transparent_40%,rgba(0,0,0,0.7)_100%]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/80 via-black/30 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-black/95 via-black/60 to-transparent" />
      </div>

      {/* 2. HTML5 PARTICLE VFX CANVAS OVERLAY */}
      <MovieVfxCanvas vfxType={currentScene?.vfxType || 'none'} intensity={1.1} />

      {/* 3. FLOATING THEATRICAL HEADER (Title & Badges) */}
      <div
        className={`absolute top-0 inset-x-0 z-20 flex items-center justify-between p-3 md:p-4 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-sm bg-amber-500/90 px-2 py-1 text-xs font-semibold tracking-wider text-black">
            <Film size={13} />
            EP.{String(episodeNumber).padStart(2, '0')}
          </span>
          <div className="flex flex-col">
            <h2 className="text-sm md:text-base font-bold text-white tracking-wide truncate max-w-[240px] md:max-w-md">
              {language === 'en' ? titleEn : titleKo}
            </h2>
            <span className="text-[11px] text-stone-400 truncate hidden sm:inline">
              {language === 'en' ? titleKo : titleEn}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Active VFX Indicator Badge */}
          <span className="hidden sm:flex items-center gap-1 rounded-sm border border-white/20 bg-black/60 px-2 py-1 text-[11px] text-amber-300">
            {currentScene?.vfxType === 'snow' && <CloudSnow size={12} />}
            {currentScene?.vfxType === 'embers' && <Flame size={12} />}
            {currentScene?.vfxType === 'runes' && <Sparkles size={12} />}
            {currentScene?.vfxType === 'slash' && <Sword size={12} />}
            {currentScene?.vfxType?.toUpperCase()}
          </span>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-sm border border-white/20 bg-black/70 text-white hover:bg-white/20 transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
          </button>

          {/* Close Button (if provided) */}
          {onClose && (
            <button
              onClick={onClose}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-sm border border-white/20 bg-black/70 text-white hover:bg-red-600 transition-colors"
              title="Close Player"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* 4. THEATRICAL SUBTITLE OVERLAY */}
      {subtitleMode !== 'off' && !isCompleted && (
        <div className="absolute bottom-16 md:bottom-20 inset-x-2 md:inset-x-8 z-20 flex flex-col items-center pointer-events-none">
          <div className="max-w-4xl rounded-sm border border-white/10 bg-black/85 px-4 py-2.5 backdrop-blur-md text-center shadow-lg transition-all duration-200">
            {/* Dialogue Speaker Tag if present */}
            {currentScene?.dialogues && currentScene.dialogues.length > 0 && (
              <div className="mb-1 flex items-center justify-center gap-1 text-xs font-bold text-amber-400">
                <span>[ {currentScene.dialogues[0].speaker} ]</span>
              </div>
            )}

            {/* Primary Language Subtitle */}
            <p className="text-sm md:text-base font-medium text-white leading-relaxed tracking-wide">
              {language === 'en' ? currentScene?.narrationEn : currentScene?.narrationKo}
            </p>

            {/* Secondary Language Subtitle (Dual Mode) */}
            {subtitleMode === 'dual' && (
              <p className="mt-1 text-xs text-stone-400 leading-normal tracking-tight">
                {language === 'en' ? currentScene?.narrationKo : currentScene?.narrationEn}
              </p>
            )}
          </div>
        </div>
      )}

      {/* 5. EPISODE COMPLETION CELEBRATION MODAL */}
      {isCompleted && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/90 p-6 text-center backdrop-blur-md">
          <div className="flex h-16 w-16 items-center justify-center rounded-sm border border-emerald-500/40 bg-emerald-950/60 text-emerald-400 mb-4 animate-bounce">
            <CheckCircle2 size={36} />
          </div>

          <span className="text-xs uppercase tracking-widest text-amber-400 mb-1">
            Episode Completed
          </span>
          <h3 className="text-xl md:text-2xl font-bold text-white mb-2">
            제 {episodeNumber}화 상영 완료!
          </h3>
          <p className="text-xs md:text-sm text-stone-300 max-w-md mb-6 leading-relaxed">
            {language === 'en'
              ? `You have experienced the full 20-scene cinematic adaptation of Episode ${episodeNumber}: ${titleEn}. Watching rewards have been unlocked!`
              : `제 ${episodeNumber}화: ${titleKo}의 전편 20씬 시네마틱 상영을 모두 감상하셨습니다. 시청 보상이 활성화되었습니다!`}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={handleReplayEpisode}
              className="flex min-h-[44px] items-center gap-2 rounded-sm border border-stone-600 bg-stone-900 px-5 text-sm font-semibold text-white hover:bg-stone-800 transition-colors"
            >
              <RotateCcw size={16} />
              <span>{language === 'en' ? 'Replay Episode' : '다시 보기'}</span>
            </button>

            {episodeNumber < totalEpisodes && onSelectEpisode && (
              <button
                onClick={handlePlayNextEpisode}
                className="flex min-h-[44px] items-center gap-2 rounded-sm border border-amber-500 bg-amber-500 px-6 text-sm font-bold text-black hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/20"
              >
                <span>{language === 'en' ? `Play Ep.${episodeNumber + 1}` : `다음 화 (제${episodeNumber + 1}화) 감상`}</span>
                <ChevronRight size={16} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* 6. BOTTOM PLAYBACK HUD & 20-SCENE SCRUBBER DOCK */}
      <div
        className={`absolute bottom-0 inset-x-0 z-20 flex flex-col bg-gradient-to-t from-black via-black/90 to-transparent p-2 md:p-3 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* 20-Scene Segmented Progress Bar */}
        <div className="mb-2 flex items-center gap-1 px-1">
          {scenes.map((_, idx) => {
            const isPast = idx < currentSceneIdx;
            const isCurrent = idx === currentSceneIdx;

            return (
              <button
                key={idx}
                onClick={() => handleJumpToScene(idx)}
                className="group relative flex-1 min-h-[44px] flex items-center py-2 cursor-pointer"
                title={`Jump to Scene ${idx + 1}`}
              >
                <div className="h-1.5 w-full rounded-none bg-stone-700/80 overflow-hidden transition-all group-hover:h-2.5">
                  <div
                    className={`h-full transition-all ${
                      isPast
                        ? 'w-full bg-amber-400'
                        : isCurrent
                        ? 'bg-amber-400'
                        : 'w-0'
                    }`}
                    style={isCurrent ? { width: `${sceneProgress}%` } : undefined}
                  />
                </div>

                {/* Hover Scene Number Pill */}
                <span className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity rounded-sm bg-black border border-white/20 px-1.5 py-0.5 text-[10px] text-amber-300 whitespace-nowrap">
                  씬 {idx + 1}
                </span>
              </button>
            );
          })}
        </div>

        {/* Control Button Strip (All 44px+ touch targets) */}
        <div className="flex flex-wrap items-center justify-between gap-1 px-1">
          {/* Left Controls: Prev, Play/Pause, Next, Scene Badge */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrevScene}
              disabled={currentSceneIdx === 0}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-sm border border-stone-700 bg-stone-900/80 text-white disabled:opacity-40 hover:bg-stone-800 transition-colors"
              title="Previous Scene (Left Arrow)"
            >
              <SkipBack size={18} />
            </button>

            <button
              onClick={handleTogglePlay}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-sm border border-amber-500 bg-amber-500 text-black font-bold hover:bg-amber-400 transition-colors shadow-md shadow-amber-500/20"
              title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
            >
              {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
            </button>

            <button
              onClick={handleNextScene}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-sm border border-stone-700 bg-stone-900/80 text-white hover:bg-stone-800 transition-colors"
              title="Next Scene (Right Arrow)"
            >
              <SkipForward size={18} />
            </button>

            <span className="ml-2 text-xs text-stone-300 hidden sm:inline">
              <span className="text-amber-400 font-bold">{currentSceneIdx + 1}</span> / {scenes.length}
            </span>
          </div>

          {/* Right Controls: Speed, TTS, Audio, Subtitles, Fullscreen */}
          <div className="flex items-center gap-1.5">
            {/* Speed Toggle */}
            <button
              onClick={handleCycleSpeed}
              className="flex min-h-[44px] px-2.5 items-center justify-center rounded-sm border border-stone-700 bg-stone-900/80 text-xs font-bold text-stone-200 hover:bg-stone-800 transition-colors"
              title="Playback Speed"
            >
              {playbackSpeed}x
            </button>

            {/* TTS Voiceover Toggle */}
            <button
              onClick={handleToggleTts}
              className={`flex min-h-[44px] min-w-[44px] items-center justify-center rounded-sm border transition-colors ${
                isTtsEnabled
                  ? 'border-amber-500/80 bg-amber-500/20 text-amber-300'
                  : 'border-stone-700 bg-stone-900/80 text-stone-400'
              }`}
              title={isTtsEnabled ? 'Voiceover TTS Enabled' : 'Voiceover TTS Disabled'}
            >
              {isTtsEnabled ? <Mic size={17} /> : <MicOff size={17} />}
            </button>

            {/* Subtitle Mode Button */}
            <button
              onClick={handleCycleSubtitle}
              className="flex min-h-[44px] px-2.5 items-center gap-1 rounded-sm border border-stone-700 bg-stone-900/80 text-xs text-stone-200 hover:bg-stone-800 transition-colors"
              title="Subtitle Mode: Dual / Single / Off"
            >
              <Languages size={15} />
              <span className="uppercase text-[11px] font-semibold">{subtitleMode}</span>
            </button>

            {/* Audio Mute Button */}
            <button
              onClick={handleToggleMute}
              className={`flex min-h-[44px] min-w-[44px] items-center justify-center rounded-sm border transition-colors ${
                isMuted
                  ? 'border-red-500/80 bg-red-950/40 text-red-400'
                  : 'border-stone-700 bg-stone-900/80 text-stone-200 hover:bg-stone-800'
              }`}
              title={isMuted ? 'Unmute Audio (M)' : 'Mute Audio (M)'}
            >
              {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
