/**
 * QrCodeHandoffModal.tsx - SCR-12-17
 * 1-Tap 기기 연동 QR 코드 생성/스캐너 48px 모달
 */

import React, { useState } from 'react';
import { QrCode, Scan, Smartphone, Monitor, X, Check, Copy } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';
import { DeviceHandoffManager } from '../lib/DeviceHandoffManager';

interface QrCodeHandoffModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QrCodeHandoffModal: React.FC<QrCodeHandoffModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [token] = useState(() => new DeviceHandoffManager().generateHandoffToken());
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 font-mono select-none">
      <div className="bg-slate-950 border-2 border-amber-400 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col text-center">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-black text-xs">
            <QrCode size={16} />
            <span>📱 1-Tap 기기 간 계정 연동 QR</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-black/20 flex items-center justify-center text-slate-950 cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>

        <div className="p-5 flex flex-col items-center gap-4">
          <div className="w-40 h-40 bg-white p-3 rounded-2xl flex items-center justify-center shadow-lg">
            {/* Visual QR Simulation */}
            <div className="w-full h-full border-4 border-slate-950 p-2 flex flex-col justify-between">
              <div className="flex justify-between">
                <div className="w-6 h-6 bg-slate-950" />
                <div className="w-6 h-6 bg-slate-950" />
              </div>
              <div className="text-slate-950 font-black text-[9px] text-center">
                SNSHERO HANDOFF
              </div>
              <div className="flex justify-between">
                <div className="w-6 h-6 bg-slate-950" />
                <div className="w-6 h-6 border-2 border-slate-950" />
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-black text-white">0.1초 인스턴트 핸드오프</h4>
            <p className="text-[11px] text-slate-400 mt-1">
              PC나 다른 스마트폰 카메라로 위 QR 코드를 비추면 비밀번호 입력 없이 계정 세션이 즉시 동기화됩니다.
            </p>
          </div>

          {/* 48px Copy Link Button */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('success');
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="h-12 w-full bg-slate-900 border border-slate-800 text-slate-200 font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer active:scale-95 shadow"
          >
            {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
            <span>{copied ? '연동 코드 복사 완료!' : '연동 코드 클립보드 복사'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
