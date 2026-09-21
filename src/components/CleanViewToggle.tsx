/**
 * CleanViewToggle.tsx - SCR-01-14
 * 1-Tap 클린 뷰 (Clean View) 갤러리 모드 토글 컴포넌트
 */

import React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

interface CleanViewToggleProps {
  isCleanView: boolean;
  onToggle: () => void;
  language?: string;
}

export const CleanViewToggle: React.FC<CleanViewToggleProps> = ({ isCleanView, onToggle, language = 'ko' }) => {
  return (
    <button
      type="button"
      onClick={() => {
        triggerHaptic('medium');
        onToggle();
      }}
      className={`fixed top-4 right-4 z-[999] p-2 rounded-full border transition-all cursor-pointer shadow-lg backdrop-blur-md ${
        isCleanView
          ? 'bg-amber-500/90 border-amber-300 text-slate-950 animate-pulse'
          : 'bg-slate-900/70 border-slate-700 text-slate-300 hover:text-white'
      }`}
      title={isCleanView ? (language === 'ko' ? 'UI 복원' : 'Restore UI') : (language === 'ko' ? '클린 뷰 (UI 숨기기)' : 'Clean View')}
    >
      {isCleanView ? <EyeOff size={18} /> : <Eye size={18} />}
    </button>
  );
};
