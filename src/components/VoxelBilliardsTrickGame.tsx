import { drawCardSprite } from '../lib/canvasCardRenderer';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData, Language } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelBilliardsTrickGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface PoolBall {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  isCue: boolean;
  isPocketed: boolean;
  num: number;
}

interface PocketHole {
  x: number;
  y: number;
  radius: number;
}

export const VoxelBilliardsTrickGame: React.FC<VoxelBilliardsTrickGameProps> = ({
  deck = [],
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
  const playerHeroId = deck[0]?.id || 86;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  const [pocketedCount, setPocketedCount] = useState<number>(0);
  const [shotsLeft, setShotsLeft] = useState<number>(6);
  const totalTargetBalls = 6;
  const [score, setScore] = useState<number>(0);
  const [comboText, setComboText] = useState<string | null>(null);

  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_game_billiards_trick') !== 'true';
    } catch {
      return true;
    }
  });
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const stateRef = useRef({
    balls: [] as PoolBall[],
    pockets: [] as PocketHole[],
    isDragging: false,
    dragStart: { x: 0, y: 0 },
    dragCurrent: { x: 0, y: 0 },
    shotsLeft: 6,
    pocketedCount: 0,
    score: 0,
    isGameOver: false,
    isPaused: false,
    startTime: Date.now(),
  });

  const BALL_COLORS = ['#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6', '#10b981', '#ec4899'];

  const initGame = useCallback(() => {
    const s = stateRef.current;
    s.shotsLeft = 6;
    s.pocketedCount = 0;
    s.score = 0;
    s.isGameOver = false;
    s.startTime = Date.now();
    s.isDragging = false;

    // 6 Table Pockets (Corners & Middles)
    s.pockets = [
      { x: 30, y: 50, radius: 22 }, // Top-Left
      { x: 330, y: 50, radius: 22 }, // Top-Right
      { x: 30, y: 270, radius: 20 }, // Mid-Left
      { x: 330, y: 270, radius: 20 }, // Mid-Right
      { x: 30, y: 490, radius: 22 }, // Bot-Left
      { x: 330, y: 490, radius: 22 }, // Bot-Right
    ];

    // Cue Ball (White)
    const balls: PoolBall[] = [
      {
        id: 0,
        x: 180,
        y: 410,
        vx: 0,
        vy: 0,
        radius: 12,
        color: '#ffffff',
        isCue: true,
        isPocketed: false,
        num: 0,
      },
    ];

    // 6 Target Colored Balls (Triangle Rack)
    const rackPositions = [
      { x: 180, y: 150 },
      { x: 166, y: 128 },
      { x: 194, y: 128 },
      { x: 152, y: 106 },
      { x: 180, y: 106 },
      { x: 208, y: 106 },
    ];

    rackPositions.forEach((pos, idx) => {
      balls.push({
        id: idx + 1,
        x: pos.x,
        y: pos.y,
        vx: 0,
        vy: 0,
        radius: 12,
        color: BALL_COLORS[idx],
        isCue: false,
        isPocketed: false,
        num: idx + 1,
      });
    });

    s.balls = balls;

    setPocketedCount(0);
    setShotsLeft(6);
    setScore(0);
    setComboText(null);
    setIsGameOver(false);
    setSettlementReceipt(null);
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  // Touch / Pointer Cue Pull & Aim Gesture Handlers (Zero Sliders)
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = stateRef.current;
    if (s.isGameOver || s.isPaused || s.shotsLeft <= 0) return;

    // Check if any ball is currently moving
    const isMoving = s.balls.some((b) => !b.isPocketed && Math.hypot(b.vx, b.vy) > 0.1);
    if (isMoving) return;

    const cueBall = s.balls.find((b) => b.isCue && !b.isPocketed);
    if (!cueBall) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const touchX = (e.clientX - rect.left) * scaleX;
    const touchY = (e.clientY - rect.top) * scaleY;

    // Can start drag anywhere on the bottom half
    s.isDragging = true;
    s.dragStart = { x: cueBall.x, y: cueBall.y };
    s.dragCurrent = { x: touchX, y: touchY };
    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
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

    s.dragCurrent = { x: touchX, y: touchY };
  };

  const handlePointerUp = () => {
    const s = stateRef.current;
    if (!s.isDragging || s.isGameOver || s.isPaused) {
      s.isDragging = false;
      return;
    }

    const cueBall = s.balls.find((b) => b.isCue && !b.isPocketed);
    if (cueBall) {
      // Calculate strike velocity (opposite direction of drag vector)
      const dx = cueBall.x - s.dragCurrent.x;
      const dy = cueBall.y - s.dragCurrent.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 15) {
        const power = Math.min(22, dist * 0.18);
        const angle = Math.atan2(dy, dx);

        cueBall.vx = Math.cos(angle) * power;
        cueBall.vy = Math.sin(angle) * power;

        s.shotsLeft -= 1;
        setShotsLeft(s.shotsLeft);
        playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
      }
    }

    s.isDragging = false;
  };

  // Main 60FPS Billiards Physics Engine Loop
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

      const friction = 0.985;
      const cushionLeft = 36;
      const cushionRight = 324;
      const cushionTop = 56;
      const cushionBottom = 484;

      // Update Balls Physics
      s.balls.forEach((b) => {
        if (b.isPocketed) return;

        b.x += b.vx * dt * 60;
        b.y += b.vy * dt * 60;
        b.vx *= friction;
        b.vy *= friction;

        if (Math.hypot(b.vx, b.vy) < 0.05) {
          b.vx = 0;
          b.vy = 0;
        }

        // Cushion Bounces
        if (b.x < cushionLeft + b.radius) {
          b.x = cushionLeft + b.radius;
          b.vx *= -0.85;
        } else if (b.x > cushionRight - b.radius) {
          b.x = cushionRight - b.radius;
          b.vx *= -0.85;
        }

        if (b.y < cushionTop + b.radius) {
          b.y = cushionTop + b.radius;
          b.vy *= -0.85;
        } else if (b.y > cushionBottom - b.radius) {
          b.y = cushionBottom - b.radius;
          b.vy *= -0.85;
        }

        // Pocket Hole Checks
        s.pockets.forEach((p) => {
          if (b.isPocketed) return;
          const dist = Math.hypot(b.x - p.x, b.y - p.y);

          if (dist < p.radius) {
            b.isPocketed = true;
            b.vx = 0;
            b.vy = 0;

            if (b.isCue) {
              // Scratch (Cue ball in pocket) ➔ Reset cue ball
              setTimeout(() => {
                b.isPocketed = false;
                b.x = 180;
                b.y = 410;
                b.vx = 0;
                b.vy = 0;
              }, 600);
              playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
            } else {
              // Target ball pocketed!
              s.pocketedCount += 1;
              s.score += 500;
              setPocketedCount(s.pocketedCount);
              setScore(s.score);
              setComboText(`POCKET! +500P ✨`);
              setTimeout(() => setComboText(null), 500);
              playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');

              if (s.pocketedCount >= totalTargetBalls) {
                endGame(true);
              }
            }
          }
        });
      });

      // Ball-to-Ball Collisions
      for (let i = 0; i < s.balls.length; i++) {
        for (let j = i + 1; j < s.balls.length; j++) {
          const b1 = s.balls[i];
          const b2 = s.balls[j];
          if (b1.isPocketed || b2.isPocketed) continue;

          const dx = b2.x - b1.x;
          const dy = b2.y - b1.y;
          const dist = Math.hypot(dx, dy);

          if (dist < b1.radius + b2.radius) {
            // Elastic Collision Response
            const normalX = dx / dist;
            const normalY = dy / dist;

            const kx = b1.vx - b2.vx;
            const ky = b1.vy - b2.vy;
            const p = 2 * (normalX * kx + normalY * ky) / 2;

            b1.vx -= p * normalX * 0.95;
            b1.vy -= p * normalY * 0.95;
            b2.vx += p * normalX * 0.95;
            b2.vy += p * normalY * 0.95;

            // Separate overlapping balls
            const overlap = b1.radius + b2.radius - dist;
            b1.x -= normalX * (overlap / 2);
            b1.y -= normalY * (overlap / 2);
            b2.x += normalX * (overlap / 2);
            b2.y += normalY * (overlap / 2);
          }
        }
      }

      // Check Out of Shots & All balls stopped
      const isMoving = s.balls.some((b) => !b.isPocketed && Math.hypot(b.vx, b.vy) > 0.1);
      if (s.shotsLeft <= 0 && !isMoving && s.pocketedCount < totalTargetBalls && !s.isGameOver) {
        endGame(false);
      }

      // ── Canvas Rendering ──
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Wooden Rail Frame
      ctx.fillStyle = '#451a03';
      ctx.fillRect(10, 30, w - 20, h - 60);

      // Emerald Pool Cloth Mat
      ctx.fillStyle = '#065f46';
      ctx.fillRect(26, 46, w - 52, h - 92);

      // Pocket Holes (Black)
      s.pockets.forEach((p) => {
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 3;
        ctx.stroke();
      });

      // Render Balls (Card Hero Cue Ball & Monster Target Balls)
      s.balls.forEach((b) => {
        if (b.isPocketed) return;

        if (b.isCue) {
          // Player Hero Cue Ball
          drawCardSprite(
            ctx,
            playerHeroId,
            b.x - b.radius,
            b.y - b.radius,
            b.radius * 2,
            b.radius * 2,
            {
              circleClip: true,
              borderWidth: 2,
              borderColor: '#fde047',
              shadowBlur: 10,
              shadowColor: 'rgba(253, 224, 71, 0.8)',
            }
          );
        } else {
          // Monster Target Ball
          const monsterCardId = b.num * 8;
          drawCardSprite(
            ctx,
            monsterCardId,
            b.x - b.radius,
            b.y - b.radius,
            b.radius * 2,
            b.radius * 2,
            {
              circleClip: true,
              borderWidth: 1.5,
              borderColor: b.color,
              shadowBlur: 6,
              shadowColor: b.color,
            }
          );

          // Ball Number Badge
          ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
          ctx.beginPath();
          ctx.arc(b.x, b.y, b.radius * 0.45, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1;
          ctx.stroke();

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 8px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(b.num), b.x, b.y);
        }
      });

      // Render Cue Aiming & Power Guide Line
      const cueBall = s.balls.find((b) => b.isCue && !b.isPocketed);
      if (s.isDragging && cueBall) {
        const dx = cueBall.x - s.dragCurrent.x;
        const dy = cueBall.y - s.dragCurrent.y;

        // Aim Trajectory Line (Forward)
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(cueBall.x, cueBall.y);
        ctx.lineTo(cueBall.x + dx * 2.2, cueBall.y + dy * 2.2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Cue Stick Pull Line (Backward)
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(cueBall.x, cueBall.y);
        ctx.lineTo(s.dragCurrent.x, s.dragCurrent.y);
        ctx.stroke();
      }
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
      gameId: 'arcade_billiards_trick',
      gameTitle: '블리츠 트릭 포켓볼',
      durationSeconds: duration,
      score: s.pocketedCount * 600 + (isWin ? 2500 : 500) + s.shotsLeft * 200,
      difficulty: 'NIGHTMARE',
      isVictory: isWin || s.pocketedCount >= 4,
    });
    setSettlementReceipt(receipt);
    onReward(receipt.totalSns);
  };

  const tutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 6개 포켓볼 홀인' : 'STEP 1: POCKET 6 BALLS',
      title: isKo ? '수구를 당겨 조준하고 샷을 날리세요' : 'Pull Cue Ball & Release to Strike',
      description: isKo
        ? '가상 슬라이더 없이 수구(흰색 공)를 손가락으로 당겨 각도와 파워를 조준하고 손을 떼어 포켓볼을 홀에 넣으세요.'
        : 'Drag backwards from the cue ball to aim trajectory and release to pocket all target balls.',
      keyPoints: isKo
        ? [
            '가상 슬라이더 0개 (100% 손가락 직접 큐대 조준 & 타격)',
            '점선 궤적으로 경로 예측 및 쿠션 뱅크샷 구사',
            '6타 이내에 모든 색상 공을 홀인하면 완승'
          ]
        : [
            'Zero Virtual Sliders: 100% Finger Drag & Strike',
            'Dotted trajectory lines for bank and cushion shots',
            'Pocket all 6 colored balls within 6 shots to win'
          ],
      iconType: 'GOAL',
    },
    {
      badge: isKo ? 'STEP 2: 모바일 퓨어 제스처' : 'STEP 2: PURE GESTURES',
      title: isKo ? '풀 & 릴리즈 (Pull & Release)' : 'Pull & Release Cue Shot',
      description: isKo
        ? '수구 반대 방향으로 손가락을 당겨 파워를 모은 뒤 놓아서 타격합니다.'
        : 'Drag away from the cue ball to charge power, then release to shoot.',
      keyPoints: isKo
        ? [
            '👆 터치 & 당기기: 실시간 360도 큐대 조준선',
            '🎯 손 떼기: 경쾌한 포켓볼 당구 타격 사운드',
            '🎱 흰 공이 홀에 빠지면 제자리로 리셋'
          ]
        : [
            '👆 Touch & Pull: 360-degree real-time trajectory',
            '🎯 Release Finger: Crisp billiard cue impact sound',
            '🎱 Scratching cue ball resets it back to center'
          ],
      iconType: 'GESTURES',
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '포켓볼 완수 즉시 NIGHTMARE 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Nightmare payout deposited atomically to your LocalStorage wallet upon match finish.',
      keyPoints: isKo
        ? [
            '완료 즉시 LocalStorage 영구 지갑 입금',
            '홀인한 공 수 및 잔여 샷 비례 대량 잭팟',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Pocketed balls and remaining shots multipliers',
            'VictoryRewardModal golden coin fanfare'
          ],
      iconType: 'REWARDS',
    },
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-[#091510] text-white font-mono select-none flex flex-col overflow-hidden items-center justify-between touch-none">
      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '블리츠 트릭 포켓볼' : 'Blitz Trick Pocket'}
        language={(language as Language) || 'ko'}
        telemetries={[
          { label: isKo ? '잔여샷' : 'Shots', value: `${shotsLeft}/6`, color: shotsLeft <= 2 ? 'text-rose-400 font-bold animate-pulse' : 'text-amber-400 font-bold' },
          { label: isKo ? '홀인' : 'Pocket', value: `${pocketedCount}/${totalTargetBalls}`, color: 'text-emerald-400 font-bold' },
          { label: isKo ? '점수' : 'Score', value: `${score}P`, color: 'text-cyan-300 font-bold' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => setIsPaused(prev => !prev)}
        isPaused={isPaused}
      />

      {/* Pure Touch Billiards Table Canvas Viewport */}
      <div className="flex-1 w-full max-w-md relative overflow-hidden flex items-center justify-center select-none touch-none p-2">
        <canvas
          ref={canvasRef}
          width={360}
          height={540}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="w-full h-full object-contain touch-none cursor-crosshair shadow-2xl"
        />

        {/* Floating Pocket Combo Text */}
        {comboText && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none text-2xl font-bold text-amber-300 drop-shadow-lg animate-bounce">
            {comboText}
          </div>
        )}
      </div>

      {/* Minimal Bottom Guide */}
      <div className="w-full pb-3 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1 bg-black/50 border border-white/10 rounded-full text-[10px] text-slate-300 font-mono">
          {isKo ? '흰 공을 터치하여 뒤로 당긴 뒤 놓으세요 (풀 & 릴리즈 샷)' : 'Pull back from the white ball and release to shoot'}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="arcade_billiards_trick"
          gameTitle={isKo ? '블리츠 트릭 포켓볼: 물리 당구' : 'Blitz Trick Pocket: Physics Billiards'}
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
export default VoxelBilliardsTrickGame;
