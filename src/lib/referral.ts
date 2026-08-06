/**
 * Referral Program Utilities
 * 친구 초대 리퍼럴 프로그램 — 코드 생성, 검증, 링크 생성, referrer 저장, 공유 문구
 *
 * localStorage keys:
 *   hero_referral_code      — 내 초대 코드
 *   hero_referral_source    — 초대 링크로 유입 시 저장된 referrer 코드
 *   hero_referral_status    — 초대 현황 (pending/completed count)
 *   hero_referral_pending_rewards — 튜토리얼 완료 후 서버 검증 대기 보상 큐
 */

import type { Language } from '../types';
import { t } from './i18n';

// ─── Constants ───────────────────────────────────────────────────────

const REFERRAL_CODE_KEY = 'hero_referral_code';
const REFERRAL_SOURCE_KEY = 'hero_referral_source';
const REFERRAL_STATUS_KEY = 'hero_referral_status';
const REFERRAL_PENDING_REWARDS_KEY = 'hero_referral_pending_rewards';

export interface ReferralStatus {
  invitedCount: number;
  pendingCount: number;
  completedCount: number;
  invitees: ReferralInvitee[];
}

export interface ReferralInvitee {
  name: string;
  status: 'pending' | 'completed';
  timestamp: number;
}

export interface ReferralShareResult {
  intro: string;
  caption: string;
  hashtags: string[];
}

export interface ReferralPendingReward {
  referralCode: string;
  status: 'pending';
  createdAt: number;
  rewardType: 'tutorial_completion';
}

// ─── Code Generation ──────────────────────────────────────────────────

/** uid 기반으로 8자리 초대 코드 생성 (영대문자+숫자) */
export function generateReferralCode(uid: string): string {
  // uid의 각 문자 코드를 합산해 deterministic seed 생성
  let hash = 0;
  for (let i = 0; i < uid.length; i++) {
    hash = ((hash << 5) - hash + uid.charCodeAt(i)) | 0;
  }
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  const absHash = Math.abs(hash);
  for (let i = 0; i < 8; i++) {
    code += chars[(absHash + i * 7) % chars.length];
  }
  return code;
}

/** 초대 코드 유효성 검증 */
export function validateReferralCode(code: string): boolean {
  if (typeof code !== 'string') return false;
  const trimmed = code.trim().toUpperCase();
  return /^[A-Z0-9]{6,12}$/.test(trimmed);
}

/** 초대 링크 생성 (풀 URL) */
export function generateReferralLink(code: string): string {
  if (typeof window === 'undefined') return `https://snshero.com/?ref=${code}`;
  const base = `${window.location.protocol}//${window.location.host}`;
  return `${base}/?ref=${encodeURIComponent(code)}`;
}

/** 초대 문구 생성 */
export function buildReferralShareCopy(code: string, language: Language): ReferralShareResult {
  const link = generateReferralLink(code);
  const inviteMessage = t('referral_share_message', language);
  const rewardMessage = t('referral_share_reward', language);

  const hashtags = ['#SNSHero', '#CardGame', '#InviteFriends', '#SNSHeroReferral'];

  const intro = inviteMessage;
  const caption = [inviteMessage, rewardMessage, link, hashtags.join(' ')].join('\n');

  return { intro, caption, hashtags };
}

// ─── Storage ───────────────────────────────────────────────────────────

/** 내 초대 코드 가져오기 */
export function getMyReferralCode(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFERRAL_CODE_KEY);
}

/** 내 초대 코드 저장 */
export function setMyReferralCode(code: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(REFERRAL_CODE_KEY, code.trim().toUpperCase());
}

/** 초대 코드 초기화 또는 생성 */
export function initMyReferralCode(uid: string): string {
  const existing = getMyReferralCode();
  if (existing) return existing;
  const code = generateReferralCode(uid);
  setMyReferralCode(code);
  return code;
}

