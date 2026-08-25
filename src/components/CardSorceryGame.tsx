import { drawCardSprite } from '../lib/canvasCardRenderer';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Flame, Droplets, Mountain, Wind } from 'lucide-react';
import { CARD_DATABASE } from '../cardDatabase';
import { CardData, Language } from '../types';
import { cn, getCardSpriteStyle } from '../lib/utils';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface CardSorceryGameProps {
  deck: CardData[];
  language: Language;
  lowSpecMode?: boolean;
  playSfx: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

const GAME_DURATION = 40;

const ELEMENT_COUNTER: Record<string, string> = {
  water: 'fire',
  fire: 'wind',
  wind: 'land',
  land: 'water',
};

const ELEMENT_BG: Record<string, string> = {
  water: 'bg-blue-100 text-blue-800 border-blue-300',
  fire: 'bg-rose-100 text-rose-800 border-rose-300',
  wind: 'bg-teal-100 text-teal-800 border-teal-300',
  land: 'bg-amber-100 text-amber-800 border-amber-300',
};

interface EnemyState {
  id: number;
  cardId: number;
  element: string;
}

const getCardElement = (card: CardData): string => {
  const dbCard = card.imageIndex ? CARD_DATABASE[card.imageIndex] : null;
  const el = card.element || dbCard?.element;
  if (!el) return 'fire';
  const lower = el.toLowerCase();
  if (lower === 'air') return 'wind';
  if (lower === 'earth') return 'land';
  return lower;
};

export const CardSorceryGame: React.FC<CardSorceryGameProps> = ({
  deck = [],
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
  const playerHeroId = deck[0]?.id || 15;
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(5);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [enemy, setEnemy] = useState<EnemyState | null>(null);
  const [combo, setCombo] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackType, setFeedbackType] = useState<'correct' | 'wrong' | ''>('');
  const [isPaused, setIsPaused] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_game_2d_card_sorcery') !== 'true';
    } catch {
      return true;
    }
  });
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const startTimeRef = useRef(Date.now());
  const enemyTimerRef = useRef<number>(0);
  const elements = ['water', 'fire', 'wind', 'land'];

  const spawnEnemy = useCallback(() => {
    const el = elements[Math.floor(Math.random() * elements.length)];
    const cardId = Math.floor(Math.random() * 110) + 1;
    setEnemy({ id: Date.now(), cardId, element: el });
  }, []);

  const startGame = useCallback(() => {
    setScore(0);
    setLives(5);
    setCombo(0);
    setTimeLeft(GAME_DURATION);
    setIsGameOver(false);
    setSettlementReceipt(null);
    startTimeRef.current = Date.now();
    spawnEnemy();
  }, [spawnEnemy]);

  useEffect(() => {
    startGame();
  }, [startGame]);

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
            gameId: '2d_card_sorcery',
            gameTitle: '2D 카드 소서리',
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

  const handleCounterPick = (card: CardData) => {
    if (isGameOver || isPaused || !enemy) return;

    const playerEl = getCardElement(card);
    const counterEl = ELEMENT_COUNTER[playerEl];

    if (counterEl === enemy.element) {
      // Counter Success!
      const newCombo = combo + 1;
      const pts = 200 + newCombo * 50;
      setScore(s => s + pts);
      setCombo(newCombo);
      setFeedbackText(isKo ? `카운터 성공! +${pts}P` : `COUNTER HIT! +${pts}P`);
      setFeedbackType('correct');
      playSfx('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
      spawnEnemy();
    } else {
      // Failed Counter
      setLives(l => {
        const nextL = l - 1;
        if (nextL <= 0) {
          setIsGameOver(true);
          const duration = (Date.now() - startTimeRef.current) / 1000;
          const receipt = calculateAndDepositMissionReward({
            gameId: '2d_card_sorcery',
            gameTitle: '2D 카드 소서리',
            durationSeconds: duration,
            score,
            difficulty: 'HARD',
            isVictory: false
          });
          setSettlementReceipt(receipt);
          onReward(receipt.totalSns);
        }
        return nextL;
      });
      setCombo(0);
      setFeedbackText(isKo ? '원소 상성 불일치!' : 'ELEMENT MISMATCH!');
      setFeedbackType('wrong');
      playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
    }

    setTimeout(() => {
      setFeedbackText('');
      setFeedbackType('');
    }, 800);
  };

  const playerCards = deck.slice(0, 5);

  const tutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 4원소 상성 마법 결투' : 'STEP 1: ELEMENTAL DUEL',
      title: isKo ? '상성 원소로 적 마법 격파' : 'Counter Enemy Elements',
      description: isKo
        ? '적의 원소를 확인하고 상성 우위 원소 카드를 빠르게 탭하여 마법을 격파하세요 (물>불>바람>대지>물).'
        : 'Identify enemy element and tap counter card to dispel magic (Water>Fire>Wind>Land>Water).',
      keyPoints: isKo
        ? [
            '40초 동안 최대한 많은 적 격파 시 고득점',
            '물💧 > 불🔥 > 바람💨 > 대지🏔️ > 물💧',
            '연속 카운터 시 콤보 가산점'
          ]
        : [
            'Defeat as many enemies in 40s as possible',
            'Water💧 > Fire🔥 > Wind💨 > Land🏔️ > Water💧',
            'Combo multipliers for consecutive hits'
          ],
      iconType: 'GOAL'
    },
    {
      badge: isKo ? 'STEP 2: 퓨어 제스처 조작' : 'STEP 2: PURE GESTURES',
      title: isKo ? '하단 카드 원터치 시전' : 'One-Touch Spell Cast',
      description: isKo
        ? '화면 하단에 나열된 나의 덱 카드 중 상성 원소 카드를 즉시 탭합니다.'
        : 'Tap counter element card from your bottom hand with zero buttons.',
      keyPoints: isKo
        ? [
            '👆 카드 탭: 원소 마법 즉시 투사',
            '⚡ 실시간 적 원소 전환 메커니즘',
            '🛡️ 5회 라이프 보호'
          ]
        : [
            '👆 Tap Card: Instant spell release',
            '⚡ Real-time dynamic enemy element shifts',
            '🛡️ 5 Lives protection'
          ],
      iconType: 'GESTURES'
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '결투 종료 즉시 획득한 격파 점수에 비례하여 SNS 보상이 지갑에 즉시 입금됩니다.'
        : 'Calculated and deposited atomically to your LocalStorage wallet upon duel completion.',
      keyPoints: isKo
        ? [
            '승리 즉시 LocalStorage 영구 지갑 입금',
            '격파 수 및 콤보 보너스',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Defeat count and combo bonuses',
            'VictoryRewardModal golden coin fanfare'
          ],
      iconType: 'REWARDS'
    }
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-[#fdfcfc] text-[#201d1d] font-mono select-none flex flex-col overflow-hidden items-center justify-between">
      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '2D 카드 소서리' : '2D Card Sorcery'}
        language={language}
        telemetries={[
          { label: isKo ? '시간' : 'Time', value: `${timeLeft}s`, color: timeLeft <= 10 ? 'text-rose-600 font-bold' : 'text-cyan-700 font-bold' },
          { label: isKo ? '라이프' : 'Lives', value: '❤️'.repeat(Math.max(0, lives)), color: 'text-rose-600' },
          { label: isKo ? '점수' : 'Score', value: `${score}P`, color: 'text-amber-600 font-bold' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => setIsPaused(prev => !prev)}
        isPaused={isPaused}
      />

      {/* Duel Arena Center */}
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center relative overflow-hidden p-2 gap-3">
        {enemy && (
          <div className="flex flex-col items-center justify-center gap-2">
            <div className={cn('px-3 py-1 rounded-xs text-xs font-bold border flex items-center gap-1.5 shadow-xs', ELEMENT_BG[enemy.element])}>
              {enemy.element === 'water' && <Droplets size={14} />}
              {enemy.element === 'fire' && <Flame size={14} />}
              {enemy.element === 'wind' && <Wind size={14} />}
              {enemy.element === 'land' && <Mountain size={14} />}
              <span className="uppercase">{enemy.element}</span>
            </div>

            <div className="w-28 h-36 border border-[rgba(15,0,0,0.15)] bg-white rounded-sm overflow-hidden p-1 shadow-sm">
              <div
                style={getCardSpriteStyle(enemy.cardId)}
                className="w-full h-full bg-contain bg-center bg-no-repeat"
              />
            </div>

            {feedbackText && (
              <div
                className={cn(
                  'text-xs font-bold tracking-wider px-3 py-1 rounded-xs border',
                  feedbackType === 'correct'
                    ? 'text-emerald-700 bg-emerald-50 border-emerald-300'
                    : 'text-rose-700 bg-rose-50 border-rose-300'
                )}
              >
                {feedbackText}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Player Hand Cards */}
      <div className="shrink-0 w-full max-w-md mx-auto pb-4 px-3 select-none">
        <p className="text-[10px] text-[#6e6e73] text-center mb-1.5 font-mono">
          {isKo ? '상성 원소 카드를 탭하여 마법을 시전하세요' : 'Tap counter-element card to cast spell'}
        </p>
        <div className="grid grid-cols-5 gap-1.5">
          {playerCards.map((card, i) => {
            const el = getCardElement(card);
            return (
              <button
                key={i}
                type="button"
                onClick={() => handleCounterPick(card)}
                className="aspect-[3/4] rounded-sm border border-[rgba(15,0,0,0.15)] bg-white p-0.5 flex flex-col items-center justify-between transition-all active:scale-95 min-h-[44px] shadow-xs cursor-pointer"
              >
                <div
                  style={getCardSpriteStyle(card.imageIndex || card.id || 1)}
                  className="w-full flex-1 bg-contain bg-center bg-no-repeat"
                />
                <span className={cn('text-[9px] font-bold px-1 rounded-none border w-full text-center', ELEMENT_BG[el])}>
                  {el === 'water' ? '💧' : el === 'fire' ? '🔥' : el === 'wind' ? '💨' : '🏔️'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="2d_card_sorcery"
          gameTitle={isKo ? '2D 카드 소서리 마법결투' : '2D Card Sorcery Spell Duel'}
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
export default CardSorceryGame;
