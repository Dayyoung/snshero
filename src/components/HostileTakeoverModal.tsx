/**
 * HostileTakeoverModal.tsx - SCR-06-24
 * 지분 51% 확보 시 배당률 2배를 독점하는 '적대적 M&A 지분 인수 레이스' 및 골든 사모펀드 M&A 팩(3,300원)
 */

import React from 'react';
import { motion } from 'motion/react';
import { Briefcase, Building, Sparkles, X, Check, Award } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

interface HostileTakeoverModalProps {
  isOpen: boolean;
  onClose: () => void;
  corpName: string;
  myStakePercent: number;
  onBuyShares: () => void;
  onBuyMAPack: () => void;
}

export const HostileTakeoverModal: React.FC<HostileTakeoverModalProps> = ({
  isOpen,
  onClose,
  corpName,
  myStakePercent,
  onBuyShares,
  onBuyMAPack,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 font-mono select-none">
      <div className="bg-slate-950 border-2 border-amber-400 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col text-center">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-black text-xs">
            <Building size={16} />
            <span>🏢 적대적 M&A 지분 인수전</span>
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
          <div className="w-16 h-16 rounded-2xl bg-amber-400/20 border-2 border-amber-400 flex items-center justify-center text-amber-400 text-3xl shadow-lg">
            🤝
          </div>

          <div>
            <div className="text-[10px] text-amber-400 font-bold">
              내 지분율: <span className="text-white text-xs">{myStakePercent.toFixed(1)}%</span> / 목표 51%
            </div>
            <h4 className="text-sm font-black text-white mt-1">[{corpName}] 경영권 인수 도전</h4>
            <p className="text-[11px] text-slate-400 mt-1">
              지분 51%를 초과 확보하면 해당 종목의 일일 배당률이 2배(200%)로 영구 상향되고 전용 골든 회장 칭호를 독점합니다.
            </p>
          </div>

          {/* 48px Action Button */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('heavy');
              onBuyShares();
            }}
            className="h-12 w-full bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer shadow-lg"
          >
            <Briefcase size={16} />
            <span>장내 대량 지분 매집하기 (+5%)</span>
          </button>

          {/* PEF M&A Pack (SCR-06-24) */}
          <div className="w-full p-2.5 bg-amber-950/40 border border-amber-500/40 rounded-xl text-left flex items-center justify-between">
            <div>
              <span className="text-xs font-black text-amber-300 block">골든 사모펀드 M&A 팩</span>
              <span className="text-[9px] text-slate-400">장내 수수료 0% & 우호 지분 +10% 즉시 지원</span>
            </div>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('medium');
                onBuyMAPack();
                onClose();
              }}
              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-black rounded-lg cursor-pointer active:scale-95 shadow"
            >
              구매 (660 SNS)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
