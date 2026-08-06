import { useCallback, useEffect, useMemo, useState } from 'react';
import type { RefundRequest, RefundRequestReason } from '../types';

const REFUND_REQUESTS_STORAGE_KEY = 'hero_refund_requests';
const REFUND_REQUEST_TTL = 100;
const DEFAULT_EXPECTED_BUSINESS_DAYS = '2-3';

function isRefundReason(value: unknown): value is RefundRequestReason {
  return value === 'accidental_purchase'
    || value === 'wrong_item'
    || value === 'delivery_issue'
    || value === 'other';
}

function parseRefundRequest(value: unknown): RefundRequest | null {
  if (!value || typeof value !== 'object') return null;

  const candidate = value as Partial<RefundRequest>;
  if (typeof candidate.orderId !== 'string' || !candidate.orderId.trim()) return null;
  if (typeof candidate.amountUsd !== 'number' || !Number.isFinite(candidate.amountUsd)) return null;
  if (!isRefundReason(candidate.reason)) return null;
  if (typeof candidate.status !== 'string') return null;
  if (typeof candidate.createdAt !== 'number' || !Number.isFinite(candidate.createdAt)) return null;
  if (typeof candidate.expectedBusinessDays !== 'string' || !candidate.expectedBusinessDays.trim()) return null;
  if (candidate.details != null && typeof candidate.details !== 'string') return null;

  return {
    orderId: candidate.orderId,
    amountUsd: candidate.amountUsd,
    reason: candidate.reason,
    status: candidate.status,
    createdAt: candidate.createdAt,
    expectedBusinessDays: candidate.expectedBusinessDays,
    details: candidate.details?.trim() ? candidate.details.trim() : undefined,
  };
}

function loadRefundRequests(): RefundRequest[] {
  if (typeof window === 'undefined') return [];

  const raw = window.localStorage.getItem(REFUND_REQUESTS_STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map(parseRefundRequest)
      .filter((request): request is RefundRequest => request !== null)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, REFUND_REQUEST_TTL);
  } catch {
    return [];
  }
}

function saveRefundRequests(requests: RefundRequest[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(REFUND_REQUESTS_STORAGE_KEY, JSON.stringify(requests.slice(0, REFUND_REQUEST_TTL)));
}

export interface CreateRefundRequestInput {
  orderId: string;
  amountUsd: number;
  reason: RefundRequestReason;
  details?: string;
  expectedBusinessDays?: string;
}

export interface UseRefundRequestsReturn {
  requests: RefundRequest[];
  requestMap: Record<string, RefundRequest>;
  getRequestByOrderId: (orderId: string) => RefundRequest | undefined;
  submitRequest: (input: CreateRefundRequestInput) => RefundRequest | null;
}

export function useRefundRequests(): UseRefundRequestsReturn {
  const [requests, setRequests] = useState<RefundRequest[]>(() => loadRefundRequests());

  useEffect(() => {
    saveRefundRequests(requests);
  }, [requests]);

  const requestMap = useMemo<Record<string, RefundRequest>>(
    () => Object.fromEntries(requests.map((request) => [request.orderId, request])),
    [requests],
  );

  const getRequestByOrderId = useCallback(
    (orderId: string): RefundRequest | undefined => requestMap[orderId],
    [requestMap],
  );

  const submitRequest = useCallback((input: CreateRefundRequestInput): RefundRequest | null => {
    const normalizedOrderId = input.orderId.trim();
    if (!normalizedOrderId) return null;

    let createdRequest: RefundRequest | null = null;

    setRequests((prev) => {
      if (prev.some((request) => request.orderId === normalizedOrderId)) {
        createdRequest = prev.find((request) => request.orderId === normalizedOrderId) ?? null;
        return prev;
      }

      createdRequest = {
        orderId: normalizedOrderId,
        amountUsd: input.amountUsd,
        reason: input.reason,
        status: 'requested',
        createdAt: Date.now(),
        expectedBusinessDays: input.expectedBusinessDays ?? DEFAULT_EXPECTED_BUSINESS_DAYS,
        details: input.details?.trim() ? input.details.trim() : undefined,
      };

      return [createdRequest, ...prev].slice(0, REFUND_REQUEST_TTL);
    });

    return createdRequest;
  }, []);

  return {
    requests,
    requestMap,
    getRequestByOrderId,
    submitRequest,
  };
}
