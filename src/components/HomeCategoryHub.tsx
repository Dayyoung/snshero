import React, { useState } from 'react';
import { Swords, Play, BookOpen, Tv, Film, Gift, ShoppingBag, Trophy, Zap, Sparkles, ChevronDown, ChevronUp, ArrowRight, Pause, Shield, Flame, Compass, Castle, Image, Layers, GraduationCap, Gamepad2, Cpu, FileText, Github, Youtube, ExternalLink } from 'lucide-react';
import { Language, ViewType } from '../types';
import { cn } from '../lib/utils';
import { triggerHaptic } from '../lib/haptic';
import { motion, AnimatePresence } from 'motion/react';

interface HomeCategoryHubProps {
 language: Language;
 onNavigate: (view: ViewType) => void;
 onStartPlayNow?: () => void;
 playSfx: (url: string) => void;
 // Game Arena Controls
 autoStartCountdown: number;
 isAutoStartPaused: boolean;
 onToggleAutoStart: () => void;
 onQuickBattle: () => void;
 // Market & Economy Controls
 isStarterPackPurchased: boolean;
 onOpenStarterPack: () => void;
 onOpenWishingFountain: () => void;
 // Season & Quest Controls
 dailyCompletedMissions: number;
 dailyTotalMissions: number;
 dailyClaimableCount: number;
 onOpenDailyMissions: () => void;
 onToggleDrawer: () => void;
 isLobbyDrawerOpen: boolean;
}

type CategoryKey = 'arena' | 'media' | 'market' | 'season';

