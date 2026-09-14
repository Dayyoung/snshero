/**
 * BattleReplayService.ts
 * 대전 턴별 수(Move History) 압축/인코딩 및 리플레이 공유 링크 생성 유틸리티
 * (구글 스프레드시트 Row 1063 / ID 326 요구사항 구현)
 */

export interface ReplayMove {
  turn: number;
  player: 'user' | 'opponent';
  cardId: string;
  cardName?: string;
  gridIndex: number; // 0..8
  capturedIndices?: number[];
}

export interface MatchReplayData {
  matchId: string;
  timestamp: number;
  userWon: boolean;
  userScore: number;
  opponentScore: number;
  opponentName: string;
  moves: ReplayMove[];
}

export class BattleReplayService {
  /**
   * 경기 데이터를 Base64 압축 문자열로 인코딩
   */
  public static encodeReplay(data: MatchReplayData): string {
    try {
      const json = JSON.stringify(data);
      // utf-8 안전 base64 인코딩
      const encoded = btoa(encodeURIComponent(json));
      return encoded;
    } catch {
      return '';
    }
  }

  /**
   * Base64 압축 문자열로부터 경기 데이터 복원
   */
  public static decodeReplay(encodedStr: string): MatchReplayData | null {
    try {
      const json = decodeURIComponent(atob(encodedStr));
      return JSON.parse(json) as MatchReplayData;
    } catch {
      return null;
    }
  }

  /**
   * 클립보드 공유 링크 생성
   */
  public static generateShareUrl(data: MatchReplayData): string {
    const encoded = this.encodeReplay(data);
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://snshero.com';
    return `${origin}/play?replay=${encoded}`;
  }

  /**
   * 클립보드에 포맷된 경기 결과 및 링크 복사
   */
  public static async copyReplayToClipboard(data: MatchReplayData): Promise<boolean> {
    try {
      const shareUrl = this.generateShareUrl(data);
      const outcome = data.userWon ? '승리(VICTORY)' : '패배(DEFEAT)';
      const text = `[SNS히어로] 1v1 카드 배틀 리플레이!\n결과: ${outcome} (${data.userScore} vs ${data.opponentScore})\n상대: ${data.opponentName}\n리플레이 보기: ${shareUrl}`;

      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }
}
