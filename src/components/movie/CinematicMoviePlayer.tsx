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
 const isTitleCard = img.type === 'title_card' || img.index === 0;
 const textKo = isTitleCard
 ? `제 ${epNum}화: ${meta?.titleKo || img.narrationKo || ''}`
 : (img.narrationKo || '');
 const textEn = isTitleCard
 ? `Episode ${epNum}: ${meta?.titleEn || img.narrationEn || ''}`
 : (img.narrationEn || '');
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

 // Dynamic scene timing based on primary language character/word count and speech synthesis length
 const koChars = (textKo || '').replace(/\s+/g, '').length;
 const enWords = (textEn + ' ' + (img.dialogues?.map((d) => d.textEn).join(' ') || ''))
 .split(/\s+/)
 .filter(Boolean).length;
 const estimatedKoSec = 3.2 + koChars * 0.16;
 const estimatedEnSec = 3.2 + enWords * 0.38;
 const dynamicDuration = isTitleCard
 ? 4.8
 : Math.max(
 5.5,
 Math.min(20.0, language === 'en' ? estimatedEnSec : Math.max(estimatedKoSec, estimatedEnSec))
 );

 return {
 sceneNumber: idx + 1,
 imageUrl: `${(img.localArtUrl || img.imageUrl || `/images/webtoon/episode_${String(epNum).padStart(2, '0')}/scene_${String(idx).padStart(2, '0')}.webp`).split('?')[0]}?v=conquest2009_v4`,
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
 const [isCcEnabled, setIsCcEnabled] = useState<boolean>(false);
 const [subtitleMode, setSubtitleMode] = useState<'primary' | 'dual' | 'off'>('off');
 const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
 const [showControls, setShowControls] = useState<boolean>(true);
 const [isCompleted, setIsCompleted] = useState<boolean>(false);
 const [sceneProgress, setSceneProgress] = useState<number>(0); // 0 to 100%

 const controlsTimeoutRef = useRef<number | null>(null);
 const progressTimerRef = useRef<number | null>(null);
 const prevEpisodeRef = useRef<{ ep: number; lang: string; init: CinematicScene[] | undefined }>({
 ep: episodeNumber,
 lang: language,
 init: initialScenes,
 });

 // When episodeNumber or language changes after initial mount, rebuild scenes
 useEffect(() => {
 const prev = prevEpisodeRef.current;
 if (prev.ep === episodeNumber && prev.lang === language && prev.init === initialScenes) {
 return;
 }
 const episodeChanged = prev.ep !== episodeNumber || prev.init !== initialScenes;
 prevEpisodeRef.current = { ep: episodeNumber, lang: language, init: initialScenes };

 const newScenes = initialScenes && initialScenes.length > 0
 ? initialScenes
 : buildScenesForEpisode(episodeNumber, language);
 setScenes(newScenes);
 if (episodeChanged) {
 setCurrentSceneIdx(0);
 setIsCompleted(false);
 setSceneProgress(0);
 }
 }, [episodeNumber, initialScenes, language]);

 const currentScene = scenes[currentSceneIdx] || scenes[0];

 // Primary language for subtitles and TTS (Default: Primary Subtitle Language)
 const primaryTtsLang: 'ko' | 'en' | 'ja' =
 language === 'en' ? 'en' : language === 'ja' ? 'ja' : 'ko';

  // Clean 1:1 Primary Subtitle script for TTS voiceover
  const getScenePrimaryTtsScript = useCallback(
    (scene: CinematicScene | undefined): string => {
      if (!scene) return '';
      if (scene.type === 'title_card' || scene.sceneNumber === 1) {
        if (primaryTtsLang === 'en') {
          return `Episode ${episodeNumber}. ${titleEn || ''}.`.trim();
        }
        return `제 ${episodeNumber}화. ${titleKo || ''}.`.trim();
      }

      if (primaryTtsLang === 'en') {
        return (scene.dialogues?.[0]?.textEn || scene.narrationEn || '').trim();
      }

      return (scene.dialogues?.[0]?.textKo || scene.narrationKo || scene.narrationEn || '').trim();
    },
    [episodeNumber, titleKo, titleEn, primaryTtsLang]
  );

  // Advance to the next scene (or finish episode) with idempotent scene index guard
  const advanceToNextScene = useCallback(
    (fromSceneIdx: number) => {
      setCurrentSceneIdx((prevIdx) => {
        if (prevIdx !== fromSceneIdx) return prevIdx;
        if (prevIdx < scenes.length - 1) {
          setSceneProgress(0);
          return prevIdx + 1;
        } else {
          setIsPlaying(false);
          setIsCompleted(true);
          movieAudio.playSfx('victory-chime');
          if (onEpisodeComplete) {
            onEpisodeComplete(episodeNumber);
          }
          setSceneProgress(100);
          return prevIdx;
        }
      });
    },
    [scenes.length, episodeNumber, onEpisodeComplete]
  );

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

  // 2. Audio SFX & Primary Language TTS voiceover on scene change -> When TTS ends, immediately advance to next scene!
  useEffect(() => {
    if (!isPlaying || isCompleted) {
      movieAudio.stopNarration();
      return;
    }

    const activeScene = scenes[currentSceneIdx] || scenes[0];
    if (!activeScene) return;

    // Trigger one-shot combat sound effect
    if (activeScene.sfxTrigger && !isMuted) {
      movieAudio.playSfx(activeScene.sfxTrigger);
    }

    // Primary Subtitle-Base TTS Voiceover: advances to next scene immediately upon TTS completion
    if (isTtsEnabled && !isMuted) {
      const primaryScript = getScenePrimaryTtsScript(activeScene);
      const targetSceneIdx = currentSceneIdx;
      if (primaryScript) {
        movieAudio.speakNarration(
          primaryScript,
          primaryTtsLang,
          () => {
            advanceToNextScene(targetSceneIdx);
          },
          playbackSpeed
        );
      } else {
        advanceToNextScene(targetSceneIdx);
      }
    } else {
      movieAudio.stopNarration();
    }
  }, [
    episodeNumber,
    currentSceneIdx,
    scenes,
    isTtsEnabled,
    isPlaying,
    isCompleted,
    isMuted,
    primaryTtsLang,
    playbackSpeed,
    getScenePrimaryTtsScript,
    advanceToNextScene,
  ]);

  // Scene progress bar ticker (when TTS is enabled, TTS onEnd drives scene transition; timer only drives visual progress or non-TTS advance)
  useEffect(() => {
    if (!isPlaying || isCompleted) {
      if (progressTimerRef.current) window.clearInterval(progressTimerRef.current);
      return;
    }

    const durationSec = (currentScene?.durationSeconds || 6.5) / playbackSpeed;
    const intervalMs = 50;
    const increment = (intervalMs / (durationSec * 1000)) * 100;
    const targetSceneIdx = currentSceneIdx;

    setSceneProgress(0);
    let elapsedTicks = 0;

    progressTimerRef.current = window.setInterval(() => {
      elapsedTicks += 1;
      const nextProgress = elapsedTicks * increment;

      if (isTtsEnabled && !isMuted) {
        // TTS 활성 시: TTS 종료 콜백(onEnd)이 즉시 다음 씬으로 이동시키므로 프로그레스 바는 97%까지 부드럽게 진행
        setSceneProgress(Math.min(97, nextProgress));
        // 만약 비정상 예외로 TTS가 이미 완전히 종료되었고 충분한 시간이 지났다면 안전 폴백으로 다음 씬 이동
        if (nextProgress >= 120 && !movieAudio.isSpeaking()) {
          advanceToNextScene(targetSceneIdx);
        }
      } else {
        // TTS 비활성 또는 음소거 시: 타이머 완료 시 다음 씬으로 이동
        if (nextProgress >= 100) {
          advanceToNextScene(targetSceneIdx);
        } else {
          setSceneProgress(nextProgress);
        }
      }
    }, intervalMs);

    return () => {
      if (progressTimerRef.current) window.clearInterval(progressTimerRef.current);
    };
  }, [
    currentSceneIdx,
    isPlaying,
    isCompleted,
    playbackSpeed,
    currentScene,
    isTtsEnabled,
    isMuted,
    advanceToNextScene,
  ]);

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

  // Ensure any pointer gesture inside the player unlocks Web Audio + SpeechSynthesis if blocked by browser autoplay policy
  const handleUserAudioUnlock = useCallback(() => {
    movieAudio.unlockSpeech();
    movieAudio.initAudio().then(() => {
      if (isPlaying && !isMuted) {
        const meta = MOVIE_EPISODES[episodeNumber];
        const episodeTheme = meta?.bgmTheme || currentScene?.bgmTheme || 'arcane-mystery';
        movieAudio.startEpisodeBgm(episodeNumber, episodeTheme);
      }
    });
  }, [isPlaying, isMuted, episodeNumber, currentScene?.bgmTheme]);

  // Controls Handlers
  const handleTogglePlay = () => {
    triggerHaptic('light');
    movieAudio.unlockSpeech();
    const willPlay = !isPlaying;
    setIsPlaying(willPlay);
    movieAudio.initAudio().then(() => {
      if (willPlay && !isMuted) {
        const meta = MOVIE_EPISODES[episodeNumber];
        const episodeTheme = meta?.bgmTheme || currentScene?.bgmTheme || 'arcane-mystery';
        movieAudio.startEpisodeBgm(episodeNumber, episodeTheme);
      }
    });
    if (!willPlay) {
      movieAudio.stopNarration();
    }
    resetControlsTimeout();
  };

  const handlePrevScene = () => {
    triggerHaptic('light');
    movieAudio.unlockSpeech();
    movieAudio.playSfx('whoosh');
    setCurrentSceneIdx((prev) => Math.max(0, prev - 1));
    setSceneProgress(0);
    resetControlsTimeout();
  };

  const handleNextScene = () => {
    triggerHaptic('light');
    movieAudio.unlockSpeech();
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
    movieAudio.unlockSpeech();
    movieAudio.playSfx('whoosh');
    setCurrentSceneIdx(idx);
    setSceneProgress(0);
    setIsCompleted(false);
    resetControlsTimeout();
  };

  const handleToggleMute = () => {
    triggerHaptic('light');
    movieAudio.unlockSpeech();
    const nextMuted = !isMuted;
    movieAudio.setMuted(nextMuted);
    setIsMuted(nextMuted);
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
    const modes: Array<'primary' | 'dual' | 'off'> = ['primary', 'dual', 'off'];
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
    movieAudio.unlockSpeech();
    const nextTts = !isTtsEnabled;
    if (!nextTts) {
      movieAudio.stopNarration();
    }
    setIsTtsEnabled(nextTts);
    resetControlsTimeout();
  };

 const handleReplayEpisode = () => {
 triggerHaptic('medium');
 movieAudio.unlockSpeech();
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
 onPointerDown={handleUserAudioUnlock}
 onMouseMove={resetControlsTimeout}
 onTouchStart={resetControlsTimeout}
 className={`flex flex-col w-full overflow-hidden bg-[#0e0c0c] font-mono select-none ${
 isFullscreen ? 'fixed inset-0 z-50 h-[100dvh] w-screen justify-between' : 'rounded-none border-y border-x-0 border-white/15'
 }`}
 >
 {/* UNOBSTRUCTED 16:9 KEN BURNS MOTION STAGE (Zero Top Label Bar) */}
 <div className={`relative w-full overflow-hidden bg-black ${isFullscreen ? 'flex-1 min-h-0' : 'aspect-video'}`}>
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
 (e.target as HTMLImageElement).src =
 '/images/webtoon/episode_01/scene_00.webp';
 }}
 />

 {/* Subtle Cinematic Edge Vignette Only */}
 <div className="pointer-events-none absolute inset-0 bg-radial-[circle_at_center,transparent_65%,rgba(0,0,0,0.45)_100%]" />
 </div>

 {/* HTML5 PARTICLE VFX CANVAS OVERLAY */}
 <MovieVfxCanvas vfxType={currentScene?.vfxType || 'none'} intensity={0.9} />

 {/* EPISODE COMPLETION CELEBRATION MODAL */}
 {isCompleted && (
 <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/90 p-4 sm:p-6 text-center backdrop-blur-md">
 <div className="flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-sm border border-emerald-500/40 bg-emerald-950/60 text-emerald-400 mb-3">
 <CheckCircle2 size={30} />
 </div>

 <span className="text-[11px] uppercase tracking-widest text-amber-400 mb-1">
 Episode Completed
 </span>
 <h3 className="text-lg sm:text-2xl font-bold text-white mb-1.5">
 제 {episodeNumber}화 상영 완료!
 </h3>
 <p className="text-xs sm:text-sm text-stone-300 max-w-md mb-4 leading-relaxed">
 {language === 'en'
 ? `You have experienced the full ${scenes.length}-scene cinematic adaptation of Episode ${episodeNumber}: ${titleEn}.`
 : `제 ${episodeNumber}화: ${titleKo}의 전편 ${scenes.length}씬 시네마틱 상영을 모두 감상하셨습니다!`}
 </p>

 <div className="flex flex-wrap items-center justify-center gap-2.5">
 <button
 onClick={handleReplayEpisode}
 className="flex min-h-[44px] items-center gap-2 rounded-sm border border-stone-600 bg-stone-900 px-4 text-xs sm:text-sm font-semibold text-white hover:bg-stone-800 transition-colors"
 >
 <RotateCcw size={15} />
 <span>{language === 'en' ? 'Replay Episode' : '다시 보기'}</span>
 </button>

 {episodeNumber < totalEpisodes && onSelectEpisode && (
 <button
 onClick={handlePlayNextEpisode}
 className="flex min-h-[44px] items-center gap-2 rounded-sm border border-amber-500 bg-amber-500 px-5 text-xs sm:text-sm font-bold text-black hover:bg-amber-400 transition-colors"
 >
 <span>{language === 'en' ? `Play Ep.${episodeNumber + 1}` : `다음 화 (제${episodeNumber + 1}화) 감상`}</span>
 <ChevronRight size={15} />
 </button>
 )}
 </div>
 </div>
 )}
 </div>

 {/* 3. DEDICATED CHARACTER DOCK & SUBTITLE DECK (Below the video stage — never covers the artwork!) */}
 {!isCompleted && (
 <div className="bg-[#121010] border-t border-white/10 px-3 py-2.5 flex flex-col gap-2 shrink-0">
 {/* Character Portraits Row + Active Speaking Character Highlight */}
 {sceneCharacterNames.length > 0 && (
 <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
 <div className="flex items-center gap-1.5 shrink-0">
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
 className={`relative flex items-center gap-1.5 transition-all duration-200 shrink-0 ${
 isSpeaking
 ? 'scale-105 z-10'
 : 'scale-95 opacity-45 grayscale-40 brightness-75 z-0'
 }`}
 >
 <div
 className={`h-10 w-9 sm:h-12 sm:w-10 overflow-hidden rounded-none border ${
 isSpeaking
 ? 'border-2 border-amber-400 ring-4 ring-amber-400/40 bg-amber-950/40'
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

 {isSpeaking && (
 <span className="rounded-none bg-amber-400 px-1.5 py-0.5 font-mono text-[10px] font-black uppercase tracking-wider text-black">
 [{language === 'en' ? charName : (activeSpeakerDialogue?.speakerKo || charName)}]
 </span>
 )}
 </div>
 );
 })}
 </div>
 </div>
 )}

 {/* Synchronized Multi-Language Subtitle Box (Default: Primary Subtitle) */}
 {isCcEnabled && subtitleMode !== 'off' && (
 <div className="rounded-sm border border-white/10 bg-black/70 px-3 py-2 text-left sm:text-center">
 {/* Primary Language Subtitle (User's selected language, or English for English users) */}
 <p className="text-xs sm:text-sm font-medium text-white leading-relaxed">
 {currentScene?.dialogues && currentScene.dialogues.length > 0 && (
 <span className="font-bold text-amber-400 mr-1.5">
 [
 {language === 'en'
 ? (currentScene.dialogues[0].speakerEn || currentScene.dialogues[0].speaker)
 : (currentScene.dialogues[0].speakerKo || currentScene.dialogues[0].speaker)}
 ]
 </span>
 )}
 {language === 'en'
 ? (currentScene?.dialogues?.[0]?.textEn || currentScene?.narrationEn)
 : (currentScene?.dialogues?.[0]?.textKo || currentScene?.narrationKo)}
 </p>

 {/* Secondary English/Korean Subtitle when Dual Mode is explicitly selected */}
 {subtitleMode === 'dual' && (
 <p className="mt-1 text-[11px] text-stone-400 leading-normal">
 {language === 'en'
 ? (currentScene?.dialogues?.[0]?.textKo || currentScene?.narrationKo)
 : (currentScene?.dialogues?.[0]?.textEn || currentScene?.narrationEn)}
 </p>
 )}
 </div>
 )}
 </div>
 )}

 {/* 4. BOTTOM PLAYBACK HUD & FLUID SCRUBBER DOCK (Placed cleanly below the subtitle deck) */}
 <div className="flex flex-col bg-[#181515] border-t border-white/10 p-2 sm:p-3 shrink-0">
 {/* Continuous Fluid Scrubber Track */}
 <div className="mb-2 relative flex items-center px-1">
 <div className="relative w-full h-2 bg-stone-800 rounded-none overflow-hidden cursor-pointer">
 <div
 className="h-full bg-amber-400 transition-all duration-75"
 style={{
 width: `${Math.min(100, Math.max(0, ((currentSceneIdx + sceneProgress / 100) / scenes.length) * 100))}%`,
 }}
 />
 <div className="absolute inset-0 flex justify-between pointer-events-none opacity-30">
 {Array.from({ length: Math.min(10, scenes.length) }).map((_, i) => (
 <div key={i} className="w-[1px] h-full bg-white/40" />
 ))}
 </div>
 </div>

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
 className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-sm border border-stone-700 bg-stone-900 text-white disabled:opacity-40 hover:bg-stone-800 transition-colors"
 title="Previous Scene (Left Arrow)"
 >
 <SkipBack size={18} />
 </button>

 <button
 onClick={handleTogglePlay}
 className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-sm border border-amber-500 bg-amber-500 text-black font-bold hover:bg-amber-400 transition-colors"
 title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
 >
 {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
 </button>

 <button
 onClick={handleNextScene}
 className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-sm border border-stone-700 bg-stone-900 text-white hover:bg-stone-800 transition-colors"
 title="Next Scene (Right Arrow)"
 >
 <SkipForward size={18} />
 </button>

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
 <button
 onClick={handleCycleSpeed}
 className="flex min-h-[44px] px-2.5 items-center justify-center rounded-sm border border-stone-700 bg-stone-900 text-xs font-bold text-stone-200 hover:bg-stone-800 transition-colors"
 title="Playback Speed"
 >
 {playbackSpeed}x
 </button>

 <button
 onClick={handleToggleTts}
 className={`flex min-h-[44px] min-w-[44px] items-center justify-center rounded-sm border transition-colors ${
 isTtsEnabled
 ? 'border-amber-500/80 bg-amber-500/20 text-amber-300'
 : 'border-stone-700 bg-stone-900 text-stone-400'
 }`}
 title={isTtsEnabled ? 'TTS 음성 켜짐 (기본 자막 기준)' : 'TTS 음성 꺼짐'}
 >
 {isTtsEnabled ? <Mic size={17} /> : <MicOff size={17} />}
 </button>

 <button
 onClick={handleToggleCc}
 className={`flex min-h-[44px] px-2.5 items-center gap-1 rounded-sm border font-mono text-xs transition-colors ${
 isCcEnabled
 ? 'border-amber-400 bg-amber-400/20 text-amber-300'
 : 'border-stone-700 bg-stone-900 text-stone-500'
 }`}
 title={isCcEnabled ? '자막 끄기 (CC OFF)' : '자막 켜기 (CC ON)'}
 >
 <Languages size={15} />
 <span className="font-bold text-[11px]">CC {isCcEnabled ? 'ON' : 'OFF'}</span>
 </button>

 {isCcEnabled && (
 <button
 onClick={handleCycleSubtitle}
 className="flex min-h-[44px] px-2 items-center gap-1 rounded-sm border border-stone-700 bg-stone-900 text-xs text-stone-200 hover:bg-stone-800 transition-colors"
 title="Subtitle Mode: Primary / Dual"
 >
 <span className="uppercase text-[10px] font-semibold">{subtitleMode}</span>
 </button>
 )}

 <button
 onClick={handleToggleMute}
 className={`flex min-h-[44px] min-w-[44px] items-center justify-center rounded-sm border transition-colors ${
 isMuted
 ? 'border-red-500/80 bg-red-950/40 text-red-400'
 : 'border-stone-700 bg-stone-900 text-stone-200 hover:bg-stone-800'
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
