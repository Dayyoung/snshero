/**
 * RedditPostDetailModal.tsx
 * 오리지널 레딧 포스트 상세 뷰 및 모달
 * 고화질 미디어, 마크다운 본문, 구글 애드센스 배너, 풍부한 댓글 작성기 및 중첩 댓글 트리
 */

import React, { useState } from 'react';
import { 
  X, 
  ArrowBigUp, 
  ArrowBigDown, 
  MessageSquare, 
  Share2, 
  Bookmark, 
  MoreHorizontal, 
  Bold, 
  Italic, 
  Link as LinkIcon, 
  Code, 
  Quote, 
  List, 
  Check, 
  ArrowLeft,
  ExternalLink
} from 'lucide-react';
import { RedditPost, RedditComment, RedditSubreddit, RedditUserDataState } from '../../lib/reddit/redditTypes';
import { RedditCommentTree } from './RedditCommentTree';
import { RedditSidebarRight } from './RedditSidebarRight';
import { AdSenseBanner } from '../AdSenseBanner';

interface RedditPostDetailModalProps {
  post: RedditPost;
  comments: RedditComment[];
  subredditData: RedditSubreddit;
  userState: RedditUserDataState;
  onClose: () => void;
  onVotePost: (postId: string, direction: 'up' | 'down') => void;
  onVoteComment: (commentId: string, direction: 'up' | 'down') => void;
  onAddComment: (postId: string, text: string) => void;
  onAddReply: (parentId: string, text: string) => void;
  onSelectSubreddit: (subreddit: string) => void;
  onOpenUserProfile: (username: string) => void;
  onToggleSave: (postId: string) => void;
  onToggleJoin: (subreddit: string) => void;
  onOpenSubmitModal: () => void;
}

