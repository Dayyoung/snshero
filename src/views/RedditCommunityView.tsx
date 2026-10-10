/**
 * RedditCommunityView.tsx
 * 오리지널 레딧(Reddit) 100% 클론 커뮤니티 통합 뷰 허브 ('SNSHero Community')
 * 무비용 정적 페이지, Zero-DB 로컬스토리지 영구 저장, 구글 애드센스 수익화, GA/GEO/SEO/AEO 탑재 (한국어 기본 지원)
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { RotateCw, Sparkles, AlertCircle, ExternalLink } from 'lucide-react';
import { 
  RedditPost, 
  RedditComment, 
  RedditSubreddit, 
  RedditUser, 
  FeedSortType, 
  TimeFilterType, 
  ViewModeType, 
  SearchResults 
} from '../lib/reddit/redditTypes';
import { RedditApiService } from '../lib/reddit/redditApiService';
import { GoogleNewsSheetService } from '../lib/reddit/googleNewsSheetService';
import { translateRedditPosts, isNeedsTranslation } from '../lib/reddit/redditTranslationService';
import { RedditGoogleSheetCommentService } from '../lib/reddit/redditGoogleSheetCommentService';
import { 
  loadRedditState, 
  votePostOrComment, 
  toggleSavePost, 
  toggleHidePost, 
  toggleJoinSubreddit, 
  addUserPost, 
  addUserComment, 
  updateViewMode, 
  updateTheme,
  updateLanguage
} from '../lib/reddit/redditStorage';
import { RedditSeoManager } from '../lib/reddit/redditSeoManager';

// 컴포넌트 모음
import { RedditHeader } from '../components/reddit/RedditHeader';
import { RedditSidebarLeft } from '../components/reddit/RedditSidebarLeft';
import { RedditSidebarRight } from '../components/reddit/RedditSidebarRight';
import { RedditFeedSortBar } from '../components/reddit/RedditFeedSortBar';
import { RedditPostCard } from '../components/reddit/RedditPostCard';
import { RedditAdCard } from '../components/reddit/RedditAdCard';
import { RedditPostDetailModal } from '../components/reddit/RedditPostDetailModal';
import { RedditSubredditHeader } from '../components/reddit/RedditSubredditHeader';
import { RedditUserProfileView } from '../components/reddit/RedditUserProfileView';
import { RedditSubmitPostModal } from '../components/reddit/RedditSubmitPostModal';
import { RedditSearchModal } from '../components/reddit/RedditSearchModal';
import { RedditFloatingPlayButton } from '../components/reddit/RedditFloatingPlayButton';
import { RedditQuickCreatePostBar } from '../components/reddit/RedditQuickCreatePostBar';
import { RedditCreateCommunityModal } from '../components/reddit/RedditCreateCommunityModal';
import { AdSenseBanner } from '../components/AdSenseBanner';
import { useAdSenseAutoAds } from '../hooks/useAdSenseAutoAds';
import { SEED_SUBREDDITS } from '../data/redditSeedData';

interface RedditCommunityViewProps {
  initialSubreddit?: string;
  initialPostId?: string;
  initialUsername?: string;
  onNavigateHome: () => void;
  onNavigateView?: (view: string) => void;
}

export const RedditCommunityView: React.FC<RedditCommunityViewProps> = ({
  initialSubreddit = 'popular',
  initialPostId,
  initialUsername,
  onNavigateHome,
  onNavigateView,
}) => {
  // 1. 사용자 영구 상태
  const [userState, setUserState] = useState(() => loadRedditState());

  // 2. 피드 및 라우팅 상태
  const [currentSubreddit, setCurrentSubreddit] = useState(initialSubreddit);
  const [currentSort, setCurrentSort] = useState<FeedSortType>('hot');
  const [currentTimeFilter, setCurrentTimeFilter] = useState<TimeFilterType>('today');
  const [viewMode, setViewMode] = useState<ViewModeType>(userState.viewMode || 'card');
  const [activeTab, setActiveTab] = useState<'posts' | 'about' | 'rules'>('posts');

  // 3. 모달 및 서브페이지 상태
  const [activePost, setActivePost] = useState<RedditPost | null>(null);
  const [activeComments, setActiveComments] = useState<RedditComment[]>([]);
  const [activeUser, setActiveUser] = useState<RedditUser | null>(
    initialUsername ? RedditApiService.getUserProfile(initialUsername, userState) : null
  );
  const [searchState, setSearchState] = useState<{ query: string; results: SearchResults } | null>(null);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isCreateCommunityOpen, setIsCreateCommunityOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSyncingLive, setIsSyncingLive] = useState(false);
  const [syncTick, setSyncTick] = useState(0);

  // 피드 무한 스크롤 상태
  const [feedVisibleCount, setFeedVisibleCount] = useState(12);
  const [isLoadingMorePosts, setIsLoadingMorePosts] = useState(false);
  const feedSentinelRef = React.useRef<HTMLDivElement>(null);

  const isDark = userState.theme === 'dark';
  const isKo = userState.language !== 'en'; // 한국어 기본

  // 구글 애드센스 자동광고 SPA 뷰/서브레딧 전환 재스캔 훅
  useAdSenseAutoAds(`reddit_${currentSubreddit}_${activePost ? activePost.id : ''}`);

  // 컨텐츠 라우팅 헬퍼
  const handleNavigateView = useCallback((targetView: string) => {
    if (onNavigateView) {
      onNavigateView(targetView);
    } else if (targetView === 'home') {
      onNavigateHome();
    } else if (typeof window !== 'undefined') {
      window.history.pushState(null, '', '/' + targetView);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  }, [onNavigateView, onNavigateHome]);

  // 화면 진입 시 새로고침 순환 카운터 전진 및 구글 시트 실제 댓글 백그라운드 동기화
  useEffect(() => {
    RedditApiService.advanceRefreshRotation();
    RedditGoogleSheetCommentService.fetchAllSheetComments().catch(() => {});
  }, []);

  // 실시간 Google News 스프레드시트 및 구글 시트 댓글 백그라운드 동기화 함수
  const handleSyncLive = useCallback(async () => {
    setIsSyncingLive(true);
    try {
      const targetLang = userState.language || 'ko';
      await Promise.all([
        RedditApiService.syncGoogleNews(targetLang, true),
        RedditGoogleSheetCommentService.fetchAllSheetComments(true),
      ]);
      setSyncTick((t) => t + 1);
    } catch (e) {
      console.warn('[Reddit] Google news live sync warning', e);
    } finally {
      setIsSyncingLive(false);
    }
  }, [userState.language]);

  // 커뮤니티 화면에서는 배경음악과 효과음 100% 완전 제거
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__snshero_community_mute = true;
      window.dispatchEvent(new CustomEvent('snshero_audio_settings_changed', {
        detail: { isMuted: true }
      }));
    }
    return () => {
      if (typeof window !== 'undefined') {
        (window as any).__snshero_community_mute = false;
        window.dispatchEvent(new CustomEvent('snshero_audio_settings_changed', {
          detail: { isMuted: false }
        }));
      }
    };
  }, []);

  // 마운트 시 실시간 구글 뉴스 자동 동기화
  useEffect(() => {
    handleSyncLive();
  }, [handleSyncLive]);

  // 서브레딧 메타데이터
  const currentSubredditInfo = useMemo(() => {
    return RedditApiService.getSubredditInfo(currentSubreddit, userState);
  }, [currentSubreddit, userState]);

  // 피드 포스트 목록 (100% 오직 구글 뉴스만 표시)
  const posts = useMemo(() => {
    return RedditApiService.getPosts(currentSubreddit, currentSort, currentTimeFilter, userState);
  }, [currentSubreddit, currentSort, currentTimeFilter, userState, syncTick]);

  // SNSHero 관련 글 목록 (구글 뉴스 사이에 광고처럼 중간중간 표시용)
  const promotedPosts = useMemo(() => {
    return RedditApiService.getSNSHeroPromotedPosts(userState);
  }, [userState, syncTick]);

  // 번역 완료/시도 포스트 ID 추적 세트 (중복 호출 및 무한 루프 원천 차단)
  const translatedPostIdsRef = React.useRef<Set<string>>(new Set());

  // 피드 포스트 중 영문 포스트 백그라운드 구글 번역 연동 (중복 방지 & 단 1회 실행 보장)
  useEffect(() => {
    let isCancelled = false;
    const targetLang = userState.language || 'ko';
    
    // 아직 번역 시도하지 않은 포스트 중 번역 필요한 후보 추출
    const candidates = posts.slice(0, 15).filter(
      (p) => !translatedPostIdsRef.current.has(p.id) && isNeedsTranslation(p.title, targetLang)
    );

    if (candidates.length === 0) return;

    // 즉시 Set에 기록하여 재호출 및 무한 루프 원천 차단
    candidates.forEach((p) => translatedPostIdsRef.current.add(p.id));

    translateRedditPosts(candidates, targetLang, candidates.length)
      .then((translated) => {
        if (!isCancelled && translated && translated.length > 0) {
          RedditApiService.updatePostTranslations(translated);
          setSyncTick((t) => t + 1);
        }
      })
      .catch((err) => {
        console.warn('[Reddit] Translation background warning', err);
      });

    return () => {
      isCancelled = true;
    };
  }, [posts, userState.language]);

  // 피드 무한 스크롤 더보기 핸들러 (실시간 추가 피드 수집 연동)
  const handleLoadMorePosts = useCallback(async () => {
    if (isLoadingMorePosts) return;
    setIsLoadingMorePosts(true);

    try {
      // 1. 현재 표시 개수 확장
      setFeedVisibleCount((prev) => prev + 6);

      // 2. 피드 남은 개수가 적거나 끝에 가까워지면 실시간 구글 뉴스 동기화 갱신
      if (feedVisibleCount + 8 >= posts.length) {
        await RedditApiService.syncGoogleNews(userState.language || 'ko');
        setSyncTick((t) => t + 1);
      }
    } catch (e) {
      console.warn('[Reddit] Failed to load more live posts', e);
    } finally {
      setTimeout(() => {
        setIsLoadingMorePosts(false);
      }, 300);
    }
  }, [isLoadingMorePosts, feedVisibleCount, posts.length, currentSubreddit, userState.language]);

  // 피드 하단 도달 시 자동 무한 스크롤 관찰
  useEffect(() => {
    if (!feedSentinelRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMorePosts) {
          handleLoadMorePosts();
        }
      },
      { rootMargin: '500px' }
    );
    observer.observe(feedSentinelRef.current);
    return () => observer.disconnect();
  }, [isLoadingMorePosts, handleLoadMorePosts]);

  // URL 및 초기 props 반영
  useEffect(() => {
    if (initialPostId) {
      const { post, comments } = RedditApiService.getPostDetail(initialPostId, userState);
      if (post) {
        setActivePost(post);
        setActiveComments(comments);
      }
    }
  }, [initialPostId, userState, syncTick]);

  // 브라우저 뒤로가기 / 앞으로가기 (popstate) 실시간 동기화
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      const postMatch = path.match(/^\/r\/[^/]+\/comments\/([^/]+)/);
      const subMatch = path.match(/^\/r\/([^/]+)/);
      const userMatch = path.match(/^\/u(?:ser)?\/([^/]+)/);

      if (postMatch) {
        const { post, comments } = RedditApiService.getPostDetail(postMatch[1], userState);
        if (post) {
          setActivePost(post);
          setActiveComments(comments);
          return;
        }
      }

      if (activePost) {
        setActivePost(null);
      }

      if (userMatch) {
        const user = RedditApiService.getUserProfile(userMatch[1], userState);
        setActiveUser(user);
        return;
      } else {
        setActiveUser(null);
      }

      if (subMatch) {
        setCurrentSubreddit(subMatch[1]);
      } else if (path === '/reddit' || path === '/popular' || path === '/') {
        setCurrentSubreddit('popular');
      } else if (path === '/all') {
        setCurrentSubreddit('all');
      } else if (path === '/home') {
        setCurrentSubreddit('home');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [activePost, userState]);

  // 커뮤니티 신규 생성 핸들러
  const handleCreateCommunity = useCallback((newCommunity: RedditSubreddit) => {
    SEED_SUBREDDITS[newCommunity.name] = newCommunity;
    setUserState((prev) => toggleJoinSubreddit(prev, newCommunity.name));
    setCurrentSubreddit(newCommunity.name);
    setFeedVisibleCount(8);
  }, []);

  // SEO / AEO / GEO / GA 동적 업데이트
  useEffect(() => {
    if (activePost) {
      RedditSeoManager.applyPostDetailSeo(activePost);
    } else if (currentSubredditInfo) {
      RedditSeoManager.applySubredditSeo(currentSubredditInfo, currentSort);
    } else {
      RedditSeoManager.applyHomeSeo();
    }
  }, [activePost, currentSubredditInfo, currentSort]);

  // 피드 및 서브레딧 전환 핸들러
  const handleSelectSubreddit = useCallback((sub: string) => {
    setCurrentSubreddit(sub);
    setActivePost(null);
    setActiveUser(null);
    setSearchState(null);
    setActiveTab('posts');
    setFeedVisibleCount(8);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // 보팅 핸들러
  const handleVotePost = useCallback((postId: string, direction: 'up' | 'down') => {
    setUserState((prev) => {
      const { nextState } = votePostOrComment(prev, postId, direction);
      return nextState;
    });
    RedditSeoManager.trackEvent('reddit_vote', { target: 'post', postId, direction });
  }, []);

  const handleVoteComment = useCallback((commentId: string, direction: 'up' | 'down') => {
    setUserState((prev) => {
      const { nextState } = votePostOrComment(prev, commentId, direction);
      return nextState;
    });
    setActiveComments((prev) => {
      const clone = JSON.parse(JSON.stringify(prev));
      const applyVote = (list: RedditComment[]) => {
        for (const c of list) {
          if (c.id === commentId) {
            c.score += direction === 'up' ? 1 : -1;
            c.userVote = direction;
          }
          if (c.replies) applyVote(c.replies);
        }
      };
      applyVote(clone);
      return clone;
    });
    RedditSeoManager.trackEvent('reddit_vote', { target: 'comment', commentId, direction });
  }, []);

  // 포스트 상세 열기 (구글 시트 댓글 실시간 동기화)
  const handleOpenDetail = useCallback((post: RedditPost) => {
    const cleanId = post.id.replace(/_dup_.*$/, '').replace(/_repeat_.*$/, '');
    const { comments, post: cleanPost } = RedditApiService.getPostDetail(cleanId, userState);
    const targetPost = cleanPost || post;
    setActivePost(targetPost);
    setActiveComments(comments);
    window.history.pushState(null, '', `/r/${targetPost.subreddit}/comments/${cleanId}`);
    // 백그라운드 구글 시트 최신 댓글 갱신
    RedditGoogleSheetCommentService.fetchAllSheetComments().then((sheetComments) => {
      const tree = RedditGoogleSheetCommentService.getCommentsTreeForPost(cleanId, sheetComments);
      if (tree.length > 0) {
        setActiveComments(tree);
      }
    }).catch(() => {});
    RedditSeoManager.trackEvent('reddit_open_post', { postId: cleanId, title: targetPost.title });
  }, [userState]);

  // 포스트 상세 닫기
  const handleCloseDetail = useCallback(() => {
    setActivePost(null);
    const targetUrl = currentSubreddit === 'popular' ? '/reddit' : `/r/${currentSubreddit}`;
    window.history.pushState(null, '', targetUrl);
  }, [currentSubreddit]);

  // 새 글 등록
  const handleSubmitPost = useCallback((newPost: RedditPost) => {
    setUserState((prev) => addUserPost(prev, newPost));
    setIsSubmitModalOpen(false);
    setCurrentSubreddit(newPost.subreddit);
    handleOpenDetail(newPost);
    RedditSeoManager.trackEvent('reddit_submit_post', { subreddit: newPost.subreddit, title: newPost.title });
  }, [handleOpenDetail]);

  // 새 댓글 등록 (구글 시트에 즉시 영구 등록)
  const handleAddComment = useCallback((postId: string, text: string) => {
    const cleanId = postId.replace(/_dup_.*$/, '').replace(/_repeat_.*$/, '');
    const author = userState.username || 'SNSHeroPlayer';
    const avatarUrl = userState.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(author)}`;
    const now = Date.now();

    const newComment: RedditComment = {
      id: `comment_user_${now}`,
      postId: cleanId,
      parentId: null,
      author,
      authorAvatar: avatarUrl,
      authorKarma: 4820,
      createdAt: now,
      score: 1,
      body: text,
      userVote: 'up',
      replies: [],
    };
    setUserState((prev) => addUserComment(prev, newComment));
    setActiveComments((prev) => [newComment, ...prev]);

    // 구글 시트에 비동기 등록
    RedditGoogleSheetCommentService.submitCommentToSheet({
      postId: cleanId,
      text,
      author,
      avatarUrl,
      parentId: null,
    });
    RedditSeoManager.trackEvent('reddit_add_comment', { postId: cleanId });
  }, [userState.username, userState.avatarUrl]);

  // 대댓글 등록 (구글 시트에 즉시 영구 등록)
  const handleAddReply = useCallback((parentId: string, text: string) => {
    if (!activePost) return;
    const cleanId = activePost.id.replace(/_dup_.*$/, '').replace(/_repeat_.*$/, '');
    const author = userState.username || 'SNSHeroPlayer';
    const avatarUrl = userState.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(author)}`;
    const now = Date.now();

    const newReply: RedditComment = {
      id: `comment_user_${now}`,
      postId: cleanId,
      parentId,
      author,
      authorAvatar: avatarUrl,
      authorKarma: 4820,
      createdAt: now,
      score: 1,
      body: text,
      userVote: 'up',
      replies: [],
    };
    setUserState((prev) => addUserComment(prev, newReply));
    setActiveComments((prev) => {
      const clone = JSON.parse(JSON.stringify(prev));
      const attach = (list: RedditComment[]): boolean => {
        for (const c of list) {
          if (c.id === parentId) {
            c.replies = c.replies || [];
            c.replies.unshift(newReply);
            return true;
          }
          if (c.replies && attach(c.replies)) return true;
        }
        return false;
      };
      attach(clone);
      return clone;
    });

    // 구글 시트에 비동기 등록
    RedditGoogleSheetCommentService.submitCommentToSheet({
      postId: cleanId,
      text,
      author,
      avatarUrl,
      parentId,
    });
    RedditSeoManager.trackEvent('reddit_add_reply', { postId: cleanId, parentId });
  }, [activePost, userState.username, userState.avatarUrl]);

  // 검색 실행
  const handleSearch = useCallback((query: string) => {
    const results = RedditApiService.search(query, userState);
    setSearchState({ query, results });
    setActivePost(null);
    setActiveUser(null);
    RedditSeoManager.trackEvent('reddit_search', { query });
  }, [userState]);

  // 유저 프로필 열기
  const handleOpenUserProfile = useCallback((username: string) => {
    const user = RedditApiService.getUserProfile(username, userState);
    setActiveUser(user);
    setActivePost(null);
    setSearchState(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [userState]);

  // 다크모드 / 라이트모드 토글
  const handleToggleTheme = useCallback(() => {
    const nextTheme = isDark ? 'light' : 'dark';
    setUserState((prev) => updateTheme(prev, nextTheme));
  }, [isDark]);

  // 언어 토글 (한국어 / English)
  const handleToggleLanguage = useCallback(() => {
    const nextLang = isKo ? 'en' : 'ko';
    setUserState((prev) => updateLanguage(prev, nextLang));
  }, [isKo]);

  // 뷰 모드 변경
  const handleSelectViewMode = useCallback((mode: ViewModeType) => {
    setViewMode(mode);
    setUserState((prev) => updateViewMode(prev, mode));
  }, []);

  return (
    <div className={`min-h-screen w-full max-w-full overflow-x-clip flex flex-col font-sans transition-colors duration-150 ${
      isDark ? 'bg-[#0E1113] text-[#D7DADC]' : 'bg-[#DAE0E6] text-[#1C1C1C]'
    }`}>
      {/* 1. 상단 글로벌 헤더 */}
      <RedditHeader
        currentSubreddit={currentSubreddit}
        userState={userState}
        onSelectSubreddit={handleSelectSubreddit}
        onOpenSubmitModal={() => setIsSubmitModalOpen(true)}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        onToggleTheme={handleToggleTheme}
        onToggleLanguage={handleToggleLanguage}
        onSearch={handleSearch}
        onGoToGame={onNavigateHome}
        onOpenUserProfile={handleOpenUserProfile}
      />

      {/* 2. 메인 바디 컨테이너: 좌측 사이드바 + 중앙 피드 + 우측 사이드바 */}
      <div className="flex-1 w-full max-w-[1440px] mx-auto flex justify-center">
        {/* 좌측 사이드바 / 드로어 */}
        <RedditSidebarLeft
          isOpen={isSidebarOpen}
          currentSubreddit={currentSubreddit}
          userState={userState}
          onSelectSubreddit={handleSelectSubreddit}
          onClose={() => setIsSidebarOpen(false)}
          onOpenSubmitModal={() => setIsSubmitModalOpen(true)}
          onOpenCreateCommunity={() => setIsCreateCommunityOpen(true)}
          onNavigateView={handleNavigateView}
        />

        {/* 중앙 메인 피드 & 콘텐츠 */}
        <main className="flex-1 w-full max-w-3xl min-w-0 p-2.5 sm:p-5">
          {/* 유저 프로필 페이지 모드 */}
          {activeUser ? (
            <RedditUserProfileView
              user={activeUser}
              posts={posts}
              userState={userState}
              onBack={() => setActiveUser(null)}
              onVote={handleVotePost}
              onOpenDetail={handleOpenDetail}
              onSelectSubreddit={handleSelectSubreddit}
              onToggleSave={(id) => setUserState((prev) => toggleSavePost(prev, id))}
              onToggleHide={(id) => setUserState((prev) => toggleHidePost(prev, id))}
            />
          ) : searchState ? (
            /* 검색 결과 모드 */
            <RedditSearchModal
              query={searchState.query}
              results={searchState.results}
              userState={userState}
              onBack={() => setSearchState(null)}
              onVote={handleVotePost}
              onOpenDetail={handleOpenDetail}
              onSelectSubreddit={handleSelectSubreddit}
              onOpenUserProfile={handleOpenUserProfile}
              onToggleSave={(id) => setUserState((prev) => toggleSavePost(prev, id))}
              onToggleHide={(id) => setUserState((prev) => toggleHidePost(prev, id))}
              onToggleJoin={(sub) => setUserState((prev) => toggleJoinSubreddit(prev, sub))}
            />
          ) : (
            /* 표준 서브레딧 / 메인 피드 모드 */
            <>
              {/* 특정 서브레딧일 때만 서브레딧 상단 배너 & 헤더 노출 (메인 피드는 상단 배너 제거) */}
              {!['popular', 'all', 'home'].includes(currentSubreddit.toLowerCase()) && (
                <RedditSubredditHeader
                  subreddit={currentSubredditInfo}
                  isJoined={userState.joinedSubreddits.some((s) => s.toLowerCase() === currentSubreddit.toLowerCase())}
                  isDark={isDark}
                  isKo={isKo}
                  activeTab={activeTab}
                  onToggleJoin={() => setUserState((prev) => toggleJoinSubreddit(prev, currentSubreddit))}
                  onSelectTab={setActiveTab}
                />
              )}

              {activeTab === 'posts' && (
                <>
                  {/* 빠른 게시물 작성 인풋 바 (실제 reddit.com 100% 동일) */}
                  <RedditQuickCreatePostBar
                    isDark={isDark}
                    isKo={isKo}
                    onOpenSubmitModal={() => setIsSubmitModalOpen(true)}
                  />

                  {/* 실시간 Reddit 피드 연동 상태 바 및 수동 새로고침 버튼 */}
                  <div className={`flex flex-col gap-1.5 px-3 sm:px-3.5 py-2 mb-3 rounded-2xl text-[11px] font-semibold border shadow-sm transition-colors w-full max-w-full overflow-hidden ${
                    isDark ? 'bg-[#181C1F] border-[#22272B] text-gray-300' : 'bg-white border-gray-200 text-gray-700'
                  }`}>
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 truncate">
                        <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                          GoogleNewsSheetService.getSyncStatus() === 'unauthorized'
                            ? 'bg-amber-500 animate-pulse'
                            : 'bg-emerald-500 animate-pulse'
                        }`} />
                        <span className={`font-bold flex-shrink-0 ${
                          GoogleNewsSheetService.getSyncStatus() === 'unauthorized'
                            ? 'text-amber-500'
                            : 'text-emerald-500'
                        }`}>
                          {GoogleNewsSheetService.getSyncStatus() === 'unauthorized'
                            ? (isKo ? '구글시트 공유권한 확인 필요' : 'Sheet Auth Required')
                            : (isKo ? '실시간 연동 중' : 'Live Stream')}
                        </span>
                        <span className="opacity-40">•</span>
                        <span className="opacity-75 text-[11px] truncate">
                          {posts.length}{isKo ? '개 포스트' : ' posts'}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={handleSyncLive}
                        disabled={isSyncingLive}
                        className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full hover:bg-black/10 cursor-pointer disabled:opacity-50 transition-all font-bold text-[11px] text-[#FF4500] flex-shrink-0 ml-2"
                        title={isKo ? '실시간 데이터 새로고침' : 'Refresh Live Data'}
                      >
                        <RotateCw className={`w-3.5 h-3.5 ${isSyncingLive ? 'animate-spin' : ''}`} />
                        <span>{isSyncingLive ? (isKo ? '동기화 중...' : 'Syncing...') : (isKo ? '실시간 갱신' : 'Refresh')}</span>
                      </button>
                    </div>

                    {GoogleNewsSheetService.getSyncStatus() === 'unauthorized' && (
                      <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-amber-500/20 text-[10.5px] text-amber-500">
                        <div className="flex items-center gap-1.5 truncate">
                          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="truncate">
                            {isKo 
                              ? '구글 시트가 비공개(로그인 필요) 상태입니다. [공유 -> 링크가 있는 모든 사용자(뷰어)]로 설정 시 최신 뉴스가 실시간 반영됩니다.'
                              : 'Spreadsheet is private. Set sharing to "Anyone with the link (Viewer)" to enable live updates.'}
                          </span>
                        </div>
                        <a
                          href="https://docs.google.com/spreadsheets/d/1CT5Yy1-i6kkOfx3d-Yw1osOEYbN7fkk8IDiI8Vm82vM/edit?usp=sharing"
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 underline font-bold flex-shrink-0 hover:text-amber-400"
                        >
                          <span>{isKo ? '시트 열기' : 'Open Sheet'}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>

                  {/* 피드 정렬 칩 및 뷰 모드 바 */}
                  <RedditFeedSortBar
                    currentSort={currentSort}
                    currentTimeFilter={currentTimeFilter}
                    currentViewMode={viewMode}
                    isDark={isDark}
                    isKo={isKo}
                    onSelectSort={setCurrentSort}
                    onSelectTimeFilter={setCurrentTimeFilter}
                    onSelectViewMode={handleSelectViewMode}
                  />

                  {/* 상단 Google AdSense 공식 디스플레이 배너 */}
                  <div className={`rounded-2xl border p-2.5 mb-3 shadow-xs overflow-hidden ${
                    isDark ? 'bg-[#181C1F] border-[#22272B]' : 'bg-white border-gray-200'
                  }`}>
                    <AdSenseBanner
                      format="horizontal"
                      responsive={true}
                      showLabel={true}
                      className="w-full flex justify-center"
                    />
                  </div>

                  {/* 피드 포스트 목록: 오직 구글 뉴스만 표시되고, SNSHero 관련 글은 광고처럼 중간중간 표시 */}
                  <div className="space-y-2">
                    {posts.length > 0 ? (
                      <>
                        {posts.slice(0, feedVisibleCount).map((post, idx) => {
                          // 상단 2개 글 이후부터 SNSHero 프로모션을 4개 간격으로 자연스럽게 삽입 (상단부 광고 과밀 방지)
                          const shouldInsertPromoted = idx >= 2 && idx % 4 === 2;
                          const promoIdx = Math.floor(idx / 4) % (promotedPosts.length || 1);
                          const promotedPost = shouldInsertPromoted && promotedPosts.length > 0 ? promotedPosts[promoIdx] : null;

                          return (
                            <React.Fragment key={post.id}>
                              {/* 1. 구글 뉴스 메인 포스트 */}
                              <RedditPostCard
                                post={post}
                                viewMode={viewMode}
                                isDark={isDark}
                                isKo={isKo}
                                onVote={handleVotePost}
                                onOpenDetail={handleOpenDetail}
                                onSelectSubreddit={handleSelectSubreddit}
                                onOpenUserProfile={handleOpenUserProfile}
                                onToggleSave={(id) => setUserState((prev) => toggleSavePost(prev, id))}
                                onToggleHide={(id) => setUserState((prev) => toggleHidePost(prev, id))}
                              />

                              {/* 2. SNSHero 관련 글: 상단 이후부터 적절한 간격으로 광고처럼 삽입 (스폰서드/프로모티드 카드) */}
                              {promotedPost && (
                                <div className="my-2.5">
                                  <div className={`px-3 py-1 rounded-t-xl text-[10px] font-extrabold uppercase tracking-wider flex items-center justify-between border-x border-t ${
                                    isDark ? 'bg-[#181C1F] border-[#2A3136] text-amber-400' : 'bg-amber-50/80 border-amber-200 text-amber-800'
                                  }`}>
                                    <span className="flex items-center gap-1.5">
                                      <Sparkles className="w-3 h-3 text-[#FF4500]" />
                                      <span>{isKo ? '스폰서 프로모션 • SNSHero 공식' : 'Promoted by SNSHero Official'}</span>
                                    </span>
                                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                      isDark ? 'bg-amber-400/10 text-amber-400' : 'bg-amber-200 text-amber-900'
                                    }`}>
                                      {isKo ? '광고' : 'Promoted'}
                                    </span>
                                  </div>
                                  <div className="rounded-b-2xl overflow-hidden border-x border-b border-inherit">
                                    <RedditPostCard
                                      post={{
                                        ...promotedPost,
                                        flair: {
                                          text: isKo ? '스폰서 / SNSHero' : 'Sponsored',
                                          bgColor: '#FF4500',
                                          textColor: '#FFFFFF',
                                        },
                                      }}
                                      viewMode={viewMode}
                                      isDark={isDark}
                                      isKo={isKo}
                                      onVote={handleVotePost}
                                      onOpenDetail={handleOpenDetail}
                                      onSelectSubreddit={handleSelectSubreddit}
                                      onOpenUserProfile={handleOpenUserProfile}
                                      onToggleSave={(id) => setUserState((prev) => toggleSavePost(prev, id))}
                                      onToggleHide={(id) => setUserState((prev) => toggleHidePost(prev, id))}
                                    />
                                  </div>
                                </div>
                              )}

                              {/* 3. 상단 5개 포스트 이후부터 6개 간격으로 구글 애드센스 인피드 광고 노출 */}
                              {idx >= 5 && (idx + 1) % 6 === 0 && (
                                <RedditAdCard 
                                  isDark={isDark} 
                                  isKo={isKo} 
                                  onGoToGame={() => handleNavigateView('home')} 
                                />
                              )}
                            </React.Fragment>
                          );
                        })}

                        {/* 피드 실시간 무한 스크롤 센티넬 및 자동 더보기 */}
                        <div ref={feedSentinelRef} className="py-6 text-center">
                          {isLoadingMorePosts ? (
                            <div className="flex items-center justify-center gap-2 text-xs font-bold text-[#FF4500] py-3">
                              <span className="w-4 h-4 border-2 border-[#FF4500] border-t-transparent rounded-full animate-spin" />
                              <span>{isKo ? '실시간 추가 피드 불러오는 중...' : 'Streaming more live posts...'}</span>
                            </div>
                          ) : feedVisibleCount < posts.length ? (
                            <div className="py-2 flex flex-col items-center gap-2">
                              <button
                                type="button"
                                onClick={handleLoadMorePosts}
                                className={`px-5 py-2 rounded-full border text-xs font-bold transition-all active:scale-95 cursor-pointer flex items-center gap-2 ${
                                  isDark 
                                    ? 'bg-[#22272B] hover:bg-[#2A3136] text-white border-white/10' 
                                    : 'bg-white hover:bg-gray-100 text-[#1A1A1B] border-gray-300 shadow-xs'
                                }`}
                              >
                                <RotateCw size={13} />
                                <span>{isKo ? '실시간 피드 더 불러오기' : 'Load More Live Posts'}</span>
                              </button>
                              <span className="text-[11px] opacity-40">{isKo ? '스크롤 시 자동으로 더 불러옵니다' : 'Scroll down to load automatically'}</span>
                            </div>
                          ) : (
                            <div className="text-xs opacity-50 py-4 font-medium flex items-center justify-center gap-1.5">
                              <span>🎉</span>
                              <span>{isKo ? '모든 최신 피드를 확인했습니다!' : "You've caught up with all posts!"}</span>
                            </div>
                          )}
                        </div>

                        {/* 피드 하단 Google AdSense 공식 디스플레이 배너 */}
                        <div className={`rounded-2xl border p-2.5 my-4 shadow-xs overflow-hidden ${
                          isDark ? 'bg-[#181C1F] border-[#22272B]' : 'bg-white border-gray-200'
                        }`}>
                          <AdSenseBanner
                            format="horizontal"
                            responsive={true}
                            showLabel={true}
                            className="w-full flex justify-center"
                          />
                        </div>
                      </>
                    ) : (
                      <div className={`rounded-2xl border p-12 text-center text-xs opacity-50 ${
                        isDark ? 'bg-[#181C1F] border-[#22272B]' : 'bg-white border-gray-200'
                      }`}>
                        {isKo ? '피드에 표시할 게시물이 아직 없습니다. 첫 게시물을 작성해보세요!' : 'No posts in this feed yet. Be the first to create one!'}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* About 탭 */}
              {activeTab === 'about' && (
                <div className={`rounded-2xl border p-6 text-xs leading-relaxed space-y-4 ${
                  isDark ? 'bg-[#181C1F] border-[#22272B]' : 'bg-white border-gray-200'
                }`}>
                  <h3 className="font-extrabold text-base">
                    {isKo ? `r/${currentSubredditInfo.name} 소개` : `About r/${currentSubredditInfo.name}`}
                  </h3>
                  <p>{currentSubredditInfo.description}</p>
                  <div className="grid grid-cols-2 gap-4 py-4 border-y border-inherit/10">
                    <div>
                      <div className="font-bold text-base">{currentSubredditInfo.subscribers.toLocaleString()}</div>
                      <div className="opacity-60 text-[11px]">{isKo ? '멤버 수' : 'Members'}</div>
                    </div>
                    <div>
                      <div className="font-bold text-base text-emerald-400">{currentSubredditInfo.onlineCount.toLocaleString()}</div>
                      <div className="opacity-60 text-[11px]">{isKo ? '현재 온라인' : 'Online'}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Rules 탭 */}
              {activeTab === 'rules' && (
                <div className={`rounded-2xl border p-6 text-xs space-y-3 ${
                  isDark ? 'bg-[#181C1F] border-[#22272B]' : 'bg-white border-gray-200'
                }`}>
                  <h3 className="font-extrabold text-base mb-3">
                    {isKo ? '커뮤니티 규칙' : 'Community Rules'}
                  </h3>
                  {currentSubredditInfo.rules.map((rule) => (
                    <div key={rule.number} className="p-3 rounded-xl border border-inherit/10">
                      <div className="font-bold text-xs mb-1">{rule.number}. {rule.title}</div>
                      <div className="opacity-75 text-[11px]">{rule.description}</div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </main>

        {/* 우측 사이드바 (PC lg: 이상에서만 고정 노출) */}
        <div className="hidden lg:block p-3 sm:p-5">
          <RedditSidebarRight
            subredditData={currentSubredditInfo}
            userState={userState}
            onSelectSubreddit={handleSelectSubreddit}
            onToggleJoin={(sub) => setUserState((prev) => toggleJoinSubreddit(prev, sub))}
            onOpenSubmitModal={() => setIsSubmitModalOpen(true)}
          />
        </div>
      </div>

      {/* 3. 포스트 상세 모달 */}
      {activePost && (
        <RedditPostDetailModal
          post={activePost}
          comments={activeComments}
          subredditData={currentSubredditInfo}
          userState={userState}
          onClose={handleCloseDetail}
          onVotePost={handleVotePost}
          onVoteComment={handleVoteComment}
          onAddComment={handleAddComment}
          onAddReply={handleAddReply}
          onSelectSubreddit={handleSelectSubreddit}
          onOpenUserProfile={handleOpenUserProfile}
          onToggleSave={(id) => setUserState((prev) => toggleSavePost(prev, id))}
          onToggleJoin={(sub) => setUserState((prev) => toggleJoinSubreddit(prev, sub))}
          onOpenSubmitModal={() => setIsSubmitModalOpen(true)}
          onGoToGame={onNavigateHome}
        />
      )}

      {/* 4. 새 글 작성 모달 */}
      {isSubmitModalOpen && (
        <RedditSubmitPostModal
          initialSubreddit={currentSubreddit}
          userState={userState}
          onClose={() => setIsSubmitModalOpen(false)}
          onSubmitPost={handleSubmitPost}
        />
      )}

      {/* 5. 새 커뮤니티(서브레딧) 만들기 모달 */}
      <RedditCreateCommunityModal
        isOpen={isCreateCommunityOpen}
        isDark={isDark}
        isKo={isKo}
        onClose={() => setIsCreateCommunityOpen(false)}
        onCreateCommunity={handleCreateCommunity}
      />

      {/* 6. 어느 화면에서나 항상 우측 하단에 고정 표시되는 플로팅 Play 버튼 */}
      <RedditFloatingPlayButton onGoToGame={onNavigateHome} isKo={isKo} />
    </div>
  );
};

export default RedditCommunityView;
