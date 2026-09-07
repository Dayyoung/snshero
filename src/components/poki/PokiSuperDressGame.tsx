import React, { useState, useEffect, useRef } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiSuperDressGameProps {
  onBack: () => void;
  cardId?: number;
}

interface FashionItem {
  id: number;
  category: 'hair' | 'gown' | 'acc' | 'shoes';
  name: string;
  color: string;
  score: number;
}

const ITEMS: FashionItem[] = [
  // Hair
  { id: 1, category: 'hair', name: '골든 웨이브', color: '#eab308', score: 25 },
  { id: 2, category: 'hair', name: '스타라이트 실버', color: '#cbd5e1', score: 25 },
  { id: 3, category: 'hair', name: '로즈 핑크 밥', color: '#f43f5e', score: 25 },
  // Gown
  { id: 4, category: 'gown', name: '로열 벨벳 루비', color: '#b91c1c', score: 25 },
  { id: 5, category: 'gown', name: '오로라 에메랄드', color: '#047857', score: 25 },
  { id: 6, category: 'gown', name: '미드나잇 사파이어', color: '#1d4ed8', score: 25 },
  // Acc
  { id: 7, category: 'acc', name: '다이아 티아라', color: '#38bdf8', score: 25 },
  { id: 8, category: 'acc', name: '골드 클러치', color: '#f59e0b', score: 25 },
  { id: 9, category: 'acc', name: '진주 목걸이', color: '#f8fafc', score: 25 },
  // Shoes
  { id: 10, category: 'shoes', name: '크리스탈 힐', color: '#e0e7ff', score: 25 },
  { id: 11, category: 'shoes', name: '글래머 글리터', color: '#fbbf24', score: 25 },
  { id: 12, category: 'shoes', name: '레드 카펫 펌프스', color: '#e11d48', score: 25 },
];

