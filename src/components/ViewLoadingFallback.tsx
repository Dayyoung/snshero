import React from 'react';
import { ViewType, Language } from '../types';

interface ViewLoadingFallbackProps {
  view?: ViewType | string;
  language?: Language;
  targetDurationMs?: number;
  onResetCache?: () => void;
  customMessage?: string;
  minProgress?: number;
}

/**
 * 화면 이동(Suspense) 시 인위적 딜레이 및 거대 캐싱 화면 없이
 * 부드럽고 가볍게 뷰 로딩을 대기하는 초경량 폴백 컴포넌트
 */
export const ViewLoadingFallback: React.FC<ViewLoadingFallbackProps> = ({ language }) => {
  const [isDelayed, setIsDelayed] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsDelayed(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex-1 w-full min-h-[40dvh] flex flex-col items-center justify-center p-4 select-none bg-[#fdfcfc] space-y-3">
      <div className="flex items-center gap-2 text-xs font-mono text-[#201d1d]/60">
        <span className="inline-block w-3.5 h-3.5 border-2 border-[#201d1d]/20 border-t-[#201d1d] rounded-full animate-spin" />
        <span>{language === 'ko' ? '화면 리소스 준비 중...' : 'Loading resources...'}</span>
      </div>

      {isDelayed && (
        <div className="flex flex-col items-center gap-2 pt-2 animate-fadeIn text-center">
          <p className="text-[11px] font-mono text-[#201d1d]/50">
            {language === 'ko'
              ? '네트워크 응답이 다소 지연되고 있습니다.'
              : 'Network response is taking longer than usual.'}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-3 py-1 text-[11px] font-mono font-bold bg-[#201d1d] text-[#fdfcfc] rounded-xs cursor-pointer hover:bg-stone-800 transition-colors"
          >
            {language === 'ko' ? '[ 새로고침 ]' : '[ Reload Page ]'}
          </button>
        </div>
      )}
    </div>
  );
};
