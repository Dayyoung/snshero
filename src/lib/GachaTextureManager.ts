/**
 * SNSHero Revolution - Gacha Texture & Canvas Batch Manager
 * SCR-04-07: 10연차 가챠 개봉 시 단일 드로우 콜 배치 렌더링 및
 * 연출 종료 즉시 텍스처 메모리 수동 해제(Dispose) 파이프라인
 */

export class GachaTextureManager {
  private static activeTextures: Map<string, HTMLImageElement> = new Map();

  public static async loadGachaSprites(cardIndices: number[]): Promise<HTMLImageElement[]> {
    const promises = cardIndices.map((idx) => {
      const key = `card_${idx}`;
      if (this.activeTextures.has(key)) {
        return Promise.resolve(this.activeTextures.get(key)!);
      }

      return new Promise<HTMLImageElement>((resolve) => {
        const img = new Image();
        img.src = `/card${idx}.png`;
        img.onload = () => {
          this.activeTextures.set(key, img);
          resolve(img);
        };
        img.onerror = () => {
          resolve(img);
        };
      });
    });

    return Promise.all(promises);
  }

  public static dispose(): void {
    this.activeTextures.forEach((img) => {
      img.src = '';
    });
    this.activeTextures.clear();
  }
}
