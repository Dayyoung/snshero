import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData, Language } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelGolfMasterGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface GolfObstacle {
  x: number;
  y: number;
  w: number;
  h: number;
}

const GOLF_COURSES = [
  {
    id: 1,
    name: '파 3 그린 코스',
    enName: 'Par 3 Green Course',
    ballStart: { x: 180, y: 420 },
    hole: { x: 180, y: 90, radius: 16 },
    obstacles: [] as GolfObstacle[],
    par: 1,
  },
  {
    id: 2,
    name: '벙커 해저드 코스',
    enName: 'Bunker Hazard Course',
    ballStart: { x: 180, y: 420 },
    hole: { x: 260, y: 80, radius: 16 },
    obstacles: [
      { x: 100, y: 220, w: 160, h: 24 },
    ],
    par: 2,
  },
  {
    id: 3,
    name: '지그재그 핀볼 코스',
    enName: 'Zigzag Pinball Course',
    ballStart: { x: 80, y: 420 },
    hole: { x: 280, y: 80, radius: 16 },
    obstacles: [
      { x: 50, y: 280, w: 180, h: 20 },
      { x: 130, y: 180, w: 180, h: 20 },
    ],
    par: 2,
  },
  {
    id: 4,
    name: '마스터스 챔피언십 코스',
    enName: 'Masters Championship',
    ballStart: { x: 180, y: 430 },
    hole: { x: 180, y: 70, radius: 15 },
    obstacles: [
      { x: 80, y: 320, w: 90, h: 20 },
      { x: 190, y: 320, w: 90, h: 20 },
      { x: 135, y: 180, w: 90, h: 20 },
    ],
    par: 3,
  },
];

