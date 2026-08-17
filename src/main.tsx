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
    const isChunkError = 
      errorMsg.includes('Failed to fetch dynamically imported module') ||
      errorMsg.includes('Expected a JavaScript-or-Wasm module script') ||
      errorMsg.includes('is not a valid JavaScript MIME type') ||
      errorMsg.includes('MIME type') ||
      errorMsg.includes('ChunkLoadError') ||
      errorMsg.includes('Loading chunk');
      
    if (isChunkError) {
      console.warn("[ChunkError] Detected dynamic import failure. Forcing page reload for latest bundle...");
      const lastReload = sessionStorage.getItem('last_chunk_reload');
      const now = Date.now();
      
      if (!lastReload || now - parseInt(lastReload, 10) > 4000) {
        sessionStorage.setItem('last_chunk_reload', now.toString());
        window.location.reload();
      }
    }
  };

  window.addEventListener('error', (event) => {
    handleChunkError(event.error || { message: event.message });
  }, true);

  window.addEventListener('unhandledrejection', (event) => {
    handleChunkError(event.reason);
  });

  // 강제 오프라인 캐시 및 기존 서비스 워커 제거 (유저 요청: 변경 사항 즉시 반영)
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister().then((unregistered) => {
          if (unregistered) {
            console.log('[ServiceWorker] Successfully unregistered stale worker:', registration);
          }
        });
      }
    }).catch((err) => {
      console.warn('[ServiceWorker] Unregister failed:', err);
    });
  }

  if ('caches' in window) {
    caches.keys().then((names) => {
      for (const name of names) {
        caches.delete(name).then(() => {
          console.log('[CacheStorage] Cleared stale cache:', name);
        });
      }
    }).catch((err) => {
      console.warn('[CacheStorage] Clear failed:', err);
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
  } else if (path === '/api/addtask' || path === '/addtask') {
    isApiRoute = true;
    const searchParams = new URLSearchParams(window.location.search);
    const type = searchParams.get('type') || searchParams.get('dept') || '개발';
    const value = searchParams.get('value') || searchParams.get('task') || searchParams.get('title') || '';
    const action = searchParams.get('action') || searchParams.get('status') || '작업대기';
    const detail = searchParams.get('detail') || searchParams.get('desc') || '';

    document.title = "SNSHero API - addTask";

    if (!value) {
      const errResponse = {
        success: false,
        error: "Missing required query parameter: 'value' (task name)",
        usage: "/api/addTask?type=개발&value=작업내용&action=작업대기&detail=상세내용",
        parameters: {
          type: "부서 (예: 개발, 기획, 디자인 - 기본값: 개발)",
          value: "작업 제목 (필수)",
          action: "진행 상태 (예: 작업대기, 진행중, 작업완료 - 기본값: 작업대기)",
          detail: "작업 상세 내용 (선택)"
        }
      };
      document.body.innerHTML = `<pre style="font-family: monospace; font-size: 14px; line-height: 1.5; white-space: pre-wrap; word-break: break-all; padding: 24px; margin: 0; background: #fdfcfc; color: #b91c1c;">${JSON.stringify(errResponse, null, 2)}</pre>`;
    } else {
      document.body.innerHTML = `<pre id="api-output" style="font-family: monospace; font-size: 14px; line-height: 1.5; white-space: pre-wrap; word-break: break-all; padding: 24px; margin: 0; background: #fdfcfc; color: #201d1d;">${JSON.stringify({ status: "submitting", message: "Google Form 에 작업 제출 중...", data: { type, value, action, detail } }, null, 2)}</pre>`;

      // Google Form submission via fetch (no-cors fallback for cross-origin SPA)
      const formEndpoint = "https://docs.google.com/forms/d/e/1FAIpQLScrvcAqDF7vHHQndycr90ii-ujTi3Plw23eNrSyiJpOLrHbjg/formResponse";
      const formData = new URLSearchParams();
      formData.append('entry.1712635414', type);
      formData.append('entry.1651694192', value);
      formData.append('entry.1282964596', action);
      if (detail) {
        formData.append('entry.1982035501', detail);
      }

      console.log(`[GoogleForm API] Initiating submission for task: "${value}" [${type}|${action}]`);
      console.log(`[GoogleForm API] Payload:`, {
        'entry.1712635414 (dept)': type,
        'entry.1651694192 (task)': value,
        'entry.1282964596 (status)': action,
        'entry.1982035501 (details)': detail || ''
      });

      const startTime = Date.now();
      fetch(formEndpoint, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData.toString()
      })
      .then((res) => {
        const duration = Date.now() - startTime;
        console.log(`[GoogleForm API] Fetch resolved successfully (${duration}ms). Response type: ${res.type}`);
        const successResponse = {
          success: true,
          message: "Google Form 에 작업이 성공적으로 제출되었습니다.",
          submitted: {
            type,
            value,
            action,
            detail: detail || null
          },
          durationMs: duration,
          timestamp: Date.now(),
          timeString: new Date().toISOString()
        };
        const pre = document.getElementById('api-output');
        if (pre) {
          pre.textContent = JSON.stringify(successResponse, null, 2);
          pre.style.color = '#15803d';
        }
      })
      .catch((err) => {
        const duration = Date.now() - startTime;
        const errMsg = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
        console.error(`[GoogleForm API] Submission failed after ${duration}ms:`, err);
        const failResponse = {
          success: false,
          error: errMsg,
          errorStack: err instanceof Error ? err.stack : undefined,
          durationMs: duration,
          submitted: { type, value, action, detail },
          timestamp: Date.now(),
          timeString: new Date().toISOString()
        };
        const pre = document.getElementById('api-output');
        if (pre) {
          pre.textContent = JSON.stringify(failResponse, null, 2);
          pre.style.color = '#b91c1c';
        }
      });
    }
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
}
