/**
 * BatchTransactionQueue.ts - SCR-03-13
 * 16.6ms 타임 슬라이스 기반 점진 UI 상태 반영 큐
 */

type TaskHandler<T> = (item: T) => void;

export class BatchTransactionQueue<T> {
  private queue: T[] = [];
  private isProcessing = false;
  private onProgress?: (processed: number, total: number) => void;
  private onComplete?: () => void;
  private totalCount = 0;
  private processedCount = 0;

  constructor(
    private handler: TaskHandler<T>,
    private timeSliceMs: number = 16
  ) {}

  public enqueue(items: T[], onProgress?: (p: number, t: number) => void, onComplete?: () => void) {
    this.queue.push(...items);
    this.totalCount = this.queue.length;
    this.processedCount = 0;
    this.onProgress = onProgress;
    this.onComplete = onComplete;

    if (!this.isProcessing) {
      this.isProcessing = true;
      this.processQueue();
    }
  }

  private processQueue = () => {
    const startTime = performance.now();

    while (this.queue.length > 0 && performance.now() - startTime < this.timeSliceMs) {
      const item = this.queue.shift();
      if (item) {
        this.handler(item);
        this.processedCount++;
      }
    }

    this.onProgress?.(this.processedCount, this.totalCount);

    if (this.queue.length > 0) {
      requestAnimationFrame(this.processQueue);
    } else {
      this.isProcessing = false;
      this.onComplete?.();
    }
  };
}
