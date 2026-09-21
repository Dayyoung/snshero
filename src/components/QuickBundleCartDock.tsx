/**
 * QuickBundleCartDock.tsx - SCR-04-14
 * 하단 Thumb Zone 1-Tap 스마트 번들 장바구니 독 (48px 결제 버튼 연동)
 */

import React from 'react';
import { ShoppingBag, Sparkles, X, CreditCard } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

export interface CartItem {
  id: string;
  name: string;
  priceSns: number;
}

interface QuickBundleCartDockProps {
  items: CartItem[];
  onRemoveItem: (id: string) => void;
  onCheckout: () => void;
  onClear: () => void;
  language?: string;
  userSns: number;
}

export const QuickBundleCartDock: React.FC<QuickBundleCartDockProps> = ({
  items,
  onRemoveItem,
  onCheckout,
  onClear,
  language = 'ko',
  userSns,
}) => {
  if (items.length === 0) return null;

  const totalSns = items.reduce((acc, curr) => acc + curr.priceSns, 0);
  const canAfford = userSns >= totalSns;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40 max-w-lg mx-auto bg-slate-900/95 border-2 border-amber-400 rounded-xl p-3 text-white shadow-2xl backdrop-blur-md font-mono select-none">
      <div className="flex items-center justify-between pb-2 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <ShoppingBag size={16} className="text-amber-400" />
          <span className="text-xs font-black text-amber-300">
            {language === 'ko' ? `스마트 번들 장바구니 (${items.length})` : `Bundle Cart (${items.length})`}
          </span>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="text-[10px] text-slate-400 hover:text-white"
        >
          {language === 'ko' ? '비우기' : 'Clear'}
        </button>
      </div>

      {/* 담긴 상품 가로 태그 리스트 */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-2 scrollbar-none">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-1 px-2 py-1 bg-slate-800 rounded border border-slate-700 text-[10px] shrink-0"
          >
            <span className="text-slate-200 truncate max-w-[100px]">{item.name}</span>
            <span className="text-amber-400 font-bold">{item.priceSns} SNS</span>
            <button
              type="button"
              onClick={() => onRemoveItem(item.id)}
              className="text-slate-400 hover:text-rose-400 p-0.5 ml-0.5"
            >
              <X size={10} />
            </button>
          </div>
        ))}
      </div>

      {/* 48px 결제 버튼 */}
      <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-800">
        <div>
          <span className="text-[10px] text-slate-400 block">{language === 'ko' ? '총 합계' : 'Total'}</span>
          <span className="text-sm font-black text-emerald-400">{totalSns} SNS</span>
        </div>
        <button
          type="button"
          disabled={!canAfford}
          onClick={() => {
            triggerHaptic('heavy');
            onCheckout();
          }}
          className="h-12 px-5 bg-gradient-to-r from-amber-500 to-yellow-400 hover:brightness-110 text-slate-950 font-black text-xs uppercase tracking-wider rounded-lg flex items-center gap-2 active:scale-95 transition-all shadow-md cursor-pointer disabled:opacity-40"
        >
          <CreditCard size={16} />
          <span>
            {canAfford 
              ? (language === 'ko' ? '1-Tap 일괄 구매 (48px)' : '1-Tap Buy All')
              : (language === 'ko' ? 'SNS 부족' : 'Insufficient SNS')}
          </span>
        </button>
      </div>
    </div>
  );
};
