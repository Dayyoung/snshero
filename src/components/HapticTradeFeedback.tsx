/**
 * HapticTradeFeedback.tsx - SCR-06-14
 * 노-컨펌 래피드 스플릿 매매 시 시각 및 햅틱 즉시 피드백 토스트
 */

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, CheckCircle2, TrendingUp, TrendingDown } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

interface HapticTradeFeedbackProps {
  trade: {
    type: 'buy' | 'sell';
    portion: number; // 25, 50, 75, 100
    shares: number;
    price: number;
    symbol: string;
  } | null;
  onDismiss: () => void;
  language?: string;
}

export const HapticTradeFeedback: React.FC<HapticTradeFeedbackProps> = ({
  trade,
  onDismiss,
  language = 'ko',
}) => {
  useEffect(() => {
    if (trade) {
      triggerHaptic('heavy');
      const timer = setTimeout(onDismiss, 1800);
      return () => clearTimeout(timer);
    }
  }, [trade, onDismiss]);

  if (!trade) return null;

  const isBuy = trade.type === 'buy';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="fixed bottom-28 left-4 right-4 z-50 max-w-sm mx-auto select-none pointer-events-none"
      >
        <div className={`p-3 rounded-xl shadow-2xl border-2 backdrop-blur-md flex items-center justify-between font-mono text-white ${
          isBuy ? 'bg-rose-950/90 border-rose-500' : 'bg-blue-950/90 border-blue-500'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-lg ${isBuy ? 'bg-rose-500/30 text-rose-400' : 'bg-blue-500/30 text-blue-400'}`}>
              {isBuy ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className={`text-xs font-black uppercase ${isBuy ? 'text-rose-400' : 'text-blue-400'}`}>
                  {isBuy ? (language === 'ko' ? '래피드 분할 매수' : 'Rapid Split Buy') : (language === 'ko' ? '래피드 분할 매도' : 'Rapid Split Sell')}
                </span>
                <span className="text-[10px] px-1.5 py-0.2 bg-white/20 rounded font-bold">
                  {trade.portion}%
                </span>
              </div>
              <p className="text-[11px] text-slate-200 mt-0.5">
                {trade.shares}주 @ {trade.price.toLocaleString()} SNS 체결 완료
              </p>
            </div>
          </div>
          <Zap size={18} className="text-amber-400 animate-pulse" />
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
