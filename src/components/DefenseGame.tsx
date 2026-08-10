import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Award, Heart, Play, RotateCcw, ShieldAlert, Zap, X } from 'lucide-react';
import { Language, CardData } from '../types';
import { t } from '../lib/i18n';
import { cn } from '../lib/utils';
import { CARD_DATABASE } from '../cardDatabase';

interface DefenseAlly {
  id: string;
  card: CardData;
  lane: number; // 0 ~ 4
  hp: number;
  maxHp: number;
  atk: number;
  lastShotTime: number;
  upgradeCount: number;
}

interface DefenseMonster {
  id: string;
  cardId: number;
  lane: number; // 0 ~ 4
  hp: number;
  maxHp: number;
  y: number; // percentage (0~100)
  speed: number;
  lastAttackTime: number;
  lastHitTime?: number;
}

interface DefenseProjectile {
  id: string;
  lane: number;
  x: number; // lane * 20 + 10
  y: number; // 80 -> 0
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

const DirectionStatBadge: React.FC<{
  value: number;
  dir: 'N' | 'E' | 'S' | 'W';
  tone: 'red' | 'indigo';
  className: string;
}> = ({ value, dir, tone, className }) => (
  <div
    className={cn(
      "absolute flex h-5 w-5 items-center justify-center rounded-lg border bg-white shadow-[0_2px_6px_rgba(0,0,0,0.4)] ring-1 ring-slate-950/35",
      tone === 'red' ? "border-red-700/70" : "border-indigo-700/70",
      className
    )}
  >
    <span className="absolute left-0.5 top-0.5 text-[5px] font-black leading-none text-slate-500/80">{dir}</span>
    <span className={cn(
      "relative z-10 text-[9px] font-black leading-none tabular-nums",
      tone === 'red' ? "text-red-700" : "text-indigo-700"
    )}>
      {value}
    </span>
  </div>
);

export const DefenseGame: React.FC<DefenseGameProps> = ({
  language,
  sns,
  updateSns,
  playSfx,
  recordMatchResult,
  playerDeck,
  lowSpecMode = false,
  onExit,
  showDefenseTestConsole = false,
  setShowDefenseTestConsole
}) => {
  const [showTutorial, setShowTutorial] = useState<boolean>(true);
  const [defenseRound, setDefenseRound] = useState<number>(1);
  const [defenseLives, setDefenseLives] = useState<number>(5);
  const [defenseAllies, setDefenseAllies] = useState<DefenseAlly[]>([]);
  const [defenseMonsters, setDefenseMonsters] = useState<DefenseMonster[]>([]);
  const [defenseProjectiles, setDefenseProjectiles] = useState<DefenseProjectile[]>([]);
  const [isDefenseWaveRunning, setIsDefenseWaveRunning] = useState<boolean>(false);
  const [isDefenseIntermission, setIsDefenseIntermission] = useState<boolean>(false);
  const [defenseUpgradeMsg, setDefenseUpgradeMsg] = useState<string>('');
  const [showDefenseGameOverModal, setShowDefenseGameOverModal] = useState<boolean>(false);
  const [defenseDefeatCountdown, setDefenseDefeatCountdown] = useState<number | null>(null);
  const [showDefenseVictoryModal, setShowDefenseVictoryModal] = useState<boolean>(false);

  useEffect(() => {
    if (showDefenseGameOverModal) {
      setDefenseDefeatCountdown(5);
    } else {
      setDefenseDefeatCountdown(null);
    }
  }, [showDefenseGameOverModal]);

  useEffect(() => {
    if (defenseDefeatCountdown === null) return;
    if (defenseDefeatCountdown <= 0) {
      setDefenseDefeatCountdown(null);
      setShowDefenseGameOverModal(false);
      onExit();
      return;
    }
    const timer = setTimeout(() => {
      setDefenseDefeatCountdown(prev => (prev !== null ? prev - 1 : null));
    }, 1000);
    return () => clearTimeout(timer);
  }, [defenseDefeatCountdown, onExit]);
  const [defenseEarnedSns, setDefenseEarnedSns] = useState<number>(0);
  const [spawnedCount, setSpawnedCount] = useState<number>(0);

  const defenseMonstersRef = useRef<DefenseMonster[]>([]);
  const defenseProjectilesRef = useRef<DefenseProjectile[]>([]);
  const defenseAlliesRef = useRef<DefenseAlly[]>([]);
  const spawnedCountRef = useRef<number>(0);
  const spawnTimerRef = useRef<number>(0);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  // 1. Throttled sound playing to prevent AudioContext congestion & lag
  const lastPlayTimeRef = useRef<Record<string, number>>({});
  const playThrottledSfx = useCallback((url: string, delay = 120) => {
    const now = Date.now();
    const lastTime = lastPlayTimeRef.current[url] || 0;
    if (now - lastTime >= delay) {
      playSfx(url);
      lastPlayTimeRef.current[url] = now;
    }
  }, [playSfx]);

  // 2. Initialize Allies
  useEffect(() => {
    const INITIAL_CARDS: CardData[] = [
      { id: '1', title: 'Core', title_dis: 'Core', level: 1, stats: [6, 4, 3, 5], rarity: 'bronze', element: 'fire' },
      { id: '2', title: 'Glitch', title_dis: 'Glitch', level: 1, stats: [3, 6, 5, 4], rarity: 'bronze', element: 'water' },
      { id: '3', title: 'Packet', title_dis: 'Packet', level: 1, stats: [4, 5, 6, 3], rarity: 'bronze', element: 'earth' },
      { id: '4', title: 'Buffer', title_dis: 'Buffer', level: 1, stats: [5, 3, 4, 6], rarity: 'bronze', element: 'wind' },
      { id: '5', title: 'Daemon', title_dis: 'Daemon', level: 1, stats: [6, 6, 2, 2], rarity: 'bronze', element: 'fire' }
    ];

    const deck = (playerDeck && playerDeck.length > 0) ? playerDeck : INITIAL_CARDS;
    const initialAllies: DefenseAlly[] = deck.slice(0, 5).map((card, idx) => ({
      id: `ally-${idx}-${Date.now()}`,
      card,
      lane: idx,
      hp: card.power * 25,
      maxHp: card.power * 25,
      atk: Math.round((card.stats ? card.stats[0] : 5) * (card.power / 6)),
      lastShotTime: 0,
      upgradeCount: 0
    }));
    setDefenseAllies(initialAllies);
    defenseAlliesRef.current = initialAllies;
  }, [playerDeck]);

  // 3. Update physics loop
  useEffect(() => {
    if (!isDefenseWaveRunning || defenseLives <= 0 || showTutorial) {
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      let currentMonsters = [...defenseMonstersRef.current];
      let currentProjectiles = [...defenseProjectilesRef.current];
      let currentAllies = [...defenseAlliesRef.current];
      let livesDeduced = 0;

      const maxMonsterCount = 15 + defenseRound * 7;
      const spawnInterval = Math.max(6, 30 - defenseRound * 2);

      // Spawn Zombies
      if (spawnedCountRef.current < maxMonsterCount) {
        spawnTimerRef.current += 1;
        if (spawnTimerRef.current >= spawnInterval || spawnedCountRef.current === 0) {
          spawnTimerRef.current = 0;
          
          const minSpawn = 1;
          const maxSpawn = Math.min(5, Math.floor(defenseRound / 2) + 1);
          const spawnGroupCount = Math.floor(Math.random() * (maxSpawn - minSpawn + 1)) + minSpawn;

          const remainingToSpawn = maxMonsterCount - spawnedCountRef.current;
          const actualSpawnCount = Math.min(spawnGroupCount, remainingToSpawn);

          const lanes = [0, 1, 2, 3, 4];
          for (let i = lanes.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [lanes[i], lanes[j]] = [lanes[j], lanes[i]];
          }

          for (let k = 0; k < actualSpawnCount; k++) {
            const currentCount = spawnedCountRef.current;
            spawnedCountRef.current += 1;

            const monsterCardId = Math.min(110, defenseRound);
            const baseCard = CARD_DATABASE[monsterCardId] || CARD_DATABASE[1];
            const maxHp = (baseCard.stats ? baseCard.stats[2] : (baseCard.bottom || 1)) * 3 * defenseRound;
            const lane = lanes[k % 5];

            const newMonster: DefenseMonster = {
              id: `monster-${Date.now()}-${currentCount}-${k}`,
              cardId: monsterCardId,
              lane,
              hp: maxHp,
              maxHp: maxHp,
              y: -Math.random() * 6,
              speed: Math.min(0.5, 0.12 + defenseRound * 0.004),
              lastAttackTime: 0
            };
            currentMonsters.push(newMonster);
          }
          setSpawnedCount(spawnedCountRef.current);
        }
      }

      // Move Zombies & Attack Allies
      const nextMonsters: DefenseMonster[] = [];
      for (const m of currentMonsters) {
        const ally = currentAllies.find(a => a.lane === m.lane);
        const isAllyAlive = ally && ally.hp > 0;

        if (m.y >= 80 && m.y < 85 && isAllyAlive) {
          if (now - m.lastAttackTime >= 1000) {
            const baseCard = CARD_DATABASE[m.cardId] || CARD_DATABASE[1];
            const dmg = Math.round(baseCard.power * 0.5 * (1 + defenseRound * 0.05));
            
            currentAllies = currentAllies.map(a => {
              if (a.lane === m.lane) {
                const newHp = Math.max(0, a.hp - dmg);
                return { ...a, hp: newHp };
              }
              return a;
            });
            m.lastAttackTime = now;
            playThrottledSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
          }
          nextMonsters.push(m);
        } else if (m.y >= 95) {
          livesDeduced += 1;
        } else {
          nextMonsters.push({
            ...m,
            y: m.y + m.speed
          });
        }
      }
      currentMonsters = nextMonsters;

      if (livesDeduced > 0) {
        setDefenseLives(prev => {
          const nl = Math.max(0, prev - livesDeduced);
          if (nl === 0) {
            setIsDefenseWaveRunning(false);
            const earned = defenseEarnedSns;
            setShowDefenseGameOverModal(true);
            recordMatchResult('win', earned, undefined, 'robot');
          }
          return nl;
        });
      }

      const allAlliesDead = currentAllies.every(a => a.hp <= 0);
      if (allAlliesDead) {
        setIsDefenseWaveRunning(false);
        const earned = defenseEarnedSns;
        setShowDefenseGameOverModal(true);
        recordMatchResult('win', earned, undefined, 'robot');
      }

      // Allies Shoot Projectiles
      currentAllies = currentAllies.map(ally => {
        if (ally.hp <= 0) return ally;

        const hasMonsterInLane = currentMonsters.some(m => m.lane === ally.lane && m.y < 85);
        if (!hasMonsterInLane) return ally;

        if (now - ally.lastShotTime >= 400) {
          currentProjectiles.push({
            id: `proj-${Date.now()}-${Math.random()}`,
            lane: ally.lane,
            x: ally.lane * 20 + 10,
            y: 80,
            damage: ally.atk,
            speed: 5.5
          });
          playThrottledSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
          return {
            ...ally,
            lastShotTime: now
          };
        }
        return ally;
      });

      // Move Projectiles & Check Collisions
      const nextProjectiles: DefenseProjectile[] = [];
      for (const p of currentProjectiles) {
        const newY = p.y - p.speed;
        if (newY <= 0) {
          continue;
        }

        let hitMonster: DefenseMonster | null = null;
        let maxMonsterY = -999;

        for (const m of currentMonsters) {
          if (m.lane === p.lane && m.y <= newY && m.y > maxMonsterY) {
            maxMonsterY = m.y;
            hitMonster = m;
          }
        }

        if (hitMonster && Math.abs(newY - hitMonster.y) <= (p.speed + 1)) {
          hitMonster.hp -= p.damage;
          hitMonster.lastHitTime = now;
          playThrottledSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
        } else {
          nextProjectiles.push({
            ...p,
            y: newY
          });
        }
      }
      currentProjectiles = nextProjectiles;

      currentMonsters = currentMonsters.filter(m => m.hp > 0);

      defenseMonstersRef.current = currentMonsters;
      defenseProjectilesRef.current = currentProjectiles;
      defenseAlliesRef.current = currentAllies;

      setDefenseMonsters(currentMonsters);
      setDefenseProjectiles(currentProjectiles);
      setDefenseAllies(currentAllies);

      // Check wave success (Round clear)
      if (spawnedCountRef.current >= maxMonsterCount && currentMonsters.length === 0 && !allAlliesDead) {
        setIsDefenseWaveRunning(false);
        
        const earnedThisRound = defenseRound * 15;
        const newEarnedSns = defenseEarnedSns + earnedThisRound;
        setDefenseEarnedSns(newEarnedSns);

        if (defenseRound >= 110) {
          setShowDefenseVictoryModal(true);
          recordMatchResult('win', newEarnedSns, undefined, 'robot');
          return;
        }

        setIsDefenseIntermission(true);

        const msg = language === 'ko' 
          ? `라운드 ${defenseRound} 클리어! 아군 공격력 +15% 증가! (+${earnedThisRound} SNS)` 
          : `ROUND ${defenseRound} CLEAR! ALLIES ATK +15%! (+${earnedThisRound} SNS)`;
        setDefenseUpgradeMsg(msg);

        const upgradedAllies = currentAllies.map(a => ({
          ...a,
          atk: Math.round(a.atk * 1.15),
          hp: a.maxHp,
          upgradeCount: a.upgradeCount + 1
        }));
        setDefenseAllies(upgradedAllies);
        defenseAlliesRef.current = upgradedAllies;

        setTimeout(() => {
          setIsDefenseIntermission(false);
          setDefenseRound(prev => prev + 1);
        }, 3000);
      }

    }, lowSpecMode ? 180 : 80);

    return () => clearInterval(interval);
  }, [isDefenseWaveRunning, defenseLives, defenseRound, defenseEarnedSns, language, lowSpecMode, playThrottledSfx, recordMatchResult]);

