import React, { useState } from 'react';
import { Sparkles, X, CheckCircle, Zap, FastForward, Clock } from 'lucide-react';
import { playSfx } from '../lib/sound';
import { triggerHaptic } from '../lib/haptic';

interface FastPassModalProps {
  isOpen: boolean;
  onClose: () => void;
  nextEpisodeNum: number;
  language: string;
  onSuccessUnlock: () => void;
}

export const FastPassModal: React.FC<FastPassModalProps> = ({
  isOpen,
  onClose,
  nextEpisodeNum,
  language,
  onSuccessUnlock
}) => {
  const isKo = language === 'ko';
  const [purchased, setPurchased] = useState<boolean>(() => {
    return typeof window !== 'undefined' && localStorage.getItem(`hero_fastpass_ep_${nextEpisodeNum}`) === 'true';
  });
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handlePurchase = (type: 'short' | 'early') => {
    setIsProcessing(true);
    triggerHaptic('heavy');
    playSfx('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
    setTimeout(() => {
      localStorage.setItem(`hero_fastpass_ep_${nextEpisodeNum}`, 'true');
      setPurchased(true);
      setIsProcessing(false);
      onSuccessUnlock();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-3 bg-black/80 backdrop-blur-xs font-mono select-none">
      <div className="relative w-full max-w-sm bg-[#161313] border border-amber-500/70 p-4 text-white shadow-2xl rounded-none flex flex-col space-y-3">
        <button
          onClick={onClose}
          className="absolute top-2.5 right-2.5 text-white/60 hover:text-white p-1 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
        >
          <X size={16} />
        </button>

        <div className="flex items-center gap-1.5 text-amber-400">
          <FastForward size={18} />
          <span className="text-xs font-black uppercase tracking-wider">
            {isKo ? '[다음 화 패스트패스 & 얼리액세스]' : '[NEXT EPISODE FASTPASS]'}
          </span>
        </div>

        <p className="text-[11px] text-white/70 leading-relaxed">
          {isKo
            ? `제 ${nextEpisodeNum}화 프리미엄 선공개 에피소드를 대기 시간 없이 즉시 열람합니다.`
            : `Instantly read Episode ${nextEpisodeNum} without waiting.`}
        </p>

        {purchased ? (
          <div className="p-3 bg-emerald-950/40 border border-emerald-500 text-emerald-300 text-xs font-bold text-center flex items-center justify-center gap-1.5">
            <CheckCircle size={15} />
            <span>{isKo ? '패스트패스 해금 완료! 바로 읽으실 수 있습니다.' : 'Unlocked! Ready to read.'}</span>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Option 1: 3-sec instant shortcut */}
            <div className="p-2.5 bg-white/5 border border-white/10 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-1">
                  <Clock size={13} className="text-cyan-400" />
                  {isKo ? '3초 단축권' : '3-Sec Skip Pass'}
                </div>
                <span className="text-[10px] text-white/60">{isKo ? '다음 에피소드 즉시 오픈' : 'Instant episode unlock'}</span>
              </div>
              <button
                type="button"
                onClick={() => handlePurchase('short')}
                disabled={isProcessing}
                className="min-h-[40px] px-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-none cursor-pointer active:scale-95"
              >
                {isKo ? '300원 결제' : '$0.30'}
              </button>
            </div>

            {/* Option 2: Early Access VIP Pack */}
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/40 flex items-center justify-between">
              <div>
                <div className="text-xs font-black text-amber-300 flex items-center gap-1">
                  <Sparkles size={13} className="text-amber-400" />
                  {isKo ? '얼리액세스 패키지' : 'Early Access VIP'}
                </div>
                <span className="text-[10px] text-white/70">{isKo ? '다음 3개화 선공개 해금' : 'Unlock next 3 episodes'}</span>
              </div>
              <button
                type="button"
                onClick={() => handlePurchase('early')}
                disabled={isProcessing}
                className="min-h-[40px] px-3 bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-black text-xs rounded-none cursor-pointer active:scale-95 shadow-md"
              >
                {isKo ? '500원 결제' : '$0.50'}
              </button>
            </div>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full min-h-[40px] text-white/50 hover:text-white text-[11px] font-bold cursor-pointer"
        >
          [{isKo ? '닫기' : 'Close'}]
        </button>
      </div>
    </div>
  );
};
