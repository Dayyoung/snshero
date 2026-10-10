/**
 * IosPwaInstallGuideModal.tsx
 * iOS 환경에서 PWA 미설치 시 홈 화면 추가 가이드 모달
 * OpenCode.ai Monospace + Flat Hairline + Warm Cream/Ink 디자인 시스템 준수
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Share, PlusSquare, Smartphone, X, AlertCircle, Check } from 'lucide-react';
import type { Language } from '../types';

interface IosPwaInstallGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  language?: Language;
}

export const IosPwaInstallGuideModal: React.FC<IosPwaInstallGuideModalProps> = ({
  isOpen,
  onClose,
  language = 'ko',
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[250] bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 font-mono select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-md bg-[#fdfcfc] border-2 border-[#201d1d] p-5 rounded-none shadow-[4px_4px_0px_#201d1d] text-[#201d1d] relative flex flex-col gap-4"
        >
          {/* 헤더 */}
          <div className="flex items-center justify-between border-b border-[#201d1d]/15 pb-3">
            <div className="flex items-center gap-2">
              <span className="p-1 bg-[#201d1d] text-[#fdfcfc] rounded-xs">
                <Smartphone size={16} />
              </span>
              <h3 className="text-xs sm:text-sm font-black uppercase tracking-tight">
                {language === 'ko' ? '[📱 iOS 웹푸시 설치 안내]' : '[📱 iOS PWA INSTALL GUIDE]'}
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-[#201d1d]/60 hover:text-[#201d1d] hover:bg-[#201d1d]/10 rounded-xs transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* 핵심 설명 박스 */}
          <div className="p-3 bg-amber-50 border border-amber-300 text-amber-950 text-xs leading-relaxed space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-amber-900">
              <AlertCircle size={14} className="shrink-0 text-amber-600" />
              <span>
                {language === 'ko' ? 'Apple iOS 사파리 정책 안내' : 'Apple iOS Safari Policy Notice'}
              </span>
            </div>
            <p className="text-[11px] text-amber-900/90 leading-normal pl-4">
              {language === 'ko'
                ? 'iOS는 일반 사파리 탭에서 웹푸시를 지원하지 않으며, "홈 화면에 추가(PWA 설치)" 후 실행해야 푸시 알림을 받을 수 있습니다 (iOS 16.4+).'
                : 'iOS Safari requires adding this app to your Home Screen (PWA) before enabling Web Push notifications (iOS 16.4+).'}
            </p>
          </div>

          {/* 3단계 가이드 리스트 */}
          <div className="space-y-2.5 text-xs">
            {/* 1단계 */}
            <div className="p-3 bg-white border border-[#201d1d]/15 rounded-none flex items-start gap-3">
              <div className="w-6 h-6 rounded-none bg-[#201d1d] text-[#fdfcfc] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                1
              </div>
              <div className="space-y-0.5">
                <div className="font-bold flex items-center gap-1.5">
                  <Share size={14} className="text-blue-600" />
                  <span>
                    {language === 'ko' ? '사파리 하단 [공유] 버튼 터치' : 'Tap [Share] in Safari'}
                  </span>
                </div>
                <p className="text-[11px] text-[#201d1d]/70 leading-normal">
                  {language === 'ko'
                    ? '사파리 브라우저 화면 맨 아래 도구 모음의 [공유 (네모+화살표)] 아이콘을 누릅니다.'
                    : 'Tap the Share icon (square with upward arrow) at the bottom toolbar.'}
                </p>
              </div>
            </div>

            {/* 2단계 */}
            <div className="p-3 bg-white border border-[#201d1d]/15 rounded-none flex items-start gap-3">
              <div className="w-6 h-6 rounded-none bg-[#201d1d] text-[#fdfcfc] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                2
              </div>
              <div className="space-y-0.5">
                <div className="font-bold flex items-center gap-1.5">
                  <PlusSquare size={14} className="text-emerald-600" />
                  <span>
                    {language === 'ko' ? '[홈 화면에 추가] 메뉴 선택' : 'Select [Add to Home Screen]'}
                  </span>
                </div>
                <p className="text-[11px] text-[#201d1d]/70 leading-normal">
                  {language === 'ko'
                    ? '공유 메뉴를 아래로 스크롤하여 [홈 화면에 추가] 항목을 선택합니다.'
                    : 'Scroll down the share sheet and tap [Add to Home Screen].'}
                </p>
              </div>
            </div>

            {/* 3단계 */}
            <div className="p-3 bg-white border border-[#201d1d]/15 rounded-none flex items-start gap-3">
              <div className="w-6 h-6 rounded-none bg-[#201d1d] text-[#fdfcfc] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                3
              </div>
              <div className="space-y-0.5">
                <div className="font-bold flex items-center gap-1.5">
                  <Check size={14} className="text-indigo-600" />
                  <span>
                    {language === 'ko' ? '홈 화면의 앱 아이콘으로 실행' : 'Launch from Home Screen'}
                  </span>
                </div>
                <p className="text-[11px] text-[#201d1d]/70 leading-normal">
                  {language === 'ko'
                    ? '우측 상단 [추가] 후, 홈 화면에 생긴 SNSHero 앱 아이콘을 열어 알림을 받으세요!'
                    : 'Tap [Add], then launch the newly created SNSHero app icon to activate push!'}
                </p>
              </div>
            </div>
          </div>

          {/* 닫기 버튼 */}
          <button
            type="button"
            onClick={onClose}
            className="w-full min-h-[44px] py-2.5 bg-[#201d1d] hover:bg-[#201d1d]/90 active:scale-[0.99] text-[#fdfcfc] font-black text-xs uppercase cursor-pointer rounded-xs transition-all flex items-center justify-center gap-1.5"
          >
            {language === 'ko' ? '[확인 및 가이드 닫기]' : '[Understood & Close]'}
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
