import { drawCardSprite } from '../lib/canvasCardRenderer';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData, Language } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelNetherPortalGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface NetherGem {
  id: number;
  row: number;
  col: number;
  x: number;
  y: number;
  type: 'purple' | 'blue' | 'red' | 'gold';
  icon: string;
  color: string;
}

export const VoxelNetherPortalGame: React.FC<VoxelNetherPortalGameProps> = ({
  deck = [],
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
  const playerHeroId = deck[0]?.id || 103;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  const [portalEnergy, setPortalEnergy] = useState<number>(0);
  const [linesCleared, setLinesCleared] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [chainCombo, setChainCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(35);
  const [feedbackText, setFeedbackText] = useState<string | null>(null);

  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_game_nether_portal') !== 'true';
    } catch {
      return true;
    }
  });
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const gridRows = 5;
  const gridCols = 5;
  const gemSize = 56;
  const gridOffsetX = 40;
  const gridOffsetY = 110;

  const stateRef = useRef({
    grid: [] as NetherGem[][],
    selectedChain: [] as NetherGem[],
    portalEnergy: 0,
    linesCleared: 0,
    score: 0,
    combo: 0,
    maxCombo: 0,
    timeLeft: 35,
    isGameOver: false,
    isPaused: false,
    startTime: Date.now(),
    gemCounter: 1,
    isDragging: false,
    particles: [] as { x: number; y: number; vx: number; vy: number; color: string; life: number }[],
  });

  const generateGem = useCallback((row: number, col: number): NetherGem => {
    const s = stateRef.current;
    const types: ('purple' | 'blue' | 'red' | 'gold')[] = ['purple', 'blue', 'red', 'purple', 'blue', 'gold'];
    const randType = types[Math.floor(Math.random() * types.length)];

    let icon = '🟣';
    let color = '#a855f7';

    if (randType === 'blue') {
      icon = '🔵';
      color = '#38bdf8';
    } else if (randType === 'red') {
      icon = '🔴';
      color = '#f43f5e';
    } else if (randType === 'gold') {
      icon = '⭐';
      color = '#fde047';
    }

    return {
      id: s.gemCounter++,
      row,
      col,
      x: gridOffsetX + col * gemSize + gemSize / 2,
      y: gridOffsetY + row * gemSize + gemSize / 2,
      type: randType,
      icon,
      color,
    };
  }, []);

  const initGame = useCallback(() => {
    const s = stateRef.current;
    s.portalEnergy = 0;
    s.linesCleared = 0;
    s.score = 0;
    s.combo = 0;
    s.maxCombo = 0;
    s.timeLeft = 35;
    s.isGameOver = false;
    s.startTime = Date.now();
    s.selectedChain = [];
    s.isDragging = false;
    s.particles = [];

    // Build 5x5 Grid
    const newGrid: NetherGem[][] = [];
    for (let r = 0; r < gridRows; r++) {
      const rowGems: NetherGem[] = [];
      for (let c = 0; c < gridCols; c++) {
        rowGems.push(generateGem(r, c));
      }
      newGrid.push(rowGems);
    }
    s.grid = newGrid;

    setPortalEnergy(0);
    setLinesCleared(0);
    setScore(0);
    setChainCombo(0);
    setMaxCombo(0);
    setTimeLeft(35);
    setFeedbackText(null);
    setIsGameOver(false);
    setSettlementReceipt(null);
  }, [generateGem]);

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

  // Find gem at touch coords
  const getGemAtCoords = (x: number, y: number): NetherGem | null => {
    const s = stateRef.current;
    for (let r = 0; r < gridRows; r++) {
      for (let c = 0; c < gridCols; c++) {
        const gem = s.grid[r][c];
        if (gem && Math.hypot(gem.x - x, gem.y - y) < gemSize / 2) {
          return gem;
        }
      }
    }
    return null;
  };

  // Touch Handlers: Direct Drag Line Link (Zero Joysticks)
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = stateRef.current;
    if (s.isGameOver || s.isPaused) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const touchX = (e.clientX - rect.left) * scaleX;
    const touchY = (e.clientY - rect.top) * scaleY;

    const gem = getGemAtCoords(touchX, touchY);
    if (gem) {
      s.isDragging = true;
      s.selectedChain = [gem];
      playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = stateRef.current;
    if (!s.isDragging || s.isGameOver || s.isPaused || s.selectedChain.length === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const touchX = (e.clientX - rect.left) * scaleX;
    const touchY = (e.clientY - rect.top) * scaleY;

    const gem = getGemAtCoords(touchX, touchY);
    if (gem && !s.selectedChain.includes(gem)) {
      const lastGem = s.selectedChain[s.selectedChain.length - 1];
      const isNeighbor = Math.abs(gem.row - lastGem.row) <= 1 && Math.abs(gem.col - lastGem.col) <= 1;
      const isMatching = gem.type === lastGem.type || gem.type === 'gold' || lastGem.type === 'gold';

      if (isNeighbor && isMatching) {
        s.selectedChain.push(gem);
        playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
      }
    }
  };

  const handlePointerUp = () => {
    const s = stateRef.current;
    if (!s.isDragging || s.isGameOver || s.isPaused) return;
    s.isDragging = false;

    if (s.selectedChain.length >= 3) {
      const chainLen = s.selectedChain.length;
      s.linesCleared += 1;
      s.combo += 1;
      if (s.combo > s.maxCombo) s.maxCombo = s.combo;

      const basePts = chainLen * 120 + (chainLen >= 5 ? 400 : 0);
      const finalPts = basePts + s.combo * 30;
      s.score += finalPts;

      s.portalEnergy = Math.min(100, s.portalEnergy + chainLen * 4);

      setPortalEnergy(s.portalEnergy);
      setLinesCleared(s.linesCleared);
      setScore(s.score);
      setChainCombo(s.combo);
      setMaxCombo(s.maxCombo);

      setFeedbackText(`PORTAL LINK ${chainLen}X! +${finalPts}P 🌀`);
      playSfx?.('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
      setTimeout(() => setFeedbackText(null), 400);

      // Particle Flash & Gem Replacement
      s.selectedChain.forEach((gem) => {
        for (let p = 0; p < 6; p++) {
          s.particles.push({
            x: gem.x,
            y: gem.y,
            vx: (Math.random() - 0.5) * 200,
            vy: (Math.random() - 0.5) * 200,
            color: gem.color,
            life: 0.5,
          });
        }
        s.grid[gem.row][gem.col] = generateGem(gem.row, gem.col);
      });

      if (s.portalEnergy >= 100) {
        endGame(true);
      }
    }

    s.selectedChain = [];
  };

  // Main 60FPS Nether Portal Loop
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

      // Nether Dimension Dark Purple Background
      const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
      bgGrad.addColorStop(0, '#1e0533');
      bgGrad.addColorStop(0.6, '#3b0764');
      bgGrad.addColorStop(1, '#0f172a');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Portal Energy Bar at Top
      const barW = 280;
      const barH = 12;
      const barX = (w - barW) / 2;
      const barY = 48;

      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(barX, barY, barW, barH);
      ctx.fillStyle = '#a855f7';
      ctx.fillRect(barX, barY, barW * (s.portalEnergy / 100), barH);
      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(barX, barY, barW, barH);

      ctx.font = 'bold 12px monospace';
      ctx.fillStyle = '#e9d5ff';
      ctx.textAlign = 'center';
      ctx.fillText(`🌀 네더 포탈 개방 에너지 [${s.portalEnergy}%]`, w / 2, barY - 8);

      // Render Active Drag Line Chain
      if (s.selectedChain.length > 1) {
        ctx.strokeStyle = '#fde047';
        ctx.lineWidth = 6;
        ctx.shadowColor = '#fde047';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.moveTo(s.selectedChain[0].x, s.selectedChain[0].y);
        for (let i = 1; i < s.selectedChain.length; i++) {
          ctx.lineTo(s.selectedChain[i].x, s.selectedChain[i].y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // Render 5x5 Gems Grid
      for (let r = 0; r < gridRows; r++) {
        for (let c = 0; c < gridCols; c++) {
          const gem = s.grid[r]?.[c];
          if (gem) {
            const isSelected = s.selectedChain.includes(gem);

            ctx.save();
            ctx.translate(gem.x, gem.y);

            if (isSelected) {
              ctx.shadowColor = gem.color;
              ctx.shadowBlur = 20;
              ctx.scale(1.2, 1.2);
            }

            // Cell Frame
            ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
            ctx.beginPath();
            ctx.arc(0, 0, 22, 0, Math.PI * 2);
            ctx.fill();

            ctx.font = '28px serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(gem.icon, 0, 0);
            ctx.restore();
          }
        }
      }

      // Render Particles
      s.particles.forEach((p) => {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, 4, 4);
      });
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [gridRows, gridCols]);

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
      gameId: 'arcade_nether_portal',
      gameTitle: '블리츠 네더 포탈',
      durationSeconds: duration,
      score: s.score + (isWin ? 3500 : s.linesCleared * 300) + s.maxCombo * 40,
      difficulty: 'NIGHTMARE',
      isVictory: isWin || s.portalEnergy >= 60,
    });
    setSettlementReceipt(receipt);
    onReward(receipt.totalSns);
  };

  const tutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 손가락 드래그 라인 매칭' : 'STEP 1: DRAG LINE MATCHING',
      title: isKo ? '같은 색 크리스탈을 3개 이상 그어 연결하세요' : 'Drag to Connect 3+ Matching Nether Crystals',
      description: isKo
        ? '가상 조이스틱 없이 화면의 네더 크리스탈(🟣, 🔵, 🔴, ⭐)을 손가락으로 3개 이상 그어 연결(Swipe Line Link)하여 대폭발을 일으키고 상단의 네더 포탈 에너지를 100% 충전하세요.'
        : 'Drag your finger to link 3 or more matching nether crystals in any direction to charge the portal.',
      keyPoints: isKo
        ? [
            '가상 조이스틱 0개 (100% 손가락 직접 드래그 라인 매칭)',
            '5개 이상 롱체인 연결 시 슈퍼 포탈 버스트 대량 보너스',
            '35초간 최대 콤보로 포탈 에너지를 100% 채우고 탈출'
          ]
        : [
            'Zero Virtual Joysticks: 100% Direct Drag Line Linking',
            '5+ gem long chains unleash Super Portal Burst bonus',
            'Charge portal to 100% with continuous combos within 35s'
          ],
      iconType: 'GOAL',
    },
    {
      badge: isKo ? 'STEP 2: 모바일 퓨어 제스처' : 'STEP 2: PURE GESTURES',
      title: isKo ? '화면 직접 드래그 연결 (Direct Drag Link)' : 'Direct Drag Link',
      description: isKo
        ? '손가락을 대고 인접한 같은 색 보석들을 슥 잇습니다.'
        : 'Slide your finger smoothly across adjacent matching gems.',
      keyPoints: isKo
        ? [
            '👆 드래그 궤적: 실시간 선명한 황금색 링크 레이저',
            '⭐ 스타 젬: 모든 색상과 연결되는 와일드카드 보석',
            '⏱️ 35초 타임어택 고득점 챌린지'
          ]
        : [
            '👆 Drag Path: High-visibility golden link laser',
            '⭐ Star Gem: Universal wildcard connecting all colors',
            '⏱️ 35s time attack nether portal sprint'
          ],
      iconType: 'GESTURES',
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '탈출 완료 즉시 NIGHTMARE 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Nightmare payout deposited atomically to your LocalStorage wallet upon match finish.',
      keyPoints: isKo
        ? [
            '완료 즉시 LocalStorage 영구 지갑 입금',
            '연결 라인 수 및 포탈 에너지 비례 대량 잭팟',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Cleared lines and portal energy multipliers',
            'VictoryRewardModal golden coin fanfare'
          ],
      iconType: 'REWARDS',
    },
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-[#1e0533] text-white font-mono select-none flex flex-col overflow-hidden items-center justify-between touch-none">
      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '블리츠 네더 포탈' : 'Blitz Nether Portal'}
        language={(language as Language) || 'ko'}
        telemetries={[
          { label: isKo ? '포탈' : 'Portal', value: `${portalEnergy}%`, color: 'text-purple-300 font-bold animate-pulse' },
          { label: isKo ? '라인' : 'Lines', value: `${linesCleared}회`, color: 'text-amber-400 font-bold' },
          { label: isKo ? '시간' : 'Time', value: `${timeLeft}s`, color: timeLeft <= 10 ? 'text-rose-500 font-bold animate-pulse' : 'text-cyan-400 font-bold' },
          { label: isKo ? '점수' : 'Score', value: `${score}P`, color: 'text-amber-300 font-bold' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => setIsPaused(prev => !prev)}
        isPaused={isPaused}
      />

      {/* Pure Touch Nether Portal Canvas Viewport */}
      <div className="flex-1 w-full max-w-md relative overflow-hidden flex items-center justify-center select-none touch-none p-2">
        <canvas
          ref={canvasRef}
          width={360}
          height={500}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="w-full h-full object-contain touch-none cursor-pointer shadow-2xl"
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
          {isKo ? '같은 색 크리스탈을 3개 이상 손가락으로 그어 연결하세요' : 'Drag to link 3 or more matching crystals to open the portal'}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="arcade_nether_portal"
          gameTitle={isKo ? '블리츠 네더: 차원 포탈' : 'Blitz Nether: Dimension Portal'}
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
export default VoxelNetherPortalGame;
