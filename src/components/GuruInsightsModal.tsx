/**
 * GuruInsightsModal.tsx - SCR-07-18
 * 적중률 80% 이상 상위 1% 구루의 픽을 열람하고 자동 미러 베팅하는 구루 VIP 인사이트 패스(1,200원)
 */

import React from 'react';
import { Crown, Sparkles, X, Check, TrendingUp, Users } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

interface GuruInsightsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBuyGuruPass: () => void;
}

export const GuruInsightsModal: React.FC<GuruInsightsModalProps> = ({
  isOpen,
  onClose,
  onBuyGuruPass,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 font-mono select-none">
      <div className="bg-slate-950 border-2 border-amber-400 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col text-center">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-black text-xs">
            <Crown size={16} />
            <span>👑 구루 VIP 인사이트 패스</span>
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
          <div className="w-14 h-14 rounded-2xl bg-amber-400/20 border border-amber-400 flex items-center justify-center text-amber-400">
            <TrendingUp size={28} />
          </div>

          <div>
            <h4 className="text-sm font-black text-white">상위 1% 픽 자동 미러 베팅</h4>
            <p className="text-[11px] text-slate-400 mt-1">
              평균 적중률 83.4%를 기록하는 베테랑 구루들의 실시간 베팅 픽을 조회하고 원클릭 동기화할 수 있습니다.
            </p>
          </div>

          {/* Top Guru Stats */}
          <div className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 flex justify-between items-center text-xs">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-400 text-xs font-black">
                G
              </div>
              <div className="text-left">
                <span className="text-white font-bold block">Guru.Apex</span>
                <span className="text-[9px] text-slate-400">최근 30경기 26승</span>
              </div>
            </div>
            <span className="text-emerald-400 font-black">적중률 86.6%</span>
          </div>

          {/* 48px Action Button */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('heavy');
              onBuyGuruPass();
              onClose();
            }}
            className="h-12 w-full bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer shadow-lg"
          >
            <Crown size={16} />
            <span>VIP 인사이트 패스 활성화 (250 SNS)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
