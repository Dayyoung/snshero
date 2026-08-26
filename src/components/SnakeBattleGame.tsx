import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData, Language } from '../types';
import { cn, getCardSpriteStyle } from '../lib/utils';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface SnakeBattleGameProps {
  deck: CardData[];
  language: Language;
  playerName?: string;
  lowSpecMode?: boolean;
  playSfx: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

type Direction = 'up' | 'down' | 'left' | 'right';

interface Point {
  x: number;
  y: number;
}

interface SnakeSegment extends Point {
  cardId: number;
}

const BOARD_SIZE = 16;

const wrap = (val: number) => {
  if (val < 0) return BOARD_SIZE - 1;
  if (val >= BOARD_SIZE) return 0;
  return val;
};

export const SnakeBattleGame: React.FC<SnakeBattleGameProps> = ({
  deck = [],
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
  const playerHeroId = deck[0]?.id || 6;
  const [snake, setSnake] = useState<SnakeSegment[]>([]);
  const [food, setFood] = useState<Point>({ x: 5, y: 5 });
  const [foodCardId, setFoodCardId] = useState<number>(10);
  const [direction, setDirection] = useState<Direction>('right');
  const [score, setScore] = useState(0);
  const [length, setLength] = useState(3);
  const [isPaused, setIsPaused] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_game_arcade_snake') !== 'true';
    } catch {
      return true;
    }
  });
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const startTimeRef = useRef(Date.now());
  const dirRef = useRef<Direction>('right');
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const initGame = useCallback(() => {
    const playerCardId = deck[0]?.imageIndex || (deck[0]?.id as number) || 6;
    const initialSnake: SnakeSegment[] = [
      { x: 8, y: 8, cardId: playerCardId },
      { x: 7, y: 8, cardId: playerCardId },
      { x: 6, y: 8, cardId: playerCardId },
    ];
    setSnake(initialSnake);
    setFood({ x: 4, y: 4 });
    setFoodCardId(Math.floor(Math.random() * 80) + 1);
    setDirection('right');
    dirRef.current = 'right';
    setScore(0);
    setLength(3);
    setIsGameOver(false);
    setSettlementReceipt(null);
    startTimeRef.current = Date.now();
  }, [deck]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const changeDirection = (newDir: Direction) => {
    const cur = dirRef.current;
    if (
      (newDir === 'up' && cur === 'down') ||
      (newDir === 'down' && cur === 'up') ||
      (newDir === 'left' && cur === 'right') ||
      (newDir === 'right' && cur === 'left')
    ) {
      return;
    }
    dirRef.current = newDir;
    setDirection(newDir);
    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
  };

  // Keyboard support for desktop
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'ArrowUp' || e.code === 'KeyW') changeDirection('up');
      else if (e.code === 'ArrowDown' || e.code === 'KeyS') changeDirection('down');
      else if (e.code === 'ArrowLeft' || e.code === 'KeyA') changeDirection('left');
      else if (e.code === 'ArrowRight' || e.code === 'KeyD') changeDirection('right');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Game Loop
  useEffect(() => {
    if (isGameOver || isPaused) return;

    const interval = setInterval(() => {
      setSnake(prev => {
        if (prev.length === 0) return prev;

        const head = prev[0];
        let nx = head.x;
        let ny = head.y;
        const d = dirRef.current;

        if (d === 'up') ny = wrap(ny - 1);
        if (d === 'down') ny = wrap(ny + 1);
        if (d === 'left') nx = wrap(nx - 1);
        if (d === 'right') nx = wrap(nx + 1);

        // Self collision check
        for (let i = 1; i < prev.length; i++) {
          if (prev[i].x === nx && prev[i].y === ny) {
            setIsGameOver(true);
            playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
            const duration = (Date.now() - startTimeRef.current) / 1000;
            const receipt = calculateAndDepositMissionReward({
              gameId: 'arcade_snake',
              gameTitle: '클래식 스네이크 배틀',
              durationSeconds: duration,
              score: prev.length * 200,
              difficulty: 'HARD',
              isVictory: false
            });
            setSettlementReceipt(receipt);
            onReward(receipt.totalSns);
            return prev;
          }
        }

        const newHead: SnakeSegment = { x: nx, y: ny, cardId: head.cardId };
        const newSnake = [newHead, ...prev];

        // Eat food (Card Monster Object)
        if (nx === food.x && ny === food.y) {
          setScore(s => s + 100);
          setLength(l => l + 1);
          playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');

          // Respawn food with new card monster ID
          let rx = Math.floor(Math.random() * BOARD_SIZE);
          let ry = Math.floor(Math.random() * BOARD_SIZE);
          setFood({ x: rx, y: ry });
          setFoodCardId(Math.floor(Math.random() * 80) + 1);

          if (newSnake.length >= 25) {
            setIsGameOver(true);
            const duration = (Date.now() - startTimeRef.current) / 1000;
            const receipt = calculateAndDepositMissionReward({
              gameId: 'arcade_snake',
              gameTitle: '클래식 스네이크 배틀',
              durationSeconds: duration,
              score: 5000,
              difficulty: 'HARD',
              isVictory: true
            });
            setSettlementReceipt(receipt);
            onReward(receipt.totalSns);
          }
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    }, 120);

    return () => clearInterval(interval);
  }, [food, isGameOver, isPaused, onReward, playSfx]);

  const tutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 25개 카드 몬스터 포식' : 'STEP 1: DEVOUR 25 CARDS',
      title: isKo ? '카드 몬스터 포식 & 무한 성장' : 'Devour Card Objects & Grow',
      description: isKo
        ? '화면에 출몰하는 카드 몬스터 오브젝트를 포식하여 영웅 지렁이의 길이를 25마디 이상으로 늘리세요.'
        : 'Devour spawning monster card objects to grow your hero snake up to 25 segments.',
      keyPoints: isKo
        ? [
            '25마디 도달 시 완승 잭팟 보상',
            '벽을 통과하여 반대편으로 루프 이동',
            '자신의 몸통과 충돌 시 게임 오버'
          ]
        : [
            'Reach 25 length to win jackpot',
            'Pass through walls to loop around',
            'Colliding with self causes game over'
          ],
      iconType: 'GOAL'
    },
    {
      badge: isKo ? 'STEP 2: 100% 퓨어 스와이프 제스처' : 'STEP 2: PURE SWIPE GESTURES',
      title: isKo ? '화면 어디든 상하좌우 스와이프' : 'Swipe Screen Anywhere to Turn',
      description: isKo
        ? '가상 버튼 없이 화면 아무 곳이나 상하좌우로 스와이프하여 즉각 방향을 전환합니다.'
        : 'Swipe in 4 directions anywhere on screen to turn with zero buttons.',
      keyPoints: isKo
        ? [
            '👆 스와이프: 상/하/좌/우 즉각 조향',
            '🚫 가상 키보드/스와이프 제스처 100% 제거',
            '⚡ 60FPS 즉각적 반응 속도'
          ]
        : [
            '👆 Swipe: Instant 4-way turning',
            '🚫 Zero virtual buttons or Swipe gesture',
            '⚡ Instant fluid 60FPS responsiveness'
          ],
      iconType: 'GESTURES'
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '게임 종료 즉시 길이에 비례하여 확정 SNS 포인트가 로컬스토리지 지갑에 안전하게 입금됩니다.'
        : 'Length-based payout deposited atomically to your LocalStorage wallet upon match finish.',
      keyPoints: isKo
        ? [
            '완료 즉시 LocalStorage 영구 지갑 입금',
            '길이 및 몬스터 포식 수 비례 잭팟',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Length multiplier payout',
            'VictoryRewardModal golden coin fanfare'
          ],
      iconType: 'REWARDS'
    }
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-[#fdfcfc] text-[#201d1d] font-mono select-none flex flex-col overflow-hidden items-center justify-between">
      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '클래식 스네이크' : 'Classic Snake'}
        language={language}
        telemetries={[
          { label: isKo ? '길이' : 'Length', value: `${length}`, color: 'text-emerald-700 font-bold' },
          { label: isKo ? '점수' : 'Score', value: `${score}P`, color: 'text-amber-600 font-bold' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => setIsPaused(prev => !prev)}
        isPaused={isPaused}
      />

      {/* Board Viewport with 100% Pure Swipe Gesture Controller */}
      <div 
        className="flex-1 min-h-0 flex items-center justify-center relative overflow-hidden p-2 w-full max-w-sm"
        onTouchStart={(e) => {
          touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }}
        onTouchEnd={(e) => {
          if (!touchStartRef.current) return;
          const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
          const dy = e.changedTouches[0].clientY - touchStartRef.current.y;
          if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 15) {
            changeDirection(dx > 0 ? 'right' : 'left');
          } else if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 15) {
            changeDirection(dy > 0 ? 'down' : 'up');
          }
          touchStartRef.current = null;
        }}
      >
        <div
          className="w-full max-w-[340px] aspect-square bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] relative overflow-hidden touch-none select-none p-1 shadow-inner"
        >
          {/* Card Food / Target Monster Object */}
          <div
            style={{
              left: `${(food.x / BOARD_SIZE) * 100}%`,
              top: `${(food.y / BOARD_SIZE) * 100}%`,
              width: `${100 / BOARD_SIZE}%`,
              height: `${100 / BOARD_SIZE}%`,
            }}
            className="absolute p-0.5 z-10"
          >
            <div 
              className="w-full h-full rounded-full border-2 border-amber-500 shadow-md animate-bounce" 
              style={getCardSpriteStyle(foodCardId)}
            />
          </div>

          {/* Snake Segments (Head: Player Hero Card Sprite, Body: Emerald Badges) */}
          {snake.map((seg, i) => (
            <div
              key={i}
              style={{
                left: `${(seg.x / BOARD_SIZE) * 100}%`,
                top: `${(seg.y / BOARD_SIZE) * 100}%`,
                width: `${100 / BOARD_SIZE}%`,
                height: `${100 / BOARD_SIZE}%`,
              }}
              className="absolute p-0.5"
            >
              {i === 0 ? (
                <div
                  className="w-full h-full rounded-full border-2 border-cyan-600 shadow-md z-20"
                  style={getCardSpriteStyle(playerHeroId)}
                />
              ) : (
                <div
                  className="w-full h-full rounded-full bg-cyan-600 border border-cyan-800 shadow-xs flex items-center justify-center text-[6px] font-black text-white"
                >
                  •
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Minimal Bottom Guide (Zero Virtual Buttons per Pure Touch Principle) */}
      <div className="w-full pb-4 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1.5 bg-black/5 border border-[rgba(15,0,0,0.12)] rounded-full text-[11px] text-[#6e6e73] font-mono shadow-xs">
          {isKo ? '화면 어디든 상하좌우 스와이프하여 영웅 지렁이를 조향하세요' : 'Swipe anywhere to steer hero snake in 4 directions'}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="arcade_snake"
          gameTitle={isKo ? '클래식 스네이크 배틀' : 'Classic Snake Battle'}
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
export default SnakeBattleGame;