/** 초대 링크로 유입 시 referrer 코드 저장 */
export function getReferralSource(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFERRAL_SOURCE_KEY);
}

/** referrer 코드 저장 */
export function setReferralSource(code: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(REFERRAL_SOURCE_KEY, code.trim().toUpperCase());
}

/** URL 파라미터에서 ref 코드 추출 및 저장 */
export function processIncomingReferral(): string | null {
  if (typeof window === 'undefined') return null;

  const params = new URLSearchParams(window.location.search);
  const refCode = params.get('ref');

  if (refCode && validateReferralCode(refCode)) {
    // 자기 자신의 코드가 아닐 때만 저장
    const myCode = getMyReferralCode();
    const normalized = refCode.trim().toUpperCase();
    if (myCode !== normalized) {
      setReferralSource(normalized);
      return normalized;
    }
  }

  return null;
}

// ─── Status Management ─────────────────────────────────────────────────

/** 초대 현황 가져오기 */
export function getReferralStatus(): ReferralStatus {
  if (typeof window === 'undefined') {
    return { invitedCount: 0, pendingCount: 0, completedCount: 0, invitees: [] };
  }

  const json = localStorage.getItem(REFERRAL_STATUS_KEY);
  if (!json) {
    return { invitedCount: 0, pendingCount: 0, completedCount: 0, invitees: [] };
  }

  try {
    return JSON.parse(json);
  } catch {
    return { invitedCount: 0, pendingCount: 0, completedCount: 0, invitees: [] };
  }
}

/** 초대 현황 저장 */
export function setReferralStatus(status: ReferralStatus): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(REFERRAL_STATUS_KEY, JSON.stringify(status));
}

/** 튜토리얼 완료 후 서버 검증 대기 중인 리퍼럴 보상 목록 */
export function getPendingReferralRewards(): ReferralPendingReward[] {
  if (typeof window === 'undefined') return [];

  const json = localStorage.getItem(REFERRAL_PENDING_REWARDS_KEY);
  if (!json) return [];

  try {
    const parsed = JSON.parse(json) as ReferralPendingReward[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function setPendingReferralRewards(rewards: ReferralPendingReward[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(REFERRAL_PENDING_REWARDS_KEY, JSON.stringify(rewards));
}

/** 친구 초대 기록 추가 (클라이언트 mock — 실제 검증은 서버에서) */
export function addReferralInvitee(name: string): void {
  const status = getReferralStatus();
  status.invitees.push({
    name,
    status: 'pending',
    timestamp: Date.now(),
  });
  status.invitedCount = status.invitees.length;
  status.pendingCount = status.invitees.filter((i) => i.status === 'pending').length;
  status.completedCount = status.invitees.filter((i) => i.status === 'completed').length;
  setReferralStatus(status);
}

/** 서버 검증 완료 후 초대 상태를 completed로 변경 */
export function markReferralCompleted(name: string): void {
  const status = getReferralStatus();
  const invitee = status.invitees.find((i) => i.name === name && i.status === 'pending');
  if (invitee) {
    invitee.status = 'completed';
    status.pendingCount = status.invitees.filter((i) => i.status === 'pending').length;
    status.completedCount = status.invitees.filter((i) => i.status === 'completed').length;
    setReferralStatus(status);
  }
}

/** 튜토리얼 완료 후 리퍼럴 pending reward 표시 */
export function createPendingReferralReward(): void {
  if (typeof window === 'undefined') return;
  const source = getReferralSource();
  if (!source) return;

  const rewards = getPendingReferralRewards();
  const alreadyPending = rewards.some(
    (reward) => reward.referralCode === source && reward.rewardType === 'tutorial_completion',
  );

  if (alreadyPending) return;

  rewards.push({
    referralCode: source,
    status: 'pending',
    createdAt: Date.now(),
    rewardType: 'tutorial_completion',
  });
  setPendingReferralRewards(rewards);
}
