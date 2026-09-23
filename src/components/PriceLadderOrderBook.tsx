/**
 * PriceLadderOrderBook.tsx - SCR-05-20
 * 세로형 호가 사다리(Price Ladder) 컴포넌트로 원하는 가격 칸 탭 즉시 주문 접수
 */

import React from 'react';
import { triggerHaptic } from '../lib/haptic';

interface PriceRow {
  price: number;
  bidVol: number;
  askVol: number;
  myOrderCount?: number;
}

interface PriceLadderOrderBookProps {
  rows: PriceRow[];
  onPlaceOrderAtPrice: (price: number, type: 'buy' | 'sell') => void;
  onCancelMyOrderAtPrice: (price: number) => void;
}

export const PriceLadderOrderBook: React.FC<PriceLadderOrderBookProps> = ({
  rows,
  onPlaceOrderAtPrice,
  onCancelMyOrderAtPrice,
}) => {
  return (
    <div className="w-full bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden font-mono select-none text-xs">
      <div className="grid grid-cols-3 bg-slate-900 p-2 text-[10px] text-slate-400 font-bold text-center border-b border-slate-800">
        <span className="text-emerald-400">매수 잔량 (BID)</span>
        <span className="text-amber-400">호가 (PRICE)</span>
        <span className="text-rose-400">매도 잔량 (ASK)</span>
      </div>

      <div className="flex flex-col max-h-56 overflow-y-auto divide-y divide-slate-900">
        {rows.map((row) => (
          <div key={row.price} className="grid grid-cols-3 items-center h-10 text-center hover:bg-slate-900/50">
            {/* Bid Cell */}
            <div
              onClick={() => {
                triggerHaptic('medium');
                onPlaceOrderAtPrice(row.price, 'buy');
              }}
              className="h-full flex items-center justify-center bg-emerald-950/20 text-emerald-400 font-bold cursor-pointer active:bg-emerald-900/40"
            >
              {row.bidVol > 0 ? row.bidVol : '-'}
            </div>

            {/* Price Ladder Step */}
            <div className="h-full flex items-center justify-center font-black text-white bg-slate-900/40 relative">
              {row.price}
              {row.myOrderCount && row.myOrderCount > 0 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerHaptic('heavy');
                    onCancelMyOrderAtPrice(row.price);
                  }}
                  className="absolute right-1 text-[9px] bg-rose-500 text-white px-1 py-0.5 rounded cursor-pointer"
                  title="주문 취소"
                >
                  취소
                </button>
              )}
            </div>

            {/* Ask Cell */}
            <div
              onClick={() => {
                triggerHaptic('medium');
                onPlaceOrderAtPrice(row.price, 'sell');
              }}
              className="h-full flex items-center justify-center bg-rose-950/20 text-rose-400 font-bold cursor-pointer active:bg-rose-900/40"
            >
              {row.askVol > 0 ? row.askVol : '-'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
