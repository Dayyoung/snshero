import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Swords, X, Sparkles, BookOpen, Shield, Flame, Droplets, Mountain, Wind, Skull, Crown } from 'lucide-react';
import { CARD_DATABASE } from '../cardDatabase';
import { CardData, Language } from '../types';
import { CardItem } from './CardItem';
import { getCharacterNovelDialogue } from '../lib/characterNovelDialogue';
import { cn } from '../lib/utils';

interface MissionEncounterModalProps {
 isOpen: boolean;
 cardId: number | null;
 language: Language;
 onStartBattle: () => void;
 onClose: () => void;
 playSfx: (url: string) => void;
 lowSpecMode?: boolean;
 onOpenCardDetail?: (cardId: number) => void;
 pauseCountdown?: boolean;
}

export const MissionEncounterModal: React.FC<MissionEncounterModalProps> = ({
 isOpen,
 cardId,
 language,
 onStartBattle,
 onClose,
 playSfx,
 lowSpecMode = false,
 onOpenCardDetail,
 pauseCountdown = false,
}) => {
 const [countdown, setCountdown] = React.useState<number>(3);
 const onStartBattleRef = React.useRef(onStartBattle);
 onStartBattleRef.current = onStartBattle;

 // 3초 후 자동 배틀 시작 카운트다운 타이머
 useEffect(() => {
 if (!isOpen) {
 setCountdown(3);
 return;
 }
 if (pauseCountdown) return;

 const interval = setInterval(() => {
 setCountdown(prev => Math.max(0, prev - 1));
 }, 1000);

 return () => clearInterval(interval);
 }, [isOpen, pauseCountdown]);

 // 카운트다운 완료 시 배틀 시작 (렌더링 외부 이펙트에서 안전하게 호출)
 useEffect(() => {
 if (!isOpen || pauseCountdown) return;
 if (countdown === 0) {
 onStartBattleRef.current();
 }
 }, [isOpen, countdown, pauseCountdown]);

 useEffect(() => {
 if (!isOpen) return;

 // 조우 효과음 및 모바일 진동
 playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
 if (typeof navigator !== 'undefined' && navigator.vibrate) {
 try { navigator.vibrate([25, 40, 25]); } catch {}
 }

 // 키보드 엔터/스페이스: 즉시 배틀 시작, ESC: 닫기
 const handleKeyDown = (e: KeyboardEvent) => {
 if (e.key === 'Enter' || e.key === ' ') {
 e.preventDefault();
 onStartBattle();
 } else if (e.key === 'Escape') {
 e.preventDefault();
 onClose();
 }
 };

 window.addEventListener('keydown', handleKeyDown);
 return () => window.removeEventListener('keydown', handleKeyDown);
 }, [isOpen, onStartBattle, onClose, playSfx]);

 if (!isOpen || cardId === null || cardId === undefined) return null;

 const safeCardId = CARD_DATABASE[cardId] ? cardId : 1;
 const dbCard = CARD_DATABASE[safeCardId];
 const novelData = getCharacterNovelDialogue(safeCardId, language);
 const isKo = language === 'ko';

 // 카드 아이템용 CardData
 const previewCard: CardData = {
 id: `encounter-preview-${safeCardId}`,
 title: dbCard.title,
 title_dis: dbCard.title_dis,
 title_en: dbCard.title_en,
 stats: [...dbCard.stats],
 rarity: dbCard.rarity,
 owner: 'ai',
 level: 1,
 power: dbCard.power || 10,
 imageIndex: safeCardId,
 element: dbCard.element,
 skills: []
 };

 const elem = (dbCard.element || 'neutral').toLowerCase();
 const elemBadgeStyle = 
 elem === 'water' ? 'bg-[#090d16] text-cyan-300 border-cyan-700/60' :
 elem === 'fire' ? 'bg-[#090d16] text-rose-300 border-rose-700/60' :
 elem === 'air' || elem === 'wind' ? 'bg-[#090d16] text-sky-300 border-sky-700/60' :
 elem === 'earth' || elem === 'land' ? 'bg-[#090d16] text-amber-300 border-amber-700/60' :
 elem === 'dragon' || elem === 'holy' ? 'bg-[#090d16] text-yellow-300 border-yellow-600/60' :
 elem === 'undead' || elem === 'monster' ? 'bg-[#090d16] text-purple-300 border-purple-700/60' :
 'bg-[#090d16] text-stone-300 border-stone-700';

 const elemIcon = 
 elem === 'water' ? <Droplets size={12} className="text-cyan-400" /> :
 elem === 'fire' ? <Flame size={12} className="text-rose-400" /> :
 elem === 'air' || elem === 'wind' ? <Wind size={12} className="text-sky-400" /> :
 elem === 'earth' || elem === 'land' ? <Mountain size={12} className="text-amber-400" /> :
 elem === 'dragon' || elem === 'holy' ? <Crown size={12} className="text-yellow-400" /> :
 elem === 'undead' || elem === 'monster' ? <Skull size={12} className="text-purple-400" /> :
 <Shield size={12} className="text-stone-400" />;

 return (
 <AnimatePresence>
 <div 
 className="fixed inset-0 z-[20000] flex items-center justify-center p-3 sm:p-4 bg-[#090d16]/85 select-none font-mono overscroll-none"
 onClick={(e) => {
 if (e.target === e.currentTarget) {
 onClose();
 }
 }}
 >
 <motion.div
 initial={lowSpecMode ? false : { opacity: 0, y: 12 }}
 animate={{ opacity: 1, y: 0 }}
 exit={lowSpecMode ? undefined : { opacity: 0, y: 12 }}
 transition={{ duration: lowSpecMode ? 0 : 0.15 }}
 className="w-full max-w-md bg-[#fdfcfc] border border-[#201d1d] rounded-none text-[#201d1d] flex flex-col overflow-hidden relative font-mono"
 >
 {/* Header Bar */}
 <div className="px-3.5 py-2.5 bg-[#201d1d] border-b border-[#201d1d] flex items-center justify-between gap-2 text-[#fdfcfc]">
 <div className="flex items-center gap-1.5 text-xs font-bold min-w-0">
 <Swords size={15} className="text-amber-400 shrink-0" />
 <span className="truncate">{isKo ? '[수호자 조우]' : '[GUARDIAN ENCOUNTER]'}</span>
 <span className="text-[11px] text-[#fdfcfc]/70 font-normal shrink-0">
 No.{String(safeCardId).padStart(2, '0')}
 </span>
 <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-amber-400 text-[#201d1d] font-bold rounded-sm shrink-0">
 {isKo ? `${countdown}초 후 자동 시작` : `Auto in ${countdown}s`}
 </span>
 </div>
 <div className="flex items-center gap-1 shrink-0">
 <button
 type="button"
 onClick={() => {
 playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
 onStartBattle();
 }}
 className="min-h-[44px] min-h-[36px] px-2.5 py-1 text-[11px] font-bold text-[#fdfcfc] border border-white/25 hover:bg-white/10 rounded-sm cursor-pointer"
 >
 {isKo ? '[건너뛰기 (SKIP)]' : '[SKIP]'}
 </button>
 <button
 type="button"
 onClick={onClose}
 className="min-h-[44px] min-w-[36px] min-h-[36px] flex items-center justify-center text-[#fdfcfc]/80 hover:text-white transition-colors cursor-pointer rounded-sm border border-white/15 hover:bg-white/10"
 aria-label={isKo ? '닫기' : 'Close'}
 >
 <X size={16} />
 </button>
 </div>
 </div>

 {/* Body Section */}
 <div className="p-4 sm:p-5 flex flex-col items-center gap-3.5 overflow-y-auto max-h-[75dvh] bg-[#fdfcfc]">
 {/* Novel Episode & Character Tag Banner */}
 <div className="w-full flex items-center justify-between text-xs bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] px-3 py-2 rounded-none">
 <div className="flex items-center gap-1.5 text-[#201d1d] min-w-0">
 <BookOpen size={13} className="text-[#646262] shrink-0" />
 <span className="truncate font-bold">{novelData.sourceNovel}</span>
 </div>
 {novelData.episodeName && (
 <span className="text-[#646262] font-bold shrink-0 ml-2">
 [{novelData.episodeName}]
 </span>
 )}
 </div>

 {/* Character Card Centerpiece */}
 <div className="relative flex flex-col items-center my-1">
 <div className="relative border border-[#201d1d] rounded-none">
 <CardItem
 card={previewCard}
 className="w-28 h-40 sm:w-32 sm:h-44 rounded-none pointer-events-none"
 language={language}
 lowSpecMode={lowSpecMode}
 />
 <div className="absolute -top-2 -right-2 bg-[#201d1d] text-[#fdfcfc] font-bold text-[10px] px-2 py-0.5 rounded-sm border border-[#201d1d]">
 P.{dbCard.power || 10}
 </div>
 </div>

 {/* Character Details Pill */}
 <div className="mt-3 flex items-center gap-2">
 <span className="text-sm sm:text-base font-bold text-[#201d1d]">
 {novelData.characterName}
 </span>
 {onOpenCardDetail && (
 <button
 type="button"
 onClick={(e) => {
 e.stopPropagation();
 playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
 onOpenCardDetail(safeCardId);
 }}
 className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-sm border border-[#201d1d] bg-amber-400 text-xs font-black text-[#201d1d] hover:bg-amber-300 active:scale-95 transition-all cursor-pointer"
 title={isKo ? `${novelData.characterName} 카드 상세 정보 보기` : `View ${novelData.characterName} Card Info`}
 aria-label={isKo ? `${novelData.characterName} 카드 상세 정보 보기` : `View ${novelData.characterName} Card Info`}
 >
 ?
 </button>
 )}
 <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-sm border flex items-center gap-1", elemBadgeStyle)}>
 {elemIcon}
 <span>{novelData.speakerTitle}</span>
 </span>
 </div>
 </div>

 {/* Visual Novel Dialogue Box */}
 <div className="w-full bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] rounded-none p-3.5 relative">
 <div className="flex items-center justify-between border-b border-[rgba(15,0,0,0.12)] pb-1.5 mb-2">
 <div className="flex items-center gap-1.5">
 <Sparkles size={13} className="text-[#201d1d]" />
 <span className="text-xs font-bold text-[#201d1d]">
 {novelData.characterName}
 </span>
 <span className="text-[11px] text-[#646262]">
 ({novelData.speakerTitle})
 </span>
 </div>
 <span className="text-[10px] text-[#646262] uppercase font-bold">
 {isKo ? '[소설 대사]' : '[NOVEL QUOTE]'}
 </span>
 </div>

 <p className="text-xs sm:text-sm font-medium text-[#201d1d] leading-relaxed break-keep">
 “{novelData.dialogue}”
 </p>
 </div>

 {/* Deck & Reward Notice */}
 <div className="w-full bg-[#201d1d] text-[#fdfcfc] border border-[#201d1d] px-3 py-2 rounded-none text-xs flex items-center justify-between gap-2">
 <span className="truncate">
 {isKo ? '[전투 규칙] 상대 AI: 이 카드 5장 편성' : '[RULE] Opponent: 5x this card deck'}
 </span>
 <span className="text-amber-300 font-bold shrink-0">
 {isKo ? '[승리: 카드/강화 획득]' : '[Win: Card/Enhance]'}
 </span>
 </div>
 </div>

 {/* Action Footer */}
 <div className="p-3.5 sm:p-4 bg-[#f8f7f7] border-t border-[rgba(15,0,0,0.12)] flex items-center gap-2.5">
 <button
 type="button"
 onClick={onClose}
 className="flex-1 min-h-[44px] py-2.5 px-3 rounded-sm border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] hover:bg-[#f1eeee] text-[#201d1d] text-xs font-bold transition-colors cursor-pointer text-center"
 >
 {isKo ? '[돌아가기]' : '[CANCEL]'}
 </button>
 <button
 type="button"
 onClick={() => {
 playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
 onStartBattle();
 }}
 className="flex-[2] min-h-[44px] py-2.5 px-4 rounded-sm bg-[#201d1d] hover:bg-[#302c2c] text-[#fdfcfc] text-xs sm:text-sm font-bold border border-[#201d1d] transition-colors cursor-pointer flex items-center justify-center gap-2"
 >
 <Swords size={16} className="shrink-0" />
 <span>{isKo ? `[즉시 대결 시작 (${countdown}s)]` : `[START BATTLE (${countdown}s)]`}</span>
 </button>
 </div>
 </motion.div>
 </div>
 </AnimatePresence>
 );
};

export default MissionEncounterModal;

