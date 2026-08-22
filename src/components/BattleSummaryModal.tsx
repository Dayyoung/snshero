import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Trophy, 
  Zap, 
  Shield, 
  Coins, 
  Sparkles, 
  Share2, 
  Check, 
  RotateCcw, 
  Bot, 
  Flame, 
  BarChart3, 
  Layers, 
  Swords,
  ShieldAlert,
  Award,
  PartyPopper
} from 'lucide-react';
import { CardData } from '../types';
import { getCardSpriteStyle } from '../lib/utils';
import { LeveledUpCardInfo } from './BattleResultPanel';

export interface BattleCardStats {
  id: string | number;
  title: string;
  title_en?: string;
  level: number;
  power: number;
  damageDealt: number;
  damageReceived: number;
  isMvp?: boolean;
  card?: CardData;
}

export interface LastBattleSummaryData {
  id: string;
  timestamp: number;
  battleType: string;
  isAutoBattle: boolean;
  opponent: {
    id?: string;
    name: string;
    avatarUrl?: string;
    totalPower: number;
  };
  player: {
    name: string;
    avatarUrl?: string;
    totalPower: number;
  };
  result: 'win' | 'loss' | 'draw';
  boardScore: { player: number; ai: number };
  totalDamageDealt: number;
  totalDamageReceived: number;
  netDamage: number;
  snsEarned: number;
  xpGained: number;
  leveledUpCards?: LeveledUpCardInfo[];
  playerCards?: (BattleCardStats | { card: CardData; damageDealt: number; damageReceived: number; isMvp?: boolean })[];
  opponentCards?: (BattleCardStats | { card: CardData; damageDealt: number; damageReceived: number; isMvp?: boolean })[];
  tacticalBonuses?: {
    isSpeedAttack?: boolean;
    isUnderdog?: boolean;
    isGoblin?: boolean;
    isManaSpring?: boolean;
    isElementalCombo?: boolean;
    isIronclad?: boolean;
    qteSuccess?: boolean;
  };
  grade?: 'S+' | 'S' | 'A' | 'B' | 'C' | 'D';
}

export interface BattleSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  summaryData?: LastBattleSummaryData | null;
  language?: string;
  lowSpecMode?: boolean;
  onRematch?: () => void;
  onResumeAutoBattle?: () => void;
  onShareToCommunity?: () => void;
}

interface ConfettiPiece {
  id: number;
  x: number; // percentage 0 - 100
  driftX: number; // drift offset in px
  startY: number; // start Y in px
  targetY: number; // target Y in px
  color: string;
  width: number;
  height: number;
  isCircle: boolean;
  rotateX: number;
  rotateY: number;
  rotateZ: number;
  duration: number;
  delay: number;
}

const CONFETTI_COLORS = [
  '#fbbf24', // Amber/Gold
  '#34d399', // Emerald
  '#60a5fa', // Blue/Cyan
  '#f472b6', // Pink/Rose
  '#a78bfa', // Purple
  '#facc15', // Yellow
  '#38bdf8', // Sky
  '#f87171', // Coral
  '#ffffff'  // Pure sparkle
];

