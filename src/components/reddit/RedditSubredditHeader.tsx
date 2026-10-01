/**
 * RedditSubredditHeader.tsx
 * 서브레딧 상단 배너 및 커뮤니티 타이틀/Join 토글 헤더 (한국어 기본 지원)
 */

import React from 'react';
import { Bell } from 'lucide-react';
import { RedditSubreddit } from '../../lib/reddit/redditTypes';

interface RedditSubredditHeaderProps {
  subreddit: RedditSubreddit;
  isJoined: boolean;
  isDark: boolean;
  isKo?: boolean;
  activeTab: 'posts' | 'about' | 'rules';
  onToggleJoin: () => void;
  onSelectTab: (tab: 'posts' | 'about' | 'rules') => void;
}

export const RedditSubredditHeader: React.FC<RedditSubredditHeaderProps> = ({
  subreddit,
  isJoined,
  isDark,
  isKo = true,
  activeTab,
  onToggleJoin,
  onSelectTab,
}) => {
  const isFrontPage = ['popular', 'all', 'home'].includes(subreddit.name.toLowerCase());

  if (isFrontPage) {
    const getFrontPageInfo = () => {
      const name = subreddit.name.toLowerCase();
      if (name === 'popular') {
        return {
          title: isKo ? '인기 피드' : 'Popular',
          desc: isKo ? '현재 SNSHero 전역에서 가장 뜨겁게 화제가 되고 있는 게시물들입니다.' : 'The most active posts from across all of SNSHero right now.',
        };
      }
      if (name === 'all') {
        return {
          title: isKo ? '전체 피드' : 'All',
          desc: isKo ? 'SNSHero의 모든 커뮤니티에서 실시간으로 쏟아지는 전체 콘텐츠입니다.' : 'The complete firehose of community content.',
        };
      }
      return {
        title: isKo ? '홈 피드' : 'Home',
        desc: isKo ? '내가 가입한 커뮤니티들의 소식을 모아보는 맞춤형 피드입니다.' : 'Your personalized feed from joined communities.',
      };
    };

    const info = getFrontPageInfo();

    return (
      <div className={`rounded-2xl border p-4 sm:p-5 mb-4 shadow-sm flex items-center justify-between transition-colors ${
        isDark ? 'bg-[#181C1F] border-[#22272B] text-gray-200' : 'bg-white border-gray-200 text-gray-800'
      }`}>
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold capitalize tracking-tight flex items-center gap-2">
            <span className="text-[#FF4500]">r/</span>
            <span>{info.title}</span>
          </h1>
          <p className="text-xs opacity-65 mt-1 leading-relaxed">
            {info.desc}
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

            <div>
              <h1 className="text-lg sm:text-2xl font-extrabold tracking-tight">
                {subreddit.title || subreddit.name}
              </h1>
              <div className="text-xs font-bold text-[#FF4500]">
                r/{subreddit.name}
              </div>
            </div>
          </div>

          {/* Join 버튼 */}
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
              {isJoined ? (isKo ? '가입됨' : 'Joined') : (isKo ? '커뮤니티 가입' : 'Join')}
            </button>

            {isJoined && (
              <button
                type="button"
                className={`p-2 rounded-full border cursor-pointer transition-colors ${
                  isDark ? 'border-gray-700 hover:bg-[#22272B]' : 'border-gray-200 hover:bg-gray-100'
                }`}
                title={isKo ? "알림 설정" : "Community Notifications"}
              >
                <Bell className="w-4 h-4 text-[#FF4500]" />
              </button>
            )}
          </div>
        </div>

        {/* 3. 탭 바: Posts, About, Rules */}
        <div className="flex items-center gap-4 border-t border-inherit/10 pt-2 text-xs font-bold">
          {[
            { id: 'posts', label: isKo ? '게시물' : 'Posts' },
            { id: 'about', label: isKo ? '소개' : 'About' },
            { id: 'rules', label: isKo ? '규칙' : 'Rules' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectTab(tab.id as 'posts' | 'about' | 'rules')}
              className={`pb-1 cursor-pointer uppercase tracking-wider transition-colors relative ${
                activeTab === tab.id
                  ? 'text-[#FF4500]'
                  : 'opacity-60 hover:opacity-100'
              }`}
            >
              <span>{tab.label}</span>
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FF4500] rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
