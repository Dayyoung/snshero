/**
 * FireworksLauncherModal.tsx - SCR-01-27
 * 메인 화면 밤하늘에 커스텀 축하 메시지를 띄우는 '전 서버 불꽃놀이 발사기' 및 광장 축제 축하 폭죽 세트(500원)
 */

import React, { useState } from 'react';
import { Sparkles, Send, Flame, X } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

interface FireworksLauncherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunchFireworks: (message: string) => void;
  onBuyFireworksSet: () => void;
}

export const FireworksLauncherModal: React.FC<FireworksLauncherModalProps> = ({
  isOpen,
  onClose,
  onLaunchFireworks,
  onBuyFireworksSet,
}) => {
  const [msg, setMsg] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 font-mono select-none">
      <div className="bg-slate-950 border-2 border-amber-400 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col text-center">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-black text-xs">
            <Sparkles size={16} />
            <span>🎆 전 서버 불꽃놀이 축제</span>
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
          <div className="w-16 h-16 rounded-2xl bg-amber-400/20 border-2 border-amber-400 flex items-center justify-center text-amber-400 text-3xl shadow-lg">
            🎇
          </div>

          <div>
            <h4 className="text-sm font-black text-white">밤하늘에 희망의 불꽃을 쏘아 올리세요!</h4>
            <p className="text-[11px] text-slate-400 mt-1">
              입력하신 축하 메시지가 메인 로비 광장의 모든 유저에게 화려한 황금 불꽃놀이와 함께 공유됩니다.
            </p>
          </div>

          {/* Input */}
          <input
            type="text"
            maxLength={20}
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            placeholder="축하 메시지 (최대 20자)"
            className="h-11 w-full bg-slate-900 border border-slate-700 rounded-xl px-3 text-center text-xs font-bold text-white outline-none focus:border-amber-400"
          />

          {/* 48px Action Button */}
          <button
            type="button"
            disabled={!msg.trim()}
            onClick={() => {
              triggerHaptic('heavy');
              onLaunchFireworks(msg.trim());
              onClose();
            }}
            className="h-12 w-full bg-gradient-to-r from-amber-500 to-yellow-500 disabled:opacity-50 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer shadow-lg"
          >
            <Send size={16} />
            <span>불꽃 쏘아 올리기</span>
          </button>

          {/* Fireworks Set (SCR-01-27) */}
          <div className="w-full p-2.5 bg-amber-950/40 border border-amber-500/40 rounded-xl text-left flex items-center justify-between">
            <div>
              <span className="text-xs font-black text-amber-300 block">광장 축제 축하 폭죽 세트</span>
              <span className="text-[9px] text-slate-400">황금 불꽃놀이 5회권 & 다이아 300개</span>
            </div>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('medium');
                onBuyFireworksSet();
                onClose();
              }}
              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-black rounded-lg cursor-pointer active:scale-95 shadow"
            >
              구매 (100 SNS)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
