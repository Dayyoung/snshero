/**
 * LazyAvatarLoader.ts - SCR-11-25
 * 아바타 및 대표 카드 썸네일 이미지 지연 로딩(IntersectionObserver) 및 메모리 캐싱 모듈.
 * HTTP 동기 로딩 워터폴을 방지하고 스크롤 60fps를 유지하는 초경량 로더.
 */

export class LazyAvatarLoader {
  private static observer: IntersectionObserver | null = null;
  private static cache = new Set<string>();

  static observe(imgElement: HTMLImageElement, src: string): void {
    if (this.cache.has(src)) {
      imgElement.src = src;
      return;
    }

    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      imgElement.src = src;
      return;
    }

    if (!this.observer) {
      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const img = entry.target as HTMLImageElement;
              const actualSrc = img.dataset.src;
              if (actualSrc) {
                img.src = actualSrc;
                LazyAvatarLoader.cache.add(actualSrc);
                delete img.dataset.src;
              }
              LazyAvatarLoader.observer?.unobserve(img);
            }
          });
        },
        { rootMargin: '100px' }
      );
    }

    imgElement.dataset.src = src;
    imgElement.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="%231e293b"/>';
    this.observer.observe(imgElement);
  }

  static clearCache(): void {
    this.cache.clear();
  }
}
