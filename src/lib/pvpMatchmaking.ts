/**
 * PvP 실시간 매치메이킹 모듈
 * Firebase Realtime Database 기반의 실시간 PvP 매칭 큐 시스템
 */
import { ref, set, remove, onValue, onDisconnect, serverTimestamp, get, child } from "firebase/database";
import { rtdb } from "./firebase";

/** 매치메이킹 큐에 등록되는 사용자 정보 */
export interface PvpQueueEntry {
  uid: string;
  name: string;
  totalPower: number;
  wins: number;
  losses: number;
  joinedAt: number; // client timestamp
  serverTimestamp?: object; // server-side timestamp for cleanup
}

/** 매칭 결과 — 두 플레이어가 매칭되었을 때 생성 */
export interface PvpMatchFound {
  matchId: string;
  players: [PvpQueueEntry, PvpQueueEntry];
  createdAt: number;
}

/** 매치메이킹 상태 */
export type MatchmakingState = 'idle' | 'searching' | 'matched' | 'error';

/** 매치메이킹 이벤트 콜백 */
export interface MatchmakingCallbacks {
  onStateChange: (state: MatchmakingState) => void;
  onMatchFound: (match: PvpMatchFound) => void;
  onError: (error: string) => void;
  onQueuePosition?: (position: number) => void;
}

/** RTDB 경로 상수 */
const QUEUE_PATH = 'matchmaking/queue';
const MATCHES_PATH = 'matchmaking/matches';

/**
 * 매치메이킹 큐에 참가
 * @param entry - 플레이어 정보
 * @param callbacks - 상태 변경 콜백
 * @returns cleanup 함수
 */
export function joinMatchmaking(
  entry: Omit<PvpQueueEntry, 'joinedAt'>,
  callbacks: MatchmakingCallbacks
): () => void {
  const { uid } = entry;
  const queueRef = ref(rtdb, `${QUEUE_PATH}/${uid}`);
  const cleanupFns: (() => void)[] = [];

  callbacks.onStateChange('searching');

  // 1. 큐에 등록
  const queueEntry: PvpQueueEntry = {
    ...entry,
    joinedAt: Date.now(),
  };

  set(queueRef, {
    ...queueEntry,
    serverTimestamp: serverTimestamp(),
  }).catch((err) => {
    callbacks.onError(`매치메이킹 참가 실패: ${err.message}`);
  });

  // 2. 연결 해제 시 자동 제거 (onDisconnect)
  onDisconnect(queueRef).remove().catch(() => {
    // 조용히 실패 — 유저가 나간 것이므로
  });

  // 3. 매칭 결과 리스닝 (자신의 matchId가 기록되는지 감시)
  const matchesRef = ref(rtdb, MATCHES_PATH);
  const unsubMatches = onValue(matchesRef, (snapshot) => {
    const matches = snapshot.val() as Record<string, PvpMatchFound> | null;
    if (!matches) return;

    // 자신이 포함된 매칭 결과 찾기
    for (const [matchId, match] of Object.entries(matches)) {
      if (match.players[0].uid === uid || match.players[1].uid === uid) {
        // 매칭 성공! 큐에서 제거
        remove(queueRef).catch(() => {});
        callbacks.onStateChange('matched');
        callbacks.onMatchFound(match);
        return;
      }
    }
  }, (err) => {
    callbacks.onError(`매칭 리스닝 실패: ${err.message}`);
  });
  cleanupFns.push(unsubMatches);

  // 4. 큐 포지션 체크 (선택적)
  if (callbacks.onQueuePosition) {
    const queuePosRef = ref(rtdb, QUEUE_PATH);
    const unsubPos = onValue(queuePosRef, (snapshot) => {
      const queue = snapshot.val() as Record<string, PvpQueueEntry> | null;
      if (!queue) {
        callbacks.onQueuePosition?.(0);
        return;
      }
      const entries = Object.entries(queue)
        .filter(([id]) => id !== uid)
        .sort(([, a], [, b]) => a.joinedAt - b.joinedAt);
      callbacks.onQueuePosition?.(entries.length);
    });
    cleanupFns.push(unsubPos);
  }

  // cleanup 함수 반환
  return () => {
    remove(queueRef).catch(() => {});
    cleanupFns.forEach(fn => fn());
    callbacks.onStateChange('idle');
  };
}

/**
 * 매치메이킹 큐에서 나가기
 */
export async function leaveMatchmaking(uid: string): Promise<void> {
  const queueRef = ref(rtdb, `${QUEUE_PATH}/${uid}`);
  await remove(queueRef);
}

/**
 * 매치메이킹 큐에서 가장 오래 기다린 두 플레이어를 매칭
 * (서버/Cloud Functions에서 주기적으로 호출하거나, 클라이언트에서 optimistic matching)
 * 
 * @returns 매칭 성공 시 matchId, 실패 시 null
 */
export async function tryMatchPlayers(): Promise<string | null> {
  const queueRef = ref(rtdb, QUEUE_PATH);
  const snapshot = await get(queueRef);
  const queue = snapshot.val() as Record<string, PvpQueueEntry> | null;

  if (!queue) return null;

  const entries = Object.entries(queue)
    .map(([uid, entry]) => ({ uid, ...entry }))
    .sort((a, b) => a.joinedAt - b.joinedAt);

  if (entries.length < 2) return null;

  // 가장 오래 기다린 두 플레이어 매칭
  const [player1, player2] = entries;

  // 파워 차이가 너무 크면 매칭하지 않음 (선택적: 차후 랭크 기반으로 개선)
  // const powerDiff = Math.abs(player1.totalPower - player2.totalPower);
  // const maxPowerDiff = Math.max(player1.totalPower, player2.totalPower) * 0.3;
  // if (powerDiff > maxPowerDiff) return null;

  const matchId = `match_${Date.now()}_${player1.uid.slice(0, 4)}_${player2.uid.slice(0, 4)}`;
  const matchRef = ref(rtdb, `${MATCHES_PATH}/${matchId}`);

  const match: PvpMatchFound = {
    matchId,
    players: [
      { uid: player1.uid, name: player1.name, totalPower: player1.totalPower, wins: player1.wins, losses: player1.losses, joinedAt: player1.joinedAt },
      { uid: player2.uid, name: player2.name, totalPower: player2.totalPower, wins: player2.wins, losses: player2.losses, joinedAt: player2.joinedAt },
    ],
    createdAt: Date.now(),
  };

  await set(matchRef, match);

  // 매칭된 플레이어들을 큐에서 제거
  await Promise.all([
    remove(ref(rtdb, `${QUEUE_PATH}/${player1.uid}`)),
    remove(ref(rtdb, `${QUEUE_PATH}/${player2.uid}`)),
  ]);

  return matchId;
}

/**
 * 오래된 큐 엔트리 정리 (5분 이상 대기 중인 항목 제거)
 */
export async function cleanupStaleQueueEntries(): Promise<number> {
  const queueRef = ref(rtdb, QUEUE_PATH);
  const snapshot = await get(queueRef);
  const queue = snapshot.val() as Record<string, PvpQueueEntry> | null;

  if (!queue) return 0;

  const now = Date.now();
  const STALE_THRESHOLD = 5 * 60 * 1000; // 5분
  let removed = 0;

  const removals = Object.entries(queue)
    .filter(([, entry]) => now - entry.joinedAt > STALE_THRESHOLD)
    .map(async ([uid]) => {
      await remove(ref(rtdb, `${QUEUE_PATH}/${uid}`));
      removed++;
    });

  await Promise.all(removals);
  return removed;
}
