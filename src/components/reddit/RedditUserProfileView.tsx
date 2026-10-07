/**
 * RedditUserProfileView.tsx
 * 오리지널 레딧 유저 프로필 페이지 컴포넌트 (한국어 기본 지원)
 */

import React, { useState } from 'react';
import { 
  Sparkles, 
  Calendar, 
  ArrowLeft, 
  MessageSquare, 
  User, 
  Share2, 
  Check 
} from 'lucide-react';
import { RedditUser, RedditPost, RedditUserDataState } from '../../lib/reddit/redditTypes';
import { RedditPostCard } from './RedditPostCard';
import { AdSenseBanner } from '../AdSenseBanner';

interface RedditUserProfileViewProps {
  user: RedditUser;
  posts: RedditPost[];
  userState: RedditUserDataState;
  onBack: () => void;
  onVote: (postId: string, direction: 'up' | 'down') => void;
  onOpenDetail: (post: RedditPost) => void;
  onSelectSubreddit: (sub: string) => void;
  onToggleSave: (postId: string) => void;
  onToggleHide: (postId: string) => void;
}

export const RedditUserProfileView: React.FC<RedditUserProfileViewProps> = ({
  user,
  posts,
  userState,
  onBack,
  onVote,
  onOpenDetail,
  onSelectSubreddit,
  onToggleSave,
  onToggleHide,
}) => {
  const isDark = userState.theme !== 'light';
  const isKo = userState.language !== 'en';
  const [activeTab, setActiveTab] = useState<'overview' | 'posts' | 'saved'>('overview');
  const [isCopied, setIsCopied] = useState(false);

  const handleShareProfile = () => {
    const url = `${window.location.origin}/u/${user.username}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const userPosts = posts.filter((p) => p.author.toLowerCase() === user.username.toLowerCase());
  const savedPosts = posts.filter((p) => userState.savedPostIds.includes(p.id));

  return (
    <div className="space-y-4 w-full max-w-full overflow-hidden">
      {/* 뒤로가기 바 */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold cursor-pointer transition-colors ${
            isDark ? 'hover:bg-[#22272B] text-gray-200' : 'hover:bg-gray-100 text-gray-800'
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{isKo ? '피드로 돌아가기' : 'Back to Feed'}</span>
        </button>

        <button
          type="button"
          onClick={handleShareProfile}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border cursor-pointer ${
            isDark ? 'border-gray-700 hover:bg-[#22272B]' : 'border-gray-200 hover:bg-gray-100'
          }`}
        >
          {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
          <span>{isCopied ? (isKo ? '링크 복사됨!' : 'Copied!') : (isKo ? '프로필 공유' : 'Share Profile')}</span>
        </button>
      </div>

      {/* 프로필 카드 헤더 */}
      <div className={`rounded-2xl border overflow-hidden shadow-sm ${
        isDark ? 'bg-[#181C1F] border-[#22272B] text-gray-200' : 'bg-white border-gray-200 text-gray-800'
      }`}>
        <div className="h-24 sm:h-32 w-full bg-gradient-to-r from-sky-500 via-indigo-600 to-purple-600 relative">
          {user.bannerUrl && (
            <img src={user.bannerUrl} alt="" className="w-full h-full object-cover opacity-80" />
          )}
        </div>

        <div className="p-4 sm:p-6 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 sm:-mt-16 mb-4">
            <div className="flex items-end gap-3 sm:gap-4">
              <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 overflow-hidden flex-shrink-0 shadow-lg bg-white ${
                isDark ? 'border-[#181C1F]' : 'border-white'
              }`}>
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-12 h-12 text-gray-400 m-auto" />
                )}
              </div>

              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                  u/{user.username}
                </h1>
                <p className="text-xs opacity-70 mt-0.5 max-w-lg">
                  {user.about || (isKo ? 'SNSHero 커뮤니티의 활발한 멤버입니다.' : 'A curious explorer in the SNSHero community.')}
                </p>
              </div>
            </div>
          </div>

          {/* 카르마 및 가입일 통계 */}
          <div className="grid grid-cols-3 gap-2 py-3 border-y border-inherit/10 text-xs">
            <div>
              <div className="font-extrabold text-sm sm:text-base text-[#FF4500]">
                {user.postKarma.toLocaleString()}
              </div>
              <div className="text-[10px] opacity-60 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>{isKo ? '게시물 카르마' : 'Post Karma'}</span>
              </div>
            </div>
            <div>
              <div className="font-extrabold text-sm sm:text-base text-sky-400">
                {user.commentKarma.toLocaleString()}
              </div>
              <div className="text-[10px] opacity-60 flex items-center gap-1">
                <MessageSquare className="w-3 h-3" />
                <span>{isKo ? '댓글 카르마' : 'Comment Karma'}</span>
              </div>
            </div>
            <div>
              <div className="font-extrabold text-sm sm:text-base">
                {new Date(user.cakeDay).toLocaleDateString()}
              </div>
              <div className="text-[10px] opacity-60 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>{isKo ? '가입일' : 'Cake Day'}</span>
              </div>
            </div>
          </div>

          {/* 탭 바 */}
          <div className="flex items-center gap-4 mt-3 pt-1 text-xs font-bold">
            {[
              { id: 'overview', label: isKo ? '한눈에 보기' : 'Overview' },
              { id: 'posts', label: isKo ? '작성한 글' : 'Posts' },
              { id: 'saved', label: isKo ? '저장한 글' : 'Saved' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as 'overview' | 'posts' | 'saved')}
                className={`pb-1 cursor-pointer uppercase tracking-wider transition-colors relative ${
                  activeTab === tab.id ? 'text-[#FF4500]' : 'opacity-60 hover:opacity-100'
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

      {/* 프로필 상단 Google AdSense 배너 */}
      <div className={`rounded-2xl border p-2.5 shadow-xs overflow-hidden ${
        isDark ? 'bg-[#181C1F] border-[#22272B]' : 'bg-white border-gray-200'
      }`}>
        <AdSenseBanner
          format="horizontal"
          responsive={true}
          showLabel={true}
          className="w-full flex justify-center"
        />
      </div>

      {/* 포스트 목록 */}
      <div className="space-y-3">
        {activeTab === 'posts' || activeTab === 'overview' ? (
          userPosts.length > 0 ? (
            userPosts.map((p) => (
              <RedditPostCard
                key={p.id}
                post={p}
                viewMode="card"
                isDark={isDark}
                isKo={isKo}
                onVote={onVote}
                onOpenDetail={onOpenDetail}
                onSelectSubreddit={onSelectSubreddit}
                onOpenUserProfile={() => {}}
                onToggleSave={onToggleSave}
                onToggleHide={onToggleHide}
              />
            ))
          ) : (
            <div className={`rounded-2xl border p-12 text-center text-xs opacity-50 ${
              isDark ? 'bg-[#181C1F] border-[#22272B]' : 'bg-white border-gray-200'
            }`}>
              {isKo ? `u/${user.username} 님이 아직 작성한 게시물이 없습니다.` : `u/${user.username} has not submitted any posts yet.`}
            </div>
          )
        ) : (
          savedPosts.length > 0 ? (
            savedPosts.map((p) => (
              <RedditPostCard
                key={p.id}
                post={p}
                viewMode="card"
                isDark={isDark}
                isKo={isKo}
                onVote={onVote}
                onOpenDetail={onOpenDetail}
                onSelectSubreddit={onSelectSubreddit}
                onOpenUserProfile={() => {}}
                onToggleSave={onToggleSave}
                onToggleHide={onToggleHide}
              />
            ))
          ) : (
            <div className={`rounded-2xl border p-12 text-center text-xs opacity-50 ${
              isDark ? 'bg-[#181C1F] border-[#22272B]' : 'bg-white border-gray-200'
            }`}>
              {isKo ? '저장된 게시물이 없습니다.' : 'No saved posts found.'}
            </div>
          )
        )}
      </div>

      {/* 프로필 하단 Google AdSense 배너 */}
      <div className={`rounded-2xl border p-2.5 shadow-xs overflow-hidden ${
        isDark ? 'bg-[#181C1F] border-[#22272B]' : 'bg-white border-gray-200'
      }`}>
        <AdSenseBanner
          format="horizontal"
          responsive={true}
          showLabel={true}
          className="w-full flex justify-center"
        />
      </div>
    </div>
  );
};
