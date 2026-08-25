import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData, Language } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelDreamweaverGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface StarNode {
  id: number;
  x: number;
  y: number;
  name: string;
}

interface ConstellationEdge {
  from: number;
  to: number;
}

const STAGES_DATA: { name: string; enName: string; stars: StarNode[]; edges: ConstellationEdge[] }[] = [
  {
    name: '작은곰자리',
    enName: 'Ursa Minor',
    stars: [
      { id: 1, x: 180, y: 130, name: '북극성' },
      { id: 2, x: 100, y: 220, name: '별 A' },
      { id: 3, x: 260, y: 220, name: '별 B' },
      { id: 4, x: 130, y: 350, name: '별 C' },
      { id: 5, x: 230, y: 350, name: '별 D' },
    ],
    edges: [
      { from: 1, to: 2 },
      { from: 1, to: 3 },
      { from: 2, to: 4 },
      { from: 3, to: 5 },
      { from: 4, to: 5 },
      { from: 2, to: 3 },
    ],
  },
  {
    name: '카시오페이아',
    enName: 'Cassiopeia',
    stars: [
      { id: 1, x: 70, y: 200, name: '셰다르' },
      { id: 2, x: 130, y: 320, name: '카프' },
      { id: 3, x: 180, y: 180, name: '나비' },
      { id: 4, x: 240, y: 330, name: '루크바' },
      { id: 5, x: 290, y: 190, name: '세긴' },
    ],
    edges: [
      { from: 1, to: 2 },
      { from: 2, to: 3 },
      { from: 3, to: 4 },
      { from: 4, to: 5 },
      { from: 1, to: 3 },
      { from: 3, to: 5 },
    ],
  },
  {
    name: '오리온의 벨트',
    enName: 'Orion Belt',
    stars: [
      { id: 1, x: 180, y: 110, name: '베텔게우스' },
      { id: 2, x: 100, y: 240, name: '알니탁' },
      { id: 3, x: 180, y: 240, name: '알닐람' },
      { id: 4, x: 260, y: 240, name: '민타카' },
      { id: 5, x: 100, y: 380, name: '사이프' },
      { id: 6, x: 260, y: 380, name: '리겔' },
    ],
    edges: [
      { from: 1, to: 2 },
      { from: 1, to: 4 },
      { from: 2, to: 3 },
      { from: 3, to: 4 },
      { from: 2, to: 5 },
      { from: 4, to: 6 },
      { from: 5, to: 6 },
    ],
  },
  {
    name: '백조자리',
    enName: 'Cygnus',
    stars: [
      { id: 1, x: 180, y: 110, name: '데네브' },
      { id: 2, x: 180, y: 240, name: '사드르' },
      { id: 3, x: 70, y: 240, name: '기에나' },
      { id: 4, x: 290, y: 240, name: '파와리스' },
      { id: 5, x: 180, y: 390, name: '알비레오' },
    ],
    edges: [
      { from: 1, to: 2 },
      { from: 2, to: 3 },
      { from: 2, to: 4 },
      { from: 2, to: 5 },
      { from: 1, to: 3 },
      { from: 1, to: 4 },
      { from: 3, to: 5 },
      { from: 4, to: 5 },
    ],
  },
];

