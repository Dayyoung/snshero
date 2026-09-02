/**
 * webGLTexturePoolManager.ts
 * 2D/3D 하이브리드 리소스 동적 지연 로딩(Lazy Loading) 및 저사양 모바일 기기 메모리 누수 방지 텍스처 풀러
 * (구글 스프레드시트 Row 778 / ID 567 요구사항 구현)
 */

interface CachedTextureRecord {
  key: string;
  texture: unknown;
  lastUsed: number;
  sizeBytes: number;
}

class WebGLTexturePoolManager {
  private static instance: WebGLTexturePoolManager;
  private texturePool: Map<string, CachedTextureRecord> = new Map();
  private maxMemoryBytes: number = 180 * 1024 * 1024; // 180MB 모바일 RAM 상한선
  private currentMemoryBytes: number = 0;
  private isLowSpecMode: boolean = false;

  private constructor() {
    this.detectSpecs();
  }

  public static getInstance(): WebGLTexturePoolManager {
    if (!WebGLTexturePoolManager.instance) {
      WebGLTexturePoolManager.instance = new WebGLTexturePoolManager();
    }
    return WebGLTexturePoolManager.instance;
  }

  private detectSpecs() {
    if (typeof window === 'undefined') return;
    const nav = navigator as unknown as { deviceMemory?: number; hardwareConcurrency?: number };
    if ((nav.deviceMemory && nav.deviceMemory <= 3) || (nav.hardwareConcurrency && nav.hardwareConcurrency <= 4)) {
      this.isLowSpecMode = true;
      this.maxMemoryBytes = 120 * 1024 * 1024; // 저사양 모바일은 120MB로 더 엄격히 제한
    }
  }

  /**
   * 텍스처 등록 및 메모리 용량 관리
   */
  public registerTexture(key: string, texture: unknown, estimatedBytes: number = 512 * 512 * 4): void {
    // 용량 초과 시 오래된 텍스처 정리 (LRU Eviction)
    while (this.currentMemoryBytes + estimatedBytes > this.maxMemoryBytes && this.texturePool.size > 0) {
      this.evictOldestTexture();
    }

    if (this.texturePool.has(key)) {
      const existing = this.texturePool.get(key)!;
      this.currentMemoryBytes -= existing.sizeBytes;
    }

    this.texturePool.set(key, {
      key,
      texture,
      lastUsed: Date.now(),
      sizeBytes: estimatedBytes,
    });
    this.currentMemoryBytes += estimatedBytes;
  }

  /**
   * 텍스처 획득 (LRU 갱신)
   */
  public getTexture(key: string): unknown | null {
    const record = this.texturePool.get(key);
    if (record) {
      record.lastUsed = Date.now();
      return record.texture;
    }
    return null;
  }

  /**
   * 오래된 텍스처 1건 방출 및 WebGL 리소스 해제
   */
  private evictOldestTexture(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    this.texturePool.forEach((record, key) => {
      if (record.lastUsed < oldestTime) {
        oldestTime = record.lastUsed;
        oldestKey = key;
      }
    });

    if (oldestKey && this.texturePool.has(oldestKey)) {
      const record = this.texturePool.get(oldestKey)!;
      this.disposeTexture(record.texture);
      this.currentMemoryBytes -= record.sizeBytes;
      this.texturePool.delete(oldestKey);
    }
  }

  /**
   * 텍스처 객체 안전 해제 (Three.js / WebGL 지원)
   */
  private disposeTexture(texture: unknown): void {
    if (!texture) return;
    try {
      const tex = texture as { dispose?: () => void };
      if (typeof tex.dispose === 'function') {
        tex.dispose();
      }
    } catch (e) {
      console.warn('Failed to dispose texture:', e);
    }
  }

  /**
   * 씬 전환 시 미사용 텍스처 풀 전면 정화
   */
  public purgeSceneTextures(): void {
    this.texturePool.forEach((record) => {
      this.disposeTexture(record.texture);
    });
    this.texturePool.clear();
    this.currentMemoryBytes = 0;
  }

  /**
   * 현재 메모리 사용 상태 조회 (MB)
   */
  public getMemoryUsageMb(): { currentMb: number; maxMb: number; count: number } {
    return {
      currentMb: Math.round((this.currentMemoryBytes / (1024 * 1024)) * 10) / 10,
      maxMb: Math.round(this.maxMemoryBytes / (1024 * 1024)),
      count: this.texturePool.size,
    };
  }
}

export const webGLTexturePool = WebGLTexturePoolManager.getInstance();
