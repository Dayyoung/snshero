import { drawCardSprite } from '../lib/canvasCardRenderer';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData, Language } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelFishingMasterGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface SwimmingFish {
  id: number;
  x: number;
  y: number;
  vx: number;
  type: 'mackerel' | 'tuna' | 'marlin' | 'whale';
  cardId: number;
  icon: string;
  name: string;
  enName: string;
  points: number;
  radius: number;
  isHooked: boolean;
}

export const VoxelFishingMasterGame: React.FC<VoxelFishingMasterGameProps> = ({
  deck = [],
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
  const playerHeroId = deck[0]?.id || 69;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  const [fishCaughtCount, setFishCaughtCount] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [catchCombo, setCatchCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(35);
  const [feedbackText, setFeedbackText] = useState<string | null>(null);

  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_game_fishing_sling') !== 'true';
    } catch {
      return true;
    }
  });
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const stateRef = useRef({
    hookPos: { x: 180, y: 100 },
    hookTarget: { x: 180, y: 100 },
    hookedFish: null as SwimmingFish | null,
    fishes: [] as SwimmingFish[],
    fishCounter: 1,
    spawnTimer: 0,
    fishCaught: 0,
    score: 0,
    catchCombo: 0,
    maxCombo: 0,
    timeLeft: 35,
    isGameOver: false,
    isPaused: false,
    startTime: Date.now(),
    touchStartY: 0,
  });

  const initGame = useCallback(() => {
    const s = stateRef.current;
    s.hookPos = { x: 180, y: 80 };
    s.hookTarget = { x: 180, y: 80 };
    s.hookedFish = null;
    s.fishes = [];
    s.fishCounter = 1;
    s.spawnTimer = 0;
    s.fishCaught = 0;
    s.score = 0;
    s.catchCombo = 0;
    s.maxCombo = 0;
    s.timeLeft = 35;
    s.isGameOver = false;
    s.startTime = Date.now();

    // Initial School of Fish
    for (let i = 0; i < 5; i++) {
      const isRight = Math.random() > 0.5;
      s.fishes.push({
        id: s.fishCounter++,
        x: isRight ? -30 - i * 60 : 390 + i * 60,
        y: 180 + Math.random() * 240,
        vx: isRight ? 60 + Math.random() * 40 : -(60 + Math.random() * 40),
        type: 'mackerel',
        cardId: 9,
        icon: '🐟',
        name: '고등어',
        enName: 'Mackerel',
        points: 150,
        radius: 18,
        isHooked: false,
      });
    }

    setFishCaughtCount(0);
    setScore(0);
    setCatchCombo(0);
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
          const isTargetMet = stateRef.current.fishCaught >= 6;
          endGame(isTargetMet);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isGameOver, isPaused]);

  // Touch Handlers for Direct Hook Tap & Swipe Up Catch (Zero Joysticks)
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
    s.touchStartY = tapY;

    // Cast Hook towards tap position
    s.hookTarget = { x: tapX, y: Math.max(140, tapY) };
    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = stateRef.current;
    if (s.isGameOver || s.isPaused || !s.hookedFish) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleY = canvas.height / rect.height;
    const curY = (e.clientY - rect.top) * scaleY;

    // Swipe Up Reel Catch Gesture!
    if (s.touchStartY - curY > 50) {
      // Reel Up Hooked Fish!
      const fish = s.hookedFish;
      s.hookedFish = null;
      s.hookPos = { x: 180, y: 80 };
      s.hookTarget = { x: 180, y: 80 };

      s.catchCombo += 1;
      if (s.catchCombo > s.maxCombo) s.maxCombo = s.catchCombo;

      const pts = fish.points + s.catchCombo * 30;
      s.score += pts;
      s.fishCaught += 1;

      setScore(s.score);
      setCatchCombo(s.catchCombo);
      setMaxCombo(s.maxCombo);
      setFishCaughtCount(s.fishCaught);

      setFeedbackText(`${isKo ? fish.name : fish.enName} CATCH! +${pts}P 🎣`);
      setTimeout(() => setFeedbackText(null), 400);
      playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');

      // Remove caught fish from array
      const idx = s.fishes.findIndex((f) => f.id === fish.id);
      if (idx !== -1) s.fishes.splice(idx, 1);
    }
  };

  // Main 60FPS Fishing Ocean Loop
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

      // Hook Lerp Movement towards Target
      s.hookPos.x += (s.hookTarget.x - s.hookPos.x) * 10 * dt;
      s.hookPos.y += (s.hookTarget.y - s.hookPos.y) * 10 * dt;

      // Spawn Rare Fishes
      s.spawnTimer += dt;
      if (s.spawnTimer >= 1.2 && s.fishes.length < 8) {
        s.spawnTimer = 0;
        const isRight = Math.random() > 0.5;
        const randVal = Math.random();

        let type: 'mackerel' | 'tuna' | 'marlin' | 'whale' = 'mackerel';
        let cardId = 9;
        let icon = '🐟';
        let name = '고등어';
        let enName = 'Mackerel';
        let pts = 150;
        let rad = 18;

        if (randVal < 0.1) {
          type = 'whale';
          cardId = 49;
          icon = '🐋';
          name = '황금 고래';
          enName = 'Golden Whale';
          pts = 1000;
          rad = 32;
        } else if (randVal < 0.35) {
          type = 'marlin';
          cardId = 34;
          icon = '🦈';
          name = '청새치';
          enName = 'Marlin';
          pts = 450;
          rad = 26;
        } else if (randVal < 0.65) {
          type = 'tuna';
          cardId = 21;
          icon = '🐠';
          name = '참치';
          enName = 'Tuna';
          pts = 280;
          rad = 22;
        }

        s.fishes.push({
          id: s.fishCounter++,
          x: isRight ? -40 : 400,
          y: 160 + Math.random() * 260,
          vx: isRight ? 70 + Math.random() * 50 : -(70 + Math.random() * 50),
          type,
          cardId,
          icon,
          name,
          enName,
          points: pts,
          radius: rad,
          isHooked: false,
        });
      }

      // Update Fishes Movement & Hook Collision Check
      for (let i = s.fishes.length - 1; i >= 0; i--) {
        const fish = s.fishes[i];

        if (fish.isHooked) {
          // Attached to hook
          fish.x = s.hookPos.x;
          fish.y = s.hookPos.y + 10;
        } else {
          fish.x += fish.vx * dt;

          // Check if hook intersects fish
          if (!s.hookedFish && Math.hypot(fish.x - s.hookPos.x, fish.y - s.hookPos.y) < fish.radius + 12) {
            fish.isHooked = true;
            s.hookedFish = fish;
            setFeedbackText(isKo ? 'HIT! 위로 스와이프! ⚡' : 'HIT! SWIPE UP! ⚡');
            playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
          }

          // Remove offscreen fish
          if ((fish.vx > 0 && fish.x > 430) || (fish.vx < 0 && fish.x < -60)) {
            s.fishes.splice(i, 1);
          }
        }
      }

      // ── Canvas Rendering ──
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Deep Ocean Gradient Background
      const oceanGrad = ctx.createLinearGradient(0, 0, 0, h);
      oceanGrad.addColorStop(0, '#0284c7');
      oceanGrad.addColorStop(0.3, '#0369a1');
      oceanGrad.addColorStop(1, '#082f49');
      ctx.fillStyle = oceanGrad;
      ctx.fillRect(0, 0, w, h);

      // Sea Surface Waves
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.fillRect(0, 90, w, 6);

      // Fishing Boat & Angler Hero Badge at Top-Center
      drawCardSprite(
        ctx,
        playerHeroId,
        164,
        60,
        32,
        32,
        {
          circleClip: true,
          borderWidth: 2,
          borderColor: '#38bdf8',
          shadowBlur: 10,
          shadowColor: 'rgba(56, 189, 248, 0.8)',
        }
      );

      // Fishing Line from Boat to Hook
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(180, 75);
      ctx.lineTo(s.hookPos.x, s.hookPos.y);
      ctx.stroke();

      // Fishing Hook (⚓)
      ctx.font = '18px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⚓', s.hookPos.x, s.hookPos.y);

      // Render Swimming Fishes (Card Sprites)
      s.fishes.forEach((fish) => {
        const borderColor =
          fish.type === 'whale'
            ? '#fde047'
            : fish.type === 'marlin'
            ? '#ec4899'
            : fish.type === 'tuna'
            ? '#38bdf8'
            : '#94a3b8';

        drawCardSprite(
          ctx,
          fish.cardId,
          fish.x - fish.radius,
          fish.y - fish.radius,
          fish.radius * 2,
          fish.radius * 2,
          {
            circleClip: true,
            borderWidth: fish.isHooked ? 2 : 1.5,
            borderColor: fish.isHooked ? '#fde047' : borderColor,
            shadowBlur: fish.isHooked ? 12 : 6,
            shadowColor: fish.isHooked ? 'rgba(253, 224, 71, 0.9)' : `${borderColor}88`,
          }
        );
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
      gameId: 'arcade_fishing_sling',
      gameTitle: '블리츠 피싱 슬링',
      durationSeconds: duration,
      score: s.score + s.fishCaught * 250 + s.maxCombo * 50,
      difficulty: 'NIGHTMARE',
      isVictory: isWin && s.fishCaught >= 6,
    });
    setSettlementReceipt(receipt);
    onReward(receipt.totalSns);
  };

  const tutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 탭 투척 & 스와이프 챔질' : 'STEP 1: TAP CAST & REEL SWIPE',
      title: isKo ? '바늘을 던지고 입질 시 위로 낚아채세요' : 'Tap to Cast Hook, Swipe Up on Bite to Catch',
      description: isKo
        ? '가상 조이스틱 없이 바닷속 물고기 무리를 향해 탭하여 낚싯바늘을 투척하고, 바늘에 물고기가 걸리면(HIT!) 즉시 손가락을 위로 슥 스와이프하여 낚아 올리세요.'
        : 'Tap swimming fishes to cast your hook, and swipe up swiftly when hooked to reel them in.',
      keyPoints: isKo
        ? [
            '가상 조이스틱 0개 (100% 화면 직접 탭 투척 & 위로 스와이프 챔질)',
            '청새치(🦈 450P) 및 황금 고래(🐋 1000P) 대형 어종 잭팟',
            '35초간 최대 마릿수의 거대어를 낚아 올리세요'
          ]
        : [
            'Zero Virtual Joysticks: 100% Direct Tap Cast & Swipe Up',
            'Marlin (🦈 450P) and Golden Whale (🐋 1000P) jackpots',
            'Reel in as many trophy fishes as possible in 35s'
          ],
      iconType: 'GOAL',
    },
    {
      badge: isKo ? 'STEP 2: 모바일 퓨어 제스처' : 'STEP 2: PURE GESTURES',
      title: isKo ? '화면 탭 & 위로 스와이프 (Tap & Swipe Up)' : 'Tap & Swipe Up Gesture',
      description: isKo
        ? '화면을 가볍게 탭한 뒤, 입질 반응 시 손가락을 위로 밀어 올립니다.'
        : 'Single tap to drop hook, then flick upward upon bite.',
      keyPoints: isKo
        ? [
            '👆 탭 투척 ➔ ⬆️ 위로 스와이프 챔질 초쾌감 손맛',
            '⚡ 연속 낚시 성공 시 피버 콤보 점수 대량 가산',
            '🎣 35초 타임어택 고득점 챌린지'
          ]
        : [
            '👆 Tap Cast ➔ ⬆️ Upward Flick instant catch feel',
            '⚡ Consecutive catches grant massive combo multipliers',
            '🎣 35s time attack high-score sprint'
          ],
      iconType: 'GESTURES',
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '낚시 종료 즉시 NIGHTMARE 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Nightmare payout deposited atomically to your LocalStorage wallet upon match finish.',
      keyPoints: isKo
        ? [
            '완료 즉시 LocalStorage 영구 지갑 입금',
            '낚은 물고기 총 점수 및 어종 등급 비례 대량 잭팟',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Fish points and rare species multipliers',
            'VictoryRewardModal golden coin fanfare'
          ],
      iconType: 'REWARDS',
    },
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-[#031d30] text-white font-mono select-none flex flex-col overflow-hidden items-center justify-between touch-none">
      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '블리츠 피싱 슬링' : 'Blitz Fishing Sling'}
        language={(language as Language) || 'ko'}
        telemetries={[
          { label: isKo ? '조과' : 'Fish', value: `${fishCaughtCount}마리`, color: 'text-amber-400 font-bold' },
          { label: isKo ? '시간' : 'Time', value: `${timeLeft}s`, color: timeLeft <= 10 ? 'text-rose-500 font-bold animate-pulse' : 'text-cyan-400 font-bold' },
          { label: isKo ? '콤보' : 'Combo', value: `${catchCombo}x`, color: catchCombo > 3 ? 'text-emerald-400 font-bold animate-bounce' : 'text-slate-300' },
          { label: isKo ? '점수' : 'Score', value: `${score}P`, color: 'text-amber-300 font-bold' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => setIsPaused(prev => !prev)}
        isPaused={isPaused}
      />

      {/* Pure Touch Fishing Sling Canvas Viewport */}
      <div className="flex-1 w-full max-w-md relative overflow-hidden flex items-center justify-center select-none touch-none p-2">
        <canvas
          ref={canvasRef}
          width={360}
          height={500}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          className="w-full h-full object-contain touch-none cursor-crosshair shadow-2xl"
        />

        {/* Floating Feedback Text */}
        {feedbackText && (
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 pointer-events-none text-base font-bold text-amber-300 drop-shadow-lg animate-bounce whitespace-nowrap">
            {feedbackText}
          </div>
        )}
      </div>

      {/* Minimal Bottom Guide */}
      <div className="w-full pb-3 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1 bg-black/50 border border-white/10 rounded-full text-[10px] text-slate-300 font-mono">
          {isKo ? '물고기를 향해 탭하여 바늘을 던지고, 걸리면 위로 스와이프하세요' : 'Tap to cast hook at fishes, swipe up upon bite to catch'}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="arcade_fishing_sling"
          gameTitle={isKo ? '블리츠 피싱 슬링: 스피드 낚시' : 'Blitz Fishing Sling: Speed Fishing'}
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
export default VoxelFishingMasterGame;
