import React from 'react';
import { X, ShieldCheck } from 'lucide-react';

interface SupporterBadgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  isSupporter?: boolean;
  onPurchase?: () => void;
}

export const SupporterBadgeModal: React.FC<SupporterBadgeModalProps> = ({
  isOpen,
  onClose,
  isSupporter = false,
  onPurchase
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm p-4 rounded-sm border border-[#201d1d]/20 font-mono text-[#201d1d]">
        <div className="flex items-center justify-between pb-2 border-b border-[#201d1d]/10 mb-3">
          <div className="flex items-center gap-2 font-black text-sm">
            <ShieldCheck size={16} className="text-amber-500" />
            <span>서포터 배지</span>
          </div>
          <button type="button" onClick={onClose} className="p-1 hover:bg-[#201d1d]/5 rounded cursor-pointer">
            <X size={16} />
          </button>
        </div>
        <p className="text-xs text-[#201d1d]/70 mb-4">
          {isSupporter ? '이미 명예 서포터 배지를 보유 중입니다.' : '서포터 배지를 활성화하여 닉네임 골드 이펙트를 얻으세요.'}
        </p>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-3 py-1.5 text-xs border border-[#201d1d]/20 rounded-sm">
            닫기
          </button>
          {!isSupporter && onPurchase && (
            <button
              type="button"
              onClick={() => {
                onPurchase();
                onClose();
              }}
              className="px-4 py-1.5 text-xs font-black bg-amber-500 text-white rounded-sm"
            >
              배지 활성화
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupporterBadgeModal;
