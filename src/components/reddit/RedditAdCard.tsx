/**
 * RedditAdCard.tsx
 * 오리지널 레딧 피드 내 Promoted(스폰서드) 포스트 스타일의 구글 애드센스(Google AdSense) 카드
 */

import React from 'react';
import { ExternalLink, Sparkles } from 'lucide-react';
import { AdSenseBanner } from '../AdSenseBanner';

interface RedditAdCardProps {
  isDark: boolean;
  isKo?: boolean;
}

export const RedditAdCard: React.FC<RedditAdCardProps> = ({ isDark, isKo = true }) => {
  return (
    <article
      className={`rounded-2xl border p-4 mb-3.5 shadow-sm transition-all ${
        isDark ? 'bg-[#181C1F] border-[#22272B] text-gray-200' : 'bg-white border-gray-200 text-gray-800'
      }`}
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between text-xs mb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-amber-500 to-[#FF4500] flex items-center justify-center text-[10px] text-white font-extrabold shadow-sm">
            AD
          </div>
          <span className="font-bold text-xs opacity-90">
            {isKo ? 'u/SNSHero_공식스폰서' : 'u/SNSHero_Sponsored'}
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FF4500]/10 text-[#FF4500] flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5" />
            <span>{isKo ? '프로모션' : 'Promoted'}</span>
          </span>
        </div>
        <div className="text-[10px] opacity-40 flex items-center gap-1">
          <span>{isKo ? '스폰서' : 'Sponsored'}</span>
          <ExternalLink className="w-3 h-3" />
        </div>
      </div>

      {/* 광고 타이틀 */}
      <h3 className="font-bold text-sm sm:text-base mb-3 leading-snug">
        {isKo 
          ? 'SNSHero 차세대 웹 카드 배틀 아레나를 지금 바로 무료로 즐겨보세요! 설치 0초, 로딩 0초.' 
          : 'Discover Next-Generation Gaming & Communities on SNSHero. 100% Free & Zero-Lag.'}
      </h3>

      {/* 구글 애드센스 인피드 반응형 광고 배너 렌더링 */}
      <div className="w-full min-h-[140px] sm:min-h-[200px] rounded-xl overflow-hidden bg-black/5 flex items-center justify-center p-2 border border-inherit/10">
        <AdSenseBanner
          format="fluid"
          responsive={true}
          className="w-full flex justify-center"
        />
      </div>

      {/* 하단 CTA 바 */}
      <div className="mt-3 flex items-center justify-between pt-2 border-t border-inherit/10 text-xs">
        <span className="text-[11px] opacity-60">Google Certified Partner Ad Network</span>
        <a
          href="https://snshero.com"
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-1.5 rounded-full bg-[#FF4500] text-white font-bold text-xs hover:bg-[#FF5414] transition-colors"
        >
          {isKo ? '자세히 보기' : 'Learn More'}
        </a>
      </div>
    </article>
  );
};
