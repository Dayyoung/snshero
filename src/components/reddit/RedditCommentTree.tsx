/**
 * RedditCommentTree.tsx
 * 오리지널 레딧 재귀형 중첩 댓글 트리 컴포넌트 (한국어 기본 지원)
 */

import React, { useState, useEffect } from 'react';
import { 
  ArrowBigUp, 
  ArrowBigDown, 
  User, 
  ChevronDown, 
  ChevronUp, 
  CornerDownRight,
  Globe
} from 'lucide-react';
import { RedditComment } from '../../lib/reddit/redditTypes';
import { translateTextWithGoogle, isNeedsTranslation } from '../../lib/reddit/redditTranslationService';

interface RedditCommentTreeProps {
  comments: RedditComment[];
  isDark: boolean;
  isKo?: boolean;
  onVoteComment: (commentId: string, direction: 'up' | 'down') => void;
  onAddReply: (parentId: string, text: string) => void;
  onOpenUserProfile: (username: string) => void;
  depth?: number;
}

export const RedditCommentTree: React.FC<RedditCommentTreeProps> = ({
  comments,
  isDark,
  isKo = true,
  onVoteComment,
  onAddReply,
  onOpenUserProfile,
  depth = 0,
}) => {
  return (
    <div className={`space-y-3 w-full max-w-full min-w-0 ${depth > 0 ? 'ml-1.5 sm:ml-4 pl-1.5 sm:pl-3 border-l-2' : ''} ${
      depth > 0 
        ? isDark ? 'border-[#2E363E] hover:border-gray-500' : 'border-gray-200 hover:border-gray-400' 
        : ''
    } transition-colors`}>
      {comments.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          isDark={isDark}
          isKo={isKo}
          onVoteComment={onVoteComment}
          onAddReply={onAddReply}
          onOpenUserProfile={onOpenUserProfile}
          depth={depth}
        />
      ))}
    </div>
  );
};

interface CommentItemProps {
  comment: RedditComment;
  isDark: boolean;
  isKo: boolean;
  onVoteComment: (commentId: string, direction: 'up' | 'down') => void;
  onAddReply: (parentId: string, text: string) => void;
  onOpenUserProfile: (username: string) => void;
  depth: number;
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  isDark,
  isKo,
  onVoteComment,
  onAddReply,
  onOpenUserProfile,
  depth,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [showOriginal, setShowOriginal] = useState(false);
  const [localTranslated, setLocalTranslated] = useState<string | null>(comment.translatedBody || null);

  const targetLang = isKo ? 'ko' : 'en';

  // 댓글 본문 자동 번역 (필요 시 구글 번역 호출)
  useEffect(() => {
    if (comment.translatedBody) {
      setLocalTranslated(comment.translatedBody);
      return;
    }
    if (isNeedsTranslation(comment.body, targetLang)) {
      let isMounted = true;
      translateTextWithGoogle(comment.body, targetLang).then((res) => {
        if (isMounted && res && res !== comment.body) {
          setLocalTranslated(res);
        }
      });
      return () => { isMounted = false; };
    }
  }, [comment.id, comment.body, comment.translatedBody, targetLang]);

  const hasTranslation = Boolean(localTranslated && localTranslated !== (comment.originalBody || comment.body));
  const displayBody = (hasTranslation && !showOriginal) ? localTranslated! : comment.body;

  const getRelativeTime = (timestamp: number) => {
    const diff = Math.max(0, Date.now() - timestamp);
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return isKo ? `${mins || 1}분 전` : `${mins || 1}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return isKo ? `${hours}시간 전` : `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return isKo ? `${days}일 전` : `${days}d ago`;
  };

