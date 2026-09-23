import React from 'react';

interface PredictionDepthCanvasProps {
  bids?: { price: number; volume: number }[];
  asks?: { price: number; volume: number }[];
}

export const PredictionDepthCanvas: React.FC<PredictionDepthCanvasProps> = ({
  bids = [],
  asks = []
}) => {
  return (
    <div className="w-full h-24 bg-[#201d1d]/5 rounded-sm border border-[#201d1d]/15 p-2 flex items-center justify-center font-mono text-[11px] text-[#201d1d]/60">
      실시간 베팅 호가 뎁스 차트 (Bids: {bids.length} / Asks: {asks.length})
    </div>
  );
};

export default PredictionDepthCanvas;
