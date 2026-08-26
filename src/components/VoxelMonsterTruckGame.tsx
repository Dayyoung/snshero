import { drawCardSprite } from '../lib/canvasCardRenderer';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData, Language } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelMonsterTruckGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface ArenaObstacle {
  id: number;
  x: number;
  y: number;
  type: 'scrap_car' | 'barrel' | 'ramp' | 'nitro';
  cardId: number;
  icon: string;
  isCrushed: boolean;
  points: number;
}

export const VoxelMonsterTruckGame: React.FC<VoxelMonsterTruckGameProps> = ({
  deck = [],
  language = 'ko',
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
  const playerHeroId = deck[0]?.id || 74;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  const [carsCrushed, setCarsCrushed] = useState<number>(0);
  const [stuntsLanded, setStuntsLanded] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [crushCombo, setCrushCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(35);
  const [feedbackText, setFeedbackText] = useState<string | null>(null);

  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_game_monster_truck') !== 'true';
    } catch {
      return true;
    }
  });
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const stateRef = useRef({
    truckX: 180,
    targetX: 180,
    truckY: 420,
    speed: 130,
    jumpTimer: 0,
    nitroTimer: 0,
    carsCrushed: 0,
    stuntsLanded: 0,
    score: 0,
    combo: 0,
    maxCombo: 0,
    timeLeft: 35,
    isGameOver: false,
    isPaused: false,
    startTime: Date.now(),
    obstacles: [] as ArenaObstacle[],
    obsCounter: 1,
    spawnTimer: 0,
    particles: [] as { x: number; y: number; vx: number; vy: number; color: string; life: number }[],
  });

  const initGame = useCallback(() => {
    const s = stateRef.current;
    s.truckX = 180;
    s.targetX = 180;
    s.truckY = 420;
    s.speed = 130;
    s.jumpTimer = 0;
    s.nitroTimer = 0;
    s.carsCrushed = 0;
    s.stuntsLanded = 0;
    s.score = 0;
    s.combo = 0;
    s.maxCombo = 0;
    s.timeLeft = 35;
    s.isGameOver = false;
    s.startTime = Date.now();
    s.obstacles = [];
    s.obsCounter = 1;
    s.spawnTimer = 0;
    s.particles = [];

    setCarsCrushed(0);
    setStuntsLanded(0);
    setScore(0);
    setCrushCombo(0);
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

  // Touch Handlers: Direct Horizontal Finger Drag (Zero Joysticks)
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = stateRef.current;
    if (s.isGameOver || s.isPaused) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;

    s.targetX = Math.max(50, Math.min(310, (e.clientX - rect.left) * scaleX));
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = stateRef.current;
    if (s.isGameOver || s.isPaused) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;

    s.targetX = Math.max(50, Math.min(310, (e.clientX - rect.left) * scaleX));
  };

  // Main 60FPS Monster Truck Crushing Loop
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

      // Smooth Steering towards Finger
      s.truckX += (s.targetX - s.truckX) * Math.min(1, dt * 18);

      // Handle Nitro & Jump Stunt
      if (s.nitroTimer > 0) {
        s.nitroTimer -= dt;
        s.speed = 220;
      } else {
        s.speed = 130;
      }

      if (s.jumpTimer > 0) {
        s.jumpTimer -= dt;
      }

      // Spawn Obstacles & Scrap Cars
      s.spawnTimer += dt;
      if (s.spawnTimer > 0.6) {
        s.spawnTimer = 0;
        const rand = Math.random();
        let type: 'scrap_car' | 'barrel' | 'ramp' | 'nitro' = 'scrap_car';
        let cardId = 46;
        let icon = '🚗';
        let points = 250;

        if (rand < 0.45) {
          type = 'scrap_car';
          cardId = 46;
          icon = '🚗';
          points = 250;
        } else if (rand < 0.65) {
          type = 'barrel';
          cardId = 17;
          icon = '🛢️';
          points = 150;
        } else if (rand < 0.85) {
          type = 'ramp';
          cardId = 34;
          icon = '🚀';
          points = 600;
        } else {
          type = 'nitro';
          cardId = 48;
          icon = '⚡';
          points = 300;
        }

        s.obstacles.push({
          id: s.obsCounter++,
          x: 60 + Math.random() * 240,
          y: -30,
          type,
          cardId,
          icon,
          isCrushed: false,
          points,
        });
      }

      // Move Obstacles
      const scrollSpeed = s.speed * 2.8;
      for (let i = s.obstacles.length - 1; i >= 0; i--) {
        const obs = s.obstacles[i];
        obs.y += scrollSpeed * dt;

        // Collision Check with Truck (truck at 180, 420, radius 26)
        if (!obs.isCrushed && Math.hypot(obs.x - s.truckX, obs.y - s.truckY) < 36) {
          obs.isCrushed = true;

          if (obs.type === 'ramp') {
            s.jumpTimer = 1.4;
            s.stuntsLanded += 1;
            s.combo += 1;
            if (s.combo > s.maxCombo) s.maxCombo = s.combo;

            const pts = obs.points + s.combo * 40;
            s.score += pts;

            setStuntsLanded(s.stuntsLanded);
            setScore(s.score);
            setCrushCombo(s.combo);
            setMaxCombo(s.maxCombo);

            setFeedbackText(`🚀 AIR STUNT! +${pts}P 🚀`);
            playSfx?.('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
            setTimeout(() => setFeedbackText(null), 400);

            // Stunt Sparkles
            for (let p = 0; p < 12; p++) {
              s.particles.push({
                x: s.truckX,
                y: s.truckY,
                vx: (Math.random() - 0.5) * 250,
                vy: (Math.random() - 0.5) * 250,
                color: '#fde047',
                life: 0.6,
              });
            }
          } else if (obs.type === 'scrap_car' || obs.type === 'barrel') {
            s.carsCrushed += 1;
            s.combo += 1;
            if (s.combo > s.maxCombo) s.maxCombo = s.combo;

            const pts = obs.points + s.combo * 25;
            s.score += pts;

            setCarsCrushed(s.carsCrushed);
            setScore(s.score);
            setCrushCombo(s.combo);
            setMaxCombo(s.maxCombo);

            setFeedbackText(`CRUSHED! +${pts}P 💥`);
            playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
            setTimeout(() => setFeedbackText(null), 300);

            // Explosion Debris
            for (let p = 0; p < 8; p++) {
              s.particles.push({
                x: obs.x,
                y: obs.y,
                vx: (Math.random() - 0.5) * 200,
                vy: (Math.random() - 0.5) * 200,
                color: '#f97316',
                life: 0.5,
              });
            }
          } else if (obs.type === 'nitro') {
            s.nitroTimer = 2.0;
            s.combo += 1;
            if (s.combo > s.maxCombo) s.maxCombo = s.combo;

            const pts = obs.points + s.combo * 30;
            s.score += pts;

            setScore(s.score);
            setCrushCombo(s.combo);
            setMaxCombo(s.maxCombo);

            setFeedbackText(`⚡ NITRO BURST! +${pts}P ⚡`);
            playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
            setTimeout(() => setFeedbackText(null), 350);
          }
        }

        if (obs.y > 530) {
          s.obstacles.splice(i, 1);
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

      // Monster Truck Arena Dirt Track
      ctx.fillStyle = '#451a03';
      ctx.fillRect(0, 0, w, h);

      // Arena Mud Tyre Tracks
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.lineWidth = 14;
      [80, 150, 220, 290].forEach((tx) => {
        ctx.beginPath();
        ctx.moveTo(tx, 0);
        ctx.lineTo(tx, h);
        ctx.stroke();
      });

      // Render Obstacles (Card Sprites)
      s.obstacles.forEach((obs) => {
        if (!obs.isCrushed) {
          ctx.save();
          ctx.translate(obs.x, obs.y);

          drawCardSprite(
            ctx,
            obs.cardId,
            -16,
            -16,
            32,
            32,
            {
              circleClip: true,
              borderWidth: 1.5,
              borderColor: obs.type === 'nitro' ? '#38bdf8' : obs.type === 'ramp' ? '#fde047' : '#ef4444',
              shadowBlur: obs.type === 'nitro' || obs.type === 'ramp' ? 8 : 4,
              shadowColor: obs.type === 'nitro' ? 'rgba(56, 189, 248, 0.8)' : obs.type === 'ramp' ? 'rgba(253, 224, 71, 0.8)' : 'rgba(239, 68, 68, 0.8)',
            }
          );

          ctx.restore();
        }
      });

      // Render Monster Truck (Card Sprite)
      ctx.save();
      ctx.translate(s.truckX, s.truckY);

      if (s.jumpTimer > 0) {
        ctx.scale(1.35, 1.35);
      }

      drawCardSprite(ctx, playerHeroId, -24, -24, 48, 48, {
        circleClip: true,
        borderWidth: 2,
        borderColor: s.jumpTimer > 0 ? '#fde047' : s.nitroTimer > 0 ? '#38bdf8' : '#ffffff',
        shadowBlur: s.jumpTimer > 0 ? 25 : s.nitroTimer > 0 ? 20 : 10,
        shadowColor: s.jumpTimer > 0 ? 'rgba(253, 224, 71, 0.9)' : s.nitroTimer > 0 ? 'rgba(56, 189, 248, 0.9)' : 'rgba(255, 255, 255, 0.7)',
      });
      ctx.restore();

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
      gameId: 'arcade_monster_truck',
      gameTitle: '블리츠 몬스터 트럭',
      durationSeconds: duration,
      score: s.score + (isWin ? 3500 : (s.carsCrushed * 150 + s.stuntsLanded * 400)) + s.maxCombo * 40,
      difficulty: 'NIGHTMARE',
      isVictory: isWin || s.carsCrushed >= 15,
    });
    setSettlementReceipt(receipt);
    onReward(receipt.totalSns);
  };

  const tutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 손가락 드래그 폐차 압쇄' : 'STEP 1: DRAG CAR CRUSHING',
      title: isKo ? '트럭을 드래그해 폐차를 짓밟고 점프 램프를 타세요' : 'Drag Monster Truck to Crush Scrap Cars & Hit Ramps',
      description: isKo
        ? '가상 조이스틱 없이 몬스터 트럭(🛻)을 손가락으로 화면에서 직접 좌우 드래그하여 다가오는 폐차(🚗)와 드럼통(🛢️)을 깔아뭉개 박살내고, 슈퍼 램프(🚀)를 타서 공중 스턴을 날리세요.'
        : 'Drag the monster truck left & right to crush scrap cars and hit jump ramps for huge stunt points.',
      keyPoints: isKo
        ? [
            '가상 조이스틱 0개 (100% 손가락 직접 좌우 드래그 조향)',
            '슈퍼 램프(🚀) 점프 시 600P 공중 회전 스턴 잭팟',
            '35초간 최대 콤보로 폐차를 파쇄하고 올클리어'
          ]
        : [
            'Zero Virtual Joysticks: 100% Direct Horizontal Finger Drag',
            'Super Ramps (🚀) launch high air stunt for 600P jackpot',
            'Crush cars and chain combos within 35s'
          ],
      iconType: 'GOAL',
    },
    {
      badge: isKo ? 'STEP 2: 모바일 퓨어 제스처' : 'STEP 2: PURE GESTURES',
      title: isKo ? '화면 좌우 직접 드래그 (Horizontal Drag)' : 'Horizontal Drag Gesture',
      description: isKo
        ? '손가락을 대고 원하는 위치로 트럭을 신속하게 이끕니다.'
        : 'Slide your thumb left and right seamlessly across the dirt arena.',
      keyPoints: isKo
        ? [
            '👆 좌우 드래그: 실시간 즉각 반응 몬스터 트럭 조향',
            '💥 폐차 연속 파쇄 시 크러시 콤보 배수 보너스',
            '⏱️ 35초 타임어택 고득점 챌린지'
          ]
        : [
            '👆 Horizontal Drag: Instant fluid truck steering response',
            '💥 Consecutive car crushes trigger escalating combo multipliers',
            '⏱️ 35s time attack monster truck sprint'
          ],
      iconType: 'GESTURES',
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '쇼 완료 즉시 NIGHTMARE 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Nightmare payout deposited atomically to your LocalStorage wallet upon match finish.',
      keyPoints: isKo
        ? [
            '완료 즉시 LocalStorage 영구 지갑 입금',
            '파쇄한 폐차 수 및 공중 스턴 비례 대량 잭팟',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Crushed scrap cars and air stunts multipliers',
            'VictoryRewardModal golden coin fanfare'
          ],
      iconType: 'REWARDS',
    },
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-[#451a03] text-white font-mono select-none flex flex-col overflow-hidden items-center justify-between touch-none">
      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '블리츠 몬스터 트럭' : 'Blitz Monster Truck'}
        language={(language as Language) || 'ko'}
        telemetries={[
          { label: isKo ? '폐차' : 'Crushed', value: `${carsCrushed}대`, color: 'text-amber-400 font-bold' },
          { label: isKo ? '스턴트' : 'Stunts', value: `${stuntsLanded}회`, color: 'text-cyan-300 font-bold' },
          { label: isKo ? '시간' : 'Time', value: `${timeLeft}s`, color: timeLeft <= 10 ? 'text-rose-500 font-bold animate-pulse' : 'text-cyan-400 font-bold' },
          { label: isKo ? '점수' : 'Score', value: `${score}P`, color: 'text-amber-300 font-bold' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => setIsPaused(prev => !prev)}
        isPaused={isPaused}
      />

      {/* Pure Touch Monster Truck Canvas Viewport */}
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
          {isKo ? '손가락으로 트럭을 좌우 드래그해 폐차를 짓밟고 점프 램프를 타세요' : 'Drag truck left & right to crush scrap cars and launch off ramps'}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="arcade_monster_truck"
          gameTitle={isKo ? '블리츠 트럭: 몬스터 크러시' : 'Blitz Truck: Monster Crush'}
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
export default VoxelMonsterTruckGame;
