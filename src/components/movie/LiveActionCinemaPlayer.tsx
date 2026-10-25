/**
 * LiveActionCinemaPlayer.tsx
 * Photorealistic Live-Action Dark Fantasy Blockbuster Cinema Player for SNSHero.
 * Features 2.39:1 CinemaScope framing, 70mm Anamorphic color grading LUT presets,
 * live 35mm film grain & horizontal blue anamorphic lens flare, theatrical bottom
 * subtitle bar (no comic speech bubbles), procedural soundtrack, and voiceover synthesis.
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
  RotateCcw,
  Mic,
  MicOff,
  Languages,
  Film,
  CheckCircle2,
  ChevronRight,
  Sliders,
} from 'lucide-react';
import { MovieVfxCanvas, MovieVfxType } from './MovieVfxCanvas';
import { movieAudio, MovieBgmTheme, MovieSfxType } from '../../lib/MovieAudioSynthesizer';
import { MOVIE_EPISODES, getCharacterPortraitUrl } from '../../content/movieEpisodeMapping';
import WEBTOON_MANIFEST from '../../content/webtoonEpisodeManifest.json';
import { triggerHaptic } from '../../lib/haptic';

export type CinemaLutPreset = 'imax-70mm' | 'cold-blizzard' | 'warm-torch' | 'noir-grain';

export interface LiveActionDialogueItem {
  speakerKo?: string;
  speakerEn?: string;
  textKo: string;
  textEn: string;
  characterCardId?: number;
}

export interface LiveActionSfxCue {
  textKo: string;
  textEn: string;
  style?: 'slash' | 'impact' | 'magic' | 'rumble';
}

export interface LiveActionScene {
  sceneNumber: number;
  cinemaImageUrl: string;
  fallbackImageUrl: string;
  narrationKo: string;
  narrationEn: string;
  characters?: string[];
  dialogues?: LiveActionDialogueItem[];
  sfxCues?: LiveActionSfxCue[];
  vfxType?: MovieVfxType;
  cameraMotion?: 'pan-left' | 'pan-right' | 'zoom-in' | 'zoom-out' | 'shake';
  bgmTheme?: MovieBgmTheme;
  sfxTrigger?: MovieSfxType;
  durationSeconds?: number;
  type?: 'title_card' | 'scene';
}

export interface LiveActionCinemaPlayerProps {
  episodeNumber: number;
  titleKo: string;
  titleEn: string;
  titleJa?: string;
  language: 'ko' | 'en' | 'ja';
  onEpisodeComplete?: (epNum: number) => void;
  onSelectEpisode?: (epNum: number) => void;
  totalEpisodes?: number;
}

const LUT_PRESETS: Array<{ id: CinemaLutPreset; labelKo: string; labelEn: string; filterCss: string }> = [
  {
    id: 'imax-70mm',
    labelKo: '70mm IMAX 표준',
    labelEn: '70mm IMAX Standard',
    filterCss: 'contrast(1.12) saturate(0.92) brightness(0.97)',
  },
  {
    id: 'cold-blizzard',
    labelKo: '설원 블루 LUT',
    labelEn: 'Cold Blizzard LUT',
    filterCss: 'contrast(1.16) saturate(0.80) hue-rotate(-8deg) brightness(0.95)',
  },
  {
    id: 'warm-torch',
    labelKo: '횃불 앰버 LUT',
    labelEn: 'Warm Torchlight LUT',
    filterCss: 'contrast(1.15) sepia(0.18) saturate(1.08) brightness(0.96)',
  },
  {
    id: 'noir-grain',
    labelKo: '35mm 다크 느와르',
    labelEn: '35mm Dark Noir',
    filterCss: 'contrast(1.28) saturate(0.55) brightness(0.90)',
  },
];

const buildLiveActionScenes = (epNum: number): LiveActionScene[] => {
  const manifest = WEBTOON_MANIFEST as Record<
    string,
    {
      episodeNumber: number;
      episodeTitle: string;
      totalImages: number;
      images: Array<{
        index: number;
        imageUrl: string;
        type: string;
        narrationEn?: string;
        narrationKo?: string;
        characters?: string[];
        dialogues?: Array<{
          speakerKo?: string;
          speakerEn?: string;
          textKo: string;
          textEn: string;
          characterCardId?: number;
        }>;
        sfxCues?: Array<{
          textKo: string;
          textEn: string;
          style?: 'slash' | 'impact' | 'magic' | 'rumble';
        }>;
      }>;
    }
  >;

  const epData = manifest[String(epNum)];
  const meta = MOVIE_EPISODES[epNum];
  const defaultTheme: MovieBgmTheme = meta?.bgmTheme || 'arctic-blizzard';
  const defaultVfx: MovieVfxType = meta?.defaultVfx || 'snow';

  const motionCycle: Array<'zoom-in' | 'pan-left' | 'zoom-out' | 'pan-right' | 'shake'> = [
    'zoom-in',
    'pan-left',
    'zoom-out',
    'pan-right',
    'zoom-in',
  ];

  const padEp = String(epNum).padStart(2, '0');

  if (!epData || !epData.images || epData.images.length === 0) {
    return Array.from({ length: 20 }, (_, i) => {
      const padSc = String(i).padStart(2, '0');
      return {
        sceneNumber: i + 1,
        cinemaImageUrl: `/images/cinema/episode_${padEp}/scene_${padSc}.webp`,
        fallbackImageUrl: `/images/webtoon/episode_${padEp}/scene_${padSc}.webp`,
        narrationKo: `제 ${epNum}화 ${meta?.titleKo || ''} - SHOT ${i + 1}`,
        narrationEn: `Episode ${epNum} ${meta?.titleEn || ''} - SHOT ${i + 1}`,
        cameraMotion: motionCycle[i % motionCycle.length],
        vfxType: defaultVfx,
        bgmTheme: defaultTheme,
        durationSeconds: 5.5,
      };
    });
  }

  return epData.images.map((img, idx) => {
    const textKo = img.narrationKo || '';
    const textEn = img.narrationEn || '';
    const sfxCues: LiveActionSfxCue[] = img.sfxCues || [];
    const padSc = String(img.index ?? idx).padStart(2, '0');

    let sceneVfx: MovieVfxType = defaultVfx;
    if (textKo.includes('눈') || textKo.includes('겨울') || textEn.toLowerCase().includes('snow') || textEn.toLowerCase().includes('blizzard')) {
      sceneVfx = 'snow';
    } else if (textKo.includes('불') || textKo.includes('화염') || textKo.includes('선술집') || textEn.toLowerCase().includes('fire') || textEn.toLowerCase().includes('tavern')) {
      sceneVfx = 'embers';
    } else if (textKo.includes('룬') || textKo.includes('마법') || textEn.toLowerCase().includes('rune') || textEn.toLowerCase().includes('magic')) {
      sceneVfx = 'runes';
    } else if (textKo.includes('검') || textKo.includes('칼') || textKo.includes('창') || textEn.toLowerCase().includes('sword')) {
      sceneVfx = 'slash';
    }

    let sfxTrigger: MovieSfxType = 'whoosh';
    if (sfxCues.length > 0) {
      const firstStyle = sfxCues[0].style;
      if (firstStyle === 'slash') sfxTrigger = 'sword-strike';
      else if (firstStyle === 'magic') sfxTrigger = 'magic-cast';
      else if (firstStyle === 'impact') sfxTrigger = 'thunder-impact';
      else if (firstStyle === 'rumble') sfxTrigger = 'shield-block';
    } else if (textKo.includes('검') || textKo.includes('칼날') || textEn.toLowerCase().includes('sword')) {
      sfxTrigger = 'sword-strike';
    } else if (textKo.includes('마법') || textKo.includes('결계') || textEn.toLowerCase().includes('magic')) {
      sfxTrigger = 'magic-cast';
    }

    let motion: 'zoom-in' | 'pan-left' | 'zoom-out' | 'pan-right' | 'shake' = motionCycle[idx % motionCycle.length];
    if (idx >= 28 && (textKo.includes('일격') || textKo.includes('끊') || textEn.toLowerCase().includes('sever') || (sfxCues.length > 0 && sfxCues[0].style === 'impact'))) {
      motion = 'shake';
    }

    const dialogues: LiveActionDialogueItem[] = (img.dialogues || []).map((d) => ({
      speakerKo: d.speakerKo,
      speakerEn: d.speakerEn,
      textKo: d.textKo,
      textEn: d.textEn,
      characterCardId: d.characterCardId,
    }));

    const isTitleCard = img.type === 'title_card' || idx === 0;
    const charLen = Math.max(textKo.length, textEn.length);
    const durationSeconds = isTitleCard ? 4.2 : Math.max(4.5, Math.min(7.0, 4.0 + Math.floor(charLen / 50) + dialogues.length * 0.7));

    return {
      sceneNumber: idx + 1,
      cinemaImageUrl: `/images/cinema/episode_${padEp}/scene_${padSc}.webp?v=conquest2009_v2`,
      fallbackImageUrl: `${(img.imageUrl || `/images/webtoon/episode_${padEp}/scene_${padSc}.webp`).split('?')[0]}?v=conquest2009_v2`,
      narrationKo: textKo,
      narrationEn: textEn,
      characters: img.characters || [],
      dialogues,
      sfxCues,
      cameraMotion: isTitleCard ? 'zoom-in' : motion,
      vfxType: sceneVfx,
      bgmTheme: defaultTheme,
      sfxTrigger,
      durationSeconds,
      type: isTitleCard ? 'title_card' : 'scene',
    };
  });
};

export const LiveActionCinemaPlayer: React.FC<LiveActionCinemaPlayerProps> = ({
  episodeNumber,
  titleKo,
  titleEn,
  language,
  onEpisodeComplete,
  onSelectEpisode,
  totalEpisodes = 40,
}) => {
  const [scenes, setScenes] = useState<LiveActionScene[]>(() => buildLiveActionScenes(episodeNumber));
  const [currentSceneIdx, setCurrentSceneIdx] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [sceneProgress, setSceneProgress] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(() => movieAudio.getMuted());
  const [isVoiceEnabled, setIsVoiceEnabled] = useState<boolean>(true);
  const [subtitleLang, setSubtitleLang] = useState<'bilingual' | 'ko' | 'en'>('bilingual');
  const [lutPreset, setLutPreset] = useState<CinemaLutPreset>('imax-70mm');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [usingFallbackImg, setUsingFallbackImg] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const progressIntervalRef = useRef<number | null>(null);
  const currentScene = scenes[currentSceneIdx] || scenes[0];
  const sceneDuration = (currentScene?.durationSeconds || 5.5) * 1000;

  useEffect(() => {
    movieAudio.unlockSpeech();
    setScenes(buildLiveActionScenes(episodeNumber));
    setCurrentSceneIdx(0);
    setSceneProgress(0);
    setIsFinished(false);
    setIsPlaying(true);
    setUsingFallbackImg(false);
  }, [episodeNumber]);

  // Trigger audio & voiceover on scene change
  useEffect(() => {
    if (!currentScene || !isPlaying || isFinished) {
      movieAudio.stopBgm();
      return;
    }

    setUsingFallbackImg(false);
    const meta = MOVIE_EPISODES[episodeNumber];
    movieAudio.startBgm(currentScene.bgmTheme || meta?.bgmTheme || 'arctic-blizzard');

    if (currentScene.sfxTrigger) {
      movieAudio.playSfx(currentScene.sfxTrigger);
    }

    if (isVoiceEnabled && !isMuted) {
      const firstDialogue = currentScene.dialogues && currentScene.dialogues.length > 0 ? currentScene.dialogues[0] : null;
      const spk = firstDialogue?.speakerEn ? `${firstDialogue.speakerEn}. ` : '';
      const dlg = firstDialogue?.textEn ? `${firstDialogue.textEn}. ` : '';
      movieAudio.speakNarration(`${spk}${dlg}${currentScene.narrationEn}`, 'en');
    }
  }, [currentSceneIdx, isPlaying, isFinished, episodeNumber, language, currentScene, isVoiceEnabled, isMuted]);

  useEffect(() => {
    return () => {
      movieAudio.stopAll();
    };
  }, []);

  // Scene timeline ticker
  useEffect(() => {
    if (!isPlaying || isFinished) {
      if (progressIntervalRef.current) {
        window.clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      return;
    }

    const stepMs = 40;
    progressIntervalRef.current = window.setInterval(() => {
      setSceneProgress((prev) => {
        const next = prev + stepMs / sceneDuration;
        if (next >= 1) {
          if (currentSceneIdx < scenes.length - 1) {
            setCurrentSceneIdx((idx) => idx + 1);
            return 0;
          } else {
            setIsPlaying(false);
            setIsFinished(true);
            movieAudio.stopBgm();
            if (onEpisodeComplete) onEpisodeComplete(episodeNumber);
            return 1;
          }
        }
        return next;
      });
    }, stepMs);

    return () => {
      if (progressIntervalRef.current) {
        window.clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };
  }, [isPlaying, isFinished, currentSceneIdx, scenes.length, sceneDuration, episodeNumber, onEpisodeComplete]);

  const togglePlay = useCallback(() => {
    triggerHaptic('light');
    movieAudio.unlockSpeech();
    if (isFinished) {
      setCurrentSceneIdx(0);
      setSceneProgress(0);
      setIsFinished(false);
      setIsPlaying(true);
      return;
    }
    setIsPlaying((prev) => {
      const next = !prev;
      if (!next) movieAudio.stopAll();
      return next;
    });
  }, [isFinished]);

  const handlePrevScene = () => {
    triggerHaptic('light');
    movieAudio.unlockSpeech();
    setIsFinished(false);
    setSceneProgress(0);
    setCurrentSceneIdx((prev) => Math.max(0, prev - 1));
  };

  const handleNextScene = () => {
    triggerHaptic('light');
    movieAudio.unlockSpeech();
    if (currentSceneIdx < scenes.length - 1) {
      setSceneProgress(0);
      setCurrentSceneIdx((prev) => prev + 1);
    } else {
      setIsPlaying(false);
      setIsFinished(true);
      movieAudio.stopAll();
      if (onEpisodeComplete) onEpisodeComplete(episodeNumber);
    }
  };

  const handleToggleMute = () => {
    triggerHaptic('light');
    const next = !isMuted;
    movieAudio.setMuted(next);
    setIsMuted(next);
  };

  const handleToggleVoice = () => {
    triggerHaptic('light');
    movieAudio.unlockSpeech();
    setIsVoiceEnabled((prev) => {
      const next = !prev;
      if (!next) movieAudio.stopNarration();
      return next;
    });
  };

  const toggleFullscreen = () => {
    triggerHaptic('light');
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const getCameraMotionStyle = (): React.CSSProperties => {
    const p = sceneProgress;
    const motion = currentScene?.cameraMotion || 'zoom-in';
    switch (motion) {
      case 'zoom-in':
        return { transform: `scale(${1.0 + p * 0.09}) translate3d(0, ${-p * 1.2}%, 0)` };
      case 'zoom-out':
        return { transform: `scale(${1.10 - p * 0.08}) translate3d(0, ${p * 1.0}%, 0)` };
      case 'pan-left':
        return { transform: `scale(1.08) translate3d(${2.8 - p * 5.6}%, 0, 0)` };
      case 'pan-right':
        return { transform: `scale(1.08) translate3d(${-2.8 + p * 5.6}%, 0, 0)` };
      case 'shake': {
        const shakeX = Math.sin(p * Math.PI * 18) * 0.7;
        const shakeY = Math.cos(p * Math.PI * 14) * 0.5;
        return { transform: `scale(${1.06 + p * 0.05}) translate3d(${shakeX}%, ${shakeY}%, 0)` };
      }
      default:
        return { transform: 'scale(1.04)' };
    }
  };

  const activeLut = LUT_PRESETS.find((l) => l.id === lutPreset) || LUT_PRESETS[0];
  const overallProgress = ((currentSceneIdx + sceneProgress) / scenes.length) * 100;
  const activeDialogue = currentScene?.dialogues && currentScene.dialogues.length > 0 ? currentScene.dialogues[0] : null;
  const activeSpeaker =
    language === 'en'
      ? activeDialogue?.speakerEn || activeDialogue?.speakerKo
      : activeDialogue?.speakerKo || activeDialogue?.speakerEn;
  const speakerPortrait = activeSpeaker ? getCharacterPortraitUrl(activeSpeaker) : undefined;

  // Map any episode's scenes across the 8 continuous 9-frame acting flipbook sequences (72 sequential poses)
  const getActiveCinemaFrameUrl = (): string => {
    if (usingFallbackImg) return currentScene.fallbackImageUrl;
    if (currentSceneIdx === 0) {
      const padEp = String(episodeNumber).padStart(2, '0');
      return `/images/cinema/episode_${padEp}_acting/seq_01_frame_01.webp`;
    }
    const padEp = String(episodeNumber).padStart(2, '0');
    const totalActingScenes = Math.max(1, scenes.length - 1);
    const normalizedPos = ((currentSceneIdx - 1 + sceneProgress) / totalActingScenes) * 72;
    const globalFrameIdx = Math.min(71, Math.max(0, Math.floor(normalizedPos)));
    const seqNum = Math.floor(globalFrameIdx / 9) + 1;
    const frameIdx = (globalFrameIdx % 9) + 1;
    return `/images/cinema/episode_${padEp}_acting/seq_${String(seqNum).padStart(2, '0')}_frame_${String(frameIdx).padStart(2, '0')}.webp`;
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full bg-[#07080c] text-[#fdfcfc] font-mono select-none overflow-hidden border-y border-[#201d1d] ${
        isFullscreen ? 'fixed inset-0 z-[9999] flex flex-col justify-between' : ''
      }`}
    >
      {/* ── Top 70mm IMAX Camera & LUT Control Strip ── */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-[#0c0e14] border-b border-white/15 text-[11px]">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2 py-0.5 rounded-sm bg-amber-500 text-black font-bold tracking-wider">
            70MM LIVE-ACTION CINEMA
          </span>
          <span className="text-stone-300 font-bold">
            EP.{String(episodeNumber).padStart(2, '0')} · SHOT {String(currentSceneIdx + 1).padStart(2, '0')}/{String(scenes.length).padStart(2, '0')}
          </span>
          <span className="px-1.5 py-0.5 rounded-sm bg-emerald-950/90 text-emerald-300 border border-emerald-500/40 text-[10px]">
            [v] 8등신 실사 72프레임 연속 동작 플립북
          </span>
        </div>

        {/* LUT Preset Switcher */}
        <div className="flex items-center gap-1 flex-wrap">
          <Sliders size={12} className="text-amber-400 mr-1 hidden sm:inline" />
          {LUT_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setLutPreset(preset.id);
              }}
              className={`min-h-[32px] px-2 py-1 rounded-sm border text-[10px] font-bold transition-colors cursor-pointer ${
                lutPreset === preset.id
                  ? 'border-amber-400 bg-amber-400 text-black'
                  : 'border-white/15 bg-white/5 text-stone-300 hover:bg-white/10'
              }`}
            >
              {language === 'en' ? preset.labelEn : preset.labelKo}
            </button>
          ))}
        </div>
      </div>

      {/* ── Main 16:9 / 2.39:1 CinemaScope Viewport ── */}
      <div
        onClick={togglePlay}
        className={`relative w-full overflow-hidden bg-black cursor-pointer ${
          isFullscreen ? 'flex-1' : 'aspect-video'
        }`}
      >
        {/* Live-Action Still with Sub-Pixel Camera Motion & Color Grading LUT */}
        <div
          className="absolute inset-0 w-full h-full transition-transform duration-75 ease-linear"
          style={{
            ...getCameraMotionStyle(),
            filter: usingFallbackImg
              ? `${activeLut.filterCss} contrast(1.18) saturate(0.78) sepia(0.12)`
              : activeLut.filterCss,
          }}
        >
          <img
            key={`cinema-ep-${episodeNumber}-sc-${currentSceneIdx}`}
            src={getActiveCinemaFrameUrl()}
            alt={`Episode ${episodeNumber} Shot ${currentSceneIdx + 1}`}
            onError={() => {
              if (!usingFallbackImg) {
                setUsingFallbackImg(true);
              }
            }}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Real-time Atmospheric Particle VFX Canvas */}
        <MovieVfxCanvas vfxType={currentScene?.vfxType || 'snow'} isPlaying={isPlaying && !isFinished} />

        {/* Anamorphic Horizontal Blue Lens Flare & Radial Vignette Overlay */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(0,0,0,0) 52%, rgba(4,6,10,0.68) 100%)',
          }}
        />
        <div
          className="pointer-events-none absolute left-[8%] right-[8%] top-[24%] h-[2px] opacity-35"
          style={{
            background:
              'linear-gradient(90deg, transparent 0%, rgba(96,175,255,0.85) 35%, rgba(255,255,255,0.9) 50%, rgba(96,175,255,0.85) 65%, transparent 100%)',
          }}
        />

        {/* Top 2.39:1 CinemaScope Matte Bar */}
        <div className="pointer-events-none absolute top-0 inset-x-0 h-6 sm:h-8 bg-black z-10" />

        {/* ── English-Only Opening Title Overlay (Shown ONLY on Scene 0) ── */}
        {currentSceneIdx === 0 && (
          <div className="pointer-events-none absolute inset-0 z-20 bg-black/55 flex flex-col items-center justify-center px-4 text-center">
            <div className="border-y border-amber-400/50 py-4 px-6 max-w-xl">
              <div className="text-[10px] sm:text-xs tracking-[0.25em] text-amber-300/90 font-bold mb-1.5">
                SNSHERO ORIGINAL LIVE-ACTION CINEMA
              </div>
              <div className="text-xl sm:text-3xl font-bold text-white tracking-widest mb-1.5">
                EPISODE {String(episodeNumber).padStart(2, '0')}
              </div>
              <div className="text-sm sm:text-lg font-bold text-amber-200 tracking-wider uppercase">
                {titleEn || 'TWO VOWS BENEATH THE BLIZZARD'}
              </div>
            </div>
          </div>
        )}

        {/* ── Theatrical Cinema Subtitle Overlay (Disabled across all episodes per user request: Narration ONLY, Zero Subtitles) ── */}
        {false && currentSceneIdx > 0 && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute inset-x-3 sm:inset-x-10 bottom-8 sm:bottom-10 z-20 flex flex-col items-center pointer-events-none"
          >
            <div className="w-full max-w-3xl bg-black/80 border border-amber-500/35 px-3.5 py-2.5 sm:px-5 sm:py-3 rounded-none text-center">
              {activeSpeaker && (
                <div className="flex items-center justify-center gap-2 mb-1">
                  {speakerPortrait && (
                    <img
                      src={speakerPortrait}
                      alt={activeSpeaker}
                      className="w-5 h-5 rounded-none object-cover border border-amber-400/70"
                    />
                  )}
                  <span className="text-[11px] sm:text-xs font-bold text-amber-400 tracking-wider uppercase">
                    [ {activeSpeaker} ]
                  </span>
                </div>
              )}

              {(subtitleLang === 'bilingual' || subtitleLang === 'ko') && (
                <p className="text-xs sm:text-sm md:text-base font-bold text-white leading-snug drop-shadow">
                  {activeDialogue?.textKo ? `"${activeDialogue.textKo}"` : currentScene?.narrationKo}
                </p>
              )}

              {(subtitleLang === 'bilingual' || subtitleLang === 'en') && (
                <p className="text-[10px] sm:text-xs text-sky-200/90 mt-1 leading-snug line-clamp-2">
                  {activeDialogue?.textEn ? `"${activeDialogue.textEn}"` : currentScene?.narrationEn}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Bottom 2.39:1 CinemaScope Matte Bar */}
        <div className="pointer-events-none absolute bottom-0 inset-x-0 h-6 sm:h-7 bg-black z-10" />

        {/* Episode Complete End-Card Overlay */}
        {isFinished && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute inset-0 z-30 bg-black/90 flex flex-col items-center justify-center p-6 text-center"
          >
            <CheckCircle2 size={40} className="text-emerald-400 mb-3" />
            <div className="text-xs text-amber-400 font-bold mb-1">
              [LIVE-ACTION CINEMA EPISODE {String(episodeNumber).padStart(2, '0')} COMPLETE]
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white mb-2">
              제 {episodeNumber}화 : {titleKo} 감상 완료
            </h3>
            <p className="text-xs text-stone-300 max-w-md mb-5">
              시네마관 감상 완료 보상으로 100 SNS가 로컬스토리지에 영구 지급되었습니다.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={togglePlay}
                className="min-h-[44px] flex items-center gap-1.5 px-4 py-2 rounded-sm border border-white/30 bg-[#201d1d] hover:bg-stone-800 text-white text-xs font-bold cursor-pointer"
              >
                <RotateCcw size={14} />
                <span>[다시 감상하기]</span>
              </button>
              {episodeNumber < totalEpisodes && onSelectEpisode && (
                <button
                  type="button"
                  onClick={() => onSelectEpisode(episodeNumber + 1)}
                  className="min-h-[44px] flex items-center gap-1.5 px-4 py-2 rounded-sm border border-amber-400 bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold cursor-pointer"
                >
                  <span>[다음 회차 (EP.{String(episodeNumber + 1).padStart(2, '0')}) 상영]</span>
                  <ChevronRight size={15} />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Timeline Scrubber & Transport Controls ── */}
      <div className="bg-[#11131a] border-t border-white/15 px-3 py-2.5 space-y-2">
        {/* Progress Bar */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-amber-400 font-bold w-16 shrink-0">
            SHOT {String(currentSceneIdx + 1).padStart(2, '0')}/{String(scenes.length).padStart(2, '0')}
          </span>
          <div
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const ratio = Math.max(0, Math.min(0.999, (e.clientX - rect.left) / rect.width));
              const targetIdx = Math.floor(ratio * scenes.length);
              movieAudio.unlockSpeech();
              setIsFinished(false);
              setCurrentSceneIdx(targetIdx);
              setSceneProgress(0);
            }}
            className="flex-1 h-2.5 bg-stone-800 border border-white/15 rounded-none overflow-hidden cursor-pointer relative"
            title="클릭하여 원하는 씬으로 즉시 이동"
          >
            <div
              className="h-full bg-amber-400 transition-all duration-75"
              style={{ width: `${Math.min(100, Math.max(0, overallProgress))}%` }}
            />
          </div>
          <span className="text-[10px] text-stone-400 w-10 text-right shrink-0">
            {Math.round(overallProgress)}%
          </span>
        </div>

        {/* Control Buttons (All 44px+ Mobile Touch Targets) */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={togglePlay}
              className="min-h-[44px] min-w-[44px] px-3 py-1.5 rounded-sm bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {isPlaying ? <Pause size={15} /> : <Play size={15} />}
              <span>{isPlaying ? '일시정지' : '상영'}</span>
            </button>
            <button
              type="button"
              onClick={handlePrevScene}
              disabled={currentSceneIdx <= 0}
              className="min-h-[44px] min-w-[44px] px-2.5 py-1.5 rounded-sm border border-white/20 bg-[#1a1d26] hover:bg-stone-800 disabled:opacity-40 text-white text-xs flex items-center justify-center cursor-pointer"
              title="이전 컷"
            >
              <SkipBack size={15} />
            </button>
            <button
              type="button"
              onClick={handleNextScene}
              className="min-h-[44px] min-w-[44px] px-2.5 py-1.5 rounded-sm border border-white/20 bg-[#1a1d26] hover:bg-stone-800 text-white text-xs flex items-center justify-center cursor-pointer"
              title="다음 컷"
            >
              <SkipForward size={15} />
            </button>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={handleToggleMute}
              className="min-h-[44px] px-2.5 py-1.5 rounded-sm border border-white/20 bg-[#1a1d26] hover:bg-stone-800 text-white text-xs flex items-center gap-1 cursor-pointer"
              title="사운드 켜기/끄기"
            >
              {isMuted ? <VolumeX size={15} className="text-rose-400" /> : <Volume2 size={15} className="text-emerald-400" />}
              <span className="hidden sm:inline">{isMuted ? '음소거' : '사운드'}</span>
            </button>

            <button
              type="button"
              onClick={handleToggleVoice}
              className="min-h-[44px] px-2.5 py-1.5 rounded-sm border border-white/20 bg-[#1a1d26] hover:bg-stone-800 text-white text-xs flex items-center gap-1 cursor-pointer"
              title="성우 보이스오버 켜기/끄기"
            >
              {isVoiceEnabled ? <Mic size={15} className="text-amber-400" /> : <MicOff size={15} className="text-stone-400" />}
              <span className="hidden sm:inline">{isVoiceEnabled ? '성우 ON' : '성우 OFF'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setSubtitleLang((prev) =>
                  prev === 'bilingual' ? 'ko' : prev === 'ko' ? 'en' : 'bilingual'
                );
              }}
              className="min-h-[44px] px-2.5 py-1.5 rounded-sm border border-white/20 bg-[#1a1d26] hover:bg-stone-800 text-white text-xs flex items-center gap-1 cursor-pointer"
              title="자막 언어 전환"
            >
              <Languages size={15} className="text-sky-400" />
              <span>
                {subtitleLang === 'bilingual' ? '한/영 자막' : subtitleLang === 'ko' ? '한국어' : 'ENG'}
              </span>
            </button>

            <button
              type="button"
              onClick={toggleFullscreen}
              className="min-h-[44px] min-w-[44px] px-2.5 py-1.5 rounded-sm border border-white/20 bg-[#1a1d26] hover:bg-stone-800 text-white text-xs flex items-center justify-center cursor-pointer"
              title="전체화면 전환"
            >
              {isFullscreen ? <Minimize size={15} /> : <Maximize size={15} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
