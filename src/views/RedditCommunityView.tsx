/**
 * RedditCommunityView.tsx
 * 오리지널 레딧(Reddit) 100% 클론 커뮤니티 통합 뷰 허브 ('SNSHero Community')
 * 무비용 정적 페이지, Zero-DB 로컬스토리지 영구 저장, 구글 애드센스 수익화, GA/GEO/SEO/AEO 탑재 (한국어 기본 지원)
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { RotateCw } from 'lucide-react';
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
import { translateRedditPosts, isNeedsTranslation } from '../lib/reddit/redditTranslationService';
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
import { RedditTrendingCarousel } from '../components/reddit/RedditTrendingCarousel';
import { RedditQuickCreatePostBar } from '../components/reddit/RedditQuickCreatePostBar';
import { RedditCreateCommunityModal } from '../components/reddit/RedditCreateCommunityModal';
import { RedditTrendingItem } from '../lib/reddit/redditTypes';
import { SEED_SUBREDDITS } from '../data/redditSeedData';

interface RedditCommunityViewProps {
  initialSubreddit?: string;
  initialPostId?: string;
  initialUsername?: string;
  onNavigateHome: () => void;
}

export const RedditCommunityView: React.FC<RedditCommunityViewProps> = ({
  initialSubreddit = 'popular',
  initialPostId,
  initialUsername,
  onNavigateHome,
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSyncingLive, setIsSyncingLive] = useState(false);
  const [syncTick, setSyncTick] = useState(0);

  // 피드 무한 스크롤 상태
  const [feedVisibleCount, setFeedVisibleCount] = useState(8);
  const [isLoadingMorePosts, setIsLoadingMorePosts] = useState(false);
  const feedSentinelRef = React.useRef<HTMLDivElement>(null);

  const isDark = userState.theme !== 'light';
  const isKo = userState.language !== 'en'; // 한국어 기본

  // 실시간 Reddit 피드 백그라운드 동기화 함수
  const handleSyncLive = useCallback(async () => {
    setIsSyncingLive(true);
    try {
      await RedditApiService.syncLivePosts(currentSubreddit, userState.language || 'ko');
      setSyncTick((t) => t + 1);
    } catch (e) {
      console.warn('[Reddit] Live sync warning', e);
    } finally {
      setIsSyncingLive(false);
    }
  }, [currentSubreddit, userState.language]);

  // 마운트 및 서브레딧 변경 시 실시간 Reddit RSS 자동 동기화
  useEffect(() => {
    handleSyncLive();
  }, [handleSyncLive]);

  // 서브레딧 메타데이터
  const currentSubredditInfo = useMemo(() => {
    return RedditApiService.getSubredditInfo(currentSubreddit, userState);
  }, [currentSubreddit, userState]);

  // 피드 포스트 목록 (필터, 정렬 및 실시간 업데이트 동기화)
  const posts = useMemo(() => {
    return RedditApiService.getPosts(currentSubreddit, currentSort, currentTimeFilter, userState);
  }, [currentSubreddit, currentSort, currentTimeFilter, userState, syncTick]);

  // 피드 포스트 중 영문 포스트 백그라운드 구글 번역 연동
  useEffect(() => {
    let isCancelled = false;
    const targetLang = userState.language || 'ko';
    const needsAny = posts.slice(0, 15).some((p) => isNeedsTranslation(p.title, targetLang));
    if (needsAny) {
      translateRedditPosts(posts.slice(0, 15), targetLang, 15).then(() => {
        if (!isCancelled) {
          setSyncTick((t) => t + 1);
        }
      });
    }
    return () => { isCancelled = true; };
  }, [posts, userState.language]);

  // 피드 무한 스크롤 더보기 핸들러
  const handleLoadMorePosts = useCallback(() => {
    if (isLoadingMorePosts) return;
    setIsLoadingMorePosts(true);
    setTimeout(() => {
      setFeedVisibleCount((prev) => prev + 6);
      setIsLoadingMorePosts(false);
    }, 350);
  }, [isLoadingMorePosts]);

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
      } else if (path === '/' || path === '/popular') {
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

  // 트렌딩 토픽 목록
  const trendingItems = useMemo(() => {
    return RedditApiService.getTrendingItems();
  }, []);

  // 포스트 상세 열기
  const handleOpenDetail = useCallback((post: RedditPost) => {
    const { comments } = RedditApiService.getPostDetail(post.id, userState);
    setActivePost(post);
    setActiveComments(comments);
    window.history.pushState(null, '', `/r/${post.subreddit}/comments/${post.id}`);
    RedditSeoManager.trackEvent('reddit_open_post', { postId: post.id, title: post.title });
  }, [userState]);

  // 포스트 상세 닫기
  const handleCloseDetail = useCallback(() => {
    setActivePost(null);
    const targetUrl = currentSubreddit === 'popular' ? '/' : `/r/${currentSubreddit}`;
    window.history.pushState(null, '', targetUrl);
  }, [currentSubreddit]);

  // 트렌딩 아이템 클릭 시
  const handleSelectTrending = useCallback((item: RedditTrendingItem) => {
    if (item.postId) {
      const { post, comments } = RedditApiService.getPostDetail(item.postId, userState);
      if (post) {
        setActivePost(post);
        setActiveComments(comments);
        window.history.pushState(null, '', `/r/${post.subreddit}/comments/${post.id}`);
        return;
      }
    }
    handleSelectSubreddit(item.subreddit);
  }, [userState, handleSelectSubreddit]);

  // 새 글 등록
  const handleSubmitPost = useCallback((newPost: RedditPost) => {
    setUserState((prev) => addUserPost(prev, newPost));
    setIsSubmitModalOpen(false);
    setCurrentSubreddit(newPost.subreddit);
    handleOpenDetail(newPost);
    RedditSeoManager.trackEvent('reddit_submit_post', { subreddit: newPost.subreddit, title: newPost.title });
  }, [handleOpenDetail]);

  // 새 댓글 등록
  const handleAddComment = useCallback((postId: string, text: string) => {
    const newComment: RedditComment = {
      id: `comment_user_${Date.now()}`,
      postId,
      parentId: null,
      author: 'SNSHeroPlayer',
      authorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=64&q=80',
      authorKarma: 4820,
      createdAt: Date.now(),
      score: 1,
      body: text,
      userVote: 'up',
      replies: [],
    };
    setUserState((prev) => addUserComment(prev, newComment));
    setActiveComments((prev) => [newComment, ...prev]);
    RedditSeoManager.trackEvent('reddit_add_comment', { postId });
  }, []);

  // 대댓글 등록
  const handleAddReply = useCallback((parentId: string, text: string) => {
    if (!activePost) return;
    const newReply: RedditComment = {
      id: `comment_user_${Date.now()}`,
      postId: activePost.id,
      parentId,
      author: 'SNSHeroPlayer',
      authorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=64&q=80',
      authorKarma: 4820,
      createdAt: Date.now(),
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
    RedditSeoManager.trackEvent('reddit_add_reply', { parentId });
  }, [activePost]);

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
    <div className={`min-h-screen w-full flex flex-col font-sans transition-colors duration-150 ${
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
        />

        {/* 중앙 메인 피드 & 콘텐츠 */}
        <main className="flex-1 max-w-3xl min-w-0 p-3 sm:p-5">
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
              {/* 메인 홈/인기 피드일 때는 상단 트렌딩 토픽 캐러셀 카드 4개 노출 (실제 reddit.com 100% 동일) */}
              {['popular', 'all', 'home'].includes(currentSubreddit.toLowerCase()) ? (
                <RedditTrendingCarousel
                  trendingItems={trendingItems}
                  isDark={isDark}
                  isKo={isKo}
                  onSelectTrending={handleSelectTrending}
                />
              ) : (
                /* 특정 서브레딧일 때는 서브레딧 상단 배너 & 타이틀 */
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
                  <div className={`flex items-center justify-between px-3.5 py-2 mb-3 rounded-2xl text-[11px] font-semibold border shadow-sm transition-colors ${
                    isDark ? 'bg-[#181C1F] border-[#22272B] text-gray-300' : 'bg-white border-gray-200 text-gray-700'
                  }`}>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="font-bold text-emerald-500">
                        {isKo ? '실시간 Reddit 데이터 연동 중' : 'Live Reddit Stream'}
                      </span>
                      <span className="opacity-40">•</span>
                      <span className="opacity-75 text-[11px]">
                        {posts.length}{isKo ? '개 포스트 스트리밍' : ' posts'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleSyncLive}
                      disabled={isSyncingLive}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-full hover:bg-black/10 cursor-pointer disabled:opacity-50 transition-all font-bold text-[11px] text-[#FF4500]"
                      title={isKo ? '실시간 데이터 새로고침' : 'Refresh Live Data'}
                    >
                      <RotateCw className={`w-3.5 h-3.5 ${isSyncingLive ? 'animate-spin' : ''}`} />
                      <span>{isSyncingLive ? (isKo ? '동기화 중...' : 'Syncing...') : (isKo ? '실시간 갱신' : 'Refresh')}</span>
                    </button>
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

                  {/* 피드 포스트 목록 + 구글 애드센스 인피드 광고 주기적 삽입 */}
                  <div className="space-y-2">
                    {posts.length > 0 ? (
                      <>
                        {posts.slice(0, feedVisibleCount).map((post, idx) => (
                          <React.Fragment key={post.id}>
                            {/* 4번째 포스트마다 구글 애드센스 인피드 광고 노출 */}
                            {idx > 0 && idx % 4 === 0 && (
                              <RedditAdCard isDark={isDark} isKo={isKo} />
                            )}

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
                          </React.Fragment>
                        ))}

                        {/* 피드 실시간 무한 스크롤 센티넬 및 자동 더보기 */}
                        <div ref={feedSentinelRef} className="py-6 text-center">
                          {isLoadingMorePosts || feedVisibleCount < posts.length ? (
                            <div className="flex items-center justify-center gap-2 text-xs font-bold text-[#FF4500] py-2">
                              <span className="w-4 h-4 border-2 border-[#FF4500] border-t-transparent rounded-full animate-spin" />
                              <span>{isKo ? '실시간 추가 피드 불러오는 중...' : 'Streaming more live posts...'}</span>
                            </div>
                          ) : (
                            <div className="text-xs opacity-50 py-4 font-medium">
                              {isKo ? '🎉 모든 최신 피드를 확인했습니다!' : "🎉 You've caught up with all posts!"}
                            </div>
                          )}
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
