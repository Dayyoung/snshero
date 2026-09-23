/**
 * SocialLinkSecurityFestaModal.tsx - SCR-12-27
 * 소셜 계정 연동 즉시 최고 등급 소환권 10장과 한정판 프로필 테두리를 증정하는 '보안 강화 안심 연동 페스타' 도입 및
 * '첫 연동 기념 스타터 스페셜 번들(1,100원 타임딜)' 연동.
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Gift, Sparkles, X, Check, Zap, ExternalLink } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

interface SocialLinkSecurityFestaModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLinked: boolean;
  onLinkAccount: (provider: 'google' | 'apple' | 'email') => void;
  onBuyStarterSpecialBundle: () => void;
}

export const SocialLinkSecurityFestaModal: React.FC<SocialLinkSecurityFestaModalProps> = ({
  isOpen,
  onClose,
  isLinked,
  onLinkAccount,
  onBuyStarterSpecialBundle,
}) => {
  const [hasBoughtStarter, setHasBoughtStarter] = useState(() => {
    return localStorage.getItem('hero_starter_special_bundle') === 'purchased';
  });

  useEffect(() => {
    if (!isOpen) return;
    triggerHaptic('medium');
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBuy = () => {
    triggerHaptic('heavy');
    localStorage.setItem('hero_starter_special_bundle', 'purchased');
    setHasBoughtStarter(true);
    onBuyStarterSpecialBundle();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 font-mono select-none overflow-hidden">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-slate-950 border-2 border-cyan-400 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col text-center"
      >
        {/* Header */}
        <div className="p-3.5 bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-500 text-slate-950 flex items-center justify-between font-black text-xs">
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={16} />
            <span>[ 보안 강화 안심 연동 페스타 ]</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded bg-black/20 flex items-center justify-center cursor-pointer active:scale-95"
          >
            <X size={14} />
          </button>
        </div>

        <div className="p-5 flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-cyan-950/60 border border-cyan-400 flex items-center justify-center text-4xl shadow animate-pulse">
            🛡️
          </div>

          <div>
            <h3 className="text-sm font-black text-white">소셜 연동하고 계정 데이터 영구 보호!</h3>
            <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
              기기 변경이나 브라우저 초기화 시에도 안전하게 보존됩니다.
              <br />
              연동 완료 즉시 <strong className="text-cyan-300">최고등급 소환권 10장 + 한정 테두리</strong> 지급!
            </p>
          </div>

          {/* Social Link Providers */}
          {isLinked ? (
            <div className="w-full p-3 bg-emerald-950/40 border border-emerald-500/60 rounded-xl text-emerald-400 font-bold text-xs flex items-center justify-center gap-1.5">
              <Check size={16} />
              <span>소셜 계정 안심 연동 완료됨</span>
            </div>
          ) : (
            <div className="w-full grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('heavy');
                  onLinkAccount('google');
                }}
                className="h-11 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer shadow"
              >
                <span>Google 연동</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('heavy');
                  onLinkAccount('apple');
                }}
                className="h-11 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer shadow"
              >
                <span>Apple 연동</span>
              </button>
            </div>
          )}

          {/* Starter Special Bundle (1,100 KRW / 110 SNS Time Deal) */}
          <div className="w-full p-3 bg-gradient-to-b from-amber-950/40 to-slate-900 border border-amber-500/40 rounded-xl text-left space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-amber-300 flex items-center gap-1">
                <Gift size={13} /> 첫 연동 기념 스타터 스페셜 번들
              </span>
              <span className="text-[9px] text-amber-400 bg-amber-950 px-1.5 py-0.2 rounded border border-amber-500/30">
                타임 세일
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              다이아 500개 + 골드 50,000G + 경험치 부스터 24시간 (1,100원 / 110 SNS)
            </p>
            <div className="flex justify-end pt-1">
              {hasBoughtStarter ? (
                <span className="text-emerald-400 text-xs font-bold flex items-center gap-1">
                  <Check size={14} /> 구매 완료
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleBuy}
                  className="px-3 py-1.5 bg-amber-500 text-slate-950 text-xs font-black rounded-lg active:scale-95 cursor-pointer shadow"
                >
                  구매하기
                </button>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="h-10 w-full bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-xs rounded-xl active:scale-95 cursor-pointer border border-slate-800"
          >
            닫기
          </button>
        </div>
      </motion.div>
    </div>
  );
};
