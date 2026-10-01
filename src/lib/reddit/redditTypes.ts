/**
 * redditTypes.ts
 * SNSHero 커뮤니티(오리지널 레딧 클론) 데이터 모델 및 타입 정의
 */

export type FeedSortType = 'best' | 'hot' | 'new' | 'top' | 'rising';
export type TimeFilterType = 'now' | 'today' | 'week' | 'month' | 'year' | 'all';
export type ViewModeType = 'card' | 'classic' | 'compact';
export type VoteState = 'up' | 'down' | null;

export interface PostFlair {
  text: string;
  bgColor?: string;
  textColor?: string;
}

export interface RedditMedia {
  type: 'image' | 'gallery' | 'video' | 'link';
  url: string;
  previewUrl?: string;
  galleryUrls?: string[];
  aspectRatio?: number;
  domain?: string;
}

export interface RedditComment {
  id: string;
  postId: string;
  parentId: string | null; // null이면 루트 댓글
  author: string;
  authorAvatar?: string;
  authorKarma?: number;
  body: string;
  createdAt: number; // Unix timestamp in ms
  score: number;
  userVote?: VoteState;
  isAuthorOp?: boolean;
  replies?: RedditComment[];
  collapsed?: boolean;
}

export interface RedditPost {
  id: string;
  subreddit: string; // e.g. "gaming", "AskReddit"
  subredditIcon?: string;
  title: string;
  author: string;
  authorAvatar?: string;
  createdAt: number; // timestamp ms
  score: number;
  commentCount: number;
  body?: string; // markdown content
  media?: RedditMedia;
  flair?: PostFlair;
  isPinned?: boolean;
  isOver18?: boolean;
  isSpoiler?: boolean;
  isOriginalContent?: boolean;
  upvoteRatio?: number; // 0.0 ~ 1.0 (e.g. 0.94)
  userVote?: VoteState;
  isSaved?: boolean;
  isHidden?: boolean;
  originalTitle?: string;
  originalBody?: string;
  isTranslated?: boolean;
  permalink?: string;
}

export interface SubredditRule {
  number: number;
  title: string;
  description: string;
}

export interface RedditSubreddit {
  name: string; // e.g. "gaming"
  title: string; // e.g. "Gaming Hub: News & Discussion"
  description: string;
  bannerUrl: string;
  iconUrl: string;
  subscribers: number;
  onlineCount: number;
  createdAt: number;
  isJoined?: boolean;
  rules: SubredditRule[];
  moderators: string[];
  themeColor?: string;
}

export interface RedditUser {
  username: string;
  avatarUrl: string;
  bannerUrl?: string;
  postKarma: number;
  commentKarma: number;
  cakeDay: number; // creation timestamp
  about?: string;
}

export interface RedditUserDataState {
  votes: Record<string, VoteState>; // postId/commentId -> 'up' | 'down' | null
  scoreDeltas: Record<string, number>; // postId/commentId -> delta number (+1, -1, 0)
  savedPostIds: string[];
  hiddenPostIds: string[];
  joinedSubreddits: string[];
  userPosts: RedditPost[];
  userComments: RedditComment[];
  theme: 'dark' | 'light' | 'system';
  viewMode: ViewModeType;
  language: 'ko' | 'en';
  lastSubreddit?: string;
}

export interface RedditTrendingItem {
  id: string;
  title: string;
  description: string;
  subreddit: string;
  subredditIcon?: string;
  imageUrl: string;
  postId?: string;
}

export interface SearchResults {
  posts: RedditPost[];
  subreddits: RedditSubreddit[];
  comments: RedditComment[];
  users: RedditUser[];
}

/**
 * Reddit URL에 내부 식별자 접두사(예: live_nextfuckinglevel_1wv90y5)가 포함된 경우
 * Reddit 공식 URL 규격(1wv90y5)으로 정제
 */
export function cleanRedditUrl(url: string): string {
  if (!url) return url;
  return url.replace(/\/comments\/live_[^_]+_([a-zA-Z0-9]+)/, '/comments/$1');
}

/**
 * RedditPost 객체로부터 100% 정상 작동하는 공식 Reddit 포스트 URL 반환
 */
export function getRedditExternalUrl(post: RedditPost): string {
  if (post.permalink && post.permalink.startsWith('http')) {
    return cleanRedditUrl(post.permalink);
  }
  // post.id에서 live_${sub}_${origId} 추출
  const match = post.id.match(/^live_[^_]+_(.+)$/);
  const realId = match ? match[1] : post.id;
  return `https://www.reddit.com/r/${post.subreddit}/comments/${realId}/`;
}

