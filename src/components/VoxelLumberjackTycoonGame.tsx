import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData, Language } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelLumberjackTycoonGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface TreeTrunk {
  id: number;
  branch: 'none' | 'left' | 'right';
}

export const VoxelLumberjackTycoonGame: React.FC<VoxelLumberjackTycoonGameProps> = ({
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

  const [woodCount, setWoodCount] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [chopCombo, setChopCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [playerSide, setPlayerSide] = useState<'left' | 'right'>('left');
  const [timeLeft, setTimeLeft] = useState<number>(35);
  const [feedbackText, setFeedbackText] = useState<string | null>(null);

  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_game_lumber_chop') !== 'true';
    } catch {
      return true;
    }
  });
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const stateRef = useRef({
    playerSide: 'left' as 'left' | 'right',
    trunks: [] as TreeTrunk[],
    wood: 0,
    score: 0,
    combo: 0,
    maxCombo: 0,
    timeLeft: 35,
    isGameOver: false,
    isPaused: false,
    startTime: Date.now(),
    trunkCounter: 1,
    chopEffects: [] as { x: number; y: number; text: string; color: string; life: number }[],
  });

  const generateTrunk = (counter: number): TreeTrunk => {
    // 35% chance of branch
    const rand = Math.random();
    let branch: 'none' | 'left' | 'right' = 'none';
    if (rand < 0.3) branch = 'left';
    else if (rand < 0.6) branch = 'right';

    return {
      id: counter,
      branch,
    };
  };

  const initGame = useCallback(() => {
    const s = stateRef.current;
    s.playerSide = 'left';
    s.trunks = [];
    s.wood = 0;
    s.score = 0;
    s.combo = 0;
    s.maxCombo = 0;
    s.timeLeft = 35;
    s.isGameOver = false;
    s.startTime = Date.now();
    s.trunkCounter = 1;
    s.chopEffects = [];

    // Initial 6 trunks (first 2 have no branches)
    s.trunks.push({ id: s.trunkCounter++, branch: 'none' });
    s.trunks.push({ id: s.trunkCounter++, branch: 'none' });
    for (let i = 0; i < 5; i++) {
      s.trunks.push(generateTrunk(s.trunkCounter++));
    }

    setPlayerSide('left');
    setWoodCount(0);
    setScore(0);
    setChopCombo(0);
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

  // Touch Handlers: Left Tap / Right Tap to Chop & Move (Zero Joysticks)
  const handleChop = (side: 'left' | 'right') => {
    const s = stateRef.current;
    if (s.isGameOver || s.isPaused) return;

    s.playerSide = side;
    setPlayerSide(side);

    // Bottom trunk being chopped
    s.trunks.shift();
    s.trunks.push(generateTrunk(s.trunkCounter++));

    // Check branch collision with player side
    const bottomTrunk = s.trunks[0];
    if (bottomTrunk && bottomTrunk.branch === side) {
      // Hit by falling branch! Game Over!
      playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
      setFeedbackText(isKo ? '나뭇가지 충돌! 💥' : 'BRANCH HIT! 💥');
      endGame(false);
      return;
    }

    // Successful Chop!
    s.wood += 1;
    s.combo += 1;
    if (s.combo > s.maxCombo) s.maxCombo = s.combo;

    const pts = 80 + s.combo * 15;
    s.score += pts;

    setScore(s.score);
    setWoodCount(s.wood);
    setChopCombo(s.combo);
    setMaxCombo(s.maxCombo);

    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');

    s.chopEffects.push({
      x: side === 'left' ? 120 : 240,
      y: 380,
      text: `+${pts}P 🪵`,
      color: '#fde047',
      life: 0.5,
    });
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const tapX = e.clientX - rect.left;

    if (tapX < rect.width / 2) {
      handleChop('left');
    } else {
      handleChop('right');
    }
  };

  // Main 60FPS Tree Render Loop
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

      // Update Effects
      for (let i = s.chopEffects.length - 1; i >= 0; i--) {
        const eff = s.chopEffects[i];
        eff.y -= 35 * dt;
        eff.life -= dt;
        if (eff.life <= 0) s.chopEffects.splice(i, 1);
      }

      // ── Canvas Rendering ──
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Deep Forest Evening Background
      const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
      bgGrad.addColorStop(0, '#064e3b');
      bgGrad.addColorStop(0.7, '#0f172a');
      bgGrad.addColorStop(1, '#1e293b');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Forest Floor Grass
      ctx.fillStyle = '#14532d';
      ctx.fillRect(0, 440, w, 60);

      // Tree Trunk Stack (Centered at x: 180)
      const treeX = 180;
      const trunkW = 60;
      const trunkH = 50;

      s.trunks.forEach((trk, idx) => {
        const ty = 390 - idx * trunkH;

        // Trunk Body
        ctx.fillStyle = '#78350f';
        ctx.fillRect(treeX - trunkW / 2, ty, trunkW, trunkH - 4);
        ctx.strokeStyle = '#92400e';
        ctx.lineWidth = 2;
        ctx.strokeRect(treeX - trunkW / 2, ty, trunkW, trunkH - 4);

        // Bark texture lines
        ctx.fillStyle = '#451a03';
        ctx.fillRect(treeX - 10, ty + 10, 20, 4);
        ctx.fillRect(treeX - 18, ty + 28, 14, 4);

        // Branch
        if (trk.branch === 'left') {
          ctx.fillStyle = '#92400e';
          ctx.fillRect(treeX - trunkW / 2 - 50, ty + 12, 50, 18);
          ctx.font = '22px serif';
          ctx.fillText('🌿', treeX - trunkW / 2 - 40, ty + 24);
        } else if (trk.branch === 'right') {
          ctx.fillStyle = '#92400e';
          ctx.fillRect(treeX + trunkW / 2, ty + 12, 50, 18);
          ctx.font = '22px serif';
          ctx.fillText('🌿', treeX + trunkW / 2 + 15, ty + 24);
        }
      });

      // Render Lumberjack Player
      const pX = s.playerSide === 'left' ? treeX - 70 : treeX + 70;
      const pY = 405;

      ctx.save();
      ctx.translate(pX, pY);
      if (s.playerSide === 'right') {
        ctx.scale(-1, 1);
      }

      ctx.font = '36px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🪓', 0, 0);
      ctx.restore();

      // Screen Half Divider Guide
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(w / 2, 0);
      ctx.lineTo(w / 2, h);
      ctx.stroke();

      // Left / Right Touch Guidance Hints
      ctx.font = 'bold 12px monospace';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.textAlign = 'center';
      ctx.fillText('👈 TAP LEFT', 70, 470);
      ctx.fillText('TAP RIGHT 👉', w - 70, 470);

      // Render Floating Effects
      s.chopEffects.forEach((eff) => {
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
      gameId: 'arcade_lumber_chop',
      gameTitle: '블리츠 럼버잭 찹',
      durationSeconds: duration,
      score: s.score + (isWin ? 3500 : s.wood * 80) + s.maxCombo * 40,
      difficulty: 'NIGHTMARE',
      isVictory: isWin || s.wood >= 40,
    });
    setSettlementReceipt(receipt);
    onReward(receipt.totalSns);
  };

  const tutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 좌우 탭 광속 벌목' : 'STEP 1: LEFT & RIGHT TAP CHOP',
      title: isKo ? '화면 좌우를 탭해 나뭇가지를 피하며 벌목하세요' : 'Tap Left & Right to Chop while Dodging Branches',
      description: isKo
        ? '가상 조이스틱 없이 화면의 왼쪽(👈)과 오른쪽(👉)을 손가락으로 빠르게 탭하여 거대 나무를 쪼개고, 위에서 떨어져 내리는 나뭇가지(🌿)를 반대쪽으로 피해가며 통나무를 수집하세요.'
        : 'Tap left and right sides of the screen to chop wood while instantly dodging falling branches.',
      keyPoints: isKo
        ? [
            '가상 조이스틱 0개 (100% 화면 좌우 원터치 탭 벌목)',
            '떨어지는 나뭇가지(🌿) 충돌 시 즉시 게임 오버 주의',
            '35초간 최대 콤보로 통나무를 대량 벌목하세요'
          ]
        : [
            'Zero Virtual Joysticks: 100% Left/Right Screen Tap Chops',
            'Avoid colliding with falling branches (🌿) overhead',
            'Chain rapid continuous chops for high score multipliers'
          ],
      iconType: 'GOAL',
    },
    {
      badge: isKo ? 'STEP 2: 모바일 퓨어 제스처' : 'STEP 2: PURE GESTURES',
      title: isKo ? '화면 좌우 분할 탭 (Left/Right Tap)' : 'Left/Right Screen Tap',
      description: isKo
        ? '양손 엄지로 리듬감 있게 좌우를 번갈아 두드립니다.'
        : 'Alternate thumbs quickly between left and right zones.',
      keyPoints: isKo
        ? [
            '👈 왼쪽 탭: 나무 왼쪽 벌목 & 위치 이동',
            '👉 오른쪽 탭: 나무 오른쪽 벌목 & 위치 이동',
            '⏱️ 35초 타임어택 고득점 챌린지'
          ]
        : [
            '👈 Left Tap: Chop from left side of tree',
            '👉 Right Tap: Chop from right side of tree',
            '⏱️ 35s time attack lumberjack sprint'
          ],
      iconType: 'GESTURES',
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '벌목 완료 즉시 NIGHTMARE 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Nightmare payout deposited atomically to your LocalStorage wallet upon match finish.',
      keyPoints: isKo
        ? [
            '완료 즉시 LocalStorage 영구 지갑 입금',
            '벌목한 통나무 수 및 최대 콤보 비례 대량 잭팟',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Chopped logs and maximum combo multipliers',
            'VictoryRewardModal golden coin fanfare'
          ],
      iconType: 'REWARDS',
    },
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-[#0f172a] text-white font-mono select-none flex flex-col overflow-hidden items-center justify-between touch-none">
      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '블리츠 럼버잭' : 'Blitz Lumberjack Chop'}
        language={(language as Language) || 'ko'}
        telemetries={[
          { label: isKo ? '통나무' : 'Wood', value: `${woodCount}개`, color: 'text-amber-400 font-bold' },
          { label: isKo ? '시간' : 'Time', value: `${timeLeft}s`, color: timeLeft <= 10 ? 'text-rose-500 font-bold animate-pulse' : 'text-cyan-400 font-bold' },
          { label: isKo ? '콤보' : 'Combo', value: `${chopCombo}x`, color: chopCombo > 4 ? 'text-emerald-400 font-bold animate-bounce' : 'text-slate-300' },
          { label: isKo ? '점수' : 'Score', value: `${score}P`, color: 'text-amber-300 font-bold' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => setIsPaused(prev => !prev)}
        isPaused={isPaused}
      />

      {/* Pure Touch Lumberjack Canvas Viewport */}
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
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 pointer-events-none text-base font-bold text-amber-300 drop-shadow-lg animate-bounce whitespace-nowrap">
            {feedbackText}
          </div>
        )}
      </div>

      {/* Minimal Bottom Guide */}
      <div className="w-full pb-3 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1 bg-black/50 border border-white/10 rounded-full text-[10px] text-slate-300 font-mono">
          {isKo ? '화면 좌우를 탭해 나뭇가지를 피하며 빠르게 나무를 쪼개세요' : 'Tap left/right to chop wood and dodge falling branches'}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="arcade_lumber_chop"
          gameTitle={isKo ? '블리츠 럼버잭: 스피드 벌목' : 'Blitz Lumberjack: Speed Chop'}
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
export default VoxelLumberjackTycoonGame;
