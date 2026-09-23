import React from 'react';
import { motion } from 'motion/react';
import { X, ChevronRight, Compass, Shield, Award } from 'lucide-react';

interface FloorQuickJumpSheetProps {
  isOpen: boolean;
  onClose: () => void;
  maxReachedFloor: number;
  currentFloor: number;
  onSelectFloor: (floor: number) => void;
}

export const FloorQuickJumpSheet: React.FC<FloorQuickJumpSheetProps> = ({
  isOpen,
  onClose,
  maxReachedFloor,
  currentFloor,
  onSelectFloor
}) => {
  if (!isOpen) return null;

  // 10-floor segments (1~10, 11~20, ..., up to 100)
  const segments = Array.from({ length: 10 }, (_, i) => {
    const start = i * 10 + 1;
    const end = (i + 1) * 10;
    const isUnlocked = start <= maxReachedFloor;
    const isBoss = true;
    return { start, end, isUnlocked, isBoss, index: i + 1 };
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px] flex items-end justify-center select-none font-mono">
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="w-full max-w-md bg-[#fdfcfc] border-t-2 border-[#201d1d] p-4 shadow-2xl space-y-3"
      >
        <div className="flex items-center justify-between border-b border-[rgba(15,0,0,0.12)] pb-2">
          <div className="flex items-center gap-2">
            <Compass size={16} className="text-[#201d1d]" />
            <span className="text-xs font-black uppercase text-[#201d1d]">
              [QUICK FLOOR NAVIGATOR]
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center border border-[rgba(15,0,0,0.12)] bg-white hover:bg-zinc-100 rounded-sm cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>

        <div className="flex items-center justify-between text-[11px] text-[#504a4a]">
          <span>현재 층: <b>{currentFloor}F</b></span>
          <span>최고 도달 층: <b className="text-emerald-600">{maxReachedFloor}F</b></span>
        </div>

        <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
          {segments.map((seg) => (
            <button
              key={seg.index}
              disabled={!seg.isUnlocked}
              onClick={() => {
                const target = Math.min(seg.end, maxReachedFloor);
                onSelectFloor(target);
                onClose();
              }}
              className={`p-2.5 border rounded-sm text-left flex items-center justify-between transition-all cursor-pointer ${
                !seg.isUnlocked
                  ? 'bg-zinc-100 text-zinc-400 border-zinc-200 cursor-not-allowed'
                  : currentFloor >= seg.start && currentFloor <= seg.end
                  ? 'bg-[#201d1d] text-white border-[#201d1d]'
                  : 'bg-white text-[#201d1d] border-[rgba(15,0,0,0.12)] hover:bg-zinc-50'
              }`}
            >
              <div>
                <div className="text-xs font-black">
                  {seg.start}F ~ {seg.end}F
                </div>
                <div className="text-[9px] opacity-75">
                  보스: {seg.end}F 클리어
                </div>
              </div>
              <ChevronRight size={14} />
            </button>
          ))}
        </div>

        <button
          onClick={() => {
            onSelectFloor(maxReachedFloor);
            onClose();
          }}
          className="w-full py-2.5 bg-[#201d1d] text-white text-xs font-black rounded-sm border border-[#201d1d] hover:bg-zinc-800 cursor-pointer flex items-center justify-center gap-1.5 active:scale-98"
        >
          <Award size={14} className="text-amber-400" />
          <span>최고 도달 층({maxReachedFloor}F)으로 즉시 이동</span>
        </button>
      </motion.div>
    </div>
  );
};
