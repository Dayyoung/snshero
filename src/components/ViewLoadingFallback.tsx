import React from 'react';
import { ViewType, Language } from '../types';
import { Loader2 } from 'lucide-react';

interface ViewLoadingFallbackProps {
  view?: ViewType;
  language?: Language;
}

export const ViewLoadingFallback: React.FC<ViewLoadingFallbackProps> = ({
  view,
  language = 'ko',
}) => {
  return (
    <div className="w-full h-full min-h-[50vh] flex flex-col items-center justify-center gap-3 p-6 text-[#201d1d]">
      <Loader2 className="w-8 h-8 animate-spin opacity-60" />
      <span className="text-xs font-mono tracking-wider opacity-70">
        {language === 'ko' ? '화면 데이터를 불러오는 중...' : 'Loading view data...'}
      </span>
    </div>
  );
};

export default ViewLoadingFallback;
