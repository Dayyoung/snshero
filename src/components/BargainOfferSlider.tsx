import React, { useState } from 'react';

interface BargainOfferSliderProps {
  originalPrice: number;
  language?: string;
  onSendOffer: (offerPrice: number) => void;
}

export const BargainOfferSlider: React.FC<BargainOfferSliderProps> = ({
  originalPrice,
  language,
  onSendOffer
}) => {
  const [offer, setOffer] = useState(Math.floor(originalPrice * 0.9));

  return (
    <div className="font-mono text-white">
      <div className="flex justify-between text-xs mb-2">
        <span className="text-slate-400">원래 가격: {originalPrice.toLocaleString()} SNS</span>
        <span className="text-amber-400 font-bold">제안가: {offer.toLocaleString()} SNS</span>
      </div>
      <input
        type="range"
        min={Math.floor(originalPrice * 0.5)}
        max={originalPrice}
        value={offer}
        onChange={(e) => setOffer(Number(e.target.value))}
        className="w-full mb-4 accent-amber-400 cursor-pointer"
      />
      <button
        type="button"
        onClick={() => onSendOffer(offer)}
        className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-sm active:scale-95 transition-all"
      >
        흥정 제안 보내기
      </button>
    </div>
  );
};

export default BargainOfferSlider;
