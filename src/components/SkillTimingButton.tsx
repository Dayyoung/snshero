import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Zap, Clock, Check, X, Timer } from 'lucide-react';

export type QTEState = 'idle' | 'charging' | 'ready' | 'success' | 'failed' | 'cooldown';

export interface SkillTimingButtonProps {
  /** 게이지 충전 시간 (ms) */
  chargeTime?: number;
  /** 입력 창 시간 (ms) */
  inputWindow?: number;
  /** QTE 성공 시 적용할 파워 배율 */
  successMultiplier?: number;
  /** 쿨다운 시간 (ms) */
  cooldownTime?: number;
  /** 성공 시 호출 */
  onSuccess?: (multiplier: number) => void;
  /** 실패 시 호출 */
  onFail?: () => void;
  /** 저사양 모드 여부 */
  lowSpecMode?: boolean;
  /** 비활성화 여부 */
  disabled?: boolean;
  /** 게임 중 여부 */
  isPlaying?: boolean;
  /** 언어 */
  lang?: string;
  /** 컴팩트 모드 (작은 UI) */
  compact?: boolean;
  /** 추가 커스텀 컨테이너 클래스 */
  className?: string;
}

/**
 * SkillTimingButton - 전투 중 선택적 QTE 개입을 위한 버튼 컴포넌트
 *
 * 동작 흐름:
 * 1. idle → 사용자가 버튼 클릭
 * 2. charging → 게이지가 chargeTime 동안 충전됨
 * 3. ready → inputWindow 동안 사용자가 버튼을 다시 눌러야 함
 * 4. success → 타이밍 맞춤, successMultiplier 적용
 * 5. failed → 타이밍 실패 또는 charging 중 다른 곳 클릭
 * 6. cooldown → cooldownTime 동안 재사용 불가
 */
