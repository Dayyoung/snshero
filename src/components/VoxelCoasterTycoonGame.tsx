import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData, Language } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';
import { getCardSpriteStyle } from '../lib/utils';

interface VoxelCoasterTycoonGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface CustomerOrder {
  id: number;
  customerCardId: number;
  item: string; // '☕' | '🍩' | '🥞' | '🍦' | '🍰'
  itemCardId: number;
  name: string;
  patience: number; // 0 ~ 100
  maxPatience: number;
}

const MENU_ITEMS = [
  { icon: '☕', cardId: 7, name: '아메리카노', enName: 'Americano', color: '#78350f' },
  { icon: '🍩', cardId: 18, name: '도넛', enName: 'Donut', color: '#db2777' },
  { icon: '🥞', cardId: 24, name: '팬케이크', enName: 'Pancake', color: '#d97706' },
  { icon: '🍦', cardId: 12, name: '아이스크림', enName: 'Ice Cream', color: '#0284c7' },
  { icon: '🍰', cardId: 57, name: '케이크', enName: 'Cake', color: '#e11d48' },
];

export const VoxelCoasterTycoonGame: React.FC<VoxelCoasterTycoonGameProps> = ({
  deck = [],
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
  const playerHeroId = deck[0]?.id || 77;

  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [score, setScore] = useState<number>(0);
  const [servedCount, setServedCount] = useState<number>(0);
  const [combo, setCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(35);
  const [feedbackText, setFeedbackText] = useState<string | null>(null);

  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_game_cafe_tycoon') !== 'true';
    } catch {
      return true;
    }
  });
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const stateRef = useRef({
    orders: [] as CustomerOrder[],
    score: 0,
    servedCount: 0,
    combo: 0,
    maxCombo: 0,
    timeLeft: 35,
    isGameOver: false,
    isPaused: false,
    startTime: Date.now(),
    orderCounter: 1,
    spawnTimer: 0,
  });

  const initGame = useCallback(() => {
    const s = stateRef.current;
    s.orders = [];
    s.score = 0;
    s.servedCount = 0;
    s.combo = 0;
    s.maxCombo = 0;
    s.timeLeft = 35;
    s.isGameOver = false;
    s.startTime = Date.now();
    s.orderCounter = 1;
    s.spawnTimer = 0;

    // Initial 3 customers
    const initialOrders: CustomerOrder[] = [];
    const customerPool = [3, 8, 15, 22, 33, 44, 55, 66];
    for (let i = 0; i < 3; i++) {
      const item = MENU_ITEMS[Math.floor(Math.random() * MENU_ITEMS.length)];
      const cCardId = customerPool[Math.floor(Math.random() * customerPool.length)];
      initialOrders.push({
        id: s.orderCounter++,
        customerCardId: cCardId,
        item: item.icon,
        itemCardId: item.cardId,
        name: isKo ? item.name : item.enName,
        patience: 100,
        maxPatience: 100,
      });
    }

    s.orders = initialOrders;
    setOrders(initialOrders);
    setScore(0);
    setServedCount(0);
    setCombo(0);
    setMaxCombo(0);
    setTimeLeft(35);
    setFeedbackText(null);
    setIsGameOver(false);
    setSettlementReceipt(null);
  }, [isKo]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  // Main 60FPS Game Loop for Patience & Spawning
  useEffect(() => {
    if (isGameOver || isPaused) return;

    const interval = setInterval(() => {
      const s = stateRef.current;
      if (s.isPaused || s.isGameOver) return;

      // Spawn new customer if slots available (max 4)
      s.spawnTimer += 0.1;
      if (s.spawnTimer >= 1.2 && s.orders.length < 4) {
        s.spawnTimer = 0;
        const item = MENU_ITEMS[Math.floor(Math.random() * MENU_ITEMS.length)];
        const customerPool = [3, 8, 15, 22, 33, 44, 55, 66];
        const cCardId = customerPool[Math.floor(Math.random() * customerPool.length)];
        s.orders.push({
          id: s.orderCounter++,
          customerCardId: cCardId,
          item: item.icon,
          itemCardId: item.cardId,
          name: isKo ? item.name : item.enName,
          patience: 100,
          maxPatience: 100,
        });
      }

      // Decay patience
      for (let i = s.orders.length - 1; i >= 0; i--) {
        const o = s.orders[i];
        o.patience -= 3.2;

        // Customer leaves unhappy
        if (o.patience <= 0) {
          s.orders.splice(i, 1);
          s.combo = 0;
          setCombo(0);
          playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
        }
      }

      setOrders([...s.orders]);
    }, 100);

    return () => clearInterval(interval);
  }, [isGameOver, isPaused, isKo, playSfx]);

  // Timer loop
  useEffect(() => {
    if (isGameOver || isPaused) return;

    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          endGame();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isGameOver, isPaused]);

  // Serve Menu Item Touch Handler (Zero Joysticks - Direct 1-Tap Serve)
  const handleServeItem = (itemIcon: string) => {
    const s = stateRef.current;
    if (s.isGameOver || s.isPaused) return;

    // Find the first customer waiting for this item
    const matchIdx = s.orders.findIndex((o) => o.item === itemIcon);

    if (matchIdx !== -1) {
      // Order Served Successfully!
      const matched = s.orders[matchIdx];
      const isFast = matched.patience >= 60;
      const points = 100 + (isFast ? 80 : 20) + s.combo * 40;

      s.orders.splice(matchIdx, 1);
      s.servedCount += 1;
      s.score += points;
      s.combo += 1;
      if (s.combo > s.maxCombo) s.maxCombo = s.combo;

      setOrders([...s.orders]);
      setServedCount(s.servedCount);
      setScore(s.score);
      setCombo(s.combo);
      setMaxCombo(s.maxCombo);

      setFeedbackText(isFast ? `PERFECT SERVE! +${points}P ✨` : `SERVED! +${points}P ☕`);
      setTimeout(() => setFeedbackText(null), 500);
      playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
    } else {
      // Wrong item served
      playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
      s.combo = 0;
      setCombo(0);
    }
  };

  const endGame = () => {
    const s = stateRef.current;
    if (s.isGameOver) return;
    s.isGameOver = true;
    setIsGameOver(true);
    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');

    const duration = (Date.now() - s.startTime) / 1000;
    const receipt = calculateAndDepositMissionReward({
      gameId: 'arcade_cafe_tycoon',
      gameTitle: '블리츠 카페 타이쿤',
      durationSeconds: duration,
      score: s.score + s.servedCount * 100 + s.maxCombo * 60,
      difficulty: 'NIGHTMARE',
      isVictory: s.servedCount >= 12,
    });
    setSettlementReceipt(receipt);
    onReward(receipt.totalSns);
  };

  const tutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 손님 주문 서빙' : 'STEP 1: SERVE ORDERS',
      title: isKo ? '주문 말풍선에 맞는 메뉴를 탭하세요' : 'Tap Matching Menu to Serve',
      description: isKo
        ? '가상 조이스틱 없이 몰려오는 손님들의 주문 메뉴(☕🍩🥞🍦🍰)를 확인하고 하단 메뉴 버튼을 탭하여 즉시 서빙하세요.'
        : 'Check customer order bubbles and tap the matching menu items below to serve them.',
      keyPoints: isKo
        ? [
            '가상 조이스틱 0개 (100% 화면 직접 원터치 서빙)',
            '손님의 인내심 게이지가 높을 때 서빙 시 퍼펙트 보너스',
            '연속 서빙 성공 시 콤보 배수 보너스 가산'
          ]
        : [
            'Zero Virtual Joysticks: 100% Direct Tap Serve',
            'Serve while patience is high for Perfect bonuses',
            'Chain consecutive fast serves for massive combo multipliers'
          ],
      iconType: 'GOAL',
    },
    {
      badge: isKo ? 'STEP 2: 모바일 퓨어 제스처' : 'STEP 2: PURE GESTURES',
      title: isKo ? '하단 메뉴 직접 탭 (Direct Menu Tap)' : 'Direct Screen Menu Tap',
      description: isKo
        ? '주문이 들어온 디저트/음료 아이콘을 손가락으로 가볍게 탭합니다.'
        : 'Simply tap the corresponding dessert or beverage button.',
      keyPoints: isKo
        ? [
            '👆 원터치 서빙: 즉각적인 서빙 및 매출 점수 획득',
            '⏳ 인내심 바가 바닥나기 전에 서빙 완료',
            '⚡ 35초 타임어택 고득점 챌린지'
          ]
        : [
            '👆 One-touch Serve: Instant order dispatch & revenue',
            '⏳ Serve before customer patience runs out',
            '⚡ 35s time attack high-score sprint'
          ],
      iconType: 'GESTURES',
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '영업 마감 즉시 NIGHTMARE 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Nightmare payout deposited atomically to your LocalStorage wallet upon match finish.',
      keyPoints: isKo
        ? [
            '완료 즉시 LocalStorage 영구 지갑 입금',
            '서빙 완료 수 및 맥스 콤보 비례 대량 잭팟',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Served count and max combo multipliers',
            'VictoryRewardModal golden coin fanfare'
          ],
      iconType: 'REWARDS',
    },
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-[#1a0f0a] text-white font-mono select-none flex flex-col overflow-hidden items-center justify-between touch-none">
      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '블리츠 카페 타이쿤' : 'Blitz Cafe Tycoon'}
        language={(language as Language) || 'ko'}
        telemetries={[
          { label: isKo ? '서빙' : 'Served', value: `${servedCount}잔`, color: 'text-amber-400 font-bold' },
          { label: isKo ? '시간' : 'Time', value: `${timeLeft}s`, color: timeLeft <= 10 ? 'text-rose-500 font-bold animate-pulse' : 'text-cyan-400 font-bold' },
          { label: isKo ? '콤보' : 'Combo', value: `${combo}x`, color: combo > 3 ? 'text-emerald-400 font-bold animate-bounce' : 'text-slate-300' },
          { label: isKo ? '매출' : 'Score', value: `${score}P`, color: 'text-amber-300 font-bold' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => setIsPaused(prev => !prev)}
        isPaused={isPaused}
      />

      {/* Customer Counter Viewport */}
      <div className="flex-1 w-full max-w-sm relative overflow-hidden flex flex-col items-center justify-center p-3 gap-3">
        {/* Cafe Counter Background */}
        <div className="w-full h-64 bg-[#2b1810] border-2 border-amber-900/60 rounded-none shadow-2xl p-3 flex flex-col justify-between relative overflow-hidden">
          {/* Waiting Customers Row */}
          <div className="grid grid-cols-4 gap-2 h-44">
            {orders.map((order) => (
              <div
                key={order.id}
                className="flex flex-col items-center justify-between bg-black/40 border border-amber-500/30 p-1.5 rounded-sm relative"
              >
                {/* Customer Card Avatar */}
                <div
                  className="w-10 h-10 rounded-full border border-amber-400/40 shadow-xs"
                  style={getCardSpriteStyle(order.customerCardId)}
                />

                {/* Ordered Item Badge */}
                <div className="flex items-center gap-1 bg-black/60 px-1.5 py-0.5 rounded border border-white/10">
                  <div className="w-4 h-4 rounded-full" style={getCardSpriteStyle(order.itemCardId)} />
                  <span className="text-[9px] text-amber-200 truncate">{order.name}</span>
                </div>

                {/* Patience Bar */}
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full transition-all duration-100"
                    style={{
                      width: `${order.patience}%`,
                      backgroundColor:
                        order.patience > 50 ? '#22c55e' : order.patience > 25 ? '#f59e0b' : '#ef4444',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Barista Counter Line */}
          <div className="w-full border-t border-amber-800/80 pt-2 flex items-center justify-between text-xs text-amber-300/80 font-mono">
            <div className="flex items-center gap-1.5">
              <div
                className="w-5 h-5 rounded-full border border-cyan-400"
                style={getCardSpriteStyle(playerHeroId)}
              />
              <span>BARISTA COUNTER</span>
            </div>
            <span>WAITING: {orders.length}/4</span>
          </div>

          {/* Floating Feedback Text */}
          {feedbackText && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none text-base font-bold text-amber-300 drop-shadow-lg animate-bounce whitespace-nowrap">
              {feedbackText}
            </div>
          )}
        </div>

        {/* Serving Menu Buttons (Touch Pad) */}
        <div className="grid grid-cols-5 gap-2 w-full">
          {MENU_ITEMS.map((item) => (
            <button
              key={item.icon}
              onClick={() => handleServeItem(item.icon)}
              className="flex flex-col items-center justify-center p-2 bg-amber-950/80 border border-amber-500/40 rounded-sm active:scale-90 transition-transform shadow-lg gap-1"
            >
              <div
                className="w-8 h-8 rounded-full border border-white/20 shadow-xs"
                style={getCardSpriteStyle(item.cardId)}
              />
              <span className="text-[9px] text-amber-200 truncate w-full text-center">
                {isKo ? item.name : item.enName}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Minimal Bottom Guide */}
      <div className="w-full pb-3 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1 bg-black/50 border border-white/10 rounded-full text-[10px] text-slate-300 font-mono">
          {isKo ? '손님의 주문을 보고 하단 메뉴를 탭하여 서빙하세요' : 'Check customer orders and tap menu items below'}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="arcade_cafe_tycoon"
          gameTitle={isKo ? '블리츠 카페 타이쿤: 서빙 아케이드' : 'Blitz Cafe Tycoon: Serving Arcade'}
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
export default VoxelCoasterTycoonGame;
