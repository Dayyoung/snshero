import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Volume2, VolumeX, MessageSquare, X, Flame, Zap, ThumbsUp, Shield, Frown, Smile } from 'lucide-react';
import { Language } from '../types';
import { cn } from '../lib/utils';

export interface EmoteItem {
  id: string;
  emoji: string;
  labelKo: string;
  labelEn: string;
  icon?: React.ReactNode;
}

export const BATTLE_EMOTES: EmoteItem[] = [
  { id: 'emote-gg', emoji: '👍', labelKo: '좋은 게임! (GG)', labelEn: 'Good Game! (GG)' },
  { id: 'emote-fire', emoji: '🔥', labelKo: '뜨거운 승부!', labelEn: 'Hot Match!' },
  { id: 'emote-zap', emoji: '⚡', labelKo: '번개 일격!', labelEn: 'Thunder Strike!' },
  { id: 'emote-taunt', emoji: '😈', labelKo: '도발하기!', labelEn: 'Taunt Opponent!' },
  { id: 'emote-cry', emoji: '😭', labelKo: '아쉽다!', labelEn: 'Too Close!' },
  { id: 'emote-shield', emoji: '🛡️', labelKo: '철벽 방어!', labelEn: 'Iron Defense!' },
];

interface InBattleEmoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  onSendEmote: (emote: EmoteItem) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  playSfx: (url: string) => void;
}

export const InBattleEmoteModal: React.FC<InBattleEmoteModalProps> = ({
  isOpen,
  onClose,
  language,
  onSendEmote,
  isMuted,
  onToggleMute,
  playSfx,
}) => {
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);
  const [lockedRemaining, setLockedRemaining] = useState<number>(0);
  const [recentTimestamps, setRecentTimestamps] = useState<number[]>([]);

  useEffect(() => {
    if (cooldownRemaining <= 0) return;
    const timer = setTimeout(() => setCooldownRemaining((prev) => Math.max(0, prev - 1)), 1000);
    return () => clearTimeout(timer);
  }, [cooldownRemaining]);

  useEffect(() => {
    if (lockedRemaining <= 0) return;
    const timer = setTimeout(() => setLockedRemaining((prev) => Math.max(0, prev - 1)), 1000);
    return () => clearTimeout(timer);
  }, [lockedRemaining]);

  const handleTriggerEmote = (emote: EmoteItem) => {
    if (cooldownRemaining > 0 || lockedRemaining > 0) return;

    const now = Date.now();
    const updated = [...recentTimestamps.filter((t) => now - t < 10000), now];
    setRecentTimestamps(updated);

    if (updated.length >= 4) {
      // 10초 내 4회 이상 트리거 시 30초 잠금
      setLockedRemaining(30);
      setCooldownRemaining(30);
    } else {
      setCooldownRemaining(4);
    }

    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    onSendEmote(emote);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[210] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 10 }}
          className="bg-white rounded-3xl max-w-sm w-full border border-slate-200 shadow-2xl p-5 space-y-4"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b pb-3 border-slate-100">
            <div className="flex items-center gap-2">
              <MessageSquare size={18} className="text-indigo-600" />
              <h3 className="font-black text-sm text-slate-900">
                {language === 'ko' ? '감정 표현 (In-Battle Emotes)' : 'In-Battle Emotes'}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-700 rounded-full cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* 쿨다운 및 잠금 경고 배너 */}
          {lockedRemaining > 0 && (
            <div className="p-2 bg-rose-50 border border-rose-200 rounded-xl text-center">
              <span className="text-[11px] font-bold text-rose-600">
                ⚠️ {language === 'ko' ? `과도한 감정표현으로 ${lockedRemaining}초간 잠김` : `Rate limited for ${lockedRemaining}s`}
              </span>
            </div>
          )}
          {cooldownRemaining > 0 && lockedRemaining <= 0 && (
            <div className="p-1.5 bg-amber-50 border border-amber-200 rounded-lg text-center">
              <span className="text-[10px] font-mono text-amber-700">
                ⏳ {language === 'ko' ? `재사용 대기: ${cooldownRemaining}초` : `Cooldown: ${cooldownRemaining}s`}
              </span>
            </div>
          )}

          {/* Emotes Grid */}
          <div className="grid grid-cols-3 gap-2.5">
            {BATTLE_EMOTES.map(emote => (
              <button
                key={emote.id}
                disabled={cooldownRemaining > 0 || lockedRemaining > 0}
                onClick={() => handleTriggerEmote(emote)}
                className={cn(
                  "p-3 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col items-center gap-1 transition-all cursor-pointer group",
                  cooldownRemaining > 0 || lockedRemaining > 0
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-indigo-50 hover:border-indigo-300 active:scale-95"
                )}
              >
                <span className="text-2xl group-hover:scale-110 transition-transform">
                  {emote.emoji}
                </span>
                <span className="text-[10px] font-bold text-slate-700 group-hover:text-indigo-600 text-center truncate w-full">
                  {language === 'ko' ? emote.labelKo : emote.labelEn}
                </span>
              </button>
            ))}
          </div>

          {/* Mute Speaker Toggle (Item 34) */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
              {isMuted ? <VolumeX size={16} className="text-rose-500" /> : <Volume2 size={16} className="text-indigo-600" />}
              <span>
                {language === 'ko' 
                  ? (isMuted ? '상대 감정표현 차단됨 (Muted)' : '감정표현 수신 중 (Active)') 
                  : (isMuted ? 'Opponent Muted' : 'Emotes Unmuted')}
              </span>
            </div>

            <button
              onClick={() => {
                playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
                onToggleMute();
              }}
              className={cn(
                "px-3 py-1.5 rounded-xl font-black text-xs transition-all cursor-pointer shadow-xs",
                isMuted
                  ? "bg-rose-600 text-white hover:bg-rose-700"
                  : "bg-slate-200 text-slate-700 hover:bg-slate-300"
              )}
            >
              {isMuted ? (language === 'ko' ? '차단 해제' : 'Unmute') : (language === 'ko' ? '차단하기' : 'Mute')}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
