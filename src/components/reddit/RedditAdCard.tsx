/**
 * RedditAdCard.tsx
 * 오리지널 레딧 피드 내 Promoted(스폰서드) 포스트 스타일의 SNSHero 공식 게임 스폰서 카드
 * 고화질 SNSHero 게임 대표 이미지 배너 제공 및 클릭 시 게임하기로 즉시 이동
 */

import React from 'react';
import { ExternalLink, Sparkles, Gamepad2, ArrowRight, Trophy } from 'lucide-react';
import { AdSenseBanner } from '../AdSenseBanner';

interface RedditAdCardProps {
  isDark: boolean;
  isKo?: boolean;
  onGoToGame?: () => void;
}

export const RedditAdCard: React.FC<RedditAdCardProps> = ({ isDark, isKo = true, onGoToGame }) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onGoToGame) {
      onGoToGame();
    } else {
      window.location.href = '/home';
    }
  };

  return (
    <article
      onClick={handleClick}
      className={`rounded-2xl border p-4 mb-3.5 shadow-sm hover:shadow-md cursor-pointer transition-all duration-200 w-full max-w-full overflow-hidden break-words group ${
        isDark ? 'bg-[#181C1F] border-[#22272B] hover:border-[#FF4500]/40 text-gray-200' : 'bg-white border-gray-200 hover:border-[#FF4500]/40 text-gray-800'
      }`}
    >
      {/* 1. 상단 프로모션 헤더 */}
      <div className="flex items-center justify-between text-xs mb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-amber-500 to-[#FF4500] flex items-center justify-center text-[10px] text-white font-extrabold shadow-sm">
            AD
          </div>
          <span className="font-bold text-xs opacity-90">
            {isKo ? 'u/SNSHero_공식스폰서' : 'u/SNSHero_Official'}
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FF4500]/10 text-[#FF4500] flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5" />
            <span>{isKo ? '프로모션' : 'Promoted'}</span>
          </span>
        </div>
        <div className="text-[10px] opacity-50 flex items-center gap-1">
          <span>{isKo ? '스폰서' : 'Sponsored'}</span>
          <ExternalLink className="w-3 h-3" />
        </div>
      </div>

      {/* 2. 광고 타이틀 */}
      <h3 className="font-bold text-sm sm:text-base mb-3 leading-snug break-words group-hover:text-[#FF4500] transition-colors">
        {isKo 
          ? 'SNSHero 차세대 웹 카드 배틀 아레나를 지금 바로 무료로 즐겨보세요! 설치 0초, 로딩 0초.' 
          : 'Discover Next-Generation Gaming on SNSHero. 100% Free, Zero Install, Zero Lag.'}
      </h3>

      {/* 3. 구글 애드센스 인피드 반응형 광고 슬롯 */}
      <div className="w-full rounded-xl overflow-hidden mb-3 border border-inherit/15 bg-black/5 dark:bg-white/5 flex flex-col items-center justify-center p-2 min-h-[140px]">
        <AdSenseBanner
          format="fluid"
          responsive={true}
          showLabel={true}
          className="w-full flex flex-col justify-center"
        />
      </div>

      {/* 4. 하단 CTA 바 */}
      <div className="mt-2 flex items-center justify-between pt-2 border-t border-inherit/10 text-xs">
        <span className="text-[11px] opacity-60 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-[#FF4500]" />
          <span>{isKo ? 'SNSHero 공식 웹 게임' : 'SNSHero Official Web Game'}</span>
        </span>
        <button
          type="button"
          onClick={handleClick}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-[#FF4500] to-[#FF6B00] hover:from-[#FF5414] hover:to-[#FF8500] text-white font-extrabold text-xs cursor-pointer shadow-md shadow-[#FF4500]/25 transition-all hover:scale-105 active:scale-95"
        >
          <Gamepad2 className="w-3.5 h-3.5" />
          <span>{isKo ? '자세히 보기 (게임하기)' : 'Play Game'}</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </article>
  );
};
