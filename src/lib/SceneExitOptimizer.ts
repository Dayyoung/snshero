/**
 * SceneExitOptimizer.ts
 * 씬/배틀/스토리 모드 종료 시 WebGL 및 이미지 캐시 디바운스 정리 유틸리티
 * (구글 스프레드시트 Row 1052 / ID 315 요구사항 구현)
 */

export class SceneExitOptimizer {
  private static registeredCanvases: Set<HTMLCanvasElement> = new Set();
  private static cleanupDebounceTimer: number | null = null;

  /**
   * 정리 대상 캔버스 등록
   */
  public static registerCanvas(canvas: HTMLCanvasElement | null): void {
    if (canvas) {
      this.registeredCanvases.add(canvas);
    }
  }

  /**
   * 캔버스 등록 해제
   */
  public static unregisterCanvas(canvas: HTMLCanvasElement | null): void {
    if (canvas) {
      this.registeredCanvases.delete(canvas);
    }
  }

  /**
   * 배틀/스토리 씬 종료 시 리소스 언로드 및 WebGL 메모리 디바운스 정리 (60MB 이하 유지)
   */
  public static triggerSceneExitCleanup(): void {
    if (this.cleanupDebounceTimer) {
      clearTimeout(this.cleanupDebounceTimer);
    }

    this.cleanupDebounceTimer = window.setTimeout(() => {
      try {
        // 1. 등록된 모든 캔버스의 WebGL / 2D 컨텍스트 정리
        this.registeredCanvases.forEach((canvas) => {
          try {
            const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
            if (gl && 'getExtension' in gl) {
              const loseContext = gl.getExtension('WEBGL_lose_context');
              if (loseContext) {
                loseContext.loseContext();
              }
            } else {
              const ctx2d = canvas.getContext('2d');
              if (ctx2d) {
                ctx2d.clearRect(0, 0, canvas.width, canvas.height);
              }
            }
          } catch {
            // 개별 캔버스 정리 실패 무시
          }
        });
        this.registeredCanvases.clear();

        // 2. 가비지 컬렉션 유도 (Window Memory 정리 힌트)
        if (typeof window !== 'undefined') {
          // 브라우저 캐시 및 임시 이미지 객체 해제 힌트
          const evt = new CustomEvent('scene_exit_memory_purge');
          window.dispatchEvent(evt);
        }
      } catch (e) {
        console.warn('[SceneExitOptimizer] Cleanup notice:', e);
      }
    }, 150);
  }
}
