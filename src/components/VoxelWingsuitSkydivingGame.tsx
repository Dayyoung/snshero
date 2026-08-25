import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData, Language } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelWingsuitSkydivingGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface SkyItem {
  id: number;
  x: number;
  y: number;
  type: 'ring' | 'feather' | 'balloon' | 'storm';
  icon: string;
  points: number;
  radius: number;
  speed: number;
  collected: boolean;
}

export const VoxelWingsuitSkydivingGame: React.FC<VoxelWingsuitSkydivingGameProps> = ({
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

  const [ringsPassed, setRingsPassed] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [skyCombo, setSkyCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(35);
  const [speedKmh, setSpeedKmh] = useState<number>(180);
  const [feedbackText, setFeedbackText] = useState<string | null>(null);

  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_game_wingsuit') !== 'true';
    } catch {
      return true;
    }
  });
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const stateRef = useRef({
    diverX: 180,
    diverY: 380,
    targetDiverX: 180,
    targetDiverY: 380,
    items: [] as SkyItem[],
    ringsPassed: 0,
    score: 0,
    combo: 0,
    maxCombo: 0,
    timeLeft: 35,
    speedKmh: 180,
    isGameOver: false,
    isPaused: false,
    startTime: Date.now(),
    itemCounter: 1,
    spawnTimer: 0,
    cloudOffset: 0,
    particles: [] as { x: number; y: number; vx: number; vy: number; color: string; life: number }[],
  });

  const initGame = useCallback(() => {
    const s = stateRef.current;
    s.diverX = 180;
    s.diverY = 380;
    s.targetDiverX = 180;
    s.targetDiverY = 380;
    s.items = [];
    s.ringsPassed = 0;
    s.score = 0;
    s.combo = 0;
    s.maxCombo = 0;
    s.timeLeft = 35;
    s.speedKmh = 180;
    s.isGameOver = false;
    s.startTime = Date.now();
    s.itemCounter = 1;
    s.spawnTimer = 0;
    s.cloudOffset = 0;
    s.particles = [];

    // Initial Sky Items
    s.items.push(
      { id: s.itemCounter++, x: 120, y: 120, type: 'ring', icon: '🌀', points: 600, radius: 28, speed: 320, collected: false },
      { id: s.itemCounter++, x: 240, y: 220, type: 'feather', icon: '🪶', points: 400, radius: 22, speed: 300, collected: false }
    );

    setRingsPassed(0);
    setScore(0);
    setSkyCombo(0);
    setMaxCombo(0);
    setTimeLeft(35);
    setSpeedKmh(180);
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

  // Direct Touch Drag to Control Wingsuit Diver
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = stateRef.current;
    if (s.isGameOver || s.isPaused) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    s.targetDiverX = Math.max(35, Math.min(325, (e.clientX - rect.left) * scaleX));
    s.targetDiverY = Math.max(80, Math.min(450, (e.clientY - rect.top) * scaleY));
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = stateRef.current;
    if (s.isGameOver || s.isPaused) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    s.targetDiverX = Math.max(35, Math.min(325, (e.clientX - rect.left) * scaleX));
    s.targetDiverY = Math.max(80, Math.min(450, (e.clientY - rect.top) * scaleY));
  };

  // Main 60FPS Wingsuit Loop
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

      // 2D Diver Movement Tracking
      s.diverX += (s.targetDiverX - s.diverX) * Math.min(1, dt * 20);
      s.diverY += (s.targetDiverY - s.diverY) * Math.min(1, dt * 20);

      // Cloud Streaming Animation
      s.cloudOffset = (s.cloudOffset + dt * 600) % 80;

      // Spawn Sky Items
      s.spawnTimer += dt;
      if (s.spawnTimer > 0.65 && s.items.length < 8) {
        s.spawnTimer = 0;
        const rand = Math.random();
        const isBalloon = rand < 0.18;
        const isRing = rand >= 0.18 && rand < 0.5;
        const isStorm = rand >= 0.5 && rand < 0.7;

        s.items.push({
          id: s.itemCounter++,
          x: 45 + Math.random() * 270,
          y: -30,
          type: isBalloon ? 'balloon' : (isRing ? 'ring' : (isStorm ? 'storm' : 'feather')),
          icon: isBalloon ? '🎈' : (isRing ? '🌀' : (isStorm ? '⚡' : '🪶')),
          points: isBalloon ? 800 : (isRing ? 600 : (isStorm ? -200 : 400)),
          radius: isBalloon ? 26 : (isRing ? 28 : 22),
          speed: isRing ? 360 : 310,
          collected: false,
        });
      }

      // Move Items Downward
      for (let i = s.items.length - 1; i >= 0; i--) {
        const item = s.items[i];
        item.y += item.speed * dt;

        // Collision Check with Diver
        if (!item.collected && Math.hypot(item.x - s.diverX, item.y - s.diverY) < item.radius + 20) {
          item.collected = true;

          if (item.type === 'storm') {
            s.score = Math.max(0, s.score - 200);
            s.combo = 0;
            s.speedKmh = Math.max(120, s.speedKmh - 30);
            setScore(s.score);
            setSkyCombo(0);
            setSpeedKmh(s.speedKmh);

            setFeedbackText(isKo ? '낙뢰 난기류 충격! ⚡' : 'LIGHTNING HIT! ⚡');
            playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
          } else {
            s.ringsPassed += 1;
            s.combo += 1;
            if (s.combo > s.maxCombo) s.maxCombo = s.combo;

            const pts = item.points + s.combo * 40;
            s.score += pts;

            if (item.type === 'ring') {
              s.speedKmh = Math.min(260, s.speedKmh + 20);
              setFeedbackText(`🌀 SUPER RING! +${pts}P ⚡`);
              playSfx?.('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
            } else if (item.type === 'balloon') {
              setFeedbackText(`🎈 PRIZE BALLOON! +${pts}P ✨`);
              playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
            } else {
              setFeedbackText(`GOLD FEATHER! 🪶 +${pts}P`);
              playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
            }

            setRingsPassed(s.ringsPassed);
            setScore(s.score);
            setSkyCombo(s.combo);
            setMaxCombo(s.maxCombo);
            setSpeedKmh(s.speedKmh);

            // Cloud Stream Particles
            for (let p = 0; p < 14; p++) {
              s.particles.push({
                x: s.diverX,
                y: s.diverY,
                vx: (Math.random() - 0.5) * 240,
                vy: (Math.random() - 0.5) * 240,
                color: item.type === 'ring' ? '#38bdf8' : '#fde047',
                life: 0.4,
              });
            }
          }

          setTimeout(() => setFeedbackText(null), 300);
        }

        // Out of screen
        if (item.y > 510) {
          s.items.splice(i, 1);
        }
      }

      // Filter collected
      s.items = s.items.filter((it) => !it.collected);

      // Wind Vapor Stream Particles behind Diver
      if (Math.random() < 0.4) {
        s.particles.push({
          x: s.diverX + (Math.random() - 0.5) * 24,
          y: s.diverY + 20,
          vx: (Math.random() - 0.5) * 60,
          vy: Math.random() * 150 + 100,
          color: '#ffffff',
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

      // Deep Azure Sky Gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
      skyGrad.addColorStop(0, '#0369a1');
      skyGrad.addColorStop(0.5, '#0284c7');
      skyGrad.addColorStop(1, '#38bdf8');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h);

      // Fast Streaming Cloud Lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 2.5;
      for (let x = 40; x < w; x += 70) {
        ctx.beginPath();
        ctx.moveTo(x, -80 + s.cloudOffset);
        ctx.lineTo(x, h + 80);
        ctx.stroke();
      }

      // Render Sky Items
      s.items.forEach((item) => {
        if (!item.collected) {
          ctx.save();
          ctx.translate(item.x, item.y);
          if (item.type === 'ring') {
            ctx.shadowColor = '#38bdf8';
            ctx.shadowBlur = 20;
          } else if (item.type === 'balloon') {
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

      // Render Wingsuit Glider Hero (🪂)
      ctx.save();
      ctx.translate(s.diverX, s.diverY);
      ctx.shadowColor = '#fde047';
      ctx.shadowBlur = 20;
      ctx.font = '44px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🪂', 0, 0);
      ctx.restore();

      // Render Particles
      s.particles.forEach((p) => {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, 4, 4);
      });
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [isKo, playSfx]);

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
      gameId: 'arcade_wingsuit_skydiving',
      gameTitle: '블리츠 윙슈트',
      durationSeconds: duration,
      score: s.score + (isWin ? 3500 : s.ringsPassed * 300) + s.maxCombo * 40,
      difficulty: 'NIGHTMARE',
      isVictory: isWin || s.ringsPassed >= 8,
    });
    setSettlementReceipt(receipt);
    onReward(receipt.totalSns);
  };

  const tutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 손가락 드래그 고공 윙슈트 활강' : 'STEP 1: DRAG & WINGSUIT GLIDE',
      title: isKo ? '다이버를 손가락으로 드래그해 링을 통과하고 아이템을 수집하세요' : 'Drag wingsuit diver to pass through sonic rings and catch items',
      description: isKo
        ? '가상 조이스틱 없이 화면의 다이버(🪂)를 손가락으로 직접 자유 드래그(Direct Drag)하여 초음속 윈드 링(🌀), 황금 깃털(🪶), 보물 벌룬(🎈)을 수집하고 낙뢰(⚡)를 회피하세요.'
        : 'Slide your finger freely to guide the wingsuit diver through wind rings while dodging storms.',
      keyPoints: isKo
        ? [
            '가상 조이스틱 0개 (100% 손가락 직접 2D 드래그 기동)',
            '보물 벌룬(🎈) 획득 시 800P 잭팟 대박 보너스',
            '35초간 최대 콤보로 창공을 비행하고 올클리어'
          ]
        : [
            'Zero Virtual Joysticks: 100% Direct 2D Drag Flight',
            'Prize Balloons (🎈) award 800P massive sky jackpot',
            'Soar through the azure skies with continuous combos within 35s'
          ],
      iconType: 'GOAL',
    },
    {
      badge: isKo ? 'STEP 2: 모바일 퓨어 제스처' : 'STEP 2: PURE GESTURES',
      title: isKo ? '화면 직접 자유 드래그 (Direct Finger Drag)' : 'Direct Drag Gesture',
      description: isKo
        ? '손가락을 상하좌우로 부드럽게 밀어 다이버의 비행 궤적을 조종합니다.'
        : 'Slide your thumb smoothly anywhere across the screen.',
      keyPoints: isKo
        ? [
            '👆 자유 드래그: 60FPS 즉각 반응 초정밀 고공 활강',
            '🌀 연속 링 통과 시 윙슈트 콤보 배수 보너스',
            '⏱️ 35초 타임어택 고득점 챌린지'
          ]
        : [
            '👆 Free Drag: Instant 60FPS responsive aerial steering',
            '🌀 Consecutive rings grant wingsuit combo multipliers',
            '⏱️ 35s time attack wingsuit skydiving sprint'
          ],
      iconType: 'GESTURES',
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '활강 완료 즉시 NIGHTMARE 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Nightmare payout deposited atomically to your LocalStorage wallet upon match finish.',
      keyPoints: isKo
        ? [
            '완료 즉시 LocalStorage 영구 지갑 입금',
            '통과한 링 수 및 최고 속도 비례 대량 잭팟',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Passed rings count and top speed multipliers',
            'VictoryRewardModal golden coin fanfare'
          ],
      iconType: 'REWARDS',
    },
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-[#0369a1] text-white font-mono select-none flex flex-col overflow-hidden items-center justify-between touch-none">
      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '블리츠 윙슈트' : 'Blitz Wingsuit'}
        language={(language as Language) || 'ko'}
        telemetries={[
          { label: isKo ? '링' : 'Rings', value: `${ringsPassed}개`, color: 'text-amber-400 font-bold' },
          { label: isKo ? '속도' : 'Speed', value: `${speedKmh}km/h`, color: 'text-cyan-200 font-bold' },
          { label: isKo ? '시간' : 'Time', value: `${timeLeft}s`, color: timeLeft <= 10 ? 'text-rose-500 font-bold animate-pulse' : 'text-white font-bold' },
          { label: isKo ? '점수' : 'Score', value: `${score}P`, color: 'text-amber-300 font-bold' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => setIsPaused(prev => !prev)}
        isPaused={isPaused}
      />

      {/* Pure Touch Wingsuit Canvas Viewport */}
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
          {isKo ? '손가락으로 다이버를 드래그해 링을 통과하고 아이템을 수집하세요' : 'Drag wingsuit diver to pass rings and collect items'}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="arcade_wingsuit_skydiving"
          gameTitle={isKo ? '블리츠 윙슈트: 고공 활강' : 'Blitz Wingsuit: Sky Gliding'}
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
export default VoxelWingsuitSkydivingGame;
