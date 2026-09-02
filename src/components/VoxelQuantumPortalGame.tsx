import { drawCardSprite } from '../lib/canvasCardRenderer';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData, Language } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelQuantumPortalGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface QuantumNode {
  id: number;
  r: number;
  c: number;
  x: number;
  y: number;
  type: 'blue_portal' | 'orange_portal' | 'quantum_gem' | 'star_core';
  cardId: number;
  icon: string;
  points: number;
  connected: boolean;
}

export const VoxelQuantumPortalGame: React.FC<VoxelQuantumPortalGameProps> = ({
  deck = [],
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
  const playerHeroId = deck[0]?.id || 53;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  const [loopsCompleted, setLoopsCompleted] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [quantumCombo, setQuantumCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(35);
  const [feedbackText, setFeedbackText] = useState<string | null>(null);

  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_game_quantum_loop') !== 'true';
    } catch {
      return true;
    }
  });
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const stateRef = useRef({
    grid: [] as QuantumNode[],
    selectedNodes: [] as number[],
    isDragging: false,
    dragPos: { x: 0, y: 0 },
    loopsCompleted: 0,
    score: 0,
    combo: 0,
    maxCombo: 0,
    timeLeft: 35,
    isGameOver: false,
    isPaused: false,
    startTime: Date.now(),
    particles: [] as { x: number; y: number; vx: number; vy: number; color: string; life: number }[],
  });

  const setupQuantumGrid = useCallback(() => {
    const grid: QuantumNode[] = [];
    const rows = 4;
    const cols = 4;
    let id = 1;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        let type: 'blue_portal' | 'orange_portal' | 'quantum_gem' | 'star_core' = 'quantum_gem';
        let cardId = 53;
        let icon = '🟣';
        let points = 250;

        if (r === 0 && c === 0) {
          type = 'blue_portal';
          cardId = 92;
          icon = '🌀';
          points = 500;
        } else if (r === 3 && c === 3) {
          type = 'orange_portal';
          cardId = 95;
          icon = '🟠';
          points = 500;
        } else if ((r + c) % 3 === 0) {
          type = 'star_core';
          cardId = 100;
          icon = '⭐';
          points = 400;
        } else if ((r * c) % 2 === 1) {
          cardId = 62;
          icon = '🔵';
          points = 300;
        }

        grid.push({
          id: id++,
          r,
          c,
          x: 55 + c * 82,
          y: 95 + r * 82,
          type,
          cardId,
          icon,
          points,
          connected: false,
        });
      }
    }
    return grid;
  }, []);

  const initGame = useCallback(() => {
    const s = stateRef.current;
    s.grid = setupQuantumGrid();
    s.selectedNodes = [];
    s.isDragging = false;
    s.loopsCompleted = 0;
    s.score = 0;
    s.combo = 0;
    s.maxCombo = 0;
    s.timeLeft = 35;
    s.isGameOver = false;
    s.startTime = Date.now();
    s.particles = [];

    setLoopsCompleted(0);
    setScore(0);
    setQuantumCombo(0);
    setMaxCombo(0);
    setTimeLeft(35);
    setFeedbackText(null);
    setIsGameOver(false);
    setSettlementReceipt(null);
  }, [setupQuantumGrid]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  // Timer loop
  useEffect(() => {
    if (isGameOver || isPaused) return;

    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          const isTargetMet = stateRef.current.loopsCompleted >= 5;
          endGame(isTargetMet);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isGameOver, isPaused]);

  // Drag Connect Quantum Loop (Zero Joysticks)
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

    // Find starting node
    const startNode = s.grid.find((n) => Math.hypot(n.x - touchX, n.y - touchY) < 32);
    if (startNode) {
      s.isDragging = true;
      s.selectedNodes = [startNode.id];
      s.dragPos = { x: touchX, y: touchY };
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
    s.dragPos = { x: touchX, y: touchY };

    // Check adjacent neighbor connection
    const lastId = s.selectedNodes[s.selectedNodes.length - 1];
    const lastNode = s.grid.find((n) => n.id === lastId);
    if (!lastNode) return;

    const hoveredNode = s.grid.find((n) => Math.hypot(n.x - touchX, n.y - touchY) < 32);
    if (hoveredNode && !s.selectedNodes.includes(hoveredNode.id)) {
      const isNeighbor = Math.abs(hoveredNode.r - lastNode.r) <= 1 && Math.abs(hoveredNode.c - lastNode.c) <= 1;
      if (isNeighbor) {
        s.selectedNodes.push(hoveredNode.id);
        playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
      }
    }
  };

  const handlePointerUp = () => {
    const s = stateRef.current;
    if (!s.isDragging || s.isGameOver || s.isPaused) return;
    s.isDragging = false;

    // Check if path connects Blue Portal and Orange Portal
    const selected = s.selectedNodes.map((id) => s.grid.find((n) => n.id === id)!);
    const hasBlue = selected.some((n) => n.type === 'blue_portal');
    const hasOrange = selected.some((n) => n.type === 'orange_portal');

    if (hasBlue && hasOrange && selected.length >= 4) {
      // Quantum Wormhole Loop Closed!
      s.loopsCompleted += 1;
      s.combo += 1;
      if (s.combo > s.maxCombo) s.maxCombo = s.combo;

      let loopPoints = selected.reduce((sum, n) => sum + n.points, 0) + s.combo * 100;
      s.score += loopPoints;

      setLoopsCompleted(s.loopsCompleted);
      setScore(s.score);
      setQuantumCombo(s.combo);
      setMaxCombo(s.maxCombo);

      setFeedbackText(`QUANTUM LOOP OPEN! +${loopPoints}P 🌀⚡`);
      playSfx?.('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
      setTimeout(() => setFeedbackText(null), 500);

      // Loop Sparkles
      selected.forEach((n) => {
        for (let p = 0; p < 8; p++) {
          s.particles.push({
            x: n.x,
            y: n.y,
            vx: (Math.random() - 0.5) * 250,
            vy: (Math.random() - 0.5) * 250,
            color: n.type === 'blue_portal' ? '#06b6d4' : '#f97316',
            life: 0.5,
          });
        }
      });

      // Regenerate Grid
      setTimeout(() => {
        s.grid = setupQuantumGrid();
      }, 400);
    } else if (selected.length > 1) {
      s.combo = 0;
      setQuantumCombo(0);
      setFeedbackText(isKo ? '포탈 연결 미완성 (🌀-🟠 연결 필요)' : 'INCOMPLETE PORTAL LOOP');
      setTimeout(() => setFeedbackText(null), 400);
    }

    s.selectedNodes = [];
  };

  // Main 60FPS Quantum Loop Render Loop
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

      // Dark Quantum Space Background
      const spaceGrad = ctx.createLinearGradient(0, 0, 0, h);
      spaceGrad.addColorStop(0, '#0f172a');
      spaceGrad.addColorStop(0.5, '#1e1b4b');
      spaceGrad.addColorStop(1, '#020617');
      ctx.fillStyle = spaceGrad;
      ctx.fillRect(0, 0, w, h);

      // Quantum Grid Laser Lines (Connected Trail)
      if (s.selectedNodes.length > 0) {
        const selNodes = s.selectedNodes.map((id) => s.grid.find((n) => n.id === id)!);
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 6;
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 18;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(selNodes[0].x, selNodes[0].y);
        for (let i = 1; i < selNodes.length; i++) {
          ctx.lineTo(selNodes[i].x, selNodes[i].y);
        }
        if (s.isDragging) {
          ctx.lineTo(s.dragPos.x, s.dragPos.y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // Render Quantum Nodes (Card Sprites)
      s.grid.forEach((n) => {
        const isSelected = s.selectedNodes.includes(n.id);
        ctx.save();
        ctx.translate(n.x, n.y);

        if (isSelected) {
          ctx.scale(1.2, 1.2);
        }

        drawCardSprite(
          ctx,
          n.cardId,
          -22,
          -22,
          44,
          44,
          {
            circleClip: true,
            borderWidth: isSelected ? 2.5 : 1.5,
            borderColor: n.type === 'orange_portal' ? '#f97316' : (n.type === 'blue_portal' ? '#06b6d4' : (n.type === 'star_core' ? '#fde047' : '#a855f7')),
            shadowBlur: isSelected ? 20 : 6,
            shadowColor: n.type === 'orange_portal' ? 'rgba(249, 115, 22, 0.9)' : (n.type === 'blue_portal' ? 'rgba(6, 182, 212, 0.9)' : 'rgba(168, 85, 247, 0.8)'),
          }
        );

        ctx.restore();
      });

      // Render Quantum Explorer Hero Badge at Bottom
      drawCardSprite(
        ctx,
        playerHeroId,
        w / 2 - 22,
        440,
        44,
        44,
        {
          circleClip: true,
          borderWidth: 2,
          borderColor: '#38bdf8',
          shadowBlur: 14,
          shadowColor: 'rgba(56, 189, 248, 0.8)',
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
      gameId: 'arcade_quantum_loop',
      gameTitle: '블리츠 퀀텀 루프',
      durationSeconds: duration,
      score: s.score + (isWin ? 3500 : s.loopsCompleted * 600) + s.maxCombo * 50,
      difficulty: 'NIGHTMARE',
      isVictory: isWin && s.loopsCompleted >= 5,
    });
    setSettlementReceipt(receipt);
    onReward(receipt.totalSns);
  };

  const tutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 손가락 스와이프 양자 루프 연결' : 'STEP 1: SWIPE CONNECT QUANTUM LOOPS',
      title: isKo ? '블루 포탈(🌀)에서 오렌지 포탈(🟠)까지 선을 그어 연결하세요' : 'Drag from Blue Portal to Orange Portal to Open Circuit',
      description: isKo
        ? '가상 조이스틱 없이 화면의 블루 웜홀(🌀)을 터치하고 손가락을 떼지 않은 채 주변 양자 오브(🟣, 🔵, ⭐)들을 연결하여 오렌지 웜홀(🟠)까지 회로를 닫아 차원문을 여세요.'
        : 'Connect from the blue portal across quantum gems to the orange portal with a single continuous drag gesture.',
      keyPoints: isKo
        ? [
            '가상 조이스틱 0개 (100% 손가락 직접 스와이프 연결)',
            '스타 코어(⭐) 포함 연결 시 400P 추가 잭팟',
            '35초간 최대 콤보로 퀀텀 루프를 완성하고 올클리어'
          ]
        : [
            'Zero Virtual Joysticks: 100% Continuous Drag Circuit',
            'Star Cores (⭐) grant 400P extra bonus energy',
            'Complete quantum loops with continuous combos within 35s'
          ],
      iconType: 'GOAL',
    },
    {
      badge: isKo ? 'STEP 2: 모바일 퓨어 제스처' : 'STEP 2: PURE GESTURES',
      title: isKo ? '화면 직접 드래그 라인 (Drag Line Gesture)' : 'Drag Line Gesture',
      description: isKo
        ? '인접한 노드들을 손가락으로 부드럽게 이어 회로를 완성합니다.'
        : 'Connect adjacent nodes smoothly in a single stroke.',
      keyPoints: isKo
        ? [
            '👆 연속 드래그: 실시간 푸른빛 레이저 회로 궤적',
            '🌀 연속 루프 완성 시 퀀텀 콤보 배수 보너스',
            '⏱️ 35초 타임어택 고득점 챌린지'
          ]
        : [
            '👆 Drag Line: Radiant blue laser circuit line',
            '🌀 Consecutive loop completions grant combo multipliers',
            '⏱️ 35s time attack quantum loop sprint'
          ],
      iconType: 'GESTURES',
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '도약 완료 즉시 NIGHTMARE 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Nightmare payout deposited atomically to your LocalStorage wallet upon match finish.',
      keyPoints: isKo
        ? [
            '완료 즉시 LocalStorage 영구 지갑 입금',
            '완성한 퀀텀 루프 수 및 최대 콤보 비례 대량 잭팟',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Completed quantum loops count and combo multipliers',
            'VictoryRewardModal golden coin fanfare'
          ],
      iconType: 'REWARDS',
    },
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-[#020617] text-white font-mono select-none flex flex-col overflow-hidden items-center justify-between touch-none">
      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '블리츠 퀀텀 루프' : 'Blitz Quantum Loop'}
        language={(language as Language) || 'ko'}
        telemetries={[
          { label: isKo ? '루프' : 'Loops', value: `${loopsCompleted}회`, color: 'text-amber-400 font-bold' },
          { label: isKo ? '콤보' : 'Combo', value: `${quantumCombo}x`, color: quantumCombo > 2 ? 'text-amber-300 font-bold animate-bounce' : 'text-slate-300' },
          { label: isKo ? '시간' : 'Time', value: `${timeLeft}s`, color: timeLeft <= 10 ? 'text-rose-500 font-bold animate-pulse' : 'text-cyan-400 font-bold' },
          { label: isKo ? '점수' : 'Score', value: `${score}P`, color: 'text-amber-300 font-bold' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => setIsPaused(prev => !prev)}
        isPaused={isPaused}
      />

      {/* Pure Touch Quantum Loop Canvas Viewport */}
      <div className="flex-1 w-full max-w-md relative overflow-hidden flex items-center justify-center select-none touch-none p-2">
        <canvas
          ref={canvasRef}
          width={360}
          height={500}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="w-full h-full object-contain touch-none cursor-crosshair shadow-2xl"
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
          {isKo ? '블루 포탈(🌀)에서 오렌지 포탈(🟠)까지 손가락으로 이어 루프를 완성하세요' : 'Drag from blue portal to orange portal across quantum gems to close loop'}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="arcade_quantum_loop"
          gameTitle={isKo ? '블리츠 퀀텀: 차원 회로' : 'Blitz Quantum: Circuit Loop'}
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
export default VoxelQuantumPortalGame;
