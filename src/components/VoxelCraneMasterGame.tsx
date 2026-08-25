import { drawCardSprite } from '../lib/canvasCardRenderer';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData, Language } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelCraneMasterGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

type BoxDirection = 'LEFT' | 'RIGHT' | 'UP' | 'DOWN';

interface ParcelBox {
  id: number;
  direction: BoxDirection;
  color: string;
  label: string;
  enLabel: string;
  icon: string;
}

const BOX_TYPES: { direction: BoxDirection; color: string; label: string; enLabel: string; icon: string }[] = [
  { direction: 'LEFT', color: '#ef4444', label: '서부 물류', enLabel: 'West Depot', icon: '🔴' },
  { direction: 'RIGHT', color: '#3b82f6', label: '동부 물류', enLabel: 'East Depot', icon: '🔵' },
  { direction: 'UP', color: '#10b981', label: '북부 특송', enLabel: 'North Air', icon: '🟢' },
  { direction: 'DOWN', color: '#f59e0b', label: '남부 해운', enLabel: 'South Port', icon: '🟡' },
];

export const VoxelCraneMasterGame: React.FC<VoxelCraneMasterGameProps> = ({
  deck = [],
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
  const playerHeroId = deck[0]?.id || 73;

  const [currentBox, setCurrentBox] = useState<ParcelBox | null>(null);
  const [nextBox, setNextBox] = useState<ParcelBox | null>(null);
  const [sortedCount, setSortedCount] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [combo, setCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(35);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [swipeAnim, setSwipeAnim] = useState<BoxDirection | null>(null);

  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_game_express_sort') !== 'true';
    } catch {
      return true;
    }
  });
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const stateRef = useRef({
    currentBox: null as ParcelBox | null,
    nextBox: null as ParcelBox | null,
    sortedCount: 0,
    score: 0,
    combo: 0,
    maxCombo: 0,
    timeLeft: 35,
    isGameOver: false,
    isPaused: false,
    startTime: Date.now(),
    boxCounter: 1,
    touchStart: { x: 0, y: 0 },
  });

  const getRandomBox = useCallback((): ParcelBox => {
    const type = BOX_TYPES[Math.floor(Math.random() * BOX_TYPES.length)];
    return {
      id: stateRef.current.boxCounter++,
      direction: type.direction,
      color: type.color,
      label: type.label,
      enLabel: type.enLabel,
      icon: type.icon,
    };
  }, []);

  const initGame = useCallback(() => {
    const s = stateRef.current;
    s.sortedCount = 0;
    s.score = 0;
    s.combo = 0;
    s.maxCombo = 0;
    s.timeLeft = 35;
    s.isGameOver = false;
    s.startTime = Date.now();
    s.boxCounter = 1;

    const b1 = getRandomBox();
    const b2 = getRandomBox();
    s.currentBox = b1;
    s.nextBox = b2;

    setCurrentBox(b1);
    setNextBox(b2);
    setSortedCount(0);
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setTimeLeft(35);
    setFeedbackMsg(null);
    setSwipeAnim(null);
    setIsGameOver(false);
    setSettlementReceipt(null);
  }, [getRandomBox]);

  useEffect(() => {
    initGame();
  }, [initGame]);

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

  // Process Sorting Direction Action
  const handleSortDirection = useCallback((dir: BoxDirection) => {
    const s = stateRef.current;
    if (s.isGameOver || s.isPaused || !s.currentBox) return;

    const isCorrect = s.currentBox.direction === dir;

    if (isCorrect) {
      // Correct Swipe!
      setSwipeAnim(dir);
      s.sortedCount += 1;
      s.combo += 1;
      if (s.combo > s.maxCombo) s.maxCombo = s.combo;

      const points = 100 + s.combo * 30;
      s.score += points;

      setSortedCount(s.sortedCount);
      setCombo(s.combo);
      setMaxCombo(s.maxCombo);
      setScore(s.score);
      setFeedbackMsg(`EXPRESS! +${points}P ⚡`);
      setTimeout(() => setFeedbackMsg(null), 400);

      playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');

      // Next box advance
      s.currentBox = s.nextBox;
      s.nextBox = getRandomBox();
      setCurrentBox(s.currentBox);
      setNextBox(s.nextBox);
    } else {
      // Wrong Swipe
      s.combo = 0;
      setCombo(0);
      setFeedbackMsg(isKo ? '오배송! 콤보 리셋' : 'MISMATCH! Reset');
      setTimeout(() => setFeedbackMsg(null), 400);
      playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
    }

    setTimeout(() => setSwipeAnim(null), 150);
  }, [getRandomBox, isKo, playSfx]);

  // Touch / Pointer Swipe Gesture Handlers (Zero Joysticks)
  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    stateRef.current.touchStart = { x: clientX, y: clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent | React.MouseEvent) => {
    const clientX = 'changedTouches' in e ? e.changedTouches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'changedTouches' in e ? e.changedTouches[0].clientY : (e as React.MouseEvent).clientY;

    const dx = clientX - stateRef.current.touchStart.x;
    const dy = clientY - stateRef.current.touchStart.y;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (Math.max(absDx, absDy) < 25) return; // Ignore small taps

    if (absDx > absDy) {
      // Horizontal swipe
      handleSortDirection(dx > 0 ? 'RIGHT' : 'LEFT');
    } else {
      // Vertical swipe
      handleSortDirection(dy > 0 ? 'DOWN' : 'UP');
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
      gameId: 'arcade_express_sort',
      gameTitle: '블리츠 택배 분류 타이쿤',
      durationSeconds: duration,
      score: s.score + s.sortedCount * 80 + s.maxCombo * 50,
      difficulty: 'NIGHTMARE',
      isVictory: s.sortedCount >= 20,
    });
    setSettlementReceipt(receipt);
    onReward(receipt.totalSns);
  };

  const tutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 택배 상자 스와이프' : 'STEP 1: SWIPE PARCELS',
      title: isKo ? '상자 색상에 맞는 방향으로 스와이프하세요' : 'Swipe Matching Colored Parcels',
      description: isKo
        ? '가상 조이스틱 없이 중앙 택배 상자의 색상과 라벨을 보고 해당 방향(⬅️서부, ➡️동부, ⬆️북부, ⬇️남부)으로 손가락을 슥 스와이프하세요.'
        : 'Swipe incoming parcels toward the matching destination direction (Left, Right, Up, Down).',
      keyPoints: isKo
        ? [
            '가상 조이스틱 0개 (100% 손가락 직접 4방향 스와이프)',
            '🔴좌측 서부 / 🔵우측 동부 / 🟢상단 북부 / 🟡하단 남부',
            '연속 올바른 분류 시 콤보 배수 보너스 가산'
          ]
        : [
            'Zero Virtual Joysticks: 100% 4-Way Direct Swipe',
            '🔴Left: West / 🔵Right: East / 🟢Up: North / 🟡Down: South',
            'Chain accurate swipes for massive combo multipliers'
          ],
      iconType: 'GOAL',
    },
    {
      badge: isKo ? 'STEP 2: 모바일 퓨어 제스처' : 'STEP 2: PURE GESTURES',
      title: isKo ? '화면 직접 스와이프 (Finger Swipe)' : 'Direct Screen Swipe',
      description: isKo
        ? '화면 중앙 상자를 손가락으로 4방향으로 빠르게 휙 밀어냅니다.'
        : 'Flick the central box in the matching direction with your finger.',
      keyPoints: isKo
        ? [
            '👆 손가락 스와이프: 실시간 초고속 분류 애니메이션',
            '📦 대기 중인 다음 택배 미리보기 제공',
            '⚡ 35초 타임어택 고득점 챌린지'
          ]
        : [
            '👆 Touch Swipe: Ultra-fast responsive sorting animation',
            '📦 Preview next incoming parcel for advance planning',
            '⚡ 35s time attack high-score sprint'
          ],
      iconType: 'GESTURES',
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '물류 마감 즉시 NIGHTMARE 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Nightmare payout deposited atomically to your LocalStorage wallet upon match finish.',
      keyPoints: isKo
        ? [
            '완료 즉시 LocalStorage 영구 지갑 입금',
            '분류 상자 수 및 맥스 콤보 비례 대량 잭팟',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Sorted count and max combo multipliers',
            'VictoryRewardModal golden coin fanfare'
          ],
      iconType: 'REWARDS',
    },
  ];

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseUp={handleTouchEnd}
      className="relative w-full h-[100dvh] bg-[#0c121e] text-white font-mono select-none flex flex-col overflow-hidden items-center justify-between touch-none"
    >
      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <div onClick={(e) => e.stopPropagation()} className="w-full">
        <MinimalistMissionHUD
          title={isKo ? '블리츠 택배 분류 타이쿤' : 'Blitz Express Sort'}
          language={(language as Language) || 'ko'}
          telemetries={[
            { label: isKo ? '분류' : 'Sorted', value: `${sortedCount}개`, color: 'text-amber-400 font-bold' },
            { label: isKo ? '시간' : 'Time', value: `${timeLeft}s`, color: timeLeft <= 10 ? 'text-rose-500 font-bold animate-pulse' : 'text-cyan-400 font-bold' },
            { label: isKo ? '콤보' : 'Combo', value: `${combo}x`, color: combo > 3 ? 'text-emerald-400 font-bold animate-bounce' : 'text-slate-300' },
            { label: isKo ? '점수' : 'Score', value: `${score}P`, color: 'text-cyan-300 font-bold' }
          ]}
          onExit={onExit}
          onHelp={() => setShowTutorial(true)}
          onPauseToggle={() => setIsPaused(prev => !prev)}
          isPaused={isPaused}
        />
      </div>

      {/* 4-Way Sorting Depot Viewport */}
      <div className="flex-1 w-full max-w-sm relative overflow-hidden flex items-center justify-center p-3">
        {/* Destination Depot Indicators */}
        {/* Top: North */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-emerald-950/80 border border-emerald-500/40 rounded-sm text-xs text-emerald-300 flex items-center gap-1 font-bold">
          ⬆️ 🟢 {isKo ? '북부 특송' : 'North Air'}
        </div>
        {/* Bottom: South */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-amber-950/80 border border-amber-500/40 rounded-sm text-xs text-amber-300 flex items-center gap-1 font-bold">
          ⬇️ 🟡 {isKo ? '남부 해운' : 'South Port'}
        </div>
        {/* Left: West */}
        <div className="absolute left-2 top-1/2 -translate-y-1/2 px-2 py-3 bg-rose-950/80 border border-rose-500/40 rounded-sm text-xs text-rose-300 flex flex-col items-center gap-1 font-bold writing-mode-vertical">
          <span>⬅️</span>
          <span>🔴</span>
          <span>{isKo ? '서부' : 'West'}</span>
        </div>
        {/* Right: East */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-3 bg-blue-950/80 border border-blue-500/40 rounded-sm text-xs text-blue-300 flex flex-col items-center gap-1 font-bold writing-mode-vertical">
          <span>➡️</span>
          <span>🔵</span>
          <span>{isKo ? '동부' : 'East'}</span>
        </div>

        {/* Central Conveyor Box */}
        {currentBox && (
          <div
            className={`w-44 h-44 rounded-none flex flex-col items-center justify-center p-4 border-2 shadow-2xl transition-all duration-150 relative ${
              swipeAnim === 'LEFT'
                ? '-translate-x-32 opacity-0'
                : swipeAnim === 'RIGHT'
                ? 'translate-x-32 opacity-0'
                : swipeAnim === 'UP'
                ? '-translate-y-32 opacity-0'
                : swipeAnim === 'DOWN'
                ? 'translate-y-32 opacity-0'
                : 'translate-x-0 translate-y-0 opacity-100 scale-100'
            }`}
            style={{
              backgroundColor: `${currentBox.color}22`,
              borderColor: currentBox.color,
            }}
          >
            <span className="text-4xl mb-2 animate-pulse">{currentBox.icon}</span>
            <span className="text-sm font-bold text-center" style={{ color: currentBox.color }}>
              {isKo ? currentBox.label : currentBox.enLabel}
            </span>
            <span className="text-[10px] text-slate-400 mt-1">
              {currentBox.direction === 'LEFT'
                ? '⬅️ SWIPE LEFT'
                : currentBox.direction === 'RIGHT'
                ? '➡️ SWIPE RIGHT'
                : currentBox.direction === 'UP'
                ? '⬆️ SWIPE UP'
                : '⬇️ SWIPE DOWN'}
            </span>
          </div>
        )}

        {/* Floating Feedback Text */}
        {feedbackMsg && (
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 pointer-events-none text-base font-bold text-amber-300 drop-shadow-lg animate-bounce whitespace-nowrap">
            {feedbackMsg}
          </div>
        )}

        {/* Next Box Preview Badge */}
        {nextBox && (
          <div className="absolute top-12 right-4 flex items-center gap-1 bg-black/60 border border-white/10 px-2 py-1 rounded-sm text-[10px] text-slate-400">
            <span>NEXT:</span>
            <span>{nextBox.icon}</span>
          </div>
        )}
      </div>

      {/* Minimal Bottom Guide */}
      <div className="w-full pb-3 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1 bg-black/50 border border-white/10 rounded-full text-[10px] text-slate-300 font-mono">
          {isKo ? '상자를 해당 목적지 방향(상/하/좌/우)으로 스와이프하세요' : 'Swipe parcel toward matching direction (Up/Down/Left/Right)'}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <div onClick={(e) => e.stopPropagation()}>
          <UniversalTutorialModal
            gameId="arcade_express_sort"
            gameTitle={isKo ? '블리츠 택배 분류: 스피드 정렬' : 'Blitz Express Sort: Speed Sorting'}
            customSteps={tutorialSteps}
            language={(language as Language) || 'ko'}
            onStartGame={() => setShowTutorial(false)}
            onClose={() => setShowTutorial(false)}
          />
        </div>
      )}

      {/* Victory Reward Settlement Modal */}
      {isGameOver && settlementReceipt && (
        <div onClick={(e) => e.stopPropagation()}>
          <VictoryRewardModal
            receipt={settlementReceipt}
            language={(language as Language) || 'ko'}
            onPlayAgain={initGame}
            onExit={onExit}
          />
        </div>
      )}
    </div>
  );
};
export default VoxelCraneMasterGame;
