/**
 * GuildAudioNoticePlayer.tsx - SCR-09-23
 * 100dvh 상단 15초 음성 브리핑 스마트 오디오 공지 플레이어
 */

import React, { useState } from 'react';
import { Volume2, Play, Pause } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

interface GuildAudioNoticePlayerProps {
  noticeTitle: string;
  durationSeconds?: number;
}

export const GuildAudioNoticePlayer: React.FC<GuildAudioNoticePlayerProps> = ({
  noticeTitle,
  durationSeconds = 15,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const togglePlay = () => {
    triggerHaptic('selection');
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="h-10 px-3 rounded-xl bg-slate-900/90 border border-amber-400/40 flex items-center justify-between font-mono text-xs select-none">
      <div className="flex items-center gap-2">
        <Volume2 size={14} className={isPlaying ? 'text-amber-400 animate-pulse' : 'text-slate-400'} />
        <span className="text-white font-bold truncate max-w-[180px]">{noticeTitle}</span>
      </div>

      <button
        type="button"
        onClick={togglePlay}
        className="w-7 h-7 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center cursor-pointer active:scale-95 shadow"
      >
        {isPlaying ? <Pause size={12} /> : <Play size={12} className="ml-0.5" />}
      </button>
    </div>
  );
};
