/**
 * MatchmakingQueueBar.tsx
 * 실시간 PvP 대전 매칭 백그라운드 비동기 큐 1줄 슬림 바
 * (구글 스프레드시트 Row 833 / ID 554 요구사항 구현)
 */

import React, { useEffect, useState } from 'react';
import { Loader2, X, Swords } from 'lucide-react';
import { Language } from '../types';

interface MatchmakingQueueBarProps {
  isSearching: boolean;
  onCancel: () => void;
  language: Language;
}

export const MatchmakingQueueBar: React.FC<MatchmakingQueueBarProps> = ({
  isSearching,
  onCancel,
  language,
}) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const isKo = language === 'ko';

  useEffect(() => {
    if (!isSearching) {
      setElapsedSeconds(0);
      return;
    }
    const timer = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isSearching]);

  if (!isSearching) return null;

  const mm = Math.floor(elapsedSeconds / 60)
    .toString()
    .padStart(2, '0');
  const ss = (elapsedSeconds % 60).toString().padStart(2, '0');

  return (
    <div className="fixed top-0 inset-x-0 z-50 bg-[#201d1d] text-[#fdfcfc] px-3 py-2 border-b border-[rgba(255,255,255,0.12)] font-mono text-xs flex items-center justify-between shadow-md select-none animate-in slide-in-from-top-full duration-200">
      {/* Left Telemetry */}
      <div className="flex items-center gap-2">
        <Swords size={14} className="text-cyan-400 animate-pulse" />
        <span className="font-bold text-cyan-300">
          {isKo ? 'PvP 매칭 탐색 중...' : 'Finding PvP Opponent...'}
        </span>
        <span className="text-[11px] text-[#999]">
          ({mm}:{ss})
        </span>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-amber-400 hidden sm:inline">
          {isKo ? '대기 중 자유 탐색 가능' : 'Freely browse while waiting'}
        </span>
        <button
          onClick={onCancel}
          className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded-sm text-[10px] font-bold uppercase flex items-center gap-1 cursor-pointer transition-colors"
        >
          <X size={10} />
          <span>{isKo ? '취소' : 'Cancel'}</span>
        </button>
      </div>
    </div>
  );
};
