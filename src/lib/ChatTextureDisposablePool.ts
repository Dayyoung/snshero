/**
 * ChatTextureDisposablePool.ts - SCR-07-16
 * 채팅 피드 Canvas 텍스처 풀 및 메시지 관리
 */

export interface ChatMessage {
  id?: string | number;
  sender: string;
  text: string;
  team?: 'A' | 'B' | string;
  timestamp?: number;
}

export class ChatTextureDisposablePool {
  private static pool: Map<string, HTMLCanvasElement> = new Map();

  public static getTexture(key: string): HTMLCanvasElement | undefined {
    return this.pool.get(key);
  }

  public static setTexture(key: string, canvas: HTMLCanvasElement): void {
    this.pool.set(key, canvas);
  }

  public static dispose(key: string): void {
    const canvas = this.pool.get(key);
    if (canvas) {
      canvas.width = 1;
      canvas.height = 1;
      this.pool.delete(key);
    }
  }

  public static clear(): void {
    this.pool.forEach((canvas) => {
      canvas.width = 1;
      canvas.height = 1;
    });
    this.pool.clear();
  }
}

export default ChatTextureDisposablePool;
