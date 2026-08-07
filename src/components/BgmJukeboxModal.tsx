import React from 'react';
import { Music, X, Play, Check, Disc } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BGM_TRACKS } from '../lib/audioConstants';
import { Language } from '../types';
import { t } from '../lib/i18n';
import { cn } from '../lib/utils';
import { triggerHaptic } from '../lib/haptic';

interface BgmJukeboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTrackId: string;
  onSelectTrack: (trackId: string) => void;
  language: Language;
}

export const BgmJukeboxModal: React.FC<BgmJukeboxModalProps> = ({
  isOpen,
  onClose,
  currentTrackId,
  onSelectTrack,
  language
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-md rounded-2xl border-2 border-slate-800 bg-slate-900 p-5 text-white shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
                <Disc size={20} className="animate-spin-slow" />
              </div>
              <div>
                <h3 className="font-mono text-base font-bold tracking-tight text-white">
                  {language === 'ko' ? 'BGM 주크박스' : 'BGM Jukebox'}
                </h3>
                <p className="text-[10px] text-slate-400 font-mono">
                  {language === 'ko' ? '메인 로비 및 배경 음악 선택' : 'Select background music track'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Track List */}
          <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
            {BGM_TRACKS.map((track) => {
              const isSelected = track.id === currentTrackId;
              const title = track.name[language] || track.name['en'] || track.name['ko'];

              return (
                <div
                  key={track.id}
                  onClick={() => {
                    onSelectTrack(track.id);
                    triggerHaptic('light');
                  }}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer select-none",
                    isSelected
                      ? "border-indigo-500 bg-indigo-500/15 text-white shadow-md shadow-indigo-500/10"
                      : "border-slate-800 bg-slate-950/50 hover:bg-slate-800/60 text-slate-300"
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-mono text-xs font-bold",
                      isSelected ? "bg-indigo-500 text-white" : "bg-slate-800 text-slate-400"
                    )}>
                      {isSelected ? <Play size={14} className="fill-current" /> : <Music size={14} />}
                    </div>
                    <div className="min-w-0 flex flex-col">
                      <span className="font-mono text-xs font-bold truncate">
                        {title}
                      </span>
                      <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">
                        BY {track.author}
                      </span>
                    </div>
                  </div>

                  {isSelected && (
                    <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-indigo-400 bg-indigo-500/20 px-2.5 py-1 rounded-full border border-indigo-500/30">
                      <Check size={12} />
                      {language === 'ko' ? '재생 중' : 'Playing'}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-mono font-bold transition-all"
            >
              {language === 'ko' ? '확인' : 'Close'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
