/**
 * RedditFloatingPlayButton.tsx
 * SNSHero 커뮤니티 어느 화면에서나 우측 하단에 상시 노출되는 플로팅 Play 버튼 (한국어 지원)
 * 클릭 시 기존 /home (SNS히어로 게임 로비)으로 즉시 전환
 */

import React from 'react';
import { Gamepad2, Sparkles } from 'lucide-react';

interface RedditFloatingPlayButtonProps {
 onGoToGame: () => void;
 isKo?: boolean;
}

export const RedditFloatingPlayButton: React.FC<RedditFloatingPlayButtonProps> = ({ 
 onGoToGame,
 isKo = true,
}) => {
 return (
 <div className="fixed bottom-5 right-4 sm:bottom-6 sm:right-6 z-50 flex items-center group font-mono">
 {/* 툴팁 라벨 */}
 <div className="mr-3 px-3 py-1.5 rounded-sm bg-[#201d1d] text-[#fdfcfc] text-xs font-semibold tracking-wide opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none translate-x-2 group-hover:translate-x-0 hidden sm:flex items-center gap-1.5 border border-white/20">
 <Sparkles className="w-3.5 h-3.5 text-amber-400" />
 <span>{isKo ? '눈히어로.com 게임 로비로 이동' : 'SNSHero.com Game Lobby'}</span>
 </div>

 {/* 대형 플로팅 Play 버튼 */}
 <button
 type="button"
 onClick={onGoToGame}
 aria-label="Play SNSHero Game"
 className="relative flex items-center justify-center gap-2 px-4 py-3 sm:px-5 sm:py-3.5 rounded-sm bg-[#FF4500] hover:bg-[#FF5414] text-white font-mono font-bold text-sm sm:text-base transition-colors cursor-pointer border border-[#FF4500] min-h-[44px]"
 >
 <span className="relative flex items-center justify-center">
 <Gamepad2 className="w-5 h-5 sm:w-6 sm:h-6" />
 <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-sm border border-white" />
 </span>
 <span className="tracking-wide font-black pr-1">
 {isKo ? '게임하기' : 'PLAY'}
 </span>
 </button>
 </div>
 );
};
