import { drawCardSprite } from '../lib/canvasCardRenderer';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CARD_DATABASE } from '../cardDatabase';
import { CardData, Language } from '../types';
import { cn, getCardSpriteStyle } from '../lib/utils';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface CardSlotGameProps {
  deck: CardData[];
  language: Language;
  lowSpecMode?: boolean;
  playSfx: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

const COLS = 3;
const ROWS = 3;
const FREE_SPINS = 5;

interface SymbolData {
  cardId: number;
  isWild: boolean;
}

const randomCardId = (): number => Math.floor(Math.random() * 110) + 1;

export const CardSlotGame: React.FC<CardSlotGameProps> = ({
  deck = [],
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
  const playerHeroId = deck[0]?.id || 16;
  const [spinsLeft, setSpinsLeft] = useState(FREE_SPINS);
  const [score, setScore] = useState(0);
  const [grid, setGrid] = useState<SymbolData[][]>([]);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_game_2d_card_slot') !== 'true';
    } catch {
      return true;
    }
  });
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const wildCardIdsRef = useRef<number[]>([]);
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    const ids: number[] = [];
    for (const card of deck.slice(0, 5)) {
      const imgIdx = card.imageIndex || card.id || 0;
      if (imgIdx > 0 && imgIdx <= 110) ids.push(imgIdx);
    }
    wildCardIdsRef.current = ids;
  }, [deck]);

  const initGrid = useCallback((): SymbolData[][] => {
    const g: SymbolData[][] = [];
    for (let r = 0; r < ROWS; r++) {
      const row: SymbolData[] = [];
      for (let c = 0; c < COLS; c++) {
        row.push({
          cardId: randomCardId(),
          isWild: false,
        });
      }
      g.push(row);
    }
    return g;
  }, []);

  const startGame = useCallback(() => {
    setGrid(initGrid());
    setSpinsLeft(FREE_SPINS);
    setScore(0);
    setIsSpinning(false);
    setSettlementReceipt(null);
    startTimeRef.current = Date.now();
  }, [initGrid]);

  useEffect(() => {
    startGame();
  }, [startGame]);

  const handleSpin = () => {
    if (isSpinning || spinsLeft <= 0 || isPaused) return;

    setIsSpinning(true);
    setSpinsLeft(prev => prev - 1);
    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');

    // Reel spin animation
    const spinInterval = setInterval(() => {
      setGrid(initGrid());
    }, 100);

    setTimeout(() => {
      clearInterval(spinInterval);

      // Final Reel Outcome
      const finalGrid: SymbolData[][] = [];
      for (let r = 0; r < ROWS; r++) {
        const row: SymbolData[] = [];
        for (let c = 0; c < COLS; c++) {
          const isWild = Math.random() < 0.18;
          const cardId = isWild && wildCardIdsRef.current.length > 0
            ? wildCardIdsRef.current[Math.floor(Math.random() * wildCardIdsRef.current.length)]
            : randomCardId();
          row.push({ cardId, isWild });
        }
        finalGrid.push(row);
      }

      setGrid(finalGrid);
      setIsSpinning(false);

      // Check Matching Lines
      let spinWin = 150;
      for (let r = 0; r < ROWS; r++) {
        if (finalGrid[r][0].cardId === finalGrid[r][1].cardId || finalGrid[r][0].isWild || finalGrid[r][1].isWild) {
          spinWin += 300;
        }
      }

      const finalScore = score + spinWin;
      setScore(finalScore);
      playSfx('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');

      // Final Spin Settlement
      const TARGET_SCORE = 1200;
      if (spinsLeft - 1 <= 0) {
        setTimeout(() => {
          const duration = (Date.now() - startTimeRef.current) / 1000;
          const isVictory = finalScore >= TARGET_SCORE;
          const receipt = calculateAndDepositMissionReward({
            gameId: '2d_card_slot',
            gameTitle: '2D 카드 슬롯 머신',
            durationSeconds: duration,
            score: finalScore,
            difficulty: 'HARD',
            isVictory: isVictory
          });
          setSettlementReceipt(receipt);
          onReward(receipt.totalSns);
          if (!isVictory) {
            playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
          }
        }, 800);
      }
    }, 1200);
  };

  const tutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 5회 무료 스핀' : 'STEP 1: 5 FREE SPINS',
      title: isKo ? '3x3 릴 회전 & 심볼 매칭' : 'Spin 3x3 Reels & Match Symbols',
      description: isKo
        ? '5회의 무료 스핀 기회 동안 3x3 릴을 돌려 같은 카드 심볼 및 WILD 히어로를 매칭하세요.'
        : 'Spin 3x3 reels 5 times to match card symbols and WILD heroes for maximum payout.',
      keyPoints: isKo
        ? [
            '총 5회 스핀 완료 시 자동 정산',
            '동일 카드 및 WILD 심볼 매칭 시 대박 점수',
            '보유 덱의 카드가 황금 WILD로 등장'
          ]
        : [
            '5 spins completed yields instant settlement',
            'Match identical cards & WILD symbols',
            'Your deck cards appear as golden WILDs'
          ],
      iconType: 'GOAL'
    },
    {
      badge: isKo ? 'STEP 2: 퓨어 제스처 조작' : 'STEP 2: PURE GESTURES',
      title: isKo ? '화면 스와이프 & 탭 스핀' : 'Swipe Down & Tap Spin',
      description: isKo
        ? '화면을 아래로 스와이프하거나 하단 바를 원터치하여 슬롯 릴을 회전시킵니다.'
        : 'Swipe down on reels or tap button to spin with smooth physics.',
      keyPoints: isKo
        ? [
            '👆 아래로 스와이프: 슬롯 레버 당기기',
            '⚡ 원터치 스핀 버튼',
            '🎰 3열 릴 개별 정지 효과음'
          ]
        : [
            '👆 Swipe Down: Pull slot lever',
            '⚡ One-touch spin button',
            '🎰 3-reel stop sound effects'
          ],
      iconType: 'GESTURES'
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '5회 스핀 종료 즉시 획득한 배당 점수에 비례하여 SNS 보상이 지갑에 즉시 입금됩니다.'
        : 'Calculated and deposited atomically to your LocalStorage wallet upon spin completion.',
      keyPoints: isKo
        ? [
            '승리 즉시 LocalStorage 영구 지갑 입금',
            'WILD 잭팟 및 콤보 매칭 보너스',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'WILD jackpot and combo multipliers',
            'VictoryRewardModal golden coin fanfare'
          ],
      iconType: 'REWARDS'
    }
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-[#fdfcfc] text-[#201d1d] font-mono select-none flex flex-col overflow-hidden items-center justify-between">
      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '2D 카드 슬롯' : '2D Card Slot'}
        language={language}
        telemetries={[
          { label: isKo ? '스핀' : 'Spins', value: `${spinsLeft}/${FREE_SPINS}`, color: spinsLeft <= 1 ? 'text-rose-600 font-bold' : 'text-amber-600 font-bold' },
          { label: isKo ? '목표' : 'Goal', value: `${score}/1200P`, color: score >= 1200 ? 'text-emerald-700 font-bold' : 'text-slate-700 font-bold' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => setIsPaused(prev => !prev)}
        isPaused={isPaused}
      />

      {/* 3x3 Slot Machine Viewport */}
      <div className="flex-1 min-h-0 flex items-center justify-center relative overflow-hidden p-2">
        <div className="w-full max-w-[320px] aspect-square bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] p-2 relative overflow-hidden touch-none select-none">
          <div className="grid grid-cols-3 gap-1.5 w-full h-full">
            {grid.map((row, r) =>
              row.map((sym, c) => (
                <div
                  key={`${r}-${c}`}
                  className={cn(
                    'rounded-sm flex flex-col items-center justify-center relative border transition-all duration-150',
                    sym.isWild
                      ? 'border-amber-500 bg-amber-50 ring-1 ring-amber-400'
                      : 'border-[rgba(15,0,0,0.08)] bg-white'
                  )}
                >
                  <div
                    className="w-12 h-12 bg-contain bg-center bg-no-repeat rounded-sm"
                    style={getCardSpriteStyle(sym.cardId)}
                  />
                  {sym.isWild && (
                    <span className="text-[8px] font-black text-amber-700 bg-amber-200 px-1 rounded-xs absolute top-1 right-1 border border-amber-400">
                      WILD
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Spin Button */}
      <div className="shrink-0 flex flex-col items-center gap-1.5 w-full max-w-xs mx-auto pb-4 px-3 select-none">
        <button
          type="button"
          onClick={handleSpin}
          disabled={isSpinning || spinsLeft <= 0 || isPaused}
          className={cn(
            'w-full py-3.5 rounded-sm font-mono font-bold text-sm tracking-wider uppercase border transition-all active:scale-95 touch-manipulation',
            isSpinning || spinsLeft <= 0
              ? 'bg-black/5 text-slate-400 border-[rgba(15,0,0,0.1)] cursor-not-allowed'
              : 'bg-amber-500 text-black border-amber-600 hover:bg-amber-400 shadow-sm'
          )}
        >
          {isSpinning
            ? isKo ? '슬롯 회전 중...' : 'SPINNING...'
            : spinsLeft > 0
            ? isKo ? `스핀 돌리기 (${spinsLeft}회 남음)` : `SPIN (${spinsLeft} LEFT)`
            : isKo ? '스핀 소진 완료' : 'NO SPINS LEFT'}
        </button>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="2d_card_slot"
          gameTitle={isKo ? '2D 카드 슬롯 머신' : '2D Card Slot Machine'}
          customSteps={tutorialSteps}
          language={language}
          onStartGame={() => setShowTutorial(false)}
          onClose={() => setShowTutorial(false)}
        />
      )}

      {/* Victory Reward Settlement Modal */}
      {spinsLeft <= 0 && settlementReceipt && (
        <VictoryRewardModal
          receipt={settlementReceipt}
          language={language}
          onPlayAgain={startGame}
          onExit={onExit}
        />
      )}
    </div>
  );
};
export default CardSlotGame;
