/**
 * CardHoloTiltPreview.tsx - SCR-03-14
 * 카드 롱프레스 시 자이로/포인터 반응 3D 홀로그램 틸트 프리뷰 + 48px 대표 덱 등록 연동
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Star, Sparkles, Check } from 'lucide-react';
import { CardData } from '../types';
import { triggerHaptic } from '../lib/haptic';

interface CardHoloTiltPreviewProps {
  card: CardData | null;
  isOpen: boolean;
  onClose: () => void;
  onRegisterDeck?: (card: CardData) => void;
  language?: string;
  isInDeck?: boolean;
}

export const CardHoloTiltPreview: React.FC<CardHoloTiltPreviewProps> = ({
  card,
  isOpen,
  onClose,
  onRegisterDeck,
  language = 'ko',
  isInDeck = false,
}) => {
  const [rotate, setRotate] = useState({ x: 0, y: 0 });

  if (!isOpen || !card) return null;

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setRotate({
      x: Math.max(-20, Math.min(20, -y * 0.1)),
      y: Math.max(-20, Math.min(20, x * 0.1)),
    });
  };

  const handlePointerLeave = () => {
    setRotate({ x: 0, y: 0 });
  };

  return (
    <AnimatePresence>
      <div 
        onClick={onClose}
        className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 font-mono select-none"
      >
        <div 
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-xs flex flex-col items-center gap-4"
        >
          {/* 3D 홀로그램 카드 컨테이너 */}
          <div
            onPointerMove={handlePointerMove}
            onPointerLeave={handlePointerLeave}
            style={{ perspective: 800 }}
            className="w-64 h-96 relative cursor-grab active:cursor-grabbing"
          >
            <motion.div
              animate={{
                rotateX: rotate.x,
                rotateY: rotate.y,
              }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              className="w-full h-full bg-gradient-to-br from-indigo-900 via-slate-900 to-purple-950 rounded-xl border-2 border-amber-400 p-4 flex flex-col justify-between shadow-2xl relative overflow-hidden"
            >
              {/* 홀로그램 광택 레이어 */}
              <div 
                className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none"
                style={{
                  transform: `translate(${rotate.y * 3}px, ${rotate.x * 3}px)`,
                }}
              />

              <div className="flex justify-between items-start z-10">
                <span className="text-[11px] font-black text-amber-300 uppercase px-2 py-0.5 bg-amber-500/20 border border-amber-400/40 rounded">
                  {card.rarity || 'RARE'}
                </span>
                <span className="text-xs font-black text-rose-400">
                  ATK {card.attack || card.power || 0}
                </span>
              </div>

              {/* 카드 일러스트 placeholder or icon */}
              <div className="my-auto flex flex-col items-center justify-center text-center z-10">
                <div className="w-24 h-24 rounded-full bg-indigo-500/20 border border-indigo-400/50 flex items-center justify-center mb-2 shadow-inner">
                  <Sparkles size={40} className="text-amber-300 animate-pulse" />
                </div>
                <h3 className="text-base font-black text-white px-2 truncate w-full">
                  {card.name}
                </h3>
                <span className="text-[11px] text-slate-300 mt-1">
                  LV.{card.level || 1} • {card.element?.toUpperCase() || 'NEUTRAL'}
                </span>
              </div>

              <div className="z-10 bg-slate-950/70 p-2 rounded border border-slate-700 text-center">
                <span className="text-[10px] text-amber-300 font-bold">
                  ✨ 3D 홀로그램 프리뷰 (틸트 반응 중)
                </span>
              </div>
            </motion.div>
          </div>

          {/* 48px 대형 덱 등록 액션 버튼 */}
          <div className="w-full flex gap-2">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('medium');
                if (onRegisterDeck) {
                  onRegisterDeck(card);
                }
                onClose();
              }}
              className="flex-1 h-12 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-lg flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg cursor-pointer"
            >
              <Check size={18} />
              <span>
                {isInDeck
                  ? (language === 'ko' ? '덱에서 제거' : 'Remove from Deck')
                  : (language === 'ko' ? '대표 덱 등록 (48px)' : 'Equip to Deck')}
              </span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-12 h-12 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg flex items-center justify-center cursor-pointer active:scale-95"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      </div>
    </AnimatePresence>
  );
};
