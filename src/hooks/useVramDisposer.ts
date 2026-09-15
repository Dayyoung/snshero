/**
 * useVramDisposer.ts
 * 대전 진입 또는 뷰 전환 시 비활성 Three.js 씬/캔버스 VRAM 리소스 명시적 GC 정리 훅
 * (백로그 ID 469: 비활성 텍스처 GPU VRAM 적극적 GC renderer.dispose())
 */

import { useEffect, useRef } from 'react';

export interface DisposableResource {
  dispose?: () => void;
  geometry?: { dispose?: () => void };
  material?: { dispose?: () => void } | Array<{ dispose?: () => void }>;
  texture?: { dispose?: () => void };
}

export const useVramDisposer = () => {
  const disposablesRef = useRef<DisposableResource[]>([]);

  const registerDisposable = (resource: DisposableResource) => {
    disposablesRef.current.push(resource);
  };

  const disposeAll = () => {
    disposablesRef.current.forEach(item => {
      try {
        if (item.geometry && typeof item.geometry.dispose === 'function') {
          item.geometry.dispose();
        }
        if (item.material) {
          if (Array.isArray(item.material)) {
            item.material.forEach(m => m?.dispose?.());
          } else if (typeof item.material.dispose === 'function') {
            item.material.dispose();
          }
        }
        if (item.texture && typeof item.texture.dispose === 'function') {
          item.texture.dispose();
        }
        if (typeof item.dispose === 'function') {
          item.dispose();
        }
      } catch {
        // Safe dispose fallback
      }
    });
    disposablesRef.current = [];
  };

  useEffect(() => {
    const handleSceneTransition = () => {
      disposeAll();
    };

    window.addEventListener('snshero_dispose_inactive_vram', handleSceneTransition);

    return () => {
      window.removeEventListener('snshero_dispose_inactive_vram', handleSceneTransition);
      disposeAll();
    };
  }, []);

  return { registerDisposable, disposeAll };
};

export const triggerVramCleanup = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('snshero_dispose_inactive_vram'));
  }
};
