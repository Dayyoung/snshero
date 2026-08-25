import { drawCardSprite } from '../lib/canvasCardRenderer';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData, Language } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelArcaneNexusGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

const GRID_SIZE = 6;
const GEM_TYPES = ['🔥', '💧', '⚡', '🌿', '💎'] as const;
type GemType = (typeof GEM_TYPES)[number];

interface GemCell {
  id: number;
  type: GemType;
  matched: boolean;
}

export const VoxelArcaneNexusGame: React.FC<VoxelArcaneNexusGameProps> = ({
  deck = [],
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
  const playerHeroId = deck[0]?.id || 109;
  const [grid, setGrid] = useState<GemCell[][]>([]);
  const [selectedCell, setSelectedCell] = useState<{ r: number; c: number } | null>(null);
  const [score, setScore] = useState<number>(0);
  const [combo, setCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(40);

  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_game_arcane_gem_crush') !== 'true';
    } catch {
      return true;
    }
  });
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const startTimeRef = useRef<number>(Date.now());
  const gemIdCounter = useRef<number>(1);
  const dragStartPos = useRef<{ r: number; c: number; x: number; y: number } | null>(null);

  const getRandomGem = (): GemType => {
    return GEM_TYPES[Math.floor(Math.random() * GEM_TYPES.length)];
  };

  const createInitialGrid = useCallback((): GemCell[][] => {
    const newGrid: GemCell[][] = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      const row: GemCell[] = [];
      for (let c = 0; c < GRID_SIZE; c++) {
        let gem = getRandomGem();
        // Prevent initial 3-matches
        while (
          (r >= 2 && newGrid[r - 1][c].type === gem && newGrid[r - 2][c].type === gem) ||
          (c >= 2 && row[c - 1].type === gem && row[c - 2].type === gem)
        ) {
          gem = getRandomGem();
        }
        row.push({ id: gemIdCounter.current++, type: gem, matched: false });
      }
      newGrid.push(row);
    }
    return newGrid;
  }, []);

  const initGame = useCallback(() => {
    setGrid(createInitialGrid());
    setSelectedCell(null);
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setTimeLeft(40);
    setIsGameOver(false);
    setSettlementReceipt(null);
    startTimeRef.current = Date.now();
  }, [createInitialGrid]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  // Timer loop
  useEffect(() => {
    if (isGameOver || isPaused) return;

    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          endGame();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isGameOver, isPaused]);

  // Check and process 3+ matches
  const checkAndClearMatches = useCallback((currentGrid: GemCell[][]): { newGrid: GemCell[][]; matchCount: number } => {
    const matchedCoords: Set<string> = new Set();

    // Horizontal check
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE - 2; c++) {
        const type = currentGrid[r][c].type;
        if (type && currentGrid[r][c + 1].type === type && currentGrid[r][c + 2].type === type) {
          matchedCoords.add(`${r},${c}`);
          matchedCoords.add(`${r},${c + 1}`);
          matchedCoords.add(`${r},${c + 2}`);
        }
      }
    }

    // Vertical check
    for (let c = 0; c < GRID_SIZE; c++) {
      for (let r = 0; r < GRID_SIZE - 2; r++) {
        const type = currentGrid[r][c].type;
        if (type && currentGrid[r + 1][c].type === type && currentGrid[r + 2][c].type === type) {
          matchedCoords.add(`${r},${c}`);
          matchedCoords.add(`${r + 1},${c}`);
          matchedCoords.add(`${r + 2},${c}`);
        }
      }
    }

    if (matchedCoords.size === 0) {
      return { newGrid: currentGrid, matchCount: 0 };
    }

    // Clone and drop gems down
    const nextGrid = currentGrid.map((row) => row.map((cell) => ({ ...cell })));
    matchedCoords.forEach((coord) => {
      const [r, c] = coord.split(',').map(Number);
      nextGrid[r][c].matched = true;
    });

    // Collapse columns down
    for (let c = 0; c < GRID_SIZE; c++) {
      const remaining: GemType[] = [];
      for (let r = GRID_SIZE - 1; r >= 0; r--) {
        if (!nextGrid[r][c].matched) {
          remaining.push(nextGrid[r][c].type);
        }
      }
      for (let r = GRID_SIZE - 1; r >= 0; r--) {
        if (remaining.length > 0) {
          nextGrid[r][c] = { id: gemIdCounter.current++, type: remaining.shift()!, matched: false };
        } else {
          nextGrid[r][c] = { id: gemIdCounter.current++, type: getRandomGem(), matched: false };
        }
      }
    }

    return { newGrid: nextGrid, matchCount: matchedCoords.size };
  }, []);

  const swapAndMatch = useCallback((r1: number, c1: number, r2: number, c2: number) => {
    if (isGameOver || isPaused) return;

    const swapped = grid.map((row) => row.map((cell) => ({ ...cell })));
    const temp = swapped[r1][c1].type;
    swapped[r1][c1].type = swapped[r2][c2].type;
    swapped[r2][c2].type = temp;

    const { newGrid, matchCount } = checkAndClearMatches(swapped);

    if (matchCount > 0) {
      // Successful match
      playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
      const points = matchCount * 120 + combo * 50;
      setScore((s) => s + points);
      setCombo((cb) => {
        const next = cb + 1;
        setMaxCombo((m) => Math.max(m, next));
        return next;
      });

      // Cascade matches
      let currentCascadeGrid = newGrid;
      let cascadeMatches = 0;
      do {
        const cascadeRes = checkAndClearMatches(currentCascadeGrid);
        cascadeMatches = cascadeRes.matchCount;
        if (cascadeMatches > 0) {
          currentCascadeGrid = cascadeRes.newGrid;
          setScore((s) => s + cascadeMatches * 150);
        }
      } while (cascadeMatches > 0);

      setGrid(currentCascadeGrid);
    } else {
      // Invalid swap - revert
      playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
      setCombo(0);
    }
    setSelectedCell(null);
  }, [checkAndClearMatches, combo, grid, isGameOver, isPaused, playSfx]);

  // Pointer Down (Swipe start or Tap start)
  const handlePointerDown = (r: number, c: number, e: React.PointerEvent) => {
    dragStartPos.current = { r, c, x: e.clientX, y: e.clientY };
  };

  // Pointer Up (Swipe detect or Tap detect)
  const handlePointerUp = (r: number, c: number, e: React.PointerEvent) => {
    if (!dragStartPos.current) return;
    const { r: startR, c: startC, x: startX, y: startY } = dragStartPos.current;
    dragStartPos.current = null;

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    const swipeThreshold = 20;

    if (Math.abs(dx) > swipeThreshold || Math.abs(dy) > swipeThreshold) {
      // Swipe Gesture detected
      let targetR = startR;
      let targetC = startC;

      if (Math.abs(dx) > Math.abs(dy)) {
        // Horizontal swipe
        targetC += dx > 0 ? 1 : -1;
      } else {
        // Vertical swipe
        targetR += dy > 0 ? 1 : -1;
      }

      if (targetR >= 0 && targetR < GRID_SIZE && targetC >= 0 && targetC < GRID_SIZE) {
        swapAndMatch(startR, startC, targetR, targetC);
        return;
      }
    }

    // Tap Gesture handling
    if (!selectedCell) {
      setSelectedCell({ r, c });
      playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    } else {
      const dist = Math.abs(selectedCell.r - r) + Math.abs(selectedCell.c - c);
      if (dist === 1) {
        swapAndMatch(selectedCell.r, selectedCell.c, r, c);
      } else {
        setSelectedCell({ r, c });
        playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
      }
    }
  };

  const endGame = () => {
    setIsGameOver(true);
    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');

    const duration = (Date.now() - startTimeRef.current) / 1000;
    const receipt = calculateAndDepositMissionReward({
      gameId: 'arcade_gem_crush',
      gameTitle: '아케인 젬 크러시',
      durationSeconds: duration,
      score: score + maxCombo * 100,
      difficulty: 'NIGHTMARE',
      isVictory: score >= 2000,
    });
    setSettlementReceipt(receipt);
    onReward(receipt.totalSns);
  };

  const tutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 3개 이상 보석 매칭' : 'STEP 1: MATCH 3+ GEMS',
      title: isKo ? '같은 원소 보석을 일렬로 정렬하세요' : 'Align 3 Identical Element Gems',
      description: isKo
        ? '6x6 아케인 보드에서 손가락 스와이프 또는 탭으로 인접 보석을 교환하여 3개 이상 매칭하세요.'
        : 'Swipe or tap adjacent gems on the 6x6 board to match 3 or more in a row or column.',
      keyPoints: isKo
        ? [
            '가상 조이스틱 없는 100% 모바일 터치 스와이프',
            '3개 이상 매칭 시 즉시 원소 폭발 및 점수 획득',
            '연쇄 폭발(Cascade) 시 콤보 배수 보너스'
          ]
        : [
            '100% Mobile Touch Swipe (Zero Virtual Joysticks)',
            'Match 3+ to crush gems and gain score',
            'Cascade chain reactions award huge combo bonuses'
          ],
      iconType: 'GOAL',
    },
    {
      badge: isKo ? 'STEP 2: 모바일 퓨어 제스처' : 'STEP 2: PURE GESTURES',
      title: isKo ? '손가락 스와이프 / 원터치 탭' : 'Mobile Touch Swipe / Tap',
      description: isKo
        ? '보석을 손가락으로 슥 밀거나(Swipe) 탭하여 직관적으로 교환합니다.'
        : 'Swipe a gem in any direction or tap adjacent gems to swap instantly.',
      keyPoints: isKo
        ? [
            '👆 손가락 스와이프: 원하는 방향으로 보석 밀기',
            '⚡ 원터치 탭: 보석 선택 후 인접 칸 터치',
            '💥 화려한 원소 폭발 이펙트'
          ]
        : [
            '👆 Touch Swipe: Drag gem in any direction',
            '⚡ One-Touch Tap: Select and tap neighbor',
            '💥 Fluid elemental burst effects'
          ],
      iconType: 'GESTURES',
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '퍼즐 클리어 즉시 NIGHTMARE 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Nightmare payout deposited atomically to your LocalStorage wallet upon puzzle clear.',
      keyPoints: isKo
        ? [
            '완료 즉시 LocalStorage 영구 지갑 입금',
            '누적 점수 및 맥스 콤보 비례 대량 잭팟',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Score and max combo multipliers',
            'VictoryRewardModal golden coin fanfare'
          ],
      iconType: 'REWARDS',
    },
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-[#fdfcfc] text-[#201d1d] font-mono select-none flex flex-col overflow-hidden items-center justify-between touch-none">
      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '아케인 젬 크러시' : 'Arcane Gem Crush'}
        language={(language as Language) || 'ko'}
        telemetries={[
          { label: isKo ? '시간' : 'Time', value: `${timeLeft}s`, color: timeLeft <= 10 ? 'text-rose-600 font-bold animate-pulse' : 'text-cyan-700 font-bold' },
          { label: isKo ? '콤보' : 'Combo', value: `${combo}x`, color: combo > 5 ? 'text-amber-600 font-bold' : 'text-slate-700' },
          { label: isKo ? '점수' : 'Score', value: `${score}P`, color: 'text-emerald-700 font-bold' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => setIsPaused(prev => !prev)}
        isPaused={isPaused}
      />

      {/* 6x6 Pure Touch & Swipe Gem Board Viewport (Zero Virtual Buttons) */}
      <div className="flex-1 min-h-0 flex items-center justify-center relative overflow-hidden p-3 w-full max-w-sm touch-none select-none">
        <div className="w-full max-w-[340px] aspect-square grid grid-cols-6 gap-1.5 bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] p-2 touch-none">
          {grid.flatMap((row, r) =>
            row.map((cell, c) => {
              const isSelected = selectedCell?.r === r && selectedCell?.c === c;
              return (
                <div
                  key={cell.id}
                  onPointerDown={(e) => handlePointerDown(r, c, e)}
                  onPointerUp={(e) => handlePointerUp(r, c, e)}
                  className={`aspect-square flex items-center justify-center text-2xl rounded-none border transition-all cursor-pointer select-none active:scale-95 touch-none ${
                    isSelected
                      ? 'bg-amber-100 border-amber-500 scale-105 shadow-md ring-2 ring-amber-400'
                      : 'bg-white border-[rgba(15,0,0,0.12)] shadow-xs hover:border-[#201d1d]'
                  }`}
                >
                  {cell.type}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Minimal Bottom Guide */}
      <div className="w-full pb-3 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1 bg-black/5 border border-[rgba(15,0,0,0.12)] rounded-full text-[10px] text-[#6e6e73] font-mono">
          {isKo ? '보석을 원하는 방향으로 슥 밀거나(Swipe) 탭하세요' : 'Swipe or tap gems directly to match 3 in a row'}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="arcade_gem_crush"
          gameTitle={isKo ? '아케인 젬 크러시: 매치3 퍼즐' : 'Arcane Gem Crush: Match-3'}
          customSteps={tutorialSteps}
          language={(language as Language) || 'ko'}
          onStartGame={() => setShowTutorial(false)}
          onClose={() => setShowTutorial(false)}
        />
      )}

      {/* Victory Reward Settlement Modal */}
      {isGameOver && settlementReceipt && (
        <VictoryRewardModal
          receipt={settlementReceipt}
          language={(language as Language) || 'ko'}
          onPlayAgain={initGame}
          onExit={onExit}
        />
      )}
    </div>
  );
};
export default VoxelArcaneNexusGame;
