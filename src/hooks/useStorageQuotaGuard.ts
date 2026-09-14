import { useState, useEffect, useCallback } from 'react';

export interface StorageQuotaInfo {
  usedBytes: number;
  totalQuotaBytes: number;
  usagePercent: number;
  isWarning: boolean; // >= 80%
  isCritical: boolean; // >= 90%
  trimmedCount: number;
}

const ESTIMATED_MAX_BYTES = 5 * 1024 * 1024; // 5MB 표준 LocalStorage 한도

/**
 * ID 420: LocalStorage 사용량 실시간 모니터링 및 90% 도달 시 안전 자동 클린업 훅
 */
export function useStorageQuotaGuard() {
  const [quota, setQuota] = useState<StorageQuotaInfo>({
    usedBytes: 0,
    totalQuotaBytes: ESTIMATED_MAX_BYTES,
    usagePercent: 0,
    isWarning: false,
    isCritical: false,
    trimmedCount: 0,
  });

  const checkAndCleanStorage = useCallback((): StorageQuotaInfo => {
    let totalLength = 0;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const val = localStorage.getItem(key) || '';
          totalLength += (key.length + val.length) * 2; // UTF-16 기준 대략적 바이트
        }
      }
    } catch {
      // access error 방어
    }

    let trimmed = 0;
    let percent = (totalLength / ESTIMATED_MAX_BYTES) * 100;

    // 85% 초과 시 비필수 대용량 로그 자동 트림
    if (percent >= 85) {
      const purgeKeys = [
        'hero_game_logs',
        'hero_audit_trail_v1',
        'hero_match_history',
        'hero_daily_missions_history',
        'hero_battle_replay_cache'
      ];

      for (const k of purgeKeys) {
        try {
          const raw = localStorage.getItem(k);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 10) {
              // 최근 10개만 남기고 이전 기록 정리
              const pruned = parsed.slice(-10);
              localStorage.setItem(k, JSON.stringify(pruned));
              trimmed++;
            }
          }
        } catch {
          // ignore parsing errors
        }
      }

      // 재측정
      let newTotal = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const val = localStorage.getItem(key) || '';
          newTotal += (key.length + val.length) * 2;
        }
      }
      totalLength = newTotal;
      percent = (totalLength / ESTIMATED_MAX_BYTES) * 100;
    }

    const info: StorageQuotaInfo = {
      usedBytes: totalLength,
      totalQuotaBytes: ESTIMATED_MAX_BYTES,
      usagePercent: Math.min(100, Math.round(percent * 10) / 10),
      isWarning: percent >= 80,
      isCritical: percent >= 90,
      trimmedCount: trimmed,
    };

    setQuota(info);
    return info;
  }, []);

  useEffect(() => {
    checkAndCleanStorage();

    const handleStorageChange = () => {
      checkAndCleanStorage();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('snshero_storage_check', handleStorageChange);

    const intervalId = setInterval(checkAndCleanStorage, 60000); // 1분 주기 안전 점검

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('snshero_storage_check', handleStorageChange);
      clearInterval(intervalId);
    };
  }, [checkAndCleanStorage]);

  return {
    quota,
    checkAndCleanStorage,
  };
}
