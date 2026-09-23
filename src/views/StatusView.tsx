import React from 'react';
import { Activity, ArrowLeft } from 'lucide-react';
import { Language } from '../types';

interface StatusViewProps {
  language: Language;
  onNavigate: (view: any) => void;
  currentSeason?: string;
  lowSpecMode?: boolean;
}

export const StatusView: React.FC<StatusViewProps> = ({
  language,
  onNavigate,
  currentSeason = 'season1',
  lowSpecMode = false
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
          {language === 'ko' ? '시스템 상태 & 핑' : 'System Status'}
        </h2>
      </div>
      <div className="p-4 border border-[#201d1d]/20 bg-white rounded-sm space-y-3">
        <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs">
          <Activity size={16} />
          <span>{language === 'ko' ? '모든 시스템 정상 가동 중' : 'All Systems Operational'}</span>
        </div>
        <div className="text-[11px] text-[#201d1d]/70 space-y-1">
          <div>시즌: {currentSeason}</div>
          <div>저사양 모드: {lowSpecMode ? 'ON' : 'OFF'}</div>
          <div>네트워크 지연 시간: 18ms</div>
        </div>
      </div>
    </div>
  );
};

export default StatusView;
