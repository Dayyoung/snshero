import React from 'react';
import { MessageSquare, ArrowLeft } from 'lucide-react';
import { Language } from '../types';

interface CommunityViewProps {
  onBack: () => void;
  language: Language;
}

export const CommunityView: React.FC<CommunityViewProps> = ({
  onBack,
  language
}) => {
  return (
    <div className="w-full max-w-lg mx-auto p-4 font-mono text-[#201d1d]">
      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-[#201d1d]/15">
        <button
          type="button"
          onClick={onBack}
          className="p-1 hover:bg-[#201d1d]/5 rounded cursor-pointer"
        >
          <ArrowLeft size={18} />
        </button>
        <h2 className="text-sm font-black">
          {language === 'ko' ? '히어로 커뮤니티' : 'Hero Community'}
        </h2>
      </div>
      <div className="p-4 border border-[#201d1d]/20 bg-white rounded-sm text-center">
        <MessageSquare size={24} className="mx-auto mb-2 text-blue-600" />
        <p className="text-xs text-[#201d1d]/70">
          {language === 'ko'
            ? '유저 팁, 덱 공략 및 PVP 배틀 코드를 공유하는 공식 라운지입니다.'
            : 'Official lounge to share deck builds, user tips, and battle replays.'}
        </p>
      </div>
    </div>
  );
};

export default CommunityView;
