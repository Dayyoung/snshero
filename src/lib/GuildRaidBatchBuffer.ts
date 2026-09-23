/**
 * GuildRaidBatchBuffer.ts - SCR-09-25
 * 대규모 길드 보스 레이드 시 실시간 보스 HP, 누적 딜량, 길드원 랭킹 스트림을
 * 100ms 간격으로 타임스로틀링 배치 버퍼링(Time-throttled Batching)하여
 * 메인 스레드 80ms 프리징을 방지하고 60fps 부드러운 렌더링을 보장하는 버퍼 엔진.
 */

export interface GuildRaidUpdate {
  bossCurrentHp: number;
  bossMaxHp: number;
  myCumulativeDamage: number;
  guildTotalDamage: number;
  activeCheerMessage?: string;
  topRankers?: { name: string; damage: number }[];
}

export type RaidBatchCallback = (batch: GuildRaidUpdate) => void;

export class GuildRaidBatchBuffer {
  private pendingUpdate: GuildRaidUpdate | null = null;
  private throttleTimer: ReturnType<typeof setTimeout> | null = null;
  private subscribers = new Set<RaidBatchCallback>();
  private readonly throttleMs: number;

  constructor(throttleMs: number = 100) {
    this.throttleMs = throttleMs;
  }

  pushUpdate(update: Partial<GuildRaidUpdate>): void {
    if (!this.pendingUpdate) {
      this.pendingUpdate = {
        bossCurrentHp: update.bossCurrentHp ?? 1000000,
        bossMaxHp: update.bossMaxHp ?? 1000000,
        myCumulativeDamage: update.myCumulativeDamage ?? 0,
        guildTotalDamage: update.guildTotalDamage ?? 0,
        activeCheerMessage: update.activeCheerMessage,
        topRankers: update.topRankers,
      };
    } else {
      this.pendingUpdate = {
        ...this.pendingUpdate,
        ...update,
      };
    }

    if (!this.throttleTimer) {
      this.throttleTimer = setTimeout(() => {
        this.flush();
      }, this.throttleMs);
    }
  }

  private flush(): void {
    this.throttleTimer = null;
    if (!this.pendingUpdate) return;

    const data = { ...this.pendingUpdate };
    this.pendingUpdate = null;

    for (const sub of this.subscribers) {
      try {
        sub(data);
      } catch (e) {
        console.error('GuildRaidBatchBuffer callback error:', e);
      }
    }
  }

  subscribe(cb: RaidBatchCallback): () => void {
    this.subscribers.add(cb);
    return () => this.subscribers.delete(cb);
  }

  clear(): void {
    if (this.throttleTimer) {
      clearTimeout(this.throttleTimer);
      this.throttleTimer = null;
    }
    this.pendingUpdate = null;
  }
}
