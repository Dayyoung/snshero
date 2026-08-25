import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData, Language } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface UndergroundDungeonMissionProps {
  deck: CardData[];
  language: Language;
  lowSpecMode?: boolean;
  playSfx: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

const GRID_SIZE = 6;

interface Tile {
  r: number;
  c: number;
  type: 'empty' | 'monster' | 'potion' | 'boss' | 'portal';
  revealed: boolean;
  hp?: number;
}

export const UndergroundDungeonMission: React.FC<UndergroundDungeonMissionProps> = ({
  deck: _deck,
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
  const [grid, setGrid] = useState<Tile[][]>([]);
  const [playerHp, setPlayerHp] = useState(100);
  const [playerPos, setPlayerPos] = useState<{ r: number; c: number }>({ r: 0, c: 0 });
  const [monstersKilled, setMonstersKilled] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_mission_underground_dungeon') !== 'true';
    } catch {
      return true;
    }
  });
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const startTimeRef = useRef(Date.now());

  const initGame = useCallback(() => {
    const tiles: Tile[][] = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      const row: Tile[] = [];
      for (let c = 0; c < GRID_SIZE; c++) {
        if (r === 0 && c === 0) {
          row.push({ r, c, type: 'empty', revealed: true });
        } else if (r === GRID_SIZE - 1 && c === GRID_SIZE - 1) {
          row.push({ r, c, type: 'portal', revealed: false });
        } else {
          const rand = Math.random();
          const type: 'empty' | 'monster' | 'potion' | 'boss' =
            rand < 0.35 ? 'monster' : rand < 0.5 ? 'potion' : rand < 0.6 ? 'boss' : 'empty';
          row.push({ r, c, type, revealed: false, hp: type === 'boss' ? 50 : type === 'monster' ? 25 : 0 });
        }
      }
      tiles.push(row);
    }

    setGrid(tiles);
    setPlayerHp(100);
    setPlayerPos({ r: 0, c: 0 });
    setMonstersKilled(0);
    setIsGameOver(false);
    setSettlementReceipt(null);
    startTimeRef.current = Date.now();
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const moveToTile = (r: number, c: number) => {
    if (isGameOver || isPaused) return;

    // Check adjacent
    const dist = Math.abs(r - playerPos.r) + Math.abs(c - playerPos.c);
    if (dist !== 1) return;

    const target = grid[r][c];
    let nextHp = playerHp;
    let nextKilled = monstersKilled;

    // Reveal
    const nextGrid = grid.map(row => row.map(cell => (cell.r === r && cell.c === c ? { ...cell, revealed: true } : cell)));

    if (target.type === 'monster') {
      nextHp = Math.max(0, playerHp - 15);
      nextKilled += 1;
      playSfx('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
    } else if (target.type === 'boss') {
      nextHp = Math.max(0, playerHp - 30);
      nextKilled += 2;
      playSfx('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
    } else if (target.type === 'potion') {
      nextHp = Math.min(100, playerHp + 25);
      playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    } else if (target.type === 'portal') {
      // Portal Escape Victory!
      setIsGameOver(true);
      playSfx('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
      const duration = (Date.now() - startTimeRef.current) / 1000;
      const receipt = calculateAndDepositMissionReward({
        gameId: 'mission_underground_dungeon',
        gameTitle: '언더그라운드 던전 탐색',
        durationSeconds: duration,
        score: nextHp * 10 + nextKilled * 300 + 1500,
        difficulty: 'NIGHTMARE',
        isVictory: true
      });
      setSettlementReceipt(receipt);
      onReward(receipt.totalSns);
      return;
    } else {
      playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    }

    setPlayerHp(nextHp);
    setMonstersKilled(nextKilled);
    setPlayerPos({ r, c });
    setGrid(nextGrid);

    if (nextHp <= 0) {
      setIsGameOver(true);
      playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
      const duration = (Date.now() - startTimeRef.current) / 1000;
      const receipt = calculateAndDepositMissionReward({
        gameId: 'mission_underground_dungeon',
        gameTitle: '언더그라운드 던전 탐색',
        durationSeconds: duration,
        score: nextKilled * 300,
        difficulty: 'NIGHTMARE',
        isVictory: false
      });
      setSettlementReceipt(receipt);
      onReward(receipt.totalSns);
    }
  };

  const tutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 탈출 포털 도달' : 'STEP 1: ESCAPE PORTAL',
      title: isKo ? '던전 몬스터 토벌 & 포털 탐색' : 'Slay Monsters & Reach Portal',
      description: isKo
        ? '안개 낀 던전을 탐색하며 몬스터와 보스를 물리치고 최종 탈출 포털에 도달하세요.'
        : 'Explore the foggy dungeon, slay monsters and reach the exit portal.',
      keyPoints: isKo
        ? [
            '우하단 탈출 포털 도달 시 즉시 승리',
            '체력 0 소진 시 던전 탐색 실패',
            '물약 타일 획득 시 HP +25 회복'
          ]
        : [
            'Reach exit portal to win',
            'Depleting HP causes defeat',
            'Potions restore +25 HP'
          ],
      iconType: 'GOAL'
    },
    {
      badge: isKo ? 'STEP 2: 퓨어 제스처 조작' : 'STEP 2: PURE GESTURES',
      title: isKo ? '인접 타일 원터치 이동' : 'One-Touch Tile Move',
      description: isKo
        ? '상하좌우 인접한 격자 타일을 탭하여 즉시 이동 및 안개를 개방합니다.'
        : 'Tap adjacent grid tiles to move and dispel dungeon fog.',
      keyPoints: isKo
        ? [
            '👆 인접 타일 탭: 즉시 이동 & 전투',
            '⚡ 6x6 정밀 던전 레이아웃',
            '🛡️ 실시간 턴제 조우 시스템'
          ]
        : [
            '👆 Tap Adjacent Tile: Instant move & combat',
            '⚡ 6x6 procedural dungeon layout',
            '🛡️ Real-time tactical encounter system'
          ],
      iconType: 'GESTURES'
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '탈출 성공 즉시 NIGHTMARE 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Nightmare payout deposited atomically to your LocalStorage wallet upon dungeon escape.',
      keyPoints: isKo
        ? [
            '승리 즉시 LocalStorage 영구 지갑 입금',
            '잔여 HP 및 토벌 몬스터 보너스',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Remaining HP and kill multipliers',
            'VictoryRewardModal golden coin fanfare'
          ],
      iconType: 'REWARDS'
    }
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-[#fdfcfc] text-[#201d1d] font-mono select-none flex flex-col overflow-hidden items-center justify-between">
      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '언더그라운드 던전' : 'Underground Dungeon'}
        language={language}
        hp={{ current: playerHp, max: 100 }}
        telemetries={[
          { label: isKo ? '토벌' : 'Kills', value: `${monstersKilled}`, color: 'text-amber-600 font-bold' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => setIsPaused(prev => !prev)}
        isPaused={isPaused}
      />

      {/* Dungeon Grid Viewport */}
      <div className="flex-1 min-h-0 flex items-center justify-center relative overflow-hidden p-2 w-full max-w-sm">
        <div className="w-full max-w-[340px] aspect-square grid grid-cols-6 gap-1 bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] p-1.5">
          {grid.flatMap((row, r) =>
            row.map((tile, c) => {
              const isPlayer = playerPos.r === r && playerPos.c === c;
              const isAdjacent = Math.abs(r - playerPos.r) + Math.abs(c - playerPos.c) === 1;

              return (
                <button
                  key={`${r}-${c}`}
                  type="button"
                  onClick={() => moveToTile(r, c)}
                  disabled={!isAdjacent || isGameOver || isPaused}
                  className={`aspect-square border flex items-center justify-center text-sm font-bold rounded-none transition-all ${
                    isPlayer
                      ? 'bg-cyan-600 border-cyan-700 text-white shadow-xs'
                      : tile.revealed
                      ? 'bg-white border-[rgba(15,0,0,0.12)]'
                      : isAdjacent
                      ? 'bg-amber-50/60 border-amber-400 cursor-pointer active:scale-95'
                      : 'bg-black/5 border-[rgba(15,0,0,0.06)] opacity-40 cursor-default'
                  }`}
                >
                  {isPlayer ? (
                    '🧙'
                  ) : tile.revealed ? (
                    tile.type === 'monster' ? '👾' : tile.type === 'boss' ? '👹' : tile.type === 'potion' ? '🧪' : tile.type === 'portal' ? '🌀' : ''
                  ) : isAdjacent ? (
                    '?'
                  ) : (
                    ''
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Minimal Bottom Guide */}
      <div className="w-full pb-3 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1 bg-black/5 border border-[rgba(15,0,0,0.12)] rounded-full text-[10px] text-[#6e6e73] font-mono">
          {isKo ? '인접한 타일을 탭하여 이동하세요 (우하단 🌀 포털 도달 시 탈출 승리)' : 'Tap adjacent tiles to move (Reach 🌀 portal to escape)'}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="mission_underground_dungeon"
          gameTitle={isKo ? '언더그라운드 던전 탐색 미션' : 'Underground Dungeon Mission'}
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
export default UndergroundDungeonMission;