  const handleReplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (replyText.trim()) {
      onAddReply(comment.id, replyText.trim());
      setReplyText('');
      setIsReplying(false);
    }
  };

  if (isCollapsed) {
    return (
      <div className="text-xs opacity-50 py-1 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setIsCollapsed(false)}
          className="flex items-center gap-1.5 font-bold hover:underline cursor-pointer"
        >
          <ChevronDown className="w-3.5 h-3.5" />
          <span>[+] {comment.author}</span>
          <span className="text-[10px] font-normal">
            ({comment.score}점, {isKo ? `대댓글 ${comment.replies?.length || 0}개 접힘` : `${comment.replies?.length || 0} replies hidden`})
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className="relative group text-xs font-sans w-full max-w-full overflow-hidden break-words">
      {/* 1. 작성자 헤더 */}
      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
        <div
          onClick={() => onOpenUserProfile(comment.author)}
          className="w-5 h-5 rounded-full overflow-hidden bg-gradient-to-tr from-sky-400 to-indigo-500 flex-shrink-0 cursor-pointer flex items-center justify-center text-[10px] text-white font-bold"
        >
          {comment.authorAvatar ? (
            <img src={comment.authorAvatar} alt="" className="w-full h-full object-cover" />
          ) : (
            <User className="w-3 h-3" />
          )}
        </div>

        <button
          type="button"
          onClick={() => onOpenUserProfile(comment.author)}
          className="font-bold hover:underline cursor-pointer flex items-center gap-1"
        >
          <span>{comment.author}</span>
          {comment.isAuthorOp && (
            <span className="px-1 py-0.2 rounded bg-sky-500/20 text-sky-400 text-[9px] font-extrabold uppercase">
              작성자
            </span>
          )}
        </button>

        <span className="opacity-40">•</span>
        <span className="opacity-60 text-[11px]">{getRelativeTime(comment.createdAt)}</span>

        {/* 댓글 번역 상태 및 원문/번역 토글 */}
        {hasTranslation && (
          <button
            type="button"
            onClick={() => setShowOriginal(!showOriginal)}
            className="inline-flex items-center gap-1 text-[10px] text-blue-500 font-semibold hover:underline cursor-pointer ml-1"
            title={showOriginal ? (isKo ? '번역문 보기' : 'Show translation') : (isKo ? '원문 보기' : 'Show original')}
          >
            <Globe className="w-2.5 h-2.5" />
            <span>{showOriginal ? (isKo ? '번역 보기' : 'Show translation') : (isKo ? '원문 보기' : 'Show original')}</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setIsCollapsed(true)}
          className="p-0.5 rounded opacity-40 hover:opacity-100 cursor-pointer"
          title={isKo ? "스레드 접기" : "Collapse thread"}
        >
          <ChevronUp className="w-3 h-3" />
        </button>
      </div>

      {/* 2. 본문 (설정된 언어로 번역된 텍스트 자동 반영) */}
      <div className="pl-7 text-xs sm:text-sm leading-relaxed whitespace-pre-line opacity-90 mb-2 font-sans break-words">
        {displayBody}
      </div>

      {/* 3. 보팅 & 답글 */}
      <div className="pl-7 flex items-center gap-3 text-xs font-semibold opacity-80">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onVoteComment(comment.id, 'up')}
            className={`p-0.5 rounded cursor-pointer ${
              comment.userVote === 'up' ? 'text-[#FF4500]' : 'hover:text-[#FF4500]'
            }`}
          >
            <ArrowBigUp className="w-4 h-4 fill-current" />
          </button>
          <span className={`text-[11px] font-bold ${
            comment.userVote === 'up' ? 'text-[#FF4500]' : comment.userVote === 'down' ? 'text-[#7193FF]' : ''
          }`}>
            {comment.score}
          </span>
          <button
            type="button"
            onClick={() => onVoteComment(comment.id, 'down')}
            className={`p-0.5 rounded cursor-pointer ${
              comment.userVote === 'down' ? 'text-[#7193FF]' : 'hover:text-[#7193FF]'
            }`}
          >
            <ArrowBigDown className="w-4 h-4 fill-current" />
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsReplying(!isReplying)}
          className="flex items-center gap-1 hover:text-[#FF4500] cursor-pointer"
        >
          <CornerDownRight className="w-3.5 h-3.5" />
          <span>{isKo ? '답글 달기' : 'Reply'}</span>
        </button>
      </div>

      {/* 4. 인라인 답글 입력 폼 */}
      {isReplying && (
        <form onSubmit={handleReplySubmit} className="mt-2.5 pl-3 sm:pl-7 w-full max-w-full">
          <div className={`p-2.5 rounded-xl border ${
            isDark ? 'bg-[#0E1113] border-[#2E363E]' : 'bg-gray-50 border-gray-300'
          }`}>
            <textarea
              rows={2}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder={isKo ? `u/${comment.author} 님에게 답글 작성...` : `Reply to u/${comment.author}...`}
              className="w-full bg-transparent text-xs outline-none resize-none font-sans"
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-1">
              <button
                type="button"
                onClick={() => setIsReplying(false)}
                className="px-3 py-1 rounded-full text-[11px] font-semibold opacity-70 hover:opacity-100 cursor-pointer"
              >
                {isKo ? '취소' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="px-3.5 py-1 rounded-full bg-[#FF4500] text-white text-[11px] font-bold cursor-pointer hover:bg-[#FF5414]"
              >
                {isKo ? '답글 등록' : 'Reply'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* 5. 하위 대댓글 트리 */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-3">
          <RedditCommentTree
            comments={comment.replies}
            isDark={isDark}
            isKo={isKo}
            onVoteComment={onVoteComment}
            onAddReply={onAddReply}
            onOpenUserProfile={onOpenUserProfile}
            depth={depth + 1}
          />
        </div>
      )}
    </div>
  );
};
