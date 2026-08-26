import { drawCardSprite } from '../lib/canvasCardRenderer';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData, Language } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelTitanMechaGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface EnemyMech {
  id: number;
  x: number;
  y: number;
  vx: number;
  type: 'drone' | 'assault' | 'titan_boss';
  cardId: number;
  icon: string;
  points: number;
  radius: number;
  hp: number;
  maxHp: number;
  isAlive: boolean;
}

interface Missile {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  speed: number;
}

export const VoxelTitanMechaGame: React.FC<VoxelTitanMechaGameProps> = ({
  deck = [],
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
  const playerHeroId = deck[0]?.id || 41;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  const [mechasDestroyed, setMechasDestroyed] = useState<number>(0);
  const [missilesLeft, setMissilesLeft] = useState<number>(20);
  const [score, setScore] = useState<number>(0);
  const [mechaCombo, setMechaCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(35);
  const [feedbackText, setFeedbackText] = useState<string | null>(null);

  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_game_titan_mecha') !== 'true';
    } catch {
      return true;
    }
  });
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const titanY = 430;

  const stateRef = useRef({
    titanX: 180,
    targetTitanX: 180,
    enemies: [] as EnemyMech[],
    missiles: [] as Missile[],
    mechasDestroyed: 0,
    missilesLeft: 20,
    score: 0,
    combo: 0,
    maxCombo: 0,
    timeLeft: 35,
    isGameOver: false,
    isPaused: false,
    startTime: Date.now(),
    enemyCounter: 1,
    spawnTimer: 0,
    cannonTimer: 0,
    particles: [] as { x: number; y: number; vx: number; vy: number; color: string; life: number }[],
  });

  const initGame = useCallback(() => {
    const s = stateRef.current;
    s.titanX = 180;
    s.targetTitanX = 180;
    s.enemies = [];
    s.missiles = [];
    s.mechasDestroyed = 0;
    s.missilesLeft = 20;
    s.score = 0;
    s.combo = 0;
    s.maxCombo = 0;
    s.timeLeft = 35;
    s.isGameOver = false;
    s.startTime = Date.now();
    s.enemyCounter = 1;
    s.spawnTimer = 0;
    s.cannonTimer = 0;
    s.particles = [];

    // Initial enemy mechas
    s.enemies.push(
      { id: s.enemyCounter++, x: 90, y: 140, vx: 45, type: 'drone', cardId: 26, icon: '🛸', points: 350, radius: 24, hp: 1, maxHp: 1, isAlive: true },
      { id: s.enemyCounter++, x: 270, y: 200, vx: -40, type: 'assault', cardId: 78, icon: '🦹', points: 600, radius: 28, hp: 2, maxHp: 2, isAlive: true }
    );

    setMechasDestroyed(0);
    setMissilesLeft(20);
    setScore(0);
    setMechaCombo(0);
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

  // Direct Touch Tap to Lock-On Missile & Drag to Move Titan
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

    // Check if player tapped an enemy mecha directly
    let hitEnemy = false;
    for (const enemy of s.enemies) {
      if (enemy.isAlive && Math.hypot(enemy.x - touchX, enemy.y - touchY) < enemy.radius + 18) {
        hitEnemy = true;
        if (s.missilesLeft > 0) {
          s.missilesLeft -= 1;
          setMissilesLeft(s.missilesLeft);

          s.missiles.push({
            x: s.titanX,
            y: titanY,
            targetX: enemy.x,
            targetY: enemy.y,
            speed: 650,
          });

          playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');

          // Lock on spark
          for (let p = 0; p < 8; p++) {
            s.particles.push({
              x: enemy.x,
              y: enemy.y,
              vx: (Math.random() - 0.5) * 180,
              vy: (Math.random() - 0.5) * 180,
              color: '#ef4444',
              life: 0.3,
            });
          }
        }
        break;
      }
    }

    if (!hitEnemy) {
      // Direct drag move titan
      s.targetTitanX = Math.max(40, Math.min(320, touchX));
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
    s.targetTitanX = Math.max(40, Math.min(320, touchX));
  };

  // Main 60FPS Titan Mecha Loop
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

      // Titan Movement Tracking
      s.titanX += (s.targetTitanX - s.titanX) * Math.min(1, dt * 22);

      // Spawn Enemy Mechas
      s.spawnTimer += dt;
      if (s.spawnTimer > 1.2 && s.enemies.length < 5) {
        s.spawnTimer = 0;
        const rand = Math.random();
        const isBoss = rand < 0.2;
        const isAssault = rand >= 0.2 && rand < 0.6;
        const cardId = isBoss ? 83 : (isAssault ? 78 : 26);

        s.enemies.push({
          id: s.enemyCounter++,
          x: Math.random() < 0.5 ? 60 : 300,
          y: 80 + Math.random() * 190,
          vx: (Math.random() < 0.5 ? 1 : -1) * (isBoss ? 30 : 55),
          type: isBoss ? 'titan_boss' : (isAssault ? 'assault' : 'drone'),
          cardId,
          icon: isBoss ? '👾' : (isAssault ? '🦹' : '🛸'),
          points: isBoss ? 1000 : (isAssault ? 600 : 350),
          radius: isBoss ? 32 : (isAssault ? 28 : 24),
          hp: isBoss ? 3 : (isAssault ? 2 : 1),
          maxHp: isBoss ? 3 : (isAssault ? 2 : 1),
          isAlive: true,
        });
      }

      // Move Enemies
      s.enemies.forEach((enemy) => {
        enemy.x += enemy.vx * dt;
        if (enemy.x > 320) {
          enemy.x = 320;
          enemy.vx = -Math.abs(enemy.vx);
        } else if (enemy.x < 40) {
          enemy.x = 40;
          enemy.vx = Math.abs(enemy.vx);
        }
      });

      // Update Missiles
      for (let i = s.missiles.length - 1; i >= 0; i--) {
        const m = s.missiles[i];
        const dx = m.targetX - m.x;
        const dy = m.targetY - m.y;
        const dist = Math.hypot(dx, dy);

        if (dist < 20) {
          s.missiles.splice(i, 1);

          // Impact Enemy
          for (let j = s.enemies.length - 1; j >= 0; j--) {
            const enemy = s.enemies[j];
            if (enemy.isAlive && Math.hypot(enemy.x - m.targetX, enemy.y - m.targetY) < enemy.radius + 15) {
              enemy.hp -= 1;

              if (enemy.hp <= 0) {
                enemy.isAlive = false;
                s.mechasDestroyed += 1;
                s.combo += 1;
                if (s.combo > s.maxCombo) s.maxCombo = s.combo;

                const pts = enemy.points + s.combo * 40;
                s.score += pts;

                setMechasDestroyed(s.mechasDestroyed);
                setScore(s.score);
                setMechaCombo(s.combo);
                setMaxCombo(s.maxCombo);

                if (enemy.type === 'titan_boss') {
                  setFeedbackText(`👑 TITAN BOSS DESTROYED! +${pts}P 💥`);
                  playSfx?.('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
                } else {
                  setFeedbackText(`MECHA DESTROYED! +${pts}P ⚡`);
                  playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
                }
                setTimeout(() => setFeedbackText(null), 400);

                // Mecha Blast Particles
                for (let p = 0; p < 16; p++) {
                  s.particles.push({
                    x: enemy.x,
                    y: enemy.y,
                    vx: (Math.random() - 0.5) * 280,
                    vy: (Math.random() - 0.5) * 280,
                    color: enemy.type === 'titan_boss' ? '#f59e0b' : '#38bdf8',
                    life: 0.5,
                  });
                }

                s.enemies.splice(j, 1);
              }
              break;
            }
          }
        } else {
          m.x += (dx / dist) * m.speed * dt;
          m.y += (dy / dist) * m.speed * dt;
        }
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

      // Cyber Mecha City Dark Gradient
      const cityGrad = ctx.createLinearGradient(0, 0, 0, h);
      cityGrad.addColorStop(0, '#020617');
      cityGrad.addColorStop(0.5, '#0f172a');
      cityGrad.addColorStop(1, '#1e1b4b');
      ctx.fillStyle = cityGrad;
      ctx.fillRect(0, 0, w, h);

      // Cyber Grid Lines
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.2)';
      ctx.lineWidth = 1.5;
      for (let x = 30; x < w; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }

      // Render Missiles
      s.missiles.forEach((m) => {
        ctx.save();
        ctx.translate(m.x, m.y);
        ctx.fillStyle = '#ef4444';
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Render Enemies (Card Sprites)
      s.enemies.forEach((enemy) => {
        if (enemy.isAlive) {
          ctx.save();
          ctx.translate(enemy.x, enemy.y);

          drawCardSprite(
            ctx,
            enemy.cardId,
            -enemy.radius,
            -enemy.radius,
            enemy.radius * 2,
            enemy.radius * 2,
            {
              circleClip: true,
              borderWidth: 1.5,
              borderColor: enemy.type === 'titan_boss' ? '#f59e0b' : '#38bdf8',
              shadowBlur: enemy.type === 'titan_boss' ? 20 : 8,
              shadowColor: enemy.type === 'titan_boss' ? 'rgba(245, 158, 11, 0.9)' : 'rgba(56, 189, 248, 0.8)',
            }
          );

          // HP Bar
          if (enemy.maxHp > 1) {
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(-16, enemy.radius + 4, 32, 4);
            ctx.fillStyle = '#38bdf8';
            ctx.fillRect(-16, enemy.radius + 4, 32 * (enemy.hp / enemy.maxHp), 4);
          }
          ctx.restore();
        }
      });

      // Render Player Titan Mecha Hero (Player Hero Badge)
      ctx.save();
      ctx.translate(s.titanX, titanY);

      drawCardSprite(
        ctx,
        playerHeroId,
        -22,
        -22,
        44,
        44,
        {
          circleClip: true,
          borderWidth: 2,
          borderColor: '#fde047',
          shadowBlur: 16,
          shadowColor: 'rgba(253, 224, 71, 0.9)',
        }
      );

      ctx.restore();

      // Render Particles
      s.particles.forEach((p) => {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, 4, 4);
      });
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [titanY, playSfx, playerHeroId]);

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
      gameId: 'arcade_titan_mecha',
      gameTitle: '블리츠 타이탄 메카',
      durationSeconds: duration,
      score: s.score + (isWin ? 3500 : s.mechasDestroyed * 350) + s.maxCombo * 40,
      difficulty: 'NIGHTMARE',
      isVictory: isWin || s.mechasDestroyed >= 7,
    });
    setSettlementReceipt(receipt);
    onReward(receipt.totalSns);
  };

  const tutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 손가락 탭 록온 미사일 사격' : 'STEP 1: TAP LOCK-ON MISSILES',
      title: isKo ? '적 메카를 직접 탭해 유도 미사일을 발사하세요' : 'Tap enemy mechas to fire guided lock-on missiles',
      description: isKo
        ? '가상 조이스틱 없이 화면에 나타나는 적 메카(🛸, 🦹, 👾)를 손가락으로 직접 탭(Direct Tap)하여 타이탄 유도 미사일로 폭파하고, 하단의 메카(🤖)를 드래그해 포지션을 이동하세요.'
        : 'Tap enemy mechas directly to launch homing missiles while sliding your titan left and right.',
      keyPoints: isKo
        ? [
            '가상 조이스틱 0개 (100% 손가락 직접 탭 록온 & 드래그 이동)',
            '거대 타이탄 보스(👾) 격파 시 1,000P 잭팟 대박 보너스',
            '35초간 최대 콤보로 침공 메카 군단을 소탕하고 올클리어'
          ]
        : [
            'Zero Virtual Joysticks: 100% Direct Tap Lock-On & Drag Flight',
            'Giant Titan Boss (👾) awards 1,000P massive mecha jackpot',
            'Eliminate all invading mechas with continuous combos within 35s'
          ],
      iconType: 'GOAL',
    },
    {
      badge: isKo ? 'STEP 2: 모바일 퓨어 제스처' : 'STEP 2: PURE GESTURES',
      title: isKo ? '화면 직접 탭 & 드래그 (Tap Lock-On & Drag)' : 'Tap & Drag Gestures',
      description: isKo
        ? '적을 탭하여 미사일을 쏘고 하단을 밀어 기동합니다.'
        : 'Tap targets to lock-on missiles and slide titan horizontally.',
      keyPoints: isKo
        ? [
            '👆 적 직접 탭: 60FPS 즉각 반응 초정밀 유도 미사일',
            '🤖 연속 격파 시 메카 콤보 배수 보너스',
            '⏱️ 35초 타임어택 고득점 챌린지'
          ]
        : [
            '👆 Tap Mechas: Instant responsive homing missiles',
            '🤖 Consecutive destroys grant mecha combo multipliers',
            '⏱️ 35s time attack titan mecha sprint'
          ],
      iconType: 'GESTURES',
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '작전 완료 즉시 NIGHTMARE 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Nightmare payout deposited atomically to your LocalStorage wallet upon match finish.',
      keyPoints: isKo
        ? [
            '완료 즉시 LocalStorage 영구 지갑 입금',
            '격파한 메카 수 및 보스 처치 비례 대량 잭팟',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Destroyed mechas count and boss multipliers',
            'VictoryRewardModal golden coin fanfare'
          ],
      iconType: 'REWARDS',
    },
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-[#020617] text-white font-mono select-none flex flex-col overflow-hidden items-center justify-between touch-none">
      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '블리츠 타이탄 메카' : 'Blitz Titan Mecha'}
        language={(language as Language) || 'ko'}
        telemetries={[
          { label: isKo ? '격파' : 'Kills', value: `${mechasDestroyed}대`, color: 'text-amber-400 font-bold' },
          { label: isKo ? '미사일' : 'Missiles', value: `${missilesLeft}발`, color: 'text-cyan-300 font-bold' },
          { label: isKo ? '시간' : 'Time', value: `${timeLeft}s`, color: timeLeft <= 10 ? 'text-rose-500 font-bold animate-pulse' : 'text-cyan-400 font-bold' },
          { label: isKo ? '점수' : 'Score', value: `${score}P`, color: 'text-amber-300 font-bold' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => setIsPaused(prev => !prev)}
        isPaused={isPaused}
      />

      {/* Pure Touch Titan Mecha Canvas Viewport */}
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
        <div className="px-3 py-1 bg-black/50 border border-white/10 rounded-full text-[10px] text-slate-300 font-mono">
          {isKo ? '적 메카를 손가락으로 직접 탭해 미사일을 발사하세요' : 'Tap enemy mechas to fire guided missiles'}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="arcade_titan_mecha"
          gameTitle={isKo ? '블리츠 타이탄: 메카 화력전' : 'Blitz Titan: Mecha Warfare'}
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
export default VoxelTitanMechaGame;
