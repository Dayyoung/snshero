import { useEffect, useRef } from 'react';

type DismissHandler = () => void;
const dismissStack: DismissHandler[] = [];

const isTextInputTarget = (el: EventTarget | null): boolean => {
  if (!el || !(el instanceof HTMLElement)) return false;
  const tag = el.tagName.toLowerCase();
  return tag === 'input' || tag === 'textarea' || el.isContentEditable;
};

if (typeof window !== 'undefined') {
  window.addEventListener(
    'keydown',
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && dismissStack.length > 0) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        const topHandler = dismissStack[dismissStack.length - 1];
        topHandler();
      }
    },
    true,
  );

  window.addEventListener(
    'contextmenu',
    (e: MouseEvent) => {
      // 텍스트 입력창 내부에서의 우클릭은 복사/붙여넣기를 위해 기본 메뉴 허용
      if (isTextInputTarget(e.target)) return;

      if (dismissStack.length > 0) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        const topHandler = dismissStack[dismissStack.length - 1];
        topHandler();
      }
    },
    true,
  );
}

/**
 * 모달/팝업이 열려있을 때 ESC 키 및 마우스 우클릭으로 최상위 모달을 순차 닫는 LIFO 훅
 */
export function useModalDismiss(isOpen: boolean, onDismiss: () => void) {
  const handlerRef = useRef(onDismiss);
  handlerRef.current = onDismiss;

  useEffect(() => {
    if (!isOpen) return;

    const handler: DismissHandler = () => {
      handlerRef.current();
    };

    dismissStack.push(handler);
    return () => {
      const idx = dismissStack.indexOf(handler);
      if (idx !== -1) {
        dismissStack.splice(idx, 1);
      }
    };
  }, [isOpen]);
}
