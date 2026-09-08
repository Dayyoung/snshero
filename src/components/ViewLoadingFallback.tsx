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
export const ViewLoadingFallback: React.FC<ViewLoadingFallbackProps> = () => {
  return (
    <div className="flex-1 w-full min-h-[40dvh] flex items-center justify-center p-4 select-none bg-[#fdfcfc]">
      <div className="flex items-center gap-2 text-xs font-mono text-[#201d1d]/40">
        <span className="inline-block w-3 h-3 border border-[#201d1d]/30 border-t-[#201d1d] rounded-full animate-spin" />
        <span>Loading...</span>
      </div>
    </div>
  );
};
