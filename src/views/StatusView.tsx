import React from 'react';
import { ArrowLeft, Activity, Server, Database, ShieldCheck, Cpu } from 'lucide-react';
import { Language, ViewType } from '../types';

export interface StatusViewProps {
  language: Language;
  onNavigate: (view: ViewType) => void;
  currentSeason?: string;
  lowSpecMode?: boolean;
}

export const StatusView: React.FC<StatusViewProps> = ({
  language,
  onNavigate,
  currentSeason = 'season1',
  lowSpecMode = false,
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
          {language === 'ko' ? '[ 시스템 상태 & 서버 모니터 ]' : '[ System Status & Server Monitor ]'}
        </span>
        <div className="w-16" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
        <div className="border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] p-4 rounded-none flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="font-bold flex items-center gap-2">
              <Server size={16} />
              {language === 'ko' ? '게임 클라이언트 엔진' : 'Game Client Engine'}
            </span>
            <span className="text-emerald-600 font-bold">ONLINE</span>
          </div>
          <span className="opacity-70">
            {language === 'ko' ? '버전: v2.1.0 (안정 빌드)' : 'Version: v2.1.0 (Stable)'}
          </span>
          <span className="opacity-70">
            {language === 'ko' ? `활성 시즌: ${currentSeason}` : `Active Season: ${currentSeason}`}
          </span>
        </div>

        <div className="border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] p-4 rounded-none flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="font-bold flex items-center gap-2">
              <Database size={16} />
              {language === 'ko' ? '로컬스토리지 무결성' : 'LocalStorage Integrity'}
            </span>
            <span className="text-emerald-600 font-bold">PASS</span>
          </div>
          <span className="opacity-70">
            {language === 'ko' ? '로컬 영구 보존 엔진 활성화' : 'Local Durable Storage Active'}
          </span>
          <span className="opacity-70">
            {language === 'ko' ? `저사양 모드: ${lowSpecMode ? 'ON' : 'OFF'}` : `Low Spec Mode: ${lowSpecMode ? 'ON' : 'OFF'}`}
          </span>
        </div>
      </div>
    </div>
  );
};

export default StatusView;
