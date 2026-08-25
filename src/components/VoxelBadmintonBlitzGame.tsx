import { drawCardSprite } from '../lib/canvasCardRenderer';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData, Language } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelBadmintonBlitzGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

export const VoxelBadmintonBlitzGame: React.FC<VoxelBadmintonBlitzGameProps> = ({
  deck = [],
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
  const playerHeroId = deck[0]?.id || 89;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  const [playerScore, setPlayerScore] = useState<number>(0);
  const [aiScore, setAiScore] = useState<number>(0);
  const [rally, setRally] = useState<number>(0);
  const [maxRally, setMaxRally] = useState<number>(0);
  const [smashText, setSmashText] = useState<string | null>(null);

  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_game_pingpong_rally') !== 'true';
    } catch {
      return true;
    }
  });
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const stateRef = useRef({
    paddleX: 180,
    paddleY: 480,
    paddleW: 75,
    paddleH: 14,
    aiPaddleX: 180,
    aiPaddleY: 50,
    aiPaddleW: 70,
    ballX: 180,
    ballY: 260,
    ballVx: 0,
    ballVy: 0,
    ballSpeed: 4.5,
    isServing: true,
    server: 'player' as 'player' | 'ai',
    playerScore: 0,
    aiScore: 0,
    rally: 0,
    maxRally: 0,
    isGameOver: false,
    isPaused: false,
    startTime: Date.now(),
  });

  const resetBall = useCallback((server: 'player' | 'ai') => {
    const s = stateRef.current;
    s.isServing = true;
    s.server = server;
    s.ballSpeed = 4.5;
    s.ballX = 180;
    s.ballY = server === 'player' ? 440 : 80;
    s.ballVx = 0;
    s.ballVy = 0;
  }, []);

  const initGame = useCallback(() => {
    const s = stateRef.current;
    s.paddleX = 180;
    s.paddleY = 480;
    s.aiPaddleX = 180;
    s.aiPaddleY = 50;
    s.playerScore = 0;
    s.aiScore = 0;
    s.rally = 0;
    s.maxRally = 0;
    s.isGameOver = false;
    s.startTime = Date.now();

    setPlayerScore(0);
    setAiScore(0);
    setRally(0);
    setMaxRally(0);
    setSmashText(null);
    setIsGameOver(false);
    setSettlementReceipt(null);
    resetBall('player');
  }, [resetBall]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  // Touch / Pointer Direct Drag Control (Zero Virtual Joystick)
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = stateRef.current;
    if (s.isGameOver || s.isPaused) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;

    const touchX = (e.clientX - rect.left) * scaleX;
    s.paddleX = Math.min(360 - s.paddleW / 2, Math.max(s.paddleW / 2, touchX));

    // Serve on touch tap/drag if serving
    if (s.isServing && s.server === 'player') {
      s.isServing = false;
      s.ballVx = (Math.random() - 0.5) * 4;
      s.ballVy = -s.ballSpeed;
      playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    handlePointerMove(e);
  };

  // Main 60FPS Game Physics Loop
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

      // AI Serve Logic
      if (s.isServing && s.server === 'ai') {
        s.isServing = false;
        s.ballVx = (Math.random() - 0.5) * 3.5;
        s.ballVy = s.ballSpeed;
        playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
      }

      if (!s.isServing) {
        // AI Paddle Tracking
        const aiTargetX = s.ballX + (Math.sin(now * 0.005) * 15);
        const aiSpeed = 3.8 + Math.min(2.0, s.rally * 0.15);
        if (s.aiPaddleX < aiTargetX - 4) {
          s.aiPaddleX += aiSpeed;
        } else if (s.aiPaddleX > aiTargetX + 4) {
          s.aiPaddleX -= aiSpeed;
        }
        s.aiPaddleX = Math.min(360 - s.aiPaddleW / 2, Math.max(s.aiPaddleW / 2, s.aiPaddleX));

        // Ball Movement
        s.ballX += s.ballVx * dt * 60;
        s.ballY += s.ballVy * dt * 60;

        // Side Walls Bounce
        if (s.ballX < 12) {
          s.ballX = 12;
          s.ballVx *= -1;
          playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
        } else if (s.ballX > 348) {
          s.ballX = 348;
          s.ballVx *= -1;
          playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
        }

        // Player Paddle Collision (Bottom)
        if (
          s.ballY >= s.paddleY - 14 &&
          s.ballY <= s.paddleY + 10 &&
          s.ballX >= s.paddleX - s.paddleW / 2 - 8 &&
          s.ballX <= s.paddleX + s.paddleW / 2 + 8 &&
          s.ballVy > 0
        ) {
          const hitOffset = (s.ballX - s.paddleX) / (s.paddleW / 2);
          s.ballSpeed = Math.min(8.5, s.ballSpeed + 0.25);
          s.ballVx = hitOffset * 5.5;
          s.ballVy = -s.ballSpeed;
          s.rally += 1;
          if (s.rally > s.maxRally) s.maxRally = s.rally;
          setRally(s.rally);
          setMaxRally(s.maxRally);

          if (Math.abs(hitOffset) > 0.6) {
            setSmashText('SMASH! ⚡');
            setTimeout(() => setSmashText(null), 400);
            playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
          } else {
            playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
          }
        }

        // AI Paddle Collision (Top)
        if (
          s.ballY <= s.aiPaddleY + 14 &&
          s.ballY >= s.aiPaddleY - 10 &&
          s.ballX >= s.aiPaddleX - s.aiPaddleW / 2 - 8 &&
          s.ballX <= s.aiPaddleX + s.aiPaddleW / 2 + 8 &&
          s.ballVy < 0
        ) {
          const hitOffset = (s.ballX - s.aiPaddleX) / (s.aiPaddleW / 2);
          s.ballSpeed = Math.min(8.5, s.ballSpeed + 0.2);
          s.ballVx = hitOffset * 5.0;
          s.ballVy = s.ballSpeed;
          s.rally += 1;
          if (s.rally > s.maxRally) s.maxRally = s.rally;
          setRally(s.rally);
          setMaxRally(s.maxRally);
          playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
        }

        // Point Scored (Out of top or bottom)
        if (s.ballY > 520) {
          // AI scores
          s.aiScore += 1;
          setAiScore(s.aiScore);
          s.rally = 0;
          setRally(0);
          playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
          checkEndMatch(s.playerScore, s.aiScore);
          if (s.aiScore < 3 && s.playerScore < 3) resetBall('player');
        } else if (s.ballY < 10) {
          // Player scores!
          s.playerScore += 1;
          setPlayerScore(s.playerScore);
          s.rally = 0;
          setRally(0);
          playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
          checkEndMatch(s.playerScore, s.aiScore);
          if (s.aiScore < 3 && s.playerScore < 3) resetBall('ai');
        }
      }

      // ── Canvas Rendering ──
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Ping Pong Table Background (Emerald Blue Table)
      ctx.fillStyle = '#0f3a2c';
      ctx.fillRect(0, 0, w, h);

      // Table Boundary Lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 3;
      ctx.strokeRect(10, 10, w - 20, h - 20);

      // Center Net Line
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(10, h / 2);
      ctx.lineTo(w - 10, h / 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Center Vertical Guide Line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(w / 2, 10);
      ctx.lineTo(w / 2, h - 10);
      ctx.stroke();

      // Render AI Paddle (Red)
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(s.aiPaddleX - s.aiPaddleW / 2, s.aiPaddleY - s.paddleH / 2, s.aiPaddleW, s.paddleH);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(s.aiPaddleX - s.aiPaddleW / 2, s.aiPaddleY - s.paddleH / 2, s.aiPaddleW, s.paddleH);

      // Render Player Paddle (Cyan Blue)
      ctx.fillStyle = '#06b6d4';
      ctx.fillRect(s.paddleX - s.paddleW / 2, s.paddleY - s.paddleH / 2, s.paddleW, s.paddleH);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.strokeRect(s.paddleX - s.paddleW / 2, s.paddleY - s.paddleH / 2, s.paddleW, s.paddleH);

      // Render Ping Pong Ball (Golden Orange)
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(s.ballX, s.ballY, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [onReward, playSfx, resetBall]);

  const checkEndMatch = (pScore: number, aScore: number) => {
    const s = stateRef.current;
    if ((pScore >= 3 || aScore >= 3) && !s.isGameOver) {
      s.isGameOver = true;
      setIsGameOver(true);
      const isVictory = pScore >= 3;
      if (isVictory) {
        playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
      } else {
        playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
      }

      const duration = (Date.now() - s.startTime) / 1000;
      const receipt = calculateAndDepositMissionReward({
        gameId: 'arcade_pingpong_rally',
        gameTitle: '블리츠 핑퐁 랠리',
        durationSeconds: duration,
        score: pScore * 1200 + s.maxRally * 150,
        difficulty: 'NIGHTMARE',
        isVictory: isVictory,
      });
      setSettlementReceipt(receipt);
      onReward(receipt.totalSns);
    }
  };

  const tutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 3점 선취 핑퐁 승리' : 'STEP 1: FIRST TO 3 WINS',
      title: isKo ? '핑퐁 랠리를 이어가며 3점을 선취하세요' : 'Win Rallies to Score 3 Points First',
      description: isKo
        ? '가상 조이스틱 없이 화면을 손가락으로 직접 좌우 드래그하여 날아오는 탁구공을 받아치고 스매시를 날리세요.'
        : 'Drag your finger directly on screen to control the paddle and score 3 points.',
      keyPoints: isKo
        ? [
            '가상 조이스틱 0개 (100% 손가락 직접 좌우 드래그)',
            '라켓 외곽 부분으로 칠수록 강력한 각도 스매시',
            '먼저 3점을 획득하면 완승 정산'
          ]
        : [
            'Zero Virtual Joysticks: 100% Direct Finger Drag',
            'Hit on paddle edges for sharp angle smashes',
            'First to 3 points wins the match'
          ],
      iconType: 'GOAL',
    },
    {
      badge: isKo ? 'STEP 2: 모바일 퓨어 제스처' : 'STEP 2: PURE GESTURES',
      title: isKo ? '화면 직접 터치 & 드래그' : 'Direct Screen Touch & Drag',
      description: isKo
        ? '화면 하단을 손가락으로 슥 밀어 라켓을 공 궤적으로 신속하게 이동시킵니다.'
        : 'Drag across the screen to position your paddle smoothly.',
      keyPoints: isKo
        ? [
            '👆 손가락 드래그: 실시간 즉각적인 라켓 이동',
            '⚡ 서브 시작: 화면 터치 즉시 공 발사',
            '🏓 랠리 누적 시 공 속도 점진적 상승'
          ]
        : [
            '👆 Direct Drag: Instant paddle tracking',
            '⚡ Touch to Serve: Tap to launch ball',
            '🏓 Rallies accelerate ball speed'
          ],
      iconType: 'GESTURES',
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '매치 완료 즉시 NIGHTMARE 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Nightmare payout deposited atomically to your LocalStorage wallet upon match finish.',
      keyPoints: isKo
        ? [
            '완료 즉시 LocalStorage 영구 지갑 입금',
            '승리 및 맥스 랠리 콤보 비례 대량 잭팟',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Win and max rally combo multipliers',
            'VictoryRewardModal golden coin fanfare'
          ],
      iconType: 'REWARDS',
    },
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-[#081c15] text-white font-mono select-none flex flex-col overflow-hidden items-center justify-between touch-none">
      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '블리츠 핑퐁 랠리' : 'Blitz Ping Pong Rally'}
        language={(language as Language) || 'ko'}
        telemetries={[
          { label: isKo ? '스코어' : 'Score', value: `${playerScore} : ${aiScore}`, color: playerScore >= aiScore ? 'text-cyan-400 font-bold' : 'text-rose-500 font-bold' },
          { label: isKo ? '랠리' : 'Rally', value: `${rally}x`, color: rally > 5 ? 'text-amber-400 font-bold animate-bounce' : 'text-slate-300' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => setIsPaused(prev => !prev)}
        isPaused={isPaused}
      />

      {/* Pure Touch Ping Pong Canvas Viewport */}
      <div className="flex-1 w-full max-w-md relative overflow-hidden flex items-center justify-center select-none touch-none">
        <canvas
          ref={canvasRef}
          width={360}
          height={540}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          className="w-full h-full object-contain touch-none cursor-ew-resize"
        />

        {/* Smash Floating Text */}
        {smashText && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none text-2xl font-bold text-amber-300 drop-shadow-md animate-ping">
            {smashText}
          </div>
        )}
      </div>

      {/* Minimal Bottom Guide */}
      <div className="w-full pb-3 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1 bg-black/40 border border-white/10 rounded-full text-[10px] text-slate-300 font-mono">
          {isKo ? '화면을 손가락으로 좌우 드래그하여 공을 받아치세요 (3점 선취승)' : 'Drag across the screen to hit the ball (First to 3 wins)'}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="arcade_pingpong_rally"
          gameTitle={isKo ? '블리츠 핑퐁 랠리: 핑퐁 스포츠' : 'Blitz Ping Pong Rally: Table Tennis'}
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
export default VoxelBadmintonBlitzGame;
