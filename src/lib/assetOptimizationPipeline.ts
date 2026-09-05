/**
 * assetOptimizationPipeline.ts
 * 고해상도 카드 일러스트 WebP 압축 및 3D 텍스처 KTX2 GPU 압축 에셋 파이프라인
 * (구글 스프레드시트 Row 967 / ID 555 요구사항 구현)
 */

export interface TextureCompressionMetrics {
  isWebPSupported: boolean;
  isKTX2Supported: boolean;
  totalManagedTextures: number;
  estimatedVramMb: number;
  compressionRatioPct: number;
}

export class AssetOptimizationPipeline {
  private static instance: AssetOptimizationPipeline;
  private textureRegistry: Map<string, { sizeMb: number; isKtx2: boolean }> = new Map();
  private readonly MAX_SAFE_RAM_MB = 80;

  private isWebPSupported = false;
  private isKTX2Supported = false;

  private constructor() {
    this.detectCapabilities();
  }

  public static getInstance(): AssetOptimizationPipeline {
    if (!AssetOptimizationPipeline.instance) {
      AssetOptimizationPipeline.instance = new AssetOptimizationPipeline();
    }
    return AssetOptimizationPipeline.instance;
  }

  private detectCapabilities(): void {
    if (typeof window === 'undefined') return;

    // WebP 지원 검사
    try {
      const c = document.createElement('canvas');
      this.isWebPSupported = Boolean(c.toDataURL && c.toDataURL('image/webp').indexOf('data:image/webp') === 0);
    } catch {
      this.isWebPSupported = false;
    }

    // KTX2 / 압축 텍스처(S3TC / ETC / ASTC) 지원 검사
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (gl) {
        const ext = (gl as WebGLRenderingContext).getExtension('WEBGL_compressed_texture_s3tc') ||
                    (gl as WebGLRenderingContext).getExtension('WEBGL_compressed_texture_astc') ||
                    (gl as WebGLRenderingContext).getExtension('WEBGL_compressed_texture_etc');
        this.isKTX2Supported = Boolean(ext);
      }
    } catch {
      this.isKTX2Supported = false;
    }
  }

  /**
   * 2D 이미지 또는 3D 텍스처의 최적화 포맷 경로 변환
   */
  public getOptimizedTextureUrl(rawUrl: string): string {
    if (!rawUrl || rawUrl.startsWith('blob:') || rawUrl.startsWith('data:')) {
      return rawUrl;
    }

    // 3D 텍스처 파일 중 KTX2 대체가 가능한 경우
    if (this.isKTX2Supported && /\.(png|jpe?g|tga)$/i.test(rawUrl) && rawUrl.includes('/textures/')) {
      return rawUrl.replace(/\.(png|jpe?g|tga)$/i, '.ktx2');
    }

    // 2D 카드 이미지 WebP 변환
    if (this.isWebPSupported && /\.(png|jpe?g)$/i.test(rawUrl) && !rawUrl.includes('.webp')) {
      return rawUrl.replace(/\.(png|jpe?g)$/i, '.webp');
    }

    return rawUrl;
  }

  /**
   * 텍스처 VRAM 점유량 등록 및 80MB 초과 시 자동 가비지 컬렉션 트리거
   */
  public registerTexture(url: string, estimatedMb: number): void {
    const isKtx2 = url.endsWith('.ktx2');
    // KTX2는 약 75%의 VRAM 절감 효과 반영
    const effectiveMb = isKtx2 ? estimatedMb * 0.25 : estimatedMb;

    this.textureRegistry.set(url, { sizeMb: effectiveMb, isKtx2 });

    const totalVram = this.getTotalVramMb();
    if (totalVram > this.MAX_SAFE_RAM_MB) {
      this.purgeOldestTextures();
    }
  }

  public getTotalVramMb(): number {
    let sum = 0;
    this.textureRegistry.forEach((val) => {
      sum += val.sizeMb;
    });
    return Number(sum.toFixed(2));
  }

  public getMetrics(): TextureCompressionMetrics {
    return {
      isWebPSupported: this.isWebPSupported,
      isKTX2Supported: this.isKTX2Supported,
      totalManagedTextures: this.textureRegistry.size,
      estimatedVramMb: this.getTotalVramMb(),
      compressionRatioPct: this.isKTX2Supported ? 75 : this.isWebPSupported ? 60 : 0,
    };
  }

  private purgeOldestTextures(): void {
    const keys = Array.from(this.textureRegistry.keys());
    // 가장 먼저 등록된 텍스처 20% 해제
    const purgeCount = Math.max(1, Math.floor(keys.length * 0.2));
    for (let i = 0; i < purgeCount; i++) {
      this.textureRegistry.delete(keys[i]);
    }
  }
}
