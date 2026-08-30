import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Compass, Clock, Zap, Loader2, X, Sparkles, Shield, UserCheck } from 'lucide-react';
import { QuickWarmupPuzzle } from './QuickWarmupPuzzle';
import { Language } from '../types';
import { cn } from '../lib/utils';
import { t } from '../lib/i18n';

export interface MatchmakingQueueModalProps {
  isOpen: boolean;
  isRealTimePvp?: boolean;
  searchTimer: number;
  queuePosition?: number | null;
  error?: string | null;
  tip?: string;
  isCancelling?: boolean;
  onCancel: () => void;
  language: Language;
}

export const MatchmakingQueueModal: React.FC<MatchmakingQueueModalProps> = ({
  isOpen,
  isRealTimePvp = false,
  searchTimer,
  queuePosition = 1,
  error,
  tip,
  isCancelling = false,
  onCancel,
  language,
}) => {
  const [warmupScore, setWarmupScore] = useState(0);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-3 bg-black/70 backdrop-blur-sm select-none font-mono">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          className="bg-[#fdfcfc] border-2 border-[#201d1d] rounded-none max-w-md w-full p-4 sm:p-5 shadow-2xl space-y-4 text-[#201d1d] relative overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Signal Bar */}
          <div className="flex items-center justify-between border-b border-black/15 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
              <span className="text-xs font-black uppercase tracking-wider text-black">
                {isRealTimePvp
                  ? (language === 'ko' ? '[실시간 PVP 매치메이킹]' : '[REALTIME PVP QUEUE]')
                  : (language === 'ko' ? '[AI & 랭킹 최적 상대 탐색]' : '[OPTIMAL MATCH SEARCH]')}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-bold text-black/70">
              <Clock size={12} />
              <span className="font-black text-black">{searchTimer}s</span>
            </div>
          </div>

          {/* Queue Status & Tip Banner */}
          <div className="flex items-center justify-between p-2.5 bg-black/5 border border-black/15 text-xs">
            <div className="flex items-center gap-2">
              <Compass size={16} className="text-amber-600 animate-spin" />
              <div>
                <div className="font-black text-[11px]">
                  {language === 'ko' ? '상대 대기열 연결 중...' : 'Finding Opponent...'}
                </div>
                <div className="text-[10px] text-black/50">
                  {queuePosition ? `${language === 'ko' ? '대기 순번' : 'Queue Pos'}: #${queuePosition}` : 'Standard Queue'}
                </div>
              </div>
            </div>

            {tip && (
              <div className="text-[10px] text-black/60 max-w-[170px] truncate italic text-right">
                "{tip}"
              </div>
            )}
          </div>

          {/* Interactive Warmup Mini Puzzle (Row 657 / ID 554 Requirement) */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] font-bold text-black/60 px-1">
              <span>{language === 'ko' ? '⚡ 대기 시간 웜업 미니 퍼즐' : '⚡ WARM-UP PIXEL PUZZLE'}</span>
              <span className="text-amber-700 font-black">{warmupScore > 0 ? `+${warmupScore} PTS` : 'PLAY WHILE WAITING'}</span>
            </div>
            <QuickWarmupPuzzle
              language={language}
              onWarmupScoreChange={(score) => setWarmupScore(score)}
            />
          </div>

          {/* Error Message if any */}
          {error && (
            <div className="p-2.5 bg-red-50 border border-red-300 text-red-800 text-xs font-bold text-center">
              {error}
            </div>
          )}

          {/* Cancel Button */}
          <button
            onClick={onCancel}
            disabled={isCancelling}
            className={cn(
              "w-full py-3 bg-[#201d1d] hover:bg-black text-[#fdfcfc] font-black uppercase text-xs rounded-sm shadow-md active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2",
              isCancelling && "opacity-75 cursor-wait"
            )}
          >
            {isCancelling ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>{language === 'ko' ? '매칭 취소 중...' : 'Cancelling...'}</span>
              </>
            ) : (
              <span>{language === 'ko' ? '[매칭 취소]' : '[CANCEL MATCHMAKING]'}</span>
            )}
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
