/**
 * RedditSubredditHeader.tsx
 * 서브레딧 상단 배너 및 커뮤니티 타이틀/Join 토글 헤더
 */

import React from 'react';
import { Bell, Sparkles } from 'lucide-react';
import { RedditSubreddit } from '../../lib/reddit/redditTypes';

interface RedditSubredditHeaderProps {
  subreddit: RedditSubreddit;
  isJoined: boolean;
  isDark: boolean;
  activeTab: 'posts' | 'about' | 'rules';
  onToggleJoin: () => void;
  onSelectTab: (tab: 'posts' | 'about' | 'rules') => void;
}

export const RedditSubredditHeader: React.FC<RedditSubredditHeaderProps> = ({
  subreddit,
  isJoined,
  isDark,
  activeTab,
  onToggleJoin,
  onSelectTab,
}) => {
  const isFrontPage = ['popular', 'all', 'home'].includes(subreddit.name.toLowerCase());

  if (isFrontPage) {
    return (
      <div className={`rounded-2xl border p-4 mb-4 shadow-sm flex items-center justify-between transition-colors ${
        isDark ? 'bg-[#181C1F] border-[#22272B] text-gray-200' : 'bg-white border-gray-200 text-gray-800'
      }`}>
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold capitalize tracking-tight flex items-center gap-2">
            <span className="text-[#FF4500]">r/</span>
            <span>{subreddit.name}</span>
          </h1>
          <p className="text-xs opacity-60 mt-0.5">
            {subreddit.name.toLowerCase() === 'popular' && 'The most active posts from across all of SNSHero right now.'}
            {subreddit.name.toLowerCase() === 'all' && 'The complete firehose of community content.'}
            {subreddit.name.toLowerCase() === 'home' && 'Your personalized feed from joined communities.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border mb-4 overflow-hidden shadow-sm transition-colors ${
      isDark ? 'bg-[#181C1F] border-[#22272B] text-gray-200' : 'bg-white border-gray-200 text-gray-800'
    }`}>
      {/* 1. 커버 배너 이미지 */}
      <div className="h-28 sm:h-40 w-full relative bg-gradient-to-r from-amber-500 via-[#FF4500] to-purple-600 overflow-hidden">
        {subreddit.bannerUrl && (
          <img
            src={subreddit.bannerUrl}
            alt={subreddit.name}
            className="w-full h-full object-cover opacity-90"
          />
        )}
      </div>

      {/* 2. 서브레딧 아바타 및 타이틀 & Join 버튼 바 */}
      <div className="px-4 pb-3 sm:px-6 relative">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 -mt-8 sm:-mt-10 mb-3">
          <div className="flex items-end gap-3 sm:gap-4">
            {/* 원형 아바타 */}
            <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 overflow-hidden flex-shrink-0 shadow-lg relative bg-white ${
              isDark ? 'border-[#181C1F]' : 'border-white'
            }`}>
              {subreddit.iconUrl ? (
                <img src={subreddit.iconUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-[#FF4500] flex items-center justify-center font-bold text-white text-xl">
                  r/
                </div>
              )}
            </div>

            {/* 타이틀 및 네임스페이스 */}
            <div>
              <h1 className="text-lg sm:text-2xl font-extrabold tracking-tight">
                {subreddit.title || subreddit.name}
              </h1>
              <div className="text-xs font-bold text-[#FF4500]">
                r/{subreddit.name}
              </div>
            </div>
          </div>

          {/* Join / Bell 액션 버튼 */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={onToggleJoin}
              className={`px-5 py-2 rounded-full font-bold text-xs cursor-pointer shadow-sm transition-all ${
                isJoined
                  ? isDark
                    ? 'border border-gray-600 text-gray-200 hover:border-red-500 hover:text-red-400'
                    : 'border border-gray-300 text-gray-800 hover:border-red-500 hover:text-red-500'
                  : 'bg-[#FF4500] hover:bg-[#FF5414] text-white'
              }`}
            >
              {isJoined ? 'Joined' : 'Join'}
            </button>

            {isJoined && (
              <button
                type="button"
                className={`p-2 rounded-full border cursor-pointer transition-colors ${
                  isDark ? 'border-gray-700 hover:bg-[#22272B]' : 'border-gray-200 hover:bg-gray-100'
                }`}
                title="Community Notifications"
              >
                <Bell className="w-4 h-4 text-[#FF4500]" />
              </button>
            )}
          </div>
        </div>

        {/* 3. 탭 바: Posts, About, Rules */}
        <div className="flex items-center gap-4 border-t border-inherit/10 pt-2 text-xs font-bold">
          {(['posts', 'about', 'rules'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => onSelectTab(tab)}
              className={`pb-1 cursor-pointer uppercase tracking-wider transition-colors relative ${
                activeTab === tab
                  ? 'text-[#FF4500]'
                  : 'opacity-60 hover:opacity-100'
              }`}
            >
              <span>{tab}</span>
              {activeTab === tab && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FF4500] rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
