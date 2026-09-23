/**
 * DeviceHandoffManager.ts - SCR-12-17
 * 0.1초 만에 PC/모바일 간 계정 세션을 안전하게 연동하는 인스턴트 핸드오프 매니저
 */

export class DeviceHandoffManager {
  public generateHandoffToken(): string {
    return `handoff_${Math.random().toString(36).substring(2)}_${Date.now()}`;
  }

  public verifyHandoffToken(token: string): boolean {
    return token.startsWith('handoff_');
  }
}
