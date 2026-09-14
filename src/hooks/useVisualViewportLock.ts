/**
 * useVisualViewportLock.ts
 * 모바일 뷰포트 가상 키보드 활성화 시 레이아웃 찌그러짐 방지 커스텀 훅
 * (구글 스프레드시트 Row 1056 / ID 319 요구사항 구현)
 */

import { useEffect, useState } from 'react';

export interface VisualViewportState {
  isKeyboardOpen: boolean;
  viewportHeight: number;
  viewportOffsetTop: number;
}

export function useVisualViewportLock(): VisualViewportState {
  const [viewportState, setViewportState] = useState<VisualViewportState>(() => ({
    isKeyboardOpen: false,
    viewportHeight: typeof window !== 'undefined' ? window.innerHeight : 0,
    viewportOffsetTop: 0,
  }));

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const initialHeight = window.innerHeight;

    const handleResize = () => {
      if (!window.visualViewport) {
        const currentHeight = window.innerHeight;
        const isKeyboard = currentHeight < initialHeight * 0.82;
        setViewportState({
          isKeyboardOpen: isKeyboard,
          viewportHeight: currentHeight,
          viewportOffsetTop: 0,
        });
        return;
      }

      const vv = window.visualViewport;
      // 화면 높이가 초기 높이의 82% 미만으로 줄어들면 가상 키보드로 판별
      const isKeyboard = vv.height < initialHeight * 0.82;

      setViewportState({
        isKeyboardOpen: isKeyboard,
        viewportHeight: vv.height,
        viewportOffsetTop: vv.offsetTop,
      });

      // 바디 스크롤 및 튀는 현상 제어
      if (isKeyboard) {
        document.body.classList.add('virtual-keyboard-active');
      } else {
        document.body.classList.remove('virtual-keyboard-active');
      }
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
      window.visualViewport.addEventListener('scroll', handleResize);
    } else {
      window.addEventListener('resize', handleResize);
    }

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize);
        window.visualViewport.removeEventListener('scroll', handleResize);
      } else {
        window.removeEventListener('resize', handleResize);
      }
      document.body.classList.remove('virtual-keyboard-active');
    };
  }, []);

  return viewportState;
}
