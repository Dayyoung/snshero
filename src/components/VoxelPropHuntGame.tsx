import { drawCardSprite } from '../lib/canvasCardRenderer';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData, Language } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelPropHuntGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface RoomProp {
  id: number;
  x: number;
  y: number;
  cardId: number;
  icon: string;
  isFake: boolean;
  wigglePhase: number;
  revealed: boolean;
  points: number;
  radius: number;
}

const PROP_CARD_IDS = [9, 13, 21, 34, 46, 52, 60, 68, 77, 85, 91, 100];

export const VoxelPropHuntGame: React.FC<VoxelPropHuntGameProps> = ({
  deck = [],
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
  const playerHeroId = deck[0]?.id || 52;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  const [propsFound, setPropsFound] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [hunterCombo, setHunterCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(35);
  const [feedbackText, setFeedbackText] = useState<string | null>(null);

  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_game_prop_hunter') !== 'true';
    } catch {
      return true;
    }
  });
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const stateRef = useRef({
    props: [] as RoomProp[],
    propsFound: 0,
    score: 0,
    combo: 0,
    maxCombo: 0,
    timeLeft: 35,
    isGameOver: false,
    isPaused: false,
    startTime: Date.now(),
    particles: [] as { x: number; y: number; vx: number; vy: number; color: string; life: number }[],
  });

  const setupRoomProps = useCallback(() => {
    const props: RoomProp[] = [];
    const rows = 4;
    const cols = 3;
    let id = 1;

    // Pick 3 to 4 random fake props
    const fakeCount = 4;
    const fakeIndices = new Set<number>();
    while (fakeIndices.size < fakeCount) {
      fakeIndices.add(Math.floor(Math.random() * (rows * cols)));
    }

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const index = r * cols + c;
        const cardId = PROP_CARD_IDS[index % PROP_CARD_IDS.length];
        const isFake = fakeIndices.has(index);

        props.push({
          id: id++,
          x: 65 + c * 115,
          y: 90 + r * 105,
          cardId,
          icon: '📦',
          isFake,
          wigglePhase: Math.random() * Math.PI * 2,
          revealed: false,
          points: isFake ? 500 : 0,
          radius: 34,
        });
      }
    }
    return props;
  }, []);

  const initGame = useCallback(() => {
    const s = stateRef.current;
    s.props = setupRoomProps();
    s.propsFound = 0;
    s.score = 0;
    s.combo = 0;
    s.maxCombo = 0;
    s.timeLeft = 35;
    s.isGameOver = false;
    s.startTime = Date.now();
    s.particles = [];

    setPropsFound(0);
    setScore(0);
    setHunterCombo(0);
    setMaxCombo(0);
    setTimeLeft(35);
    setFeedbackText(null);
    setIsGameOver(false);
    setSettlementReceipt(null);
  }, [setupRoomProps]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  // Timer loop
  useEffect(() => {
    if (isGameOver || isPaused) return;

    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          const isTargetMet = stateRef.current.propsFound >= 6;
          endGame(isTargetMet);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isGameOver, isPaused]);

  // Direct Tap Prop Handlers
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

    // Check Clicked Prop
    let hitAny = false;
    s.props.forEach((p) => {
      if (!p.revealed && Math.hypot(p.x - tapX, p.y - tapY) < p.radius + 10) {
        hitAny = true;
        p.revealed = true;

        if (p.isFake) {
          s.propsFound += 1;
          s.combo += 1;
          if (s.combo > s.maxCombo) s.maxCombo = s.combo;

          const pts = p.points + s.combo * 50;
          s.score += pts;

          setPropsFound(s.propsFound);
          setScore(s.score);
          setHunterCombo(s.combo);
          setMaxCombo(s.maxCombo);

          setFeedbackText(`BUSTED! 👻 +${pts}P ✨`);
          playSfx?.('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
          setTimeout(() => setFeedbackText(null), 400);

          // Confetti sparkles
          for (let k = 0; k < 12; k++) {
            s.particles.push({
              x: p.x,
              y: p.y,
              vx: (Math.random() - 0.5) * 240,
              vy: (Math.random() - 0.5) * 240,
              color: '#38bdf8',
              life: 0.5,
            });
          }

          // Check if all fakes found in current wave -> spawn next room
          const remainingFakes = s.props.filter((pr) => pr.isFake && !pr.revealed).length;
          if (remainingFakes === 0) {
            setFeedbackText(isKo ? '방 클리어! 다음 방으로 🚪' : 'ROOM CLEARED! NEXT ROOM 🚪');
            setTimeout(() => {
              s.props = setupRoomProps();
            }, 500);
          }
        } else {
          // Innocent prop tapped
          s.combo = 0;
          setHunterCombo(0);

          setFeedbackText(isKo ? '일반 가구입니다! 💨' : 'INNOCENT PROP! 💨');
          playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
          setTimeout(() => setFeedbackText(null), 300);
        }
      }
    });
  };

  // Main 60FPS Prop Hunt Loop
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

      // Cozy Room Interior Background
      const roomGrad = ctx.createLinearGradient(0, 0, 0, h);
      roomGrad.addColorStop(0, '#1e1b4b');
      roomGrad.addColorStop(0.7, '#0f172a');
      roomGrad.addColorStop(1, '#3b0764');
      ctx.fillStyle = roomGrad;
      ctx.fillRect(0, 0, w, h);

      // Render Room Props (Card Sprites)
      s.props.forEach((p) => {
        ctx.save();
        ctx.translate(p.x, p.y);

        // Subtle wiggle animation for fake props!
        if (p.isFake && !p.revealed) {
          p.wigglePhase += dt * 4;
          const wobble = Math.sin(p.wigglePhase) * 3;
          ctx.rotate((wobble * Math.PI) / 180);
        }

        const propCardId = p.revealed && p.isFake ? 43 : p.cardId;

        drawCardSprite(
          ctx,
          propCardId,
          -24,
          -24,
          48,
          48,
          {
            circleClip: true,
            borderWidth: p.revealed ? (p.isFake ? 2.5 : 1) : 1.5,
            borderColor: p.revealed ? (p.isFake ? '#34d399' : '#64748b') : '#94a3b8',
            shadowBlur: p.revealed && p.isFake ? 18 : 6,
            shadowColor: p.revealed && p.isFake ? 'rgba(52, 211, 153, 0.9)' : 'rgba(148, 163, 184, 0.5)',
          }
        );

        ctx.restore();
      });

      // Render Detective Hunter Hero Badge at Bottom
      drawCardSprite(
        ctx,
        playerHeroId,
        w / 2 - 22,
        450,
        44,
        44,
        {
          circleClip: true,
          borderWidth: 2,
          borderColor: '#38bdf8',
          shadowBlur: 14,
          shadowColor: 'rgba(56, 189, 248, 0.8)',
        }
      );

      // Render Particles
      s.particles.forEach((p) => {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, 4, 4);
      });
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [setupRoomProps, playerHeroId]);

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
      gameId: 'arcade_prop_hunter',
      gameTitle: '블리츠 프롭 헌터',
      durationSeconds: duration,
      score: s.score + (isWin ? 3500 : s.propsFound * 400) + s.maxCombo * 50,
      difficulty: 'NIGHTMARE',
      isVictory: isWin && s.propsFound >= 6,
    });
    setSettlementReceipt(receipt);
    onReward(receipt.totalSns);
  };

  const tutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 미세하게 들썩이는 프롭 색출' : 'STEP 1: SPOT SUSPICIOUS WIGGLING PROPS',
      title: isKo ? '방 안의 가구 중 미세하게 움직이는 변장 프롭을 탭하세요' : 'Tap props that wiggle subtly to catch disguised ghosts',
      description: isKo
        ? '가상 조이스틱 없이 방 안에 놓인 가구/소품(📦, 🪑, 📺, 🌵, 🏺, 🧸, 🧯)을 관찰하여 미세하게 흔들거리거나 들썩이는 위장 유령 프롭을 손가락으로 직접 탭해 적발하세요.'
        : 'Observe the room props carefully and tap disguised ghost props that subtly wiggle on your screen.',
      keyPoints: isKo
        ? [
            '가상 조이스틱 0개 (100% 손가락 직접 사물 탭 적발)',
            '변장 유령(👻) 적발 시 500P 대박 보너스',
            '35초간 최대 콤보로 프롭들을 적발하고 올클리어'
          ]
        : [
            'Zero Virtual Joysticks: 100% Direct Tap Prop Hunter',
            'Disguised Ghosts (👻) award 500P massive bounty',
            'Spot props with continuous combos within 35s'
          ],
      iconType: 'GOAL',
    },
    {
      badge: isKo ? 'STEP 2: 모바일 퓨어 제스처' : 'STEP 2: PURE GESTURES',
      title: isKo ? '화면 직접 탭 (Direct Tap)' : 'Direct Tap Gesture',
      description: isKo
        ? '의심스러운 사물을 직접 탭하여 정체를 밝힙니다.'
        : 'Tap suspicious props directly on screen.',
      keyPoints: isKo
        ? [
            '👆 사물 직접 탭: 즉각적인 변장 확인 및 유령 포획',
            '🔎 연속 적발 시 헌터 콤보 배수 보너스',
            '⏱️ 35초 타임어택 고득점 챌린지'
          ]
        : [
            '👆 Tap Prop: Instant disguise reveal & capture',
            '🔎 Consecutive catches grant combo multipliers',
            '⏱️ 35s time attack prop hunting sprint'
          ],
      iconType: 'GESTURES',
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '탐색 완료 즉시 NIGHTMARE 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Nightmare payout deposited atomically to your LocalStorage wallet upon match finish.',
      keyPoints: isKo
        ? [
            '완료 즉시 LocalStorage 영구 지갑 입금',
            '적발한 프롭 수 및 최대 콤보 비례 대량 잭팟',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Found props count and combo multipliers',
            'VictoryRewardModal golden coin fanfare'
          ],
      iconType: 'REWARDS',
    },
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-[#1e1b4b] text-white font-mono select-none flex flex-col overflow-hidden items-center justify-between touch-none">
      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '블리츠 프롭 헌터' : 'Blitz Prop Hunter'}
        language={(language as Language) || 'ko'}
        telemetries={[
          { label: isKo ? '적발' : 'Found', value: `${propsFound}개`, color: 'text-amber-400 font-bold' },
          { label: isKo ? '콤보' : 'Combo', value: `${hunterCombo}x`, color: hunterCombo > 2 ? 'text-amber-300 font-bold animate-bounce' : 'text-slate-300' },
          { label: isKo ? '시간' : 'Time', value: `${timeLeft}s`, color: timeLeft <= 10 ? 'text-rose-500 font-bold animate-pulse' : 'text-cyan-400 font-bold' },
          { label: isKo ? '점수' : 'Score', value: `${score}P`, color: 'text-amber-300 font-bold' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => setIsPaused(prev => !prev)}
        isPaused={isPaused}
      />

      {/* Pure Touch Prop Hunt Canvas Viewport */}
      <div className="flex-1 w-full max-w-md relative overflow-hidden flex items-center justify-center select-none touch-none p-2">
        <canvas
          ref={canvasRef}
          width={360}
          height={500}
          onPointerDown={handlePointerDown}
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
          {isKo ? '미세하게 들썩이는 의심스러운 가구를 손가락으로 직접 탭하세요' : 'Tap subtly wiggling suspicious props on your screen'}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="arcade_prop_hunter"
          gameTitle={isKo ? '블리츠 프롭: 사물 찾기' : 'Blitz Prop: Hidden Hunter'}
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
export default VoxelPropHuntGame;
