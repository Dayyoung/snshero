/**
 * CardAppraisalMagnifier.tsx - SCR-05-14
 * 모바일 감정사 마이크로 돋보기 뷰어 (2.5배 확대 & 시리얼/포일 각인 검수)
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Sparkles, X, ShieldCheck } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

interface CardAppraisalMagnifierProps {
  isOpen: boolean;
  onClose: () => void;
  cardName: string;
  cardImage: string;
  serialNumber?: string;
  grade?: string;
  foilType?: string;
  language?: string;
}

export const CardAppraisalMagnifier: React.FC<CardAppraisalMagnifierProps> = ({
  isOpen,
  onClose,
  cardName,
  cardImage,
  serialNumber = '#0042/1000',
  grade = 'PSA 10 GEM MINT',
  foilType = 'Cosmic Rainbow Foil',
  language = 'ko',
}) => {
  const [lensPos, setLensPos] = useState<{ x: number; y: number }>({ x: 50, y: 50 });

  if (!isOpen) return null;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setLensPos({ x, y });
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    if (!touch) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((touch.clientX - rect.left) / rect.width) * 100;
    const y = ((touch.clientY - rect.top) / rect.height) * 100;
    setLensPos({ x, y });
  };

  return (
    <AnimatePresence>
      <div
        onClick={onClose}
        className="fixed inset-0 z-[10000] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 font-mono select-none"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-sm bg-slate-900 border-2 border-amber-400 rounded-2xl p-4 text-white shadow-2xl relative"
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 text-slate-400 hover:text-white p-1 cursor-pointer z-20"
          >
            <X size={20} />
          </button>

          <div className="flex items-center gap-2 mb-3">
            <Search size={18} className="text-amber-400" />
            <h2 className="text-sm font-black text-amber-300 uppercase">
              {language === 'ko' ? '🔍 모바일 감정사 2.5x 돋보기' : '🔍 Card Appraisal Lens (2.5x)'}
            </h2>
          </div>

          {/* 인증 배지 및 시리얼 */}
          <div className="flex items-center justify-between bg-slate-800/80 px-3 py-1.5 rounded border border-slate-700 mb-3 text-xs">
            <div className="flex items-center gap-1.5 text-emerald-400 font-black">
              <ShieldCheck size={14} />
              <span>{grade}</span>
            </div>
            <span className="text-amber-400 font-bold">{serialNumber}</span>
          </div>

          {/* 카드 인터랙티브 돋보기 뷰포트 */}
          <div
            onMouseMove={handleMouseMove}
            onTouchMove={handleTouchMove}
            className="relative w-full aspect-[3/4] bg-slate-950 rounded-xl overflow-hidden border border-slate-700 cursor-crosshair group touch-none"
          >
            {/* 기본 카드 이미지 */}
            <img
              src={cardImage}
              alt={cardName}
              className="w-full h-full object-cover opacity-85 pointer-events-none"
            />

            {/* 2.5배 확대 돋보기 원형 렌즈 */}
            <div
              style={{
                left: `${lensPos.x}%`,
                top: `${lensPos.y}%`,
                transform: 'translate(-50%, -50%)',
                backgroundImage: `url(${cardImage})`,
                backgroundPosition: `${lensPos.x}% ${lensPos.y}%`,
                backgroundSize: '250%',
              }}
              className="absolute w-28 h-28 rounded-full border-2 border-amber-400 shadow-2xl pointer-events-none bg-no-repeat ring-4 ring-black/40"
            />

            {/* 포일 홀로그램 힌트 오버레이 */}
            <div className="absolute bottom-2 left-2 right-2 bg-black/75 backdrop-blur-xs px-2 py-1 rounded text-[10px] text-slate-300 flex items-center justify-between pointer-events-none">
              <span className="flex items-center gap-1 text-amber-300">
                <Sparkles size={10} />
                {foilType}
              </span>
              <span className="text-[9px] text-slate-400">
                {language === 'ko' ? '터치 드래그로 검수' : 'Drag to inspect'}
              </span>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 text-center mt-3">
            {language === 'ko'
              ? '카드 표면의 미세 결함, 각인 시리얼 및 홀로그램 무결성을 보증합니다.'
              : 'Verified authentic mint condition and serialized holographic watermark.'}
          </p>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
