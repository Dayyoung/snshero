/**
 * SNSHero Revolution - Service Worker (Media Cache Only)
 * 이미지 및 사운드 에셋만 영구 캐싱하고,
 * HTML, JS 번들, CSS, JSON, API 등 모든 코드/데이터는 실시간 네트워크에서 즉시 받아옵니다.
 */

const MEDIA_CACHE_NAME = 'snshero-media-v1';

// 캐싱 대상 미디어 파일 확장자 정규식
const MEDIA_EXT_REGEX = /\.(png|jpg|jpeg|webp|gif|svg|ico|avif|mp3|wav|ogg)(\?.*)?$/i;

self.addEventListener('install', (event) => {
  // 새 서비스 워커 즉시 활성화
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          // 구버전 캐시 또는 미디어 캐시가 아닌 구 캐시 정리
          if (key !== MEDIA_CACHE_NAME) {
            console.log('[SW] Deleting stale non-media cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;

  // GET 요청만 처리
  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);

  // 1. 이미지 및 사운드 파일: Cache-First 전략 (빠른 미디어 로딩 & 트래픽 절약)
  if (MEDIA_EXT_REGEX.test(url.pathname) || MEDIA_EXT_REGEX.test(url.href)) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(MEDIA_CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        }).catch(() => {
          return cachedResponse || new Response(null, { status: 404 });
        });
      })
    );
    return;
  }

  // 2. 그 외 모든 리소스 (HTML, JS, CSS, JSON, API 등): Network-Only (실시간 수신)
  // 캐시하지 않고 항상 네트워크에서 직접 실시간 최신 버전을 수신합니다.
  event.respondWith(
    fetch(request, {
      cache: 'no-store'
    }).catch(() => {
      return new Response('Network offline', { status: 503, statusText: 'Service Unavailable' });
    })
  );
});
