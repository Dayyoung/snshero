/**
 * RankerDeckMirrorModal.tsx
 * 모험가 명예의 전당 랭커 덱 1클릭 복제 시뮬레이션 및 바이럴 공유 모달 (RSI-023)
 * DESIGN.md: 100% font-mono, 0px modal, 4px buttons, 1px border, zero gradient, 44px+ touch targets
 */

import React, { useState } from 'react';
import { Trophy, Copy, Share2, Check, Sparkles, X, Swords } from 'lucide-react';
import { CardData } from '../../types';
import { CARD_DATABASE } from '../../cardDatabase';
import { saveMirroredDeck, generateDuelMirrorUrl } from '../../utils/rankerDeckStore';
import { triggerHaptic } from '../../lib/haptic';

interface RankerDeckMirrorModalProps {
 isOpen: boolean;
 onClose: () => void;
 rankerName: string;
 rank: number;
 totalPower: number;
 winRate: number;
 deck?: CardData[];
 language?: string;
 onStartDuelWithDeck?: (deck: CardData[]) => void;
}

export const RankerDeckMirrorModal: React.FC<RankerDeckMirrorModalProps> = ({
 isOpen,
 onClose,
 rankerName,
 rank,
 totalPower,
 winRate,
 deck,
 language = 'ko',
 onStartDuelWithDeck
}) => {
 const [copied, setCopied] = useState(false);
 const [shared, setShared] = useState(false);
 const isKo = language === 'ko';

 if (!isOpen) return null;

 // 덱이 주어지지 않은 경우 DB 기반 상위 5장 자동 생성
 const displayDeck: CardData[] = (deck && deck.length === 5)
 ? deck
 : [CARD_DATABASE[1] || { id: 1, name: 'Dragon Master', power: 9, element: 'FIRE' },
 CARD_DATABASE[2] || { id: 2, name: 'Ocean Leviathan', power: 8, element: 'WATER' },
 CARD_DATABASE[3] || { id: 3, name: 'Terra Titan', power: 8, element: 'EARTH' },
 CARD_DATABASE[4] || { id: 4, name: 'Sky Gryphon', power: 7, element: 'WIND' },
 CARD_DATABASE[5] || { id: 5, name: 'Solar Phoenix', power: 9, element: 'FIRE' }] as unknown as CardData[];

 const avgPower = Math.round(displayDeck.reduce((acc, c) => acc + (c.power || 5), 0) / displayDeck.length);

 const handleCopyDeck = () => {
 triggerHaptic('success');
 saveMirroredDeck(rankerName, rank, totalPower, winRate, displayDeck);
 setCopied(true);
 setTimeout(() => setCopied(false), 2500);
 };

 const handleShareDuelLink = async () => {
 triggerHaptic('tap');
 const shareUrl = generateDuelMirrorUrl(rankerName, rank, displayDeck);
 const title = isKo ? `[SNS히어로] 랭킹 #${rank} ${rankerName}의 덱으로 결투 도전!` : `[SNSHero] Duel Challenge with Rank #${rank} ${rankerName}'s Deck!`;
 const text = isKo
 ? `명예의 전당 랭커 ${rankerName}(승률 ${winRate}%, 평균전투력 ${avgPower})의 덱을 1클릭 복제하고 즉시 결투를 치러보세요!`
 : `Mirror ranker ${rankerName}'s lineup (WinRate ${winRate}%) and duel right now!`;

 if (typeof navigator !== 'undefined' && navigator.share) {
 try {
 await navigator.share({ title, text, url: shareUrl });
 setShared(true);
 setTimeout(() => setShared(false), 2500);
 return;
 } catch {
 // user canceled or not supported
 }
 }

 if (typeof navigator !== 'undefined' && navigator.clipboard) {
 await navigator.clipboard.writeText(shareUrl);
 setShared(true);
 setTimeout(() => setShared(false), 2500);
 }
 };

 const handleBattleWithMirror = () => {
 handleCopyDeck();
 if (onStartDuelWithDeck) {
 onStartDuelWithDeck(displayDeck);
 }
 onClose();
 };

 return (
 <div className="fixed inset-0 z-[10030] bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 font-mono select-none">
 <div className="bg-[#fdfcfc] dark:bg-[#181616] border border-[#201d1d]/20 dark:border-white/20 p-4 sm:p-5 rounded-none max-w-md w-full shadow-none space-y-3.5 text-[#201d1d] dark:text-[#fdfcfc]">
 {/* Header */}
 <div className="flex items-center justify-between border-b border-[#201d1d]/10 dark:border-white/10 pb-2.5">
 <div className="flex items-center gap-2">
 <Trophy size={16} className="text-amber-500" />
 <h3 className="font-black text-sm uppercase tracking-wider">
 {isKo ? `랭커 덱 미러링 (#${rank} ${rankerName})` : `Ranker Deck Mirror (#${rank})`}
 </h3>
 </div>
 <button
 onClick={onClose}
 className="min-h-[44px] min-w-[44px] flex items-center justify-center p-1 hover:bg-[#201d1d]/5 dark:hover:bg-white/5 cursor-pointer text-xs"
 aria-label="Close"
 >
 [x]
 </button>
 </div>

 {/* Ranker Info Banner */}
 <div className="bg-[#201d1d]/5 dark:bg-white/5 p-3 border border-[#201d1d]/10 dark:border-white/10 text-xs flex items-center justify-between">
 <div>
 <div className="font-black text-sm text-amber-600 dark:text-amber-400">{rankerName}</div>
 <div className="text-[10px] opacity-75 mt-0.5">
 {isKo ? `전투력 ${totalPower.toLocaleString()} | 승률 ${winRate}%` : `Power ${totalPower.toLocaleString()} | WinRate ${winRate}%`}
 </div>
 </div>
 <div className="text-right">
 <span className="px-2 py-0.5 bg-amber-500 text-stone-950 font-black text-[10px] uppercase rounded-sm">
 {avgPower >= 8 ? 'AGGRO RUSH' : 'CONTROL META'}
 </span>
 <div className="text-[9px] opacity-60 mt-0.5">{isKo ? '평균 위력' : 'Avg Power'} {avgPower}</div>
 </div>
 </div>

 {/* 5-Card Deck Grid */}
 <div className="space-y-1.5">
 <div className="text-[11px] font-bold opacity-75 flex items-center justify-between">
 <span>{isKo ? '복제 대상 5인 편성 라인업' : '5-Hero Lineup Preview'}</span>
 <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">24H TRIAL</span>
 </div>
 <div className="grid grid-cols-5 gap-1.5">
 {displayDeck.map((card, idx) => (
 <div
 key={card.id || idx}
 className="bg-[#201d1d]/5 dark:bg-white/5 border border-[#201d1d]/20 dark:border-white/20 p-1.5 text-center rounded-none flex flex-col items-center justify-center min-h-[76px]"
 >
 <div className="text-[9px] font-bold text-amber-500 uppercase">{card.element || 'FIRE'}</div>
 <div className="text-sm font-black my-0.5">{card.power || 7}</div>
 <div className="text-[8px] font-mono truncate w-full opacity-80">{card.name}</div>
 </div>
 ))}
 </div>
 </div>

 {/* Tactical Synergy Insight */}
 <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 text-[11px] text-[#201d1d] dark:text-[#fdfcfc] space-y-1">
 <div className="font-bold flex items-center gap-1 text-amber-600 dark:text-amber-400">
 <Sparkles size={12} />
 <span>{isKo ? '24시간 가상 복제 혜택' : '24-Hour Virtual Mirror Benefit'}</span>
 </div>
 <p className="text-[10px] opacity-85 leading-snug">
 {isKo
 ? `이 덱을 복제하면 24시간 동안 내 덱 슬롯에 랭커 전술이 즉시 동기화되어 결투장 및 3x3 배틀에서 시뮬레이션할 수 있습니다.`
 : `Clone this ranker's deck for 24 hours to simulate high-tier PvP meta in your battle sessions.`}
 </p>
 </div>

 {/* Action Buttons */}
 <div className="space-y-2 pt-1">
 <div className="grid grid-cols-2 gap-2">
 <button
 onClick={handleCopyDeck}
 className="min-h-[44px] py-2.5 px-3 bg-[#201d1d] text-[#fdfcfc] dark:bg-white dark:text-[#201d1d] font-bold text-xs rounded-sm cursor-pointer hover:opacity-90 active:scale-98 flex items-center justify-center gap-1.5 border border-[#201d1d] dark:border-white"
 >
 {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
 <span>{copied ? (isKo ? '복제 완료!' : 'Mirrored!') : (isKo ? '1클릭 덱 복제' : 'Mirror Deck')}</span>
 </button>

 <button
 onClick={handleShareDuelLink}
 className="min-h-[44px] py-2.5 px-3 bg-stone-200 dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-bold text-xs rounded-sm cursor-pointer hover:bg-stone-300 dark:hover:bg-stone-700 active:scale-98 flex items-center justify-center gap-1.5 border border-stone-400 dark:border-stone-600"
 >
 {shared ? <Check size={14} className="text-emerald-500" /> : <Share2 size={14} />}
 <span>{shared ? (isKo ? '링크 복사됨!' : 'Link Copied!') : (isKo ? '결투 도전장 공유' : 'Share Duel')}</span>
 </button>
 </div>

 {onStartDuelWithDeck && (
 <button
 onClick={handleBattleWithMirror}
 className="w-full min-h-[44px] py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs rounded-sm cursor-pointer active:scale-98 flex items-center justify-center gap-2 border border-amber-600"
 >
 <Swords size={15} />
 <span>{isKo ? '복제 덱으로 즉시 실전 출전' : 'Deploy Cloned Deck to Battle'}</span>
 </button>
 )}

 <button
 onClick={onClose}
 className="w-full min-h-[44px] py-2 bg-transparent text-stone-600 dark:text-stone-400 font-bold text-xs cursor-pointer hover:opacity-80 active:scale-98"
 >
 {isKo ? '취소 / 닫기' : 'Cancel / Close'}
 </button>
 </div>
 </div>
 </div>
 );
};
