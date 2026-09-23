/**
 * GuildCrdtSync.ts - SCR-09-13
 * 50인 동시 길드 아지트 활동을 위한 경량 LWW-Element-Set CRDT 상태 동기화 및 델타 압축 모듈
 */

export interface GuildPlayerState {
  uid: string;
  name: string;
  x: number;
  y: number;
  direction: 'left' | 'right' | 'up' | 'down';
  timestamp: number;
  action: 'idle' | 'walking' | 'sitting' | 'cheering';
}

export class GuildCrdtSync {
  private players = new Map<string, GuildPlayerState>();
  private localUid: string;

  constructor(localUid: string) {
    this.localUid = localUid;
  }

  // Update local player state
  public updateLocal(x: number, y: number, action: GuildPlayerState['action'] = 'idle', dir: GuildPlayerState['direction'] = 'down'): GuildPlayerState {
    const state: GuildPlayerState = {
      uid: this.localUid,
      name: '나(Me)',
      x,
      y,
      direction: dir,
      timestamp: Date.now(),
      action,
    };
    this.players.set(this.localUid, state);
    return state;
  }

  // Merge remote delta packet (Last-Write-Wins CRDT)
  public mergeRemote(remote: GuildPlayerState): boolean {
    const existing = this.players.get(remote.uid);
    if (!existing || remote.timestamp > existing.timestamp) {
      this.players.set(remote.uid, remote);
      return true;
    }
    return false;
  }

  // Encode delta packet into compact binary ArrayBuffer
  public encodeDelta(state: GuildPlayerState): ArrayBuffer {
    const buffer = new ArrayBuffer(24);
    const view = new DataView(buffer);
    view.setFloat32(0, state.x, true);
    view.setFloat32(4, state.y, true);
    view.setFloat64(8, state.timestamp, true);
    view.setUint8(16, state.direction === 'left' ? 0 : state.direction === 'right' ? 1 : state.direction === 'up' ? 2 : 3);
    view.setUint8(17, state.action === 'idle' ? 0 : state.action === 'walking' ? 1 : state.action === 'sitting' ? 2 : 3);
    return buffer;
  }

  // Decode delta packet
  public decodeDelta(buffer: ArrayBuffer, uid: string, name: string): GuildPlayerState {
    const view = new DataView(buffer);
    const x = view.getFloat32(0, true);
    const y = view.getFloat32(4, true);
    const timestamp = view.getFloat64(8, true);
    const dirCode = view.getUint8(16);
    const actCode = view.getUint8(17);

    const dirMap: GuildPlayerState['direction'][] = ['left', 'right', 'up', 'down'];
    const actMap: GuildPlayerState['action'][] = ['idle', 'walking', 'sitting', 'cheering'];

    return {
      uid,
      name,
      x,
      y,
      direction: dirMap[dirCode] || 'down',
      timestamp,
      action: actMap[actCode] || 'idle',
    };
  }

  public getAllPlayers(): GuildPlayerState[] {
    return Array.from(this.players.values());
  }

  public getPlayer(uid: string): GuildPlayerState | undefined {
    return this.players.get(uid);
  }
}
