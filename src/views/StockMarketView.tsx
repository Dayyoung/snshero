import React, { useState } from 'react';
import { ArrowLeft, TrendingUp, TrendingDown, DollarSign, Activity, AlertCircle } from 'lucide-react';
import { Language, ViewType } from '../types';

export interface StockMarketViewProps {
  language: Language;
  sns: number;
  updateSns: (amount: number, reason?: string) => void;
  playSfx: (url: string) => void;
  inventory: any;
  addCard: any;
  setView: (view: ViewType) => void;
  user?: any;
  syncUserData?: any;
  currentSeason?: string;
}

interface StockItem {
  id: string;
  name: string;
  ticker: string;
  price: number;
  change: number;
  sharesOwned: number;
}

export const StockMarketView: React.FC<StockMarketViewProps> = ({
  language,
  sns,
  updateSns,
  playSfx,
  setView,
  currentSeason = 'season1',
}) => {
  const [stocks, setStocks] = useState<StockItem[]>([
    { id: '1', name: '히어로 인더스트리', ticker: 'HRO', price: 120, change: 4.2, sharesOwned: 0 },
    { id: '2', name: '아케인 바이오텍', ticker: 'ARCN', price: 85, change: -2.1, sharesOwned: 0 },
    { id: '3', name: '사이버 네오코프', ticker: 'CYBR', price: 210, change: 8.5, sharesOwned: 0 },
    { id: '4', name: '가디언 에너지', ticker: 'GDN', price: 45, change: -0.5, sharesOwned: 0 },
  ]);

  const handleBuy = (stock: StockItem) => {
    if (sns < stock.price) {
      alert(language === 'ko' ? 'SNS 포인트가 부족합니다.' : 'Not enough SNS points.');
      return;
    }
    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    updateSns(-stock.price, `Buy 1 ${stock.ticker}`);
    setStocks(prev =>
      prev.map(s => (s.id === stock.id ? { ...s, sharesOwned: s.sharesOwned + 1 } : s))
    );
  };

  const handleSell = (stock: StockItem) => {
    if (stock.sharesOwned <= 0) return;
    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    updateSns(stock.price, `Sell 1 ${stock.ticker}`);
    setStocks(prev =>
      prev.map(s => (s.id === stock.id ? { ...s, sharesOwned: s.sharesOwned - 1 } : s))
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6 flex flex-col gap-5 text-[#201d1d]">
      <div className="flex items-center justify-between border-b border-[rgba(15,0,0,0.12)] pb-3">
        <button
          onClick={() => setView('home')}
          className="flex items-center gap-1.5 text-xs font-mono border border-[rgba(15,0,0,0.15)] px-3 py-1.5 rounded-sm hover:bg-[#f1eeee] active:scale-95 cursor-pointer min-h-[36px]"
        >
          <ArrowLeft size={14} />
          <span>{language === 'ko' ? '로비로 이동' : 'Back to Lobby'}</span>
        </button>
        <span className="font-mono font-bold text-sm sm:text-base">
          {language === 'ko' ? '[ 히어로 증권소 / 주식 모의투자 ]' : '[ Hero Stock Exchange ]'}
        </span>
        <div className="text-xs font-mono">
          SNS: <strong>{sns.toLocaleString()}</strong>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {stocks.map(stock => (
          <div
            key={stock.id}
            className="border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] p-4 rounded-none flex flex-col gap-3"
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="font-mono font-bold text-sm">{stock.name}</span>
                <span className="text-[11px] font-mono opacity-60 ml-2">({stock.ticker})</span>
              </div>
              <div className={`flex items-center gap-1 font-mono font-bold text-xs ${
                stock.change >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}>
                {stock.change >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                <span>{stock.change >= 0 ? `+${stock.change}%` : `${stock.change}%`}</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs font-mono">
              <span>{language === 'ko' ? '현재가:' : 'Price:'} <strong>{stock.price} SNS</strong></span>
              <span>{language === 'ko' ? '보유 수량:' : 'Owned:'} <strong>{stock.sharesOwned}주</strong></span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[rgba(15,0,0,0.06)]">
              <button
                onClick={() => handleBuy(stock)}
                disabled={sns < stock.price}
                className="py-1.5 text-xs font-mono border border-[#201d1d] bg-[#0f0000] text-white rounded-sm hover:opacity-90 active:scale-95 disabled:opacity-40 cursor-pointer min-h-[36px]"
              >
                {language === 'ko' ? '매수 (1주)' : 'Buy (1)'}
              </button>
              <button
                onClick={() => handleSell(stock)}
                disabled={stock.sharesOwned <= 0}
                className="py-1.5 text-xs font-mono border border-[rgba(15,0,0,0.15)] rounded-sm hover:bg-[#f1eeee] active:scale-95 disabled:opacity-40 cursor-pointer min-h-[36px]"
              >
                {language === 'ko' ? '매도 (1주)' : 'Sell (1)'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StockMarketView;
