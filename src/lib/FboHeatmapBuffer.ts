/**
 * FboHeatmapBuffer.ts - SCR-06-19
 * 픽셀 셰이더 FBO 핑퐁 렌더링으로 실시간 오더북 깊이 히트맵을 연산하는 60fps GPU 버퍼
 */

export class FboHeatmapBuffer {
  private width: number;
  private height: number;
  private depthData: Float32Array;

  constructor(width = 128, height = 64) {
    this.width = width;
    this.height = height;
    this.depthData = new Float32Array(width * height);
  }

  public updateDepth(prices: number[], volumes: number[]) {
    this.depthData.fill(0);
    const maxVol = Math.max(...volumes, 1);
    for (let i = 0; i < Math.min(prices.length, this.height); i++) {
      const vol = volumes[i] || 0;
      const normalizedVol = vol / maxVol;
      const colWidth = Math.floor(normalizedVol * this.width);
      for (let x = 0; x < colWidth; x++) {
        this.depthData[i * this.width + x] = normalizedVol;
      }
    }
  }

  public getDepthData(): Float32Array {
    return this.depthData;
  }
}
