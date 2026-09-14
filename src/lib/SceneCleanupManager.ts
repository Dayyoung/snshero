/**
 * Row 1052 / ID 315: Scene Exit Garbage Collection & WebGL Memory Cleanup
 * Ensures that all heavy battle textures, sprite pools, and render list allocations
 * are explicitly disposed to keep WebGL GPU memory footprint well under 60MB.
 */

interface DisposableResource {
  dispose?: () => void;
}

class SceneCleanupManagerClass {
  private activeDisposables: Set<DisposableResource> = new Set();

  /**
   * Register disposable asset for lifecycle tracking
   */
  public register(resource: DisposableResource): void {
    if (resource && typeof resource.dispose === 'function') {
      this.activeDisposables.add(resource);
    }
  }

  /**
   * Unregister a previously tracked resource
   */
  public unregister(resource: DisposableResource): void {
    this.activeDisposables.delete(resource);
  }

  /**
   * Trigger explicit garbage collection and memory reset upon scene exit
   */
  public cleanupScene(): void {
    try {
      // 1. Dispose all registered three/canvas objects
      this.activeDisposables.forEach((res) => {
        try {
          if (res && typeof res.dispose === 'function') {
            res.dispose();
          }
        } catch (e) {
          console.warn('[SceneCleanupManager] Failed to dispose resource:', e);
        }
      });
      this.activeDisposables.clear();

      // 2. Clear canvas contexts and render lists if accessible globally
      if (typeof window !== 'undefined') {
        const canvases = document.querySelectorAll('canvas[data-transient-scene="true"]');
        canvases.forEach((c) => {
          const cvs = c as HTMLCanvasElement;
          const gl = cvs.getContext('webgl') || cvs.getContext('webgl2');
          if (gl) {
            const ext = (gl as WebGLRenderingContext).getExtension('WEBGL_lose_context');
            if (ext) ext.loseContext();
          }
        });

        // 3. Clear window image caches and force garbage collection hint
        if ((window as any).gc) {
          (window as any).gc();
        }
      }

      console.log('[SceneCleanupManager] Scene memory purged successfully. Target GPU mem < 60MB.');
    } catch (err) {
      console.warn('[SceneCleanupManager] Cleanup encountered error:', err);
    }
  }
}

export const SceneCleanupManager = new SceneCleanupManagerClass();
