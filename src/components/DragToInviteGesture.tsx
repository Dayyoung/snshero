/**
 * DragToInviteGesture.tsx - SCR-01-17
 * 플로팅 친구 버블을 배틀 영역으로 드래그 시 즉시 파티 대전 초대를 발송하는 제스처 영역
 */

import React, { useState } from 'react';
import { Swords, Check } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

interface DragToInviteGestureProps {
  onInviteAccepted: (friendName: string) => void;
  children: React.ReactNode;
}

export const DragToInviteGesture: React.FC<DragToInviteGestureProps> = ({
  onInviteAccepted,
  children,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative transition-all ${isHovered ? 'ring-2 ring-amber-400 scale-[1.02]' : ''}`}
    >
      {children}
    </div>
  );
};