export const PokiSuperDressGame: React.FC<PokiSuperDressGameProps> = ({ onBack, cardId = 51 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [activeCategory, setActiveCategory] = useState<'hair' | 'gown' | 'acc' | 'shoes'>('hair');
  const [selectedItems, setSelectedItems] = useState<{ [key: string]: FashionItem }>({});
  const [totalScore, setTotalScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [rewardResult, setRewardResult] = useState<any>(null);

  const gameStateRef = useRef({
    selected: {} as { [key: string]: FashionItem },
    startTime: Date.now(),
    flashAlpha: 0,
    confetti: [] as { x: number; y: number; vx: number; vy: number; color: string; size: number }[],
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const state = gameStateRef.current;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      // Runway stage background
      ctx.fillStyle = '#18181b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Spotlight beams
      ctx.fillStyle = 'rgba(254, 240, 138, 0.08)';
      ctx.beginPath();
      ctx.moveTo(canvas.width * 0.2, 0);
      ctx.lineTo(canvas.width * 0.5, canvas.height * 0.5);
      ctx.lineTo(canvas.width * 0.3, canvas.height);
      ctx.fill();

      // Red carpet runway
      const carpetW = Math.min(canvas.width * 0.7, 300);
      const carpetX = (canvas.width - carpetW) / 2;
      ctx.fillStyle = '#991b1b';
      ctx.fillRect(carpetX, 90, carpetW, canvas.height * 0.54);
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 3;
      ctx.strokeRect(carpetX, 90, carpetW, canvas.height * 0.54);

      // Model center
      const modelX = canvas.width / 2;
      const modelY = 110 + canvas.height * 0.22;

      // Model shadow
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.beginPath();
      ctx.ellipse(modelX, modelY + 95, 45, 12, 0, 0, Math.PI * 2);
      ctx.fill();

      // Card Sprite as Model Base
      drawCardSprite(ctx, cardId, modelX - 55, modelY - 70, 110, 140);

      // Overlay Fashion Elements
      const hair = state.selected['hair'];
      if (hair) {
        ctx.fillStyle = hair.color;
        ctx.beginPath();
        ctx.arc(modelX, modelY - 65, 24, 0, Math.PI * 2);
        ctx.arc(modelX - 35, modelY - 40, 16, 0, Math.PI * 2);
        ctx.arc(modelX + 35, modelY - 40, 16, 0, Math.PI * 2);
        ctx.fill();
      }

      const gown = state.selected['gown'];
      if (gown) {
        ctx.fillStyle = gown.color;
        ctx.beginPath();
        ctx.moveTo(modelX - 30, modelY + 20);
        ctx.lineTo(modelX + 30, modelY + 20);
        ctx.lineTo(modelX + 48, modelY + 90);
        ctx.lineTo(modelX - 48, modelY + 90);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      const acc = state.selected['acc'];
      if (acc) {
        ctx.fillStyle = acc.color;
        ctx.font = '24px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('👑', modelX, modelY - 80);
      }

      const shoes = state.selected['shoes'];
      if (shoes) {
        ctx.fillStyle = shoes.color;
        ctx.fillRect(modelX - 25, modelY + 92, 16, 10);
        ctx.fillRect(modelX + 9, modelY + 92, 16, 10);
      }

      // Camera Flash effect
      if (state.flashAlpha > 0) {
        ctx.fillStyle = `rgba(255, 255, 255, ${state.flashAlpha})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        state.flashAlpha -= 0.04;
      }

      // Confetti
      for (let i = state.confetti.length - 1; i >= 0; i--) {
        const cf = state.confetti[i];
        cf.x += cf.vx;
        cf.y += cf.vy;
        cf.vy += 0.12;
        ctx.fillStyle = cf.color;
        ctx.fillRect(cf.x, cf.y, cf.size, cf.size);
        if (cf.y > canvas.height) state.confetti.splice(i, 1);
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [cardId]);

  const selectItem = (item: FashionItem) => {
    const s = gameStateRef.current;
    s.selected[item.category] = item;
    setSelectedItems({ ...s.selected });

    let score = 0;
    (Object.values(s.selected) as FashionItem[]).forEach((it) => (score += it.score));
    setTotalScore(score);
  };

  const handleDebut = () => {
    const s = gameStateRef.current;
    s.flashAlpha = 0.8;

    for (let k = 0; k < 60; k++) {
      s.confetti.push({
        x: window.innerWidth / 2,
        y: window.innerHeight * 0.35,
        vx: (Math.random() - 0.5) * 14,
        vy: -5 - Math.random() * 8,
        color: ['#f43f5e', '#ec4899', '#f59e0b', '#38bdf8', '#a855f7'][k % 5],
        size: 6 + Math.random() * 6,
      });
    }

    setGameWon(true);
    setGameOver(true);
    const reward = calculateAndDepositMissionReward({
      gameId: 'pokisuperdress',
      gameTitle: 'Super Dress',
      isVictory: true,
      score: 1000,
      maxTargetScore: 1000,
      durationSeconds: Math.floor((Date.now() - s.startTime) / 1000),
    });
    setRewardResult(reward);
  };

  return (
    <div className="relative w-full h-[100dvh] bg-[#18181b] overflow-hidden select-none font-mono">
      <MinimalistMissionHUD
        gameTitle="Super Dress"
        score={totalScore}
        targetScore={100}
        lives={100}
        onBack={onBack}
      />

      <canvas ref={canvasRef} className="w-full h-full block" />

      {/* Wardrobe Selector Bottom Dock */}
      <div className="absolute bottom-4 left-0 right-0 px-4 flex flex-col items-center gap-2 pointer-events-auto">
        {/* Category Tabs */}
        <div className="flex justify-center gap-1 bg-stone-900/90 p-1 rounded-sm border border-stone-700">
          {(
            [
              { key: 'hair', label: '💇 헤어' },
              { key: 'gown', label: '👗 드레스' },
              { key: 'acc', label: '👑 악세서리' },
              { key: 'shoes', label: '👠 슈즈' },
            ] as const
          ).map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveCategory(t.key)}
              className={`px-2.5 py-1 text-xs font-bold rounded-sm ${
                activeCategory === t.key ? 'bg-amber-500 text-stone-950' : 'text-stone-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Item Choices */}
        <div className="flex justify-center gap-2 w-full max-w-sm">
          {ITEMS.filter((it) => it.category === activeCategory).map((item) => (
            <button
              key={item.id}
              onClick={() => selectItem(item)}
              className={`flex-1 p-2 rounded-sm border text-xs font-bold transition-all ${
                selectedItems[activeCategory]?.id === item.id
                  ? 'bg-rose-600 text-white border-rose-400 scale-105'
                  : 'bg-stone-800/90 text-stone-200 border-stone-700'
              }`}
            >
              <div
                className="w-4 h-4 rounded-full mx-auto mb-1 border border-white"
                style={{ backgroundColor: item.color }}
              />
              <div className="text-[11px] truncate">{item.name}</div>
              <div className="text-[9px] text-amber-400">+25점</div>
            </button>
          ))}
        </div>

        {totalScore >= 100 && (
          <button
            onClick={handleDebut}
            className="w-full max-w-sm bg-gradient-to-r from-amber-500 to-rose-500 text-stone-950 font-bold py-2 rounded-sm text-xs shadow-lg animate-pulse"
          >
            📸 런웨이 데뷔 & 패션 갈라쇼 공개! (100점 완료)
          </button>
        )}
      </div>

      <VictoryRewardModal
        isOpen={gameOver}
        rewardAmount={rewardResult?.rewardAmount || 0}
        score={1000}
        targetScore={1000}
        isVictory={gameWon}
        onClose={onBack}
        onRetry={() => {
          setGameOver(false);
          setGameWon(false);
          setSelectedItems({});
          setTotalScore(0);
          gameStateRef.current.selected = {};
          gameStateRef.current.startTime = Date.now();
        }}
      />
    </div>
  );
};
