/**
 * AvatarDispersalController.tsx - SCR-09-17
 * 겹친 길드원 아바타를 방사형으로 펼쳐서 손쉽게 선택할 수 있게 돕는 디스퍼절 포커스 컨트롤러
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Users, Layers } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

export interface GuildMemberAvatar {
  id: string;
  name: string;
  avatarUrl?: string;
  role: string;
}

interface AvatarDispersalControllerProps {
  cluster: GuildMemberAvatar[];
  onSelectMember: (member: GuildMemberAvatar) => void;
}

export const AvatarDispersalController: React.FC<AvatarDispersalControllerProps> = ({
  cluster,
  onSelectMember,
}) => {
  const [isDispersed, setIsDispersed] = useState(false);

  return (
    <div className="relative inline-block font-mono select-none">
      {/* Base Cluster Trigger Button */}
      <button
        type="button"
        onClick={() => {
          triggerHaptic('selection');
          setIsDispersed((p) => !p);
        }}
        className="w-10 h-10 rounded-full bg-slate-800 border-2 border-amber-400 flex items-center justify-center text-amber-400 text-xs font-bold shadow-md cursor-pointer active:scale-95"
      >
        <Users size={16} />
      </button>

      {/* Dispersed Radials */}
      {isDispersed && (
        <div className="absolute top-0 left-0 z-40">
          {cluster.map((m, idx) => {
            const angle = (Math.PI * 2 * idx) / cluster.length;
            const dist = 55;
            const x = Math.cos(angle) * dist;
            const y = Math.sin(angle) * dist;

            return (
              <motion.button
                key={m.id}
                initial={{ x: 0, y: 0, scale: 0 }}
                animate={{ x, y, scale: 1 }}
                exit={{ x: 0, y: 0, scale: 0 }}
                onClick={() => {
                  triggerHaptic('medium');
                  onSelectMember(m);
                  setIsDispersed(false);
                }}
                className="absolute w-9 h-9 -ml-4.5 -mt-4.5 rounded-full bg-slate-900 border border-amber-400/80 text-white text-[9px] font-bold flex flex-col items-center justify-center shadow-lg active:scale-90 cursor-pointer"
              >
                <span className="truncate max-w-[28px]">{m.name}</span>
              </motion.button>
            );
          })}
        </div>
      )}
    </div>
  );
};
