import { drawCardSprite } from '../lib/canvasCardRenderer';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData, Language } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelDojoBalanceGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface RivalFighter {
  name: string;
  enName: string;
  avatar: string;
  cardId: number;
  pushPower: number; // Opponent pushing strength
}

const RIVALS: RivalFighter[] = [
  { name: '도장 수련생', enName: 'Trainee', avatar: '🥋', cardId: 4, pushPower: 38 },
  { name: '붉은 오니', enName: 'Red Oni', avatar: '👹', cardId: 27, pushPower: 50 },
  { name: '천하장사 요코즈나', enName: 'Yokozuna', avatar: '🤼', cardId: 65, pushPower: 65 },
];

export const VoxelDojoBalanceGame: React.FC<VoxelDojoBalanceGameProps> = ({
  deck = [],
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
  const playerHeroId = deck[0]?.id || 98;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  const [currentRivalIdx, setCurrentRivalIdx] = useState<number>(0);
  const [powerMeter, setPowerMeter] = useState<number>(50); // 0 (player loses) ~ 100 (rival pushed out)
  const [score, setScore] = useState<number>(0);
  const [tapCombo, setTapCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(35);
  const [feedbackText, setFeedbackText] = useState<string | null>(null);

  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_game_sumo_tackle') !== 'true';
    } catch {
      return true;
    }
  });
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const stateRef = useRef({
    rivalIdx: 0,
    power: 50,
    score: 0,
    tapCombo: 0,
    maxCombo: 0,
    timeLeft: 35,
    isGameOver: false,
    isPaused: false,
    startTime: Date.now(),
    shakeAnim: 0,
  });

  const initGame = useCallback(() => {
    const s = stateRef.current;
    s.rivalIdx = 0;
    s.power = 50;
    s.score = 0;
    s.tapCombo = 0;
    s.maxCombo = 0;
    s.timeLeft = 35;
    s.isGameOver = false;
    s.startTime = Date.now();
    s.shakeAnim = 0;

    setCurrentRivalIdx(0);
    setPowerMeter(50);
    setScore(0);
    setTapCombo(0);
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
          endGame(false);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isGameOver, isPaused]);

  // Direct Screen Tap Rush (Zero Joysticks)
  const handleTapRush = () => {
    const s = stateRef.current;
    if (s.isGameOver || s.isPaused) return;

    s.power = Math.min(100, s.power + 5.5);
    s.tapCombo += 1;
    if (s.tapCombo > s.maxCombo) s.maxCombo = s.tapCombo;
    s.shakeAnim = 8;

    const pts = 30 + s.tapCombo * 5;
    s.score += pts;

    setPowerMeter(Math.round(s.power));
    setTapCombo(s.tapCombo);
    setMaxCombo(s.maxCombo);
    setScore(s.score);

    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');

    // Check Ring-out Victory for current rival
    if (s.power >= 100) {
      if (s.rivalIdx < RIVALS.length - 1) {
        s.score += 800;
        s.rivalIdx += 1;
        s.power = 50;
        setCurrentRivalIdx(s.rivalIdx);
        setPowerMeter(50);
        setFeedbackText(`RING OUT! STAGE ${s.rivalIdx + 1} 💥`);
        setTimeout(() => setFeedbackText(null), 500);
        playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
      } else {
        // Champion Victory!
        endGame(true);
      }
    }
  };

  // Main 60FPS Dojo Sumo Engine Loop
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

      // Opponent pushes back!
      const currentRival = RIVALS[s.rivalIdx];
      s.power = Math.max(0, s.power - currentRival.pushPower * dt);
      setPowerMeter(Math.round(s.power));

      if (s.shakeAnim > 0) s.shakeAnim = Math.max(0, s.shakeAnim - 25 * dt);

      // Player pushed out ➔ Defeat
      if (s.power <= 0) {
        playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
        endGame(false);
        return;
      }

      // ── Canvas Rendering ──
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Dojo Ring Arena Background
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(0, 0, w, h);

      // Circular Ring (Dohyo)
      const centerX = w / 2;
      const centerY = 270;

      ctx.fillStyle = '#b45309';
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, 150, 110, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 4;
      ctx.stroke();

      // Center Line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY - 100);
      ctx.lineTo(centerX, centerY + 100);
      ctx.stroke();

      // Power Gauge Tug-of-War Bar on Ring
      const pushOffset = ((s.power - 50) / 50) * 110;
      const shakeX = (Math.random() - 0.5) * s.shakeAnim;

      // Render Player Sumo Fighter (Left Side, Hero Card Sprite)
      const playerX = centerX - 45 + pushOffset + shakeX;
      const playerY = centerY;

      drawCardSprite(
        ctx,
        playerHeroId,
        playerX - 32,
        playerY - 32,
        64,
        64,
        {
          circleClip: true,
          borderWidth: 2,
          borderColor: '#38bdf8',
          shadowBlur: 12,
          shadowColor: 'rgba(56, 189, 248, 0.8)',
        }
      );

      // Render Rival Fighter (Right Side, Rival Card Sprite)
      const rivalX = centerX + 45 + pushOffset - shakeX;
      const rivalY = centerY;

      drawCardSprite(
        ctx,
        currentRival.cardId,
        rivalX - 32,
        rivalY - 32,
        64,
        64,
        {
          circleClip: true,
          borderWidth: 2,
          borderColor: '#ef4444',
          shadowBlur: 12,
          shadowColor: 'rgba(239, 68, 68, 0.8)',
        }
      );

      // Impact Clash Sparks in Middle
      const clashX = (playerX + rivalX) / 2;
      ctx.font = '28px serif';
      ctx.fillText('💥', clashX, centerY - 35);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [playSfx, currentRivalIdx, playerHeroId]);

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
      gameId: 'arcade_sumo_tackle',
      gameTitle: '블리츠 스모 태클',
      durationSeconds: duration,
      score: s.score + (isWin ? 3000 : (s.rivalIdx + 1) * 500) + s.maxCombo * 60,
      difficulty: 'NIGHTMARE',
      isVictory: isWin || s.rivalIdx >= 2,
    });
    setSettlementReceipt(receipt);
    onReward(receipt.totalSns);
  };

  const tutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 초고속 탭 태클 배틀' : 'STEP 1: FAST TAP TACKLE',
      title: isKo ? '화면을 광속으로 연타하여 상대를 밀어내세요' : 'Fast Tap Screen to Push Opponent Out of Ring',
      description: isKo
        ? '가상 조이스틱 없이 화면을 손가락으로 빠르게 연타(Tap Rush)하여 상대 리키시를 도효(링) 밖으로 밀어내고 3인의 라이벌을 제패하세요.'
        : 'Tap rapidly anywhere to build push momentum and shove rival fighters out of the dohyo ring.',
      keyPoints: isKo
        ? [
            '가상 조이스틱 0개 (100% 화면 직접 광속 탭 연타)',
            '상대방도 밀어붙이므로 쉼 없이 빠른 연타가 핵심',
            '게이지 100% 달성 시 즉시 링아웃 승리 및 다음 라이벌 등장'
          ]
        : [
            'Zero Virtual Joysticks: 100% Direct Rapid Screen Tapping',
            'Opponents push back forcefully, require relentless taps',
            'Reach 100% power gauge to score instant ring-out knockouts'
          ],
      iconType: 'GOAL',
    },
    {
      badge: isKo ? 'STEP 2: 모바일 퓨어 제스처' : 'STEP 2: PURE GESTURES',
      title: isKo ? '양손 원터치 광속 탭 (Rapid Tapping)' : 'Multi-Finger Rapid Tap',
      description: isKo
        ? '화면 아무 곳이나 양손 엄지 또는 검지로 마구 두드립니다.'
        : 'Use both thumbs or index fingers to tap anywhere on the screen rapidly.',
      keyPoints: isKo
        ? [
            '👆 연속 탭 연타: 실시간 파워 게이지 폭풍 전진',
            '⚡ 탭 콤보 배수 보너스로 점수 대량 가산',
            '🥊 3인의 도장 라이벌을 모두 격파하세요'
          ]
        : [
            '👆 Rapid Tapping: Real-time power tug-of-war advancement',
            '⚡ High tap combo multipliers grant massive score',
            '🥊 Defeat all 3 dojo rivals to become Grand Champion'
          ],
      iconType: 'GESTURES',
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '결투 완료 즉시 NIGHTMARE 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Nightmare payout deposited atomically to your LocalStorage wallet upon match finish.',
      keyPoints: isKo
        ? [
            '완료 즉시 LocalStorage 영구 지갑 입금',
            '격파 라이벌 수 및 탭 콤보 비례 대량 잭팟',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Defeated rivals and max tap combo multipliers',
            'VictoryRewardModal golden coin fanfare'
          ],
      iconType: 'REWARDS',
    },
  ];

  const currentRival = RIVALS[currentRivalIdx] || RIVALS[0];

  return (
    <div
      onClick={handleTapRush}
      className="relative w-full h-[100dvh] bg-[#0c0a09] text-white font-mono select-none flex flex-col overflow-hidden items-center justify-between touch-none cursor-pointer"
    >
      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <div onClick={(e) => e.stopPropagation()} className="w-full">
        <MinimalistMissionHUD
          title={isKo ? '블리츠 스모 태클' : 'Blitz Sumo Tackle'}
          language={(language as Language) || 'ko'}
          telemetries={[
            { label: isKo ? '라이벌' : 'Rival', value: `${currentRivalIdx + 1}/${RIVALS.length} ${currentRival.avatar}`, color: 'text-amber-400 font-bold' },
            { label: isKo ? '밀치기' : 'Power', value: `${powerMeter}%`, color: powerMeter >= 70 ? 'text-emerald-400 font-bold' : powerMeter <= 30 ? 'text-rose-500 font-bold animate-pulse' : 'text-cyan-300' },
            { label: isKo ? '연타' : 'Combo', value: `${tapCombo}x`, color: tapCombo > 15 ? 'text-amber-300 font-bold animate-bounce' : 'text-slate-300' },
            { label: isKo ? '점수' : 'Score', value: `${score}P`, color: 'text-cyan-300 font-bold' }
          ]}
          onExit={onExit}
          onHelp={() => setShowTutorial(true)}
          onPauseToggle={() => setIsPaused(prev => !prev)}
          isPaused={isPaused}
        />
      </div>

      {/* Pure Touch Sumo Ring Canvas Viewport */}
      <div className="flex-1 w-full max-w-md relative overflow-hidden flex flex-col items-center justify-center select-none touch-none p-2">
        {/* Tug of War Push Power Bar */}
        <div className="w-64 bg-slate-800 border border-slate-600 h-5 rounded-full overflow-hidden mb-3 relative flex items-center">
          <div
            className="h-full bg-gradient-to-r from-rose-500 via-amber-400 to-cyan-400 transition-all duration-75"
            style={{ width: `${powerMeter}%` }}
          />
          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white drop-shadow">
            {isKo ? `도효 밀치기: ${powerMeter}%` : `Ring Push: ${powerMeter}%`}
          </span>
        </div>

        <canvas
          ref={canvasRef}
          width={360}
          height={420}
          className="w-full object-contain touch-none shadow-2xl"
        />

        {/* Floating Feedback Text */}
        {feedbackText && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none text-xl font-bold text-amber-300 drop-shadow-lg animate-bounce whitespace-nowrap">
            {feedbackText}
          </div>
        )}
      </div>

      {/* Minimal Bottom Guide */}
      <div className="w-full pb-3 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1 bg-black/50 border border-white/10 rounded-full text-[10px] text-slate-300 font-mono animate-pulse">
          {isKo ? '화면을 마구 연타하여 상대를 밀어내세요! (광속 탭 연타)' : 'Tap screen rapidly to push opponent out of the ring!'}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <div onClick={(e) => e.stopPropagation()}>
          <UniversalTutorialModal
            gameId="arcade_sumo_tackle"
            gameTitle={isKo ? '블리츠 스모 태클: 연타 배틀' : 'Blitz Sumo Tackle: Tap Battle'}
            customSteps={tutorialSteps}
            language={(language as Language) || 'ko'}
            onStartGame={() => setShowTutorial(false)}
            onClose={() => setShowTutorial(false)}
          />
        </div>
      )}

      {/* Victory Reward Settlement Modal */}
      {isGameOver && settlementReceipt && (
        <div onClick={(e) => e.stopPropagation()}>
          <VictoryRewardModal
            receipt={settlementReceipt}
            language={(language as Language) || 'ko'}
            onPlayAgain={initGame}
            onExit={onExit}
          />
        </div>
      )}
    </div>
  );
};
export default VoxelDojoBalanceGame;
