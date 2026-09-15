/**
 * useAudioLatencyRecycle.ts
 * Web Audio Latency 누적 감지 및 리사이클 + 최대 3채널 동시 발음 풀링 매니저
 * (백로그 ID 424: outputLatency > 120ms 자동 리사이클, ID 459: 카드 연쇄 플립 최대 3채널 오디오 풀)
 */

import { useEffect, useRef, useCallback } from 'react';

const MAX_POLYPHONY_CHANNELS = 3;
const MAX_ALLOWED_LATENCY_SEC = 0.12; // 120ms

class PooledAudioManager {
  private static instance: PooledAudioManager;
  private audioCtx: AudioContext | null = null;
  private audioPool: HTMLAudioElement[] = [];
  private poolIndex = 0;
  private isRecycling = false;

  private constructor() {
    this.initContext();
    this.initAudioPool();
  }

  public static getInstance(): PooledAudioManager {
    if (!PooledAudioManager.instance) {
      PooledAudioManager.instance = new PooledAudioManager();
    }
    return PooledAudioManager.instance;
  }

  private initContext() {
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    } catch {
      // AudioContext unavailable
    }
  }

  private initAudioPool() {
    if (typeof window === 'undefined') return;
    this.audioPool = [];
    for (let i = 0; i < MAX_POLYPHONY_CHANNELS; i++) {
      const audio = new Audio();
      audio.preload = 'auto';
      this.audioPool.push(audio);
    }
  }

  public checkLatencyAndRecycle() {
    if (!this.audioCtx || this.isRecycling) return;

    // ID 424: outputLatency 검사
    const latency = (this.audioCtx as unknown as { outputLatency?: number }).outputLatency;
    if (typeof latency === 'number' && latency > MAX_ALLOWED_LATENCY_SEC) {
      this.recycleAudioContext();
    }
  }

  public recycleAudioContext() {
    if (this.isRecycling) return;
    this.isRecycling = true;
    try {
      if (this.audioCtx && this.audioCtx.state !== 'closed') {
        this.audioCtx.close().catch(() => {});
      }
    } catch {
      // ignore
    }

    setTimeout(() => {
      this.initContext();
      this.isRecycling = false;
    }, 100);
  }

  /**
   * ID 459: 최대 3채널 라운드로빈 오디오 풀 재생
   */
  public playPooledSfx(url: string, volume: number = 0.6) {
    this.checkLatencyAndRecycle();

    if (this.audioPool.length === 0) {
      this.initAudioPool();
    }

    if (this.audioPool.length === 0) return;

    // 현재 채널 선택
    const audio = this.audioPool[this.poolIndex];
    this.poolIndex = (this.poolIndex + 1) % MAX_POLYPHONY_CHANNELS;

    try {
      audio.pause();
      audio.currentTime = 0;
      audio.src = url;
      audio.volume = Math.max(0, Math.min(1, volume));
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Autoplay policy fallback
        });
      }
    } catch {
      // Safe fallback
    }
  }
}

export const useAudioLatencyRecycle = () => {
  const managerRef = useRef<PooledAudioManager | null>(null);

  useEffect(() => {
    managerRef.current = PooledAudioManager.getInstance();

    // 15초마다 latency 누적 체크
    const latencyInterval = setInterval(() => {
      managerRef.current?.checkLatencyAndRecycle();
    }, 15000);

    // 전역 이벤트 리스너 연동
    const handlePooledSfxEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ url: string; volume?: number }>;
      if (customEvent.detail && customEvent.detail.url) {
        managerRef.current?.playPooledSfx(customEvent.detail.url, customEvent.detail.volume);
      }
    };

    window.addEventListener('snshero_play_sfx_pooled', handlePooledSfxEvent);

    return () => {
      clearInterval(latencyInterval);
      window.removeEventListener('snshero_play_sfx_pooled', handlePooledSfxEvent);
    };
  }, []);

  const playPooledSfx = useCallback((url: string, volume?: number) => {
    PooledAudioManager.getInstance().playPooledSfx(url, volume);
  }, []);

  return { playPooledSfx };
};

export const playGlobalPooledSfx = (url: string, volume: number = 0.6) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('snshero_play_sfx_pooled', { detail: { url, volume } }));
  }
};
