import React from 'react';
import { motion } from 'motion/react';
import { X, Bell, Sparkles, CheckCircle2, Gift } from 'lucide-react';

interface PushPermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
}

export const PushPermissionModal: React.FC<PushPermissionModalProps> = ({
  isOpen,
  onClose,
  onAccept
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 select-none font-mono">
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        className="w-full max-w-sm bg-[#fdfcfc] border-2 border-[#201d1d] p-5 rounded-none shadow-2xl space-y-4"
      >
        <div className="flex items-center justify-between border-b border-[rgba(15,0,0,0.12)] pb-2">
          <div className="flex items-center gap-2">
            <Bell size={18} className="text-amber-500" />
            <span className="text-xs font-black uppercase text-[#201d1d]">
              [웹 푸시 알림 혜택 동의]
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center border border-[rgba(15,0,0,0.12)] bg-white hover:bg-zinc-100 rounded-sm cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>

        <div className="text-center py-1 space-y-1">
          <div className="text-xl font-black text-[#201d1d]">
            동의 즉시 SSR 소환권 증정!
          </div>
          <p className="text-xs text-[#504a4a]">
            알림을 허용하시면 에너지 완충 알림과 매일 게릴라 핫타임 쿠폰을 보내드립니다.
          </p>
        </div>

        <div className="bg-amber-50/70 border border-amber-200 p-3 rounded-sm space-y-2 text-xs">
          <div className="flex items-center gap-2 font-bold text-[#201d1d]">
            <Gift size={14} className="text-amber-600" />
            <span>즉시 선물: SSR 확정 소환권 1장 + 500 SNS</span>
          </div>
          <div className="flex items-center gap-2 font-bold text-[#201d1d]">
            <CheckCircle2 size={14} className="text-amber-600" />
            <span>스마트 배터리 완충 & 게릴라 보스 출현 안내</span>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-white border border-[rgba(15,0,0,0.12)] text-[#504a4a] text-xs font-bold rounded-sm cursor-pointer hover:bg-zinc-50"
          >
            나중에
          </button>
          <button
            onClick={() => {
              onAccept();
              onClose();
            }}
            className="flex-2 py-2.5 bg-[#201d1d] hover:bg-zinc-800 text-white text-xs font-black rounded-sm border border-[#201d1d] cursor-pointer flex items-center justify-center gap-1.5 shadow-md active:scale-98"
          >
            <Sparkles size={14} className="text-amber-400" />
            <span>알림 켜고 보상 받기</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
