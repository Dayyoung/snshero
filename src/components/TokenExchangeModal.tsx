/**
 * TokenExchangeModal.tsx
 * 인게임 토큰 스왑 환전소 & 슬리피지(Slippage) 설정 모달
 * (구글 스프레드시트 Row 1050 / ID 313 요구사항 구현)
 */

import React, { useState } from 'react';
import { ArrowDownUp, AlertTriangle, ShieldCheck, Check, Settings2 } from 'lucide-react';
import { playBattleSfx } from '../lib/AudioSpriteService';

interface TokenExchangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  userSnsBalance: number;
  userGoldBalance: number;
  onSwapSuccess: (snsChange: number, goldChange: number) => void;
  language?: string;
}

export const TokenExchangeModal: React.FC<TokenExchangeModalProps> = ({
  isOpen,
  onClose,
  userSnsBalance,
  userGoldBalance,
  onSwapSuccess,
  language = 'ko',
}) => {
  const isKo = language === 'ko';
  const [swapDirection, setSwapDirection] = useState<'snsToGold' | 'goldToSns'>('snsToGold');
  const [inputAmount, setInputAmount] = useState<string>('100');
  const [slippage, setSlippage] = useState<number>(0.5); // 0.5% default
  const [customSlippage, setCustomSlippage] = useState<string>('');
  const [isCustom, setIsCustom] = useState<boolean>(false);

  if (!isOpen) return null;

  const parsedInput = parseFloat(inputAmount) || 0;
  // 기본 환율: 1 SNS = 10 Gold
  const rate = swapDirection === 'snsToGold' ? 10 : 0.1;
  const expectedOutput = parsedInput * rate;

  // 가격 영향도 계산 (풀 유동성 100,000 기준)
  const poolLiquidity = 50000;
  const priceImpact = Math.min(100, (parsedInput / poolLiquidity) * 100);
  const isImpactHigh = priceImpact > 5.0;

  // 슬리피지 차감 최소 수령 수량
  const effectiveSlippage = isCustom ? (parseFloat(customSlippage) || 0.5) : slippage;
  const minReceived = Math.max(0, expectedOutput * (1 - effectiveSlippage / 100));

  const maxBalance = swapDirection === 'snsToGold' ? userSnsBalance : userGoldBalance;
  const isInsufficient = parsedInput > maxBalance;

  const handleSwap = () => {
    if (parsedInput <= 0 || isInsufficient || isImpactHigh) return;

    playBattleSfx('badge_pop');
    if (swapDirection === 'snsToGold') {
      onSwapSuccess(-parsedInput, Math.floor(minReceived));
    } else {
      onSwapSuccess(Math.floor(minReceived), -parsedInput);
    }
    onClose();
  };

  const handleToggleDirection = () => {
    playBattleSfx('click');
    setSwapDirection((prev) => (prev === 'snsToGold' ? 'goldToSns' : 'snsToGold'));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 font-mono select-none">
      <div className="w-full max-w-sm bg-[#fdfcfc] border-2 border-[#201d1d] text-[#201d1d] p-5 shadow-[4px_4px_0px_#201d1d]">
        {/* 헤더 */}
        <div className="flex items-center justify-between border-b border-[rgba(15,0,0,0.12)] pb-3 mb-4">
          <div className="flex items-center gap-2">
            <ArrowDownUp size={18} className="text-amber-600" />
            <h3 className="font-bold text-sm tracking-tight">
              {isKo ? '토큰 즉시 환전소 (Swap)' : 'In-Game Token Swap'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-[#201d1d] text-sm font-bold px-1"
          >
            ✕
          </button>
        </div>

        {/* 교환 입력 섹션 */}
        <div className="space-y-3 mb-4">
          {/* From */}
          <div className="p-3 bg-[#f8f7f5] border border-[rgba(15,0,0,0.12)]">
            <div className="flex justify-between text-[11px] text-stone-500 mb-1">
              <span>{isKo ? '지불 수량 (From)' : 'From Amount'}</span>
              <span>
                {isKo ? '보유' : 'Balance'}: {maxBalance.toLocaleString()}{' '}
                {swapDirection === 'snsToGold' ? 'SNS' : 'Gold'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={inputAmount}
                onChange={(e) => setInputAmount(e.target.value)}
                min="1"
                className="w-full bg-white border border-stone-300 px-2.5 py-1.5 text-sm font-bold text-[#201d1d] focus:outline-none"
              />
              <span className="font-bold text-xs bg-stone-200 px-2 py-1.5 border border-stone-300 shrink-0">
                {swapDirection === 'snsToGold' ? 'SNS' : 'GOLD'}
              </span>
            </div>
          </div>

          {/* 전환 버튼 */}
          <div className="flex justify-center -my-1">
            <button
              onClick={handleToggleDirection}
              type="button"
              className="p-1.5 bg-[#201d1d] text-[#fdfcfc] hover:bg-black active:scale-95 transition-all shadow-sm"
              title="방향 전환"
            >
              <ArrowDownUp size={14} />
            </button>
          </div>

          {/* To */}
          <div className="p-3 bg-[#f8f7f5] border border-[rgba(15,0,0,0.12)]">
            <div className="flex justify-between text-[11px] text-stone-500 mb-1">
              <span>{isKo ? '예상 수령액 (To)' : 'Expected Output'}</span>
              <span>{swapDirection === 'snsToGold' ? 'Gold' : 'SNS'}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-full bg-stone-100 border border-stone-200 px-2.5 py-1.5 text-sm font-bold text-emerald-700">
                {expectedOutput.toLocaleString()}
              </div>
              <span className="font-bold text-xs bg-stone-200 px-2 py-1.5 border border-stone-300 shrink-0">
                {swapDirection === 'snsToGold' ? 'GOLD' : 'SNS'}
              </span>
            </div>
          </div>
        </div>

        {/* 슬리피지(Slippage) 설정 컨트롤 */}
        <div className="mb-4 p-2.5 bg-stone-50 border border-stone-200 text-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-stone-700 flex items-center gap-1">
              <Settings2 size={12} />
              {isKo ? '허용 슬리피지 (Slippage Tolerance)' : 'Slippage Tolerance'}
            </span>
            <span className="text-[11px] font-bold text-amber-700">
              {effectiveSlippage}%
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {[0.5, 1.0, 2.5].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => {
                  setSlippage(val);
                  setIsCustom(false);
                }}
                className={`flex-1 py-1 text-[11px] font-bold border transition-all ${
                  !isCustom && slippage === val
                    ? 'bg-[#201d1d] text-[#fdfcfc] border-[#201d1d]'
                    : 'bg-white text-stone-600 border-stone-300 hover:bg-stone-100'
                }`}
              >
                {val}%
              </button>
            ))}
            <button
              type="button"
              onClick={() => setIsCustom(true)}
              className={`px-2 py-1 text-[11px] font-bold border transition-all ${
                isCustom
                  ? 'bg-[#201d1d] text-[#fdfcfc] border-[#201d1d]'
                  : 'bg-white text-stone-600 border-stone-300 hover:bg-stone-100'
              }`}
            >
              직접입력
            </button>
          </div>

          {isCustom && (
            <div className="mt-2 flex items-center gap-1">
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="10"
                placeholder="0.5"
                value={customSlippage}
                onChange={(e) => setCustomSlippage(e.target.value)}
                className="w-full bg-white border border-stone-300 px-2 py-1 text-xs font-mono"
              />
              <span className="text-xs font-bold text-stone-500">%</span>
            </div>
          )}
        </div>

        {/* 상세 거래 내역 프리뷰 */}
        <div className="p-2.5 bg-[#fdfcfc] border border-[rgba(15,0,0,0.12)] text-[11px] space-y-1 mb-4">
          <div className="flex justify-between text-stone-600">
            <span>{isKo ? '가격 영향도 (Price Impact)' : 'Price Impact'}</span>
            <span className={isImpactHigh ? 'font-bold text-rose-600' : 'text-stone-700'}>
              {priceImpact < 0.1 ? '<0.1%' : `${priceImpact.toFixed(2)}%`}
            </span>
          </div>
          <div className="flex justify-between text-stone-600">
            <span>{isKo ? '슬리피지 반영 최소 수령' : 'Minimum Received'}</span>
            <span className="font-bold text-[#201d1d]">
              {minReceived.toLocaleString()} {swapDirection === 'snsToGold' ? 'Gold' : 'SNS'}
            </span>
          </div>
          <div className="flex justify-between text-stone-600">
            <span>{isKo ? '환전 네트워크 수수료' : 'Network Fee'}</span>
            <span className="text-emerald-600 font-bold">0 SNS (무료)</span>
          </div>
        </div>

        {/* 경고 알림 */}
        {isImpactHigh && (
          <div className="p-2 bg-rose-50 border border-rose-300 text-rose-700 text-[11px] flex items-center gap-1.5 mb-3">
            <AlertTriangle size={13} className="shrink-0" />
            <span>
              {isKo
                ? '가격 영향도(Price Impact)가 5%를 초과하여 스왑이 제한됩니다.'
                : 'Price impact exceeds 5.0%. Swap disabled for capital protection.'}
            </span>
          </div>
        )}

        {isInsufficient && (
          <div className="p-2 bg-rose-50 border border-rose-300 text-rose-700 text-[11px] flex items-center gap-1.5 mb-3">
            <AlertTriangle size={13} className="shrink-0" />
            <span>{isKo ? '보유 잔고가 부족합니다.' : 'Insufficient balance.'}</span>
          </div>
        )}

        {/* 스왑 실행 버튼 */}
        <button
          onClick={handleSwap}
          disabled={parsedInput <= 0 || isInsufficient || isImpactHigh}
          className="w-full py-2.5 bg-[#201d1d] text-[#fdfcfc] font-bold text-xs border border-black hover:bg-black active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isInsufficient
            ? isKo ? '잔고 부족' : 'Insufficient Balance'
            : isImpactHigh
            ? isKo ? '가격 영향도 초과로 제한됨' : 'High Price Impact'
            : isKo ? `환전 완료 (${parsedInput} ${swapDirection === 'snsToGold' ? 'SNS' : 'Gold'})` : 'Execute Swap'}
        </button>
      </div>
    </div>
  );
};