export const VoxelDreamweaverGame: React.FC<VoxelDreamweaverGameProps> = ({
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

  const [currentStageIdx, setCurrentStageIdx] = useState<number>(0);
  const [drawnEdges, setDrawnEdges] = useState<ConstellationEdge[]>([]);
  const [score, setScore] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(35);
  const [feedbackText, setFeedbackText] = useState<string | null>(null);

  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_game_star_tracer') !== 'true';
    } catch {
      return true;
    }
  });
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const stateRef = useRef({
    stageIdx: 0,
    currentStar: null as number | null,
    drawnEdges: [] as ConstellationEdge[],
    pointerPos: { x: 0, y: 0 },
    isDragging: false,
    score: 0,
    timeLeft: 35,
    isGameOver: false,
    isPaused: false,
    startTime: Date.now(),
  });

  const setupStage = useCallback((idx: number) => {
    const s = stateRef.current;
    s.stageIdx = idx;
    s.currentStar = null;
    s.drawnEdges = [];
    s.isDragging = false;

    setCurrentStageIdx(idx);
    setDrawnEdges([]);
  }, []);

  const initGame = useCallback(() => {
    const s = stateRef.current;
    s.score = 0;
    s.timeLeft = 35;
    s.isGameOver = false;
    s.startTime = Date.now();

    setScore(0);
    setTimeLeft(35);
    setFeedbackText(null);
    setIsGameOver(false);
    setSettlementReceipt(null);

    setupStage(0);
  }, [setupStage]);

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

  // Pointer Handlers for Direct Star Dragging (Zero Joysticks)
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

    const currentStage = STAGES_DATA[s.stageIdx];
    for (const star of currentStage.stars) {
      if (Math.hypot(star.x - tapX, star.y - tapY) < 30) {
        s.currentStar = star.id;
        s.isDragging = true;
        s.pointerPos = { x: tapX, y: tapY };
        playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
        break;
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = stateRef.current;
    if (s.isGameOver || s.isPaused || !s.isDragging || s.currentStar === null) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const curX = (e.clientX - rect.left) * scaleX;
    const curY = (e.clientY - rect.top) * scaleY;
    s.pointerPos = { x: curX, y: curY };

    const currentStage = STAGES_DATA[s.stageIdx];

    // Check if entered another star node
    for (const star of currentStage.stars) {
      if (star.id !== s.currentStar && Math.hypot(star.x - curX, star.y - curY) < 26) {
        const fromId = s.currentStar;
        const toId = star.id;

        // Check if this edge exists in stage template
        const isValidEdge = currentStage.edges.some(
          (edge) =>
            (edge.from === fromId && edge.to === toId) ||
            (edge.from === toId && edge.to === fromId)
        );

        // Check if edge already drawn
        const isAlreadyDrawn = s.drawnEdges.some(
          (edge) =>
            (edge.from === fromId && edge.to === toId) ||
            (edge.from === toId && edge.to === fromId)
        );

        if (isValidEdge && !isAlreadyDrawn) {
          // Draw Line!
          const newEdge: ConstellationEdge = { from: fromId, to: toId };
          s.drawnEdges.push(newEdge);
          s.currentStar = toId;
          s.score += 200;

          setDrawnEdges([...s.drawnEdges]);
          setScore(s.score);
          playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');

          // Check Stage Clear (All template edges drawn!)
          if (s.drawnEdges.length >= currentStage.edges.length) {
            s.score += 800;
            setScore(s.score);
            s.isDragging = false;
            s.currentStar = null;

            if (s.stageIdx < STAGES_DATA.length - 1) {
              setFeedbackText(`${currentStage.name} 완성! ✨`);
              setTimeout(() => {
                setFeedbackText(null);
                setupStage(s.stageIdx + 1);
              }, 800);
            } else {
              // Clear All Constellations!
              endGame(true);
            }
          }
        }
        break;
      }
    }
  };

  const handlePointerUp = () => {
    const s = stateRef.current;
    s.isDragging = false;
  };

  // Main 60FPS Constellation Renderer Loop
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
      const currentStage = STAGES_DATA[s.stageIdx];

      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Midnight Cosmic Void Background
      ctx.fillStyle = '#050716';
      ctx.fillRect(0, 0, w, h);

      // Background Nebula Stars
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      for (let i = 0; i < 20; i++) {
        const bx = (i * 37 + now * 0.005) % w;
        const by = (i * 47) % h;
        ctx.beginPath();
        ctx.arc(bx, by, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Render Required Template Dotted Lines
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);

      currentStage.edges.forEach((edge) => {
        const s1 = currentStage.stars.find((st) => st.id === edge.from);
        const s2 = currentStage.stars.find((st) => st.id === edge.to);
        if (s1 && s2) {
          ctx.beginPath();
          ctx.moveTo(s1.x, s1.y);
          ctx.lineTo(s2.x, s2.y);
          ctx.stroke();
        }
      });
      ctx.setLineDash([]);

      // Render Successfully Drawn Glowing Lines (Cyan/Gold)
      s.drawnEdges.forEach((edge) => {
        const s1 = currentStage.stars.find((st) => st.id === edge.from);
        const s2 = currentStage.stars.find((st) => st.id === edge.to);
        if (s1 && s2) {
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 4;
          ctx.shadowColor = '#00ffff';
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.moveTo(s1.x, s1.y);
          ctx.lineTo(s2.x, s2.y);
          ctx.stroke();
          ctx.shadowBlur = 0;
        }
      });

      // Render Active Drag Line from currentStar to pointerPos
      if (s.isDragging && s.currentStar !== null) {
        const activeStar = currentStage.stars.find((st) => st.id === s.currentStar);
        if (activeStar) {
          ctx.strokeStyle = '#fde047';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(activeStar.x, activeStar.y);
          ctx.lineTo(s.pointerPos.x, s.pointerPos.y);
          ctx.stroke();
        }
      }

      // Render Constellation Star Nodes
      currentStage.stars.forEach((star) => {
        const isCurrent = star.id === s.currentStar;
        const isConnected = s.drawnEdges.some((e) => e.from === star.id || e.to === star.id);

        ctx.fillStyle = isCurrent ? '#fde047' : isConnected ? '#38bdf8' : '#e2e8f0';
        ctx.beginPath();
        ctx.arc(star.x, star.y, isCurrent ? 14 : 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.font = '16px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⭐', star.x, star.y);
      });
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, []);

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
      gameId: 'arcade_star_tracer',
      gameTitle: '블리츠 스타 트레이서',
      durationSeconds: duration,
      score: s.score + (isWin ? 3000 : (s.stageIdx + 1) * 400),
      difficulty: 'NIGHTMARE',
      isVictory: isWin || s.stageIdx >= 2,
    });
    setSettlementReceipt(receipt);
    onReward(receipt.totalSns);
  };

  const tutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 별자리 한붓그리기' : 'STEP 1: TRACE CONSTELLATIONS',
      title: isKo ? '별 노드를 드래그하여 선을 연결하세요' : 'Drag Between Stars to Connect Lines',
      description: isKo
        ? '가상 조이스틱 없이 별(⭐) 노드를 손가락으로 터치한 뒤 다른 별로 드래그하여 점선으로 표시된 별자리의 모든 선을 한붓그리기로 완성하세요.'
        : 'Drag seamlessly from star to star to connect all constellation lines in one continuous stroke.',
      keyPoints: isKo
        ? [
            '가상 조이스틱 0개 (100% 손가락 직접 별자리 드래그)',
            '이미 이은 선은 중복해서 그릴 수 없습니다',
            '모든 선을 완성하면 다음 별자리 스테이지로 진입'
          ]
        : [
            'Zero Virtual Joysticks: 100% Direct Finger Dragging',
            'Each edge line can only be drawn once',
            'Complete all template edges to advance stages'
          ],
      iconType: 'GOAL',
    },
    {
      badge: isKo ? 'STEP 2: 모바일 퓨어 제스처' : 'STEP 2: PURE GESTURES',
      title: isKo ? '화면 직접 드래그 (Direct Drag)' : 'Direct Screen Drag',
      description: isKo
        ? '별을 누른 채 손가락을 떼지 않고 다음 별 노드로 미끄러지듯 이동합니다.'
        : 'Hold and slide your finger across connected star nodes smoothly.',
      keyPoints: isKo
        ? [
            '👆 손가락 드래그: 실시간 네온 별자리 발광 효과',
            '⚡ 4대 대표 별자리 챔피언십 올클리어 도전',
            '⏱️ 35초 타임어택 감성 퍼즐'
          ]
        : [
            '👆 Touch Drag: Glowing real-time constellation illumination',
            '⚡ Complete all 4 mythical constellations',
            '⏱️ 35s time attack puzzle sprint'
          ],
      iconType: 'GESTURES',
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '별자리 완성 즉시 NIGHTMARE 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Nightmare payout deposited atomically to your LocalStorage wallet upon match finish.',
      keyPoints: isKo
        ? [
            '완료 즉시 LocalStorage 영구 지갑 입금',
            '완성 별자리 수 및 드래그 정확도 비례 대량 잭팟',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Completed constellations multipliers',
            'VictoryRewardModal golden coin fanfare'
          ],
      iconType: 'REWARDS',
    },
  ];

  const currentStage = STAGES_DATA[currentStageIdx] || STAGES_DATA[0];

  return (
    <div className="relative w-full h-[100dvh] bg-[#050614] text-white font-mono select-none flex flex-col overflow-hidden items-center justify-between touch-none">
      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '블리츠 스타 트레이서' : 'Blitz Star Tracer'}
        language={(language as Language) || 'ko'}
        telemetries={[
          { label: isKo ? '별자리' : 'Constellation', value: `${currentStageIdx + 1}/${STAGES_DATA.length} ${isKo ? currentStage.name : currentStage.enName}`, color: 'text-amber-400 font-bold' },
          { label: isKo ? '시간' : 'Time', value: `${timeLeft}s`, color: timeLeft <= 10 ? 'text-rose-500 font-bold animate-pulse' : 'text-cyan-400 font-bold' },
          { label: isKo ? '진행' : 'Progress', value: `${drawnEdges.length}/${currentStage.edges.length}`, color: 'text-emerald-400 font-bold' },
          { label: isKo ? '점수' : 'Score', value: `${score}P`, color: 'text-amber-300 font-bold' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => setIsPaused(prev => !prev)}
        isPaused={isPaused}
      />

      {/* Pure Touch Star Tracer Canvas Viewport */}
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
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none text-xl font-bold text-amber-300 drop-shadow-lg animate-bounce whitespace-nowrap">
            {feedbackText}
          </div>
        )}
      </div>

      {/* Minimal Bottom Guide */}
      <div className="w-full pb-3 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1 bg-black/50 border border-white/10 rounded-full text-[10px] text-slate-300 font-mono">
          {isKo ? '별 노드를 손가락으로 드래그하여 별자리를 완성하세요' : 'Drag between star nodes to connect constellation'}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="arcade_star_tracer"
          gameTitle={isKo ? '블리츠 스타 트레이서: 별자리 퍼즐' : 'Blitz Star Tracer: Constellation Puzzle'}
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
export default VoxelDreamweaverGame;
