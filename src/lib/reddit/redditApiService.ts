/**
 * redditApiService.ts
 * SNSHero 커뮤니티(레딧 클론) 데이터 제공 서비스
 * 하이브리드 파이프라인: 시드 데이터뱅크 + 로컬 사용자 생성 데이터 + 실시간 확장
 */

import { SEED_SUBREDDITS, SEED_POSTS, SEED_COMMENTS, SEED_USERS, SEED_TRENDING } from '../../data/redditSeedData';
import { 
  RedditPost, 
  RedditComment, 
  RedditSubreddit, 
  RedditUser, 
  RedditTrendingItem,
  FeedSortType, 
  TimeFilterType, 
  SearchResults,
  RedditUserDataState,
  HUMOR_SUBREDDITS
} from './redditTypes';
import { RedditLiveFeedService } from './redditLiveFeedService';
import { generateContextualCommentsForPost } from './redditCommentGenerator';
import { RedditTrendingService } from './redditTrendingService';
import { RedditRealCommentService } from './redditRealCommentService';
import { GoogleNewsSheetService } from './googleNewsSheetService';

export class RedditApiService {
  /**
   * 실시간 실제 reddit.com 피드 동기화
   */
  static async syncLivePosts(subreddit: string = 'popular', targetLang: string = 'ko'): Promise<RedditPost[]> {
    return RedditLiveFeedService.fetchRealtimePosts(subreddit, targetLang);
  }

  /**
   * 실시간 Google News 스프레드시트 피드 동기화 및 다국어 번역
   */
  static async syncGoogleNews(targetLang: string = 'ko'): Promise<RedditPost[]> {
    return GoogleNewsSheetService.getGoogleNewsPosts(targetLang);
  }

  /**
   * 실시간 추가 피드 확장 수집 (무한 스크롤 및 피드 확장용)
   */
  static async fetchMoreLivePosts(subreddit: string = 'popular', targetLang: string = 'ko'): Promise<RedditPost[]> {
    return RedditLiveFeedService.fetchMoreLiveBatch(subreddit, targetLang);
  }

  /**
   * 번역된 포스트들을 인메모리 SEED_POSTS 및 로컬 라이브 캐시에 즉시 반영
   */
  static updatePostTranslations(translatedList: RedditPost[]): void {
    if (!translatedList || translatedList.length === 0) return;
    const transMap = new Map(translatedList.map((p) => [p.id, p]));

    // 1. SEED_POSTS 원본 갱신
    SEED_POSTS.forEach((seed, idx) => {
      const match = transMap.get(seed.id);
      if (match) {
        SEED_POSTS[idx] = { 
          ...seed, 
          title: match.title, 
          body: match.body, 
          originalTitle: match.originalTitle, 
          originalBody: match.originalBody, 
          isTranslated: true 
        };
      }
    });

    // 2. livePosts 캐시 갱신
    try {
      const livePosts = RedditLiveFeedService.getCachedLivePosts();
      if (livePosts.length > 0) {
        let hasChange = false;
        const updated = livePosts.map((lp) => {
          const match = transMap.get(lp.id);
          if (match) {
            hasChange = true;
            return { 
              ...lp, 
              title: match.title, 
              body: match.body, 
              originalTitle: match.originalTitle, 
              originalBody: match.originalBody, 
              isTranslated: true 
            };
          }
          return lp;
        });
        if (hasChange) {
          localStorage.setItem('hero_reddit_live_posts_v1', JSON.stringify(updated));
        }
      }
    } catch (e) {
      console.warn('[Reddit] Failed to update live posts cache', e);
    }
  }

