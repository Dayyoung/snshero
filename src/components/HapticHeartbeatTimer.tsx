/**
 * HapticHeartbeatTimer.tsx - SCR-02-26
 * 턴 종료 5초 전 심장박동 햅틱 진동과 붉은 비네트 펄스를 발동하는 타이머
 */

import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { triggerHaptic } from '../lib/haptic';
import { HeartbeatAudioSynthesizer } from '../lib/HeartbeatAudioSynthesizer';

export const HapticHeartbeatTimer: React.FC<{ remainingSeconds: number }> = ({ remainingSeconds }) => {
  useEffect(() => {
    if (remainingSeconds <= 5 && remainingSeconds > 0) {
      triggerHaptic('heavy');
      HeartbeatAudioSynthesizer.playHeartbeat();
    }
  }, [remainingSeconds]);

  if (remainingSeconds > 5 || remainingSeconds <= 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: [0.2, 0.6, 0.2] }}
      transition={{ repeat: Infinity, duration: 0.8 }}
      className="fixed inset-0 pointer-events-none z-40 border-[6px] border-rose-500 shadow-[inset_0_0_40px_rgba(244,63,94,0.6)]"
    />
  );
};
