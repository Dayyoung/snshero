/**
 * LiveChatCanvasOverlay.tsx - SCR-07-16
 * 채팅 피드를 고성능 2D Canvas 오버레이 티커로 전환하여 120ms Layout Thrashing을 원천 차단
 */

import React, { useRef, useEffect } from 'react';
import { ChatMessage } from '../lib/ChatTextureDisposablePool';

interface LiveChatCanvasOverlayProps {
  messages: ChatMessage[];
  width?: number;
  height?: number;
}

export const LiveChatCanvasOverlay: React.FC<LiveChatCanvasOverlayProps> = ({
  messages,
  width = 360,
  height = 100,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    // Background gradient overlay
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, 'rgba(5, 8, 17, 0)');
    grad.addColorStop(1, 'rgba(5, 8, 17, 0.95)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Render recent 4 messages
    ctx.font = '11px sans-serif';
    const recent = messages.slice(-4);
    recent.forEach((m, idx) => {
      const y = height - (recent.length - 1 - idx) * 22 - 8;

      // Sender badge
      ctx.fillStyle = m.team === 'A' ? '#60a5fa' : '#f87171';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText(`[${m.sender}]`, 10, y);

      // Message text
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '11px sans-serif';
      ctx.fillText(m.text, 80, y);
    });
  }, [messages, width, height]);

  return (
    <div className="w-full relative pointer-events-none select-none">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="w-full h-[100px] rounded-b-2xl pointer-events-none"
      />
    </div>
  );
};
