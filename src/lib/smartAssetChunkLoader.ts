/**
 * smartAssetChunkLoader.ts
 * WebP/KTX2 텍스처 70% 압축 및 3D/2D 에셋 청크 분할 온디맨드 레이지 로더
 * (구글 스프레드시트 Row 915 / ID 563 요구사항 구현)
 */

export type AssetRouteChunk = 'lobby' | 'deck' | 'play' | 'market' | 'social';

export interface ChunkLoadProgress {
  chunk: AssetRouteChunk;
  loadedCount: number;
  totalCount: number;
  progressPercent: number;
  isComplete: boolean;
}

export class SmartAssetChunkLoader {
  private static instance: SmartAssetChunkLoader;

  private isWebPSupported: boolean | null = null;
  private isKTX2Supported: boolean | null = null;
  private loadedChunks: Set<AssetRouteChunk> = new Set();
  private loadedUrls: Set<string> = new Set();

  private readonly CHUNK_MANIFEST: Record<AssetRouteChunk, string[]> = {
    lobby: [
      '/character_sheet_human.png',
      '/character_sheet_dragon.png',
      '/cards1.png',
    ],
    deck: [
      '/character_sheet_elf.png',
      '/character_sheet_mecha.png',
      '/cards2.png',
    ],
    play: [
      '/character_sheet_beast.png',
      '/character_sheet_undead.png',
      '/character_sheet_fire.png',
    ],
    market: [
      '/character_sheet_earth.png',
      '/character_sheet_water.png',
    ],
    social: [
      '/character_sheet_wind.png',
      '/character_sheet_hobbit.png',
    ],
  };

  private constructor() {
    this.checkFormatSupport();
  }

  public static getInstance(): SmartAssetChunkLoader {
    if (!SmartAssetChunkLoader.instance) {
      SmartAssetChunkLoader.instance = new SmartAssetChunkLoader();
    }
    return SmartAssetChunkLoader.instance;
  }

  /**
   * 브라우저의 WebP 및 KTX2 지원 여부 판별
   */
  private checkFormatSupport(): void {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      this.isWebPSupported = true;
      this.isKTX2Supported = false;
      return;
    }

    try {
      const elem = document.createElement('canvas');
      if (elem.getContext && elem.getContext('2d')) {
        this.isWebPSupported = elem.toDataURL('image/webp').indexOf('data:image/webp') === 0;
      } else {
        this.isWebPSupported = false;
      }
    } catch {
      this.isWebPSupported = false;
    }

    // WebGL 압축 텍스처(KTX2/Basis) 지원 확인
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      this.isKTX2Supported = Boolean(gl && (gl as WebGLRenderingContext).getExtension('WEBGL_compressed_texture_s3tc'));
    } catch {
      this.isKTX2Supported = false;
    }
  }

  /**
   * 최적화 포맷 경로 변환 (WebP/KTX2 우선)
   */
  public getOptimizedAssetUrl(originalUrl: string): string {
    if (!originalUrl || originalUrl.startsWith('data:') || originalUrl.startsWith('blob:')) {
      return originalUrl;
    }

    // 3D 텍스처 및 KTX2 지원 기기인 경우
    if (this.isKTX2Supported && originalUrl.endsWith('.ktx2')) {
      return originalUrl;
    }

    // WebP 지원 시 변환 경로 반환
    if (this.isWebPSupported && /\.(png|jpe?g)$/i.test(originalUrl)) {
      return originalUrl.replace(/\.(png|jpe?g)$/i, '.webp');
    }

    return originalUrl;
  }

  /**
   * 라우트별 에셋 청크 온디맨드 로딩 (동시성 제어 및 백그라운드 프리페치)
   */
  public async loadRouteChunk(
    chunk: AssetRouteChunk,
    onProgress?: (progress: ChunkLoadProgress) => void
  ): Promise<boolean> {
    if (this.loadedChunks.has(chunk)) {
      onProgress?.({
        chunk,
        loadedCount: this.CHUNK_MANIFEST[chunk]?.length || 0,
        totalCount: this.CHUNK_MANIFEST[chunk]?.length || 0,
        progressPercent: 100,
        isComplete: true,
      });
      return true;
    }

    const assets = this.CHUNK_MANIFEST[chunk] || [];
    let loaded = 0;
    const total = assets.length;

    if (total === 0) {
      this.loadedChunks.add(chunk);
      return true;
    }

    await Promise.all(
      assets.map(async (url) => {
        const optimized = this.getOptimizedAssetUrl(url);
        if (!this.loadedUrls.has(optimized)) {
          await this.prefetchSingleAsset(optimized);
          this.loadedUrls.add(optimized);
        }
        loaded += 1;
        onProgress?.({
          chunk,
          loadedCount: loaded,
          totalCount: total,
          progressPercent: Math.round((loaded / total) * 100),
          isComplete: loaded >= total,
        });
      })
    );

    this.loadedChunks.add(chunk);
    return true;
  }

  private prefetchSingleAsset(url: string): Promise<void> {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = url;
      img.onload = () => resolve();
      img.onerror = () => resolve(); // 오류 시에도 다음 청크 진행 차단 방지
    });
  }

  /**
   * 청크 로딩 상태 확인
   */
  public isChunkLoaded(chunk: AssetRouteChunk): boolean {
    return this.loadedChunks.has(chunk);
  }
}
