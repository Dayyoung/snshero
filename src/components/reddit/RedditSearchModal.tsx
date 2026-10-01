/**
 * RedditSearchModal.tsx
 * 오리지널 레딧 통합 검색 결과 뷰
 * Posts, Communities, People 탭 및 실시간 필터링
 */

import React, { useState } from 'react';
import { 
  Search, 
  ArrowLeft, 
  Users, 
  FileText, 
  Globe 
} from 'lucide-react';
import { SearchResults, RedditUserDataState, RedditPost } from '../../lib/reddit/redditTypes';
import { RedditPostCard } from './RedditPostCard';

interface RedditSearchModalProps {
  query: string;
  results: SearchResults;
  userState: RedditUserDataState;
  onBack: () => void;
  onVote: (postId: string, direction: 'up' | 'down') => void;
  onOpenDetail: (post: RedditPost) => void;
  onSelectSubreddit: (sub: string) => void;
  onOpenUserProfile: (username: string) => void;
  onToggleSave: (postId: string) => void;
  onToggleHide: (postId: string) => void;
  onToggleJoin: (sub: string) => void;
}

export const RedditSearchModal: React.FC<RedditSearchModalProps> = ({
  query,
  results,
  userState,
  onBack,
  onVote,
  onOpenDetail,
  onSelectSubreddit,
  onOpenUserProfile,
  onToggleSave,
  onToggleHide,
  onToggleJoin,
}) => {
  const isDark = userState.theme !== 'light';
  const [activeTab, setActiveTab] = useState<'posts' | 'communities' | 'people'>('posts');

  return (
    <div className="space-y-4">
      {/* 헤더 & 뒤로가기 */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold cursor-pointer transition-colors ${
            isDark ? 'hover:bg-[#22272B] text-gray-200' : 'hover:bg-gray-100 text-gray-800'
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Feed</span>
        </button>

        <div className="text-xs opacity-60">
          Search results for <span className="font-bold text-[#FF4500]">"{query}"</span>
        </div>
      </div>

      {/* 탭 바: Posts, Communities, People */}
      <div className={`rounded-2xl border p-2 flex items-center gap-2 ${
        isDark ? 'bg-[#181C1F] border-[#22272B]' : 'bg-white border-gray-200'
      }`}>
        <button
          type="button"
          onClick={() => setActiveTab('posts')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
            activeTab === 'posts'
              ? isDark ? 'bg-[#272D32] text-white' : 'bg-gray-200 text-gray-900'
              : 'opacity-60 hover:opacity-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Posts ({results.posts.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('communities')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
            activeTab === 'communities'
              ? isDark ? 'bg-[#272D32] text-white' : 'bg-gray-200 text-gray-900'
              : 'opacity-60 hover:opacity-100'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>Communities ({results.subreddits.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('people')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
            activeTab === 'people'
              ? isDark ? 'bg-[#272D32] text-white' : 'bg-gray-200 text-gray-900'
              : 'opacity-60 hover:opacity-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>People ({results.users.length})</span>
        </button>
      </div>

      {/* 탭별 결과 목록 */}
      <div className="space-y-3">
        {activeTab === 'posts' && (
          results.posts.length > 0 ? (
            results.posts.map((post) => (
              <RedditPostCard
                key={post.id}
                post={post}
                viewMode="card"
                isDark={isDark}
                onVote={onVote}
                onOpenDetail={onOpenDetail}
                onSelectSubreddit={onSelectSubreddit}
                onOpenUserProfile={onOpenUserProfile}
                onToggleSave={onToggleSave}
                onToggleHide={onToggleHide}
              />
            ))
          ) : (
            <div className={`rounded-2xl border p-12 text-center text-xs opacity-50 ${
              isDark ? 'bg-[#181C1F] border-[#22272B]' : 'bg-white border-gray-200'
            }`}>
              No posts found matching "{query}".
            </div>
          )
        )}

        {activeTab === 'communities' && (
          results.subreddits.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {results.subreddits.map((sub) => {
                const isSubJoined = userState.joinedSubreddits.includes(sub.name);
                return (
                  <div
                    key={sub.name}
                    className={`rounded-2xl border p-4 shadow-sm flex items-start justify-between gap-3 ${
                      isDark ? 'bg-[#181C1F] border-[#22272B]' : 'bg-white border-gray-200'
                    }`}
                  >
                    <div
                      className="cursor-pointer group flex-1"
                      onClick={() => onSelectSubreddit(sub.name)}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        {sub.iconUrl ? (
                          <img src={sub.iconUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-[#FF4500] text-white flex items-center justify-center font-bold text-xs">
                            r/
                          </div>
                        )}
                        <div>
                          <div className="font-extrabold text-sm group-hover:text-[#FF4500] transition-colors">
                            r/{sub.name}
                          </div>
                          <div className="text-[10px] opacity-60">
                            {sub.subscribers.toLocaleString()} members
                          </div>
                        </div>
                      </div>
                      <p className="text-xs opacity-75 line-clamp-2 leading-relaxed">
                        {sub.description}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => onToggleJoin(sub.name)}
                      className={`px-4 py-1.5 rounded-full text-xs font-bold cursor-pointer transition-colors flex-shrink-0 ${
                        isSubJoined
                          ? isDark ? 'border border-gray-600 text-gray-300' : 'border border-gray-300 text-gray-700'
                          : 'bg-[#FF4500] text-white hover:bg-[#FF5414]'
                      }`}
                    >
                      {isSubJoined ? 'Joined' : 'Join'}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className={`rounded-2xl border p-12 text-center text-xs opacity-50 ${
              isDark ? 'bg-[#181C1F] border-[#22272B]' : 'bg-white border-gray-200'
            }`}>
              No communities found matching "{query}".
            </div>
          )
        )}

        {activeTab === 'people' && (
          results.users.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {results.users.map((u) => (
                <div
                  key={u.username}
                  onClick={() => onOpenUserProfile(u.username)}
                  className={`rounded-2xl border p-4 shadow-sm flex items-center gap-3 cursor-pointer hover:border-[#FF4500]/50 transition-colors ${
                    isDark ? 'bg-[#181C1F] border-[#22272B]' : 'bg-white border-gray-200'
                  }`}
                >
                  <img src={u.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
                  <div>
                    <div className="font-bold text-sm">u/{u.username}</div>
                    <div className="text-[11px] opacity-60">Karma: {u.postKarma.toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={`rounded-2xl border p-12 text-center text-xs opacity-50 ${
              isDark ? 'bg-[#181C1F] border-[#22272B]' : 'bg-white border-gray-200'
            }`}>
              No people found matching "{query}".
            </div>
          )
        )}
      </div>
    </div>
  );
};
