/**
 * SNSHero Revolution - IndexedDB Storage & Offline Sync Queue
 * SCR-12-04: 보상 수령 및 상태 갱신 시 0ms 즉각 반응(옵티미스틱) 및
 * 오프라인/불안정 네트워크 시 자동 큐 적재 및 백그라운드 동기화 지원
 */

export interface SyncTask {
  id: string;
  type: 'CLAIM_REWARD' | 'SYNC_SETTINGS' | 'UPDATE_MISSION' | 'ATTENDANCE';
  payload: Record<string, unknown>;
  timestamp: number;
  retryCount: number;
}

const DB_NAME = 'snshero_offline_db';
const DB_VERSION = 1;
const STORE_NAME = 'sync_queue';

class IndexedDBSyncManager {
  private db: IDBDatabase | null = null;
  private isInitialized = false;

  public async init(): Promise<boolean> {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      return false;
    }
    if (this.isInitialized && this.db) return true;

    return new Promise((resolve) => {
      try {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          }
        };

        request.onsuccess = (event) => {
          this.db = (event.target as IDBOpenDBRequest).result;
          this.isInitialized = true;
          resolve(true);
        };

        request.onerror = () => {
          console.warn('[IndexedDB] Failed to open database, falling back to localStorage');
          resolve(false);
        };
      } catch {
        resolve(false);
      }
    });
  }

  public async enqueue(task: Omit<SyncTask, 'id' | 'timestamp' | 'retryCount'>): Promise<string> {
    const taskId = `sync_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const fullTask: SyncTask = {
      ...task,
      id: taskId,
      timestamp: Date.now(),
      retryCount: 0,
    };

    const isDbReady = await this.init();
    if (isDbReady && this.db) {
      try {
        const tx = this.db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.put(fullTask);
      } catch (e) {
        console.warn('[IndexedDB] Error enqueuing task:', e);
        this.enqueueToLocalStorage(fullTask);
      }
    } else {
      this.enqueueToLocalStorage(fullTask);
    }

    return taskId;
  }

  private enqueueToLocalStorage(task: SyncTask): void {
    try {
      const raw = localStorage.getItem('hero_offline_sync_queue') || '[]';
      const queue: SyncTask[] = JSON.parse(raw);
      queue.push(task);
      localStorage.setItem('hero_offline_sync_queue', JSON.stringify(queue.slice(-50)));
    } catch (e) {
      console.warn('[IndexedDB] LocalStorage queue fallback error:', e);
    }
  }

  public async getPendingTasks(): Promise<SyncTask[]> {
    const isDbReady = await this.init();
    if (isDbReady && this.db) {
      return new Promise((resolve) => {
        try {
          const tx = this.db!.transaction(STORE_NAME, 'readonly');
          const store = tx.objectStore(STORE_NAME);
          const req = store.getAll();
          req.onsuccess = () => resolve(req.result || []);
          req.onerror = () => resolve(this.getPendingTasksFromLocalStorage());
        } catch {
          resolve(this.getPendingTasksFromLocalStorage());
        }
      });
    }
    return this.getPendingTasksFromLocalStorage();
  }

  private getPendingTasksFromLocalStorage(): SyncTask[] {
    try {
      const raw = localStorage.getItem('hero_offline_sync_queue');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  public async removeTask(id: string): Promise<void> {
    const isDbReady = await this.init();
    if (isDbReady && this.db) {
      try {
        const tx = this.db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).delete(id);
      } catch {}
    }
    try {
      const queue = this.getPendingTasksFromLocalStorage().filter(t => t.id !== id);
      localStorage.setItem('hero_offline_sync_queue', JSON.stringify(queue));
    } catch {}
  }
}

export const offlineSyncManager = new IndexedDBSyncManager();

/**
 * 0ms 반응형 옵티미스틱 보상 수령 실행기
 */
export async function claimRewardOptimistic(
  rewardType: string,
  amount: number,
  onApplyLocal: () => void
): Promise<{ success: boolean; latencyMs: number }> {
  const startTime = performance.now();

  // 1. UI 즉시 반영 (0ms)
  onApplyLocal();

  // 2. 비동기 백그라운드 큐 적재
  offlineSyncManager.enqueue({
    type: 'CLAIM_REWARD',
    payload: { rewardType, amount },
  }).catch(() => {});

  const latencyMs = Math.round(performance.now() - startTime);
  return { success: true, latencyMs };
}
