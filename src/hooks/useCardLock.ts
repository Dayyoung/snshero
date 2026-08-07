import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'hero_locked_cards';

export function getLockedCardIds(): number[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function isCardLocked(cardId: number | string): boolean {
  const numId = typeof cardId === 'number' ? cardId : Number(cardId) || 0;
  if (!numId) return false;
  const ids = getLockedCardIds();
  return ids.includes(numId);
}

export function toggleCardLockInStorage(cardId: number | string): boolean {
  const numId = typeof cardId === 'number' ? cardId : Number(cardId) || 0;
  if (!numId || typeof window === 'undefined') return false;
  
  const current = getLockedCardIds();
  let next: number[];
  let isNowLocked = false;
  
  if (current.includes(numId)) {
    next = current.filter(id => id !== numId);
    isNowLocked = false;
  } else {
    next = [...current, numId];
    isNowLocked = true;
  }
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent('hero_locked_cards_changed', { detail: next }));
  } catch (e) {
    console.error("Failed to update locked cards:", e);
  }
  
  return isNowLocked;
}

export function useCardLock() {
  const [lockedIds, setLockedIds] = useState<number[]>(() => getLockedCardIds());

  useEffect(() => {
    const handleUpdate = (e: Event) => {
      if ('detail' in e) {
        setLockedIds((e as CustomEvent).detail);
      } else {
        setLockedIds(getLockedCardIds());
      }
    };

    window.addEventListener('hero_locked_cards_changed', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('hero_locked_cards_changed', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const isLocked = useCallback((cardId: number | string) => {
    const numId = typeof cardId === 'number' ? cardId : Number(cardId) || 0;
    return lockedIds.includes(numId);
  }, [lockedIds]);

  const toggleLock = useCallback((cardId: number | string) => {
    return toggleCardLockInStorage(cardId);
  }, []);

  return {
    lockedIds,
    isLocked,
    toggleLock
  };
}
