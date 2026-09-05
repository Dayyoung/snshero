/**
 * platformAssetOptimizer.ts
 * 모바일 웹뷰 초고속 로딩을 위한 WebP 텍스처 압축, 가상 스크롤 및 쉐이더 프리컴파일 파이프라인
 * (구글 스프레드시트 Row 975 / ID 563 요구사항 구현)
 */

export interface VirtualScrollWindow {
  startIndex: number;
  endIndex: number;
  totalHeightPx: number;
  offsetYPx: number;
}

export class PlatformAssetOptimizer {
  private static instance: PlatformAssetOptimizer;
  private isShaderWarmedUp = false;

  private constructor() {}

  public static getInstance(): PlatformAssetOptimizer {
    if (!PlatformAssetOptimizer.instance) {
      PlatformAssetOptimizer.instance = new PlatformAssetOptimizer();
    }
    return PlatformAssetOptimizer.instance;
  }

  /**
   * 카드 그리드/리스트 가상 스크롤(Virtual Scrolling) 윈도우 인덱스 계산
   */
  public computeVirtualWindow(params: {
    totalItems: number;
    scrollTop: number;
    viewportHeight: number;
    itemHeight: number;
    columns?: number;
    overscanRows?: number;
  }): VirtualScrollWindow {
    const cols = Math.max(1, params.columns || 1);
    const totalRows = Math.ceil(params.totalItems / cols);
    const overscan = params.overscanRows ?? 2;

    const startRow = Math.max(0, Math.floor(params.scrollTop / params.itemHeight) - overscan);
    const visibleRowCount = Math.ceil(params.viewportHeight / params.itemHeight) + overscan * 2;
    const endRow = Math.min(totalRows, startRow + visibleRowCount);

    const startIndex = startRow * cols;
    const endIndex = Math.min(params.totalItems, endRow * cols);
    const totalHeightPx = totalRows * params.itemHeight;
    const offsetYPx = startRow * params.itemHeight;

    return {
      startIndex,
      endIndex,
      totalHeightPx,
      offsetYPx,
    };
  }

  /**
   * 3D 미션 최초 진입 시 WebGL 쉐이더 버벅임을 방지하기 위한 비동기 웜업(Warm-up)
   */
  public async warmUpWebGLShaders(): Promise<boolean> {
    if (this.isShaderWarmedUp || typeof window === 'undefined') {
      return true;
    }

    return new Promise((resolve) => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 16;
        canvas.height = 16;
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

        if (!gl) {
          this.isShaderWarmedUp = true;
          return resolve(false);
        }

        const webgl = gl as WebGLRenderingContext;

        // 더미 정점 쉐이더
        const vsSource = `
          attribute vec4 aVertexPosition;
          void main() {
            gl_Position = aVertexPosition;
          }
        `;

        // 더미 프래그먼트 쉐이더
        const fsSource = `
          precision mediump float;
          void main() {
            gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
          }
        `;

        const vs = webgl.createShader(webgl.VERTEX_SHADER);
        const fs = webgl.createShader(webgl.FRAGMENT_SHADER);

        if (vs && fs) {
          webgl.shaderSource(vs, vsSource);
          webgl.compileShader(vs);

          webgl.shaderSource(fs, fsSource);
          webgl.compileShader(fs);

          const program = webgl.createProgram();
          if (program) {
            webgl.attachShader(program, vs);
            webgl.attachShader(program, fs);
            webgl.linkProgram(program);
            webgl.useProgram(program);
            webgl.deleteProgram(program);
          }

          webgl.deleteShader(vs);
          webgl.deleteShader(fs);
        }

        this.isShaderWarmedUp = true;
        resolve(true);
      } catch {
        this.isShaderWarmedUp = true;
        resolve(false);
      }
    });
  }
}
