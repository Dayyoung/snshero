import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, RotateCcw, Trophy, Zap } from 'lucide-react';
import { CARD_DATABASE } from '../cardDatabase';
import { CardData, Language } from '../types';
import { t } from '../lib/i18n';
import { cn } from '../lib/utils';

interface MemoryMatchGameProps {
  deck: CardData[];
  language: Language;
  lowSpecMode?: boolean;
  playSfx: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

const DIFFICULTY_CONFIG = [
  { cols: 4, rows: 4, reward: 30 },
  { cols: 6, rows: 4, reward: 50 },
  { cols: 6, rows: 6, reward: 80 },
];

const FLIP_ANIM_MS = 400;
const MATCH_HOLD_MS = 600;
const PREVIEW_MS = 3000;

interface CardTile {
  id: number;
  cardId: number;
  flipped: boolean;
  matched: boolean;
}

const getCardSpriteStyle = (cardId: number): React.CSSProperties => {
  const idx = CARD_DATABASE[cardId] ? cardId : 1;
  const x = ((idx - 1) % 10) * (100 / 9);
  const y = Math.floor((idx - 1) / 10) * (100 / 10);
  return {
    backgroundImage: 'url(/card100.png)',
    backgroundSize: '1000% 1100%',
    backgroundPosition: `${x}% ${y}%`,
    backgroundRepeat: 'no-repeat',
    imageRendering: 'pixelated' as const,
  };
};

export const MemoryMatchGame: React.FC<MemoryMatchGameProps> = ({
  deck,
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const [level, setLevel] = useState(0);
  const [tiles, setTiles] = useState<CardTile[]>([]);
  const [flippedIds, setFlippedIds] = useState<number[]>([]);
  const [matchedCount, setMatchedCount] = useState(0);
  const [moves, setMoves] = useState(0);
  const [isChecking, setIsChecking] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [showTutorial, setShowTutorial] = useState(true);
  const [previewPhase, setPreviewPhase] = useState(true);
  const [previewCountdown, setPreviewCountdown] = useState(3);
  const rewardedRef = useRef(false);
  const previewTimerRef = useRef<number | null>(null);
  const countdownTimerRef = useRef<number | null>(null);

  const { cols, rows, reward } = DIFFICULTY_CONFIG[Math.min(level, DIFFICULTY_CONFIG.length - 1)];
  const totalPairs = (cols * rows) / 2;

  const startPreview = useCallback(() => {
    setPreviewPhase(true);
    setPreviewCountdown(3);

    if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);

    countdownTimerRef.current = window.setInterval(() => {
      setPreviewCountdown(prev => {
        if (prev <= 1) {
          if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    previewTimerRef.current = window.setTimeout(() => {
      setTiles(prev => prev.map(t => ({ ...t, flipped: false })));
      setPreviewPhase(false);
      if (previewTimerRef.current) {
        clearTimeout(previewTimerRef.current);
        previewTimerRef.current = null;
      }
    }, PREVIEW_MS);
  }, []);

  const initGame = useCallback((forceSkipTutorial = false) => {
    const pairCount = totalPairs;
    const cardPool: number[] = [];
    for (let i = 0; i < pairCount; i++) {
      const deckCard = deck[i % deck.length];
      const cardId = deckCard?.imageIndex || (deckCard?.id as number) || (i % 110) + 1;
      cardPool.push(CARD_DATABASE[cardId] ? cardId : (i % 110) + 1);
    }

    const tileIds: number[] = [];
    for (let i = 0; i < pairCount; i++) {
      tileIds.push(i, i);
    }
    for (let i = tileIds.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [tileIds[i], tileIds[j]] = [tileIds[j], tileIds[i]];
    }

    const newTiles: CardTile[] = tileIds.map((pairIdx, i) => ({
      id: i,
      cardId: cardPool[pairIdx],
      flipped: true,
      matched: false,
    }));
    setTiles(newTiles);
    setFlippedIds([]);
    setMatchedCount(0);
    setMoves(0);
    setIsChecking(false);
    setIsComplete(false);
    setScore(0);
    setCombo(0);
    rewardedRef.current = false;

    if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);

    if (forceSkipTutorial || !showTutorial) {
      setPreviewPhase(true);
      setPreviewCountdown(3);

      countdownTimerRef.current = window.setInterval(() => {
        setPreviewCountdown(prev => {
          if (prev <= 1) {
            if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      previewTimerRef.current = window.setTimeout(() => {
        setTiles(prev => prev.map(t => ({ ...t, flipped: false })));
        setPreviewPhase(false);
        if (previewTimerRef.current) {
          clearTimeout(previewTimerRef.current);
          previewTimerRef.current = null;
        }
      }, PREVIEW_MS);
    } else {
      // If tutorial is showing, make tiles visible but keep timer paused
      setPreviewPhase(true);
      setPreviewCountdown(3);
    }
  }, [totalPairs, deck, showTutorial]);

  const handleStartGame = () => {
    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    setShowTutorial(false);
    startPreview();
  };

  useEffect(() => {
    initGame();
  }, [initGame]);

  useEffect(() => {
    return () => {
      if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, []);

  const handleReward = useCallback(() => {
    if (rewardedRef.current) return;
    rewardedRef.current = true;
    const bonusScore = score + combo * 5;
    const totalReward = reward + Math.floor(bonusScore / 10);
    onReward(totalReward);
  }, [reward, score, combo, onReward]);

  useEffect(() => {
    if (isComplete && !rewardedRef.current) {
      handleReward();
    }
  }, [isComplete, handleReward]);

  const handleTileClick = (tileId: number) => {
    if (isChecking || isComplete || previewPhase) return;
    const tile = tiles[tileId];
    if (!tile || tile.flipped || tile.matched) return;

    const newFlippedIds = [...flippedIds, tileId];
    if (newFlippedIds.length > 2) return;

    const newTiles = tiles.map((t) =>
      t.id === tileId ? { ...t, flipped: true } : t
    );
    setTiles(newTiles);
    setFlippedIds(newFlippedIds);

    playSfx('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');

    if (newFlippedIds.length === 2) {
      setIsChecking(true);
      setMoves((m) => m + 1);
      const [idA, idB] = newFlippedIds;
      const tileA = newTiles[idA];
      const tileB = newTiles[idB];

      if (tileA.cardId === tileB.cardId) {
        setTimeout(() => {
          setTiles((prev) =>
            prev.map((t) =>
              t.id === idA || t.id === idB ? { ...t, matched: true } : t
            )
          );
          setFlippedIds([]);
          setIsChecking(false);
          setMatchedCount((c) => c + 1);
          setCombo((c) => c + 1);
          setScore((s) => s + 10 + combo * 2);
          playSfx('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');
        }, FLIP_ANIM_MS);
      } else {
        setTimeout(() => {
          setTiles((prev) =>
            prev.map((t) =>
              t.id === idA || t.id === idB ? { ...t, flipped: false } : t
            )
          );
          setFlippedIds([]);
          setIsChecking(false);
          setCombo(0);
          playSfx('https://assets.mixkit.co/active_storage/sfx/2570/2570-preview.mp3');
        }, MATCH_HOLD_MS);
      }
    }
  };

  useEffect(() => {
    if (matchedCount === totalPairs && totalPairs > 0) {
      setIsComplete(true);
    }
  }, [matchedCount, totalPairs]);

  const nextLevel = () => {
    if (level < DIFFICULTY_CONFIG.length - 1) {
      setLevel((l) => l + 1);
    }
  };

  const cellGap = 5;

  return (
    <div className="min-h-screen bg-slate-50/30 text-slate-800 flex flex-col items-center font-sans select-none pb-12 w-full overflow-x-hidden">
      {/* Header */}
      <header className="w-full h-16 flex items-center justify-between border-b border-slate-100 px-4 md:px-6 bg-white shrink-0">
        <button
          onClick={onExit}
          className="p-2 bg-slate-50 border border-slate-200/60 rounded-xl hover:bg-slate-100 hover:text-indigo-600 transition-colors shadow-sm cursor-pointer text-slate-600 flex items-center justify-center"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="text-center">
          <h1 className="text-base md:text-lg font-bold text-slate-800 tracking-tight">
            {language === 'ko' ? '카드 짝맞추기' : 'Memory Match'}
          </h1>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
            Lv.{level + 1} ({cols}×{rows})
          </div>
        </div>
        <button
          onClick={() => {
            playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
            initGame(true);
          }}
          className="p-2 bg-slate-50 border border-slate-200/60 rounded-xl hover:bg-slate-100 hover:text-indigo-600 transition-colors shadow-sm cursor-pointer text-slate-600 flex items-center justify-center"
        >
          <RotateCcw size={18} />
        </button>
      </header>

      {/* Info Stats */}
      <div className="flex items-center gap-4 text-xs font-bold my-4 py-1.5 px-4 bg-white rounded-full border border-slate-100 shadow-xs">
        <span className="text-slate-550">
          {language === 'ko' ? '시도' : 'Moves'}: <span className="text-slate-800">{moves}</span>
        </span>
        <div className="w-px h-3 bg-slate-200" />
        <span className="text-amber-500">
          {matchedCount}/{totalPairs}
        </span>
        {combo > 1 && (
          <>
            <div className="w-px h-3 bg-slate-200" />
            <span className="text-orange-500 flex items-center gap-0.5 animate-bounce">
              <Zap size={12} className="fill-orange-500" />
              {combo}x
            </span>
          </>
        )}
      </div>

      {previewPhase && !showTutorial && (
        <div className="mb-4 px-4 py-2 bg-amber-50 border border-amber-250 text-amber-800 text-xs font-bold rounded-xl text-center shadow-xs animate-pulse">
          {language === 'ko' ? `카드를 기억하세요! ${previewCountdown}초` : `Memorize! ${previewCountdown}s`}
        </div>
      )}

      {/* Responsive Grid Container */}
      <div className="w-full max-w-md px-4 flex justify-center">
        <div
          className="grid p-3 bg-slate-900/90 rounded-3xl border border-slate-950 shadow-xl w-full max-w-[360px]"
          style={{
            gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
            gap: `${cellGap}px`,
          }}
        >
          {tiles.map((tile) => (
            <button
              key={tile.id}
              onClick={() => handleTileClick(tile.id)}
              disabled={tile.matched || isComplete || previewPhase || showTutorial}
              className={cn(
                'aspect-square rounded-xl border-2 transition-all duration-200 select-none outline-none relative overflow-hidden',
                !tile.flipped && !tile.matched && !previewPhase && 'border-indigo-500 bg-indigo-950/20 cursor-pointer hover:scale-[1.04] active:scale-95 shadow-sm',
                !tile.flipped && !tile.matched && previewPhase && 'bg-slate-800 border-slate-700 opacity-50',
                tile.flipped && !tile.matched && 'bg-slate-950 border-indigo-400 ring-2 ring-indigo-500/10',
                tile.matched && 'bg-emerald-950/40 border-emerald-500/30 scale-95 opacity-40',
              )}
            >
              {(tile.flipped || tile.matched) && (
                <div
                  className="w-full h-full rounded-lg"
                  style={getCardSpriteStyle(tile.cardId)}
                />
              )}
              {!tile.flipped && !tile.matched && !previewPhase && (
                <div className="w-full h-full bg-gradient-to-br from-indigo-900 via-indigo-955 to-slate-950 rounded-lg flex items-center justify-center relative overflow-hidden shadow-inner border border-indigo-500/20">
                  <div className="absolute inset-0.5 border border-indigo-500/10 rounded-md pointer-events-none" />
                  <div className="w-6 h-6 rounded-full bg-indigo-500/10 border border-indigo-400/20 flex items-center justify-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse shadow-md" />
                  </div>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tutorial Modal */}
      {showTutorial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs px-4">
          <div className="bg-white text-slate-800 w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl border border-slate-100/80 p-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-2.5 mb-3 border-b border-slate-100 pb-3">
              <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
                <Zap size={16} />
              </span>
              <h3 className="text-base font-bold text-slate-800 uppercase tracking-tight">
                {t('tutorial_title', language)}
              </h3>
            </div>
            <p className="text-xs sm:text-sm font-medium text-slate-600 leading-relaxed mb-6 whitespace-pre-line">
              {t('tutorial_memorymatch', language)}
            </p>
            <button
              onClick={handleStartGame}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-md shadow-indigo-600/10 hover:shadow-lg active:scale-95 transition-all cursor-pointer"
            >
              {t('tutorial_start_game', language)}
            </button>
          </div>
        </div>
      )}

      {/* Complete Modal */}
      {isComplete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs px-4">
          <div className="bg-white text-slate-800 w-full max-w-xs rounded-3xl overflow-hidden shadow-2xl border border-slate-100/80 p-6 text-center animate-in zoom-in-95 duration-200">
            <Trophy className="w-12 h-12 text-amber-500 mx-auto mb-3 animate-bounce" />
            <h3 className="text-lg font-bold text-slate-800 mb-1">
              {language === 'ko' ? '클리어!' : 'Cleared!'}
            </h3>
            <p className="text-sm font-medium text-slate-500 mb-4">
              {language === 'ko'
                ? `${moves}번 만에 성공!`
                : `Completed in ${moves} moves!`}
            </p>
            <div className="flex items-center justify-center gap-2 mb-6">
              <span className="text-3xl font-extrabold text-indigo-600">+{reward + Math.floor(score / 10)}</span>
              <span className="text-xs font-semibold text-slate-400">SNS</span>
            </div>
            <div className="flex flex-col gap-2">
              {level < DIFFICULTY_CONFIG.length - 1 && (
                <button
                  onClick={() => {
                    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                    setLevel((l) => l + 1);
                  }}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-md shadow-indigo-600/10 hover:shadow-lg active:scale-95 transition-all cursor-pointer"
                >
                  {language === 'ko' ? '다음 레벨' : 'Next Level'}
                </button>
              )}
              <button
                onClick={() => {
                  playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                  initGame(true);
                }}
                className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/85 text-slate-700 font-semibold rounded-xl shadow-sm active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <RotateCcw size={14} />
                <span>{language === 'ko' ? '다시하기' : 'Retry'}</span>
              </button>
              <button
                onClick={onExit}
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl shadow-md shadow-rose-600/10 hover:shadow-lg active:scale-95 transition-all cursor-pointer"
              >
                {language === 'ko' ? '종료' : 'Exit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};