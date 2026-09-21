// [SCR-11-07] Batch state controller to prevent layout thrashing on bulk reward claim
export class RewardBatchController {
  private static queue: Array<() => void> = [];
  private static scheduled = false;

  public static enqueue(action: () => void) {
    this.queue.push(action);
    if (!this.scheduled) {
      this.scheduled = true;
      requestAnimationFrame(() => {
        const actions = [...this.queue];
        this.queue = [];
        this.scheduled = false;
        // Run all updates in single RAF tick
        for (const act of actions) {
          act();
        }
      });
    }
  }
}
