import React, { useState, useEffect } from 'react';
import { SecretStamp } from '../types';
import { getSecretStamps, unlockSecretStamp } from '../lib/secretStampHelper';
import { useSns } from '../contexts/SnsContext';

interface SecretStampBookModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SecretStampBookModal: React.FC<SecretStampBookModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [stamps, setStamps] = useState<SecretStamp[]>([]);
  const [claimedStamps, setClaimedStamps] = useState<Record<string, boolean>>({});
  const { addSns } = useSns();

  useEffect(() => {
    if (isOpen) {
      setStamps(getSecretStamps());
      try {
        const rawClaimed = localStorage.getItem('hero_secret_stamps_claimed');
        if (rawClaimed) {
          setClaimedStamps(JSON.parse(rawClaimed));
        }
      } catch (e) {
        console.error('Failed to load claimed stamps:', e);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClaimReward = (stamp: SecretStamp) => {
    if (!stamp.isUnlocked || claimedStamps[stamp.id]) return;

    if (stamp.rewardType === 'sns') {
      addSns(stamp.rewardAmount, `비밀 업적 보상: ${stamp.titleKo}`);
    }

    const updatedClaimed = { ...claimedStamps, [stamp.id]: true };
    setClaimedStamps(updatedClaimed);
    try {
      localStorage.setItem('hero_secret_stamps_claimed', JSON.stringify(updatedClaimed));
    } catch (e) {
      console.error('Failed to save claimed stamp:', e);
    }
  };

  const unlockedCount = stamps.filter(s => s.isUnlocked).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs font-mono">
      <div className="w-full max-w-2xl bg-[#fdfcfc] border border-[#201d1d] rounded-none p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-black/10 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📜</span>
            <div>
              <h2 className="text-base font-bold text-[#201d1d] uppercase tracking-wide">
                비밀 업적 스탬프북 (Secret Stamp Book)
              </h2>
              <p className="text-xs text-gray-500">
                기상천외한 전장 업적을 달성하고 영예의 골든 스탬프와 특별 보상을 획득하세요.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-500 hover:text-black font-bold text-lg"
          >
            [✕]
          </button>
        </div>

        {/* Progress Bar */}
        <div className="p-3 bg-amber-50/70 border border-amber-300 rounded-sm flex items-center justify-between">
          <div className="text-xs font-bold text-amber-950">
            [스탬프 수집 달성도]: {unlockedCount} / {stamps.length} ({Math.round((unlockedCount / stamps.length) * 100)}%)
          </div>
          <div className="text-[11px] text-amber-800 font-bold">
            {unlockedCount === stamps.length ? '★ ALL CLEAR!' : '진행 중'}
          </div>
        </div>

        {/* Stamp Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {stamps.map(stamp => {
            const isClaimed = claimedStamps[stamp.id] || false;
            return (
              <div
                key={stamp.id}
                className={`p-3.5 border rounded-sm relative flex flex-col justify-between space-y-2.5 transition-all ${
                  stamp.isUnlocked
                    ? 'bg-white border-amber-400/80 shadow-xs'
                    : 'bg-gray-100/70 border-gray-300 opacity-75'
                }`}
              >
                {/* Stamp Stamp Seal */}
                {stamp.isUnlocked && (
                  <div className="absolute top-2 right-2 border-2 border-amber-600 text-amber-700 text-[10px] font-black px-1.5 py-0.5 rounded-sm rotate-12 uppercase tracking-tighter bg-amber-100/90 pointer-events-none">
                    [STAMP APPROVED]
                  </div>
                )}

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{stamp.icon}</span>
                    <h3 className="text-xs font-bold text-[#201d1d]">
                      {stamp.titleKo}
                    </h3>
                  </div>
                  <p className="text-[11px] text-gray-600 leading-relaxed">
                    {stamp.descKo}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-black/5">
                  <div className="text-[10px] font-bold text-amber-700">
                    보상: {stamp.rewardType === 'gems' ? `💎 ${stamp.rewardAmount} Gems` : `🪙 +${stamp.rewardAmount} SNS`}
                    {stamp.rewardTitle && <span className="ml-1 text-purple-700">[{stamp.rewardTitle}]</span>}
                  </div>

                  {stamp.isUnlocked ? (
                    <button
                      disabled={isClaimed}
                      onClick={() => handleClaimReward(stamp)}
                      className={`min-h-[36px] px-3 py-1 text-xs font-bold rounded-sm ${
                        isClaimed
                          ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          : 'bg-[#201d1d] text-[#fdfcfc] hover:bg-black'
                      }`}
                    >
                      {isClaimed ? '[수령완료]' : '[보상 수령]'}
                    </button>
                  ) : (
                    <span className="text-[11px] font-bold text-gray-400">
                      [미달성]
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-black/10">
          <button
            onClick={onClose}
            className="min-h-[44px] px-5 py-2 bg-[#201d1d] text-[#fdfcfc] hover:bg-black rounded-sm text-xs font-bold"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
