import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Crosshair, Sparkles, CheckCircle2 } from 'lucide-react';

interface AutoBuySniperModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegisterSnipe: (targetCardName: string, maxPrice: number) => void;
}

export const AutoBuySniperModal: React.FC<AutoBuySniperModalProps> = ({
  isOpen,
  onClose,
  onRegisterSnipe
}) => {
  const [cardName, setCardName] = useState('');
  const [maxPrice, setMaxPrice] = useState(500);

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
            <Crosshair size={18} className="text-emerald-600" />
            <span className="text-xs font-black uppercase text-[#201d1d]">
              [최저가 자동 스나이핑 매수 예약]
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center border border-[rgba(15,0,0,0.12)] bg-white hover:bg-zinc-100 rounded-sm cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>

        <p className="text-xs text-[#504a4a]">
          원하는 카드가 설정한 목표가 이하로 마켓에 등록되면 0ms 즉시 자동 체결됩니다.
        </p>

        <div className="space-y-3 text-xs">
          <div>
            <label className="block text-[#504a4a] mb-1">스나이핑 목표 카드명</label>
            <input
              type="text"
              value={cardName}
              onChange={(e) => setCardName(e.target.value)}
              placeholder="예: 드래곤 나이트, 그림자 암살자"
              className="w-full p-2 bg-white border border-[rgba(15,0,0,0.12)] rounded-sm focus:outline-none focus:border-[#201d1d]"
            />
          </div>
          <div>
            <label className="block text-[#504a4a] mb-1">최대 매수 상한가 (SNS)</label>
            <input
              type="number"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full p-2 bg-white border border-[rgba(15,0,0,0.12)] rounded-sm focus:outline-none focus:border-[#201d1d]"
            />
          </div>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-sm space-y-1 text-xs">
          <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
            <CheckCircle2 size={13} />
            <span>24시간 무중단 백그라운드 봇 매수 가동</span>
          </div>
          <div className="text-[10px] text-zinc-600">
            예약 슬롯 이용권: 100 SNS (미체결 시 환불)
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-white border border-[rgba(15,0,0,0.12)] text-[#504a4a] text-xs font-bold rounded-sm cursor-pointer hover:bg-zinc-50"
          >
            닫기
          </button>
          <button
            disabled={!cardName.trim() || maxPrice <= 0}
            onClick={() => {
              onRegisterSnipe(cardName, maxPrice);
              onClose();
            }}
            className="flex-2 py-2.5 bg-[#201d1d] hover:bg-zinc-800 disabled:bg-zinc-300 text-white text-xs font-black rounded-sm border border-[#201d1d] cursor-pointer flex items-center justify-center gap-1.5 shadow-md active:scale-98"
          >
            <Crosshair size={14} />
            <span>스나이퍼 예약 등록</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
