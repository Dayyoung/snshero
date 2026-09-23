import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft, Zap, Shield, Flame, RotateCcw, Volume2, VolumeX,
  Sparkles, Check, Trophy, Award, Bot, RefreshCw, Star, Target,
  Crosshair, Skull, AlertTriangle, Gift
} from 'lucide-react';
import { CardData, UserStats, Skill, CardRarity } from '../types';
import { CARD_DATABASE } from '../cardDatabase';
import { cn } from '../lib/utils';
import { triggerHaptic } from '../lib/haptic';

// Engines & Services
import { CombatCameraSystem } from '../engine/CombatCameraSystem';
import { SDFDamageFontRenderer } from '../engine/SDFDamageFontRenderer';
import { ExtremeCrushEffectManager } from '../engine/ExtremeCrushEffectManager';
import {
  surpriseCombatMissionService,
  CombatSurpriseMission
} from '../services/SurpriseCombatMissionService';

// UI Components
import { CombatControlJogDial } from '../components/CombatControlJogDial';
import { AutoBattleHapticToggle } from '../components/AutoBattleHapticToggle';

export interface BattleViewProps {
  playerDeck?: CardData[];
  targetCardId?: number | null;
  opponentCustomDeck?: CardData[];
  opponentName?: string;
  onBack: () => void;
  language?: string;
  playSfx?: (url: string) => void;
  userStats?: UserStats;
  updateStats?: (newStats: Partial<UserStats>) => void;
  sns?: number;
  updateSns?: (amount: number, reason?: string, type?: 'earned' | 'spent') => void;
  inventory?: any[];
  addCard?: (rarity: CardRarity, indexOverride?: number, isSilent?: boolean) => void;
  initialAutoBattle?: boolean;
  onToggleAutoBattle?: () => void;
  skills?: Skill[];
  onEarnXp?: (amount: number) => void;
  recordMatchResult?: (result: 'win' | 'loss' | 'draw') => void;
}

interface CombatUnit {
  id: string;
  card: CardData;
  currentHp: number;
  maxHp: number;
  attack: number;
  defense: number;
  element: 'fire' | 'water' | 'nature' | 'light' | 'dark';
  isPlayer: boolean;
  position: number; // 0..2
  isAlive: boolean;
  isHit: boolean;
}

// Elemental Weakness Table: Returns 1.5 if attacker is strong against defender, 0.75 if weak, 1.0 otherwise
function getElementAffinity(
  atk: string = 'fire',
  def: string = 'water'
): { multiplier: number; isWeakness: boolean } {
  const table: Record<string, string> = {
    fire: 'nature',
    nature: 'water',
    water: 'fire',
    light: 'dark',
    dark: 'light'
  };

  if (table[atk] === def) {
    return { multiplier: 1.6, isWeakness: true };
  }
  if (table[def] === atk) {
    return { multiplier: 0.7, isWeakness: false };
  }
  return { multiplier: 1.0, isWeakness: false };
}

