import { drawCardSprite } from '../lib/canvasCardRenderer';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData, Language } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelFactoryCraftGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

const CHIP_TIERS = [
  { level: 1, val: 2, icon: '💾', name: '실리콘', color: '#64748b' },
  { level: 2, val: 4, icon: '⚡', name: '트랜지스터', color: '#0ea5e9' },
  { level: 3, val: 8, icon: '🔋', name: '커패시터', color: '#10b981' },
  { level: 4, val: 16, icon: '📟', name: '마이크로칩', color: '#f59e0b' },
  { level: 5, val: 32, icon: '🧠', name: 'AI 프로세서', color: '#a855f7' },
  { level: 6, val: 64, icon: '🔮', name: '양자 코어', color: '#ec4899' },
  { level: 7, val: 128, icon: '☀️', name: '초지능 코어', color: '#eab308' },
];

export const VoxelFactoryCraftGame: React.FC<VoxelFactoryCraftGameProps> = ({
  deck = [],
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
  const playerHeroId = deck[0]?.id || 59;

  const [board, setBoard] = useState<number[][]>([
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ]);
  const [score, setScore] = useState<number>(0);
  const [maxChipLevel, setMaxChipLevel] = useState<number>(1);
  const [mergeCombo, setMergeCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(35);
  const [feedbackText, setFeedbackText] = useState<string | null>(null);

  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_game_chip_merge') !== 'true';
    } catch {
      return true;
    }
  });
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const stateRef = useRef({
    board: [
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    score: 0,
    maxLevel: 1,
    mergeCombo: 0,
    maxCombo: 0,
    timeLeft: 35,
    isGameOver: false,
    isPaused: false,
    startTime: Date.now(),
    touchStart: { x: 0, y: 0 },
  });

  const spawnRandomChip = useCallback((currentBoard: number[][]) => {
    const emptyCells: { r: number; c: number }[] = [];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (currentBoard[r][c] === 0) emptyCells.push({ r, c });
      }
    }
    if (emptyCells.length === 0) return false;

    const chosen = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    currentBoard[chosen.r][chosen.c] = Math.random() < 0.8 ? 1 : 2;
    return true;
  }, []);

  const initGame = useCallback(() => {
    const s = stateRef.current;
    const initialBoard = [
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];
    s.board = initialBoard;
    s.score = 0;
    s.maxLevel = 1;
    s.mergeCombo = 0;
    s.maxCombo = 0;
    s.timeLeft = 35;
    s.isGameOver = false;
    s.startTime = Date.now();

    spawnRandomChip(initialBoard);
    spawnRandomChip(initialBoard);

    setBoard([...initialBoard.map((r) => [...r])]);
    setScore(0);
    setMaxChipLevel(1);
    setMergeCombo(0);
    setMaxCombo(0);
    setTimeLeft(35);
    setFeedbackText(null);
    setIsGameOver(false);
    setSettlementReceipt(null);
  }, [spawnRandomChip]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  // Timer loop
  useEffect(() => {
    if (isGameOver || isPaused) return;

    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          endGame(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isGameOver, isPaused]);

  // Process 2048 4-Way Swipe Merge Logic
  const handleSwipeMove = useCallback(
    (dir: Direction) => {
      const s = stateRef.current;
      if (s.isGameOver || s.isPaused) return;

      let moved = false;
      let mergedThisTurn = false;
      const b = s.board.map((r) => [...r]);

      const slideArray = (row: number[]) => {
        let arr = row.filter((v) => v !== 0);
        for (let i = 0; i < arr.length - 1; i++) {
          if (arr[i] === arr[i + 1]) {
            arr[i] += 1; // Level up!
            if (arr[i] > s.maxLevel) s.maxLevel = arr[i];

            const pts = Math.pow(2, arr[i]) * 10;
            s.score += pts;
            mergedThisTurn = true;
            arr.splice(i + 1, 1);
          }
        }
        while (arr.length < 4) arr.push(0);
        return arr;
      };

      if (dir === 'LEFT') {
        for (let r = 0; r < 4; r++) {
          const newRow = slideArray(b[r]);
          if (newRow.some((v, i) => v !== b[r][i])) moved = true;
          b[r] = newRow;
        }
      } else if (dir === 'RIGHT') {
        for (let r = 0; r < 4; r++) {
          const reversed = [...b[r]].reverse();
          const newRow = slideArray(reversed).reverse();
          if (newRow.some((v, i) => v !== b[r][i])) moved = true;
          b[r] = newRow;
        }
      } else if (dir === 'UP') {
        for (let c = 0; c < 4; c++) {
          const col = [b[0][c], b[1][c], b[2][c], b[3][c]];
          const newCol = slideArray(col);
          for (let r = 0; r < 4; r++) {
            if (b[r][c] !== newCol[r]) moved = true;
            b[r][c] = newCol[r];
          }
        }
      } else if (dir === 'DOWN') {
        for (let c = 0; c < 4; c++) {
          const col = [b[3][c], b[2][c], b[1][c], b[0][c]];
          const newCol = slideArray(col).reverse();
          for (let r = 0; r < 4; r++) {
            if (b[r][c] !== newCol[r]) moved = true;
            b[r][c] = newCol[r];
          }
        }
      }

      if (moved) {
        if (mergedThisTurn) {
          s.mergeCombo += 1;
          if (s.mergeCombo > s.maxCombo) s.maxCombo = s.mergeCombo;

          setFeedbackText(`CHIP MERGE! +${s.mergeCombo} COMBO ⚡`);
          setTimeout(() => setFeedbackText(null), 350);
          playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
        } else {
          s.mergeCombo = 0;
          playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
        }

        spawnRandomChip(b);
        s.board = b;
        setBoard([...b.map((r) => [...r])]);
        setScore(s.score);
        setMaxChipLevel(s.maxLevel);
        setMergeCombo(s.mergeCombo);
        setMaxCombo(s.maxCombo);
      }
    },
    [playSfx, spawnRandomChip]
  );

  // Touch Swipe Gesture Handlers (Zero Joysticks)
  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    stateRef.current.touchStart = { x: clientX, y: clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent | React.MouseEvent) => {
    const clientX = 'changedTouches' in e ? e.changedTouches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'changedTouches' in e ? e.changedTouches[0].clientY : (e as React.MouseEvent).clientY;

    const dx = clientX - stateRef.current.touchStart.x;
    const dy = clientY - stateRef.current.touchStart.y;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (Math.max(absDx, absDy) < 25) return; // Ignore slight tap

    if (absDx > absDy) {
      handleSwipeMove(dx > 0 ? 'RIGHT' : 'LEFT');
    } else {
      handleSwipeMove(dy > 0 ? 'DOWN' : 'UP');
    }
  };

  const endGame = (isWin: boolean) => {
    const s = stateRef.current;
    if (s.isGameOver) return;
    s.isGameOver = true;
    setIsGameOver(true);

    if (isWin) {
      playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
    } else {
      playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
    }

    const duration = (Date.now() - s.startTime) / 1000;
    const receipt = calculateAndDepositMissionReward({
      gameId: 'arcade_chip_merge',
      gameTitle: '블리츠 칩 머지',
      durationSeconds: duration,
      score: s.score + s.maxLevel * 500 + s.maxCombo * 60,
      difficulty: 'NIGHTMARE',
      isVictory: isWin || s.maxLevel >= 5,
    });
    setSettlementReceipt(receipt);
    onReward(receipt.totalSns);
  };

  const tutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 4방향 스와이프 머지' : 'STEP 1: 4-WAY SWIPE MERGE',
      title: isKo ? '화면을 스와이프해 반도체 칩을 합성하세요' : 'Swipe to Merge Matching Semiconductor Chips',
      description: isKo
        ? '가상 조이스틱 없이 화면을 상/하/좌/우로 슥 스와이프하여 동일한 레벨의 반도체 칩을 충돌 합성시켜 상위 AI 양자 코어로 진화시키세요.'
        : 'Swipe in 4 directions to collide and merge matching level chips into higher-tier quantum processors.',
      keyPoints: isKo
        ? [
            '가상 조이스틱 0개 (100% 화면 직접 4방향 스와이프 머지)',
            '동일 칩 결합 시 레벨업 및 대량 점수 획득',
            '35초간 Lv.6 양자 코어(🔮) 이상을 합성하면 승리'
          ]
        : [
            'Zero Virtual Joysticks: 100% Direct 4-Way Swipe',
            'Merge matching chips to level up and earn high score',
            'Craft Lv.6 Quantum Core (🔮) within 35s to win'
          ],
      iconType: 'GOAL',
    },
    {
      badge: isKo ? 'STEP 2: 모바일 퓨어 제스처' : 'STEP 2: PURE GESTURES',
      title: isKo ? '화면 직접 스와이프 (Screen Swipe)' : 'Direct Screen Swipe',
      description: isKo
        ? '손가락을 화면에 대고 상/하/좌/우로 시원하게 밀어냅니다.'
        : 'Flick your finger smoothly across the 4x4 board.',
      keyPoints: isKo
        ? [
            '👆 손가락 스와이프: 부드러운 4x4 타일 슬라이딩',
            '⚡ 연속 머지 성공 시 콤보 배수 보너스 가산',
            '🧠 보드가 가득 차기 전에 스마트하게 합성하세요'
          ]
        : [
            '👆 Touch Swipe: Smooth responsive 4x4 sliding',
            '⚡ Consecutive merges trigger high combo multipliers',
            '🧠 Keep board organized before space runs out'
          ],
      iconType: 'GESTURES',
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '제조 완료 즉시 NIGHTMARE 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Nightmare payout deposited atomically to your LocalStorage wallet upon match finish.',
      keyPoints: isKo
        ? [
            '완료 즉시 LocalStorage 영구 지갑 입금',
            '최고 칩 티어 및 머지 콤보 비례 대량 잭팟',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Highest chip tier and merge combo multipliers',
            'VictoryRewardModal golden coin fanfare'
          ],
      iconType: 'REWARDS',
    },
  ];

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseUp={handleTouchEnd}
      className="relative w-full h-[100dvh] bg-[#070b14] text-white font-mono select-none flex flex-col overflow-hidden items-center justify-between touch-none"
    >
      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <div onClick={(e) => e.stopPropagation()} className="w-full">
        <MinimalistMissionHUD
          title={isKo ? '블리츠 칩 머지' : 'Blitz Chip Merge'}
          language={(language as Language) || 'ko'}
          telemetries={[
            { label: isKo ? '최고칩' : 'Max', value: `Lv.${maxChipLevel}`, color: 'text-amber-400 font-bold' },
            { label: isKo ? '시간' : 'Time', value: `${timeLeft}s`, color: timeLeft <= 10 ? 'text-rose-500 font-bold animate-pulse' : 'text-cyan-400 font-bold' },
            { label: isKo ? '콤보' : 'Combo', value: `${mergeCombo}x`, color: mergeCombo > 3 ? 'text-emerald-400 font-bold animate-bounce' : 'text-slate-300' },
            { label: isKo ? '점수' : 'Score', value: `${score}P`, color: 'text-amber-300 font-bold' }
          ]}
          onExit={onExit}
          onHelp={() => setShowTutorial(true)}
          onPauseToggle={() => setIsPaused(prev => !prev)}
          isPaused={isPaused}
        />
      </div>

      {/* 4x4 Chip Merge Board Viewport */}
      <div className="flex-1 w-full max-w-sm relative overflow-hidden flex flex-col items-center justify-center p-3">
        <div className="w-80 h-80 bg-slate-900/90 border-2 border-cyan-500/40 p-2 rounded-sm grid grid-cols-4 grid-rows-4 gap-2 shadow-2xl">
          {board.map((row, rIdx) =>
            row.map((cell, cIdx) => {
              const chipInfo = cell > 0 ? CHIP_TIERS[Math.min(cell - 1, CHIP_TIERS.length - 1)] : null;

              return (
                <div
                  key={`${rIdx}-${cIdx}`}
                  className="w-full h-full rounded-sm flex flex-col items-center justify-center relative transition-all duration-100"
                  style={{
                    backgroundColor: chipInfo ? `${chipInfo.color}33` : '#0f172a',
                    border: chipInfo ? `1.5px solid ${chipInfo.color}` : '1px solid #1e293b',
                  }}
                >
                  {chipInfo && (
                    <>
                      <span className="text-2xl animate-pulse">{chipInfo.icon}</span>
                      <span className="text-[9px] font-bold mt-0.5" style={{ color: chipInfo.color }}>
                        {isKo ? chipInfo.name : chipInfo.level}
                      </span>
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Floating Feedback Text */}
        {feedbackText && (
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 pointer-events-none text-base font-bold text-amber-300 drop-shadow-lg animate-bounce whitespace-nowrap">
            {feedbackText}
          </div>
        )}
      </div>

      {/* Minimal Bottom Guide */}
      <div className="w-full pb-3 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1 bg-black/50 border border-white/10 rounded-full text-[10px] text-slate-300 font-mono">
          {isKo ? '화면을 상/하/좌/우로 스와이프하여 칩을 합성하세요' : 'Swipe 4 directions to merge matching semiconductor chips'}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <div onClick={(e) => e.stopPropagation()}>
          <UniversalTutorialModal
            gameId="arcade_chip_merge"
            gameTitle={isKo ? '블리츠 칩 머지: 반도체 합성' : 'Blitz Chip Merge: Semiconductor Synthesis'}
            customSteps={tutorialSteps}
            language={(language as Language) || 'ko'}
            onStartGame={() => setShowTutorial(false)}
            onClose={() => setShowTutorial(false)}
          />
        </div>
      )}

      {/* Victory Reward Settlement Modal */}
      {isGameOver && settlementReceipt && (
        <div onClick={(e) => e.stopPropagation()}>
          <VictoryRewardModal
            receipt={settlementReceipt}
            language={(language as Language) || 'ko'}
            onPlayAgain={initGame}
            onExit={onExit}
          />
        </div>
      )}
    </div>
  );
};
export default VoxelFactoryCraftGame;
