import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData, Language } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelPinballClimberGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface PinballBumper {
  id: number;
  x: number;
  y: number;
  radius: number;
  type: 'bumper' | 'star' | 'gem';
  icon: string;
  points: number;
  hitAnim: number;
}

export const VoxelPinballClimberGame: React.FC<VoxelPinballClimberGameProps> = ({
  deck: _deck,
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  const [currentFloor, setCurrentFloor] = useState<number>(1);
  const maxFloor = 5;
  const [bumpersHit, setBumpersHit] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [pinballCombo, setPinballCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(35);
  const [feedbackText, setFeedbackText] = useState<string | null>(null);

  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_game_pinball_climber') !== 'true';
    } catch {
      return true;
    }
  });
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const stateRef = useRef({
    ballX: 180,
    ballY: 380,
    ballVx: 120,
    ballVy: -320,
    paddleX: 180,
    targetPaddleX: 180,
    paddleW: 76,
    paddleH: 14,
    currentFloor: 1,
    bumpersHit: 0,
    score: 0,
    combo: 0,
    maxCombo: 0,
    timeLeft: 35,
    isGameOver: false,
    isPaused: false,
    startTime: Date.now(),
    bumpers: [] as PinballBumper[],
    particles: [] as { x: number; y: number; vx: number; vy: number; color: string; life: number }[],
  });

  const setupFloorBumpers = useCallback((floor: number) => {
    const bumpers: PinballBumper[] = [];
    let bId = 1;

    // Floor-specific Layout
    const rows = 3;
    for (let r = 0; r < rows; r++) {
      const count = 3 + (r % 2);
      for (let c = 0; c < count; c++) {
        const bx = 60 + c * (240 / count) + (240 / count) / 2;
        const by = 110 + r * 65;

        const isStar = (r + c + floor) % 3 === 0;
        const isGem = (r + c) % 4 === 0;

        bumpers.push({
          id: bId++,
          x: bx,
          y: by,
          radius: isStar ? 22 : 18,
          type: isStar ? 'star' : (isGem ? 'gem' : 'bumper'),
          icon: isStar ? '⭐' : (isGem ? '💎' : '🎯'),
          points: isStar ? 500 : (isGem ? 350 : 200),
          hitAnim: 0,
        });
      }
    }
    return bumpers;
  }, []);

  const initGame = useCallback(() => {
    const s = stateRef.current;
    s.ballX = 180;
    s.ballY = 380;
    s.ballVx = 120;
    s.ballVy = -320;
    s.paddleX = 180;
    s.targetPaddleX = 180;
    s.currentFloor = 1;
    s.bumpersHit = 0;
    s.score = 0;
    s.combo = 0;
    s.maxCombo = 0;
    s.timeLeft = 35;
    s.isGameOver = false;
    s.startTime = Date.now();
    s.bumpers = setupFloorBumpers(1);
    s.particles = [];

    setCurrentFloor(1);
    setBumpersHit(0);
    setScore(0);
    setPinballCombo(0);
    setMaxCombo(0);
    setTimeLeft(35);
    setFeedbackText(null);
    setIsGameOver(false);
    setSettlementReceipt(null);
  }, [setupFloorBumpers]);

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

  // Touch Handlers: Direct Horizontal Finger Drag (Zero Joysticks)
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = stateRef.current;
    if (s.isGameOver || s.isPaused) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;

    s.targetPaddleX = Math.max(45, Math.min(315, (e.clientX - rect.left) * scaleX));
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = stateRef.current;
    if (s.isGameOver || s.isPaused) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;

    s.targetPaddleX = Math.max(45, Math.min(315, (e.clientX - rect.left) * scaleX));
  };

  // Main 60FPS Pinball Climber Loop
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

      // Smooth Paddle Tracking
      s.paddleX += (s.targetPaddleX - s.paddleX) * Math.min(1, dt * 20);

      // Ball Physics (Gravity & Velocity)
      s.ballVy += 220 * dt; // Light pinball gravity
      s.ballX += s.ballVx * dt;
      s.ballY += s.ballVy * dt;

      // Wall Bounces
      if (s.ballX < 24) {
        s.ballX = 24;
        s.ballVx = Math.abs(s.ballVx);
        playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
      } else if (s.ballX > 336) {
        s.ballX = 336;
        s.ballVx = -Math.abs(s.ballVx);
        playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
      }

      // Ceiling Climb to Next Floor
      if (s.ballY < 50) {
        s.ballY = 400;
        s.ballVy = -320;
        s.currentFloor += 1;
        setCurrentFloor(s.currentFloor);

        s.score += 1500;
        setScore(s.score);

        setFeedbackText(`🎉 FLOOR ${s.currentFloor} REACHED! +1500P 🎉`);
        playSfx?.('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
        setTimeout(() => setFeedbackText(null), 500);

        if (s.currentFloor > maxFloor) {
          endGame(true);
          return;
        }

        s.bumpers = setupFloorBumpers(s.currentFloor);
      }

      // Paddle Collision (Paddle at Y=440)
      const paddleY = 440;
      if (
        s.ballVy > 0 &&
        s.ballY >= paddleY - 12 &&
        s.ballY <= paddleY + 12 &&
        Math.abs(s.ballX - s.paddleX) < s.paddleW / 2 + 10
      ) {
        s.ballY = paddleY - 12;
        const hitOffset = (s.ballX - s.paddleX) / (s.paddleW / 2);
        s.ballVx = hitOffset * 260;
        s.ballVy = -380;

        playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');

        // Paddle Sparkles
        for (let p = 0; p < 8; p++) {
          s.particles.push({
            x: s.ballX,
            y: paddleY,
            vx: (Math.random() - 0.5) * 200,
            vy: -Math.random() * 150,
            color: '#38bdf8',
            life: 0.4,
          });
        }
      }

      // Bottom Fall: Respawn Ball
      if (s.ballY > 520) {
        s.ballX = s.paddleX;
        s.ballY = 380;
        s.ballVx = (Math.random() - 0.5) * 200;
        s.ballVy = -320;
        s.combo = 0;
        setPinballCombo(0);
      }

      // Bumper Collisions
      s.bumpers.forEach((b) => {
        if (b.hitAnim > 0) b.hitAnim -= dt * 4;

        const dist = Math.hypot(b.x - s.ballX, b.y - s.ballY);
        if (dist < b.radius + 12) {
          // Bounce off bumper
          const angle = Math.atan2(s.ballY - b.y, s.ballX - b.x);
          const bounceSpeed = 380;
          s.ballVx = Math.cos(angle) * bounceSpeed;
          s.ballVy = Math.sin(angle) * bounceSpeed;

          b.hitAnim = 1;
          s.bumpersHit += 1;
          s.combo += 1;
          if (s.combo > s.maxCombo) s.maxCombo = s.combo;

          const pts = b.points + s.combo * 30;
          s.score += pts;

          setBumpersHit(s.bumpersHit);
          setScore(s.score);
          setPinballCombo(s.combo);
          setMaxCombo(s.maxCombo);

          setFeedbackText(`${b.icon} HIT! +${pts}P`);
          playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
          setTimeout(() => setFeedbackText(null), 300);

          // Bumper Sparkles
          for (let p = 0; p < 10; p++) {
            s.particles.push({
              x: b.x,
              y: b.y,
              vx: (Math.random() - 0.5) * 240,
              vy: (Math.random() - 0.5) * 240,
              color: b.type === 'star' ? '#fde047' : '#f43f5e',
              life: 0.5,
            });
          }
        }
      });

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

      // Neon Cyber Pinball Arena Background
      const neonGrad = ctx.createLinearGradient(0, 0, 0, h);
      neonGrad.addColorStop(0, '#0f172a');
      neonGrad.addColorStop(0.5, '#1e1b4b');
      neonGrad.addColorStop(1, '#020617');
      ctx.fillStyle = neonGrad;
      ctx.fillRect(0, 0, w, h);

      // Arena Wall Borders (Neon Glow)
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 4;
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 10;
      ctx.strokeRect(12, 12, w - 24, h - 24);
      ctx.shadowBlur = 0;

      // Render Bumpers
      s.bumpers.forEach((b) => {
        ctx.save();
        ctx.translate(b.x, b.y);

        if (b.hitAnim > 0) {
          ctx.scale(1 + b.hitAnim * 0.3, 1 + b.hitAnim * 0.3);
          ctx.shadowColor = '#fde047';
          ctx.shadowBlur = 20;
        }

        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(0, 0, b.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = b.type === 'star' ? '#fde047' : (b.type === 'gem' ? '#38bdf8' : '#f43f5e');
        ctx.lineWidth = 2.5;
        ctx.stroke();

        ctx.font = `${b.radius * 1.3}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(b.icon, 0, 0);
        ctx.restore();
      });

      // Render Paddle
      ctx.save();
      ctx.translate(s.paddleX, paddleY);
      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 15;
      ctx.fillRect(-s.paddleW / 2, -s.paddleH / 2, s.paddleW, s.paddleH);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.strokeRect(-s.paddleW / 2, -s.paddleH / 2, s.paddleW, s.paddleH);
      ctx.restore();

      // Render Glowing Pinball
      ctx.save();
      ctx.translate(s.ballX, s.ballY);
      ctx.shadowColor = '#fde047';
      ctx.shadowBlur = 18;
      ctx.font = '24px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🟡', 0, 0);
      ctx.restore();

      // Render Particles
      s.particles.forEach((p) => {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, 4, 4);
      });
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [playSfx, setupFloorBumpers]);

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
      gameId: 'arcade_pinball_climber',
      gameTitle: '블리츠 핀볼 클라이머',
      durationSeconds: duration,
      score: s.score + (isWin ? 3500 : (s.currentFloor * 800 + s.bumpersHit * 150)) + s.maxCombo * 40,
      difficulty: 'NIGHTMARE',
      isVictory: isWin || s.currentFloor >= 3,
    });
    setSettlementReceipt(receipt);
    onReward(receipt.totalSns);
  };

  const tutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 손가락 드래그 패들 바운스' : 'STEP 1: DRAG PADDLE BOUNCE',
      title: isKo ? '패들을 좌우로 드래그해 핀볼을 튕겨 타워를 오르세요' : 'Drag Paddle Left & Right to Bounce Ball & Climb Tower',
      description: isKo
        ? '가상 조이스틱 없이 하단의 패들을 손가락으로 직접 좌우 드래그하여 떨어지는 황금 핀볼(🟡)을 튕겨내고, 네온 범퍼(🎯, ⭐, 💎)를 연쇄 타격하며 천장을 뚫고 5층 꼭대기까지 클라이밍하세요.'
        : 'Drag the bottom paddle to bounce the glowing pinball, hit neon bumpers, and climb through the 5-floor tower.',
      keyPoints: isKo
        ? [
            '가상 조이스틱 0개 (100% 손가락 직접 좌우 드래그 패들)',
            '스타(⭐) 범퍼 타격 시 500P 잭팟 대량 보너스',
            '35초간 최대 콤보로 5개 층을 정복하고 올클리어'
          ]
        : [
            'Zero Virtual Joysticks: 100% Direct Horizontal Paddle Drag',
            'Star (⭐) bumpers award massive 500P jackpot',
            'Climb through 5 floors with continuous combos within 35s'
          ],
      iconType: 'GOAL',
    },
    {
      badge: isKo ? 'STEP 2: 모바일 퓨어 제스처' : 'STEP 2: PURE GESTURES',
      title: isKo ? '화면 좌우 직접 드래그 (Horizontal Drag)' : 'Horizontal Drag Gesture',
      description: isKo
        ? '손가락을 대고 원하는 위치로 패들을 부드럽게 이끕니다.'
        : 'Slide your thumb smoothly left and right to guide the paddle.',
      keyPoints: isKo
        ? [
            '👆 좌우 드래그: 실시간 즉각 반응 패들 위치 동기화',
            '🎯 연속 범퍼 타격 시 핀볼 콤보 배수 보너스',
            '⏱️ 35초 타임어택 고득점 챌린지'
          ]
        : [
            '👆 Horizontal Drag: Instant fluid paddle position tracking',
            '🎯 Consecutive bumper hits trigger combo multipliers',
            '⏱️ 35s time attack pinball climbing sprint'
          ],
      iconType: 'GESTURES',
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '등반 완료 즉시 NIGHTMARE 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Nightmare payout deposited atomically to your LocalStorage wallet upon match finish.',
      keyPoints: isKo
        ? [
            '완료 즉시 LocalStorage 영구 지갑 입금',
            '도달 층수 및 범퍼 타격 수 비례 대량 잭팟',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Climbed floors and bumper hit count multipliers',
            'VictoryRewardModal golden coin fanfare'
          ],
      iconType: 'REWARDS',
    },
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-[#020617] text-white font-mono select-none flex flex-col overflow-hidden items-center justify-between touch-none">
      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '블리츠 핀볼 클라이머' : 'Blitz Pinball Climber'}
        language={(language as Language) || 'ko'}
        telemetries={[
          { label: isKo ? '층' : 'Floor', value: `${currentFloor}F/${maxFloor}F`, color: 'text-amber-400 font-bold' },
          { label: isKo ? '범퍼' : 'Hits', value: `${bumpersHit}회`, color: 'text-cyan-300 font-bold' },
          { label: isKo ? '시간' : 'Time', value: `${timeLeft}s`, color: timeLeft <= 10 ? 'text-rose-500 font-bold animate-pulse' : 'text-cyan-400 font-bold' },
          { label: isKo ? '점수' : 'Score', value: `${score}P`, color: 'text-amber-300 font-bold' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => setIsPaused(prev => !prev)}
        isPaused={isPaused}
      />

      {/* Pure Touch Pinball Climber Canvas Viewport */}
      <div className="flex-1 w-full max-w-md relative overflow-hidden flex items-center justify-center select-none touch-none p-2">
        <canvas
          ref={canvasRef}
          width={360}
          height={500}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          className="w-full h-full object-contain touch-none cursor-pointer shadow-2xl"
        />

        {/* Floating Feedback Text */}
        {feedbackText && (
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 pointer-events-none text-base font-bold text-amber-300 drop-shadow-lg animate-bounce whitespace-nowrap">
            {feedbackText}
          </div>
        )}
      </div>

      {/* Minimal Bottom Guide */}
      <div className="w-full pb-3 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1 bg-black/50 border border-white/10 rounded-full text-[10px] text-slate-300 font-mono">
          {isKo ? '손가락으로 패들을 좌우 드래그해 핀볼을 튕겨 타워를 오르세요' : 'Drag paddle left & right to bounce pinball and climb the tower'}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="arcade_pinball_climber"
          gameTitle={isKo ? '블리츠 핀볼: 타워 클라이머' : 'Blitz Pinball: Tower Climber'}
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
export default VoxelPinballClimberGame;
