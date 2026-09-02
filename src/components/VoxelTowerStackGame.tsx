import { drawCardSprite } from '../lib/canvasCardRenderer';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData, Language } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelTowerStackGameProps {
  deck: CardData[];
  language?: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface StackLayer {
  x: number;
  width: number;
  color: string;
}

export const VoxelTowerStackGame: React.FC<VoxelTowerStackGameProps> = ({
  deck = [],
  language = 'ko',
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
  const playerHeroId = deck[0]?.id || 75;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  const [floorsStacked, setFloorsStacked] = useState<number>(0);
  const targetFloors = 20;
  const [score, setScore] = useState<number>(0);
  const [stackCombo, setStackCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(35);
  const [feedbackText, setFeedbackText] = useState<string | null>(null);

  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_game_tower_stack') !== 'true';
    } catch {
      return true;
    }
  });
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const blockColors = [
    '#ef4444', '#f97316', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'
  ];

  const stateRef = useRef({
    layers: [] as StackLayer[],
    currentX: 50,
    currentWidth: 160,
    vx: 180,
    floorsStacked: 0,
    score: 0,
    combo: 0,
    maxCombo: 0,
    timeLeft: 35,
    isGameOver: false,
    isPaused: false,
    startTime: Date.now(),
    particles: [] as { x: number; y: number; vx: number; vy: number; color: string; life: number }[],
  });

  const initGame = useCallback(() => {
    const s = stateRef.current;
    s.layers = [
      { x: 100, width: 160, color: blockColors[0] }
    ];
    s.currentX = 40;
    s.currentWidth = 160;
    s.vx = 220;
    s.floorsStacked = 0;
    s.score = 0;
    s.combo = 0;
    s.maxCombo = 0;
    s.timeLeft = 35;
    s.isGameOver = false;
    s.startTime = Date.now();
    s.particles = [];

    setFloorsStacked(0);
    setScore(0);
    setStackCombo(0);
    setMaxCombo(0);
    setTimeLeft(35);
    setFeedbackText(null);
    setIsGameOver(false);
    setSettlementReceipt(null);
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  // Timer loop
  useEffect(() => {
    if (isGameOver || isPaused) return;

    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          const isTargetMet = stateRef.current.floorsStacked >= 15;
          endGame(isTargetMet);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isGameOver, isPaused]);

  // Direct Tap to Drop Block
  const handlePointerDown = () => {
    const s = stateRef.current;
    if (s.isGameOver || s.isPaused) return;

    const prevLayer = s.layers[s.layers.length - 1];
    const diff = s.currentX - prevLayer.x;

    if (Math.abs(diff) < 8) {
      // Perfect Snap!
      s.combo += 1;
      if (s.combo > s.maxCombo) s.maxCombo = s.combo;

      const pts = 500 + s.combo * 50;
      s.score += pts;

      s.layers.push({
        x: prevLayer.x,
        width: s.currentWidth,
        color: blockColors[s.layers.length % blockColors.length],
      });

      setFeedbackText(`🔥 PERFECT SNAP! +${pts}P ✨`);
      playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');

      // Sparkle FX
      for (let p = 0; p < 14; p++) {
        s.particles.push({
          x: prevLayer.x + s.currentWidth / 2,
          y: 400 - s.layers.length * 18,
          vx: (Math.random() - 0.5) * 220,
          vy: (Math.random() - 0.5) * 220,
          color: '#fde047',
          life: 0.4,
        });
      }
    } else if (Math.abs(diff) >= s.currentWidth) {
      // Complete Miss -> Reset Current Layer
      s.combo = 0;
      setFeedbackText(isKo ? '낙하 빗나감! 재시도 💥' : 'MISSED DROP! 💥');
      playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
    } else {
      // Partial Hit (Trim Block)
      s.combo = 0;
      const newWidth = s.currentWidth - Math.abs(diff);
      const newX = diff > 0 ? s.currentX : prevLayer.x;

      s.currentWidth = Math.max(30, newWidth);
      const pts = 300;
      s.score += pts;

      s.layers.push({
        x: newX,
        width: s.currentWidth,
        color: blockColors[s.layers.length % blockColors.length],
      });

      setFeedbackText(`STACK! +${pts}P 🏢`);
      playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    }

    s.floorsStacked = s.layers.length - 1;
    setFloorsStacked(s.floorsStacked);
    setScore(s.score);
    setStackCombo(s.combo);
    setMaxCombo(s.maxCombo);

    setTimeout(() => setFeedbackText(null), 300);

    // Check Victory 20 Floors
    if (s.floorsStacked >= targetFloors) {
      endGame(true);
    }
  };

  // Main 60FPS Tower Stack Loop
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

      // Moving Block Oscillation
      s.currentX += s.vx * dt;
      if (s.currentX > 360 - s.currentWidth) {
        s.currentX = 360 - s.currentWidth;
        s.vx = -Math.abs(s.vx);
      } else if (s.currentX < 0) {
        s.currentX = 0;
        s.vx = Math.abs(s.vx);
      }

      // Update Particles
      for (let i = s.particles.length - 1; i >= 0; i--) {
        const p = s.particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
        if (p.life <= 0) s.particles.splice(i, 1);
      }

      // ── Canvas Rendering ──
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Skyscraper Skyline Night Gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
      skyGrad.addColorStop(0, '#0f172a');
      skyGrad.addColorStop(0.5, '#1e1b4b');
      skyGrad.addColorStop(1, '#020617');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h);

      // Render Stacked Layers (Bottom-Up)
      const baseFloorY = 440;
      const blockHeight = 16;

      s.layers.forEach((layer, idx) => {
        const y = baseFloorY - idx * blockHeight;
        ctx.fillStyle = layer.color;
        ctx.shadowColor = layer.color;
        ctx.shadowBlur = 10;
        ctx.fillRect(layer.x, y, layer.width, blockHeight - 2);

        // Glass Window Highlights
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        for (let wx = layer.x + 6; wx < layer.x + layer.width - 6; wx += 14) {
          ctx.fillRect(wx, y + 3, 6, blockHeight - 8);
        }

        // Layer Theme Badge (Every 3 floors)
        if (idx % 3 === 0 && layer.width > 30) {
          const layerCardId = idx === 0 ? 78 : (idx >= 15 ? 83 : (idx >= 9 ? 100 : 92));
          drawCardSprite(
            ctx,
            layerCardId,
            layer.x + layer.width / 2 - 8,
            y,
            16,
            16,
            {
              circleClip: true,
              borderWidth: 1,
              borderColor: '#ffffff',
              shadowBlur: 6,
            }
          );
        }
      });
      ctx.shadowBlur = 0;

      // Render Active Moving Block at Top
      const activeY = Math.max(90, baseFloorY - s.layers.length * blockHeight);
      const currentColor = blockColors[s.layers.length % blockColors.length];

      ctx.fillStyle = currentColor;
      ctx.shadowColor = currentColor;
      ctx.shadowBlur = 18;
      ctx.fillRect(s.currentX, activeY, s.currentWidth, blockHeight - 2);

      // Window highlights for active block
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      for (let wx = s.currentX + 6; wx < s.currentX + s.currentWidth - 6; wx += 14) {
        ctx.fillRect(wx, activeY + 3, 6, blockHeight - 8);
      }
      ctx.shadowBlur = 0;

      // Active Moving Block Architect Hero Badge
      drawCardSprite(
        ctx,
        playerHeroId,
        s.currentX + s.currentWidth / 2 - 12,
        activeY - 12,
        24,
        24,
        {
          circleClip: true,
          borderWidth: 1.5,
          borderColor: '#fde047',
          shadowBlur: 12,
          shadowColor: 'rgba(253, 224, 71, 0.9)',
        }
      );

      // Render Particles
      s.particles.forEach((p) => {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, 4, 4);
      });
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [playerHeroId]);

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
      gameId: 'arcade_tower_stack',
      gameTitle: '블리츠 타워 스택',
      durationSeconds: duration,
      score: s.score + (isWin ? 3500 : s.floorsStacked * 300) + s.maxCombo * 50,
      difficulty: 'NIGHTMARE',
      isVictory: isWin && s.floorsStacked >= 15,
    });
    setSettlementReceipt(receipt);
    onReward(receipt.totalSns);
  };

  const tutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 손가락 탭 마천루 타워 스택' : 'STEP 1: TAP TIMING TOWER STACK',
      title: isKo ? '화면을 탭해 움직이는 블록을 완벽하게 쌓아 올리세요' : 'Tap screen to drop swinging blocks and stack the skyscraper',
      description: isKo
        ? '가상 조이스틱 없이 화면 상단에서 좌우로 왕복하는 블록을 손가락으로 타이밍에 맞춰 직접 탭(Direct Tap)하여 오차 없이 20층 마천루를 건설하세요.'
        : 'Tap screen with precision timing to stack oscillating blocks and construct a 20-story skyscraper.',
      keyPoints: isKo
        ? [
            '가상 조이스틱 0개 (100% 손가락 직접 탭 낙하)',
            '오차 0 퍼펙트 스냅(Snap) 시 500P 잭팟 대박 보너스',
            '35초간 최대 콤보로 20층 타워를 완공하고 올클리어'
          ]
        : [
            'Zero Virtual Joysticks: 100% Direct Tap Timing Drop',
            'Perfect Snap alignment awards 500P precision jackpot',
            'Construct 20-floor skyscraper within 35s sprint'
          ],
      iconType: 'GOAL',
    },
    {
      badge: isKo ? 'STEP 2: 모바일 퓨어 제스처' : 'STEP 2: PURE GESTURES',
      title: isKo ? '화면 직접 원탭 (One-Tap Action)' : 'One-Tap Drop Gesture',
      description: isKo
        ? '화면 아무 곳이나 탭하여 블록을 제자리에 고정합니다.'
        : 'Tap anywhere on screen to snap the swinging block into place.',
      keyPoints: isKo
        ? [
            '👆 원터치 탭: 60FPS 즉각 반응 초정밀 블록 안착',
            '🏢 연속 퍼펙트 성공 시 스택 콤보 배수 보너스',
            '⏱️ 35초 타임어택 고득점 챌린지'
          ]
        : [
            '👆 One-Touch Tap: 60FPS instant responsive block placement',
            '🏢 Consecutive perfect snaps grant stack combo multipliers',
            '⏱️ 35s time attack tower stack sprint'
          ],
      iconType: 'GESTURES',
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '완공 즉시 NIGHTMARE 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Nightmare payout deposited atomically to your LocalStorage wallet upon match finish.',
      keyPoints: isKo
        ? [
            '완료 즉시 LocalStorage 영구 지갑 입금',
            '완공한 층수 및 연속 퍼펙트 콤보 비례 대량 잭팟',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Stacked floors count and combo multipliers',
            'VictoryRewardModal golden coin fanfare'
          ],
      iconType: 'REWARDS',
    },
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-[#020617] text-white font-mono select-none flex flex-col overflow-hidden items-center justify-between touch-none">
      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '블리츠 타워 스택' : 'Blitz Tower Stack'}
        language={(language as Language) || 'ko'}
        telemetries={[
          { label: isKo ? '층수' : 'Floors', value: `${floorsStacked}/${targetFloors}층`, color: 'text-amber-400 font-bold' },
          { label: isKo ? '콤보' : 'Combo', value: `${stackCombo}x`, color: stackCombo > 2 ? 'text-amber-300 font-bold animate-bounce' : 'text-slate-300' },
          { label: isKo ? '시간' : 'Time', value: `${timeLeft}s`, color: timeLeft <= 10 ? 'text-rose-500 font-bold animate-pulse' : 'text-cyan-400 font-bold' },
          { label: isKo ? '점수' : 'Score', value: `${score}P`, color: 'text-amber-300 font-bold' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => setIsPaused(prev => !prev)}
        isPaused={isPaused}
      />

      {/* Pure Touch Tower Stack Canvas Viewport */}
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
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 pointer-events-none text-base font-bold text-amber-300 drop-shadow-lg animate-bounce whitespace-nowrap bg-black/60 px-4 py-1 rounded-full border border-amber-400/30">
            {feedbackText}
          </div>
        )}
      </div>

      {/* Minimal Bottom Guide */}
      <div className="w-full pb-3 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1 bg-black/50 border border-white/10 rounded-full text-[10px] text-slate-300 font-mono">
          {isKo ? '화면을 탭해 타이밍에 맞춰 블록을 완벽하게 쌓으세요' : 'Tap anywhere to drop and stack the moving block'}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="arcade_tower_stack"
          gameTitle={isKo ? '블리츠 스택: 마천루 건설' : 'Blitz Stack: Skyscraper Builder'}
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
export default VoxelTowerStackGame;
