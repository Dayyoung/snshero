import React, { useState, useCallback } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';

interface PokiAnycolorGameProps {
  onBack: () => void;
}

interface ColorPart {
  id: number;
  name: string;
  targetColor: string; // Color hex
  requiredIndex: number; // 1 to 5 corresponding to palette
  currentColor: string | null;
  // SVG polygon or path representation for clicking
  d: string;
}

const PALETTE = [
  { id: 1, color: '#f43f5e', name: 'Ruby Pink' },
  { id: 2, color: '#0ea5e9', name: 'Sky Cyan' },
  { id: 3, color: '#eab308', name: 'Warm Amber' },
  { id: 4, color: '#10b981', name: 'Emerald' },
  { id: 5, color: '#8b5cf6', name: 'Violet' },
];

export const PokiAnycolorGame: React.FC<PokiAnycolorGameProps> = ({ onBack }) => {
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'victory'>('ready');
  const [selectedColorIndex, setSelectedColorIndex] = useState<number>(1);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  // 10 Geometric Art Sections forming a stained glass / retro robot illustration
  const [parts, setParts] = useState<ColorPart[]>([
    { id: 1, name: 'Crown Gem', targetColor: '#f43f5e', requiredIndex: 1, currentColor: null, d: 'M 160 60 L 200 20 L 240 60 L 200 90 Z' },
    { id: 2, name: 'Visor Left', targetColor: '#0ea5e9', requiredIndex: 2, currentColor: null, d: 'M 130 110 L 195 110 L 195 160 L 140 150 Z' },
    { id: 3, name: 'Visor Right', targetColor: '#0ea5e9', requiredIndex: 2, currentColor: null, d: 'M 205 110 L 270 110 L 260 150 L 205 160 Z' },
    { id: 4, name: 'Ear Wing Left', targetColor: '#eab308', requiredIndex: 3, currentColor: null, d: 'M 110 90 L 130 110 L 120 170 L 90 140 Z' },
    { id: 5, name: 'Ear Wing Right', targetColor: '#eab308', requiredIndex: 3, currentColor: null, d: 'M 290 90 L 310 140 L 280 170 L 270 110 Z' },
    { id: 6, name: 'Mouth Plate', targetColor: '#10b981', requiredIndex: 4, currentColor: null, d: 'M 160 170 L 240 170 L 225 210 L 175 210 Z' },
    { id: 7, name: 'Collar Core', targetColor: '#8b5cf6', requiredIndex: 5, currentColor: null, d: 'M 180 230 L 220 230 L 210 270 L 190 270 Z' },
    { id: 8, name: 'Chest Shield L', targetColor: '#f43f5e', requiredIndex: 1, currentColor: null, d: 'M 120 240 L 175 240 L 180 340 L 110 320 Z' },
    { id: 9, name: 'Chest Shield R', targetColor: '#f43f5e', requiredIndex: 1, currentColor: null, d: 'M 225 240 L 280 240 L 290 320 L 220 340 Z' },
    { id: 10, name: 'Power Reactor', targetColor: '#eab308', requiredIndex: 3, currentColor: null, d: 'M 185 290 L 215 290 L 210 350 L 190 350 Z' },
  ]);

  const handleStart = () => {
    setParts((prev) => prev.map((p) => ({ ...p, currentColor: null })));
    setGameState('playing');
    setRewardReceipt(null);
  };

  const handleVictory = useCallback(() => {
    setGameState('victory');
    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokianycolor',
      gameTitle: 'Anycolor: Pop Art Palette',
      isVictory: true,
      score: 10,
      maxTargetScore: 10,
      durationSeconds: 30,
    });
    setRewardReceipt(receipt);
  }, []);

  const handlePartClick = (part: ColorPart) => {
    if (gameState !== 'playing') return;
    if (part.requiredIndex === selectedColorIndex) {
      const updated = parts.map((p) =>
        p.id === part.id ? { ...p, currentColor: PALETTE[selectedColorIndex - 1].color } : p
      );
      setParts(updated);

      // Check all painted
      const completedCount = updated.filter((p) => p.currentColor !== null).length;
      if (completedCount === 10) {
        setTimeout(() => {
          handleVictory();
        }, 300);
      }
    }
  };

  const completedCount = parts.filter((p) => p.currentColor !== null).length;

  return (
    <div className="flex flex-col items-center justify-between w-full h-[100dvh] bg-[#18181b] text-[#fdfcfc] select-none overflow-hidden font-mono">
      <MinimalistMissionHUD
        gameTitle="Anycolor: Pop Art Palette"
        missionTarget="10개 파츠 완벽 채색"
        currentScore={completedCount}
        maxScore={10}
        scoreUnit="구역"
        onBack={onBack}
      />

      {/* Main Canvas SVG Drawing Area */}
      <div className="relative flex-1 w-full max-w-md flex flex-col items-center justify-center p-3">
        <div className="w-full aspect-[4/5] bg-zinc-900 border border-white/20 rounded-md p-4 flex items-center justify-center shadow-2xl">
          <svg
            viewBox="80 10 240 360"
            className="w-full h-full object-contain filter drop-shadow-lg"
          >
            {/* Background art outlines */}
            <rect x="70" y="5" width="260" height="370" rx="8" fill="#27272a" stroke="#3f3f46" strokeWidth="2" />

            {/* Drawing Parts */}
            {parts.map((part) => {
              const isFilled = part.currentColor !== null;
              const isMatchCurrentPalette = part.requiredIndex === selectedColorIndex;

              return (
                <g
                  key={part.id}
                  onClick={() => handlePartClick(part)}
                  className="cursor-pointer active:scale-95 transition-transform"
                >
                  <path
                    d={part.d}
                    fill={isFilled ? part.currentColor! : isMatchCurrentPalette ? '#52525b' : '#3f3f46'}
                    stroke="#18181b"
                    strokeWidth="3"
                    className={`transition-colors duration-200 ${
                      !isFilled && isMatchCurrentPalette ? 'animate-pulse' : ''
                    }`}
                  />
                  {/* Number label if not filled */}
                  {!isFilled && (
                    <text
                      x={
                        part.id === 1 ? 200 :
                        part.id === 2 ? 165 :
                        part.id === 3 ? 235 :
                        part.id === 4 ? 115 :
                        part.id === 5 ? 285 :
                        part.id === 6 ? 200 :
                        part.id === 7 ? 200 :
                        part.id === 8 ? 145 :
                        part.id === 9 ? 255 : 200
                      }
                      y={
                        part.id === 1 ? 60 :
                        part.id === 2 ? 140 :
                        part.id === 3 ? 140 :
                        part.id === 4 ? 135 :
                        part.id === 5 ? 135 :
                        part.id === 6 ? 195 :
                        part.id === 7 ? 255 :
                        part.id === 8 ? 295 :
                        part.id === 9 ? 295 : 325
                      }
                      fill={isMatchCurrentPalette ? '#fbbf24' : '#a1a1aa'}
                      fontSize="14"
                      fontWeight="bold"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      pointerEvents="none"
                    >
                      {part.requiredIndex}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {gameState === 'ready' && (
          <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-6 text-center">
            <h2 className="text-2xl font-bold text-violet-400 mb-2">[ Anycolor: Pop Art ]</h2>
            <p className="text-sm text-slate-300 mb-6">
              감각적인 컬러링으로 레트로 로봇 일러스트를 완성하세요!<br />
              1. 하단에서 색상 번호(1~5)를 선택합니다.<br />
              2. 도안에서 <b>동일한 번호의 구역</b>을 터치하여 채색합니다.<br />
              10개 구역을 100% 채색하면 갤러리 전시 & 보상 획득!
            </p>
            <button
              onClick={handleStart}
              className="px-8 py-3 bg-violet-500 hover:bg-violet-600 text-slate-950 font-black text-lg rounded-sm active:scale-95 transition-all shadow-lg"
            >
              컬러링 시작 [START]
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

      {/* Color Palette Selector Footer */}
      <div className="w-full max-w-md p-3 bg-zinc-900 border-t border-white/10 flex flex-col gap-2">
        <div className="flex justify-between items-center text-xs text-zinc-400 px-1">
          <span>선택된 색상: {PALETTE[selectedColorIndex - 1].name}</span>
          <span>진행도: {completedCount} / 10 ({Math.round((completedCount / 10) * 100)}%)</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          {PALETTE.map((pal) => {
            const isSelected = pal.id === selectedColorIndex;
            return (
              <button
                key={pal.id}
                onClick={() => setSelectedColorIndex(pal.id)}
                className={`flex-1 py-3.5 rounded-sm flex flex-col items-center justify-center font-bold text-sm transition-all shadow ${
                  isSelected ? 'ring-2 ring-white scale-105' : 'opacity-80'
                }`}
                style={{ backgroundColor: pal.color }}
              >
                <span className="text-white drop-shadow font-black">{pal.id}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
export default PokiAnycolorGame;
