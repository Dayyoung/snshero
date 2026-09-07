import React, { useState, useCallback } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiSchoolCleaningGameProps {
  onBack: () => void;
}

interface TrashItem {
  id: number;
  x: number;
  y: number;
  icon: string;
  name: string;
  cleaned: boolean;
}

interface DeskItem {
  id: number;
  x: number;
  y: number;
  aligned: boolean;
}

export const PokiSchoolCleaningGame: React.FC<PokiSchoolCleaningGameProps> = ({ onBack }) => {
  const [gameState, setGameState] = useState<'ready' | 'cleaning' | 'victory'>('ready');
  const [trashList, setTrashList] = useState<TrashItem[]>([
    { id: 1, x: 70, y: 380, icon: '🥤', name: '음료수 캔', cleaned: false },
    { id: 2, x: 260, y: 420, icon: '📄', name: '구겨진 시험지', cleaned: false },
    { id: 3, x: 130, y: 490, icon: '🍌', name: '바나나 껍질', cleaned: false },
    { id: 4, x: 310, y: 350, icon: '🍎', name: '사과 꼭지', cleaned: false },
  ]);
  const [chalkCleaned, setChalkCleaned] = useState(false);
  const [desks, setDesks] = useState<DeskItem[]>([
    { id: 1, x: 80, y: 250, aligned: false },
    { id: 2, x: 200, y: 270, aligned: false },
    { id: 3, x: 320, y: 240, aligned: false },
  ]);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  const handleStart = () => {
    setTrashList([
      { id: 1, x: 70, y: 380, icon: '🥤', name: '음료수 캔', cleaned: false },
      { id: 2, x: 260, y: 420, icon: '📄', name: '구겨진 시험지', cleaned: false },
      { id: 3, x: 130, y: 490, icon: '🍌', name: '바나나 껍질', cleaned: false },
      { id: 4, x: 310, y: 350, icon: '🍎', name: '사과 꼭지', cleaned: false },
    ]);
    setChalkCleaned(false);
    setDesks([
      { id: 1, x: 80, y: 250, aligned: false },
      { id: 2, x: 200, y: 270, aligned: false },
      { id: 3, x: 320, y: 240, aligned: false },
    ]);
    setGameState('cleaning');
    setRewardReceipt(null);
  };

  const handleVictory = useCallback(() => {
    setGameState('victory');
    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokischoolcleaning',
      gameTitle: 'School Classroom Cleaning',
      isVictory: true,
      score: 100,
      maxTargetScore: 100,
      durationSeconds: 30,
    });
    setRewardReceipt(receipt);
  }, []);

  const checkAllDone = (updatedTrash: TrashItem[], isChalkDone: boolean, updatedDesks: DeskItem[]) => {
    const trashDone = updatedTrash.every((t) => t.cleaned);
    const desksDone = updatedDesks.every((d) => d.aligned);
    if (trashDone && isChalkDone && desksDone) {
      setTimeout(() => {
        handleVictory();
      }, 500);
    }
  };

  // 1. Pick Trash
  const handleTrashClick = (id: number) => {
    const updated = trashList.map((t) => (t.id === id ? { ...t, cleaned: true } : t));
    setTrashList(updated);
    checkAllDone(updated, chalkCleaned, desks);
  };

  // 2. Wipe Blackboard
  const handleBlackboardWipe = () => {
    if (!chalkCleaned) {
      setChalkCleaned(true);
      checkAllDone(trashList, true, desks);
    }
  };

  // 3. Align Desk
  const handleDeskClick = (id: number) => {
    const updated = desks.map((d) => (d.id === id ? { ...d, aligned: true } : d));
    setDesks(updated);
    checkAllDone(trashList, chalkCleaned, updated);
  };

  // Total Progress percentage
  const trashScore = trashList.filter((t) => t.cleaned).length * 10; // 40
  const chalkScore = chalkCleaned ? 30 : 0; // 30
  const deskScore = desks.filter((d) => d.aligned).length * 10; // 30
  const currentProgress = trashScore + chalkScore + deskScore;

  return (
    <div className="flex flex-col items-center justify-between w-full h-[100dvh] bg-[#0c4a6e] text-[#fdfcfc] select-none overflow-hidden font-mono">
      <MinimalistMissionHUD
        gameTitle="School Cleaning"
        missionTarget="방과 후 교실 100% 청소 완료"
        currentScore={currentProgress}
        maxScore={100}
        scoreUnit="%"
        onBack={onBack}
      />

      {/* Classroom Viewport */}
      <div className="relative flex-1 w-full max-w-md flex flex-col items-center justify-center p-3">
        <div className="relative w-full aspect-[4/5] bg-amber-100/90 rounded-lg border-2 border-white/30 p-3 shadow-2xl overflow-hidden flex flex-col justify-between">
          {/* Blackboard Area (Top) */}
          <div
            onClick={handleBlackboardWipe}
            className={`w-full h-28 rounded border-4 border-amber-900 flex flex-col items-center justify-center cursor-pointer transition-all shadow-md ${
              chalkCleaned ? 'bg-emerald-900' : 'bg-emerald-950 ring-2 ring-yellow-400/50'
            }`}
          >
            {chalkCleaned ? (
              <span className="text-emerald-200 text-xs font-bold">✨ 깨끗하게 닦인 칠판! ✨</span>
            ) : (
              <div className="flex flex-col items-center">
                <span className="text-yellow-200/80 text-sm line-through">방과후 낙서 & 지우개 가루</span>
                <span className="text-[10px] text-amber-300 animate-pulse mt-1">[탭하여 칠판 닦기] 🧽</span>
              </div>
            )}
          </div>

          {/* Wooden Floor Classroom Area (Middle/Bottom) */}
          <div className="relative flex-1 w-full mt-2 bg-amber-200/60 rounded border border-amber-400/50 overflow-hidden">
            {/* Window */}
            <div className="absolute top-2 right-4 w-16 h-20 bg-sky-200 border-2 border-amber-800 rounded grid grid-cols-2 grid-rows-2">
              <div className="border border-amber-800/40" />
              <div className="border border-amber-800/40" />
              <div className="border border-amber-800/40" />
              <div className="border border-amber-800/40" />
            </div>

            {/* School Hero Avatar (Card #87) */}
            <div className="absolute bottom-4 left-4 w-14 h-20 bg-black/20 rounded border border-white/20 p-1 flex items-center justify-center shadow">
              <canvas
                width={60}
                height={80}
                ref={(node) => {
                  if (!node) return;
                  const ctx = node.getContext('2d');
                  if (!ctx) return;
                  ctx.clearRect(0, 0, 60, 80);
                  drawCardSprite(ctx, 87, 5, 5, 50, 70);
                }}
                className="w-full h-full object-contain"
              />
            </div>

            {/* Desks (Click to align) */}
            {desks.map((d) => (
              <div
                key={d.id}
                onClick={() => handleDeskClick(d.id)}
                style={{
                  left: d.x - 30,
                  top: d.y - 200,
                  transform: d.aligned ? 'rotate(0deg)' : 'rotate(-15deg)',
                }}
                className={`absolute w-16 h-12 rounded border cursor-pointer transition-all duration-300 flex flex-col items-center justify-center ${
                  d.aligned
                    ? 'bg-amber-700 border-amber-900 shadow-sm'
                    : 'bg-amber-600 border-yellow-500 ring-2 ring-yellow-400 animate-bounce'
                }`}
              >
                <span className="text-[10px] text-white font-bold">{d.aligned ? '🪑 정렬됨' : '삐뚤어짐!'}</span>
              </div>
            ))}

            {/* Trash Items (Click to clean) */}
            {trashList.map((t) => {
              if (t.cleaned) return null;
              return (
                <div
                  key={t.id}
                  onClick={() => handleTrashClick(t.id)}
                  style={{ left: t.x - 20, top: t.y - 220 }}
                  className="absolute p-2 bg-white/80 rounded-full border border-red-400 shadow-md cursor-pointer text-xl animate-pulse active:scale-90 transition-transform"
                  title={t.name}
                >
                  {t.icon}
                </div>
              );
            })}
          </div>
        </div>

        {gameState === 'ready' && (
          <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-6 text-center z-30">
            <h2 className="text-2xl font-bold text-sky-400 mb-2">[ School Cleaning ]</h2>
            <p className="text-sm text-slate-300 mb-6">
              방과 후 교실을 깨끗하게 정리정돈하세요!<br />
              1. <b>칠판</b>을 탭하여 분필 낙서를 말끔히 지웁니다.<br />
              2. 바닥에 흩어진 <b>쓰레기 4개</b>를 탭해 줍습니다.<br />
              3. 삐뚤어진 <b>책상 3개</b>를 탭해 반듯하게 정렬하세요!
            </p>
            <button
              onClick={handleStart}
              className="px-8 py-3 bg-sky-500 hover:bg-sky-600 text-slate-950 font-black text-lg rounded-sm active:scale-95 transition-all shadow-lg"
            >
              청소 시작 [START]
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

      {/* Progress Footer */}
      <div className="w-full max-w-md p-3 bg-slate-900 border-t border-white/10 flex items-center justify-between text-xs text-slate-300">
        <span>쓰레기: {trashList.filter((t) => t.cleaned).length}/4</span>
        <span>칠판: {chalkCleaned ? '완료' : '미완료'}</span>
        <span>책상: {desks.filter((d) => d.aligned).length}/3</span>
      </div>
    </div>
  );
};
export default PokiSchoolCleaningGame;
