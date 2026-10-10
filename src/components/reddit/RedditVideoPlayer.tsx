/**
 * RedditVideoPlayer.tsx
 * 레딧 오리지널 스타일의 고성능 비디오 플레이어
 * - 직접 재생 가능한 비디오(.mp4, .webm)는 자체 컨트롤러로 즉시 재생
 * - Reddit v.redd.it 비디오는 해당 포스트의 100% 진짜 원본 동영상으로 직결
 * - 엉뚱한 샘플 비디오 바꿔치기 버그 원천 차단
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  ExternalLink,
  Film
} from 'lucide-react';
import { cleanRedditUrl } from '../../lib/reddit/redditTypes';

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

  // 직접 HTML5로 재생 가능한 비디오 파일인지 확인
  const isDirectVideo = Boolean(
    src && (
      src.endsWith('.mp4') || 
      src.endsWith('.webm') || 
      src.endsWith('.ogg') || 
      src.includes('.mp4?') || 
      src.includes('.webm?')
    )
  );

  const targetLink = cleanRedditUrl(externalUrl || src);

  // YouTube 동영상 ID 및 재생목록 ID 추출
  const youtubeVideoId = React.useMemo(() => {
    if (!targetLink && !src) return null;
    const url = targetLink || src;
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    return match ? match[1] : null;
  }, [targetLink, src]);

  const youtubePlaylistId = React.useMemo(() => {
    if (!targetLink && !src) return null;
    const url = targetLink || src;
    const match = url.match(/[?&]list=([^#&]+)/);
    return match ? match[1] : null;
  }, [targetLink, src]);

  const isYouTube = Boolean(youtubeVideoId || youtubePlaylistId || domain?.includes('youtube') || targetLink?.includes('youtube.com'));

  const [isPlaying, setIsPlaying] = useState(false);
  const [isYoutubeActive, setIsYoutubeActive] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(false);
  const [hasError, setHasError] = useState(false);

  // src 변경 시 초기화
  useEffect(() => {
    setHasError(false);
    setIsPlaying(false);
    setIsYoutubeActive(false);
    setProgress(0);
    setCurrentTime(0);
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

    // YouTube 영상인 경우: 인라인 iframe 플레이어로 즉시 전환
    if (isYouTube && (youtubeVideoId || youtubePlaylistId)) {
      setIsYoutubeActive(true);
      return;
    }

    // 직접 비디오 파일이 아니면 원본 링크로 바로 열기
    if (!isDirectVideo) {
      if (targetLink) {
        window.open(targetLink, '_blank', 'noopener,noreferrer');
      }
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    if (video.paused || video.ended) {
      video.play().then(() => {
        setIsPlaying(true);
      }).catch((err) => {
        console.warn('[RedditVideoPlayer] Direct video play failed', err);
        setHasError(true);
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

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || !video.duration) return;
    setCurrentTime(video.currentTime);
    setProgress((video.currentTime / video.duration) * 100);
  };

  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (!video) return;
    setDuration(video.duration || 0);
    setHasError(false);
  };

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

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
      onClick={togglePlay}
      className={`relative w-full max-h-[560px] bg-black rounded-xl overflow-hidden flex items-center justify-center select-none cursor-pointer group ${className}`}
    >
      {/* 1. YouTube 영상 인라인 재생 활성화 시 iframe 렌더링 */}
      {isYoutubeActive && (youtubeVideoId || youtubePlaylistId) ? (
        <div className="relative w-full aspect-video max-h-[560px] bg-black">
          <iframe
            src={
              youtubeVideoId 
                ? `https://www.youtube-nocookie.com/embed/${youtubeVideoId}?autoplay=1&rel=0`
                : `https://www.youtube-nocookie.com/embed/videoseries?list=${youtubePlaylistId}&autoplay=1`
            }
            title={title || 'YouTube Video'}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full border-0"
          />
        </div>
      ) : isDirectVideo && !hasError ? (
        <video
          ref={videoRef}
          src={src}
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
          onError={() => setHasError(true)}
          className="w-full h-auto max-h-[560px] object-contain transition-opacity duration-300"
        />
      ) : (
        /* 2. Reddit v.redd.it 또는 외부 영상인 경우: 원본 썸네일 + 공식 비디오 직결 오버레이 */
        <div className="relative w-full h-auto max-h-[560px] flex items-center justify-center bg-black">
          {poster ? (
            <img
              src={poster}
              alt={title || 'Reddit Video'}
              className="w-full h-auto max-h-[560px] object-contain opacity-85 group-hover:scale-[1.01] transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-64 bg-zinc-900 flex items-center justify-center text-zinc-500">
              <Film className="w-12 h-12" />
            </div>
          )}
        </div>
      )}

      {/* 3. 상단 비디오 뱃지 & 원본 링크 */}
      <div 
        onClick={(e) => e.stopPropagation()}
        className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-auto z-10"
      >
        <span className="px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-md text-white text-[11px] font-extrabold flex items-center gap-1.5 shadow-md border border-white/10">
          <Film className={`w-3.5 h-3.5 ${isYouTube ? 'text-red-500' : 'text-[#FF4500]'}`} />
          <span>{isYouTube ? 'YouTube 동영상' : (isKo ? 'Reddit 동영상' : 'Reddit Video')}</span>
        </span>

        {targetLink && (
          <a
            href={targetLink}
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1 rounded-full bg-black/75 hover:bg-black/90 backdrop-blur-md text-white text-[11px] font-bold flex items-center gap-1 transition-all shadow-md border border-white/10 hover:border-red-500/50"
            title={isKo ? '원본 동영상 페이지 열기' : 'Open original video page'}
          >
            <span>{isYouTube ? 'YouTube' : (domain || 'v.redd.it')}</span>
            <ExternalLink className={`w-3 h-3 ${isYouTube ? 'text-red-500' : 'text-[#FF4500]'}`} />
          </a>
        )}
      </div>

      {/* 4. 중앙 재생 버튼 & 원본 영상 직결 오버레이 */}
      {!isYoutubeActive && (!isPlaying || !isDirectVideo || hasError) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px] transition-all z-10 p-4 text-center">
          <button
            type="button"
            onClick={togglePlay}
            className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full ${isYouTube ? 'bg-[#FF0000] hover:bg-[#CC0000]' : 'bg-[#FF4500] hover:bg-[#FF5714]'} text-white flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all cursor-pointer border border-white/30 mb-2.5`}
            aria-label={isKo ? '동영상 재생' : 'Play Video'}
          >
            <Play className="w-8 h-8 sm:w-10 sm:h-10 ml-1 fill-white" />
          </button>

          {!isDirectVideo && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-black/80 backdrop-blur-md text-white text-xs font-bold border border-white/20 shadow-md">
              <span>{isYouTube ? (isKo ? '동영상 재생하기 (클릭)' : 'Play on YouTube') : (isKo ? 'Reddit 원본 영상 바로보기' : 'Watch on Reddit')}</span>
              <ExternalLink className={`w-3 h-3 ${isYouTube ? 'text-red-400' : 'text-[#FF4500]'}`} />
            </span>
          )}
        </div>
      )}

      {/* 5. 직접 재생 비디오일 때만 나타나는 하단 컨트롤 바 */}
      {isDirectVideo && !hasError && (
        <div
          onClick={(e) => e.stopPropagation()}
          className={`absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 via-black/60 to-transparent flex flex-col gap-2 transition-opacity duration-300 z-10 ${
            showControls || !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          {/* 진행 바 */}
          <div
            onClick={handleSeek}
            className="w-full h-1.5 bg-white/30 hover:h-2.5 rounded-full cursor-pointer relative overflow-hidden transition-all"
          >
            <div
              className="h-full bg-[#FF4500] rounded-full relative transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* 컨트롤 버튼들 */}
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
      )}
    </div>
  );
};
