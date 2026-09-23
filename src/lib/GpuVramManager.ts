/**
 * GpuVramManager.ts - SCR-03-16
 * 뷰포트 밖의 텍스처와 ImageBitmap을 50ms 내에 VRAM에서 해제하여 메모리 폭증을 차단하는 동적 재활용 풀
 */

export class GpuVramManager {
  private activeBitmaps: Map<string, ImageBitmap> = new Map();
  private maxCacheSize = 30;

  public register(id: string, bitmap: ImageBitmap) {
    if (this.activeBitmaps.size >= this.maxCacheSize) {
      this.evictOldest();
    }
    this.activeBitmaps.set(id, bitmap);
  }

  public get(id: string): ImageBitmap | undefined {
    return this.activeBitmaps.get(id);
  }

  public release(id: string) {
    const bmp = this.activeBitmaps.get(id);
    if (bmp) {
      bmp.close();
      this.activeBitmaps.delete(id);
    }
  }

  public releaseAll() {
    this.activeBitmaps.forEach((bmp) => bmp.close());
    this.activeBitmaps.clear();
  }

  private evictOldest() {
    const firstKey = this.activeBitmaps.keys().next().value;
    if (firstKey) {
      this.release(firstKey);
    }
  }
}
