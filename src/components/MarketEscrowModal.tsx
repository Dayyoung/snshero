/**
 * MarketEscrowModal.tsx
 * ID 338: 마켓플레이스 카드 거래 시 3단계 안전 에스크로 확인 팝업
 * ID 373: 네트워크 가스비 및 플랫폼 수수료 실시간 계산 배지
 */

import React, { useState } from 'react';
import { ShieldCheck, ArrowRight, Check, AlertTriangle, X, Lock, Cpu, Sparkles } from 'lucide-react';
import { CardData, Language, Listing } from '../types';
import { CARD_DATABASE } from '../cardDatabase';
import { calculateMarketplaceSettlement } from '../content/marketplaceFees';
import { CardItem } from './CardItem';

interface MarketEscrowModalProps {
  isOpen: boolean;
  onClose: () => void;
  listing: Listing | null;
  currentSeason: string;
  language: Language;
  onConfirmPurchase: (listing: Listing) => void;
}

export const MarketEscrowModal: React.FC<MarketEscrowModalProps> = ({
  isOpen,
  onClose,
  listing,
  currentSeason,
  language,
  onConfirmPurchase,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen || !listing) return null;

  const card = CARD_DATABASE[listing.cardId];
  if (!card) return null;

  const settlement = calculateMarketplaceSettlement(listing.askPrice, currentSeason);
  const gasFee = 0; // Layer-2 Sponsored Gas Fee

  const handleNextStep = () => {
    if (step === 1) setStep(2);
    else if (step === 2) setStep(3);
    else if (step === 3 && agreeTerms) {
      setIsProcessing(true);
      setTimeout(() => {
        setIsProcessing(false);
        onConfirmPurchase(listing);
        onClose();
        setStep(1);
        setAgreeTerms(false);
      }, 500);
    }
  };

  const handleClose = () => {
    setStep(1);
    setAgreeTerms(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs select-none">
      <div className="bg-slate-900 border border-slate-700 rounded-sm w-full max-w-lg p-5 text-slate-100 font-mono space-y-4 shadow-2xl animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck size={20} className="text-emerald-400" />
            <h3 className="font-bold text-sm text-slate-100">
              {language === 'ko' ? '3단계 스마트 에스크로 안전 거래' : '3-Step Smart Escrow Safe Trade'}
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-white p-1 rounded-sm hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Step Progress Indicators */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { s: 1, label: language === 'ko' ? '1. 사양 검증' : '1. Card Specs' },
            { s: 2, label: language === 'ko' ? '2. 정산/수수료' : '2. Settlement' },
            { s: 3, label: language === 'ko' ? '3. 서명/체결' : '3. Final Sign' },
          ].map((item) => (
            <div
              key={item.s}
              className={`text-center py-1.5 px-2 rounded-xs border text-[10px] font-bold transition-all ${
                step === item.s
                  ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                  : step > item.s
                  ? 'bg-slate-800 border-slate-600 text-slate-400 line-through'
                  : 'bg-slate-900/60 border-slate-800 text-slate-500'
              }`}
            >
              {item.label}
            </div>
          ))}
        </div>

        {/* Step 1: Card Specs Review */}
        {step === 1 && (
          <div className="space-y-3 bg-slate-950 p-3.5 rounded-sm border border-slate-800">
            <div className="flex items-center gap-4">
              <div className="w-20 h-28 shrink-0">
                <CardItem card={card as unknown as CardData} language={language} lowSpecMode={true} />
              </div>
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] uppercase font-black px-1.5 py-0.5 rounded-xs bg-amber-400 text-black">
                    {card.rarity}
                  </span>
                  <span className="text-xs font-bold text-slate-200 truncate">{card.title_dis || card.title}</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  {language === 'ko' ? '판매자' : 'Seller'}: <span className="text-indigo-300 font-bold">{listing.sellerName}</span>
                </div>
                <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-300 pt-1">
                  <div>상단: <span className="font-bold text-emerald-400">{card.stats?.[0] ?? 5}</span></div>
                  <div>우측: <span className="font-bold text-emerald-400">{card.stats?.[1] ?? 5}</span></div>
                  <div>하단: <span className="font-bold text-emerald-400">{card.stats?.[2] ?? 5}</span></div>
                  <div>좌측: <span className="font-bold text-emerald-400">{card.stats?.[3] ?? 5}</span></div>
                </div>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 border-t border-slate-800/80 pt-2">
              💡 {language === 'ko' ? '구매하려는 카드의 스탯과 희귀도를 확인 후 다음 단계로 진행하세요.' : 'Verify card stats and rarity before proceeding.'}
            </p>
          </div>
        )}

        {/* Step 2: Fees & Gas Settlement */}
        {step === 2 && (
          <div className="space-y-3 bg-slate-950 p-3.5 rounded-sm border border-slate-800 text-xs">
            <div className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
              <Cpu size={14} className="text-cyan-400" />
              <span>{language === 'ko' ? '투명 수수료 및 가스비 명세서 (ID 373)' : 'Fee & Gas Breakdown'}</span>
            </div>

            <div className="space-y-2 border-t border-b border-slate-800 py-2.5">
              <div className="flex justify-between text-slate-400">
                <span>{language === 'ko' ? '카드 등록가' : 'Listing Price'}:</span>
                <span className="font-bold text-slate-200">{listing.askPrice.toLocaleString()} SNS</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span className="flex items-center gap-1">
                  <span>{language === 'ko' ? '플랫폼 마켓 수수료 (5%)' : 'Platform Fee (5%)'}:</span>
                  <span className="text-[9px] bg-slate-800 text-amber-300 px-1 rounded-xs">판매자 부담</span>
                </span>
                <span className="font-bold text-amber-400">-{settlement.fee.toLocaleString()} SNS</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span className="flex items-center gap-1">
                  <span>{language === 'ko' ? '네트워크 가스비' : 'Network Gas Fee'}:</span>
                  <span className="text-[9px] bg-cyan-900/60 text-cyan-300 px-1 rounded-xs">L2 스폰서 100% 무료</span>
                </span>
                <span className="font-bold text-cyan-400">0 SNS</span>
              </div>
            </div>

            <div className="flex justify-between items-center text-sm font-black pt-1">
              <span className="text-slate-200">{language === 'ko' ? '내 최종 결제액' : 'Total Payment'}:</span>
              <span className="text-lg text-emerald-400 font-mono">{settlement.buyerTotal.toLocaleString()} SNS</span>
            </div>
          </div>
        )}

        {/* Step 3: Signature & Final 2FA Confirmation */}
        {step === 3 && (
          <div className="space-y-3 bg-slate-950 p-3.5 rounded-sm border border-slate-800">
            <div className="flex items-center gap-2 text-amber-300 text-xs font-bold">
              <Lock size={14} />
              <span>{language === 'ko' ? '에스크로 스마트 컨트랙트 서명' : 'Smart Contract Escrow Lock-in'}</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {language === 'ko'
                ? '결제 대금은 로컬스토리지 기반 분산 에스크로 금고에 안전하게 락인되며, 카드 전송 검증이 완료된 즉시 인벤토리에 영구 보존됩니다.'
                : 'Payment is securely locked in escrow and permanently credited to your inventory upon transfer confirmation.'}
            </p>

            <label className="flex items-start gap-2.5 p-2 rounded-sm bg-slate-900 border border-slate-700 cursor-pointer hover:bg-slate-850 transition-colors">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-0.5 rounded border-slate-600 text-emerald-500 focus:ring-0 cursor-pointer"
              />
              <span className="text-[11px] font-bold text-slate-200">
                {language === 'ko'
                  ? '위 카드 사양과 정산 금액을 확인하였으며 에스크로 거래에 동의합니다.'
                  : 'I have verified card specs and settlement amount, and agree to escrow terms.'}
              </span>
            </label>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2">
          {step > 1 ? (
            <button
              onClick={() => setStep((prev) => (prev - 1) as any)}
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-white rounded-sm border border-slate-700 hover:bg-slate-800 transition-all cursor-pointer"
            >
              {language === 'ko' ? '이전 단계' : 'Back'}
            </button>
          ) : (
            <div />
          )}

          <button
            onClick={handleNextStep}
            disabled={(step === 3 && !agreeTerms) || isProcessing}
            className={`px-4 py-2 text-xs font-bold rounded-sm flex items-center gap-1.5 transition-all shadow-md cursor-pointer ${
              step === 3
                ? agreeTerms
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white'
            }`}
          >
            {isProcessing ? (
              <span>{language === 'ko' ? '에스크로 체결 중...' : 'Locking in...'}</span>
            ) : step === 3 ? (
              <>
                <Check size={14} />
                <span>{language === 'ko' ? '최종 거래 승인 (에스크로 체결)' : 'Final Approve (Sign Escrow)'}</span>
              </>
            ) : (
              <>
                <span>{language === 'ko' ? '다음 확인 단계' : 'Next Step'}</span>
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
