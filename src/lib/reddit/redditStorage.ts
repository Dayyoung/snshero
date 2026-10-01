/**
 * redditStorage.ts
 * 로컬스토리지 기반 SNSHero 커뮤니티(레딧 클론) 사용자 상태 관리
 * 100% Zero-DB, 클라이언트 사이드 영구 보존
 */

import { RedditUserDataState, VoteState, ViewModeType, RedditPost, RedditComment } from './redditTypes';

const STORAGE_KEY = 'snshero_reddit_state_v1';

const DEFAULT_STATE: RedditUserDataState = {
  votes: {},
  scoreDeltas: {},
  savedPostIds: [],
  hiddenPostIds: [],
  joinedSubreddits: ['gaming', 'technology', 'AskReddit', 'memes', 'CryptoCurrency'],
  userPosts: [],
  userComments: [],
  theme: 'dark', // 레딧 모던 다크 테마 기본
  viewMode: 'card',
};

export function loadRedditState(): RedditUserDataState {
  if (typeof window === 'undefined') return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_STATE, ...parsed };
  } catch (e) {
    return DEFAULT_STATE;
  }
}

export function saveRedditState(state: RedditUserDataState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    // quota exceeded safe catch
  }
}

export function votePostOrComment(
  state: RedditUserDataState,
  targetId: string,
  direction: 'up' | 'down'
): { nextState: RedditUserDataState; newVote: VoteState; scoreDelta: number } {
  const currentVote = state.votes[targetId] || null;
  let newVote: VoteState = null;
  let scoreDelta = 0;

  if (currentVote === direction) {
    // 투표 취소
    newVote = null;
    scoreDelta = direction === 'up' ? -1 : 1;
  } else if (currentVote === null) {
    // 신규 투표
    newVote = direction;
    scoreDelta = direction === 'up' ? 1 : -1;
  } else {
    // 반대 투표로 전환
    newVote = direction;
    scoreDelta = direction === 'up' ? 2 : -2;
  }

  const nextVotes = { ...state.votes, [targetId]: newVote };
  const currentDelta = state.scoreDeltas[targetId] || 0;
  const nextScoreDeltas = { ...state.scoreDeltas, [targetId]: currentDelta + scoreDelta };

  const nextState: RedditUserDataState = {
    ...state,
    votes: nextVotes,
    scoreDeltas: nextScoreDeltas,
  };

  saveRedditState(nextState);
  return { nextState, newVote, scoreDelta };
}

export function toggleSavePost(state: RedditUserDataState, postId: string): RedditUserDataState {
  const isSaved = state.savedPostIds.includes(postId);
  const nextSaved = isSaved
    ? state.savedPostIds.filter((id) => id !== postId)
    : [...state.savedPostIds, postId];

  const nextState = { ...state, savedPostIds: nextSaved };
  saveRedditState(nextState);
  return nextState;
}

export function toggleHidePost(state: RedditUserDataState, postId: string): RedditUserDataState {
  const isHidden = state.hiddenPostIds.includes(postId);
  const nextHidden = isHidden
    ? state.hiddenPostIds.filter((id) => id !== postId)
    : [...state.hiddenPostIds, postId];

  const nextState = { ...state, hiddenPostIds: nextHidden };
  saveRedditState(nextState);
  return nextState;
}

export function toggleJoinSubreddit(state: RedditUserDataState, subredditName: string): RedditUserDataState {
  const isJoined = state.joinedSubreddits.includes(subredditName);
  const nextJoined = isJoined
    ? state.joinedSubreddits.filter((s) => s.toLowerCase() !== subredditName.toLowerCase())
    : [...state.joinedSubreddits, subredditName];

  const nextState = { ...state, joinedSubreddits: nextJoined };
  saveRedditState(nextState);
  return nextState;
}

export function addUserPost(state: RedditUserDataState, post: RedditPost): RedditUserDataState {
  const nextState = {
    ...state,
    userPosts: [post, ...state.userPosts],
  };
  saveRedditState(nextState);
  return nextState;
}

export function addUserComment(state: RedditUserDataState, comment: RedditComment): RedditUserDataState {
  const nextState = {
    ...state,
    userComments: [comment, ...state.userComments],
  };
  saveRedditState(nextState);
  return nextState;
}

export function updateViewMode(state: RedditUserDataState, viewMode: ViewModeType): RedditUserDataState {
  const nextState = { ...state, viewMode };
  saveRedditState(nextState);
  return nextState;
}

export function updateTheme(state: RedditUserDataState, theme: 'dark' | 'light' | 'system'): RedditUserDataState {
  const nextState = { ...state, theme };
  saveRedditState(nextState);
  return nextState;
}
