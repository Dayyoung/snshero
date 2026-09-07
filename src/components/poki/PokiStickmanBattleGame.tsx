import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData } from '../../types';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { UniversalTutorialModal, TutorialStep } from '../UniversalTutorialModal';
import { drawCardSprite } from '../../lib/canvasCardRenderer';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';

interface PokiStickmanBattleGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface EnemyFighter {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  hp: number;
  maxHp: number;
  charId: number;
}

export const PokiStickmanBattleGame: React.FC<PokiStickmanBattleGameProps> = ({
  deck = [],
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
  const playerHeroId = deck[0]?.id || 15;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  const [score, setScore] = useState<number>(0);
  const [defeatedCount, setDefeatedCount] = useState<number>(0);
  const targetDefeats = 5;
  const [playerHp, setPlayerHp] = useState<number>(100);
  const [timeLeft, setTimeLeft] = useState<number>(45);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isVictory, setIsVictory] = useState<boolean>(false);
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_stickman_battle') !== 'true';
    } catch {
      return true;
    }
  });

  const stateRef = useRef({
    player: {
      x: 100,
      y: 280,
      vx: 0,
      vy: 0,
      angle: 0,
      swordLen: 38,
      hp: 100,
    },
    currentEnemy: null as EnemyFighter | null,
    combo: 0,
    isTouchActive: false,
    particles: [] as { x: number; y: number; vx: number; vy: number; color: string; alpha: number }[],
  });

  const spawnNextEnemy = useCallback((defeatedIdx: number) => {
    const enemyChars = [102, 106, 111, 117, 125];
    stateRef.current.currentEnemy = {
      id: Date.now(),
      x: 260,
      y: 260,
      vx: 0,
      vy: 0,
      angle: Math.PI,
      hp: 4 + defeatedIdx * 2,
      maxHp: 4 + defeatedIdx * 2,
      charId: enemyChars[defeatedIdx % enemyChars.length],
    };
  }, []);

  const initGame = useCallback(() => {
    stateRef.current.player = {
      x: 100,
      y: 280,
      vx: 0,
      vy: 0,
      angle: 0,
      swordLen: 38,
      hp: 100,
    };
    setPlayerHp(100);
    setDefeatedCount(0);
    spawnNextEnemy(0);
  }, [spawnNextEnemy]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  // Timer
  useEffect(() => {
    if (isGameOver || isVictory || showTutorial) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleGameOver(defeatedCount >= 3);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isGameOver, isVictory, showTutorial, defeatedCount]);

  const handleGameOver = useCallback((victory: boolean) => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    setIsGameOver(true);
    setIsVictory(victory);

    const finalScore = score + (victory ? 500 : 100);
    const receipt = calculateAndDepositMissionReward({
      gameId: 'poki_stickman_battle',
      gameTitle: isKo ? '스틱맨 래그돌 배틀' : 'Stickman Battle',
      durationSeconds: 45 - timeLeft,
      score: finalScore,
      maxTargetScore: 1000,
      isVictory: victory,
      difficulty: 'NORMAL',
      comboCount: stateRef.current.combo,
      perfectClear: victory && playerHp >= 60,
    });

    setSettlementReceipt(receipt);
    onReward(receipt.totalSns);
    if (playSfx) {
      playSfx(victory ? 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3' : 'https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
    }
  }, [score, timeLeft, playerHp, isKo, onReward, playSfx]);

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

    const gravity = 0.35;

    const updateAndRender = () => {
      if (isGameOver || isVictory || showTutorial) return;

      const p = stateRef.current.player;
      const en = stateRef.current.currentEnemy;
      const particles = stateRef.current.particles;

      // Player physics
      p.vy += gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.95;
      p.vy *= 0.95;

      // Floor clamp
      if (p.y > height - 100) {
        p.y = height - 100;
        p.vy = 0;
      }
      p.x = Math.max(30, Math.min(width - 30, p.x));

      // Player Sword Tip
      const pTipX = p.x + Math.cos(p.angle) * p.swordLen;
      const pTipY = p.y + Math.sin(p.angle) * p.swordLen;

      // Enemy AI physics
      if (en) {
        en.vy += gravity;
        en.x += en.vx;
        en.y += en.vy;
        en.vx *= 0.95;
        en.vy *= 0.95;

        if (en.y > height - 100) {
          en.y = height - 100;
          en.vy = 0;
        }

        // Enemy seek player
        const edx = p.x - en.x;
        const edy = p.y - en.y;
        const edist = Math.sqrt(edx * edx + edy * edy);
        en.vx += (edx / edist) * 0.4;
        en.angle = Math.atan2(edy, edx);

        // Enemy Sword Tip
        const eTipX = en.x + Math.cos(en.angle) * 35;
        const eTipY = en.y + Math.sin(en.angle) * 35;

        // Player sword hits enemy body?
        if (Math.hypot(pTipX - en.x, pTipY - en.y) < 26) {
          en.hp -= 1;
          en.vx += Math.cos(p.angle) * 12;
          en.vy -= 6;
          setScore(s => s + 40);
          stateRef.current.combo++;
          if (playSfx) playSfx('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');

          // Sparks
          for (let k = 0; k < 6; k++) {
            particles.push({
              x: en.x,
              y: en.y,
              vx: (Math.random() - 0.5) * 8,
              vy: (Math.random() - 0.5) * 8,
              color: '#facc15',
              alpha: 1,
            });
          }

          if (en.hp <= 0) {
            const nextDefeats = defeatedCount + 1;
            setDefeatedCount(nextDefeats);
            setScore(s => s + 150);
            if (playSfx) playSfx('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');

            if (nextDefeats >= targetDefeats) {
              handleGameOver(true);
              return;
            } else {
              spawnNextEnemy(nextDefeats);
            }
          }
        }

        // Enemy sword hits player body?
        if (Math.hypot(eTipX - p.x, eTipY - p.y) < 22) {
          p.hp -= 8;
          setPlayerHp(p.hp);
          p.vx -= Math.cos(en.angle) * 8;
          stateRef.current.combo = 0;
          if (playSfx) playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');

          if (p.hp <= 0) {
            handleGameOver(false);
            return;
          }
        }
      }

      // ---------------- RENDER ----------------
      ctx.clearRect(0, 0, width, height);

      // Arena background
      ctx.fillStyle = '#111827';
      ctx.fillRect(0, 0, width, height);

      // Arena fighting floor
      ctx.fillStyle = '#374151';
      ctx.fillRect(0, height - 90, width, 90);
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 2;
      ctx.strokeRect(0, height - 90, width, 2);

      // Draw Particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const pt = particles[i];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.alpha -= 0.05;
        if (pt.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }
        ctx.fillStyle = pt.color;
        ctx.globalAlpha = pt.alpha;
        ctx.fillRect(pt.x, pt.y, 4, 4);
        ctx.globalAlpha = 1;
      }

      // Draw Enemy
      if (en) {
        // Enemy sword
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(en.x, en.y);
        ctx.lineTo(en.x + Math.cos(en.angle) * 35, en.y + Math.sin(en.angle) * 35);
        ctx.stroke();

        // Enemy card sprite
        drawCardSprite(ctx, en.charId, en.x - 16, en.y - 16, 32, 32, {
          circleClip: true,
          borderWidth: 2,
          borderColor: '#ef4444',
        });

        // Enemy HP bar
        const hpPct = en.hp / en.maxHp;
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(en.x - 16, en.y - 28, 32, 4);
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(en.x - 16, en.y - 28, 32 * hpPct, 4);
      }

      // Draw Player Sword
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(pTipX, pTipY);
      ctx.stroke();

      // Draw Player Hero Sprite
      drawCardSprite(ctx, playerHeroId, p.x - 18, p.y - 18, 36, 36, {
        circleClip: true,
        borderWidth: 2,
        borderColor: '#38bdf8',
        shadowBlur: 8,
        shadowColor: '#38bdf8',
      });

      animFrameRef.current = requestAnimationFrame(updateAndRender);
    };

    animFrameRef.current = requestAnimationFrame(updateAndRender);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isGameOver, isVictory, showTutorial, defeatedCount, playerHeroId, spawnNextEnemy, handleGameOver]);

  // Drag to aim sword & leap
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const touchX = e.clientX - rect.left;
    const touchY = e.clientY - rect.top;

    const p = stateRef.current.player;
    p.angle = Math.atan2(touchY - p.y, touchX - p.x);
    p.vx = Math.cos(p.angle) * 8;
    p.vy = Math.sin(p.angle) * 8 - 4;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const touchX = e.clientX - rect.left;
    const touchY = e.clientY - rect.top;

    const p = stateRef.current.player;
    p.angle = Math.atan2(touchY - p.y, touchX - p.x);
  };

  const tutorialSteps: TutorialStep[] = [
    {
      badge: 'CONTROLS',
      title: isKo ? '스틱맨 래그돌 배틀' : 'Stickman Battle',
      description: isKo
        ? '화면을 드래그하여 검을 휘두르고 적을 향해 도약하세요! 칼날로 적의 몸통을 베어야 데미지를 입힙니다.'
        : 'Drag to swing your sword and leap toward enemies! Strike their body to deal damage.',
      keyPoints: isKo ? ['터치 드래그 칼날 휘두르기', '래그돌 반동 도약', '적 급소 타격'] : ['Drag to swing blade', 'Ragdoll bounce launch', 'Strike weakpoints'],
    },
    {
      badge: 'GOAL',
      title: isKo ? '5명 연속 격파' : 'Defeat 5 Opponents',
      description: isKo
        ? '적의 칼날 공격을 피하고 총 5명의 적 래그돌 전사를 쓰러뜨려 승리하세요.'
        : 'Avoid incoming sword strikes and defeat all 5 challenger fighters to win!',
      keyPoints: isKo ? ['적 검격 방어/회피', '체력 보존', '5명 연속 격파 승리'] : ['Parry enemy blades', 'Preserve HP', 'Defeat 5 challengers'],
    }
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-slate-950 flex flex-col items-center select-none overflow-hidden font-mono">
      <MinimalistMissionHUD
        title={isKo ? 'No.15 스틱맨 배틀' : 'No.15 Stickman Battle'}
        currentScore={score}
        targetScore={1000}
        timeLeft={timeLeft}
        stageInfo={`처치: ${defeatedCount}/${targetDefeats}명 | HP: ${playerHp}%`}
        combo={stateRef.current.combo}
        onExit={onExit}
      />

      <div className="relative flex-1 w-full max-w-md flex items-center justify-center p-2">
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          className="w-full h-full rounded-sm border border-slate-800 touch-none shadow-inner"
        />

        {/* Action Guide */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none text-center bg-slate-900/80 px-4 py-1.5 rounded-full border border-slate-700/60 backdrop-blur-sm">
          <p className="text-xs text-sky-400 font-bold tracking-wider animate-pulse">
            {isKo ? '👆 드래그: 검 휘두르기 & 도약 공격' : '👆 DRAG: SWING SWORD & LEAP'}
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
            setDefeatedCount(0);
            setTimeLeft(45);
            initGame();
          }}
          language={language}
        />
      )}

      {/* Universal Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          isOpen={showTutorial}
          gameTitle={isKo ? 'No.15 스틱맨 배틀' : 'No.15 Stickman Battle'}
          steps={tutorialSteps}
          onComplete={() => {
            setShowTutorial(false);
            try {
              localStorage.setItem('hero_tutorial_stickman_battle', 'true');
            } catch {}
          }}
          language={language}
        />
      )}
    </div>
  );
};
