import { drawCardSprite } from '../lib/canvasCardRenderer';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData, Language } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelDreadShadowGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface PrismNode {
  id: number;
  row: number;
  col: number;
  angle: number; // 0, 90, 180, 270 degrees
  targetAngle: number;
  isLit: boolean;
}

interface ShadowCrystal {
  id: number;
  row: number;
  col: number;
  purified: boolean;
}

export const VoxelDreadShadowGame: React.FC<VoxelDreadShadowGameProps> = ({
  deck = [],
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
  const playerHeroId = deck[0]?.id || 110;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  const [currentStage, setCurrentStage] = useState<number>(1);
  const totalStages = 4;
  const [score, setScore] = useState<number>(0);
  const [purifiedCount, setPurifiedCount] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(35);
  const [feedbackText, setFeedbackText] = useState<string | null>(null);

  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_game_prism_laser') !== 'true';
    } catch {
      return true;
    }
  });
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const stateRef = useRef({
    gridRows: 4,
    gridCols: 4,
    prisms: [] as PrismNode[],
    crystals: [] as ShadowCrystal[],
    laserPath: [] as { x: number; y: number }[],
    coreLit: false,
    stage: 1,
    score: 0,
    purified: 0,
    timeLeft: 35,
    isGameOver: false,
    isPaused: false,
    startTime: Date.now(),
  });

  const setupStage = useCallback((stageNum: number) => {
    const s = stateRef.current;
    s.stage = stageNum;
    s.coreLit = false;
    s.laserPath = [];

    // Create 4x4 Grid of Prisms
    const newPrisms: PrismNode[] = [];
    let id = 1;
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        // Random initial angle in multiples of 90
        const randAngle = Math.floor(Math.random() * 4) * 90;
        newPrisms.push({
          id: id++,
          row: r,
          col: c,
          angle: randAngle,
          targetAngle: randAngle,
          isLit: false,
        });
      }
    }
    s.prisms = newPrisms;

    // Place 2 Shadow Crystals
    s.crystals = [
      { id: 1, row: 1 + Math.floor(Math.random() * 2), col: Math.floor(Math.random() * 3), purified: false },
      { id: 2, row: 2 + Math.floor(Math.random() * 2), col: 1 + Math.floor(Math.random() * 3), purified: false },
    ];

    setCurrentStage(stageNum);
  }, []);

  const initGame = useCallback(() => {
    const s = stateRef.current;
    s.score = 0;
    s.purified = 0;
    s.timeLeft = 35;
    s.isGameOver = false;
    s.startTime = Date.now();

    setScore(0);
    setPurifiedCount(0);
    setTimeLeft(35);
    setFeedbackText(null);
    setIsGameOver(false);
    setSettlementReceipt(null);

    setupStage(1);
  }, [setupStage]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  // Timer loop
  useEffect(() => {
    if (isGameOver || isPaused) return;

    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          endGame(false);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isGameOver, isPaused]);

  // Touch / Pointer Prism Rotate Action (Zero Joysticks - Direct 1-Tap)
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = stateRef.current;
    if (s.isGameOver || s.isPaused) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const tapX = (e.clientX - rect.left) * scaleX;
    const tapY = (e.clientY - rect.top) * scaleY;

    const gridStartX = 40;
    const gridStartY = 110;
    const cellSize = 70;

    // Check which prism cell was tapped
    for (const prism of s.prisms) {
      const px = gridStartX + prism.col * cellSize + cellSize / 2;
      const py = gridStartY + prism.row * cellSize + cellSize / 2;

      if (Math.hypot(px - tapX, py - tapY) < 32) {
        prism.targetAngle = (prism.angle + 90) % 360;
        prism.angle = prism.targetAngle;
        playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
        break;
      }
    }
  };

  // Main 60FPS Laser Raymarching Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastTime = performance.now();

    const loop = (now: number) => {
      animFrameRef.current = requestAnimationFrame(loop);
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const s = stateRef.current;
      if (s.isPaused || s.isGameOver) return;

      const gridStartX = 40;
      const gridStartY = 110;
      const cellSize = 70;

      // Reset Lit Prisms
      s.prisms.forEach((p) => (p.isLit = false));

      // Trace Laser Beam from Laser Emitter (Top-Left: row 0, col 0, dir: RIGHT)
      const path: { x: number; y: number }[] = [];
      const startX = gridStartX - 20;
      const startY = gridStartY + cellSize / 2;
      path.push({ x: startX, y: startY });

      let currR = 0;
      let currC = 0;
      let dirR = 0;
      let dirC = 1; // Moving right initially
      let steps = 0;
      let targetCoreReached = false;

      while (currR >= 0 && currR < 4 && currC >= 0 && currC < 4 && steps < 20) {
        steps++;
        const prism = s.prisms.find((p) => p.row === currR && p.col === currC);
        const cellCenterX = gridStartX + currC * cellSize + cellSize / 2;
        const cellCenterY = gridStartY + currR * cellSize + cellSize / 2;

        path.push({ x: cellCenterX, y: cellCenterY });

        if (prism) {
          prism.isLit = true;

          // Check Crystal Purify
          s.crystals.forEach((c) => {
            if (!c.purified && c.row === currR && c.col === currC) {
              c.purified = true;
              s.score += 250;
              s.purified += 1;
              setScore(s.score);
              setPurifiedCount(s.purified);
              setFeedbackText(`CRYSTAL PURIFIED! +250P 💎`);
              setTimeout(() => setFeedbackText(null), 400);
              playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
            }
          });

          // Reflect based on prism mirror angle
          const ang = prism.angle;
          if (ang === 0) {
            // Mirror from bottom-left to top-right (\)
            if (dirC === 1) { dirR = 1; dirC = 0; }
            else if (dirC === -1) { dirR = -1; dirC = 0; }
            else if (dirR === 1) { dirR = 0; dirC = 1; }
            else if (dirR === -1) { dirR = 0; dirC = -1; }
          } else if (ang === 90) {
            // Mirror from top-left to bottom-right (/)
            if (dirC === 1) { dirR = -1; dirC = 0; }
            else if (dirC === -1) { dirR = 1; dirC = 0; }
            else if (dirR === 1) { dirR = 0; dirC = -1; }
            else if (dirR === -1) { dirR = 0; dirC = 1; }
          } else if (ang === 180) {
            if (dirC === 1) { dirR = 1; dirC = 0; }
            else if (dirC === -1) { dirR = -1; dirC = 0; }
            else if (dirR === 1) { dirR = 0; dirC = 1; }
            else if (dirR === -1) { dirR = 0; dirC = -1; }
          } else {
            if (dirC === 1) { dirR = -1; dirC = 0; }
            else if (dirC === -1) { dirR = 1; dirC = 0; }
            else if (dirR === 1) { dirR = 0; dirC = -1; }
            else if (dirR === -1) { dirR = 0; dirC = 1; }
          }
        }

        // Check if reaches Target Core at Bottom-Right (row 3, col 3)
        if (currR === 3 && currC === 3) {
          targetCoreReached = true;
          break;
        }

        currR += dirR;
        currC += dirC;
      }

      s.laserPath = path;

      // Handle Core Lit Clear
      if (targetCoreReached && !s.coreLit) {
        s.coreLit = true;
        s.score += 1000;
        setScore(s.score);
        playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');

        if (s.stage < totalStages) {
          setFeedbackText(`STAGE ${s.stage} OVERLOAD! ⚡`);
          setTimeout(() => {
            setFeedbackText(null);
            setupStage(s.stage + 1);
          }, 700);
        } else {
          // Clear all 4 stages!
          endGame(true);
        }
      }

      // ── Canvas Rendering ──
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Dark Void Cyber Lab Background
      ctx.fillStyle = '#05070e';
      ctx.fillRect(0, 0, w, h);

      // Grid Cells
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          const cx = gridStartX + c * cellSize;
          const cy = gridStartY + r * cellSize;

          ctx.fillStyle = '#0f172a';
          ctx.fillRect(cx + 2, cy + 2, cellSize - 4, cellSize - 4);
          ctx.strokeStyle = '#1e293b';
          ctx.lineWidth = 1;
          ctx.strokeRect(cx + 2, cy + 2, cellSize - 4, cellSize - 4);
        }
      }

      // Render Laser Beam Path (Glowing Cyan)
      if (s.laserPath.length > 1) {
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 4;
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(s.laserPath[0].x, s.laserPath[0].y);
        for (let i = 1; i < s.laserPath.length; i++) {
          ctx.lineTo(s.laserPath[i].x, s.laserPath[i].y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // Render Prisms
      s.prisms.forEach((p) => {
        const cx = gridStartX + p.col * cellSize + cellSize / 2;
        const cy = gridStartY + p.row * cellSize + cellSize / 2;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate((p.angle * Math.PI) / 180);

        // Mirror Blade
        ctx.fillStyle = p.isLit ? '#38bdf8' : '#64748b';
        ctx.fillRect(-22, -3, 44, 6);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(-22, -3, 44, 6);

        // Center Pin
        ctx.fillStyle = p.isLit ? '#fde047' : '#94a3b8';
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      });

      // Render Shadow Crystals
      s.crystals.forEach((c) => {
        const cx = gridStartX + c.col * cellSize + cellSize / 2;
        const cy = gridStartY + c.row * cellSize + cellSize / 2;

        ctx.font = '22px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(c.purified ? '✨' : '💎', cx, cy - 18);
      });

      // Laser Emitter at Top-Left
      ctx.fillStyle = '#06b6d4';
      ctx.fillRect(gridStartX - 30, gridStartY + cellSize / 2 - 8, 20, 16);
      ctx.font = '12px serif';
      ctx.fillText('⚡', gridStartX - 20, gridStartY + cellSize / 2);

      // Target Shadow Core at Bottom-Right (row 3, col 3)
      const coreX = gridStartX + 3 * cellSize + cellSize / 2;
      const coreY = gridStartY + 3 * cellSize + cellSize / 2;

      ctx.fillStyle = s.coreLit ? '#eab308' : '#7c3aed';
      ctx.beginPath();
      ctx.arc(coreX, coreY, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.font = '18px serif';
      ctx.fillText(s.coreLit ? '☀️' : '🔮', coreX, coreY);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [setupStage, playSfx]);

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
      gameId: 'arcade_prism_laser',
      gameTitle: '블리츠 프리즘 레이저',
      durationSeconds: duration,
      score: s.score + (isWin ? 3000 : s.stage * 500) + s.purified * 100,
      difficulty: 'NIGHTMARE',
      isVictory: isWin || s.stage >= 3,
    });
    setSettlementReceipt(receipt);
    onReward(receipt.totalSns);
  };

  const tutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 프리즘 레이저 연결' : 'STEP 1: LASER REFLECTION',
      title: isKo ? '프리즘 거울을 탭해 레이저를 코어에 연결하세요' : 'Tap Prisms to Connect Laser to Shadow Core',
      description: isKo
        ? '가상 조이스틱 없이 화면 속 프리즘 거울을 탭하여 90도씩 회전시켜 레이저 빛의 경로를 우하단 섀도우 코어(🔮)까지 도달시키세요.'
        : 'Tap prism mirrors to rotate them 90 degrees and reflect the laser beam to the target core.',
      keyPoints: isKo
        ? [
            '가상 조이스틱 0개 (100% 프리즘 직접 원터치 탭 회전)',
            '경로 상의 보석 크리스탈(💎)을 지나가면 정화 보너스',
            '우하단 섀도우 코어(🔮)에 도달하면 스테이지 클리어'
          ]
        : [
            'Zero Virtual Joysticks: 100% Direct Tap Mirror Rotation',
            'Reflect laser through shadow crystals (💎) for purification',
            'Connect beam to bottom-right core to clear stage'
          ],
      iconType: 'GOAL',
    },
    {
      badge: isKo ? 'STEP 2: 모바일 퓨어 제스처' : 'STEP 2: PURE GESTURES',
      title: isKo ? '프리즘 거울 직접 탭 (Mirror Tap)' : 'Single Tap Prism',
      description: isKo
        ? '원하는 프리즘 노드를 손가락으로 가볍게 탭합니다.'
        : 'Simply tap individual prism nodes to cycle their reflection angle.',
      keyPoints: isKo
        ? [
            '👆 원터치 탭: 90도 회전 즉시 레이저 실시간 굴절',
            '⚡ 4단계 퍼즐 챔피언십 올클리어 도전',
            '⏱️ 35초 타임어택 고득점 챌린지'
          ]
        : [
            '👆 Single Tap: 90-degree instant laser beam redirection',
            '⚡ Complete all 4 puzzle championship stages',
            '⏱️ 35s time attack brain teaser sprint'
          ],
      iconType: 'GESTURES',
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '퍼즐 해결 완료 즉시 NIGHTMARE 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Nightmare payout deposited atomically to your LocalStorage wallet upon match finish.',
      keyPoints: isKo
        ? [
            '완료 즉시 LocalStorage 영구 지갑 입금',
            '클리어 스테이지 및 정화 크리스탈 비례 대량 잭팟',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Cleared stages and purified crystals multipliers',
            'VictoryRewardModal golden coin fanfare'
          ],
      iconType: 'REWARDS',
    },
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-[#030611] text-white font-mono select-none flex flex-col overflow-hidden items-center justify-between touch-none">
      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '블리츠 프리즘 레이저' : 'Blitz Prism Laser'}
        language={(language as Language) || 'ko'}
        telemetries={[
          { label: isKo ? '스테이지' : 'Stage', value: `${currentStage}/${totalStages}`, color: 'text-amber-400 font-bold' },
          { label: isKo ? '시간' : 'Time', value: `${timeLeft}s`, color: timeLeft <= 10 ? 'text-rose-500 font-bold animate-pulse' : 'text-cyan-400 font-bold' },
          { label: isKo ? '정화' : 'Purified', value: `${purifiedCount}💎`, color: 'text-emerald-400 font-bold' },
          { label: isKo ? '점수' : 'Score', value: `${score}P`, color: 'text-amber-300 font-bold' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => setIsPaused(prev => !prev)}
        isPaused={isPaused}
      />

      {/* Pure Touch Laser Puzzle Canvas Viewport */}
      <div className="flex-1 w-full max-w-md relative overflow-hidden flex items-center justify-center select-none touch-none p-2">
        <canvas
          ref={canvasRef}
          width={360}
          height={500}
          onPointerDown={handlePointerDown}
          className="w-full h-full object-contain touch-none cursor-pointer shadow-2xl"
        />

        {/* Floating Feedback Text */}
        {feedbackText && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none text-xl font-bold text-amber-300 drop-shadow-lg animate-bounce whitespace-nowrap">
            {feedbackText}
          </div>
        )}
      </div>

      {/* Minimal Bottom Guide */}
      <div className="w-full pb-3 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1 bg-black/50 border border-white/10 rounded-full text-[10px] text-slate-300 font-mono">
          {isKo ? '프리즘 거울을 탭하여 레이저를 우하단 코어(🔮)에 연결하세요' : 'Tap prism mirrors to guide laser to target core'}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="arcade_prism_laser"
          gameTitle={isKo ? '블리츠 프리즘 레이저: 빛 굴절' : 'Blitz Prism Laser: Light Puzzle'}
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
export default VoxelDreadShadowGame;
