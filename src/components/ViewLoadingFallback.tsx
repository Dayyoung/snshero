import React from 'react';

export const ViewLoadingFallback: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center p-8 min-h-[300px] font-mono text-[#201d1d]">
      <div className="w-8 h-8 border-2 border-[#201d1d]/20 border-t-[#201d1d] rounded-full animate-spin mb-3" />
      <span className="text-xs text-[#201d1d]/60">화면을 불러오는 중...</span>
    </div>
  );
};

export default ViewLoadingFallback;
