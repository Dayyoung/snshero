import React from 'react';
import { Grid, ArrowLeft } from 'lucide-react';
import { Language } from '../types';

interface GridToolViewProps {
  language: Language;
  onNavigate: (view: any) => void;
}

export const GridToolView: React.FC<GridToolViewProps> = ({
  language,
  onNavigate
}) => {
  return (
    <div className="w-full max-w-lg mx-auto p-4 font-mono text-[#201d1d]">
      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-[#201d1d]/15">
        <button
          type="button"
          onClick={() => onNavigate('home')}
          className="p-1 hover:bg-[#201d1d]/5 rounded cursor-pointer"
        >
          <ArrowLeft size={18} />
        </button>
        <h2 className="text-sm font-black">
          {language === 'ko' ? '그리드 정렬 도구' : 'Grid Layout Tool'}
        </h2>
      </div>
      <div className="p-4 border border-[#201d1d]/20 bg-white rounded-sm text-center">
        <Grid size={24} className="mx-auto mb-2 text-indigo-600" />
        <p className="text-xs text-[#201d1d]/70">
          {language === 'ko' ? '모바일 레이아웃 무결성 검사기' : 'Mobile Layout Verifier'}
        </p>
      </div>
    </div>
  );
};

export default GridToolView;
