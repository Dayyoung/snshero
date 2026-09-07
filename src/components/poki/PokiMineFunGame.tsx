import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData } from '../../types';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { UniversalTutorialModal, TutorialStep } from '../UniversalTutorialModal';
import { drawCardSprite } from '../../lib/canvasCardRenderer';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';

interface PokiMineFunGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface OreNode {
  id: number;
  type: 'wood' | 'stone' | 'iron' | 'gold' | 'diamond';
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  color: string;
  value: number;
}

interface Monster {
  id: number;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  speed: number;
  monsterId: number;
}

export const PokiMineFunGame: React.FC<PokiMineFunGameProps> = ({
  deck = [],
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
  const playerHeroId = deck[0]?.id || 3;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  const [score, setScore] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(45);
  const [pickaxeLevel, setPickaxeLevel] = useState<number>(1);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isVictory, setIsVictory] = useState<boolean>(false);
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_minefun') !== 'true';
    } catch {
      return true;
    }
  });

  const stateRef = useRef({
    player: {
      x: 180,
      y: 280,
      targetX: 180,
      targetY: 280,
      width: 40,
      height: 40,
      speed: 4.2,
      power: 1,
    },
    ores: [] as OreNode[],
    monsters: [] as Monster[],
    combo: 0,
    isTouchActive: false,
    particles: [] as { x: number; y: number; vx: number; vy: number; color: string; alpha: number }[],
  });

  // Init world
  const initWorld = useCallback(() => {
    const ores: OreNode[] = [];
    const oreTypes: { type: OreNode['type']; color: string; hp: number; val: number }[] = [
      { type: 'wood', color: '#854d0e', hp: 3, val: 15 },
      { type: 'stone', color: '#64748b', hp: 5, val: 25 },
      { type: 'iron', color: '#94a3b8', hp: 8, val: 45 },
      { type: 'gold', color: '#eab308', hp: 12, val: 80 },
      { type: 'diamond', color: '#38bdf8', hp: 18, val: 150 },
    ];

    for (let i = 0; i < 16; i++) {
      const t = oreTypes[Math.floor(Math.random() * oreTypes.length)];
      ores.push({
        id: i,
        type: t.type,
        x: 40 + Math.random() * 280,
        y: 80 + Math.random() * 400,
        hp: t.hp,
        maxHp: t.hp,
        color: t.color,
        value: t.val,
      });
    }

    stateRef.current.ores = ores;
    stateRef.current.monsters = [];
    stateRef.current.player.power = 1;
    setPickaxeLevel(1);
  }, []);

  useEffect(() => {
    initWorld();
  }, [initWorld]);

  // Monster Spawner
  useEffect(() => {
    if (isGameOver || isVictory || showTutorial) return;
    const interval = setInterval(() => {
      if (stateRef.current.monsters.length < 5) {
        const monsterIds = [101, 102, 103, 107, 114];
        stateRef.current.monsters.push({
          id: Date.now() + Math.random(),
          x: Math.random() < 0.5 ? -20 : 380,
          y: Math.random() * 500,
          hp: 4 + pickaxeLevel * 2,
          maxHp: 4 + pickaxeLevel * 2,
          speed: 1.2 + Math.random() * 0.8,
          monsterId: monsterIds[Math.floor(Math.random() * monsterIds.length)],
        });
      }
    }, 3500);
    return () => clearInterval(interval);
  }, [isGameOver, isVictory, showTutorial, pickaxeLevel]);

  // Timer loop
  useEffect(() => {
    if (isGameOver || isVictory || showTutorial) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleGameOver(score >= 600);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isGameOver, isVictory, showTutorial, score]);

  const handleGameOver = useCallback((victory: boolean) => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    setIsGameOver(true);
    setIsVictory(victory);

    const receipt = calculateAndDepositMissionReward({
      gameId: 'poki_minefun',
      gameTitle: isKo ? '마인펀 샌드박스' : 'MineFun.io',
      durationSeconds: 45 - timeLeft,
      score: score + (victory ? 300 : 0),
      maxTargetScore: 1000,
      isVictory: victory,
      difficulty: 'NORMAL',
      comboCount: stateRef.current.combo,
      perfectClear: victory && timeLeft > 15,
    });

    setSettlementReceipt(receipt);
    onReward(receipt.totalSns);
    if (playSfx) {
      playSfx(victory ? 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3' : 'https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
    }
  }, [score, timeLeft, isKo, onReward, playSfx]);

  // Main Canvas Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.clientWidth;
    let height = canvas.clientHeight;
    canvas.width = width;
    canvas.height = height;

    const updateAndRender = () => {
      if (isGameOver || isVictory || showTutorial) return;

      const p = stateRef.current.player;
      const ores = stateRef.current.ores;
      const monsters = stateRef.current.monsters;
      const particles = stateRef.current.particles;

      // Player move to target
      const dx = p.targetX - p.x;
      const dy = p.targetY - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 4) {
        p.x += (dx / dist) * p.speed;
        p.y += (dy / dist) * p.speed;
      }

      // Monster seek player
      for (let i = monsters.length - 1; i >= 0; i--) {
        const m = monsters[i];
        const mdx = p.x - m.x;
        const mdy = p.y - m.y;
        const mdist = Math.sqrt(mdx * mdx + mdy * mdy);

        if (mdist > 10) {
          m.x += (mdx / mdist) * m.speed;
          m.y += (mdy / mdist) * m.speed;
        }

        // Collision with player
        if (mdist < 28) {
          // Player hit!
          setScore(s => Math.max(0, s - 25));
          stateRef.current.combo = 0;
          // knockback monster
          m.x -= (mdx / mdist) * 40;
          m.y -= (mdy / mdist) * 40;
        }
      }

      // Check win condition
      if (score >= 1000) {
        handleGameOver(true);
        return;
      }

      // ---------------- RENDER ----------------
      ctx.clearRect(0, 0, width, height);

      // Grassy dirt Minecraft voxel floor
      ctx.fillStyle = '#14532d'; // Deep grass green
      ctx.fillRect(0, 0, width, height);

      // Dirt grid texture
      ctx.strokeStyle = 'rgba(20, 83, 45, 0.4)';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 32) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += 32) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw Ores (Voxel Cube style)
      for (const o of ores) {
        ctx.fillStyle = o.color;
        ctx.fillRect(o.x - 14, o.y - 14, 28, 28);

        // Voxel 3D bevel
        ctx.strokeStyle = 'rgba(255,255,255,0.4)';
        ctx.lineWidth = 2;
        ctx.strokeRect(o.x - 14, o.y - 14, 28, 28);

        // Health bar
        const hpPct = o.hp / o.maxHp;
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(o.x - 14, o.y + 18, 28, 4);
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(o.x - 14, o.y + 18, 28 * hpPct, 4);
      }

      // Draw Monsters
      for (const m of monsters) {
        drawCardSprite(ctx, m.monsterId, m.x - 16, m.y - 16, 32, 32, {
          circleClip: true,
          borderWidth: 2,
          borderColor: '#ef4444',
          shadowBlur: 6,
          shadowColor: '#ef4444',
        });

        // HP bar
        const mHpPct = m.hp / m.maxHp;
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(m.x - 14, m.y + 18, 28, 3);
        ctx.fillStyle = '#a855f7';
        ctx.fillRect(m.x - 14, m.y + 18, 28 * mHpPct, 3);
      }

      // Draw Particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const pt = particles[i];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.alpha -= 0.04;
        if (pt.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }
        ctx.fillStyle = pt.color;
        ctx.globalAlpha = pt.alpha;
        ctx.fillRect(pt.x, pt.y, 4, 4);
        ctx.globalAlpha = 1;
      }

      // Draw Player Hero (SNSHero card sprite)
      drawCardSprite(ctx, playerHeroId, p.x - 20, p.y - 20, 40, 40, {
        circleClip: true,
        borderWidth: 2,
        borderColor: '#f59e0b',
        shadowBlur: 8,
        shadowColor: '#f59e0b',
      });

      // Mining Aura Ring
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 36, 0, Math.PI * 2);
      ctx.stroke();

      animFrameRef.current = requestAnimationFrame(updateAndRender);
    };

    animFrameRef.current = requestAnimationFrame(updateAndRender);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isGameOver, isVictory, showTutorial, score, playerHeroId, handleGameOver]);

  // Touch / Tap Action: Move & Mine & Attack
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const touchX = e.clientX - rect.left;
    const touchY = e.clientY - rect.top;

    stateRef.current.isTouchActive = true;
    stateRef.current.player.targetX = touchX;
    stateRef.current.player.targetY = touchY;

    // Check hit on ore
    const ores = stateRef.current.ores;
    for (let i = ores.length - 1; i >= 0; i--) {
      const o = ores[i];
      const dist = Math.hypot(touchX - o.x, touchY - o.y);
      if (dist < 32) {
        o.hp -= stateRef.current.player.power;
        if (playSfx) playSfx('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');

        // Spark particles
        for (let k = 0; k < 5; k++) {
          stateRef.current.particles.push({
            x: o.x,
            y: o.y,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6,
            color: o.color,
            alpha: 1,
          });
        }

        if (o.hp <= 0) {
          setScore(s => s + o.value);
          stateRef.current.combo++;

          // Upgrade pickaxe check
          if (score > 200 && pickaxeLevel === 1) {
            setPickaxeLevel(2);
            stateRef.current.player.power = 2;
          } else if (score > 500 && pickaxeLevel === 2) {
            setPickaxeLevel(3);
            stateRef.current.player.power = 3;
          }

          // Respawn ore elsewhere
          o.x = 40 + Math.random() * (canvas.clientWidth - 80);
          o.y = 80 + Math.random() * (canvas.clientHeight - 120);
          o.hp = o.maxHp;
        }
        return;
      }
    }

    // Check hit on monster
    const monsters = stateRef.current.monsters;
    for (let i = monsters.length - 1; i >= 0; i--) {
      const m = monsters[i];
      const dist = Math.hypot(touchX - m.x, touchY - m.y);
      if (dist < 32) {
        m.hp -= stateRef.current.player.power * 2;
        if (playSfx) playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');

        if (m.hp <= 0) {
          monsters.splice(i, 1);
          setScore(s => s + 60);
          stateRef.current.combo++;
        }
        return;
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!stateRef.current.isTouchActive) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    stateRef.current.player.targetX = e.clientX - rect.left;
    stateRef.current.player.targetY = e.clientY - rect.top;
  };

  const handlePointerUp = () => {
    stateRef.current.isTouchActive = false;
  };

  const tutorialSteps: TutorialStep[] = [
    {
      title: isKo ? '마인펀 샌드박스' : 'MineFun.io',
      badge: 'MISSION 03',
      description: isKo
        ? '광석 블록을 직접 터치하여 채굴하고 자원을 모아 곡괭이를 업그레이드하세요!'
        : 'Tap directly on ore blocks to mine valuable minerals and upgrade your pickaxe!',
      keyPoints: isKo
        ? ['광석 블록을 탭하여 채굴', '자원 수집으로 곡괭이 업그레이드', '다양한 광물 수집 시 추가 점수']
        : ['Tap blocks to mine ores', 'Upgrade pickaxe with minerals', 'Collect rare ores for bonus pts'],
    },
    {
      title: isKo ? '몬스터 퇴치 & 생존' : 'Combat & Survival',
      badge: 'MONSTER HUNT',
      description: isKo
        ? '다가오는 야간 몬스터를 탭하여 칼로 물리치세요. 스코어 1,000점을 달성하면 승리합니다.'
        : 'Tap approaching night monsters to slash them down. Reach 1,000 points to win!',
      keyPoints: isKo
        ? ['몬스터를 터치하여 근접 타격', '체력 보존 및 야간 서바이벌', '1,000점 달성 시 미션 성공']
        : ['Tap monsters to slash', 'Survive night waves', 'Reach 1,000 score to win'],
    }
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-slate-950 flex flex-col items-center select-none overflow-hidden font-mono">
      <MinimalistMissionHUD
        title={isKo ? 'No.03 마인펀 샌드박스' : 'No.03 MineFun.io'}
        currentScore={score}
        targetScore={1000}
        timeLeft={timeLeft}
        stageInfo={`PICKAXE Lv.${pickaxeLevel}`}
        combo={stateRef.current.combo}
        onExit={onExit}
      />

      <div className="relative flex-1 w-full max-w-md flex items-center justify-center p-2">
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="w-full h-full rounded-sm border border-slate-800 touch-none shadow-inner"
        />

        {/* Action Guide */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none text-center bg-slate-900/80 px-4 py-1.5 rounded-full border border-slate-700/60 backdrop-blur-sm">
          <p className="text-xs text-amber-400 font-bold tracking-wider animate-pulse">
            {isKo ? '⛏️ 광석/몬스터 터치: 채광 & 공격 | 👆 드래그: 이동' : '⛏️ TAP: MINE & ATTACK | 👆 DRAG: MOVE'}
          </p>
        </div>
      </div>

      {/* Victory Reward Modal */}
      {settlementReceipt && (
        <VictoryRewardModal
          isOpen={isGameOver}
          isVictory={isVictory}
          score={score}
          receipt={settlementReceipt}
          onConfirm={onExit}
          onRestart={() => {
            setIsGameOver(false);
            setIsVictory(false);
            setSettlementReceipt(null);
            setScore(0);
            setTimeLeft(45);
            initWorld();
          }}
          language={language}
        />
      )}

      {/* Universal Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          isOpen={showTutorial}
          gameTitle={isKo ? 'No.03 마인펀 샌드박스' : 'No.03 MineFun.io'}
          steps={tutorialSteps}
          onComplete={() => {
            setShowTutorial(false);
            try {
              localStorage.setItem('hero_tutorial_minefun', 'true');
            } catch {}
          }}
          language={language}
        />
      )}
    </div>
  );
};
