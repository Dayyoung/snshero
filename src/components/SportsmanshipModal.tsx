/**
 * SportsmanshipModal.tsx
 * 대전 종료 후 상대방 매너 칭찬 배지 수여 및 카르마 보너스 모달
 * (백로그 ID 490: 친선전 결과 화면 매너 칭찬 배지 [ 👍 Great Strategy! ] 및 카르마 지급)
 */

import React, { useState } from 'react';
import { ThumbsUp, Heart, Zap, Sparkles, X, Check } from 'lucide-react';

interface SportsmanshipModalProps {
  isOpen: boolean;
  onClose: () => void;
  opponentName: string;
  onAwardKarma: (badgeType: string) => void;
  language?: string;
}

const BADGES = [
  { id: 'strategy', labelKo: '👍 뛰어난 전술가', labelEn: '👍 Great Strategy', icon: ThumbsUp, color: 'text-amber-500' },
  { id: 'fairplay', labelKo: '🤝 매너 플레이어', labelEn: '🤝 Fair Play', icon: Heart, color: 'text-rose-500' },
  { id: 'quick', labelKo: '⚡ 신속한 판단력', labelEn: '⚡ Fast Thinker', icon: Zap, color: 'text-cyan-500' },
];

export const SportsmanshipModal: React.FC<SportsmanshipModalProps> = ({
  isOpen,
  onClose,
  opponentName,
  onAwardKarma,
  language = 'ko',
}) => {
  const [selectedBadge, setSelectedBadge] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const isKo = language === 'ko';

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!selectedBadge) return;
    setSubmitted(true);
    onAwardKarma(selectedBadge);
    setTimeout(() => {
      onClose();
      setSubmitted(false);
      setSelectedBadge(null);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[10030] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 font-mono select-none">
      <div className="bg-[#fdfcfc] dark:bg-[#181616] border border-[#201d1d]/20 dark:border-white/20 p-5 rounded-none max-w-sm w-full shadow-2xl space-y-4 text-[#201d1d] dark:text-[#fdfcfc]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#201d1d]/10 dark:border-white/10 pb-2">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-amber-500" />
            <h3 className="font-black text-sm uppercase tracking-wider">
              {isKo ? '매너 칭찬 배지 수여' : 'Sportsmanship Kudos'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#201d1d]/5 dark:hover:bg-white/5 cursor-pointer text-xs"
          >
            [x]
          </button>
        </div>

        {submitted ? (
          <div className="py-6 text-center space-y-2">
            <div className="w-12 h-12 mx-auto bg-emerald-500/20 text-emerald-500 border border-emerald-500/40 flex items-center justify-center">
              <Check size={24} />
            </div>
            <h4 className="font-black text-sm text-emerald-600 dark:text-emerald-400">
              {isKo ? '칭찬 배지가 전달되었습니다!' : 'Kudos sent successfully!'}
            </h4>
            <p className="text-[11px] opacity-75">
              {isKo ? '상대방과 나에게 카르마 +10 SNS가 지급되었습니다.' : '+10 SNS Karma rewarded to both players.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-[11px] opacity-80 leading-snug">
              {isKo
                ? `${opponentName} 님과의 대전은 어떠셨나요? 상대방을 칭찬하면 두 분 모두에게 매너 카르마 보너스(+10 SNS)가 지급됩니다.`
                : `How was your match against ${opponentName}? Commend your rival to earn +10 SNS Karma bonus each.`}
            </p>

            <div className="grid grid-cols-1 gap-2 pt-1">
              {BADGES.map((b) => (
                <button
                  key={b.id}
                  onClick={() => setSelectedBadge(b.id)}
                  className={`p-2.5 text-left border flex items-center justify-between transition-all cursor-pointer ${
                    selectedBadge === b.id
                      ? 'bg-[#201d1d] text-[#fdfcfc] dark:bg-white dark:text-[#201d1d] border-[#201d1d] dark:border-white'
                      : 'border-[#201d1d]/20 dark:border-white/20 hover:bg-[#201d1d]/5'
                  }`}
                >
                  <span className="text-xs font-bold">{isKo ? b.labelKo : b.labelEn}</span>
                  <span className="text-[10px] font-mono opacity-80">+10 SNS</span>
                </button>
              ))}
            </div>

            <button
              onClick={handleSubmit}
              disabled={!selectedBadge}
              className={`w-full py-2.5 text-xs font-black uppercase transition-all mt-2 ${
                selectedBadge
                  ? 'bg-amber-500 hover:bg-amber-400 text-stone-950 cursor-pointer shadow-sm'
                  : 'bg-stone-300 dark:bg-stone-800 text-stone-500 cursor-not-allowed opacity-50'
              }`}
            >
              {isKo ? '칭찬 배지 전송' : 'Send Kudos'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
