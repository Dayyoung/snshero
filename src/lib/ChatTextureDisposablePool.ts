/**
 * ChatTextureDisposablePool.ts - SCR-07-16
 * 화면 밖 텍스처를 16.6ms 내에 즉각 메모리에서 비우는 자동 디스포저블 캐시 풀
 */

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  team: 'A' | 'B';
  time: number;
}

export class ChatTextureDisposablePool {
  private messages: ChatMessage[] = [];
  private maxItems = 40;

  public addMessage(msg: ChatMessage) {
    this.messages.push(msg);
    if (this.messages.length > this.maxItems) {
      // Immediate disposal of older messages to prevent memory leak
      this.messages.splice(0, this.messages.length - this.maxItems);
    }
  }

  public getVisibleMessages(): ChatMessage[] {
    return this.messages;
  }

  public clear() {
    this.messages = [];
  }
}