export const HomeCategoryHub: React.FC<HomeCategoryHubProps> = ({
 language,
 onNavigate,
 onStartPlayNow,
 playSfx,
 autoStartCountdown,
 isAutoStartPaused,
 onToggleAutoStart,
 onQuickBattle,
 isStarterPackPurchased,
 onOpenStarterPack,
 onOpenWishingFountain,
 dailyCompletedMissions,
 dailyTotalMissions,
 dailyClaimableCount,
 onOpenDailyMissions,
}) => {
 // 접기/펼치기 상태: 기본값은 모든 카테고리 접힘(null)으로 첫 화면 버튼 과밀 완벽 차단!
 const [openedCategory, setOpenedCategory] = useState<CategoryKey | null>(null);

 const toggleCategory = (key: CategoryKey) => {
 triggerHaptic('selection');
 playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
 setOpenedCategory(prev => (prev === key ? null : key));
 };

 const categories = [
 {
 id: 'arena' as CategoryKey,
 icon: '🎮',
 titleKo: '게임 아레나',
 titleEn: 'Game Arena',
 descKo: '1초 대전, RPG 모험, 110개 미션, 마이덱',
 descEn: 'PvP Battles, RPG Adventure, Missions, Deck',
 badge: '4 MENU',
 },
 {
 id: 'media' as CategoryKey,
 icon: '📚',
 titleKo: '미디어 라운지',
 titleEn: 'Media Lounge',
 descKo: '웹소설, 웹툰, 애니, 바이브코딩 강의, 공식 리소스',
 descEn: 'Web Novel, Webtoon, Anime, Course & Dev Links',
 badge: '10+ LINKS',
 },
 {
 id: 'market' as CategoryKey,
 icon: '💼',
 titleKo: '마켓 & 상점',
 titleEn: 'Market & Economy',
 descKo: '카드팩 상점, 스타터팩, 소원의 분수, 굿즈몰',
 descEn: 'Card Shop, Starter Pack, Fountain, Merch',
 badge: 'SHOP/DEAL',
 },
 {
 id: 'season' as CategoryKey,
 icon: '🏆',
 titleKo: '시즌 & 미션',
 titleEn: 'Season & Missions',
 descKo: '일일 미션 보상, 시즌 허브, 명예의 전당',
 descEn: 'Daily Quests, Season Hub, Rankings',
 badge: dailyClaimableCount > 0 ? `${dailyClaimableCount} CLAIM` : 'QUEST',
 hasAlert: dailyClaimableCount > 0,
 },
 ];

 const missionPercent = Math.min(100, Math.round((dailyCompletedMissions / Math.max(1, dailyTotalMissions)) * 100));

 return (
 <section className="w-full space-y-3 font-mono select-none">
 {/* ── Section Title & Accordion State Status ── */}
 <div className="border-b border-[rgba(15,0,0,0.12)] pb-2 flex items-center justify-between">
 <div className="flex items-center gap-2">
 <span className="w-2.5 h-2.5 bg-[#201d1d] rounded-none" />
 <h2 className="text-xs sm:text-sm font-bold uppercase tracking-tight text-[#201d1d]">
 {language === 'ko' ? '[ 카테고리별 기능 메뉴 ]' : '[ CATEGORY HUBS ]'}
 </h2>
 </div>

 {openedCategory !== null ? (
 <button
 type="button"
 onClick={() => {
 triggerHaptic('light');
 setOpenedCategory(null);
 }}
 className="min-h-[44px] text-xs font-bold text-[#646262] hover:text-[#201d1d] px-3 py-1.5 border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] hover:bg-[#f8f7f7] cursor-pointer rounded-sm transition-colors"
 >
 {language === 'ko' ? '[모두 접기]' : '[Fold All]'}
 </button>
 ) : (
 <span className="text-xs text-[#646262]">
 {language === 'ko' ? '카테고리를 탭하여 메뉴 열기' : 'Tap category to open'}
 </span>
 )}
 </div>

 {/* ── 4대 핵심 접이식 아코디언 허브 목록 ── */}
 <div className="space-y-2">
 {categories.map((cat) => {
 const isOpen = openedCategory === cat.id;

 return (
 <div
 key={cat.id}
 className={cn(
 "border transition-colors rounded-none overflow-hidden",
 isOpen
 ? "border-[#201d1d] bg-[#fdfcfc]"
 : "border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] hover:border-[#201d1d]"
 )}
 >
 {/* 아코디언 헤더 버튼 (1줄 심플) */}
 <button
 type="button"
 onClick={() => toggleCategory(cat.id)}
 className={cn(
 "w-full min-h-[48px] px-3 sm:px-4 py-2.5 flex items-center justify-between text-left cursor-pointer transition-colors select-none rounded-none",
 isOpen ? "bg-[#f8f7f7] border-b border-[rgba(15,0,0,0.12)]" : "bg-[#fdfcfc] hover:bg-[#f8f7f7]"
 )}
 >
 <div className="flex items-center gap-2.5 min-w-0">
 <span className="text-base sm:text-lg shrink-0">{cat.icon}</span>
 <div className="min-w-0">
 <div className="flex items-center gap-2">
 <span className="text-xs sm:text-sm font-bold text-[#201d1d] uppercase tracking-tight">
 {language === 'ko' ? cat.titleKo : cat.titleEn}
 </span>
 {cat.hasAlert && (
 <span className="px-1.5 py-0.5 bg-[#201d1d] text-[#fdfcfc] text-[10px] font-bold rounded-sm">
 {cat.badge}
 </span>
 )}
 </div>
 <p className="text-xs text-[#646262] truncate">
 {language === 'ko' ? cat.descKo : cat.descEn}
 </p>
 </div>
 </div>

 <div className="flex items-center gap-2 shrink-0 pl-2">
 <span className="text-xs font-mono font-bold text-[#646262] hidden sm:inline">
 {isOpen ? (language === 'ko' ? '[접기]' : '[Fold]') : (language === 'ko' ? '[열기]' : '[Open]')}
 </span>
 <span className={cn(
 "text-xs font-mono font-bold px-2 py-1 rounded-sm",
 isOpen ? "bg-[#201d1d] text-[#fdfcfc]" : "border border-[rgba(15,0,0,0.12)] text-[#201d1d]"
 )}>
 {isOpen ? '[-]' : '[+]'}
 </span>
 </div>
 </button>

 {/* 아코디언 펼침 내용 */}
 <AnimatePresence initial={false}>
 {isOpen && (
 <motion.div
 initial={{ height: 0, opacity: 0 }}
 animate={{ height: 'auto', opacity: 1 }}
 exit={{ height: 0, opacity: 0 }}
 transition={{ duration: 0.2, ease: 'easeOut' }}
 className="overflow-hidden"
 >
 <div className="p-3 sm:p-4 space-y-3 bg-[#fdfcfc]">
 {/* 1. 게임 아레나 세부 메뉴 */}
 {cat.id === 'arena' && (
 <div className="space-y-3">
 {/* 자동 랭킹대전 상태 & 컨트롤 */}
 <div className="bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] p-2.5 rounded-none flex items-center justify-between">
 <div className="flex items-center gap-2 font-bold text-xs text-[#201d1d]">
 <Zap size={14} className="text-[#201d1d]" />
 <span>{language === 'ko' ? '자동 랭킹대전 대기:' : 'Auto Rank:'}</span>
 <span className="px-2 py-0.5 text-xs font-bold text-[#fdfcfc] bg-[#201d1d] rounded-none">
 {autoStartCountdown}s
 </span>
 </div>
 <button
 type="button"
 onClick={onToggleAutoStart}
 className="min-h-[44px] px-3 py-1.5 border border-[rgba(15,0,0,0.12)] text-xs font-bold text-[#201d1d] hover:border-[#201d1d] cursor-pointer rounded-sm bg-[#fdfcfc]"
 >
 {isAutoStartPaused ? (language === 'ko' ? '[재개]' : '[Resume]') : (language === 'ko' ? '[일시정지]' : '[Pause]')}
 </button>
 </div>

 {/* 4개 핵심 버튼 그리드 */}
 <div className="grid grid-cols-2 gap-2">
 <button
 type="button"
 onClick={onQuickBattle}
 className="min-h-[48px] p-2.5 bg-[#201d1d] text-[#fdfcfc] hover:bg-[#302c2c] font-bold text-xs rounded-sm border border-[#201d1d] flex items-center justify-center gap-2 cursor-pointer transition-colors"
 >
 <Swords size={15} className="shrink-0" />
 <span>{language === 'ko' ? '[3초 즉시 1:1 배틀]' : '[Instant 1v1 Match]'}</span>
 </button>

 <button
 type="button"
 onClick={() => {
 triggerHaptic('light');
 playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
 if (onStartPlayNow) onStartPlayNow();
 else onNavigate('main');
 }}
 className="min-h-[48px] p-2.5 bg-[#fdfcfc] text-[#201d1d] hover:bg-[#f8f7f7] font-bold text-xs rounded-sm border border-[rgba(15,0,0,0.12)] hover:border-[#201d1d] flex items-center justify-center gap-2 cursor-pointer transition-colors"
 >
 <Compass size={15} className="shrink-0" />
 <span>{language === 'ko' ? '[카단 RPG 모험]' : '[RPG Adventure]'}</span>
 </button>

 <button
 type="button"
 onClick={() => {
 triggerHaptic('light');
 playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
 onNavigate('play');
 }}
 className="min-h-[48px] p-2.5 bg-[#fdfcfc] hover:bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] hover:border-[#201d1d] text-left rounded-sm cursor-pointer transition-colors flex items-center justify-between group"
 >
 <div>
 <div className="text-xs font-bold text-[#201d1d] group-hover:underline">
 {language === 'ko' ? '[훈련장 & 미션]' : '[Training Ground]'}
 </div>
 <div className="text-[11px] text-[#646262]">110개 미션 게임</div>
 </div>
 <ArrowRight size={12} className="text-[#646262]" />
 </button>

 <button
 type="button"
 onClick={() => {
 triggerHaptic('light');
 playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
 onNavigate('mydeck');
 }}
 className="min-h-[48px] p-2.5 bg-[#fdfcfc] hover:bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] hover:border-[#201d1d] text-left rounded-sm cursor-pointer transition-colors flex items-center justify-between group"
 >
 <div>
 <div className="text-xs font-bold text-[#201d1d] group-hover:underline">
 {language === 'ko' ? '[마이덱 & 시너지]' : '[My Deck & Synergy]'}
 </div>
 <div className="text-[11px] text-[#646262]">덱 구성 & 육성</div>
 </div>
 <ArrowRight size={12} className="text-[#646262]" />
 </button>
 </div>
 </div>
 )}

 {/* 2. 미디어 라운지 세부 메뉴 */}
 {cat.id === 'media' && (
 <div className="space-y-3">
 {/* 1) 오리지널 IP 미디어 */}
 <div>
 <div className="text-xs font-bold text-[#646262] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
 <span className="w-1.5 h-1.5 bg-[#201d1d] rounded-none inline-block" />
 <span>{language === 'ko' ? '오리지널 스토리 & IP 미디어' : 'Original Story & IP Media'}</span>
 </div>
 <div className="grid grid-cols-2 gap-2">
 <button
 type="button"
 onClick={() => {
 triggerHaptic('light');
 playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
 onNavigate('novel');
 }}
 className="min-h-[48px] p-2.5 bg-[#fdfcfc] hover:bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] hover:border-[#201d1d] text-left rounded-sm cursor-pointer transition-colors flex items-center justify-between group"
 >
 <div className="flex items-center gap-2">
 <BookOpen size={16} className="text-[#201d1d] shrink-0" />
 <div>
 <div className="text-xs font-bold text-[#201d1d] group-hover:underline">
 {language === 'ko' ? '웹소설' : 'Web Novel'}
 </div>
 <div className="text-[11px] text-[#646262]">시즌 공식 스토리</div>
 </div>
 </div>
 <ArrowRight size={12} className="text-[#646262]" />
 </button>

 <button
 type="button"
 onClick={() => {
 triggerHaptic('light');
 playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
 onNavigate('webtoon');
 }}
 className="min-h-[48px] p-2.5 bg-[#fdfcfc] hover:bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] hover:border-[#201d1d] text-left rounded-sm cursor-pointer transition-colors flex items-center justify-between group"
 >
 <div className="flex items-center gap-2">
 <Image size={16} className="text-[#201d1d] shrink-0" />
 <div>
 <div className="text-xs font-bold text-[#201d1d] group-hover:underline">
 {language === 'ko' ? '웹툰' : 'Webtoon'}
 </div>
 <div className="text-[11px] text-[#646262]">영웅 풀컬러 카툰</div>
 </div>
 </div>
 <ArrowRight size={12} className="text-[#646262]" />
 </button>

 <button
 type="button"
 onClick={() => {
 triggerHaptic('light');
 playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
 onNavigate('movie');
 }}
 className="min-h-[48px] p-2.5 bg-[#fdfcfc] hover:bg-[#f8f7f7] border border-red-600/50 hover:border-[#201d1d] text-left rounded-sm cursor-pointer transition-colors flex items-center justify-between group"
 >
 <div className="flex items-center gap-2">
 <Youtube size={16} className="text-red-600 shrink-0" />
 <div>
 <div className="text-xs font-bold text-[#201d1d] group-hover:underline flex items-center gap-1">
 <span>{language === 'ko' ? '애니메이션' : 'Animation'}</span>
 <span className="px-1 py-[1px] bg-red-600 text-[#fdfcfc] text-[9px] font-mono font-black rounded-sm">HIT!</span>
 </div>
 <div className="text-[11px] text-[#646262]">YouTube 40부작 애니</div>
 </div>
 </div>
 <ArrowRight size={12} className="text-[#646262]" />
 </button>

 <button
 type="button"
 onClick={() => {
 triggerHaptic('light');
 playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
 onNavigate('cinema');
 }}
 className="min-h-[48px] p-2.5 bg-[#fdfcfc] hover:bg-[#f8f7f7] border border-red-600/50 hover:border-[#201d1d] text-left rounded-sm cursor-pointer transition-colors flex items-center justify-between group"
 >
 <div className="flex items-center gap-2">
 <Youtube size={16} className="text-red-600 shrink-0" />
 <div>
 <div className="text-xs font-bold text-[#201d1d] group-hover:underline flex items-center gap-1">
 <span>{language === 'ko' ? '무비' : 'Movie'}</span>
 <span className="px-1 py-[1px] bg-red-600 text-[#fdfcfc] text-[9px] font-mono font-black rounded-sm">HIT!</span>
 </div>
 <div className="text-[11px] text-[#646262]">YouTube 40화 무비</div>
 </div>
 </div>
 <ArrowRight size={12} className="text-[#646262]" />
 </button>
 </div>
 </div>

 {/* 2) 바이브코딩 & 개발자 공식 리소스 (6종) */}
 <div className="pt-2 border-t border-[rgba(15,0,0,0.12)]">
 <div className="text-xs font-bold text-[#646262] uppercase tracking-wider mb-1.5 flex items-center justify-between">
 <div className="flex items-center gap-1.5">
 <span className="w-1.5 h-1.5 bg-[#201d1d] rounded-none inline-block" />
 <span>{language === 'ko' ? '바이브코딩 & 공식 개발 리소스' : 'VibeCoding & Dev Resources'}</span>
 </div>
 <span className="text-[11px] text-[#646262] font-mono">6 LINKS [↗]</span>
 </div>
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
 {/* 1. 강의 */}
 <button
 type="button"
 onClick={() => {
 triggerHaptic('light');
 playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
 window.open('https://www.youtube.com/playlist?list=PLV8H2-pD9vH0', '_blank', 'noopener,noreferrer');
 }}
 className="min-h-[48px] p-2.5 bg-[#fdfcfc] hover:bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] hover:border-[#201d1d] text-left rounded-sm cursor-pointer transition-colors flex items-center justify-between group"
 >
 <div className="flex items-center gap-2 min-w-0">
 <GraduationCap size={16} className="text-[#201d1d] shrink-0" />
 <div className="min-w-0">
 <div className="text-xs font-bold text-[#201d1d] group-hover:underline truncate">
 {language === 'ko' ? '바이브코딩 개발 강의' : 'VibeCoding Course'}
 </div>
 <div className="text-[11px] text-[#646262] truncate">AI Studio 웹게임 제작</div>
 </div>
 </div>
 <ExternalLink size={12} className="text-[#646262] shrink-0 ml-1.5" />
 </button>

 {/* 2. 게임 플레이 링크 */}
 <button
 type="button"
 onClick={() => {
 triggerHaptic('light');
 playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
 window.open('https://snshero.com/', '_blank', 'noopener,noreferrer');
 }}
 className="min-h-[48px] p-2.5 bg-[#fdfcfc] hover:bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] hover:border-[#201d1d] text-left rounded-sm cursor-pointer transition-colors flex items-center justify-between group"
 >
 <div className="flex items-center gap-2 min-w-0">
 <Gamepad2 size={16} className="text-[#201d1d] shrink-0" />
 <div className="min-w-0">
 <div className="text-xs font-bold text-[#201d1d] group-hover:underline truncate">
 {language === 'ko' ? '게임 플레이링크' : 'Play Live Game'}
 </div>
 <div className="text-[11px] text-[#646262] truncate">snshero.com 공식 서버</div>
 </div>
 </div>
 <ExternalLink size={12} className="text-[#646262] shrink-0 ml-1.5" />
 </button>

 {/* 3. AI Studio */}
 <button
 type="button"
 onClick={() => {
 triggerHaptic('light');
 playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
 window.open('https://ai.studio/apps/636a37c3-97ce-4c80-be46-8c9a6f793f2d', '_blank', 'noopener,noreferrer');
 }}
 className="min-h-[48px] p-2.5 bg-[#fdfcfc] hover:bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] hover:border-[#201d1d] text-left rounded-sm cursor-pointer transition-colors flex items-center justify-between group"
 >
 <div className="flex items-center gap-2 min-w-0">
 <Cpu size={16} className="text-[#201d1d] shrink-0" />
 <div className="min-w-0">
 <div className="text-xs font-bold text-[#201d1d] group-hover:underline truncate">
 {language === 'ko' ? 'AI Studio 앱 바로가기' : 'AI Studio App'}
 </div>
 <div className="text-[11px] text-[#646262] truncate">Google AI Studio 공식</div>
 </div>
 </div>
 <ExternalLink size={12} className="text-[#646262] shrink-0 ml-1.5" />
 </button>

 {/* 4. GitHub 소스 */}
 <button
 type="button"
 onClick={() => {
 triggerHaptic('light');
 playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
 window.open('https://github.com/Dayyoung/snshero', '_blank', 'noopener,noreferrer');
 }}
 className="min-h-[48px] p-2.5 bg-[#fdfcfc] hover:bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] hover:border-[#201d1d] text-left rounded-sm cursor-pointer transition-colors flex items-center justify-between group"
 >
 <div className="flex items-center gap-2 min-w-0">
 <Github size={16} className="text-[#201d1d] shrink-0" />
 <div className="min-w-0">
 <div className="text-xs font-bold text-[#201d1d] group-hover:underline truncate">
 {language === 'ko' ? '공식 GitHub 소스파일' : 'GitHub Source Code'}
 </div>
 <div className="text-[11px] text-[#646262] truncate">오픈소스 리포지토리</div>
 </div>
 </div>
 <ExternalLink size={12} className="text-[#646262] shrink-0 ml-1.5" />
 </button>

 {/* 5. 개발 프롬프트 */}
 <button
 type="button"
 onClick={() => {
 triggerHaptic('light');
 playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
 window.open('https://snshero.com/snshero.md', '_blank', 'noopener,noreferrer');
 }}
 className="min-h-[48px] p-2.5 bg-[#fdfcfc] hover:bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] hover:border-[#201d1d] text-left rounded-sm cursor-pointer transition-colors flex items-center justify-between group"
 >
 <div className="flex items-center gap-2 min-w-0">
 <FileText size={16} className="text-[#201d1d] shrink-0" />
 <div className="min-w-0">
 <div className="text-xs font-bold text-[#201d1d] group-hover:underline truncate">
 {language === 'ko' ? '개발 프롬프트 명세' : 'Dev Prompt Spec'}
 </div>
 <div className="text-[11px] text-[#646262] truncate">snshero.md 지침서</div>
 </div>
 </div>
 <ExternalLink size={12} className="text-[#646262] shrink-0 ml-1.5" />
 </button>

 {/* 6. 유튜브 채널 */}
 <button
 type="button"
 onClick={() => {
 triggerHaptic('light');
 playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
 window.open('https://www.youtube.com/@snshero', '_blank', 'noopener,noreferrer');
 }}
 className="min-h-[48px] p-2.5 bg-[#fdfcfc] hover:bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] hover:border-[#201d1d] text-left rounded-sm cursor-pointer transition-colors flex items-center justify-between group"
 >
 <div className="flex items-center gap-2 min-w-0">
 <Youtube size={16} className="text-[#201d1d] shrink-0" />
 <div className="min-w-0">
 <div className="text-xs font-bold text-[#201d1d] group-hover:underline truncate">
 {language === 'ko' ? '유튜브 공식 채널' : 'YouTube Channel'}
 </div>
 <div className="text-[11px] text-[#646262] truncate">@snshero 채널 구독</div>
 </div>
 </div>
 <ExternalLink size={12} className="text-[#646262] shrink-0 ml-1.5" />
 </button>
 </div>
 </div>
 </div>
 )}

 {/* 3. 마켓 & 상점 세부 메뉴 */}
 {cat.id === 'market' && (
 <div className="space-y-2">
 <button
 type="button"
 onClick={onOpenStarterPack}
 className="w-full min-h-[48px] p-2.5 bg-[#fdfcfc] hover:bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] hover:border-[#201d1d] rounded-sm cursor-pointer transition-colors flex items-center justify-between group text-left"
 >
 <div className="flex items-center gap-2">
 <span className="px-1.5 py-0.5 bg-[#201d1d] text-[#fdfcfc] text-[10px] font-bold rounded-none">
 {isStarterPackPurchased ? 'ACTIVE' : '93% OFF'}
 </span>
 <div>
 <div className="text-xs font-bold text-[#201d1d] group-hover:underline">
 {language === 'ko' ? '⚡ ₩1,000 스타터팩' : '⚡ ₩1,000 Starter Pack'}
 </div>
 <div className="text-[11px] text-[#646262]">
 {isStarterPackPurchased
 ? (language === 'ko' ? 'SSR 영웅 & 3,000 SNS 지급됨' : 'SSR Hero & 3,000 SNS Active')
 : (language === 'ko' ? 'SSR 확정 + 3,000 SNS' : 'Guaranteed SSR + 3,000 SNS')}
 </div>
 </div>
 </div>
 <span className="text-xs font-bold text-[#201d1d] font-mono">
 {isStarterPackPurchased ? '완료' : '₩1,000 →'}
 </span>
 </button>

 <button
 type="button"
 onClick={onOpenWishingFountain}
 className="w-full min-h-[48px] p-2.5 bg-[#fdfcfc] hover:bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] hover:border-[#201d1d] rounded-sm cursor-pointer transition-colors flex items-center justify-between group text-left"
 >
 <div className="flex items-center gap-2">
 <span className="text-base">⛲</span>
 <div>
 <div className="text-xs font-bold text-[#201d1d] group-hover:underline">
 {language === 'ko' ? '소원의 분수대' : 'Wishing Fountain'}
 </div>
 <div className="text-[11px] text-[#646262]">
 {language === 'ko' ? '매일 1회 무료 동전 투척 & 잭팟' : 'Daily Free Coin & Jackpots'}
 </div>
 </div>
 </div>
 <span className="text-xs font-bold px-2 py-1 bg-[#201d1d] text-[#fdfcfc] rounded-sm">
 {language === 'ko' ? '[던지기]' : '[Toss]'}
 </span>
 </button>

 <div className="grid grid-cols-2 gap-2 pt-1">
 <button
 type="button"
 onClick={() => {
 triggerHaptic('light');
 playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
 onNavigate('shop');
 }}
 className="min-h-[48px] p-2.5 bg-[#fdfcfc] hover:bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] hover:border-[#201d1d] text-left rounded-sm cursor-pointer transition-colors flex items-center justify-between group"
 >
 <div className="flex items-center gap-1.5">
 <ShoppingBag size={15} className="text-[#201d1d]" />
 <span className="text-xs font-bold text-[#201d1d] group-hover:underline">
 {language === 'ko' ? '카드팩 상점' : 'Card Shop'}
 </span>
 </div>
 <ArrowRight size={12} className="text-[#646262]" />
 </button>

 <button
 type="button"
 onClick={() => {
 triggerHaptic('light');
 playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
 onNavigate('mall');
 }}
 className="min-h-[48px] p-2.5 bg-[#fdfcfc] hover:bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] hover:border-[#201d1d] text-left rounded-sm cursor-pointer transition-colors flex items-center justify-between group"
 >
 <div className="flex items-center gap-1.5">
 <Gift size={15} className="text-[#201d1d]" />
 <span className="text-xs font-bold text-[#201d1d] group-hover:underline">
 {language === 'ko' ? '공식 굿즈몰' : 'Merch Mall'}
 </span>
 </div>
 <ArrowRight size={12} className="text-[#646262]" />
 </button>
 </div>
 </div>
 )}

 {/* 4. 시즌 & 미션 세부 메뉴 */}
 {cat.id === 'season' && (
 <div className="space-y-2">
 <button
 type="button"
 onClick={onOpenDailyMissions}
 className="w-full min-h-[48px] p-2.5 bg-[#fdfcfc] hover:bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] hover:border-[#201d1d] rounded-sm cursor-pointer transition-colors space-y-2 group text-left"
 >
 <div className="flex items-center justify-between text-xs font-bold text-[#201d1d]">
 <div className="flex items-center gap-1.5">
 <Trophy size={14} className="text-[#201d1d]" />
 <span className="group-hover:underline">
 {language === 'ko' ? '오늘의 일일 미션' : "Today's Daily Quests"}
 </span>
 </div>
 <div className="flex items-center gap-1.5">
 <span className="font-mono text-xs text-[#201d1d]">
 {dailyCompletedMissions}/{dailyTotalMissions}
 </span>
 {dailyClaimableCount > 0 && (
 <span className="bg-[#201d1d] text-[#fdfcfc] text-[10px] font-bold px-1.5 py-0.5 rounded-sm">
 {language === 'ko' ? `${dailyClaimableCount}개 수령` : `${dailyClaimableCount} Claim`}
 </span>
 )}
 </div>
 </div>
 <div className="w-full bg-[#f1eeee] h-2 rounded-none overflow-hidden border border-[rgba(15,0,0,0.12)]">
 <div
 className="bg-[#201d1d] h-full transition-all duration-300"
 style={{ width: `${missionPercent}%` }}
 />
 </div>
 </button>

 <div className="grid grid-cols-2 gap-2 pt-1">
 <button
 type="button"
 onClick={() => {
 triggerHaptic('light');
 playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
 onNavigate('season-hub');
 }}
 className="min-h-[48px] p-2.5 bg-[#fdfcfc] hover:bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] hover:border-[#201d1d] text-left rounded-sm cursor-pointer transition-colors flex items-center justify-between group"
 >
 <div>
 <div className="text-xs font-bold text-[#201d1d] group-hover:underline">
 {language === 'ko' ? '[시즌 허브]' : '[Season Hub]'}
 </div>
 <div className="text-[11px] text-[#646262]">패스 & 티어 보상</div>
 </div>
 <ArrowRight size={12} className="text-[#646262]" />
 </button>

 <button
 type="button"
 onClick={() => {
 triggerHaptic('light');
 playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
 onNavigate('ranking');
 }}
 className="min-h-[48px] p-2.5 bg-[#fdfcfc] hover:bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] hover:border-[#201d1d] text-left rounded-sm cursor-pointer transition-colors flex items-center justify-between group"
 >
 <div>
 <div className="text-xs font-bold text-[#201d1d] group-hover:underline">
 {language === 'ko' ? '[명예의 전당]' : '[Hall of Fame]'}
 </div>
 <div className="text-[11px] text-[#646262]">실시간 랭킹 순위</div>
 </div>
 <ArrowRight size={12} className="text-[#646262]" />
 </button>
 </div>
 </div>
 )}
 </div>
 </motion.div>
 )}
 </AnimatePresence>
 </div>
 );
 })}
 </div>
 </section>
 );
};
