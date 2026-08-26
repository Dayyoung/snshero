import { drawCardSprite } from '../lib/canvasCardRenderer';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData, Language } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelKarateBreakGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface BreakTarget {
  id: number;
  name: string;
  enName: string;
  cardId: number;
  icon: string;
  color: string;
  layers: number;
  points: number;
}

const BREAK_TARGETS: BreakTarget[] = [
  { id: 1, name: '삼나무 송판 (10단)', enName: 'Cedar Wood (10x)', cardId: 8, icon: '🪵', color: '#b45309', layers: 10, points: 200 },
  { id: 2, name: '붉은 점토 벽돌 (10단)', enName: 'Clay Bricks (10x)', cardId: 22, icon: '🧱', color: '#b91c1c', layers: 10, points: 350 },
  { id: 3, name: '화강암 암석 (10단)', enName: 'Granite Rock (10x)', cardId: 37, icon: '🪨', color: '#64748b', layers: 10, points: 550 },
  { id: 4, name: '강철 모루 블록 (10단)', enName: 'Steel Anvil (10x)', cardId: 58, icon: '⚙️', color: '#334155', layers: 10, points: 800 },
  { id: 5, name: '흑요석 크리스탈 (10단)', enName: 'Obsidian Crystal (10x)', cardId: 92, icon: '💎', color: '#7e22ce', layers: 10, points: 1200 },
];