const SkillTimingButton: React.FC<SkillTimingButtonProps> = ({
  chargeTime = 1500,
  inputWindow = 3000,
  successMultiplier = 1.10,
  cooldownTime = 8000,
  onSuccess,
  onFail,
  lowSpecMode = false,
  disabled = false,
  isPlaying = true,
  lang = 'en',
  compact = false,
  className = '',
}) => {
  const [state, setState] = useState<QTEState>('idle');
  const [progress, setProgress] = useState(0); // 0-100
  const chargeTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const readyTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cooldownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  // 클린업
  useEffect(() => {
    return () => {
      if (chargeTimerRef.current) clearInterval(chargeTimerRef.current);
      if (readyTimerRef.current) clearInterval(readyTimerRef.current);
      if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
    };
  }, []);

  // 게임 상태 변경 시 리셋
  useEffect(() => {
    if (!isPlaying && state !== 'idle') {
      resetAll();
    }
  }, [isPlaying]);

  const resetAll = useCallback(() => {
    if (chargeTimerRef.current) { clearInterval(chargeTimerRef.current); chargeTimerRef.current = null; }
    if (readyTimerRef.current) { clearInterval(readyTimerRef.current); readyTimerRef.current = null; }
    if (cooldownTimerRef.current) { clearInterval(cooldownTimerRef.current); cooldownTimerRef.current = null; }
    setState('idle');
    setProgress(0);
  }, []);

  const startCharging = useCallback(() => {
    if (!isPlaying || disabled || state === 'charging' || state === 'ready' || state === 'cooldown') return;

    resetAll();
    setState('charging');
    setProgress(0);
    startTimeRef.current = Date.now();

    chargeTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const pct = Math.min(100, (elapsed / chargeTime) * 100);
      setProgress(pct);

      if (elapsed >= chargeTime) {
        // 충전 완료 → ready 상태
        if (chargeTimerRef.current) { clearInterval(chargeTimerRef.current); chargeTimerRef.current = null; }
        setState('ready');
        setProgress(100);
        startTimeRef.current = Date.now();

        // 입력 창 타이머 시작
        readyTimerRef.current = setInterval(() => {
          const elapsedReady = Date.now() - startTimeRef.current;
          if (elapsedReady >= inputWindow) {
            // 시간 초과 → 실패
            if (readyTimerRef.current) { clearInterval(readyTimerRef.current); readyTimerRef.current = null; }
            setState('failed');
            onFail?.();
            startCooldown();
          }
        }, 100);
      }
    }, 50);
  }, [isPlaying, disabled, state, chargeTime, inputWindow, onFail]);

  const handleActivate = useCallback(() => {
    if (!isPlaying || disabled || state === 'cooldown') return;

    if (state === 'idle') {
      // 충전 시작
      startCharging();
    } else if (state === 'ready') {
      // 타이밍 성공!
      if (readyTimerRef.current) { clearInterval(readyTimerRef.current); readyTimerRef.current = null; }
      setState('success');
      onSuccess?.(successMultiplier);
      startCooldown();
    } else if (state === 'charging') {
      // 충전 중 재클릭 → 취소(실패)
      if (chargeTimerRef.current) { clearInterval(chargeTimerRef.current); chargeTimerRef.current = null; }
      setState('failed');
      onFail?.();
      startCooldown();
    }
    // success, failed 상태에서는 무시
  }, [isPlaying, disabled, state, startCharging, successMultiplier, onSuccess, onFail]);

  const startCooldown = useCallback(() => {
    setState('cooldown');
    setProgress(100);
    startTimeRef.current = Date.now();

    cooldownTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = Math.max(0, cooldownTime - elapsed);
      const pct = (remaining / cooldownTime) * 100;
      setProgress(pct);

      if (elapsed >= cooldownTime) {
        if (cooldownTimerRef.current) { clearInterval(cooldownTimerRef.current); cooldownTimerRef.current = null; }
        setState('idle');
        setProgress(0);
      }
    }, 100);
  }, [cooldownTime]);

  // ─── 렌더링 ────────────────────────────────────────────────────────

  const getButtonStyle = (): string => {
    const base = compact
      ? 'w-10 h-10 rounded-lg text-xs'
      : 'w-14 h-14 rounded-xl text-sm';

    switch (state) {
      case 'idle':
        return `${base} bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg hover:from-amber-400 hover:to-orange-500 active:scale-95 transition-all duration-200`;
      case 'charging':
        return `${base} bg-gradient-to-br from-yellow-400 to-amber-500 text-white shadow-lg animate-pulse`;
      case 'ready':
        return `${base} bg-gradient-to-br from-green-400 to-emerald-500 text-white shadow-lg ring-4 ring-green-300/50 animate-bounce`;
      case 'success':
        return `${base} bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg`;
      case 'failed':
        return `${base} bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-lg`;
      case 'cooldown':
        return `${base} bg-gray-600 text-gray-400 shadow-inner cursor-not-allowed`;
    }
  };

  const getIcon = () => {
    switch (state) {
      case 'idle':
        return compact ? <Zap size={16} /> : <Zap size={22} />;
      case 'charging':
        return compact ? <Timer size={16} className="animate-spin" /> : <Timer size={22} className="animate-spin" />;
      case 'ready':
        return compact ? <Zap size={16} className="animate-pulse" /> : <Zap size={22} className="animate-pulse" />;
      case 'success':
        return compact ? <Check size={16} /> : <Check size={22} />;
      case 'failed':
        return compact ? <X size={16} /> : <X size={22} />;
      case 'cooldown':
        return compact ? <Clock size={16} /> : <Clock size={22} />;
    }
  };

  const getLabel = (): string => {
    if (lang === 'ko') {
      switch (state) {
        case 'idle': return 'QTE';
        case 'charging': return '충전 중';
        case 'ready': return '지금!';
        case 'success': return '성공!';
        case 'failed': return '실패';
        case 'cooldown': return '대기';
      }
    }
    switch (state) {
      case 'idle': return 'QTE';
      case 'charging': return 'Charging';
      case 'ready': return 'NOW!';
      case 'success': return 'OK!';
      case 'failed': return 'Miss';
      case 'cooldown': return 'Wait';
    }
  };

  const getMultiplierLabel = (): string => {
    return `x${successMultiplier.toFixed(2)}`;
  };

  return (
    <div className={`flex flex-col items-center gap-1 select-none pointer-events-auto ${className}`}>
      {/* QTE 버튼 */}
      <button
        type="button"
        onClick={handleActivate}
        disabled={disabled || state === 'cooldown'}
        aria-label={
          lang === 'ko'
            ? 'QTE 스킬 타이밍 발동 (충전 후 타이밍 맞춰 클릭)'
            : 'QTE Skill Timing Activation (charge then time your click)'
        }
        className={`${getButtonStyle()} flex items-center justify-center font-bold relative overflow-hidden ${
          disabled && state === 'idle' ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        title={
          state === 'idle' ? (lang === 'ko' ? 'QTE 발동 (충전 후 타이밍 맞춰 클릭)' : 'Activate QTE (charge then time your click)') :
          state === 'ready' ? (lang === 'ko' ? '지금 클릭!' : 'Click now!') :
          state === 'cooldown' ? (lang === 'ko' ? '쿨다운 중...' : 'On cooldown...') :
          ''
        }
      >
        {/* 게이지 바 (charging/cooldown 시) */}
        {(state === 'charging' || state === 'cooldown') && !lowSpecMode && (
          <div
            className="absolute bottom-0 left-0 h-1 bg-white/30 transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        )}

        {/* ready 상태에서 파티클/펄스 효과 (lowSpecMode 비활성) */}
        {state === 'ready' && !lowSpecMode && (
          <>
            <div className="absolute inset-0 rounded-xl ring-2 ring-green-400/50 animate-ping" />
            <div className="absolute inset-0 rounded-xl bg-green-400/10 animate-pulse" />
          </>
        )}

        {getIcon()}
      </button>

      {/* 라벨 */}
      {!compact && (
        <span className={`text-[10px] font-bold uppercase tracking-wider ${
          state === 'success' ? 'text-green-400' :
          state === 'failed' ? 'text-red-400' :
          state === 'ready' ? 'text-green-300' :
          'text-gray-400'
        }`}>
          {getLabel()}
        </span>
      )}

      {/* 배율 라벨 */}
      {!compact && state === 'idle' && (
        <span className="text-[9px] text-amber-400/70 font-mono">
          {getMultiplierLabel()}
        </span>
      )}

      {/* 성공 시 배율 효과 표시 */}
      {state === 'success' && !compact && (
        <span className="text-[9px] text-emerald-400 font-mono animate-bounce">
          {getMultiplierLabel()}
        </span>
      )}
    </div>
  );
};

export default React.memo(SkillTimingButton);
