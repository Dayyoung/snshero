import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData, Language } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelTankBounceGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface EnemyTank {
  id: number;
  x: number;
  y: number;
  vx: number;
  type: 'patrol' | 'heavy' | 'barrel';
  icon: string;
  points: number;
  radius: number;
  hp: number;
  isAlive: boolean;
}

interface BounceShell {
  x: number;
  y: number;
  vx: number;
  vy: number;
  bounces: number;
  maxBounces: number;
  alive: boolean;
}

export const VoxelTankBounceGame: React.FC<VoxelTankBounceGameProps> = ({
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

  const [tanksDestroyed, setTanksDestroyed] = useState<number>(0);
  const [ammoLeft, setAmmoLeft] = useState<number>(15);
  const [score, setScore] = useState<number>(0);
  const [bounceCombo, setBounceCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(35);
  const [feedbackText, setFeedbackText] = useState<string | null>(null);

  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_game_tank_bounce') !== 'true';
    } catch {
      return true;
    }
  });
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const tankX = 180;
  const tankY = 440;

  const stateRef = useRef({
    aimVector: { x: 0, y: -1 },
    isAiming: false,
    shells: [] as BounceShell[],
    enemies: [] as EnemyTank[],
    tanksDestroyed: 0,
    ammoLeft: 15,
    score: 0,
    combo: 0,
    maxCombo: 0,
    timeLeft: 35,
    isGameOver: false,
    isPaused: false,
    startTime: Date.now(),
    enemyCounter: 1,
    spawnTimer: 0,
    particles: [] as { x: number; y: number; vx: number; vy: number; color: string; life: number }[],
  });

  const initGame = useCallback(() => {
    const s = stateRef.current;
    s.aimVector = { x: 0, y: -1 };
    s.isAiming = false;
    s.shells = [];
    s.enemies = [];
    s.tanksDestroyed = 0;
    s.ammoLeft = 15;
    s.score = 0;
    s.combo = 0;
    s.maxCombo = 0;
    s.timeLeft = 35;
    s.isGameOver = false;
    s.startTime = Date.now();
    s.enemyCounter = 1;
    s.spawnTimer = 0;
    s.particles = [];

    // Initial Opponents in Maze
    s.enemies.push(
      { id: s.enemyCounter++, x: 90, y: 150, vx: 45, type: 'patrol', icon: '🤖', points: 400, radius: 24, hp: 1, isAlive: true },
      { id: s.enemyCounter++, x: 270, y: 220, vx: -35, type: 'heavy', icon: '🛡️', points: 600, radius: 28, hp: 2, isAlive: true },
      { id: s.enemyCounter++, x: 180, y: 110, vx: 0, type: 'barrel', icon: '🛢️', points: 800, radius: 22, hp: 1, isAlive: true }
    );

    setTanksDestroyed(0);
    setAmmoLeft(15);
    setScore(0);
    setBounceCombo(0);
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

  // Pure Touch Drag-Aim and Release-Fire Handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = stateRef.current;
    if (s.isGameOver || s.isPaused || s.ammoLeft <= 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const touchX = (e.clientX - rect.left) * scaleX;
    const touchY = (e.clientY - rect.top) * scaleY;

    const dx = touchX - tankX;
    const dy = touchY - tankY;
    const len = Math.hypot(dx, dy);

    if (len > 5) {
      s.aimVector = { x: dx / len, y: dy / len };
      s.isAiming = true;
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = stateRef.current;
    if (!s.isAiming || s.isGameOver || s.isPaused) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const touchX = (e.clientX - rect.left) * scaleX;
    const touchY = (e.clientY - rect.top) * scaleY;

    const dx = touchX - tankX;
    const dy = touchY - tankY;
    const len = Math.hypot(dx, dy);

    if (len > 5) {
      s.aimVector = { x: dx / len, y: dy / len };
    }
  };

  const handlePointerUp = () => {
    const s = stateRef.current;
    if (!s.isAiming || s.isGameOver || s.isPaused || s.ammoLeft <= 0) {
      s.isAiming = false;
      return;
    }

    s.isAiming = false;
    s.ammoLeft -= 1;
    setAmmoLeft(s.ammoLeft);

    const speed = 550;
    s.shells.push({
      x: tankX + s.aimVector.x * 25,
      y: tankY + s.aimVector.y * 25,
      vx: s.aimVector.x * speed,
      vy: s.aimVector.y * speed,
      bounces: 0,
      maxBounces: 3,
      alive: true,
    });

    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');

    // Muzzle Flash Particles
    for (let p = 0; p < 8; p++) {
      s.particles.push({
        x: tankX,
        y: tankY,
        vx: s.aimVector.x * 120 + (Math.random() - 0.5) * 80,
        vy: s.aimVector.y * 120 + (Math.random() - 0.5) * 80,
        color: '#f59e0b',
        life: 0.3,
      });
    }
  };

  // Main 60FPS Ricochet Tank Loop
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

      // Spawn Enemy Tanks
      s.spawnTimer += dt;
      if (s.spawnTimer > 1.4 && s.enemies.length < 5) {
        s.spawnTimer = 0;
        const rand = Math.random();
        const isBarrel = rand < 0.25;
        const isHeavy = rand >= 0.25 && rand < 0.55;

        s.enemies.push({
          id: s.enemyCounter++,
          x: Math.random() < 0.5 ? 60 : 300,
          y: 90 + Math.random() * 180,
          vx: (Math.random() < 0.5 ? 1 : -1) * (isHeavy ? 30 : 50),
          type: isBarrel ? 'barrel' : (isHeavy ? 'heavy' : 'patrol'),
          icon: isBarrel ? '🛢️' : (isHeavy ? '🛡️' : '🤖'),
          points: isBarrel ? 800 : (isHeavy ? 600 : 400),
          radius: isBarrel ? 22 : (isHeavy ? 28 : 24),
          hp: isHeavy ? 2 : 1,
          isAlive: true,
        });
      }

      // Move Enemies & Wall Bounce
      s.enemies.forEach((e) => {
        e.x += e.vx * dt;
        if (e.x > 315) {
          e.x = 315;
          e.vx = -Math.abs(e.vx);
        } else if (e.x < 45) {
          e.x = 45;
          e.vx = Math.abs(e.vx);
        }
      });

      // Update Ricochet Shells
      for (let i = s.shells.length - 1; i >= 0; i--) {
        const shell = s.shells[i];
        if (shell.alive) {
          shell.x += shell.vx * dt;
          shell.y += shell.vy * dt;

          // Left/Right Arena Wall Ricochet
          if (shell.x < 25) {
            shell.x = 25;
            shell.vx = -shell.vx;
            shell.bounces += 1;
            playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
          } else if (shell.x > 335) {
            shell.x = 335;
            shell.vx = -shell.vx;
            shell.bounces += 1;
            playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
          }

          // Top Wall Ricochet
          if (shell.y < 35) {
            shell.y = 35;
            shell.vy = -shell.vy;
            shell.bounces += 1;
            playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
          }

          // Bottom Wall Expiry
          if (shell.y > 480 || shell.bounces > shell.maxBounces) {
            shell.alive = false;
          }

          // Collision Check with Enemies
          for (let j = s.enemies.length - 1; j >= 0; j--) {
            const enemy = s.enemies[j];
            if (enemy.isAlive && Math.hypot(enemy.x - shell.x, enemy.y - shell.y) < enemy.radius + 10) {
              enemy.hp -= 1;
              shell.alive = false;

              if (enemy.hp <= 0) {
                enemy.isAlive = false;
                s.tanksDestroyed += 1;
                s.combo += 1;
                if (s.combo > s.maxCombo) s.maxCombo = s.combo;

                const bounceBonus = shell.bounces * 200;
                const pts = enemy.points + bounceBonus + s.combo * 40;
                s.score += pts;

                setTanksDestroyed(s.tanksDestroyed);
                setScore(s.score);
                setBounceCombo(s.combo);
                setMaxCombo(s.maxCombo);

                if (enemy.type === 'barrel') {
                  setFeedbackText(`🛢️ BARREL BLAST! +${pts}P 💥`);
                  playSfx?.('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
                } else {
                  setFeedbackText(`🔥 RICOCHET HIT! +${pts}P ⚡`);
                  playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
                }
                setTimeout(() => setFeedbackText(null), 400);

                // Blast Particles
                for (let p = 0; p < 14; p++) {
                  s.particles.push({
                    x: enemy.x,
                    y: enemy.y,
                    vx: (Math.random() - 0.5) * 260,
                    vy: (Math.random() - 0.5) * 260,
                    color: enemy.type === 'barrel' ? '#ef4444' : '#f59e0b',
                    life: 0.4,
                  });
                }

                s.enemies.splice(j, 1);
              }
              break;
            }
          }
        } else {
          s.shells.splice(i, 1);
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

      // Arena Fortress Concrete Gradient
      const fortGrad = ctx.createLinearGradient(0, 0, 0, h);
      fortGrad.addColorStop(0, '#1e293b');
      fortGrad.addColorStop(0.5, '#0f172a');
      fortGrad.addColorStop(1, '#020617');
      ctx.fillStyle = fortGrad;
      ctx.fillRect(0, 0, w, h);

      // Arena Steel Walls
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 4;
      ctx.strokeRect(20, 30, w - 40, h - 40);

      // Aim Trajectory Line (When dragging)
      if (s.isAiming) {
        ctx.strokeStyle = 'rgba(250, 204, 21, 0.7)';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([8, 8]);
        ctx.beginPath();
        ctx.moveTo(tankX, tankY);
        ctx.lineTo(tankX + s.aimVector.x * 120, tankY + s.aimVector.y * 120);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Render Ricochet Shells
      s.shells.forEach((shell) => {
        ctx.save();
        ctx.translate(shell.x, shell.y);
        ctx.fillStyle = '#fde047';
        ctx.shadowColor = '#fde047';
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Render Enemies
      s.enemies.forEach((enemy) => {
        if (enemy.isAlive) {
          ctx.save();
          ctx.translate(enemy.x, enemy.y);
          if (enemy.type === 'barrel') {
            ctx.shadowColor = '#ef4444';
            ctx.shadowBlur = 18;
          } else {
            ctx.shadowColor = '#38bdf8';
            ctx.shadowBlur = 14;
          }
          ctx.font = `${enemy.radius * 1.8}px serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(enemy.icon, 0, 0);
          ctx.restore();
        }
      });

      // Render Player Tank Hero (🚜)
      ctx.save();
      ctx.translate(tankX, tankY);
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 18;
      ctx.font = '40px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🚜', 0, 0);
      ctx.restore();

      // Render Particles
      s.particles.forEach((p) => {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, 4, 4);
      });
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [tankX, tankY, playSfx]);

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
      gameId: 'arcade_tank_bounce',
      gameTitle: '블리츠 탱크 바운스',
      durationSeconds: duration,
      score: s.score + (isWin ? 3500 : s.tanksDestroyed * 350) + s.maxCombo * 40,
      difficulty: 'NIGHTMARE',
      isVictory: isWin || s.tanksDestroyed >= 7,
    });
    setSettlementReceipt(receipt);
    onReward(receipt.totalSns);
  };

  const tutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 손가락 드래그 도탄 포격' : 'STEP 1: DRAG & RICOCHET SHOT',
      title: isKo ? '화면을 드래그해 각도를 조준하고 손을 떼어 발사하세요' : 'Drag to aim ricochet angle and release to fire bouncing shells',
      description: isKo
        ? '가상 조이스틱 없이 화면을 손가락으로 드래그하여 조준 궤적을 확인한 뒤 손을 떼면 최대 3회 벽면을 튕기는 도탄 포탄이 발사되어 적 탱크(🤖)와 폭발 배럴(🛢️)을 파괴합니다.'
        : 'Drag to adjust your firing line, release to launch shells that bounce up to 3 times off walls.',
      keyPoints: isKo
        ? [
            '가상 조이스틱 0개 (100% 손가락 직접 드래그 조준 & 손떼기 발사)',
            '벽면 3회 도탄 명중 및 배럴 폭발 시 800P 잭팟',
            '35초간 최대 콤보로 전차 군단을 전멸시키고 올클리어'
          ]
        : [
            'Zero Virtual Joysticks: 100% Direct Drag-Aim & Release-Fire',
            '3x Wall Ricochets and Barrel blasts award 800P jackpots',
            'Eliminate all enemy tanks with continuous combos within 35s'
          ],
      iconType: 'GOAL',
    },
    {
      badge: isKo ? 'STEP 2: 모바일 퓨어 제스처' : 'STEP 2: PURE GESTURES',
      title: isKo ? '화면 직접 드래그 조준 (Drag to Aim & Release)' : 'Drag to Aim Gesture',
      description: isKo
        ? '손가락을 원하는 방향으로 밀어 각도를 맞춥니다.'
        : 'Slide your thumb to align the ricochet vector line.',
      keyPoints: isKo
        ? [
            '👆 드래그 조준: 60FPS 실시간 조준 가이드라인 표시',
            '💥 연속 격파 시 탱크 콤보 배수 보너스',
            '⏱️ 35초 타임어택 고득점 챌린지'
          ]
        : [
            '👆 Drag to Aim: Real-time 60FPS trajectory preview',
            '💥 Consecutive destroys grant tank combo multipliers',
            '⏱️ 35s time attack tank bounce sprint'
          ],
      iconType: 'GESTURES',
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '전투 완료 즉시 NIGHTMARE 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Nightmare payout deposited atomically to your LocalStorage wallet upon match finish.',
      keyPoints: isKo
        ? [
            '완료 즉시 LocalStorage 영구 지갑 입금',
            '파괴한 탱크 수 및 도탄 횟수 비례 대량 잭팟',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Destroyed tanks count and ricochet multipliers',
            'VictoryRewardModal golden coin fanfare'
          ],
      iconType: 'REWARDS',
    },
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-[#020617] text-white font-mono select-none flex flex-col overflow-hidden items-center justify-between touch-none">
      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '블리츠 탱크 바운스' : 'Blitz Tank Bounce'}
        language={(language as Language) || 'ko'}
        telemetries={[
          { label: isKo ? '격파' : 'Kills', value: `${tanksDestroyed}대`, color: 'text-amber-400 font-bold' },
          { label: isKo ? '포탄' : 'Ammo', value: `${ammoLeft}발`, color: 'text-cyan-300 font-bold' },
          { label: isKo ? '시간' : 'Time', value: `${timeLeft}s`, color: timeLeft <= 10 ? 'text-rose-500 font-bold animate-pulse' : 'text-cyan-400 font-bold' },
          { label: isKo ? '점수' : 'Score', value: `${score}P`, color: 'text-amber-300 font-bold' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => setIsPaused(prev => !prev)}
        isPaused={isPaused}
      />

      {/* Pure Touch Tank Bounce Canvas Viewport */}
      <div className="flex-1 w-full max-w-md relative overflow-hidden flex items-center justify-center select-none touch-none p-2">
        <canvas
          ref={canvasRef}
          width={360}
          height={500}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
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
          {isKo ? '화면을 드래그해 각도를 맞추고 손을 떼어 도탄 포탄을 발사하세요' : 'Drag to aim ricochet angle and release to fire bouncing shell'}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="arcade_tank_bounce"
          gameTitle={isKo ? '블리츠 탱크: 도탄 포격전' : 'Blitz Tank: Ricochet Warfare'}
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
export default VoxelTankBounceGame;
