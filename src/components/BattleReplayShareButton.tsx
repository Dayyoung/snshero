/**
 * BattleReplayShareButton.tsx
 * 대전 결과 화면 내 원클릭 리플레이 공유 & 클립보드 복사 버튼
 * (구글 스프레드시트 Row 1063 / ID 326 요구사항 구현)
 */

import React, { useState } from 'react';
import { Share2, Check, Copy } from 'lucide-react';
import { BattleReplayService, MatchReplayData } from '../lib/BattleReplayService';
import { playBattleSfx } from '../lib/AudioSpriteService';

interface BattleReplayShareButtonProps {
  replayData: MatchReplayData;
  className?: string;
}

export const BattleReplayShareButton: React.FC<BattleReplayShareButtonProps> = ({
  replayData,
  className = '',
}) => {
  const [copied, setCopied] = useState<boolean>(false);

  const handleShare = async () => {
    playBattleSfx('click');
    const success = await BattleReplayService.copyReplayToClipboard(replayData);
    if (success) {
      playBattleSfx('badge_pop');
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <button
      onClick={handleShare}
      className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-mono font-bold border transition-all rounded-sm ${
        copied
          ? 'bg-emerald-600 text-white border-emerald-700'
          : 'bg-[#fdfcfc] text-[#201d1d] border-[rgba(15,0,0,0.2)] hover:bg-[#f1eeee] active:scale-[0.98]'
      } ${className}`}
      title="대전 리플레이 링크 복사"
    >
      {copied ? (
        <>
          <Check size={14} className="text-white" />
          <span>리플레이 링크 복사됨!</span>
        </>
      ) : (
        <>
          <Share2 size={14} />
          <span>리플레이 공유 (Share)</span>
        </>
      )}
    </button>
  );
};
