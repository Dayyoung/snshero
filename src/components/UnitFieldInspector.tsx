/**
 * UnitFieldInspector.tsx - SCR-02-14
 * 유닛 롱프레스 시 버프/디버프/스탯 1.5배 확대 스마트 필드 인스펙터 모달
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Shield, Zap, Heart, Swords } from 'lucide-react';
import { CardData } from '../types';

interface UnitFieldInspectorProps {
  unit: CardData | null;
  isOpen: boolean;
  onClose: () => void;
  language?: string;
}

export const UnitFieldInspector: React.FC<UnitFieldInspectorProps> = ({
  unit,
  isOpen,
  onClose,
  language = 'ko',
}) => {
  if (!isOpen || !unit) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-mono select-none">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1.15, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className="w-full max-w-xs bg-slate-900 border-2 border-amber-400 rounded-lg p-4 text-white shadow-2xl relative"
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute top-2 right-2 text-slate-400 hover:text-white p-1"
          >
            <X size={18} />
          </button>

          <div className="text-center pb-2 border-b border-slate-700">
            <span className="text-[10px] text-amber-400 uppercase tracking-widest font-black">
              🔍 {language === 'ko' ? '스마트 필드 인스펙터' : 'Field Inspector'}
            </span>
            <h3 className="text-base font-black text-white mt-1 truncate">
              {unit.name}
            </h3>
            <span className="text-[10px] text-indigo-300 font-bold">
              LV.{unit.level || 1} • {unit.rarity?.toUpperCase() || 'COMMON'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 my-3 text-center">
            <div className="bg-slate-800/80 p-2 rounded border border-slate-700">
              <div className="flex items-center justify-center gap-1 text-rose-400 text-xs font-bold mb-0.5">
                <Swords size={14} /> ATK
              </div>
              <div className="text-sm font-black text-rose-300">{unit.attack || unit.power || 0}</div>
            </div>
            <div className="bg-slate-800/80 p-2 rounded border border-slate-700">
              <div className="flex items-center justify-center gap-1 text-emerald-400 text-xs font-bold mb-0.5">
                <Heart size={14} /> HP
              </div>
              <div className="text-sm font-black text-emerald-300">{unit.hp || 100}</div>
            </div>
          </div>

          <div className="space-y-1.5 bg-slate-950/60 p-2.5 rounded border border-slate-800 text-[11px]">
            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-1 text-sky-400">
                <Shield size={12} /> {language === 'ko' ? '방어력' : 'DEF'}
              </span>
              <span className="font-bold">{unit.defense || 0}</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-1 text-amber-400">
                <Zap size={12} /> {language === 'ko' ? '활성 버프' : 'Buffs'}
              </span>
              <span className="text-amber-300 font-bold">
                {language === 'ko' ? '공격력 +15% 증가' : 'ATK +15%'}
              </span>
            </div>
          </div>

          <p className="text-[9px] text-slate-400 text-center mt-3">
            {language === 'ko' ? '화면을 탭하여 닫기' : 'Tap anywhere to dismiss'}
          </p>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
