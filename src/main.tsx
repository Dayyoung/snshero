import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';
import { initWebMcpService } from './lib/webMcpService.ts';
import './index.css';

// Initialize WebMCP (Web Model Context Protocol) for AI Agent interaction
if (typeof window !== 'undefined') {
  try {
    initWebMcpService();
  } catch (e) {
    console.warn('[WebMCP] Initialization warning:', e);
  }
}

// Chunk Load Error 전역 감지 및 자동 새로고침 & 최신 소스 반영 로직
if (typeof window !== 'undefined') {
  // Build Version Check & Automatic Purge
  try {
    const currentBuild = typeof __BUILD_TIME__ !== 'undefined' ? String(__BUILD_TIME__) : String(Date.now());
    const storedBuild = localStorage.getItem('hero_build_version');
    if (storedBuild && storedBuild !== currentBuild) {
      console.log(`[BuildUpdate] New version detected (${storedBuild} -> ${currentBuild}). Purging stale browser caches.`);
      if ('caches' in window) {
        caches.keys().then((names) => {
          names.forEach(name => caches.delete(name));
        });
      }
    }
    localStorage.setItem('hero_build_version', currentBuild);
  } catch (e) {
    console.warn('[BuildUpdate] Failed to sync build version:', e);
  }

  const handleChunkError = (error: any) => {
    const errorMsg = error?.message || error?.stack || String(error || '');

    // 외부 서드파티 API(Google Ads 403, MakerSuite 429, GTM 등) 에러는 앱 구동과 무관하므로 절대 페이지를 리로드하지 않음
    if (
      errorMsg.includes('alkalimakersuite') ||
      errorMsg.includes('googleads') ||
      errorMsg.includes('doubleclick') ||
      errorMsg.includes('googletagmanager') ||
      errorMsg.includes('GenerateCodeAssistantSuggestionChips') ||
      errorMsg.includes('429') ||
      errorMsg.includes('403')
    ) {
      console.warn('[Network] Third-party non-blocking error safely suppressed:', errorMsg.slice(0, 100));
      return;
    }

    const isChunkError = 
      errorMsg.includes('Failed to fetch dynamically imported module') ||
      errorMsg.includes('Expected a JavaScript-or-Wasm module script') ||
      errorMsg.includes('is not a valid JavaScript MIME type') ||
      errorMsg.includes('MIME type') ||
      errorMsg.includes('ChunkLoadError') ||
      errorMsg.includes('Loading chunk');
      
    if (isChunkError) {
      console.warn("[ChunkError] Detected dynamic import failure. Forcing safe reload for latest bundle...");
      const reloadKey = 'last_chunk_reload_count';
      const lastCount = parseInt(sessionStorage.getItem(reloadKey) || '0', 10);
      const lastTime = parseInt(sessionStorage.getItem('last_chunk_reload_time') || '0', 10);
      const now = Date.now();
      
      // 최대 2회까지만 자동 새로고침 시도 (무한 루프 원천 방지)
      if (lastCount < 2 && now - lastTime > 3000) {
        sessionStorage.setItem(reloadKey, String(lastCount + 1));
        sessionStorage.setItem('last_chunk_reload_time', now.toString());
        window.location.reload();
      } else {
        console.error('[ChunkError] Max reload attempts reached. Halting auto-reload to prevent loop.');
      }
    }
  };

  window.addEventListener('error', (event) => {
    handleChunkError(event.error || { message: event.message });
  }, true);

  window.addEventListener('unhandledrejection', (event) => {
    handleChunkError(event.reason);
  });

  // 이미지/사운드 전용 Service Worker 등록 (HTML/JS/CSS/API는 실시간 네트워크 수신)
  if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js', { scope: '/' })
        .then((registration) => {
          console.log('[ServiceWorker] Media cache worker registered successfully:', registration.scope);
        })
        .catch((err) => {
          console.warn('[ServiceWorker] Media worker registration skipped:', err);
        });
    });
  }
}

