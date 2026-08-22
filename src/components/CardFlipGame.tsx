import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData, Language } from '../types';
import { CARD_DATABASE } from '../cardDatabase';
import { cn, getCardSpriteStyle } from '../lib/utils';
import { MobileSafeAreaHUD } from './MobileSafeAreaHUD';
import { UniversalTutorialModal } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { get2DGameTutorialSteps } from '../lib/mission2DCardTutorialEngine';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

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
  active: boolean;
}

const generateSolvablePuzzle = (size: number, moves: number, cardPool: number[]): FlipTile[] => {
  const totalTiles = size * size;
  const state: boolean[] = Array(totalTiles).fill(true);

  for (let m = 0; m < moves; m++) {
    const idx = Math.floor(Math.random() * totalTiles);
    const row = Math.floor(idx / size);
    const col = idx % size;
    state[idx] = !state[idx];
    if (row > 0) state[idx - size] = !state[idx - size];
    if (row < size - 1) state[idx + size] = !state[idx + size];
    if (col > 0) state[idx - 1] = !state[idx - 1];
    if (col < size - 1) state[idx + 1] = !state[idx + 1];
  }

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
  const isKo = language === 'ko';
  const [level, setLevel] = useState(0);
  const [tiles, setTiles] = useState<FlipTile[]>([]);
  const [moves, setMoves] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_game_2d_card_flip') !== 'true';
    } catch {
      return true;
    }
  });
  const [isPaused, setIsPaused] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const rewardedRef = useRef(false);
  const startTimeRef = useRef(Date.now());
  const toggleAnimMs = lowSpecMode ? 0 : TOGGLE_ANIM_MS;

  const { size, shuffleMoves } = DIFFICULTY_CONFIG[Math.min(level, DIFFICULTY_CONFIG.length - 1)];
  const totalTiles = size * size;

  const initGame = useCallback(() => {
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
    setSettlementReceipt(null);
    rewardedRef.current = false;
    startTimeRef.current = Date.now();
  }, [totalTiles, size, shuffleMoves, deck]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const toggleTile = (tileId: number) => {
    if (isAnimating || isComplete || isPaused || showTutorial) return;
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
      if (newTiles.every(t => t.active)) {
        setIsComplete(true);
        playSfx('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');

        if (!rewardedRef.current) {
          rewardedRef.current = true;
          const durationSeconds = Math.max(10, Math.round((Date.now() - startTimeRef.current) / 1000));
          const score = Math.max(100, 1000 - moves * 25 + level * 200);

          const receipt = calculateAndDepositMissionReward({
            gameId: 'card_flip',
            gameTitle: isKo ? '2D 카드 플립 퍼즐' : '2D Card Flip Puzzle',
            durationSeconds,
            score,
            maxTargetScore: 1200,
            isVictory: true,
            difficulty: level >= 2 ? 'HARD' : 'NORMAL',
            comboCount: Math.max(1, 10 - Math.floor(moves / 3)),
            perfectClear: moves <= shuffleMoves + 2
          });

          setSettlementReceipt(receipt);
          onReward(receipt.totalSns);
        }
      }
    }, toggleAnimMs);
  };

  const cellGap = size <= 3 ? 8 : size <= 4 ? 6 : 4;
  const activeCount = tiles.filter(t => t.active).length;
  const tutorialSteps = get2DGameTutorialSteps('card_flip', isKo);

  return (
    <div className="h-[100dvh] max-h-[100dvh] bg-[#fdfcfc] text-[#201d1d] flex flex-col items-center font-mono select-none w-full overflow-hidden justify-between">
      {/* Top Safe Area HUD */}
      <MobileSafeAreaHUD
        gameTitle={isKo ? '카드 플립 퍼즐' : 'Card Flip Puzzle'}
        score={activeCount * 50}
        customMetricLabel={isKo ? '수' : 'Moves'}
        customMetricValue={moves}
        isPaused={isPaused}
        language={language}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onTogglePause={() => setIsPaused(prev => !prev)}
      />

      {/* Info Stats */}
      <div className="flex items-center gap-3 text-xs font-bold my-2 py-1 px-4 bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] rounded-sm shadow-none shrink-0">
        <span className="text-[#646262]">
          {isKo ? '난이도' : 'STAGE'}: <span className="text-[#201d1d]">LV.{level + 1} ({size}x{size})</span>
        </span>
        <div className="w-px h-3 bg-[rgba(15,0,0,0.12)]" />
        <span className="text-[#201d1d]">
          {isKo ? '활성 카드' : 'ACTIVE'}: {activeCount}/{totalTiles}
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
              disabled={isComplete || isAnimating || isPaused}
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
        {isKo
          ? '[ 탭하면 인접 카드도 함께 반전됩니다 · 전체 카드를 활성화하세요 ]'
          : '[ TAP CARD TO TOGGLE NEIGHBORS · LIGHT UP ALL TILES ]'}
      </p>

      {/* 2D Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="2d_card_flip"
          gameTitle={isKo ? '2D 카드 플립 퍼즐' : '2D Card Flip Puzzle'}
          customSteps={tutorialSteps}
          language={language}
          onStartGame={() => setShowTutorial(false)}
          onClose={() => setShowTutorial(false)}
        />
      )}

      {/* Victory Reward Settlement Modal */}
      {isComplete && settlementReceipt && (
        <VictoryRewardModal
          receipt={settlementReceipt}
          language={language}
          onPlayAgain={() => {
            if (level < DIFFICULTY_CONFIG.length - 1) {
              setLevel(l => l + 1);
            } else {
              initGame();
            }
          }}
          onExit={onExit}
        />
      )}
    </div>
  );
};
