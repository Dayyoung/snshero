import React, { useState, useRef, useEffect, useId } from 'react';
import { createPortal } from 'react-dom';
import { Language, ViewType } from '../types';
import { triggerHaptic } from '../lib/haptic';
import { cn } from '../lib/utils';

interface HomeQuickHubProps {
  language: Language;
  unreadMailCount: number;
  unreadNotifCount: number;
  isAudioMuted: boolean;
  deckCount: number;
  maxDeckCount?: number;
  isLobbyDrawerOpen: boolean;
  onOpenMailbox: () => void;
  onOpenNotifModal: () => void;
  onToggleMute: () => void;
  onNavigate: (view: ViewType) => void;
  onToggleDrawer: () => void;
  onOpenHelp: () => void;
  onOpenPwa?: () => void;
}

export const HomeQuickHub: React.FC<HomeQuickHubProps> = ({
  language, unreadMailCount, unreadNotifCount, isAudioMuted, deckCount,
  maxDeckCount = 200, isLobbyDrawerOpen, onOpenMailbox, onOpenNotifModal,
  onToggleMute, onNavigate, onToggleDrawer, onOpenHelp, onOpenPwa,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 16, maxHeight: 400 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const totalUnread = unreadMailCount + unreadNotifCount;
  const closeLabel = language === 'ko' ? '닫기' : 'Close';
  const actionClass = 'flex min-h-12 w-full items-center justify-between gap-3 rounded-sm border border-[rgba(15,0,0,0.12)] px-3 py-2 text-left text-sm hover:bg-[#f1eeee] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#201d1d] cursor-pointer';

  useEffect(() => {
    if (!isOpen) return;
    const updatePosition = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const viewport = window.visualViewport;
      const width = viewport?.width ?? window.innerWidth;
      const height = viewport?.height ?? window.innerHeight;
      const offsetTop = viewport?.offsetTop ?? 0;
      const offsetLeft = viewport?.offsetLeft ?? 0;
      const panelWidth = Math.min(360, width - 32);
      const top = Math.max(offsetTop + 16, Math.min(rect.bottom + 8, offsetTop + height - 280));
      setPosition({ top, left: Math.max(offsetLeft + 16, Math.min(rect.left, offsetLeft + width - panelWidth - 16)), maxHeight: offsetTop + height - top - 16 });
    };
    const onPointerDown = (event: PointerEvent) => {
      if (!panelRef.current?.contains(event.target as Node) && !triggerRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setIsOpen(false);
        triggerRef.current?.focus();
      }
      if (event.key === 'Tab') {
        const buttons = panelRef.current?.querySelectorAll<HTMLButtonElement>('button');
        if (!buttons?.length) return;
        const first = buttons[0];
        const last = buttons[buttons.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    updatePosition();
    panelRef.current?.querySelector<HTMLButtonElement>('button')?.focus();
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    window.visualViewport?.addEventListener('resize', updatePosition);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
      window.visualViewport?.removeEventListener('resize', updatePosition);
    };
  }, [isOpen]);

  const run = (action: () => void, close = true) => {
    triggerHaptic('light');
    if (close) {
      setIsOpen(false);
      triggerRef.current?.focus();
    }
    action();
  };

  return (
    <div className="min-w-0 font-mono">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => { triggerHaptic('light'); setIsOpen(open => !open); }}
        className={cn(actionClass, isOpen && 'bg-[#201d1d] text-[#fdfcfc] hover:bg-[#302c2c]')}
        aria-expanded={isOpen}
        aria-controls={isOpen ? panelId : undefined}
        aria-haspopup="dialog"
      >
        <span className="font-bold">{language === 'ko' ? '[⚡ 스마트 퀵 허브]' : '[⚡ QUICK HUB]'}</span>
        <span className="shrink-0 tabular-nums">{totalUnread > 0 ? `[${totalUnread}]` : '[+]'}</span>
      </button>
      {isOpen && createPortal(
        <div
          ref={panelRef}
          id={panelId}
          role="dialog"
          aria-label={language === 'ko' ? '로비 스마트 퀵 메뉴' : 'LOBBY QUICK MENU'}
          className="fixed z-[210] w-[min(360px,calc(100vw-32px))] overflow-y-auto overscroll-contain rounded-none border border-[#201d1d] bg-[#fdfcfc] p-3 font-mono text-[#201d1d]"
          style={{ top: position.top, left: position.left, maxHeight: position.maxHeight }}
        >
          <div className="mb-3 flex items-center justify-between gap-2 border-b border-[rgba(15,0,0,0.12)] pb-2">
            <span className="text-sm font-bold">{language === 'ko' ? '로비 스마트 퀵 메뉴' : 'LOBBY QUICK MENU'}</span>
            <button type="button" aria-label={closeLabel} onClick={() => { setIsOpen(false); triggerRef.current?.focus(); }} className="min-h-11 min-w-11 rounded-sm border border-[rgba(15,0,0,0.12)] hover:bg-[#f1eeee] focus-visible:outline-2 cursor-pointer">[x]</button>
          </div>
          <div className="space-y-2">
            <button type="button" className={actionClass} onClick={() => run(onOpenMailbox)}><span>{language === 'ko' ? '우편함' : 'Mailbox'}</span><span>{unreadMailCount}</span></button>
            <button type="button" className={actionClass} onClick={() => run(onOpenNotifModal)}><span>{language === 'ko' ? '알림 센터' : 'Notice'}</span><span>{unreadNotifCount}</span></button>
            <button type="button" className={actionClass} aria-pressed={!isAudioMuted} onClick={() => run(onToggleMute, false)}><span>{language === 'ko' ? '사운드' : 'Sound'}</span><span>{isAudioMuted ? 'OFF' : 'ON'}</span></button>
            <button type="button" className={actionClass} onClick={() => run(() => onNavigate('mydeck'))}><span>{language === 'ko' ? '카드 보관' : 'Inventory'}</span><span>{deckCount}/{maxDeckCount}</span></button>
            <button type="button" className={actionClass} aria-expanded={isLobbyDrawerOpen} onClick={() => run(onToggleDrawer)}><span>{language === 'ko' ? '서브 서랍' : 'Drawer'}</span><span>{isLobbyDrawerOpen ? '[-]' : '[+]'}</span></button>
            <button type="button" className={actionClass} onClick={() => run(onOpenHelp)}><span>{language === 'ko' ? '도움말' : 'Guide'}</span><span>[?]</span></button>
            <button type="button" className={actionClass} onClick={() => run(() => onNavigate('shop'))}><span>{language === 'ko' ? '[🎁 일일 무료 소환 & 80% 핫딜]' : '[🎁 Free Pack & Hot Deals]'}</span><span>→</span></button>
            {onOpenPwa && <button type="button" className={actionClass} onClick={() => run(onOpenPwa)}><span>{language === 'ko' ? '[📱 PWA이벤트 +200]' : '[📱 PWA +200 SNS]'}</span><span>→</span></button>}
          </div>
        </div>, document.body,
      )}
    </div>
  );
};
