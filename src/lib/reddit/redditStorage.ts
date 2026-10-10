/**
 * redditStorage.ts
 * 로컬스토리지 기반 SNSHero 커뮤니티(레딧 클론) 사용자 상태 관리
 * 100% Zero-DB, 클라이언트 사이드 영구 보존
 */

import { RedditUserDataState, VoteState, ViewModeType, RedditPost, RedditComment } from './redditTypes';

const STORAGE_KEY = 'snshero_reddit_state_v1';
const THEME_MIGRATED_KEY = 'snshero_reddit_light_theme_migrated_v2';

const DEFAULT_STATE: RedditUserDataState = {
  votes: {},
  scoreDeltas: {},
  savedPostIds: [],
  hiddenPostIds: [],
  joinedSubreddits: ['hanguk', 'gaming', 'technology', 'AskReddit', 'memes', 'CryptoCurrency'],
  userPosts: [],
  userComments: [],
  theme: 'light', // 밝은톤(라이트 테마) 기본
  viewMode: 'card',
  language: 'ko', // 한국 사용자 기본 언어
};

export function loadRedditState(): RedditUserDataState {
  if (typeof window === 'undefined') return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(THEME_MIGRATED_KEY, 'true');
      return DEFAULT_STATE;
    }
    const parsed = JSON.parse(raw);
    const loaded = { ...DEFAULT_STATE, ...parsed };

    // 기존 사용자 최초 1회 밝은톤 기본값으로 자동 전환 마이그레이션
    const isMigrated = localStorage.getItem(THEME_MIGRATED_KEY);
    if (!isMigrated) {
      loaded.theme = 'light';
      localStorage.setItem(THEME_MIGRATED_KEY, 'true');
      saveRedditState(loaded);
    }

    return loaded;
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
  const cleanId = targetId.replace(/_dup_.*$/, '').replace(/_repeat_.*$/, '');
  const currentVote = state.votes[cleanId] || state.votes[targetId] || null;
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

  const nextVotes = { ...state.votes, [cleanId]: newVote };
  if (cleanId !== targetId) {
    nextVotes[targetId] = newVote;
  }
  const currentDelta = state.scoreDeltas[cleanId] || state.scoreDeltas[targetId] || 0;
  const nextScoreDeltas = { 
    ...state.scoreDeltas, 
    [cleanId]: currentDelta + scoreDelta,
    ...(cleanId !== targetId ? { [targetId]: currentDelta + scoreDelta } : {})
  };

  const nextState: RedditUserDataState = {
    ...state,
    votes: nextVotes,
    scoreDeltas: nextScoreDeltas,
  };

  saveRedditState(nextState);
  return { nextState, newVote, scoreDelta };
}

export function toggleSavePost(state: RedditUserDataState, postId: string): RedditUserDataState {
  const cleanId = postId.replace(/_dup_.*$/, '').replace(/_repeat_.*$/, '');
  const isSaved = state.savedPostIds.includes(cleanId) || state.savedPostIds.includes(postId);
  const nextSaved = isSaved
    ? state.savedPostIds.filter((id) => id !== cleanId && id !== postId)
    : [...state.savedPostIds, cleanId];

  const nextState = { ...state, savedPostIds: nextSaved };
  saveRedditState(nextState);
  return nextState;
}

export function toggleHidePost(state: RedditUserDataState, postId: string): RedditUserDataState {
  const cleanId = postId.replace(/_dup_.*$/, '').replace(/_repeat_.*$/, '');
  const isHidden = state.hiddenPostIds.includes(cleanId) || state.hiddenPostIds.includes(postId);
  const nextHidden = isHidden
    ? state.hiddenPostIds.filter((id) => id !== cleanId && id !== postId)
    : [...state.hiddenPostIds, cleanId];

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
  if (typeof window !== 'undefined') {
    localStorage.setItem(THEME_MIGRATED_KEY, 'true');
  }
  const nextState = { ...state, theme };
  saveRedditState(nextState);
  return nextState;
}

export function updateLanguage(state: RedditUserDataState, language: 'ko' | 'en'): RedditUserDataState {
  const nextState = { ...state, language };
  saveRedditState(nextState);
  return nextState;
}
