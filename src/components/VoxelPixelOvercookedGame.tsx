import { drawCardSprite } from '../lib/canvasCardRenderer';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData, Language } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelPixelOvercookedGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface CookingOrder {
  id: number;
  name: string;
  targetDish: string;
  requiredIngredients: string[];
  currentIngredients: string[];
  points: number;
  isVip: boolean;
}

const DISH_RECIPES = [
  { name: '디럭스 버거', nameEn: 'Deluxe Burger', dish: '🍔', ingredients: ['🍞', '🥩', '🧀', '🥬'], points: 400 },
  { name: '수프림 피자', nameEn: 'Supreme Pizza', dish: '🍕', ingredients: ['🫓', '🧀', '🍅', '🍄'], points: 450 },
  { name: '특상 모둠초밥', nameEn: 'Master Sushi', dish: '🍣', ingredients: ['🍚', '🐟', '🦐', '🥢'], points: 500 },
  { name: '황금 라멘', nameEn: 'Golden Ramen', dish: '🍜', ingredients: ['🍲', '🥩', '🥚', '🥬'], points: 450 },
  { name: '스트로베리 케이크', nameEn: 'Berry Cake', dish: '🍰', ingredients: ['🧁', '🍓', '🍫', '🍒'], points: 550 },
];

export const VoxelPixelOvercookedGame: React.FC<VoxelPixelOvercookedGameProps> = ({
  deck = [],
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
  const playerHeroId = deck[0]?.id || 51;

  const [ordersServed, setOrdersServed] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [cookingCombo, setCookingCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(35);
  const [feedbackText, setFeedbackText] = useState<string | null>(null);

  const [currentOrder, setCurrentOrder] = useState<CookingOrder | null>(null);
  const [placedIngredients, setPlacedIngredients] = useState<string[]>([]);
  const [availableIngredients, setAvailableIngredients] = useState<string[]>([]);

  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_game_chef_tycoon') !== 'true';
    } catch {
      return true;
    }
  });
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const stateRef = useRef({
    ordersServed: 0,
    score: 0,
    combo: 0,
    maxCombo: 0,
    timeLeft: 35,
    isGameOver: false,
    isPaused: false,
    startTime: Date.now(),
    orderCounter: 1,
  });

  // Spawn New Order
  const generateNewOrder = useCallback((isVipOrder: boolean = false): CookingOrder => {
    const s = stateRef.current;
    const recipe = DISH_RECIPES[Math.floor(Math.random() * DISH_RECIPES.length)];

    // Shuffle 8 available ingredient pool
    const allIngredients = ['🍞', '🥩', '🧀', '🥬', '🫓', '🍅', '🍄', '🍚', '🐟', '🦐', '🥢', '🍲', '🥚', '🧁', '🍓', '🍫', '🍒'];
    const required = [...recipe.ingredients];
    const decoys = allIngredients.filter(i => !required.includes(i)).sort(() => Math.random() - 0.5).slice(0, 4);
    const pool = [...required, ...decoys].sort(() => Math.random() - 0.5);

    setAvailableIngredients(pool);

    return {
      id: s.orderCounter++,
      name: isKo ? recipe.name : recipe.nameEn,
      targetDish: recipe.dish,
      requiredIngredients: recipe.ingredients,
      currentIngredients: [],
      points: isVipOrder ? recipe.points * 2 : recipe.points,
      isVip: isVipOrder,
    };
  }, [isKo]);

  const initGame = useCallback(() => {
    const s = stateRef.current;
    s.ordersServed = 0;
    s.score = 0;
    s.combo = 0;
    s.maxCombo = 0;
    s.timeLeft = 35;
    s.isGameOver = false;
    s.startTime = Date.now();
    s.orderCounter = 1;

    setOrdersServed(0);
    setScore(0);
    setCookingCombo(0);
    setMaxCombo(0);
    setTimeLeft(35);
    setFeedbackText(null);
    setIsGameOver(false);
    setSettlementReceipt(null);
    setPlacedIngredients([]);

    const initialOrder = generateNewOrder(false);
    setCurrentOrder(initialOrder);
  }, [generateNewOrder]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  // Timer loop
  useEffect(() => {
    if (isGameOver || isPaused) return;

    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          endGame(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isGameOver, isPaused]);

  // Tap Ingredient to Add to Plate
  const handleTapIngredient = (ing: string) => {
    if (isGameOver || isPaused || !currentOrder) return;

    // Check if ingredient belongs to required recipe
    const neededIndex = currentOrder.requiredIngredients.indexOf(ing);
    if (neededIndex !== -1 && !placedIngredients.includes(ing)) {
      const nextPlaced = [...placedIngredients, ing];
      setPlacedIngredients(nextPlaced);

      playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');

      // Check if dish is complete
      if (nextPlaced.length === currentOrder.requiredIngredients.length) {
        // Complete & Serve!
        const s = stateRef.current;
        s.ordersServed += 1;
        s.combo += 1;
        if (s.combo > s.maxCombo) s.maxCombo = s.combo;

        const pts = currentOrder.points + s.combo * 50;
        s.score += pts;

        setOrdersServed(s.ordersServed);
        setScore(s.score);
        setCookingCombo(s.combo);
        setMaxCombo(s.maxCombo);

        setFeedbackText(`PERFECT DISH! ${currentOrder.targetDish} +${pts}P 🍽️✨`);
        playSfx?.('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
        setTimeout(() => setFeedbackText(null), 400);

        setPlacedIngredients([]);
        const nextVip = Math.random() < 0.25;
        setCurrentOrder(generateNewOrder(nextVip));
      }
    } else {
      // Wrong ingredient penalty
      const s = stateRef.current;
      s.combo = 0;
      setCookingCombo(0);

      setFeedbackText(isKo ? '잘못된 식재료! ❌' : 'WRONG INGREDIENT! ❌');
      playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
      setTimeout(() => setFeedbackText(null), 300);
    }
  };

  // Reset Plate (Trash button)
  const handleTrashPlate = () => {
    if (isGameOver || isPaused) return;
    setPlacedIngredients([]);
    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
  };

  const endGame = (isWin: boolean) => {
    const s = stateRef.current;
    if (s.isGameOver) return;
    s.isGameOver = true;
    setIsGameOver(true);

    if (isWin) {
      playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
    } else {
      playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
    }

    const duration = (Date.now() - s.startTime) / 1000;
    const receipt = calculateAndDepositMissionReward({
      gameId: 'arcade_chef_tycoon',
      gameTitle: '블리츠 셰프 타이쿤',
      durationSeconds: duration,
      score: s.score + (isWin ? 3500 : s.ordersServed * 400) + s.maxCombo * 50,
      difficulty: 'NIGHTMARE',
      isVictory: isWin || s.ordersServed >= 6,
    });
    setSettlementReceipt(receipt);
    onReward(receipt.totalSns);
  };

  const tutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 식재료 직접 탭 조리' : 'STEP 1: TAP INGREDIENTS TO COOK',
      title: isKo ? '주문서에 적힌 올바른 재료를 탭해 요리를 완성하세요' : 'Tap Matching Ingredients to Assemble Dishes',
      description: isKo
        ? '가상 조이스틱 없이 화면 상단의 주문서(🍔, 🍕, 🍣, 🍰, 🍜)를 확인하고 하단의 신선한 식재료들을 손가락으로 직접 탭하여 접시에 담아 주문을 완성하세요.'
        : 'Check the incoming recipe order and tap the correct ingredients on your mobile screen to assemble and serve delicious dishes.',
      keyPoints: isKo
        ? [
            '가상 조이스틱 0개 (100% 손가락 직접 식재료 탭)',
            'VIP 골든 오더(👑) 서빙 시 1,000P 대박 팁 보너스',
            '35초간 최대 콤보로 요리를 완성하고 올클리어'
          ]
        : [
            'Zero Virtual Joysticks: 100% Direct Tap Cooking',
            'VIP Golden Orders (👑) award 1,000P massive bonus tip',
            'Serve dishes with continuous combos within 35s'
          ],
      iconType: 'GOAL',
    },
    {
      badge: isKo ? 'STEP 2: 모바일 퓨어 제스처' : 'STEP 2: PURE GESTURES',
      title: isKo ? '식재료 직접 탭 & 접시 비우기 (Direct Tap)' : 'Direct Tap Gesture',
      description: isKo
        ? '필요한 식재료를 탭하여 접시에 담고, 잘못 담았을 때는 휴지통을 누릅니다.'
        : 'Tap required ingredients into plate, tap trash to clear.',
      keyPoints: isKo
        ? [
            '👆 재료 직접 탭: 즉각적인 접시 담기 및 조리',
            '🍳 연속 완벽 조리 시 셰프 콤보 배수 보너스',
            '⏱️ 35초 타임어택 고득점 챌린지'
          ]
        : [
            '👆 Tap Ingredients: Instant plate plating & assembly',
            '🍳 Consecutive perfect dishes grant escalating combo multipliers',
            '⏱️ 35s time attack master chef sprint'
          ],
      iconType: 'GESTURES',
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '영업 완료 즉시 NIGHTMARE 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Nightmare payout deposited atomically to your LocalStorage wallet upon match finish.',
      keyPoints: isKo
        ? [
            '완료 즉시 LocalStorage 영구 지갑 입금',
            '서빙 완료 요리 수 및 최대 콤보 비례 대량 잭팟',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Served dishes count and combo multipliers',
            'VictoryRewardModal golden coin fanfare'
          ],
      iconType: 'REWARDS',
    },
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-[#1e1b4b] text-white font-mono select-none flex flex-col overflow-hidden items-center justify-between touch-none">
      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '블리츠 셰프 타이쿤' : 'Blitz Chef Tycoon'}
        language={(language as Language) || 'ko'}
        telemetries={[
          { label: isKo ? '서빙' : 'Served', value: `${ordersServed}그릇`, color: 'text-amber-400 font-bold' },
          { label: isKo ? '콤보' : 'Combo', value: `${cookingCombo}x`, color: cookingCombo > 2 ? 'text-amber-300 font-bold animate-bounce' : 'text-slate-300' },
          { label: isKo ? '시간' : 'Time', value: `${timeLeft}s`, color: timeLeft <= 10 ? 'text-rose-500 font-bold animate-pulse' : 'text-cyan-400 font-bold' },
          { label: isKo ? '점수' : 'Score', value: `${score}P`, color: 'text-amber-300 font-bold' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => setIsPaused(prev => !prev)}
        isPaused={isPaused}
      />

      {/* Pure Touch Cooking Kitchen Viewport */}
      <div className="flex-1 w-full max-w-md relative overflow-hidden flex flex-col items-center justify-between p-3 select-none touch-none">
        {/* Floating Feedback Text */}
        {feedbackText && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 pointer-events-none text-base font-bold text-amber-300 drop-shadow-lg animate-bounce whitespace-nowrap bg-black/60 px-4 py-1.5 rounded-full border border-amber-400/30">
            {feedbackText}
          </div>
        )}

        {/* Current Order Ticket Header */}
        {currentOrder && (
          <div className={`w-full p-3 rounded-xl border ${currentOrder.isVip ? 'bg-amber-950/60 border-amber-400 shadow-amber-500/20' : 'bg-slate-900/80 border-slate-700'} shadow-lg flex flex-col items-center gap-2`}>
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <span className="text-3xl">{currentOrder.targetDish}</span>
                <div>
                  <div className="text-xs text-slate-400 font-bold flex items-center gap-1">
                    {currentOrder.isVip && <span className="text-amber-400">👑 VIP ORDER</span>}
                    <span>{currentOrder.name}</span>
                  </div>
                  <div className="text-sm font-bold text-amber-300">+{currentOrder.points}P</div>
                </div>
              </div>
              <button
                onClick={handleTrashPlate}
                className="px-2.5 py-1 bg-rose-950/80 border border-rose-600/40 rounded text-[11px] text-rose-300 hover:bg-rose-900 active:scale-95 transition-transform"
              >
                {isKo ? '접시 비우기 🗑️' : 'Clear 🗑️'}
              </button>
            </div>

            {/* Required Recipe List */}
            <div className="w-full flex items-center justify-center gap-2 py-1 bg-black/40 rounded-lg border border-white/5">
              <span className="text-[10px] text-slate-400 mr-1">{isKo ? '필요 재료:' : 'Need:'}</span>
              {currentOrder.requiredIngredients.map((ing, idx) => {
                const isAdded = placedIngredients.includes(ing);
                return (
                  <div
                    key={idx}
                    className={`w-9 h-9 rounded-lg flex items-center justify-center text-xl transition-all ${isAdded ? 'bg-emerald-600/60 border-2 border-emerald-400 scale-110 shadow-emerald-400/30 shadow-md' : 'bg-slate-800 border border-slate-600 opacity-60'}`}
                  >
                    {ing}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Master Cooking Plate (Center) */}
        <div className="w-48 h-48 my-auto rounded-full bg-gradient-to-b from-slate-200 to-slate-400 border-4 border-slate-600 shadow-2xl flex items-center justify-center relative">
          <div className="w-40 h-40 rounded-full bg-white/90 shadow-inner flex flex-wrap items-center justify-center p-3 gap-2">
            {placedIngredients.length === 0 ? (
              <span className="text-xs text-slate-400 font-bold">{isKo ? '식재료를 탭하세요' : 'Tap ingredients'}</span>
            ) : (
              placedIngredients.map((ing, idx) => (
                <span key={idx} className="text-3xl animate-bounce">
                  {ing}
                </span>
              ))
            )}
          </div>
        </div>

        {/* Ingredient Storage Pantry (8 Tappable Ingredient Slots) */}
        <div className="w-full grid grid-cols-4 gap-2.5 bg-slate-900/90 border border-white/10 p-3 rounded-2xl shadow-xl">
          {availableIngredients.map((ing, idx) => (
            <button
              key={idx}
              onClick={() => handleTapIngredient(ing)}
              className="h-14 bg-slate-800/90 hover:bg-slate-700 active:scale-90 border border-slate-600 rounded-xl flex items-center justify-center text-3xl shadow-md transition-transform"
            >
              {ing}
            </button>
          ))}
        </div>
      </div>

      {/* Minimal Bottom Guide */}
      <div className="w-full pb-3 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1 bg-black/50 border border-white/10 rounded-full text-[10px] text-slate-300 font-mono">
          {isKo ? '주문서에 필요한 재료를 손가락으로 탭하여 접시에 담으세요' : 'Tap matching ingredients to assemble order on the plate'}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="arcade_chef_tycoon"
          gameTitle={isKo ? '블리츠 셰프: 타이쿤 아케이드' : 'Blitz Chef: Tycoon Arcade'}
          customSteps={tutorialSteps}
          language={(language as Language) || 'ko'}
          onStartGame={() => setShowTutorial(false)}
          onClose={() => setShowTutorial(false)}
        />
      )}

      {/* Victory Reward Settlement Modal */}
      {isGameOver && settlementReceipt && (
        <VictoryRewardModal
          receipt={settlementReceipt}
          language={(language as Language) || 'ko'}
          onPlayAgain={initGame}
          onExit={onExit}
        />
      )}
    </div>
  );
};
export default VoxelPixelOvercookedGame;
