import React, { useState, useCallback } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiVortellasDressUpGameProps {
  onBack: () => void;
}

interface WitchItem {
  id: number;
  name: string;
  type: 'hat' | 'cloak' | 'orb' | 'wand';
  icon: string;
  auraColor: string;
}

const WITCH_ITEMS: WitchItem[] = [
  { id: 1, name: '심연의 마녀 고깔모자', type: 'hat', icon: '🧙‍♀️', auraColor: '#7c3aed' },
  { id: 2, name: '달빛 크로우 깃털모', type: 'hat', icon: '🎩', auraColor: '#38bdf8' },
  { id: 3, name: '붉은 장미 주술 망토', type: 'cloak', icon: '🧣', auraColor: '#ef4444' },
  { id: 4, name: '성운의 밤하늘 로브', type: 'cloak', icon: '🧥', auraColor: '#8b5cf6' },
  { id: 5, name: '예지력의 퍼플 오브', type: 'orb', icon: '🔮', auraColor: '#c084fc' },
  { id: 6, name: '영혼의 에메랄드 구', type: 'orb', icon: '🟢', auraColor: '#10b981' },
  { id: 7, name: '황금 초승달 마법봉', type: 'wand', icon: '🪄', auraColor: '#fbbf24' },
  { id: 8, name: '흑마법 흑요석 지팡이', type: 'wand', icon: '🦯', auraColor: '#f43f5e' },
];

