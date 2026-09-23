/**
 * SmartBuyOrderLimitModal.tsx - SCR-05-30
 * 희망 매수가를 등록하면 조건 부합 매물 등록 시 자동 체결되는 '스마트 매수 예약(Buy Order Limit)' 시스템 도입 및
 * 체결 알림 푸시, 매수 예약 슬롯 확장을 위한 '트레이더 VIP 라이선스(월간 3,300원 패스)' 연동.
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Clock, ShieldCheck, Plus, Check, Bell, Award, X, Zap } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

export interface BuyOrder {
  id: string;
  cardName: string;
  targetPrice: number;
  grade: string;
  status: 'active' | 'filled' | 'cancelled';
  createdAt: number;
}

interface SmartBuyOrderLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  cardName: string;
  cardGrade: string;
  avgPrice: number;
  onRegisterOrder: (targetPrice: number) => void;
  onBuyTraderVipPass: () => void;
  activeOrders: BuyOrder[];
}

export const SmartBuyOrderLimitModal: React.FC<SmartBuyOrderLimitModalProps> = ({
  isOpen,
  onClose,
  cardName,
  cardGrade,
  avgPrice,
  onRegisterOrder,
  onBuyTraderVipPass,
  activeOrders,
}) => {
  const [targetPrice, setTargetPrice] = useState(avgPrice ? Math.floor(avgPrice * 0.9) : 100);
  const [hasTraderVip, setHasTraderVip] = useState(() => {
    return localStorage.getItem('hero_trader_vip_license') === 'active';
  });
  const [registeredSuccess, setRegisteredSuccess] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    triggerHaptic('medium');
    setRegisteredSuccess(false);
  }, [isOpen]);

  if (!isOpen) return null;

  const maxSlots = hasTraderVip ? 10 : 3;

  const handleRegister = () => {
    if (activeOrders.length >= maxSlots) {
      triggerHaptic('heavy');
      return;
    }
    triggerHaptic('heavy');
    onRegisterOrder(targetPrice);
    setRegisteredSuccess(true);
  };

  const handleBuyVip = () => {
    triggerHaptic('heavy');
    localStorage.setItem('hero_trader_vip_license', 'active');
    setHasTraderVip(true);
    onBuyTraderVipPass();
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
            <Clock size={16} />
            <span>[ 스마트 매수 예약 (Buy Order Limit) ]</span>
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
          <div>
            <span className="text-xs font-black text-cyan-300">
              [{cardGrade}] {cardName}
            </span>
            <h3 className="text-sm font-black text-white mt-0.5">원하는 가격에 자동 매수 예약</h3>
            <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
              해당 가격 이하로 매물이 등록되는 즉시 우선 체결되며 푸시 알림을 발송합니다.
            </p>
          </div>

          {/* Slot Capacity Status */}
          <div className="w-full flex justify-between items-center text-xs text-slate-400 px-1">
            <span>사용 중인 예약 슬롯</span>
            <span className="text-cyan-300 font-bold">
              {activeOrders.length} / {maxSlots} 슬롯
            </span>
          </div>

          {/* Price Selector */}
          <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-3 flex flex-col gap-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-bold">희망 매수가격 (SNS)</span>
              <span className="text-amber-400 font-black text-sm">{targetPrice} SNS</span>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => setTargetPrice((p) => Math.max(10, p - 50))}
                className="h-9 bg-slate-800 rounded-lg text-slate-300 text-xs font-bold active:scale-95 cursor-pointer"
              >
                -50
              </button>
              <button
                type="button"
                onClick={() => setTargetPrice(avgPrice || 100)}
                className="h-9 bg-slate-800 rounded-lg text-amber-400 text-xs font-bold active:scale-95 cursor-pointer"
              >
                시세 기준
              </button>
              <button
                type="button"
                onClick={() => setTargetPrice((p) => p + 50)}
                className="h-9 bg-slate-800 rounded-lg text-slate-300 text-xs font-bold active:scale-95 cursor-pointer"
              >
                +50
              </button>
            </div>
          </div>

          {/* Register Action Button */}
          {!registeredSuccess ? (
            <button
              type="button"
              disabled={activeOrders.length >= maxSlots}
              onClick={handleRegister}
              className={`h-12 w-full font-black text-xs rounded-xl flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer shadow ${
                activeOrders.length < maxSlots
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 hover:brightness-105'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Plus size={16} />
              <span>
                {activeOrders.length < maxSlots ? '스마트 매수 예약 등록' : '예약 슬롯 가득참'}
              </span>
            </button>
          ) : (
            <div className="w-full p-2.5 bg-emerald-950/40 border border-emerald-500/60 rounded-xl text-emerald-400 font-bold text-xs flex items-center justify-center gap-1.5">
              <Check size={16} />
              <span>매수 예약이 성공적으로 접수되었습니다!</span>
            </div>
          )}

          {/* Trader VIP License Pass Offer (3,300 KRW / 330 SNS) */}
          {!hasTraderVip && (
            <div className="w-full p-3 bg-gradient-to-b from-amber-950/40 to-slate-900 border border-amber-500/40 rounded-xl text-left space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-amber-300 flex items-center gap-1">
                  <Award size={13} /> 트레이더 VIP 라이선스 (월간)
                </span>
                <span className="text-[9px] text-amber-400 bg-amber-950 px-1.5 py-0.2 rounded border border-amber-500/30">
                  슬롯 10개 확장
                </span>
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                예약 슬롯 10개 확장 + 수수료 50% 감면 + 체결 즉각 우선 순위권 (3,300원 / 330 SNS)
              </p>
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={handleBuyVip}
                  className="px-3 py-1.5 bg-amber-500 text-slate-950 text-xs font-black rounded-lg active:scale-95 cursor-pointer shadow"
                >
                  VIP 패스 구매
                </button>
              </div>
            </div>
          )}

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