export const VoxelGolfMasterGame: React.FC<VoxelGolfMasterGameProps> = ({
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

  const [currentCourseIdx, setCurrentCourseIdx] = useState<number>(0);
  const [strokesCount, setStrokesCount] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [holeInOneCount, setHoleInOneCount] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(35);
  const [feedbackText, setFeedbackText] = useState<string | null>(null);

  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_game_golf_sling') !== 'true';
    } catch {
      return true;
    }
  });
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const stateRef = useRef({
    courseIdx: 0,
    ballX: 180,
    ballY: 420,
    ballVx: 0,
    ballVy: 0,
    isAiming: false,
    aimStart: { x: 180, y: 420 },
    aimCurrent: { x: 180, y: 420 },
    isBallMoving: false,
    courseStrokes: 0,
    totalStrokes: 0,
    holeInOnes: 0,
    score: 0,
    timeLeft: 35,
    isGameOver: false,
    isPaused: false,
    startTime: Date.now(),
  });

  const setupCourse = useCallback((idx: number) => {
    const s = stateRef.current;
    const course = GOLF_COURSES[idx] || GOLF_COURSES[0];
    s.courseIdx = idx;
    s.ballX = course.ballStart.x;
    s.ballY = course.ballStart.y;
    s.ballVx = 0;
    s.ballVy = 0;
    s.isAiming = false;
    s.isBallMoving = false;
    s.courseStrokes = 0;

    setCurrentCourseIdx(idx);
  }, []);

  const initGame = useCallback(() => {
    const s = stateRef.current;
    s.score = 0;
    s.totalStrokes = 0;
    s.holeInOnes = 0;
    s.timeLeft = 35;
    s.isGameOver = false;
    s.startTime = Date.now();

    setScore(0);
    setStrokesCount(0);
    setHoleInOneCount(0);
    setTimeLeft(35);
    setFeedbackText(null);
    setIsGameOver(false);
    setSettlementReceipt(null);

    setupCourse(0);
  }, [setupCourse]);

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

  // Touch Slingshot Drag & Release Handlers (Zero Joysticks)
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = stateRef.current;
    if (s.isGameOver || s.isPaused || s.isBallMoving) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const tapX = (e.clientX - rect.left) * scaleX;
    const tapY = (e.clientY - rect.top) * scaleY;

    if (Math.hypot(s.ballX - tapX, s.ballY - tapY) < 40) {
      s.isAiming = true;
      s.aimStart = { x: s.ballX, y: s.ballY };
      s.aimCurrent = { x: tapX, y: tapY };
      playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = stateRef.current;
    if (s.isGameOver || s.isPaused || !s.isAiming) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    s.aimCurrent = {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handlePointerUp = () => {
    const s = stateRef.current;
    if (s.isGameOver || s.isPaused || !s.isAiming) return;

    s.isAiming = false;

    const pullX = s.aimStart.x - s.aimCurrent.x;
    const pullY = s.aimStart.y - s.aimCurrent.y;
    const pullDist = Math.hypot(pullX, pullY);

    if (pullDist > 15) {
      // Launch Ball!
      s.isBallMoving = true;
      s.courseStrokes += 1;
      s.totalStrokes += 1;
      setStrokesCount(s.totalStrokes);

      const powerScale = 4.2;
      s.ballVx = pullX * powerScale;
      s.ballVy = pullY * powerScale;

      playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
    }
  };

  // Main 60FPS Golf Ball Physics Engine Loop
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

      const course = GOLF_COURSES[s.courseIdx] || GOLF_COURSES[0];

      // Ball Physics Simulation
      if (s.isBallMoving) {
        s.ballX += s.ballVx * dt;
        s.ballY += s.ballVy * dt;

        // Friction slowing down
        s.ballVx *= Math.pow(0.92, dt * 60);
        s.ballVy *= Math.pow(0.92, dt * 60);

        // Wall Bounce Check
        if (s.ballX < 30) { s.ballX = 30; s.ballVx = -s.ballVx * 0.75; playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'); }
        if (s.ballX > 330) { s.ballX = 330; s.ballVx = -s.ballVx * 0.75; playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'); }
        if (s.ballY < 40) { s.ballY = 40; s.ballVy = -s.ballVy * 0.75; playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'); }
        if (s.ballY > 460) { s.ballY = 460; s.ballVy = -s.ballVy * 0.75; playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'); }

        // Obstacle Collisions
        course.obstacles.forEach((obs) => {
          if (
            s.ballX >= obs.x - 8 &&
            s.ballX <= obs.x + obs.w + 8 &&
            s.ballY >= obs.y - 8 &&
            s.ballY <= obs.y + obs.h + 8
          ) {
            s.ballVy = -s.ballVy * 0.75;
            s.ballVx = -s.ballVx * 0.75;
            playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
          }
        });

        // Hole Cup Collision & Sunk Check
        const distToHole = Math.hypot(s.ballX - course.hole.x, s.ballY - course.hole.y);
        if (distToHole < course.hole.radius + 6 && Math.hypot(s.ballVx, s.ballVy) < 280) {
          // Ball in Hole!
          s.isBallMoving = false;
          const isHoleInOne = s.courseStrokes === 1;

          if (isHoleInOne) {
            s.holeInOnes += 1;
            setHoleInOneCount(s.holeInOnes);
            s.score += 1000;
            setFeedbackText(`🎉 HOLE IN ONE! +1000P 👑`);
          } else {
            const pts = Math.max(200, 700 - s.courseStrokes * 100);
            s.score += pts;
            setFeedbackText(`NICE PUTT! +${pts}P ⛳`);
          }

          setScore(s.score);
          playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');

          setTimeout(() => {
            setFeedbackText(null);
            if (s.courseIdx < GOLF_COURSES.length - 1) {
              setupCourse(s.courseIdx + 1);
            } else {
              // Championship Win!
              endGame(true);
            }
          }, 800);
        }

        // Stop moving when velocity is very low
        if (Math.hypot(s.ballVx, s.ballVy) < 8) {
          s.ballVx = 0;
          s.ballVy = 0;
          s.isBallMoving = false;
        }
      }

      // ── Canvas Rendering ──
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Putting Green Lawn Background
      ctx.fillStyle = '#064e3b';
      ctx.fillRect(0, 0, w, h);

      // Fairway Texture Borders
      ctx.strokeStyle = '#047857';
      ctx.lineWidth = 4;
      ctx.strokeRect(25, 35, w - 50, h - 70);

      // Render Obstacle Bunkers & Walls
      course.obstacles.forEach((obs) => {
        ctx.fillStyle = '#92400e';
        ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
        ctx.strokeStyle = '#fde047';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);
      });

      // Render Hole Cup
      ctx.fillStyle = '#022c22';
      ctx.beginPath();
      ctx.arc(course.hole.x, course.hole.y, course.hole.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Flag Pin
      ctx.font = '22px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⛳', course.hole.x, course.hole.y - 12);

      // Render Aiming Slingshot Guide Line
      if (s.isAiming) {
        const pullX = s.aimStart.x - s.aimCurrent.x;
        const pullY = s.aimStart.y - s.aimCurrent.y;

        ctx.strokeStyle = '#fde047';
        ctx.lineWidth = 3;
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.moveTo(s.ballX, s.ballY);
        ctx.lineTo(s.ballX + pullX * 1.5, s.ballY + pullY * 1.5);
        ctx.stroke();
        ctx.setLineDash([]);

        // Pull Tether
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(s.ballX, s.ballY);
        ctx.lineTo(s.aimCurrent.x, s.aimCurrent.y);
        ctx.stroke();
      }

      // Render Golf Ball
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(s.ballX, s.ballY, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [playSfx, setupCourse]);

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
      gameId: 'arcade_golf_sling',
      gameTitle: '블리츠 미니골프 슬링',
      durationSeconds: duration,
      score: s.score + (isWin ? 3000 : (s.courseIdx + 1) * 500) + s.holeInOnes * 500,
      difficulty: 'NIGHTMARE',
      isVictory: isWin || s.courseIdx >= 2,
    });
    setSettlementReceipt(receipt);
    onReward(receipt.totalSns);
  };

  const tutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 슬링샷 조준 & 퍼팅' : 'STEP 1: SLINGSHOT PUTTING',
      title: isKo ? '골프공을 뒤로 당겨 홀컵에 쏙 넣으세요' : 'Pull Back Golf Ball and Release to Hole In',
      description: isKo
        ? '가상 조이스틱 없이 골프공(⚪)을 손가락으로 터치해 뒤로 당기면 파워와 궤적이 조준되며, 손을 떼어 홀컵(⛳)으로 쏙 퍼팅하세요.'
        : 'Touch the ball and pull backward to aim distance and trajectory, then release to putt.',
      keyPoints: isKo
        ? [
            '가상 조이스틱 0개 (100% 손가락 직접 뒤로 당겨 발사)',
            '원샷 홀인원(Hole in One!) 달성 시 1,000P 대박 잭팟',
            '벽 바운스 쿠션을 활용해 4개 코스를 올클리어하세요'
          ]
        : [
            'Zero Virtual Joysticks: 100% Drag & Release Slingshot',
            'Hole in One awards massive 1,000P jackpot',
            'Use wall bank reflections to clear all 4 courses'
          ],
      iconType: 'GOAL',
    },
    {
      badge: isKo ? 'STEP 2: 모바일 퓨어 제스처' : 'STEP 2: PURE GESTURES',
      title: isKo ? '화면 직접 당기기 & 놓기 (Drag & Release)' : 'Drag & Release Gesture',
      description: isKo
        ? '골프공을 누른 채 반대 방향으로 늘린 뒤 손을 뗍니다.'
        : 'Pull back like a slingshot and release smoothly.',
      keyPoints: isKo
        ? [
            '👆 뒤로 당기기: 실시간 노란 점선 궤적 가이드',
            '⛳ 손 떼기: 물리 감속 & 홀컵 흡입 퍼펙트 퍼팅',
            '⏱️ 35초 타임어택 고득점 챌린지'
          ]
        : [
            '👆 Pull Back: Real-time yellow dotted trajectory guide',
            '⛳ Release: Smooth physics deceleration & cup suction',
            '⏱️ 35s time attack mini-golf sprint'
          ],
      iconType: 'GESTURES',
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '코스 클리어 즉시 NIGHTMARE 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Nightmare payout deposited atomically to your LocalStorage wallet upon match finish.',
      keyPoints: isKo
        ? [
            '완료 즉시 LocalStorage 영구 지갑 입금',
            '완주 코스 수 및 홀인원 횟수 비례 대량 잭팟',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Completed courses and Hole-in-One multipliers',
            'VictoryRewardModal golden coin fanfare'
          ],
      iconType: 'REWARDS',
    },
  ];

  const currentCourse = GOLF_COURSES[currentCourseIdx] || GOLF_COURSES[0];

  return (
    <div className="relative w-full h-[100dvh] bg-[#022c22] text-white font-mono select-none flex flex-col overflow-hidden items-center justify-between touch-none">
      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '블리츠 미니골프' : 'Blitz Mini Golf'}
        language={(language as Language) || 'ko'}
        telemetries={[
          { label: isKo ? '코스' : 'Course', value: `${currentCourseIdx + 1}/${GOLF_COURSES.length} ${isKo ? currentCourse.name : currentCourse.enName}`, color: 'text-amber-400 font-bold' },
          { label: isKo ? '타수' : 'Strokes', value: `${strokesCount}타`, color: 'text-slate-300' },
          { label: isKo ? '시간' : 'Time', value: `${timeLeft}s`, color: timeLeft <= 10 ? 'text-rose-500 font-bold animate-pulse' : 'text-cyan-400 font-bold' },
          { label: isKo ? '점수' : 'Score', value: `${score}P`, color: 'text-amber-300 font-bold' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => setIsPaused(prev => !prev)}
        isPaused={isPaused}
      />

      {/* Pure Touch Mini Golf Canvas Viewport */}
      <div className="flex-1 w-full max-w-md relative overflow-hidden flex items-center justify-center select-none touch-none p-2">
        <canvas
          ref={canvasRef}
          width={360}
          height={500}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="w-full h-full object-contain touch-none cursor-crosshair shadow-2xl"
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
          {isKo ? '골프공을 뒤로 당겨 파워를 조준하고 손을 떼어 발사하세요' : 'Pull back on the golf ball and release to launch'}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="arcade_golf_sling"
          gameTitle={isKo ? '블리츠 미니골프: 원터치 퍼팅' : 'Blitz Mini Golf: Slingshot Putting'}
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
export default VoxelGolfMasterGame;
