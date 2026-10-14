/**
 * RedditPostDetailModal.tsx
 * 오리지널 레딧 포스트 상세 뷰 및 모달 (한국어 기본 지원)
 */

import React, { useState, useEffect } from 'react';
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
  ArrowLeft,
  ExternalLink,
  Globe,
  Languages,
  RefreshCw
} from 'lucide-react';
import { RedditPost, RedditComment, RedditSubreddit, RedditUserDataState, getRedditExternalUrl, cleanRedditUrl } from '../../lib/reddit/redditTypes';
import { RedditCommentTree } from './RedditCommentTree';
import { RedditSidebarRight } from './RedditSidebarRight';
import { AdSenseBanner } from '../AdSenseBanner';
import { translateTextWithGoogle, isNeedsTranslation, translateCommentTree } from '../../lib/reddit/redditTranslationService';
import { RedditVideoPlayer } from './RedditVideoPlayer';
import { RedditGoogleSheetCommentService } from '../../lib/reddit/redditGoogleSheetCommentService';
import { RedditGalleryViewer } from './RedditGalleryViewer';
import { deduplicateImageUrls } from '../../lib/reddit/redditLiveFeedService';
import { WildCardEncounterWidget } from '../media/WildCardEncounterWidget';

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
  onGoToGame?: () => void;
}

// 마크다운 본문 (스크린샷 이미지, 링크, 제목, 볼드) 서식 지원 렌더러
function renderInlineMarkdown(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let keyIndex = 0;

  while (remaining.length > 0) {
    const linkMatch = remaining.match(/\[(.*?)\]\((https?:\/\/[^\s)]+)\)/);
    const boldMatch = remaining.match(/\*\*(.*?)\*\*/);
    const urlMatch = remaining.match(/(https?:\/\/[^\s)]+)/);

    const candidates = [
      linkMatch ? { type: 'link', index: linkMatch.index!, match: linkMatch } : null,
      boldMatch ? { type: 'bold', index: boldMatch.index!, match: boldMatch } : null,
      urlMatch ? { type: 'url', index: urlMatch.index!, match: urlMatch } : null,
    ].filter(Boolean) as { type: string; index: number; match: RegExpMatchArray }[];

    if (candidates.length === 0) {
      parts.push(remaining);
      break;
    }

    candidates.sort((a, b) => a.index - b.index);
    const first = candidates[0];

    if (first.index > 0) {
      parts.push(remaining.substring(0, first.index));
    }

    if (first.type === 'link') {
      const linkText = first.match[1];
      const linkUrl = first.match[2];
      parts.push(
        <a key={keyIndex++} href={linkUrl} target="_blank" rel="noopener noreferrer" className="text-sky-500 hover:underline font-semibold">
          {linkText}
        </a>
      );
      remaining = remaining.substring(first.index + first.match[0].length);
    } else if (first.type === 'bold') {
      const boldText = first.match[1];
      parts.push(<strong key={keyIndex++} className="font-bold">{boldText}</strong>);
      remaining = remaining.substring(first.index + first.match[0].length);
    } else if (first.type === 'url') {
      const rawUrl = first.match[1];
      parts.push(
        <a key={keyIndex++} href={rawUrl} target="_blank" rel="noopener noreferrer" className="text-sky-500 hover:underline font-semibold break-all">
          {rawUrl}
        </a>
      );
      remaining = remaining.substring(first.index + first.match[0].length);
    }
  }

  return parts;
}

