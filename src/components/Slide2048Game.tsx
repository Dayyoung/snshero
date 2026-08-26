import { drawCardSprite } from '../lib/canvasCardRenderer';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData, Language } from '../types';
import { cn, getCardSpriteStyle } from '../lib/utils';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface Slide2048GameProps {
  deck: CardData[];
  language: Language;
  lowSpecMode?: boolean;
  playSfx: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

const GRID_SIZE = 4;

export const Slide2048Game: React.FC<Slide2048GameProps> = ({
  deck = [],
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
  const playerHeroId = deck[0]?.id || 10;
  const [grid, setGrid] = useState<number[][]>(() =>
    Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0))
  );
  const [score, setScore] = useState(0);
  const [maxTile, setMaxTile] = useState(2);
  const [isPaused, setIsPaused] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_game_arcade_2048') !== 'true';
    } catch {
      return true;
    }
  });
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const startTimeRef = useRef(Date.now());
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const addRandomTile = (currentGrid: number[][]): number[][] => {
    const empty: [number, number][] = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (currentGrid[r][c] === 0) empty.push([r, c]);
      }
    }
    if (empty.length === 0) return currentGrid;

    const [r, c] = empty[Math.floor(Math.random() * empty.length)];
    const val = Math.random() < 0.9 ? 2 : 4;
    const next = currentGrid.map(row => [...row]);
    next[r][c] = val;
    return next;
  };

  const initGame = useCallback(() => {
    let g: number[][] = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0));
    g = addRandomTile(g);
    g = addRandomTile(g);
    setGrid(g);
    setScore(0);
    setMaxTile(4);
    setIsGameOver(false);
    setSettlementReceipt(null);
    startTimeRef.current = Date.now();
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const slideRow = (row: number[]): { newRow: number[]; scoreGained: number } => {
    const filtered = row.filter(v => v !== 0);
    const merged: number[] = [];
    let scoreGained = 0;

    for (let i = 0; i < filtered.length; i++) {
      if (i < filtered.length - 1 && filtered[i] === filtered[i + 1]) {
        const val = filtered[i] * 2;
        merged.push(val);
        scoreGained += val;
        i++;
      } else {
        merged.push(filtered[i]);
      }
    }
    while (merged.length < GRID_SIZE) merged.push(0);
    return { newRow: merged, scoreGained };
  };

  const handleMove = (dir: 'up' | 'down' | 'left' | 'right') => {
    if (isGameOver || isPaused) return;

    let next = grid.map(row => [...row]);
    let totalScoreGained = 0;

    if (dir === 'left') {
      for (let r = 0; r < GRID_SIZE; r++) {
        const { newRow, scoreGained } = slideRow(next[r]);
        next[r] = newRow;
        totalScoreGained += scoreGained;
      }
    } else if (dir === 'right') {
      for (let r = 0; r < GRID_SIZE; r++) {
        const { newRow, scoreGained } = slideRow(next[r].reverse());
        next[r] = newRow.reverse();
        totalScoreGained += scoreGained;
      }
    } else if (dir === 'up') {
      for (let c = 0; c < GRID_SIZE; c++) {
        const col = [next[0][c], next[1][c], next[2][c], next[3][c]];
        const { newRow, scoreGained } = slideRow(col);
        for (let r = 0; r < GRID_SIZE; r++) next[r][c] = newRow[r];
        totalScoreGained += scoreGained;
      }
    } else if (dir === 'down') {
      for (let c = 0; c < GRID_SIZE; c++) {
        const col = [next[3][c], next[2][c], next[1][c], next[0][c]];
        const { newRow, scoreGained } = slideRow(col);
        for (let r = 0; r < GRID_SIZE; r++) next[3 - r][c] = newRow[r];
        totalScoreGained += scoreGained;
      }
    }

    // Check if moved
    const moved = JSON.stringify(grid) !== JSON.stringify(next);
    if (moved) {
      next = addRandomTile(next);
      setGrid(next);
      const newScore = score + totalScoreGained;
      setScore(newScore);
      playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');

      // Max tile check
      let curMax = 2;
      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          if (next[r][c] > curMax) curMax = next[r][c];
        }
      }
      setMaxTile(curMax);

      // Check 2048 Win
      if (curMax >= 2048 && !isGameOver) {
        setIsGameOver(true);
        const duration = (Date.now() - startTimeRef.current) / 1000;
        const receipt = calculateAndDepositMissionReward({
          gameId: 'arcade_2048',
          gameTitle: '2048 카드 슬라이드',
          durationSeconds: duration,
          score: newScore + 3000,
          difficulty: 'HARD',
          isVictory: true
        });
        setSettlementReceipt(receipt);
        onReward(receipt.totalSns);
      }
    }
  };

  const tutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 2048 타일 합성' : 'STEP 1: MERGE TO 2048',
      title: isKo ? '같은 숫자 타일 합성 & 2048 달성' : 'Merge Identical Tiles to 2048',
      description: isKo
        ? '4x4 그리드에서 같은 숫자의 타일을 한 방향으로 밀어 2048 타일을 완성하세요.'
        : 'Slide matching tiles on 4x4 grid to merge them into 2048.',
      keyPoints: isKo
        ? [
            '2048 타일 완성 시 완승',
            '빈 공간이 없고 합성이 불가능하면 게임 오버',
            '타일 합성 시 누적 점수 획득'
          ]
        : [
            'Reach 2048 tile to win',
            'No empty space & no moves causes game over',
            'Merge tiles to gain score'
          ],
      iconType: 'GOAL'
    },
    {
      badge: isKo ? 'STEP 2: 퓨어 제스처 조작' : 'STEP 2: PURE GESTURES',
      title: isKo ? '화면 스와이프 & 스와이프 제스처' : 'Swipe & Swipe Gesture Slide',
      description: isKo
        ? '화면을 상하좌우로 스와이프하거나 하단 스와이프 제스처를 원터치하여 슬라이딩합니다.'
        : 'Swipe screen or tap one-handed Swipe gesture in 4 directions.',
      keyPoints: isKo
        ? [
            '👆 스와이프: 4방향 전 타일 일괄 이동',
            '🕹️ 컴팩트 스와이프 제스처 원터치 조작',
            '⚡ 실시간 타일 합성 애니메이션'
          ]
        : [
            '👆 Swipe: Slide all tiles in 4 directions',
            '🕹️ Compact Swipe gesture one-touch move',
            '⚡ Real-time merge animations'
          ],
      iconType: 'GESTURES'
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '게임 종료 즉시 HARD 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Standard payout deposited atomically to your LocalStorage wallet upon game completion.',
      keyPoints: isKo
        ? [
            '승리 즉시 LocalStorage 영구 지갑 입금',
            '최고 타일 및 누적 점수 보너스',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Max tile and total score multipliers',
            'VictoryRewardModal golden coin fanfare'
          ],
      iconType: 'REWARDS'
    }
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-[#fdfcfc] text-[#201d1d] font-mono select-none flex flex-col overflow-hidden items-center justify-between">
      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '2048 슬라이드' : '2048 Slide'}
        language={language}
        telemetries={[
          { label: isKo ? '최고' : 'Max', value: `${maxTile}`, color: 'text-amber-600 font-bold' },
          { label: isKo ? '점수' : 'Score', value: `${score}P`, color: 'text-cyan-700 font-bold' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => setIsPaused(prev => !prev)}
        isPaused={isPaused}
      />

      {/* Grid Viewport */}
      <div className="flex-1 min-h-0 flex items-center justify-center relative overflow-hidden p-2 w-full max-w-sm">
        <div
          className="w-full max-w-[340px] aspect-square bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] p-2 relative overflow-hidden touch-none select-none"
          style={{ touchAction: 'none' }}
          onTouchStart={(e) => {
            touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
          }}
          onTouchEnd={(e) => {
            if (!touchStartRef.current) return;
            const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
            const dy = e.changedTouches[0].clientY - touchStartRef.current.y;
            if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 20) {
              handleMove(dx > 0 ? 'right' : 'left');
            } else if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 20) {
              handleMove(dy > 0 ? 'down' : 'up');
            }
            touchStartRef.current = null;
          }}
        >
          <div className="grid grid-cols-4 gap-1.5 w-full h-full">
            {grid.flatMap((row, r) =>
              row.map((val, c) => {
                const cardMap: Record<number, number> = {
                  2: 1,
                  4: 5,
                  8: 12,
                  16: 25,
                  32: 40,
                  64: 60,
                  128: 80,
                  256: 95,
                  512: 105,
                  1024: 120,
                  2048: 150,
                };
                const tileCardId = cardMap[val] || 1;

                return (
                  <div
                    key={`${r}-${c}`}
                    className={cn(
                      'aspect-square rounded-sm border transition-all duration-100 flex flex-col items-center justify-center font-bold text-xs select-none relative overflow-hidden',
                      val === 0 && 'border-[rgba(15,0,0,0.06)] bg-white/40 text-transparent',
                      val === 2 && 'border-indigo-300 bg-indigo-50 text-indigo-900',
                      val === 4 && 'border-indigo-400 bg-indigo-100 text-indigo-900',
                      val === 8 && 'border-amber-400 bg-amber-100 text-amber-900',
                      val === 16 && 'border-amber-500 bg-amber-200 text-amber-950',
                      val >= 32 && val < 128 && 'border-rose-400 bg-rose-100 text-rose-900',
                      val >= 128 && 'border-amber-500 bg-amber-500 text-white shadow-xs'
                    )}
                  >
                    {val > 0 && (
                      <>
                        <div
                          className="w-8 h-8 rounded-full border border-black/20 shadow-xs mb-0.5"
                          style={getCardSpriteStyle(tileCardId)}
                        />
                        <span className="text-[10px] font-mono leading-none bg-black/60 text-white px-1 rounded-xs">
                          {val}
                        </span>
                      </>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Minimal Bottom Guide (Zero Virtual Buttons per Pure Touch Principle) */}
      <div className="w-full pb-4 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1.5 bg-black/5 border border-[rgba(15,0,0,0.12)] rounded-full text-[11px] text-[#6e6e73] font-mono shadow-xs">
          {isKo ? '화면 어디든 상하좌우 스와이프하여 카드 타일을 합치세요' : 'Swipe anywhere to slide and merge card tiles'}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="arcade_2048"
          gameTitle={isKo ? '2048 카드 슬라이드' : '2048 Card Slide'}
          customSteps={tutorialSteps}
          language={language}
          onStartGame={() => setShowTutorial(false)}
          onClose={() => setShowTutorial(false)}
        />
      )}

      {/* Victory Reward Settlement Modal */}
      {isGameOver && settlementReceipt && (
        <VictoryRewardModal
          receipt={settlementReceipt}
          language={language}
          onPlayAgain={initGame}
          onExit={onExit}
        />
      )}
    </div>
  );
};
export default Slide2048Game;
