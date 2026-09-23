/**
 * OffsetTouchPreview.tsx - SCR-09-14
 * 모바일 가구/타일 배치 시 손가락에 가려지지 않도록 위로 띄워 보여주는 오프셋 프리뷰
 */

import React from 'react';
import { Eye, Move } from 'lucide-react';

interface OffsetTouchPreviewProps {
  visible: boolean;
  furnitureName: string;
  gridX: number;
  gridY: number;
  rotation: number;
}

export const OffsetTouchPreview: React.FC<OffsetTouchPreviewProps> = ({
  visible,
  furnitureName,
  gridX,
  gridY,
  rotation,
}) => {
  if (!visible) return null;

  return (
    <div className="pointer-events-none fixed top-24 left-1/2 -translate-x-1/2 z-[9999] font-mono bg-slate-900/95 border-2 border-amber-400 p-3 rounded-2xl shadow-2xl flex items-center gap-3 text-white animate-fade-in select-none">
      <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center">
        <span
          className="text-lg font-black text-amber-300 transition-transform duration-200"
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          🪑
        </span>
      </div>
      <div>
        <div className="flex items-center gap-1.5 text-amber-400 text-xs font-black">
          <Eye size={13} />
          <span>{furnitureName}</span>
          <span className="text-[10px] text-slate-400">({rotation}°)</span>
        </div>
        <div className="text-[10px] text-slate-300 mt-0.5">
          타일 그리드 좌표: <span className="text-emerald-400 font-bold">[{gridX}, {gridY}]</span>
        </div>
      </div>
    </div>
  );
};
