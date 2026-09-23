/**
 * GuildRoomEditorDock.tsx - SCR-09-14
 * 길드 아지트 인테리어 에디터 전용 하단 Thumb Zone 독 (48px 마그네틱 그리드 스냅 조이스틱 & 1-Tap 90도 회전 버튼)
 */

import React from 'react';
import { RotateCw, Check, X, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Grid } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

interface GuildRoomEditorDockProps {
  selectedFurniture: string;
  gridX: number;
  gridY: number;
  rotation: number;
  onMoveGrid: (dx: number, dy: number) => void;
  onRotate: () => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export const GuildRoomEditorDock: React.FC<GuildRoomEditorDockProps> = ({
  selectedFurniture,
  gridX,
  gridY,
  rotation,
  onMoveGrid,
  onRotate,
  onConfirm,
  onCancel,
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-slate-950/95 border-t border-slate-800 font-mono shadow-2xl select-none">
      <div className="max-w-md mx-auto flex items-center justify-between gap-3">
        {/* Left: 48px 마그네틱 D-Pad / 조이스틱 */}
        <div className="grid grid-cols-3 gap-1 w-32 h-32 items-center justify-center p-1 bg-slate-900 border border-slate-700 rounded-2xl">
          <div />
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              onMoveGrid(0, -1);
            }}
            className="w-9 h-9 bg-slate-800 hover:bg-slate-700 active:bg-amber-500 active:text-black rounded-lg flex items-center justify-center text-white border border-slate-600 cursor-pointer"
          >
            <ArrowUp size={16} />
          </button>
          <div />

          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              onMoveGrid(-1, 0);
            }}
            className="w-9 h-9 bg-slate-800 hover:bg-slate-700 active:bg-amber-500 active:text-black rounded-lg flex items-center justify-center text-white border border-slate-600 cursor-pointer"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="w-9 h-9 flex items-center justify-center text-[10px] text-amber-400 font-black">
            <Grid size={14} />
          </div>
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              onMoveGrid(1, 0);
            }}
            className="w-9 h-9 bg-slate-800 hover:bg-slate-700 active:bg-amber-500 active:text-black rounded-lg flex items-center justify-center text-white border border-slate-600 cursor-pointer"
          >
            <ArrowRight size={16} />
          </button>

          <div />
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              onMoveGrid(0, 1);
            }}
            className="w-9 h-9 bg-slate-800 hover:bg-slate-700 active:bg-amber-500 active:text-black rounded-lg flex items-center justify-center text-white border border-slate-600 cursor-pointer"
          >
            <ArrowDown size={16} />
          </button>
          <div />
        </div>

        {/* Center: Info & 1-Tap 90도 회전 */}
        <div className="flex-1 flex flex-col items-center justify-center gap-2">
          <div className="text-center">
            <span className="text-[11px] text-amber-300 font-bold block">{selectedFurniture}</span>
            <span className="text-[10px] text-slate-400">
              위치: [{gridX}, {gridY}] | 각도: {rotation}°
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              triggerHaptic('medium');
              onRotate();
            }}
            className="h-10 px-4 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md"
          >
            <RotateCw size={14} />
            <span>90° 회전</span>
          </button>
        </div>

        {/* Right: Actions (Confirm & Cancel) */}
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => {
              triggerHaptic('heavy');
              onConfirm();
            }}
            className="w-12 h-12 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 rounded-xl flex items-center justify-center font-black cursor-pointer shadow-lg"
          >
            <Check size={22} />
          </button>
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              onCancel();
            }}
            className="w-12 h-12 bg-slate-800 hover:bg-slate-700 active:scale-95 text-rose-400 rounded-xl flex items-center justify-center font-black cursor-pointer border border-slate-700"
          >
            <X size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};
