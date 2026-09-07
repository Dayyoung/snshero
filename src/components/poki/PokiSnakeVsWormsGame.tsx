import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData } from '../../types';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { UniversalTutorialModal, TutorialStep } from '../UniversalTutorialModal';
import { drawCardSprite } from '../../lib/canvasCardRenderer';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';

interface PokiSnakeVsWormsGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface Point {
  x: number;
  y: number;
}

interface Food {
  x: number;
  y: number;
  type: 'pizza' | 'donut' | 'burger';
  points: number;
  color: string;
}

interface BotWorm {
  id: number;
  x: number;
  y: number;
  angle: number;
  speed: number;
  body: Point[];
  charId: number;
  color: string;
  isAlive: boolean;
}

export const PokiSnakeVsWormsGame: React.FC<PokiSnakeVsWormsGameProps> = ({
  deck = [],
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
  const playerHeroId = deck[0]?.id || 6;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  const [score, setScore] = useState<number>(0);
  const [wormLength, setWormLength] = useState<number>(10);
  const [kills, setKills] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(50);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isVictory, setIsVictory] = useState<boolean>(false);
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_snake_vs_worms') !== 'true';
    } catch {
      return true;
    }
  });

  const stateRef = useRef({
    player: {
      x: 200,
      y: 300,
      angle: 0,
      speed: 3.5,
      isBoosting: false,
      body: [] as Point[],
    },
    targetAngle: 0,
    foods: [] as Food[],
    bots: [] as BotWorm[],
    combo: 0,
  });

  const initGame = useCallback(() => {
    const p = stateRef.current.player;
    p.x = 200;
    p.y = 300;
    p.angle = 0;
    p.speed = 3.5;
    p.isBoosting = false;
    p.body = [];
    for (let i = 0; i < 12; i++) {
      p.body.push({ x: 200 - i * 12, y: 300 });
    }

    // Spawn Foods (pizza, donut, burger)
    const foods: Food[] = [];
    for (let i = 0; i < 35; i++) {
      const fTypes: ('pizza' | 'donut' | 'burger')[] = ['pizza', 'donut', 'burger'];
      const ft = fTypes[Math.floor(Math.random() * fTypes.length)];
      foods.push({
        x: 30 + Math.random() * 320,
        y: 50 + Math.random() * 450,
        type: ft,
        points: ft === 'pizza' ? 15 : (ft === 'burger' ? 25 : 10),
        color: ft === 'pizza' ? '#f97316' : (ft === 'burger' ? '#eab308' : '#ec4899'),
      });
    }

    // Spawn AI bots
    const bots: BotWorm[] = [];
    const botColors = ['#ef4444', '#a855f7', '#06b6d4', '#10b981'];
    const botChars = [102, 108, 114, 120];
    for (let i = 0; i < 4; i++) {
      const bx = 60 + Math.random() * 260;
      const by = 80 + Math.random() * 380;
      const bBody: Point[] = [];
      for (let k = 0; k < 10; k++) {
        bBody.push({ x: bx - k * 10, y: by });
      }
      bots.push({
        id: i + 1,
        x: bx,
        y: by,
        angle: Math.random() * Math.PI * 2,
        speed: 2.6,
        body: bBody,
        charId: botChars[i],
        color: botColors[i],
        isAlive: true,
      });
    }

    stateRef.current.foods = foods;
    stateRef.current.bots = bots;
    setWormLength(12);
    setKills(0);
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  // Timer
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

    const finalScore = score + (victory ? 400 : 80);
    const receipt = calculateAndDepositMissionReward({
      gameId: 'poki_snake_vs_worms',
      gameTitle: isKo ? '스네이크 vs 웜스' : 'Snake vs Worms',
      durationSeconds: 50 - timeLeft,
      score: finalScore,
      maxTargetScore: 1000,
      isVictory: victory,
      difficulty: 'NORMAL',
      comboCount: stateRef.current.combo,
      perfectClear: victory && kills >= 2,
    });

    setSettlementReceipt(receipt);
    onReward(receipt.totalSns);
    if (playSfx) {
      playSfx(victory ? 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3' : 'https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
    }
  }, [score, timeLeft, kills, isKo, onReward, playSfx]);

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
      const foods = stateRef.current.foods;
      const bots = stateRef.current.bots;

      // Player rotation towards targetAngle
      let diff = stateRef.current.targetAngle - p.angle;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      p.angle += diff * 0.18;

      // Current move speed
      const curSpeed = p.isBoosting ? p.speed * 1.6 : p.speed;
      p.x += Math.cos(p.angle) * curSpeed;
      p.y += Math.sin(p.angle) * curSpeed;

      // Boundary bounce/wrap
      p.x = Math.max(12, Math.min(width - 12, p.x));
      p.y = Math.max(12, Math.min(height - 12, p.y));

      // Update player body segments (inverse kinematics / follow)
      p.body.unshift({ x: p.x, y: p.y });
      const targetLen = 10 + Math.floor(score / 30);
      while (p.body.length > targetLen) {
        p.body.pop();
      }
      setWormLength(p.body.length);

      // Eat Food
      for (let i = foods.length - 1; i >= 0; i--) {
        const f = foods[i];
        if (Math.hypot(p.x - f.x, p.y - f.y) < 22) {
          foods.splice(i, 1);
          setScore(s => s + f.points);
          stateRef.current.combo++;
          if (playSfx) playSfx('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');

          // Respawn food
          foods.push({
            x: 20 + Math.random() * (width - 40),
            y: 40 + Math.random() * (height - 80),
            type: f.type,
            points: f.points,
            color: f.color,
          });
          break;
        }
      }

      // Update AI Bots
      for (const b of bots) {
        if (!b.isAlive) continue;

        b.angle += (Math.random() - 0.5) * 0.25;
        b.x += Math.cos(b.angle) * b.speed;
        b.y += Math.sin(b.angle) * b.speed;

        // Bounce walls
        if (b.x < 15 || b.x > width - 15) b.angle = Math.PI - b.angle;
        if (b.y < 15 || b.y > height - 15) b.angle = -b.angle;

        b.body.unshift({ x: b.x, y: b.y });
        while (b.body.length > 12) b.body.pop();

        // Check if Bot hits Player Body -> Bot dies!
        for (let segIdx = 2; segIdx < p.body.length; segIdx++) {
          const seg = p.body[segIdx];
          if (Math.hypot(b.x - seg.x, b.y - seg.y) < 18) {
            b.isAlive = false;
            setKills(k => k + 1);
            setScore(s => s + 250);
            stateRef.current.combo += 3;
            if (playSfx) playSfx('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');

            // Drop feast foods
            b.body.forEach(bp => {
              foods.push({
                x: bp.x,
                y: bp.y,
                type: 'burger',
                points: 30,
                color: '#f59e0b',
              });
            });
            break;
          }
        }

        // Check if Player hits Bot Body -> Player dies!
        if (b.isAlive) {
          for (let segIdx = 2; segIdx < b.body.length; segIdx++) {
            const seg = b.body[segIdx];
            if (Math.hypot(p.x - seg.x, p.y - seg.y) < 16) {
              handleGameOver(false);
              return;
            }
          }
        }
      }

      if (score >= 1000) {
        handleGameOver(true);
        return;
      }

      // ---------------- RENDER ----------------
      ctx.clearRect(0, 0, width, height);

      // Dark honeycomb arena floor
      ctx.fillStyle = '#0b0f19';
      ctx.fillRect(0, 0, width, height);

      // Subtle grid
      ctx.strokeStyle = 'rgba(30, 41, 59, 0.3)';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 28) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += 28) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw Foods
      for (const f of foods) {
        ctx.fillStyle = f.color;
        ctx.beginPath();
        ctx.arc(f.x, f.y, 7, 0, Math.PI * 2);
        ctx.fill();

        // Food icon/emoji
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const em = f.type === 'pizza' ? '🍕' : (f.type === 'burger' ? '🍔' : '🍩');
        ctx.fillText(em, f.x, f.y);
      }

      // Draw Bots Body & Head
      for (const b of bots) {
        if (!b.isAlive) continue;
        ctx.fillStyle = b.color;
        b.body.forEach((seg, sIdx) => {
          if (sIdx > 0) {
            ctx.beginPath();
            ctx.arc(seg.x, seg.y, 9, 0, Math.PI * 2);
            ctx.fill();
          }
        });

        // Bot head card sprite
        drawCardSprite(ctx, b.charId, b.x - 14, b.y - 14, 28, 28, {
          circleClip: true,
          borderWidth: 2,
          borderColor: b.color,
        });
      }

      // Draw Player Worm Body
      ctx.fillStyle = '#38bdf8';
      p.body.forEach((seg, sIdx) => {
        if (sIdx > 0) {
          ctx.beginPath();
          ctx.arc(seg.x, seg.y, 11, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Draw Player Head Sprite (Hero card)
      drawCardSprite(ctx, playerHeroId, p.x - 18, p.y - 18, 36, 36, {
        circleClip: true,
        borderWidth: 2,
        borderColor: p.isBoosting ? '#f59e0b' : '#38bdf8',
        shadowBlur: p.isBoosting ? 12 : 6,
        shadowColor: p.isBoosting ? '#f59e0b' : '#38bdf8',
      });

      animFrameRef.current = requestAnimationFrame(updateAndRender);
    };

    animFrameRef.current = requestAnimationFrame(updateAndRender);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isGameOver, isVictory, showTutorial, score, playerHeroId, handleGameOver]);

  // Touch handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const touchX = e.clientX - rect.left;
    const touchY = e.clientY - rect.top;

    const p = stateRef.current.player;
    stateRef.current.targetAngle = Math.atan2(touchY - p.y, touchX - p.x);
    p.isBoosting = true;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const touchX = e.clientX - rect.left;
    const touchY = e.clientY - rect.top;

    const p = stateRef.current.player;
    stateRef.current.targetAngle = Math.atan2(touchY - p.y, touchX - p.x);
  };

  const handlePointerUp = () => {
    stateRef.current.player.isBoosting = false;
  };

  const tutorialSteps: TutorialStep[] = [
    {
      title: isKo ? '스네이크 vs 웜스 (지렁이 먹방)' : 'Snake vs Worms',
      badge: 'MISSION 06',
      description: isKo
        ? '손가락으로 원하는 방향을 터치/드래그하여 피자, 버거, 도넛을 먹고 몸을 길게 키우세요!'
        : 'Touch or drag to steer your worm and eat pizzas, burgers, and donuts to grow larger!',
      keyPoints: isKo
        ? ['손가락 터치/드래그로 지렁이 조종', '다양한 음식 섭취로 길이 성장', '경계선 충돌 방지']
        : ['Drag finger to steer worm', 'Eat foods to grow longer', 'Avoid arena border collisions'],
    },
    {
      title: isKo ? '부스터 & 상대 막아서기' : 'Boost & Cut Off Enemies',
      badge: 'BOOST BLAST',
      description: isKo
        ? '화면을 꾹 누르면 부스터가 발동합니다. 상대 지렁이의 머리를 내 몸통으로 막아서 폭파시키고 점수를 쓸어 담으세요!'
        : 'Hold down to boost! Cut in front of enemy worms to blast them into delicious feasts.',
      keyPoints: isKo
        ? ['롱 터치 홀드 시 순간 가속 부스터', '상대 지렁이 머리를 몸통으로 차단', '한 손으로 100% 플레이 가능']
        : ['Long touch to activate boost', 'Cut off enemy heads with body', '100% one-hand friendly'],
    }
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-slate-950 flex flex-col items-center select-none overflow-hidden font-mono">
      <MinimalistMissionHUD
        title={isKo ? 'No.06 스네이크 vs 웜스' : 'No.06 Snake vs Worms'}
        currentScore={score}
        targetScore={1000}
        timeLeft={timeLeft}
        stageInfo={`길이: ${wormLength} | 처치: ${kills}마리`}
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

        {/* Control Guide */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none text-center bg-slate-900/80 px-4 py-1.5 rounded-full border border-slate-700/60 backdrop-blur-sm">
          <p className="text-xs text-amber-400 font-bold tracking-wider animate-pulse">
            {isKo ? '👆 드래그: 방향 조종 | ⚡ 홀드: 고속 부스터' : '👆 DRAG: STEER | ⚡ HOLD: SPEED BOOST'}
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
            setTimeLeft(50);
            initGame();
          }}
          language={language}
        />
      )}

      {/* Universal Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          isOpen={showTutorial}
          gameTitle={isKo ? 'No.06 스네이크 vs 웜스' : 'No.06 Snake vs Worms'}
          steps={tutorialSteps}
          onComplete={() => {
            setShowTutorial(false);
            try {
              localStorage.setItem('hero_tutorial_snake_vs_worms', 'true');
            } catch {}
          }}
          language={language}
        />
      )}
    </div>
  );
};
