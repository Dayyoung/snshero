/**
 * RedditPostDetailModal.tsx
 * 오리지널 레딧 포스트 상세 뷰 및 모달 (한국어 기본 지원)
 */

import React, { useState } from 'react';
import { 
  X, 
  ArrowBigUp, 
  ArrowBigDown, 
  MessageSquare, 
  Share2, 
  Bookmark, 
  Bold, 
  Italic, 
  Link as LinkIcon, 
  Code, 
  Quote, 
  List, 
  Check, 
  ArrowLeft 
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
  const isKo = userState.language !== 'en';
  const [commentText, setCommentText] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [commentSort, setCommentSort] = useState<'top' | 'new' | 'old'>('top');
  const [extraComments, setExtraComments] = useState<RedditComment[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const getRelativeTime = (timestamp: number) => {
    const diff = Math.max(0, Date.now() - timestamp);
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return isKo ? `${mins || 1}분 전` : `${mins || 1}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return isKo ? `${hours}시간 전` : `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return isKo ? `${days}일 전` : `${days}d ago`;
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (commentText.trim()) {
      onAddComment(post.id, commentText.trim());
      setCommentText('');
    }
  };

  // 더 많은 댓글 불러오기 핸들러
  const handleLoadMoreComments = () => {
    setIsLoadingMore(true);
    setTimeout(() => {
      const now = Date.now();
      const currentCount = comments.length + extraComments.length;
      const additionalComments: RedditComment[] = [
        {
          id: `c_more_${post.id}_${currentCount + 1}`,
          postId: post.id,
          parentId: null,
          author: `GameDevFan_${currentCount + 1}`,
          authorAvatar: `https://images.unsplash.com/photo-${1535713875002 + (currentCount % 10) * 1000}?auto=format&fit=crop&w=64&q=80`,
          authorKarma: 14200 + currentCount * 500,
          createdAt: now - 1000 * 60 * (15 + currentCount * 2),
          score: Math.max(50, Math.floor(380 - currentCount * 12)),
          body: isKo 
            ? `물리 충돌 판정이랑 파티클 상호작용 이펙트가 진짜 예술이네요! 1인 개발 완성작 기다리겠습니다.` 
            : `The physics and particle effects look amazing! Can't wait for the full release.`,
          replies: [
            {
              id: `c_more_${post.id}_${currentCount + 1}_1`,
              postId: post.id,
              parentId: `c_more_${post.id}_${currentCount + 1}`,
              author: post.author,
              authorAvatar: post.authorAvatar,
              authorKarma: 9850,
              createdAt: now - 1000 * 60 * (10 + currentCount * 2),
              score: Math.max(20, Math.floor(210 - currentCount * 8)),
              isAuthorOp: true,
              body: isKo ? `응원 감사합니다! 끝까지 완성도 높여서 보답하겠습니다 ㅎㅎ` : `Thank you for the support!`,
            },
          ],
        },
        {
          id: `c_more_${post.id}_${currentCount + 2}`,
          postId: post.id,
          parentId: null,
          author: `PixelCraftsman_${currentCount + 2}`,
          authorAvatar: `https://images.unsplash.com/photo-${1507003211169 + (currentCount % 10) * 1000}?auto=format&fit=crop&w=64&q=80`,
          authorKarma: 8900 + currentCount * 300,
          createdAt: now - 1000 * 60 * (25 + currentCount * 3),
          score: Math.max(30, Math.floor(290 - currentCount * 10)),
          body: isKo 
            ? `혹시 셰이더 그래프 작성하실 때 성능 프로파일링 팁이 있으신가요? C++ 직접 연동하셨는지 궁금합니다.` 
            : `Any shader profiling tips? Did you use C++ directly?`,
        },
        {
          id: `c_more_${post.id}_${currentCount + 3}`,
          postId: post.id,
          parentId: null,
          author: `LoreSeeker_${currentCount + 3}`,
          authorAvatar: `https://images.unsplash.com/photo-${1494790108377 + (currentCount % 10) * 1000}?auto=format&fit=crop&w=64&q=80`,
          authorKarma: 25400 + currentCount * 400,
          createdAt: now - 1000 * 60 * (35 + currentCount * 4),
          score: Math.max(25, Math.floor(250 - currentCount * 9)),
          body: isKo 
            ? `세계관 설정이 궁금하네요! 마법 원소들 간의 상성 시스템(화염-빙결-번개)도 스토리와 연계되나요?` 
            : `How is the world lore structured? Is the elemental interaction tied to the story?`,
        },
      ];

      setExtraComments((prev) => [...prev, ...additionalComments]);
      setIsLoadingMore(false);
    }, 300);
  };

  // 전체 댓글 병합 및 정렬
  const displayedComments = React.useMemo(() => {
    const list = [...comments, ...extraComments];
    switch (commentSort) {
      case 'new':
        return list.sort((a, b) => b.createdAt - a.createdAt);
      case 'old':
        return list.sort((a, b) => a.createdAt - b.createdAt);
      case 'top':
      default:
        return list.sort((a, b) => b.score - a.score);
    }
  }, [comments, extraComments, commentSort]);

  const handleShare = () => {
    const url = `${window.location.origin}/r/${post.subreddit}/comments/${post.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const insertFormatting = (prefix: string, suffix: string = '') => {
    setCommentText((prev) => `${prev}${prefix}${suffix}`);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex justify-center p-0 sm:p-4 md:py-8">
      <div className="fixed inset-0 -z-10" onClick={onClose} />

      <div className={`relative w-full max-w-6xl my-auto sm:my-0 rounded-none sm:rounded-2xl shadow-2xl flex flex-col transition-colors min-h-[85vh] pb-16 ${
        isDark ? 'bg-[#0E1113] text-gray-200' : 'bg-[#F6F7F8] text-gray-900'
      }`}>
        {/* 상단 네비게이션 헤더 */}
        <div className={`sticky top-0 z-20 h-12 px-4 border-b flex items-center justify-between backdrop-blur-md ${
          isDark ? 'bg-[#0E1113]/95 border-[#22272B]' : 'bg-white/95 border-gray-200'
        }`}>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-full hover:bg-black/10 cursor-pointer flex items-center gap-1 text-xs font-bold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{isKo ? '뒤로' : 'Back'}</span>
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

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-black/10 cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 본문 레이아웃 (자연스러운 전체 스크롤) */}
        <div className="flex-1 flex flex-col lg:flex-row gap-6 p-4 sm:p-6">
          <main className="flex-1 max-w-4xl space-y-5">
            {/* 포스트 카드 */}
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
                <span className="opacity-60 text-[11px]">{isKo ? '게시자:' : 'Posted by'}</span>
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

              {/* 고화질 미디어 (동영상 및 이미지 완벽 지원) */}
              {post.media?.url && (
                <div className="rounded-xl overflow-hidden mb-5 bg-black flex items-center justify-center border border-inherit/10">
                  {post.media.type === 'video' ? (
                    <div className="relative w-full flex items-center justify-center bg-black">
                      <video
                        src={post.media.url}
                        poster={post.media.previewUrl}
                        controls
                        autoPlay
                        playsInline
                        preload="auto"
                        className="w-full max-h-[620px] object-contain rounded-xl shadow-lg"
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
                      className="w-full h-auto max-h-[600px] object-contain"
                    />
                  )}
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

                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-inherit/10">
                  <MessageSquare className="w-4 h-4 opacity-70" />
                  <span>{isKo ? `댓글 ${post.commentCount}개` : `${post.commentCount} Comments`}</span>
                </div>

                <button
                  type="button"
                  onClick={handleShare}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-inherit/10 cursor-pointer hover:bg-black/5"
                >
                  {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4 opacity-70" />}
                  <span>{isCopied ? (isKo ? '복사됨!' : 'Copied!') : (isKo ? '공유' : 'Share')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => onToggleSave(post.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-inherit/10 cursor-pointer hover:bg-black/5 ${
                    post.isSaved ? 'text-[#FF4500]' : ''
                  }`}
                >
                  <Bookmark className={`w-4 h-4 ${post.isSaved ? 'fill-current' : 'opacity-70'}`} />
                  <span>{post.isSaved ? (isKo ? '저장됨' : 'Saved') : (isKo ? '저장' : 'Save')}</span>
                </button>
              </div>
            </article>

            {/* 구글 애드센스 배너 */}
            <div className={`rounded-2xl border p-3 shadow-sm ${
              isDark ? 'bg-[#181C1F] border-[#22272B]' : 'bg-white border-gray-200'
            }`}>
              <div className="flex items-center justify-between text-[10px] font-bold text-[#FF4500] uppercase tracking-wider mb-2">
                <span>{isKo ? '스폰서 토론 광고' : 'Discussion Sponsor'}</span>
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

            {/* 댓글 작성기 */}
            <div className={`rounded-2xl border p-4 sm:p-5 shadow-sm ${
              isDark ? 'bg-[#181C1F] border-[#22272B]' : 'bg-white border-gray-200'
            }`}>
              <div className="text-xs font-semibold mb-2 opacity-80">
                {isKo ? '댓글 작성자:' : 'Comment as'} <span className="font-bold text-[#FF4500]">u/SNSHeroPlayer</span>
              </div>

              <form onSubmit={handleCommentSubmit} className="space-y-3">
                <div className={`rounded-xl border overflow-hidden ${
                  isDark ? 'bg-[#0E1113] border-[#2E363E]' : 'bg-gray-50 border-gray-300'
                }`}>
                  <textarea
                    rows={4}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder={isKo ? "자유롭게 생각을 남겨보세요..." : "What are your thoughts?"}
                    className="w-full p-3 bg-transparent text-xs sm:text-sm outline-none resize-none font-sans"
                  />

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
                      {isKo ? '댓글 등록' : 'Comment'}
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {/* 중첩 댓글 트리 */}
            <div className={`rounded-2xl border p-4 sm:p-6 shadow-sm ${
              isDark ? 'bg-[#181C1F] border-[#22272B]' : 'bg-white border-gray-200'
            }`}>
              <div className="flex items-center justify-between pb-4 border-b border-inherit/10 mb-4 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm sm:text-base">
                    {isKo ? `전체 댓글 ${post.commentCount.toLocaleString()}개` : `All ${post.commentCount.toLocaleString()} Comments`}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FF4500]/10 text-[#FF4500]">
                    {displayedComments.length}{isKo ? '개 표시 중' : ' shown'}
                  </span>
                </div>

                {/* 댓글 정렬 선택 드롭다운 */}
                <div className="flex items-center gap-1.5 text-xs opacity-80">
                  <span>{isKo ? '정렬:' : 'Sort by:'}</span>
                  <select
                    value={commentSort}
                    onChange={(e) => setCommentSort(e.target.value as any)}
                    className={`font-bold cursor-pointer outline-none border border-inherit/20 rounded-lg px-2 py-1 text-xs transition-colors ${
                      isDark ? 'bg-[#22272B] text-gray-200' : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <option value="top">{isKo ? '추천순 (Top)' : 'Top'}</option>
                    <option value="new">{isKo ? '최신순 (New)' : 'New'}</option>
                    <option value="old">{isKo ? '오래된순 (Old)' : 'Old'}</option>
                  </select>
                </div>
              </div>

              {displayedComments.length > 0 ? (
                <>
                  <RedditCommentTree
                    comments={displayedComments}
                    isDark={isDark}
                    isKo={isKo}
                    onVoteComment={onVoteComment}
                    onAddReply={onAddReply}
                    onOpenUserProfile={onOpenUserProfile}
                  />

                  {/* 더 많은 댓글 불러오기 버튼 */}
                  <div className="pt-6 pb-2 text-center border-t border-inherit/10 mt-6">
                    <button
                      type="button"
                      onClick={handleLoadMoreComments}
                      disabled={isLoadingMore}
                      className="px-6 py-2.5 rounded-full border border-inherit/20 font-bold text-xs hover:bg-[#FF4500] hover:text-white transition-all cursor-pointer shadow-sm flex items-center justify-center gap-2 mx-auto disabled:opacity-50"
                    >
                      {isLoadingMore ? (
                        <span>{isKo ? '추가 댓글 불러오는 중...' : 'Loading comments...'}</span>
                      ) : (
                        <span>{isKo ? '댓글 더 불러오기 (+10개 더보기)' : 'Load More Comments (+10 more)'}</span>
                      )}
                    </button>
                    <p className="text-[11px] opacity-50 mt-2">
                      {isKo 
                        ? `총 ${post.commentCount.toLocaleString()}개의 토론 댓글 중 ${displayedComments.length}개 표시 중` 
                        : `Showing ${displayedComments.length} of ${post.commentCount.toLocaleString()} discussion comments`}
                    </p>
                  </div>
                </>
              ) : (
                <div className="py-12 text-center opacity-50 text-xs">
                  {isKo ? '아직 댓글이 없습니다. 첫 번째로 토론을 시작해보세요!' : 'No comments yet. Be the first to start the discussion!'}
                </div>
              )}
            </div>
          </main>

          {/* 우측 사이드바 */}
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
