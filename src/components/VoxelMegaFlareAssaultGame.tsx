import { drawCardSprite } from '../lib/canvasCardRenderer';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData, Language } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelMegaFlareAssaultGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface AlienEnemy {
  id: number;
  x: number;
  y: number;
  speed: number;
  hp: number;
  maxHp: number;
  type: 'drone' | 'cruiser' | 'flagship';
  icon: string;
  points: number;
  radius: number;
}

interface PlasmaShot {
  id: number;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  speed: number;
  life: number;
}

export const VoxelMegaFlareAssaultGame: React.FC<VoxelMegaFlareAssaultGameProps> = ({
  deck = [],
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
  const playerHeroId = deck[0]?.id || 104;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  const [destroyedCount, setDestroyedCount] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [megaGauge, setMegaGauge] = useState<number>(0);
  const [flareCombo, setFlareCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(35);
  const [feedbackText, setFeedbackText] = useState<string | null>(null);

  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_game_mega_flare') !== 'true';
    } catch {
      return true;
    }
  });
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const stateRef = useRef({
    enemies: [] as AlienEnemy[],
    shots: [] as PlasmaShot[],
    megaGauge: 0,
    destroyedCount: 0,
    score: 0,
    combo: 0,
    maxCombo: 0,
    timeLeft: 35,
    isGameOver: false,
    isPaused: false,
    startTime: Date.now(),
    enemyCounter: 1,
    spawnTimer: 0,
    touchStart: { x: 0, y: 0 },
    megaFlareActive: 0,
    particles: [] as { x: number; y: number; vx: number; vy: number; color: string; life: number }[],
  });

  const initGame = useCallback(() => {
    const s = stateRef.current;
    s.enemies = [];
    s.shots = [];
    s.megaGauge = 0;
    s.destroyedCount = 0;
    s.score = 0;
    s.combo = 0;
    s.maxCombo = 0;
    s.timeLeft = 35;
    s.isGameOver = false;
    s.startTime = Date.now();
    s.enemyCounter = 1;
    s.spawnTimer = 0;
    s.megaFlareActive = 0;
    s.particles = [];

    setDestroyedCount(0);
    setScore(0);
    setMegaGauge(0);
    setFlareCombo(0);
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

  // Trigger Full Screen Mega Flare Storm
  const triggerMegaFlare = () => {
    const s = stateRef.current;
    s.megaFlareActive = 1.2;
    s.megaGauge = 0;
    setMegaGauge(0);

    // Destroy all current on-screen enemies
    let totalPts = 0;
    s.enemies.forEach((e) => {
      totalPts += e.points + 200;
      s.destroyedCount += 1;

      for (let p = 0; p < 10; p++) {
        s.particles.push({
          x: e.x,
          y: e.y,
          vx: (Math.random() - 0.5) * 350,
          vy: (Math.random() - 0.5) * 350,
          color: '#f59e0b',
          life: 0.8,
        });
      }
    });

    s.enemies = [];
    s.score += totalPts + 1000;
    s.combo += 5;
    if (s.combo > s.maxCombo) s.maxCombo = s.combo;

    setScore(s.score);
    setDestroyedCount(s.destroyedCount);
    setFlareCombo(s.combo);
    setMaxCombo(s.maxCombo);

    setFeedbackText(isKo ? '💥 메가 플레어 전탄 폭격!! +1000P 💥' : '💥 MEGA FLARE BARRAGE!! +1000P 💥');
    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
    setTimeout(() => setFeedbackText(null), 600);
  };

  // Touch Handlers: Screen Tap Fire / Downward Swipe Mega Flare (Zero Joysticks)
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = stateRef.current;
    if (s.isGameOver || s.isPaused) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    s.touchStart = {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = stateRef.current;
    if (s.isGameOver || s.isPaused) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const endX = (e.clientX - rect.left) * scaleX;
    const endY = (e.clientY - rect.top) * scaleY;

    const dy = endY - s.touchStart.y;

    if (dy > 40 && s.megaGauge >= 100) {
      // Downward Swipe -> Trigger Mega Flare!
      triggerMegaFlare();
      return;
    }

    // Direct Tap -> Plasma Gun Fire
    const originX = 180;
    const originY = 460;

    s.shots.push({
      id: Date.now() + Math.random(),
      x: originX,
      y: originY,
      targetX: endX,
      targetY: endY,
      speed: 800,
      life: 0.6,
    });

    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');

    // Immediate hit check on tapped enemy
    for (let i = s.enemies.length - 1; i >= 0; i--) {
      const enemy = s.enemies[i];
      if (Math.hypot(enemy.x - endX, enemy.y - endY) < enemy.radius + 18) {
        enemy.hp -= 40;

        // Particle Burst
        for (let p = 0; p < 6; p++) {
          s.particles.push({
            x: enemy.x,
            y: enemy.y,
            vx: (Math.random() - 0.5) * 200,
            vy: (Math.random() - 0.5) * 200,
            color: '#38bdf8',
            life: 0.5,
          });
        }

        if (enemy.hp <= 0) {
          s.destroyedCount += 1;
          s.combo += 1;
          if (s.combo > s.maxCombo) s.maxCombo = s.combo;

          s.megaGauge = Math.min(100, s.megaGauge + (enemy.type === 'flagship' ? 35 : 18));
          setMegaGauge(s.megaGauge);

          const pts = enemy.points + s.combo * 20;
          s.score += pts;

          setScore(s.score);
          setDestroyedCount(s.destroyedCount);
          setFlareCombo(s.combo);
          setMaxCombo(s.maxCombo);

          setFeedbackText(`DESTROYED! +${pts}P 🚀`);
          playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
          setTimeout(() => setFeedbackText(null), 300);

          s.enemies.splice(i, 1);
        }
        return;
      }
    }
  };

  // Main 60FPS Space Assault Loop
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

      // Spawn Alien Ships
      s.spawnTimer += dt;
      const spawnInterval = s.timeLeft <= 10 ? 0.45 : 0.75;
      if (s.spawnTimer >= spawnInterval && s.enemies.length < 10) {
        s.spawnTimer = 0;
        const isFlagship = Math.random() < 0.2;
        const isCruiser = Math.random() < 0.4;

        s.enemies.push({
          id: s.enemyCounter++,
          x: 40 + Math.random() * 280,
          y: -20,
          speed: isFlagship ? 40 : (isCruiser ? 75 : 95),
          hp: isFlagship ? 120 : (isCruiser ? 60 : 40),
          maxHp: isFlagship ? 120 : (isCruiser ? 60 : 40),
          type: isFlagship ? 'flagship' : (isCruiser ? 'cruiser' : 'drone'),
          icon: isFlagship ? '🛸' : (isCruiser ? '🚀' : '👾'),
          points: isFlagship ? 600 : (isCruiser ? 300 : 150),
          radius: isFlagship ? 24 : (isCruiser ? 18 : 14),
        });
      }

      // Move Enemies Downwards
      for (let i = s.enemies.length - 1; i >= 0; i--) {
        const e = s.enemies[i];
        e.y += e.speed * dt;
        if (e.y > 520) {
          s.enemies.splice(i, 1);
        }
      }

      // Update Plasma Shots
      for (let i = s.shots.length - 1; i >= 0; i--) {
        const shot = s.shots[i];
        const dx = shot.targetX - shot.x;
        const dy = shot.targetY - shot.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 15) {
          shot.x += (dx / dist) * shot.speed * dt;
          shot.y += (dy / dist) * shot.speed * dt;
        } else {
          s.shots.splice(i, 1);
        }
      }

      // Update Mega Flare Timer
      if (s.megaFlareActive > 0) {
        s.megaFlareActive -= dt;
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

      // Deep Space Nebula Background
      const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
      bgGrad.addColorStop(0, '#030712');
      bgGrad.addColorStop(0.5, '#0f172a');
      bgGrad.addColorStop(1, '#1e1b4b');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Distant Stars
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      [30, 90, 150, 210, 270, 330].forEach((sx, i) => {
        ctx.fillRect(sx, (i * 80 + Date.now() * 0.05) % h, 2, 2);
      });

      // Mega Flare Full Screen Flash Effect
      if (s.megaFlareActive > 0) {
        ctx.fillStyle = `rgba(245, 158, 11, ${s.megaFlareActive * 0.6})`;
        ctx.fillRect(0, 0, w, h);
      }

      // Render Player Starfighter at Bottom Center
      ctx.save();
      ctx.translate(180, 460);

      drawCardSprite(ctx, playerHeroId, -22, -22, 44, 44, {
        circleClip: true,
        borderWidth: 2,
        borderColor: s.megaGauge >= 100 ? '#f59e0b' : '#38bdf8',
        shadowBlur: s.megaGauge >= 100 ? 18 : 10,
        shadowColor: s.megaGauge >= 100 ? 'rgba(245, 158, 11, 0.9)' : 'rgba(56, 189, 248, 0.7)',
      });
      ctx.restore();

      // Render Alien Enemies (Card Sprites)
      s.enemies.forEach((enemy) => {
        ctx.save();
        ctx.translate(enemy.x, enemy.y);

        const enemyCardId = enemy.type === 'drone' ? 26 : enemy.type === 'cruiser' ? 57 : 96;

        drawCardSprite(
          ctx,
          enemyCardId,
          -enemy.radius,
          -enemy.radius,
          enemy.radius * 2,
          enemy.radius * 2,
          {
            circleClip: true,
            borderWidth: 1.5,
            borderColor: enemy.type === 'flagship' ? '#ef4444' : '#38bdf8',
            shadowBlur: 8,
            shadowColor: enemy.type === 'flagship' ? 'rgba(239, 68, 68, 0.8)' : 'rgba(56, 189, 248, 0.8)',
          }
        );

        // Mini HP Bar
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(-12, enemy.radius + 3, 24, 4);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(-12, enemy.radius + 3, 24 * (enemy.hp / enemy.maxHp), 4);
        ctx.restore();
      });

      // Render Flying Plasma Shots
      s.shots.forEach((shot) => {
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 12;
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.arc(shot.x, shot.y, 5, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.shadowBlur = 0;

      // Render Particles
      s.particles.forEach((p) => {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, 4, 4);
      });
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [playSfx, playerHeroId]);

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
      gameId: 'arcade_mega_flare',
      gameTitle: '블리츠 메가 플레어',
      durationSeconds: duration,
      score: s.score + (isWin ? 3500 : s.destroyedCount * 120) + s.maxCombo * 40,
      difficulty: 'NIGHTMARE',
      isVictory: isWin || s.destroyedCount >= 20,
    });
    setSettlementReceipt(receipt);
    onReward(receipt.totalSns);
  };

  const tutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 화면 탭 요격 & 메가 플레어' : 'STEP 1: TAP INTERCEPT & MEGA FLARE',
      title: isKo ? '적 함선을 탭해 격추하고 메가 플레어를 쏘세요' : 'Tap Alien Ships to Intercept & Trigger Mega Flare',
      description: isKo
        ? '가상 조이스틱 없이 화면에 강습해오는 외계 편대(🛸, 🚀)를 손가락으로 직접 탭하여 플라즈마탄으로 요격하고, 게이지 100% 충전 시 아래로 스와이프하여 전 화면 메가 플레어 폭격을 퍼부으세요.'
        : 'Directly tap incoming alien ships to fire plasma cannons, then swipe downwards at 100% gauge to launch a screen-clearing Mega Flare barrage.',
      keyPoints: isKo
        ? [
            '가상 조이스틱 0개 (100% 화면 직접 몬스터 원터치 탭 사격)',
            '게이지 100% 시 아래로 스와이프: 메가 플레어 전 화면 청소',
            '35초간 최대 콤보로 외계 함대를 격멸하고 올클리어'
          ]
        : [
            'Zero Virtual Joysticks: 100% Direct Screen Tap Fire',
            'Swipe down at 100% gauge to unleash screen-clearing Mega Flare',
            'Shatter alien armada waves within 35s'
          ],
      iconType: 'GOAL',
    },
    {
      badge: isKo ? 'STEP 2: 모바일 퓨어 제스처' : 'STEP 2: PURE GESTURES',
      title: isKo ? '화면 탭 & 아래로 스와이프' : 'Tap & Downward Swipe',
      description: isKo
        ? '적을 직접 터치해 사격하고, 필살기 충전 시 아래로 빠르게 긁어내립니다.'
        : 'Tap targets to shoot, and swipe down quickly when Mega Flare is full.',
      keyPoints: isKo
        ? [
            '👆 적 함선 탭: 즉각적인 고속 플라즈마탄 연사',
            '⚡ 아래로 스와이프: 전방위 메가 플레어 융단 폭격',
            '⏱️ 35초 타임어택 고득점 챌린지'
          ]
        : [
            '👆 Target Tap: Instant high-velocity plasma burst',
            '⚡ Swipe Down: Unleash apocalyptic Mega Flare bombardment',
            '⏱️ 35s time attack space interception sprint'
          ],
      iconType: 'GESTURES',
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '격퇴 완료 즉시 NIGHTMARE 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Nightmare payout deposited atomically to your LocalStorage wallet upon match finish.',
      keyPoints: isKo
        ? [
            '완료 즉시 LocalStorage 영구 지갑 입금',
            '격추 함선 수 및 최대 콤보 비례 대량 잭팟',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Destroyed ships and max combo multipliers',
            'VictoryRewardModal golden coin fanfare'
          ],
      iconType: 'REWARDS',
    },
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-[#030712] text-white font-mono select-none flex flex-col overflow-hidden items-center justify-between touch-none">
      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '블리츠 메가 플레어' : 'Blitz Mega Flare'}
        language={(language as Language) || 'ko'}
        telemetries={[
          { label: isKo ? '격추' : 'Destroyed', value: `${destroyedCount}척`, color: 'text-amber-400 font-bold' },
          { label: isKo ? '게이지' : 'Mega', value: `${megaGauge}%`, color: megaGauge >= 100 ? 'text-rose-500 font-bold animate-pulse' : 'text-cyan-300 font-bold' },
          { label: isKo ? '시간' : 'Time', value: `${timeLeft}s`, color: timeLeft <= 10 ? 'text-rose-500 font-bold animate-pulse' : 'text-cyan-400 font-bold' },
          { label: isKo ? '점수' : 'Score', value: `${score}P`, color: 'text-amber-300 font-bold' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => setIsPaused(prev => !prev)}
        isPaused={isPaused}
      />

      {/* Pure Touch Space Assault Canvas Viewport */}
      <div className="flex-1 w-full max-w-md relative overflow-hidden flex items-center justify-center select-none touch-none p-2">
        <canvas
          ref={canvasRef}
          width={360}
          height={500}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          className="w-full h-full object-contain touch-none cursor-crosshair shadow-2xl"
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
          {isKo ? '적을 탭해 사격하고, 100% 충전 시 아래로 스와이프해 메가 플레어를 쏘세요' : 'Tap enemies to shoot, swipe down at 100% to fire Mega Flare'}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="arcade_mega_flare"
          gameTitle={isKo ? '블리츠 메가 플레어: 우주 함대전' : 'Blitz Mega Flare: Space Assault'}
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
export default VoxelMegaFlareAssaultGame;
