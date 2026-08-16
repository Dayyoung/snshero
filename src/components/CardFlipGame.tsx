import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, RotateCcw, Trophy, Zap, Lightbulb } from 'lucide-react';
import { CARD_DATABASE } from '../cardDatabase';
import { CardData, Language } from '../types';
import { t } from '../lib/i18n';
import { cn, getAssetUrl, getCardSpriteStyle } from '../lib/utils';

interface CardFlipGameProps {
  deck: CardData[];
  language: Language;
  lowSpecMode?: boolean;
  playSfx: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

const DIFFICULTY_CONFIG = [
  { size: 3, shuffleMoves: 5, reward: 15 },
  { size: 4, shuffleMoves: 10, reward: 30 },
  { size: 5, shuffleMoves: 18, reward: 45 },
  { size: 6, shuffleMoves: 28, reward: 60 },
];

interface FlipTile {
  id: number;
  cardId: number;
  active: boolean; // true = showing card sprite (ON), false = showing back (OFF)
}

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
    <div className="h-[100dvh] max-h-[100dvh] bg-[#fdfcfc] text-[#201d1d] flex flex-col items-center font-mono select-none pb-2 w-full overflow-hidden justify-between">
      {/* Header */}
      <header className="w-full h-12 flex items-center justify-between border-b border-[rgba(15,0,0,0.12)] px-3 sm:px-4 bg-[#fdfcfc] shrink-0">
        <button
          onClick={onExit}
          className="px-2.5 py-1.5 bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] rounded-sm hover:bg-[#f1eeee] text-[#201d1d] transition-colors cursor-pointer flex items-center gap-1 min-h-[44px]"
        >
          <ArrowLeft size={16} />
          <span className="text-xs font-bold">[ESC]</span>
        </button>
        <div className="text-center">
          <h1 className="text-sm sm:text-base font-bold text-[#201d1d] tracking-tight">
            {language === 'ko' ? '카드 플립 퍼즐' : 'CARD FLIP'}
          </h1>
          <div className="text-[9px] font-bold text-[#6e6e73] uppercase tracking-wider">
            [ LV.{level + 1} · {size}×{size} ]
          </div>
        </div>
        <button
          onClick={() => {
            playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
            initGame(true);
          }}
          className="px-2.5 py-1.5 bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] rounded-sm hover:bg-[#f1eeee] text-[#201d1d] transition-colors cursor-pointer flex items-center gap-1 min-h-[44px]"
        >
          <RotateCcw size={14} />
          <span className="text-xs font-bold">[R]</span>
        </button>
      </header>

      {/* Info Stats */}
      <div className="flex items-center gap-3 text-xs font-bold my-2 py-1.5 px-4 bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] rounded-sm shadow-none shrink-0">
        <span className="text-[#646262]">
          {language === 'ko' ? '이동 횟수' : 'MOVES'}: <span className="text-[#201d1d]">{moves}</span>
        </span>
        <div className="w-px h-3 bg-[rgba(15,0,0,0.12)]" />
        <span className="text-[#201d1d]">
          <Lightbulb size={12} className="inline mr-1 text-[#201d1d]" />
          {activeCount}/{totalTiles}
        </span>
      </div>

