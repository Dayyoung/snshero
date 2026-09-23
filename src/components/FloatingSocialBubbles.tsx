/**
 * FloatingSocialBubbles.tsx - SCR-01-17
 * 로비 우측 가장자리에 실시간 접속 친구 미니 아바타(44px)가 떠다니는 플로팅 소셜 버블 컴포넌트
 */

import React from 'react';
import { motion } from 'motion/react';
import { Users, Swords, MessageSquare, Zap } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

export interface OnlineFriend {
  id: string;
  name: string;
  avatarEmoji: string;
  status: 'lobby' | 'battle' | 'deck';
}

interface FloatingSocialBubblesProps {
  friends: OnlineFriend[];
  onSelectFriend: (friend: OnlineFriend) => void;
  onDragFriendToBattle?: (friend: OnlineFriend) => void;
}

export const FloatingSocialBubbles: React.FC<FloatingSocialBubblesProps> = ({
  friends,
  onSelectFriend,
  onDragFriendToBattle,
}) => {
  return (
    <div className="fixed right-3 top-24 z-30 flex flex-col gap-3 pointer-events-auto select-none">
      {friends.slice(0, 3).map((friend, idx) => (
        <motion.div
          key={friend.id}
          drag
          dragConstraints={{ left: -150, right: 0, top: -50, bottom: 50 }}
          dragElastic={0.2}
          onDragEnd={(_, info) => {
            // Dragged to the left towards battle button
            if (info.offset.x < -80 && onDragFriendToBattle) {
              triggerHaptic('heavy');
              onDragFriendToBattle(friend);
            }
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            triggerHaptic('light');
            onSelectFriend(friend);
          }}
          className="relative cursor-pointer"
        >
          {/* 44px Bubble */}
          <div className="w-11 h-11 rounded-full bg-slate-900/90 border-2 border-amber-400/80 shadow-lg flex items-center justify-center text-lg backdrop-blur-md">
            {friend.avatarEmoji}
          </div>

          {/* Online indicator */}
          <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 border-2 border-slate-950 animate-pulse" />

          {/* Quick status label */}
          <span className="absolute -left-12 top-2 bg-slate-950/80 border border-slate-700 px-1.5 py-0.5 rounded text-[9px] text-slate-300 pointer-events-none hidden group-hover:block font-mono">
            {friend.name}
          </span>
        </motion.div>
      ))}
    </div>
  );
};