function renderMarkdownBody(content: string): React.ReactNode {
  const lines = content.split('\n');
  return (
    <div className="space-y-2.5 text-sm sm:text-base leading-relaxed opacity-95 font-sans break-words">
      {lines.map((line, idx) => {
        const trimmed = line.trim();

        // 1. 이미지: ![alt](url)
        const imgMatch = trimmed.match(/^!\[(.*?)\]\((.*?)\)$/);
        if (imgMatch) {
          const alt = imgMatch[1];
          const src = imgMatch[2];
          return (
            <figure key={idx} className="my-3 rounded-xl overflow-hidden border border-inherit/15 bg-black/5 dark:bg-white/5 p-1">
              <img src={src} alt={alt} className="w-full h-auto max-h-[520px] object-contain rounded-lg" loading="lazy" />
              {alt && <figcaption className="text-xs text-center py-1.5 opacity-70 italic font-mono">{alt}</figcaption>}
            </figure>
          );
        }

        // 2. 제목
        if (trimmed.startsWith('### ')) {
          return <h3 key={idx} className="text-base sm:text-lg font-bold mt-4 mb-1 text-inherit">{trimmed.replace('### ', '')}</h3>;
        }
        if (trimmed.startsWith('## ')) {
          return <h2 key={idx} className="text-lg sm:text-xl font-extrabold mt-5 mb-2 text-inherit border-b border-inherit/10 pb-1">{trimmed.replace('## ', '')}</h2>;
        }
        if (trimmed.startsWith('# ')) {
          return <h1 key={idx} className="text-xl sm:text-2xl font-black mt-6 mb-2 text-inherit">{trimmed.replace('# ', '')}</h1>;
        }

        // 3. 수평선
        if (trimmed === '---') {
          return <hr key={idx} className="my-3 border-inherit/15" />;
        }

        // 4. 빈 줄
        if (!trimmed) {
          return <div key={idx} className="h-1" />;
        }

        // 5. 일반 문장
        return (
          <p key={idx} className="leading-relaxed">
            {renderInlineMarkdown(line)}
          </p>
        );
      })}
    </div>
  );
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
  onGoToGame,
}) => {
  const isDark = userState.theme === 'dark';
  const isKo = userState.language !== 'en';
  const [commentText, setCommentText] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [commentSort, setCommentSort] = useState<'top' | 'new' | 'old'>('top');
  const [extraComments, setExtraComments] = useState<RedditComment[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreComments, setHasMoreComments] = useState(true);
  const [showOriginal, setShowOriginal] = useState(false);
  const [translatedTitle, setTranslatedTitle] = useState<string | null>(null);
  const [translatedBody, setTranslatedBody] = useState<string | null>(null);

  // 실제 reddit.com 원본 댓글 상태
  const [realComments, setRealComments] = useState<RedditComment[]>([]);
  const [isLoadingRealComments, setIsLoadingRealComments] = useState(false);
  const [isRealSynced, setIsRealSynced] = useState(false);

  const targetLang = isKo ? 'ko' : 'en';
  const needsTrans = isNeedsTranslation(post.title, targetLang) || (post.body ? isNeedsTranslation(post.body, targetLang) : false);

  const rawGalleryImages = post.media?.galleryUrls && post.media.galleryUrls.length > 0
    ? post.media.galleryUrls
    : (post.media?.url ? [post.media.url] : []);
  const galleryImages = deduplicateImageUrls(rawGalleryImages);
  const isGalleryPost = (post.media?.type === 'gallery' || Boolean(post.media?.galleryUrls && post.media.galleryUrls.length > 1)) && galleryImages.length > 1;

  // 실제 구글 시트 댓글 수집 및 포스트 트리 구성
  const fetchActualComments = React.useCallback(async (force: boolean = false) => {
    if (!post) return;
    setIsLoadingRealComments(true);
    try {
      const cleanId = post.id.replace(/_dup_.*$/, '').replace(/_repeat_.*$/, '');
      const allComments = await RedditGoogleSheetCommentService.fetchAllSheetComments(force);
      const postComments = RedditGoogleSheetCommentService.getCommentsTreeForPost(cleanId, allComments);
      setRealComments(postComments);
      setIsRealSynced(true);
    } catch (err) {
      console.warn('[RedditModal] Failed to fetch sheet comments', err);
    } finally {
      setIsLoadingRealComments(false);
    }
  }, [post]);

  useEffect(() => {
    fetchActualComments(false);
  }, [fetchActualComments]);

  useEffect(() => {
    let isMounted = true;
    if (needsTrans) {
      if (isNeedsTranslation(post.title, targetLang)) {
        translateTextWithGoogle(post.title, targetLang).then((res) => {
          if (isMounted) setTranslatedTitle(res);
        });
      }
      if (post.body && isNeedsTranslation(post.body, targetLang)) {
        translateTextWithGoogle(post.body, targetLang).then((res) => {
          if (isMounted) setTranslatedBody(res);
        });
      }
    }
    return () => { isMounted = false; };
  }, [post.id, post.title, post.body, targetLang, needsTrans]);

  const displayTitle = (!showOriginal && translatedTitle) ? translatedTitle : post.title;
  const displayBody = (!showOriginal && translatedBody) ? translatedBody : post.body;
  const isCurrentlyTranslated = !showOriginal && (Boolean(translatedTitle) || Boolean(translatedBody));

  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const loadMoreSentinelRef = React.useRef<HTMLDivElement>(null);

  // ESC 키 누를 시 모달 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const getRelativeTime = (timestamp: number) => {
    const diff = Math.max(0, Date.now() - timestamp);
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return isKo ? `${mins || 1}분 전` : `${mins || 1}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return isKo ? `${hours}시간 전` : `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return isKo ? `${days}일 전` : `${days}d ago`;
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (commentText.trim()) {
      const text = commentText.trim();
      const author = userState.username || 'SNSHeroPlayer';
      const avatar = userState.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(author)}`;
      const cleanId = post.id.replace(/_dup_.*$/, '').replace(/_repeat_.*$/, '');
      
      onAddComment(cleanId, text);
      const newComment = await RedditGoogleSheetCommentService.submitCommentToSheet({
        postId: cleanId,
        text,
        author,
        avatarUrl: avatar,
        parentId: null,
      });

      setRealComments((prev) => [newComment, ...prev]);
      setCommentText('');
    }
  };

  // 대댓글 등록 핸들러 (구글 시트 영구 등록)
  const handleNestedReply = React.useCallback(async (parentId: string, text: string) => {
    onAddReply(parentId, text);
    const author = userState.username || 'SNSHeroPlayer';
    const avatar = userState.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(author)}`;
    const cleanId = post.id.replace(/_dup_.*$/, '').replace(/_repeat_.*$/, '');
    const newReply = await RedditGoogleSheetCommentService.submitCommentToSheet({
      postId: cleanId,
      text,
      author,
      avatarUrl: avatar,
      parentId,
    });

    setRealComments((prev) => {
      const clone = JSON.parse(JSON.stringify(prev));
      const attach = (list: RedditComment[]): boolean => {
        for (const c of list) {
          if (c.id === parentId) {
            c.replies = c.replies || [];
            c.replies.unshift(newReply);
            return true;
          }
          if (c.replies && c.replies.length > 0) {
            if (attach(c.replies)) return true;
          }
        }
        return false;
      };
      attach(clone);
      return clone;
    });
  }, [post.id, onAddReply, userState.username, userState.avatarUrl]);

  // 구글 시트 댓글 실시간 새로고침 핸들러
  const handleLoadMoreComments = React.useCallback(() => {
    if (isLoadingMore) return;
    setIsLoadingMore(true);
    fetchActualComments(true).finally(() => {
      setIsLoadingMore(false);
      setHasMoreComments(false);
    });
  }, [isLoadingMore, fetchActualComments]);

  // 글을 끝까지 읽었을 때(바닥 센티넬 도달 시) 자동으로 실시간 더보기 트리거
  React.useEffect(() => {
    if (!loadMoreSentinelRef.current || !hasMoreComments) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore && hasMoreComments) {
          handleLoadMoreComments();
        }
      },
      { rootMargin: '400px' }
    );
    observer.observe(loadMoreSentinelRef.current);
    return () => observer.disconnect();
  }, [isLoadingMore, hasMoreComments, handleLoadMoreComments]);

  // 스크롤 이벤트 바닥 감지 (모바일 및 데스크톱 이중 감지)
  const handleContainerScroll = React.useCallback(() => {
    if (!scrollContainerRef.current || isLoadingMore || !hasMoreComments) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    if (scrollHeight - scrollTop - clientHeight < 400) {
      handleLoadMoreComments();
    }
  }, [isLoadingMore, hasMoreComments, handleLoadMoreComments]);

  // 전달받은 기본 댓글들도 현재 설정 언어로 번역
  const [translatedPropComments, setTranslatedPropComments] = useState<RedditComment[]>(comments);
  useEffect(() => {
    let isMounted = true;
    if (comments && comments.length > 0) {
      translateCommentTree(comments, targetLang).then((res) => {
        if (isMounted) setTranslatedPropComments(res);
      });
    } else {
      setTranslatedPropComments([]);
    }
    return () => { isMounted = false; };
  }, [comments, targetLang]);

  // 전체 댓글 병합 및 정렬 (실제 원본 댓글 우선 사용)
  const displayedComments = React.useMemo(() => {
    const baseList = realComments.length > 0 ? realComments : translatedPropComments;
    const list = [...baseList, ...extraComments];
    switch (commentSort) {
      case 'new':
        return list.sort((a, b) => b.createdAt - a.createdAt);
      case 'old':
        return list.sort((a, b) => a.createdAt - b.createdAt);
      case 'top':
      default:
        return list.sort((a, b) => b.score - a.score);
    }
  }, [realComments, translatedPropComments, extraComments, commentSort]);

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
    <div 
      ref={scrollContainerRef}
      onScroll={handleContainerScroll}
      className="fixed inset-0 z-50 overflow-y-auto overflow-x-hidden w-full max-w-full bg-black/80 backdrop-blur-sm flex justify-center p-0 sm:p-4 md:py-8"
    >
      <div className="fixed inset-0 -z-10" onClick={onClose} />

      <div className={`relative w-full max-w-6xl my-auto sm:my-0 rounded-none sm:rounded-2xl shadow-2xl flex flex-col transition-colors min-h-[85vh] pb-16 overflow-x-hidden ${
        isDark ? 'bg-[#0E1113] text-gray-200' : 'bg-[#F6F7F8] text-gray-900'
      }`}>
        {/* 상단 네비게이션 헤더 */}
        <div className={`sticky top-0 z-20 h-12 px-4 border-b flex items-center justify-between backdrop-blur-md w-full max-w-full overflow-hidden ${
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
        <div className="flex-1 flex flex-col lg:flex-row gap-6 p-3 sm:p-6 w-full max-w-full overflow-x-hidden">
          <main className="flex-1 max-w-4xl min-w-0 space-y-5 w-full overflow-x-hidden">
            {/* 포스트 카드 */}
            <article className={`rounded-2xl border p-4 sm:p-6 shadow-sm w-full max-w-full overflow-hidden break-words ${
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

              {/* 번역 상태 표시줄 (원문이 다른 언어일 때 노출) */}
              {needsTrans && (
                <div className="flex items-center gap-2 mb-3 text-xs">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-500 font-semibold border border-blue-500/20">
                    <Globe className="w-3.5 h-3.5" />
                    {isCurrentlyTranslated ? (isKo ? 'Google 번역 적용됨 (한국어)' : 'Google Translated') : (isKo ? '원문 표시 중' : 'Original Text')}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowOriginal(!showOriginal)}
                    className="opacity-75 hover:opacity-100 underline cursor-pointer text-xs"
                  >
                    {showOriginal ? (isKo ? '번역본 보기' : 'Show translation') : (isKo ? '원문 보기' : 'Show original')}
                  </button>
                </div>
              )}

              {/* 제목 */}
              <h1 className="font-extrabold text-lg sm:text-2xl leading-tight mb-4 break-words">
                {displayTitle}
              </h1>

              {/* 고화질 미디어 (동영상 및 이미지, 링크 완벽 지원) */}
              {post.media?.url && (
                <div className="rounded-xl overflow-hidden mb-5 flex items-center justify-center border border-inherit/10">
                  {post.media.type === 'link' ? (
                    <a
                      href={cleanRedditUrl(post.media.url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`w-full p-4 flex items-center justify-between gap-3 text-xs sm:text-sm font-semibold rounded-xl border transition-colors ${
                        isDark ? 'bg-[#0E1113] hover:bg-[#181C1F] border-[#2E363E] text-sky-400' : 'bg-gray-50 hover:bg-gray-100 border-gray-200 text-sky-600'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <ExternalLink className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{cleanRedditUrl(post.media.url)}</span>
                      </div>
                      <span className="text-xs px-3 py-1 rounded-full bg-black/10 flex-shrink-0 opacity-80">
                        {post.media.domain || '외부 링크 열기'}
                      </span>
                    </a>
                  ) : post.media.type === 'video' ? (
                    <div className="w-full">
                      <RedditVideoPlayer
                        src={post.media.url}
                        poster={post.media.previewUrl}
                        title={displayTitle}
                        isDark={isDark}
                        isKo={isKo}
                        autoPlay={true}
                        domain={post.media.domain}
                        externalUrl={
                          post.media.domain === 'v.redd.it' || post.media.domain === 'reddit.com'
                            ? getRedditExternalUrl(post)
                            : (cleanRedditUrl(post.media.url) || getRedditExternalUrl(post))
                        }
                      />
                    </div>
                  ) : isGalleryPost ? (
                    <div className="w-full">
                      <RedditGalleryViewer
                        images={galleryImages}
                        title={displayTitle}
                        isDark={isDark}
                        isKo={isKo}
                        showThumbnailStrip={true}
                        maxHeight="max-h-[650px]"
                      />
                    </div>
                  ) : (
                    <img
                      src={post.media.url}
                      alt={displayTitle}
                      className="w-full h-auto max-h-[600px] object-contain bg-black"
                    />
                  )}
                </div>
              )}

              {/* 본문 전체 내용 (마크다운 스크린샷 이미지, 링크, 제목 지원) */}
              {displayBody && (
                <div className="mb-6">
                  {renderMarkdownBody(displayBody)}
                </div>
              )}

              {/* 본문 직후 고수익 In-Article 구글 애드센스 네이티브 광고 (CTR 극대화) */}
              <div className={`my-4 p-2.5 rounded-xl border overflow-hidden ${
                isDark ? 'bg-[#181C1F]/80 border-[#22272B]' : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center justify-between text-[10px] font-bold text-[#FF4500] uppercase tracking-wider mb-1.5 px-1">
                  <span>{isKo ? '구글 뉴스 추천 스폰서' : 'News In-Article Sponsor'}</span>
                  <span className="opacity-40">Ad</span>
                </div>
                <div className="min-h-[100px] flex items-center justify-center">
                  <AdSenseBanner
                    format="fluid"
                    responsive={true}
                    className="w-full flex justify-center"
                  />
                </div>
              </div>

              {/* 언론사 원문 기사 전문 더보기 (새 창 열기) */}
              {post.sourceUrl && (
                <div className="mb-6">
                  <a
                    href={post.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-xs sm:text-sm font-bold transition-all hover:scale-102 active:scale-98 shadow-sm cursor-pointer ${
                      isDark 
                        ? 'bg-[#22272B] hover:bg-[#2A3136] text-sky-400 border-white/10' 
                        : 'bg-sky-50 hover:bg-sky-100 text-sky-700 border-sky-200'
                    }`}
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>{isKo ? '언론사 원문 기사 전문 더보기 (새 창 열기) ↗' : 'Read Full Original Article on Publisher Website ↗'}</span>
                  </a>
                </div>
              )}

              {/* 액션 바 */}
              <div className="flex items-center gap-2 sm:gap-3 pt-3 border-t border-inherit/10 text-xs font-semibold flex-wrap">
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
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-extrabold text-sm sm:text-base">
                    {isKo ? `전체 댓글 ${post.commentCount.toLocaleString()}개` : `All ${post.commentCount.toLocaleString()} Comments`}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FF4500]/10 text-[#FF4500]">
                    {displayedComments.length}{isKo ? '개 표시 중' : ' shown'}
                  </span>
                  {isRealSynced && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/20 flex items-center gap-1 shadow-sm">
                      <Check className="w-3 h-3 text-emerald-500" />
                      <span>{isKo ? 'Reddit 실제 원본 댓글' : 'Live Reddit Comments'}</span>
                    </span>
                  )}
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-500 border border-blue-500/20 flex items-center gap-1 shadow-sm">
                    <Globe className="w-3 h-3 text-blue-500" />
                    <span>{isKo ? '한국어로 번역됨' : `Translated to ${targetLang}`}</span>
                  </span>
                  {isLoadingRealComments && (
                    <span className="text-[10px] font-bold text-amber-500 animate-pulse flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      <span>{isKo ? '실제 원본 댓글 동기화 중...' : 'Syncing real comments...'}</span>
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => fetchActualComments(true)}
                    className={`p-1 rounded-full cursor-pointer transition-colors opacity-70 hover:opacity-100 ${
                      isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'
                    }`}
                    title={isKo ? '실제 원본 댓글 새로고침' : 'Refresh real comments'}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingRealComments ? 'animate-spin text-[#FF4500]' : ''}`} />
                  </button>
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
                    onAddReply={handleNestedReply}
                    onOpenUserProfile={onOpenUserProfile}
                  />



                  {/* 구글 시트 실시간 동기화 상태 바 & 수동 새로고침 영역 */}
                  <div className="pt-4 pb-2 text-center border-t border-inherit/10 mt-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={handleLoadMoreComments}
                        disabled={isLoadingMore}
                        className="px-4 py-1.5 rounded-full border border-inherit/20 font-bold text-xs hover:bg-[#FF4500] hover:text-white transition-all cursor-pointer shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isLoadingMore ? 'animate-spin' : ''}`} />
                        <span>{isLoadingMore ? (isKo ? '구글 시트 동기화 중...' : 'Syncing Sheet...') : (isKo ? '댓글 실시간 새로고침' : 'Refresh Comments')}</span>
                      </button>
                    </div>
                    <p className="text-[11px] opacity-60 mt-2 font-medium">
                      {isKo 
                        ? `✓ 구글 시트 실시간 연동 (실제 댓글 ${displayedComments.length}개 표시 중 • 새 댓글 작성 시 전 세계 실시간 공유)` 
                        : `✓ Google Sheets Live Sync (${displayedComments.length} comments shown • Shared globally in real-time)`}
                    </p>
                  </div>
                </>
              ) : (
                <div className="py-12 text-center opacity-60 text-xs">
                  <p className="font-bold text-sm mb-1 text-[#FF4500]">
                    {isKo ? '아직 등록된 댓글이 없습니다.' : 'No comments yet.'}
                  </p>
                  <p className="opacity-80">
                    {isKo 
                      ? '첫 번째로 댓글을 작성해보세요! (작성 즉시 구글 시트에 등록되어 다른 사용자들도 볼 수 있습니다)' 
                      : 'Be the first to share your thoughts! (Comments are saved to Google Sheets and shared globally)'}
                  </p>
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

        {/* /r/news 뉴스룸 및 미디어 콘텐츠 탐색 유저용 인카운터 브릿지 위젯 */}
        <WildCardEncounterWidget
          scrollContainerRef={scrollContainerRef}
          currentSubreddit={subredditData.name}
          articleId={post.id}
          language={userState.language || 'ko'}
          onNavigateToCombat={() => {
            if (onGoToGame) {
              onGoToGame();
            } else if (typeof window !== 'undefined') {
              window.location.href = '/play?trial=SH-204';
            }
          }}
        />
      </div>
    </div>
  );
};
