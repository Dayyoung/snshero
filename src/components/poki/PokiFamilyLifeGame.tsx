import React, { useState, useCallback } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';

interface PokiFamilyLifeGameProps {
  onBack?: () => void;
  onExit?: () => void;
  onClose?: () => void;
  deck?: any[];
  cardId?: number;
  language?: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onReward?: (amount: number) => void;
}

interface Choice {
  title: string;
  happy: number;
}

interface LifeStage {
  age: number;
  questionKo: string;
  questionEn: string;
  optA: Choice;
  optB: Choice;
}

const STAGES: LifeStage[] = [
  {
    age: 18,
    questionKo: '고등학교를 졸업했습니다! 당신의 첫 번째 진로는?',
    questionEn: 'Graduated High School! What is your first path?',
    optA: { title: '명문 대학 진학 (학문 연구)', happy: 25 },
    optB: { title: '스타트업 창업 (도전)', happy: 25 }
  },
  {
    age: 26,
    questionKo: '첫 월급을 받았습니다. 어떻게 사용할까요?',
    questionEn: 'Got your first paycheck! How to spend it?',
    optA: { title: '부모님 효도 선물 & 저축', happy: 25 },
    optB: { title: '배낭 여행으로 견문 넓히기', happy: 25 }
  },
  {
    age: 32,
    questionKo: '평생을 함께할 반려자를 만났습니다!',
    questionEn: 'Found your soulmate! Wedding plans?',
    optA: { title: '화목한 스몰 웨딩 & 신혼집', happy: 25 },
    optB: { title: '친구들과 축제 같은 가든 파티', happy: 25 }
  },
  {
    age: 50,
    questionKo: '인생의 전성기! 주말에는 무엇을 할까요?',
    questionEn: 'Prime of life! What to do on weekends?',
    optA: { title: '가족과 함께하는 전원 캠핑', happy: 25 },
    optB: { title: '취미 악기 밴드 공연', happy: 25 }
  }
];

export const PokiFamilyLifeGame: React.FC<PokiFamilyLifeGameProps> = ({
  onBack,
  onExit,
  onClose,
  language = 'ko',
  playSfx,
  onReward
}) => {
  const handleExit = onBack || onExit || onClose || (() => {});
  const isKo = language === 'ko';

  const [step, setStep] = useState(0);
  const [happiness, setHappiness] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  const choose = (gain: number) => {
    const nextH = happiness + gain;
    setHappiness(nextH);
    if (playSfx) playSfx('/sfx/choice.mp3');
    if (navigator.vibrate) navigator.vibrate(20);

    if (step + 1 >= STAGES.length) {
      setGameWon(true);
      const receipt = calculateAndDepositMissionReward({
        gameId: 'pokifamilylife',
        gameTitle: isKo ? '패밀리 라이프 시뮬레이터' : 'Family Life Simulator',
        durationSeconds: 30,
        score: 1000,
        maxTargetScore: 1000,
        isVictory: true
      });
      setRewardReceipt(receipt);
      if (onReward) onReward(receipt.totalSns);
    } else {
      setStep(step + 1);
    }
  };

  const cur = STAGES[step] || STAGES[0];

  return (
    <div className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none bg-slate-950 text-white font-mono flex flex-col justify-between p-6">
      <MinimalistMissionHUD
        gameTitle={isKo ? '패밀리 라이프 시뮬레이터' : 'Family Life'}
        currentScore={happiness}
        targetScore={100}
        onBack={handleExit}
        stageInfo={`Age ${cur.age} | ❤️ ${happiness}%`}
      />

      <div className="flex-1 flex flex-col justify-center items-center max-w-md mx-auto w-full gap-6">
        <div className="w-24 h-24 rounded-3xl bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-5xl shadow-2xl">
          🏡
        </div>

        <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl w-full text-center shadow-xl">
          <span className="text-amber-400 font-bold text-sm">AGE {cur.age}</span>
          <h2 className="text-lg font-bold mt-2 text-slate-100">
            {isKo ? cur.questionKo : cur.questionEn}
          </h2>
        </div>

        <div className="flex flex-col gap-4 w-full">
          <button
            className="w-full p-4 rounded-xl bg-slate-800 active:bg-blue-600 border border-slate-600 font-bold text-sm text-left transition-all active:scale-95 shadow-md flex items-center justify-between"
            onClick={() => choose(cur.optA.happy)}
          >
            <span>{cur.optA.title}</span>
            <span className="text-emerald-400 font-normal">+25% ❤️</span>
          </button>
          <button
            className="w-full p-4 rounded-xl bg-slate-800 active:bg-blue-600 border border-slate-600 font-bold text-sm text-left transition-all active:scale-95 shadow-md flex items-center justify-between"
            onClick={() => choose(cur.optB.happy)}
          >
            <span>{cur.optB.title}</span>
            <span className="text-emerald-400 font-normal">+25% ❤️</span>
          </button>
        </div>
      </div>

      {rewardReceipt && (
        <VictoryRewardModal
          isOpen={gameWon}
          reward={rewardReceipt}
          onConfirm={handleExit}
        />
      )}
    </div>
  );
};

export default PokiFamilyLifeGame;
