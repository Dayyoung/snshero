import { drawCardSprite } from '../lib/canvasCardRenderer';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData, Language } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelTerraQuakeGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface QuakeHazard {
  id: number;
  x: number;
  y: number;
  type: 'fissure' | 'rock' | 'gem' | 'chest';
  cardId: number;
  icon: string;
  points: number;
  radius: number;
  collected: boolean;
}

export const VoxelTerraQuakeGame: React.FC<VoxelTerraQuakeGameProps> = ({
  deck = [],
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
  const playerHeroId = deck[0]?.id || 106;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  const [gemsCollected, setGemsCollected] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [quakeCombo, setQuakeCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(35);
  const [feedbackText, setFeedbackText] = useState<string | null>(null);

  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_game_terra_quake') !== 'true';
    } catch {
      return true;
    }
  });
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const stateRef = useRef({
    survivorX: 180,
    survivorY: 260,
    targetX: 180,
    targetY: 260,
    hazards: [] as QuakeHazard[],
    gemsCollected: 0,
    score: 0,
    combo: 0,
    maxCombo: 0,
    timeLeft: 35,
    isGameOver: false,
    isPaused: false,
    startTime: Date.now(),
    hazardCounter: 1,
    spawnTimer: 0,
    quakeIntensity: 0,
    particles: [] as { x: number; y: number; vx: number; vy: number; color: string; life: number }[],
  });

  const initGame = useCallback(() => {
    const s = stateRef.current;
    s.survivorX = 180;
    s.survivorY = 260;
    s.targetX = 180;
    s.targetY = 260;
    s.hazards = [];
    s.gemsCollected = 0;
    s.score = 0;
    s.combo = 0;
    s.maxCombo = 0;
    s.timeLeft = 35;
    s.isGameOver = false;
    s.startTime = Date.now();
    s.hazardCounter = 1;
    s.spawnTimer = 0;
    s.quakeIntensity = 0;
    s.particles = [];

    // Initial Hazards and Gems
    s.hazards.push(
      { id: s.hazardCounter++, x: 100, y: 160, type: 'gem', cardId: 100, icon: '💎', points: 350, radius: 22, collected: false },
      { id: s.hazardCounter++, x: 260, y: 340, type: 'chest', cardId: 58, icon: '📦', points: 800, radius: 26, collected: false }
    );

    setGemsCollected(0);
    setScore(0);
    setQuakeCombo(0);
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
          const isTargetMet = stateRef.current.gemsCollected >= 8;
          endGame(isTargetMet);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isGameOver, isPaused]);

  // Direct Finger Drag Handlers (Zero Joysticks)
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = stateRef.current;
    if (s.isGameOver || s.isPaused) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    s.targetX = Math.max(35, Math.min(325, (e.clientX - rect.left) * scaleX));
    s.targetY = Math.max(50, Math.min(450, (e.clientY - rect.top) * scaleY));
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = stateRef.current;
    if (s.isGameOver || s.isPaused) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    s.targetX = Math.max(35, Math.min(325, (e.clientX - rect.left) * scaleX));
    s.targetY = Math.max(50, Math.min(450, (e.clientY - rect.top) * scaleY));
  };

  // Main 60FPS Terra Quake Loop
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

      // Survivor Movement Tracking
      s.survivorX += (s.targetX - s.survivorX) * Math.min(1, dt * 20);
      s.survivorY += (s.targetY - s.survivorY) * Math.min(1, dt * 20);

      // Quake Tremble Effect
      s.quakeIntensity = Math.sin(now * 0.02) * 3;

      // Spawn Hazards & Items
      s.spawnTimer += dt;
      if (s.spawnTimer > 0.75 && s.hazards.length < 7) {
        s.spawnTimer = 0;
        const rand = Math.random();
        const isChest = rand < 0.15;
        const isGem = rand >= 0.15 && rand < 0.45;
        const isFissure = rand >= 0.45 && rand < 0.75;
        const cardId = isChest ? 58 : (isGem ? 100 : (isFissure ? 78 : 34));

        s.hazards.push({
          id: s.hazardCounter++,
          x: 45 + Math.random() * 270,
          y: 60 + Math.random() * 380,
          type: isChest ? 'chest' : (isGem ? 'gem' : (isFissure ? 'fissure' : 'rock')),
          cardId,
          icon: isChest ? '📦' : (isGem ? '💎' : (isFissure ? '🕳️' : '🪨')),
          points: isChest ? 800 : (isGem ? 350 : -250),
          radius: isChest ? 26 : (isGem ? 22 : 24),
          collected: false,
        });
      }

      // Check Collision with Hazards & Items
      for (let i = s.hazards.length - 1; i >= 0; i--) {
        const h = s.hazards[i];
        const dist = Math.hypot(h.x - s.survivorX, h.y - s.survivorY);

        if (!h.collected && dist < h.radius + 18) {
          h.collected = true;

          if (h.type === 'rock' || h.type === 'fissure') {
            // Hazard hit
            s.score = Math.max(0, s.score - 250);
            s.combo = 0;
            setScore(s.score);
            setQuakeCombo(0);

            setFeedbackText(isKo ? '지진 균열 충격! 💥' : 'QUAKE CRACK! 💥');
            playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
            setTimeout(() => setFeedbackText(null), 300);

            // Dust particles
            for (let p = 0; p < 10; p++) {
              s.particles.push({
                x: h.x,
                y: h.y,
                vx: (Math.random() - 0.5) * 200,
                vy: (Math.random() - 0.5) * 200,
                color: '#78716c',
                life: 0.4,
              });
            }
          } else {
            // Gem or Chest Collected
            s.gemsCollected += 1;
            s.combo += 1;
            if (s.combo > s.maxCombo) s.maxCombo = s.combo;

            const pts = h.points + s.combo * 40;
            s.score += pts;

            setGemsCollected(s.gemsCollected);
            setScore(s.score);
            setQuakeCombo(s.combo);
            setMaxCombo(s.maxCombo);

            if (h.type === 'chest') {
              setFeedbackText(`📦 ANCIENT CHEST! +${pts}P ⚡`);
              playSfx?.('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
            } else {
              setFeedbackText(`CRYSTAL! 💎 +${pts}P`);
              playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
            }
            setTimeout(() => setFeedbackText(null), 300);

            // Sparkles
            for (let p = 0; p < 12; p++) {
              s.particles.push({
                x: h.x,
                y: h.y,
                vx: (Math.random() - 0.5) * 220,
                vy: (Math.random() - 0.5) * 220,
                color: h.type === 'chest' ? '#f59e0b' : '#38bdf8',
                life: 0.5,
              });
            }
          }

          s.hazards.splice(i, 1);
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

      // Quake Terrain Ground Gradient
      const groundGrad = ctx.createLinearGradient(0, 0, 0, h);
      groundGrad.addColorStop(0, '#1c1917');
      groundGrad.addColorStop(0.5, '#292524');
      groundGrad.addColorStop(1, '#451a03');
      ctx.fillStyle = groundGrad;
      ctx.fillRect(0, 0, w, h);

      // Cracked Earth Grid
      ctx.save();
      ctx.translate(s.quakeIntensity, 0);
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.25)';
      ctx.lineWidth = 2;
      for (let x = 40; x < w; x += 60) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 40; y < h; y += 60) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
      ctx.restore();

      // Render Hazards & Items (Card Sprites)
      s.hazards.forEach((haz) => {
        if (!haz.collected) {
          ctx.save();
          ctx.translate(haz.x, haz.y);

          drawCardSprite(
            ctx,
            haz.cardId,
            -haz.radius,
            -haz.radius,
            haz.radius * 2,
            haz.radius * 2,
            {
              circleClip: true,
              borderWidth: 1.5,
              borderColor: haz.type === 'chest' ? '#f59e0b' : (haz.type === 'gem' ? '#06b6d4' : '#ef4444'),
              shadowBlur: haz.type === 'chest' || haz.type === 'gem' ? 16 : 6,
              shadowColor: haz.type === 'chest' ? 'rgba(245, 158, 11, 0.9)' : (haz.type === 'gem' ? 'rgba(6, 182, 212, 0.9)' : 'rgba(239, 68, 68, 0.7)'),
            }
          );

          ctx.restore();
        }
      });

      // Render Survivor Hero (Player Hero Badge)
      ctx.save();
      ctx.translate(s.survivorX, s.survivorY);

      drawCardSprite(
        ctx,
        playerHeroId,
        -20,
        -20,
        40,
        40,
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
      gameId: 'arcade_terra_quake',
      gameTitle: '블리츠 테라 퀘이크',
      durationSeconds: duration,
      score: s.score + (isWin ? 3500 : s.gemsCollected * 300) + s.maxCombo * 40,
      difficulty: 'NIGHTMARE',
      isVictory: isWin && s.gemsCollected >= 8,
    });
    setSettlementReceipt(receipt);
    onReward(receipt.totalSns);
  };

  const tutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 손가락 드래그 지진 생존' : 'STEP 1: DRAG & SURVIVE QUAKE',
      title: isKo ? '생존자를 손가락으로 드래그해 균열을 피하고 보석을 캐세요' : 'Drag survivor to dodge quake fissures and gather ancient gems',
      description: isKo
        ? '가상 조이스틱 없이 화면의 생존자(🧗)를 손가락으로 직접 드래그하여 지진 균열(🕳️)과 낙석(🪨)을 피하고 고대 크리스탈(💎)과 보물 상자(📦)를 수집하세요.'
        : 'Slide your finger to guide the survivor, dodging fissures while collecting crystals and treasure chests.',
      keyPoints: isKo
        ? [
            '가상 조이스틱 0개 (100% 손가락 직접 2D 드래그 이동)',
            '보물 상자(📦) 획득 시 800P 잭팟 대박 보너스',
            '35초간 최대 콤보로 붕괴 지반에서 살아남아 올클리어'
          ]
        : [
            'Zero Virtual Joysticks: 100% Direct Finger Drag',
            'Treasure Chests (📦) award 800P survival jackpots',
            'Maintain continuous survival combos within 35s'
          ],
      iconType: 'GOAL',
    },
    {
      badge: isKo ? 'STEP 2: 모바일 퓨어 제스처' : 'STEP 2: PURE GESTURES',
      title: isKo ? '화면 직접 자유 드래그 (Direct Finger Drag)' : 'Direct Drag Gesture',
      description: isKo
        ? '손가락을 원하는 위치로 부드럽게 밀어 생존 경로를 제어합니다.'
        : 'Slide your thumb smoothly anywhere on the terrain.',
      keyPoints: isKo
        ? [
            '👆 자유 드래그: 60FPS 즉각 반응 초정밀 회피 기동',
            '💎 연속 수집 시 테라 콤보 배수 보너스',
            '⏱️ 35초 타임어택 고득점 챌린지'
          ]
        : [
            '👆 Free Drag: Instant responsive dodging control',
            '💎 Consecutive collects grant quake combo multipliers',
            '⏱️ 35s time attack terra quake sprint'
          ],
      iconType: 'GESTURES',
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '생존 완료 즉시 NIGHTMARE 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Nightmare payout deposited atomically to your LocalStorage wallet upon match finish.',
      keyPoints: isKo
        ? [
            '완료 즉시 LocalStorage 영구 지갑 입금',
            '수집한 보석 수 및 상자 개수 비례 대량 잭팟',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Collected gems count and chest multipliers',
            'VictoryRewardModal golden coin fanfare'
          ],
      iconType: 'REWARDS',
    },
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-[#1c1917] text-white font-mono select-none flex flex-col overflow-hidden items-center justify-between touch-none">
      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '블리츠 테라 퀘이크' : 'Blitz Terra Quake'}
        language={(language as Language) || 'ko'}
        telemetries={[
          { label: isKo ? '보석' : 'Gems', value: `${gemsCollected}개`, color: 'text-amber-400 font-bold' },
          { label: isKo ? '콤보' : 'Combo', value: `${quakeCombo}x`, color: quakeCombo > 2 ? 'text-amber-300 font-bold animate-bounce' : 'text-slate-300' },
          { label: isKo ? '시간' : 'Time', value: `${timeLeft}s`, color: timeLeft <= 10 ? 'text-rose-500 font-bold animate-pulse' : 'text-cyan-400 font-bold' },
          { label: isKo ? '점수' : 'Score', value: `${score}P`, color: 'text-amber-300 font-bold' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => setIsPaused(prev => !prev)}
        isPaused={isPaused}
      />

      {/* Pure Touch Terra Quake Canvas Viewport */}
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
          {isKo ? '손가락으로 생존자를 드래그해 균열을 피하고 크리스탈을 수집하세요' : 'Drag survivor to dodge fissures and gather ancient gems'}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="arcade_terra_quake"
          gameTitle={isKo ? '블리츠 테라: 지진 서바이벌' : 'Blitz Terra: Quake Survival'}
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
export default VoxelTerraQuakeGame;
