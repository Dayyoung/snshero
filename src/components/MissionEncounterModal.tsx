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
}

export const MissionEncounterModal: React.FC<MissionEncounterModalProps> = ({
  isOpen,
  cardId,
  language,
  onStartBattle,
  onClose,
  playSfx,
  lowSpecMode = false
}) => {
  const [countdown, setCountdown] = React.useState<number>(3);

  // 3초 후 자동 배틀 시작 카운트다운 타이머
  useEffect(() => {
    if (!isOpen) {
      setCountdown(3);
      return;
    }

    setCountdown(3);
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          onStartBattle();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, onStartBattle]);

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
    elem === 'water' ? 'bg-cyan-950/90 text-cyan-300 border-cyan-500/70' :
    elem === 'fire' ? 'bg-rose-950/90 text-rose-300 border-rose-500/70' :
    elem === 'air' || elem === 'wind' ? 'bg-sky-950/90 text-sky-300 border-sky-500/70' :
    elem === 'earth' || elem === 'land' ? 'bg-amber-950/90 text-amber-300 border-amber-500/70' :
    elem === 'dragon' || elem === 'holy' ? 'bg-yellow-950/90 text-yellow-300 border-yellow-500/70' :
    elem === 'undead' || elem === 'monster' ? 'bg-purple-950/90 text-purple-300 border-purple-500/70' :
    'bg-slate-900 text-slate-300 border-slate-700';

  const elemAuraGlow = 
    elem === 'water' ? 'shadow-[0_0_35px_rgba(6,182,212,0.35)]' :
    elem === 'fire' ? 'shadow-[0_0_35px_rgba(239,68,68,0.35)]' :
    elem === 'air' || elem === 'wind' ? 'shadow-[0_0_35px_rgba(56,189,248,0.35)]' :
    elem === 'earth' || elem === 'land' ? 'shadow-[0_0_35px_rgba(245,158,11,0.35)]' :
    elem === 'dragon' || elem === 'holy' ? 'shadow-[0_0_35px_rgba(234,179,8,0.35)]' :
    elem === 'undead' || elem === 'monster' ? 'shadow-[0_0_35px_rgba(168,85,247,0.35)]' :
    'shadow-[0_0_30px_rgba(99,102,241,0.3)]';

  const elemIcon = 
    elem === 'water' ? <Droplets size={12} className="text-cyan-400" /> :
    elem === 'fire' ? <Flame size={12} className="text-rose-400" /> :
    elem === 'air' || elem === 'wind' ? <Wind size={12} className="text-sky-400" /> :
    elem === 'earth' || elem === 'land' ? <Mountain size={12} className="text-amber-400" /> :
    elem === 'dragon' || elem === 'holy' ? <Crown size={12} className="text-yellow-400" /> :
    elem === 'undead' || elem === 'monster' ? <Skull size={12} className="text-purple-400" /> :
    <Shield size={12} className="text-slate-400" />;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[20000] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md select-none font-mono overscroll-none"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 320 }}
          className={cn(
            "w-full max-w-md bg-[#0d121d] border-2 border-amber-400/80 rounded-sm text-slate-100 flex flex-col overflow-hidden relative",
            elemAuraGlow
          )}
        >
          {/* Header Bar */}
          <div className="px-3 py-2 sm:px-4 sm:py-2.5 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-amber-400/40 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-black text-amber-300">
              <Swords size={15} className="animate-pulse text-amber-400" />
              <span>{isKo ? '라이벌 도전자 조우' : 'CHALLENGER ENCOUNTER'}</span>
              <span className="text-[10px] text-amber-400/70 font-normal">
                [No.{String(safeCardId).padStart(2, '0')}]
              </span>
              <span className="ml-1 px-1.5 py-0.5 text-[9px] bg-amber-400 text-slate-950 font-black rounded-xs animate-pulse">
                {isKo ? `⚡ ${countdown}초 후 자동 시작` : `⚡ Auto in ${countdown}s`}
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer rounded-sm hover:bg-white/10"
              aria-label={isKo ? '닫기' : 'Close'}
            >
              <X size={18} />
            </button>
          </div>

          {/* Body Section */}
          <div className="p-3.5 sm:p-5 flex flex-col items-center gap-3 sm:gap-4 overflow-y-auto max-h-[75dvh]">
            {/* Novel Episode & Character Tag Banner */}
            <div className="w-full flex items-center justify-between text-[10px] sm:text-[11px] bg-slate-950/80 border border-slate-800 px-2.5 py-1 rounded-sm">
              <div className="flex items-center gap-1 text-purple-300">
                <BookOpen size={12} className="text-purple-400 shrink-0" />
                <span className="truncate">{novelData.sourceNovel}</span>
              </div>
              {novelData.episodeName && (
                <span className="text-amber-400 font-semibold shrink-0 ml-2">
                  {novelData.episodeName}
                </span>
              )}
            </div>

            {/* Character Card Centerpiece with Aura */}
            <div className="relative flex flex-col items-center my-1 group">
              <div className="relative">
                <CardItem
                  card={previewCard}
                  className="w-28 h-40 sm:w-32 sm:h-46 shadow-2xl rounded-sm pointer-events-none"
                  language={language}
                  lowSpecMode={lowSpecMode}
                />
                <div className="absolute -top-1.5 -right-1.5 bg-amber-400 text-slate-950 font-black text-[9px] px-1.5 py-0.5 rounded-sm shadow-md border border-amber-300">
                  P.{dbCard.power || 10}
                </div>
              </div>

              {/* Character Details Pill */}
              <div className="mt-2.5 flex items-center gap-1.5">
                <span className="text-sm sm:text-base font-black text-white tracking-wide">
                  {novelData.characterName}
                </span>
                <span className={cn("text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-xs border flex items-center gap-1", elemBadgeStyle)}>
                  {elemIcon}
                  <span>{novelData.speakerTitle}</span>
                </span>
              </div>
            </div>

            {/* Visual Novel Dialogue Speech Bubble Box */}
            <div className="w-full bg-slate-950/95 border-2 border-indigo-500/40 rounded-sm p-3 sm:p-3.5 relative shadow-inner">
              <div className="flex items-center justify-between border-b border-indigo-500/20 pb-1.5 mb-2">
                <div className="flex items-center gap-1.5">
                  <Sparkles size={13} className="text-amber-400" />
                  <span className="text-xs font-black text-amber-300 tracking-tight">
                    {novelData.characterName}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    ({novelData.speakerTitle})
                  </span>
                </div>
                <span className="text-[9px] text-indigo-400 uppercase tracking-widest font-bold">
                  {isKo ? '소설 대사' : 'Novel Quote'}
                </span>
              </div>

              <div className="relative">
                <p className="text-xs sm:text-[13px] font-medium text-slate-200 leading-relaxed italic break-keep">
                  “{novelData.dialogue}”
                </p>
                <div className="mt-1 text-right">
                  <span className="text-[9px] text-slate-500">
                    ▼ {isKo ? '전투를 시작하려면 버튼을 누르세요' : 'Press button to engage in battle'}
                  </span>
                </div>
              </div>
            </div>

            {/* Deck & Reward Notice */}
            <div className="w-full bg-emerald-950/40 border border-emerald-500/30 px-2.5 py-1.5 rounded-sm text-[10px] sm:text-[11px] text-emerald-300 flex items-center justify-between gap-2">
              <span className="truncate">
                {isKo ? '⚔️ 상대 AI: 이 카드 5장 편성 대결' : '⚔️ Opponent: 5x this card deck'}
              </span>
              <span className="text-amber-300 font-bold shrink-0">
                {isKo ? '승리 시 카드/강화 획득' : 'Win: Card/Upgrade'}
              </span>
            </div>
          </div>

          {/* Action Footer */}
          <div className="p-3 sm:p-4 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 sm:py-3 px-3 rounded-sm border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold transition-all active:scale-95 cursor-pointer touch-target text-center"
            >
              {isKo ? '돌아가기' : 'Cancel'}
            </button>
            <button
              type="button"
              onClick={() => {
                playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
                onStartBattle();
              }}
              className="flex-[2] py-2.5 sm:py-3 px-4 rounded-sm bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-400 text-slate-950 text-xs sm:text-sm font-black transition-all active:scale-95 shadow-lg shadow-amber-500/20 cursor-pointer touch-target flex items-center justify-center gap-1.5 animate-pulse"
            >
              <Swords size={16} className="shrink-0" />
              <span>{isKo ? `⚡ 카드 배틀 시작! (${countdown}초)` : `⚡ Start Card Battle! (${countdown}s)`}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default MissionEncounterModal;
