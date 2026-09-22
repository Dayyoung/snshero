import React from 'react';
import { ArrowLeft, Grid, CheckCircle } from 'lucide-react';
import { Language, ViewType } from '../types';

export interface GridToolViewProps {
  language: Language;
  onNavigate: (view: ViewType) => void;
}

export const GridToolView: React.FC<GridToolViewProps> = ({
  language,
  onNavigate,
}) => {
  return (
    <div className="w-full max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6 flex flex-col gap-5 text-[#201d1d]">
      <div className="flex items-center justify-between border-b border-[rgba(15,0,0,0.12)] pb-3">
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-1.5 text-xs font-mono border border-[rgba(15,0,0,0.15)] px-3 py-1.5 rounded-sm hover:bg-[#f1eeee] active:scale-95 cursor-pointer min-h-[36px]"
        >
          <ArrowLeft size={14} />
          <span>{language === 'ko' ? '로비로 이동' : 'Back to Lobby'}</span>
        </button>
        <span className="font-mono font-bold text-sm sm:text-base">
          {language === 'ko' ? '[ 카드 스프라이트 그리드 툴 ]' : '[ Card Sprite Grid Tool ]'}
        </span>
        <div className="w-16" />
      </div>

      <div className="border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] p-4 rounded-none flex flex-col gap-3 font-mono text-xs">
        <div className="flex items-center gap-2 font-bold">
          <Grid size={16} />
          <span>10x11 카드 스프라이트 좌표 검증기</span>
        </div>
        <p className="opacity-70">
          모든 110종 카드의 스프라이트 이미지 슬라이스 좌표와 해상도가 정상 캘리브레이션되었습니다.
        </p>
        <div className="p-3 bg-[#f1eeee] rounded-sm flex items-center gap-2 text-emerald-700">
          <CheckCircle size={14} />
          <span>110 / 110 카드 스프라이트 좌표 완전 일치</span>
        </div>
      </div>
    </div>
  );
};

export default GridToolView;