  /**
   * 해당 포스트가 구글 뉴스 글인지 판별
   */
  static isGoogleNewsPost(post: RedditPost): boolean {
    return (
      post.id.startsWith('gnews_') ||
      post.subreddit.toLowerCase() === 'news' ||
      post.author.startsWith('GoogleNews_') ||
      Boolean(
        post.media?.domain &&
          (post.media.domain.includes('google') ||
            post.media.domain.includes('apnews') ||
            post.media.domain.includes('cbsnews') ||
            post.media.domain.includes('aljazeera') ||
            post.media.domain.includes('theguardian') ||
            post.media.domain.includes('axios') ||
            post.media.domain.includes('foxnews'))
      )
    );
  }

  /**
   * 해당 포스트가 SNSHero 공식 또는 바이브코딩 관련 글인지 판별
   */
  static isSNSHeroPost(post: RedditPost, userState?: RedditUserDataState): boolean {
    const isUserPost = userState && userState.userPosts.some((up) => up.id === post.id);
    if (isUserPost) return true;

    return (
      post.author === 'SNSHero_Official' ||
      post.id.startsWith('post_vibecoding_') ||
      post.id.startsWith('post_snshero_') ||
      Boolean(post.isPinned) ||
      Boolean(post.title && (post.title.includes('바이브코딩') || post.title.includes('SNSHero')))
    );
  }

  /**
   * 사용자 상호작용(투표, 북마크, 숨김) 매핑 헬퍼
   */
  private static mapUserInteractions(posts: RedditPost[], userState?: RedditUserDataState): RedditPost[] {
    return posts
      .filter((p) => {
        const cleanId = p.id.replace(/_dup_.*$/, '').replace(/_repeat_.*$/, '');
        return !(userState && (userState.hiddenPostIds.includes(cleanId) || userState.hiddenPostIds.includes(p.id)));
      })
      .map((p) => {
        const cleanId = p.id.replace(/_dup_.*$/, '').replace(/_repeat_.*$/, '');
        const userVote = userState ? userState.votes[cleanId] || userState.votes[p.id] || null : null;
        const delta = userState ? userState.scoreDeltas[cleanId] || userState.scoreDeltas[p.id] || 0 : 0;
        const isSaved = userState ? userState.savedPostIds.includes(cleanId) || userState.savedPostIds.includes(p.id) : false;
        return {
          ...p,
          userVote,
          score: p.score + delta,
          isSaved,
        };
      });
  }

  /**
   * 구글글과 SNSHero글을 연속 없이 1:1로 엄격하게 교차(Interleave) 배치
   */
  static interleaveAlternating(snsPosts: RedditPost[], googlePosts: RedditPost[]): RedditPost[] {
    if (snsPosts.length === 0) return googlePosts;
    if (googlePosts.length === 0) return snsPosts;

    const result: RedditPost[] = [];
    // 고정 공지(isPinned)가 있다면 최상단 0번에 위치하도록 정렬
    const pinned = snsPosts.filter((p) => Boolean(p.isPinned));
    const unpinned = snsPosts.filter((p) => !p.isPinned);
    const orderedSns = [...pinned, ...unpinned];

    const totalSlots = Math.max(orderedSns.length, googlePosts.length);

    for (let i = 0; i < totalSlots; i++) {
      // 1) SNSHero 글 배치
      const snsItem = orderedSns[i % orderedSns.length];
      const safeSns = i >= orderedSns.length ? { ...snsItem, id: `${snsItem.id}_dup_${i}` } : snsItem;
      result.push(safeSns);

      // 2) 구글 글 배치
      const googleItem = googlePosts[i % googlePosts.length];
      const safeGoogle = i >= googlePosts.length ? { ...googleItem, id: `${googleItem.id}_dup_${i}` } : googleItem;
      result.push(safeGoogle);
    }

    return result;
  }