export const BattleView: React.FC<BattleViewProps> = ({
  playerDeck,
  targetCardId,
  opponentCustomDeck,
  opponentName = 'AI 챔피언',
  onBack,
  language = 'ko',
  playSfx = () => {},
  sns = 0,
  updateSns,
  addCard,
  initialAutoBattle = true,
  onToggleAutoBattle,
  onEarnXp,
  recordMatchResult
}) => {
  // ─── Engine Singletons ──────────────────────────────────────────────
  const cameraRef = useRef<CombatCameraSystem>(new CombatCameraSystem());
  const sdfRendererRef = useRef<SDFDamageFontRenderer>(new SDFDamageFontRenderer());
  const crushManagerRef = useRef<ExtremeCrushEffectManager>(new ExtremeCrushEffectManager());

  // ─── Canvases ────────────────────────────────────────────────────────
  const sdfCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const crushCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // ─── Battle State ────────────────────────────────────────────────────
  const [battleSpeed, setBattleSpeed] = useState<1 | 2 | 3>(1);
  const [isAutoBattle, setIsAutoBattle] = useState(initialAutoBattle);
  const [battleState, setBattleState] = useState<'idle' | 'fighting' | 'victory' | 'defeat'>('fighting');
  const [turnCount, setTurnCount] = useState(1);
  const [selectedTargetIndex, setSelectedTargetIndex] = useState<number | null>(null);
  const [activeSurpriseMission, setActiveSurpriseMission] = useState<CombatSurpriseMission | null>(null);
  const [surpriseRewardClaimedModal, setSurpriseRewardClaimedModal] = useState<any | null>(null);
  const [isBlackoutActive, setIsBlackoutActive] = useState(false);

  // ─── Initialize Units ───────────────────────────────────────────────
  const defaultCard: CardData = useMemo(() => ({
    id: 1,
    name: '히어로 에이스',
    rarity: 'SSR',
    type: 'balanced',
    power: 120,
    cost: 3,
    description: '강력한 타격을 가하는 대표 히어로',
    imageUrl: ''
  }), []);

  const [playerUnits, setPlayerUnits] = useState<CombatUnit[]>(() => {
    const deck = playerDeck && playerDeck.length > 0 ? playerDeck.slice(0, 3) : [defaultCard, defaultCard, defaultCard];
    const elements: ('fire' | 'water' | 'nature' | 'light' | 'dark')[] = ['fire', 'water', 'light'];
    return deck.map((c, i) => ({
      id: `player_${i}_${c.id}`,
      card: c,
      maxHp: 400 + (c.power || 100) * 3,
      currentHp: 400 + (c.power || 100) * 3,
      attack: Math.max(50, Math.round((c.power || 100) * 0.8)),
      defense: Math.max(20, Math.round((c.power || 100) * 0.4)),
      element: elements[i % elements.length],
      isPlayer: true,
      position: i,
      isAlive: true,
      isHit: false
    }));
  });

  const [opponentUnits, setOpponentUnits] = useState<CombatUnit[]>(() => {
    const oppDeck = opponentCustomDeck && opponentCustomDeck.length > 0
      ? opponentCustomDeck.slice(0, 3)
      : (targetCardId && CARD_DATABASE[targetCardId]
          ? [CARD_DATABASE[targetCardId], CARD_DATABASE[targetCardId], CARD_DATABASE[targetCardId]]
          : [defaultCard, defaultCard, defaultCard]);

    const elements: ('fire' | 'water' | 'nature' | 'light' | 'dark')[] = ['nature', 'fire', 'dark'];
    return oppDeck.map((c, i) => ({
      id: `opp_${i}_${c.id}`,
      card: c,
      maxHp: 380 + (c.power || 100) * 2.8,
      currentHp: 380 + (c.power || 100) * 2.8,
      attack: Math.max(45, Math.round((c.power || 100) * 0.75)),
      defense: Math.max(18, Math.round((c.power || 100) * 0.35)),
      element: elements[i % elements.length],
      isPlayer: false,
      position: i,
      isAlive: true,
      isHit: false
    }));
  });

  // ─── Initialize Engine Canvases ─────────────────────────────────────
  useEffect(() => {
    const sdfCanvas = sdfCanvasRef.current;
    if (sdfCanvas) {
      sdfCanvas.width = window.innerWidth;
      sdfCanvas.height = window.innerHeight;
      sdfRendererRef.current.init(sdfCanvas);
    }

    const crushCanvas = crushCanvasRef.current;
    if (crushCanvas) {
      crushCanvas.width = window.innerWidth;
      crushCanvas.height = window.innerHeight;
    }

    // Subscribe to surprise mission updates
    const unsubMission = surpriseCombatMissionService.subscribe(mission => {
      setActiveSurpriseMission(mission ? { ...mission } : null);
    });

    // Start battle surprise mission
    surpriseCombatMissionService.generateBattleMission(true);

    // Subscribe to crush events for UI reactions
    const unsubCrush = crushManagerRef.current.onCrush(evt => {
      // Screen blackout state mirror
      setIsBlackoutActive(true);
      setTimeout(() => setIsBlackoutActive(false), 55);
    });

    return () => {
      unsubMission();
      unsubCrush();
      sdfRendererRef.current.dispose();
      crushManagerRef.current.clear();
      cameraRef.current.reset();
    };
  }, []);

  // ─── Animation & Physics Loop (60 FPS) ──────────────────────────────
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const loop = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      // 1. Camera Physics
      cameraRef.current.update(dt);

      // 2. SDF Damage Font Update & Render
      sdfRendererRef.current.update(dt);
      sdfRendererRef.current.render(cameraRef.current);

      // 3. Crush Effect Update & Render
      crushManagerRef.current.update(dt);
      const crushCanvas = crushCanvasRef.current;
      if (crushCanvas) {
        const ctx = crushCanvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, crushCanvas.width, crushCanvas.height);
          crushManagerRef.current.renderOverlay(ctx, crushCanvas.width, crushCanvas.height);
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  // ─── Damage Execution Engine ────────────────────────────────────────
  const applyDamage = useCallback((
    targetUnit: CombatUnit,
    attackerUnit: CombatUnit,
    targetScreenX: number,
    targetScreenY: number
  ) => {
    const affinity = getElementAffinity(attackerUnit.element, targetUnit.element);
    const isCrit = Math.random() < 0.35; // 35% Crit chance
    const isWeakness = affinity.isWeakness;
    const isExtremeCrush = isWeakness && isCrit;

    const baseDmg = Math.max(25, attackerUnit.attack - Math.round(targetUnit.defense * 0.4));
    const variance = (Math.random() * 0.2 - 0.1) * baseDmg;
    let finalDmg = Math.round((baseDmg + variance) * affinity.multiplier * (isCrit ? 1.8 : 1.0));

    // Extreme Crush trigger (Weakness + Crit)
    if (isExtremeCrush) {
      finalDmg = Math.round(finalDmg * 1.4);
      crushManagerRef.current.triggerCrush(
        targetScreenX,
        targetScreenY,
        finalDmg,
        cameraRef.current,
        {
          element: attackerUnit.element,
          isWeakness: true,
          isCrit: true,
          playSfx
        }
      );
      // Spawn CRUSH Damage in SDF renderer
      sdfRendererRef.current.spawnDamage(targetScreenX, targetScreenY - 30, `CRUSH! -${finalDmg}`, 'crush');
      surpriseCombatMissionService.reportEvent('crush', 1);
    } else if (isCrit) {
      cameraRef.current.triggerHitShock(true);
      triggerHaptic('heavy');
      sdfRendererRef.current.spawnDamage(targetScreenX, targetScreenY - 20, `CRIT! -${finalDmg}`, 'crit');
    } else if (isWeakness) {
      cameraRef.current.triggerHitShock(false);
      triggerHaptic('medium');
      sdfRendererRef.current.spawnDamage(targetScreenX, targetScreenY - 15, `WEAK! -${finalDmg}`, 'weak');
      surpriseCombatMissionService.reportEvent('weakness', 1);
    } else {
      cameraRef.current.triggerHitShock(false);
      triggerHaptic('light');
      sdfRendererRef.current.spawnDamage(targetScreenX, targetScreenY, `-${finalDmg}`, 'normal');
    }

    // Report damage for surprise missions
    surpriseCombatMissionService.reportEvent('damage', finalDmg);

    // Apply HP Reduction
    if (targetUnit.isPlayer) {
      setPlayerUnits(prev => prev.map(u => {
        if (u.id === targetUnit.id) {
          const newHp = Math.max(0, u.currentHp - finalDmg);
          return { ...u, currentHp: newHp, isAlive: newHp > 0, isHit: true };
        }
        return u;
      }));
    } else {
      setOpponentUnits(prev => prev.map(u => {
        if (u.id === targetUnit.id) {
          const newHp = Math.max(0, u.currentHp - finalDmg);
          return { ...u, currentHp: newHp, isAlive: newHp > 0, isHit: true };
        }
        return u;
      }));
    }

    // Reset hit blink
    setTimeout(() => {
      setPlayerUnits(prev => prev.map(u => u.id === targetUnit.id ? { ...u, isHit: false } : u));
      setOpponentUnits(prev => prev.map(u => u.id === targetUnit.id ? { ...u, isHit: false } : u));
    }, 180);
  }, [playSfx]);

  // ─── Turn Simulation Clock ──────────────────────────────────────────
  useEffect(() => {
    if (battleState !== 'fighting') return;

    // Interval inversely proportional to speed (1x: 1800ms, 2x: 1000ms, 3x: 550ms)
    const turnInterval = battleSpeed === 3 ? 550 : battleSpeed === 2 ? 1000 : 1800;

    const timer = setInterval(() => {
      // 1. Check Win/Loss
      const aliveOpponents = opponentUnits.filter(u => u.isAlive);
      const alivePlayers = playerUnits.filter(u => u.isAlive);

      if (aliveOpponents.length === 0) {
        setBattleState('victory');
        triggerHaptic('victory');
        if (updateSns) updateSns(250, '전투 승리 보상', 'earned');
        if (onEarnXp) onEarnXp(120);
        if (recordMatchResult) recordMatchResult('win');
        return;
      }
      if (alivePlayers.length === 0) {
        setBattleState('defeat');
        triggerHaptic('defeat');
        if (recordMatchResult) recordMatchResult('loss');
        return;
      }

      // 2. Player or Auto attack
      const activeAttacker = alivePlayers[turnCount % alivePlayers.length];
      const targetOpponent = (selectedTargetIndex !== null && opponentUnits[selectedTargetIndex]?.isAlive)
        ? opponentUnits[selectedTargetIndex]
        : aliveOpponents[Math.floor(Math.random() * aliveOpponents.length)];

      const targetEl = document.getElementById(`unit-card-${targetOpponent.id}`);
      const rect = targetEl ? targetEl.getBoundingClientRect() : { x: window.innerWidth / 2, y: 180 };
      applyDamage(targetOpponent, activeAttacker, rect.x + 40, rect.y + 50);

      // 3. Retaliation after brief delay
      setTimeout(() => {
        const freshAlivePlayers = playerUnits.filter(u => u.isAlive);
        const freshAliveOpponents = opponentUnits.filter(u => u.isAlive);
        if (freshAlivePlayers.length > 0 && freshAliveOpponents.length > 0) {
          const oppAttacker = freshAliveOpponents[Math.floor(Math.random() * freshAliveOpponents.length)];
          const playerDef = freshAlivePlayers[Math.floor(Math.random() * freshAlivePlayers.length)];
          const pEl = document.getElementById(`unit-card-${playerDef.id}`);
          const pRect = pEl ? pEl.getBoundingClientRect() : { x: window.innerWidth / 2, y: 450 };
          applyDamage(playerDef, oppAttacker, pRect.x + 40, pRect.y + 50);
        }
      }, turnInterval * 0.4);

      setTurnCount(prev => prev + 1);
    }, turnInterval);

    return () => clearInterval(timer);
  }, [
    battleState, battleSpeed, isAutoBattle, turnCount,
    opponentUnits, playerUnits, selectedTargetIndex, applyDamage,
    updateSns, onEarnXp, recordMatchResult
  ]);

  // ─── Claim Surprise Mission Reward ───────────────────────────────────
  const handleClaimSurpriseMission = () => {
    const res = surpriseCombatMissionService.claimReward();
    if (res) {
      if (updateSns) updateSns(res.sns, '돌발 미션 완료 보상', 'earned');
      setSurpriseRewardClaimedModal(res);
    }
  };

  return (
    <div
      id="battle-view-root"
      className="fixed inset-0 w-full h-[100dvh] bg-[#07090e] text-slate-100 flex flex-col justify-between overflow-hidden select-none touch-none"
    >
      {/* ─── Background WebGL SDF Damage & Particle Canvas ─── */}
      <canvas
        ref={sdfCanvasRef}
        id="sdf-damage-canvas"
        className="absolute inset-0 w-full h-full pointer-events-none z-20"
      />

      {/* ─── Screen Shatter Extreme Crush Overlay Canvas ─── */}
      <canvas
        ref={crushCanvasRef}
        id="crush-shatter-canvas"
        className="absolute inset-0 w-full h-full pointer-events-none z-30"
      />

      {/* ─── Momentary Blackout Flash ─── */}
      {isBlackoutActive && (
        <div className="absolute inset-0 bg-black z-40 pointer-events-none transition-opacity duration-75" />
      )}

      {/* ─── Top Bar & HUD ─── */}
      <header
        id="battle-top-bar"
        className="relative z-20 flex items-center justify-between px-3 py-2 border-b border-white/10 bg-black/60 backdrop-blur-md"
      >
        <div className="flex items-center gap-2">
          <button
            id="battle-back-btn"
            type="button"
            onClick={onBack}
            className="flex items-center justify-center min-w-[44px] min-h-[44px] rounded-sm bg-white/5 border border-white/10 hover:bg-white/10 active:scale-95 transition-all text-slate-200"
            aria-label="전투 퇴장"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-mono font-bold text-xs text-white tracking-wider flex items-center gap-1.5">
              <Crosshair className="w-3.5 h-3.5 text-rose-400" />
              {opponentName}
            </h1>
            <span className="font-mono text-[10px] text-slate-400">
              TURN {turnCount} · 60 FPS SDF ENGINE
            </span>
          </div>
        </div>

        {/* Surprise Mission Quick Pill */}
        {activeSurpriseMission && (
          <div
            id="battle-surprise-mission-pill"
            onClick={() => {
              if (activeSurpriseMission.completed && !activeSurpriseMission.rewardClaimed) {
                handleClaimSurpriseMission();
              }
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-sm border text-xs font-mono transition-all cursor-pointer ${
              activeSurpriseMission.completed
                ? 'bg-amber-500/20 border-amber-500 text-amber-300 animate-pulse'
                : 'bg-black/50 border-white/15 text-slate-300'
            }`}
          >
            <Zap className={`w-3.5 h-3.5 ${activeSurpriseMission.completed ? 'text-amber-400' : 'text-slate-400'}`} />
            <span className="truncate max-w-[130px] font-semibold">
              {activeSurpriseMission.title}
            </span>
            <span className="text-[10px] opacity-80">
              ({activeSurpriseMission.currentCount}/{activeSurpriseMission.targetCount})
            </span>
            {activeSurpriseMission.completed && !activeSurpriseMission.rewardClaimed && (
              <span className="ml-1 text-[10px] bg-amber-400 text-black px-1 rounded-xs font-bold">
                [수령]
              </span>
            )}
          </div>
        )}
      </header>

      {/* ─── Battle Playfield Arena ─── */}
      <main
        id="battle-arena-stage"
        className="relative flex-1 flex flex-col justify-around px-3 py-2 overflow-hidden z-10"
      >
        {/* Opponent Front Row (Top) */}
        <section id="opponent-team-row" className="flex justify-center items-center gap-3">
          {opponentUnits.map((unit, idx) => (
            <div
              key={unit.id}
              id={`unit-card-${unit.id}`}
              onClick={() => {
                triggerHaptic('tap');
                setSelectedTargetIndex(idx);
              }}
              className={`relative flex flex-col items-center p-2 rounded-sm border transition-all duration-150 ${
                selectedTargetIndex === idx
                  ? 'ring-2 ring-rose-500 border-rose-400 bg-rose-950/40 scale-105'
                  : 'border-white/10 bg-black/40 hover:border-white/30'
              } ${unit.isHit ? 'bg-red-500/50 scale-95' : ''} ${!unit.isAlive ? 'opacity-30 grayscale' : ''}`}
            >
              {/* Elemental Badge */}
              <span className="absolute -top-2 left-1 text-[9px] font-mono px-1 py-0.2 bg-black border border-white/20 rounded-xs uppercase font-bold text-amber-300">
                {unit.element}
              </span>

              {/* Target Indicator */}
              {selectedTargetIndex === idx && unit.isAlive && (
                <span className="absolute -top-3 right-1 text-[9px] font-mono text-rose-400 font-bold animate-bounce">
                  [LOCK ON]
                </span>
              )}

              <div className="w-16 h-20 bg-slate-800 rounded-sm overflow-hidden flex items-center justify-center border border-white/10 mt-1">
                {unit.card.imageUrl ? (
                  <img
                    src={unit.card.imageUrl}
                    alt={unit.card.name}
                    className="w-full h-full object-cover"
                    crossOrigin="anonymous"
                  />
                ) : (
                  <Skull className="w-8 h-8 text-slate-500" />
                )}
              </div>

              {/* HP Gauge */}
              <div className="w-16 h-1.5 bg-slate-900 rounded-full overflow-hidden border border-white/10 mt-1.5">
                <div
                  className="h-full bg-rose-500 transition-all duration-200"
                  style={{ width: `${(unit.currentHp / unit.maxHp) * 100}%` }}
                />
              </div>
              <span className="font-mono text-[9px] text-slate-300 mt-0.5">
                {unit.currentHp}/{unit.maxHp}
              </span>
            </div>
          ))}
        </section>

        {/* Arena Center Divider / Clash Marker */}
        <div className="relative flex items-center justify-center py-1">
          <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-white/15 to-transparent" />
          <span className="absolute font-mono text-[10px] text-slate-500 bg-[#07090e] px-2 uppercase tracking-widest">
            [ARENA CLASH STAGE]
          </span>
        </div>

        {/* Player Front Row (Bottom) */}
        <section id="player-team-row" className="flex justify-center items-center gap-3">
          {playerUnits.map((unit) => (
            <div
              key={unit.id}
              id={`unit-card-${unit.id}`}
              className={`relative flex flex-col items-center p-2 rounded-sm border transition-all duration-150 ${
                unit.isHit ? 'bg-rose-500/40 scale-95' : 'border-white/10 bg-black/40'
              } ${!unit.isAlive ? 'opacity-30 grayscale' : ''}`}
            >
              <span className="absolute -top-2 left-1 text-[9px] font-mono px-1 py-0.2 bg-black border border-white/20 rounded-xs uppercase font-bold text-sky-300">
                {unit.element}
              </span>

              <div className="w-16 h-20 bg-slate-800 rounded-sm overflow-hidden flex items-center justify-center border border-white/10 mt-1">
                {unit.card.imageUrl ? (
                  <img
                    src={unit.card.imageUrl}
                    alt={unit.card.name}
                    className="w-full h-full object-cover"
                    crossOrigin="anonymous"
                  />
                ) : (
                  <Sparkles className="w-8 h-8 text-sky-400" />
                )}
              </div>

              {/* HP Gauge */}
              <div className="w-16 h-1.5 bg-slate-900 rounded-full overflow-hidden border border-white/10 mt-1.5">
                <div
                  className="h-full bg-sky-400 transition-all duration-200"
                  style={{ width: `${(unit.currentHp / unit.maxHp) * 100}%` }}
                />
              </div>
              <span className="font-mono text-[9px] text-slate-300 mt-0.5">
                {unit.currentHp}/{unit.maxHp}
              </span>
            </div>
          ))}
        </section>
      </main>

      {/* ─── Bottom Thumb Zone Controls ─── */}
      <footer
        id="battle-bottom-thumb-zone"
        className="relative z-30 flex items-center justify-between px-3 py-2.5 border-t border-white/10 bg-black/80 backdrop-blur-lg pb-safe"
      >
        {/* Left: 52px Semicircular Haptic Jog Dial & Auto Battle Toggle */}
        <CombatControlJogDial
          speed={battleSpeed}
          onSpeedChange={(newSpeed) => setBattleSpeed(newSpeed)}
          isAuto={isAutoBattle}
          onToggleAuto={() => {
            setIsAutoBattle(prev => !prev);
            if (onToggleAutoBattle) onToggleAutoBattle();
          }}
        />

        {/* Right: Quick Manual Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            id="combat-crush-strike-btn"
            type="button"
            onClick={() => {
              // Manual Trigger Extreme Crush Shock on currently selected target
              const target = (selectedTargetIndex !== null && opponentUnits[selectedTargetIndex]?.isAlive)
                ? opponentUnits[selectedTargetIndex]
                : opponentUnits.find(u => u.isAlive);
              if (target && playerUnits[0]) {
                const rect = document.getElementById(`unit-card-${target.id}`)?.getBoundingClientRect() || { x: window.innerWidth / 2, y: 200 };
                applyDamage(target, playerUnits[0], rect.x + 40, rect.y + 50);
              }
            }}
            className="flex items-center justify-center min-h-[44px] px-3.5 py-2 rounded-sm font-mono text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white border border-rose-400/50 shadow-md active:scale-95 transition-all"
            aria-label="크러시 강타 시전"
          >
            <Flame className="w-4 h-4 mr-1 text-amber-300" />
            CRUSH 강타
          </button>
        </div>
      </footer>

      {/* ─── Victory / Defeat Modal ─── */}
      <AnimatePresence>
        {(battleState === 'victory' || battleState === 'defeat') && (
          <motion.div
            id="battle-result-modal"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 select-none"
          >
            <div className="w-full max-w-sm bg-[#0c1017] border border-white/20 p-5 rounded-none text-center font-mono">
              <div className="flex justify-center mb-3">
                {battleState === 'victory' ? (
                  <Trophy className="w-12 h-12 text-amber-400 animate-bounce" />
                ) : (
                  <Skull className="w-12 h-12 text-rose-500" />
                )}
              </div>

              <h2 className="text-xl font-black tracking-wider text-white mb-1">
                {battleState === 'victory' ? 'VICTORY [승리]' : 'DEFEAT [패배]'}
              </h2>
              <p className="text-xs text-slate-400 mb-4">
                {battleState === 'victory'
                  ? '적 챔피언을 완파하고 도파민 보상을 획득했습니다.'
                  : '전투에서 패배했습니다. 카드를 강화해 재도전하세요.'}
              </p>

              {battleState === 'victory' && (
                <div className="bg-white/5 border border-white/10 p-3 rounded-sm mb-4 text-xs flex justify-around">
                  <div>
                    <span className="text-slate-400 block text-[10px]">획득 SNS</span>
                    <span className="text-amber-400 font-bold">+250 SNS</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">전투 EXP</span>
                    <span className="text-sky-400 font-bold">+120 EXP</span>
                  </div>
                </div>
              )}

              <button
                id="battle-finish-confirm-btn"
                type="button"
                onClick={onBack}
                className="w-full min-h-[44px] py-2.5 rounded-sm bg-amber-500 text-black font-bold text-sm hover:bg-amber-400 active:scale-95 transition-all"
              >
                [확인 및 전장 복귀]
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Surprise Combat Mission Reward Modal ─── */}
      <AnimatePresence>
        {surpriseRewardClaimedModal && (
          <motion.div
            id="surprise-reward-modal"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          >
            <div className="w-full max-w-sm bg-[#0e131d] border border-amber-500/40 p-5 rounded-none text-center font-mono">
              <Gift className="w-10 h-10 text-amber-400 mx-auto mb-2 animate-bounce" />
              <h3 className="text-sm font-bold text-amber-300 uppercase tracking-wider mb-1">
                돌발 크러시 미션 완료!
              </h3>
              <p className="text-xs text-slate-300 mb-3">
                보상으로 <span className="text-amber-400 font-bold">+{surpriseRewardClaimedModal.sns} SNS</span>와{' '}
                <span className="text-sky-300 font-semibold">{surpriseRewardClaimedModal.itemTitle}</span>을 획득했습니다!
              </p>

              {surpriseRewardClaimedModal.specialOffer && (
                <div className="bg-amber-950/40 border border-amber-500/30 p-3 rounded-sm mb-4 text-left">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-amber-300">
                      ⚡ [타임딜] {surpriseRewardClaimedModal.specialOffer.title}
                    </span>
                    <span className="bg-rose-600 text-white text-[9px] px-1 rounded-xs font-bold">
                      {surpriseRewardClaimedModal.specialOffer.discountPercent}% OFF
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-300">
                    보스전 클리어 특효 룬 3종 + 100 다이아 즉시 지급
                  </p>
                  <div className="mt-2 text-right">
                    <span className="text-xs font-bold text-amber-400">
                      {surpriseRewardClaimedModal.specialOffer.priceKrw.toLocaleString()}원
                    </span>
                  </div>
                </div>
              )}

              <button
                id="surprise-reward-close-btn"
                type="button"
                onClick={() => setSurpriseRewardClaimedModal(null)}
                className="w-full min-h-[44px] py-2 bg-amber-500 text-black font-bold text-xs rounded-sm hover:bg-amber-400 active:scale-95 transition-all"
              >
                [보상 수령 완료]
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BattleView;
