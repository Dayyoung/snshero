import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, RotateCcw, Trophy, Zap, Lightbulb } from 'lucide-react';
import { CARD_DATABASE } from '../cardDatabase';
import { CardData, Language } from '../types';
import { t } from '../lib/i18n';
import { cn, getAssetUrl } from '../lib/utils';

interface CardFlipGameProps {
  deck: CardData[];
  language: Language;
  lowSpecMode?: boolean;
  playSfx: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

const DIFFICULTY_CONFIG = [
  { size: 3, shuffleMoves: 5, reward: 20 },
  { size: 4, shuffleMoves: 10, reward: 50 },
  { size: 5, shuffleMoves: 18, reward: 100 },
  { size: 6, shuffleMoves: 28, reward: 180 },
];

interface FlipTile {
  id: number;
  cardId: number;
  active: boolean; // true = showing card sprite (ON), false = showing back (OFF)
}

const getCardSpriteStyle = (cardId: number): React.CSSProperties => {
  const idx = CARD_DATABASE[cardId] ? cardId : 1;
  const x = ((idx - 1) % 10) * (100 / 9);
  const y = Math.floor((idx - 1) / 10) * (100 / 10);
  return {
    backgroundImage: `url('${getAssetUrl('/card100.png')}')`,
    backgroundSize: '1000% 1100%',
    backgroundPosition: `${x}% ${y}%`,
    backgroundRepeat: 'no-repeat',
    imageRendering: 'pixelated' as const,
  };
};

// Generate a solvable puzzle by starting from all-ON and applying N random moves
const generateSolvablePuzzle = (size: number, moves: number, cardPool: number[]): FlipTile[] => {
  const totalTiles = size * size;
  // Start all ON
  const state: boolean[] = Array(totalTiles).fill(true);

  // Apply random moves
  for (let m = 0; m < moves; m++) {
    const idx = Math.floor(Math.random() * totalTiles);
    const row = Math.floor(idx / size);
    const col = idx % size;
    // Toggle self
    state[idx] = !state[idx];
    // Toggle neighbors
    if (row > 0) state[idx - size] = !state[idx - size];
    if (row < size - 1) state[idx + size] = !state[idx + size];
    if (col > 0) state[idx - 1] = !state[idx - 1];
    if (col < size - 1) state[idx + 1] = !state[idx + 1];
  }

  // Ensure NOT already solved - if all ON, apply one more random move
  if (state.every(s => s)) {
    const idx = Math.floor(Math.random() * totalTiles);
    const row = Math.floor(idx / size);
    const col = idx % size;
    state[idx] = !state[idx];
    if (row > 0) state[idx - size] = !state[idx - size];
    if (row < size - 1) state[idx + size] = !state[idx + size];
    if (col > 0) state[idx - 1] = !state[idx - 1];
    if (col < size - 1) state[idx + 1] = !state[idx + 1];
  }

  return state.map((active, i) => ({
    id: i,
    cardId: cardPool[i % cardPool.length],
    active,
  }));
};

const TOGGLE_ANIM_MS = 150;

export const CardFlipGame: React.FC<CardFlipGameProps> = ({
  deck,
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const [level, setLevel] = useState(0);
  const [tiles, setTiles] = useState<FlipTile[]>([]);
  const [moves, setMoves] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [showTutorial, setShowTutorial] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const rewardedRef = useRef(false);

  const toggleAnimMs = lowSpecMode ? 0 : TOGGLE_ANIM_MS;

  const { size, shuffleMoves, reward } = DIFFICULTY_CONFIG[Math.min(level, DIFFICULTY_CONFIG.length - 1)];
  const totalTiles = size * size;

  const initGame = useCallback((forceSkipTutorial = false) => {
    // Build card pool from player's deck
    const cardPool: number[] = [];
    for (let i = 0; i < totalTiles; i++) {
      const deckCard = deck[i % deck.length];
      const cardId = deckCard?.imageIndex || (deckCard?.id as number) || (i % 110) + 1;
      cardPool.push(CARD_DATABASE[cardId] ? cardId : (i % 110) + 1);
    }

    const newTiles = generateSolvablePuzzle(size, shuffleMoves, cardPool);
    setTiles(newTiles);
    setMoves(0);
    setIsComplete(false);
    setIsAnimating(false);
    rewardedRef.current = false;
    if (forceSkipTutorial) {
      setShowTutorial(false);
    }
  }, [totalTiles, size, shuffleMoves, deck]);

  const handleStartGame = () => {
    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    setShowTutorial(false);
    initGame(true);
  };

  useEffect(() => {
    initGame();
  }, [initGame]);

  const handleReward = useCallback(() => {
    if (rewardedRef.current) return;
    rewardedRef.current = true;
    // Bonus for efficient solving: fewer moves = more reward
    const optimalMin = size * size; // rough lower bound
    const efficiency = moves > 0 ? Math.max(0.3, optimalMin / moves) : 1;
    const totalReward = Math.floor(reward * efficiency);
    onReward(totalReward);
  }, [reward, moves, size, onReward]);

  useEffect(() => {
    if (isComplete && !rewardedRef.current) {
      handleReward();
    }
  }, [isComplete, handleReward]);

  const toggleTile = (tileId: number) => {
    if (isAnimating || isComplete) return;
    setIsAnimating(true);

    const row = Math.floor(tileId / size);
    const col = tileId % size;

    const toToggle = [tileId];
    if (row > 0) toToggle.push(tileId - size);
    if (row < size - 1) toToggle.push(tileId + size);
    if (col > 0) toToggle.push(tileId - 1);
    if (col < size - 1) toToggle.push(tileId + 1);

    playSfx('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
    setMoves(m => m + 1);

    const newTiles = tiles.map(t =>
      toToggle.includes(t.id) ? { ...t, active: !t.active } : t
    );
    setTiles(newTiles);

    setTimeout(() => {
      setIsAnimating(false);
      // Check win
      if (newTiles.every(t => t.active)) {
        setIsComplete(true);
        playSfx('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');
      }
    }, toggleAnimMs);
  };

  const nextLevel = () => {
    if (level < DIFFICULTY_CONFIG.length - 1) {
      setLevel(l => l + 1);
    }
  };

  const cellGap = size <= 3 ? 8 : size <= 4 ? 6 : 4;
  const activeCount = tiles.filter(t => t.active).length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-950 via-slate-900 to-indigo-950 text-slate-100 flex flex-col items-center font-sans select-none pb-12 w-full overflow-x-hidden">
      {/* Header */}
      <header className="w-full h-16 flex items-center justify-between border-b border-white/10 px-4 md:px-6 bg-black/20 backdrop-blur-sm shrink-0">
        <button
          onClick={onExit}
          className="p-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:text-amber-400 transition-colors shadow-sm cursor-pointer text-slate-300 flex items-center justify-center"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="text-center">
          <h1 className="text-base md:text-lg font-black text-white tracking-wider uppercase">
            {language === 'ko' ? '카드 플립 퍼즐' : 'Card Flip'}
          </h1>
          <div className="text-[10px] font-bold text-indigo-300/60 uppercase tracking-widest mt-0.5">
            Lv.{level + 1} ({size}×{size})
          </div>
        </div>
        <button
          onClick={() => {
            playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
            initGame(true);
          }}
          className="p-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:text-indigo-300 transition-colors shadow-sm cursor-pointer text-slate-300 flex items-center justify-center"
        >
          <RotateCcw size={18} />
        </button>
      </header>

      {/* Info Stats */}
      <div className="flex items-center gap-4 text-xs font-bold my-4 py-1.5 px-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl shadow-xl">
        <span className="text-indigo-300/60">
          {language === 'ko' ? '이동' : 'Moves'}: <span className="text-white">{moves}</span>
        </span>
        <div className="w-px h-3 bg-white/10" />
        <span className="text-amber-400">
          <Lightbulb size={12} className="inline mr-1" />
          {activeCount}/{totalTiles}
        </span>
      </div>

      {/* Responsive Grid Container */}
      <div className="w-full max-w-md px-4 flex justify-center">
        <div
          className="grid p-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl shadow-xl w-full max-w-[360px]"
          style={{
            gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
            gap: `${cellGap}px`,
          }}
        >
          {tiles.map((tile) => (
            <button
              key={tile.id}
              onClick={() => toggleTile(tile.id)}
              disabled={isComplete || isAnimating}
              className={cn(
                'aspect-square rounded-xl border-2 transition-all duration-150 select-none outline-none relative overflow-hidden',
                'cursor-pointer hover:scale-[1.04] active:scale-95',
                tile.active && 'border-amber-500/50 bg-slate-950 ring-2 ring-amber-500/20 shadow-lg shadow-amber-500/10',
                !tile.active && 'border-white/10 bg-slate-900/50 shadow-inner',
                isComplete && 'border-emerald-500/50 ring-2 ring-emerald-500/20',
              )}
            >
              {tile.active && (
                <div
                  className="w-full h-full rounded-lg"
                  style={getCardSpriteStyle(tile.cardId)}
                />
              )}
              {!tile.active && (
                <div className="w-full h-full bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-950 rounded-lg flex items-center justify-center relative overflow-hidden shadow-inner border border-white/5">
                  <div className="absolute inset-0.5 border border-white/5 rounded-md pointer-events-none" />
                  <div className="w-6 h-6 rounded-full bg-indigo-500/10 border border-indigo-400/10 flex items-center justify-center">
                    <div className={cn("w-2 h-2 rounded-full bg-slate-600 shadow-md", !lowSpecMode && "animate-pulse")} />
                  </div>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Hint text */}
      <p className="mt-4 text-[11px] font-bold text-indigo-300/40 tracking-wider uppercase px-4 text-center">
        {language === 'ko'
          ? '탭하면 주변 카드도 함께 뒤집힙니다! 모든 카드를 밝히세요.'
          : 'Tap a card to flip it and its neighbors! Light up all cards.'}
      </p>

      {/* Tutorial Modal */}
      {showTutorial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-lg px-4">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 text-slate-100 w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl p-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-2.5 mb-3 border-b border-white/10 pb-3">
              <span className="p-1.5 bg-indigo-500/10 text-indigo-400 rounded-lg shrink-0">
                <Zap size={16} />
              </span>
              <h3 className="text-base font-black text-white uppercase tracking-wider">
                {t('tutorial_title', language)}
              </h3>
            </div>
            <p className="text-xs sm:text-sm font-medium text-indigo-300/60 leading-relaxed mb-6 whitespace-pre-line">
              {t('tutorial_cardflip', language)}
            </p>
            <button
              onClick={handleStartGame}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl shadow-xl shadow-indigo-600/20 hover:shadow-2xl active:scale-95 transition-all cursor-pointer tracking-wider"
            >
              {t('tutorial_start_game', language)}
            </button>
          </div>
        </div>
      )}

      {/* Complete Modal */}
      {isComplete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-lg px-4">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 text-slate-100 w-full max-w-xs rounded-2xl overflow-hidden shadow-2xl p-6 text-center animate-in zoom-in-95 duration-200">
            <Trophy className={cn("w-12 h-12 text-amber-400 mx-auto mb-3", !lowSpecMode && "animate-bounce")} />
            <h3 className="text-lg font-black text-white mb-1">
              {language === 'ko' ? '클리어!' : 'Cleared!'}
            </h3>
            <p className="text-sm font-medium text-indigo-300/60 mb-4">
              {language === 'ko'
                ? `${moves}번 만에 성공!`
                : `Solved in ${moves} moves!`}
            </p>
            <div className="flex items-center justify-center gap-2 mb-6">
              <span className="text-3xl font-extrabold text-amber-400">+{Math.floor(reward * (size * size / Math.max(moves, 1)))}</span>
              <span className="text-xs font-semibold text-indigo-300/40">SNS</span>
            </div>
            <div className="flex flex-col gap-2">
              {level < DIFFICULTY_CONFIG.length - 1 && (
                <button
                  onClick={() => {
                    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                    setLevel(l => l + 1);
                  }}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl shadow-xl shadow-indigo-600/20 hover:shadow-2xl active:scale-95 transition-all cursor-pointer tracking-wider"
                >
                  {language === 'ko' ? '다음 레벨' : 'Next Level'}
                </button>
              )}
              <button
                onClick={() => {
                  playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                  initGame(true);
                }}
                className="w-full py-2.5 bg-white/10 hover:bg-white/15 border border-white/10 text-slate-200 font-black rounded-xl shadow-sm active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5 tracking-wider"
              >
                <RotateCcw size={14} />
                <span>{language === 'ko' ? '다시하기' : 'Retry'}</span>
              </button>
              <button
                onClick={onExit}
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-xl shadow-xl shadow-rose-600/20 hover:shadow-2xl active:scale-95 transition-all cursor-pointer tracking-wider"
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
