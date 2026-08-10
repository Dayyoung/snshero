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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
