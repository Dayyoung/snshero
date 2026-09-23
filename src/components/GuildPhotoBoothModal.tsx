/**
 * GuildPhotoBoothModal.tsx - SCR-09-20
 * 1-Tap 단체 포토부스(48px) 모달로 길드원이 포디움에 정렬되어 9:16 숏폼 스크린샷 카드 생성
 */

import React, { useState } from 'react';
import { Camera, Download, Sparkles, X, Check, Users } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';
import { AutoPoseAligner, GuildMemberAvatar } from './AutoPoseAligner';

interface GuildPhotoBoothModalProps {
  isOpen: boolean;
  onClose: () => void;
  guildName: string;
  members: { id: string; name: string; role: string }[];
}

export const GuildPhotoBoothModal: React.FC<GuildPhotoBoothModalProps> = ({
  isOpen,
  onClose,
  guildName,
  members,
}) => {
  const [captured, setCaptured] = useState(false);
  const alignedMembers = AutoPoseAligner.alignMembersOnPodium(members);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 font-mono select-none">
      <div className="bg-slate-950 border-2 border-emerald-500 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col text-center">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-black text-xs">
            <Camera size={16} />
            <span>📸 길드 단체 포토부스 스튜디오</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-black/30 flex items-center justify-center text-white cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>

        <div className="p-5 flex flex-col items-center gap-4">
          {/* 9:16 Photo Frame */}
          <div className="w-52 h-72 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-emerald-400 p-4 flex flex-col justify-between shadow-2xl relative overflow-hidden">
            <div className="text-left">
              <span className="text-[10px] text-emerald-400 font-bold block">{guildName}</span>
              <span className="text-xs font-black text-white">길드 정기 기념사진</span>
            </div>

            {/* Podiums */}
            <div className="flex items-end justify-center gap-2 mb-2">
              {alignedMembers.slice(0, 3).map((m, idx) => (
                <div key={m.id} className="flex flex-col items-center">
                  <span className="text-lg">
                    {m.pose === 'victory' ? '✌️' : m.pose === 'cheer' ? '🙌' : '🫡'}
                  </span>
                  <div
                    className={`w-12 rounded-t-lg bg-emerald-600/30 border-t border-x border-emerald-400 flex items-center justify-center ${
                      idx === 0 ? 'h-14' : idx === 1 ? 'h-10' : 'h-8'
                    }`}
                  >
                    <span className="text-[8px] font-black text-white truncate px-1">{m.name}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-[9px] text-slate-500 text-right">
              {new Date().toLocaleDateString('ko-KR')}
            </div>
          </div>

          {/* 48px Action Button */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('heavy');
              setCaptured(true);
              setTimeout(() => setCaptured(false), 2000);
            }}
            className="h-12 w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer shadow-lg"
          >
            <Camera size={16} />
            <span>{captured ? '저장 완료!' : '9:16 단체 사진 촬영 & 저장'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
