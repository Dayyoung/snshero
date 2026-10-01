/**
 * RedditFloatingPlayButton.tsx
 * SNSHero 커뮤니티 어느 화면에서나 우측 하단에 상시 노출되는 플로팅 Play 버튼
 * 클릭 시 기존 /home (SNS히어로 게임 로비)으로 즉시 전환
 */

import React from 'react';
import { Gamepad2, Sparkles } from 'lucide-react';

interface RedditFloatingPlayButtonProps {
  onGoToGame: () => void;
}

export const RedditFloatingPlayButton: React.FC<RedditFloatingPlayButtonProps> = ({ onGoToGame }) => {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center group">
      {/* 툴팁 라벨 */}
      <div className="mr-3 px-3 py-1.5 rounded-full bg-black/85 text-white text-xs font-semibold tracking-wide shadow-xl backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none translate-x-2 group-hover:translate-x-0 hidden sm:flex items-center gap-1.5 border border-white/10">
        <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
        <span>SNSHero Game Lobby</span>
      </div>

      {/* 대형 플로팅 Play 버튼 */}
      <button
        type="button"
        onClick={onGoToGame}
        aria-label="Play SNSHero Game"
        className="relative flex items-center justify-center gap-2 px-4 py-3.5 sm:px-5 sm:py-3.5 rounded-full bg-gradient-to-r from-[#FF4500] via-[#FF5414] to-[#FF6B00] text-white font-bold text-sm sm:text-base shadow-2xl hover:shadow-[0_0_25px_rgba(255,69,0,0.65)] hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer border-2 border-white/30 backdrop-blur-sm"
      >
        <span className="relative flex items-center justify-center">
          <Gamepad2 className="w-6 h-6 animate-bounce" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-white ring-2 ring-emerald-400/40 animate-ping" />
        </span>
        <span className="tracking-wide drop-shadow-sm font-extrabold pr-1">PLAY</span>
      </button>
    </div>
  );
};
