/**
 * RedditPostCard.tsx
 * 오리지널 레딧 포스트 카드 컴포넌트 (한국어 기본 지원)
 */

import React, { useState } from 'react';
import { 
  ArrowBigUp, 
  ArrowBigDown, 
  MessageSquare, 
  Share2, 
  Bookmark, 
  MoreHorizontal, 
  EyeOff, 
  Check, 
  ExternalLink 
} from 'lucide-react';
import { RedditPost, ViewModeType } from '../../lib/reddit/redditTypes';

interface RedditPostCardProps {
  post: RedditPost;
  viewMode: ViewModeType;
  isDark: boolean;
  isKo?: boolean;
  onVote: (postId: string, direction: 'up' | 'down') => void;
  onOpenDetail: (post: RedditPost) => void;
  onSelectSubreddit: (subreddit: string) => void;
  onOpenUserProfile: (username: string) => void;
  onToggleSave: (postId: string) => void;
  onToggleHide: (postId: string) => void;
}

export const RedditPostCard: React.FC<RedditPostCardProps> = ({
  post,
  viewMode,
  isDark,
  isKo = true,
  onVote,
  onOpenDetail,
  onSelectSubreddit,
  onOpenUserProfile,
  onToggleSave,
  onToggleHide,
}) => {
  const [isCopied, setIsCopied] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // 시간 경과 포맷
  const getRelativeTime = (timestamp: number) => {
    const diff = Math.max(0, Date.now() - timestamp);
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return isKo ? `${mins || 1}분 전` : `${mins || 1}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return isKo ? `${hours}시간 전` : `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return isKo ? `${days}일 전` : `${days}d ago`;
  };

  const formatScore = (num: number) => {
    if (Math.abs(num) >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/r/${post.subreddit}/comments/${post.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  /* ========================================================
   * 1. COMPACT VIEW (단순 밀집 텍스트 뷰)
   * ======================================================== */
  if (viewMode === 'compact') {
    return (
      <article
        onClick={() => onOpenDetail(post)}
        className={`px-3 py-2 border-b flex items-center justify-between gap-3 text-xs cursor-pointer transition-colors ${
          isDark 
            ? 'bg-[#181C1F] hover:bg-[#22272B] border-[#22272B] text-gray-200' 
            : 'bg-white hover:bg-gray-50 border-gray-100 text-gray-800'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center gap-1 font-bold w-12 text-center flex-shrink-0">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onVote(post.id, 'up'); }}
              className={`p-0.5 rounded cursor-pointer ${post.userVote === 'up' ? 'text-[#FF4500]' : 'opacity-50'}`}
            >
              <ArrowBigUp className="w-4 h-4 fill-current" />
            </button>
            <span className={post.userVote === 'up' ? 'text-[#FF4500]' : post.userVote === 'down' ? 'text-[#7193FF]' : ''}>
              {formatScore(post.score)}
            </span>
          </div>

          <span
            onClick={(e) => { e.stopPropagation(); onSelectSubreddit(post.subreddit); }}
            className="font-bold hover:underline text-[#FF4500] flex-shrink-0"
          >
            r/{post.subreddit}
          </span>
          <span className="font-medium truncate">{post.title}</span>
        </div>

        <div className="flex items-center gap-3 opacity-60 flex-shrink-0 text-[11px]">
          <span className="flex items-center gap-1">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{post.commentCount}</span>
          </span>
          <span>{getRelativeTime(post.createdAt)}</span>
        </div>
      </article>
    );
  }

  /* ========================================================
   * 2. CLASSIC VIEW (고전 목록 썸네일 뷰)
   * ======================================================== */
  if (viewMode === 'classic') {
    return (
      <article
        onClick={() => onOpenDetail(post)}
        className={`p-3 rounded-xl border mb-2 flex items-start gap-3 text-xs cursor-pointer transition-colors shadow-sm ${
          isDark 
            ? 'bg-[#181C1F] hover:border-gray-600 border-[#22272B] text-gray-200' 
            : 'bg-white hover:border-gray-300 border-gray-200 text-gray-800'
        }`}
      >
        <div className="flex flex-col items-center flex-shrink-0 py-1">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onVote(post.id, 'up'); }}
            className={`p-1 rounded cursor-pointer hover:bg-black/10 transition-colors ${
              post.userVote === 'up' ? 'text-[#FF4500]' : 'opacity-60 hover:opacity-100'
            }`}
          >
            <ArrowBigUp className="w-5 h-5 fill-current" />
          </button>
          <span className={`font-bold text-xs my-0.5 ${
            post.userVote === 'up' ? 'text-[#FF4500]' : post.userVote === 'down' ? 'text-[#7193FF]' : ''
          }`}>
            {formatScore(post.score)}
          </span>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onVote(post.id, 'down'); }}
            className={`p-1 rounded cursor-pointer hover:bg-black/10 transition-colors ${
              post.userVote === 'down' ? 'text-[#7193FF]' : 'opacity-60 hover:opacity-100'
            }`}
          >
            <ArrowBigDown className="w-5 h-5 fill-current" />
          </button>
        </div>

        {post.media?.url && (
          <div className="w-20 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-black/10">
            <img src={post.media.url} alt="" className="w-full h-full object-cover" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 text-[11px] opacity-60 mb-1 flex-wrap">
            <span
              onClick={(e) => { e.stopPropagation(); onSelectSubreddit(post.subreddit); }}
              className="font-bold opacity-100 hover:underline text-[#FF4500]"
            >
              r/{post.subreddit}
            </span>
            <span>•</span>
            <span>{isKo ? '게시자:' : 'Posted by'}</span>
            <span
              onClick={(e) => { e.stopPropagation(); onOpenUserProfile(post.author); }}
              className="hover:underline"
            >
              u/{post.author}
            </span>
            <span>{getRelativeTime(post.createdAt)}</span>
          </div>

          <h2 className="font-bold text-sm leading-snug line-clamp-2 mb-2">{post.title}</h2>

          <div className="flex items-center gap-4 opacity-70 text-[11px]">
            <span className="flex items-center gap-1 font-semibold">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{isKo ? `댓글 ${post.commentCount}개` : `${post.commentCount} Comments`}</span>
            </span>
            <button
              type="button"
              onClick={handleShare}
              className="flex items-center gap-1 hover:opacity-100 cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{isCopied ? (isKo ? '복사됨!' : 'Copied!') : (isKo ? '공유' : 'Share')}</span>
            </button>
          </div>
        </div>
      </article>
    );
  }

  /* ========================================================
   * 3. CARD VIEW (기본 대형 카드 뷰 - 원본 레딧 표준)
   * ======================================================== */
  return (
    <article
      onClick={() => onOpenDetail(post)}
      className={`rounded-2xl border mb-3.5 shadow-sm cursor-pointer transition-all ${
        isDark 
          ? 'bg-[#181C1F] hover:border-gray-600 border-[#22272B] text-gray-200' 
          : 'bg-white hover:border-gray-300 border-gray-200 text-gray-800'
      }`}
    >
      <div className="p-3.5 sm:p-4">
        {/* 1. 헤더 */}
        <div className="flex items-center justify-between text-xs mb-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onSelectSubreddit(post.subreddit); }}
              className="font-bold hover:underline flex items-center gap-1 text-inherit cursor-pointer"
            >
              <span className="text-[#FF4500] font-extrabold">r/</span>
              <span>{post.subreddit}</span>
            </button>
            <span className="opacity-40">•</span>
            <span className="opacity-60 text-[11px]">{isKo ? '게시자:' : 'Posted by'}</span>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onOpenUserProfile(post.author); }}
              className="hover:underline opacity-80 cursor-pointer text-[11px]"
            >
              u/{post.author}
            </button>
            <span className="opacity-40">•</span>
            <span className="opacity-60 text-[11px]">{getRelativeTime(post.createdAt)}</span>

            {post.flair && (
              <span
                className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-tight shadow-sm ml-1"
                style={{
                  backgroundColor: post.flair.bgColor || '#FF4500',
                  color: post.flair.textColor || '#FFFFFF',
                }}
              >
                {post.flair.text}
              </span>
            )}
          </div>

          {/* 더보기 메뉴 버튼 */}
          <div className="relative">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }}
              className="p-1 rounded-full hover:bg-black/10 cursor-pointer opacity-60 hover:opacity-100"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {isMenuOpen && (
              <div
                className={`absolute top-full right-0 mt-1 w-36 rounded-xl border shadow-xl py-1 z-30 text-xs overflow-hidden backdrop-blur-md ${
                  isDark ? 'bg-[#181C1F] border-[#2E363E] text-gray-200' : 'bg-white border-gray-200 text-gray-800'
                }`}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => { onToggleSave(post.id); setIsMenuOpen(false); }}
                  className={`w-full text-left px-3 py-2 flex items-center gap-2 cursor-pointer ${
                    isDark ? 'hover:bg-[#22272B]' : 'hover:bg-gray-100'
                  }`}
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>{post.isSaved ? (isKo ? '저장 취소' : 'Unsave') : (isKo ? '게시물 저장' : 'Save Post')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => { onToggleHide(post.id); setIsMenuOpen(false); }}
                  className={`w-full text-left px-3 py-2 flex items-center gap-2 cursor-pointer ${
                    isDark ? 'hover:bg-[#22272B]' : 'hover:bg-gray-100'
                  }`}
                >
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>{isKo ? '게시물 숨기기' : 'Hide Post'}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 2. 타이틀 */}
        <h2 className="font-bold text-base sm:text-lg leading-snug mb-3">
          {post.title}
        </h2>

        {/* 3. 본문 텍스트 */}
        {post.body && (
          <div className="text-xs sm:text-sm leading-relaxed opacity-85 mb-3 line-clamp-3 whitespace-pre-line font-sans">
            {post.body}
          </div>
        )}

        {/* 4. 고화질 미디어 (동영상 및 이미지 완벽 지원) */}
        {post.media?.url && (
          <div 
            onClick={(e) => {
              if (post.media?.type === 'video') e.stopPropagation();
            }}
            className="relative rounded-xl overflow-hidden mb-3 bg-black flex items-center justify-center max-h-[500px] border border-inherit/10 group"
          >
            {post.media.type === 'video' ? (
              <div className="relative w-full flex items-center justify-center bg-black">
                <video
                  src={post.media.url}
                  poster={post.media.previewUrl}
                  controls
                  playsInline
                  preload="metadata"
                  className="w-full max-h-[500px] object-contain rounded-xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <source src={post.media.url} type="video/webm" />
                  <source src={post.media.url} type="video/mp4" />
                  {isKo ? '브라우저가 비디오 재생을 지원하지 않습니다.' : 'Your browser does not support the video tag.'}
                </video>
              </div>
            ) : (
              <img
                src={post.media.url}
                alt={post.title}
                loading="lazy"
                className="w-full h-auto max-h-[500px] object-contain transition-transform duration-300 hover:scale-[1.01]"
              />
            )}
            {post.media.domain && (
              <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/70 text-white text-[10px] font-semibold flex items-center gap-1 backdrop-blur-sm pointer-events-none">
                <span>{post.media.domain}</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </div>
            )}
          </div>
        )}

        {/* 5. 액션 바: 보팅 카운터 + 댓글 + 공유 + 저장 */}
        <div className="flex items-center gap-1.5 sm:gap-3 pt-1 text-xs font-semibold">
          {/* 보팅 위젯 캡슐 */}
          <div
            onClick={(e) => e.stopPropagation()}
            className={`flex items-center rounded-full px-1.5 py-0.5 border ${
              isDark ? 'bg-[#22272B] border-[#2A3238]' : 'bg-gray-100 border-gray-200'
            }`}
          >
            <button
              type="button"
              onClick={() => onVote(post.id, 'up')}
              className={`p-1 rounded-full cursor-pointer transition-colors ${
                post.userVote === 'up'
                  ? 'text-[#FF4500]'
                  : 'opacity-70 hover:opacity-100 hover:text-[#FF4500]'
              }`}
              title={isKo ? "추천" : "Upvote"}
            >
              <ArrowBigUp className="w-5 h-5 fill-current" />
            </button>
            <span
              className={`px-1.5 text-xs font-bold ${
                post.userVote === 'up'
                  ? 'text-[#FF4500]'
                  : post.userVote === 'down'
                  ? 'text-[#7193FF]'
                  : ''
              }`}
            >
              {formatScore(post.score)}
            </span>
            <button
              type="button"
              onClick={() => onVote(post.id, 'down')}
              className={`p-1 rounded-full cursor-pointer transition-colors ${
                post.userVote === 'down'
                  ? 'text-[#7193FF]'
                  : 'opacity-70 hover:opacity-100 hover:text-[#7193FF]'
              }`}
              title={isKo ? "비추천" : "Downvote"}
            >
              <ArrowBigDown className="w-5 h-5 fill-current" />
            </button>
          </div>

          {/* 댓글 수 버튼 */}
          <button
            type="button"
            onClick={() => onOpenDetail(post)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full cursor-pointer transition-colors border ${
              isDark
                ? 'bg-[#22272B] border-[#2A3238] hover:bg-[#2A3238] text-gray-200'
                : 'bg-gray-100 border-gray-200 hover:bg-gray-200 text-gray-800'
            }`}
          >
            <MessageSquare className="w-4 h-4 opacity-70" />
            <span>{isKo ? `댓글 ${post.commentCount}개` : `${post.commentCount} Comments`}</span>
          </button>

          {/* 공유 버튼 */}
          <button
            type="button"
            onClick={handleShare}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full cursor-pointer transition-colors border ${
              isDark
                ? 'bg-[#22272B] border-[#2A3238] hover:bg-[#2A3238] text-gray-200'
                : 'bg-gray-100 border-gray-200 hover:bg-gray-200 text-gray-800'
            }`}
          >
            {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4 opacity-70" />}
            <span>{isCopied ? (isKo ? '링크 복사됨!' : 'Link Copied!') : (isKo ? '공유' : 'Share')}</span>
          </button>

          {/* 북마크 저장 버튼 */}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onToggleSave(post.id); }}
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full cursor-pointer transition-colors border ${
              post.isSaved ? 'text-[#FF4500] border-[#FF4500]/40' : ''
            } ${
              isDark
                ? 'bg-[#22272B] border-[#2A3238] hover:bg-[#2A3238] text-gray-200'
                : 'bg-gray-100 border-gray-200 hover:bg-gray-200 text-gray-800'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${post.isSaved ? 'fill-current text-[#FF4500]' : 'opacity-70'}`} />
            <span>{post.isSaved ? (isKo ? '저장됨' : 'Saved') : (isKo ? '저장' : 'Save')}</span>
          </button>
        </div>
      </div>
    </article>
  );
};
