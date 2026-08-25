import { drawCardSprite } from '../lib/canvasCardRenderer';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData, Language } from '../types';
import { cn, getCardSpriteStyle } from '../lib/utils';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface CardTapGameProps {
  deck: CardData[];
  language: Language;
  lowSpecMode?: boolean;
  playSfx: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

const GAME_DURATION = 30;

interface MoleState {
  id: number;
  row: number;
  col: number;
  cardId: number;
  type: 'enemy' | 'bonus' | 'bomb';
}

export const CardTapGame: React.FC<CardTapGameProps> = ({
  deck = [],
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
  const playerHeroId = deck[0]?.id || 12;
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [moles, setMoles] = useState<MoleState[]>([]);
  const [combo, setCombo] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_game_2d_card_tap') !== 'true';
    } catch {
      return true;
    }
  });
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const startTimeRef = useRef(Date.now());

  const spawnMole = useCallback(() => {
    const r = Math.floor(Math.random() * 3);
    const c = Math.floor(Math.random() * 3);
    const rand = Math.random();
    const type = rand < 0.15 ? 'bomb' : rand < 0.35 ? 'bonus' : 'enemy';
    const cardId = Math.floor(Math.random() * 110) + 1;

    setMoles(prev => {
      const filtered = prev.filter(m => !(m.row === r && m.col === c));
      return [...filtered, { id: Date.now(), row: r, col: c, cardId, type }];
    });
  }, []);

  const startGame = useCallback(() => {
    setScore(0);
    setLives(3);
    setCombo(0);
    setMoles([]);
    setTimeLeft(GAME_DURATION);
    setIsGameOver(false);
    setSettlementReceipt(null);
    startTimeRef.current = Date.now();
  }, []);

  useEffect(() => {
    startGame();
  }, [startGame]);

  // Spawn interval
  useEffect(() => {
    if (isGameOver || isPaused) return;

    const spawnTimer = setInterval(() => {
      spawnMole();
    }, 700);

    return () => clearInterval(spawnTimer);
  }, [isGameOver, isPaused, spawnMole]);

  // Timer countdown
  useEffect(() => {
    if (isGameOver || isPaused) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsGameOver(true);
          const duration = (Date.now() - startTimeRef.current) / 1000;
          const receipt = calculateAndDepositMissionReward({
            gameId: '2d_card_tap',
            gameTitle: '2D 카드 탭',
            durationSeconds: duration,
            score: score + 1500,
            difficulty: 'HARD',
            isVictory: true
          });
          setSettlementReceipt(receipt);
          onReward(receipt.totalSns);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isGameOver, isPaused, onReward, score]);

  const tapMole = (r: number, c: number) => {
    if (isGameOver || isPaused) return;

    const target = moles.find(m => m.row === r && m.col === c);
    if (!target) return;

    // Remove tapped mole
    setMoles(prev => prev.filter(m => !(m.row === r && m.col === c)));

    if (target.type === 'bomb') {
      setLives(l => {
        const nl = l - 1;
        if (nl <= 0) {
          setIsGameOver(true);
          const duration = (Date.now() - startTimeRef.current) / 1000;
          const receipt = calculateAndDepositMissionReward({
            gameId: '2d_card_tap',
            gameTitle: '2D 카드 탭',
            durationSeconds: duration,
            score,
            difficulty: 'HARD',
            isVictory: false
          });
          setSettlementReceipt(receipt);
          onReward(receipt.totalSns);
        }
        return nl;
      });
      setCombo(0);
      playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
    } else {
      const bonusPts = target.type === 'bonus' ? 300 : 100;
      const newCombo = combo + 1;
      setScore(s => s + bonusPts + newCombo * 20);
      setCombo(newCombo);
      playSfx('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
    }
  };

  const tutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 3x3 격자 카드 탭' : 'STEP 1: WHACK-A-CARD',
      title: isKo ? '출현 카드 신속 탭 & 폭탄 회피' : 'Tap Cards & Avoid Bombs',
      description: isKo
        ? '3x3 격자판에 무작위로 튀어나오는 카드를 30초 동안 신속하게 탭하여 점수를 획득하세요.'
        : 'Whack appearing cards on the 3x3 grid within 30 seconds while avoiding bombs.',
      keyPoints: isKo
        ? [
            '일반/보너스 카드 탭 시 점수 획득',
            '폭탄 ✕ 탭 시 라이프 차감',
            '연속 탭 성공 시 콤보 가산점'
          ]
        : [
            'Tap regular & bonus cards for points',
            'Avoid tapping bomb ✕ cards',
            'Combo multipliers for continuous hits'
          ],
      iconType: 'GOAL'
    },
    {
      badge: isKo ? 'STEP 2: 퓨어 제스처 조작' : 'STEP 2: PURE GESTURES',
      title: isKo ? '원터치 타일 탭' : 'One-Touch Tile Tap',
      description: isKo
        ? '격자판의 카드를 직접 탭하여 즉시 반응합니다.'
        : 'Tap tiles directly on the screen with zero buttons.',
      keyPoints: isKo
        ? [
            '👆 타일 탭: 즉시 타격 판정',
            '⚡ 실시간 스폰 & 디스폰 메커니즘',
            '❤️ 3회 라이프 시스템'
          ]
        : [
            '👆 Tile Tap: Instant hit recognition',
            '⚡ Dynamic spawn & despawn timings',
            '❤️ 3 Lives system'
          ],
      iconType: 'GESTURES'
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '30초 타임어택 종료 즉시 획득한 점수에 비례하여 SNS 보상이 지갑에 즉시 입금됩니다.'
        : 'Calculated and deposited atomically to your LocalStorage wallet upon game completion.',
      keyPoints: isKo
        ? [
            '승리 즉시 LocalStorage 영구 지갑 입금',
            '보너스 카드 및 콤보 보너스',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Bonus cards and combo multipliers',
            'VictoryRewardModal golden coin fanfare'
          ],
      iconType: 'REWARDS'
    }
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-[#fdfcfc] text-[#201d1d] font-mono select-none flex flex-col overflow-hidden items-center justify-between">
      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '2D 카드 탭' : '2D Card Tap'}
        language={language}
        telemetries={[
          { label: isKo ? '시간' : 'Time', value: `${timeLeft}s`, color: timeLeft <= 5 ? 'text-rose-600 font-bold' : 'text-cyan-700 font-bold' },
          { label: isKo ? '라이프' : 'Lives', value: '❤️'.repeat(Math.max(0, lives)), color: 'text-rose-600' },
          { label: isKo ? '점수' : 'Score', value: `${score}P`, color: 'text-amber-600 font-bold' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => setIsPaused(prev => !prev)}
        isPaused={isPaused}
      />

      {/* 3x3 Grid Viewport */}
      <div className="flex-1 min-h-0 flex items-center justify-center relative overflow-hidden p-2">
        <div className="w-full max-w-[320px] aspect-square bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] p-2 relative overflow-hidden touch-none select-none">
          <div className="grid grid-cols-3 gap-2 w-full h-full">
            {Array.from({ length: 9 }, (_, i) => {
              const r = Math.floor(i / 3);
              const c = i % 3;
              const mole = moles.find(m => m.row === r && m.col === c);

              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => tapMole(r, c)}
                  disabled={!mole || isPaused}
                  className={cn(
                    'aspect-square rounded-sm border transition-all duration-100 flex items-center justify-center relative overflow-hidden cursor-pointer active:scale-95',
                    mole ? 'border-amber-500 bg-white shadow-xs' : 'border-[rgba(15,0,0,0.06)] bg-white/40'
                  )}
                >
                  {mole && (
                    <div className="w-full h-full p-1 flex items-center justify-center">
                      <div className="w-full h-full" style={getCardSpriteStyle(mole.cardId)} />
                      {mole.type === 'bonus' && (
                        <span className="absolute top-1 right-1 text-[9px] font-black text-amber-700 bg-amber-200 px-1 rounded-xs border border-amber-400">
                          ★
                        </span>
                      )}
                      {mole.type === 'bomb' && (
                        <span className="absolute top-1 right-1 text-[9px] font-black text-rose-700 bg-rose-200 px-1 rounded-xs border border-rose-400">
                          ✕
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Minimal Bottom Guide */}
      <div className="w-full pb-4 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1 bg-black/5 border border-[rgba(15,0,0,0.12)] rounded-full text-[10px] text-[#6e6e73] font-mono">
          {isKo ? '튀어나오는 카드를 탭하세요 (폭탄 ✕ 주의, 보너스 ★ 획득)' : 'Tap cards fast (Avoid bomb ✕, catch bonus ★)'}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="2d_card_tap"
          gameTitle={isKo ? '2D 카드 탭: 두더지 잡기' : '2D Card Tap: Whack-a-Card'}
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
          onPlayAgain={startGame}
          onExit={onExit}
        />
      )}
    </div>
  );
};
export default CardTapGame;
