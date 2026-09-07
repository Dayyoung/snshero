import React, { useState, useCallback } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiGoodsMasterGameProps {
  onBack: () => void;
}

interface GoodItem {
  id: number;
  type: 'soda' | 'choco' | 'orange';
  name: string;
  icon: string;
  shelfIndex: number; // 0, 1, 2
}

export const PokiGoodsMasterGame: React.FC<PokiGoodsMasterGameProps> = ({ onBack }) => {
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'victory'>('ready');
  const [shelves, setShelves] = useState<GoodItem[][]>([
    [
      { id: 1, type: 'soda', name: '콜라 캔', icon: '🥤', shelfIndex: 0 },
      { id: 2, type: 'choco', name: '초콜릿 바', icon: '🍫', shelfIndex: 0 },
      { id: 3, type: 'orange', name: '신선한 오렌지', icon: '🍊', shelfIndex: 0 },
    ],
    [
      { id: 4, type: 'choco', name: '초콜릿 바', icon: '🍫', shelfIndex: 1 },
      { id: 5, type: 'soda', name: '콜라 캔', icon: '🥤', shelfIndex: 1 },
      { id: 6, type: 'orange', name: '신선한 오렌지', icon: '🍊', shelfIndex: 1 },
    ],
    [
      { id: 7, type: 'orange', name: '신선한 오렌지', icon: '🍊', shelfIndex: 2 },
      { id: 8, type: 'choco', name: '초콜릿 바', icon: '🍫', shelfIndex: 2 },
      { id: 9, type: 'soda', name: '콜라 캔', icon: '🥤', shelfIndex: 2 },
    ],
  ]);
  const [matchedCount, setMatchedCount] = useState(0);
  const [activeCart, setActiveCart] = useState<GoodItem[]>([]);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  const handleStart = () => {
    setShelves([
      [
        { id: 1, type: 'soda', name: '콜라 캔', icon: '🥤', shelfIndex: 0 },
        { id: 2, type: 'choco', name: '초콜릿 바', icon: '🍫', shelfIndex: 0 },
        { id: 3, type: 'orange', name: '신선한 오렌지', icon: '🍊', shelfIndex: 0 },
      ],
      [
        { id: 4, type: 'choco', name: '초콜릿 바', icon: '🍫', shelfIndex: 1 },
        { id: 5, type: 'soda', name: '콜라 캔', icon: '🥤', shelfIndex: 1 },
        { id: 6, type: 'orange', name: '신선한 오렌지', icon: '🍊', shelfIndex: 1 },
      ],
      [
        { id: 7, type: 'orange', name: '신선한 오렌지', icon: '🍊', shelfIndex: 2 },
        { id: 8, type: 'choco', name: '초콜릿 바', icon: '🍫', shelfIndex: 2 },
        { id: 9, type: 'soda', name: '콜라 캔', icon: '🥤', shelfIndex: 2 },
      ],
    ]);
    setActiveCart([]);
    setMatchedCount(0);
    setGameState('playing');
    setRewardReceipt(null);
  };

  const handleVictory = useCallback(() => {
    setGameState('victory');
    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokigoodsmaster',
      gameTitle: 'Goods Master 3D: Shelf Sort',
      isVictory: true,
      score: 3,
      maxTargetScore: 3,
      durationSeconds: 30,
    });
    setRewardReceipt(receipt);
  }, []);

  // Pick Item from Shelf into Cart
  const handleItemClick = (shelfIdx: number, item: GoodItem) => {
    if (gameState !== 'playing') return;
    if (activeCart.length >= 7) return; // Cart overflow check

    // Remove from shelf
    const newShelves = shelves.map((row, idx) =>
      idx === shelfIdx ? row.filter((i) => i.id !== item.id) : row
    );
    setShelves(newShelves);

    // Add to cart
    const newCart = [...activeCart, item];
    setActiveCart(newCart);

    // Check for 3 matching types in cart
    const typeCount = newCart.filter((i) => i.type === item.type).length;
    if (typeCount === 3) {
      setTimeout(() => {
        // Clear matched items
        const remainingCart = newCart.filter((i) => i.type !== item.type);
        setActiveCart(remainingCart);
        setMatchedCount((prev) => {
          const updated = prev + 1;
          if (updated >= 3) {
            setTimeout(() => handleVictory(), 300);
          }
          return updated;
        });
      }, 250);
    }
  };

  return (
    <div className="flex flex-col items-center justify-between w-full h-[100dvh] bg-[#1e293b] text-[#fdfcfc] select-none overflow-hidden font-mono">
      <MinimalistMissionHUD
        gameTitle="Goods Master"
        missionTarget="상품 3세트 완벽 매칭 정리"
        currentScore={matchedCount}
        maxScore={3}
        scoreUnit="세트"
        onBack={onBack}
      />

      {/* Main Supermarket Shelves View */}
      <div className="relative flex-1 w-full max-w-md flex flex-col items-center justify-between p-3">
        {/* Store Mascot Avatar (Card #90) */}
        <div className="w-full flex items-center gap-3 bg-slate-900/80 p-2 rounded border border-white/10 shadow">
          <canvas
            width={50}
            height={50}
            ref={(node) => {
              if (!node) return;
              const ctx = node.getContext('2d');
              if (!ctx) return;
              ctx.clearRect(0, 0, 50, 50);
              drawCardSprite(ctx, 90, 5, 5, 40, 40);
            }}
            className="w-10 h-10 object-contain rounded bg-black/40"
          />
          <div className="text-xs flex flex-col">
            <span className="text-amber-400 font-bold">[ 마켓 마스터 ]</span>
            <span className="text-slate-300">선반의 상품을 탭해 카트에서 3개씩 매칭하세요!</span>
          </div>
        </div>

        {/* 3 Shelves Display */}
        <div className="w-full flex flex-col gap-3 my-auto">
          {shelves.map((shelf, sIdx) => (
            <div
              key={sIdx}
              className="relative w-full h-24 bg-gradient-to-b from-amber-800 to-amber-950 border-4 border-amber-900 rounded-lg p-2 shadow-xl flex items-center justify-around"
            >
              {/* Shelf wooden bar */}
              <div className="absolute bottom-1 left-0 right-0 h-2 bg-amber-700 border-t border-amber-500/50" />

              {/* Items on shelf */}
              {shelf.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(sIdx, item)}
                  className="z-10 w-16 h-16 bg-slate-800/90 rounded-lg border border-white/20 shadow-md flex flex-col items-center justify-center active:scale-95 transition-transform hover:bg-slate-700"
                >
                  <span className="text-2xl">{item.icon}</span>
                  <span className="text-[9px] text-slate-300 leading-none mt-1">{item.name}</span>
                </button>
              ))}

              {shelf.length === 0 && (
                <span className="text-xs text-amber-300/60 font-bold z-10">✨ [선반 정리 완료]</span>
              )}
            </div>
          ))}
        </div>

        {/* Bottom Shopping Cart Slots (Holds up to 7 items) */}
        <div className="w-full bg-slate-900/95 border border-white/20 rounded-lg p-2.5 flex flex-col gap-1.5 shadow-lg">
          <div className="flex justify-between text-[11px] text-slate-400 px-1">
            <span>🛒 쇼핑 카트 (같은 상품 3개 자동 포장)</span>
            <span className="text-amber-400 font-bold">정리: {matchedCount}/3</span>
          </div>
          <div className="grid grid-cols-7 gap-1.5 h-14">
            {[0, 1, 2, 3, 4, 5, 6].map((slotIdx) => {
              const item = activeCart[slotIdx];
              return (
                <div
                  key={slotIdx}
                  className="w-full h-full bg-slate-800/80 rounded border border-white/10 flex items-center justify-center text-xl shadow-inner"
                >
                  {item ? (
                    <span className="animate-scale">{item.icon}</span>
                  ) : (
                    <span className="text-slate-600 text-xs">•</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {gameState === 'ready' && (
          <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-6 text-center z-30">
            <h2 className="text-2xl font-bold text-amber-400 mb-2">[ Goods Master 3D ]</h2>
            <p className="text-sm text-slate-300 mb-6">
              복잡한 편의점 선반의 상품들을 정돈하세요!<br />
              1. 선반에 놓인 <b>상품을 탭</b>하여 하단 쇼핑 카트에 담습니다.<br />
              2. 같은 상품이 <b>3개 모이면 즉시 포장되어 클리어</b>됩니다.<br />
              3. 모든 상품을 매칭 정리하여 3개 선반을 완전히 비우세요!
            </p>
            <button
              onClick={handleStart}
              className="px-8 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-lg rounded-sm active:scale-95 transition-all shadow-lg"
            >
              정리 시작 [START]
            </button>
          </div>
        )}

        {gameState === 'victory' && rewardReceipt && (
          <VictoryRewardModal
            receipt={rewardReceipt}
            language="ko"
            onPlayAgain={handleStart}
            onExit={onBack}
          />
        )}
      </div>
    </div>
  );
};
export default PokiGoodsMasterGame;
