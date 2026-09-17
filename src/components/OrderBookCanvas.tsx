import React, { useEffect, useRef } from 'react';
import { MarketSocketBatcher, OrderBookTick } from '../lib/MarketSocketBatcher';

interface OrderBookCanvasProps {
  basePrice?: number;
  lowSpecMode?: boolean;
}

export const OrderBookCanvas: React.FC<OrderBookCanvasProps> = ({
  basePrice = 120,
  lowSpecMode,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const width = (canvas.width = canvas.clientWidth || 320);
    const height = (canvas.height = 120);

    const bids: { price: number; amount: number }[] = [
      { price: basePrice - 2, amount: 15 },
      { price: basePrice - 4, amount: 28 },
      { price: basePrice - 6, amount: 45 },
    ];
    const asks: { price: number; amount: number }[] = [
      { price: basePrice + 2, amount: 12 },
      { price: basePrice + 4, amount: 24 },
      { price: basePrice + 6, amount: 38 },
    ];

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      ctx.font = '10px monospace';

      // 매도 호가 (Asks - Rose)
      asks.forEach((ask, i) => {
        const y = 20 + i * 16;
        const barWidth = Math.min(width * 0.45, ask.amount * 3);

        ctx.fillStyle = 'rgba(244, 63, 94, 0.12)';
        ctx.fillRect(width / 2, y - 10, barWidth, 12);

        ctx.fillStyle = '#e11d48';
        ctx.fillText(`${ask.price} SNS`, width / 2 + 5, y);

        ctx.fillStyle = '#64748b';
        ctx.textAlign = 'right';
        ctx.fillText(`${ask.amount} qty`, width - 5, y);
        ctx.textAlign = 'left';
      });

      // 중앙 분리선
      ctx.strokeStyle = 'rgba(15, 0, 0, 0.1)';
      ctx.beginPath();
      ctx.moveTo(0, 68);
      ctx.lineTo(width, 68);
      ctx.stroke();

      // 매수 호가 (Bids - Emerald)
      bids.forEach((bid, i) => {
        const y = 84 + i * 16;
        const barWidth = Math.min(width * 0.45, bid.amount * 3);

        ctx.fillStyle = 'rgba(16, 185, 129, 0.12)';
        ctx.fillRect(width / 2 - barWidth, y - 10, barWidth, 12);

        ctx.fillStyle = '#059669';
        ctx.fillText(`${bid.price} SNS`, 5, y);

        ctx.fillStyle = '#64748b';
        ctx.textAlign = 'right';
        ctx.fillText(`${bid.amount} qty`, width / 2 - 5, y);
        ctx.textAlign = 'left';
      });
    };

    render();

    // 150ms 배치 모의 업데이트
    const batcher = new MarketSocketBatcher((ticks) => {
      render();
    });

    const mockInterval = setInterval(() => {
      batcher.pushTick({
        price: basePrice + (Math.random() > 0.5 ? 1 : -1),
        amount: Math.floor(Math.random() * 10) + 1,
        type: Math.random() > 0.5 ? 'buy' : 'sell',
        timestamp: Date.now(),
      });
    }, 500);

    return () => {
      clearInterval(mockInterval);
      batcher.destroy();
    };
  }, [basePrice, lowSpecMode]);

  return (
    <div className="w-full bg-[#fdfcfc] border border-[#201d1d]/15 p-2 font-mono select-none shadow-xs">
      <div className="flex justify-between items-center text-[10px] text-[#201d1d]/60 font-bold mb-1 border-b border-[#201d1d]/10 pb-1">
        <span>[매수 잔량 호가]</span>
        <span>[매도 잔량 호가]</span>
      </div>
      <canvas ref={canvasRef} className="w-full h-[120px] block" />
    </div>
  );
};
