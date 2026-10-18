import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Zap, Sparkles, ArrowUpRight, Coins, ChevronDown, ChevronUp, Share2, Check, Layers, Shield, ShieldAlert, Flame, BarChart3, UserPlus, UserCheck, Eye, User, X } from 'lucide-react';
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
 opponentCards?: CardData[];
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
 opponentCards = [],
 onShareToCommunity,
 onOpenDetailedSummary,
 onAddFriend
}) => {
 const isKo = language === 'ko';
 const [showRewardsDetail, setShowRewardsDetail] = useState(false);
 const [shared, setShared] = useState(false);
 const [friendRequested, setFriendRequested] = useState(false);
 const [showProfileModal, setShowProfileModal] = useState(false);
 // ID 595: 상대 덱 복사 확인 팝업 상태
 const [showCopyDeckModal, setShowCopyDeckModal] = useState(false);
 const [copySuccessToast, setCopySuccessToast] = useState(false);

 // SCR-02 바이럴 도전장 URL 공유 상태 (일일 1회 hero_battle_result_share_${todayStr} +50 SNS 지급)
 const todayStr = new Date().toISOString().slice(0, 10);
 const battleShareStorageKey = `hero_battle_result_share_${todayStr}`;
 const [hasClaimedBattleShare, setHasClaimedBattleShare] = useState<boolean>(() => {
 try {
 return localStorage.getItem(`hero_battle_result_share_${new Date().toISOString().slice(0, 10)}`) === 'true';
 } catch {
 return false;
 }
 });
 const [challengeShareNotice, setChallengeShareNotice] = useState<string | null>(null);

 const handleShareChallengeUrl = () => {
 const deckIds = (usedCards && usedCards.length > 0
 ? usedCards.slice(0, 5).map(c => c.imageIndex !== undefined ? c.imageIndex : (Number(c.id) || 1))
 : [1, 11, 31, 51, 101]
 ).join('-');
 const challengeUrl = `https://snshero.com/?challenge=${deckIds}&ref=battle_result`;

 try {
 if (navigator.clipboard && navigator.clipboard.writeText) {
 navigator.clipboard.writeText(challengeUrl).catch(() => {});
 }
 } catch {}

 try {
 const alreadyClaimed = localStorage.getItem(battleShareStorageKey) === 'true';
 if (!alreadyClaimed) {
 localStorage.setItem(battleShareStorageKey, 'true');
 const currentSns = parseInt(localStorage.getItem('hero_sns') || '0', 10) || 0;
 const nextSns = currentSns + 50;
 localStorage.setItem('hero_sns', String(nextSns));
 localStorage.setItem('hero_sns_season1', String(nextSns));
 window.dispatchEvent(new Event('storage'));
 setHasClaimedBattleShare(true);
 setChallengeShareNotice(
 isKo
 ? '[+] 도전장 URL 클립보드 복사 완료 · 일일 보상 +50 SNS 즉시 지급됨'
 : '[+] Challenge URL copied · Daily +50 SNS reward granted'
 );
 } else {
 setChallengeShareNotice(
 isKo
 ? '[+] 도전장 URL 클립보드 복사 완료 (오늘의 +50 SNS 보상은 수령 완료)'
 : '[+] Challenge URL copied (Daily +50 SNS already claimed today)'
 );
 }
 } catch {
 setChallengeShareNotice(
 isKo
 ? '[+] 도전장 URL 클립보드 복사 완료'
 : '[+] Challenge URL copied to clipboard'
 );
 }
 setTimeout(() => setChallengeShareNotice(null), 3500);
 };

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

 // ID 595: 상대 덱 복사 검증 및 분석
 const userInventory = React.useMemo(() => {
 try {
 return JSON.parse(localStorage.getItem('hero_inventory') || '{}');
 } catch {
 return {};
 }
 }, []);

 const deckCopyAnalysis = React.useMemo(() => {
 if (!opponentCards || opponentCards.length === 0) return [];
 return opponentCards.slice(0, 5).map(c => {
 const imgIdx = c.imageIndex !== undefined ? c.imageIndex : (Number(c.id) || 1);
 const isOwned = Boolean(userInventory[imgIdx] && userInventory[imgIdx].quantity > 0);
 return { card: c, isOwned };
 });
 }, [opponentCards, userInventory]);

 const handleConfirmCopyDeck = () => {
 if (!opponentCards || opponentCards.length === 0) return;
 try {
 const newDeck = opponentCards.slice(0, 5).map(c => ({
 ...c,
 id: `deck-${c.id}-${Date.now()}`
 }));
 localStorage.setItem('hero_deck_player_v1', JSON.stringify(newDeck));
 window.dispatchEvent(new Event('snshero_deck_updated'));
 setCopySuccessToast(true);
 setTimeout(() => setCopySuccessToast(false), 2500);
 } catch (e) {
 console.error(e);
 }
 setShowCopyDeckModal(false);
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
 className={`w-full bg-[#fdfcfc] text-[#201d1d] border border-[rgba(15,0,0,0.12)] rounded-none p-4 sm:p-5 space-y-4 font-mono text-left [contain:paint] [transform:translate3d(0,0,0)] [will-change:transform,opacity] ${className}`}
 >
 {/* Header Badge */}
 <div className="flex justify-between items-center border-b border-[rgba(15,0,0,0.12)] pb-3">
 <div className="flex items-center gap-2">
 <Trophy className="w-4 h-4 text-[#201d1d]" />
 <span className="text-xs sm:text-sm font-bold uppercase tracking-tight text-[#201d1d]">
 {isKo ? '[ 전투 결과 요약 / BATTLE RESULT ]' : '[ BATTLE RESULT SUMMARY ]'}
 </span>
 </div>
 <span className={`text-xs font-bold px-2.5 py-1 rounded-sm border uppercase ${
 result === 'win'
 ? 'bg-[#201d1d] border-[#201d1d] text-[#fdfcfc]'
 : result === 'loss'
 ? 'bg-[#f1eeee] border-[#ff3b30] text-[#d70015]'
 : 'bg-[#f8f7f7] border-[rgba(15,0,0,0.12)] text-[#201d1d]'
 }`}>
 {result === 'win' ? (isKo ? '[VICTORY 승리]' : '[VICTORY]') : result === 'loss' ? (isKo ? '[DEFEAT 패배]' : '[DEFEAT]') : (isKo ? '[DRAW 무승부]' : '[DRAW]')}
 </span>
 </div>

 {/* Opponent Nameplate & Quick Social Actions (ID 53) */}
 <div className="bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] rounded-none p-3 flex flex-wrap items-center justify-between gap-2">
 <div className="flex items-center gap-2.5 min-w-0">
 <div className="w-9 h-9 rounded-none overflow-hidden border border-[rgba(15,0,0,0.12)] bg-[#f1eeee] shrink-0 flex items-center justify-center">
 {opponentAvatar ? (
 <img src={opponentAvatar} alt={displayOpponentName} className="w-full h-full object-cover" />
 ) : (
 <User size={16} className="text-[#201d1d]" />
 )}
 </div>
 <div className="flex flex-col min-w-0">
 <div className="flex items-center gap-1.5">
 <span className="text-xs font-bold text-[#201d1d] truncate">{displayOpponentName}</span>
 <span className="text-xs text-[#646262] font-bold shrink-0">[Lv.{opponentLevel}]</span>
 </div>
 <span className="text-xs text-[#646262] font-mono">
 {isKo ? `승률 ${opponentWinRate}` : `Win Rate ${opponentWinRate}`}
 </span>
 </div>
 </div>

 <div className="flex flex-wrap items-center gap-1.5 shrink-0">
 <button
 type="button"
 onClick={handleAddFriendClick}
 disabled={friendRequested}
 className={`min-h-[44px] px-3 py-2 rounded-sm text-xs font-bold flex items-center gap-1 border transition-colors cursor-pointer ${
 friendRequested
 ? 'bg-[#f1eeee] border-[rgba(15,0,0,0.12)] text-[#646262] cursor-default'
 : 'bg-[#fdfcfc] hover:bg-[#201d1d] hover:text-[#fdfcfc] border-[rgba(15,0,0,0.12)] text-[#201d1d]'
 }`}
 >
 {friendRequested ? (
 <>
 <UserCheck size={13} />
 <span>{isKo ? '[신청완료]' : '[Requested]'}</span>
 </>
 ) : (
 <>
 <UserPlus size={13} />
 <span>{isKo ? '[친구 신청]' : '[Add Friend]'}</span>
 </>
 )}
 </button>

 <button
 type="button"
 onClick={() => setShowProfileModal(true)}
 className="min-h-[44px] px-3 py-2 rounded-sm text-xs font-bold bg-[#fdfcfc] hover:bg-[#201d1d] hover:text-[#fdfcfc] border border-[rgba(15,0,0,0.12)] text-[#201d1d] flex items-center gap-1 transition-colors cursor-pointer"
 >
 <Eye size={13} />
 <span>{isKo ? '[프로필]' : '[Inspect]'}</span>
 </button>

 {/* ID 595: 상대 덱 복사 버튼 */}
 {opponentCards.length > 0 && (
 <button
 type="button"
 onClick={() => setShowCopyDeckModal(true)}
 className="min-h-[44px] px-3 py-2 rounded-sm text-xs font-bold bg-[#201d1d] hover:bg-[#302c2c] border border-[#201d1d] text-[#fdfcfc] flex items-center gap-1 transition-colors cursor-pointer"
 title="상대 덱 복사 검증"
 >
 <Layers size={13} />
 <span>{isKo ? '[덱 복사]' : '[Copy Deck]'}</span>
 </button>
 )}
 </div>
 </div>

 {/* Tough Opponent Defeat Warning Banner */}
 {result === 'loss' && (
 <div className="bg-[#f8f7f7] border border-[#201d1d] rounded-none p-3 flex items-center gap-2 text-[#201d1d] text-xs font-mono">
 <ShieldAlert size={16} className="text-[#ff3b30] shrink-0" />
 <span className="leading-snug">
 {isKo
 ? '[!] 버거운 상대 패배: 상대 전투력이 높아 패배했습니다. 덱을 강화하거나 전술 상성을 점검해보세요.'
 : '[!] Tough Opponent Warning: Defeated by strong enemy forces. Upgrade your cards and tactical stances.'}
 </span>
 </div>
 )}

 {/* Bonus Badges: Speed Attack / Underdog / Loot Goblin / Mana Spring / Elemental Combo / Ironclad Defender */}
 {(isSpeedAttackBonus || isUnderdogBonus || isGoblinBonus || isManaSpringBonus || isElementalComboBonus || isIroncladBonus) && (
 <div className="flex flex-wrap gap-1.5 pt-0.5">
 {isSpeedAttackBonus && (
 <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] text-[#201d1d] text-xs font-mono font-bold rounded-sm">
 <Zap size={12} />
 {isKo ? '[+] 스피드 어택 +15%' : '[+] SPEED ATTACK +15%'}
 </span>
 )}
 {isUnderdogBonus && (
 <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] text-[#201d1d] text-xs font-mono font-bold rounded-sm">
 <Trophy size={12} />
 {isKo ? '[+] 언더독 역전 보너스 +20%' : '[+] UNDERDOG BOUNTY +20%'}
 </span>
 )}
 {isGoblinBonus && (
 <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] text-[#201d1d] text-xs font-mono font-bold rounded-sm">
 <Coins size={12} />
 {isKo ? '[+] 보물 고블린 포획 +25 SNS' : '[+] LOOT GOBLIN +25 SNS'}
 </span>
 )}
 {isManaSpringBonus && (
 <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] text-[#201d1d] text-xs font-mono font-bold rounded-sm">
 <Sparkles size={12} />
 {isKo ? '[+] 마나샘 점령 +10 SNS' : '[+] MANA SPRING +10 SNS'}
 </span>
 )}
 {isElementalComboBonus && (
 <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] text-[#201d1d] text-xs font-mono font-bold rounded-sm">
 <Zap size={12} />
 {isKo ? '[+] 원소 콤보 마스터 +15 SNS' : '[+] ELEMENTAL COMBO +15 SNS'}
 </span>
 )}
 {isIroncladBonus && (
 <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] text-[#201d1d] text-xs font-mono font-bold rounded-sm">
 <Shield size={12} />
 {isKo ? '[+] 철벽 방어자 상급 룬 +20 SNS' : '[+] IRONCLAD DEFENDER +20 SNS'}
 </span>
 )}
 </div>
 )}

 {/* Metrics Row: 1. SNS Points Gained | 2. Total Damage Dealt & Received */}
 <div className="space-y-2">
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
 {/* SNS Points Gained */}
 <div className="bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] rounded-none p-3 flex flex-col justify-between font-mono">
 <div className="flex items-center justify-between text-xs font-bold text-[#646262] uppercase">
 <span>{isKo ? '획득 보상 (REWARDS)' : 'REWARDS EARNED'}</span>
 <Coins size={14} className="text-[#201d1d]" />
 </div>
 <div className="mt-1.5 flex items-baseline gap-1.5">
 <span className="text-2xl font-bold text-[#201d1d] tabular-nums">
 +{snsEarned.toLocaleString()}
 </span>
 <span className="text-xs font-bold text-[#646262]">SNS</span>
 </div>
 <p className="text-xs text-[#646262] mt-1 font-mono truncate">
 {result === 'win'
 ? (isKo ? '[+] 승리 보상 지급 완료' : '[+] Victory reward added')
 : (isKo ? '[+] 전투 참여 보상' : '[+] Participation reward')}
 </p>
 </div>

 {/* Combat Damage Exchange (Dealt vs Received) */}
 <div className="bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] rounded-none p-3 flex flex-col justify-between font-mono">
 <div className="flex items-center justify-between text-xs font-bold text-[#646262] uppercase">
 <span>{isKo ? '전투 공방 데미지' : 'DAMAGE EXCHANGE'}</span>
 <Zap size={14} className="text-[#201d1d]" />
 </div>
 <div className="mt-1.5 flex items-baseline justify-between">
 <div>
 <span className="text-lg font-bold text-[#201d1d] tabular-nums">
 {totalDamageDealt.toLocaleString()}
 </span>
 <span className="text-xs font-bold text-[#646262] ml-1">DMG</span>
 </div>
 <div className="text-right">
 <span className="text-sm font-bold text-[#646262] tabular-nums">
 -{totalDamageReceived.toLocaleString()}
 </span>
 <span className="text-xs font-bold text-[#646262] ml-1">DMG</span>
 </div>
 </div>
 {/* Mini distribution bar */}
 <div className="mt-2 space-y-1">
 <div className="h-2 w-full bg-[#f1eeee] rounded-none overflow-hidden flex border border-[rgba(15,0,0,0.12)]">
 <div
 className="h-full bg-[#201d1d] rounded-none"
 style={{ width: `${playerDmgPercent}%` }}
 />
 <div
 className="h-full bg-[#9a9898] rounded-none"
 style={{ width: `${aiDmgPercent}%` }}
 />
 </div>
 <div className="flex justify-between text-[11px] text-[#646262]">
 <span>{isKo ? '가한 데미지' : 'Dealt'} {playerDmgPercent}%</span>
 <span>{isKo ? '받은 피해' : 'Taken'} {aiDmgPercent}%</span>
 </div>
 </div>
 </div>
 </div>
 </div>

 {/* Cards Used List */}
 {usedCards && usedCards.length > 0 && (
 <div className="bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] rounded-none p-3 space-y-2">
 <div className="flex items-center justify-between text-xs font-bold text-[#201d1d] uppercase tracking-tight">
 <div className="flex items-center gap-1.5">
 <Layers size={13} className="text-[#201d1d]" />
 <span>{isKo ? '출전 카드 (CARDS USED)' : 'CARDS USED'}</span>
 </div>
 <span className="text-xs text-[#646262] font-mono">[{usedCards.length} Cards]</span>
 </div>
 <div className="flex flex-wrap gap-2 items-center">
 {usedCards.slice(0, 5).map((card, idx) => {
 const cardIdNum = Number(card.id) || (idx + 1);
 return (
 <div
 key={card.id || `used-card-${idx}`}
 className="flex items-center gap-1.5 bg-[#fdfcfc] border border-[rgba(15,0,0,0.12)] px-2.5 py-1.5 rounded-none text-xs"
 >
 <div
 className="w-6 h-6 rounded-none shrink-0 border border-[rgba(15,0,0,0.12)] bg-[#f1eeee]"
 style={getCardSpriteStyle(cardIdNum)}
 />
 <div className="flex flex-col">
 <span className="font-bold text-[#201d1d] truncate max-w-[90px]">
 {isKo ? (card.title || '카드') : (card.title_en || card.title || 'Card')}
 </span>
 <span className="text-[11px] text-[#646262]">
 Lv.{card.level || 1} · {card.power || (card.attack ? card.attack * 10 : 100)} CP
 </span>
 </div>
 </div>
 );
 })}
 </div>
 </div>
 )}

 {/* Action Buttons: Unified Battle Result & Challenge Share */}
 <div className="pt-1 space-y-2">
 <button
 type="button"
 onClick={() => {
 handleShareChallengeUrl();
 handleShareClick();
 }}
 className="w-full min-h-[44px] py-2.5 px-4 rounded-sm text-xs sm:text-sm font-bold uppercase tracking-tight flex items-center justify-between gap-2 transition-colors cursor-pointer border bg-[#201d1d] hover:bg-[#302c2c] border-[#201d1d] text-[#fdfcfc]"
 >
 <span className="flex items-center gap-2">
 <Share2 size={14} className="shrink-0" />
 <span>
 {isKo
 ? (hasClaimedBattleShare ? '[✓ 대결 결과 & 도전장 링크 복사됨]' : '[대결 결과 & 도전장 공유 (+50 SNS)]')
 : (hasClaimedBattleShare ? '[✓ Battle Result & Challenge Link Copied]' : '[Share Battle Result & Challenge (+50 SNS)]')}
 </span>
 </span>
 <span className="text-xs text-[#9a9898] shrink-0">[+50]</span>
 </button>

 {challengeShareNotice && (
 <div className="p-2.5 bg-[#f8f7f7] border border-[#201d1d] rounded-none text-xs text-[#201d1d] font-mono">
 {challengeShareNotice}
 </div>
 )}

 {onOpenDetailedSummary && (
 <button
 type="button"
 onClick={onOpenDetailedSummary}
 className="w-full min-h-[44px] py-2.5 px-4 rounded-sm text-xs font-bold uppercase tracking-tight flex items-center justify-center gap-2 transition-colors cursor-pointer border bg-[#fdfcfc] hover:bg-[#f8f7f7] border-[#201d1d] text-[#201d1d]"
 >
 <BarChart3 size={14} />
 <span>{isKo ? '[전투 상세 사후 분석]' : '[Post-Battle Summary]'}</span>
 </button>
 )}
 </div>

 {/* Collapsible View Rewards Detail Button (ID 99) */}
 <div className="pt-1">
 <button
 type="button"
 onClick={() => setShowRewardsDetail(!showRewardsDetail)}
 className="w-full min-h-[44px] py-2.5 px-3 bg-[#f8f7f7] hover:bg-[#f1eeee] border border-[rgba(15,0,0,0.12)] rounded-sm text-xs font-bold text-[#201d1d] flex items-center justify-between transition-colors cursor-pointer"
 >
 <div className="flex items-center gap-1.5">
 <Sparkles size={14} className="text-[#201d1d]" />
 <span>{isKo ? '[보상 상세 내역 보기]' : '[View Rewards Detail]'}</span>
 {leveledUpCards.length > 0 && (
 <span className="bg-[#201d1d] text-[#fdfcfc] text-[10px] font-bold px-1.5 py-0.5 rounded-sm">
 +{leveledUpCards.length}
 </span>
 )}
 </div>
 <span className="font-mono text-xs">{showRewardsDetail ? '[-]' : '[+]'}</span>
 </button>

 {showRewardsDetail && (
 <motion.div
 initial={{ opacity: 0, height: 0 }}
 animate={{ opacity: 1, height: 'auto' }}
 exit={{ opacity: 0, height: 0 }}
 className="mt-2 bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] rounded-none p-3 space-y-2.5 overflow-hidden"
 >
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-1.5 text-xs font-bold text-[#201d1d] uppercase">
 <Sparkles size={14} className="text-[#201d1d]" />
 <span>{isKo ? '카드 레벨업 & EXP 성과' : 'Card Level Up & EXP Details'}</span>
 </div>
 </div>

 {leveledUpCards.length > 0 ? (
 <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
 {leveledUpCards.map((item, idx) => (
 <motion.div
 key={item.card.id || `lvl-${idx}`}
 initial={{ scale: 0.98, opacity: 0 }}
 animate={{ scale: 1, opacity: 1 }}
 transition={{ delay: idx * 0.05 }}
 className="bg-[#fdfcfc] border border-[rgba(15,0,0,0.12)] rounded-none p-2.5 flex items-center justify-between gap-3"
 >
 <div className="flex items-center gap-2.5 min-w-0">
 <div className="w-9 h-11 bg-[#f1eeee] border border-[rgba(15,0,0,0.12)] rounded-none flex items-center justify-center shrink-0 relative overflow-hidden">
 <span className="text-[10px] font-bold text-[#201d1d]">
 {(item.card.title || 'CARD').slice(0, 2)}
 </span>
 <div className="absolute top-0 right-0 bg-[#201d1d] text-[#fdfcfc] text-[9px] font-bold px-1 rounded-none">
 Lv.{item.newLevel}
 </div>
 </div>
 <div className="min-w-0">
 <div className="text-xs font-bold text-[#201d1d] truncate flex items-center gap-1">
 <span>{isKo ? (item.card.title || '카드') : (item.card.title_en || item.card.title_dis || item.card.title || 'Card')}</span>
 </div>
 <div className="text-xs font-bold text-[#646262] flex items-center gap-1 mt-0.5">
 <span className="line-through text-[#9a9898]">Lv.{item.oldLevel}</span>
 <ArrowUpRight size={12} className="text-[#201d1d]" />
 <span className="text-[#201d1d] font-bold">Lv.{item.newLevel}</span>
 {item.statBoost && (
 <span className="text-[#201d1d] text-[10px] ml-1 bg-[#f1eeee] px-1.5 py-0.5 rounded-none border border-[rgba(15,0,0,0.12)]">
 +{item.statBoost} STATS
 </span>
 )}
 </div>
 </div>
 </div>

 <div className="text-right shrink-0">
 <span className="bg-[#201d1d] text-[#fdfcfc] text-[10px] font-bold px-2 py-1 rounded-sm block">
 LEVEL UP
 </span>
 <span className="text-[11px] font-bold text-[#646262] block mt-0.5">
 +{item.xpGained} XP
 </span>
 </div>
 </motion.div>
 ))}
 </div>
 ) : (
 /* Show XP Progress for Deck Cards when no card leveled up */
 <div className="space-y-2">
 <p className="text-xs text-[#646262]">
 {isKo ? '[+] 참여 카드 성장이 축적되었습니다 (+50 XP):' : '[+] Participating cards gained +50 XP:'}
 </p>
 <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
 {(allDeckCardsProgress.length > 0 ? allDeckCardsProgress : []).slice(0, 3).map((item, idx) => {
 const percent = Math.min(100, Math.round((item.currentXp / Math.max(1, item.nextLevelXp)) * 100));
 return (
 <div key={item.card.id || `card-prog-${idx}`} className="bg-[#fdfcfc] border border-[rgba(15,0,0,0.12)] rounded-none p-2 text-xs">
 <div className="flex justify-between items-center mb-1">
 <span className="font-bold text-[#201d1d] truncate max-w-[140px]">
 {isKo ? (item.card.title || '카드') : (item.card.title_en || item.card.title || 'Card')}
 </span>
 <span className="font-bold text-[#646262] text-[11px]">
 Lv.{item.card.level || 1} ({item.currentXp}/{item.nextLevelXp} XP)
 </span>
 </div>
 <div className="w-full bg-[#f1eeee] h-1.5 rounded-none overflow-hidden">
 <div
 className="bg-[#201d1d] h-full rounded-none transition-all duration-300"
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
 className="fixed inset-0 z-50 bg-[#201d1d]/70 flex items-center justify-center p-4"
 onClick={() => setShowProfileModal(false)}
 >
 <motion.div
 initial={{ scale: 0.98, opacity: 0 }}
 animate={{ scale: 1, opacity: 1 }}
 exit={{ scale: 0.98, opacity: 0 }}
 onClick={(e) => e.stopPropagation()}
 className="w-full max-w-sm bg-[#fdfcfc] text-[#201d1d] border border-[#201d1d] rounded-none p-5 space-y-4 font-mono text-left"
 >
 {/* Modal Header */}
 <div className="flex justify-between items-center border-b border-[rgba(15,0,0,0.12)] pb-3">
 <div className="flex items-center gap-2">
 <User size={18} className="text-[#201d1d]" />
 <span className="text-sm font-bold text-[#201d1d] uppercase tracking-tight">
 {isKo ? '[상대 프로필 조회]' : '[Opponent Profile]'}
 </span>
 </div>
 <button
 type="button"
 onClick={() => setShowProfileModal(false)}
 className="min-h-[44px] min-w-[44px] flex items-center justify-center text-[#646262] hover:text-[#201d1d] border border-[rgba(15,0,0,0.12)] rounded-sm transition-colors cursor-pointer"
 >
 <X size={18} />
 </button>
 </div>

 {/* Opponent Avatar & Level Info */}
 <div className="flex items-center gap-3 bg-[#f8f7f7] p-3 rounded-none border border-[rgba(15,0,0,0.12)]">
 <div className="w-12 h-12 rounded-none overflow-hidden border border-[#201d1d] bg-[#f1eeee] shrink-0 flex items-center justify-center">
 {opponentAvatar ? (
 <img src={opponentAvatar} alt={displayOpponentName} className="w-full h-full object-cover" />
 ) : (
 <User size={24} className="text-[#201d1d]" />
 )}
 </div>
 <div className="flex flex-col min-w-0">
 <div className="flex items-center gap-1.5">
 <span className="text-sm font-bold text-[#201d1d] truncate">{displayOpponentName}</span>
 <span className="text-xs text-[#fdfcfc] font-bold bg-[#201d1d] px-1.5 py-0.5 rounded-sm">
 Lv.{opponentLevel}
 </span>
 </div>
 <span className="text-xs text-[#646262]">UID: {displayOpponentUid}</span>
 </div>
 </div>

 {/* Stats Summary Grid */}
 <div className="grid grid-cols-2 gap-2 text-xs">
 <div className="bg-[#f8f7f7] p-2.5 rounded-none border border-[rgba(15,0,0,0.12)] flex flex-col">
 <span className="text-xs text-[#646262]">{isKo ? '전적 승률' : 'Win Rate'}</span>
 <span className="text-sm font-bold text-[#201d1d]">{opponentWinRate}</span>
 </div>
 <div className="bg-[#f8f7f7] p-2.5 rounded-none border border-[rgba(15,0,0,0.12)] flex flex-col">
 <span className="text-xs text-[#646262]">{isKo ? '대표 에이스 카드' : 'Main Ace Card'}</span>
 <span className="text-sm font-bold text-[#201d1d] truncate">
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
 className={`flex-1 min-h-[44px] py-2.5 px-3 rounded-sm text-xs font-bold uppercase tracking-tight flex items-center justify-center gap-1.5 border transition-colors cursor-pointer ${
 friendRequested
 ? 'bg-[#f1eeee] border-[rgba(15,0,0,0.12)] text-[#646262] cursor-default'
 : 'bg-[#201d1d] hover:bg-[#302c2c] border-[#201d1d] text-[#fdfcfc]'
 }`}
 >
 {friendRequested ? (
 <>
 <UserCheck size={14} />
 <span>{isKo ? '[친구 신청 완료]' : '[Friend Requested]'}</span>
 </>
 ) : (
 <>
 <UserPlus size={14} />
 <span>{isKo ? '[친구 신청]' : '[Add Friend]'}</span>
 </>
 )}
 </button>
 <button
 type="button"
 onClick={() => setShowProfileModal(false)}
 className="min-h-[44px] py-2.5 px-4 rounded-sm text-xs font-bold uppercase bg-[#fdfcfc] hover:bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] text-[#201d1d] transition-colors cursor-pointer"
 >
 {isKo ? '[닫기]' : '[Close]'}
 </button>
 </div>
 </motion.div>
 </motion.div>
 )}
 </AnimatePresence>

 {/* ID 595: 상대 덱 복사 1클릭 검증 모달 */}
 <AnimatePresence>
 {showCopyDeckModal && (
 <motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-[#201d1d]/70"
 >
 <motion.div
 initial={{ scale: 0.98, y: 8 }}
 animate={{ scale: 1, y: 0 }}
 exit={{ scale: 0.98, y: 8 }}
 className="bg-[#fdfcfc] border border-[#201d1d] rounded-none p-5 max-w-sm w-full font-mono text-[#201d1d] space-y-4"
 >
 <div className="flex items-center justify-between border-b border-[rgba(15,0,0,0.12)] pb-2.5">
 <div className="flex items-center gap-2 font-bold text-xs text-[#201d1d]">
 <Layers size={16} className="text-[#201d1d]" />
 <span>{isKo ? '[상대 덱 복사 검증]' : '[Copy Opponent Deck Verification]'}</span>
 </div>
 <button
 type="button"
 onClick={() => setShowCopyDeckModal(false)}
 className="min-h-[44px] min-w-[44px] flex items-center justify-center text-[#646262] hover:text-[#201d1d] border border-[rgba(15,0,0,0.12)] rounded-sm text-xs cursor-pointer"
 >
 [x]
 </button>
 </div>

 <div className="space-y-2">
 <p className="text-xs text-[#424245]">
 {isKo
 ? '상대 사령관이 사용한 5장의 덱 구성을 분석했습니다. 보유 현황을 확인 후 내 활성 덱으로 복사하시겠습니까?'
 : 'Analyzed opponent’s 5-card deck composition. Copy to your active deck?'}
 </p>

 <div className="space-y-1.5 bg-[#f8f7f7] p-3 border border-[rgba(15,0,0,0.12)] rounded-none">
 {deckCopyAnalysis.map((item, idx) => (
 <div key={idx} className="flex items-center justify-between text-xs">
 <span className="text-[#201d1d] truncate max-w-[180px]">
 #{idx + 1} {isKo ? item.card.title : (item.card.title_en || item.card.title)}
 </span>
 <span className={item.isOwned ? 'text-[#201d1d] font-bold' : 'text-[#646262] font-bold'}>
 {item.isOwned ? (isKo ? '[+] 보유 중' : '[+] Owned') : (isKo ? '[-] 미보유(대체)' : '[-] Missing')}
 </span>
 </div>
 ))}
 </div>
 </div>

 <div className="grid grid-cols-2 gap-2 pt-1">
 <button
 type="button"
 onClick={() => setShowCopyDeckModal(false)}
 className="min-h-[44px] py-2 border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] hover:bg-[#f8f7f7] text-[#201d1d] text-xs font-bold rounded-sm cursor-pointer"
 >
 {isKo ? '[취소]' : '[Cancel]'}
 </button>
 <button
 type="button"
 onClick={handleConfirmCopyDeck}
 className="min-h-[44px] py-2 bg-[#201d1d] hover:bg-[#302c2c] border border-[#201d1d] text-[#fdfcfc] text-xs font-bold rounded-sm transition-colors cursor-pointer"
 >
 {isKo ? '[덱 복사 확정]' : '[Confirm Copy]'}
 </button>
 </div>
 </motion.div>
 </motion.div>
 )}
 </AnimatePresence>

 {/* 복사 성공 토스트 */}
 {copySuccessToast && (
 <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[300] bg-[#201d1d] border border-[#201d1d] text-[#fdfcfc] px-4 py-2.5 text-xs font-bold rounded-none font-mono">
 {isKo ? '[+] 상대 덱이 내 활성 덱으로 복사되었습니다.' : '[+] Opponent deck copied to your active deck.'}
 </div>
 )}
 </motion.div>
 );
};