// API Path Interceptor (SPA Static Hosting Fallback)
// 브라우저에서 /api/version, /version.json, /api/health 등으로 직접 접속 시
// /home으로 리다이렉트되지 않고 JSON 응답을 즉시 화면에 렌더링합니다.
let isApiRoute = false;
if (typeof window !== 'undefined') {
  const path = window.location.pathname.replace(/\/$/, '').toLowerCase();
  if (path === '/api/version' || path === '/version' || path === '/version.json') {
    isApiRoute = true;
    const versionData = {
      version: "2.1.0",
      buildTime: "2026-08-15T00:00:00.000Z",
      buildTimestamp: 1786800000000,
      service: "snshero-revolution",
      minRequiredVersion: "2.0.0"
    };
    document.title = "SNSHero API - Version (v2.1.0)";
    document.body.innerHTML = `<pre style="font-family: monospace; font-size: 14px; line-height: 1.5; white-space: pre-wrap; word-break: break-all; padding: 24px; margin: 0; background: #fdfcfc; color: #201d1d;">${JSON.stringify(versionData, null, 2)}</pre>`;
  } else if (path === '/api/health' || path === '/health') {
    isApiRoute = true;
    const healthData = {
      status: "ok",
      timestamp: Date.now()
    };
    document.title = "SNSHero API - Health";
    document.body.innerHTML = `<pre style="font-family: monospace; font-size: 14px; line-height: 1.5; white-space: pre-wrap; word-break: break-all; padding: 24px; margin: 0; background: #fdfcfc; color: #201d1d;">${JSON.stringify(healthData, null, 2)}</pre>`;
  } else if (path === '/pacpik' || path === '/pacpik.html') {
    isApiRoute = true;
    document.title = "Pacpik Games Verification | SNSHero";
    let meta = document.querySelector('meta[name="pacpik-games-verification"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'pacpik-games-verification');
      meta.setAttribute('content', 'f197d6f47d819f97660046da45174f0d5a9ff1abf90c5e38');
      document.head.appendChild(meta);
    }
    document.body.innerHTML = `<div style="font-family: 'JetBrains Mono', Menlo, monospace; background: #fdfcfc; color: #201d1d; min-height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 24px; box-sizing: border-box;"><div style="width: 100%; max-width: 640px; border: 1px solid rgba(15,0,0,0.12); background: #ffffff; padding: 32px 24px;"><div style="display: inline-block; font-size: 11px; padding: 4px 8px; border: 1px solid rgba(5,150,105,0.3); color: #059669; background: rgba(5,150,105,0.05); margin-bottom: 16px;">[STATUS: ACTIVE VERIFICATION]</div><h1 style="font-size: 18px; font-weight: 700; margin-bottom: 8px;">Pacpik Games Domain Verification</h1><p style="font-size: 13px; color: rgba(32,29,29,0.6); margin-bottom: 24px;">Domain ownership verification string for SNSHero (https://snshero.com).</p><div id="rawToken" style="padding: 12px 16px; background: #faf9f7; border: 1px dashed rgba(15,0,0,0.12); font-size: 12px; margin-bottom: 24px; word-break: break-all; color: #333;">pacpik-games-verification=f197d6f47d819f97660046da45174f0d5a9ff1abf90c5e38</div><div style="background: #f5f4f2; border: 1px solid rgba(15,0,0,0.12); padding: 16px; margin-bottom: 20px; word-break: break-all;"><span style="font-size: 11px; text-transform: uppercase; color: rgba(32,29,29,0.6); display: block; margin-bottom: 6px;">Verification Token</span><div style="font-size: 13px; font-weight: 600;">f197d6f47d819f97660046da45174f0d5a9ff1abf90c5e38</div></div><div style="display: flex; gap: 12px; align-items: center;"><button onclick="navigator.clipboard.writeText('pacpik-games-verification=f197d6f47d819f97660046da45174f0d5a9ff1abf90c5e38'); this.innerText='[✓] Copied!';" style="font-family: inherit; background: #201d1d; color: #ffffff; border: 1px solid #201d1d; padding: 10px 16px; font-size: 13px; font-weight: 600; cursor: pointer; border-radius: 4px;">[+] Copy Verification String</button><a href="/" style="font-family: inherit; color: #201d1d; text-decoration: none; border: 1px solid rgba(15,0,0,0.12); padding: 10px 16px; font-size: 13px; border-radius: 4px;">&larr; Return to SNSHero</a></div><div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid rgba(15,0,0,0.12); font-size: 11px; color: rgba(32,29,29,0.6); display: flex; justify-content: space-between;"><span>Service: SNSHero Revolution</span><span>Host: snshero.com</span></div></div></div>`;
  }
}

if (!isApiRoute) {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>,
  );

  // 정상 마운트 완료 시 HTML 레벨 자가치유 워치독 해제
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.removeItem('hero_boot_retries');
      sessionStorage.removeItem('last_chunk_reload_count');
    } catch (e) {}
    const clearWatchdog = (window as unknown as { __SNSHERO_CLEAR_WATCHDOG__?: () => void }).__SNSHERO_CLEAR_WATCHDOG__;
    if (typeof clearWatchdog === 'function') {
      clearWatchdog();
    }
  }
}
