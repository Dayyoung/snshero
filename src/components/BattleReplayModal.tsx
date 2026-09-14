import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward, X, Share2, Check, Film, Trophy, Swords } from 'lucide-react';
import { BattleReplayData, copyReplayToClipboard, buildReplayShareData } from '../lib/replayManager';
import { getCardSpriteStyle } from '../lib/utils';

interface BattleReplayModalProps {
  isOpen: boolean;
  onClose: () => void;
  replayData: BattleReplayData | null;
  language?: string;
}

export const BattleReplayModal: React.FC<BattleReplayModalProps> = ({
  isOpen,
  onClose,
  replayData,
  language = 'ko'
}) => {
  const isKo = language === 'ko';
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // 리플레이 데이터가 바뀔 때 초기화
  useEffect(() => {
    if (replayData) {
      setCurrentStep(replayData.moves.length); // 기본적으로 최종 결과 상태로 시작
      setIsPlaying(false);
    }
  }, [replayData]);

  // 자동 재생 루프
  useEffect(() => {
    if (!isPlaying || !replayData) return;
    if (currentStep >= replayData.moves.length) {
      setIsPlaying(false);
      return;
    }

    const timer = setTimeout(() => {
      setCurrentStep(prev => {
        if (prev >= replayData.moves.length) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 1200);

    return () => clearTimeout(timer);
  }, [isPlaying, currentStep, replayData]);

  if (!isOpen || !replayData) return null;

  const totalMoves = replayData.moves.length;

  // currentStep까지 재생된 보드 상태 재구성 (3x3 = 9칸)
  const boardCells: Array<{ cardId: number; cardTitle: string; owner: 'player' | 'ai' } | null> = Array(9).fill(null);
  for (let i = 0; i < currentStep && i < totalMoves; i++) {
    const move = replayData.moves[i];
    boardCells[move.boardIdx] = {
      cardId: move.cardId,
      cardTitle: move.cardTitle,
      owner: move.by
    };
    if (move.capturedIndices && move.capturedIndices.length > 0) {
      move.capturedIndices.forEach(idx => {
        if (boardCells[idx]) {
          boardCells[idx] = { ...boardCells[idx]!, owner: move.by };
        }
      });
    }
  }

  const handleCopy = async () => {
    const ok = await copyReplayToClipboard(replayData, language);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handlePlayToggle = () => {
    if (currentStep >= totalMoves) {
      setCurrentStep(0);
      setIsPlaying(true);
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/85 flex items-center justify-center p-3 sm:p-4 font-mono select-none backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-950 text-white border border-slate-700 w-full max-w-md p-4 sm:p-5 flex flex-col gap-3 rounded-2xl shadow-2xl relative max-h-[95dvh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <Film className="w-4 h-4 text-amber-400 animate-pulse" />
            <span className="text-xs font-black uppercase tracking-wider text-slate-200">
              {isKo ? '전투 리플레이 (Battle Replay)' : 'Battle Replay Viewer'}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Match Info Summary Banner */}
        <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl flex items-center justify-between text-xs">
          <div className="flex flex-col">
            <span className="font-bold text-indigo-400 flex items-center gap-1">
              <span>{replayData.playerName}</span>
              <span className="text-[10px] text-indigo-300 font-black">({replayData.playerScore})</span>
            </span>
            <span className="text-[9px] text-slate-500">YOU</span>
          </div>

          <div className="flex flex-col items-center">
            <span className={`text-[10px] font-black px-2 py-0.5 rounded border uppercase ${
              replayData.result === 'win'
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                : replayData.result === 'loss'
                ? 'bg-rose-950/60 border-rose-500/40 text-rose-300'
                : 'bg-amber-950/60 border-amber-500/40 text-amber-300'
            }`}>
              {replayData.result === 'win' ? (isKo ? '승리 VICTORY' : 'VICTORY') : replayData.result === 'loss' ? (isKo ? '패배 DEFEAT' : 'DEFEAT') : 'DRAW'}
            </span>
            <span className="text-[9px] text-slate-400 font-mono mt-0.5">
              {currentStep}/{totalMoves} {isKo ? '턴' : 'Turns'}
            </span>
          </div>

          <div className="flex flex-col items-end">
            <span className="font-bold text-rose-400 flex items-center gap-1">
              <span className="text-[10px] text-rose-300 font-black">({replayData.opponentScore})</span>
              <span>{replayData.opponentName}</span>
            </span>
            <span className="text-[9px] text-slate-500">OPPONENT</span>
          </div>
        </div>

        {/* 3x3 Mini Replay Board */}
        <div className="bg-slate-900/60 border border-slate-800 p-3 rounded-xl flex justify-center">
          <div className="grid grid-cols-3 gap-2 w-[210px] h-[210px]">
            {boardCells.map((cell, idx) => {
              const isLatest = currentStep > 0 && replayData.moves[currentStep - 1]?.boardIdx === idx;
              return (
                <div
                  key={idx}
                  className={`relative rounded-lg flex items-center justify-center text-center p-1 border transition-all duration-300 ${
                    cell === null
                      ? 'border-slate-800/80 bg-slate-950/40'
                      : cell.owner === 'player'
                      ? 'border-indigo-500/60 bg-indigo-950/50 text-indigo-200'
                      : 'border-rose-500/60 bg-rose-950/50 text-rose-200'
                  } ${isLatest ? 'ring-2 ring-amber-400 scale-105 shadow-md' : ''}`}
                >
                  {cell ? (
                    <div className="flex flex-col items-center justify-center w-full h-full overflow-hidden">
                      <div
                        className="w-7 h-7 rounded shrink-0 border border-slate-700 bg-slate-900 mb-0.5"
                        style={getCardSpriteStyle(cell.cardId || 1)}
                      />
                      <span className="text-[8px] font-black truncate max-w-[58px] leading-tight">
                        {cell.cardTitle}
                      </span>
                    </div>
                  ) : (
                    <span className="text-[9px] text-slate-700 font-mono">#{idx + 1}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Playback Controls & Progress */}
        <div className="flex flex-col gap-2 bg-slate-900/60 border border-slate-800 p-2.5 rounded-xl">
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold">
            <span>{isKo ? '재생 진행도' : 'Progress'}</span>
            <span className="text-amber-400 font-mono">
              {currentStep === 0 ? (isKo ? '경기 시작 전' : 'Start') : `${currentStep} / ${totalMoves} ${isKo ? '턴' : 'Turns'}`}
            </span>
          </div>

          <input
            type="range"
            min={0}
            max={totalMoves}
            value={currentStep}
            onChange={(e) => {
              setCurrentStep(Number(e.target.value));
              setIsPlaying(false);
            }}
            className="w-full accent-amber-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />

          <div className="flex items-center justify-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => {
                setCurrentStep(prev => Math.max(0, prev - 1));
                setIsPlaying(false);
              }}
              disabled={currentStep <= 0}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 disabled:opacity-30 cursor-pointer active:scale-95"
              title="이전 턴"
            >
              <SkipBack size={16} />
            </button>

            <button
              type="button"
              onClick={handlePlayToggle}
              className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-lg border border-amber-400 flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-md"
            >
              {isPlaying ? (
                <>
                  <Pause size={15} />
                  <span>{isKo ? '일시정지' : 'PAUSE'}</span>
                </>
              ) : (
                <>
                  <Play size={15} />
                  <span>{currentStep >= totalMoves ? (isKo ? '처음부터 재생' : 'REPLAY') : (isKo ? '재생' : 'PLAY')}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setCurrentStep(prev => Math.min(totalMoves, prev + 1));
                setIsPlaying(false);
              }}
              disabled={currentStep >= totalMoves}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 disabled:opacity-30 cursor-pointer active:scale-95"
              title="다음 턴"
            >
              <SkipForward size={16} />
            </button>
          </div>
        </div>

        {/* Moves Timeline Log */}
        <div className="bg-slate-900/60 border border-slate-800 p-2.5 rounded-xl flex flex-col gap-1.5 max-h-32 overflow-y-auto">
          <span className="text-[10px] font-bold text-slate-400 uppercase">
            {isKo ? '턴별 무브 내역 (Move Log)' : 'Turn Move Log'}
          </span>
          {replayData.moves.map((move, idx) => {
            const isCurrent = idx === currentStep - 1;
            return (
              <div
                key={idx}
                className={`text-[9px] flex items-center justify-between p-1 rounded font-mono ${
                  isCurrent
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                    : idx < currentStep
                    ? 'text-slate-300'
                    : 'text-slate-600 opacity-60'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-[8px] px-1 py-0.2 rounded bg-slate-800 text-slate-400">
                    T{move.turn}
                  </span>
                  <span className={move.by === 'player' ? 'text-indigo-400 font-bold' : 'text-rose-400 font-bold'}>
                    {move.by === 'player' ? (isKo ? '나' : 'YOU') : (isKo ? '상대' : 'OPP')}
                  </span>
                  <span className="truncate max-w-[120px]">{move.cardTitle}</span>
                </div>
                <span className="text-slate-400">
                  [슬롯 #{move.boardIdx + 1}]
                  {move.capturedIndices && move.capturedIndices.length > 0 && ` ⚡+${move.capturedIndices.length}`}
                </span>
              </div>
            );
          })}
        </div>

        {/* Share Button & Close CTA */}
        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={handleCopy}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 border transition-all cursor-pointer shadow-md active:scale-95 ${
              copied
                ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                : 'bg-indigo-600 hover:bg-indigo-500 border-indigo-400 text-white'
            }`}
          >
            {copied ? (
              <>
                <Check size={14} className="text-emerald-400" />
                <span>{isKo ? '✓ 리플레이 링크 복사 완료!' : '✓ Link Copied!'}</span>
              </>
            ) : (
              <>
                <Share2 size={14} />
                <span>{isKo ? '🎬 리플레이 링크 복사' : 'Share Replay Link'}</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl text-xs font-black uppercase bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-all cursor-pointer"
          >
            {isKo ? '닫기' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
