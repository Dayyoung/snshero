import React from 'react';
import { Settings, ArrowLeft, Globe, Monitor, Zap, Volume2, ShieldCheck } from 'lucide-react';
import { Language, ViewType } from '../types';

interface SettingRewardViewProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  sns: number;
  updateSns: (amount: number, reason: string) => void;
  playSfx: (sound: string) => void;
  onNavigate: (view: ViewType) => void;
  lowSpecMode?: boolean;
  onToggleLowSpecMode?: () => void;
  user?: any;
}

export const SettingRewardView: React.FC<SettingRewardViewProps> = ({
  language,
  onLanguageChange,
  sns,
  playSfx,
  onNavigate,
  lowSpecMode = false,
  onToggleLowSpecMode,
  user
}) => {
  const isKo = language === 'ko';

  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 font-mono select-none text-[#201d1d] min-h-[85dvh] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#201d1d]/15">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="p-2 border border-[#201d1d]/20 rounded-sm hover:bg-[#201d1d]/5 active:scale-95 transition-all text-xs font-bold flex items-center gap-1 cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>{isKo ? '로비' : 'Lobby'}</span>
          </button>
          <div>
            <h1 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
              <Settings size={18} className="text-stone-700" />
              <span>{isKo ? '환경설정 & 계정 센터' : 'Settings & Account Center'}</span>
            </h1>
            <p className="text-[11px] text-[#201d1d]/60">
              {isKo ? '언어, 그래픽 성능 및 계정 보안 설정을 관리합니다.' : 'Manage language, graphics, and account settings.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs border border-[#201d1d]/20 px-3 py-1.5 rounded-sm bg-stone-100 font-bold text-stone-900">
          <Zap size={14} className="text-amber-600" />
          <span>{sns} SNS</span>
        </div>
      </div>

      {/* Settings Sections */}
      <div className="space-y-4">
        {/* Language Setting */}
        <div className="p-4 border border-[#201d1d]/20 bg-white rounded-none flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Globe size={18} className="text-stone-600" />
            <div>
              <div className="text-xs sm:text-sm font-black text-[#201d1d]">{isKo ? '표시 언어' : 'Language'}</div>
              <div className="text-[11px] text-[#201d1d]/60">{isKo ? '게임 내 언어팩을 선택합니다.' : 'Select in-game language'}</div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                onLanguageChange('ko');
                playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-sm border cursor-pointer ${
                language === 'ko' ? 'bg-[#201d1d] text-white border-[#201d1d]' : 'border-[#201d1d]/20 hover:bg-[#201d1d]/5'
              }`}
            >
              한국어 (KO)
            </button>
            <button
              type="button"
              onClick={() => {
                onLanguageChange('en');
                playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-sm border cursor-pointer ${
                language === 'en' ? 'bg-[#201d1d] text-white border-[#201d1d]' : 'border-[#201d1d]/20 hover:bg-[#201d1d]/5'
              }`}
            >
              English (EN)
            </button>
          </div>
        </div>

        {/* Low Spec Graphics Mode */}
        <div className="p-4 border border-[#201d1d]/20 bg-white rounded-none flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Monitor size={18} className="text-stone-600" />
            <div>
              <div className="text-xs sm:text-sm font-black text-[#201d1d]">{isKo ? '저사양 그래픽 모드' : 'Low Spec Mode'}</div>
              <div className="text-[11px] text-[#201d1d]/60">{isKo ? '복잡한 파티클과 이펙트를 간소화하여 배터리를 절약합니다.' : 'Simplify animations to save battery'}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              if (onToggleLowSpecMode) onToggleLowSpecMode();
              playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
            }}
            className={`px-4 py-1.5 text-xs font-black rounded-sm border cursor-pointer ${
              lowSpecMode ? 'bg-amber-600 text-white border-amber-600' : 'border-[#201d1d]/20 hover:bg-[#201d1d]/5'
            }`}
          >
            {lowSpecMode ? (isKo ? 'ON (활성화)' : 'ON') : (isKo ? 'OFF (비활성화)' : 'OFF')}
          </button>
        </div>

        {/* Account Center Info */}
        <div className="p-4 border border-[#201d1d]/20 bg-white rounded-none flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <ShieldCheck size={18} className="text-stone-600" />
            <div>
              <div className="text-xs sm:text-sm font-black text-[#201d1d]">{isKo ? '계정 상태' : 'Account Status'}</div>
              <div className="text-[11px] text-[#201d1d]/60">{user ? user.email || user.displayName : (isKo ? '게스트 계정 (로컬스토리지 보존)' : 'Guest (LocalStorage)')}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('setting')}
            className="px-3 py-1.5 text-xs font-bold border border-[#201d1d]/20 rounded-sm hover:bg-[#201d1d]/5 cursor-pointer"
          >
            {isKo ? '상세 설정' : 'Details'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingRewardView;
