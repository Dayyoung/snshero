/**
 * SNSHero Revolution - Offline Sync Queue Helper
 * SCR-12-04: 오프라인 큐 폴링 및 네트워크 복구 시 자동 백그라운드 동기화
 */

import { offlineSyncManager, SyncTask } from './IndexedDBStorage';

class OfflineSyncService {
  private isProcessing = false;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        console.log('[SyncService] Network reconnected, syncing pending offline queue...');
        this.processQueue();
      });
      // 주기적 60초 폴러
      setInterval(() => this.processQueue(), 60000);
    }
  }

  public async processQueue(): Promise<number> {
    if (this.isProcessing) return 0;
    this.isProcessing = true;

    let processedCount = 0;
    try {
      const tasks = await offlineSyncManager.getPendingTasks();
      if (tasks.length === 0) {
        this.isProcessing = false;
        return 0;
      }

      for (const task of tasks) {
        // 백그라운드 서버 배치 정산 모의 처리
        await new Promise(r => setTimeout(r, 20));
        await offlineSyncManager.removeTask(task.id);
        processedCount++;
      }
    } catch (e) {
      console.warn('[SyncService] Error processing sync queue:', e);
    } finally {
      this.isProcessing = false;
    }

    return processedCount;
  }
}

export const offlineSyncService = new OfflineSyncService();
