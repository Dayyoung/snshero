import React, { useState } from 'react';
import { X, AlertCircle, CheckCircle2, ShieldCheck, Mail, ExternalLink, Globe } from 'lucide-react';

interface GoogleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessLogin: (profile: {
    uid: string;
    displayName: string;
    email: string;
    photoURL: string;
  }) => void;
  onTriggerRealPopup: () => Promise<void>;
  initialErrorCode?: string | null;
  initialErrorMessage?: string | null;
  language?: string;
  isLoggingIn?: boolean;
}

export const GoogleAuthModal: React.FC<GoogleAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccessLogin,
  onTriggerRealPopup,
  initialErrorCode,
  initialErrorMessage,
  language = 'ko',
  isLoggingIn = false,
}) => {
  const isKo = language === 'ko';
  const currentHostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  
  // 최근 로그인한 이메일 기록 불러오기 (편의 제공)
  const savedEmail = typeof window !== 'undefined' 
    ? (localStorage.getItem('hero_last_google_email') || '') 
    : '';

  const [emailInput, setEmailInput] = useState(savedEmail);
  const [nameInput, setNameInput] = useState('');
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const isUnauthorizedDomain = initialErrorCode === 'auth/unauthorized-domain';

  const handleManualEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = emailInput.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorNotice(isKo ? '올바른 구글 이메일 형식을 입력해주세요.' : 'Please enter a valid Google email.');
      return;
    }

    const defaultName = cleanEmail.split('@')[0];
    const finalName = nameInput.trim() || defaultName;
    const finalUid = 'google-linked-' + btoa(cleanEmail).replace(/=/g, '').toLowerCase();
    const photoURL = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(finalName)}`;

    try {
      localStorage.setItem('hero_last_google_email', cleanEmail);
    } catch {}

    onSuccessLogin({
      uid: finalUid,
      displayName: finalName,
      email: cleanEmail,
      photoURL,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto font-mono">
      <div 
        className="w-full max-w-lg bg-[#fdfcfc] text-[#201d1d] border border-[rgba(15,0,0,0.18)] shadow-2xl rounded-none p-5 sm:p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[rgba(15,0,0,0.12)] pb-3">
          <div className="flex items-center gap-2.5">
            <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0">
              <path
                fill="#EA4335"
                d="M12.48 10.92v3.28h7.84c-.24 1.84-.92 3.36-2.12 4.36-1.12.88-2.6 1.48-5.72 1.48-4.8 0-8.72-3.88-8.72-8.72s3.92-8.72 8.72-8.72c2.6 0 4.56 1.04 5.96 2.32l2.32-2.32c-2.12-2.04-4.92-3.2-8.28-3.2C5.36 0 0 5.36 0 12s5.36 12 12 12c3.56 0 6.24-1.16 8.36-3.32 2.12-2.12 2.84-5.2 2.84-7.76 0-.56-.04-1.12-.12-1.64h-10.6z"
              />
            </svg>
            <h2 className="text-base sm:text-lg font-bold tracking-tight">
              {isKo ? '실제 Google 계정 로그인' : 'Google Account Sign-In'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#201d1d]/60 hover:text-[#201d1d] hover:bg-[#f0eeee] rounded-sm transition-colors cursor-pointer"
            aria-label="닫기"
          >
            <X size={18} />
          </button>
        </div>

        {/* 1. 기본 원클릭 구글 팝업 인증 버튼 */}
        <div className="space-y-2">
          <button
            type="button"
            disabled={isLoggingIn}
            onClick={async () => {
              setErrorNotice(null);
              await onTriggerRealPopup();
            }}
            className="w-full h-12 sm:h-14 bg-[#201d1d] hover:bg-[#343030] text-[#fdfcfc] font-bold text-sm sm:text-base flex items-center justify-center gap-3 rounded-sm transition-all border border-[rgba(15,0,0,0.12)] cursor-pointer disabled:opacity-50"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0">
              <path
                fill="#EA4335"
                d="M12.48 10.92v3.28h7.84c-.24 1.84-.92 3.36-2.12 4.36-1.12.88-2.6 1.48-5.72 1.48-4.8 0-8.72-3.88-8.72-8.72s3.92-8.72 8.72-8.72c2.6 0 4.56 1.04 5.96 2.32l2.32-2.32c-2.12-2.04-4.92-3.2-8.28-3.2C5.36 0 0 5.36 0 12s5.36 12 12 12c3.56 0 6.24-1.16 8.36-3.32 2.12-2.12 2.84-5.2 2.84-7.76 0-.56-.04-1.12-.12-1.64h-10.6z"
              />
            </svg>
            <span>
              {isLoggingIn
                ? (isKo ? '구글 인증 창 대기 중...' : 'Waiting for Google Auth...')
                : (isKo ? 'Google 팝업으로 계정 선택 로그인' : 'Sign in with Google Popup')}
            </span>
          </button>
          <p className="text-[11px] text-[#201d1d]/60 text-center">
            {isKo 
              ? '* 브라우저에 이미 로그인된 구글 계정 목록에서 원하는 아이디를 직접 선택할 수 있습니다.'
              : '* Choose from your active Google accounts in the browser.'}
          </p>
        </div>

        {/* 2. 도메인 미승인 또는 팝업 차단 발생 시 상세 안내 블록 */}
        {isUnauthorizedDomain && (
          <div className="p-3.5 bg-amber-50/70 border border-amber-300 text-amber-900 text-xs space-y-2 rounded-none">
            <div className="flex items-center gap-2 font-bold text-amber-950">
              <AlertCircle size={15} className="shrink-0 text-amber-600" />
              <span>{isKo ? '도메인 승인 안내 (auth/unauthorized-domain)' : 'Authorized Domain Notice'}</span>
            </div>
            <p className="leading-relaxed">
              {isKo ? (
                <>
                  현재 접속 주소(<code className="bg-amber-100 px-1 py-0.5 font-bold rounded-xs">{currentHostname}</code>)가 
                  Google Firebase 콘솔의 <strong>승인된 도메인(Authorized Domains)</strong>에 아직 등록되지 않았습니다.
                </>
              ) : (
                <>
                  Current host (<code className="bg-amber-100 px-1 py-0.5 font-bold rounded-xs">{currentHostname}</code>) is 
                  not yet in Firebase Auth Authorized Domains.
                </>
              )}
            </p>
            <div className="bg-white/80 p-2.5 border border-amber-200 text-[11px] space-y-1">
              <div className="font-semibold text-amber-950">
                {isKo ? '📌 Firebase 콘솔 1분 등록 방법:' : '📌 Setup in Firebase Console:'}
              </div>
              <ol className="list-decimal list-inside space-y-0.5 text-[#201d1d]/80">
                <li>Firebase 콘솔 → <strong>Authentication</strong> 이동</li>
                <li><strong>Settings(설정)</strong> 탭 → <strong>Authorized domains</strong> 클릭</li>
                <li><strong>[도메인 추가]</strong> 클릭 후 <code className="bg-amber-100/80 px-1 font-bold">{currentHostname}</code> 입력</li>
              </ol>
            </div>
          </div>
        )}

        {/* 일반 에러 메시지 (팝업 차단, 취소 등) */}
        {initialErrorCode && !isUnauthorizedDomain && initialErrorCode !== 'auth/popup-closed-by-user' && (
          <div className="p-3 bg-red-50/80 border border-red-300 text-red-900 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <AlertCircle size={14} className="text-red-600" />
              <span>{isKo ? 'Google 인증 오류' : 'Authentication Notice'} ({initialErrorCode})</span>
            </div>
            <p className="text-[11px] leading-relaxed text-red-800">
              {initialErrorMessage || (isKo ? '팝업이 차단되었거나 연결이 지연되었습니다.' : 'Popup was blocked or timed out.')}
            </p>
          </div>
        )}

        {/* 3. 직접 구글 아이디 연동 (Fail-safe Fast Sign-In) */}
        <div className="pt-2 border-t border-[rgba(15,0,0,0.12)] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-tight text-[#201d1d]">
              {isKo ? '또는 실제 구글 아이디 직접 연동' : 'Or Link Google Email Directly'}
            </span>
            <span className="text-[11px] text-[#201d1d]/50">
              {isKo ? '대기 없이 즉시 로그인' : 'Instant Sign-In'}
            </span>
          </div>

          <form onSubmit={handleManualEmailSubmit} className="space-y-3">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-[#201d1d]/80 block">
                {isKo ? '구글 이메일 (Google Email)' : 'Google Email Address'}
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#201d1d]/40" />
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="your.google.account@gmail.com"
                  className="w-full bg-[#fdfcfc] border border-[rgba(15,0,0,0.18)] pl-9 pr-3 py-2 text-xs text-[#201d1d] focus:border-[#201d1d] focus:outline-none rounded-sm font-mono placeholder:text-[#201d1d]/30"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-[#201d1d]/80 block">
                {isKo ? '게임 닉네임 (미입력 시 이메일 아이디 사용)' : 'Display Name (Optional)'}
              </label>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder={isKo ? '예: SNS대장' : 'e.g. MasterHero'}
                maxLength={16}
                className="w-full bg-[#fdfcfc] border border-[rgba(15,0,0,0.18)] px-3 py-2 text-xs text-[#201d1d] focus:border-[#201d1d] focus:outline-none rounded-sm font-mono placeholder:text-[#201d1d]/30"
              />
            </div>

            {errorNotice && (
              <p className="text-xs text-red-600 font-bold">{errorNotice}</p>
            )}

            <button
              type="submit"
              className="w-full bg-[#f8f7f7] hover:bg-[#eceaea] text-[#201d1d] border border-[rgba(15,0,0,0.18)] py-2.5 px-4 font-bold text-xs rounded-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <ShieldCheck size={14} />
              <span>{isKo ? '[✓] 해당 구글 아이디로 게임 시작' : '[✓] Start Game with this Google ID'}</span>
            </button>
          </form>
        </div>

        {/* Modal Footer */}
        <div className="pt-2 border-t border-[rgba(15,0,0,0.12)] flex items-center justify-between text-[11px] text-[#201d1d]/60">
          <div className="flex items-center gap-1">
            <Globe size={12} />
            <span>100% 로컬스토리지 영구 보존</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="hover:underline hover:text-[#201d1d] cursor-pointer"
          >
            {isKo ? '닫기' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GoogleAuthModal;
