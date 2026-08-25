import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Shield, Heart, Play, Zap } from 'lucide-react';
import { Language, CardData } from '../types';
import { cn, getCardSpriteStyle } from '../lib/utils';
import { CARD_DATABASE } from '../cardDatabase';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface DefenseAlly {
  id: string;
  card: CardData;
  lane: number;
  hp: number;
  maxHp: number;
  atk: number;
  lastShotTime: number;
  upgradeCount: number;
}

interface DefenseMonster {
  id: string;
  cardId: number;
  lane: number;
  hp: number;
  maxHp: number;
  y: number;
  speed: number;
  lastAttackTime: number;
}

interface DefenseProjectile {
  id: string;
  lane: number;
  y: number;
  damage: number;
  speed: number;
}

interface DefenseGameProps {
  language: Language;
  sns: number;
  updateSns?: (amount: number, reason?: string) => void;
  playSfx: (url: string) => void;
  recordMatchResult: (
    result: 'win' | 'loss' | 'draw',
    rewardOverride?: number,
    patterns?: any,
    battleType?: string
  ) => void;
  playerDeck: CardData[];
  lowSpecMode?: boolean;
  onExit: () => void;
  showDefenseTestConsole?: boolean;
  setShowDefenseTestConsole?: React.Dispatch<React.SetStateAction<boolean>>;
}

