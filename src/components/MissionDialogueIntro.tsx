import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Swords, MessageSquare, FastForward } from 'lucide-react';
import { CARD_DATABASE } from '../cardDatabase';
import { getMissionCardDialogue } from '../data/cardDialogues';
import { CardItem } from './CardItem';
import type { CardData } from '../types';

interface MissionDialogueIntroProps {
  isOpen: boolean;
  cardId: number;
  language: string;
  onComplete: () => void;
  onSkip?: () => void;
}

export const MissionDialogueIntro: React.FC<MissionDialogueIntroProps> = ({
  isOpen,
  cardId,
  language,
  onComplete,
  onSkip
}) => {
  const [countdown, setCountdown] = useState(3);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const safeCardId = CARD_DATABASE[cardId] ? cardId : 1;
  const card = CARD_DATABASE[safeCardId] || CARD_DATABASE[1];
  const dialogue = getMissionCardDialogue(safeCardId, card?.element);

  const previewCard: CardData = useMemo(() => ({
    id: `mission-intro-${safeCardId}`,
    title: card.title,
    title_dis: card.title_dis || card.title,
    title_en: card.title_en || card.title,
    stats: [...card.stats],
    rarity: card.rarity || 'bronze',
    owner: 'ai',
    level: card.level || 1,
    power: card.power || 10,
    imageIndex: safeCardId,
    imageUrl: card.imageUrl,
    element: card.element,
    skills: []
  }), [safeCardId, card]);

  const cardTitle = language === 'ko' ? card.title : (card.title_en || card.title);
  const cardElem = (card.element || 'neutral').toLowerCase();

  const elemBadgeColor =
    cardElem === 'fire' ? 'text-rose-400 bg-rose-950/80 border-rose-600' :
    cardElem === 'water' ? 'text-cyan-400 bg-cyan-950/80 border-cyan-600' :
    cardElem === 'wind' || cardElem === 'air' ? 'text-sky-400 bg-sky-950/80 border-sky-600' :
    cardElem === 'earth' || cardElem === 'land' ? 'text-amber-400 bg-amber-950/80 border-amber-600' :
    cardElem === 'dragon' || cardElem === 'holy' ? 'text-yellow-300 bg-yellow-950/80 border-yellow-500' :
    cardElem === 'undead' || cardElem === 'monster' ? 'text-purple-400 bg-purple-950/80 border-purple-600' :
    'text-stone-300 bg-stone-900 border-stone-600';

  const elemIcon =
    cardElem === 'fire' ? '🔥' :
    cardElem === 'water' ? '💧' :
    cardElem === 'wind' || cardElem === 'air' ? '🌪️' :
    cardElem === 'earth' || cardElem === 'land' ? '⛰️' :
    cardElem === 'dragon' || cardElem === 'holy' ? '✦' :
    cardElem === 'undead' || cardElem === 'monster' ? '💀' : '⚔️';

  useEffect(() => {
    if (!isOpen) {
      setCountdown(3);
      return;
    }

    setCountdown(3);
    const timer = setInterval(() => {
      setCountdown(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (countdown === 0) {
      const t = setTimeout(() => {
        onCompleteRef.current();
      }, 250);
      return () => clearTimeout(t);
    }
  }, [isOpen, countdown]);

  if (!isOpen) return null;

  const quoteText = language === 'ko' ? dialogue.quote : dialogue.quote_en;
  const tauntText = language === 'ko' ? dialogue.taunt : dialogue.taunt_en;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/92 backdrop-blur-md p-4 font-mono select-none"
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 25 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 25 }}
          className="w-full max-w-lg bg-[#0b1017] border-2 border-emerald-500/80 rounded-none shadow-[0_0_50px_rgba(16,185,129,0.3)] p-5 relative overflow-hidden"
        >
          {/* Subtle Grid Backdrop */}
          <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(16,185,129,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.05)_1px,transparent_1px)] bg-[size:20px_20px]" />

          {/* Top Bar Header */}
          <div className="flex items-center justify-between border-b border-emerald-500/30 pb-2.5 mb-4 relative z-10">
            <div className="flex items-center gap-2">
              <span className="p-1 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
                <Swords size={16} />
              </span>
              <div>
                <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">
                  HERO MISSION INTRO
                </span>
                <h3 className="text-xs text-white font-bold">
                  {language === 'ko' ? '미션 카드 수호자 결투 준비' : 'Guardian Duel Preparation'}
                </h3>
              </div>
            </div>

            {/* 3s Countdown Pill */}
            <div className="flex items-center gap-1.5 bg-emerald-950/80 border border-emerald-400 px-2.5 py-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-emerald-300 font-black text-sm">
                {countdown > 0 ? `${countdown}s` : 'START!'}
              </span>
            </div>
          </div>

          {/* Main Content: Card Art + Speech Bubble */}
          <div className="flex flex-col sm:flex-row items-center gap-4 relative z-10 my-2">
            {/* Real Card Centerpiece */}
            <div className="relative shrink-0 flex flex-col items-center justify-center">
              <div className="relative rounded-xs shadow-[0_0_24px_rgba(16,185,129,0.4)] border-2 border-emerald-400/90 overflow-hidden bg-[#090d16]">
                <CardItem
                  card={previewCard}
                  className="w-28 h-40 sm:w-32 sm:h-46 rounded-xs pointer-events-none"
                  language={language}
                />
                <div className="absolute top-1 right-1 bg-black/85 text-amber-300 font-mono font-black text-[9px] px-1.5 py-0.5 rounded-xs border border-amber-400/60 shadow-md">
                  P.{card.power || 10}
                </div>
              </div>
              <div className="mt-1.5 flex items-center gap-1.5">
                <span className="text-[10px] font-black text-emerald-300 font-mono bg-black/80 px-1.5 py-0.5 border border-emerald-500/50 rounded-xs">
                  No.{String(safeCardId).padStart(3, '0')}
                </span>
                <span className={`text-[9px] px-1.5 py-0.5 border font-bold rounded-xs ${elemBadgeColor}`}>
                  {elemIcon} {cardElem.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Character Dialogue Bubble */}
            <div className="flex-1 w-full bg-[#121922] border border-emerald-500/40 p-3.5 relative rounded-none flex flex-col justify-between min-h-[140px]">
              {/* Corner Tag */}
              <div className="flex items-center gap-1.5 mb-2 text-emerald-400 text-[10px] font-bold">
                <MessageSquare size={13} />
                <span>[ {cardTitle}의 대사 ]</span>
              </div>

              {/* Main Dialogue Quote */}
              <div className="text-sm text-white font-black leading-relaxed tracking-tight my-auto pl-2 border-l-2 border-emerald-400">
                "{quoteText}"
              </div>

              {/* Sub-Taunt */}
              <div className="mt-2 text-[11px] text-stone-300 italic pl-2">
                ▶ {tauntText}
              </div>
            </div>
          </div>

          {/* Progress Bar for 3 Seconds */}
          <div className="w-full h-1.5 bg-slate-800 rounded-none overflow-hidden mt-4 relative z-10">
            <motion.div
              className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-300"
              initial={{ width: '0%' }}
              animate={{ width: `${((3 - countdown) / 3) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          {/* Footer Bar: Auto Start Notice & Quick Skip */}
          <div className="flex items-center justify-between mt-3 text-[11px] text-stone-400 relative z-10">
            <span className="flex items-center gap-1 text-emerald-300/80">
              <Sparkles size={12} className="text-emerald-400" />
              {language === 'ko' ? '3초 후 자동으로 카드 배틀이 시작됩니다...' : 'Battle starts automatically in 3 seconds...'}
            </span>

            <button
              type="button"
              onClick={onSkip || onComplete}
              className="min-h-[36px] px-3 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-400/60 rounded-none font-black text-[11px] flex items-center gap-1 cursor-pointer active:scale-95 transition-all"
            >
              <FastForward size={12} />
              <span>{language === 'ko' ? '즉시 시작' : 'Skip & Start'}</span>
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
