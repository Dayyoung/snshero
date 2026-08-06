/**
 * 친구 대전 헬퍼
 * 로컬 fallback 기반, Firestore 확장 가능
 */
import { 
  FriendBattleRequest, 
  FriendBattleResult,
  FriendEntry 
} from '../types';

const DEBUG = false;
const LOCAL_FRIENDS_KEY = 'hero_friends';
const LOCAL_BATTLE_REQUESTS_KEY = 'hero_friend_battle_requests';
const BATTLE_REQUEST_EXPIRY_MS = 5 * 60 * 1000; // 5분

// ─── 친구 목록 관리 ─────────────────────────────────────────────────

function getLocalFriends(): FriendEntry[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(LOCAL_FRIENDS_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

function saveLocalFriends(friends: FriendEntry[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LOCAL_FRIENDS_KEY, JSON.stringify(friends));
}

/** 현재 사용자의 친구 목록 조회 */
export function getFriends(): FriendEntry[] {
  return getLocalFriends();
}

/** 친구 추가 (또는 기존 친구 업데이트) */
export function addFriend(friend: Omit<FriendEntry, 'lastBattleAt' | 'battleCount' | 'isOnline'>): void {
  const friends = getLocalFriends();
  const existing = friends.find(f => f.uid === friend.uid);
  if (existing) {
    // 이미 친구인 경우 갱신
    existing.displayName = friend.displayName;
    if (friend.photoURL !== undefined) existing.photoURL = friend.photoURL;
    saveLocalFriends(friends);
  } else {
    friends.push({
      ...friend,
      lastBattleAt: null,
      battleCount: 0,
      isOnline: false,
    });
    saveLocalFriends(friends);
  }
}

/** 친구 삭제 */
export function removeFriend(uid: string): void {
  const friends = getLocalFriends().filter(f => f.uid !== uid);
  saveLocalFriends(friends);
}

/** 길드 멤버에서 친구 추천 목록 생성 */
export function getFriendSuggestionsFromGuild(
  guildMembers: { uid: string; displayName: string; photoURL?: string | null }[],
  currentUid: string
): FriendEntry[] {
  const friends = getLocalFriends();
  const friendUids = new Set(friends.map(f => f.uid));
  
  return guildMembers
    .filter(m => m.uid !== currentUid && !friendUids.has(m.uid))
    .map(m => ({
      uid: m.uid,
      displayName: m.displayName,
      photoURL: m.photoURL,
      lastBattleAt: null,
      battleCount: 0,
      isOnline: false,
    }));
}

// ─── 대전 요청 관리 ────────────────────────────────────────────────

function getLocalBattleRequests(): FriendBattleRequest[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(LOCAL_BATTLE_REQUESTS_KEY);
  if (!stored) return [];
  try {
    const requests = JSON.parse(stored) as FriendBattleRequest[];
    // 만료된 요청 정리
    const now = Date.now();
    const valid = requests.filter(r => r.status === 'pending' && r.expiresAt > now || r.status !== 'pending');
    if (valid.length !== requests.length) {
      localStorage.setItem(LOCAL_BATTLE_REQUESTS_KEY, JSON.stringify(valid));
    }
    return valid;
  } catch {
    return [];
  }
}

function saveLocalBattleRequests(requests: FriendBattleRequest[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LOCAL_BATTLE_REQUESTS_KEY, JSON.stringify(requests));
}

/** 친구에게 대전 신청 */
export function sendFriendBattleRequest(
  fromUid: string,
  fromName: string,
  toUid: string,
  toName: string
): FriendBattleRequest {
  const requests = getLocalBattleRequests();
  
  // 이미 pending 요청이 있는지 확인
  const existing = requests.find(
    r => r.fromUid === fromUid && r.toUid === toUid && r.status === 'pending'
  );
  if (existing && existing.expiresAt > Date.now()) {
    return existing;
  }

  const request: FriendBattleRequest = {
    id: `fb_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    fromUid,
    fromName,
    toUid,
    toName,
    status: 'pending',
    createdAt: Date.now(),
    expiresAt: Date.now() + BATTLE_REQUEST_EXPIRY_MS,
  };

  requests.push(request);
  saveLocalBattleRequests(requests);

  if (DEBUG) console.log('[FriendBattle] Request sent:', request.id);
  return request;
}

/** 받은 대전 요청 목록 */
export function getPendingBattleRequests(uid: string): FriendBattleRequest[] {
  const requests = getLocalBattleRequests();
  const now = Date.now();
  return requests.filter(
    r => r.toUid === uid && r.status === 'pending' && r.expiresAt > now
  );
}

/** 보낸 대전 요청 목록 */
export function getSentBattleRequests(uid: string): FriendBattleRequest[] {
  const requests = getLocalBattleRequests();
  return requests.filter(r => r.fromUid === uid);
}

/** 대전 요청 수락 */
export function acceptBattleRequest(requestId: string): FriendBattleRequest | null {
  const requests = getLocalBattleRequests();
  const request = requests.find(r => r.id === requestId);
  
  if (!request) return null;
  if (request.status !== 'pending') return null;
  if (request.expiresAt < Date.now()) {
    request.status = 'expired';
    saveLocalBattleRequests(requests);
    return null;
  }

  request.status = 'accepted';
  saveLocalBattleRequests(requests);
  return request;
}

/** 대전 요청 거절 */
export function declineBattleRequest(requestId: string): void {
  const requests = getLocalBattleRequests();
  const request = requests.find(r => r.id === requestId);
  if (request && request.status === 'pending') {
    request.status = 'declined';
    saveLocalBattleRequests(requests);
  }
}

/** 대전 완료 처리 */
export function completeBattleRequest(
  requestId: string,
  winnerId: string,
  loserId: string,
  battleLog: string[]
): FriendBattleRequest | null {
  const requests = getLocalBattleRequests();
  const request = requests.find(r => r.id === requestId);
  if (!request) return null;

  request.status = 'completed';
  request.battleResult = {
    winnerId,
    loserId,
    battleLog,
    rewardsClaimed: false,
  };
  
  // 친구 대전 카운트 증가
  const friends = getLocalFriends();
  const opponentUid = request.fromUid === winnerId ? request.toUid : request.fromUid;
  const friend = friends.find(f => f.uid === opponentUid);
  if (friend) {
    friend.battleCount += 1;
    friend.lastBattleAt = Date.now();
    saveLocalFriends(friends);
  }

  saveLocalBattleRequests(requests);
  return request;
}

/** 대전 보상 수령 */
export function claimBattleReward(requestId: string): FriendBattleResult | null {
  const requests = getLocalBattleRequests();
  const request = requests.find(r => r.id === requestId);
  if (!request || !request.battleResult) return null;
  if (request.battleResult.rewardsClaimed) return null;

  request.battleResult.rewardsClaimed = true;
  saveLocalBattleRequests(requests);
  return request.battleResult;
}

/** 만료된 요청 정리 */
export function cleanupExpiredRequests(): number {
  const requests = getLocalBattleRequests();
  let cleaned = 0;
  const now = Date.now();
  
  for (const r of requests) {
    if (r.status === 'pending' && r.expiresAt < now) {
      r.status = 'expired';
      cleaned++;
    }
  }
  
  if (cleaned > 0) {
    saveLocalBattleRequests(requests);
  }
  return cleaned;
}
