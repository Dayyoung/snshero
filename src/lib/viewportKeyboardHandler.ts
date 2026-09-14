/**
 * Row 1056 / ID 319: Mobile Virtual Keyboard Resize Glitch Prevention
 * Uses visualViewport API to detect virtual keyboard opening and protects
 * bottom navigation drawers and game boards from distortion or unexpected shifts.
 */

class ViewportKeyboardHandlerClass {
  private initialHeight: number = 0;
  private isInitialized: boolean = false;

  public init(): void {
    if (typeof window === 'undefined' || this.isInitialized) return;
    this.isInitialized = true;

    this.initialHeight = window.innerHeight;
    document.documentElement.style.setProperty('--initial-viewport-height', `${this.initialHeight}px`);

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', this.handleResize);
      window.visualViewport.addEventListener('scroll', this.handleScroll);
    }
  }

  private handleResize = (): void => {
    if (!window.visualViewport) return;

    const currentHeight = window.visualViewport.height;
    const heightDelta = this.initialHeight - currentHeight;

    // 키보드가 올라온 것으로 판단 (높이가 150px 이상 줄어듦)
    if (heightDelta > 150) {
      document.body.classList.add('keyboard-open');
      document.documentElement.style.setProperty('--keyboard-height', `${heightDelta}px`);
    } else {
      document.body.classList.remove('keyboard-open');
      document.documentElement.style.removeProperty('--keyboard-height');
    }
  };

  private handleScroll = (): void => {
    // Prevent mobile Safari auto-scrolling distortion on input focus
    if (document.body.classList.contains('keyboard-open') && window.scrollY > 0) {
      window.scrollTo(0, 0);
    }
  };
}

export const ViewportKeyboardHandler = new ViewportKeyboardHandlerClass();