export const DefenseGame: React.FC<DefenseGameProps> = ({
  language,
  playSfx,
  playerDeck,
  lowSpecMode = false,
  onExit,
}) => {
  const isKo = language === 'ko';
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_game_arcade_defense') !== 'true';
    } catch {
      return true;
    }
  });
  const [defenseRound, setDefenseRound] = useState<number>(1);
  const maxRounds = 5;
  const [defenseLives, setDefenseLives] = useState<number>(5);
  const [defenseAllies, setDefenseAllies] = useState<DefenseAlly[]>([]);
  const [defenseMonsters, setDefenseMonsters] = useState<DefenseMonster[]>([]);
  const [defenseProjectiles, setDefenseProjectiles] = useState<DefenseProjectile[]>([]);
  const [isWaveRunning, setIsWaveRunning] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const startTimeRef = useRef(Date.now());
  const defenseMonstersRef = useRef<DefenseMonster[]>([]);
  const defenseAlliesRef = useRef<DefenseAlly[]>([]);
  const defenseProjectilesRef = useRef<DefenseProjectile[]>([]);

  // Init Allies from Deck
  const initDefense = useCallback(() => {
    const allies: DefenseAlly[] = [];
    const baseCards = playerDeck.length > 0 ? playerDeck.slice(0, 5) : [1, 2, 3, 4, 5].map(id => ({ id, name: 'Hero', stats: [10, 10, 10, 10] } as unknown as CardData));

    for (let lane = 0; lane < 5; lane++) {
      const card = baseCards[lane % baseCards.length];
      const maxHp = 100;
      allies.push({
        id: `ally-lane-${lane}`,
        card,
        lane,
        hp: maxHp,
        maxHp,
        atk: 25,
        lastShotTime: 0,
        upgradeCount: 0,
      });
    }
    setDefenseAllies(allies);
    defenseAlliesRef.current = allies;
    setDefenseRound(1);
    setDefenseLives(5);
    setScore(0);
    setIsWaveRunning(false);
    setIsGameOver(false);
    setSettlementReceipt(null);
    startTimeRef.current = Date.now();
  }, [playerDeck]);

  useEffect(() => {
    initDefense();
  }, [initDefense]);

  // Spawn Monsters for wave
  const startWave = () => {
    if (isWaveRunning || isPaused) return;

    setIsWaveRunning(true);
    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');

    const monsters: DefenseMonster[] = [];
    const count = 4 + defenseRound * 2;

    for (let i = 0; i < count; i++) {
      const lane = Math.floor(Math.random() * 5);
      const cardId = Math.floor(Math.random() * 110) + 1;
      const maxHp = 40 + defenseRound * 20;
      monsters.push({
        id: `monster-${Date.now()}-${i}`,
        cardId,
        lane,
        hp: maxHp,
        maxHp,
        y: -10 - i * 18,
        speed: 10 + defenseRound * 2,
        lastAttackTime: 0,
      });
    }

    setDefenseMonsters(monsters);
    defenseMonstersRef.current = monsters;
  };

  // Main Defense Loop
  useEffect(() => {
    if (isGameOver || isPaused || !isWaveRunning) return;

    let animId: number;
    let lastTime = performance.now();

    const loop = (now: number) => {
      animId = requestAnimationFrame(loop);
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      // 1. Move Projectiles & Collisions
      const projs = [...defenseProjectilesRef.current];
      const monsters = [...defenseMonstersRef.current];

      for (let i = projs.length - 1; i >= 0; i--) {
        const p = projs[i];
        p.y -= p.speed * dt;

        // Check Hit Monster
        for (const m of monsters) {
          if (m.lane === p.lane && Math.abs(m.y - p.y) < 6) {
            m.hp -= p.damage;
            projs.splice(i, 1);
            setScore(s => s + 50);
            playSfx('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
            break;
          }
        }

        if (p.y < 0) projs.splice(i, 1);
      }

      // 2. Move Monsters & Attack Allies
      for (let i = monsters.length - 1; i >= 0; i--) {
        const m = monsters[i];
        if (m.hp <= 0) {
          monsters.splice(i, 1);
          setScore(s => s + 150);
          continue;
        }

        m.y += m.speed * dt;

        // Breached Defense Line
        if (m.y >= 85) {
          monsters.splice(i, 1);
          setDefenseLives(l => {
            const nl = l - 1;
            if (nl <= 0) {
              setIsGameOver(true);
              const duration = (Date.now() - startTimeRef.current) / 1000;
              const receipt = calculateAndDepositMissionReward({
                gameId: 'arcade_defense',
                gameTitle: '5라인 카드 디펜스',
                durationSeconds: duration,
                score,
                difficulty: 'NIGHTMARE',
                isVictory: false
              });
              setSettlementReceipt(receipt);
            }
            return nl;
          });
          playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
        }
      }

      // 3. Ally Auto Attack
      defenseAlliesRef.current.forEach(ally => {
        const laneMonster = monsters.find(m => m.lane === ally.lane && m.y > 0 && m.y < 85);
        if (laneMonster && now - ally.lastShotTime > 800) {
          ally.lastShotTime = now;
          projs.push({
            id: `proj-${Date.now()}-${ally.lane}`,
            lane: ally.lane,
            y: 80,
            damage: ally.atk,
            speed: 55,
          });
        }
      });

      defenseProjectilesRef.current = projs;
      setDefenseProjectiles([...projs]);
      defenseMonstersRef.current = monsters;
      setDefenseMonsters([...monsters]);

      // Wave Cleared Check
      if (monsters.length === 0 && isWaveRunning) {
        setIsWaveRunning(false);
        if (defenseRound < maxRounds) {
          setDefenseRound(r => r + 1);
          playSfx('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
        } else {
          setIsGameOver(true);
          const duration = (Date.now() - startTimeRef.current) / 1000;
          const receipt = calculateAndDepositMissionReward({
            gameId: 'arcade_defense',
            gameTitle: '5라인 카드 디펜스',
            durationSeconds: duration,
            score: score + 3000,
            difficulty: 'NIGHTMARE',
            isVictory: true
          });
          setSettlementReceipt(receipt);
        }
      }
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [defenseRound, isGameOver, isPaused, isWaveRunning, playSfx, score]);

  const tutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 5라인 요새 방어' : 'STEP 1: 5-LANE DEFENSE',
      title: isKo ? '5개 라인 침공 몬스터 전멸' : 'Defend 5 Lanes Against Horde',
      description: isKo
        ? '5개 라인으로 침공하는 몬스터 호드를 영웅 카드의 자동 사격으로 모두 격파하고 기지를 사수하세요.'
        : 'Defend all 5 lanes from attacking monster cards with your hero auto-shooters.',
      keyPoints: isKo
        ? [
            '총 5개 라운드 방어 성공 시 완승',
            '몬스터가 데인저 라인 돌파 시 라이프 차감',
            '라인별 자동 사격 포탑 시스템'
          ]
        : [
            'Clear 5 rounds to win',
            'Monsters crossing danger line deduct life',
            'Lane auto-firing hero turret mechanics'
          ],
      iconType: 'GOAL'
    },
    {
      badge: isKo ? 'STEP 2: 퓨어 제스처 조작' : 'STEP 2: PURE GESTURES',
      title: isKo ? '원터치 웨이브 개시' : 'One-Touch Wave Start',
      description: isKo
        ? '하단 버튼을 원터치하여 다음 웨이브를 신속하게 개시합니다.'
        : 'Tap button to trigger each defense wave with zero complex setups.',
      keyPoints: isKo
        ? [
            '👆 탭: 웨이브 즉시 개시',
            '⚡ 실시간 투사체 발사 및 물리 충돌',
            '❤️ 5회 라이프 보호'
          ]
        : [
            '👆 Tap: Start defense wave',
            '⚡ Real-time projectile collision',
            '❤️ 5 Lives protection'
          ],
      iconType: 'GESTURES'
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '5개 라운드 방어 완수 즉시 NIGHTMARE 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Nightmare payout deposited atomically to your LocalStorage wallet upon defense completion.',
      keyPoints: isKo
        ? [
            '승리 즉시 LocalStorage 영구 지갑 입금',
            '잔여 라이프 및 처치 콤보 보너스',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Remaining lives and kill bonuses',
            'VictoryRewardModal golden coin fanfare'
          ],
      iconType: 'REWARDS'
    }
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-[#fdfcfc] text-[#201d1d] font-mono select-none flex flex-col overflow-hidden items-center justify-between">
      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '5라인 카드 디펜스' : '5-Lane Card Defense'}
        language={language}
        telemetries={[
          { label: isKo ? '라운드' : 'Round', value: `${defenseRound}/${maxRounds}`, color: 'text-amber-600 font-bold' },
          { label: isKo ? '라이프' : 'Lives', value: '❤️'.repeat(Math.max(0, defenseLives)), color: 'text-rose-600' },
          { label: isKo ? '점수' : 'Score', value: `${score}P`, color: 'text-cyan-700 font-bold' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => setIsPaused(prev => !prev)}
        isPaused={isPaused}
      />

      {/* 5-Lane Defense Arena */}
      <div className="flex-1 min-h-0 flex items-center justify-center relative overflow-hidden p-2 w-full max-w-sm">
        <div className="relative w-full h-full max-h-[70vh] border border-[rgba(15,0,0,0.12)] bg-[#f8f7f7] rounded-none overflow-hidden select-none">
          {/* 5 Lane Dividers */}
          <div className="absolute inset-0 flex flex-row justify-between pointer-events-none">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="w-[20%] h-full border-r border-[rgba(15,0,0,0.06)] last:border-r-0"
              />
            ))}
          </div>

          {/* Danger Line */}
          <div className="absolute inset-x-0 top-[82%] h-0.5 border-t-2 border-dashed border-rose-400 pointer-events-none" />

          {/* Projectiles */}
          {defenseProjectiles.map(p => (
            <div
              key={p.id}
              style={{ left: `${p.lane * 20 + 10}%`, top: `${p.y}%` }}
              className="absolute w-2.5 h-2.5 -translate-x-1/2 -translate-y-1/2 bg-amber-500 rounded-full shadow-xs z-30"
            />
          ))}

          {/* Monsters */}
          {defenseMonsters.map(m => (
            <div
              key={m.id}
              style={{ left: `${m.lane * 20 + 10}%`, top: `${m.y}%` }}
              className="absolute w-[16%] aspect-[3/4] -translate-x-1/2 -translate-y-1/2 border border-rose-500 bg-white rounded-xs p-0.5 z-20"
            >
              <div className="w-full h-full" style={getCardSpriteStyle(m.cardId)} />
              <div className="absolute -top-3 left-0 right-0 h-1 bg-rose-200">
                <div style={{ width: `${(m.hp / m.maxHp) * 100}%` }} className="h-full bg-rose-600" />
              </div>
            </div>
          ))}

          {/* Allies at Bottom */}
          {defenseAllies.map(a => (
            <div
              key={a.id}
              style={{ left: `${a.lane * 20 + 10}%`, top: '88%' }}
              className="absolute w-[16%] aspect-[3/4] -translate-x-1/2 -translate-y-1/2 border border-cyan-600 bg-white rounded-xs p-0.5 z-20 shadow-xs"
            >
              <div className="w-full h-full" style={getCardSpriteStyle(a.card.id)} />
            </div>
          ))}
        </div>
      </div>

      {/* Wave Control Button */}
      <div className="shrink-0 w-full max-w-xs mx-auto pb-4 px-3 select-none">
        <button
          type="button"
          onClick={startWave}
          disabled={isWaveRunning || isGameOver || isPaused}
          className={cn(
            'w-full py-3.5 rounded-sm font-mono font-bold text-sm tracking-wider uppercase border transition-all active:scale-95 touch-manipulation',
            isWaveRunning || isGameOver
              ? 'bg-black/5 text-slate-400 border-[rgba(15,0,0,0.1)] cursor-not-allowed'
              : 'bg-amber-500 text-black border-amber-600 hover:bg-amber-400 shadow-sm'
          )}
        >
          {isWaveRunning ? (isKo ? '방어 진행 중...' : 'DEFENDING WAVE...') : (isKo ? `웨이브 ${defenseRound} 시작` : `START WAVE ${defenseRound}`)}
        </button>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="arcade_defense"
          gameTitle={isKo ? '5라인 카드 디펜스: 요새 방어전' : '5-Lane Card Defense: Outpost'}
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
          onPlayAgain={initDefense}
          onExit={onExit}
        />
      )}
    </div>
  );
};
export default DefenseGame;
