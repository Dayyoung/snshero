/**
 * PixiRenderScheduler.ts - SCR-01-13
 * 60/30/15fps 적응형 프레임 레이트 렌더 스케줄러
 */

import { BatterySaverManager, BatteryStatus } from './BatterySaverManager';

export class PixiRenderScheduler {
  private targetFps = 60;
  private interval = 1000 / 60;
  private lastRenderTime = 0;
  private animationFrameId: number | null = null;
  private renderCallback: (deltaMs: number) => void;
  private isRunning = false;
  private unsubscribeBattery?: () => void;

  constructor(renderCallback: (deltaMs: number) => void) {
    this.renderCallback = renderCallback;
    this.unsubscribeBattery = BatterySaverManager.subscribe((status: BatteryStatus) => {
      this.setTargetFps(status.targetFps);
    });
  }

  public setTargetFps(fps: 60 | 30 | 15) {
    this.targetFps = fps;
    this.interval = 1000 / fps;
  }

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastRenderTime = performance.now();
    this.loop = this.loop.bind(this);
    this.animationFrameId = requestAnimationFrame(this.loop);
  }

  public stop() {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  public destroy() {
    this.stop();
    if (this.unsubscribeBattery) {
      this.unsubscribeBattery();
    }
  }

  private loop(currentTime: number) {
    if (!this.isRunning) return;

    const delta = currentTime - this.lastRenderTime;
    if (delta >= this.interval) {
      this.lastRenderTime = currentTime - (delta % this.interval);
      try {
        this.renderCallback(delta);
      } catch (e) {
        console.error('[PixiRenderScheduler] render error:', e);
      }
    }

    this.animationFrameId = requestAnimationFrame(this.loop);
  }
}
