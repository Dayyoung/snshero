/**
 * replayManager.ts
 * 대전 턴별 무브 히스토리 직렬화, Base64 리플레이 링크 생성 및 소셜 클립보드 공유 유틸리티
 * (구글 스프레드시트 Row 1063 / ID 326 구현)
 */

export interface ReplayMove {
  turn: number;
  by: 'player' | 'ai';
  cardId: number;
  cardTitle: string;
  boardIdx: number;
  capturedIndices?: number[];
}

export interface BattleReplayData {
  id: string;
  version: number;
  timestamp: number;
  result: 'win' | 'loss' | 'draw';
  playerName: string;
  opponentName: string;
  playerScore: number;
  opponentScore: number;
  totalDamageDealt?: number;
  moves: ReplayMove[];
  playerDeckTitles?: string[];
  opponentDeckTitles?: string[];
}

/**
 * 대전 리플레이 데이터를 Base64 URL-safe 문자열로 압축 인코딩
 */
export function encodeReplayData(replay: BattleReplayData): string {
  try {
    const compactObj = {
      i: replay.id,
      v: replay.version,
      t: replay.timestamp,
      r: replay.result,
      p: replay.playerName,
      o: replay.opponentName,
      ps: replay.playerScore,
      os: replay.opponentScore,
      dmg: replay.totalDamageDealt || 0,
      m: replay.moves.map(m => [
        m.turn,
        m.by === 'player' ? 1 : 0,
        m.cardId,
        m.cardTitle,
        m.boardIdx,
        m.capturedIndices || []
      ]),
      pd: (replay.playerDeckTitles || []).slice(0, 5),
      od: (replay.opponentDeckTitles || []).slice(0, 5)
    };
    const jsonStr = JSON.stringify(compactObj);
    const encoded = btoa(encodeURIComponent(jsonStr));
    return encodeURIComponent(encoded);
  } catch (err) {
    console.error('[ReplayManager] Failed to encode replay:', err);
    return '';
  }
}

/**
 * Base64 URL 파라미터에서 리플레이 데이터 복원
 */
export function decodeReplayData(encodedStr: string): BattleReplayData | null {
  try {
    const decodedUrlParam = decodeURIComponent(encodedStr);
    const decodedJson = decodeURIComponent(atob(decodedUrlParam));
    const compact = JSON.parse(decodedJson);

    return {
      id: compact.i || ('replay_' + Date.now()),
      version: compact.v || 1,
      timestamp: compact.t || Date.now(),
      result: compact.r || 'draw',
      playerName: compact.p || 'Hero',
      opponentName: compact.o || 'Rival',
      playerScore: compact.ps || 0,
      opponentScore: compact.os || 0,
      totalDamageDealt: compact.dmg || 0,
      moves: (compact.m || []).map((arr: any[]) => ({
        turn: arr[0],
        by: arr[1] === 1 ? 'player' : 'ai',
        cardId: arr[2],
        cardTitle: arr[3],
        boardIdx: arr[4],
        capturedIndices: arr[5] || []
      })),
      playerDeckTitles: compact.pd || [],
      opponentDeckTitles: compact.od || []
    };
  } catch (err) {
    console.error('[ReplayManager] Failed to decode replay data:', err);
    return null;
  }
}

/**
 * 리플레이 공유 텍스트 및 전체 URL 생성
 */
export function buildReplayShareData(replay: BattleReplayData, language = 'ko'): {
  url: string;
  shareText: string;
} {
  const isKo = language === 'ko';
  const encoded = encodeReplayData(replay);
  const baseUrl = typeof window !== 'undefined' ? (window.location.origin + window.location.pathname) : 'https://snshero.com';
  const replayUrl = baseUrl + '?replay=' + encoded;

  const outcomeStr = replay.result === 'win' 
    ? (isKo ? '🏆 승리 (VICTORY)' : '🏆 VICTORY') 
    : replay.result === 'loss' 
    ? (isKo ? '💀 패배 (DEFEAT)' : '💀 DEFEAT') 
    : (isKo ? '⚔️ 무승부 (DRAW)' : '⚔️ DRAW');

  const shareText = isKo
    ? `⚔️ [SNS히어로] 전투 리플레이!\n결과: ${outcomeStr} (${replay.playerScore} : ${replay.opponentScore})\n대전: ${replay.playerName} vs ${replay.opponentName} (${replay.moves.length}턴)\n👉 명경기 리플레이 감상하기:\n${replayUrl}\n#SNSHero #카드배틀 #전투리플레이`
    : `⚔️ [SNSHero] Battle Replay!\nOutcome: ${outcomeStr} (${replay.playerScore} : ${replay.opponentScore})\nMatch: ${replay.playerName} vs ${replay.opponentName} (${replay.moves.length} Turns)\n👉 Watch Replay Now:\n${replayUrl}\n#SNSHero #CardBattle #Replay`;

  return { url: replayUrl, shareText };
}

/**
 * 원클릭 클립보드 복사
 */
export async function copyReplayToClipboard(replay: BattleReplayData, language = 'ko'): Promise<boolean> {
  const { shareText } = buildReplayShareData(replay, language);
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(shareText);
      return true;
    }
  } catch {
    // fallback
  }

  try {
    if (typeof document !== 'undefined') {
      const textArea = document.createElement('textarea');
      textArea.value = shareText;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    }
  } catch {
    // ignore
  }
  return false;
}
