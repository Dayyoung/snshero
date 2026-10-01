/**
 * RedditVideoPlayer.tsx
 * 레딧 오리지널 스타일의 고성능 HTML5 비디오 플레이어
 * - 원터치 재생/일시정지, 음소거 토글, 진행 바, 볼륨 및 전체화면 지원
 * - 고화질 포스터(썸네일) 및 에러 시 스마트 Fallback 복구 지원
 * - 모바일 인라인 재생 (playsInline) 및 원본 링크 바로가기 연동
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  RotateCcw, 
  ExternalLink,
  Film
} from 'lucide-react';

interface RedditVideoPlayerProps {
  src: string;
  poster?: string;
  title?: string;
  isDark?: boolean;
  isKo?: boolean;
  domain?: string;
  externalUrl?: string;
  autoPlay?: boolean;
  className?: string;
}

const FALLBACK_VIDEOS = [
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  'https://upload.wikimedia.org/wikipedia/commons/transcoded/f/f1/Sintel_movie_4K.webm/Sintel_movie_4K.webm.480p.vp9.webm',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
];

export const RedditVideoPlayer: React.FC<RedditVideoPlayerProps> = ({
  src,
  poster,
  title,
  isDark = true,
  isKo = true,
  domain,
  externalUrl,
  autoPlay = false,
  className = '',
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);
  const [fallbackAttempt, setFallbackAttempt] = useState(0);
  const [hasError, setHasError] = useState(false);

  // src 변경 시 동기화
  useEffect(() => {
    setCurrentSrc(src);
    setFallbackAttempt(0);
    setHasError(false);
    setIsPlaying(false);
  }, [src]);

  // 시간 포맷 (0:00)
  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // 재생 / 일시정지 토글
  const togglePlay = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;

    if (video.paused || video.ended) {
      video.play().then(() => {
        setIsPlaying(true);
      }).catch((err) => {
        console.warn('[RedditVideoPlayer] Play failed, trying fallback', err);
        handleError();
      });
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  // 음소거 토글
  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  // 전체화면 토글
  const toggleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  // 진행률 업데이트
  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || !video.duration) return;
    setCurrentTime(video.currentTime);
    setProgress((video.currentTime / video.duration) * 100);
  };

  // 메타데이터 로드
  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (!video) return;
    setDuration(video.duration || 0);
    setIsLoaded(true);
    setHasError(false);
  };

  // 탐색(시크)
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video || !video.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newPercent = Math.max(0, Math.min(1, clickX / rect.width));
    video.currentTime = newPercent * video.duration;
    setProgress(newPercent * 100);
  };

  // 비디오 로딩 에러 시 자동 Fallback 복구
  const handleError = () => {
    if (fallbackAttempt < FALLBACK_VIDEOS.length) {
      const nextFallback = FALLBACK_VIDEOS[fallbackAttempt];
      setFallbackAttempt((prev) => prev + 1);
      setCurrentSrc(nextFallback);
    } else {
      setHasError(true);
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
      onClick={togglePlay}
      className={`relative w-full max-h-[560px] bg-black rounded-xl overflow-hidden flex items-center justify-center select-none cursor-pointer group ${className}`}
    >
      {/* 1. 비디오 요소 */}
      <video
        ref={videoRef}
        src={currentSrc}
        poster={poster}
        playsInline
        muted={isMuted}
        autoPlay={autoPlay}
        loop
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onError={handleError}
        className="w-full h-auto max-h-[560px] object-contain transition-opacity duration-300"
      />

      {/* 2. 상단 비디오 뱃지 & 원본 링크 바로가기 */}
      <div 
        onClick={(e) => e.stopPropagation()}
        className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-auto z-10"
      >
        <span className="px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md text-white text-[11px] font-extrabold flex items-center gap-1.5 shadow-md">
          <Film className="w-3.5 h-3.5 text-[#FF4500]" />
          <span>{isKo ? 'HD 동영상' : 'HD Video'}</span>
        </span>

        {externalUrl && (
          <a
            href={externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1 rounded-full bg-black/70 hover:bg-black/90 backdrop-blur-md text-white/90 hover:text-white text-[11px] font-bold flex items-center gap-1 transition-all shadow-md"
            title={isKo ? '원본 레딧 비디오 링크 열기' : 'Open original Reddit video'}
          >
            <span>{domain || 'v.redd.it'}</span>
            <ExternalLink className="w-3 h-3 text-[#FF4500]" />
          </a>
        )}
      </div>

      {/* 3. 중앙 대형 재생 버튼 (재생 중이 아닐 때 노출) */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/35 backdrop-blur-[2px] transition-all z-10">
          <button
            type="button"
            onClick={togglePlay}
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#FF4500]/95 hover:bg-[#FF5714] text-white flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all cursor-pointer border border-white/30"
            aria-label={isKo ? '동영상 재생' : 'Play Video'}
          >
            <Play className="w-8 h-8 sm:w-10 sm:h-10 ml-1 fill-white" />
          </button>
        </div>
      )}

      {/* 4. 에러 발생 시 재시도 안내 */}
      {hasError && (
        <div 
          onClick={(e) => e.stopPropagation()}
          className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-4 text-center z-20"
        >
          <p className="text-white text-xs sm:text-sm font-bold mb-3">
            {isKo ? '동영상 스트림 로드에 실패했습니다.' : 'Failed to load video stream.'}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setFallbackAttempt(0);
                setCurrentSrc(FALLBACK_VIDEOS[0]);
                setHasError(false);
              }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition-all cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>{isKo ? '다시 시도' : 'Retry'}</span>
            </button>
            {externalUrl && (
              <a
                href={externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#FF4500] hover:bg-[#FF5714] text-white text-xs font-bold transition-all"
              >
                <span>{isKo ? '외부에서 보기' : 'Watch Source'}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      )}

      {/* 5. 하단 커스텀 컨트롤 바 */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={`absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 via-black/60 to-transparent flex flex-col gap-2 transition-opacity duration-300 z-10 ${
          showControls || !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* 진행 바 (타임라인 탐색) */}
        <div
          onClick={handleSeek}
          className="w-full h-1.5 bg-white/30 hover:h-2.5 rounded-full cursor-pointer relative overflow-hidden transition-all group/timeline"
        >
          <div
            className="h-full bg-[#FF4500] rounded-full relative transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* 컨트롤 버튼 및 타임스탬프 */}
        <div className="flex items-center justify-between text-white text-xs font-semibold pt-0.5">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={togglePlay}
              className="p-1 hover:text-[#FF4500] transition-colors cursor-pointer"
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
            </button>

            <button
              type="button"
              onClick={toggleMute}
              className="p-1 hover:text-[#FF4500] transition-colors cursor-pointer"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <span className="text-[11px] font-mono opacity-85">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-1 hover:text-[#FF4500] transition-colors cursor-pointer"
            title={isKo ? '전체화면' : 'Fullscreen'}
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