  /**
   * 서브레딧 또는 메인 피드 포스트 목록 반환 (오직 구글글과 SNSHero글만 연속 없이 교차 표시)
   */
  static getPosts(
    subreddit: string = 'popular',
    sort: FeedSortType = 'hot',
    timeFilter: TimeFilterType = 'today',
    userState?: RedditUserDataState
  ): RedditPost[] {
    const isFrontPage = ['popular', 'all', 'home'].includes(subreddit.toLowerCase());

    // 1. 실시간 구글 뉴스 스프레드시트 포스트 로드
    const googleNewsPosts = GoogleNewsSheetService.getCachedGoogleNewsPosts(userState?.language || 'ko');

    // 2. 기본 시드 포스트 중 SNSHero 공식 포스트들 로드
    const snsHeroSeedPosts = SEED_POSTS.filter((p) => this.isSNSHeroPost(p, userState));

    // 3. 사용자가 직접 작성한 포스트(userPosts)가 있다면 최상단에 포함
    const userPosts = userState?.userPosts || [];
    const snsHeroPool = [...userPosts, ...snsHeroSeedPosts];

    // 4. 메인 피드 (popular, all, home): 구글글과 SNSHero글만 연속 없이 1:1 교차 노출
    if (isFrontPage) {
      const sortedSns = this.sortPosts(snsHeroPool, sort);
      const sortedGoogle = this.sortPosts(googleNewsPosts, sort);

      const mappedSns = this.mapUserInteractions(sortedSns, userState);
      const mappedGoogle = this.mapUserInteractions(sortedGoogle, userState);

      return this.interleaveAlternating(mappedSns, mappedGoogle);
    }

    // 5. 뉴스 서브레딧 (news): 구글 뉴스 글 전용
    if (subreddit.toLowerCase() === 'news') {
      const sortedGoogle = this.sortPosts(googleNewsPosts, sort);
      return this.mapUserInteractions(sortedGoogle, userState);
    }

    // 6. 특정 서브레딧 (hanguk, gaming, technology 등):
    // 해당 서브레딧에 매핑된 글이 있으면 해당 글을 표시하고, 없으면 전체 SNSHero/구글 풀 교차 유지
    const subPosts = [...snsHeroPool, ...googleNewsPosts].filter(
      (p) => p.subreddit.toLowerCase() === subreddit.toLowerCase()
    );

    if (subPosts.length > 0) {
      const sorted = this.sortPosts(subPosts, sort);
      return this.mapUserInteractions(sorted, userState);
    }

    // 서브레딧에 글이 없더라도 비-공식 mock 글을 노출하지 않고 SNSHero/구글 교차 피드 제공
    const sortedSns = this.sortPosts(snsHeroPool, sort);
    const sortedGoogle = this.sortPosts(googleNewsPosts, sort);
    const mappedSns = this.mapUserInteractions(sortedSns, userState);
    const mappedGoogle = this.mapUserInteractions(sortedGoogle, userState);
    return this.interleaveAlternating(mappedSns, mappedGoogle);
  }

  /**
   * 메인화면 새로고침 시마다 다른 유머 글들이 최상단에 로테이션되어 노출되도록 순환 시프트 적용
   */
  static applyRefreshRotation(posts: RedditPost[]): RedditPost[] {
    if (posts.length <= 2) return posts;
    try {
      const rotKey = 'hero_reddit_feed_rot_seed';
      let rotIdx = parseInt(sessionStorage.getItem(rotKey) || '0', 10);
      if (isNaN(rotIdx) || rotIdx < 0) rotIdx = 0;
      
      // 최상위 유머글 풀(상위 min(24, posts.length)개) 내에서 순환 시프트
      const topCount = Math.min(posts.length, 24);
      const topSlice = posts.slice(0, topCount);
      const remaining = posts.slice(topCount);
      
      const shift = rotIdx % topCount;
      if (shift === 0) return posts;
      
      const rotated = [...topSlice.slice(shift), ...topSlice.slice(0, shift), ...remaining];
      return rotated;
    } catch {
      return posts;
    }
  }

