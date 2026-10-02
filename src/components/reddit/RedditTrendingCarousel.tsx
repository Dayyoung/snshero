/**
 * RedditTrendingCarousel.tsx
 * 실제 reddit.com 첫 화면 상단 "Trending Today" 4개 대형 캐러셀 카드
 * 매일 및 실시간 자동 갱신, 수동 새로고침, 서브레딧 다각화 및 실시간 피드 직결
 */

import React, { useState } from 'react';
import { RefreshCw, Flame } from 'lucide-react';
import { RedditTrendingItem } from '../../lib/reddit/redditTypes';

interface RedditTrendingCarouselProps {
  trendingItems: RedditTrendingItem[];
  isDark: boolean;
  isKo?: boolean;
  onSelectTrending: (item: RedditTrendingItem) => void;
  onRefreshTrending?: () => void;
}

export const RedditTrendingCarousel: React.FC<RedditTrendingCarouselProps> = ({
  trendingItems,
  isDark,
  isKo = true,
  onSelectTrending,
  onRefreshTrending,
}) => {
  const [isRotating, setIsRotating] = useState(false);

  if (!trendingItems || trendingItems.length === 0) return null;

  const handleRefreshClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRefreshTrending) {
      setIsRotating(true);
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(30);
      }
      onRefreshTrending();
      setTimeout(() => setIsRotating(false), 600);
    }
  };

  return (
    <section className="mb-4 w-full max-w-full overflow-hidden">
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-black tracking-wider uppercase opacity-75 flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-[#FF4500] fill-current" />
            <span>{isKo ? '오늘의 트렌드 (Trending Today)' : 'Trending Today'}</span>
          </h2>
          <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-bold bg-[#FF4500]/15 text-[#FF4500] border border-[#FF4500]/20">
            DAILY
          </span>
        </div>

        {onRefreshTrending && (
          <button
            type="button"
            onClick={handleRefreshClick}
            className={`p-1 rounded-full cursor-pointer transition-all duration-200 opacity-60 hover:opacity-100 ${
              isDark ? 'hover:bg-white/10 text-gray-300' : 'hover:bg-black/5 text-gray-700'
            }`}
            title={isKo ? '트렌드 새로고침' : 'Refresh trending'}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRotating ? 'animate-spin text-[#FF4500]' : ''}`} />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {trendingItems.slice(0, 4).map((item) => (
          <div
            key={item.id}
            onClick={() => onSelectTrending(item)}
            className={`relative h-44 rounded-2xl overflow-hidden group cursor-pointer transition-all duration-200 border hover:scale-[1.01] hover:shadow-lg ${
              isDark ? 'border-[#22272B] bg-[#181C1F]' : 'border-gray-200 bg-white'
            }`}
          >
            {/* 배경 이미지 */}
            <img
              src={item.imageUrl}
              alt={item.title}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />

            {/* 그라데이션 오버레이 */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent" />

            {/* 텍스트 콘텐츠 */}
            <div className="absolute inset-0 p-3.5 flex flex-col justify-end text-white">
              <h3 className="font-extrabold text-sm sm:text-base leading-tight mb-1 line-clamp-2 drop-shadow-md group-hover:text-amber-300 transition-colors">
                {item.title}
              </h3>
              <p className="text-[11px] text-gray-300 line-clamp-1 mb-2 font-normal opacity-90">
                {item.description}
              </p>

              {/* 서브레딧 배지 */}
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-200">
                {item.subredditIcon && (
                  <img
                    src={item.subredditIcon}
                    alt={item.subreddit}
                    className="w-4 h-4 rounded-full object-cover border border-white/20"
                  />
                )}
                <span>r/{item.subreddit}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
