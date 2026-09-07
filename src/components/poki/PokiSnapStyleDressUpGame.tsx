import React, { useState, useCallback } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiSnapStyleDressUpGameProps {
  onBack: () => void;
}

interface StyleCategory {
  key: 'hair' | 'top' | 'bottom' | 'glasses' | 'bag';
  name: string;
  options: { id: number; label: string; icon: string; score: number }[];
}

const CATEGORIES: StyleCategory[] = [
  {
    key: 'hair',
    name: '헤어스타일',
    options: [
      { id: 1, label: '네온 핑크 포니테일', icon: '👱‍♀️', score: 20 },
      { id: 2, label: '골든 웨이브 밥', icon: '👩‍🦰', score: 20 },
      { id: 3, label: '사이버 블루 트윈', icon: '👧', score: 20 },
      { id: 4, label: '시크 다크 픽시', icon: '👩', score: 20 },
    ],
  },
  {
    key: 'top',
    name: '탑 상의',
    options: [
      { id: 1, label: '스트릿 오버핏 후디', icon: '🧥', score: 20 },
      { id: 2, label: '크롭 레더 재킷', icon: '👚', score: 20 },
      { id: 3, label: '홀로그램 블레이저', icon: '🥼', score: 20 },
      { id: 4, label: '빈티지 니트 스웨터', icon: '👕', score: 20 },
    ],
  },
  {
    key: 'bottom',
    name: '바텀 하의',
    options: [
      { id: 1, label: '와이드 카고 팬츠', icon: '👖', score: 20 },
      { id: 2, label: '네온 플리츠 스커트', icon: '👗', score: 20 },
      { id: 3, label: '디스트로이드 데님', icon: '🩳', score: 20 },
      { id: 4, label: '하이웨이스트 슬랙스', icon: '👖', score: 20 },
    ],
  },
  {
    key: 'glasses',
    name: '아이웨어',
    options: [
      { id: 1, label: '캣아이 틴트 글래스', icon: '🕶️', score: 20 },
      { id: 2, label: '사이버 고글', icon: '🥽', score: 20 },
      { id: 3, label: '레트로 라운드 안경', icon: '👓', score: 20 },
      { id: 4, label: '홀로그램 셰이드', icon: '🕶️', score: 20 },
    ],
  },
  {
    key: 'bag',
    name: '핸드백/백팩',
    options: [
      { id: 1, label: '미니 크로스 바디백', icon: '👜', score: 20 },
      { id: 2, label: '체인 스트랩 클러치', icon: '👝', score: 20 },
      { id: 3, label: '어반 메신저 백팩', icon: '🎒', score: 20 },
      { id: 4, label: '럭셔리 쇼퍼백', icon: '🛍️', score: 20 },
    ],
  },
];

