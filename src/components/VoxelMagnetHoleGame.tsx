import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData, Language } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelMagnetHoleGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface CityItem {
  id: number;
  x: number;
  y: number;
  size: number;
  reqRadius: number;
  icon: string;
  points: number;
  isSwallowed: boolean;
  scale: number;
}

export const VoxelMagnetHoleGame: React.FC<VoxelMagnetHoleGameProps> = ({
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

  const [holeRadius, setHoleRadius] = useState<number>(22);
  const [swallowedCount, setSwallowedCount] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [swallowCombo, setSwallowCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(35);
  const [feedbackText, setFeedbackText] = useState<string | null>(null);

  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_game_blackhole_sink') !== 'true';
    } catch {
      return true;
    }
  });
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const stateRef = useRef({
    holeX: 180,
    holeY: 260,
    targetX: 180,
    targetY: 260,
    holeRadius: 22,
    items: [] as CityItem[],
    swallowedCount: 0,
    score: 0,
    combo: 0,
    maxCombo: 0,
    timeLeft: 35,
    isGameOver: false,
    isPaused: false,
    startTime: Date.now(),
    itemCounter: 1,
    spawnTimer: 0,
    swallowEffects: [] as { x: number; y: number; text: string; color: string; life: number }[],
  });

  const spawnCityItems = (count: number) => {
    const s = stateRef.current;
    const types: { icon: string; size: number; reqRadius: number; points: number }[] = [
      { icon: '📮', size: 14, reqRadius: 18, points: 50 }, // 우체통 (소형)
      { icon: '🪑', size: 16, reqRadius: 20, points: 70 }, // 벤치 (소형)
      { icon: '🚲', size: 18, reqRadius: 24, points: 100 }, // 자전거 (소형)
      { icon: '🚗', size: 24, reqRadius: 32, points: 250 }, // 승용차 (중형)
      { icon: '🚌', size: 30, reqRadius: 42, points: 450 }, // 버스 (중형)
      { icon: '🏠', size: 36, reqRadius: 52, points: 800 }, // 주택 (대형)
      { icon: '🏢', size: 44, reqRadius: 65, points: 1500 }, // 빌딩 (초대형)
    ];

    for (let i = 0; i < count; i++) {
      const type = types[Math.floor(Math.random() * types.length)];
      s.items.push({
        id: s.itemCounter++,
        x: 30 + Math.random() * 300,
        y: 40 + Math.random() * 420,
        size: type.size,
        reqRadius: type.reqRadius,
        icon: type.icon,
        points: type.points,
        isSwallowed: false,
        scale: 1,
      });
    }
  };

  const initGame = useCallback(() => {
    const s = stateRef.current;
    s.holeX = 180;
    s.holeY = 260;
    s.targetX = 180;
    s.targetY = 260;
    s.holeRadius = 22;
    s.items = [];
    s.swallowedCount = 0;
    s.score = 0;
    s.combo = 0;
    s.maxCombo = 0;
    s.timeLeft = 35;
    s.isGameOver = false;
    s.startTime = Date.now();
    s.itemCounter = 1;
    s.spawnTimer = 0;
    s.swallowEffects = [];

    spawnCityItems(28);

    setHoleRadius(22);
    setSwallowedCount(0);
    setScore(0);
    setSwallowCombo(0);
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

  // Touch Handlers: Direct Finger Drag Tracking (Zero Joysticks)
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = stateRef.current;
    if (s.isGameOver || s.isPaused) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    s.targetX = Math.max(30, Math.min(330, (e.clientX - rect.left) * scaleX));
    s.targetY = Math.max(30, Math.min(470, (e.clientY - rect.top) * scaleY));
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = stateRef.current;
    if (s.isGameOver || s.isPaused) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    s.targetX = Math.max(30, Math.min(330, (e.clientX - rect.left) * scaleX));
    s.targetY = Math.max(30, Math.min(470, (e.clientY - rect.top) * scaleY));
  };

  // Main 60FPS Blackhole Engine Loop
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

      // Smooth Hole Follow to Finger
      s.holeX += (s.targetX - s.holeX) * Math.min(1, dt * 16);
      s.holeY += (s.targetY - s.holeY) * Math.min(1, dt * 16);

      // Periodically spawn new items
      s.spawnTimer += dt;
      if (s.spawnTimer > 2.5 && s.items.length < 35) {
        s.spawnTimer = 0;
        spawnCityItems(6);
      }

      // Check Swallowing Items
      for (let i = s.items.length - 1; i >= 0; i--) {
        const item = s.items[i];
        if (!item.isSwallowed) {
          const dist = Math.hypot(item.x - s.holeX, item.y - s.holeY);

          // If close and small enough -> Swallow!
          if (dist < s.holeRadius) {
            if (s.holeRadius >= item.reqRadius) {
              item.isSwallowed = true;
              s.swallowedCount += 1;
              s.combo += 1;
              if (s.combo > s.maxCombo) s.maxCombo = s.combo;

              // Grow Blackhole!
              s.holeRadius = Math.min(85, s.holeRadius + 0.9);
              setHoleRadius(Math.round(s.holeRadius));

              const pts = item.points + s.combo * 25;
              s.score += pts;

              setScore(s.score);
              setSwallowedCount(s.swallowedCount);
              setSwallowCombo(s.combo);
              setMaxCombo(s.maxCombo);

              setFeedbackText(`SWALLOWED! +${pts}P 🕳️`);
              playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
              setTimeout(() => setFeedbackText(null), 300);

              s.swallowEffects.push({
                x: item.x,
                y: item.y,
                text: `+${pts}P`,
                color: '#38bdf8',
                life: 0.5,
              });
            } else {
              // Too big to swallow! Push item away
              const pushAngle = Math.atan2(item.y - s.holeY, item.x - s.holeX);
              item.x = s.holeX + Math.cos(pushAngle) * (s.holeRadius + 5);
              item.y = s.holeY + Math.sin(pushAngle) * (s.holeRadius + 5);
            }
          }
        } else {
          // Shrink towards hole center
          item.scale -= dt * 4;
          item.x += (s.holeX - item.x) * dt * 8;
          item.y += (s.holeY - item.y) * dt * 8;
          if (item.scale <= 0.1) {
            s.items.splice(i, 1);
          }
        }
      }

      // Update Effects
      for (let i = s.swallowEffects.length - 1; i >= 0; i--) {
        const eff = s.swallowEffects[i];
        eff.y -= 30 * dt;
        eff.life -= dt;
        if (eff.life <= 0) s.swallowEffects.splice(i, 1);
      }

      // ── Canvas Rendering ──
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Urban Asphalt Grid Background
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, w, h);

      // Street Grid Pattern
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 2;
      for (let x = 40; x < w; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 40; y < h; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Render Blackhole Rim & Abyss Center
      ctx.save();
      ctx.translate(s.holeX, s.holeY);

      // Outer Gravitational Horizon Glow
      const glowGrad = ctx.createRadialGradient(0, 0, s.holeRadius * 0.7, 0, 0, s.holeRadius + 14);
      glowGrad.addColorStop(0, '#000000');
      glowGrad.addColorStop(0.7, 'rgba(56, 189, 248, 0.4)');
      glowGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(0, 0, s.holeRadius + 14, 0, Math.PI * 2);
      ctx.fill();

      // Deep Blackhole Center
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(0, 0, s.holeRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.restore();

      // Render City Items
      s.items.forEach((item) => {
        ctx.save();
        ctx.translate(item.x, item.y);
        ctx.scale(Math.max(0.1, item.scale), Math.max(0.1, item.scale));
        ctx.font = `${item.size * 1.5}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(item.icon, 0, 0);
        ctx.restore();
      });

      // Render Floating Effects
      s.swallowEffects.forEach((eff) => {
        ctx.font = 'bold 15px monospace';
        ctx.fillStyle = eff.color;
        ctx.textAlign = 'center';
        ctx.fillText(eff.text, eff.x, eff.y);
      });
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [playSfx]);

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
      gameId: 'arcade_blackhole_sink',
      gameTitle: '블리츠 블랙홀 싱크',
      durationSeconds: duration,
      score: s.score + (isWin ? 3500 : s.swallowedCount * 120) + s.maxCombo * 40,
      difficulty: 'NIGHTMARE',
      isVictory: isWin || s.swallowedCount >= 25,
    });
    setSettlementReceipt(receipt);
    onReward(receipt.totalSns);
  };

  const tutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 손가락 드래그 도시 흡입' : 'STEP 1: DRAG BLACKHOLE ABSORPTION',
      title: isKo ? '블랙홀을 드래그해 도시를 삼키고 거대해지세요' : 'Drag the Blackhole to Swallow Objects & Grow Bigger',
      description: isKo
        ? '가상 조이스틱 없이 블랙홀(🕳️)을 손가락으로 화면에 직접 드래그하여 작은 우체통/벤치부터 시작해 차량, 버스, 거대 빌딩까지 순서대로 모두 삼켜 블랙홀을 초대형으로 성장시키세요.'
        : 'Drag the blackhole directly with your finger to swallow small props first, then grow to consume cars, buses and skyscrapers.',
      keyPoints: isKo
        ? [
            '가상 조이스틱 0개 (100% 손가락 1:1 직접 드래그 이동)',
            '작은 소품 흡입 시 블랙홀 크기 실시간 거대화',
            '35초간 최대 콤보로 도시 전체를 삼키고 올클리어'
          ]
        : [
            'Zero Virtual Joysticks: 100% Direct Finger Drag Tracking',
            'Swallowing objects expands blackhole radius in real-time',
            'Chain massive combos to devour the entire city'
          ],
      iconType: 'GOAL',
    },
    {
      badge: isKo ? 'STEP 2: 모바일 퓨어 제스처' : 'STEP 2: PURE GESTURES',
      title: isKo ? '화면 직접 드래그 (Direct Drag)' : 'Direct Screen Drag',
      description: isKo
        ? '손가락을 대고 원하는 방향으로 블랙홀을 부드럽게 이끕니다.'
        : 'Slide your finger seamlessly across the screen.',
      keyPoints: isKo
        ? [
            '👆 손가락 드래그: 실시간 즉각 반응 블랙홀 이동',
            '🕳️ 블랙홀 크기보다 큰 물체는 튕겨나가므로 크기를 먼저 키우세요',
            '⏱️ 35초 타임어택 고득점 챌린지'
          ]
        : [
            '👆 Direct Drag: Instant fluid blackhole movement',
            '🕳️ Larger objects bounce until your blackhole grows enough',
            '⏱️ 35s time attack absorption sprint'
          ],
      iconType: 'GESTURES',
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '흡입 완료 즉시 NIGHTMARE 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Nightmare payout deposited atomically to your LocalStorage wallet upon match finish.',
      keyPoints: isKo
        ? [
            '완료 즉시 LocalStorage 영구 지갑 입금',
            '삼킨 오브젝트 수 및 블랙홀 최종 크기 비례 대량 잭팟',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Swallowed items and final radius multipliers',
            'VictoryRewardModal golden coin fanfare'
          ],
      iconType: 'REWARDS',
    },
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-[#0b0f19] text-white font-mono select-none flex flex-col overflow-hidden items-center justify-between touch-none">
      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '블리츠 블랙홀' : 'Blitz Blackhole Sink'}
        language={(language as Language) || 'ko'}
        telemetries={[
          { label: isKo ? '반경' : 'Radius', value: `${holeRadius}m`, color: 'text-cyan-300 font-bold' },
          { label: isKo ? '흡입' : 'Swallowed', value: `${swallowedCount}개`, color: 'text-amber-400 font-bold' },
          { label: isKo ? '시간' : 'Time', value: `${timeLeft}s`, color: timeLeft <= 10 ? 'text-rose-500 font-bold animate-pulse' : 'text-cyan-400 font-bold' },
          { label: isKo ? '점수' : 'Score', value: `${score}P`, color: 'text-amber-300 font-bold' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => setIsPaused(prev => !prev)}
        isPaused={isPaused}
      />

      {/* Pure Touch Blackhole Canvas Viewport */}
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
          {isKo ? '손가락으로 블랙홀을 드래그해 작은 물체부터 삼키고 도시를 흡입하세요' : 'Drag blackhole with finger to swallow small objects first and grow'}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="arcade_blackhole_sink"
          gameTitle={isKo ? '블리츠 블랙홀: 도시 흡입' : 'Blitz Blackhole: City Sink'}
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
export default VoxelMagnetHoleGame;
