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
  RedditUserDataState 
} from './redditTypes';

export class RedditApiService {
  /**
   * 서브레딧 또는 메인 피드 포스트 목록 반환
   */
  static getPosts(
    subreddit: string = 'popular',
    sort: FeedSortType = 'hot',
    timeFilter: TimeFilterType = 'today',
    userState?: RedditUserDataState
  ): RedditPost[] {
    const isFrontPage = ['popular', 'all', 'home'].includes(subreddit.toLowerCase());
    
    // 1. 기본 시드 포스트 풀 구성
    let pool: RedditPost[] = [...SEED_POSTS];

    // 2. 사용자가 직접 작성한 포스트 병합
    if (userState && userState.userPosts.length > 0) {
      pool = [...userState.userPosts, ...pool];
    }

    // 3. 서브레딧 필터링
    let filtered = pool;
    if (!isFrontPage) {
      filtered = pool.filter(
        (p) => p.subreddit.toLowerCase() === subreddit.toLowerCase()
      );
    } else if (subreddit.toLowerCase() === 'home' && userState) {
      // Home 피드는 사용자가 가입(Joined)한 서브레딧 위주
      filtered = pool.filter((p) =>
        userState.joinedSubreddits.some(
          (j) => j.toLowerCase() === p.subreddit.toLowerCase()
        )
      );
      if (filtered.length === 0) filtered = pool; // 없으면 전체
    }

    // 4. 숨긴 포스트(Hidden) 제외
    if (userState && userState.hiddenPostIds.length > 0) {
      filtered = filtered.filter((p) => !userState.hiddenPostIds.includes(p.id));
    }

    // 5. 사용자의 투표 상태 및 북마크 상태 매핑
    const mapped = filtered.map((p) => {
      const userVote = userState ? userState.votes[p.id] || null : null;
      const delta = userState ? userState.scoreDeltas[p.id] || 0 : 0;
      const isSaved = userState ? userState.savedPostIds.includes(p.id) : false;
      return {
        ...p,
        userVote,
        score: p.score + delta,
        isSaved,
      };
    });

    // 6. 정렬 알고리즘 적용
    return this.sortPosts(mapped, sort);
  }

  /**
   * 포스트 정렬 (Hot, New, Top, Best, Rising)
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
        // Reddit Hot 알고리즘 근사치 (Log10(Score) + Time Factor)
        return list.sort((a, b) => {
          const orderA = Math.log10(Math.max(1, Math.abs(a.score)));
          const orderB = Math.log10(Math.max(1, Math.abs(b.score)));
          const ageHoursA = (now - a.createdAt) / 3600000;
          const ageHoursB = (now - b.createdAt) / 3600000;
          const hotA = orderA - ageHoursA / 12;
          const hotB = orderB - ageHoursB / 12;
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

    // 1. 사용자 작성 포스트에서 찾기
    if (userState && userState.userPosts.length > 0) {
      const foundUserPost = userState.userPosts.find((p) => p.id === postId);
      if (foundUserPost) post = { ...foundUserPost };
    }

    // 2. 시드 포스트에서 찾기
    if (!post) {
      const foundSeed = SEED_POSTS.find((p) => p.id === postId);
      if (foundSeed) post = { ...foundSeed };
    }

    if (!post) return { post: null, comments: [] };

    // 투표 & 북마크 상태 매핑
    if (userState) {
      post.userVote = userState.votes[post.id] || null;
      post.score += userState.scoreDeltas[post.id] || 0;
      post.isSaved = userState.savedPostIds.includes(post.id);
    }

    // 3. 댓글 트리 가져오기
    let comments: RedditComment[] = SEED_COMMENTS[postId] ? JSON.parse(JSON.stringify(SEED_COMMENTS[postId])) : [];

    // 만약 시드 댓글이 없다면 포스트 맥락에 맞는 스마트 댓글 자동 생성 (어떤 글이든 100% 댓글 읽기 보장!)
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
   * 트렌딩 토픽 목록 조회 (실제 reddit.com 첫 화면 상단 캐러셀)
   */
  static getTrendingItems(): RedditTrendingItem[] {
    return [...SEED_TRENDING];
  }

  /**
   * 어떤 글이든 100% 풍성한 댓글과 대댓글을 읽을 수 있도록 자동 생성하는 지능형 댓글 백업 엔진
   */
  private static generateContextualComments(post: RedditPost): RedditComment[] {
    const now = Date.now();
    return [
      {
        id: `c_gen_${post.id}_1`,
        postId: post.id,
        parentId: null,
        author: 'CommunityObserver',
        authorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=64&q=80',
        authorKarma: 24500,
        createdAt: now - 1000 * 60 * 30,
        score: Math.max(12, Math.floor(post.score * 0.12)),
        body: `이 주제에 대해 r/${post.subreddit}에서 이렇게 심도 깊게 다뤄진 건 오랜만이네요. 본문에 적어주신 내용 아주 인상 깊게 읽었습니다!`,
        replies: [
          {
            id: `c_gen_${post.id}_1_1`,
            postId: post.id,
            parentId: `c_gen_${post.id}_1`,
            author: post.author,
            authorAvatar: post.authorAvatar || 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=64&q=80',
            authorKarma: 18200,
            createdAt: now - 1000 * 60 * 15,
            score: Math.max(8, Math.floor(post.score * 0.08)),
            isAuthorOp: true,
            body: `좋게 봐주셔서 감사합니다! 커뮤니티 분들과 더 많은 피드백을 나누고 싶었습니다 ㅎㅎ`,
          },
        ],
      },
      {
        id: `c_gen_${post.id}_2`,
        postId: post.id,
        parentId: null,
        author: 'InsightfulDebater',
        authorAvatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=64&q=80',
        authorKarma: 15800,
        createdAt: now - 1000 * 60 * 20,
        score: Math.max(9, Math.floor(post.score * 0.07)),
        body: `공감합니다. 다음 업데이트나 후속 진행 상황도 꼭 공유해주세요. 업보트 누르고 갑니다!`,
      },
    ];
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

    // 미존재 서브레딧은 즉석에서 현실감 있는 메타데이터 생성
    return {
      name,
      title: `${name}: Community Hub`,
      description: `Welcome to r/${name}! A dynamic community for discussion, news, and insights on ${name}.`,
      bannerUrl: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=1400&q=80',
      iconUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=128&q=80',
      subscribers: 125000,
      onlineCount: 450,
      createdAt: Date.now() - 1000 * 60 * 60 * 24 * 365,
      isJoined,
      rules: [
        { number: 1, title: 'Follow SNSHero Guidelines', description: 'Be kind, civil, and respect fellow members.' },
        { number: 2, title: 'On-topic submissions only', description: `Keep all posts relevant to ${name}.` },
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
  static getUserProfile(username: string): RedditUser {
    const existing = SEED_USERS[username];
    if (existing) return existing;

    return {
      username,
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=128&q=80',
      bannerUrl: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=1200&q=80',
      postKarma: 1420,
      commentKarma: 3840,
      cakeDay: Date.now() - 1000 * 60 * 60 * 24 * 400,
      about: `Hey! I'm u/${username}. Passionate about gaming, tech, and lively online conversations.`,
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