export const PokiVortellasDressUpGame: React.FC<PokiVortellasDressUpGameProps> = ({ onBack }) => {
  const [gameState, setGameState] = useState<'ready' | 'customizing' | 'casting' | 'victory'>('ready');
  const [equipped, setEquipped] = useState<{ [key: string]: WitchItem | null }>({
    hat: WITCH_ITEMS[0],
    cloak: WITCH_ITEMS[2],
    orb: WITCH_ITEMS[4],
    wand: WITCH_ITEMS[6],
  });
  const [activeTab, setActiveTab] = useState<'hat' | 'cloak' | 'orb' | 'wand'>('hat');
  const [magicPower, setMagicPower] = useState(100);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  const handleStart = () => {
    setGameState('customizing');
    setRewardReceipt(null);
  };

  const handleEquip = (item: WitchItem) => {
    setEquipped((prev) => ({ ...prev, [item.type]: item }));
  };

  const handleCastRitual = useCallback(() => {
    setGameState('casting');
    setTimeout(() => {
      setGameState('victory');
      const receipt = calculateAndDepositMissionReward({
        gameId: 'pokivortellasdressup',
        gameTitle: "Vortella's Gothic Dress Up",
        isVictory: true,
        score: 100,
        maxTargetScore: 100,
        durationSeconds: 30,
      });
      setRewardReceipt(receipt);
    }, 900);
  }, []);

  return (
    <div className="flex flex-col items-center justify-between w-full h-[100dvh] bg-[#09090b] text-[#fdfcfc] select-none overflow-hidden font-mono">
      <MinimalistMissionHUD
        gameTitle="Vortella's Dress Up"
        missionTarget="고딕 마녀 4파츠 코디 후 주술 시전"
        currentScore={magicPower}
        maxScore={100}
        scoreUnit="마력"
        onBack={onBack}
      />

      {/* Main Altar Area */}
      <div className="relative flex-1 w-full max-w-md flex flex-col items-center justify-center p-3">
        {/* Magic Ritual Circle Stage */}
        <div className="relative w-full aspect-[4/5] bg-gradient-to-b from-[#18181b] via-[#2e1065]/30 to-[#09090b] border-2 border-purple-500/40 rounded-lg flex flex-col items-center justify-between p-4 shadow-2xl overflow-hidden">
          {/* Altar Rune Circle Effect */}
          <div className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-all ${
            gameState === 'casting' ? 'scale-125 animate-spin duration-700' : 'animate-pulse'
          }`}>
            <div className="w-64 h-64 border-2 border-dashed border-purple-500/30 rounded-full flex items-center justify-center">
              <div className="w-48 h-48 border border-pink-500/30 rounded-full rotate-45" />
            </div>
          </div>

          <div className="w-full flex justify-between items-center z-10 border-b border-purple-500/30 pb-1">
            <span className="text-base font-black text-purple-400 tracking-wider">[ VORTELLA • RITUAL ]</span>
            <span className="text-xs text-amber-300 font-bold">100% MAGICAL POWER</span>
          </div>

          {/* Vortella Card Avatar Display */}
          <div className="relative flex-1 w-full flex items-center justify-center z-10">
            <div className="relative w-44 h-56 flex flex-col items-center justify-center bg-black/60 rounded-lg border border-purple-500/40 p-2 shadow-2xl">
              <canvas
                width={120}
                height={160}
                ref={(node) => {
                  if (!node) return;
                  const ctx = node.getContext('2d');
                  if (!ctx) return;
                  ctx.clearRect(0, 0, 120, 160);
                  drawCardSprite(ctx, 85, 10, 10, 100, 140);
                }}
                className="w-full h-full object-contain filter drop-shadow-[0_0_12px_rgba(168,85,247,0.5)]"
              />

              {/* Equipped items badges */}
              <div className="absolute -bottom-3 flex gap-2 text-sm bg-purple-950/90 px-3 py-1 rounded-full border border-purple-400/50">
                <span>{equipped.hat?.icon}</span>
                <span>{equipped.cloak?.icon}</span>
                <span>{equipped.orb?.icon}</span>
                <span>{equipped.wand?.icon}</span>
              </div>
            </div>
          </div>

          {/* Spell Summary */}
          <div className="w-full flex justify-between items-center z-10 text-xs text-purple-200">
            <span>모자: {equipped.hat?.name.split(' ')[0]}</span>
            <span>오브: {equipped.orb?.name.split(' ')[0]}</span>
            <span>지팡이: {equipped.wand?.name.split(' ')[0]}</span>
          </div>
        </div>

        {gameState === 'ready' && (
          <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-6 text-center z-30">
            <h2 className="text-2xl font-bold text-purple-400 mb-2">[ Vortella's Dress Up ]</h2>
            <p className="text-sm text-slate-300 mb-6">
              어둠의 고딕 마녀 보르텔라를 마법 의상으로 치장하세요!<br />
              1. <b>모자, 망토, 오브, 마법봉</b> 4개 파츠를 스타일링합니다.<br />
              2. 100% 마력을 충전한 후 <b>[룬 주술 시전]</b> 버튼을 눌러 마법진을 각성시키세요!
            </p>
            <button
              onClick={handleStart}
              className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white font-black text-lg rounded-sm active:scale-95 transition-all shadow-lg"
            >
              소환 및 코디 개시 [START]
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

      {/* Wardrobe Selector */}
      {gameState === 'customizing' && (
        <div className="w-full max-w-md p-3 bg-zinc-900 border-t border-purple-500/20 flex flex-col gap-2">
          {/* Tabs */}
          <div className="flex items-center justify-between gap-1">
            {(['hat', 'cloak', 'orb', 'wand'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-1.5 text-xs font-bold rounded-sm transition-all capitalize ${
                  activeTab === tab
                    ? 'bg-purple-600 text-white shadow'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                {tab === 'hat' ? '모자' : tab === 'cloak' ? '망토' : tab === 'orb' ? '오브' : '마법봉'}
              </button>
            ))}
          </div>

          {/* Options */}
          <div className="grid grid-cols-2 gap-2">
            {WITCH_ITEMS.filter((i) => i.type === activeTab).map((item) => {
              const isSelected = equipped[item.type]?.id === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleEquip(item)}
                  className={`p-2.5 flex items-center gap-2 rounded border transition-all ${
                    isSelected
                      ? 'border-purple-400 bg-purple-900/30 text-white ring-1 ring-purple-400 scale-[1.02]'
                      : 'border-white/10 bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  <span className="text-2xl">{item.icon}</span>
                  <span className="text-xs text-left leading-tight line-clamp-1">{item.name}</span>
                </button>
              );
            })}
          </div>

          {/* Cast Ritual Action Button */}
          <button
            onClick={handleCastRitual}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black rounded-sm text-sm active:scale-95 transition-all shadow mt-1"
          >
            🔮 [CAST RITUAL] 어둠의 룬 주술 시전 (100% 각성)
          </button>
        </div>
      )}
    </div>
  );
};
export default PokiVortellasDressUpGame;
