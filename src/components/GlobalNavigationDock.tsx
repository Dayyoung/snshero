/**
 * GlobalNavigationDock.tsx
 * 모바일 한손 썸존 대응 '슬라이딩 플로팅 퀵 독(Quick Dock)' 및 상단 클린 뷰포트 개편
 * (design.md Monospace 플랫 가이드 준수)
 * (구글 스프레드시트 Row 972 / ID 560 요구사항 구현)
 */

import React, { useState } from 'react';
import { Home, Layers, Gamepad2, ShoppingBag, BookOpen, Compass, X } from 'lucide-react';
import { ViewType, Language } from '../types';

interface GlobalNavigationDockProps {
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
  language?: Language;
}

export const GlobalNavigationDock: React.FC<GlobalNavigationDockProps> = ({
  currentView,
  onNavigate,
  language = 'ko',
}) => {
  const isKo = language === 'ko';
  const [isOpen, setIsOpen] = useState(false);

  const QUICK_ITEMS: {
    key: ViewType;
    label: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    color: string;
  }[] = [
    { key: 'home', label: isKo ? '로비' : 'Lobby', icon: Home, color: 'text-amber-500' },
    { key: 'mydeck', label: isKo ? '마이덱' : 'Deck', icon: Layers, color: 'text-blue-500' },
    { key: 'play', label: isKo ? '미션' : 'Play', icon: Gamepad2, color: 'text-rose-500' },
    { key: 'card-marketplace', label: isKo ? '마켓' : 'Market', icon: ShoppingBag, color: 'text-emerald-500' },
    { key: 'wiki-card', label: isKo ? '도감' : 'Codex', icon: BookOpen, color: 'text-purple-500' },
  ];

  return (
    <aside
      aria-label="Ergonomic Thumb-Zone Quick Navigation Dock"
      className="fixed bottom-4 right-4 z-50 font-mono select-none"
    >
      {/* 아크 형태로 펼쳐지는 서브 메뉴 아이템들 */}
      {isOpen && (
        <div className="absolute bottom-14 right-0 flex flex-col items-end gap-2 mb-1 animate-in fade-in slide-in-from-bottom-3 duration-200">
          {QUICK_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.key;
            return (
              <button
                key={item.key}
                onClick={() => {
                  onNavigate(item.key);
                  setIsOpen(false);
                }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-sm border shadow-lg transition-all active:scale-95 cursor-pointer backdrop-blur-md ${
                  isActive
                    ? 'bg-[#201d1d] text-[#fdfcfc] dark:bg-[#fdfcfc] dark:text-[#201d1d] border-transparent font-black'
                    : 'bg-[#fdfcfc]/95 text-[#201d1d] dark:bg-[#181616]/95 dark:text-[#fdfcfc] border-[rgba(15,0,0,0.15)] dark:border-[rgba(255,255,255,0.15)] hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                <span className="text-[11px] font-bold tracking-tight">{item.label}</span>
                <Icon size={16} className={`${isActive ? 'text-inherit' : item.color} stroke-[2.2]`} />
              </button>
            );
          })}
        </div>
      )}

      {/* 엄지 플로팅 트리거 허브 버튼 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? '퀵 독 닫기' : '퀵 독 열기'}
        className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all shadow-xl active:scale-90 cursor-pointer ${
          isOpen
            ? 'bg-[#201d1d] text-[#fdfcfc] border-white dark:bg-[#fdfcfc] dark:text-[#201d1d] dark:border-black rotate-90'
            : 'bg-[#fdfcfc] text-[#201d1d] border-[#201d1d] dark:bg-[#181616] dark:text-[#fdfcfc] dark:border-white'
        }`}
      >
        {isOpen ? <X size={20} className="stroke-[2.5]" /> : <Compass size={22} className="stroke-[2.2]" />}
      </button>
    </aside>
  );
};
