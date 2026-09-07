import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData } from '../../types';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { UniversalTutorialModal, TutorialStep } from '../UniversalTutorialModal';
import { drawCardSprite } from '../../lib/canvasCardRenderer';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';

interface PokiMonkeyTagGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface Branch {
  x: number;
  y: number;
  width: number;
}

interface TagBot {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  isTagger: boolean;
  charId: number;
}

export const PokiMonkeyTagGame: React.FC<PokiMonkeyTagGameProps> = ({
  deck = [],
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
  const playerHeroId = deck[0]?.id || 14;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  const [score, setScore] = useState<number>(0);
  const [isPlayerTagger, setIsPlayerTagger] = useState<boolean>(false);
  const [tagCount, setTagCount] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(45);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isVictory, setIsVictory] = useState<boolean>(false);
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_monkey_tag') !== 'true';
    } catch {
      return true;
    }
  });

  const stateRef = useRef({
    player: {
      x: 180,
      y: 350,
      vx: 0,
      vy: 0,
      targetX: 180,
      targetY: 350,
      speed: 4.2,
      isTagger: false,
    },
    branches: [] as Branch[],
    bots: [] as TagBot[],
    bananas: [] as { x: number; y: number }[],
    combo: 0,
    isTouchActive: false,
  });

  const initGame = useCallback((width: number, height: number) => {
    const branches: Branch[] = [
      { x: 30, y: 160, width: 80 },
      { x: 150, y: 120, width: 90 },
      { x: 260, y: 180, width: 80 },
      { x: 80, y: 270, width: 100 },
      { x: 220, y: 280, width: 90 },
      { x: 40, y: 390, width: 120 },
      { x: 200, y: 400, width: 130 },
    ];

    const botChars = [103, 107, 112, 116];
    const bots: TagBot[] = [];
    for (let i = 0; i < 4; i++) {
      bots.push({
        id: i + 1,
        x: 60 + Math.random() * (width - 120),
        y: 100 + Math.random() * 250,
        vx: (Math.random() - 0.5) * 3,
        vy: (Math.random() - 0.5) * 3,
        isTagger: i === 0, // Bot 1 starts as tagger
        charId: botChars[i],
      });
    }

    const bananas: { x: number; y: number }[] = [];
    for (let i = 0; i < 8; i++) {
      bananas.push({
        x: 40 + Math.random() * (width - 80),
        y: 80 + Math.random() * 320,
      });
    }

    stateRef.current.branches = branches;
    stateRef.current.bots = bots;
    stateRef.current.bananas = bananas;
    stateRef.current.player.isTagger = false;
    setIsPlayerTagger(false);
  }, []);

  // Timer
  useEffect(() => {
    if (isGameOver || isVictory || showTutorial) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleGameOver(score >= 600);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isGameOver, isVictory, showTutorial, score]);

  const handleGameOver = useCallback((victory: boolean) => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    setIsGameOver(true);
    setIsVictory(victory);

    const finalScore = score + (victory ? 400 : 80);
    const receipt = calculateAndDepositMissionReward({
      gameId: 'poki_monkey_tag',
      gameTitle: isKo ? '몽키 태그 io' : 'Monkey Tag IO',
      durationSeconds: 45 - timeLeft,
      score: finalScore,
      maxTargetScore: 1000,
      isVictory: victory,
      difficulty: 'NORMAL',
      comboCount: stateRef.current.combo,
      perfectClear: victory && tagCount >= 5,
    });

    setSettlementReceipt(receipt);
    onReward(receipt.totalSns);
    if (playSfx) {
      playSfx(victory ? 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3' : 'https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
    }
  }, [score, timeLeft, tagCount, isKo, onReward, playSfx]);

  // Main Canvas Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.clientWidth;
    let height = canvas.clientHeight;
    canvas.width = width;
    canvas.height = height;

    initGame(width, height);

    const updateAndRender = () => {
      if (isGameOver || isVictory || showTutorial) return;

      const p = stateRef.current.player;
      const bots = stateRef.current.bots;
      const branches = stateRef.current.branches;
      const bananas = stateRef.current.bananas;

      // Player move
      const dx = p.targetX - p.x;
      const dy = p.targetY - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 4) {
        p.x += (dx / dist) * p.speed;
        p.y += (dy / dist) * p.speed;
      }

      // Collect bananas
      for (let i = bananas.length - 1; i >= 0; i--) {
        const bn = bananas[i];
        if (Math.hypot(p.x - bn.x, p.y - bn.y) < 24) {
          bananas.splice(i, 1);
          setScore(s => s + 40);
          stateRef.current.combo++;
          if (playSfx) playSfx('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');

          // Respawn banana
          bananas.push({
            x: 30 + Math.random() * (width - 60),
            y: 80 + Math.random() * (height - 180),
          });
          break;
        }
      }

      // Update Bots
      for (const b of bots) {
        b.x += b.vx;
        b.y += b.vy;

        if (b.x < 30 || b.x > width - 30) b.vx *= -1;
        if (b.y < 80 || b.y > height - 80) b.vy *= -1;

        // Tag collision check with player
        const distToPlayer = Math.hypot(p.x - b.x, p.y - b.y);
        if (distToPlayer < 30) {
          if (p.isTagger && !b.isTagger) {
            // Player tagged Bot!
            p.isTagger = false;
            b.isTagger = true;
            setIsPlayerTagger(false);
            setTagCount(t => t + 1);
            setScore(s => s + 150);
            stateRef.current.combo += 2;
            if (playSfx) playSfx('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');
          } else if (!p.isTagger && b.isTagger) {
            // Bot tagged Player!
            b.isTagger = false;
            p.isTagger = true;
            setIsPlayerTagger(true);
            setScore(s => Math.max(0, s - 30));
            stateRef.current.combo = 0;
            if (playSfx) playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
          }
        }
      }

      // Passive points for staying untagged
      if (!p.isTagger && Math.random() < 0.1) {
        setScore(s => s + 2);
      }

      if (score >= 1000) {
        handleGameOver(true);
        return;
      }

      // ---------------- RENDER ----------------
      ctx.clearRect(0, 0, width, height);

      // Deep jungle canopy background
      ctx.fillStyle = '#064e3b';
      ctx.fillRect(0, 0, width, height);

      // Draw Jungle Branches
      for (const br of branches) {
        ctx.fillStyle = '#78350f';
        ctx.fillRect(br.x, br.y, br.width, 16);
        ctx.fillStyle = '#15803d'; // Leaves on top
        ctx.fillRect(br.x - 4, br.y - 4, br.width + 8, 8);
      }

      // Draw Bananas
      for (const bn of bananas) {
        ctx.fillStyle = '#facc15';
        ctx.font = '16px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('🍌', bn.x, bn.y + 6);
      }

      // Draw Bots
      for (const b of bots) {
        drawCardSprite(ctx, b.charId, b.x - 16, b.y - 16, 32, 32, {
          circleClip: true,
          borderWidth: 2,
          borderColor: b.isTagger ? '#ef4444' : '#22c55e',
          shadowBlur: b.isTagger ? 10 : 0,
          shadowColor: '#ef4444',
        });

        if (b.isTagger) {
          ctx.fillStyle = '#ef4444';
          ctx.font = 'bold 10px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('🔥 TAGGER', b.x, b.y - 20);
        }
      }

      // Draw Player Hero
      drawCardSprite(ctx, playerHeroId, p.x - 18, p.y - 18, 36, 36, {
        circleClip: true,
        borderWidth: 2,
        borderColor: p.isTagger ? '#ef4444' : '#38bdf8',
        shadowBlur: 10,
        shadowColor: p.isTagger ? '#ef4444' : '#38bdf8',
      });

      if (p.isTagger) {
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('🔥 YOU ARE IT!', p.x, p.y - 24);
      }

      animFrameRef.current = requestAnimationFrame(updateAndRender);
    };

    animFrameRef.current = requestAnimationFrame(updateAndRender);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isGameOver, isVictory, showTutorial, initGame, score, playerHeroId, handleGameOver]);

  // Touch Move
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    stateRef.current.isTouchActive = true;
    stateRef.current.player.targetX = e.clientX - rect.left;
    stateRef.current.player.targetY = e.clientY - rect.top;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!stateRef.current.isTouchActive) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    stateRef.current.player.targetX = e.clientX - rect.left;
    stateRef.current.player.targetY = e.clientY - rect.top;
  };

  const handlePointerUp = () => {
    stateRef.current.isTouchActive = false;
  };

  const tutorialSteps: TutorialStep[] = [
    {
      badge: 'GOAL',
      title: isKo ? '몽키 태그 io (술래잡기)' : 'Monkey Tag IO',
      description: isKo
        ? '정글 나뭇가지 사이를 드래그하여 바나나를 획득하고 빨간 술래(TAGGER)를 피해 도망치세요!'
        : 'Drag to swing across branches, gather bananas, and evade the red tagger!',
      keyPoints: isKo ? ['바나나 수집으로 점수 획득', '빨간 술래 회피', '정글 나무 파쿠르'] : ['Gather bananas', 'Evade red tagger', 'Canopy parkour'],
    },
    {
      badge: 'TAG',
      title: isKo ? '술래 넘기기 & 태그' : 'Pass the Tag',
      description: isKo
        ? '내가 술래가 되면 빠르게 다른 원숭이에게 다가가 들이받아서 술래를 넘겨버리세요!'
        : 'If you become the tagger, dash into any other monkey to pass the tag!',
      keyPoints: isKo ? ['술래 상태 신속 탈출', '상대 원숭이 터치', '최종 1위 승리'] : ['Pass tag to others', 'Sprint to collide', 'Achieve 1st place'],
    }
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-slate-950 flex flex-col items-center select-none overflow-hidden font-mono">
      <MinimalistMissionHUD
        title={isKo ? 'No.14 몽키 태그 io' : 'No.14 Monkey Tag IO'}
        currentScore={score}
        targetScore={1000}
        timeLeft={timeLeft}
        stageInfo={isPlayerTagger ? '🚨 내가 술래! (태그하세요)' : '🏃 도망자 (생존 중)'}
        combo={stateRef.current.combo}
        onExit={onExit}
      />

      <div className="relative flex-1 w-full max-w-md flex items-center justify-center p-2">
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="w-full h-full rounded-sm border border-slate-800 touch-none shadow-inner"
        />

        {/* Action Guide */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none text-center bg-slate-900/80 px-4 py-1.5 rounded-full border border-slate-700/60 backdrop-blur-sm">
          <p className="text-xs text-emerald-400 font-bold tracking-wider animate-pulse">
            {isKo ? '👆 드래그: 정글 스윙 이동 (술래잡기)' : '👆 DRAG: JUNGLE SWING & TAG'}
          </p>
        </div>
      </div>

      {/* Victory Reward Modal */}
      {settlementReceipt && (
        <VictoryRewardModal
          isOpen={isGameOver}
          isVictory={isVictory}
          score={score}
          receipt={settlementReceipt}
          onConfirm={onExit}
          onRestart={() => {
            setIsGameOver(false);
            setIsVictory(false);
            setSettlementReceipt(null);
            setScore(0);
            setTagCount(0);
            setTimeLeft(45);
            if (canvasRef.current) initGame(canvasRef.current.clientWidth, canvasRef.current.clientHeight);
          }}
          language={language}
        />
      )}

      {/* Universal Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          isOpen={showTutorial}
          gameTitle={isKo ? 'No.14 몽키 태그 io' : 'No.14 Monkey Tag IO'}
          steps={tutorialSteps}
          onComplete={() => {
            setShowTutorial(false);
            try {
              localStorage.setItem('hero_tutorial_monkey_tag', 'true');
            } catch {}
          }}
          language={language}
        />
      )}
    </div>
  );
};

export default PokiMonkeyTagGame;
