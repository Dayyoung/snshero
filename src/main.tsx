/// <reference types="vite-plugin-pwa/client" />
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Chunk Load Error 전역 감지 및 자동 새로고침 로직
if (typeof window !== 'undefined') {
  const handleChunkError = (error: any) => {
    const errorMsg = error?.message || error?.stack || '';
    const isChunkError = 
      errorMsg.includes('Failed to fetch dynamically imported module') ||
      errorMsg.includes('Expected a JavaScript-or-Wasm module script') ||
      errorMsg.includes('ChunkLoadError');
      
    if (isChunkError) {
      console.warn("[ChunkError] Detected dynamic import failure. Attempting to reload the page to load the latest bundle...");
      // 무한 루프 방지를 위해 최근 리로드 시간 기록
      const lastReload = sessionStorage.getItem('last_chunk_reload');
      const now = Date.now();
      
      // 10초 이내에 다시 리로드되는 것이 아니라면 새로고침 수행
      if (!lastReload || now - parseInt(lastReload, 10) > 10000) {
        sessionStorage.setItem('last_chunk_reload', now.toString());
        window.location.reload();
      } else {
        console.error("[ChunkError] Reload was already attempted recently. Avoiding infinite loop.");
      }
    }
  };

  // 일반 에러 감지 (MIME type error 등)
  window.addEventListener('error', (event) => {
    handleChunkError(event.error || { message: event.message });
  }, true);

  // Promise rejection 감지 (Failed to fetch dynamically imported module)
  window.addEventListener('unhandledrejection', (event) => {
    handleChunkError(event.reason);
  });
}

// Register Service Worker and setup auto-reload on update
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log("[PWA] New update available. Updating now...");
    updateSW(true);
  },
  onOfflineReady() {
    console.log("[PWA] App is ready for offline usage.");
  }
});

// Automatically reload all tabs/windows when service worker updates and takes control
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return;
    refreshing = true;
    console.log("[PWA] New Service Worker took control. Reloading page...");
    window.location.reload();
  });

  // Periodically check for service worker updates (every 5 minutes)
  // Also check immediately when the network comes online or the window is focused
  navigator.serviceWorker.ready.then((registration) => {
    console.log("[PWA] Service Worker ready. Setting up update checks.");

    const checkUpdate = () => {
      if (navigator.onLine) {
        console.log("[PWA] Checking for Service Worker updates...");
        registration.update().catch((err) => {
          console.warn("[PWA] Service Worker update check failed:", err);
        });
      }
    };

    // Initial check on load (with a small delay to not block initial render)
    setTimeout(checkUpdate, 5000);

    // Check every 5 minutes
    setInterval(checkUpdate, 1000 * 60 * 5);

    // Check on online/focus events
    window.addEventListener('online', checkUpdate);
    window.addEventListener('focus', checkUpdate);
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
