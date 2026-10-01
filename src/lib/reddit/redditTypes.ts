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

export interface SearchResults {
  posts: RedditPost[];
  subreddits: RedditSubreddit[];
  comments: RedditComment[];
  users: RedditUser[];
}
