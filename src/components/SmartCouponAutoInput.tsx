import React, { useState } from 'react';
import { Tag } from 'lucide-react';

interface SmartCouponAutoInputProps {
  onApplyCoupon?: (code: string) => void;
}

export const SmartCouponAutoInput: React.FC<SmartCouponAutoInputProps> = ({
  onApplyCoupon
}) => {
  const [code, setCode] = useState('');

  const handleApply = () => {
    if (!code.trim()) return;
    if (onApplyCoupon) onApplyCoupon(code.trim());
    setCode('');
  };

  return (
    <div className="p-3 border border-[#201d1d]/15 bg-white rounded-sm font-mono flex items-center gap-2">
      <Tag size={15} className="text-[#201d1d]/50 shrink-0" />
      <input
        type="text"
        placeholder="쿠폰 코드를 입력하세요"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        className="flex-1 text-xs outline-none bg-transparent"
      />
      <button
        type="button"
        onClick={handleApply}
        disabled={!code.trim()}
        className="px-3 py-1 text-xs font-bold bg-[#201d1d] text-white rounded-sm disabled:opacity-30 cursor-pointer"
      >
        등록
      </button>
    </div>
  );
};

export default SmartCouponAutoInput;
