import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData, Language } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface PvpArenaMatgoMissionProps {
  deck: CardData[];
  language: Language;
  lowSpecMode?: boolean;
  playSfx: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface HwatuCard {
  id: number;
  month: number;
  type: 'gwang' | 'animal' | 'ribbon' | 'pi';
  icon: string;
}

export const PvpArenaMatgoMission: React.FC<PvpArenaMatgoMissionProps> = ({
  deck: _deck,
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
  const [playerScore, setPlayerScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  const [handCards, setHandCards] = useState<HwatuCard[]>([]);
  const [fieldCards, setFieldCards] = useState<HwatuCard[]>([]);
  const [goCount, setGoCount] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_mission_pvp_matgo') !== 'true';
    } catch {
      return true;
    }
  });
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const startTimeRef = useRef(Date.now());

  const initGame = useCallback(() => {
    const hand: HwatuCard[] = [
      { id: 1, month: 1, type: 'gwang', icon: '🎴' },
      { id: 2, month: 3, type: 'gwang', icon: '🌸' },
      { id: 3, month: 5, type: 'animal', icon: '🎏' },
      { id: 4, month: 7, type: 'animal', icon: '🐗' },
      { id: 5, month: 9, type: 'ribbon', icon: '🍶' },
    ];
    const field: HwatuCard[] = [
      { id: 6, month: 1, type: 'pi', icon: '🎍' },
      { id: 7, month: 3, type: 'ribbon', icon: '🌺' },
      { id: 8, month: 6, type: 'animal', icon: '🦋' },
      { id: 9, month: 8, type: 'gwang', icon: '🌕' },
    ];

    setHandCards(hand);
    setFieldCards(field);
    setPlayerScore(0);
    setAiScore(0);
    setGoCount(0);
    setIsGameOver(false);
    setSettlementReceipt(null);
    startTimeRef.current = Date.now();
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const playCard = (cardId: number) => {
    if (isGameOver || isPaused) return;

    const played = handCards.find(c => c.id === cardId);
    if (!played) return;

    // Check match in field
    const matched = fieldCards.find(c => c.month === played.month);
    let gained = 3;
    let nextField = [...fieldCards];

    if (matched) {
      gained = played.type === 'gwang' ? 7 : 4;
      nextField = nextField.filter(c => c.id !== matched.id);
      playSfx('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
    } else {
      nextField.push(played);
      playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    }

    const nextHand = handCards.filter(c => c.id !== cardId);
    const nextPlayerScore = playerScore + gained;
    const nextAiScore = aiScore + Math.floor(Math.random() * 4);

    setHandCards(nextHand);
    setFieldCards(nextField);
    setPlayerScore(nextPlayerScore);
    setAiScore(nextAiScore);

    // AI counter turn
    if (nextHand.length === 0 || nextPlayerScore >= 7) {
      endMatch(nextPlayerScore, nextAiScore);
    }
  };

  const callGo = () => {
    if (isGameOver || isPaused || playerScore < 7) return;

    setGoCount(g => g + 1);
    setPlayerScore(s => s + 5);
    playSfx('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
  };

  const callStop = () => {
    if (isGameOver || isPaused || playerScore < 7) return;

    endMatch(playerScore, aiScore);
  };

  const endMatch = (pScore: number, eScore: number) => {
    setIsGameOver(true);
    const isWin = pScore >= eScore;
    if (isWin) {
      playSfx('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
    } else {
      playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
    }

    const duration = (Date.now() - startTimeRef.current) / 1000;
    const receipt = calculateAndDepositMissionReward({
      gameId: 'mission_pvp_matgo',
      gameTitle: 'PVP 아레나 맞고 대결',
      durationSeconds: duration,
      score: pScore * 300 + (isWin ? 3000 : 500),
      difficulty: 'NIGHTMARE',
      isVictory: isWin
    });
    setSettlementReceipt(receipt);
    onReward(receipt.totalSns);
  };

  const tutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 화투 7점 달성 승리' : 'STEP 1: SCORE 7+ POINTS',
      title: isKo ? '화투패 매칭 & 고/스톱 베팅' : 'Match Cards & Call Go/Stop',
      description: isKo
        ? '손패의 화투를 바닥의 같은 월(달) 패와 매칭하여 7점 이상을 달성하고 승리하세요.'
        : 'Match identical month cards to score 7+ points and decide Go or Stop.',
      keyPoints: isKo
        ? [
            '7점 이상 달성 시 스톱으로 승리',
            '광/동물/띠/피 조합 점수 시스템',
            '고(Go) 선언 시 점수 가산 배수'
          ]
        : [
            'Score 7+ points to win by calling Stop',
            'Gwang/Animal/Ribbon combination points',
            'Calling Go multiplies payout'
          ],
      iconType: 'GOAL'
    },
    {
      badge: isKo ? 'STEP 2: 퓨어 제스처 조작' : 'STEP 2: PURE GESTURES',
      title: isKo ? '손패 원터치 제출' : 'One-Touch Card Play',
      description: isKo
        ? '하단 손패의 화투를 직접 탭하여 바닥으로 제출하고 매칭합니다.'
        : 'Tap hand cards directly to play to the field table.',
      keyPoints: isKo
        ? [
            '👆 손패 탭: 즉시 바닥패 제출 & 매칭',
            '⚡ 실시간 AI 상대 턴 응수',
            '🎴 7점 도달 시 [고] / [스톱] 버튼 활성화'
          ]
        : [
            '👆 Tap Card: Instant play & match',
            '⚡ Real-time AI response turn',
            '🎴 Unlock Go/Stop at 7 points'
          ],
      iconType: 'GESTURES'
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '대결 승리 즉시 NIGHTMARE 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Nightmare payout deposited atomically to your LocalStorage wallet upon match win.',
      keyPoints: isKo
        ? [
            '승리 즉시 LocalStorage 영구 지갑 입금',
            '최종 획득 점수 및 고(Go) 선언 보너스',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Final score and Go bonus multipliers',
            'VictoryRewardModal golden coin fanfare'
          ],
      iconType: 'REWARDS'
    }
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-[#fdfcfc] text-[#201d1d] font-mono select-none flex flex-col overflow-hidden items-center justify-between">
      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? 'PVP 아레나 맞고' : 'PVP Arena Matgo'}
        language={language}
        telemetries={[
          { label: isKo ? '내 점수' : 'YOU', value: `${playerScore}점`, color: 'text-cyan-700 font-bold' },
          { label: isKo ? '상대' : 'AI', value: `${aiScore}점`, color: 'text-rose-600 font-bold' },
          { label: isKo ? '고' : 'GO', value: `${goCount}`, color: 'text-amber-600 font-bold' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => setIsPaused(prev => !prev)}
        isPaused={isPaused}
      />

      {/* Matgo Table Viewport */}
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center relative overflow-hidden p-3 w-full max-w-sm">
        {/* Field Cards */}
        <div className="w-full max-w-xs p-3 bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] mb-3">
          <div className="text-[10px] text-slate-500 font-bold mb-1.5 uppercase">{isKo ? '바닥패' : 'Field Table'}</div>
          <div className="flex items-center gap-2 flex-wrap min-h-[48px]">
            {fieldCards.map((c) => (
              <div key={c.id} className="w-9 h-12 bg-white border border-[rgba(15,0,0,0.15)] flex flex-col items-center justify-center rounded-none shadow-xs">
                <span className="text-sm">{c.icon}</span>
                <span className="text-[8px] font-bold text-slate-500">{c.month}월</span>
              </div>
            ))}
          </div>
        </div>

        {/* Go/Stop Options when >= 7pts */}
        {playerScore >= 7 && !isGameOver && (
          <div className="w-full max-w-xs flex gap-2 mb-3">
            <button
              type="button"
              onClick={callGo}
              className="flex-1 py-2.5 bg-amber-500 text-[#201d1d] font-bold text-xs rounded-none border border-amber-600 shadow-xs active:scale-95"
            >
              🔥 {isKo ? `고! (${goCount + 1} GO)` : `GO! (${goCount + 1} GO)`}
            </button>
            <button
              type="button"
              onClick={callStop}
              className="flex-1 py-2.5 bg-rose-600 text-white font-bold text-xs rounded-none shadow-xs active:scale-95"
            >
              🛑 {isKo ? '스톱 (승리 정산)' : 'STOP (Win Match)'}
            </button>
          </div>
        )}

        {/* Player Hand Cards */}
        <div className="w-full max-w-xs p-3 bg-white border border-[rgba(15,0,0,0.15)] shadow-xs">
          <div className="text-[10px] text-slate-500 font-bold mb-1.5 uppercase">{isKo ? '내 손패 (탭하여 제출)' : 'Your Hand (Tap to play)'}</div>
          <div className="flex items-center gap-2 flex-wrap min-h-[48px]">
            {handCards.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => playCard(c.id)}
                disabled={isGameOver || isPaused}
                className="w-10 h-14 bg-amber-50 border border-amber-400 flex flex-col items-center justify-center rounded-none active:scale-95 cursor-pointer shadow-xs hover:border-[#201d1d]"
              >
                <span className="text-base">{c.icon}</span>
                <span className="text-[8px] font-bold text-amber-900">{c.month}월</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Minimal Bottom Guide */}
      <div className="w-full pb-3 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1 bg-black/5 border border-[rgba(15,0,0,0.12)] rounded-full text-[10px] text-[#6e6e73] font-mono">
          {isKo ? '손패를 탭하여 바닥패와 같은 월을 매칭하세요 (7점 이상 시 스톱 가능)' : 'Tap hand cards to match months (Call Stop at 7+ pts)'}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="mission_pvp_matgo"
          gameTitle={isKo ? 'PVP 아레나 맞고 대결 미션' : 'PVP Arena Matgo Mission'}
          customSteps={tutorialSteps}
          language={language}
          onStartGame={() => setShowTutorial(false)}
          onClose={() => setShowTutorial(false)}
        />
      )}

      {/* Victory Reward Settlement Modal */}
      {isGameOver && settlementReceipt && (
        <VictoryRewardModal
          receipt={settlementReceipt}
          language={language}
          onPlayAgain={initGame}
          onExit={onExit}
        />
      )}
    </div>
  );
};
export default PvpArenaMatgoMission;