  const startDefenseWave = () => {
    if (isDefenseWaveRunning || isDefenseIntermission) return;
    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    setDefenseMonsters([]);
    setDefenseProjectiles([]);
    setSpawnedCount(0);
    spawnedCountRef.current = 0;
    spawnTimerRef.current = 0;
    defenseMonstersRef.current = [];
    defenseProjectilesRef.current = [];
    setIsDefenseWaveRunning(true);
  };

  useEffect(() => {
    if (isDefenseWaveRunning || isDefenseIntermission || defenseLives <= 0 || showTutorial) {
      return;
    }
    startDefenseWave();
  }, [defenseRound, isDefenseWaveRunning, isDefenseIntermission, defenseLives, showTutorial]);

  const handleExitGame = useCallback(() => {
    setConfirmModal({
      isOpen: true,
      title: language === 'ko' ? '디펜스 모드 이탈' : 'FORFEIT DEFENSE MODE',
      message: language === 'ko' 
        ? `정말 디펜스 모드를 이탈하시겠습니까? 획득한 보상 ${defenseEarnedSns} SNS가 지급됩니다.` 
        : `Are you sure you want to exit defense mode? Accumulated reward of ${defenseEarnedSns} SNS will be granted.`,
      onConfirm: () => {
        if (defenseEarnedSns > 0) {
          recordMatchResult('win', defenseEarnedSns, undefined, 'robot');
        }
        onExit();
      }
    });
  }, [language, defenseEarnedSns, recordMatchResult, onExit]);

