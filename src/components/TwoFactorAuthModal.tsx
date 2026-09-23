/**
 * TwoFactorAuthModal.tsx - SCR-12-24
 * 2단계 인증(2FA) 연동 시 사이버 보안관 테두리 + 1,000 다이아 증정 및 세이프티 케어 패스(990원)
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Lock, Gift, X, Check, Key } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

interface TwoFactorAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEnable2FA: () => void;
  onBuySafetyCarePass: () => void;
}

export const TwoFactorAuthModal: React.FC<TwoFactorAuthModalProps> = ({
  isOpen,
  onClose,
  onEnable2FA,
  onBuySafetyCarePass,
}) => {
  const [code, setCode] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 font-mono select-none">
      <div className="bg-slate-950 border-2 border-emerald-400 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col text-center">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-emerald-600 to-teal-500 text-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-black text-xs">
            <ShieldCheck size={16} />
            <span>🛡️ 2단계 보안 인증 (2FA)</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-black/20 flex items-center justify-center text-slate-950 cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>

        <div className="p-5 flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-400/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 text-3xl shadow-lg">
            🔐
          </div>

          <div>
            <div className="text-[10px] text-emerald-400 font-bold">
              연동 보상: [사이버 보안관 테두리] + 1,000 다이아 즉시 증정!
            </div>
            <h4 className="text-sm font-black text-white mt-1">계정 도용 원천 차단</h4>
            <p className="text-[11px] text-slate-400 mt-1">
              Google OTP 또는 모바일 인증 앱을 연동하여 소중한 덱과 자산을 완벽하게 보호하세요.
            </p>
          </div>

          {/* 6 Digit Input */}
          <input
            type="text"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            placeholder="인증코드 6자리 입력"
            className="h-11 w-full bg-slate-900 border border-slate-700 rounded-xl text-center text-lg font-black tracking-widest text-white outline-none focus:border-emerald-400"
          />

          {/* 48px Action Button */}
          <button
            type="button"
            disabled={code.length < 6}
            onClick={() => {
              triggerHaptic('heavy');
              onEnable2FA();
              onClose();
            }}
            className="h-12 w-full bg-gradient-to-r from-emerald-500 to-teal-400 disabled:opacity-50 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer shadow-lg"
          >
            <Check size={16} />
            <span>2FA 연동 및 1,000 다이아 받기</span>
          </button>

          {/* Safety Care Pass (SCR-12-24) */}
          <div className="w-full p-2.5 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-left flex items-center justify-between">
            <div>
              <span className="text-xs font-black text-emerald-300 block">세이프티 케어 패스</span>
              <span className="text-[9px] text-slate-400">분실 시 30일 내 1-클릭 계정 복구 보장</span>
            </div>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('medium');
                onBuySafetyCarePass();
                onClose();
              }}
              className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[10px] font-black rounded-lg cursor-pointer active:scale-95 shadow"
            >
              구매 (190 SNS)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
