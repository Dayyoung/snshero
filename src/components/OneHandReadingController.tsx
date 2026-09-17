import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, ChevronUp, ChevronDown, Zap, FastForward } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';
import { playSfx } from '../lib/sound';

interface OneHandReadingControllerProps {
  language: string;
}

export const OneHandReadingController: React.FC<OneHandReadingControllerProps> = ({
  language
}) => {
  const isKo = language === 'ko';
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<number>(1); // 1x, 2x, 3x, 5x
  const [isExpanded, setIsExpanded] = useState(false);
  const animRef = useRef<number | null>(null);

  const togglePlay = () => {
    triggerHaptic('light');
    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    setIsPlaying(prev => !prev);
  };

  const cycleSpeed = () => {
    triggerHaptic('light');
    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    const speeds = [1, 2, 3, 5];
    const nextIdx = (speeds.indexOf(speed) + 1) % speeds.length;
    setSpeed(speeds[nextIdx]);
  };

  const scrollToTop = () => {
    triggerHaptic('medium');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToBottom = () => {
    triggerHaptic('medium');
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
  };

  useEffect(() => {
    if (!isPlaying) {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      return;
    }

    let lastTime = performance.now();
    const scrollStep = (currentTime: number) => {
      const delta = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      const pixelsPerSecond = 45 * speed;
      window.scrollBy(0, pixelsPerSecond * delta);

      // Check reached bottom
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) {
        setIsPlaying(false);
        return;
      }

      animRef.current = requestAnimationFrame(scrollStep);
    };

    animRef.current = requestAnimationFrame(scrollStep);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isPlaying, speed]);

  return (
    <div className="fixed bottom-20 right-3.5 z-[9990] flex flex-col items-end gap-1.5 font-mono select-none">
      {/* Expanded Quick Jump Tools */}
      {isExpanded && (
        <div className="flex flex-col gap-1.5 bg-[#181515] border border-amber-500/60 p-1.5 rounded-none shadow-2xl mb-1">
          <button
            type="button"
            onClick={scrollToTop}
            className="p-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer"
            title="맨 위로"
          >
            <ChevronUp size={18} />
          </button>
          <button
            type="button"
            onClick={scrollToBottom}
            className="p-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer"
            title="맨 아래로"
          >
            <ChevronDown size={18} />
          </button>
          <button
            type="button"
            onClick={cycleSpeed}
            className="px-2 py-1 text-amber-400 font-black text-xs bg-amber-500/20 border border-amber-500/40 min-h-[36px] flex items-center justify-center cursor-pointer"
            title="스크롤 속도 조절"
          >
            {speed}x
          </button>
        </div>
      )}

      {/* Main Floating Trigger Pill */}
      <div className="flex items-center bg-[#181515] border border-amber-500 text-white shadow-2xl rounded-none overflow-hidden">
        <button
          type="button"
          onClick={togglePlay}
          className={`min-h-[48px] px-3.5 flex items-center gap-1.5 font-black text-xs uppercase cursor-pointer active:scale-95 transition-all ${
            isPlaying ? 'bg-amber-400 text-black' : 'bg-transparent text-amber-300'
          }`}
        >
          {isPlaying ? <Pause size={15} /> : <Play size={15} />}
          <span>{isPlaying ? `${speed}x 진행중` : (isKo ? '오토 스크롤' : 'Auto Scroll')}</span>
        </button>

        <button
          type="button"
          onClick={() => setIsExpanded(prev => !prev)}
          className="min-h-[48px] min-w-[40px] border-l border-white/20 text-white/70 hover:text-white flex items-center justify-center cursor-pointer active:scale-95"
          title="한손 컨트롤 확장"
        >
          <Zap size={14} className={isExpanded ? 'text-amber-400' : ''} />
        </button>
      </div>
    </div>
  );
};