  useEffect(() => {
    const handleExitRequest = () => {
      handleExitGame();
    };
    window.addEventListener('defense-exit-request', handleExitRequest);
    return () => {
      window.removeEventListener('defense-exit-request', handleExitRequest);
    };
  }, [handleExitGame]);


  return (
    <div className="flex-1 flex flex-col w-full h-full min-h-0 bg-[#0f0f1b] text-white overflow-y-auto relative pb-20 select-none"
      style={{
        backgroundImage: `radial-gradient(circle at 50% 50%, #1e1b4b 0%, #09090b 100%)`,
        boxShadow: 'inset 0 0 100px rgba(99,102,241,0.25)'
      }}
    >
      <div className="absolute inset-0 opacity-10 pointer-events-none z-0" 
           style={{ 
             backgroundImage: `linear-gradient(#4f46e5 1px, transparent 1px), linear-gradient(90deg, #4f46e5 1px, transparent 1px)`,
             backgroundSize: '40px 40px'
           }} 
      />

      <header className="h-16 flex items-center justify-between border-b border-indigo-950/60 px-6 bg-slate-950/80 backdrop-blur-md z-50 shrink-0 relative font-sans">
        <button
          onClick={handleExitGame}
          className="text-slate-400 hover:text-white transition-colors cursor-pointer text-xs font-bold uppercase tracking-wider flex items-center gap-1 border border-slate-800 px-3 py-1.5 rounded-lg hover:bg-slate-900"
        >
          {t('back', language)}
        </button>
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 pointer-events-none">
          <Shield className={cn("text-indigo-500", !lowSpecMode && "animate-pulse")} size={20} />
          <h2 className="text-base font-bold uppercase tracking-wide text-white text-center">
            {t('mode_defense', language)} (PvZ MODE)
          </h2>
        </div>
        <div className="w-10" />
      </header>

      <div className="bg-slate-950/40 border-b border-indigo-950/60 px-6 py-2.5 flex items-center justify-between z-40 shrink-0 font-sans backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-slate-500 tracking-wider">DEFENSE LINE STATUS</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-3 py-1 bg-gradient-to-tr from-amber-400 to-yellow-500 text-slate-900 font-bold text-xs rounded-lg shadow-sm font-sans">
            ROUND {defenseRound}
          </div>
          <div className="px-3 py-1 bg-gradient-to-r from-indigo-600 to-violet-655 text-white font-bold text-xs rounded-lg shadow-sm font-sans">
            {sns || 0} SNS
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-4 min-h-0 font-sans z-10 relative">
        <div className={cn(
          "relative w-full max-w-[min(85vw,85vh*5/7)] aspect-[5/7] border bg-slate-950/90 rounded-3xl overflow-hidden shadow-2xl transition-all duration-300",
          defenseMonsters.some(m => m.y >= 70)
            ? "border-red-500 shadow-red-955/50 ring-4 ring-red-500/20"
            : "border-indigo-950/80 shadow-indigo-950/20"
        )}>
          
          <div className="absolute inset-0 flex flex-row justify-between pointer-events-none z-0">
            {Array.from({ length: 5 }).map((_, i) => (
              <div 
                key={`lane-line-${i}`} 
                className={cn(
                  "w-[20%] h-full border-r border-indigo-950/30 last:border-r-0 relative",
                  i % 2 === 0 ? "bg-slate-950/10" : "bg-indigo-950/5"
                )}
              >
                <div className="absolute inset-x-0 bottom-[15%] h-0.5 bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />
              </div>
            ))}
          </div>

          <div className="absolute inset-x-0 top-[80%] h-0.5 border-t-2 border-dashed border-red-500/40 pointer-events-none z-10 flex items-center justify-end pr-4 text-[8px] font-bold text-red-500/60 uppercase tracking-widest">
            Danger Line
          </div>

          {defenseProjectiles.map(p => (
            <div 
              key={p.id}
              style={{ left: `${p.lane * 20 + 10}%`, top: `${p.y}%` }}
              className={cn(
                "absolute w-3.5 h-3.5 -translate-x-1/2 -translate-y-1/2 bg-yellow-400 border border-yellow-300 rounded-full shadow-[0_0_12px_rgba(250,204,21,0.9)] z-40",
                !lowSpecMode && defenseProjectiles.length < 8 && "animate-pulse"
              )}
            />
          ))}

          {defenseMonsters.map(monster => {
            const baseCard = CARD_DATABASE[monster.cardId] || CARD_DATABASE[1];
            const hpPercent = Math.max(0, (monster.hp / monster.maxHp) * 100);

            const isJustHit = (Date.now() - (monster.lastHitTime || 0)) < 80;
            const hitStyle: React.CSSProperties = isJustHit ? {
              filter: 'brightness(1.5) sepia(1) hue-rotate(-50deg) saturate(4)',
              transform: 'scale(0.93) translate(1px, -1px) translate(-50%, -50%)',
              transition: 'transform 0.05s ease-out'
            } : {
              transform: 'translate(-50%, -50%)',
              transition: 'transform 0.1s ease-out'
            };

            return (
              <div 
                key={monster.id}
                style={{ 
                  left: `${monster.lane * 20 + 10}%`, 
                  top: `${monster.y}%`, 
                  width: '16%', 
                  height: '16%',
                  ...hitStyle
                }}
                className="absolute z-30 flex items-center justify-center pointer-events-none"
              >
                <div className={cn(
                  "w-full h-full aspect-[5/7] border rounded-2xl shadow-lg relative flex flex-col items-center justify-center p-1 bg-slate-900 border-red-500/30",
                  "shadow-red-950/20"
                )}>
                  {/* 동서남북 스코어 뱃지 (Monster) */}
                  <div className="absolute inset-0 z-45 pointer-events-none">
                    <DirectionStatBadge value={baseCard.stats ? baseCard.stats[0] : (baseCard as any).top} dir="N" tone="red" className="top-0 left-1/2 -translate-x-1/2" />
                    <DirectionStatBadge value={baseCard.stats ? baseCard.stats[1] : (baseCard as any).right} dir="E" tone="red" className="right-0 top-1/2 -translate-y-1/2" />
                    <DirectionStatBadge value={baseCard.stats ? baseCard.stats[2] : (baseCard as any).bottom} dir="S" tone="red" className="bottom-0 left-1/2 -translate-x-1/2" />
                    <DirectionStatBadge value={baseCard.stats ? baseCard.stats[3] : (baseCard as any).left} dir="W" tone="red" className="left-0 top-1/2 -translate-y-1/2" />
                  </div>

                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-14 h-3.5 bg-slate-950 border border-slate-800 rounded-md overflow-hidden z-40 flex items-center justify-center shadow-md">
                    <div 
                      style={{ width: `${hpPercent}%` }} 
                      className="absolute left-0 top-0 bottom-0 bg-red-500 transition-all duration-75"
                    />
                    <span className="relative z-50 text-[7px] font-black text-white leading-none">
                      {monster.hp}/{monster.maxHp}
                    </span>
                  </div>

                  <div className="w-full h-full flex items-center justify-center relative overflow-hidden rounded-xl">
                    {baseCard.imageUrl ? (
                      <img 
                        src={baseCard.imageUrl} 
                        alt="Zombie"
                        className="w-full h-full object-contain pixelated scale-110 drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)]"
                      />
                    ) : (
                      <div 
                        className="w-[180%] aspect-square transform-gpu scale-95"
                        style={{
                          backgroundImage: `url('/card100.png')`,
                          backgroundSize: `1000% 1100%`,
                          backgroundPosition: (() => {
                            const imgIdx = baseCard.imageIndex !== undefined ? baseCard.imageIndex : monster.cardId;
                            const x = ((imgIdx - 1) % 10) * (100 / 9);
                            const y = Math.floor((imgIdx - 1) / 10) * (100 / 10);
                            return `${x}% ${y}%`;
                          })(),
                          backgroundRepeat: 'no-repeat',
                          imageRendering: 'pixelated'
                        }}
                      />
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {defenseAllies.map(ally => {
            const hpPercent = Math.max(0, (ally.hp / ally.maxHp) * 100);
            const isDead = ally.hp <= 0;
            return (
              <div 
                key={`ally-lane-${ally.lane}`}
                style={{ 
                  left: `${ally.lane * 20 + 10}%`, 
                  top: '85%', 
                  width: '16%', 
                  height: '16%' 
                }}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center justify-center"
              >
                <div className={cn(
                  "w-full h-full aspect-[5/7] border rounded-2xl shadow-xl relative flex flex-col items-center justify-center p-1 transition-all",
                  isDead 
                    ? "bg-slate-950/80 border-slate-900 filter grayscale opacity-40 shadow-none" 
                    : "bg-slate-900 border-indigo-500/50 shadow-indigo-950/30 hover:border-indigo-400"
                )}>
                  {/* 동서남북 스코어 뱃지 (Ally) */}
                  {!isDead && (
                    <div className="absolute inset-0 z-45 pointer-events-none">
                      <DirectionStatBadge value={ally.card.stats ? ally.card.stats[0] : (ally.card as any).top} dir="N" tone="indigo" className="top-0 left-1/2 -translate-x-1/2" />
                      <DirectionStatBadge value={ally.card.stats ? ally.card.stats[1] : (ally.card as any).right} dir="E" tone="indigo" className="right-0 top-1/2 -translate-y-1/2" />
                      <DirectionStatBadge value={ally.card.stats ? ally.card.stats[2] : (ally.card as any).bottom} dir="S" tone="indigo" className="bottom-0 left-1/2 -translate-x-1/2" />
                      <DirectionStatBadge value={ally.card.stats ? ally.card.stats[3] : (ally.card as any).left} dir="W" tone="indigo" className="left-0 top-1/2 -translate-y-1/2" />
                    </div>
                  )}

                  <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-14 h-3.5 bg-slate-950 border border-slate-800 rounded-md overflow-hidden z-40 flex items-center justify-center shadow-md">
                    <div 
                      style={{ width: `${hpPercent}%` }} 
                      className={cn(
                        "absolute left-0 top-0 bottom-0 transition-all duration-75",
                        isDead ? "bg-slate-800" : hpPercent < 30 ? cn("bg-amber-500", !lowSpecMode && "animate-pulse") : "bg-emerald-500"
                      )}
                    />
                    <span className="relative z-50 text-[7px] font-black text-white leading-none">
                      {isDead ? "DEAD" : `${ally.hp}/${ally.maxHp}`}
                    </span>
                  </div>

                  {ally.upgradeCount > 0 && !isDead && (
                    <div className={cn("absolute -top-2 -right-2 bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 text-[8px] font-black w-4.5 h-4.5 rounded-full border border-white flex items-center justify-center shadow-md", !lowSpecMode && "animate-bounce-subtle")}>
                      +{ally.upgradeCount}
                    </div>
                  )}

                  <div className="w-full h-full flex items-center justify-center relative overflow-hidden rounded-xl">
                    {isDead ? (
                      <div className={cn("text-red-500 font-black text-xl z-50 select-none font-sans", !lowSpecMode && "animate-pulse")}>✕</div>
                    ) : ally.card.imageUrl ? (
                      <img 
                        src={ally.card.imageUrl} 
                        alt="Ally"
                        className="w-full h-full object-contain pixelated scale-110 drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)]"
                      />
                    ) : (
                      <div 
                        className="w-[180%] aspect-square transform-gpu scale-95"
                        style={{
                          backgroundImage: `url('/card100.png')`,
                          backgroundSize: `1000% 1100%`,
                          backgroundPosition: (() => {
                            const imgIdx = ally.card.imageIndex !== undefined ? ally.card.imageIndex : 1;
                            const x = ((imgIdx - 1) % 10) * (100 / 9);
                            const y = Math.floor((imgIdx - 1) / 10) * (100 / 10);
                            return `${x}% ${y}%`;
                          })(),
                          backgroundRepeat: 'no-repeat',
                          imageRendering: 'pixelated'
                        }}
                      />
                    )}
                  </div>
                </div>

                {!isDead && (
                  <div className="mt-7 text-[7px] font-bold bg-slate-950/90 text-yellow-400 px-1 py-0.2 rounded border border-slate-800 whitespace-nowrap shadow z-40 scale-90">
                    ATK: {ally.atk}
                  </div>
                )}
              </div>
            );
          })}

          <AnimatePresence>
            {isDefenseIntermission && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-6 text-center"
              >
                <motion.div
                  initial={{ scale: 0.8, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.8, y: -20 }}
                  className="space-y-4"
                >
                  <div className={cn("w-16 h-16 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 flex items-center justify-center mx-auto shadow-lg shadow-yellow-500/20", !lowSpecMode && "animate-pulse")}>
                    <Zap size={32} className="fill-current" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black italic tracking-wide text-yellow-400 leading-none">
                    {defenseUpgradeMsg}
                  </h3>
                  <p className={cn("text-xs text-slate-400 uppercase tracking-widest font-sans", !lowSpecMode && "animate-pulse")}>
                    {t('defense_next_round_countdown', language)}
                  </p>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>

      <div className="w-full bg-slate-900/90 backdrop-blur-md border-t border-indigo-950/40 p-4 shrink-0 flex flex-col gap-4 relative z-50 font-sans">
        <div className="flex justify-between items-center px-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-400 text-xs uppercase tracking-wider">SYSTEM STATUS:</span>
            {isDefenseWaveRunning ? (
              <span className={cn("text-yellow-400 font-bold text-xs tracking-wide uppercase", !lowSpecMode && "animate-pulse")}>{t('defense_status_running', language)} ({spawnedCount} SPWN)</span>
            ) : isDefenseIntermission ? (
              <span className={cn("text-indigo-400 font-bold text-xs tracking-wide uppercase", !lowSpecMode && "animate-pulse")}>{t('defense_status_intermission', language)}</span>
            ) : (
              <span className="text-emerald-400 font-bold text-xs tracking-wide uppercase">{t('defense_status_ready', language)}</span>
            )}
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-black/40 border border-indigo-950/40 rounded-lg">
            <span className="text-slate-400 text-xs mr-1">{t('defense_lives', language)}:</span>
            {Array.from({ length: 5 }).map((_, idx) => (
              <Heart 
                key={`heart-${idx}`} 
                size={16} 
                className={cn(idx < defenseLives ? "fill-red-500 text-red-500" : "text-slate-700", idx < defenseLives && !lowSpecMode && "animate-bounce")}
                style={{ animationDelay: `${idx * 0.1}s` }}
              />
            ))}
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-[11px] text-slate-400 max-w-[280px] leading-relaxed uppercase tracking-wide">
            🤖 {t('defense_auto_shoot_desc', language)}
          </div>

          <div className="w-full md:w-auto flex justify-center font-sans">
            <button 
              onClick={startDefenseWave}
              disabled={isDefenseWaveRunning || isDefenseIntermission}
              className={cn(
                "px-8 py-3.5 font-bold uppercase text-base rounded-xl transition-all shadow-md w-full md:w-auto flex justify-center items-center cursor-pointer",
                (isDefenseWaveRunning || isDefenseIntermission)
                  ? "bg-slate-800 text-slate-600 cursor-not-allowed shadow-none" 
                  : "bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-slate-900 active:scale-95 hover:shadow-lg"
              )}
            >
              <div className="flex items-center justify-center gap-2">
                <Play size={18} className="fill-current" />
                <span>{t('defense_start_wave', language)}</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {showDefenseTestConsole && (
        <div className="w-full bg-slate-950 border-t-2 border-red-500 p-4 shrink-0 flex flex-col gap-3 relative z-[60] font-sans">
          <div className="flex items-center justify-between border-b border-red-950/50 pb-2">
            <span className="font-bold text-red-500 text-xs uppercase tracking-wider flex items-center gap-1">
              ⚠️ {t('defense_test_console', language)}
            </span>
            <button 
              onClick={() => setShowDefenseTestConsole?.(false)}
              className="text-slate-400 hover:text-white text-xs border border-slate-700 px-2 py-0.5 rounded cursor-pointer transition-all active:scale-95"
            >
              CLOSE
            </button>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => {
                playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                
                setDefenseMonsters([]);
                defenseMonstersRef.current = [];
                setDefenseProjectiles([]);
                defenseProjectilesRef.current = [];
                
                setIsDefenseWaveRunning(false);
                setIsDefenseIntermission(true);
                
                const earnedThisRound = defenseRound * 15;
                const newEarnedSns = defenseEarnedSns + earnedThisRound;
                setDefenseEarnedSns(newEarnedSns);
                
                const msg = language === 'ko' 
                  ? `[TEST] 라운드 ${defenseRound} 클리어! 아군 공격력 +15% 증가! (+${earnedThisRound} SNS)` 
                  : `[TEST] ROUND ${defenseRound} CLEAR! ALLIES ATK +15%! (+${earnedThisRound} SNS)`;
                setDefenseUpgradeMsg(msg);
                
                const upgradedAllies = defenseAllies.map(a => ({
                  ...a,
                  atk: Math.round(a.atk * 1.15),
                  hp: a.maxHp,
                  upgradeCount: a.upgradeCount + 1
                }));
                setDefenseAllies(upgradedAllies);
                defenseAlliesRef.current = upgradedAllies;
                
                setTimeout(() => {
                  setIsDefenseIntermission(false);
                  setDefenseRound(prev => prev + 1);
                }, 1000);
              }}
              className="px-4 py-2 bg-red-950 border border-red-700 text-red-200 hover:bg-red-900 font-bold text-xs rounded-lg active:scale-95 transition-all shadow-md cursor-pointer"
            >
              ⚡ {t('defense_inc_round', language)}
            </button>
            
            <button
              onClick={() => {
                playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                const upgradedAllies = defenseAllies.map(a => ({
                  ...a,
                  atk: a.atk + 100
                }));
                setDefenseAllies(upgradedAllies);
                defenseAlliesRef.current = upgradedAllies;
                
                const msg = t('defense_atk_buff_applied', language);
                setDefenseUpgradeMsg(msg);
                setIsDefenseIntermission(true);
                setTimeout(() => {
                  setIsDefenseIntermission(false);
                }, 1500);
              }}
              className="px-4 py-2 bg-amber-950 border border-amber-700 text-amber-200 hover:bg-amber-900 font-bold text-xs rounded-lg active:scale-95 transition-all shadow-md cursor-pointer"
            >
              ⚔️ {t('defense_inc_atk', language)}
            </button>
          </div>
        </div>
      )}

      <AnimatePresence>
        {showTutorial && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs px-4 animate-in fade-in duration-200">
            <div className="bg-white text-slate-800 w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl border border-slate-100/80 p-6 animate-in zoom-in-95 duration-200">
              <div className="flex items-center gap-2.5 mb-3 border-b border-slate-100 pb-3">
                <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
                  <Zap size={16} />
                </span>
                <h3 className="text-base font-bold text-slate-800 uppercase tracking-tight font-sans">
                  {t('tutorial_title', language)}
                </h3>
              </div>
              <p className="text-xs sm:text-sm font-medium text-slate-600 leading-relaxed mb-6 whitespace-pre-line font-sans">
                {t('tutorial_defense', language)}
              </p>
              <button
                onClick={() => {
                  playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                  setShowTutorial(false);
                }}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-md shadow-indigo-600/10 hover:shadow-lg active:scale-95 transition-all cursor-pointer font-sans"
              >
                {t('tutorial_start_game', language)}
              </button>
            </div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDefenseGameOverModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div 
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0.9, opacity: 0 }}
               className="bg-white text-slate-800 rounded-3xl p-6 max-w-xs w-full text-center shadow-2xl border border-slate-100/80 animate-in zoom-in-95 duration-200"
            >
              <ShieldAlert size={42} className="mx-auto text-rose-500 mb-3 animate-bounce" />
              <h2 className="text-xl font-bold text-slate-800 mb-1">
                {t('defense_gameover', language)}
              </h2>
              <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">
                {t('defense_all_allies_defeated', language)}
              </p>

              {defenseDefeatCountdown !== null && (
                <div className="text-[11px] font-bold text-rose-600 bg-rose-50 border border-rose-200 py-1 px-3 rounded-lg animate-pulse mb-4">
                  {language === 'ko' ? `${defenseDefeatCountdown}초 후 자동으로 닫힙니다...` : `Auto closing in ${defenseDefeatCountdown}s...`}
                </div>
              )}

              <div className="border border-slate-100 bg-slate-50 p-4 rounded-xl mb-6 shadow-xs text-left font-sans">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">REACHED ROUND</span>
                  <span className="text-slate-800 font-extrabold text-sm">ROUND {defenseRound}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">SNS REWARD</span>
                  <span className="text-indigo-600 font-extrabold text-sm">+{defenseEarnedSns} SNS</span>
                </div>
              </div>

              <button 
                onClick={() => {
                  setDefenseDefeatCountdown(null);
                  playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                  setShowDefenseGameOverModal(false);
                  onExit();
                }}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold active:scale-95 transition-all shadow-md shadow-indigo-600/10 hover:shadow-lg cursor-pointer flex items-center justify-center gap-1.5 font-sans text-xs"
              >
                <RotateCcw size={14} />
                <span>
                  {language === 'ko'
                    ? `확인 및 돌아가기 ${defenseDefeatCountdown !== null ? `(${defenseDefeatCountdown}초)` : ''}`
                    : `CONFIRM & RETURN ${defenseDefeatCountdown !== null ? `(${defenseDefeatCountdown}s)` : ''}`}
                </span>
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDefenseVictoryModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div 
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0.9, opacity: 0 }}
               className="bg-white text-slate-800 rounded-3xl p-6 max-w-xs w-full text-center shadow-2xl border border-slate-100/80 animate-in zoom-in-95 duration-200"
            >
              <Award size={42} className="mx-auto text-amber-500 mb-3 animate-bounce" />
              <h2 className="text-xl font-bold text-slate-800 mb-1">
                {t('defense_victory', language)}
              </h2>
              <p className="text-xs font-semibold text-slate-500 mb-4 leading-relaxed">
                {t('defense_victory_desc', language)}
              </p>

              <div className="border border-slate-100 bg-slate-50 p-4 rounded-xl mb-6 shadow-xs text-left font-sans">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">TOTAL ROUNDS</span>
                  <span className="text-slate-800 font-extrabold text-sm">ROUND 110</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">TOTAL SNS REWARD</span>
                  <span className="text-emerald-600 font-extrabold text-sm">+{defenseEarnedSns} SNS</span>
                </div>
              </div>

              <button 
                onClick={() => {
                  playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                  setShowDefenseVictoryModal(false);
                  onExit();
                }}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold active:scale-95 transition-all shadow-md shadow-indigo-600/10 hover:shadow-lg cursor-pointer font-sans"
              >
                <span>CONFIRM & RETURN</span>
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmModal.isOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div
              className="absolute inset-0 bg-slate-900/10 backdrop-blur-xs"
              onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
            />
            <motion.div
              initial={{ scale: 0.85, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.85, y: 30 }}
              transition={{ type: 'spring', stiffness: 350, damping: 28 }}
              className="bg-white text-slate-800 w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl border border-slate-100/80 relative z-[10000] p-6 animate-in zoom-in-95 duration-200"
            >
              <div className="flex items-center gap-2.5 mb-3 border-b border-slate-100 pb-3">
                <span className="p-1.5 bg-amber-50 text-amber-600 rounded-lg shrink-0">
                  <ShieldAlert size={16} className="animate-bounce" />
                </span>
                <h3 className="text-base font-bold text-slate-800 uppercase tracking-tight font-sans">
                  {confirmModal.title}
                </h3>
              </div>

              <div className="mb-6">
                <p className="text-xs sm:text-sm font-medium text-slate-600 leading-relaxed whitespace-pre-line font-sans">{confirmModal.message}</p>
              </div>

              <div className="flex gap-3 font-sans">
                <button
                  onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                  className="flex-1 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/85 text-slate-700 font-semibold rounded-xl shadow-sm active:scale-95 transition-all cursor-pointer text-xs uppercase"
                >
                  {language === 'ko' ? '취소' : 'Cancel'}
                </button>
                <button
                  onClick={() => {
                    confirmModal.onConfirm();
                    setConfirmModal(prev => ({ ...prev, isOpen: false }));
                  }}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold active:scale-95 transition-all shadow-md shadow-rose-600/10 hover:shadow-lg cursor-pointer text-xs uppercase"
                >
                  {language === 'ko' ? '확인' : 'Confirm'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
