import { drawCardSprite } from '../lib/canvasCardRenderer';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData, Language } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelZombieSurvivalGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface ZombieTarget {
  id: number;
  x: number;
  y: number;
  vx: number;
  type: 'runner' | 'brute' | 'king';
  icon: string;
  points: number;
  radius: number;
  hp: number;
  maxHp: number;
  isAlive: boolean;
}

export const VoxelZombieSurvivalGame: React.FC<VoxelZombieSurvivalGameProps> = ({
  deck = [],
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
  const playerHeroId = deck[0]?.id || 39;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  const [zombiesKilled, setZombiesKilled] = useState<number>(0);
  const [bulletsLeft, setBulletsLeft] = useState<number>(30);
  const [score, setScore] = useState<number>(0);
  const [zombieCombo, setZombieCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(35);
  const [feedbackText, setFeedbackText] = useState<string | null>(null);

  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_game_zombie_survival') !== 'true';
    } catch {
      return true;
    }
  });
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const shooterY = 430;

  const stateRef = useRef({
    shooterX: 180,
    targetShooterX: 180,
    zombies: [] as ZombieTarget[],
    zombiesKilled: 0,
    bulletsLeft: 30,
    score: 0,
    combo: 0,
    maxCombo: 0,
    timeLeft: 35,
    isGameOver: false,
    isPaused: false,
    startTime: Date.now(),
    zombieCounter: 1,
    spawnTimer: 0,
    muzzleFlash: null as { x: number; y: number; life: number } | null,
    particles: [] as { x: number; y: number; vx: number; vy: number; color: string; life: number }[],
  });

  const initGame = useCallback(() => {
    const s = stateRef.current;
    s.shooterX = 180;
    s.targetShooterX = 180;
    s.zombies = [];
    s.zombiesKilled = 0;
    s.bulletsLeft = 30;
    s.score = 0;
    s.combo = 0;
    s.maxCombo = 0;
    s.timeLeft = 35;
    s.isGameOver = false;
    s.startTime = Date.now();
    s.zombieCounter = 1;
    s.spawnTimer = 0;
    s.muzzleFlash = null;
    s.particles = [];

    // Initial Zombies
    s.zombies.push(
      { id: s.zombieCounter++, x: 80, y: 130, vx: 50, type: 'runner', icon: '🧟', points: 300, radius: 22, hp: 1, maxHp: 1, isAlive: true },
      { id: s.zombieCounter++, x: 280, y: 200, vx: -35, type: 'brute', icon: '🧟‍♂️', points: 600, radius: 26, hp: 2, maxHp: 2, isAlive: true }
    );

    setZombiesKilled(0);
    setBulletsLeft(30);
    setScore(0);
    setZombieCombo(0);
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
          endGame(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isGameOver, isPaused]);

  // Direct Touch Tap to Shoot Zombie & Drag to Move Shooter
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

    // Direct Tap on Zombie (Headshot)
    let hitZombie = false;
    for (let i = s.zombies.length - 1; i >= 0; i--) {
      const z = s.zombies[i];
      if (z.isAlive && Math.hypot(z.x - touchX, z.y - touchY) < z.radius + 18) {
        hitZombie = true;
        z.hp -= 1;
        playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');

        // Muzzle Flash
        s.muzzleFlash = { x: s.shooterX, y: shooterY, life: 0.15 };

        if (z.hp <= 0) {
          z.isAlive = false;
          s.zombiesKilled += 1;
          s.combo += 1;
          if (s.combo > s.maxCombo) s.maxCombo = s.combo;

          const pts = z.points + s.combo * 40;
          s.score += pts;

          setZombiesKilled(s.zombiesKilled);
          setScore(s.score);
          setZombieCombo(s.combo);
          setMaxCombo(s.maxCombo);

          if (z.type === 'king') {
            setFeedbackText(`👑 ZOMBIE KING SLAIN! +${pts}P 💥`);
            playSfx?.('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
          } else {
            setFeedbackText(`HEADSHOT! +${pts}P ⚡`);
            playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
          }
          setTimeout(() => setFeedbackText(null), 350);

          // Headshot particles
          for (let p = 0; p < 14; p++) {
            s.particles.push({
              x: z.x,
              y: z.y,
              vx: (Math.random() - 0.5) * 260,
              vy: (Math.random() - 0.5) * 260,
              color: z.type === 'king' ? '#f59e0b' : '#22c55e',
              life: 0.4,
            });
          }

          s.zombies.splice(i, 1);
        }
        break;
      }
    }

    if (!hitZombie) {
      // Direct drag move shooter
      s.targetShooterX = Math.max(35, Math.min(325, touchX));
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = stateRef.current;
    if (s.isGameOver || s.isPaused) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;

    const touchX = (e.clientX - rect.left) * scaleX;
    s.targetShooterX = Math.max(35, Math.min(325, touchX));
  };

  // Main 60FPS Zombie Survival Loop
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

      // Shooter Movement Tracking
      s.shooterX += (s.targetShooterX - s.shooterX) * Math.min(1, dt * 22);

      // Spawn Zombies
      s.spawnTimer += dt;
      if (s.spawnTimer > 1.0 && s.zombies.length < 7) {
        s.spawnTimer = 0;
        const rand = Math.random();
        const isKing = rand < 0.18;
        const isBrute = rand >= 0.18 && rand < 0.55;

        s.zombies.push({
          id: s.zombieCounter++,
          x: Math.random() < 0.5 ? 40 : 320,
          y: 70 + Math.random() * 200,
          vx: (Math.random() < 0.5 ? 1 : -1) * (isKing ? 30 : (isBrute ? 40 : 60)),
          type: isKing ? 'king' : (isBrute ? 'brute' : 'runner'),
          icon: isKing ? '👑' : (isBrute ? '🧟‍♂️' : '🧟'),
          points: isKing ? 1000 : (isBrute ? 600 : 300),
          radius: isKing ? 30 : (isBrute ? 26 : 22),
          hp: isKing ? 3 : (isBrute ? 2 : 1),
          maxHp: isKing ? 3 : (isBrute ? 2 : 1),
          isAlive: true,
        });
      }

      // Move Zombies
      s.zombies.forEach((z) => {
        z.x += z.vx * dt;
        if (z.x > 325) {
          z.x = 325;
          z.vx = -Math.abs(z.vx);
        } else if (z.x < 35) {
          z.x = 35;
          z.vx = Math.abs(z.vx);
        }
      });

      // Update Muzzle Flash
      if (s.muzzleFlash) {
        s.muzzleFlash.life -= dt;
        if (s.muzzleFlash.life <= 0) s.muzzleFlash = null;
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

      // Apocalypse City Dark Gradient
      const apoGrad = ctx.createLinearGradient(0, 0, 0, h);
      apoGrad.addColorStop(0, '#022c22');
      apoGrad.addColorStop(0.5, '#064e3b');
      apoGrad.addColorStop(1, '#020617');
      ctx.fillStyle = apoGrad;
      ctx.fillRect(0, 0, w, h);

      // Barricade Line
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 3;
      ctx.setLineDash([12, 12]);
      ctx.beginPath();
      ctx.moveTo(0, shooterY - 30);
      ctx.lineTo(w, shooterY - 30);
      ctx.stroke();
      ctx.setLineDash([]);

      // Render Zombies
      s.zombies.forEach((z) => {
        if (z.isAlive) {
          ctx.save();
          ctx.translate(z.x, z.y);
          if (z.type === 'king') {
            ctx.shadowColor = '#f59e0b';
            ctx.shadowBlur = 18;
          } else {
            ctx.shadowColor = '#22c55e';
            ctx.shadowBlur = 12;
          }
          ctx.font = `${z.radius * 1.8}px serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(z.icon, 0, 0);

          // HP Bar
          if (z.maxHp > 1) {
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(-16, z.radius + 4, 32, 4);
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(-16, z.radius + 4, 32 * (z.hp / z.maxHp), 4);
          }
          ctx.restore();
        }
      });

      // Render Shooter Hero (🤠)
      ctx.save();
      ctx.translate(s.shooterX, shooterY);
      ctx.shadowColor = '#fde047';
      ctx.shadowBlur = 18;
      ctx.font = '42px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      drawCardSprite(ctx, playerHeroId, -22, -22, 44, 44, {
        circleClip: true,
        borderWidth: 2,
        borderColor: '#fde047',
        shadowBlur: 14,
        shadowColor: 'rgba(253, 224, 71, 0.6)',
      });

      // Muzzle Flash Spark
      if (s.muzzleFlash) {
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.arc(0, -25, 12, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // Render Particles
      s.particles.forEach((p) => {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, 4, 4);
      });
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [shooterY, playSfx]);

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
      gameId: 'arcade_zombie_survival',
      gameTitle: '블리츠 좀비 서바이벌',
      durationSeconds: duration,
      score: s.score + (isWin ? 3500 : s.zombiesKilled * 300) + s.maxCombo * 40,
      difficulty: 'NIGHTMARE',
      isVictory: isWin || s.zombiesKilled >= 8,
    });
    setSettlementReceipt(receipt);
    onReward(receipt.totalSns);
  };

  const tutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 손가락 탭 좀비 헤드샷 슈팅' : 'STEP 1: TAP HEADSHOT SHOOTING',
      title: isKo ? '좀비를 직접 탭해 헤드샷으로 일격에 토벌하세요' : 'Tap zombies directly to eliminate them with precision headshots',
      description: isKo
        ? '가상 조이스틱 없이 화면에 나타나는 좀비(🧟, 🧟‍♂️, 👑)를 손가락으로 직접 탭(Direct Tap)하여 즉시 저격 사살하고 하단의 사수(🤠)를 드래그해 이동하세요.'
        : 'Tap incoming zombies directly on screen for instant headshot kills while sliding your shooter horizontally.',
      keyPoints: isKo
        ? [
            '가상 조이스틱 0개 (100% 손가락 직접 탭 저격 사격)',
            '좀비 킹(👑) 헤드샷 토벌 시 1,000P 잭팟 대박 보너스',
            '35초간 최대 콤보로 아포칼립스를 수호하고 올클리어'
          ]
        : [
            'Zero Virtual Joysticks: 100% Direct Tap Headshot Shooting',
            'Zombie King (👑) awards 1,000P massive survival jackpot',
            'Defend the barricade with continuous combos within 35s'
          ],
      iconType: 'GOAL',
    },
    {
      badge: isKo ? 'STEP 2: 모바일 퓨어 제스처' : 'STEP 2: PURE GESTURES',
      title: isKo ? '화면 직접 탭 & 드래그 (Tap to Shoot & Drag)' : 'Tap & Drag Gestures',
      description: isKo
        ? '타깃을 탭해 사격하고 하단을 밀어 사수의 위치를 조종합니다.'
        : 'Tap zombies to shoot and slide shooter left or right.',
      keyPoints: isKo
        ? [
            '👆 타깃 탭: 60FPS 즉각 반응 초정밀 헤드샷',
            '🧟 연속 토벌 시 좀비 콤보 배수 보너스',
            '⏱️ 35초 타임어택 고득점 챌린지'
          ]
        : [
            '👆 Tap Targets: Instant 60FPS responsive headshot kills',
            '🧟 Consecutive kills grant zombie combo multipliers',
            '⏱️ 35s time attack zombie survival sprint'
          ],
      iconType: 'GESTURES',
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '토벌 완료 즉시 NIGHTMARE 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Nightmare payout deposited atomically to your LocalStorage wallet upon match finish.',
      keyPoints: isKo
        ? [
            '완료 즉시 LocalStorage 영구 지갑 입금',
            '토벌한 좀비 수 및 좀비 킹 비례 대량 잭팟',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Killed zombies count and king multipliers',
            'VictoryRewardModal golden coin fanfare'
          ],
      iconType: 'REWARDS',
    },
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-[#020617] text-white font-mono select-none flex flex-col overflow-hidden items-center justify-between touch-none">
      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '블리츠 좀비 서바이벌' : 'Blitz Zombie Survival'}
        language={(language as Language) || 'ko'}
        telemetries={[
          { label: isKo ? '토벌' : 'Kills', value: `${zombiesKilled}마리`, color: 'text-amber-400 font-bold' },
          { label: isKo ? '콤보' : 'Combo', value: `${zombieCombo}x`, color: zombieCombo > 2 ? 'text-amber-300 font-bold animate-bounce' : 'text-slate-300' },
          { label: isKo ? '시간' : 'Time', value: `${timeLeft}s`, color: timeLeft <= 10 ? 'text-rose-500 font-bold animate-pulse' : 'text-white font-bold' },
          { label: isKo ? '점수' : 'Score', value: `${score}P`, color: 'text-amber-300 font-bold' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => setIsPaused(prev => !prev)}
        isPaused={isPaused}
      />

      {/* Pure Touch Zombie Survival Canvas Viewport */}
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
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 pointer-events-none text-base font-bold text-amber-300 drop-shadow-lg animate-bounce whitespace-nowrap bg-black/60 px-4 py-1 rounded-full border border-amber-400/30">
            {feedbackText}
          </div>
        )}
      </div>

      {/* Minimal Bottom Guide */}
      <div className="w-full pb-3 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1 bg-black/50 border border-white/10 rounded-full text-[10px] text-slate-200 font-mono">
          {isKo ? '좀비를 손가락으로 직접 탭해 헤드샷으로 사격하세요' : 'Tap zombies directly for instant headshots'}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="arcade_zombie_survival"
          gameTitle={isKo ? '블리츠 좀비: 아포칼립스' : 'Blitz Zombie: Apocalypse'}
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
export default VoxelZombieSurvivalGame;
