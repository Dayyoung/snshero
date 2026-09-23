/**
 * EmoteWheelRoomSkinModal.tsx - SCR-06-30
 * 모바일 햅틱 연동 '3D 애니메이티드 감정표현 이모티콘 휠(Taunt & Cheer)' 시스템 도입 및
 * 대전 룸 입장 시 출력되는 '전용 룸 입장 이펙트/사운드 스킨' 커스텀 상점 연동.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Smile, Sparkles, Volume2, ShieldCheck, X, Check } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

interface EmoteWheelRoomSkinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendEmote: (emote: string) => void;
  selectedSkinId: string;
  onSelectSkin: (skinId: string) => void;
}

const EMOTE_LIST = [
  { id: 'taunt', emoji: '😈', label: '도발' },
  { id: 'gg', emoji: '🤝', label: '인사' },
  { id: 'fire', emoji: '🔥', label: '열정' },
  { id: 'shock', emoji: '😱', label: '당황' },
  { id: 'crown', emoji: '👑', label: '승리' },
  { id: 'love', emoji: '❤️', label: '응원' },
];

const ROOM_SKINS = [
  { id: 'default', name: '기본 경기장', cost: '무료', desc: '표준 아레나 배경' },
  { id: 'cyberpunk', name: '네온 사이버 스타디움', cost: '1,500원', desc: '네온 홀로그램 컷인' },
  { id: 'volcano', name: '화산 결전장', cost: '1,500원', desc: '용암 폭발 입장 사운드' },
];

export const EmoteWheelRoomSkinModal: React.FC<EmoteWheelRoomSkinModalProps> = ({
  isOpen,
  onClose,
  onSendEmote,
  selectedSkinId,
  onSelectSkin,
}) => {
  const [activeTab, setActiveTab] = useState<'emotes' | 'skins'>('emotes');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 font-mono select-none overflow-hidden">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-slate-950 border-2 border-amber-400 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col text-center"
      >
        {/* Header */}
        <div className="p-3.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 flex items-center justify-between font-black text-xs">
          <div className="flex items-center gap-1.5">
            <Smile size={16} />
            <span>[ 이모티콘 휠 & 입장 스킨 커스텀 ]</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded bg-black/20 flex items-center justify-center cursor-pointer active:scale-95"
          >
            <X size={14} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 p-2 gap-1 bg-slate-900 border-b border-slate-800">
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setActiveTab('emotes');
            }}
            className={`h-9 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'emotes' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400'
            }`}
          >
            감정표현 휠
          </button>
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setActiveTab('skins');
            }}
            className={`h-9 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'skins' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400'
            }`}
          >
            입장 이펙트 스킨
          </button>
        </div>

        <div className="p-5 flex flex-col items-center gap-4">
          {activeTab === 'emotes' ? (
            /* Emote Wheel Grid */
            <div className="w-full grid grid-cols-3 gap-2.5">
              {EMOTE_LIST.map((emote) => (
                <button
                  key={emote.id}
                  type="button"
                  onClick={() => {
                    triggerHaptic('medium');
                    onSendEmote(emote.emoji);
                    onClose();
                  }}
                  className="h-20 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-2xl flex flex-col items-center justify-center p-2 cursor-pointer active:scale-90 shadow transition-transform"
                >
                  <span className="text-3xl">{emote.emoji}</span>
                  <span className="text-[10px] text-slate-300 font-bold mt-1">{emote.label}</span>
                </button>
              ))}
            </div>
          ) : (
            /* Room Entrance Skins */
            <div className="w-full flex flex-col gap-2">
              {ROOM_SKINS.map((skin) => (
                <div
                  key={skin.id}
                  onClick={() => {
                    triggerHaptic('light');
                    onSelectSkin(skin.id);
                  }}
                  className={`p-3 rounded-2xl border text-left flex items-center justify-between cursor-pointer transition-all ${
                    selectedSkinId === skin.id
                      ? 'bg-amber-500/10 border-amber-400 text-white shadow'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-black">
                      <Sparkles size={13} className="text-amber-400" />
                      <span>{skin.name}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 block mt-0.5">{skin.desc}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-amber-400">{skin.cost}</span>
                    {selectedSkinId === skin.id && (
                      <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center">
                        <Check size={14} />
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            className="h-10 w-full bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-xs rounded-xl active:scale-95 cursor-pointer border border-slate-800"
          >
            닫기
          </button>
        </div>
      </motion.div>
    </div>
  );
};
