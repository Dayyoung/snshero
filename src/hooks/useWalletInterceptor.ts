import { useState, useCallback } from 'react';

const WALLET_SESSION_KEY = 'hero_wallet_session_timestamp';
const SESSION_MAX_AGE_MS = 1000 * 60 * 15; // 15 minutes session timeout

export function useWalletInterceptor() {
  const [isReauthModalOpen, setIsReauthModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const checkSessionValid = useCallback((): boolean => {
    try {
      const stored = localStorage.getItem(WALLET_SESSION_KEY);
      if (!stored) return false;
      const ts = Number(stored);
      if (Date.now() - ts > SESSION_MAX_AGE_MS) return false;
      return true;
    } catch {
      return false;
    }
  }, []);

  const refreshSession = useCallback(() => {
    localStorage.setItem(WALLET_SESSION_KEY, String(Date.now()));
  }, []);

  const executeWithAuth = useCallback((action: () => void) => {
    if (checkSessionValid()) {
      refreshSession();
      action();
    } else {
      setPendingAction(() => action);
      setIsReauthModalOpen(true);
    }
  }, [checkSessionValid, refreshSession]);

  const confirmReauth = useCallback(() => {
    refreshSession();
    setIsReauthModalOpen(false);
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  }, [pendingAction, refreshSession]);

  const cancelReauth = useCallback(() => {
    setIsReauthModalOpen(false);
    setPendingAction(null);
  }, []);

  return {
    isReauthModalOpen,
    executeWithAuth,
    confirmReauth,
    cancelReauth,
    checkSessionValid,
  };
}
