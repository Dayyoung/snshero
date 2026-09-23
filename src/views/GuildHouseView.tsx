import React from 'react';
import { Shield, ArrowLeft, Users, Zap, Coffee, Award, Sparkles } from 'lucide-react';
import { Language, ViewType } from '../types';

interface GuildHouseViewProps {
  language: Language;
  sns: number;
  updateSns: (amount: number, reason: string) => void;
  playSfx: (sound: string) => void;
  onNavigate: (view: ViewType) => void;
  currentUser?: { uid: string; displayName?: string } | null;
  guildName?: string;
}

export const GuildHouseView: React.FC<GuildHouseViewProps> = ({
  language,
  sns,
  updateSns,
  playSfx,
  onNavigate,
  currentUser,
  guildName = '불사조 기사단'
}) => {
  const isKo = language === 'ko';

  const handleRest = () => {
    playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
    updateSns(10, '길드 아지트 휴식 보너스');
  };

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
              <Shield size={18} className="text-indigo-600" />
              <span>{guildName} {isKo ? '아지트' : 'Guild House'}</span>
            </h1>
            <p className="text-[11px] text-[#201d1d]/60">
              {isKo ? '길드원들과 휴식하고 협동 버프를 누리는 공간입니다.' : 'Relax and receive guild cooperation buffs.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs border border-[#201d1d]/20 px-3 py-1.5 rounded-sm bg-indigo-50 font-bold text-indigo-900">
          <Zap size={14} className="text-indigo-600" />
          <span>{sns} SNS</span>
        </div>
      </div>

      {/* Main Sanctuary Card */}
      <div className="border border-[#201d1d]/20 rounded-none bg-white p-6 mb-6 shadow-xs flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-full bg-indigo-100 border-2 border-indigo-400 flex items-center justify-center text-indigo-700 mb-3">
          <Coffee size={28} />
        </div>
        <h2 className="text-sm sm:text-base font-black mb-1">
          {isKo ? '길드 휴게 라운지' : 'Guild Lounge Sanctuary'}
        </h2>
        <p className="text-xs text-[#201d1d]/70 max-w-md mb-4">
          {isKo
            ? '오늘 하루 고된 전투를 마치고 동료들과 따뜻한 차 한 잔을 나누세요. 매일 1회 휴식 보너스가 지급됩니다.'
            : 'Take a break after fierce battles. Enjoy a daily guild relaxation reward.'}
        </p>

        <button
          type="button"
          onClick={handleRest}
          className="px-6 py-2.5 text-xs font-black bg-indigo-600 hover:bg-indigo-700 text-white rounded-sm active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
        >
          <Sparkles size={16} />
          <span>{isKo ? '휴식하고 +10 SNS 받기' : 'Rest & Receive +10 SNS'}</span>
        </button>
      </div>

      {/* Guild Facilities Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div 
          onClick={() => onNavigate('guild')}
          className="p-4 border border-[#201d1d]/20 bg-white rounded-none hover:border-indigo-500 cursor-pointer transition-all flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <Users size={20} className="text-indigo-600" />
            <div>
              <div className="text-xs font-black">{isKo ? '길드원 목록 & 관리' : 'Guild Members & Admin'}</div>
              <div className="text-[10px] text-[#201d1d]/50">{isKo ? '동료 현황 및 레이드 기여도 확인' : 'View members & raid stats'}</div>
            </div>
          </div>
          <span className="text-[10px] font-bold text-indigo-600">→</span>
        </div>

        <div 
          onClick={() => onNavigate('shop')}
          className="p-4 border border-[#201d1d]/20 bg-white rounded-none hover:border-indigo-500 cursor-pointer transition-all flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <Award size={20} className="text-amber-600" />
            <div>
              <div className="text-xs font-black">{isKo ? '길드 전용 상점' : 'Guild Shop'}</div>
              <div className="text-[10px] text-[#201d1d]/50">{isKo ? '길드 포인트로 한정 아이템 교환' : 'Exchange guild points for items'}</div>
            </div>
          </div>
          <span className="text-[10px] font-bold text-indigo-600">→</span>
        </div>
      </div>
    </div>
  );
};

export default GuildHouseView;
