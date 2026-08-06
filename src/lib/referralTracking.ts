/**
 * Referral / Creator Code Tracking Utility
 * 인플루언서 전용 코드 트래킹
 *
 * - hero_creator_code: 인플루언서 유입 코드 저장
 * - 가입/튜토리얼/첫 플레이 이벤트에 연결 가능
 * - 개인정보/추적 고지 신뢰 센터 연결
 */

const STORAGE_KEY = 'hero_creator_code';
const TRACKING_EVENTS_KEY = 'hero_creator_tracking_events';

export interface CreatorTrackingEvent {
  code: string;
  event: 'landing_visit' | 'signup' | 'tutorial_completed' | 'first_play' | 'first_purchase';
  timestamp: number;
}

/**
 * URL 또는 로컬 스토리지에서 크리에이터 코드를 가져온다
 */
export function getCreatorCode(): string | null {
  if (typeof window === 'undefined') return null;

  // 1. URL 파라미터에서 먼저 확인 (creator/:code 라우트에서 저장)
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) return stored;

  // 2. URL 쿼리 파라미터에서도 확인 (하위 호환)
  const params = new URLSearchParams(window.location.search);
  const queryCode = params.get('creator_code') || params.get('ref');
  if (queryCode) {
    setCreatorCode(queryCode);
    return queryCode;
  }

  return null;
}

/**
 * 크리에이터 코드를 저장한다
 */
export function setCreatorCode(code: string): void {
  if (typeof window === 'undefined') return;
  const normalized = code.toUpperCase().trim();
  localStorage.setItem(STORAGE_KEY, normalized);
}

/**
 * 크리에이터 코드를 삭제한다
 */
export function clearCreatorCode(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * 트래킹 이벤트를 기록한다
 * 서버 검증 전까지는 로컬 스토리지 mock으로 처리
 */
export function trackCreatorEvent(
  event: CreatorTrackingEvent['event'],
  code?: string,
): void {
  if (typeof window === 'undefined') return;

  const activeCode = code || getCreatorCode();
  if (!activeCode) return;

  const eventsJson = localStorage.getItem(TRACKING_EVENTS_KEY);
  const events: CreatorTrackingEvent[] = eventsJson ? JSON.parse(eventsJson) : [];

  // 중복 이벤트 방지 (같은 코드 + 같은 이벤트는 한 번만 기록)
  const alreadyTracked = events.some(
    (e) => e.code === activeCode && e.event === event,
  );
  if (alreadyTracked) return;

  events.push({
    code: activeCode,
    event,
    timestamp: Date.now(),
  });

  // 최대 50개까지만 저장
  if (events.length > 50) {
    events.splice(0, events.length - 50);
  }

  localStorage.setItem(TRACKING_EVENTS_KEY, JSON.stringify(events));
}

/**
 * 특정 코드의 트래킹 이벤트 목록을 가져온다
 */
export function getCreatorTrackingEvents(code?: string): CreatorTrackingEvent[] {
  if (typeof window === 'undefined') return [];

  const eventsJson = localStorage.getItem(TRACKING_EVENTS_KEY);
  if (!eventsJson) return [];

  const events: CreatorTrackingEvent[] = JSON.parse(eventsJson);

  if (code) {
    return events.filter((e) => e.code === code.toUpperCase().trim());
  }

  return events;
}

/**
 * 크리에이터 유입 통계 요약 (mock)
 */
export function getCreatorTrackingSummary(): {
  totalCodes: number;
  totalEvents: number;
  uniqueVisitors: number;
} {
  if (typeof window === 'undefined') {
    return { totalCodes: 0, totalEvents: 0, uniqueVisitors: 0 };
  }

  const eventsJson = localStorage.getItem(TRACKING_EVENTS_KEY);
  if (!eventsJson) return { totalCodes: 0, totalEvents: 0, uniqueVisitors: 0 };

  const events: CreatorTrackingEvent[] = JSON.parse(eventsJson);
  const uniqueCodes = new Set(events.map((e) => e.code));

  return {
    totalCodes: uniqueCodes.size,
    totalEvents: events.length,
    uniqueVisitors: events.filter((e) => e.event === 'landing_visit').length,
  };
}

/**
 * 신뢰 센터 / 개인정보 고지 링크
 */
export const PRIVACY_NOTICE_URL = '/policy-center'; // 신뢰 센터/정책 센터로 연결
