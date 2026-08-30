/**
 * High-Performance Image & Texture Lazy Loader with WebP Fallback & LRU Cache
 * Task ID 555 / Row 658
 */

export interface CachedImage {
  src: string;
  img: HTMLImageElement;
  loaded: boolean;
  timestamp: number;
}

class ImageLazyLoaderEngine {
  private cache: Map<string, CachedImage> = new Map();
  private maxCacheSize: number = 120;
  private observer: IntersectionObserver | null = null;
  private supportsWebP: boolean | null = null;

  constructor() {
    this.checkWebPSupport();
    this.initIntersectionObserver();
  }

  private checkWebPSupport(): void {
    if (typeof window === 'undefined') return;
    try {
      const elem = document.createElement('canvas');
      if (elem.getContext && elem.getContext('2d')) {
        this.supportsWebP = elem.toDataURL('image/webp').indexOf('data:image/webp') === 0;
      } else {
        this.supportsWebP = false;
      }
    } catch {
      this.supportsWebP = false;
    }
  }

  public isWebPSupported(): boolean {
    return this.supportsWebP ?? true;
  }

  private initIntersectionObserver(): void {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const target = entry.target as HTMLElement;
            const dataSrc = target.getAttribute('data-src');
            if (dataSrc) {
              if (target instanceof HTMLImageElement) {
                target.src = dataSrc;
              } else {
                target.style.backgroundImage = `url('${dataSrc}')`;
              }
              target.removeAttribute('data-src');
              target.classList.add('loaded-asset');
            }
            this.observer?.unobserve(target);
          }
        });
      },
      {
        rootMargin: '100px 0px', // preload 100px before scrolling into view
        threshold: 0.01,
      }
    );
  }

  public observeElement(element: HTMLElement, src: string): void {
    if (!element) return;
    if (this.observer) {
      element.setAttribute('data-src', src);
      this.observer.observe(element);
    } else {
      if (element instanceof HTMLImageElement) {
        element.src = src;
      } else {
        element.style.backgroundImage = `url('${src}')`;
      }
    }
  }

  public unobserveElement(element: HTMLElement): void {
    if (!element || !this.observer) return;
    this.observer.unobserve(element);
  }

  public preloadImage(src: string): Promise<HTMLImageElement> {
    const cached = this.cache.get(src);
    if (cached && cached.loaded) {
      cached.timestamp = Date.now();
      return Promise.resolve(cached.img);
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.decoding = 'async';

      img.onload = () => {
        this.setCache(src, img);
        resolve(img);
      };

      img.onerror = (err) => {
        reject(err);
      };

      img.src = src;
    });
  }

  private setCache(src: string, img: HTMLImageElement): void {
    if (this.cache.size >= this.maxCacheSize) {
      // LRU eviction
      let oldestKey = '';
      let oldestTime = Infinity;
      this.cache.forEach((val, key) => {
        if (val.timestamp < oldestTime) {
          oldestTime = val.timestamp;
          oldestKey = key;
        }
      });
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(src, {
      src,
      img,
      loaded: true,
      timestamp: Date.now(),
    });
  }

  public prewarmSpriteAssets(assetUrls: string[]): void {
    if (typeof window === 'undefined') return;

    const loadBatch = () => {
      assetUrls.forEach((url) => {
        this.preloadImage(url).catch(() => {});
      });
    };

    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(loadBatch, { timeout: 2000 });
    } else {
      setTimeout(loadBatch, 300);
    }
  }
}

export const ImageLazyLoader = new ImageLazyLoaderEngine();
