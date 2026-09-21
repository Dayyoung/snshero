import React, { useState } from 'react';
import { Gift, Sparkles, Check, Copy } from 'lucide-react';

interface SmartCouponAutoInputProps {
  onApplyCoupon: (code: string) => void;
}

export const SmartCouponAutoInput: React.FC<SmartCouponAutoInputProps> = ({
  onApplyCoupon
}) => {
  const [couponCode, setCouponCode] = useState<string>('');
  const [copiedNotice, setCopiedNotice] = useState<boolean>(false);

  const presetCodes = ['SNSHERO2026', 'WELCOME777', 'LUCKY7DAYS'];

  const handleApply = (code: string) => {
    if (!code.trim()) return;
    onApplyCoupon(code.trim().toUpperCase());
    setCouponCode('');
  };

  const handlePasteClipboard = async () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        const text = await navigator.clipboard.readText();
        if (text && text.length >= 4) {
          setCouponCode(text.trim().toUpperCase());
        }
      } catch {}
    }
  };

  return (
    <div className="bg-white border border-[rgba(15,0,0,0.12)] p-3 rounded-none font-mono space-y-2 select-none">
      <div className="flex items-center justify-between text-xs font-bold text-[#201d1d]">
        <div className="flex items-center gap-1.5">
          <Gift size={14} className="text-amber-500" />
          <span>[SMART COUPON REDEEM]</span>
        </div>
        <button
          onClick={handlePasteClipboard}
          className="text-[10px] text-zinc-500 hover:text-black underline cursor-pointer"
        >
          클립보드 붙여넣기
        </button>
      </div>

      <div className="flex gap-1.5">
        <input
          type="text"
          value={couponCode}
          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
          placeholder="쿠폰 코드 입력 (예: SNSHERO2026)"
          className="flex-1 px-2.5 py-2 text-xs border border-[rgba(15,0,0,0.12)] bg-zinc-50 rounded-sm focus:outline-none focus:border-[#201d1d]"
        />
        <button
          onClick={() => handleApply(couponCode)}
          disabled={!couponCode.trim()}
          className="px-3.5 py-2 bg-[#201d1d] disabled:bg-zinc-300 text-white text-xs font-bold rounded-sm border border-[#201d1d] cursor-pointer hover:bg-zinc-800 active:scale-95"
        >
          등록
        </button>
      </div>

      <div className="flex items-center gap-1 text-[9px] text-[#504a4a]">
        <span>추천 쿠폰:</span>
        {presetCodes.map((code) => (
          <button
            key={code}
            onClick={() => handleApply(code)}
            className="px-1.5 py-0.5 bg-zinc-100 hover:bg-zinc-200 text-[#201d1d] rounded-xs font-bold cursor-pointer"
          >
            {code}
          </button>
        ))}
      </div>
    </div>
  );
};
