import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData, Language } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelWaterSlideGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface SlideItem {
  id: number;
  x: number;
  y: number;
  type: 'star' | 'booster' | 'cocktail' | 'rock';
  icon: string;
  points: number;
  radius: number;
  speed: number;
  collected: boolean;
}

export const VoxelWaterSlideGame: React.FC<VoxelWaterSlideGameProps> = ({
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

  const [itemsCollected, setItemsCollected] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [slideCombo, setSlideCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(35);
  const [speedKmh, setSpeedKmh] = useState<number>(75);
  const [feedbackText, setFeedbackText] = useState<string | null>(null);

  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_game_water_slide') !== 'true';
    } catch {
      return true;
    }
  });
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const tubeY = 410;

  const stateRef = useRef({
    tubeX: 180,
    targetTubeX: 180,
    items: [] as SlideItem[],
    itemsCollected: 0,
    score: 0,
    combo: 0,
    maxCombo: 0,
    timeLeft: 35,
    speedKmh: 75,
    isGameOver: false,
    isPaused: false,
    startTime: Date.now(),
    itemCounter: 1,
    spawnTimer: 0,
    waterWaveOffset: 0,
    particles: [] as { x: number; y: number; vx: number; vy: number; color: string; life: number }[],
  });

  const initGame = useCallback(() => {
    const s = stateRef.current;
    s.tubeX = 180;
    s.targetTubeX = 180;
    s.items = [];
    s.itemsCollected = 0;
    s.score = 0;
    s.combo = 0;
    s.maxCombo = 0;
    s.timeLeft = 35;
    s.speedKmh = 75;
    s.isGameOver = false;
    s.startTime = Date.now();
    s.itemCounter = 1;
    s.spawnTimer = 0;
    s.waterWaveOffset = 0;
    s.particles = [];

    // Initial items on water slide
    s.items.push(
      { id: s.itemCounter++, x: 100, y: 120, type: 'star', icon: '⭐', points: 350, radius: 22, speed: 280, collected: false },
      { id: s.itemCounter++, x: 260, y: 200, type: 'booster', icon: '🌀', points: 600, radius: 26, speed: 280, collected: false }
    );

    setItemsCollected(0);
    setScore(0);
    setSlideCombo(0);
    setMaxCombo(0);
    setTimeLeft(35);
    setSpeedKmh(75);
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

  // Direct Touch Drag to Steer Tube
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = stateRef.current;
    if (s.isGameOver || s.isPaused) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;

    const touchX = (e.clientX - rect.left) * scaleX;
    s.targetTubeX = Math.max(45, Math.min(315, touchX));
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = stateRef.current;
    if (s.isGameOver || s.isPaused) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;

    const touchX = (e.clientX - rect.left) * scaleX;
    s.targetTubeX = Math.max(45, Math.min(315, touchX));
  };

  // Main 60FPS Water Slide Loop
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

      // Tube Horizontal Tracking
      s.tubeX += (s.targetTubeX - s.tubeX) * Math.min(1, dt * 22);

      // Water Waves Animation
      s.waterWaveOffset = (s.waterWaveOffset + dt * 450) % 60;

      // Spawn Downward Sliding Items
      s.spawnTimer += dt;
      if (s.spawnTimer > 0.65 && s.items.length < 8) {
        s.spawnTimer = 0;
        const rand = Math.random();
        const isCocktail = rand < 0.18;
        const isBooster = rand >= 0.18 && rand < 0.45;
        const isRock = rand >= 0.45 && rand < 0.65;

        s.items.push({
          id: s.itemCounter++,
          x: 55 + Math.random() * 250,
          y: -30,
          type: isCocktail ? 'cocktail' : (isBooster ? 'booster' : (isRock ? 'rock' : 'star')),
          icon: isCocktail ? '🍹' : (isBooster ? '🌀' : (isRock ? '🪨' : '⭐')),
          points: isCocktail ? 800 : (isBooster ? 600 : (isRock ? -200 : 350)),
          radius: isCocktail ? 26 : (isBooster ? 26 : 22),
          speed: isBooster ? 350 : 300,
          collected: false,
        });
      }

      // Move Items Downward
      for (let i = s.items.length - 1; i >= 0; i--) {
        const item = s.items[i];
        item.y += item.speed * dt;

        // Collision Check with Tube
        if (!item.collected && Math.hypot(item.x - s.tubeX, item.y - tubeY) < item.radius + 20) {
          item.collected = true;

          if (item.type === 'rock') {
            s.score = Math.max(0, s.score - 200);
            s.combo = 0;
            s.speedKmh = Math.max(50, s.speedKmh - 25);
            setScore(s.score);
            setSlideCombo(0);
            setSpeedKmh(s.speedKmh);

            setFeedbackText(isKo ? '장애물 충돌! 감속 💥' : 'ROCK CRASH! 💥');
            playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
          } else {
            s.itemsCollected += 1;
            s.combo += 1;
            if (s.combo > s.maxCombo) s.maxCombo = s.combo;

            const pts = item.points + s.combo * 40;
            s.score += pts;

            if (item.type === 'booster') {
              s.speedKmh = Math.min(130, s.speedKmh + 20);
              setFeedbackText(`🌀 SUPER BOOST! +${pts}P ⚡`);
              playSfx?.('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
            } else if (item.type === 'cocktail') {
              setFeedbackText(`🍹 TROPICAL FIESTA! +${pts}P ✨`);
              playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
            } else {
              setFeedbackText(`GOLD STAR! ⭐ +${pts}P`);
              playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
            }

            setItemsCollected(s.itemsCollected);
            setScore(s.score);
            setSlideCombo(s.combo);
            setMaxCombo(s.maxCombo);
            setSpeedKmh(s.speedKmh);

            // Water Splash Particles
            for (let p = 0; p < 14; p++) {
              s.particles.push({
                x: s.tubeX,
                y: tubeY,
                vx: (Math.random() - 0.5) * 240,
                vy: (Math.random() - 0.5) * 240,
                color: item.type === 'booster' ? '#38bdf8' : '#fde047',
                life: 0.4,
              });
            }
          }

          setTimeout(() => setFeedbackText(null), 300);
        }

        // Out of screen bounds
        if (item.y > 510) {
          s.items.splice(i, 1);
        }
      }

      // Filter collected items
      s.items = s.items.filter((it) => !it.collected);

      // Water Splash Particles behind Tube
      if (Math.random() < 0.4) {
        s.particles.push({
          x: s.tubeX + (Math.random() - 0.5) * 30,
          y: tubeY + 20,
          vx: (Math.random() - 0.5) * 80,
          vy: Math.random() * 120 + 80,
          color: '#e0f2fe',
          life: 0.3,
        });
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

      // Tropical Water Slide Channel Gradient
      const waterGrad = ctx.createLinearGradient(0, 0, 0, h);
      waterGrad.addColorStop(0, '#0284c7');
      waterGrad.addColorStop(0.5, '#0ea5e9');
      waterGrad.addColorStop(1, '#38bdf8');
      ctx.fillStyle = waterGrad;
      ctx.fillRect(0, 0, w, h);

      // Channel Slide Walls
      ctx.fillStyle = '#0369a1';
      ctx.fillRect(0, 0, 30, h);
      ctx.fillRect(w - 30, 0, 30, h);

      // Rapid Water Wave Streams
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.lineWidth = 3;
      for (let y = -60 + s.waterWaveOffset; y < h; y += 60) {
        ctx.beginPath();
        ctx.moveTo(35, y);
        ctx.bezierCurveTo(w / 3, y + 20, (w * 2) / 3, y - 20, w - 35, y);
        ctx.stroke();
      }

      // Render Sliding Items
      s.items.forEach((item) => {
        if (!item.collected) {
          ctx.save();
          ctx.translate(item.x, item.y);
          if (item.type === 'booster') {
            ctx.shadowColor = '#38bdf8';
            ctx.shadowBlur = 18;
          } else if (item.type === 'cocktail') {
            ctx.shadowColor = '#f59e0b';
            ctx.shadowBlur = 18;
          }
          ctx.font = `${item.radius * 1.8}px serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(item.icon, 0, 0);
          ctx.restore();
        }
      });

      // Render Tube Rider Hero (🛟)
      ctx.save();
      ctx.translate(s.tubeX, tubeY);
      ctx.shadowColor = '#fde047';
      ctx.shadowBlur = 20;
      ctx.font = '44px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🛟', 0, 0);
      ctx.restore();

      // Render Particles
      s.particles.forEach((p) => {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, 4, 4);
      });
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [tubeY, isKo, playSfx]);

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
      gameId: 'arcade_water_slide',
      gameTitle: '블리츠 워터 슬라이드',
      durationSeconds: duration,
      score: s.score + (isWin ? 3500 : s.itemsCollected * 300) + s.maxCombo * 40,
      difficulty: 'NIGHTMARE',
      isVictory: isWin || s.itemsCollected >= 8,
    });
    setSettlementReceipt(receipt);
    onReward(receipt.totalSns);
  };

  const tutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 손가락 드래그 워터파크 슬라이딩' : 'STEP 1: DRAG & WATER SLIDE',
      title: isKo ? '튜브를 손가락으로 드래그해 부스터를 타고 아이템을 수집하세요' : 'Drag tube left and right to catch booster rings and stars',
      description: isKo
        ? '가상 조이스틱 없이 화면을 손가락으로 직접 좌우 드래그(Direct Drag)하여 튜브(🛟)를 조종하고 급류를 타며 부스터(🌀), 불가사리(⭐), 칵테일(🍹)을 수집하고 바위(🪨)를 피하세요.'
        : 'Slide your thumb horizontally to steer the tube down the water slide, hitting boosters while avoiding obstacles.',
      keyPoints: isKo
        ? [
            '가상 조이스틱 0개 (100% 손가락 직접 좌우 드래그 조향)',
            '트로피칼 칵테일(🍹) 획득 시 800P 잭팟 대박 보너스',
            '35초간 최대 콤보로 슬라이드를 정복하고 올클리어'
          ]
        : [
            'Zero Virtual Joysticks: 100% Direct Horizontal Drag',
            'Tropical Cocktails (🍹) award 800P fiesta jackpot',
            'Conquer the water channel with continuous combos within 35s'
          ],
      iconType: 'GOAL',
    },
    {
      badge: isKo ? 'STEP 2: 모바일 퓨어 제스처' : 'STEP 2: PURE GESTURES',
      title: isKo ? '화면 직접 좌우 드래그 (Horizontal Drag)' : 'Horizontal Drag Gesture',
      description: isKo
        ? '손가락을 좌우로 부드럽게 밀어 튜브의 수로 위치를 조종합니다.'
        : 'Slide your thumb smoothly left and right along the slide.',
      keyPoints: isKo
        ? [
            '👆 좌우 드래그: 60FPS 즉각 반응 초정밀 슬라이딩',
            '🌀 연속 부스터 통과 시 슬라이드 콤보 배수 보너스',
            '⏱️ 35초 타임어택 고득점 챌린지'
          ]
        : [
            '👆 Horizontal Drag: Instant 60FPS responsive water steering',
            '🌀 Consecutive boosters grant slide combo multipliers',
            '⏱️ 35s time attack water slide sprint'
          ],
      iconType: 'GESTURES',
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '완주 즉시 NIGHTMARE 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Nightmare payout deposited atomically to your LocalStorage wallet upon match finish.',
      keyPoints: isKo
        ? [
            '완료 즉시 LocalStorage 영구 지갑 입금',
            '수집한 아이템 수 및 부스터 속도 비례 대량 잭팟',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Collected items count and booster multipliers',
            'VictoryRewardModal golden coin fanfare'
          ],
      iconType: 'REWARDS',
    },
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-[#0284c7] text-white font-mono select-none flex flex-col overflow-hidden items-center justify-between touch-none">
      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '블리츠 워터 슬라이드' : 'Blitz Water Slide'}
        language={(language as Language) || 'ko'}
        telemetries={[
          { label: isKo ? '수집' : 'Items', value: `${itemsCollected}개`, color: 'text-amber-400 font-bold' },
          { label: isKo ? '속도' : 'Speed', value: `${speedKmh}km/h`, color: 'text-cyan-200 font-bold' },
          { label: isKo ? '시간' : 'Time', value: `${timeLeft}s`, color: timeLeft <= 10 ? 'text-rose-500 font-bold animate-pulse' : 'text-white font-bold' },
          { label: isKo ? '점수' : 'Score', value: `${score}P`, color: 'text-amber-300 font-bold' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => setIsPaused(prev => !prev)}
        isPaused={isPaused}
      />

      {/* Pure Touch Water Slide Canvas Viewport */}
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
          {isKo ? '손가락으로 튜브를 좌우 드래그해 부스터를 타고 아이템을 수집하세요' : 'Drag tube left & right to catch boosters and items'}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="arcade_water_slide"
          gameTitle={isKo ? '블리츠 워터: 슬라이딩 서핑' : 'Blitz Water: Slide Surfing'}
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
export default VoxelWaterSlideGame;