  /**
   * 새로고침/재방문 시 순환 오프셋을 증가시켜 다음 번 새로운 글들이 상단에 뜨도록 전진
   */
  static advanceRefreshRotation(): void {
    try {
      const rotKey = 'hero_reddit_feed_rot_seed';
      const current = parseInt(sessionStorage.getItem(rotKey) || '0', 10);
      sessionStorage.setItem(rotKey, (current + 1).toString());
    } catch {}
  }

  /**
   * 포스트 정렬 (Hot, New, Top, Best, Rising) - 실시간 최신 글 가중치 완벽 반영
   */
  static sortPosts(posts: RedditPost[], sort: FeedSortType): RedditPost[] {
    const list = [...posts];
    const now = Date.now();

    switch (sort) {
      case 'new':
        return list.sort((a, b) => b.createdAt - a.createdAt);

      case 'top':
        return list.sort((a, b) => b.score - a.score);

      case 'best':
        // Upvote Ratio 가중치
        return list.sort((a, b) => {
          const scoreA = a.score * (a.upvoteRatio || 0.9);
          const scoreB = b.score * (b.upvoteRatio || 0.9);
          return scoreB - scoreA;
        });

      case 'rising':
        // 최근 생성된 포스트 중 시간당 추천수 가속도
        return list.sort((a, b) => {
          const ageHoursA = Math.max(0.1, (now - a.createdAt) / 3600000);
          const ageHoursB = Math.max(0.1, (now - b.createdAt) / 3600000);
          return b.score / ageHoursB - a.score / ageHoursA;
        });

      case 'hot':
      default:
        // Reddit Hot 알고리즘 개선 (실시간 최신 글 우선 부스트)
        return list.sort((a, b) => {
          const isLiveA = a.id.startsWith('live_');
          const isLiveB = b.id.startsWith('live_');
          const orderA = Math.log10(Math.max(1, Math.abs(a.score)));
          const orderB = Math.log10(Math.max(1, Math.abs(b.score)));
          const ageHoursA = Math.max(0.1, (now - a.createdAt) / 3600000);
          const ageHoursB = Math.max(0.1, (now - b.createdAt) / 3600000);
          const liveBoostA = isLiveA ? 1.8 : 0;
          const liveBoostB = isLiveB ? 1.8 : 0;
          const hotA = orderA - ageHoursA / 18 + liveBoostA;
          const hotB = orderB - ageHoursB / 18 + liveBoostB;
          return hotB - hotA;
        });
    }
  }

