import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Swords, Search, Crosshair, Users } from 'lucide-react';
import { pickNewRankOpponent, RankOpponentInfo } from '../data/rankingOpponents';

interface RankMatchSearchOverlayProps {
  isOpen: boolean;
  language: string;
  previousOpponentName?: string | null;
  onMatchFound: (newOpponent: RankOpponentInfo) => void;
  onCancel?: () => void;
}

export const RankMatchSearchOverlay: React.FC<RankMatchSearchOverlayProps> = ({
  isOpen,
  language,
  previousOpponentName,
  onMatchFound,
  onCancel
}) => {
  const [countdown, setCountdown] = useState(3);
  const [matchedCandidate, setMatchedCandidate] = useState<RankOpponentInfo | null>(null);
  const onMatchFoundRef = useRef(onMatchFound);
  onMatchFoundRef.current = onMatchFound;

  useEffect(() => {
    if (!isOpen) {
      setCountdown(3);
      setMatchedCandidate(null);
      return;
    }

    // 미리 새로운 상대 선정
    const candidate = pickNewRankOpponent(previousOpponentName);
    setMatchedCandidate(candidate);
    setCountdown(3);

    const timer = setInterval(() => {
      setCountdown(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, previousOpponentName]);

  useEffect(() => {
    if (!isOpen || !matchedCandidate) return;
    if (countdown === 0) {
      const t = setTimeout(() => {
        onMatchFoundRef.current(matchedCandidate);
      }, 300);
      return () => clearTimeout(t);
    }
  }, [isOpen, countdown, matchedCandidate]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 font-mono select-none"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="w-full max-w-md bg-[#0e1217] border-2 border-amber-500/80 rounded-none shadow-[0_0_50px_rgba(245,158,11,0.25)] p-6 relative overflow-hidden text-center"
        >
          {/* Scanning Line Effect */}
          <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(245,158,11,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(245,158,11,0.05)_1px,transparent_1px)] bg-[size:16px_16px]" />
          <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent animate-pulse" style={{ top: `${(3 - countdown) * 33}%`, transition: 'top 1s linear' }} />

          {/* Header Title */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="p-2 bg-amber-500/20 border border-amber-500/40 text-amber-400">
              <Swords size={20} className="animate-spin" style={{ animationDuration: '6s' }} />
            </div>
            <div className="text-left">
              <div className="text-[10px] uppercase font-black tracking-widest text-amber-400">
                {language === 'ko' ? '랭킹대전 재검색 시스템' : 'RANK MATCHMAKING RADAR'}
              </div>
              <h2 className="text-base font-black text-white tracking-tight">
                {language === 'ko' ? '새로운 랭킹 라이벌 검색 중' : 'Searching Ranking Rival...'}
              </h2>
            </div>
          </div>

          {/* Radar Visual */}
          <div className="relative w-36 h-36 mx-auto my-5 flex items-center justify-center">
            {/* Outer circles */}
            <div className="absolute inset-0 rounded-full border border-amber-500/30 animate-ping opacity-30" style={{ animationDuration: '2s' }} />
            <div className="absolute inset-2 rounded-full border border-amber-500/40" />
            <div className="absolute inset-6 rounded-full border border-amber-500/20" />
            <div className="absolute inset-10 rounded-full border border-amber-500/10" />

            {/* Crosshair */}
            <Crosshair size={120} className="text-amber-500/20 absolute" />

            {/* Countdown Badge in Center */}
            <div className="relative z-10 flex flex-col items-center justify-center">
              <span className="text-4xl font-black text-amber-400 drop-shadow-[0_0_12px_rgba(245,158,11,0.8)]">
                {countdown > 0 ? countdown : 'GO!'}
              </span>
              <span className="text-[9px] uppercase tracking-wider text-amber-200/80 font-bold mt-0.5">
                {countdown > 0 ? (language === 'ko' ? '초 대기' : 'SEC LEFT') : (language === 'ko' ? '매칭 완료!' : 'MATCHED!')}
              </span>
            </div>
          </div>

          {/* Status Message */}
          <div className="bg-[#151c24] border border-amber-500/30 p-3 mb-4 text-left">
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="text-stone-400 flex items-center gap-1">
                <Search size={12} className="text-amber-400" />
                {language === 'ko' ? '스캔 상태' : 'Scan Status'}
              </span>
              <span className="text-amber-300 font-bold text-[10px]">
                {countdown === 3 && (language === 'ko' ? '글로벌 랭커 풀 스캔...' : 'Scanning Global Pool...')}
                {countdown === 2 && (language === 'ko' ? '비슷한 전투력 라이벌 탐색...' : 'Targeting Rival Hunter...')}
                {countdown === 1 && (language === 'ko' ? '도전자 확인! 덱 구성 완료...' : 'Opponent Found! Ready...')}
                {countdown === 0 && (language === 'ko' ? '⚔️ 대전 시작!' : '⚔️ Starting Battle!')}
              </span>
            </div>

            {/* Realtime Candidate Preview if available */}
            {matchedCandidate && countdown <= 2 && (
              <div className="mt-2 pt-2 border-t border-slate-700/60 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center text-[10px] font-black">
                    VS
                  </div>
                  <span className="font-bold text-white truncate max-w-[150px]">
                    {matchedCandidate.name}
                  </span>
                </div>
                <span className="text-[10px] text-amber-400 font-bold bg-amber-950/60 border border-amber-500/40 px-1.5 py-0.5">
                  CP {matchedCandidate.totalPower}
                </span>
              </div>
            )}
          </div>

          {/* Progress bar */}
          <div className="w-full h-1.5 bg-slate-800 rounded-none overflow-hidden mb-4">
            <motion.div
              className="h-full bg-gradient-to-r from-amber-500 to-yellow-400"
              initial={{ width: '0%' }}
              animate={{ width: `${((3 - countdown) / 3) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          {/* Footer Note & Cancel Button */}
          <div className="flex items-center justify-between text-[10px] text-stone-400">
            <span className="flex items-center gap-1">
              <Users size={12} className="text-amber-400" />
              {language === 'ko' ? '3초 후 자동으로 다음 랭커와 대결합니다' : 'Auto-starts with next ranker in 3s'}
            </span>
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-600 rounded-none font-bold text-[10px] cursor-pointer"
              >
                {language === 'ko' ? '취소' : 'Cancel'}
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
