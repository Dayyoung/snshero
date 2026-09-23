import React from 'react';
import { X, Castle } from 'lucide-react';

interface GuildLandmarkFundingModalProps {
  isOpen: boolean;
  onClose: () => void;
  userSns: number;
  onContribute?: (amount: number) => void;
}

export const GuildLandmarkFundingModal: React.FC<GuildLandmarkFundingModalProps> = ({
  isOpen,
  onClose,
  userSns,
  onContribute
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm p-4 rounded-sm border border-[#201d1d]/20 font-mono text-[#201d1d]">
        <div className="flex items-center justify-between pb-2 border-b border-[#201d1d]/10 mb-3">
          <div className="flex items-center gap-2 font-black text-sm">
            <Castle size={16} className="text-indigo-600" />
            <span>길드 랜드마크 펀딩</span>
          </div>
          <button type="button" onClick={onClose} className="p-1 hover:bg-[#201d1d]/5 rounded cursor-pointer">
            <X size={16} />
          </button>
        </div>
        <p className="text-xs text-[#201d1d]/70 mb-4">
          길드원들과 힘을 모아 랜드마크를 건설하고 전체 길드 버프를 활성화하세요.
        </p>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-3 py-1.5 text-xs border border-[#201d1d]/20 rounded-sm">
            닫기
          </button>
          {onContribute && (
            <button
              type="button"
              onClick={() => {
                onContribute(50);
                onClose();
              }}
              disabled={userSns < 50}
              className="px-4 py-1.5 text-xs font-black bg-indigo-600 text-white rounded-sm disabled:opacity-40"
            >
              50 SNS 기부
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default GuildLandmarkFundingModal;