export const BattleSummaryModal: React.FC<BattleSummaryModalProps> = ({
  isOpen,
  onClose,
  summaryData: propSummaryData,
  language = 'ko',
  lowSpecMode = false,
  onRematch,
  onResumeAutoBattle,
  onShareToCommunity
}) => {
  const isKo = language === 'ko';
  const [data, setData] = useState<LastBattleSummaryData | null>(null);
  const [shared, setShared] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'cards' | 'tactics'>('overview');
  const [confettiBurstKey, setConfettiBurstKey] = useState<number>(1);
  const [showConfetti, setShowConfetti] = useState<boolean>(true);

  // Check low spec mode from localStorage if prop is false
  const isLowSpec = useMemo(() => {
    if (lowSpecMode) return true;
    try {
      if (typeof localStorage !== 'undefined') {
        return localStorage.getItem('hero_low_spec_mode') === 'true';
      }
    } catch {
      // ignore
    }
    return false;
  }, [lowSpecMode]);

  // Load from props or localStorage
  useEffect(() => {
    if (propSummaryData) {
      setData(propSummaryData);
    } else if (isOpen) {
      try {
        const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('hero_last_ai_battle_summary') : null;
        if (saved) {
          setData(JSON.parse(saved));
        }
      } catch (e) {
        console.error('Failed to load last battle summary:', e);
      }
    }
  }, [propSummaryData, isOpen]);

  // Trigger confetti burst on open when winning
  useEffect(() => {
    if (isOpen) {
      setConfettiBurstKey(prev => prev + 1);
      setShowConfetti(true);
    }
  }, [isOpen]);

  // Fallback default data if no prior battle summary exists in localStorage
  const summary: LastBattleSummaryData = data || {
    id: 'battle_latest',
    timestamp: Date.now(),
    battleType: 'robot',
    isAutoBattle: false,
    opponent: {
      name: 'AI Combat Bot',
      totalPower: 350
    },
    player: {
      name: (typeof localStorage !== 'undefined' ? localStorage.getItem('hero_user_name') : null) || 'Hero',
      totalPower: 380
    },
    result: 'win',
    boardScore: { player: 6, ai: 3 },
    totalDamageDealt: 850,
    totalDamageReceived: 420,
    netDamage: 430,
    snsEarned: 25,
    xpGained: 60,
    grade: 'S',
    playerCards: [
      { id: 1, title: '에일라', title_en: 'Ayla', level: 3, power: 120, damageDealt: 320, damageReceived: 80, isMvp: true },
      { id: 2, title: '카단', title_en: 'Kadan', level: 2, power: 95, damageDealt: 210, damageReceived: 110 },
      { id: 3, title: '발보', title_en: 'Valbo', level: 2, power: 85, damageDealt: 180, damageReceived: 90 },
      { id: 4, title: '프레도', title_en: 'Fredo', level: 1, power: 70, damageDealt: 140, damageReceived: 140 }
    ],
    tacticalBonuses: {
      isSpeedAttack: true,
      isElementalCombo: true
    }
  };

  const isWin = summary.result === 'win';

  // Generate confetti particles
  const confettiParticles = useMemo<ConfettiPiece[]>(() => {
    if (!isWin || !showConfetti) return [];
    const count = isLowSpec ? 12 : 36;
    const pieces: ConfettiPiece[] = [];

    for (let i = 0; i < count; i++) {
      const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
      const isCircle = i % 4 === 0;
      const width = isCircle ? 7 : Math.floor(6 + (i % 7) * 1.5);
      const height = isCircle ? 7 : Math.floor(8 + ((i * 3) % 9));

      // Scatter spread horizontally
      const x = Math.floor(5 + ((i * 17) % 90));
      const driftX = ((i % 2 === 0 ? 1 : -1) * (15 + ((i * 7) % 45)));
      const startY = -20 - ((i * 11) % 40);
      const targetY = 320 + ((i * 19) % 280);

      pieces.push({
        id: i,
        x,
        driftX,
        startY,
        targetY,
        color,
        width,
        height,
        isCircle,
        rotateX: (i * 90) % 720,
        rotateY: (i * 120) % 1080,
        rotateZ: (i % 2 === 0 ? 1 : -1) * (180 + (i * 45)),
        duration: isLowSpec ? 1.8 : 2.2 + ((i % 5) * 0.35),
        delay: (i % 6) * 0.12
      });
    }
    return pieces;
  }, [isWin, showConfetti, confettiBurstKey, isLowSpec]);

  // Radiant spark burst around trophy
  const sparkPoints = useMemo(() => {
    if (!isWin) return [];
    const count = isLowSpec ? 6 : 12;
    return Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * 360;
      const rad = (angle * Math.PI) / 180;
      const dist = 32 + (i % 3) * 12;
      return {
        id: i,
        x: Math.cos(rad) * dist,
        y: Math.sin(rad) * dist,
        scale: 0.8 + (i % 3) * 0.3,
        delay: 0.1 + (i % 4) * 0.08
      };
    });
  }, [isWin, confettiBurstKey, isLowSpec]);

  const triggerManualCelebration = useCallback(() => {
    setConfettiBurstKey(prev => prev + 1);
    setShowConfetti(true);
  }, []);

  if (!isOpen) return null;

  const damageRatio = summary.totalDamageReceived > 0 
    ? (summary.totalDamageDealt / summary.totalDamageReceived).toFixed(2) 
    : summary.totalDamageDealt > 0 ? '9.99' : '1.00';

  const totalExchange = Math.max(1, summary.totalDamageDealt + summary.totalDamageReceived);
  const playerDmgPercent = Math.round((summary.totalDamageDealt / totalExchange) * 100);
  const aiDmgPercent = 100 - playerDmgPercent;

  // Grade calculation
  const calculatedGrade = summary.grade || (() => {
    if (summary.result === 'win') {
      if (summary.boardScore.player >= 7 || Number(damageRatio) >= 2.5) return 'S+';
      if (summary.boardScore.player >= 6 || Number(damageRatio) >= 1.8) return 'S';
      return 'A';
    } else if (summary.result === 'draw') {
      return 'B';
    } else {
      if (summary.boardScore.ai <= 5) return 'C';
      return 'D';
    }
  })();

  const handleShare = () => {
    if (onShareToCommunity) {
      onShareToCommunity();
    } else {
      try {
        const battleSummaryPost = {
          id: 'post_battle_' + Date.now(),
          type: 'battle_result',
          result: summary.result,
          snsEarned: summary.snsEarned,
          totalDamageDealt: summary.totalDamageDealt,
          totalDamageReceived: summary.totalDamageReceived,
          timestamp: Date.now(),
          author: (typeof localStorage !== 'undefined' ? localStorage.getItem('hero_user_name') : null) || 'Hero',
          content: isKo
            ? `📊 전투 결과 요약 [${summary.result === 'win' ? 'VICTORY 승리' : 'DEFEAT 패배'}] 총 입힌 데미지: ${summary.totalDamageDealt.toLocaleString()} DMG | 받은 피해: ${summary.totalDamageReceived.toLocaleString()} DMG | 보상: +${summary.snsEarned} SNS`
            : `📊 Battle Summary [${summary.result === 'win' ? 'VICTORY' : 'DEFEAT'}] Damage Dealt: ${summary.totalDamageDealt.toLocaleString()} DMG | Received: ${summary.totalDamageReceived.toLocaleString()} DMG | SNS: +${summary.snsEarned}`
        };
        localStorage.setItem('hero_community_pvp_post_id', JSON.stringify(battleSummaryPost));
      } catch (e) {
        console.error(e);
      }
    }
    setShared(true);
    setTimeout(() => setShared(false), 3000);
  };

  const formattedDate = new Date(summary.timestamp).toLocaleString(isKo ? 'ko-KR' : 'en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  // Normalize player cards
  const normalizedPlayerCards = (summary.playerCards || []).map((item, idx) => {
    if ('card' in item && item.card) {
      return {
        id: item.card.id || (idx + 1),
        title: item.card.title || `Card #${idx + 1}`,
        title_en: item.card.title_en || item.card.title,
        level: item.card.level || 1,
        power: item.card.stats ? item.card.stats.reduce((a, b) => a + b, 0) : 100,
        damageDealt: item.damageDealt || 0,
        damageReceived: item.damageReceived || 0,
        isMvp: Boolean(item.isMvp),
        card: item.card
      };
    }
    const c = item as BattleCardStats;
    return {
      id: c.id || (idx + 1),
      title: c.title || `Card #${idx + 1}`,
      title_en: c.title_en || c.title,
      level: c.level || 1,
      power: c.power || 100,
      damageDealt: c.damageDealt || 0,
      damageReceived: c.damageReceived || 0,
      isMvp: Boolean(c.isMvp),
      card: c.card
    };
  });

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[250] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto font-mono text-left"
        id="battle-summary-modal-overlay"
      >
        <motion.div
          initial={{ scale: 0.96, opacity: 0, y: 12 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.96, opacity: 0, y: 12 }}
          transition={{ type: 'spring', damping: 22, stiffness: 320 }}
          className="relative bg-slate-950 border border-slate-800 rounded-lg w-full max-w-lg shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[92vh]"
          id="battle-summary-modal"
        >
          {/* 🎉 Victory Confetti Animation Layer (Only triggers on WIN) */}
          {isWin && showConfetti && (
            <div 
              key={`confetti-burst-${confettiBurstKey}`}
              className="absolute inset-0 pointer-events-none overflow-hidden z-30"
              aria-hidden="true"
            >
              {confettiParticles.map((p) => (
                <motion.div
                  key={`cp-${p.id}`}
                  initial={{
                    opacity: 1,
                    top: `${p.startY}px`,
                    left: `${p.x}%`,
                    x: 0,
                    scale: 0.2,
                    rotateX: 0,
                    rotateY: 0,
                    rotateZ: 0
                  }}
                  animate={{
                    opacity: [1, 1, 0.9, 0],
                    top: [`${p.startY}px`, `${p.targetY}px`],
                    x: p.driftX,
                    scale: [0.2, 1, 1, 0.7],
                    rotateX: p.rotateX,
                    rotateY: p.rotateY,
                    rotateZ: p.rotateZ
                  }}
                  transition={{
                    duration: p.duration,
                    delay: p.delay,
                    ease: [0.25, 0.1, 0.25, 1]
                  }}
                  style={{
                    position: 'absolute',
                    width: `${p.width}px`,
                    height: `${p.height}px`,
                    backgroundColor: p.color,
                    borderRadius: p.isCircle ? '50%' : '1px',
                    boxShadow: isLowSpec ? 'none' : `0 0 6px ${p.color}88`
                  }}
                />
              ))}
            </div>
          )}

          {/* Header Bar */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900 shrink-0 relative z-20">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-400" />
              <div>
                <h3 className="text-xs sm:text-sm font-bold tracking-wider uppercase text-white flex items-center gap-1.5">
                  <span>{isKo ? '[ 전투 결과 요약 ]' : '[ BATTLE SUMMARY ]'}</span>
                  {summary.isAutoBattle && (
                    <span className="bg-amber-950 border border-amber-500/50 text-amber-300 text-[9px] px-1.5 py-0.5 rounded-sm font-bold">
                      [AUTO]
                    </span>
                  )}
                  {summary.battleType && (
                    <span className="bg-slate-800 border border-slate-700 text-slate-300 text-[9px] px-1.5 py-0.5 rounded-sm font-bold uppercase">
                      [{summary.battleType}]
                    </span>
                  )}
                </h3>
                <p className="text-[9px] text-slate-400 font-mono">{formattedDate}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-sm bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center border border-slate-700"
              aria-label="Close"
              id="btn-close-battle-summary"
            >
              <X size={18} />
            </button>
          </div>

          {/* Result Banner with Victory Sparks & Celebration Trigger */}
          <div className={`relative px-4 py-3 flex items-center justify-between border-b overflow-hidden z-20 ${
            isWin
              ? 'bg-emerald-950/50 border-emerald-500/40'
              : summary.result === 'loss'
              ? 'bg-rose-950/40 border-rose-500/30'
              : 'bg-amber-950/40 border-amber-500/30'
          }`}>
            {/* Victory background aura shimmer */}
            {isWin && !isLowSpec && (
              <motion.div 
                animate={{ opacity: [0.15, 0.35, 0.15] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 via-amber-500/15 to-emerald-500/20 pointer-events-none"
              />
            )}

            <div className="flex items-center gap-3 relative z-10">
              {/* Victory Trophy Icon with Radial Sparkle Burst */}
              <div className="relative">
                <motion.div 
                  initial={{ scale: isWin ? 0.7 : 1 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 10 }}
                  className={`p-2.5 rounded-sm border ${
                    isWin
                      ? 'bg-emerald-500/25 border-emerald-500/60 text-emerald-300 shadow-sm'
                      : summary.result === 'loss'
                      ? 'bg-rose-500/20 border-rose-500/50 text-rose-400'
                      : 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                  }`}
                >
                  {isWin ? <Trophy size={22} className="text-amber-300" /> : summary.result === 'loss' ? <ShieldAlert size={22} /> : <Swords size={22} />}
                </motion.div>

                {/* Particle Sparks shooting outwards upon victory */}
                {isWin && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    {sparkPoints.map((s) => (
                      <motion.div
                        key={`spark-${confettiBurstKey}-${s.id}`}
                        initial={{ opacity: 1, scale: 0, x: 0, y: 0 }}
                        animate={{
                          opacity: [0, 1, 0],
                          scale: [0, s.scale, 0],
                          x: s.x,
                          y: s.y
                        }}
                        transition={{
                          duration: 1.1,
                          delay: s.delay,
                          ease: "easeOut"
                        }}
                        className="absolute w-1.5 h-1.5 rounded-full bg-amber-300"
                        style={{
                          boxShadow: isLowSpec ? 'none' : '0 0 5px #facc15'
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div>
                <div className={`text-base sm:text-lg font-bold uppercase tracking-tight flex items-center gap-2 ${
                  isWin ? 'text-emerald-300' : summary.result === 'loss' ? 'text-rose-400' : 'text-amber-400'
                }`}>
                  <span>
                    {isWin 
                      ? (isKo ? 'VICTORY 승리' : 'VICTORY') 
                      : summary.result === 'loss' 
                      ? (isKo ? 'DEFEAT 패배' : 'DEFEAT') 
                      : (isKo ? 'DRAW 무승부' : 'DRAW')}
                  </span>
                  
                  {/* Replay Confetti Particle Button */}
                  {isWin && (
                    <button
                      type="button"
                      onClick={triggerManualCelebration}
                      title={isKo ? '축하 파티클 다시 터뜨리기' : 'Replay Victory Confetti'}
                      className="text-[10px] px-2 py-0.5 rounded-sm bg-emerald-900/60 hover:bg-emerald-800/80 border border-emerald-500/50 text-amber-300 hover:text-white flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                      id="btn-trigger-confetti-particle"
                    >
                      <PartyPopper size={12} className="text-amber-400 animate-bounce" />
                      <span>{isKo ? '축하 효과' : 'Confetti'}</span>
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 font-mono">
                  {summary.player?.name || 'Hero'} ({summary.boardScore?.player ?? 0}) vs ({summary.boardScore?.ai ?? 0}) {summary.opponent?.name || 'AI Bot'}
                </p>
              </div>
            </div>

            {/* Combat Grade Badge */}
            <div className="flex flex-col items-end relative z-10">
              <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">{isKo ? '성과 등급' : 'GRADE'}</span>
              <div className="flex items-center gap-1">
                <span className="text-xl sm:text-2xl font-bold text-amber-400">
                  {calculatedGrade}
                </span>
                <Award size={16} className="text-amber-400" />
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-800 bg-slate-900 shrink-0 text-xs font-mono relative z-20">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex-1 py-2.5 text-center font-bold transition-colors cursor-pointer border-b-2 ${
                activeTab === 'overview'
                  ? 'border-indigo-500 text-indigo-300 bg-indigo-950/30'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
              id="tab-battle-summary-overview"
            >
              {isKo ? '[ 데미지/보상 요약 ]' : '[ Damage & Stats ]'}
            </button>
            <button
              onClick={() => setActiveTab('cards')}
              className={`flex-1 py-2.5 text-center font-bold transition-colors cursor-pointer border-b-2 ${
                activeTab === 'cards'
                  ? 'border-indigo-500 text-indigo-300 bg-indigo-950/30'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
              id="tab-battle-summary-cards"
            >
              {isKo ? `[ 출전 카드 (${normalizedPlayerCards.length}) ]` : `[ Cards Used (${normalizedPlayerCards.length}) ]`}
            </button>
            <button
              onClick={() => setActiveTab('tactics')}
              className={`flex-1 py-2.5 text-center font-bold transition-colors cursor-pointer border-b-2 ${
                activeTab === 'tactics'
                  ? 'border-indigo-500 text-indigo-300 bg-indigo-950/30'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
              id="tab-battle-summary-tactics"
            >
              {isKo ? '[ 전술 보너스 ]' : '[ Tactical Bonuses ]'}
            </button>
          </div>

          {/* Scrollable Content Area */}
          <div className="p-4 space-y-4 overflow-y-auto flex-1 text-left relative z-20">
            {activeTab === 'overview' && (
              <div className="space-y-4">
                {/* Primary Stats: Damage Dealt vs Received & Total SNS Gained */}
                <div className="bg-slate-900 border border-slate-800 rounded-sm p-3.5 space-y-3">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                    <span className="flex items-center gap-1.5">
                      <Swords size={14} className="text-amber-400" />
                      {isKo ? '전투 공방 데미지 분석 (Damage Exchange)' : 'Combat Damage Exchange'}
                    </span>
                    <span className="text-[10px] text-indigo-400 font-mono">
                      {damageRatio}x {isKo ? '교환비' : 'Ratio'}
                    </span>
                  </div>

                  {/* 2-Column Damage Box */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* 1. Total Damage Dealt */}
                    <div className="bg-indigo-950/30 border border-indigo-500/40 rounded-sm p-3 flex flex-col justify-between">
                      <div className="flex items-center justify-between text-[10px] font-bold text-indigo-300 uppercase">
                        <span>{isKo ? '💥 가한 데미지' : '💥 Damage Dealt'}</span>
                        <Zap size={14} className="text-indigo-400" />
                      </div>
                      <div className="my-1.5">
                        <span className="text-2xl font-bold text-indigo-300">
                          {summary.totalDamageDealt.toLocaleString()}
                        </span>
                        <span className="text-[10px] font-bold text-indigo-400 ml-1">DMG</span>
                      </div>
                      <div className="text-[9px] text-slate-400">
                        {playerDmgPercent}% {isKo ? '총 타격 지분' : 'of total exchange'}
                      </div>
                    </div>

                    {/* 2. Total Damage Received */}
                    <div className="bg-rose-950/30 border border-rose-500/40 rounded-sm p-3 flex flex-col justify-between">
                      <div className="flex items-center justify-between text-[10px] font-bold text-rose-300 uppercase">
                        <span>{isKo ? '🛡️ 받은 피해량' : '🛡️ Damage Taken'}</span>
                        <Flame size={14} className="text-rose-400" />
                      </div>
                      <div className="my-1.5">
                        <span className="text-2xl font-bold text-rose-300">
                          {summary.totalDamageReceived.toLocaleString()}
                        </span>
                        <span className="text-[10px] font-bold text-rose-400 ml-1">DMG</span>
                      </div>
                      <div className="text-[9px] text-slate-400">
                        {aiDmgPercent}% {isKo ? '상대 피해량' : 'absorbed'}
                      </div>
                    </div>
                  </div>

                  {/* Damage Distribution Bar */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase">
                      <span className="text-indigo-400">YOU: {summary.totalDamageDealt} DMG ({playerDmgPercent}%)</span>
                      <span className="text-rose-400">AI: {summary.totalDamageReceived} DMG ({aiDmgPercent}%)</span>
                    </div>
                    <div className="h-2.5 w-full bg-slate-950 rounded-sm overflow-hidden flex border border-slate-800">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${playerDmgPercent}%` }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                        className="h-full bg-indigo-500"
                      />
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${aiDmgPercent}%` }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                        className="h-full bg-rose-500"
                      />
                    </div>
                  </div>

                  {/* Net Damage Highlight */}
                  <div className="flex items-center justify-between px-3 py-2 bg-slate-950 border border-slate-800 rounded-sm text-xs">
                    <span className="text-slate-400 font-bold">{isKo ? '순 데미지 마진 (Net Margin):' : 'Net Damage Margin:'}</span>
                    <span className={`font-bold ${summary.netDamage >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {summary.netDamage >= 0 ? `+${summary.netDamage.toLocaleString()}` : summary.netDamage.toLocaleString()} DMG
                    </span>
                  </div>
                </div>

                {/* Total SNS Gained & EXP Section */}
                <div className="bg-slate-900 border border-slate-800 rounded-sm p-3.5 space-y-3">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                    <span className="flex items-center gap-1.5">
                      <Coins size={14} className="text-amber-400" />
                      {isKo ? '획득 보상 (Total Rewards Gained)' : 'Total Rewards Gained'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Total SNS Gained */}
                    <div className="bg-amber-950/30 border border-amber-500/40 rounded-sm p-3 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-amber-400 uppercase font-bold block">{isKo ? '총 획득 SNS' : 'Total SNS Gained'}</span>
                        <span className="text-2xl font-bold text-amber-300">+{summary.snsEarned}</span>
                        <span className="text-[9px] text-amber-400/80 block mt-0.5 font-mono">SNS POINT</span>
                      </div>
                      <Coins className="w-7 h-7 text-amber-400/70" />
                    </div>

                    {/* Deck EXP */}
                    <div className="bg-purple-950/30 border border-purple-500/40 rounded-sm p-3 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-purple-400 uppercase font-bold block">{isKo ? '획득 덱 EXP' : 'Deck EXP Gained'}</span>
                        <span className="text-2xl font-bold text-purple-300">+{summary.xpGained}</span>
                        <span className="text-[9px] text-purple-400/80 block mt-0.5 font-mono">EXP POINTS</span>
                      </div>
                      <Sparkles className="w-7 h-7 text-purple-400/70" />
                    </div>
                  </div>

                  {/* Level Up Info if any */}
                  {summary.leveledUpCards && summary.leveledUpCards.length > 0 && (
                    <div className="p-2.5 bg-indigo-950/30 border border-indigo-500/30 rounded-sm space-y-1.5">
                      <div className="text-[10px] text-indigo-300 font-bold uppercase flex items-center gap-1">
                        <Sparkles size={12} className="text-indigo-400" />
                        <span>{isKo ? '🎉 레벨업 완료 히어로:' : '🎉 Cards Leveled Up:'}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {summary.leveledUpCards.map((c, i) => (
                          <span key={i} className="text-[9px] px-2 py-0.5 bg-indigo-900/50 border border-indigo-500/40 text-indigo-200 rounded-sm font-bold">
                            {c.card.title} (Lv.{c.oldLevel} → Lv.{c.newLevel})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Cards Breakdown Tab (Cards Used) */}
            {activeTab === 'cards' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  <span className="flex items-center gap-1.5">
                    <Layers size={14} className="text-indigo-400" />
                    {isKo ? '출전 카드별 활약도 (Cards Used Stats)' : 'Cards Used Performance'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    [{normalizedPlayerCards.length} {isKo ? '장 출전' : 'Cards'}]
                  </span>
                </div>

                {/* Card List with MVP highlight */}
                <div className="space-y-2">
                  {normalizedPlayerCards.map((card, idx) => {
                    const cardIdNum = Number(card.id) || (idx + 1);
                    return (
                      <div 
                        key={card.id || `card-stat-${idx}`}
                        className={`p-2.5 rounded-sm border flex items-center justify-between gap-3 text-xs ${
                          card.isMvp 
                            ? 'bg-amber-950/30 border-amber-500/60' 
                            : 'bg-slate-900 border-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div 
                            className="w-10 h-10 rounded-sm shrink-0 border border-slate-700 bg-slate-950 relative overflow-hidden"
                            style={getCardSpriteStyle(cardIdNum)}
                          >
                            {card.isMvp && (
                              <span className="absolute top-0 right-0 bg-amber-500 text-slate-950 font-bold text-[7px] px-1 rounded-bl-sm">
                                MVP
                              </span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-100 truncate flex items-center gap-1">
                              <span>{isKo ? card.title : (card.title_en || card.title)}</span>
                              <span className="text-[9px] text-amber-400">Lv.{card.level}</span>
                            </div>
                            <div className="text-[9px] text-slate-400">
                              {isKo ? '전투력:' : 'Power:'} {card.power}⚡
                            </div>
                          </div>
                        </div>

                        {/* Damage Contribution Stats */}
                        <div className="text-right shrink-0 flex items-center gap-3">
                          <div>
                            <span className="text-[10px] text-indigo-400 block font-bold">
                              +{card.damageDealt} DMG
                            </span>
                            <span className="text-[8px] text-slate-400 uppercase">
                              {isKo ? '가한 타격' : 'Dealt'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-rose-400 block font-bold">
                              -{card.damageReceived} DMG
                            </span>
                            <span className="text-[8px] text-slate-400 uppercase">
                              {isKo ? '받은 피해' : 'Taken'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tactics Tab */}
            {activeTab === 'tactics' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  <span className="flex items-center gap-1.5">
                    <Zap size={14} className="text-amber-400" />
                    {isKo ? '전술 보너스 및 발동 효과' : 'Tactical Bonuses & Effects'}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="bg-slate-900 border border-slate-800 rounded-sm p-3 space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-300 flex items-center gap-1.5">
                        <Zap size={13} className="text-yellow-400" />
                        {isKo ? '스피드 어택 (Speed Attack)' : 'Speed Attack'}
                      </span>
                      <span className={`text-[10px] font-bold ${summary.tacticalBonuses?.isSpeedAttack ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {summary.tacticalBonuses?.isSpeedAttack ? '+15% SNS' : '[미발동]'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-300 flex items-center gap-1.5">
                        <Trophy size={13} className="text-indigo-400" />
                        {isKo ? '언더독 역전 보너스 (Underdog)' : 'Underdog Bounty'}
                      </span>
                      <span className={`text-[10px] font-bold ${summary.tacticalBonuses?.isUnderdog ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {summary.tacticalBonuses?.isUnderdog ? '+20% SNS' : '[미발동]'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-300 flex items-center gap-1.5">
                        <Flame size={13} className="text-rose-400" />
                        {isKo ? '원소 상성 콤보 (Elemental Combo)' : 'Elemental Combo'}
                      </span>
                      <span className={`text-[10px] font-bold ${summary.tacticalBonuses?.isElementalCombo ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {summary.tacticalBonuses?.isElementalCombo ? '+15 SNS' : '[미발동]'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-300 flex items-center gap-1.5">
                        <Shield size={13} className="text-emerald-400" />
                        {isKo ? '철벽 방어자 (Ironclad Defender)' : 'Ironclad Defender'}
                      </span>
                      <span className={`text-[10px] font-bold ${summary.tacticalBonuses?.isIronclad ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {summary.tacticalBonuses?.isIronclad ? '+20 SNS' : '[미발동]'}
                      </span>
                    </div>

                    {summary.tacticalBonuses?.isGoblin && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-300 flex items-center gap-1.5">
                          <Coins size={13} className="text-amber-400" />
                          {isKo ? '보물 고블린 포획 (Loot Goblin)' : 'Loot Goblin Bounty'}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-400">+25 SNS</span>
                      </div>
                    )}

                    {summary.tacticalBonuses?.isManaSpring && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-300 flex items-center gap-1.5">
                          <Sparkles size={13} className="text-cyan-400" />
                          {isKo ? '마나샘 점령 (Mana Spring)' : 'Mana Spring Captured'}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-400">+10 SNS</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Action Buttons */}
          <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-900 flex flex-col sm:flex-row gap-2 shrink-0 relative z-20">
            {/* Share Button */}
            <button
              type="button"
              onClick={handleShare}
              className={`flex-1 min-h-[44px] py-2.5 px-3 rounded-sm text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                shared 
                  ? 'bg-emerald-950 border-emerald-500 text-emerald-300' 
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
              }`}
              id="btn-share-battle-summary"
            >
              {shared ? <Check size={15} className="text-emerald-400" /> : <Share2 size={15} className="text-indigo-400" />}
              <span>{shared ? (isKo ? '피드 공유 완료!' : 'Shared to Feed!') : (isKo ? '피드 공유' : 'Share Feed')}</span>
            </button>

            {/* Quick Rematch */}
            {onRematch && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onRematch();
                }}
                className="flex-1 min-h-[44px] py-2.5 px-3 rounded-sm bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-indigo-500"
                id="btn-rematch-battle-summary"
              >
                <RotateCcw size={15} />
                <span>{isKo ? '다시 대전' : 'Rematch'}</span>
              </button>
            )}

            {/* Resume Auto Battle */}
            {onResumeAutoBattle && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onResumeAutoBattle();
                }}
                className="flex-1 min-h-[44px] py-2.5 px-3 rounded-sm bg-amber-600 hover:bg-amber-500 text-slate-950 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-amber-400"
                id="btn-resume-auto-battle-summary"
              >
                <Bot size={15} />
                <span>{isKo ? '자동전투 시작' : 'Auto Battle'}</span>
              </button>
            )}

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] py-2.5 px-4 rounded-sm bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
              id="btn-close-footer-battle-summary"
            >
              {isKo ? '닫기' : 'Close'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
