import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Zap, Sparkles, ArrowUpRight, Coins, ChevronDown, ChevronUp, Share2, Check, Layers, Shield, Flame, BarChart3, UserPlus, UserCheck, Eye, User, X } from 'lucide-react';
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
  totalDamageReceived?: number;
  leveledUpCards: LeveledUpCardInfo[];
  allDeckCardsProgress?: LeveledUpCardInfo[];
  usedCards?: CardData[];
  battleType?: string;
  language?: string;
  className?: string;
  isSpeedAttackBonus?: boolean;
  isUnderdogBonus?: boolean;
  isGoblinBonus?: boolean;
  isManaSpringBonus?: boolean;
  isElementalComboBonus?: boolean;
  isIroncladBonus?: boolean;
  opponentName?: string;
  opponentAvatar?: string;
  opponentUid?: string;
  opponentLevel?: number;
  opponentWinRate?: string;
  opponentMainCardTitle?: string;
  onShareToCommunity?: () => void;
  onOpenDetailedSummary?: () => void;
  onAddFriend?: (uid: string, name: string) => void;
}

export const BattleResultPanel: React.FC<BattleResultPanelProps> = ({
  result,
  snsEarned,
  totalDamageDealt,
  totalDamageReceived = 0,
  leveledUpCards,
  allDeckCardsProgress = [],
  usedCards = [],
  language = 'ko',
  className = '',
  isSpeedAttackBonus = false,
  isUnderdogBonus = false,
  isGoblinBonus = false,
  isManaSpringBonus = false,
  isElementalComboBonus = false,
  isIroncladBonus = false,
  opponentName,
  opponentAvatar,
  opponentUid,
  opponentLevel = 15,
  opponentWinRate = '68.4%',
  opponentMainCardTitle,
  onShareToCommunity,
  onOpenDetailedSummary,
  onAddFriend
}) => {
  const isKo = language === 'ko';
  const [showRewardsDetail, setShowRewardsDetail] = useState(false);
  const [shared, setShared] = useState(false);
  const [friendRequested, setFriendRequested] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const displayOpponentName = opponentName || (isKo ? '라이벌 사령관' : 'Rival Commander');
  const displayOpponentUid = opponentUid || 'rival_' + Math.floor(1000 + Math.random() * 9000);

  const handleAddFriendClick = () => {
    if (friendRequested) return;
    try {
      const savedFriendsStr = localStorage.getItem('hero_friends') || '[]';
      const friendsList = JSON.parse(savedFriendsStr);
      if (!friendsList.some((f: any) => f.uid === displayOpponentUid || f.name === displayOpponentName)) {
        friendsList.push({
          uid: displayOpponentUid,
          name: displayOpponentName,
          avatar: opponentAvatar || 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=100&auto=format&fit=crop&q=80',
          level: opponentLevel,
          battles: 1,
          lastBattle: Date.now(),
          status: 'pending_request'
        });
        localStorage.setItem('hero_friends', JSON.stringify(friendsList));
      }
    } catch (e) {
      console.error(e);
    }
    if (onAddFriend) {
      onAddFriend(displayOpponentUid, displayOpponentName);
    }
    setFriendRequested(true);
  };

  const totalExchange = Math.max(1, totalDamageDealt + totalDamageReceived);
  const playerDmgPercent = Math.round((totalDamageDealt / totalExchange) * 100);
  const aiDmgPercent = 100 - playerDmgPercent;

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
      className={`w-full bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-4 font-mono text-left shadow-lg backdrop-blur-md [contain:paint] [transform:translate3d(0,0,0)] [will-change:transform,opacity] ${className}`}
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

      {/* Opponent Nameplate & Quick Social Actions (ID 53) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between gap-2 shadow-inner">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-full overflow-hidden border border-amber-500/40 bg-slate-800 shrink-0 flex items-center justify-center">
            {opponentAvatar ? (
              <img src={opponentAvatar} alt={displayOpponentName} className="w-full h-full object-cover" />
            ) : (
              <User size={16} className="text-amber-400" />
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1">
              <span className="text-xs font-black text-slate-200 truncate">{displayOpponentName}</span>
              <span className="text-[9px] text-amber-400 font-bold shrink-0">Lv.{opponentLevel}</span>
            </div>
            <span className="text-[9px] text-slate-400 font-mono">
              {isKo ? `승률 ${opponentWinRate}` : `Win Rate ${opponentWinRate}`}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleAddFriendClick}
            disabled={friendRequested}
            className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 border transition-all cursor-pointer ${
              friendRequested
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300 opacity-80 cursor-default'
                : 'bg-slate-800 hover:bg-slate-750 border-slate-700 text-slate-200 active:scale-95'
            }`}
          >
            {friendRequested ? (
              <>
                <UserCheck size={12} className="text-emerald-400" />
                <span>{isKo ? '신청완료' : 'Requested'}</span>
              </>
            ) : (
              <>
                <UserPlus size={12} className="text-blue-400" />
                <span>{isKo ? '친구 신청' : 'Add Friend'}</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setShowProfileModal(true)}
            className="px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 flex items-center gap-1 transition-all cursor-pointer active:scale-95"
          >
            <Eye size={12} className="text-amber-400" />
            <span>{isKo ? '프로필' : 'Inspect'}</span>
          </button>
        </div>
      </div>

      {/* Bonus Badges: Speed Attack / Underdog / Loot Goblin / Mana Spring / Elemental Combo / Ironclad Defender */}
      {(isSpeedAttackBonus || isUnderdogBonus || isGoblinBonus || isManaSpringBonus || isElementalComboBonus || isIroncladBonus) && (
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
          {isManaSpringBonus && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-cyan-950/60 border border-cyan-500/50 text-cyan-300 text-[10px] font-mono font-bold rounded-sm">
              <Sparkles size={11} className="text-cyan-400 animate-spin" />
              {isKo ? '[ 💧 마나샘 점령 +10 SNS ]' : '[ 💧 MANA SPRING +10 SNS ]'}
            </span>
          )}
          {isElementalComboBonus && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-950/60 border border-rose-500/50 text-rose-300 text-[10px] font-mono font-bold rounded-sm">
              <Zap size={11} className="text-rose-400 animate-pulse" />
              {isKo ? '[ 🔥 원소 콤보 마스터 +15 SNS ]' : '[ 🔥 ELEMENTAL COMBO +15 SNS ]'}
            </span>
          )}
          {isIroncladBonus && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-[10px] font-mono font-bold rounded-sm">
              <Shield size={11} className="text-emerald-400" />
              {isKo ? '[ 🛡️ 철벽 방어자 상급 룬 +20 SNS ]' : '[ 🛡️ IRONCLAD DEFENDER +20 SNS ]'}
            </span>
          )}
        </div>
      )}

      {/* Metrics Row: 1. SNS Points Gained  |  2. Total Damage Dealt & Received */}
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2.5">
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
            <p className="text-[9px] text-slate-400 mt-1 font-sans truncate">
              {result === 'win' 
                ? (isKo ? '승리 보상 지급 완료' : 'Victory reward added') 
                : (isKo ? '전투참여 보상' : 'Participation reward')}
            </p>
          </div>

          {/* Combat Damage Exchange (Dealt vs Received) */}
          <div className="bg-gradient-to-br from-indigo-500/10 via-slate-950 to-slate-900 border border-indigo-500/30 rounded-xl p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[10px] font-bold text-indigo-400/80 uppercase">
              <span>{isKo ? '전투 공방 데미지' : 'Damage Exchange'}</span>
              <Zap size={14} className="text-indigo-400 animate-pulse" />
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <div>
                <span className="text-lg font-black text-indigo-300">
                  {totalDamageDealt.toLocaleString()}
                </span>
                <span className="text-[9px] font-extrabold text-indigo-400 ml-0.5">DMG</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-black text-rose-400">
                  -{totalDamageReceived.toLocaleString()}
                </span>
                <span className="text-[8px] font-extrabold text-rose-500 ml-0.5">DMG</span>
              </div>
            </div>
            {/* Mini distribution bar */}
            <div className="mt-1.5 space-y-1">
              <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden flex border border-slate-800">
                <div 
                  className="h-full bg-indigo-500 rounded-l-full" 
                  style={{ width: `${playerDmgPercent}%` }}
                />
                <div 
                  className="h-full bg-rose-500 rounded-r-full" 
                  style={{ width: `${aiDmgPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-[8px] text-slate-400">
                <span>{isKo ? '가한 데미지' : 'Dealt'} {playerDmgPercent}%</span>
                <span>{isKo ? '받은 피해' : 'Taken'} {aiDmgPercent}%</span>
              </div>
            </div>
          </div>
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

      {/* Action Buttons: Deep Battle Summary & Share to Community */}
      <div className="pt-0.5 space-y-1.5">
        {onOpenDetailedSummary && (
          <button
            type="button"
            onClick={onOpenDetailedSummary}
            className="w-full py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer border shadow-sm active:scale-95 bg-indigo-600 hover:bg-indigo-500 border-indigo-400 text-white"
          >
            <BarChart3 size={14} />
            <span>{isKo ? '📊 전투 상세 사후 분석 (Post-Battle Summary)' : '📊 Post-Battle Deep Summary'}</span>
          </button>
        )}

        <button
          type="button"
          onClick={handleShareClick}
          className={`w-full py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer border shadow-sm active:scale-95 ${
            shared 
              ? 'bg-emerald-900/60 border-emerald-500/50 text-emerald-300' 
              : 'bg-indigo-950/40 hover:bg-indigo-900/50 border-indigo-500/30 text-indigo-200'
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

      {/* Opponent Profile Modal Overlay (ID 53) */}
      <AnimatePresence>
        {showProfileModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowProfileModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl p-5 space-y-4 font-mono text-left shadow-2xl"
            >
              {/* Modal Header */}
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <User size={18} className="text-amber-400" />
                  <span className="text-sm font-black text-slate-100 uppercase tracking-wider">
                    {isKo ? '상대 프로필 조회' : 'Opponent Profile'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Opponent Avatar & Level Info */}
              <div className="flex items-center gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-amber-500/50 bg-slate-800 shrink-0 flex items-center justify-center">
                  {opponentAvatar ? (
                    <img src={opponentAvatar} alt={displayOpponentName} className="w-full h-full object-cover" />
                  ) : (
                    <User size={24} className="text-amber-400" />
                  )}
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-black text-slate-100 truncate">{displayOpponentName}</span>
                    <span className="text-[10px] text-amber-400 font-bold bg-amber-950/60 border border-amber-500/40 px-1.5 py-0.2 rounded-full">
                      Lv.{opponentLevel}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">UID: {displayOpponentUid}</span>
                </div>
              </div>

              {/* Stats Summary Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 flex flex-col">
                  <span className="text-[10px] text-slate-400">{isKo ? '전적 승률' : 'Win Rate'}</span>
                  <span className="text-sm font-black text-emerald-400">{opponentWinRate}</span>
                </div>
                <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 flex flex-col">
                  <span className="text-[10px] text-slate-400">{isKo ? '대표 에이스 카드' : 'Main Ace Card'}</span>
                  <span className="text-sm font-black text-amber-400 truncate">
                    {opponentMainCardTitle || (isKo ? '카단 (SSR)' : 'Kadan (SSR)')}
                  </span>
                </div>
              </div>

              {/* Action Buttons in Modal */}
              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={handleAddFriendClick}
                  disabled={friendRequested}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                    friendRequested
                      ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300 opacity-80 cursor-default'
                      : 'bg-blue-600 hover:bg-blue-500 border-blue-400 text-white active:scale-95'
                  }`}
                >
                  {friendRequested ? (
                    <>
                      <UserCheck size={14} className="text-emerald-400" />
                      <span>{isKo ? '친구 신청 완료' : 'Friend Requested'}</span>
                    </>
                  ) : (
                    <>
                      <UserPlus size={14} />
                      <span>{isKo ? '친구 신청' : 'Add Friend'}</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className="py-2.5 px-4 rounded-xl text-xs font-black uppercase bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-all cursor-pointer"
                >
                  {isKo ? '닫기' : 'Close'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
