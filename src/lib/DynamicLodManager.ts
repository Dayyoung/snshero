/**
 * DynamicLodManager.ts - SCR-01-22
 * 기기 FPS 및 GPU 성능을 벤치마킹하여 3단계 적응형 LOD 레벨을 관리하는 60fps 매니저
 */

export type LodLevel = 0 | 1 | 2; // 0: High (PBR), 1: Med (Standard), 2: Low (Flat)

export class DynamicLodManager {
  private static currentLod: LodLevel = 0;
  private static frameTimes: number[] = [];

  public static updateFrame(dtMs: number): LodLevel {
    this.frameTimes.push(dtMs);
    if (this.frameTimes.length > 30) {
      this.frameTimes.shift();
      const avgMs = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;

      // 60fps = 16.6ms, 30fps = 33.3ms
      if (avgMs > 30) {
        this.currentLod = 2; // Low
      } else if (avgMs > 20) {
        this.currentLod = 1; // Medium
      } else {
        this.currentLod = 0; // High
      }
    }
    return this.currentLod;
  }

  public static getLod(): LodLevel {
    return this.currentLod;
  }
}
