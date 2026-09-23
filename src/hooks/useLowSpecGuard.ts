import { useEffect } from 'react';

export function useLowSpecGuard(lowSpecMode: boolean): void {
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (lowSpecMode) {
      document.documentElement.classList.add('low-spec-mode');
    } else {
      document.documentElement.classList.remove('low-spec-mode');
    }
  }, [lowSpecMode]);
}

export default useLowSpecGuard;