  /**
   * 단일 포스트 상세 및 댓글 트리 조회
   */
  static getPostDetail(
    postId: string,
    userState?: RedditUserDataState
  ): { post: RedditPost | null; comments: RedditComment[] } {
    let post: RedditPost | null = null;
    const cleanId = postId.replace(/_dup_.*$/, '').replace(/_repeat_.*$/, '');

    // 1. 사용자 작성 포스트에서 찾기
    if (userState && userState.userPosts.length > 0) {
      const foundUserPost = userState.userPosts.find((p) => p.id === cleanId || p.id === postId);
      if (foundUserPost) post = { ...foundUserPost };
    }

    // 2. Google News 포스트에서 찾기
    if (!post) {
      const gnews = GoogleNewsSheetService.getCachedGoogleNewsPosts(userState?.language || 'ko');
      const foundNews = gnews.find((p) => p.id === cleanId || p.id === postId);
      if (foundNews) post = { ...foundNews };
    }

    // 3. 시드 포스트에서 찾기
    if (!post) {
      const foundSeed = SEED_POSTS.find((p) => p.id === cleanId || p.id === postId);
      if (foundSeed) post = { ...foundSeed };
    }

    // 4. 실시간 피드 캐시 포스트에서 찾기
    if (!post) {
      const livePosts = RedditLiveFeedService.getCachedLivePosts();
      const foundLive = livePosts.find((p) => p.id === cleanId || p.id === postId);
      if (foundLive) post = { ...foundLive };
    }

    if (!post) return { post: null, comments: [] };

    // 투표 & 북마크 상태 매핑
    if (userState) {
      post.userVote = userState.votes[cleanId] || userState.votes[post.id] || null;
      post.score += userState.scoreDeltas[cleanId] || userState.scoreDeltas[post.id] || 0;
      post.isSaved = userState.savedPostIds.includes(cleanId) || userState.savedPostIds.includes(post.id);
    }

    // 3. 댓글 트리 가져오기 (1순위: 실제 Reddit 원본 캐시 댓글 -> 2순위: 시드 댓글 -> 3순위: 맥락 백업)
    const cachedReal = RedditRealCommentService.getCachedRealComments(postId);
    let comments: RedditComment[] = cachedReal
      ? JSON.parse(JSON.stringify(cachedReal))
      : (SEED_COMMENTS[postId] ? JSON.parse(JSON.stringify(SEED_COMMENTS[postId])) : []);

    // 만약 캐시나 시드가 없다면 임시 맥락 백업 댓글 생성 (실시간 댓글 fetch 전 폴백)
    if (comments.length === 0) {
      comments = this.generateContextualComments(post);
    }

    // 4. 사용자가 작성한 해당 포스트의 댓글 병합
    if (userState && userState.userComments.length > 0) {
      const postUserComments = userState.userComments.filter((c) => c.postId === postId);
      for (const uComment of postUserComments) {
        if (!uComment.parentId) {
          comments.unshift({ ...uComment });
        } else {
          this.insertReplyRecursive(comments, uComment);
        }
      }
    }

    // 5. 댓글 투표 상태 매핑
    if (userState) {
      this.mapCommentVotesRecursive(comments, userState);
    }

    return { post, comments };
  }

  /**
   * 트렌딩 토픽 목록 조회 (실제 reddit.com 첫 화면 상단 캐러셀, 매일/실시간 자동 갱신)
   */
  static getTrendingItems(
    currentPosts?: RedditPost[],
    userState?: RedditUserDataState,
    forceRefresh?: boolean
  ): RedditTrendingItem[] {
    const lang = userState?.language || 'ko';
    return RedditTrendingService.getDailyTrendingItems(currentPosts, lang, forceRefresh);
  }

  /**
   * 어떤 글이든 100% 풍성한 댓글과 대댓글을 읽을 수 있도록 자동 생성하는 지능형 댓글 백업 엔진
   */
  private static generateContextualComments(post: RedditPost): RedditComment[] {
    return generateContextualCommentsForPost(post, 4, 0, true);
  }

  private static insertReplyRecursive(list: RedditComment[], reply: RedditComment): boolean {
    for (const c of list) {
      if (c.id === reply.parentId) {
        c.replies = c.replies || [];
        c.replies.unshift({ ...reply });
        return true;
      }
      if (c.replies && c.replies.length > 0) {
        if (this.insertReplyRecursive(c.replies, reply)) return true;
      }
    }
    return false;
  }

  private static mapCommentVotesRecursive(list: RedditComment[], userState: RedditUserDataState): void {
    for (const c of list) {
      c.userVote = userState.votes[c.id] || null;
      c.score += userState.scoreDeltas[c.id] || 0;
      if (c.replies && c.replies.length > 0) {
        this.mapCommentVotesRecursive(c.replies, userState);
      }
    }
  }

