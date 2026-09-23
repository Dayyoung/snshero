/**
 * QuickCommandLauncher.tsx - SCR-01-20
 * 100dvh 하단 스와이프 업 시 열리는 48px 스마트 퀵 커맨드 런처
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Search, Command, X, ArrowRight, Zap } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';
import { DeepLinkRouter, QuickCommand } from '../lib/DeepLinkRouter';

interface QuickCommandLauncherProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: string) => void;
}

export const QuickCommandLauncher: React.FC<QuickCommandLauncherProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const [query, setQuery] = useState('');
  const router = new DeepLinkRouter();
  const results = router.search(query);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col justify-end font-mono select-none">
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        className="bg-slate-950 border-t-2 border-amber-400 rounded-t-3xl p-5 max-w-lg mx-auto w-full flex flex-col gap-4 shadow-2xl"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Command size={18} className="text-amber-400" />
            <h3 className="text-sm font-black text-white">스마트 퀵 커맨드 런처</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-900 flex items-center justify-center text-slate-400 cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>

        {/* 48px Search Input */}
        <div className="relative w-full">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="화면 또는 기능 검색 (예: 덱, 주식, 랭킹)..."
            className="w-full h-12 bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-400"
            autoFocus
          />
          <Search size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
        </div>

        {/* Search Results */}
        <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
          {results.map((cmd) => (
            <button
              key={cmd.id}
              type="button"
              onClick={() => {
                triggerHaptic('medium');
                onNavigate(cmd.view);
                onClose();
              }}
              className="p-3 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 flex items-center justify-between text-left cursor-pointer active:scale-98 transition"
            >
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-amber-400/10 text-amber-400 text-[10px] font-bold">
                  {cmd.category}
                </span>
                <span className="text-xs font-bold text-white">{cmd.title}</span>
              </div>
              <ArrowRight size={14} className="text-slate-500" />
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
};
