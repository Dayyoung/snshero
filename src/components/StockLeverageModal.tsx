import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, TrendingUp, TrendingDown, Sparkles, AlertTriangle } from 'lucide-react';

interface StockLeverageModalProps {
  isOpen: boolean;
  onClose: () => void;
  stockName: string;
  stockPrice: number;
  onTradeLeverage: (position: 'LONG_2X' | 'LONG_3X' | 'SHORT_2X' | 'SHORT_3X', amount: number) => void;
  userBalance: number;
}

export const StockLeverageModal: React.FC<StockLeverageModalProps> = ({
  isOpen,
  onClose,
  stockName,
  stockPrice,
  onTradeLeverage,
  userBalance
}) => {
  const [position, setPosition] = useState<'LONG_2X' | 'LONG_3X' | 'SHORT_2X' | 'SHORT_3X'>('LONG_2X');
  const [amount, setAmount] = useState(500);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 select-none font-mono">
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        className="w-full max-w-sm bg-[#fdfcfc] border-2 border-[#201d1d] p-5 rounded-none shadow-2xl space-y-4"
      >
        <div className="flex items-center justify-between border-b border-[rgba(15,0,0,0.12)] pb-2">
          <div className="flex items-center gap-2">
            <TrendingUp size={18} className="text-amber-600" />
            <span className="text-xs font-black uppercase text-[#201d1d]">
              [2X/3X 레버리지 ETF 파생 거래]
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center border border-[rgba(15,0,0,0.12)] bg-white hover:bg-zinc-100 rounded-sm cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>

        <div>
          <div className="text-sm font-black text-[#201d1d]">{stockName} 파생 상품</div>
          <div className="text-[11px] text-[#504a4a]">기초 자산 현재가: {stockPrice.toLocaleString()} SNS</div>
        </div>

        {/* Position Select */}
        <div className="grid grid-cols-2 gap-2 text-xs font-bold">
          <button
            onClick={() => setPosition('LONG_2X')}
            className={`p-2 border rounded-sm flex items-center justify-center gap-1.5 cursor-pointer ${
              position === 'LONG_2X' ? 'bg-rose-600 text-white border-rose-700' : 'bg-white border-zinc-200 hover:bg-rose-50'
            }`}
          >
            <TrendingUp size={14} />
            <span>2X 불 (BULL)</span>
          </button>
          <button
            onClick={() => setPosition('LONG_3X')}
            className={`p-2 border rounded-sm flex items-center justify-center gap-1.5 cursor-pointer ${
              position === 'LONG_3X' ? 'bg-rose-700 text-white border-rose-800' : 'bg-white border-zinc-200 hover:bg-rose-50'
            }`}
          >
            <TrendingUp size={14} />
            <span>3X 울트라 롱</span>
          </button>
          <button
            onClick={() => setPosition('SHORT_2X')}
            className={`p-2 border rounded-sm flex items-center justify-center gap-1.5 cursor-pointer ${
              position === 'SHORT_2X' ? 'bg-blue-600 text-white border-blue-700' : 'bg-white border-zinc-200 hover:bg-blue-50'
            }`}
          >
            <TrendingDown size={14} />
            <span>2X 베어 (BEAR)</span>
          </button>
          <button
            onClick={() => setPosition('SHORT_3X')}
            className={`p-2 border rounded-sm flex items-center justify-center gap-1.5 cursor-pointer ${
              position === 'SHORT_3X' ? 'bg-blue-700 text-white border-blue-800' : 'bg-white border-zinc-200 hover:bg-blue-50'
            }`}
          >
            <TrendingDown size={14} />
            <span>3X 인버스 숏</span>
          </button>
        </div>

        <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-sm text-[10px] text-amber-800 flex items-center gap-1.5">
          <AlertTriangle size={14} className="shrink-0 text-amber-600" />
          <span>레버리지 배율만큼 등락폭과 손실 위험이 확대됩니다.</span>
        </div>

        {/* Amount */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-[#504a4a]">
            <span>투자 금액:</span>
            <span>보유: {userBalance.toLocaleString()} SNS</span>
          </div>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-full p-2 bg-white border border-[rgba(15,0,0,0.12)] rounded-sm text-xs focus:outline-none focus:border-[#201d1d]"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-white border border-[rgba(15,0,0,0.12)] text-[#504a4a] text-xs font-bold rounded-sm cursor-pointer hover:bg-zinc-50"
          >
            닫기
          </button>
          <button
            disabled={amount <= 0 || amount > userBalance}
            onClick={() => {
              onTradeLeverage(position, amount);
              onClose();
            }}
            className="flex-2 py-2.5 bg-[#201d1d] hover:bg-zinc-800 disabled:bg-zinc-300 text-white text-xs font-black rounded-sm border border-[#201d1d] cursor-pointer flex items-center justify-center gap-1.5 shadow-md active:scale-98"
          >
            <Sparkles size={14} />
            <span>포지션 진입</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
