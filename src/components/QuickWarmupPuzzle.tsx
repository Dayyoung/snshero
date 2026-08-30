import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Trophy, RotateCcw, Zap, Flame, Shield, Award } from 'lucide-react';
import { CARD_DATABASE } from '../cardDatabase';
import { cn } from '../lib/utils';
import { Language } from '../types';

export interface QuickWarmupPuzzleProps {
  language: Language;
  onWarmupScoreChange?: (score: number) => void;
  className?: string;
}

interface PuzzleTile {
  id: number;
  pairId: number;
  icon: string;
  name: string;
  elemColor: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const PUZZLE_HERO_PAIRS = [
  { id: 1, icon: '🔥', name: 'Flame Knight', elemColor: 'bg-red-500 text-white border-red-600' },
  { id: 2, icon: '💧', name: 'Aqua Mage', elemColor: 'bg-blue-500 text-white border-blue-600' },
  { id: 3, icon: '🌿', name: 'Earth Golem', elemColor: 'bg-emerald-600 text-white border-emerald-700' },
  { id: 4, icon: '⚡', name: 'Wind Striker', elemColor: 'bg-amber-500 text-white border-amber-600' },
];

export const QuickWarmupPuzzle: React.FC<QuickWarmupPuzzleProps> = ({
  language,
  onWarmupScoreChange,
  className,
}) => {
  const [tiles, setTiles] = useState<PuzzleTile[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(1);
  const [isCompleted, setIsCompleted] = useState(false);
  const [clearedCount, setClearedCount] = useState(0);

  const initTiles = () => {
    const list: PuzzleTile[] = [];
    let idCounter = 0;
    PUZZLE_HERO_PAIRS.forEach((pair) => {
      // 2 cards per pair
      for (let i = 0; i < 2; i++) {
        list.push({
          id: idCounter++,
          pairId: pair.id,
          icon: pair.icon,
          name: pair.name,
          elemColor: pair.elemColor,
          isFlipped: false,
          isMatched: false,
        });
      }
    });

    // Shuffle
    const shuffled = [...list].sort(() => Math.random() - 0.5);
    setTiles(shuffled);
    setSelectedIndices([]);
    setIsCompleted(false);
  };

  useEffect(() => {
    initTiles();
  }, []);

  const handleTileClick = (index: number) => {
    if (selectedIndices.length >= 2) return;
    const tile = tiles[index];
    if (tile.isFlipped || tile.isMatched) return;

    // Flip this tile
    const newTiles = [...tiles];
    newTiles[index].isFlipped = true;
    setTiles(newTiles);

    const newSelected = [...selectedIndices, index];
    setSelectedIndices(newSelected);

    if (newSelected.length === 2) {
      const [firstIdx, secondIdx] = newSelected;
      const firstTile = newTiles[firstIdx];
      const secondTile = newTiles[secondIdx];

      if (firstTile.pairId === secondTile.pairId) {
        // Match!
        setTimeout(() => {
          setTiles((prev) =>
            prev.map((t, idx) =>
              idx === firstIdx || idx === secondIdx
                ? { ...t, isMatched: true, isFlipped: true }
                : t
            )
          );
          const points = 100 * combo;
          setScore((s) => {
            const nextScore = s + points;
            onWarmupScoreChange?.(nextScore);
            return nextScore;
          });
          setCombo((c) => Math.min(5, c + 1));
          setSelectedIndices([]);

          // Check if all matched
          setTimeout(() => {
            setTiles((currentTiles) => {
              const allMatched = currentTiles.every((t) => t.isMatched);
              if (allMatched) {
                setIsCompleted(true);
                setClearedCount((c) => c + 1);
              }
              return currentTiles;
            });
          }, 300);
        }, 400);
      } else {
        // Mismatch
        setTimeout(() => {
          setTiles((prev) =>
            prev.map((t, idx) =>
              idx === firstIdx || idx === secondIdx
                ? { ...t, isFlipped: false }
                : t
            )
          );
          setCombo(1);
          setSelectedIndices([]);
        }, 700);
      }
    }
  };

  return (
    <div
      id="quick-warmup-puzzle"
      className={cn(
        "w-full bg-[#fdfcfc] border border-black/15 rounded-none font-mono text-[#201d1d] select-none p-3 space-y-2.5",
        className
      )}
    >
      {/* Header / Score bar */}
      <div className="flex items-center justify-between border-b border-black/10 pb-1.5 text-xs font-bold">
        <div className="flex items-center gap-1.5 text-black">
          <Zap size={14} className="text-amber-500 animate-pulse" />
          <span>{language === 'ko' ? '대기열 웜업 퍼즐' : 'Warm-up Match'}</span>
          {combo > 1 && (
            <span className="px-1.5 py-0.2 bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black rounded-sm">
              x{combo} COMBO!
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-black/60 text-[11px]">
            {language === 'ko' ? '점수' : 'SCORE'}: <span className="font-black text-black">{score}</span>
          </span>
          <button
            onClick={initTiles}
            className="p-1 text-black/60 hover:text-black border border-black/15 hover:border-black/30 rounded-sm cursor-pointer active:scale-95"
            title={language === 'ko' ? '다시 섞기' : 'Reset'}
          >
            <RotateCcw size={12} />
          </button>
        </div>
      </div>

      {/* Grid of tiles (4 columns x 2 rows) */}
      <div className="grid grid-cols-4 gap-1.5">
        {tiles.map((tile, idx) => (
          <button
            key={tile.id}
            onClick={() => handleTileClick(idx)}
            disabled={tile.isMatched}
            className={cn(
              "h-14 sm:h-16 rounded-sm border transition-all flex flex-col items-center justify-center font-black cursor-pointer active:scale-95 text-center relative overflow-hidden",
              tile.isMatched
                ? "bg-black/5 border-black/10 opacity-40 cursor-default"
                : tile.isFlipped
                ? cn("shadow-sm", tile.elemColor)
                : "bg-white border-black/20 hover:border-black/50 text-black/40 hover:bg-black/5"
            )}
          >
            {tile.isFlipped || tile.isMatched ? (
              <motion.div
                initial={{ scale: 0.6, rotateY: 90 }}
                animate={{ scale: 1, rotateY: 0 }}
                className="flex flex-col items-center justify-center"
              >
                <span className="text-xl sm:text-2xl leading-none">{tile.icon}</span>
                <span className="text-[8px] sm:text-[9px] font-bold mt-0.5 truncate max-w-[50px] leading-tight">
                  {tile.name.split(' ')[0]}
                </span>
              </motion.div>
            ) : (
              <span className="text-xs font-black tracking-tighter opacity-40">
                [?]
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Completion Banner */}
      <AnimatePresence>
        {isCompleted && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="p-2 bg-amber-50 border border-amber-300 text-amber-900 rounded-sm text-center space-y-1"
          >
            <div className="flex items-center justify-center gap-1.5 text-xs font-black">
              <Trophy size={14} className="text-amber-600" />
              <span>{language === 'ko' ? '웜업 완료! 전투 준비 완료 (+10 SNS 보너스)' : 'Warm-up Complete! Ready for Battle'}</span>
            </div>
            <button
              onClick={initTiles}
              className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-black uppercase rounded-sm cursor-pointer active:scale-95"
            >
              {language === 'ko' ? '[한 판 더 즐기기]' : '[PLAY AGAIN]'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
