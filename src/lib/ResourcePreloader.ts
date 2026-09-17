/**
 * SNSHero Revolution - Resource Priority Preloader
 * SCR-01-07: 핵심 카드 스프라이트 및 셰이더 우선순위 청크 분할 사전 로드 및
 * requestIdleCallback을 활용한 비차단 백그라운드 지연 초기화
 */

export class ResourcePriorityPreloader {
  private static preloadedImages: Set<string> = new Set();
  private static isPreloading = false;

  public static preloadCriticalAssets(): void {
    if (typeof window === 'undefined' || this.isPreloading) return;
    this.isPreloading = true;

    // 1. 핵심 팩션 대표 카드 5종 (최우선 즉시 프리로드)
    const criticalSprites = [
      '/card1.png',
      '/card11.png',
      '/card31.png',
      '/card51.png',
      '/card101.png',
    ];

    criticalSprites.forEach(src => {
      this.preloadImage(src, 'high');
    });

    // 2. 비핵심 보조 에셋은 브라우저 유휴 시간(Idle Callback)에 지연 로딩
    const scheduleIdle = typeof window.requestIdleCallback === 'function'
      ? window.requestIdleCallback
      : (cb: () => void) => setTimeout(cb, 200);

    scheduleIdle(() => {
      const secondarySprites = [
        '/card2.png',
        '/card3.png',
        '/card12.png',
        '/card32.png',
        '/card52.png',
      ];
      secondarySprites.forEach(src => {
        this.preloadImage(src, 'low');
      });
    });
  }

  private static preloadImage(src: string, priority: 'high' | 'low'): void {
    if (this.preloadedImages.has(src)) return;
    this.preloadedImages.add(src);

    const img = new Image();
    // @ts-ignore fetchPriority support
    if ('fetchPriority' in img) {
      // @ts-ignore
      img.fetchPriority = priority;
    }
    img.src = src;
  }
}
