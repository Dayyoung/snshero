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
  deck: _deck,
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
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

  const handleCellClick = (r: number, c: number) => {
    if (isGameOver || isPaused) return;

    if (!selectedCell) {
      setSelectedCell({ r, c });
      playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
      return;
    }

    const dist = Math.abs(selectedCell.r - r) + Math.abs(selectedCell.c - c);
    if (dist === 1) {
      // Swap adjacent gems
      const swapped = grid.map((row) => row.map((cell) => ({ ...cell })));
      const temp = swapped[selectedCell.r][selectedCell.c].type;
      swapped[selectedCell.r][selectedCell.c].type = swapped[r][c].type;
      swapped[r][c].type = temp;

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
    } else {
      // Pick another cell
      setSelectedCell({ r, c });
      playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
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
        ? '6x6 아케인 보드에서 인접한 보석의 위치를 교환하여 가로/세로 3개 이상 일렬로 매칭하세요.'
        : 'Swap adjacent gems on the 6x6 board to match 3 or more in a row or column.',
      keyPoints: isKo
        ? [
            '3개 이상 매칭 시 즉시 폭발 및 점수 획득',
            '연쇄 폭발(Cascade) 시 콤보 배수 보너스',
            '40초 타임어택 내 최고 점수 달성'
          ]
        : [
            'Match 3+ to crush gems and gain score',
            'Cascade chain reactions award huge combo bonuses',
            'Score maximum points within 40 seconds'
          ],
      iconType: 'GOAL',
    },
    {
      badge: isKo ? 'STEP 2: 퓨어 제스처 조작' : 'STEP 2: PURE GESTURES',
      title: isKo ? '보석 원터치 탭 & 스와이프' : 'One-Touch Gem Tap & Swap',
      description: isKo
        ? '교환할 보석을 탭하고 인접한 보석을 탭하여 즉시 자리를 바꿉니다.'
        : 'Tap a gem and tap an adjacent neighbor to swap positions.',
      keyPoints: isKo
        ? [
            '👆 보석 원터치 선택 후 인접 칸 탭',
            '⚡ 매칭 불가 시 원래 자리로 복귀',
            '💥 화려한 원소 폭발 이펙트'
          ]
        : [
            '👆 Tap gem and tap neighbor to swap',
            '⚡ Invalid swaps automatically revert',
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
    <div className="relative w-full h-[100dvh] bg-[#fdfcfc] text-[#201d1d] font-mono select-none flex flex-col overflow-hidden items-center justify-between">
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

      {/* 6x6 Gem Board Viewport */}
      <div className="flex-1 min-h-0 flex items-center justify-center relative overflow-hidden p-3 w-full max-w-sm">
        <div className="w-full max-w-[340px] aspect-square grid grid-cols-6 gap-1.5 bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] p-2">
          {grid.flatMap((row, r) =>
            row.map((cell, c) => {
              const isSelected = selectedCell?.r === r && selectedCell?.c === c;
              return (
                <button
                  key={cell.id}
                  type="button"
                  onClick={() => handleCellClick(r, c)}
                  disabled={isGameOver || isPaused}
                  className={`aspect-square flex items-center justify-center text-2xl rounded-none border transition-all cursor-pointer select-none active:scale-95 ${
                    isSelected
                      ? 'bg-amber-100 border-amber-500 scale-105 shadow-md ring-2 ring-amber-400'
                      : 'bg-white border-[rgba(15,0,0,0.12)] shadow-xs hover:border-[#201d1d]'
                  }`}
                >
                  {cell.type}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Minimal Bottom Guide */}
      <div className="w-full pb-3 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1 bg-black/5 border border-[rgba(15,0,0,0.12)] rounded-full text-[10px] text-[#6e6e73] font-mono">
          {isKo ? '보석을 탭하여 인접 칸과 교환하세요 (가로/세로 3개 매칭)' : 'Tap gems to swap and match 3 in a row'}
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
