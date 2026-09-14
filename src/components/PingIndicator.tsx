import React, { useState, useEffect } from 'react';
import { Wifi } from 'lucide-react';
import { Language } from '../types';

interface PingIndicatorProps {
  language: Language;
  className?: string;
  isOpponent?: boolean;
  fixedPing?: number;
}

export const PingIndicator: React.FC<PingIndicatorProps> = ({ language, className = '', isOpponent = false, fixedPing }) => {
  const [ping, setPing] = useState<number>(fixedPing || (isOpponent ? 45 : 28));
  const [status, setStatus] = useState<'good' | 'medium' | 'bad'>('good');

  useEffect(() => {
    if (fixedPing !== undefined) {
      setPing(fixedPing);
      if (fixedPing < 80) setStatus('good');
      else if (fixedPing < 200) setStatus('medium');
      else setStatus('bad');
      return;
    }

    const checkPing = async () => {
      const start = performance.now();
      try {
        await fetch('/metadata.json', { method: 'HEAD', cache: 'no-store' }).catch(() => {});
        const elapsed = Math.round(performance.now() - start);
        const baseVariance = isOpponent ? Math.floor(Math.random() * 40) : 0;
        const finalPing = Math.max(16, Math.min(260, (elapsed > 0 ? elapsed : Math.floor(20 + Math.random() * 18)) + baseVariance));
        setPing(finalPing);

        if (finalPing < 80) setStatus('good');
        else if (finalPing < 200) setStatus('medium');
        else setStatus('bad');
      } catch {
        const fallbackPing = Math.floor((isOpponent ? 45 : 25) + Math.random() * 20);
        setPing(fallbackPing);
        setStatus('good');
      }
    };

    checkPing();
    const interval = setInterval(checkPing, isOpponent ? 4000 : 3000);
    return () => clearInterval(interval);
  }, [fixedPing, isOpponent]);

  const getDotColor = () => {
    switch (status) {
      case 'good':
        return 'bg-emerald-500';
      case 'medium':
        return 'bg-amber-500';
      case 'bad':
        return 'bg-rose-500';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'good':
        return language === 'ko' ? '원활' : 'Stable';
      case 'medium':
        return language === 'ko' ? '보통' : 'Moderate';
      case 'bad':
        return language === 'ko' ? '지연 (Weak)' : 'Weak Connection';
    }
  };

  return (
    <div
      className={`h-7 px-1.5 rounded-lg bg-slate-900/90 border border-slate-800 flex items-center gap-1 cursor-pointer select-none shadow-md ${className}`}
      title={`${isOpponent ? 'Opponent' : 'Player'} Ping: ${ping}ms (${getStatusText()})`}
    >
      <div className="relative flex items-center justify-center">
        <Wifi size={12} className={status === 'bad' ? 'text-rose-400' : 'text-slate-400'} />
        <span className={`absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full ${getDotColor()} animate-pulse`} />
      </div>
      <span className="text-[10px] font-mono text-slate-400">{ping}ms</span>
      {status === 'bad' && (
        <span className="text-[9px] font-mono px-1 bg-rose-950/80 text-rose-300 border border-rose-500/40 rounded-xs">
          Weak
        </span>
      )}
    </div>
  );
};

