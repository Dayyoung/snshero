import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Trophy, Zap, Sparkles, ArrowUpRight, Coins, ChevronDown, ChevronUp, Share2, Check, Layers } from 'lucide-react';
import { CardData } from '../types';
import { getCardSpriteStyle } from '../lib/utils';

export interface LeveledUpCardInfo {
  card: CardData;
  oldLevel: number;
  newLevel: number;
  xpGained: number;
  currentXp: number;
  nextLevelXp: number;
  statBoost?: number;
}

export interface BattleResultPanelProps {
  result: 'win' | 'loss' | 'draw';
  snsEarned: number;
  totalDamageDealt: number;
  leveledUpCards: LeveledUpCardInfo[];
  allDeckCardsProgress?: LeveledUpCardInfo[];
  usedCards?: CardData[];
  battleType?: string;
  language?: string;
  className?: string;
  isSpeedAttackBonus?: boolean;
  isUnderdogBonus?: boolean;
  isGoblinBonus?: boolean;
  onShareToCommunity?: () => void;
}

export const BattleResultPanel: React.FC<BattleResultPanelProps> = ({
  result,
  snsEarned,
  totalDamageDealt,
  leveledUpCards,
  allDeckCardsProgress = [],
  usedCards = [],
  language = 'ko',
  className = '',
  isSpeedAttackBonus = false,
  isUnderdogBonus = false,
  isGoblinBonus = false,
  onShareToCommunity
}) => {
  const isKo = language === 'ko';
  const [showRewardsDetail, setShowRewardsDetail] = useState(false);
  const [shared, setShared] = useState(false);

  const handleShareClick = () => {
    if (onShareToCommunity) {
      onShareToCommunity();
    } else {
      // Local fallback share logic
      try {
        const battleSummaryPost = {
          id: 'post_battle_' + Date.now(),
          type: 'battle_result',
          result,
          snsEarned,
          totalDamageDealt,
          cardCount: usedCards.length,
          timestamp: Date.now(),
          author: localStorage.getItem('hero_user_name') || 'Hero',
          content: isKo
            ? `🔥 전투 완료! [${result === 'win' ? 'VICTORY 승리' : 'DEFEAT'}] 입힌 데미지: ${totalDamageDealt.toLocaleString()} DMG | 보상: +${snsEarned} SNS`
            : `🔥 Battle Finished! [${result === 'win' ? 'VICTORY' : 'DEFEAT'}] Damage: ${totalDamageDealt.toLocaleString()} DMG | Reward: +${snsEarned} SNS`
        };
        localStorage.setItem('hero_community_pvp_post_id', JSON.stringify(battleSummaryPost));
      } catch (e) {
        console.error(e);
      }
    }
    setShared(true);
    setTimeout(() => setShared(false), 3000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`w-full bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-4 font-mono text-left shadow-lg backdrop-blur-md ${className}`}
    >
      {/* Header Badge */}
      <div className="flex justify-between items-center border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-400 animate-pulse" />
          <span className="text-xs font-black uppercase tracking-wider text-slate-200">
            {isKo ? '전투 결과 요약 (Battle Result)' : 'Battle Result Summary'}
          </span>
        </div>
        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded border uppercase ${
          result === 'win' 
            ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400' 
            : result === 'loss'
            ? 'bg-rose-950/60 border-rose-500/40 text-rose-400'
            : 'bg-amber-950/60 border-amber-500/40 text-amber-400'
        }`}>
          {result === 'win' ? (isKo ? 'VICTORY 승리' : 'VICTORY') : result === 'loss' ? (isKo ? 'DEFEAT 패배' : 'DEFEAT') : (isKo ? 'DRAW 무승부' : 'DRAW')}
        </span>
      </div>

      {/* Bonus Badges: Speed Attack / Underdog / Loot Goblin */}
      {(isSpeedAttackBonus || isUnderdogBonus || isGoblinBonus) && (
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {isSpeedAttackBonus && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-950/60 border border-yellow-500/50 text-yellow-300 text-[10px] font-mono font-bold rounded-sm">
              <Zap size={11} className="text-yellow-400 animate-pulse" />
              {isKo ? '[ ⚡ 스피드 어택 +15% ]' : '[ ⚡ SPEED ATTACK +15% ]'}
            </span>
          )}
          {isUnderdogBonus && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-950/60 border border-indigo-500/50 text-indigo-300 text-[10px] font-mono font-bold rounded-sm">
              <Trophy size={11} className="text-indigo-400" />
              {isKo ? '[ 🏆 언더독 역전 보너스 +20% ]' : '[ 🏆 UNDERDOG BOUNTY +20% ]'}
            </span>
          )}
          {isGoblinBonus && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-950/60 border border-amber-500/50 text-amber-300 text-[10px] font-mono font-bold rounded-sm">
              <Coins size={11} className="text-amber-400 animate-bounce" />
              {isKo ? '[ 💰 보물 고블린 포획 +25 SNS ]' : '[ 💰 LOOT GOBLIN +25 SNS ]'}
            </span>
          )}
        </div>
      )}

      {/* Metrics Row: 1. SNS Points Gained  |  2. Total Damage Dealt */}
      <div className="grid grid-cols-2 gap-3">
        {/* SNS Points Gained */}
        <div className="bg-gradient-to-br from-amber-500/10 via-amber-950/20 to-slate-900 border border-amber-500/30 rounded-xl p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-bold text-amber-400/80 uppercase">
            <span>{isKo ? '획득 보상 (Rewards)' : 'Rewards Earned'}</span>
            <Coins size={14} className="text-amber-400" />
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-black text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.3)]">
              +{snsEarned.toLocaleString()}
            </span>
            <span className="text-[10px] font-extrabold text-amber-300/80">SNS</span>
          </div>
          <p className="text-[9px] text-slate-400 mt-1 font-sans">
            {result === 'win' 
              ? (isKo ? '승리 보상 지급 완료' : 'Victory reward added') 
              : (isKo ? '전투참여 보상' : 'Participation reward')}
          </p>
        </div>

        {/* Total Damage Dealt */}
        <div className="bg-gradient-to-br from-indigo-500/10 via-indigo-950/20 to-slate-900 border border-indigo-500/30 rounded-xl p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-bold text-indigo-400/80 uppercase">
            <span>{isKo ? '총 입힌 데미지' : 'Total Damage Dealt'}</span>
            <Zap size={14} className="text-indigo-400 animate-bounce" />
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-black text-indigo-300 drop-shadow-[0_0_10px_rgba(129,140,248,0.3)]">
              {totalDamageDealt.toLocaleString()}
            </span>
            <span className="text-[10px] font-extrabold text-indigo-400">DMG</span>
          </div>
          <p className="text-[9px] text-slate-400 mt-1 font-sans">
            {isKo ? '카드 파워 및 타격 합산' : 'Total attack damage dealt'}
          </p>
        </div>
      </div>

      {/* Cards Used List */}
      {usedCards && usedCards.length > 0 && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-300 uppercase tracking-wider">
            <div className="flex items-center gap-1.5">
              <Layers size={13} className="text-indigo-400" />
              <span>{isKo ? '출전 카드 (Cards Used)' : 'Cards Used'}</span>
            </div>
            <span className="text-[9px] text-slate-400 font-mono">[{usedCards.length} Cards]</span>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            {usedCards.slice(0, 5).map((card, idx) => {
              const cardIdNum = Number(card.id) || (idx + 1);
              return (
                <div 
                  key={card.id || `used-card-${idx}`}
                  className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-750 px-2 py-1 rounded-lg text-[10px]"
                >
                  <div 
                    className="w-5 h-5 rounded shrink-0 border border-slate-700 bg-slate-900"
                    style={getCardSpriteStyle(cardIdNum)}
                  />
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-200 truncate max-w-[80px]">
                      {isKo ? (card.title || '카드') : (card.title_en || card.title || 'Card')}
                    </span>
                    <span className="text-[8px] text-amber-400/90">
                      Lv.{card.level || 1} · {card.power || (card.attack ? card.attack * 10 : 100)}⚡
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Share to Community Feed Button */}
      <div className="pt-0.5">
        <button
          type="button"
          onClick={handleShareClick}
          className={`w-full py-2.5 px-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer border shadow-sm active:scale-95 ${
            shared 
              ? 'bg-emerald-900/60 border-emerald-500/50 text-emerald-300' 
              : 'bg-indigo-600/30 hover:bg-indigo-600/50 border-indigo-500/40 text-indigo-200'
          }`}
        >
          {shared ? (
            <>
              <Check size={14} className="text-emerald-400" />
              <span>{isKo ? '✓ 커뮤니티 피드에 공유 완료!' : '✓ Shared to Community Feed!'}</span>
            </>
          ) : (
            <>
              <Share2 size={14} className="text-indigo-400" />
              <span>{isKo ? '📢 커뮤니티 피드에 결과 공유 (Share)' : '📢 Share Result to Community Feed'}</span>
            </>
          )}
        </button>
      </div>

      {/* Collapsible View Rewards Detail Button (ID 99) */}
      <div className="pt-1">
        <button
          onClick={() => setShowRewardsDetail(!showRewardsDetail)}
          className="w-full py-2 px-3 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-xl text-xs font-bold text-purple-300 flex items-center justify-between transition-all cursor-pointer"
        >
          <div className="flex items-center gap-1.5">
            <Sparkles size={14} className="text-purple-400" />
            <span>{isKo ? '보상 상세 내역 보기' : 'View Rewards Detail'}</span>
            {leveledUpCards.length > 0 && (
              <span className="bg-purple-600 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full">
                +{leveledUpCards.length}
              </span>
            )}
          </div>
          {showRewardsDetail ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {showRewardsDetail && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2 bg-slate-900/90 border border-slate-800 rounded-xl p-3 space-y-2.5 overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-black text-purple-300 uppercase">
                <Sparkles size={14} className="text-purple-400 animate-spin" />
                <span>{isKo ? '카드 레벨업 & EXP 성과' : 'Card Level Up & EXP Details'}</span>
              </div>
            </div>

            {leveledUpCards.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {leveledUpCards.map((item, idx) => (
                  <motion.div
                    key={item.card.id || `lvl-${idx}`}
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: idx * 0.1 }}
                    className="bg-purple-950/40 border border-purple-500/40 rounded-lg p-2.5 flex items-center justify-between gap-3 shadow-inner"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-11 bg-slate-950 border border-purple-400/50 rounded flex items-center justify-center shrink-0 relative overflow-hidden">
                        <span className="text-[9px] font-extrabold text-amber-300">
                          {(item.card.title || 'CARD').slice(0, 2)}
                        </span>
                        <div className="absolute top-0 right-0 bg-purple-600 text-white text-[7px] font-black px-1 rounded-bl">
                          Lv.{item.newLevel}
                        </div>
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-black text-white truncate flex items-center gap-1">
                          <span>{isKo ? (item.card.title || '카드') : (item.card.title_en || item.card.title_dis || item.card.title || 'Card')}</span>
                          <Sparkles size={10} className="text-yellow-400 shrink-0" />
                        </div>
                        <div className="text-[9px] font-bold text-purple-300 flex items-center gap-1 mt-0.5">
                          <span className="line-through text-slate-500">Lv.{item.oldLevel}</span>
                          <ArrowUpRight size={10} className="text-emerald-400" />
                          <span className="text-emerald-400 font-extrabold">Lv.{item.newLevel}</span>
                          {item.statBoost && (
                            <span className="text-amber-400 text-[8px] ml-1 bg-amber-950/80 px-1 rounded border border-amber-500/30">
                              +{item.statBoost} STATS
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="bg-emerald-500 text-slate-950 text-[9px] font-black px-2 py-1 rounded shadow-sm block">
                        LEVEL UP!
                      </span>
                      <span className="text-[8px] font-bold text-slate-400 block mt-0.5">
                        +{item.xpGained} XP
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              /* Show XP Progress for Deck Cards when no card leveled up */
              <div className="space-y-2">
                <p className="text-[10px] text-slate-400 italic">
                  {isKo ? '참여 카드 성장이 축적되었습니다 (+50 XP):' : 'Participating cards gained +50 XP:'}
                </p>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {(allDeckCardsProgress.length > 0 ? allDeckCardsProgress : []).slice(0, 3).map((item, idx) => {
                    const percent = Math.min(100, Math.round((item.currentXp / Math.max(1, item.nextLevelXp)) * 100));
                    return (
                      <div key={item.card.id || `card-prog-${idx}`} className="bg-slate-950/60 border border-slate-800 rounded p-2 text-[10px]">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-extrabold text-slate-300 truncate max-w-[140px]">
                            {isKo ? (item.card.title || '카드') : (item.card.title_en || item.card.title || 'Card')}
                          </span>
                          <span className="font-bold text-amber-400 text-[9px]">
                            Lv.{item.card.level || 1} ({item.currentXp}/{item.nextLevelXp} XP)
                          </span>
                        </div>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full transition-all duration-500" 
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};
