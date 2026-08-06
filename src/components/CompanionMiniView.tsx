import React from 'react';
import { motion } from 'motion/react';
import { CardData, Language } from '../types';
import { t } from '../lib/i18n';
import { CardItem } from './CardItem';
import { CARD_DATABASE } from '../cardDatabase';
import { Heart, Utensils, Star, Sparkles, Zap, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Gift } from 'lucide-react';
import { cn } from '../lib/utils';
import { INITIAL_SKILLS } from '../constants';

const iconMap: Record<string, any> = {
  Zap,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Gift,
  Star
};

interface CompanionMiniViewProps {
  companion: CardData | undefined;
  onClick: () => void;
  onChangeTarget: () => void;
  language: Language;
  selectedIndex: number;
  customCardImage?: string | null;
  processedCardImages?: string[];
}

export const CompanionMiniView: React.FC<CompanionMiniViewProps> = ({ companion, onClick, onChangeTarget, language, selectedIndex, customCardImage, processedCardImages }) => {
  if (!companion) return null;

  return (
    <motion.div 
      whileHover={{ scale: 1.01 }}
      className="ollama-panel group transition-all border-2 border-black/5 bg-white/50"
    >
      <div className="flex items-center justify-between mb-4 px-1">
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onChangeTarget();
          }}
          className="flex items-center gap-2 px-3 py-1.5 bg-black text-white hover:bg-black/80 rounded-lg transition-all"
        >
          <Sparkles size={16} className="text-yellow-400 animate-pulse" />
          <h3 className="text-sm font-black italic tracking-tighter uppercase">{t('manage_companion', language)}</h3>
        </button>
      </div>

      <div className="flex gap-4 cursor-pointer" onClick={onClick}>
        <div className="relative bg-amber-50/30 p-2 rounded-lg border border-black/5 overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/grid-me.png')] opacity-10" />
          <motion.div
            animate={{
              y: [0, -4, 0],
              rotate: [0, 1, -1, 0],
              scale: [1, 1.02, 1]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <CardItem 
              card={companion} 
              className="w-20 h-28 shadow-lg group-hover:shadow-xl transition-shadow" 
              customImage={customCardImage} 
              processedImage={processedCardImages?.[(companion?.imageIndex || 1) - 1]}
            />
          </motion.div>
          <div className="absolute -bottom-1 -right-1 bg-black text-white text-[8px] font-bold px-1 py-0.5 z-30">SLOT_{selectedIndex + 1}</div>
        </div>
        
        <div className="flex-1 flex flex-col justify-center space-y-3">
          <div>
            <div className="text-[10px] font-bold opacity-50 uppercase mb-1">{t('level', language) || 'Card Level'}</div>
            <div className="text-2xl font-black italic text-blue-600">Lv.{companion.level || 1}</div>
          </div>

          <div className="flex flex-wrap gap-1 pt-1">
            {companion.skills?.filter(s => s.level > 0).map(skill => {
              const Icon = iconMap[skill.icon] || Zap;
              const baseSkill = INITIAL_SKILLS.find(s => s.id === skill.id);
              const name = language === 'ko' ? (baseSkill?.name || skill.name) : (baseSkill?.name_en || skill.name_en);
              const desc = language === 'ko' ? (baseSkill?.description || skill.description) : (baseSkill?.description_en || skill.description_en);
              
              return (
                <div key={skill.id} className="relative group/skill">
                  <div className="p-1 rounded-md bg-black/5 hover:bg-black/10 transition-colors cursor-help">
                    <Icon size={12} className="text-black/60" />
                  </div>
                  
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-32 p-2 bg-black text-white text-[10px] rounded-lg opacity-0 group-hover/skill:opacity-100 pointer-events-none transition-all z-50 shadow-xl border border-white/10">
                    <div className="font-black border-b border-white/20 pb-1 mb-1 flex justify-between uppercase italic">
                      <span>{name}</span>
                      <span className="text-yellow-400">Lv.{skill.level}</span>
                    </div>
                    <p className="font-bold opacity-80 leading-tight">{desc}</p>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-black" />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-col">
            {companion.customName && (
              <p className="text-[12px] font-black text-blue-600 uppercase italic mb-1">
                 "{companion.customName}"
              </p>
            )}
            <p className="text-[11px] font-bold text-black border-l-2 border-black pl-2 italic">
              {companion.notes || t('companion_nav_hint', language)}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
