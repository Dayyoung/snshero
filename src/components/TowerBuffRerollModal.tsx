import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, X, Sparkles, RefreshCw, CheckCircle, Flame, Crown, Zap } from 'lucide-react';
import { playSfx } from '../lib/sound';
import { triggerHaptic } from '../lib/haptic';

interface TowerBuffRerollModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: string;
  onPurchaseRunePack?: () => void;
  onRerollBuffs?: () => void;
}

export const TowerBuffRerollModal: React.FC<TowerBuffRerollModalProps> = ({
  isOpen,
  onClose,
  language,
  onPurchaseRunePack,
  onRerollBuffs
}) => {
  const isKo = language === 'ko';
  const [purchased, setPurchased] = useState<boolean>(() => {
    return typeof window !== 'undefined' && localStorage.getItem('hero_tower_golden_rune_pack') === 'true';
  });
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleBuy = () => {
    setIsProcessing(true);
    triggerHaptic('heavy');
    playSfx('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
    setTimeout(() => {
      localStorage.setItem('hero_tower_golden_rune_pack', 'true');
      setPurchased(true);
      setIsProcessing(false);
      if (onPurchaseRunePack) onPurchaseRunePack();
    }, 600);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[999999] flex items-center justify-center p-3 bg-black/85 backdrop-blur-xs font-mono select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-sm bg-[#161313] border border-amber-500/60 p-4 text-white shadow-2xl rounded-none flex flex-col space-y-3"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-2.5 right-2.5 text-white/50 hover:text-white p-1 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
          >
            <X size={16} />
          </button>

          {/* Badge & Title */}
          <div className="flex items-center gap-1.5 text-amber-400">
            <Crown size={18} />
            <span className="text-xs font-black uppercase tracking-wider">
              {isKo ? '[50층 정복자 황금 룬 패키지]' : '[CONQUEROR GOLDEN RUNE PACK]'}
            </span>
          </div>

          <div className="p-3 bg-gradient-to-b from-amber-500/20 to-black/40 border border-amber-500/40 rounded-none text-center space-y-2">
            <div className="w-12 h-12 mx-auto bg-amber-400/20 border border-amber-400 rounded-full flex items-center justify-center text-amber-300">
              <Sparkles size={24} className="animate-spin" />
            </div>
            <h4 className="text-sm font-black text-amber-300">
              {isKo ? '타워 공략 전용 1회 한정 특가' : 'Tower Conquer Special Pack'}
            </h4>
            <p className="text-[11px] text-white/70 leading-relaxed">
              {isKo 
                ? '시련의 탑 50층 등반을 지원하는 강력한 황금 룬 세트! 공격력 +20%, 크리티컬 확률 +15%, 층간 무료 황금 리롤 3회권을 영구 획득합니다.' 
                : 'Permanent runes for 50F tower! ATK +20%, CRIT +15%, and 3 free golden buff rerolls per run.'}
            </p>
          </div>

          {/* Package Per-benefits */}
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between p-2 bg-white/5 border border-white/10">
              <span className="text-white/80">⚡ {isKo ? '탑 공략 공격력 영구 버프' : 'Tower ATK Boost'}</span>
              <span className="text-amber-400 font-bold">+20%</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-white/5 border border-white/10">
              <span className="text-white/80">🎯 {isKo ? '치명타 확률 추가' : 'CRIT Rate Boost'}</span>
              <span className="text-amber-400 font-bold">+15%</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-white/5 border border-white/10">
              <span className="text-white/80">🔄 {isKo ? '선택 버프 무료 황금 리롤' : 'Free Buff Reroll'}</span>
              <span className="text-cyan-400 font-bold">{isKo ? '매 등반 3회' : '3 / run'}</span>
            </div>
          </div>

          {/* Purchase Action Button */}
          {purchased ? (
            <div className="p-2.5 bg-emerald-950/40 border border-emerald-500/60 text-emerald-300 text-xs font-bold text-center flex items-center justify-center gap-1.5">
              <CheckCircle size={14} />
              <span>{isKo ? '황금 룬 패키지 보유 중 (효과 적용됨)' : 'Active (Boosts Applied)'}</span>
            </div>
          ) : (
            <button
              onClick={handleBuy}
              disabled={isProcessing}
              className="w-full min-h-[48px] bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black font-black text-xs uppercase tracking-wider rounded-none flex items-center justify-center gap-1.5 cursor-pointer shadow-lg active:scale-98"
            >
              <Zap size={16} />
              <span>
                {isProcessing 
                  ? (isKo ? '결제 승인 중...' : 'Processing...') 
                  : (isKo ? '[1,500원으로 황금 룬 패키지 즉시 해금]' : '[Unlock Pack for $1.50]')}
              </span>
            </button>
          )}

          <button
            onClick={onClose}
            className="w-full min-h-[40px] text-white/50 hover:text-white text-[11px] font-bold cursor-pointer"
          >
            [{isKo ? '나중에 하기' : 'Close'}]
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
