import { drawCardSprite } from '../lib/canvasCardRenderer';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData, Language } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelLifeFlameGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface ShadowCreep {
  id: number;
  x: number;
  y: number;
  speed: number;
  hp: number;
  maxHp: number;
  type: 'crawler' | 'wraith' | 'golem';
  icon: string;
  points: number;
  radius: number;
}

interface FlameProjectile {
  id: number;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  speed: number;
  life: number;
}

export const VoxelLifeFlameGame: React.FC<VoxelLifeFlameGameProps> = ({
  deck = [],
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
  const playerHeroId = deck[0]?.id || 108;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  const [treeHp, setTreeHp] = useState<number>(100);
  const [purifiedCount, setPurifiedCount] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [flameCombo, setFlameCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(35);
  const [feedbackText, setFeedbackText] = useState<string | null>(null);

  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_game_flame_defense') !== 'true';
    } catch {
      return true;
    }
  });
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const stateRef = useRef({
    treeHp: 100,
    creeps: [] as ShadowCreep[],
    flames: [] as FlameProjectile[],
    purified: 0,
    score: 0,
    combo: 0,
    maxCombo: 0,
    timeLeft: 35,
    isGameOver: false,
    isPaused: false,
    startTime: Date.now(),
    creepCounter: 1,
    spawnTimer: 0,
    novaParticles: [] as { x: number; y: number; vx: number; vy: number; color: string; life: number }[],
  });

  const initGame = useCallback(() => {
    const s = stateRef.current;
    s.treeHp = 100;
    s.creeps = [];
    s.flames = [];
    s.purified = 0;
    s.score = 0;
    s.combo = 0;
    s.maxCombo = 0;
    s.timeLeft = 35;
    s.isGameOver = false;
    s.startTime = Date.now();
    s.creepCounter = 1;
    s.spawnTimer = 0;
    s.novaParticles = [];

    setTreeHp(100);
    setPurifiedCount(0);
    setScore(0);
    setFlameCombo(0);
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

  // Direct Touch Tap to Cast Sacred Flame (Zero Joysticks)
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

    // Fire Sacred Flame from Tree Center (180, 250) towards Tap Point
    const treeX = 180;
    const treeY = 250;

    s.flames.push({
      id: Date.now() + Math.random(),
      x: treeX,
      y: treeY,
      targetX: tapX,
      targetY: tapY,
      speed: 650,
      life: 0.6,
    });

    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');

    // Check Immediate Hit on tapped creep
    for (let i = s.creeps.length - 1; i >= 0; i--) {
      const c = s.creeps[i];
      if (Math.hypot(c.x - tapX, c.y - tapY) < c.radius + 20) {
        c.hp -= 40;

        // Particle Burst
        for (let p = 0; p < 6; p++) {
          s.novaParticles.push({
            x: c.x,
            y: c.y,
            vx: (Math.random() - 0.5) * 200,
            vy: (Math.random() - 0.5) * 200,
            color: '#f43f5e',
            life: 0.5,
          });
        }

        if (c.hp <= 0) {
          s.purified += 1;
          s.combo += 1;
          if (s.combo > s.maxCombo) s.maxCombo = s.combo;

          const pts = c.points + s.combo * 20;
          s.score += pts;

          setScore(s.score);
          setPurifiedCount(s.purified);
          setFlameCombo(s.combo);
          setMaxCombo(s.maxCombo);

          setFeedbackText(`PURIFIED! +${pts}P 🔥`);
          playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
          setTimeout(() => setFeedbackText(null), 300);

          s.creeps.splice(i, 1);
        }
        return;
      }
    }
  };

  // Main 60FPS Flame Defense Engine Loop
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

      const treeX = 180;
      const treeY = 250;

      // Spawn Shadow Creeps from Edges
      s.spawnTimer += dt;
      const spawnRate = s.timeLeft <= 10 ? 0.45 : 0.8;
      if (s.spawnTimer >= spawnRate && s.creeps.length < 12) {
        s.spawnTimer = 0;
        const angle = Math.random() * Math.PI * 2;
        const spawnDist = 240;
        const cx = treeX + Math.cos(angle) * spawnDist;
        const cy = treeY + Math.sin(angle) * spawnDist;

        const isGolem = Math.random() < 0.2;
        const isWraith = Math.random() < 0.35;

        s.creeps.push({
          id: s.creepCounter++,
          x: cx,
          y: cy,
          speed: isGolem ? 35 : (isWraith ? 70 : 50),
          hp: isGolem ? 100 : (isWraith ? 40 : 50),
          maxHp: isGolem ? 100 : (isWraith ? 40 : 50),
          type: isGolem ? 'golem' : (isWraith ? 'wraith' : 'crawler'),
          icon: isGolem ? '🗿' : (isWraith ? '👻' : '👾'),
          points: isGolem ? 500 : (isWraith ? 250 : 150),
          radius: isGolem ? 22 : 16,
        });
      }

      // Move Creeps towards Tree
      for (let i = s.creeps.length - 1; i >= 0; i--) {
        const c = s.creeps[i];
        const dx = treeX - c.x;
        const dy = treeY - c.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 30) {
          c.x += (dx / dist) * c.speed * dt;
          c.y += (dy / dist) * c.speed * dt;
        } else {
          // Reached Tree: Inflict Damage
          s.treeHp = Math.max(0, s.treeHp - (c.type === 'golem' ? 25 : 12));
          setTreeHp(s.treeHp);
          s.combo = 0;
          setFlameCombo(0);

          setFeedbackText(isKo ? '생명의 나무 피격! 💔' : 'TREE DAMAGED! 💔');
          playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
          setTimeout(() => setFeedbackText(null), 400);

          s.creeps.splice(i, 1);

          if (s.treeHp <= 0) {
            endGame(false);
            return;
          }
        }
      }

      // Update Flame Projectiles
      for (let i = s.flames.length - 1; i >= 0; i--) {
        const f = s.flames[i];
        const dx = f.targetX - f.x;
        const dy = f.targetY - f.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 15) {
          f.x += (dx / dist) * f.speed * dt;
          f.y += (dy / dist) * f.speed * dt;
        } else {
          s.flames.splice(i, 1);
        }
      }

      // Update Nova Particles
      for (let i = s.novaParticles.length - 1; i >= 0; i--) {
        const p = s.novaParticles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
        if (p.life <= 0) s.novaParticles.splice(i, 1);
      }

      // ── Canvas Rendering ──
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Mystical Enchanted Grove Background
      ctx.fillStyle = '#06130d';
      ctx.fillRect(0, 0, w, h);

      // Sacred Aura Circles around Tree
      ctx.strokeStyle = 'rgba(52, 211, 153, 0.15)';
      ctx.lineWidth = 2;
      [80, 150, 220].forEach((r) => {
        ctx.beginPath();
        ctx.arc(treeX, treeY, r, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Sacred Flame Dragon Tree at Center (Player Hero Guardian)
      ctx.save();
      ctx.translate(treeX, treeY);

      drawCardSprite(
        ctx,
        playerHeroId,
        -24,
        -24,
        48,
        48,
        {
          circleClip: true,
          borderWidth: 2,
          borderColor: '#10b981',
          shadowBlur: 18,
          shadowColor: 'rgba(16, 185, 129, 0.9)',
        }
      );

      ctx.font = '22px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🔥', 0, -32);
      ctx.restore();

      // Render Shadow Creeps (Card Sprites)
      s.creeps.forEach((c) => {
        ctx.save();
        ctx.translate(c.x, c.y);

        const creepCardId = c.type === 'crawler' ? 27 : c.type === 'wraith' ? 41 : 65;

        drawCardSprite(
          ctx,
          creepCardId,
          -c.radius,
          -c.radius,
          c.radius * 2,
          c.radius * 2,
          {
            circleClip: true,
            borderWidth: 1.5,
            borderColor: '#f43f5e',
            shadowBlur: 8,
            shadowColor: 'rgba(244, 63, 94, 0.8)',
          }
        );

        // Mini HP Bar
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(-12, c.radius + 3, 24, 4);
        ctx.fillStyle = '#f43f5e';
        ctx.fillRect(-12, c.radius + 3, 24 * (c.hp / c.maxHp), 4);
        ctx.restore();
      });

      // Render Flying Flames
      s.flames.forEach((f) => {
        ctx.shadowColor = '#f43f5e';
        ctx.shadowBlur = 12;
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.arc(f.x, f.y, 6, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.shadowBlur = 0;

      // Render Nova Particles
      s.novaParticles.forEach((p) => {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, 4, 4);
      });
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [isKo, playSfx, playerHeroId]);

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
      gameId: 'arcade_flame_defense',
      gameTitle: '블리츠 플레임 디펜스',
      durationSeconds: duration,
      score: s.score + (isWin ? 3500 : s.purified * 100) + s.maxCombo * 40,
      difficulty: 'NIGHTMARE',
      isVictory: isWin || s.purified >= 20,
    });
    setSettlementReceipt(receipt);
    onReward(receipt.totalSns);
  };

  const tutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 어둠의 몬스터 탭 정화' : 'STEP 1: TAP TO PURIFY CREEPS',
      title: isKo ? '다가오는 몬스터를 탭해 성스러운 불꽃으로 정화하세요' : 'Tap Approaching Shadow Creeps to Purify with Sacred Flames',
      description: isKo
        ? '가상 조이스틱 없이 중앙의 생명의 나무(🌳🔥)를 향해 몰려오는 어둠의 크립(👾, 👻, 🗿)을 손가락으로 직접 탭하여 성스러운 화염탄으로 파괴하고 나무를 보호하세요.'
        : 'Directly tap incoming shadow creeps to launch homing fireballs and protect the sacred tree of life.',
      keyPoints: isKo
        ? [
            '가상 조이스틱 0개 (100% 화면 직접 몬스터 원터치 탭 발사)',
            '거대 어둠 골렘(🗿) 격파 시 500P 대박 보너스',
            '35초간 생명의 나무 HP를 수호하고 올클리어하세요'
          ]
        : [
            'Zero Virtual Joysticks: 100% Direct Screen Tap Fire',
            'Giant Shadow Golems (🗿) award 500P huge bonus',
            'Defend the sacred tree HP for 35s to claim victory'
          ],
      iconType: 'GOAL',
    },
    {
      badge: isKo ? 'STEP 2: 모바일 퓨어 제스처' : 'STEP 2: PURE GESTURES',
      title: isKo ? '화면 직접 타깃 탭 (Direct Target Tap)' : 'Direct Screen Tap',
      description: isKo
        ? '사방에서 몰려드는 적을 보며 신속하게 손가락으로 콕콕 찌릅니다.'
        : 'Tap rapidly on enemies moving in from all angles.',
      keyPoints: isKo
        ? [
            '👆 타깃 직접 탭: 즉각적인 성스러운 화염탄 발사',
            '🔥 연속 정화 성공 시 플레임 콤보 점수 배수 폭증',
            '⏱️ 35초 타임어택 고득점 챌린지'
          ]
        : [
            '👆 Direct Tap: Instant responsive homing fire barrage',
            '🔥 Continuous purifications grant huge combo multipliers',
            '⏱️ 35s time attack circle defense sprint'
          ],
      iconType: 'GESTURES',
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '수호 완료 즉시 NIGHTMARE 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Nightmare payout deposited atomically to your LocalStorage wallet upon match finish.',
      keyPoints: isKo
        ? [
            '완료 즉시 LocalStorage 영구 지갑 입금',
            '정화 몬스터 수 및 잔여 나무 HP 비례 대량 잭팟',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Purified monsters and remaining tree HP multipliers',
            'VictoryRewardModal golden coin fanfare'
          ],
      iconType: 'REWARDS',
    },
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-[#040e09] text-white font-mono select-none flex flex-col overflow-hidden items-center justify-between touch-none">
      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '블리츠 플레임 디펜스' : 'Blitz Flame Defense'}
        language={(language as Language) || 'ko'}
        hp={{ current: treeHp, max: 100 }}
        telemetries={[
          { label: isKo ? '정화' : 'Purified', value: `${purifiedCount}마리`, color: 'text-amber-400 font-bold' },
          { label: isKo ? '시간' : 'Time', value: `${timeLeft}s`, color: timeLeft <= 10 ? 'text-rose-500 font-bold animate-pulse' : 'text-cyan-400 font-bold' },
          { label: isKo ? '콤보' : 'Combo', value: `${flameCombo}x`, color: flameCombo > 4 ? 'text-emerald-400 font-bold animate-bounce' : 'text-slate-300' },
          { label: isKo ? '점수' : 'Score', value: `${score}P`, color: 'text-amber-300 font-bold' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => setIsPaused(prev => !prev)}
        isPaused={isPaused}
      />

      {/* Pure Touch Circle Defense Canvas Viewport */}
      <div className="flex-1 w-full max-w-md relative overflow-hidden flex items-center justify-center select-none touch-none p-2">
        <canvas
          ref={canvasRef}
          width={360}
          height={500}
          onPointerDown={handlePointerDown}
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
          {isKo ? '다가오는 몬스터를 탭하여 화염구로 정화하고 생명의 나무를 지키세요' : 'Tap approaching monsters to purify with flames and defend the tree'}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="arcade_flame_defense"
          gameTitle={isKo ? '블리츠 플레임: 서클 디펜스' : 'Blitz Flame: Circle Defense'}
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
export default VoxelLifeFlameGame;
