import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData, Language } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';
import { drawCardSprite } from '../lib/canvasCardRenderer';

interface PacmanGameProps {
  deck: CardData[];
  language: Language;
  lowSpecMode?: boolean;
  playSfx: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

const GRID_SIZE = 15;
const CELL_SIZE = 22;
const CANVAS_SIZE = GRID_SIZE * CELL_SIZE;

const MAZE: number[][] = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,0,1,0,0,0,0,0,0,1],
  [1,0,1,1,0,1,0,0,0,1,0,1,1,0,1],
  [1,2,0,0,0,0,0,0,0,0,0,0,0,2,1],
  [1,0,1,0,1,0,1,1,1,0,1,0,1,0,1],
  [1,0,0,0,1,0,0,0,0,0,1,0,0,0,1],
  [1,1,1,0,0,0,1,3,1,0,0,0,1,1,1],
  [1,0,0,0,1,0,0,0,0,0,1,0,0,0,1],
  [1,0,1,0,1,0,1,1,1,0,1,0,1,0,1],
  [1,2,0,0,0,0,0,0,0,0,0,0,0,2,1],
  [1,0,1,1,0,1,0,0,0,1,0,1,1,0,1],
  [1,0,0,0,0,0,0,1,0,0,0,0,0,0,1],
  [1,0,1,0,1,0,1,1,1,0,1,0,1,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

export const PacmanGame: React.FC<PacmanGameProps> = ({
  deck = [],
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
  const playerHeroId = deck[0]?.id || 21;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef(0);

  const [score, setScore] = useState(0);
  const [dotsLeft, setDotsLeft] = useState(100);
  const [powerTimer, setPowerTimer] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_game_arcade_pacman') !== 'true';
    } catch {
      return true;
    }
  });
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const gameRef = useRef({
    px: 1,
    py: 1,
    pDir: 'right' as 'up' | 'down' | 'left' | 'right',
    ghosts: [
      { x: 7, y: 7, dir: 'up' },
      { x: 7, y: 6, dir: 'down' }
    ],
    maze: [] as number[][],
    score: 0,
    powerTimer: 0,
    isGameOver: false,
    isVictory: false,
    isPaused: false,
    startTime: Date.now(),
  });

  const initGame = useCallback(() => {
    const g = gameRef.current;
    g.px = 1;
    g.py = 1;
    g.pDir = 'right';
    g.ghosts = [
      { x: 7, y: 7, dir: 'up' },
      { x: 7, y: 6, dir: 'down' }
    ];
    g.maze = MAZE.map(row => [...row]);
    g.score = 0;
    g.powerTimer = 0;
    g.isGameOver = false;
    g.isVictory = false;
    g.startTime = Date.now();

    let dots = 0;
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (g.maze[r][c] === 0 || g.maze[r][c] === 2) dots++;
      }
    }

    setScore(0);
    setDotsLeft(dots);
    setPowerTimer(0);
    setIsGameOver(false);
    setSettlementReceipt(null);
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const movePlayer = (dir: 'up' | 'down' | 'left' | 'right') => {
    const g = gameRef.current;
    if (g.isGameOver || g.isPaused) return;

    let nx = g.px;
    let ny = g.py;
    if (dir === 'up') ny--;
    if (dir === 'down') ny++;
    if (dir === 'left') nx--;
    if (dir === 'right') nx++;

    if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE && g.maze[ny][nx] !== 1) {
      g.px = nx;
      g.py = ny;
      g.pDir = dir;

      // Eat dot
      if (g.maze[ny][nx] === 0) {
        g.maze[ny][nx] = 3;
        g.score += 10;
        setScore(g.score);
        setDotsLeft(d => Math.max(0, d - 1));
        playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
      } else if (g.maze[ny][nx] === 2) {
        g.maze[ny][nx] = 3;
        g.score += 50;
        g.powerTimer = 6;
        setScore(g.score);
        setPowerTimer(6);
        setDotsLeft(d => Math.max(0, d - 1));
        playSfx('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
      }
    }
  };

  // Main Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastTime = performance.now();
    let ghostMoveAccum = 0;

    const loop = (now: number) => {
      animFrameRef.current = requestAnimationFrame(loop);
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const g = gameRef.current;
      if (g.isPaused || g.isGameOver) return;

      // Power timer countdown
      if (g.powerTimer > 0) {
        g.powerTimer = Math.max(0, g.powerTimer - dt);
        setPowerTimer(Math.ceil(g.powerTimer));
      }

      // Move ghosts
      ghostMoveAccum += dt;
      if (ghostMoveAccum >= 0.25) {
        ghostMoveAccum = 0;
        g.ghosts.forEach(ghost => {
          const dirs: ('up' | 'down' | 'left' | 'right')[] = ['up', 'down', 'left', 'right'];
          const validDirs = dirs.filter(d => {
            let gx = ghost.x;
            let gy = ghost.y;
            if (d === 'up') gy--;
            if (d === 'down') gy++;
            if (d === 'left') gx--;
            if (d === 'right') gx++;
            return gx >= 0 && gx < GRID_SIZE && gy >= 0 && gy < GRID_SIZE && g.maze[gy][gx] !== 1;
          });

          if (validDirs.length > 0) {
            const nextD = validDirs[Math.floor(Math.random() * validDirs.length)];
            if (nextD === 'up') ghost.y--;
            if (nextD === 'down') ghost.y++;
            if (nextD === 'left') ghost.x--;
            if (nextD === 'right') ghost.x++;
            ghost.dir = nextD;
          }
        });
      }

      // Check Ghost Collisions
      g.ghosts.forEach(ghost => {
        if (ghost.x === g.px && ghost.y === g.py) {
          if (g.powerTimer > 0) {
            // Eat ghost
            ghost.x = 7;
            ghost.y = 7;
            g.score += 200;
            setScore(g.score);
            playSfx('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
          } else {
            // Pacman Died
            g.isGameOver = true;
            setIsGameOver(true);
            playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
            const duration = (Date.now() - g.startTime) / 1000;
            const receipt = calculateAndDepositMissionReward({
              gameId: 'arcade_pacman',
              gameTitle: '클래식 팩맨 미로',
              durationSeconds: duration,
              score: g.score,
              difficulty: 'HARD',
              isVictory: false
            });
            setSettlementReceipt(receipt);
            onReward(receipt.totalSns);
          }
        }
      });

      // Render
      ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

      // Maze Render
      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          const type = g.maze[r][c];
          const x = c * CELL_SIZE;
          const y = r * CELL_SIZE;

          if (type === 1) {
            ctx.fillStyle = '#0284c7';
            ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
          } else if (type === 0) {
            ctx.fillStyle = '#facc15';
            ctx.beginPath();
            ctx.arc(x + CELL_SIZE / 2, y + CELL_SIZE / 2, 2.5, 0, Math.PI * 2);
            ctx.fill();
          } else if (type === 2) {
            ctx.fillStyle = '#eab308';
            ctx.beginPath();
            ctx.arc(x + CELL_SIZE / 2, y + CELL_SIZE / 2, 6, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // Render Pacman Hero (Card Hero Sprite from cards1.png / cards2.png)
      drawCardSprite(
        ctx,
        playerHeroId,
        g.px * CELL_SIZE + 1,
        g.py * CELL_SIZE + 1,
        CELL_SIZE - 2,
        CELL_SIZE - 2,
        {
          circleClip: true,
          borderWidth: 1.5,
          borderColor: '#facc15',
          shadowBlur: 6,
          shadowColor: 'rgba(250, 204, 21, 0.6)',
        }
      );

      // Render Ghosts (Card Monster Sprites)
      g.ghosts.forEach((ghost, idx) => {
        const ghostMonsterId = g.powerTimer > 0 ? 100 : (idx === 0 ? 4 : 14);
        drawCardSprite(
          ctx,
          ghostMonsterId,
          ghost.x * CELL_SIZE + 1,
          ghost.y * CELL_SIZE + 1,
          CELL_SIZE - 2,
          CELL_SIZE - 2,
          {
            circleClip: true,
            borderWidth: 1.5,
            borderColor: g.powerTimer > 0 ? '#38bdf8' : '#f43f5e',
            shadowBlur: 6,
            shadowColor: g.powerTimer > 0 ? 'rgba(56, 189, 248, 0.6)' : 'rgba(244, 63, 94, 0.6)',
          }
        );
      });
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [onReward, playSfx, playerHeroId]);

  const tutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 미로 도트 100% 수집' : 'STEP 1: EAT ALL DOTS',
      title: isKo ? '도트 수집 & 유령 회피' : 'Collect Dots & Dodge Ghosts',
      description: isKo
        ? '미로를 질주하며 모든 도트를 수집하세요. 파워 펠릿을 먹으면 유령을 사냥할 수 있습니다.'
        : 'Navigate maze to collect all yellow dots while evading enemy ghosts.',
      keyPoints: isKo
        ? [
            '모든 도트 수집 시 완승',
            '유령과 접촉 시 게임 오버',
            '큰 파워 펠릿 획득 시 6초간 유령 포획 가능'
          ]
        : [
            'Collect all dots to win',
            'Touching ghosts causes defeat',
            'Power pellets allow hunting ghosts for 6s'
          ],
      iconType: 'GOAL'
    },
    {
      badge: isKo ? 'STEP 2: 퓨어 제스처 조작' : 'STEP 2: PURE GESTURES',
      title: isKo ? '스와이프 & 원핸드 D-패드' : 'Swipe & D-Pad Move',
      description: isKo
        ? '화면 스와이프 또는 하단 D-패드로 4방향 미로 이동을 신속하게 조작합니다.'
        : 'Swipe screen or tap one-handed D-pad for 4-way maze navigation.',
      keyPoints: isKo
        ? [
            '👆 스와이프: 상하좌우 신속 방향 전환',
            '🕹️ 컴팩트 D-패드 원터치 조작',
            '⚡ 코너 자동 턴 메커니즘'
          ]
        : [
            '👆 Swipe: Quick 4-way direction shifts',
            '🕹️ Compact D-pad one-touch move',
            '⚡ Responsive corner turns'
          ],
      iconType: 'GESTURES'
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '미로 완주 즉시 HARD 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Standard payout deposited atomically to your LocalStorage wallet upon maze clearance.',
      keyPoints: isKo
        ? [
            '승리 즉시 LocalStorage 영구 지갑 입금',
            '수집 도트 및 유령 사냥 보너스',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Dot count and ghost hunt multipliers',
            'VictoryRewardModal golden coin fanfare'
          ],
      iconType: 'REWARDS'
    }
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-[#fdfcfc] text-[#201d1d] font-mono select-none flex flex-col overflow-hidden items-center justify-between">
      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '클래식 팩맨' : 'Classic Pacman'}
        language={language}
        telemetries={[
          { label: isKo ? '도트' : 'Dots', value: `${dotsLeft}`, color: 'text-cyan-700 font-bold' },
          { label: isKo ? '파워' : 'Power', value: powerTimer > 0 ? `${powerTimer}s` : 'OFF', color: powerTimer > 0 ? 'text-amber-600 font-bold' : 'text-slate-400' },
          { label: isKo ? '점수' : 'Score', value: `${score}P`, color: 'text-emerald-700 font-bold' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => setIsPaused(prev => !prev)}
        isPaused={isPaused}
      />

      {/* Maze Viewport */}
      <div className="flex-1 min-h-0 flex items-center justify-center relative overflow-hidden p-2 w-full max-w-sm">
        <canvas
          ref={canvasRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          className="border border-[rgba(15,0,0,0.15)] shadow-xs rounded-none bg-white"
        />
      </div>

      {/* Mobile One-Handed D-Pad */}
      <div className="shrink-0 flex flex-col items-center gap-1 select-none pb-3">
        <button
          type="button"
          onClick={() => movePlayer('up')}
          className="w-14 h-11 rounded-sm bg-black/5 active:bg-amber-500/30 border border-[rgba(15,0,0,0.15)] flex items-center justify-center text-sm font-mono text-[#201d1d] active:scale-95 touch-manipulation"
        >
          ▲
        </button>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => movePlayer('left')}
            className="w-14 h-11 rounded-sm bg-black/5 active:bg-amber-500/30 border border-[rgba(15,0,0,0.15)] flex items-center justify-center text-sm font-mono text-[#201d1d] active:scale-95 touch-manipulation"
          >
            ◀
          </button>
          <button
            type="button"
            onClick={() => movePlayer('down')}
            className="w-14 h-11 rounded-sm bg-black/5 active:bg-amber-500/30 border border-[rgba(15,0,0,0.15)] flex items-center justify-center text-sm font-mono text-[#201d1d] active:scale-95 touch-manipulation"
          >
            ▼
          </button>
          <button
            type="button"
            onClick={() => movePlayer('right')}
            className="w-14 h-11 rounded-sm bg-black/5 active:bg-amber-500/30 border border-[rgba(15,0,0,0.15)] flex items-center justify-center text-sm font-mono text-[#201d1d] active:scale-95 touch-manipulation"
          >
            ▶
          </button>
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="arcade_pacman"
          gameTitle={isKo ? '클래식 팩맨 미로: 팩 히어로' : 'Classic Pacman: Maze Runner'}
          customSteps={tutorialSteps}
          language={language}
          onStartGame={() => setShowTutorial(false)}
          onClose={() => setShowTutorial(false)}
        />
      )}

      {/* Victory Reward Settlement Modal */}
      {isGameOver && settlementReceipt && (
        <VictoryRewardModal
          receipt={settlementReceipt}
          language={language}
          onPlayAgain={initGame}
          onExit={onExit}
        />
      )}
    </div>
  );
};
export default PacmanGame;