  /**
   * 서브레딧 메타데이터 조회
   */
  static getSubredditInfo(name: string, userState?: RedditUserDataState): RedditSubreddit {
    const lower = name.toLowerCase();
    const existing = Object.values(SEED_SUBREDDITS).find(
      (s) => s.name.toLowerCase() === lower
    );

    const isJoined = userState ? userState.joinedSubreddits.some((j) => j.toLowerCase() === lower) : false;

    if (existing) {
      return {
        ...existing,
        isJoined,
      };
    }

    const isKo = userState ? userState.language !== 'en' : true;

    // 미존재 서브레딧은 즉석에서 현실감 있는 한국어/영어 메타데이터 생성
    return {
      name,
      title: isKo ? `r/${name}: 공식 커뮤니티 허브` : `${name}: Community Hub`,
      description: isKo 
        ? `r/${name} 커뮤니티에 오신 것을 환영합니다! ${name}에 관한 자유로운 토론, 실시간 뉴스, 그리고 다양한 인사이트를 나누는 소통 공간입니다.` 
        : `Welcome to r/${name}! A dynamic community for discussion, news, and insights on ${name}.`,
      bannerUrl: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=1400&q=80',
      iconUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=128&q=80',
      subscribers: 125000,
      onlineCount: 450,
      createdAt: Date.now() - 1000 * 60 * 60 * 24 * 365,
      isJoined,
      rules: isKo ? [
        { number: 1, title: 'SNSHero 커뮤니티 가이드라인 준수', description: '상호 존중하고 배려하며 깨끗한 토론 문화를 유지해주세요.' },
        { number: 2, title: '주제에 부합하는 게시물 작성', description: `모든 게시물은 r/${name} 커뮤니티의 주제와 연관되어야 합니다.` },
        { number: 3, title: '스팸 및 무단 도배 금지', description: '상업적 광고나 무분별한 링크 도배는 즉시 제재됩니다.' },
      ] : [
        { number: 1, title: 'Follow SNSHero Guidelines', description: 'Be kind, civil, and respect fellow members.' },
        { number: 2, title: 'On-topic submissions only', description: `Keep all posts relevant to ${name}.` },
        { number: 3, title: 'No spam or self-promotion', description: 'Spam and repetitive links will be removed.' },
      ],
      moderators: ['AutoModerator', 'spez'],
    };
  }

  /**
   * 전체 서브레딧 목록 반환
   */
  static getAllSubreddits(userState?: RedditUserDataState): RedditSubreddit[] {
    return Object.values(SEED_SUBREDDITS).map((s) => ({
      ...s,
      isJoined: userState ? userState.joinedSubreddits.some((j) => j.toLowerCase() === s.name.toLowerCase()) : false,
    }));
  }

  /**
   * 유저 프로필 조회
   */
  static getUserProfile(username: string, userState?: RedditUserDataState): RedditUser {
    const existing = SEED_USERS[username];
    if (existing) return existing;

    const isKo = userState ? userState.language !== 'en' : true;

    return {
      username,
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=128&q=80',
      bannerUrl: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=1200&q=80',
      postKarma: 1420,
      commentKarma: 3840,
      cakeDay: Date.now() - 1000 * 60 * 60 * 24 * 400,
      about: isKo 
        ? `안녕하세요! u/${username}입니다. 게임과 테크, 그리고 커뮤니티의 다양한 토론을 즐깁니다.` 
        : `Hey! I'm u/${username}. Passionate about gaming, tech, and lively online conversations.`,
    };
  }

  /**
   * 통합 검색 (Posts, Subreddits, Comments, Users)
   */
  static search(query: string, userState?: RedditUserDataState): SearchResults {
    const q = query.trim().toLowerCase();
    if (!q) {
      return { posts: [], subreddits: [], comments: [], users: [] };
    }

    const allPosts = this.getPosts('all', 'top', 'all', userState);
    const matchedPosts = allPosts.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        (p.body && p.body.toLowerCase().includes(q)) ||
        p.subreddit.toLowerCase().includes(q)
    );

    const allSubs = this.getAllSubreddits(userState);
    const matchedSubs = allSubs.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.title.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q)
    );

    const matchedUsers = Object.values(SEED_USERS).filter(
      (u) =>
        u.username.toLowerCase().includes(q) ||
        (u.about && u.about.toLowerCase().includes(q))
    );

    return {
      posts: matchedPosts,
      subreddits: matchedSubs,
      comments: [],
      users: matchedUsers,
    };
  }
}
