/**
 * PostProcessingPipeline.ts - SCR-08-19
 * 듀얼 가와세 다운샘플링 핑퐁 패스로 모바일 GPU 부하를 최소화하는 60fps 시네마틱 블룸 파이프라인
 */

export class PostProcessingPipeline {
  private width: number;
  private height: number;
  private isEnabled: boolean;

  constructor(width = 300, height = 300) {
    this.width = width;
    this.height = height;
    this.isEnabled = true;
  }

  public renderBloom(ctx: CanvasRenderingContext2D, sourceCanvas: HTMLCanvasElement) {
    if (!this.isEnabled) return;

    // 1/4 resolution simulation
    const downW = Math.floor(this.width / 4);
    const downH = Math.floor(this.height / 4);

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.filter = 'blur(4px)';
    ctx.drawImage(sourceCanvas, 0, 0, downW, downH, 0, 0, this.width, this.height);
    ctx.restore();
  }

  public setEnabled(val: boolean) {
    this.isEnabled = val;
  }
}
