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
import { MOVIE_EPISODES, getCharacterPortraitUrl } from '../../content/movieEpisodeMapping';
import WEBTOON_MANIFEST from '../../content/webtoonEpisodeManifest.json';
import { triggerHaptic } from '../../lib/haptic';

export interface CinematicDialogueItem {
  speakerKo?: string;
  speakerEn?: string;
  textKo: string;
  textEn: string;
  speaker?: string;
  text?: string;
  bubbleType?: 'thought' | 'speech' | 'shout';
  position?: 'bottom-left' | 'top-left' | 'bottom-right' | 'top-right' | 'center';
  characterCardId?: number;
}

export interface CinematicSfxCue {
  textKo: string;
  textEn: string;
  style?: 'slash' | 'impact' | 'magic' | 'rumble';
  position?: 'center' | 'top-right' | 'top-left' | 'bottom-left' | 'bottom-right';
}

export interface CinematicScene {
  sceneNumber: number;
  imageUrl: string;
  narrationKo: string;
  narrationEn: string;
  characters?: string[];
  dialogues?: CinematicDialogueItem[];
  sfxCues?: CinematicSfxCue[];
  vfxType?: MovieVfxType;
  cameraMotion?: 'pan-left' | 'pan-right' | 'zoom-in' | 'zoom-out' | 'shake';
  bgmTheme?: MovieBgmTheme;
  sfxTrigger?: MovieSfxType;
  durationSeconds?: number;
  type?: 'title_card' | 'scene';
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

// Scene generator from webtoonEpisodeManifest supporting all 40 episodes & 2,049 cutscenes
const buildScenesForEpisode = (epNum: number, language: 'ko' | 'en' | 'ja' = 'ko'): CinematicScene[] => {
  const manifest = WEBTOON_MANIFEST as Record<string, {
    episodeNumber: number;
    episodeTitle: string;
    totalImages: number;
    images: Array<{
      index: number;
      imageUrl: string;
      localArtUrl?: string;
      type: string;
      narrationEn?: string;
      narrationKo?: string;
      background?: string;
      characters?: string[];
      dialogues?: Array<{
        speakerKo?: string;
        speakerEn?: string;
        textKo: string;
        textEn: string;
        bubbleType?: 'thought' | 'speech' | 'shout';
        position?: 'bottom-left' | 'top-left' | 'bottom-right' | 'top-right' | 'center';
        characterCardId?: number;
      }>;
      sfxCues?: Array<{
        textKo: string;
        textEn: string;
        style?: 'slash' | 'impact' | 'magic' | 'rumble';
        position?: 'center' | 'top-right' | 'top-left' | 'bottom-left' | 'bottom-right';
      }>;
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
    // Fallback if manifest is missing
    return Array.from({ length: 20 }, (_, i) => ({
      sceneNumber: i + 1,
      imageUrl: `/images/webtoon/episode_${String(epNum).padStart(2, '0')}/scene_${String(i + 1).padStart(2, '0')}.webp`,
      narrationKo: `제 ${epNum}화 ${meta?.titleKo || ''} - 씬 ${i + 1}`,
      narrationEn: `Episode ${epNum} ${meta?.titleEn || ''} - Scene ${i + 1}`,
      cameraMotion: motionCycle[i % motionCycle.length],
      vfxType: defaultVfx,
      bgmTheme: defaultTheme,
      durationSeconds: 6,
    }));
  }

  // Load ALL cutscenes: scene_00.webp (index 0 title card) through scene_XX.webp (100% of episode cutscenes)
  const targetImages = epData.images;

  return targetImages.map((img, idx) => {
    const textKo = img.narrationKo || '';
    const textEn = img.narrationEn || '';
    const sfxCues: CinematicSfxCue[] = img.sfxCues || [];
    const characters: string[] = img.characters || [];

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

    // Smart SFX trigger: priority to structured sfxCues, then text heuristics
    let sfxTrigger: MovieSfxType | undefined = undefined;
    if (sfxCues.length > 0) {
      const firstStyle = sfxCues[0].style;
      if (firstStyle === 'slash') sfxTrigger = 'sword-strike';
      else if (firstStyle === 'magic') sfxTrigger = 'magic-cast';
      else if (firstStyle === 'impact') sfxTrigger = 'thunder-impact';
      else if (firstStyle === 'rumble') sfxTrigger = 'shield-block';
    } else if (textKo.includes('검') || textKo.includes('칼날') || textEn.toLowerCase().includes('sword')) {
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
    if (idx === targetImages.length - 2 || textKo.includes('폭발') || textKo.includes('일격') || textEn.toLowerCase().includes('clash') || (sfxCues.length > 0 && sfxCues[0].style === 'impact')) {
      motion = 'shake';
    }

    const dialogues: CinematicDialogueItem[] = (img.dialogues || []).map((d) => ({
      speakerKo: d.speakerKo,
      speakerEn: d.speakerEn,
      textKo: d.textKo,
      textEn: d.textEn,
      speaker: (language === 'ko' ? d.speakerKo : d.speakerEn) || d.speakerKo || d.speakerEn || '',
      text: (language === 'ko' ? d.textKo : d.textEn) || d.textKo || d.textEn || '',
      bubbleType: d.bubbleType,
      position: d.position,
      characterCardId: d.characterCardId,
    }));

    // Dynamic scene timing based on English word count and speech synthesis length
    const enWords = (textEn + ' ' + (img.dialogues?.map((d) => d.textEn).join(' ') || ''))
      .split(/\s+/)
      .filter(Boolean).length;
    const isTitleCard = img.type === 'title_card' || img.index === 0;
    const dynamicDuration = isTitleCard
      ? 4.5
      : Math.max(4.5, Math.min(14.0, 3.2 + enWords * 0.38));

    return {
      sceneNumber: idx + 1,
      imageUrl: img.localArtUrl || img.imageUrl || `/images/webtoon/episode_${String(epNum).padStart(2, '0')}/scene_${String(idx).padStart(2, '0')}.webp`,
      narrationKo: textKo,
      narrationEn: textEn,
      characters,
      dialogues,
      sfxCues,
      cameraMotion: motion,
      vfxType: sceneVfx,
      bgmTheme: defaultTheme,
      sfxTrigger,
      durationSeconds: dynamicDuration,
      type: (img.type as any) || (img.index === 0 ? 'title_card' : 'scene'),
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
  const [isCcEnabled, setIsCcEnabled] = useState<boolean>(true);
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

  // Characters present in current scene (manifest characters + dialogue speakers)
  const sceneCharacterNames: string[] = Array.from(
    new Set([
      ...(currentScene?.characters || []),
      ...(currentScene?.dialogues || [])
        .map((d) => d.speakerEn)
        .filter((s): s is string => Boolean(s && s !== 'Narration' && s !== '내레이션')),
    ])
  );

  const activeSpeakerDialogue = currentScene?.dialogues?.find(
    (d) => d.speakerEn && d.speakerEn !== 'Narration' && d.speakerEn !== '내레이션'
  );
  const activeSpeakerName = activeSpeakerDialogue?.speakerEn?.toLowerCase();
  const activeSpeakerCardId = activeSpeakerDialogue?.characterCardId;

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

  // 1. Episode BGM Lifecycle: Starts continuous BGM on playback & persists across scenes
  useEffect(() => {
    if (isPlaying && !isMuted) {
      const meta = MOVIE_EPISODES[episodeNumber];
      const episodeTheme = meta?.bgmTheme || currentScene?.bgmTheme || 'arcane-mystery';
      movieAudio.startEpisodeBgm(episodeNumber, episodeTheme);
    }
  }, [episodeNumber, isPlaying, isMuted, currentScene?.bgmTheme]);

  // Clean unmount audio stop
  useEffect(() => {
    return () => {
      movieAudio.stopAll();
    };
  }, []);

  // 2. Audio SFX & English TTS voiceover on scene change (WITHOUT cutting episode BGM)
  useEffect(() => {
    if (!currentScene) return;

    // Trigger one-shot combat sound effect
    if (currentScene.sfxTrigger) {
      movieAudio.playSfx(currentScene.sfxTrigger);
    }

    // English-Base TTS Voiceover (Requirement R2)
    // Always speaks English narrationEn and English dialogues using English SpeechSynthesis
    if (isTtsEnabled && isPlaying && !isMuted) {
      const dialogueLines = (currentScene.dialogues || [])
        .map((d) => (d.speakerEn ? `${d.speakerEn}: ${d.textEn}` : d.textEn))
        .filter(Boolean);
      const fullEnglishScript = [
        ...dialogueLines,
        currentScene.narrationEn,
      ].filter(Boolean).join('. ');

      if (fullEnglishScript) {
        movieAudio.speakEnglishNarration(fullEnglishScript);
      }
    } else {
      movieAudio.stopNarration();
    }

    return () => {
      movieAudio.stopNarration();
    };
  }, [currentSceneIdx, currentScene, isTtsEnabled, isPlaying, isMuted]);

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
    const willPlay = !isPlaying;
    setIsPlaying(willPlay);
    movieAudio.initAudio().then(() => {
      if (willPlay) {
        const meta = MOVIE_EPISODES[episodeNumber];
        const episodeTheme = meta?.bgmTheme || currentScene?.bgmTheme || 'arcane-mystery';
        movieAudio.startEpisodeBgm(episodeNumber, episodeTheme);
      }
    });
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

  const handleToggleCc = () => {
    triggerHaptic('light');
    setIsCcEnabled((prev) => !prev);
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
    movieAudio.initAudio().then(() => {
      const meta = MOVIE_EPISODES[episodeNumber];
      const episodeTheme = meta?.bgmTheme || currentScene?.bgmTheme || 'arcane-mystery';
      movieAudio.startEpisodeBgm(episodeNumber, episodeTheme);
    });
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
      } else if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        handleToggleCc();
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
              '/images/webtoon/episode_01/scene_00.webp';
          }}
        />

        {/* Cinematic Vignette & Lighting Gradient */}
        <div className="pointer-events-none absolute inset-0 bg-radial-[circle_at_center,transparent_40%,rgba(0,0,0,0.7)_100%]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/80 via-black/30 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-black/95 via-black/60 to-transparent" />
      </div>

      {/* 2. HTML5 PARTICLE VFX CANVAS OVERLAY */}
      <MovieVfxCanvas vfxType={currentScene?.vfxType || 'none'} intensity={1.1} />

      {/* 2.5 ANIMATED COMBAT ONOMATOPOEIA (SFX) OVERLAY */}
      {currentScene?.sfxCues && currentScene.sfxCues.length > 0 && !isCompleted && (
        <div className="absolute inset-0 pointer-events-none z-25 overflow-hidden">
          {currentScene.sfxCues.map((sfx, idx) => {
            const positionClass = {
              'center': 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
              'top-right': 'top-14 right-6 sm:right-12',
              'top-left': 'top-14 left-6 sm:left-12',
              'bottom-right': 'bottom-24 right-6 sm:right-12',
              'bottom-left': 'bottom-24 left-6 sm:left-12',
            }[sfx.position || 'center'];

            const styleClass = {
              slash: 'text-red-500 italic -rotate-12 border-red-500/80 drop-shadow-[0_4px_16px_rgba(239,68,68,0.9)] scale-110',
              impact: 'text-amber-400 rotate-6 border-amber-400/80 drop-shadow-[0_4px_16px_rgba(251,191,36,0.9)] scale-125',
              magic: 'text-cyan-400 -rotate-3 border-cyan-400/80 drop-shadow-[0_4px_16px_rgba(6,182,212,0.9)] scale-110',
              rumble: 'text-stone-300 rotate-1 border-stone-400/80 drop-shadow-[0_4px_16px_rgba(214,211,209,0.9)] scale-105',
            }[sfx.style || 'impact'];

            return (
              <div
                key={`${currentSceneIdx}_sfx_${idx}`}
                className={`absolute font-mono font-black select-none pointer-events-auto cursor-pointer ${positionClass} animate-in zoom-in-75 duration-200`}
                onClick={() => {
                  if (sfx.style === 'slash') movieAudio.playSfx('sword-strike');
                  else if (sfx.style === 'magic') movieAudio.playSfx('magic-cast');
                  else if (sfx.style === 'impact') movieAudio.playSfx('thunder-impact');
                  else movieAudio.playSfx('shield-block');
                }}
                title="Click to replay SFX"
              >
                <div className={`px-4 py-1.5 bg-black/85 rounded-none border-2 backdrop-blur-sm text-2xl md:text-4xl tracking-widest ${styleClass}`}>
                  <span>{sfx.textEn}</span>
                  <span className="block text-[11px] font-medium text-stone-300 tracking-normal text-center mt-0.5">
                    {sfx.textKo}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 2.6 ACTIVE CHARACTER PORTRAIT DOCK & STAGE DIALOGUE */}
      {sceneCharacterNames.length > 0 && !isCompleted && (
        <div className="absolute bottom-24 sm:bottom-28 left-3 sm:left-6 z-20 flex flex-col gap-2 pointer-events-none max-w-[85vw] sm:max-w-md">
          {/* Floating English Dialogue Speech Box on the stage */}
          {activeSpeakerDialogue && (
            <div className="flex items-center gap-2 rounded-sm border border-amber-400/80 bg-black/85 px-3 py-1.5 backdrop-blur-md shadow-xl animate-in fade-in duration-200">
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5 text-xs font-black text-amber-400">
                  <span>[{activeSpeakerDialogue.speakerEn || activeSpeakerDialogue.speaker}]</span>
                  {activeSpeakerDialogue.bubbleType && (
                    <span className="text-[10px] uppercase text-stone-400">({activeSpeakerDialogue.bubbleType})</span>
                  )}
                </div>
                <p className="text-xs sm:text-sm font-semibold text-white leading-snug">
                  "{activeSpeakerDialogue.textEn || activeSpeakerDialogue.text}"
                </p>
              </div>
            </div>
          )}

          {/* Character Portraits Dock */}
          <div className="flex items-end gap-2 overflow-x-auto py-1">
            {sceneCharacterNames.map((charName) => {
              const isSpeaking = activeSpeakerName
                ? charName.toLowerCase() === activeSpeakerName
                : false;
              const portraitUrl = getCharacterPortraitUrl(
                isSpeaking ? activeSpeakerCardId : undefined,
                charName
              );

              return (
                <div
                  key={charName}
                  className={`relative transition-all duration-300 shrink-0 ${
                    isSpeaking
                      ? 'scale-110 z-10 translate-y-[-4px]'
                      : 'scale-90 opacity-45 grayscale-40 brightness-75 z-0'
                  }`}
                >
                  <div
                    className={`h-16 w-14 sm:h-20 sm:w-16 overflow-hidden rounded-none border ${
                      isSpeaking
                        ? 'border-2 border-amber-400 ring-4 ring-amber-400/40 shadow-[0_0_18px_rgba(251,191,36,0.8)] bg-amber-950/40'
                        : 'border-stone-700 bg-stone-900/70'
                    }`}
                  >
                    <img
                      src={portraitUrl}
                      alt={charName}
                      className="h-full w-full object-cover object-top"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>

                  {/* Active Speaker Badge & Aura Pulse */}
                  {isSpeaking && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap">
                      <span className="flex items-center gap-1 rounded-none bg-amber-400 px-1.5 py-0.5 font-mono text-[9px] font-black uppercase tracking-wider text-black shadow-md animate-pulse">
                        <span className="h-1.5 w-1.5 rounded-full bg-red-600 animate-ping" />
                        {charName}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

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
      {isCcEnabled && subtitleMode !== 'off' && !isCompleted && (
        <div className="absolute bottom-16 md:bottom-20 inset-x-2 md:inset-x-8 z-20 flex flex-col items-center pointer-events-none">
          <div className="max-w-4xl rounded-sm border border-white/10 bg-black/85 px-4 py-2.5 backdrop-blur-md text-center shadow-lg transition-all duration-200">
            {/* Dialogue Speaker Tag if present */}
            {currentScene?.dialogues && currentScene.dialogues.length > 0 && (
              <div className="mb-1 flex items-center justify-center gap-1 text-xs font-bold text-amber-400">
                <span>
                  [{' '}
                  {language === 'en'
                    ? (currentScene.dialogues[0].speakerEn || currentScene.dialogues[0].speaker)
                    : (currentScene.dialogues[0].speakerKo || currentScene.dialogues[0].speaker)}{' '}
                  ]
                </span>
              </div>
            )}

            {/* Primary Language Subtitle */}
            <p className="text-sm md:text-base font-medium text-white leading-relaxed tracking-wide">
              {language === 'en'
                ? (currentScene?.dialogues?.[0]?.textEn || currentScene?.narrationEn)
                : (currentScene?.dialogues?.[0]?.textKo || currentScene?.narrationKo)}
            </p>

            {/* Secondary Language Subtitle (Dual Mode) */}
            {subtitleMode === 'dual' && (
              <p className="mt-1 text-xs text-stone-400 leading-normal tracking-tight">
                {language === 'en'
                  ? (currentScene?.dialogues?.[0]?.textKo || currentScene?.narrationKo)
                  : (currentScene?.dialogues?.[0]?.textEn || currentScene?.narrationEn)}
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
              ? `You have experienced the full ${scenes.length}-scene cinematic adaptation of Episode ${episodeNumber}: ${titleEn}. Watching rewards have been unlocked!`
              : `제 ${episodeNumber}화: ${titleKo}의 전편 ${scenes.length}씬 시네마틱 상영을 모두 감상하셨습니다. 시청 보상이 활성화되었습니다!`}
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

      {/* 6. BOTTOM PLAYBACK HUD & FLUID 40-55 SCENES SCRUBBER DOCK */}
      <div
        className={`absolute bottom-0 inset-x-0 z-20 flex flex-col bg-gradient-to-t from-black via-black/90 to-transparent p-2 md:p-3 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Continuous Fluid Scrubber Track (Handles 40-55 scenes with zero overflow) */}
        <div className="mb-2 relative flex items-center px-1">
          <div className="relative w-full h-2.5 bg-stone-800/90 rounded-none overflow-hidden cursor-pointer group">
            {/* Progress Fill */}
            <div
              className="h-full bg-amber-400 transition-all duration-75"
              style={{
                width: `${Math.min(100, Math.max(0, ((currentSceneIdx + sceneProgress / 100) / scenes.length) * 100))}%`,
              }}
            />

            {/* Subtle Milestone Dividers for 40-55 scenes */}
            <div className="absolute inset-0 flex justify-between pointer-events-none opacity-30">
              {Array.from({ length: Math.min(10, scenes.length) }).map((_, i) => (
                <div key={i} className="w-[1px] h-full bg-white/40" />
              ))}
            </div>
          </div>

          {/* Interactive Range Input Overlay */}
          <input
            type="range"
            min={0}
            max={Math.max(0, scenes.length - 1)}
            value={currentSceneIdx}
            onChange={(e) => handleJumpToScene(Number(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            title={`Scrub Scenes (Current: ${currentSceneIdx + 1}/${scenes.length})`}
          />
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

            {/* Scene Position Badge */}
            <span className="ml-1 sm:ml-2 text-xs text-stone-300 font-mono flex items-center gap-1">
              <span className="text-amber-400 font-bold">{currentSceneIdx + 1}</span>
              <span>/</span>
              <span>{scenes.length}</span>
              {currentScene?.type === 'title_card' && (
                <span className="ml-1 px-1 py-0.5 text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-none hidden sm:inline">
                  [TITLE]
                </span>
              )}
            </span>
          </div>

          {/* Right Controls: Speed, TTS, CC Toggle, Subtitles, Audio Mute */}
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
              title={isTtsEnabled ? 'English Voiceover TTS Enabled' : 'Voiceover TTS Disabled'}
            >
              {isTtsEnabled ? <Mic size={17} /> : <MicOff size={17} />}
            </button>

            {/* Dedicated CC ON/OFF Toggle Button */}
            <button
              onClick={handleToggleCc}
              className={`flex min-h-[44px] px-2.5 items-center gap-1 rounded-sm border font-mono text-xs transition-colors ${
                isCcEnabled
                  ? 'border-amber-400 bg-amber-400/20 text-amber-300'
                  : 'border-stone-700 bg-stone-900/80 text-stone-500'
              }`}
              title={isCcEnabled ? '자막 끄기 (CC OFF)' : '자막 켜기 (CC ON)'}
            >
              <Languages size={15} />
              <span className="font-bold text-[11px]">CC {isCcEnabled ? 'ON' : 'OFF'}</span>
            </button>

            {/* Subtitle Mode Button (Dual / Primary) */}
            {isCcEnabled && (
              <button
                onClick={handleCycleSubtitle}
                className="hidden sm:flex min-h-[44px] px-2 items-center gap-1 rounded-sm border border-stone-700 bg-stone-900/80 text-xs text-stone-200 hover:bg-stone-800 transition-colors"
                title="Subtitle Mode: Dual / Single"
              >
                <span className="uppercase text-[10px] font-semibold">{subtitleMode}</span>
              </button>
            )}

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