      {/* Responsive Grid Container */}
      <div className="w-full max-w-md px-3 flex justify-center flex-1 min-h-0 items-center">
        <div
          className="grid p-2.5 bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] rounded-none shadow-none w-full max-w-[340px] max-h-[50vh]"
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
                'aspect-square rounded-sm border transition-all duration-150 select-none outline-none relative overflow-hidden',
                'cursor-pointer hover:opacity-90 active:scale-95 min-h-[36px]',
                tile.active && 'border-[#201d1d] bg-[#0f0000]',
                !tile.active && 'border-[rgba(15,0,0,0.15)] bg-[#f1eeee]',
                isComplete && 'border-[#201d1d] ring-1 ring-[#201d1d]',
              )}
            >
              {tile.active && (
                <div
                  className="w-full h-full rounded-none"
                  style={getCardSpriteStyle(tile.cardId)}
                />
              )}
              {!tile.active && (
                <div className="w-full h-full bg-[#f1eeee] rounded-none flex items-center justify-center relative overflow-hidden border border-[rgba(15,0,0,0.06)]">
                  <div className="w-5 h-5 rounded-sm bg-[#e5e1e1] border border-[rgba(15,0,0,0.1)] flex items-center justify-center">
                    <span className="text-[10px] font-bold text-[#6e6e73]">?</span>
                  </div>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Hint text */}
      <p className="my-2 text-[10px] font-bold text-[#6e6e73] tracking-wider uppercase px-4 text-center shrink-0">
        {language === 'ko'
          ? '[ 탭하면 인접 카드도 함께 반전됩니다 · 전체 카드를 활성화하세요 ]'
          : '[ TAP CARD TO TOGGLE NEIGHBORS · LIGHT UP ALL TILES ]'}
      </p>

      {/* Tutorial Modal */}
      {showTutorial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f0000]/70 backdrop-blur-none px-4 font-mono">
          <div className="bg-[#fdfcfc] border border-[rgba(15,0,0,0.2)] text-[#201d1d] w-full max-w-sm rounded-none p-5 animate-none">
            <div className="flex items-center gap-2 mb-3 border-b border-[rgba(15,0,0,0.12)] pb-2.5">
              <span className="p-1 bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] rounded-sm text-[#201d1d] shrink-0">
                <Zap size={14} />
              </span>
              <h3 className="text-sm font-bold text-[#201d1d] uppercase tracking-wider">
                [ {t('tutorial_title', language)} ]
              </h3>
            </div>
            <p className="text-xs font-medium text-[#424245] leading-relaxed mb-5 whitespace-pre-line">
              {t('tutorial_cardflip', language)}
            </p>
            <button
              onClick={handleStartGame}
              className="w-full py-2.5 bg-[#201d1d] hover:bg-[#302c2c] text-[#fdfcfc] font-bold text-xs rounded-sm border border-[#201d1d] active:scale-95 transition-all cursor-pointer min-h-[44px]"
            >
              [ {t('tutorial_start_game', language)} ]
            </button>
          </div>
        </div>
      )}

      {/* Complete Modal */}
      {isComplete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f0000]/70 backdrop-blur-none px-4 font-mono">
          <div className="bg-[#fdfcfc] border border-[rgba(15,0,0,0.2)] text-[#201d1d] w-full max-w-xs rounded-none p-5 text-center animate-none">
            <Trophy className="w-10 h-10 text-[#201d1d] mx-auto mb-2" />
            <h3 className="text-base font-bold text-[#201d1d] mb-1">
              {language === 'ko' ? '[ 퍼즐 클리어! ]' : '[ PUZZLE CLEARED! ]'}
            </h3>
            <p className="text-xs font-medium text-[#424245] mb-3">
              {language === 'ko'
                ? `${moves}수 만에 완성!`
                : `Solved in ${moves} moves!`}
            </p>
            <div className="flex items-center justify-center gap-1.5 mb-4 p-2 bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] rounded-sm">
              <span className="text-2xl font-bold text-[#201d1d]">+{Math.min(60, Math.max(15, Math.floor(reward * (size * size / Math.max(moves, 1)))))}</span>
              <span className="text-xs font-bold text-[#6e6e73]">SNS</span>
            </div>
            <div className="flex flex-col gap-2">
              {level < DIFFICULTY_CONFIG.length - 1 && (
                <button
                  onClick={() => {
                    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                    setLevel(l => l + 1);
                  }}
                  className="w-full py-2.5 bg-[#201d1d] hover:bg-[#302c2c] text-[#fdfcfc] font-bold text-xs rounded-sm active:scale-95 transition-all cursor-pointer min-h-[44px]"
                >
                  {language === 'ko' ? '[ 다음 레벨 ]' : '[ Next Level ]'}
                </button>
              )}
              <button
                onClick={() => {
                  playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                  initGame(true);
                }}
                className="w-full py-2.5 bg-[#f8f7f7] hover:bg-[#f1eeee] border border-[rgba(15,0,0,0.18)] text-[#201d1d] font-bold text-xs rounded-sm active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5 min-h-[44px]"
              >
                <RotateCcw size={14} />
                <span>{language === 'ko' ? '[ 다시하기 ]' : '[ Retry ]'}</span>
              </button>
              <button
                onClick={onExit}
                className="w-full py-2.5 bg-[#f1eeee] hover:bg-[#e5e1e1] border border-[rgba(15,0,0,0.18)] text-[#201d1d] font-bold text-xs rounded-sm active:scale-95 transition-all cursor-pointer min-h-[44px]"
              >
                {language === 'ko' ? '[ 나가기 ]' : '[ Exit ]'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
