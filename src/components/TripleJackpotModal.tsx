/**
 * TripleJackpotModal.tsx - SCR-08-15
 * 융합 대성공 시 카드가 3장 복제되는 트리플 크리티컬 잭팟 및 연금술 마스터 패스 모달
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Sparkles, X, Shield, Crown, Flame } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

interface TripleJackpotModalProps {
  isOpen: boolean;
  onClose: () => void;
  cardName: string;
  cardRarity: string;
  onClaimAll: () => void;
  onBuyMasterPass?: () => void;
  language?: string;
}

export const TripleJackpotModal: React.FC<TripleJackpotModalProps> = ({
  isOpen,
  onClose,
  cardName,
  cardRarity,
  onClaimAll,
  onBuyMasterPass,
  language = 'ko',
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        onClick={onClose}
        className="fixed inset-0 z-[12000] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 font-mono select-none"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-sm bg-gradient-to-b from-amber-950 via-slate-950 to-black border-2 border-amber-400 rounded-2xl p-6 text-center text-white shadow-2xl relative"
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 text-slate-400 hover:text-white p-1 cursor-pointer"
          >
            <X size={20} />
          </button>

          {/* Golden Trophy Icon */}
          <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center animate-bounce shadow-xl">
            <Crown size={38} className="text-amber-300 fill-amber-300" />
          </div>

          <span className="text-[11px] font-black text-amber-400 uppercase tracking-widest block mb-1 animate-pulse">
            ★ TRIPLE CRITICAL JACKPOT ★
          </span>
          <h2 className="text-xl font-black text-white mb-2">
            {language === 'ko' ? '트리플 크리티컬 잭팟!' : 'Triple Critical Jackpot!'}
          </h2>

          <p className="text-xs text-amber-200/90 mb-4">
            5% 초특급 확률 발동! 융합 결과물이 3장으로 완벽 복제되었습니다!
          </p>

          {/* 3 cards duplication showcase */}
          <div className="flex justify-center gap-2 mb-5">
            {[1, 2, 3].map((num) => (
              <div
                key={num}
                className="w-24 p-2 bg-slate-900 border-2 border-amber-400 rounded-xl flex flex-col items-center shadow-lg"
              >
                <Sparkles size={20} className="text-amber-400 mb-1" />
                <span className="text-[9px] text-amber-300 font-bold">[{cardRarity}]</span>
                <span className="text-[11px] font-black text-white truncate w-full">{cardName}</span>
                <span className="text-[8px] text-emerald-400 font-bold mt-1">x1 복제본</span>
              </div>
            ))}
          </div>

          {/* Claim Button */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('heavy');
              onClaimAll();
              onClose();
            }}
            className="w-full h-12 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-sm rounded-xl mb-3 shadow-xl active:scale-95 cursor-pointer"
          >
            3장 전원 수령하기 (+300%)
          </button>

          {/* Monthly Master Pass Offer */}
          <div className="p-3 bg-slate-900/90 border border-amber-500/30 rounded-xl text-left text-[11px]">
            <div className="flex items-center justify-between text-amber-400 font-black mb-1">
              <span className="flex items-center gap-1">
                <Crown size={14} />
                월간 연금술 마스터 패스
              </span>
              <span>2,200원</span>
            </div>
            <p className="text-slate-300 text-[10px] mb-2">
              실패 시 재료 50% 보존 + 일일 고급 촉매 무료 지급 + 잭팟 확률 2배!
            </p>
            {onBuyMasterPass && (
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('medium');
                  onBuyMasterPass();
                  onClose();
                }}
                className="w-full py-1.5 bg-amber-950/80 border border-amber-600/60 hover:bg-amber-900 text-amber-300 font-bold rounded-lg text-center cursor-pointer active:scale-95"
              >
                패스 혜택 구독하기
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
