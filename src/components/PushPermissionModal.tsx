import React from 'react';
import { X, Bell } from 'lucide-react';

interface PushPermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept?: () => void;
}

export const PushPermissionModal: React.FC<PushPermissionModalProps> = ({
  isOpen,
  onClose,
  onAccept
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm p-4 rounded-sm border border-[#201d1d]/20 font-mono text-[#201d1d]">
        <div className="flex items-center justify-between pb-2 border-b border-[#201d1d]/10 mb-3">
          <div className="flex items-center gap-2 font-black text-sm">
            <Bell size={16} className="text-amber-500" />
            <span>푸시 알림 수신 설정</span>
          </div>
          <button type="button" onClick={onClose} className="p-1 hover:bg-[#201d1d]/5 rounded cursor-pointer">
            <X size={16} />
          </button>
        </div>
        <p className="text-xs text-[#201d1d]/70 mb-4">
          경기 결과, 마켓 체결, 무료 뽑기 리셋 알림을 실시간으로 수신합니다.
        </p>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-3 py-1.5 text-xs border border-[#201d1d]/20 rounded-sm">
            취소
          </button>
          <button
            type="button"
            onClick={() => {
              if (onAccept) onAccept();
              onClose();
            }}
            className="px-4 py-1.5 text-xs font-black bg-[#201d1d] text-white rounded-sm"
          >
            알림 허용
          </button>
        </div>
      </div>
    </div>
  );
};

export default PushPermissionModal;
