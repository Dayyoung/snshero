import React, { useEffect, useRef } from 'react';
import { ShoppingBag, ExternalLink, RefreshCw } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { Language } from '../types';
import { t } from '../lib/i18n';

interface MallViewProps {
  language: Language;
  onNavigate: (view: any) => void;
  playSfx?: (url: string) => void;
}

export const MallView: React.FC<MallViewProps> = ({
  language,
  onNavigate,
  playSfx,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const handleMallMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'SNSHERO_MALL_BUY') {
        const { goodsType, quantity, size } = event.data;
        if (playSfx) {
          playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
        }
        // Redirect to shop with query params
        const qStr = new URLSearchParams({
          goods: goodsType || 'tshirt',
          qty: String(quantity || 1),
          size: size || 'M',
        }).toString();

        window.history.pushState({}, '', `/shop?${qStr}`);
        onNavigate('shop');
      }
    };

    window.addEventListener('message', handleMallMessage);
    return () => window.removeEventListener('message', handleMallMessage);
  }, [onNavigate, playSfx]);

  const handleRefresh = () => {
    if (iframeRef.current) {
      iframeRef.current.src = '/mall/index.html';
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[#fdfcfc] text-[#201d1d] overflow-hidden">
      {/* ── Header ── */}
      <div className="shrink-0 p-3 sm:p-4 border-b border-[rgba(15,0,0,0.12)] bg-white">
        <PageHeader
          title={language === 'ko' ? 'SNSHero 공식 굿즈 몰' : 'SNSHero Official Goods Mall'}
          onBack={() => onNavigate('home')}
          rightAction={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRefresh}
                title="새로고침"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-sm border border-[rgba(15,0,0,0.12)] bg-white text-xs font-bold text-[#201d1d] hover:bg-[#f8f7f7] transition cursor-pointer font-mono"
              >
                <RefreshCw size={13} />
                <span className="hidden sm:inline">새로고침</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('shop')}
                className="flex items-center gap-1 px-3 py-1.5 rounded-sm bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold font-mono transition cursor-pointer"
              >
                <ShoppingBag size={13} />
                <span>인게임 상점</span>
              </button>
              <a
                href="/mall/index.html"
                target="_blank"
                rel="noopener noreferrer"
                title="새 탭에서 전체화면으로 열기"
                className="p-1.5 rounded-sm border border-[rgba(15,0,0,0.12)] bg-white text-[#201d1d] hover:bg-[#f8f7f7] transition"
              >
                <ExternalLink size={14} />
              </a>
            </div>
          }
        />
      </div>

      {/* ── Mall Iframe ── */}
      <div className="flex-1 w-full h-full relative bg-white">
        <iframe
          ref={iframeRef}
          src="/mall/index.html"
          title="SNSHero Mall"
          className="w-full h-full border-0"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
        />
      </div>
    </div>
  );
};
