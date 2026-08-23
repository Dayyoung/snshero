import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, Zap, Shield, Flame, Droplets, Mountain, Wind, Star, Eye } from 'lucide-react';
import { CardData, Language } from '../types';
import { CARD_DATABASE } from '../cardDatabase';
import { CardItem } from './CardItem';
import { getFormattedCardName } from '../lib/utils';
import { t } from '../lib/i18n';
import { INITIAL_SKILLS } from '../constants';

interface CardLongPressPreviewModalProps {
  card: CardData | null;
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  customImage?: string | null;
}

export const CardLongPressPreviewModal: React.FC<CardLongPressPreviewModalProps> = ({
  card,
  isOpen,
  onClose,
  language,
  customImage
}) => {
  if (!isOpen || !card) return null;

  const dbCard = card.imageIndex !== undefined ? CARD_DATABASE[card.imageIndex] : null;
  const element = (card as any)?.element || (dbCard as any)?.element || 'NEUTRAL';
  const faction = (card as any)?.faction || (dbCard as any)?.faction || 'NEUTRAL';
  const rarity = (card.rarity || dbCard?.rarity || 'common').toUpperCase();

  const getElementAdvantage = (el: string) => {
    switch (el.toUpperCase()) {
      case 'WATER':
        return {
          strong: 'FIRE (+2)',
          weak: 'WIND (-2)',
          color: 'text-cyan-400',
          icon: Droplets,
          descKo: '화속성(FIRE)에 우세 (+2 ATK), 풍속성(WIND)에 열세',
          descEn: 'Strong against FIRE (+2 ATK), Weak against WIND'
        };
      case 'FIRE':
        return {
          strong: 'EARTH (+2)',
          weak: 'WATER (-2)',
          color: 'text-rose-400',
          icon: Flame,
          descKo: '지속성(EARTH)에 우세 (+2 ATK), 수속성(WATER)에 열세',
          descEn: 'Strong against EARTH (+2 ATK), Weak against WATER'
        };
      case 'EARTH':
        return {
          strong: 'WIND (+2)',
          weak: 'FIRE (-2)',
          color: 'text-amber-400',
          icon: Mountain,
          descKo: '풍속성(WIND)에 우세 (+2 ATK), 화속성(FIRE)에 열세',
          descEn: 'Strong against WIND (+2 ATK), Weak against FIRE'
        };
      case 'WIND':
        return {
          strong: 'WATER (+2)',
          weak: 'EARTH (-2)',
          color: 'text-emerald-400',
          icon: Wind,
          descKo: '수속성(WATER)에 우세 (+2 ATK), 지속성(EARTH)에 열세',
          descEn: 'Strong against WATER (+2 ATK), Weak against EARTH'
        };
      default:
        return {
          strong: 'NONE',
          weak: 'NONE',
          color: 'text-slate-300',
          icon: Sparkles,
          descKo: '무속성: 상성 증감 효과 없음 (표준 스탯)',
          descEn: 'Neutral: No elemental modifier (Standard Stats)'
        };
    }
  };

  const elInfo = getElementAdvantage(element);
  const ElIcon = elInfo.icon;

  const cardStats = card.stats || [1, 1, 1, 1];
  const topStat = cardStats[0];
  const rightStat = cardStats[1];
  const bottomStat = cardStats[2];
  const leftStat = cardStats[3];

  const activeSkills = (card.skills || []).filter((s: any) => s.level > 0);

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[10020] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm font-mono select-none"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 15 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="relative w-full max-w-sm bg-slate-900 border border-slate-700 rounded-sm p-4 text-slate-100 shadow-2xl flex flex-col gap-3.5 max-h-[90dvh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-0.5 rounded-sm bg-indigo-950 border border-indigo-500/40 text-indigo-300 font-bold">
                [ZOOM PREVIEW]
              </span>
              <span className="text-[11px] font-black text-amber-400 uppercase">
                {rarity} · Lv.{card.level || 1}
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-sm bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
              aria-label="Close Preview"
            >
              <X size={16} />
            </button>
          </div>

          {/* Card Showcase & Directional Stats */}
          <div className="flex items-center gap-4 bg-slate-950/80 p-3 rounded-sm border border-slate-800">
            <div className="w-24 h-34 shrink-0 relative flex items-center justify-center">
              <CardItem
                card={card}
                isLocked={true}
                className="w-full h-full rounded-sm border border-slate-700 pointer-events-none"
                customImage={customImage}
                lowSpecMode={false}
              />
            </div>

            {/* 4-Directional Stat Cross Grid */}
            <div className="flex-1 flex flex-col items-center justify-center gap-1 text-xs">
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">
                {language === 'ko' ? '4방향 전투력 수치' : '4-WAY COMBAT STATS'}
              </span>
              
              {/* TOP */}
              <div className="w-12 py-1 bg-slate-800 border border-slate-600 rounded-sm text-center font-black text-amber-300">
                ▲ {topStat}
              </div>
              
              {/* LEFT / CENTER / RIGHT */}
              <div className="flex items-center gap-2">
                <div className="w-12 py-1 bg-slate-800 border border-slate-600 rounded-sm text-center font-black text-amber-300">
                  ◀ {leftStat}
                </div>
                <div className="w-8 h-8 rounded-sm bg-indigo-900/60 border border-indigo-500/50 flex items-center justify-center text-[10px] font-black text-indigo-300">
                  CP
                </div>
                <div className="w-12 py-1 bg-slate-800 border border-slate-600 rounded-sm text-center font-black text-amber-300">
                  {rightStat} ▶
                </div>
              </div>

              {/* BOTTOM */}
              <div className="w-12 py-1 bg-slate-800 border border-slate-600 rounded-sm text-center font-black text-amber-300">
                ▼ {bottomStat}
              </div>
            </div>
          </div>

          {/* Card Info Details */}
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center bg-slate-950/60 px-3 py-2 rounded-sm border border-slate-800">
              <span className="text-slate-400 font-bold">{language === 'ko' ? '카드 이름' : 'Card Name'}</span>
              <span className="font-black text-white text-sm">
                {getFormattedCardName(card, language)}
              </span>
            </div>

            {/* Element and Advantage */}
            <div className="bg-slate-950/60 p-2.5 rounded-sm border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold">
                  <ElIcon size={14} className={elInfo.color} />
                  <span className={elInfo.color}>{element}</span>
                </div>
                <span className="text-[10px] text-slate-400 font-bold">
                  FACTION: {faction}
                </span>
              </div>
              <p className="text-[10px] text-slate-300 leading-tight">
                {language === 'ko' ? elInfo.descKo : elInfo.descEn}
              </p>
            </div>

            {/* Skills Information */}
            <div className="bg-slate-950/60 p-2.5 rounded-sm border border-slate-800 space-y-2">
              <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase tracking-wider border-b border-slate-800/80 pb-1">
                <Zap size={13} className="text-amber-400" />
                <span>{language === 'ko' ? '스킬 및 패시브' : 'Skills & Passives'}</span>
              </div>
              {activeSkills.length === 0 ? (
                <p className="text-[10px] text-slate-500 italic py-1">
                  {language === 'ko' ? '발현된 특수 스킬 없음 (기본 카드)' : 'No special skill node unlocked'}
                </p>
              ) : (
                <div className="space-y-1.5">
                  {activeSkills.map((skill: any) => {
                    const baseSkill = INITIAL_SKILLS.find(s => s.id === skill.id) || skill;
                    const skillName = language === 'ko' ? (baseSkill.nameKo || baseSkill.name) : (baseSkill.nameEn || baseSkill.name);
                    const skillDesc = language === 'ko' ? (baseSkill.descriptionKo || baseSkill.description) : (baseSkill.descriptionEn || baseSkill.description);
                    return (
                      <div key={skill.id} className="p-1.5 rounded-sm bg-slate-900 border border-slate-800 text-[10px]">
                        <div className="flex justify-between items-center font-bold text-amber-300 mb-0.5">
                          <span>⚡ {skillName}</span>
                          <span className="text-[9px] text-slate-400">Lv.{skill.level}</span>
                        </div>
                        <p className="text-slate-300 text-[9px]">{skillDesc}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Close Action Button */}
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 rounded-sm font-bold text-xs uppercase tracking-wider transition-all active:scale-[0.98] cursor-pointer"
          >
            {language === 'ko' ? '확인 (닫기)' : 'Close'}
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
