import React, { useState, useEffect } from 'react';
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
  ArrowUpRight,
  Swords,
  ShieldAlert,
  Award
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
  playerCards?: BattleCardStats[];
  opponentCards?: BattleCardStats[];
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

export interface PostBattleSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  summaryData?: LastBattleSummaryData | null;
  language?: string;
  onRematch?: () => void;
  onResumeAutoBattle?: () => void;
  onShareToCommunity?: () => void;
}

export const PostBattleSummaryModal: React.FC<PostBattleSummaryModalProps> = ({
  isOpen,
  onClose,
  summaryData: propSummaryData,
  language = 'ko',
  onRematch,
  onResumeAutoBattle,
  onShareToCommunity
}) => {
  const isKo = language === 'ko';
  const [data, setData] = useState<LastBattleSummaryData | null>(null);
  const [shared, setShared] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'cards' | 'tactics'>('overview');

  // Load from props or localStorage
  useEffect(() => {
    if (propSummaryData) {
      setData(propSummaryData);
    } else if (isOpen) {
      try {
        const saved = localStorage.getItem('hero_last_ai_battle_summary');
        if (saved) {
          setData(JSON.parse(saved));
        }
      } catch (e) {
        console.error('Failed to load last battle summary:', e);
      }
    }
  }, [propSummaryData, isOpen]);

  if (!isOpen) return null;

  // Fallback default data if no prior battle summary exists
  const summary: LastBattleSummaryData = data || {
    id: 'default-battle',
    timestamp: Date.now(),
    battleType: 'robot',
    isAutoBattle: true,
    opponent: {
      name: 'AI Combat Bot',
      totalPower: 350
    },
    player: {
      name: localStorage.getItem('hero_user_name') || 'Hero',
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
    tacticalBonuses: {
      isSpeedAttack: true,
      isElementalCombo: true
    }
  };

  const damageRatio = summary.totalDamageReceived > 0 
    ? (summary.totalDamageDealt / summary.totalDamageReceived).toFixed(2) 
    : summary.totalDamageDealt > 0 ? '9.99' : '1.00';

  const totalExchange = Math.max(1, summary.totalDamageDealt + summary.totalDamageReceived);
  const playerDmgPercent = Math.round((summary.totalDamageDealt / totalExchange) * 100);
  const aiDmgPercent = 100 - playerDmgPercent;

  // Grade calculation if missing
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
          author: localStorage.getItem('hero_user_name') || 'Hero',
          content: isKo
            ? `🤖 AI 전투 요약 [${summary.result === 'win' ? 'VICTORY 승리' : 'DEFEAT 패배'}] 입힌 데미지: ${summary.totalDamageDealt.toLocaleString()} DMG | 받은 피해: ${summary.totalDamageReceived.toLocaleString()} DMG (효율: ${damageRatio}x) | 보상: +${summary.snsEarned} SNS`
            : `🤖 AI Battle Summary [${summary.result === 'win' ? 'VICTORY' : 'DEFEAT'}] Damage Dealt: ${summary.totalDamageDealt.toLocaleString()} DMG | Received: ${summary.totalDamageReceived.toLocaleString()} DMG (Ratio: ${damageRatio}x) | Reward: +${summary.snsEarned} SNS`
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

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[250] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto font-mono">
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[92vh]"
          id="post-battle-summary-dialog"
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/90 shrink-0">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-400" />
              <div>
                <h3 className="text-xs sm:text-sm font-black tracking-wider uppercase text-white flex items-center gap-1.5">
                  <span>{isKo ? 'AI 전투 사후 분석 요약' : 'Post-Battle Combat Summary'}</span>
                  {summary.isAutoBattle && (
                    <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] px-1.5 py-0.5 rounded font-bold">
                      [AUTO]
                    </span>
                  )}
                </h3>
                <p className="text-[9px] text-slate-400">{formattedDate}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          {/* Result Banner */}
          <div className={`px-4 py-3 flex items-center justify-between border-b ${
            summary.result === 'win'
              ? 'bg-emerald-950/40 border-emerald-500/30'
              : summary.result === 'loss'
              ? 'bg-rose-950/40 border-rose-500/30'
              : 'bg-amber-950/40 border-amber-500/30'
          }`}>
            <div className="flex items-center gap-2.5">
              <div className={`p-2 rounded-xl border ${
                summary.result === 'win'
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                  : summary.result === 'loss'
                  ? 'bg-rose-500/20 border-rose-500/50 text-rose-400'
                  : 'bg-amber-500/20 border-amber-500/50 text-amber-400'
              }`}>
                {summary.result === 'win' ? <Trophy size={20} /> : summary.result === 'loss' ? <ShieldAlert size={20} /> : <Swords size={20} />}
              </div>
              <div>
                <div className={`text-base sm:text-lg font-black uppercase tracking-tight ${
                  summary.result === 'win' ? 'text-emerald-400' : summary.result === 'loss' ? 'text-rose-400' : 'text-amber-400'
                }`}>
                  {summary.result === 'win' 
                    ? (isKo ? '승리 (VICTORY)' : 'VICTORY') 
                    : summary.result === 'loss' 
                    ? (isKo ? '패배 (DEFEAT)' : 'DEFEAT') 
                    : (isKo ? '무승부 (DRAW)' : 'DRAW')}
                </div>
                <p className="text-[10px] text-slate-400">
                  {summary.player.name} ({summary.boardScore.player}) vs ({summary.boardScore.ai}) {summary.opponent.name}
                </p>
              </div>
            </div>

            {/* Combat Grade Badge */}
            <div className="flex flex-col items-end">
              <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">{isKo ? '전투 성과' : 'GRADE'}</span>
              <div className="flex items-center gap-1">
                <span className="text-xl sm:text-2xl font-black text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]">
                  {calculatedGrade}
                </span>
                <Award size={16} className="text-amber-400" />
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-800 bg-slate-900/60 shrink-0 text-xs">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex-1 py-2 text-center font-bold transition-colors cursor-pointer border-b-2 ${
                activeTab === 'overview'
                  ? 'border-indigo-500 text-indigo-300 bg-indigo-950/20'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {isKo ? '📊 데미지/성과 분석' : '📊 Damage & Stats'}
            </button>
            <button
              onClick={() => setActiveTab('cards')}
              className={`flex-1 py-2 text-center font-bold transition-colors cursor-pointer border-b-2 ${
                activeTab === 'cards'
                  ? 'border-indigo-500 text-indigo-300 bg-indigo-950/20'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {isKo ? '🃏 출전 카드 기여도' : '🃏 Card Breakdown'}
            </button>
            <button
              onClick={() => setActiveTab('tactics')}
              className={`flex-1 py-2 text-center font-bold transition-colors cursor-pointer border-b-2 ${
                activeTab === 'tactics'
                  ? 'border-indigo-500 text-indigo-300 bg-indigo-950/20'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {isKo ? '⚡ 전술/보너스' : '⚡ Tactical Bonuses'}
            </button>
          </div>

          {/* Scrollable Content Area */}
          <div className="p-4 space-y-4 overflow-y-auto flex-1 text-left">
            {activeTab === 'overview' && (
              <div className="space-y-4">
                {/* Primary Damage Exchange Metrics (Total Damage Dealt vs Received) */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 space-y-3 shadow-inner">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                    <span className="flex items-center gap-1.5">
                      <Swords size={14} className="text-amber-400" />
                      {isKo ? '전투 공방 데미지 비교 (Damage Exchange)' : 'Combat Damage Exchange'}
                    </span>
                    <span className="text-[10px] text-indigo-400 font-mono">
                      {damageRatio}x {isKo ? '교환비' : 'Ratio'}
                    </span>
                  </div>

                  {/* 2-Column Damage Box */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* 1. Total Damage Dealt */}
                    <div className="bg-gradient-to-br from-indigo-500/15 via-indigo-950/40 to-slate-950 border border-indigo-500/40 rounded-xl p-3 flex flex-col justify-between">
                      <div className="flex items-center justify-between text-[10px] font-bold text-indigo-300 uppercase">
                        <span>{isKo ? '💥 총 입힌 데미지' : '💥 Damage Dealt'}</span>
                        <Zap size={14} className="text-indigo-400 animate-pulse" />
                      </div>
                      <div className="my-1">
                        <span className="text-2xl font-black text-indigo-300 drop-shadow-[0_0_10px_rgba(129,140,248,0.4)]">
                          {summary.totalDamageDealt.toLocaleString()}
                        </span>
                        <span className="text-[10px] font-extrabold text-indigo-400 ml-1">DMG</span>
                      </div>
                      <div className="text-[9px] text-slate-400">
                        {playerDmgPercent}% {isKo ? '전체 화력 기여' : 'of total exchange'}
                      </div>
                    </div>

                    {/* 2. Total Damage Received */}
                    <div className="bg-gradient-to-br from-rose-500/15 via-rose-950/40 to-slate-950 border border-rose-500/40 rounded-xl p-3 flex flex-col justify-between">
                      <div className="flex items-center justify-between text-[10px] font-bold text-rose-300 uppercase">
                        <span>{isKo ? '🛡️ 총 받은 피해량' : '🛡️ Damage Received'}</span>
                        <Flame size={14} className="text-rose-400" />
                      </div>
                      <div className="my-1">
                        <span className="text-2xl font-black text-rose-300 drop-shadow-[0_0_10px_rgba(244,63,94,0.4)]">
                          {summary.totalDamageReceived.toLocaleString()}
                        </span>
                        <span className="text-[10px] font-extrabold text-rose-400 ml-1">DMG</span>
                      </div>
                      <div className="text-[9px] text-slate-400">
                        {aiDmgPercent}% {isKo ? '상대 타격 흡수' : 'absorbed from AI'}
                      </div>
                    </div>
                  </div>

                  {/* Damage Distribution Bar */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase">
                      <span className="text-indigo-400">YOU: {summary.totalDamageDealt} DMG ({playerDmgPercent}%)</span>
                      <span className="text-rose-400">AI: {summary.totalDamageReceived} DMG ({aiDmgPercent}%)</span>
                    </div>
                    <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden flex border border-slate-800 p-0.5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${playerDmgPercent}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 rounded-l-full"
                      />
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${aiDmgPercent}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className="h-full bg-gradient-to-r from-rose-500 to-rose-700 rounded-r-full"
                      />
                    </div>
                  </div>

                  {/* Net Damage Highlight */}
                  <div className="flex items-center justify-between px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-xs">
                    <span className="text-slate-400 font-bold">{isKo ? '순 데미지 마진 (Net Margin):' : 'Net Damage Margin:'}</span>
                    <span className={`font-black ${summary.netDamage >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {summary.netDamage >= 0 ? `+${summary.netDamage.toLocaleString()}` : summary.netDamage.toLocaleString()} DMG
                    </span>
                  </div>
                </div>

                {/* Rewards & Progression Earned */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                    <span className="flex items-center gap-1.5">
                      <Coins size={14} className="text-amber-400" />
                      {isKo ? '획득 보상 및 경험치 (Rewards & EXP)' : 'Rewards & EXP Acquired'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="bg-amber-950/20 border border-amber-500/30 rounded-lg p-2.5 flex items-center justify-between">
                      <div>
                        <span className="text-[9px] text-amber-400 uppercase font-bold block">{isKo ? 'SNS 포인트' : 'SNS Points'}</span>
                        <span className="text-xl font-black text-amber-300">+{summary.snsEarned}</span>
                      </div>
                      <Coins className="w-6 h-6 text-amber-400/60" />
                    </div>

                    <div className="bg-purple-950/20 border border-purple-500/30 rounded-lg p-2.5 flex items-center justify-between">
                      <div>
                        <span className="text-[9px] text-purple-400 uppercase font-bold block">{isKo ? '덱 EXP 획득' : 'Deck EXP'}</span>
                        <span className="text-xl font-black text-purple-300">+{summary.xpGained} XP</span>
                      </div>
                      <Sparkles className="w-6 h-6 text-purple-400/60" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Cards Breakdown Tab */}
            {activeTab === 'cards' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  <span className="flex items-center gap-1.5">
                    <Layers size={14} className="text-indigo-400" />
                    {isKo ? '히어로 카드별 전투 활약도' : 'Hero Cards Performance'}
                  </span>
                  <span className="text-[9px] text-slate-400 font-mono">
                    [{summary.playerCards?.length || 5} Cards]
                  </span>
                </div>

                {/* Card List with MVP highlight */}
                <div className="space-y-2">
                  {(summary.playerCards && summary.playerCards.length > 0 
                    ? summary.playerCards 
                    : [
                        { id: 1, title: '에일라', title_en: 'Ayla', level: 3, power: 120, damageDealt: 320, damageReceived: 80, isMvp: true },
                        { id: 2, title: '카단', title_en: 'Kadan', level: 2, power: 95, damageDealt: 210, damageReceived: 110 },
                        { id: 3, title: '발보', title_en: 'Valbo', level: 2, power: 85, damageDealt: 180, damageReceived: 90 },
                        { id: 4, title: '프레도', title_en: 'Fredo', level: 1, power: 70, damageDealt: 140, damageReceived: 140 }
                      ]
                  ).map((card, idx) => {
                    const cardIdNum = Number(card.id) || (idx + 1);
                    return (
                      <div 
                        key={card.id || `perf-card-${idx}`}
                        className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 text-xs ${
                          card.isMvp 
                            ? 'bg-amber-950/30 border-amber-500/50 shadow-sm' 
                            : 'bg-slate-900/80 border-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div 
                            className="w-10 h-10 rounded-lg shrink-0 border border-slate-700 bg-slate-950 relative overflow-hidden"
                            style={getCardSpriteStyle(cardIdNum)}
                          >
                            {card.isMvp && (
                              <span className="absolute top-0 right-0 bg-amber-500 text-slate-950 font-black text-[7px] px-1 rounded-bl">
                                MVP
                              </span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-extrabold text-slate-100 truncate flex items-center gap-1">
                              <span>{isKo ? card.title : (card.title_en || card.title)}</span>
                              <span className="text-[9px] text-amber-400">Lv.{card.level}</span>
                            </div>
                            <div className="text-[9px] text-slate-400">
                              {isKo ? '기본 파워:' : 'Power:'} {card.power}⚡
                            </div>
                          </div>
                        </div>

                        {/* Damage Contribution Stats */}
                        <div className="text-right shrink-0 flex items-center gap-3">
                          <div>
                            <span className="text-[9px] text-indigo-400 block font-bold">
                              +{card.damageDealt} DMG
                            </span>
                            <span className="text-[8px] text-slate-400">
                              {isKo ? '가한 타격' : 'Dealt'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[9px] text-rose-400 block font-bold">
                              -{card.damageReceived} DMG
                            </span>
                            <span className="text-[8px] text-slate-400">
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
                  <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 space-y-2">
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
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Action Buttons */}
          <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-900/90 flex flex-col sm:flex-row gap-2 shrink-0">
            {/* Share Button */}
            <button
              type="button"
              onClick={handleShare}
              className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                shared 
                  ? 'bg-emerald-900/60 border-emerald-500/50 text-emerald-300' 
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
              }`}
            >
              {shared ? <Check size={14} className="text-emerald-400" /> : <Share2 size={14} className="text-indigo-400" />}
              <span>{shared ? (isKo ? '공유 완료!' : 'Shared!') : (isKo ? '피드 공유' : 'Share Feed')}</span>
            </button>

            {/* Quick Rematch / Resume Auto */}
            {onRematch && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onRematch();
                }}
                className="flex-1 py-2.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md"
              >
                <RotateCcw size={14} />
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
                className="flex-1 py-2.5 px-3 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md"
              >
                <Bot size={14} />
                <span>{isKo ? '자동전투 시작' : 'Auto Battle'}</span>
              </button>
            )}

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
            >
              {isKo ? '닫기' : 'Close'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
