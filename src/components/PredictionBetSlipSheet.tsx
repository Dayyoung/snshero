import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Check, TrendingUp, ShieldAlert, Sparkles } from 'lucide-react';

interface PredictionBetSlipSheetProps {
  isOpen: boolean;
  onClose: () => void;
  matchTitle: string;
  selectedTeam: 'A' | 'B';
  teamName: string;
  odds: number;
  userBalance: number;
  onConfirmBet: (amount: number, odds: number, useInsurance: boolean) => void;
  onOpenInsuranceModal: () => void;
  hasInsuranceTicket: boolean;
}

export const PredictionBetSlipSheet: React.FC<PredictionBetSlipSheetProps> = ({
  isOpen,
  onClose,
  matchTitle,
  selectedTeam,
  teamName,
  odds,
  userBalance,
  onConfirmBet,
  onOpenInsuranceModal,
  hasInsuranceTicket
}) => {
  const [betAmount, setBetAmount] = useState<number>(100);
  const [useInsurance, setUseInsurance] = useState<boolean>(false);

  if (!isOpen) return null;

  const quickAmounts = [100, 500, 1000, 5000];
  const maxBet = Math.min(userBalance, 50000);
  const potentialReturn = Math.floor(betAmount * odds);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px] flex items-end justify-center p-0 select-none">
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="w-full max-w-md bg-[#fdfcfc] border-t-2 border-[#201d1d] p-4 font-mono shadow-2xl space-y-4"
      >
        <div className="flex items-center justify-between border-b border-[rgba(15,0,0,0.12)] pb-2">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-[#201d1d]" />
            <span className="text-xs font-black uppercase text-[#201d1d]">
              [1-TAP BET SLIP]
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center border border-[rgba(15,0,0,0.12)] bg-white hover:bg-zinc-100 rounded-sm cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <div className="bg-white border border-[rgba(15,0,0,0.12)] p-3 rounded-sm space-y-1">
          <div className="text-[10px] text-[#504a4a] truncate">{matchTitle}</div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-black text-[#201d1d]">
              [{selectedTeam}] {teamName}
            </span>
            <span className="px-2 py-0.5 bg-[#201d1d] text-white text-xs font-bold rounded-sm">
              x{odds.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Quick Amount Chips */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[10px] text-[#504a4a]">
            <span>베팅 금액 (SNS)</span>
            <span>보유: {userBalance.toLocaleString()} SNS</span>
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            {quickAmounts.map((amt) => (
              <button
                key={amt}
                onClick={() => setBetAmount(amt)}
                className={`py-2 text-xs font-bold border rounded-sm transition-all cursor-pointer ${
                  betAmount === amt
                    ? 'bg-[#201d1d] text-white border-[#201d1d]'
                    : 'bg-white text-[#201d1d] border-[rgba(15,0,0,0.12)] hover:bg-zinc-50'
                }`}
              >
                +{amt}
              </button>
            ))}
            <button
              onClick={() => setBetAmount(maxBet)}
              className={`py-2 text-xs font-bold border rounded-sm transition-all cursor-pointer ${
                betAmount === maxBet && maxBet > 0
                  ? 'bg-amber-600 text-white border-amber-600'
                  : 'bg-white text-amber-600 border-amber-300 hover:bg-amber-50'
              }`}
            >
              MAX
            </button>
          </div>
        </div>

        {/* Insurance Option (SCR-07-09) */}
        <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-sm flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs">
            <ShieldAlert size={15} className="text-amber-600" />
            <div>
              <div className="font-bold text-[#201d1d]">역배당 50% 페이백 보험</div>
              <div className="text-[10px] text-zinc-600">미적중 시 베팅액의 50% 환급</div>
            </div>
          </div>
          {hasInsuranceTicket ? (
            <button
              onClick={() => setUseInsurance(!useInsurance)}
              className={`px-3 py-1.5 text-xs font-bold rounded-sm border cursor-pointer ${
                useInsurance
                  ? 'bg-amber-600 text-white border-amber-700'
                  : 'bg-white text-amber-700 border-amber-300'
              }`}
            >
              {useInsurance ? '[적용됨]' : '[적용]'}
            </button>
          ) : (
            <button
              onClick={onOpenInsuranceModal}
              className="px-2.5 py-1.5 bg-white border border-amber-400 text-amber-700 text-[10px] font-bold rounded-sm hover:bg-amber-100 cursor-pointer"
            >
              구매 (800원)
            </button>
          )}
        </div>

        {/* Potential Return */}
        <div className="bg-zinc-100 p-3 rounded-sm flex items-center justify-between">
          <span className="text-xs text-[#504a4a]">적중 시 예상 수익:</span>
          <span className="text-sm font-black text-emerald-600">
            +{potentialReturn.toLocaleString()} SNS
          </span>
        </div>

        {/* Submit Button */}
        <button
          onClick={() => {
            if (betAmount <= userBalance && betAmount > 0) {
              onConfirmBet(betAmount, odds, useInsurance);
              onClose();
            }
          }}
          disabled={betAmount <= 0 || betAmount > userBalance}
          className="w-full py-3 bg-[#201d1d] hover:bg-zinc-800 disabled:bg-zinc-300 text-white text-xs font-black rounded-sm border border-[#201d1d] cursor-pointer flex items-center justify-center gap-2 active:scale-98 transition-all"
        >
          <Check size={14} />
          <span>{betAmount.toLocaleString()} SNS 베팅 확정</span>
        </button>
      </motion.div>
    </div>
  );
};