export const RedditPostDetailModal: React.FC<RedditPostDetailModalProps> = ({
  post,
  comments,
  subredditData,
  userState,
  onClose,
  onVotePost,
  onVoteComment,
  onAddComment,
  onAddReply,
  onSelectSubreddit,
  onOpenUserProfile,
  onToggleSave,
  onToggleJoin,
  onOpenSubmitModal,
}) => {
  const isDark = userState.theme !== 'light';
  const [commentText, setCommentText] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  const getRelativeTime = (timestamp: number) => {
    const diff = Math.max(0, Date.now() - timestamp);
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins || 1}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (commentText.trim()) {
      onAddComment(post.id, commentText.trim());
      setCommentText('');
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}/r/${post.subreddit}/comments/${post.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  // 마크다운 서식 툴바 도우미
  const insertFormatting = (prefix: string, suffix: string = '') => {
    setCommentText((prev) => `${prev}${prefix}${suffix}`);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex justify-center py-0 sm:py-8 px-0 sm:px-4">
      {/* 바깥 클릭 닫기 영역 */}
      <div className="fixed inset-0 -z-10" onClick={onClose} />

      {/* 모달 컨테이너 (최대 폭 1280px) */}
      <div className={`relative w-full max-w-6xl min-h-screen sm:min-h-0 sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-colors ${
        isDark ? 'bg-[#0E1113] text-gray-200' : 'bg-[#F6F7F8] text-gray-900'
      }`}>
        {/* 상단 네비게이션 헤더 바 */}
        <div className={`sticky top-0 z-20 h-12 px-4 border-b flex items-center justify-between backdrop-blur-md ${
          isDark ? 'bg-[#0E1113]/90 border-[#22272B]' : 'bg-white/90 border-gray-200'
        }`}>
          {/* 뒤로가기 & 서브레딧 태그 */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-full hover:bg-black/10 cursor-pointer flex items-center gap-1 text-xs font-bold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <span className="opacity-30">|</span>
            <button
              type="button"
              onClick={() => { onSelectSubreddit(post.subreddit); onClose(); }}
              className="font-bold text-xs hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span className="text-[#FF4500]">r/</span>
              <span>{post.subreddit}</span>
            </button>
          </div>

          {/* 닫기 버튼 */}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-black/10 cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 본문 레이아웃: 메인 컨텐츠(좌측) + 서브레딧 사이드바(우측) */}
        <div className="flex-1 flex flex-col lg:flex-row gap-6 p-4 sm:p-6 overflow-y-auto">
          {/* 1. 포스트 및 댓글 메인 영역 */}
          <main className="flex-1 max-w-4xl space-y-6">
            {/* 포스트 메인 카드 */}
            <article className={`rounded-2xl border p-4 sm:p-6 shadow-sm ${
              isDark ? 'bg-[#181C1F] border-[#22272B]' : 'bg-white border-gray-200'
            }`}>
              {/* 헤더 */}
              <div className="flex items-center gap-2 text-xs mb-3 flex-wrap">
                <button
                  type="button"
                  onClick={() => { onSelectSubreddit(post.subreddit); onClose(); }}
                  className="font-extrabold hover:underline text-[#FF4500] cursor-pointer"
                >
                  r/{post.subreddit}
                </button>
                <span className="opacity-40">•</span>
                <span className="opacity-60 text-[11px]">Posted by</span>
                <button
                  type="button"
                  onClick={() => onOpenUserProfile(post.author)}
                  className="hover:underline font-medium cursor-pointer"
                >
                  u/{post.author}
                </button>
                <span className="opacity-40">•</span>
                <span className="opacity-60 text-[11px]">{getRelativeTime(post.createdAt)}</span>

                {post.flair && (
                  <span
                    className="px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm ml-1"
                    style={{
                      backgroundColor: post.flair.bgColor || '#FF4500',
                      color: post.flair.textColor || '#FFFFFF',
                    }}
                  >
                    {post.flair.text}
                  </span>
                )}
              </div>

              {/* 제목 */}
              <h1 className="font-extrabold text-lg sm:text-2xl leading-tight mb-4">
                {post.title}
              </h1>

              {/* 고화질 미디어 */}
              {post.media?.url && (
                <div className="rounded-xl overflow-hidden mb-4 bg-black/20 flex items-center justify-center border border-inherit/10">
                  <img
                    src={post.media.url}
                    alt={post.title}
                    className="w-full h-auto max-h-[600px] object-contain"
                  />
                </div>
              )}

              {/* 본문 전체 내용 */}
              {post.body && (
                <div className="text-sm sm:text-base leading-relaxed opacity-90 whitespace-pre-line mb-6 font-sans">
                  {post.body}
                </div>
              )}

              {/* 액션 바 */}
              <div className="flex items-center gap-2 sm:gap-3 pt-3 border-t border-inherit/10 text-xs font-semibold">
                {/* 보팅 위젯 */}
                <div className={`flex items-center rounded-full px-2 py-0.5 border ${
                  isDark ? 'bg-[#22272B] border-[#2A3238]' : 'bg-gray-100 border-gray-200'
                }`}>
                  <button
                    type="button"
                    onClick={() => onVotePost(post.id, 'up')}
                    className={`p-1 rounded-full cursor-pointer transition-colors ${
                      post.userVote === 'up' ? 'text-[#FF4500]' : 'opacity-70 hover:opacity-100 hover:text-[#FF4500]'
                    }`}
                  >
                    <ArrowBigUp className="w-5 h-5 fill-current" />
                  </button>
                  <span className={`px-2 text-xs font-bold ${
                    post.userVote === 'up' ? 'text-[#FF4500]' : post.userVote === 'down' ? 'text-[#7193FF]' : ''
                  }`}>
                    {post.score}
                  </span>
                  <button
                    type="button"
                    onClick={() => onVotePost(post.id, 'down')}
                    className={`p-1 rounded-full cursor-pointer transition-colors ${
                      post.userVote === 'down' ? 'text-[#7193FF]' : 'opacity-70 hover:opacity-100 hover:text-[#7193FF]'
                    }`}
                  >
                    <ArrowBigDown className="w-5 h-5 fill-current" />
                  </button>
                </div>

                {/* 댓글 수 */}
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-inherit/10">
                  <MessageSquare className="w-4 h-4 opacity-70" />
                  <span>{post.commentCount} Comments</span>
                </div>

                {/* 공유 */}
                <button
                  type="button"
                  onClick={handleShare}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-inherit/10 cursor-pointer hover:bg-black/5"
                >
                  {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4 opacity-70" />}
                  <span>{isCopied ? 'Link Copied!' : 'Share'}</span>
                </button>

                {/* 저장 */}
                <button
                  type="button"
                  onClick={() => onToggleSave(post.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-inherit/10 cursor-pointer hover:bg-black/5 ${
                    post.isSaved ? 'text-[#FF4500]' : ''
                  }`}
                >
                  <Bookmark className={`w-4 h-4 ${post.isSaved ? 'fill-current' : 'opacity-70'}`} />
                  <span>{post.isSaved ? 'Saved' : 'Save'}</span>
                </button>
              </div>
            </article>

            {/* 2. 구글 애드센스 (Google AdSense) 인피드 반응형 광고 */}
            <div className={`rounded-2xl border p-3 shadow-sm ${
              isDark ? 'bg-[#181C1F] border-[#22272B]' : 'bg-white border-gray-200'
            }`}>
              <div className="flex items-center justify-between text-[10px] font-bold text-[#FF4500] uppercase tracking-wider mb-2">
                <span>Discussion Sponsor</span>
                <span className="opacity-40">Ad</span>
              </div>
              <div className="min-h-[120px] rounded-xl overflow-hidden bg-black/5 flex items-center justify-center">
                <AdSenseBanner
                  format="horizontal"
                  responsive={true}
                  className="w-full flex justify-center"
                />
              </div>
            </div>

            {/* 3. 댓글 작성기 (Rich Markdown Editor) */}
            <div className={`rounded-2xl border p-4 shadow-sm ${
              isDark ? 'bg-[#181C1F] border-[#22272B]' : 'bg-white border-gray-200'
            }`}>
              <div className="text-xs font-semibold mb-2 opacity-80">
                Comment as <span className="font-bold text-[#FF4500]">u/SNSHeroPlayer</span>
              </div>

              <form onSubmit={handleCommentSubmit} className="space-y-3">
                <div className={`rounded-xl border overflow-hidden ${
                  isDark ? 'bg-[#0E1113] border-[#2E363E]' : 'bg-gray-50 border-gray-300'
                }`}>
                  <textarea
                    rows={4}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="What are your thoughts?"
                    className="w-full p-3 bg-transparent text-xs sm:text-sm outline-none resize-none font-sans"
                  />

                  {/* 마크다운 툴바 */}
                  <div className={`flex items-center justify-between px-3 py-2 border-t text-xs ${
                    isDark ? 'bg-[#181C1F] border-[#2E363E]' : 'bg-gray-100 border-gray-200'
                  }`}>
                    <div className="flex items-center gap-1 opacity-70">
                      <button type="button" onClick={() => insertFormatting('**', '**')} className="p-1 hover:opacity-100 cursor-pointer" title="Bold"><Bold className="w-3.5 h-3.5" /></button>
                      <button type="button" onClick={() => insertFormatting('*', '*')} className="p-1 hover:opacity-100 cursor-pointer" title="Italic"><Italic className="w-3.5 h-3.5" /></button>
                      <button type="button" onClick={() => insertFormatting('[Link](', ')')} className="p-1 hover:opacity-100 cursor-pointer" title="Link"><LinkIcon className="w-3.5 h-3.5" /></button>
                      <button type="button" onClick={() => insertFormatting('`', '`')} className="p-1 hover:opacity-100 cursor-pointer" title="Code"><Code className="w-3.5 h-3.5" /></button>
                      <button type="button" onClick={() => insertFormatting('> ')} className="p-1 hover:opacity-100 cursor-pointer" title="Quote"><Quote className="w-3.5 h-3.5" /></button>
                      <button type="button" onClick={() => insertFormatting('- ')} className="p-1 hover:opacity-100 cursor-pointer" title="Bullet"><List className="w-3.5 h-3.5" /></button>
                    </div>

                    <button
                      type="submit"
                      disabled={!commentText.trim()}
                      className="px-4 py-1.5 rounded-full bg-[#FF4500] disabled:opacity-40 text-white font-bold text-xs cursor-pointer hover:bg-[#FF5414] transition-all"
                    >
                      Comment
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {/* 4. 중첩 댓글 트리 리스트 */}
            <div className={`rounded-2xl border p-4 sm:p-6 shadow-sm ${
              isDark ? 'bg-[#181C1F] border-[#22272B]' : 'bg-white border-gray-200'
            }`}>
              <div className="flex items-center justify-between pb-4 border-b border-inherit/10 mb-4">
                <span className="font-extrabold text-sm sm:text-base">
                  All Comments ({comments.length})
                </span>
                <span className="text-xs opacity-60">Sorted by: <span className="font-bold">Top</span></span>
              </div>

              {comments.length > 0 ? (
                <RedditCommentTree
                  comments={comments}
                  isDark={isDark}
                  onVoteComment={onVoteComment}
                  onAddReply={onAddReply}
                  onOpenUserProfile={onOpenUserProfile}
                />
              ) : (
                <div className="py-12 text-center opacity-50 text-xs">
                  No comments yet. Be the first to start the discussion!
                </div>
              )}
            </div>
          </main>

          {/* 2. 우측 서브레딧 사이드바 (PC) */}
          <div className="hidden lg:block">
            <RedditSidebarRight
              subredditData={subredditData}
              userState={userState}
              onSelectSubreddit={onSelectSubreddit}
              onToggleJoin={onToggleJoin}
              onOpenSubmitModal={onOpenSubmitModal}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
