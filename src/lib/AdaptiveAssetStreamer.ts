/**
 * AdaptiveAssetStreamer.ts - SCR-04-13
 * 네트워크 대역폭 및 기기 성능/RAM 기반 3단계 해상도 에셋 스트리밍
 */

export type AssetQuality = 'low' | 'medium' | 'high';

export class AdaptiveAssetStreamer {
  private static quality: AssetQuality = 'high';

  static detectQuality(): AssetQuality {
    try {
      // @ts-ignore
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      if (connection) {
        if (connection.saveData || connection.effectiveType === '2g' || connection.effectiveType === 'slow-2g') {
          this.quality = 'low';
        } else if (connection.effectiveType === '3g') {
          this.quality = 'medium';
        } else {
          this.quality = 'high';
        }
      }
      // @ts-ignore
      if (navigator.deviceMemory && navigator.deviceMemory < 4) {
        this.quality = 'low';
      }
    } catch {
      this.quality = 'high';
    }
    return this.quality;
  }

  static getOptimalImageUrl(baseUrl: string): string {
    const q = this.detectQuality();
    if (!baseUrl) return baseUrl;
    // URL에 퀄리티 파라미터 또는 저화질 대체 적용
    if (q === 'low') {
      return `${baseUrl}?quality=low&w=128`;
    }
    if (q === 'medium') {
      return `${baseUrl}?quality=med&w=256`;
    }
    return baseUrl;
  }
}
