/**
 * CustomMatchModal.tsx
 * 친선전 6자리 비공개 룸 코드 생성 및 참여 모달
 * (백로그 ID 450: 친선전 6자리 비공개 룸 코드 생성 및 입장 시스템)
 */

import React, { useState } from 'react';
import { Copy, Check, Users, Key, ArrowRight, X } from 'lucide-react';

interface CustomMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartCustomMatch: (roomCode: string, isHost: boolean) => void;
  language?: string;
}

export const CustomMatchModal: React.FC<CustomMatchModalProps> = ({
  isOpen,
  onClose,
  onStartCustomMatch,
  language = 'ko',
}) => {
  const isKo = language === 'ko';
  const [createdCode, setCreatedCode] = useState<string>(() => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  });
  const [inputCode, setInputCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');

  if (!isOpen) return null;

  const handleCopyCode = () => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(createdCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleGenerateNew = () => {
    setCreatedCode(Math.random().toString(36).substring(2, 8).toUpperCase());
    setCopied(false);
  };

  const handleJoin = () => {
    const clean = inputCode.trim().toUpperCase();
    if (clean.length < 4) return;
    onStartCustomMatch(clean, false);
  };

  return (
    <div className="fixed inset-0 z-[10020] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 font-mono select-none">
      <div className="bg-[#fdfcfc] dark:bg-[#181616] border border-[#201d1d]/20 dark:border-white/20 p-5 rounded-none max-w-sm w-full shadow-2xl space-y-4 text-[#201d1d] dark:text-[#fdfcfc]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#201d1d]/10 dark:border-white/10 pb-2">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-amber-500" />
            <h3 className="font-black text-sm uppercase tracking-wider">
              {isKo ? '친선 대전 비공개 룸' : 'Custom Room Match'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#201d1d]/5 dark:hover:bg-white/5 cursor-pointer text-xs"
          >
            [x]
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            onClick={() => setActiveTab('create')}
            className={`py-2 text-center font-bold border cursor-pointer transition-colors ${
              activeTab === 'create'
                ? 'bg-[#201d1d] text-[#fdfcfc] dark:bg-white dark:text-[#201d1d] border-[#201d1d] dark:border-white'
                : 'border-[#201d1d]/20 dark:border-white/20 opacity-70 hover:opacity-100'
            }`}
          >
            {isKo ? '방 만들기 (호스트)' : 'Create Room'}
          </button>
          <button
            onClick={() => setActiveTab('join')}
            className={`py-2 text-center font-bold border cursor-pointer transition-colors ${
              activeTab === 'join'
                ? 'bg-[#201d1d] text-[#fdfcfc] dark:bg-white dark:text-[#201d1d] border-[#201d1d] dark:border-white'
                : 'border-[#201d1d]/20 dark:border-white/20 opacity-70 hover:opacity-100'
            }`}
          >
            {isKo ? '방 참가 (코드 입력)' : 'Join Room'}
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'create' ? (
          <div className="space-y-3 pt-2 text-center">
            <p className="text-[11px] opacity-75">
              {isKo
                ? '아래 6자리 코드를 친구에게 전달하고 대기를 시작하세요.'
                : 'Share this 6-digit code with your friend to start.'}
            </p>

            <div className="bg-[#201d1d]/5 dark:bg-white/5 border border-dashed border-[#201d1d]/30 dark:border-white/30 p-3 flex items-center justify-center gap-3">
              <span className="font-mono text-xl font-black tracking-widest text-amber-600 dark:text-amber-400">
                {createdCode}
              </span>
              <button
                onClick={handleCopyCode}
                className="px-2 py-1 bg-[#201d1d] dark:bg-white text-[#fdfcfc] dark:text-[#201d1d] text-[10px] font-bold flex items-center gap-1 cursor-pointer active:scale-95"
                title="Copy Code"
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
                <span>{copied ? (isKo ? '복사됨' : 'Copied') : (isKo ? '복사' : 'Copy')}</span>
              </button>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleGenerateNew}
                className="flex-1 py-2 text-[11px] border border-[#201d1d]/20 dark:border-white/20 hover:bg-[#201d1d]/5 font-bold cursor-pointer"
              >
                {isKo ? '새 코드 발급' : 'New Code'}
              </button>
              <button
                onClick={() => onStartCustomMatch(createdCode, true)}
                className="flex-1 py-2 text-[11px] bg-amber-500 hover:bg-amber-400 text-stone-950 font-black cursor-pointer shadow-sm"
              >
                {isKo ? '매칭 대기 시작' : 'Wait for Rival'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3 pt-2">
            <p className="text-[11px] opacity-75">
              {isKo
                ? '친구가 알려준 6자리 룸 코드를 입력하세요.'
                : 'Enter the 6-digit room code from your friend.'}
            </p>

            <div className="flex items-center gap-2 border border-[#201d1d]/30 dark:border-white/30 p-2">
              <Key size={14} className="text-stone-400" />
              <input
                type="text"
                maxLength={6}
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                placeholder="예: A8F2K9"
                className="w-full bg-transparent outline-none font-mono text-sm tracking-widest font-black uppercase text-[#201d1d] dark:text-white"
              />
            </div>

            <button
              onClick={handleJoin}
              disabled={inputCode.trim().length < 4}
              className={`w-full py-2.5 text-xs font-black uppercase flex items-center justify-center gap-1.5 transition-all ${
                inputCode.trim().length >= 4
                  ? 'bg-amber-500 hover:bg-amber-400 text-stone-950 cursor-pointer'
                  : 'bg-stone-300 dark:bg-stone-800 text-stone-500 cursor-not-allowed opacity-50'
              }`}
            >
              <span>{isKo ? '룸 입장하기' : 'Enter Room'}</span>
              <ArrowRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
