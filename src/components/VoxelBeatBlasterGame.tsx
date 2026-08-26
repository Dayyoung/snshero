import { drawCardSprite } from '../lib/canvasCardRenderer';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData, Language } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelBeatBlasterGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface NumberNode {
  id: number;
  row: number;
  col: number;
  val: number;
  isSpecial: boolean;
}

export const VoxelBeatBlasterGame: React.FC<VoxelBeatBlasterGameProps> = ({
  deck = [],
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
  const playerHeroId = deck[0]?.id || 57;
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [grid, setGrid] = useState<NumberNode[][]>([]);
  const [selectedChain, setSelectedChain] = useState<NumberNode[]>([]);
  const [targetSum, setTargetSum] = useState<number>(10);
  const [currentSum, setCurrentSum] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [combo, setCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(40);

  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_game_chain_number') !== 'true';
    } catch {
      return true;
    }
  });
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const stateRef = useRef({
    isDragging: false,
    selectedChain: [] as NumberNode[],
    score: 0,
    combo: 0,
    maxCombo: 0,
    timeLeft: 40,
    isGameOver: false,
    isPaused: false,
    startTime: Date.now(),
    nodeCounter: 1,
  });

  const generateGrid = useCallback((): NumberNode[][] => {
    const newGrid: NumberNode[][] = [];
    for (let r = 0; r < 4; r++) {
      const row: NumberNode[] = [];
      for (let c = 0; c < 4; c++) {
        row.push({
          id: stateRef.current.nodeCounter++,
          row: r,
          col: c,
          val: 1 + Math.floor(Math.random() * 6),
          isSpecial: Math.random() < 0.15,
        });
      }
      newGrid.push(row);
    }
    return newGrid;
  }, []);

  const initGame = useCallback(() => {
    const s = stateRef.current;
    s.isDragging = false;
    s.selectedChain = [];
    s.score = 0;
    s.combo = 0;
    s.maxCombo = 0;
    s.timeLeft = 40;
    s.isGameOver = false;
    s.startTime = Date.now();

    setGrid(generateGrid());
    setSelectedChain([]);
    setTargetSum(10);
    setCurrentSum(0);
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setTimeLeft(40);
    setIsGameOver(false);
    setSettlementReceipt(null);
  }, [generateGrid]);

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

  // Touch / Pointer Drag Chain Handlers (Zero Joystick - Pure Line Draw)
  const getNodeFromCoords = (touchX: number, touchY: number): NumberNode | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const cellSize = canvas.width / 4;
    const c = Math.floor(touchX / cellSize);
    const r = Math.floor(touchY / cellSize);

    if (r >= 0 && r < 4 && c >= 0 && c < 4 && grid[r] && grid[r][c]) {
      return grid[r][c];
    }
    return null;
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = stateRef.current;
    if (s.isGameOver || s.isPaused) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const touchX = (e.clientX - rect.left) * scaleX;
    const touchY = (e.clientY - rect.top) * scaleY;

    const node = getNodeFromCoords(touchX, touchY);
    if (node) {
      s.isDragging = true;
      s.selectedChain = [node];
      setSelectedChain([node]);
      setCurrentSum(node.val);
      playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = stateRef.current;
    if (!s.isDragging || s.isGameOver || s.isPaused) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const touchX = (e.clientX - rect.left) * scaleX;
    const touchY = (e.clientY - rect.top) * scaleY;

    const node = getNodeFromCoords(touchX, touchY);
    if (node) {
      const lastNode = s.selectedChain[s.selectedChain.length - 1];
      if (lastNode && lastNode.id !== node.id) {
        // Must be adjacent (distance <= 1.5)
        const dr = Math.abs(lastNode.row - node.row);
        const dc = Math.abs(lastNode.col - node.col);

        if (dr <= 1 && dc <= 1 && !s.selectedChain.some((n) => n.id === node.id)) {
          s.selectedChain.push(node);
          setSelectedChain([...s.selectedChain]);

          const sum = s.selectedChain.reduce((acc, n) => acc + n.val, 0);
          setCurrentSum(sum);
          playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
        }
      }
    }
  };

  const handlePointerUp = () => {
    const s = stateRef.current;
    if (!s.isDragging || s.isGameOver || s.isPaused) {
      s.isDragging = false;
      return;
    }
    s.isDragging = false;

    const sum = s.selectedChain.reduce((acc, n) => acc + n.val, 0);

    if (sum === targetSum && s.selectedChain.length >= 2) {
      // Chain Success!
      playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');

      const chainLen = s.selectedChain.length;
      const points = sum * 40 + chainLen * 60 + s.combo * 40;
      s.score += points;
      s.combo += 1;
      if (s.combo > s.maxCombo) s.maxCombo = s.combo;

      setScore(s.score);
      setCombo(s.combo);
      setMaxCombo(s.maxCombo);

      // Regenerate matched nodes
      const nextGrid = grid.map((row) =>
        row.map((node) => {
          if (s.selectedChain.some((cn) => cn.id === node.id)) {
            return {
              id: stateRef.current.nodeCounter++,
              row: node.row,
              col: node.col,
              val: 1 + Math.floor(Math.random() * 6),
              isSpecial: Math.random() < 0.15,
            };
          }
          return node;
        })
      );
      setGrid(nextGrid);

      // Next Target Sum (10, 12, 14, 15, 16, 18)
      const targets = [10, 12, 13, 14, 15, 16, 18];
      setTargetSum(targets[Math.floor(Math.random() * targets.length)]);
    } else {
      // Invalid Chain
      if (s.selectedChain.length >= 2) {
        playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
        s.combo = 0;
        setCombo(0);
      }
    }

    s.selectedChain = [];
    setSelectedChain([]);
    setCurrentSum(0);
  };

  // Canvas Renderer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Deep Indigo Arcane Background
    ctx.fillStyle = '#0f1026';
    ctx.fillRect(0, 0, w, h);

    const cellSize = w / 4;

    // Render Chain Connection Lines
    if (selectedChain.length > 1) {
      ctx.beginPath();
      const firstX = selectedChain[0].col * cellSize + cellSize / 2;
      const firstY = selectedChain[0].row * cellSize + cellSize / 2;
      ctx.moveTo(firstX, firstY);

      for (let i = 1; i < selectedChain.length; i++) {
        const nx = selectedChain[i].col * cellSize + cellSize / 2;
        const ny = selectedChain[i].row * cellSize + cellSize / 2;
        ctx.lineTo(nx, ny);
      }

      ctx.strokeStyle = currentSum === targetSum ? '#22c55e' : '#38bdf8';
      ctx.lineWidth = 8;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    // Render Number Nodes
    grid.forEach((row, r) => {
      row.forEach((node, c) => {
        const cx = c * cellSize + cellSize / 2;
        const cy = r * cellSize + cellSize / 2;
        const radius = cellSize * 0.36;

        const isSelected = selectedChain.some((cn) => cn.id === node.id);
        const nodeCardId = node.isSpecial ? playerHeroId : ((node.val * 7) % 30 + 1);

        ctx.fillStyle = isSelected
          ? currentSum === targetSum
            ? '#15803d'
            : '#0284c7'
          : node.isSpecial
          ? '#7c3aed'
          : '#1e1b4b';

        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();

        // Card Sprite inside Node
        drawCardSprite(
          ctx,
          nodeCardId,
          cx - radius * 0.7,
          cy - radius * 0.7,
          radius * 1.4,
          radius * 1.4,
          {
            circleClip: true,
            borderWidth: 1,
            borderColor: isSelected ? '#ffffff' : 'rgba(255,255,255,0.4)',
            shadowBlur: 6,
            shadowColor: isSelected ? '#38bdf8' : 'rgba(0,0,0,0.5)',
          }
        );

        ctx.strokeStyle = isSelected ? '#ffffff' : node.isSpecial ? '#a855f7' : 'rgba(255,255,255,0.3)';
        ctx.lineWidth = isSelected ? 3 : 2;
        ctx.stroke();

        // High-contrast Value Badge
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.beginPath();
        ctx.arc(cx, cy, radius * 0.45, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Node Value
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 20px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(node.val.toString(), cx, cy);
      });
    });
  }, [grid, selectedChain, currentSum, targetSum, playerHeroId]);

  const endGame = () => {
    const s = stateRef.current;
    if (s.isGameOver) return;
    s.isGameOver = true;
    setIsGameOver(true);
    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');

    const duration = (Date.now() - s.startTime) / 1000;
    const receipt = calculateAndDepositMissionReward({
      gameId: 'arcade_chain_number',
      gameTitle: '아케인 체인 넘버',
      durationSeconds: duration,
      score: s.score + s.maxCombo * 90,
      difficulty: 'NIGHTMARE',
      isVictory: s.score >= 1600,
    });
    setSettlementReceipt(receipt);
    onReward(receipt.totalSns);
  };

  const tutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 목표 합계 숫자 연결' : 'STEP 1: CHAIN TO TARGET SUM',
      title: isKo ? '손가락으로 숫자를 이어 목표 합을 만드세요' : 'Connect Numbers to Match Target Sum',
      description: isKo
        ? '가상 조이스틱 없이 화면 위 4x4 숫자 노드를 손가락으로 드래그하여 목표 숫자(예: 10, 15)와 일치하는 체인을 완성하세요.'
        : 'Drag across adjacent number nodes to create a chain equaling the Target Sum.',
      keyPoints: isKo
        ? [
            '가상 조이스틱 0개 (100% 손가락 직접 라인 드로우)',
            '목표 합계 일치 시 즉시 노드 폭발 및 점수 획득',
            '연속 성공 시 콤보 배수 보너스 가산'
          ]
        : [
            'Zero Virtual Joysticks: 100% Finger Line Draw',
            'Clear nodes instantly when sum matches Target',
            'Chain combos for progressive multiplier bonuses'
          ],
      iconType: 'GOAL',
    },
    {
      badge: isKo ? 'STEP 2: 모바일 퓨어 제스처' : 'STEP 2: PURE GESTURES',
      title: isKo ? '손가락 직접 연속 드래그 (Line Draw)' : 'Direct Screen Line Drag',
      description: isKo
        ? '인접한 상하좌우/대각선 숫자 노드를 손가락으로 슥 이어 연결합니다.'
        : 'Connect neighboring nodes horizontally, vertically, or diagonally.',
      keyPoints: isKo
        ? [
            '👆 손가락 드래그: 실시간 푸른 마나 연결선',
            '⚡ 2개 이상 노드 연결 후 손 떼기(Release)',
            '🔮 보라색 특수 노드 포함 시 추가 잭팟 점수'
          ]
        : [
            '👆 Direct Drag: Fluid arcane mana trail',
            '⚡ Connect 2+ nodes and release finger',
            '🔮 Special purple nodes grant massive points'
          ],
      iconType: 'GESTURES',
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '시간 종료 즉시 NIGHTMARE 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Nightmare payout deposited atomically to your LocalStorage wallet upon match finish.',
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
    <div className="relative w-full h-[100dvh] bg-[#090a18] text-white font-mono select-none flex flex-col overflow-hidden items-center justify-between touch-none">
      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '아케인 체인 넘버' : 'Arcane Chain Number'}
        language={(language as Language) || 'ko'}
        telemetries={[
          { label: isKo ? '목표' : 'Target', value: `${targetSum}`, color: 'text-amber-400 font-bold text-base' },
          { label: isKo ? '현재' : 'Current', value: `${currentSum}`, color: currentSum === targetSum ? 'text-emerald-400 font-bold text-base animate-bounce' : currentSum > targetSum ? 'text-rose-500 font-bold' : 'text-cyan-300' },
          { label: isKo ? '시간' : 'Time', value: `${timeLeft}s`, color: timeLeft <= 10 ? 'text-rose-500 font-bold animate-pulse' : 'text-slate-300' },
          { label: isKo ? '점수' : 'Score', value: `${score}P`, color: 'text-emerald-400 font-bold' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => setIsPaused(prev => !prev)}
        isPaused={isPaused}
      />

      {/* Pure Touch Line Connect Canvas Viewport */}
      <div className="flex-1 w-full max-w-sm relative overflow-hidden flex items-center justify-center select-none touch-none p-3">
        <canvas
          ref={canvasRef}
          width={340}
          height={340}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="w-full aspect-square border border-indigo-900/60 rounded-none shadow-2xl touch-none cursor-pointer"
        />
      </div>

      {/* Minimal Bottom Guide */}
      <div className="w-full pb-3 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1 bg-black/50 border border-white/10 rounded-full text-[10px] text-slate-300 font-mono">
          {isKo ? `숫자를 드래그하여 목표 합계 [${targetSum}]을 만드세요` : `Drag nodes to match Target Sum [${targetSum}]`}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="arcade_chain_number"
          gameTitle={isKo ? '아케인 체인 넘버: 두뇌 퍼즐' : 'Arcane Chain Number: Brain Puzzle'}
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
export default VoxelBeatBlasterGame;