export const PokiSnapStyleDressUpGame: React.FC<PokiSnapStyleDressUpGameProps> = ({ onBack }) => {
  const [gameState, setGameState] = useState<'ready' | 'styling' | 'snapped' | 'victory'>('ready');
  const [activeCatIndex, setActiveCatIndex] = useState(0);
  const [selectedItems, setSelectedItems] = useState<{ [key: string]: number }>({
    hair: 1,
    top: 1,
    bottom: 1,
    glasses: 1,
    bag: 1,
  });
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);
  const [photoFlash, setPhotoFlash] = useState(false);

  const currentCategory = CATEGORIES[activeCatIndex];

  const handleStart = () => {
    setGameState('styling');
    setRewardReceipt(null);
  };

  const handleSelectOption = (catKey: string, optId: number) => {
    setSelectedItems((prev) => ({ ...prev, [catKey]: optId }));
  };

  const handleSnapPhoto = useCallback(() => {
    setPhotoFlash(true);
    setTimeout(() => {
      setPhotoFlash(false);
      setGameState('victory');

      const receipt = calculateAndDepositMissionReward({
        gameId: 'pokisnapstyledressup',
        gameTitle: 'SnapStyle Dress Up: Magazine Cover',
        isVictory: true,
        score: 100,
        maxTargetScore: 100,
        durationSeconds: 30,
      });
      setRewardReceipt(receipt);
    }, 400);
  }, []);

  return (
    <div className="flex flex-col items-center justify-between w-full h-[100dvh] bg-[#18181b] text-[#fdfcfc] select-none overflow-hidden font-mono">
      <MinimalistMissionHUD
        gameTitle="SnapStyle Dress Up"
        missionTarget="5개 코디 후 매거진 스냅샷 촬영"
        currentScore={Object.keys(selectedItems).length * 20}
        maxScore={100}
        scoreUnit="점"
        onBack={onBack}
      />

      {/* Main Studio Viewport */}
      <div className="relative flex-1 w-full max-w-md flex flex-col items-center justify-center p-3">
        {/* Magazine Cover Studio Frame */}
        <div className="relative w-full aspect-[3/4] bg-gradient-to-b from-slate-900 via-purple-950/40 to-slate-900 border-2 border-pink-500/40 rounded-lg flex flex-col items-center justify-between p-4 shadow-2xl overflow-hidden">
          {/* Magazine Title Header */}
          <div className="w-full flex justify-between items-center z-10 border-b border-pink-500/30 pb-2">
            <span className="text-xl font-black text-pink-400 tracking-widest">[ SNAP•STYLE ]</span>
            <span className="text-xs text-amber-300 font-bold">ISSUE #83 SPECIAL</span>
          </div>

          {/* Model Display Stage */}
          <div className="relative flex-1 w-full flex items-center justify-center">
            {/* Model Card Avatar Canvas */}
            <div className="relative w-40 h-56 flex flex-col items-center justify-center bg-black/40 rounded-lg border border-white/20 p-2 shadow-inner">
              <canvas
                width={120}
                height={160}
                ref={(node) => {
                  if (!node) return;
                  const ctx = node.getContext('2d');
                  if (!ctx) return;
                  ctx.clearRect(0, 0, 120, 160);
                  drawCardSprite(ctx, 83, 10, 10, 100, 140);
                }}
                className="w-full h-full object-contain"
              />

              {/* Badges of selected items */}
              <div className="absolute -bottom-3 flex gap-1 text-sm bg-black/80 px-2 py-1 rounded-full border border-pink-500/50">
                <span>{CATEGORIES[0].options[selectedItems.hair - 1].icon}</span>
                <span>{CATEGORIES[1].options[selectedItems.top - 1].icon}</span>
                <span>{CATEGORIES[2].options[selectedItems.bottom - 1].icon}</span>
                <span>{CATEGORIES[3].options[selectedItems.glasses - 1].icon}</span>
                <span>{CATEGORIES[4].options[selectedItems.bag - 1].icon}</span>
              </div>
            </div>
          </div>

          {/* Magazine Cover Headlines */}
          <div className="w-full flex justify-between items-end z-10 text-xs">
            <div className="text-slate-300 flex flex-col gap-0.5">
              <span className="text-amber-400 font-bold">TRENDING NOW:</span>
              <span>• {CATEGORIES[0].options[selectedItems.hair - 1].label}</span>
              <span>• {CATEGORIES[1].options[selectedItems.top - 1].label}</span>
            </div>
            <div className="text-pink-400 font-black text-sm">
              SCORE: 100/100
            </div>
          </div>

          {/* Camera Flash Screen */}
          {photoFlash && (
            <div className="absolute inset-0 bg-white z-50 animate-ping opacity-90" />
          )}
        </div>

        {gameState === 'ready' && (
          <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-6 text-center z-30">
            <h2 className="text-2xl font-bold text-pink-400 mb-2">[ SnapStyle Dress Up ]</h2>
            <p className="text-sm text-slate-300 mb-6">
              패션 매거진 표지를 장식할 최고의 스타일을 코디하세요!<br />
              1. <b>5가지 카테고리</b>(헤어, 상의, 하의, 안경, 백)를 탭해 아이템을 선택합니다.<br />
              2. 100점 룩을 완성한 후 <b>[📸 SNAP PHOTO]</b>를 탭해 셔터를 누르세요!
            </p>
            <button
              onClick={handleStart}
              className="px-8 py-3 bg-pink-500 hover:bg-pink-600 text-slate-950 font-black text-lg rounded-sm active:scale-95 transition-all shadow-lg"
            >
              스타일링 시작 [START]
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

      {/* Wardrobe Selector Footer */}
      {gameState === 'styling' && (
        <div className="w-full max-w-md p-3 bg-zinc-900 border-t border-white/10 flex flex-col gap-2">
          {/* Category Tabs */}
          <div className="flex items-center justify-between gap-1 overflow-x-auto pb-1">
            {CATEGORIES.map((cat, idx) => (
              <button
                key={cat.key}
                onClick={() => setActiveCatIndex(idx)}
                className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-sm transition-all whitespace-nowrap ${
                  idx === activeCatIndex
                    ? 'bg-pink-500 text-slate-950 shadow'
                    : 'bg-zinc-800 text-slate-400 hover:bg-zinc-700'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Options in active category */}
          <div className="grid grid-cols-4 gap-2">
            {currentCategory.options.map((opt) => {
              const isSelected = selectedItems[currentCategory.key] === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => handleSelectOption(currentCategory.key, opt.id)}
                  className={`p-2 flex flex-col items-center justify-center rounded border transition-all ${
                    isSelected
                      ? 'border-pink-400 bg-pink-500/20 text-white ring-1 ring-pink-400 scale-105'
                      : 'border-white/10 bg-zinc-800/80 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  <span className="text-2xl mb-1">{opt.icon}</span>
                  <span className="text-[10px] text-center leading-tight line-clamp-1">{opt.label}</span>
                </button>
              );
            })}
          </div>

          {/* Shutter Button */}
          <button
            onClick={handleSnapPhoto}
            className="w-full py-3 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-400 hover:to-rose-500 text-slate-950 font-black rounded-sm text-sm active:scale-95 transition-all shadow flex items-center justify-center gap-2 mt-1"
          >
            📸 [SNAP PHOTO] 셔터 누르기 (100점 완성)
          </button>
        </div>
      )}
    </div>
  );
};
export default PokiSnapStyleDressUpGame;
