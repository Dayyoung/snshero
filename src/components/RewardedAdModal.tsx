import React, { useState, useEffect } from 'react';
import { Sparkles, Crown, Film, CheckCircle, X, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { requestRewardedAd, RewardedAdType, checkIsAdRemoved } from '../lib/rewardedAdService';
import { playSfx } from '../lib/sound';
import { triggerHaptic } from '../lib/haptic';

interface RewardedAdModalProps {
  isOpen: boolean;
  type: RewardedAdType;
  title: string;
  rewardDescription: string;
  onRewardGranted: () => void;
  onClose: () => void;
  language?: string;
}

export const RewardedAdModal: React.FC<RewardedAdModalProps> = ({
  isOpen,
  type,
  title,
  rewardDescription,
  onRewardGranted,
  onClose,
  language = 'ko',
}) => {
  const isKo = language === 'ko';
  const [isPlaying, setIsPlaying] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isVipSkip, setIsVipSkip] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setIsPlaying(false);
      setCountdown(3);
      setIsSuccess(false);
      setIsVipSkip(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleStartWatch = async () => {
    const isVip = checkIsAdRemoved();
    setIsPlaying(true);
    triggerHaptic('medium');

    if (isVip) {
      setIsVipSkip(true);
      playSfx('fanfare');
      setIsSuccess(true);
      setTimeout(() => {
        onRewardGranted();
        onClose();
      }, 1200);
      return;
    }

    try {
      const res = await requestRewardedAd(type, (sec) => {
        setCountdown(sec);
      });

      if (res.success) {
        setIsSuccess(true);
        triggerHaptic('heavy');
        playSfx('fanfare');
        setTimeout(() => {
          onRewardGranted();
          onClose();
        }, 1200);
      } else {
        alert(res.error || (isKo ? '광고 시청에 실패했습니다.' : 'Failed to watch ad.'));
        setIsPlaying(false);
      }
    } catch {
      setIsPlaying(false);
    }
  };

  const isVip = checkIsAdRemoved();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 select-none animate-fadeIn font-mono">
      <div className="w-full max-w-sm bg-[#fdfcfc] border-2 border-[#201d1d] rounded-none shadow-[8px_8px_0px_0px_rgba(32,29,29,0.8)] overflow-hidden text-[#201d1d]">
        {/* Header */}
        <div className="bg-[#201d1d] text-[#fdfcfc] px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
            {isVip ? <Crown className="text-amber-400 w-4 h-4" /> : <Film className="text-cyan-400 w-4 h-4" />}
            <span>{isVip ? (isKo ? '[VIP 특권] 1클릭 즉시 수령' : '[VIP Privilege] Instant Claim') : title}</span>
          </div>
          {!isPlaying && (
            <button
              onClick={onClose}
              className="text-stone-400 hover:text-white transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-5 text-center flex flex-col items-center gap-3">
          {isSuccess ? (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center gap-2 py-4 text-emerald-700"
            >
              <CheckCircle size={48} className="text-emerald-600 animate-bounce" />
              <div className="text-base font-black">
                {isVipSkip
                  ? (isKo ? '👑 VIP 특권 적용 완료!' : '👑 VIP Instant Reward!')
                  : (isKo ? '🎉 보상 지급 완료!' : '🎉 Reward Granted!')}
              </div>
              <div className="text-xs text-stone-600">{rewardDescription}</div>
            </motion.div>
          ) : isPlaying ? (
            <div className="flex flex-col items-center gap-3 py-6 w-full">
              <div className="w-16 h-16 rounded-full border-4 border-t-amber-500 border-stone-200 animate-spin flex items-center justify-center font-black text-xl text-[#201d1d]">
                {countdown}
              </div>
              <div className="text-xs font-bold text-stone-700 animate-pulse">
                {isKo ? '스폰서 광고 시청 중...' : 'Playing Sponsored Ad...'}
              </div>
              <div className="text-[10px] text-stone-500 bg-stone-100 p-2 border border-stone-200 rounded-sm w-full">
                {isKo ? '💡 광고 시청 후 즉시 보상이 지급됩니다.' : '💡 Reward is granted immediately after viewing.'}
              </div>
            </div>
          ) : (
            <>
              {isVip ? (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 w-full text-left rounded-sm">
                  <div className="flex items-center gap-1.5 text-xs font-black text-amber-900">
                    <Crown size={14} className="text-amber-600" />
                    <span>{isKo ? '광고 제거 VIP 회원 혜택' : 'Ad-Free VIP Active'}</span>
                  </div>
                  <div className="text-[11px] text-stone-700 mt-1">
                    {isKo
                      ? '광고를 시청할 필요 없이 즉시 클릭 한 번으로 보상을 수령합니다!'
                      : 'Skip waiting! Claim your reward instantly with 1-click VIP privilege.'}
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-stone-100 border border-stone-200 w-full text-left rounded-sm">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-stone-800">
                    <Film size={14} className="text-cyan-600" />
                    <span>{isKo ? '스폰서 보상형 광고' : 'Sponsored Rewarded Ad'}</span>
                  </div>
                  <div className="text-[11px] text-stone-600 mt-1">
                    {isKo
                      ? '약 3~5초간 스폰서 광고를 확인하고 무료 보너스 보상을 획득하세요.'
                      : 'Watch a short sponsored ad to claim your free bonus reward.'}
                  </div>
                </div>
              )}

              {/* Reward Details Box */}
              <div className="p-3 bg-amber-50 border-2 border-amber-300 w-full text-center">
                <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
                  {isKo ? '획득 예정 보상' : 'Pending Reward'}
                </span>
                <span className="text-sm font-black text-amber-950 mt-0.5 block flex items-center justify-center gap-1">
                  <Sparkles size={14} className="text-amber-600" />
                  <span>{rewardDescription}</span>
                </span>
              </div>

              {/* Action Button */}
              <button
                onClick={handleStartWatch}
                className="w-full mt-2 py-3 px-4 bg-[#201d1d] hover:bg-stone-800 text-[#fdfcfc] font-black text-xs uppercase cursor-pointer rounded-sm flex items-center justify-center gap-2 active:scale-98 transition-transform"
              >
                {isVip ? (
                  <>
                    <Crown size={14} className="text-amber-400" />
                    <span>{isKo ? '👑 VIP 즉시 보상 수령' : '👑 Claim VIP Reward Now'}</span>
                  </>
                ) : (
                  <>
                    <Film size={14} className="text-cyan-400" />
                    <span>{isKo ? '🎬 광고 시청하고 보상 수령' : '🎬 Watch Ad & Claim Reward'}</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default RewardedAdModal;
