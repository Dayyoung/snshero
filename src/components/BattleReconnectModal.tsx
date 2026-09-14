/**
 * BattleReconnectModal.tsx
 * 대전 중 네트워크 일시 단절 시 30초 재연결 카운트다운 & 부전승 판정 오버레이
 * (구글 스프레드시트 Row 1048 / ID 311 요구사항 구현)
 */

import React, { useState, useEffect } from 'react';
import { WifiOff, RefreshCw, Trophy, AlertTriangle } from 'lucide-react';
import { playBattleSfx } from '../lib/AudioSpriteService';

interface BattleReconnectModalProps {
  isOpen: boolean;
  isOpponentDisconnected?: boolean;
  onRetry: () => void;
  onForfeitWin?: () => void;
  onClose?: () => void;
}

export const BattleReconnectModal: React.FC<BattleReconnectModalProps> = ({
  isOpen,
  isOpponentDisconnected = false,
  onRetry,
  onForfeitWin,
  onClose,
}) => {
  const [countdown, setCountdown] = useState<number>(30);
  const [isRetrying, setIsRetrying] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) {
      setCountdown(30);
      setIsRetrying(false);
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (isOpponentDisconnected && onForfeitWin) {
            playBattleSfx('victory');
            onForfeitWin();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, isOpponentDisconnected, onForfeitWin]);

  if (!isOpen) return null;

  const handleManualRetry = () => {
    setIsRetrying(true);
    playBattleSfx('click');
    onRetry();
    setTimeout(() => setIsRetrying(false), 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-[#fdfcfc] border-2 border-[#201d1d] rounded-none p-5 font-mono shadow-[4px_4px_0px_#201d1d] text-[#201d1d]">
        <div className="flex items-center gap-2.5 mb-4 border-b border-[rgba(15,0,0,0.15)] pb-3">
          <div className="p-2 bg-rose-100 text-rose-700 border border-rose-300">
            <WifiOff size={22} className="animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-bold tracking-tight">
              {isOpponentDisconnected ? '상대방 연결 끊김 감지' : '네트워크 재연결 시도 중'}
            </h3>
            <p className="text-xs text-stone-500">
              {isOpponentDisconnected ? 'Opponent Disconnected' : 'Reconnecting to Match'}
            </p>
          </div>
        </div>

        <div className="py-3 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full border-2 border-[#201d1d] bg-stone-100 mb-3 font-bold text-2xl text-rose-600">
            {countdown}s
          </div>

          <p className="text-xs text-stone-700 leading-relaxed mb-4">
            {isOpponentDisconnected ? (
              <>
                상대방의 네트워크 접속이 끊겼습니다.<br />
                <span className="font-bold text-rose-600">{countdown}초</span> 내 복귀하지 않을 시{' '}
                <span className="font-bold text-emerald-600">부전승(Win-by-Forfeit)</span>으로 판정됩니다.
              </>
            ) : (
              <>
                게임 서버와의 핑 응답이 지연되고 있습니다.<br />
                자동으로 세션을 복구하는 중입니다. ({countdown}초 남음)
              </>
            )}
          </p>

          <div className="flex flex-col gap-2">
            {!isOpponentDisconnected && (
              <button
                onClick={handleManualRetry}
                disabled={isRetrying}
                className="w-full py-2.5 px-4 bg-[#201d1d] text-[#fdfcfc] font-bold text-xs flex items-center justify-center gap-2 border border-black hover:bg-stone-800 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                <RefreshCw size={14} className={isRetrying ? 'animate-spin' : ''} />
                {isRetrying ? '재연결 시도 중...' : '즉시 재시도 (Retry)'}
              </button>
            )}

            {isOpponentDisconnected && countdown === 0 && (
              <button
                onClick={() => {
                  if (onForfeitWin) onForfeitWin();
                }}
                className="w-full py-2.5 px-4 bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-2 border border-emerald-800 hover:bg-emerald-700"
              >
                <Trophy size={14} />
                부전승 결과 확인 (Claim Win)
              </button>
            )}

            {onClose && (
              <button
                onClick={onClose}
                className="w-full py-2 px-3 text-[11px] text-stone-500 hover:text-stone-800 border border-stone-200"
              >
                대기 닫기
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
