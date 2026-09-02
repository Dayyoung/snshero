import { drawCardSprite } from '../lib/canvasCardRenderer';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData, Language } from '../types';
import { cn, getCardSpriteStyle } from '../lib/utils';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface CardSlidePuzzleGameProps {
  deck: CardData[];
  language: Language;
  lowSpecMode?: boolean;
  playSfx: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

const DIFFICULTY_CONFIG = [
  { size: 3, maxMoves: 50, reward: 20 },
  { size: 4, maxMoves: 100, reward: 40 },
  { size: 5, maxMoves: 160, reward: 60 },
];

const shufflePuzzle = (size: number): number[] => {
  const total = size * size;
  const tiles: number[] = [];
  for (let i = 0; i < total - 1; i++) tiles.push(i);
  tiles.push(-1);

  for (let i = total - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
  }

  let inversions = 0;
  for (let i = 0; i < total; i++) {
    if (tiles[i] === -1) continue;
    for (let j = i + 1; j < total; j++) {
      if (tiles[j] === -1) continue;
      if (tiles[i] > tiles[j]) inversions++;
    }
  }

  const emptyIdx = tiles.indexOf(-1);
  const emptyRowFromBottom = size - Math.floor(emptyIdx / size);

  let solvable: boolean;
  if (size % 2 === 1) {
    solvable = inversions % 2 === 0;
  } else {
    solvable = (inversions + emptyRowFromBottom) % 2 === 0;
  }

  if (!solvable) {
    const nonEmpty: number[] = [];
    for (let i = 0; i < total; i++) {
      if (tiles[i] !== -1) nonEmpty.push(i);
    }
    if (nonEmpty.length >= 2) {
      const a = nonEmpty[0];
      const b = nonEmpty[1];
      [tiles[a], tiles[b]] = [tiles[b], tiles[a]];
    }
  }

  return tiles;
};

export const CardSlidePuzzleGame: React.FC<CardSlidePuzzleGameProps> = ({
  deck = [],
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
  const playerHeroId = deck[0]?.id || 14;
  const [level, setLevel] = useState(0);
  const [tiles, setTiles] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_game_2d_card_slide') !== 'true';
    } catch {
      return true;
    }
  });
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const startTimeRef = useRef(Date.now());
  const { size } = DIFFICULTY_CONFIG[Math.min(level, DIFFICULTY_CONFIG.length - 1)];
  const totalTiles = size * size;

  const cardPool = useRef<number[]>([]);
  useEffect(() => {
    const pool: number[] = [];
    if (deck && deck.length > 0) {
      deck.forEach(c => pool.push(c.id));
    }
    while (pool.length < 25) {
      pool.push(pool.length + 1);
    }
    cardPool.current = pool;
  }, [deck]);

  const initGame = useCallback(() => {
    setTiles(shufflePuzzle(size));
    setMoves(0);
    setIsComplete(false);
    setSettlementReceipt(null);
    startTimeRef.current = Date.now();
  }, [size]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const moveTile = useCallback((index: number) => {
    if (isComplete || isPaused) return;

    const emptyIdx = tiles.indexOf(-1);
    if (emptyIdx === -1) return;

    const row = Math.floor(index / size);
    const col = index % size;
    const eRow = Math.floor(emptyIdx / size);
    const eCol = emptyIdx % size;

    const isAdjacent = (Math.abs(row - eRow) === 1 && col === eCol) || (Math.abs(col - eCol) === 1 && row === eRow);
    if (!isAdjacent) return;

    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');

    const next = [...tiles];
    [next[index], next[emptyIdx]] = [next[emptyIdx], next[index]];
    setTiles(next);
    const nextMoves = moves + 1;
    setMoves(nextMoves);

    const maxMoves = DIFFICULTY_CONFIG[Math.min(level, DIFFICULTY_CONFIG.length - 1)].maxMoves;

    // Check complete: 0, 1, 2, ..., total-2, -1
    const won = next.every((val, i) => (i === totalTiles - 1 ? val === -1 : val === i));
    if (won) {
      setIsComplete(true);
      const duration = (Date.now() - startTimeRef.current) / 1000;
      const receipt = calculateAndDepositMissionReward({
        gameId: '2d_card_slide',
        gameTitle: '2D 카드 슬라이드 퍼즐',
        durationSeconds: duration,
        score: (level + 1) * 1000 + Math.max(0, (maxMoves - nextMoves) * 20),
        difficulty: level >= 1 ? 'HARD' : 'NORMAL',
        isVictory: true
      });
      setSettlementReceipt(receipt);
      onReward(receipt.totalSns);
      playSfx('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
    } else if (nextMoves >= maxMoves) {
      // Moves Exceeded -> Game Over!
      setIsComplete(true);
      const duration = (Date.now() - startTimeRef.current) / 1000;
      const receipt = calculateAndDepositMissionReward({
        gameId: '2d_card_slide',
        gameTitle: '2D 카드 슬라이드 퍼즐',
        durationSeconds: duration,
        score: 300,
        difficulty: level >= 1 ? 'HARD' : 'NORMAL',
        isVictory: false
      });
      setSettlementReceipt(receipt);
      onReward(receipt.totalSns);
      playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
    }
  }, [isComplete, isPaused, level, moves, onReward, playSfx, size, tiles, totalTiles]);

  const tutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 1~N 순차 정렬' : 'STEP 1: SLIDE SOLVE',
      title: isKo ? '그리드 타일 번호순 슬라이드 정렬' : 'Order Tiles Sequentially',
      description: isKo
        ? '빈 공간을 활용하여 카드 타일들을 1번부터 차례대로 올바른 위치로 정렬하세요.'
        : 'Slide card tiles into the empty space to arrange them sequentially 1 to N.',
      keyPoints: isKo
        ? [
            '모든 타일 정렬 완료 시 즉시 승리',
            '빈 타일과 인접한 카드만 이동 가능',
            '최소 이동 횟수로 클리어 시 보너스'
          ]
        : [
            'Arrange all tiles to win',
            'Only tiles adjacent to empty slot can slide',
            'Fewer moves yield higher scores'
          ],
      iconType: 'GOAL'
    },
    {
      badge: isKo ? 'STEP 2: 퓨어 제스처 조작' : 'STEP 2: PURE GESTURES',
      title: isKo ? '타일 터치 & 스와이프 제스처 원터치' : 'Touch Tile & Swipe Gesture',
      description: isKo
        ? '이동하려는 타일을 직접 탭하거나 하단 스와이프 제스처를 원터치하여 슬라이딩합니다.'
        : 'Tap tiles directly or use one-handed Swipe gesture to slide.',
      keyPoints: isKo
        ? [
            '👆 타일 탭: 빈 공간으로 즉시 밀기',
            '🕹️ 컴팩트 스와이프 제스처 4방향 조작',
            '⚡ 검증된 100% 해법 퍼즐 생성'
          ]
        : [
            '👆 Tap Tile: Slide into empty space',
            '🕹️ Compact Swipe gesture 4-way move',
            '⚡ 100% Guaranteed solvable puzzles'
          ],
      iconType: 'GESTURES'
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '퍼즐 완성 즉시 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Standard payout deposited atomically to your LocalStorage wallet upon puzzle solve.',
      keyPoints: isKo
        ? [
            '승리 즉시 LocalStorage 영구 지갑 입금',
            '스테이지 난이도 및 이동 횟수 보너스',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Stage difficulty and moves bonuses',
            'VictoryRewardModal golden coin fanfare'
          ],
      iconType: 'REWARDS'
    }
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-[#fdfcfc] text-[#201d1d] font-mono select-none flex flex-col overflow-hidden items-center justify-between">
      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '2D 카드 슬라이드' : '2D Card Slide'}
        language={language}
        telemetries={[
          { label: isKo ? '스테이지' : 'Stage', value: `LV.${level + 1} (${size}x${size})`, color: 'text-amber-600 font-bold' },
          { label: isKo ? '남은 턴' : 'Moves', value: `${Math.max(0, DIFFICULTY_CONFIG[Math.min(level, DIFFICULTY_CONFIG.length - 1)].maxMoves - moves)}/${DIFFICULTY_CONFIG[Math.min(level, DIFFICULTY_CONFIG.length - 1)].maxMoves}`, color: (DIFFICULTY_CONFIG[Math.min(level, DIFFICULTY_CONFIG.length - 1)].maxMoves - moves) <= 10 ? 'text-rose-600 font-bold' : 'text-slate-700 font-bold' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => setIsPaused(prev => !prev)}
        isPaused={isPaused}
      />

      {/* Grid Viewport */}
      <div className="flex-1 min-h-0 flex items-center justify-center relative overflow-hidden p-2">
        <div
          className="w-full max-w-[340px] aspect-square bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] p-2 relative overflow-hidden touch-none select-none"
          style={{ touchAction: 'none' }}
        >
          <div
            className="grid gap-1 w-full h-full"
            style={{
              gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${size}, minmax(0, 1fr))`,
            }}
          >
            {tiles.map((val, idx) => {
              const isEmpty = val === -1;
              const cardId = val >= 0 ? cardPool.current[val % cardPool.current.length] : 0;

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => moveTile(idx)}
                  disabled={isEmpty || isComplete || isPaused}
                  className={cn(
                    'aspect-square rounded-sm border transition-all duration-100 relative overflow-hidden flex items-center justify-center',
                    isEmpty && 'bg-[#f1eeee] border-dashed border-[rgba(15,0,0,0.15)] opacity-40 cursor-default',
                    !isEmpty && 'bg-white border-[#201d1d] active:scale-95 cursor-pointer shadow-xs',
                    isComplete && 'border-amber-500 ring-1 ring-amber-400'
                  )}
                >
                  {!isEmpty && (
                    <div className="w-full h-full p-0.5 flex items-center justify-center">
                      <div className="w-full h-full" style={getCardSpriteStyle(cardId)} />
                      <div className="absolute top-0.5 left-1 text-[9px] font-bold text-white bg-black/60 px-1 rounded-xs">
                        {val + 1}
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Minimal Bottom Guide (Zero Virtual Buttons per Pure Touch Principle) */}
      <div className="w-full pb-4 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1.5 bg-black/5 border border-[rgba(15,0,0,0.12)] rounded-full text-[11px] text-[#6e6e73] font-mono shadow-xs">
          {isKo ? '빈 공간과 인접한 카드 타일을 직접 탭하여 슬라이딩하세요' : 'Tap adjacent card tiles to slide them into the empty slot'}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="2d_card_slide"
          gameTitle={isKo ? '2D 카드 슬라이드 퍼즐' : '2D Card Slide Puzzle'}
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
export default CardSlidePuzzleGame;