export const VoxelKarateBreakGame: React.FC<VoxelKarateBreakGameProps> = ({
  deck = [],
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
  const playerHeroId = deck[0]?.id || 94;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  const [currentTargetIdx, setCurrentTargetIdx] = useState<number>(0);
  const [brokenLayers, setBrokenLayers] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [chopCombo, setChopCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(35);
  const [feedbackText, setFeedbackText] = useState<string | null>(null);

  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_game_karate_chop') !== 'true';
    } catch {
      return true;
    }
  });
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const stateRef = useRef({
    targetIdx: 0,
    brokenCount: 0,
    isChopping: false,
    chopAnimation: 0,
    score: 0,
    combo: 0,
    maxCombo: 0,
    timeLeft: 35,
    isGameOver: false,
    isPaused: false,
    startTime: Date.now(),
    touchStart: { x: 0, y: 0, time: 0 },
    shards: [] as { x: number; y: number; vx: number; vy: number; color: string; life: number }[],
  });

  const setupTarget = useCallback((idx: number) => {
    const s = stateRef.current;
    s.targetIdx = idx;
    s.brokenCount = 0;
    s.isChopping = false;
    setCurrentTargetIdx(idx);
    setBrokenLayers(0);
  }, []);

  const initGame = useCallback(() => {
    const s = stateRef.current;
    s.score = 0;
    s.combo = 0;
    s.maxCombo = 0;
    s.timeLeft = 35;
    s.isGameOver = false;
    s.startTime = Date.now();
    s.shards = [];

    setScore(0);
    setChopCombo(0);
    setMaxCombo(0);
    setTimeLeft(35);
    setFeedbackText(null);
    setIsGameOver(false);
    setSettlementReceipt(null);

    setupTarget(0);
  }, [setupTarget]);

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

  // Touch Downward Chop Swipe Handlers (Zero Joysticks)
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = stateRef.current;
    if (s.isGameOver || s.isPaused || s.isChopping) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    s.touchStart = {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
      time: performance.now(),
    };
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = stateRef.current;
    if (s.isGameOver || s.isPaused || s.isChopping) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const endX = (e.clientX - rect.left) * scaleX;
    const endY = (e.clientY - rect.top) * scaleY;
    const duration = (performance.now() - s.touchStart.time) / 1000;

    const dy = endY - s.touchStart.y;
    const dx = endX - s.touchStart.x;

    // Downward Chop Gesture (Fast swipe down >= 40px within 0.35s)
    if (dy > 40 && Math.abs(dx) < dy && duration < 0.35) {
      s.isChopping = true;
      s.chopAnimation = 1.0;

      const swipeSpeed = dy / duration; // px per second
      const isPerfectChop = swipeSpeed > 600 && Math.abs(s.touchStart.x - 180) < 60;

      const target = BREAK_TARGETS[s.targetIdx] || BREAK_TARGETS[0];
      const smashed = isPerfectChop ? 10 : Math.min(10, Math.round((swipeSpeed / 500) * 10));

      s.brokenCount = smashed;
      setBrokenLayers(smesh_layers => Math.max(smesh_layers, smashed));

      s.combo += 1;
      if (s.combo > s.maxCombo) s.maxCombo = s.combo;

      const pts = (isPerfectChop ? target.points * 1.5 : (target.points * (smashed / 10))) + s.combo * 30;
      s.score += Math.round(pts);

      setScore(s.score);
      setChopCombo(s.combo);
      setMaxCombo(s.maxCombo);

      // Spawn Block Shards
      for (let i = 0; i < smashed * 4; i++) {
        s.shards.push({
          x: 180 + (Math.random() - 0.5) * 80,
          y: 280 + (Math.random() - 0.5) * 60,
          vx: (Math.random() - 0.5) * 350,
          vy: -150 - Math.random() * 200,
          color: target.color,
          life: 0.8,
        });
      }

      if (isPerfectChop) {
        setFeedbackText(`💥 PERFECT ALL-BREAK! +${Math.round(pts)}P 🥋`);
        playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
      } else {
        setFeedbackText(`SMASH! ${smashed}/10 +${Math.round(pts)}P`);
        playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
      }

      setTimeout(() => {
        setFeedbackText(null);
        s.isChopping = false;
        if (s.targetIdx < BREAK_TARGETS.length - 1) {
          setupTarget(s.targetIdx + 1);
        } else {
          // Final Obsidian Cleared! Win!
          endGame(true);
        }
      }, 700);
    }
  };

  // Main 60FPS Karate Dojo & Shards Loop
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

      const target = BREAK_TARGETS[s.targetIdx] || BREAK_TARGETS[0];

      // Update Shards
      for (let i = s.shards.length - 1; i >= 0; i--) {
        const sh = s.shards[i];
        sh.x += sh.vx * dt;
        sh.y += sh.vy * dt;
        sh.vy += 480 * dt; // Gravity
        sh.life -= dt;
        if (sh.life <= 0) s.shards.splice(i, 1);
      }

      // ── Canvas Rendering ──
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Traditional Martial Arts Dojo Background (Warm Amber / Tatami)
      ctx.fillStyle = '#1c130c';
      ctx.fillRect(0, 0, w, h);

      // Tatami Floor Mat
      ctx.fillStyle = '#78350f';
      ctx.fillRect(20, 360, w - 40, 110);
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 3;
      ctx.strokeRect(20, 360, w - 40, 110);

      // Dojo Scroll Banner at Top
      ctx.fillStyle = '#451a03';
      ctx.fillRect(50, 20, w - 100, 40);
      ctx.strokeStyle = '#fde047';
      ctx.strokeRect(50, 20, w - 100, 40);
      ctx.font = 'bold 15px monospace';
      ctx.fillStyle = '#fde047';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🥋 一擊必殺 DOJO 🥋', w / 2, 40);

      // Render Stacked Target Blocks on Stand
      const standY = 350;
      const blockW = 160;
      const blockH = 12;

      // Wooden Pillar Stand
      ctx.fillStyle = '#451a03';
      ctx.fillRect(w / 2 - 90, standY, 20, 50);
      ctx.fillRect(w / 2 + 70, standY, 20, 50);

      // Stand Card Sprite Emblems
      drawCardSprite(ctx, target.cardId, w / 2 - 88, standY + 10, 16, 16, {
        circleClip: true,
        borderWidth: 1,
        borderColor: '#fde047',
      });
      drawCardSprite(ctx, target.cardId, w / 2 + 72, standY + 10, 16, 16, {
        circleClip: true,
        borderWidth: 1,
        borderColor: '#fde047',
      });

      // Render Remaining Layers
      const remainingLayers = target.layers - s.brokenCount;
      for (let l = 0; l < remainingLayers; l++) {
        const by = standY - l * (blockH + 4);
        ctx.fillStyle = target.color;
        ctx.fillRect((w - blockW) / 2, by, blockW, blockH);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.strokeRect((w - blockW) / 2, by, blockW, blockH);
      }

      // Target Label with Card Sprite
      drawCardSprite(ctx, target.cardId, w / 2 - 14, 75, 28, 28, {
        circleClip: true,
        borderWidth: 1.5,
        borderColor: '#fde047',
        shadowBlur: 8,
        shadowColor: 'rgba(253, 224, 71, 0.8)',
      });

      ctx.font = 'bold 15px monospace';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`${isKo ? target.name : target.enName}`, w / 2, 115);

      // Downward Chop Guide Arrow
      if (!s.isChopping) {
        ctx.font = 'bold 24px monospace';
        ctx.fillStyle = '#ef4444';
        ctx.fillText('⬇️ SWIPE DOWN! ⬇️', w / 2, 160);
      }

      // Karate Chop Martial Hero Arm Animation
      if (s.isChopping) {
        drawCardSprite(ctx, playerHeroId, w / 2 - 32, 198, 64, 64, {
          circleClip: true,
          borderWidth: 2,
          borderColor: '#fde047',
          shadowBlur: 18,
          shadowColor: 'rgba(253, 224, 71, 0.9)',
        });
      }

      // Render Shard Particles
      s.shards.forEach((sh) => {
        ctx.fillStyle = sh.color;
        ctx.fillRect(sh.x, sh.y, 8, 8);
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
      gameId: 'arcade_karate_chop',
      gameTitle: '블리츠 가라테 찹',
      durationSeconds: duration,
      score: s.score + (isWin ? 3500 : (s.targetIdx + 1) * 600) + s.maxCombo * 50,
      difficulty: 'NIGHTMARE',
      isVictory: isWin || s.targetIdx >= 3,
    });
    setSettlementReceipt(receipt);
    onReward(receipt.totalSns);
  };

  const tutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 수도 내리치기 광속 스와이프' : 'STEP 1: DOWNWARD CHOP SWIPE',
      title: isKo ? '위에서 아래로 단숨에 스와이프해 격파하세요' : 'Swipe Down Fast to Chop and Break Blocks',
      description: isKo
        ? '가상 조이스틱 없이 화면을 위에서 아래로 날카롭고 빠르게 스와이프하여 수도(Karate Chop)를 내리치고, 쌓여있는 송판, 벽돌, 화강암, 흑요석 블록을 10단 일도양단 산산조각 내세요.'
        : 'Swipe down rapidly from top to bottom to execute a powerful karate chop and smash block stacks.',
      keyPoints: isKo
        ? [
            '가상 조이스틱 0개 (100% 화면 직접 아래로 스와이프 격파)',
            '광속 정중앙 찹 시 10단 전소 퍼펙트 올브레이크 잭팟',
            '송판 ➔ 벽돌 ➔ 화강암 ➔ 모루 ➔ 흑요석 5단계 챔피언십'
          ]
        : [
            'Zero Virtual Joysticks: 100% Downward Chop Swipes',
            'Fast central swipes trigger 10-layer perfect all-break jackpots',
            '5-Stage Championship: Wood ➔ Brick ➔ Granite ➔ Anvil ➔ Obsidian'
          ],
      iconType: 'GOAL',
    },
    {
      badge: isKo ? 'STEP 2: 모바일 퓨어 제스처' : 'STEP 2: PURE GESTURES',
      title: isKo ? '화면 직접 아래로 긋기 (Downward Chop)' : 'Downward Chop Gesture',
      description: isKo
        ? '화면 상단에서 하단으로 빠르게 손가락을 내리긋습니다.'
        : 'Flick down forcefully with your finger over the block stack.',
      keyPoints: isKo
        ? [
            '👆 아래로 스와이프: 실시간 타격 수도 내리치기',
            '💥 파편 슬로우모션 폭발 연출 및 콤보 팡파레',
            '⏱️ 35초 타임어택 고득점 챌린지'
          ]
        : [
            '👆 Downward Swipe: Instant responsive karate hand strike',
            '💥 Slow-motion shard shatter blast and combo fanfare',
            '⏱️ 35s time attack breaking sprint'
          ],
      iconType: 'GESTURES',
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '격파 완료 즉시 NIGHTMARE 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Nightmare payout deposited atomically to your LocalStorage wallet upon match finish.',
      keyPoints: isKo
        ? [
            '완료 즉시 LocalStorage 영구 지갑 입금',
            '격파 단수 및 올브레이크 콤보 비례 대량 잭팟',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Smashed block layers and all-break combo multipliers',
            'VictoryRewardModal golden coin fanfare'
          ],
      iconType: 'REWARDS',
    },
  ];

  const currentTarget = BREAK_TARGETS[currentTargetIdx] || BREAK_TARGETS[0];

  return (
    <div className="relative w-full h-[100dvh] bg-[#140c06] text-white font-mono select-none flex flex-col overflow-hidden items-center justify-between touch-none">
      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '블리츠 가라테 찹' : 'Blitz Karate Chop'}
        language={(language as Language) || 'ko'}
        telemetries={[
          { label: isKo ? '단계' : 'Stage', value: `${currentTargetIdx + 1}/${BREAK_TARGETS.length} ${isKo ? currentTarget.name : currentTarget.enName}`, color: 'text-amber-400 font-bold' },
          { label: isKo ? '격파' : 'Broken', value: `${brokenLayers}/10단`, color: brokenLayers >= 10 ? 'text-yellow-300 font-bold animate-bounce' : 'text-slate-300' },
          { label: isKo ? '시간' : 'Time', value: `${timeLeft}s`, color: timeLeft <= 10 ? 'text-rose-500 font-bold animate-pulse' : 'text-cyan-400 font-bold' },
          { label: isKo ? '콤보' : 'Combo', value: `${chopCombo}x`, color: chopCombo > 4 ? 'text-emerald-400 font-bold' : 'text-slate-300' },
          { label: isKo ? '점수' : 'Score', value: `${score}P`, color: 'text-amber-300 font-bold' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => setIsPaused(prev => !prev)}
        isPaused={isPaused}
      />

      {/* Pure Touch Karate Chop Canvas Viewport */}
      <div className="flex-1 w-full max-w-md relative overflow-hidden flex items-center justify-center select-none touch-none p-2">
        <canvas
          ref={canvasRef}
          width={360}
          height={500}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
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
          {isKo ? '위에서 아래로 빠르게 스와이프하여 블록을 격파하세요' : 'Swipe down rapidly from top to bottom to chop blocks'}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="arcade_karate_chop"
          gameTitle={isKo ? '블리츠 가라테: 수도 격파' : 'Blitz Karate: Power Chop'}
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
export default VoxelKarateBreakGame;
